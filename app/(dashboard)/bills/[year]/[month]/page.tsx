'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRoom } from '@/contexts/RoomContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TransactionDetailDialog } from '@/components/TransactionDetailDialog';

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
    email: string;
  };
}

export default function MonthDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { currentRoom } = useRoom();
  
  const year = parseInt(params.year as string);
  const month = parseInt(params.month as string);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    if (currentRoom) {
      loadMonthTransactions();
    }
  }, [currentRoom, year, month]);

  const loadMonthTransactions = async () => {
    if (!currentRoom) return;
    
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      // Tính ngày đầu và cuối tháng
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          date,
          amount,
          note,
          category_id,
          paid_by,
          created_by,
          created_at,
          categories:category_id (name, icon, color),
          profiles:paid_by (username, email)
        `)
        .eq('room_id', currentRoom.id)
        .gte('date', format(firstDay, 'yyyy-MM-dd'))
        .lte('date', format(lastDay, 'yyyy-MM-dd'))
        .eq('is_deleted', false)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const txs = (data || []) as any[];
      setTransactions(txs);
      
      const total = txs.reduce((sum, t) => sum + Number(t.amount), 0);
      setTotalAmount(total);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = () => {
    const date = new Date(year, month - 1, 1);
    return format(date, 'MMMM yyyy', { locale: vi });
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi });
  };

  if (!currentRoom) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Vui lòng chọn không gian</p>
      </div>
    );
  }

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
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div>
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-2 -ml-2"
        >
          ← Quay lại
        </Button>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
          Tháng {month}/{year}
        </h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          {getMonthName()} • {currentRoom.name}
        </p>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Tổng chi tiêu</p>
              <p className="text-2xl md:text-3xl font-bold text-green-600">
                {totalAmount.toLocaleString('vi-VN')} ₫
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Số giao dịch</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-600">
                {transactions.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết giao dịch</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không có giao dịch nào trong tháng này
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  onClick={() => {
                    setSelectedTransaction(transaction);
                    setShowDetailDialog(true);
                  }}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition cursor-pointer"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: transaction.categories.color + '20' }}
                  >
                    <span className="text-xl">{transaction.categories.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium text-gray-900">{transaction.categories.name}</p>
                      <p className="font-bold text-gray-900 whitespace-nowrap">
                        {Number(transaction.amount).toLocaleString('vi-VN')} ₫
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-1">
                      {transaction.note}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{formatDate(transaction.date)}</span>
                      <span>•</span>
                      <span>{transaction.profiles.username}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Detail Dialog */}
      <TransactionDetailDialog
        transaction={selectedTransaction}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        currentUserId={currentUserId}
        onDeleted={loadMonthTransactions}
      />
    </div>
  );
}
