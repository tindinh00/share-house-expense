'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRoom } from '@/contexts/RoomContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Wallet,
  CreditCard,
  ChevronRight,
  ShoppingBag
} from 'lucide-react';
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
  };
}

interface SupabaseTransactionResponse {
  id: string;
  date: string;
  amount: string;
  note: string | null;
  category_id: string;
  paid_by: string;
  created_by: string;
  created_at: string;
  categories: {
    name: string;
    icon: string;
    color: string;
  } | null;
  profiles: {
    username: string;
  } | null;
}

export default function MonthDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { currentRoom, loading: roomLoading } = useRoom();
  
  const year = parseInt(params.year as string);
  const month = parseInt(params.month as string);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isFirstLoadComplete, setIsFirstLoadComplete] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const loadMonthTransactions = useCallback(async () => {
    if (!currentRoom) return;
    

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
          profiles:paid_by (username)
        `)
        .eq('room_id', currentRoom.id)
        .gte('date', format(firstDay, 'yyyy-MM-dd'))
        .lte('date', format(lastDay, 'yyyy-MM-dd'))
        .eq('is_deleted', false)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData: Transaction[] = (data as unknown as SupabaseTransactionResponse[] || []).map(t => ({
        id: t.id,
        date: t.date,
        amount: parseFloat(t.amount),
        note: t.note || '',
        category_id: t.category_id,
        paid_by: t.paid_by,
        created_by: t.created_by,
        created_at: t.created_at,
        categories: {
          name: t.categories?.name || 'Chưa phân loại',
          icon: t.categories?.icon || '📁',
          color: t.categories?.color || '#94a3b8',
        },
        profiles: {
          username: t.profiles?.username || 'Người dùng',
        }
      }));

      setTransactions(formattedData);
      const total = formattedData.reduce((sum, t) => sum + t.amount, 0);
      setTotalAmount(total);
      setIsFirstLoadComplete(true);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setIsFirstLoadComplete(true);
    }
  }, [supabase, currentRoom, year, month]);

  useEffect(() => {
    if (currentRoom) {
      loadMonthTransactions();
    } else if (!roomLoading) {
      setTransactions([]);
      setIsFirstLoadComplete(true);
    }
  }, [currentRoom, roomLoading, loadMonthTransactions]);

  const getMonthName = useMemo(() => {
    const date = new Date(year, month - 1, 1);
    return format(date, 'MMMM yyyy', { locale: vi });
  }, [year, month]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'eee, dd/MM', { locale: vi });
  };

  const getDayOnly = (dateString: string) => {
    return format(new Date(dateString), 'dd');
  };

  if (roomLoading && !isFirstLoadComplete) {
    return (
      <div className="space-y-6">
        <div className="h-20 w-full bg-gray-200 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          <div className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Header Area */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-700">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4 h-10 px-0 hover:bg-transparent group"
        >
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-2 group-hover:bg-primary/10 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600 group-hover:text-primary" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-gray-500 group-hover:text-primary transition-colors">QUAY LẠI</span>
        </Button>
        
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Tháng {month}/{year}
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {getMonthName} • {currentRoom?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
        <Card className="col-span-2 rounded-2xl sm:rounded-3xl border-none shadow-sm bg-gradient-to-br from-primary/10 to-primary/5 p-4 sm:p-6 relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 w-16 h-16 sm:w-24 sm:h-24 bg-primary/10 rounded-full group-hover:scale-125 transition-transform duration-700" />
          <p className="text-[10px] sm:text-xs font-black text-primary/70 uppercase tracking-widest mb-1.5 sm:mb-2 relative z-10">TỔNG CHI TIÊU</p>
          <div className="flex items-baseline gap-0.5 sm:gap-1 relative z-10">
            <p className="text-xl sm:text-4xl font-black text-primary leading-none">
              {totalAmount.toLocaleString('vi-VN')}
            </p>
            <span className="text-[10px] sm:text-sm font-black text-primary/60 uppercase">₫</span>
          </div>
        </Card>

        <Card className="rounded-2xl sm:rounded-3xl border-none shadow-sm bg-blue-50/50 p-3 sm:p-5 flex flex-col justify-center text-center group">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform">
             <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          </div>
          <p className="text-[10px] sm:text-xs font-black text-blue-600/70 uppercase tracking-widest leading-none mb-1 sm:mb-1.5">Giao dịch</p>
          <p className="text-base sm:text-2xl font-black text-blue-900">{transactions.length}</p>
        </Card>

        <Card className="rounded-2xl sm:rounded-3xl border-none shadow-sm bg-indigo-50/50 p-3 sm:p-5 flex flex-col justify-center text-center group">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-indigo-100 flex items-center justify-center mx-auto mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform">
             <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
          </div>
          <p className="text-[10px] sm:text-xs font-black text-indigo-600/70 uppercase tracking-widest leading-none mb-1 sm:mb-1.5">Danh mục</p>
          <p className="text-base sm:text-2xl font-black text-indigo-900">{new Set(transactions.map(t => t.categories.name)).size}</p>
        </Card>
      </div>

      {/* Transactions List */}
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">CHI TIẾT GIAO DỊCH</h2>
          <div className="h-px bg-gray-100 flex-1 ml-4" />
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <ShoppingBag className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Không có giao dịch trong tháng này</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {transactions.map((t) => (
              <Card 
                key={t.id} 
                className="group border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] tap-highlight"
                onClick={() => {
                  setSelectedTransaction(t);
                  setShowDetailDialog(true);
                }}
              >
                <CardContent className="p-0">
                  <div className="flex items-center p-4">
                    {/* Date badge */}
                    <div className="flex flex-col items-center justify-center min-w-[50px] h-[50px] bg-gray-50 rounded-2xl mr-4 group-hover:bg-primary/10 transition-colors duration-300 border border-gray-100 group-hover:border-primary/20">
                      <span className="text-lg font-black text-gray-900 leading-none group-hover:text-primary transition-colors">{getDayOnly(t.date)}</span>
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-tight leading-none mt-0.5 group-hover:text-primary/70 transition-colors">{month}/{year}</span>
                    </div>

                    {/* Category Icon */}
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm border border-gray-50 mr-4 group-hover:scale-110 transition-transform duration-500"
                      style={{ backgroundColor: t.categories.color + '10', color: t.categories.color }}
                    >
                      {t.categories.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <h3 className="font-black text-xs uppercase tracking-tight text-gray-900 truncate group-hover:text-primary transition-colors">
                          {t.categories.name}
                        </h3>
                        <span className="font-black text-sm tracking-tighter text-gray-900 group-hover:text-primary transition-colors shrink-0">
                          {t.amount.toLocaleString('vi-VN')} <span className="text-[10px] font-bold text-gray-400">₫</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                         <div className="flex items-center gap-1.5 min-w-0">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[100px] sm:max-w-[none]">{t.profiles.username}</p>
                           {t.note && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0"></span>
                                <p className="text-[10px] font-medium text-gray-500 truncate italic line-clamp-1">{t.note}</p>
                              </>
                           )}
                         </div>
                         <span className="text-[10px] font-bold text-gray-400 shrink-0 uppercase tracking-tighter leading-none ml-1">{formatDate(t.date)}</span>
                      </div>
                    </div>

                    {/* Arrow - Desktop only */}
                    <div className="hidden sm:flex items-center ml-4 border-l border-gray-100 pl-4 opacity-0 group-hover:opacity-100 transition-opacity">
                       <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <TransactionDetailDialog
        transaction={selectedTransaction}
        open={showDetailDialog}
        onOpenChange={(open) => setShowDetailDialog(open)}
        currentUserId={currentUserId}
        onDeleted={loadMonthTransactions}
      />
    </div>
  );
}
