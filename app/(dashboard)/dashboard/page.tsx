'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRoom } from '@/contexts/RoomContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginToast } from '@/components/LoginToast';

interface Transaction {
  id: string;
  date: string;
  amount: number;
  note: string;
  category_id: string;
  paid_by: string;
  categories: {
    name: string;
    icon: string;
    color: string;
  };
  profiles: {
    username: string;
  };
}

interface Stats {
  monthlyTotal: number;
  transactionCount: number;
  balance: number;
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const showLoginToast = searchParams.get('login') === 'success';
  const supabase = createClient();
  const { currentRoom } = useRoom();

  const [username, setUsername] = useState('bạn');
  const [stats, setStats] = useState<Stats>({
    monthlyTotal: 0,
    transactionCount: 0,
    balance: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [currentRoom]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      setUsername(profile?.username || 'bạn');

      if (!currentRoom) {
        setLoading(false);
        return;
      }

      // Get current month range
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Load transactions for current month
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, paid_by')
        .eq('room_id', currentRoom.id)
        .gte('date', firstDay.toISOString().split('T')[0])
        .lte('date', lastDay.toISOString().split('T')[0]);

      // Calculate stats
      const monthlyTotal = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const transactionCount = transactions?.length || 0;
      
      // Calculate balance (how much user paid vs should pay)
      const userPaid = transactions?.filter(t => t.paid_by === user.id)
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const shouldPay = monthlyTotal / (await getRoomMemberCount(currentRoom.id));
      const balance = userPaid - shouldPay;

      setStats({
        monthlyTotal,
        transactionCount,
        balance,
      });

      // Load recent transactions
      const { data: recent } = await supabase
        .from('transactions')
        .select(`
          id,
          date,
          amount,
          note,
          category_id,
          paid_by,
          categories (name, icon, color),
          profiles:paid_by (username)
        `)
        .eq('room_id', currentRoom.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentTransactions((recent as any) || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoomMemberCount = async (roomId: string): Promise<number> => {
    const { count } = await supabase
      .from('room_members')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId);
    return count || 1;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

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
    <>
      {showLoginToast && <LoginToast username={username} />}
      
      {/* Green Background Section with Curve - 1/3 screen */}
      <div className="absolute top-0 left-0 right-0 h-[33vh] bg-green-600 overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gray-50 rounded-t-[40px] -mb-4"></div>
      </div>
      
      <div className="relative space-y-4 pb-20 md:pb-6">
        {/* Welcome Text */}
        <div className="text-white mb-20">
          <h1 className="text-2xl font-bold">Chào {username}!</h1>
        </div>

        {!currentRoom ? (
          <Card>
            <CardContent className="py-12 text-center">
              <span className="text-6xl">🏠</span>
              <p className="text-muted-foreground mt-4 mb-6">
                Bạn chưa chọn không gian nào
              </p>
              <Link href="/rooms">
                <Button>
                  <span className="mr-2">🏠</span>
                  Chọn không gian
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Balance Card with Leaf Icon - Positioned at curve */}
            <div className="relative -mt-16">
              <Card className="shadow-lg">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🌿</span>
                      </div>
                      <p className="text-sm text-gray-600 font-medium">Tổng chi tiêu</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.monthlyTotal.toLocaleString('vi-VN')}₫
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Bắt đầu nhanh</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Link
                    href="/transactions/add"
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border-2 border-dashed rounded-lg hover:border-primary hover:bg-accent transition group"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition flex-shrink-0">
                      <span className="text-xl sm:text-2xl">➕</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base">Thêm giao dịch</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Ghi lại chi tiêu mới</p>
                    </div>
                  </Link>

                  <Link
                    href="/rooms/create"
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border-2 border-dashed rounded-lg hover:border-primary hover:bg-accent transition group"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition flex-shrink-0">
                      <span className="text-xl sm:text-2xl">🏠</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base">Tạo không gian</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Thêm room mới</p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Recent Transactions */}
        {currentRoom && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base sm:text-lg">Giao dịch gần đây</CardTitle>
                <Link href="/transactions" className="text-xs sm:text-sm text-primary hover:underline whitespace-nowrap">
                  Xem tất cả →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <span className="text-4xl sm:text-6xl">📝</span>
                  <p className="text-sm sm:text-base text-muted-foreground mt-4 mb-6">Chưa có giao dịch nào</p>
                  <Link href="/transactions/add">
                    <Button className="w-full sm:w-auto">
                      <span className="mr-2">➕</span>
                      Thêm giao dịch đầu tiên
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-start sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg hover:bg-accent transition"
                    >
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: transaction.categories.color + '20' }}
                      >
                        <span className="text-base sm:text-xl">{transaction.categories.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base text-gray-900 truncate">{transaction.note}</p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                          {transaction.categories.name} • {transaction.profiles.username}
                        </p>
                        <p className="text-xs text-gray-400 sm:hidden">{formatDate(transaction.date)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-sm sm:text-base text-gray-900 whitespace-nowrap">
                          {formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-gray-400 hidden sm:block">{formatDate(transaction.date)}</p>
                      </div>
                    </div>
                  ))}
                  <Link href="/transactions" className="block">
                    <Button variant="outline" className="w-full mt-2">
                      Xem tất cả giao dịch →
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}


      </div>
    </>
  );
}
