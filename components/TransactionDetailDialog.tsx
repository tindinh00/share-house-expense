'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Transaction {
  id: string;
  date: string;
  amount: number;
  note: string;
  category_id: string;
  paid_by: string;
  created_by: string;
  created_at: string;
  categories: {
    name: string;
    icon: string;
    color: string;
  };
  profiles: {
    username: string;
  };
}

interface TransactionDetailDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
  onDeleted?: () => void;
}

export function TransactionDetailDialog({
  transaction,
  open,
  onOpenChange,
  currentUserId,
  onDeleted,
}: TransactionDetailDialogProps) {
  const router = useRouter();
  const supabase = createClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!transaction) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id);

      if (error) throw error;

      toast.success('Đã xóa giao dịch!');
      setShowDeleteDialog(false);
      onOpenChange(false);
      if (onDeleted) onDeleted();
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast.error('❌ Lỗi: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const canEdit = currentUserId && transaction.created_by === currentUserId;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[90vw] sm:max-w-md p-0 gap-0 overflow-y-auto max-h-[85vh] border-none text-left">
          <DialogTitle className="sr-only">Chi tiết giao dịch</DialogTitle>
          
          <div className="relative">
            {/* Header Background */}
            <div 
              className="h-28 w-full transition-colors"
              style={{ backgroundColor: transaction.categories.color + '15' }}
            />
            
            {/* Close Button is handled by DialogContent */}

            {/* Centered Icon */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center bg-white shadow-sm border-4 border-white"
              >
                <span className="text-4xl opacity-90">{transaction.categories.icon}</span>
              </div>
            </div>
          </div>

          <div className="pt-12 px-6 pb-6 space-y-6">
            {/* Main Info */}
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {transaction.categories.name}
              </h2>
              <p className="text-sm text-gray-500 font-medium pb-2">Danh mục</p>
              
              <div className="flex items-center justify-center gap-1">
                <span className="text-3xl font-bold text-gray-900 tracking-tight">
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
            </div>

            {/* Note Section */}
            {transaction.note && (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100/50">
                <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block mb-1">
                  Ghi chú
                </span>
                <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {transaction.note}
                </p>
              </div>
            )}

            {/* Meta Details */}
            <div className="bg-gray-50/50 rounded-xl border border-gray-100 divide-y divide-gray-100">
              <div className="grid grid-cols-[100px_1fr] gap-4 p-3 text-sm">
                <span className="text-gray-500">Ngày</span>
                <span className="font-medium text-gray-900 text-right">{formatDate(transaction.date)}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-4 p-3 text-sm">
                <span className="text-gray-500">Người trả</span>
                <span className="font-medium text-gray-900 text-right">{transaction.profiles.username}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-4 p-3 text-sm">
                <span className="text-gray-500">Tạo lúc</span>
                <span className="font-medium text-gray-900 text-right">{formatDateTime(transaction.created_at)}</span>
              </div>
            </div>

            {/* Actions */}
            {canEdit && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link href={`/transactions/edit/${transaction.id}`} className="w-full">
                  <Button variant="outline" className="w-full h-11 bg-white hover:bg-gray-50 border-gray-200">
                    <span className="mr-2">✏️</span>
                    Chỉnh sửa
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full h-11 bg-white text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <span className="mr-2">🗑️</span>
                  Xóa
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa giao dịch</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa giao dịch này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
