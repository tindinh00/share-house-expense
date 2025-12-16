'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRoom } from '@/contexts/RoomContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function TransactionsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { currentRoom } = useRoom();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    if (currentRoom) {
      loadTransactions();
    }
  }, [currentRoom]);

  const loadTransactions = async () => {
    if (!currentRoom) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUserId(user.id);

      // Fetch transactions for current room
      const { data } = await supabase
        .from('transactions')
        .select(`
          *,
          categories (name, icon, color),
          profiles:paid_by (username)
        `)
        .eq('room_id', currentRoom.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    } else {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  };

  const handleDelete = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;

      toast.success('✅ Đã xóa giao dịch!');
      // Reload transactions
      loadTransactions();
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast.error('❌ Lỗi: ' + error.message);
    }
  };

  // Group transactions by date
  const groupedTransactions = transactions?.reduce((groups: any, transaction: any) => {
    const date = transaction.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            Giao dịch
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">
            {currentRoom ? (
              <>
                <span className="font-medium">{currentRoom.type === 'PRIVATE' ? '💼' : '🏠'} {currentRoom.name}</span>
              </>
            ) : (
              'Quản lý chi tiêu của bạn'
            )}
          </p>
        </div>
        <Link href="/transactions/add" className="w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto">
            <span className="mr-2">➕</span>
            Thêm mới
          </Button>
        </Link>
      </div>

      {/* Transactions List */}
      {transactions.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedTransactions || {}).map(([date, items]: [string, any]) => (
            <div key={date} className="space-y-3">
              {/* Date Header */}
              <div className="flex items-center justify-between px-2 sm:px-4">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700">
                  {formatDate(date)}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  {items.length} giao dịch
                </p>
              </div>

              {/* Transactions for this date */}
              <div className="space-y-2">
                {items.map((transaction: any) => (
                  <Card key={transaction.id} className="p-3 sm:p-4 hover:shadow-md transition">
                    <div className="flex items-start sm:items-center gap-3">
                      {/* Icon */}
                      <div 
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ 
                          backgroundColor: transaction.categories?.color 
                            ? `${transaction.categories.color}20` 
                            : '#f0fdf4' 
                        }}
                      >
                        <span className="text-xl sm:text-2xl">
                          {transaction.categories?.icon || '💰'}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base text-gray-900 truncate">
                              {transaction.note}
                            </p>
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded whitespace-nowrap">
                                {transaction.categories?.name || 'Khác'}
                              </span>
                              {transaction.profiles?.username && (
                                <span className="text-xs text-gray-500 truncate">
                                  • {transaction.profiles.username}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="font-bold text-sm sm:text-lg text-gray-900 whitespace-nowrap ml-2">
                            {formatCurrency(transaction.amount)}
                          </p>
                        </div>

                        {/* Action buttons - only show if user created this transaction */}
                        {transaction.created_by === currentUserId && (
                          <div className="flex gap-2 mt-3 sm:mt-2">
                            <Link href={`/transactions/edit/${transaction.id}`} className="flex-1 sm:flex-none">
                              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                <span className="mr-1">✏️</span>
                                <span className="sm:hidden">Sửa</span>
                              </Button>
                            </Link>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <span className="mr-1">🗑️</span>
                                  <span className="sm:hidden">Xóa</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Xác nhận xóa giao dịch</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bạn có chắc chắn muốn xóa giao dịch này? Hành động này không thể hoàn tác.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(transaction.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Xóa
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <span className="text-6xl">📝</span>
            <p className="text-gray-600 mt-4 mb-6">
              Chưa có giao dịch nào
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Bắt đầu ghi lại chi tiêu của bạn ngay hôm nay
            </p>
            <Link href="/transactions/add">
              <Button size="lg">
                <span className="mr-2">➕</span>
                Thêm giao dịch đầu tiên
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
