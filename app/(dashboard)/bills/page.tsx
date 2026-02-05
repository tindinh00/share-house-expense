'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRoom } from '@/contexts/RoomContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  TrendingUp, 
  CreditCard, 
  Wallet,
  ArrowRight,
  Sparkles,
  ArrowUpRight,
  House,
  Briefcase
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';

interface MonthSummary {
  year: number;
  month: number;
  totalAmount: number;
  transactionCount: number;
}

interface SupabaseTransactionSummary {
  date: string;
  amount: string;
}

export default function BillsPage() {
  const supabase = createClient();
  const { currentRoom, loading: roomLoading } = useRoom();
  const [months, setMonths] = useState<MonthSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFirstLoadComplete, setIsFirstLoadComplete] = useState(false);

  const loadMonthsSummary = useCallback(async () => {
    if (!currentRoom) {
      setMonths([]);
      setLoading(false);
      setIsFirstLoadComplete(true);
      return;
    }
    
    if (!isFirstLoadComplete) {
      setLoading(true);
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('date, amount')
        .eq('room_id', currentRoom.id)
        .eq('is_deleted', false)
        .order('date', { ascending: false });

      if (error) throw error;

      const transactions = (data as unknown as SupabaseTransactionSummary[]) || [];
      const monthsMap = new Map<string, MonthSummary>();
      
      transactions.forEach((t) => {
        const date = new Date(t.date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const key = `${year}-${month}`;

        if (!monthsMap.has(key)) {
          monthsMap.set(key, {
            year,
            month,
            totalAmount: 0,
            transactionCount: 0,
          });
        }

        const summary = monthsMap.get(key)!;
        summary.totalAmount += parseFloat(t.amount);
        summary.transactionCount += 1;
      });

      const monthsArray = Array.from(monthsMap.values()).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

      setMonths(monthsArray);
      setLoading(false);
      setIsFirstLoadComplete(true);
    } catch (error) {
      console.error('Error loading months:', error);
      setLoading(false);
      setIsFirstLoadComplete(true);
    }
  }, [supabase, currentRoom, isFirstLoadComplete]);

  useEffect(() => {
    if (currentRoom) {
      loadMonthsSummary();
    } else if (!roomLoading) {
      setMonths([]);
      setLoading(false);
      setIsFirstLoadComplete(true);
    }
  }, [currentRoom, roomLoading, loadMonthsSummary]);

  const stats = useMemo(() => {
    const totalSpent = months.reduce((sum, m) => sum + m.totalAmount, 0);
    const avgMonthly = months.length > 0 ? Math.round(totalSpent / months.length) : 0;
    const peakMonth = months.reduce((prev, curr) => (curr.totalAmount > prev.totalAmount ? curr : prev), months[0] || { totalAmount: 0 });
    
    return {
      totalSpent,
      avgMonthly,
      peakMonth: peakMonth.totalAmount,
    };
  }, [months]);

  const getMonthLabel = (month: number) => {
    const date = new Date(2000, month - 1, 1);
    return format(date, 'MMMM', { locale: vi });
  };

  if (roomLoading && !isFirstLoadComplete) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-8 -mt-8 md:-mt-12 lg:-mt-16">
      {/* Header Area */}
      <div className="pt-10 pb-6 px-1 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-black drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)] tracking-tight leading-tight">
            Chi tiêu tháng
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {currentRoom ? (
               <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/5 backdrop-blur-sm text-black/70">
                 {currentRoom.type === 'PRIVATE' ? <Briefcase className="w-3.5 h-3.5" /> : <House className="w-3.5 h-3.5" />}
                 <span className="text-xs font-black uppercase tracking-widest">{currentRoom.name}</span>
                 <div className="h-1 w-1 rounded-full bg-black/20 mx-0.5" />
                 <span className="text-xs font-black uppercase tracking-widest">{months.length} tháng hoạt động</span>
               </div>
            ) : roomLoading ? (
               <div className="w-32 h-6 bg-gray-100 rounded animate-pulse" />
            ) : null}
          </div>
        </div>
      </div>

      {!currentRoom ? (
        <div className="text-center py-20 animate-in fade-in zoom-in-95 duration-700">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-gray-500 font-bold mb-4">Chọn không gian để xem chi tiêu định kỳ</p>
          <Button 
            variant="outline" 
            asChild
            className="rounded-xl border-gray-200"
          >
            <Link href="/rooms">Chọn không gian</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
              <CardContent className="p-4 sm:p-5 flex flex-col justify-center">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  </div>
                  <p className="text-[10px] sm:text-xs font-black text-emerald-600/70 uppercase tracking-widest leading-none">Tổng cộng</p>
                </div>
                <div className="flex items-baseline gap-0.5 sm:gap-1 overflow-hidden">
                  <p className="text-xl sm:text-2xl font-black text-emerald-900 truncate">
                    {stats.totalSpent.toLocaleString('vi-VN')}
                  </p>
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-600/60 uppercase">₫</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-violet-500/10 to-violet-500/5">
              <CardContent className="p-4 sm:p-5 flex flex-col justify-center">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600" />
                  </div>
                  <p className="text-[10px] sm:text-xs font-black text-violet-600/70 uppercase tracking-widest leading-tight sm:leading-none">Trình bình</p>
                </div>
                <div className="flex items-baseline gap-0.5 sm:gap-1 overflow-hidden">
                  <p className="text-xl sm:text-2xl font-black text-violet-900 truncate">
                    {stats.avgMonthly.toLocaleString('vi-VN')}
                  </p>
                  <span className="text-[10px] sm:text-xs font-bold text-violet-600/60 uppercase">₫</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-amber-500/10 to-amber-500/5">
              <CardContent className="p-4 sm:p-5 flex flex-col justify-center">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                  </div>
                  <p className="text-[10px] sm:text-xs font-black text-amber-600/70 uppercase tracking-widest leading-none">Cao nhất</p>
                </div>
                <div className="flex items-baseline gap-0.5 sm:gap-1 overflow-hidden">
                  <p className="text-xl sm:text-2xl font-black text-amber-900 truncate">
                    {stats.peakMonth.toLocaleString('vi-VN')}
                  </p>
                  <span className="text-[10px] sm:text-xs font-bold text-amber-600/60 uppercase">₫</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Month List */}
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            {loading && !isFirstLoadComplete ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-white rounded-3xl border border-gray-100 animate-pulse" />
                ))}
              </div>
            ) : months.length === 0 ? (
              <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                  <CreditCard className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Chưa có giao dịch nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {months.map((monthData, index) => (
                  <Link 
                    key={`${monthData.year}-${monthData.month}`}
                    href={`/bills/${monthData.year}/${monthData.month}`}
                    className="group"
                  >
                    <Card className="rounded-3xl border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 overflow-hidden cursor-pointer active:scale-[0.99] tap-highlight relative">
                      {/* Decorative background element for the first item */}
                      {index === 0 && (
                        <div className="absolute top-0 right-0 p-3">
                          <div className="px-2 py-1 bg-primary/10 rounded-full flex items-center gap-1.5 border border-primary/20">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            <span className="text-[10px] font-black text-primary uppercase tracking-tight">Tháng hiện tại</span>
                          </div>
                        </div>
                      )}

                      <CardContent className="p-6">
                        <div className="flex items-center justify-between gap-6">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex flex-col items-center justify-center group-hover:bg-primary/10 transition-colors duration-500 border border-gray-100 group-hover:border-primary/20">
                              <span className="text-lg font-black text-gray-900 group-hover:text-primary transition-colors leading-none">{monthData.month}</span>
                              <span className="text-[10px] font-black text-gray-400 uppercase group-hover:text-primary/70 transition-colors mt-0.5">{monthData.year}</span>
                            </div>
                            
                            <div>
                              <h3 className="font-black text-lg text-gray-900 group-hover:text-primary transition-colors leading-tight">
                                {getMonthLabel(monthData.month)}
                              </h3>
                              <p className="text-xs font-bold text-gray-400 mt-0.5">
                                {monthData.transactionCount} giao dịch ghi nhận
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-primary/60 transition-colors">TỔNG CHI TIÊU</p>
                            <div className="flex items-center justify-end gap-3">
                              <p className="text-xl sm:text-2xl font-black text-gray-900 group-hover:text-primary transition-colors tracking-tighter">
                                {monthData.totalAmount.toLocaleString('vi-VN')} <span className="text-xs font-bold text-gray-400">₫</span>
                              </p>
                              <div className="hidden sm:flex w-10 h-10 rounded-full bg-gray-50 items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            </div>
                            <div className="sm:hidden flex items-center justify-end gap-1 text-[10px] font-black text-primary mt-1 opacity-0 group-hover:opacity-100 transition-opacity uppercase">
                              Chi tiết <ArrowUpRight className="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
