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

      toast.success('✅ Đã xóa giao dịch!');
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
        <DialogContent className="max-w-[90vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Chi tiết giao dịch</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Category Icon & Name */}
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: transaction.categories.color + '30' }}
              >
                <span className="text-3xl">{transaction.categories.icon}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">
                  {transaction.categories.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Danh mục</p>
              </div>
            </div>

            {/* Amount */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Số tiền</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(transaction.amount)}
              </p>
            </div>

            {/* Note */}
            {transaction.note && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Ghi chú</p>
                <p className="text-base text-gray-900 bg-gray-50 rounded-lg p-3 break-all whitespace-pre-wrap overflow-hidden">
                  {transaction.note}
                </p>
              </div>
            )}

            {/* Details */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ngày giao dịch</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(transaction.date)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Người trả</span>
                <span className="text-sm font-medium text-gray-900">
                  {transaction.profiles.username}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Thời gian tạo</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDateTime(transaction.created_at)}
                </span>
              </div>
            </div>

            {/* Actions */}
            {canEdit && (
              <div className="flex gap-3 pt-4 border-t">
                <Link href={`/transactions/edit/${transaction.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <span className="mr-2">✏️</span>
                    Chỉnh sửa
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
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
