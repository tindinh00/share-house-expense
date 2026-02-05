'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRoom } from '@/contexts/RoomContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LoginToast } from '@/components/LoginToast';
import { TransactionDetailDialog } from '@/components/TransactionDetailDialog';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import { 
  Home, 
  Briefcase, 
  Plus, 
  FileText, 
  Leaf, 
  ChevronRight,
  ArrowRight
} from 'lucide-react';

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

interface Stats {
  monthlyTotal: number;
  transactionCount: number;
  balance: number;
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const showLoginToast = searchParams.get('login') === 'success';
  const supabase = createClient();
  const { currentRoom, loading: roomLoading } = useRoom();

  const [username, setUsername] = useState<string>('');
  const [memberCount, setMemberCount] = useState<number>(0);
  const [roomMembers, setRoomMembers] = useState<{name: string; id: string}[]>([]);
  const [stats, setStats] = useState<Stats>({
    monthlyTotal: 0,
    transactionCount: 0,
    balance: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFirstLoadComplete, setIsFirstLoadComplete] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const getRoomStyles = (roomId: string, roomType?: string) => {
    // Basic variety based on roomId
    const hash = roomId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = hash % 5;
    
    if (roomType === 'PRIVATE') {
      return {
        cardBg: 'bg-gradient-to-br from-emerald-200/95 via-white/40 to-green-200/95',
        iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
        iconText: 'text-white',
        accentText: 'text-emerald-700',
        shadow: 'shadow-emerald-300/50'
      };
    }

    const themes = [
      {
        cardBg: 'bg-gradient-to-br from-green-200/95 via-white/40 to-emerald-200/95',
        iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
        iconText: 'text-white',
        accentText: 'text-green-700',
        shadow: 'shadow-green-300/50'
      },
      {
        cardBg: 'bg-gradient-to-br from-emerald-200/95 via-white/40 to-teal-200/95',
        iconBg: 'bg-gradient-to-br from-emerald-600 to-teal-700',
        iconText: 'text-white',
        accentText: 'text-emerald-800',
        shadow: 'shadow-emerald-300/50'
      },
      {
        cardBg: 'bg-gradient-to-br from-teal-200/95 via-white/40 to-green-200/95',
        iconBg: 'bg-gradient-to-br from-teal-500 to-green-600',
        iconText: 'text-white',
        accentText: 'text-teal-700',
        shadow: 'shadow-teal-300/50'
      },
      {
        cardBg: 'bg-gradient-to-br from-green-200/95 via-white/40 to-emerald-200/95',
        iconBg: 'bg-gradient-to-br from-green-600 to-emerald-700',
        iconText: 'text-white',
        accentText: 'text-green-800',
        shadow: 'shadow-green-400/40'
      },
      {
        cardBg: 'bg-gradient-to-br from-emerald-200/95 via-white/40 to-green-200/95',
        iconBg: 'bg-gradient-to-br from-emerald-400 to-green-500',
        iconText: 'text-white',
        accentText: 'text-emerald-600',
        shadow: 'shadow-emerald-200/60'
      }
    ];

    return themes[colorIndex];
  };

  const getRoomMemberCount = useCallback(async (roomId: string): Promise<number> => {
    const { count } = await supabase
      .from('room_members')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId);
    return count || 1;
  }, [supabase]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }, []);

  const loadDashboardData = useCallback(async () => {
    // If RoomContext is still loading, wait
    if (roomLoading && !currentRoom) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;


      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      const displayUsername = profile?.username || user.email?.split('@')[0] || 'bạn';
      const formattedName = displayUsername.includes('@') 
        ? displayUsername.split('@')[0] 
        : displayUsername;
      
      const capitalizedName = formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
      setUsername(capitalizedName);

      if (!currentRoom) {
        setLoading(false);
        setIsFirstLoadComplete(true);
        return;
      }

      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, paid_by')
        .eq('room_id', currentRoom.id)
        .gte('date', firstDay.toISOString().split('T')[0])
        .lte('date', lastDay.toISOString().split('T')[0]);

      const monthlyTotal = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const transactionCount = transactions?.length || 0;
      
      const userPaid = transactions?.filter(t => t.paid_by === user.id)
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const memberCount = await getRoomMemberCount(currentRoom.id);
      const shouldPay = monthlyTotal / memberCount;
      const balance = userPaid - shouldPay;

      setStats({
        monthlyTotal,
        transactionCount,
        balance,
      });
      setMemberCount(memberCount);

      // Fetch room members for avatars - fetch both users and households
      const { data: members } = await supabase
        .from('room_members')
        .select(`
          user_id,
          household_id,
          profiles:user_id(username),
          households:household_id(name)
        `)
        .eq('room_id', currentRoom.id)
        .limit(6);
      
      const memberData = (members as unknown as { 
        user_id: string | null; 
        household_id: string | null; 
        profiles: { username: string } | null; 
        households: { name: string } | null; 
      }[])?.map(m => ({
        id: (m.user_id || m.household_id) as string,
        name: m.profiles?.username || m.households?.name || 'Thành viên'
      })) || [];
        
      setRoomMembers(memberData);

      const { data: recent } = await supabase
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
          categories (name, icon, color),
          profiles:paid_by (username)
        `)
        .eq('room_id', currentRoom.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentTransactions((recent as unknown as Transaction[]) || []);
      setLoading(false);
      setIsFirstLoadComplete(true);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  }, [supabase, currentRoom, roomLoading, getRoomMemberCount]);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadDashboardData();
    });
  }, [loadDashboardData]);

  // Determine if we should show the full data or skeletons
  const showSkeletons = loading && !isFirstLoadComplete;

  return (
    <>
      {showLoginToast && <LoginToast username={username} />}
      
      <div className="relative space-y-6 pb-24 md:pb-8 -mt-8 md:-mt-12 lg:-mt-16">
        {/* Premium Header Section */}
        <div className="pt-10 pb-6 px-1 animate-in fade-in slide-in-from-top-6 duration-1000">
          <div className="flex flex-col gap-2 mb-8 md:mb-12">
            <h2 className="text-3xl md:text-5xl font-black text-black drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)] tracking-tight leading-tight">
              {username ? `Chào ${username} nhé! 👋` : 'Đang chào bạn...'}
            </h2>
          </div>
          
          {roomLoading && !currentRoom ? (
            <div className="relative -mb-12 z-20">
              <Card className="rounded-[40px] border-none shadow-2xl bg-white/95 backdrop-blur-xl p-8 h-32 animate-pulse" />
            </div>
          ) : currentRoom ? (() => {
            const styles = getRoomStyles(currentRoom.id, currentRoom.type);
            return (
              <div className="relative mb-4 z-20 group animate-in zoom-in-95 duration-700">
                 <Link href="/rooms">
                  <Card className={`rounded-[25px] border-none shadow-2xl ${styles.shadow} ${styles.cardBg} backdrop-blur-3xl p-6 md:p-8 flex flex-col gap-6 hover:scale-[1.01] transition-all duration-500 hover:shadow-xl active:scale-[0.98]`}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-[24px] ${styles.iconBg} ${styles.iconText} flex items-center justify-center shadow-lg shadow-current/20 transition-all duration-700 group-hover:scale-110 group-hover:rotate-6`}>
                          {currentRoom.type === 'PRIVATE' ? <Briefcase className="w-7 h-7 md:w-8 md:h-8" /> : <Home className="w-7 h-7 md:w-8 md:h-8" />}
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${styles.accentText} opacity-70 tracking-tight leading-none mb-1`}>Không gian</span>
                          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-none group-hover:text-primary transition-colors">
                            {currentRoom.name}
                          </h1>
                        </div>
                      </div>
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/50 backdrop-blur-md flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500">
                        <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  
                  {/* Member count and Avatars stack row */}
                  <div className="flex items-center gap-4">
                    {/* Avatar Stack */}
                    <div className="flex -space-x-2.5">
                      {roomMembers.length > 0 ? (
                        roomMembers.map((member, i) => {
                          const colors = [
                            'from-violet-500 to-purple-600',
                            'from-pink-500 to-rose-600',
                            'from-amber-400 to-orange-500',
                            'from-cyan-400 to-blue-500',
                            'from-emerald-400 to-teal-500'
                          ];
                          const color = colors[i % colors.length];
                          
                          return (
                            <div 
                              key={i}
                              className={`w-9 h-9 md:w-11 md:h-11 rounded-full border-[3px] border-white bg-gradient-to-br ${color} flex items-center justify-center text-[11px] md:text-sm font-black text-white overflow-hidden shadow-md transition-all duration-500 hover:scale-110 hover:z-10 cursor-default hover:-translate-y-1`}
                              title={member.name}
                              style={{ animationDelay: `${i * 100}ms` }}
                            >
                              <span className="drop-shadow-sm">{(member.name?.[0] || '?').toUpperCase()}</span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="w-9 h-9 rounded-full border-[3px] border-white bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-300">
                          ?
                        </div>
                      )}
                      {memberCount > 5 && (
                        <div className="w-9 h-9 md:w-11 md:h-11 rounded-full border-[3px] border-white bg-white/80 backdrop-blur-md flex items-center justify-center text-[10px] md:text-xs font-black text-primary shadow-sm">
                          +{memberCount - 5}
                        </div>
                      )}
                    </div>
                    <div className="h-1 w-1 rounded-full bg-gray-200" />
                    <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">
                      {memberCount} thành viên
                    </span>
                  </div>
                </Card>
              </Link>
            </div>
            );
          })() : !roomLoading && (
            <div className="h-20" /> /* Minimal spacer if no room */
          )}
        </div>

        {/* Content Section */}
        {showSkeletons ? (
          /* Initial Loading Skeleton */
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="relative -mt-12">
              <Card className="shadow-2xl border-none shadow-primary/10 overflow-hidden h-32 bg-white flex items-center px-6">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl animate-pulse mr-4" />
                <div className="space-y-2">
                  <div className="w-32 h-3 bg-gray-100 rounded animate-pulse" />
                  <div className="w-48 h-8 bg-gray-200 rounded animate-pulse" />
                </div>
              </Card>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="h-24 bg-white rounded-3xl border border-gray-100 animate-pulse" />
              <div className="h-24 bg-white rounded-3xl border border-gray-100 animate-pulse" />
            </div>
            <div className="space-y-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <Card className="h-64 bg-white border-none shadow-lg animate-pulse rounded-3xl" />
            </div>
          </div>
        ) : !currentRoom && !roomLoading ? (
          /* No Room State */
          <Card className="border-2 border-dashed border-gray-200 bg-gray-50/50 animate-in fade-in zoom-in-95 duration-700">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Home className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium mb-8">
                Bạn chưa chọn không gian nào
              </p>
              <Link href="/rooms">
                <Button className="rounded-xl px-8 py-6 h-auto shadow-lg shadow-primary/20 tap-highlight">
                  <Home className="mr-2 w-5 h-5" />
                  Chọn không gian ngay
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          /* Real Dashboard Content */
          <>
            <div className="relative -mt-12 animate-in fade-in zoom-in-95 duration-700 delay-200">
              <Card className="shadow-2xl border-none shadow-emerald-200/40 overflow-hidden bg-white/95 backdrop-blur-xl">
                <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-10 text-emerald-500">
                  <Leaf className="w-32 h-32" />
                </div>
                <CardContent className="py-8 px-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <Leaf className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-emerald-600 font-black uppercase tracking-widest mb-1 opacity-70">Tổng chi tiêu tháng</p>
                        <p className="text-3xl font-black text-gray-900 tracking-tight">
                          <AnimatedCounter value={stats.monthlyTotal} formatFn={formatCurrency} />
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
              <Link
                href="/transactions/add"
                className="group relative overflow-hidden flex items-center gap-4 p-5 bg-white/80 backdrop-blur-md rounded-3xl border border-emerald-50 shadow-sm hover:shadow-xl hover:shadow-emerald-200/50 hover:bg-white transition-all duration-500 tap-highlight"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 flex-shrink-0 shadow-lg shadow-emerald-500/10">
                  <Plus className="w-7 h-7 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-gray-900 tracking-tight">Thêm giao dịch</p>
                  <p className="text-xs font-bold text-emerald-600/60 transition-colors group-hover:text-emerald-600">Ghi lại chi phí mới</p>
                </div>
                <ChevronRight className="ml-auto w-5 h-5 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/rooms/create"
                className="group relative overflow-hidden flex items-center gap-4 p-5 bg-white/80 backdrop-blur-md rounded-3xl border border-green-50 shadow-sm hover:shadow-xl hover:shadow-green-200/50 hover:bg-white transition-all duration-500 tap-highlight"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 flex-shrink-0 shadow-lg shadow-green-500/10">
                  <Home className="w-7 h-7 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-gray-900 tracking-tight">Tạo không gian</p>
                  <p className="text-xs font-bold text-green-600/60 transition-colors group-hover:text-green-600">Thêm nhóm mới</p>
                </div>
                <ChevronRight className="ml-auto w-5 h-5 text-gray-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>

            {currentRoom && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-lg font-black text-gray-900 tracking-tight">Giao dịch gần đây</h2>
                  <Link href="/transactions" className="text-xs font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all">
                    Xem tất cả <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                
                <Card className="border-none shadow-lg shadow-gray-100 rounded-3xl overflow-hidden">
                  <CardContent className="p-0">
                    {recentTransactions.length === 0 ? (
                      <div className="text-center py-16 px-6">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileText className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-sm font-bold text-gray-400 mb-8">Chưa có giao dịch nào được ghi lại</p>
                        <Link href="/transactions/add">
                          <Button className="rounded-xl px-6 tap-highlight shadow-lg shadow-primary/20">
                            <Plus className="mr-2 w-4 h-4" />
                            Ghi chú ngay
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {recentTransactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowDetailDialog(true);
                            }}
                            className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer tap-highlight"
                          >
                            <div
                              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-white"
                              style={{ backgroundColor: transaction.categories.color + '15' }}
                            >
                              <span className="text-xl">{transaction.categories.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-gray-900 truncate leading-tight mb-0.5">{transaction.categories.name}</p>
                              <p className="text-xs font-medium text-gray-500 truncate">
                                {transaction.note || 'Không có ghi chú'}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-black text-sm text-gray-900 tracking-tight">
                                {formatCurrency(transaction.amount)}
                              </p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                {formatDate(transaction.date)}
                              </p>
                            </div>
                          </div>
                        ))}
                        <Link href="/transactions" className="block p-5 text-center group bg-gray-50/30 hover:bg-gray-50 transition-all">
                          <span className="text-xs font-black text-gray-400 uppercase tracking-widest group-hover:text-primary transition-colors flex items-center justify-center gap-2">
                            Xem lịch sử chi tiết <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>

      <TransactionDetailDialog
        transaction={selectedTransaction}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />
    </>
  );
}
