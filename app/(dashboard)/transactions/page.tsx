'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRoom } from '@/contexts/RoomContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Plus,
  CreditCard,
  Filter,
  Trash2,
  MoreVertical,
  Pencil,
  Calendar as CalendarIcon,
  RotateCcw,
  Check,
} from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TransactionDetailDialog } from '@/components/TransactionDetailDialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

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

export default function TransactionsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { currentRoom, loading: roomLoading } = useRoom();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFirstLoadComplete, setIsFirstLoadComplete] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const loadTransactions = useCallback(async () => {
    if (roomLoading && !currentRoom) return;

    if (!isFirstLoadComplete) {
      Promise.resolve().then(() => setLoading(true));
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      if (!currentRoom) {
        setTransactions([]);
        setLoading(false);
        setIsFirstLoadComplete(true);
        return;
      }

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
        .eq('is_deleted', false)
        .order('date', { ascending: false });

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
      setLoading(false);
      setIsFirstLoadComplete(true);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setLoading(false);
      setIsFirstLoadComplete(true);
    }
  }, [supabase, currentRoom, roomLoading, isFirstLoadComplete]);

  useEffect(() => {
    let isMounted = true;
    if (currentRoom) {
      if (isMounted) {
        loadTransactions();
      }
    } else if (!roomLoading) {
      setTransactions([]);
      setLoading(false);
      setIsFirstLoadComplete(true);
    }
    return () => { isMounted = false; };
  }, [currentRoom, roomLoading, loadTransactions]);

  const categories = useMemo(() => {
    const cats = new Map();
    transactions.forEach(t => {
      if (!cats.has(t.categories.name)) {
        cats.set(t.categories.name, t.categories);
      }
    });
    return Array.from(cats.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let result = transactions.filter((t) =>
      t.categories.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.note && t.note.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.profiles.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply Category Filter
    if (selectedCategory !== 'all') {
      result = result.filter(t => t.categories.name === selectedCategory);
    }

    // Apply Date Range Filter
    if (dateRange.from && dateRange.to) {
      result = result.filter(t => {
        const tDate = new Date(t.date);
        return isWithinInterval(tDate, {
          start: startOfDay(dateRange.from!),
          end: endOfDay(dateRange.to!),
        });
      });
    } else if (dateRange.from) {
      result = result.filter(t => new Date(t.date) >= startOfDay(dateRange.from!));
    } else if (dateRange.to) {
      result = result.filter(t => new Date(t.date) <= endOfDay(dateRange.to!));
    }

    // Apply Sorting
    result.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      }
    });

    return result;
  }, [transactions, searchTerm, selectedCategory, dateRange, sortBy, sortOrder]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (dateRange.from || dateRange.to) count++;
    if (sortBy !== 'date' || sortOrder !== 'desc') count++;
    return count;
  }, [selectedCategory, dateRange, sortBy, sortOrder]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSortBy('date');
    setSortOrder('desc');
    setDateRange({ from: undefined, to: undefined });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'eee, dd/MM', { locale: vi });
  };

  const getDayOnly = (dateString: string) => {
    return format(new Date(dateString), 'dd');
  };

  const getMonthAndYear = (dateString: string) => {
    return format(new Date(dateString), 'MM/yyyy');
  };

  if (roomLoading && !isFirstLoadComplete) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-48 bg-gray-200 rounded-lg animate-pulse" />
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-top-4 duration-700">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Giao dịch
          </h1>
          <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">
            {transactions.length} giao dịch gần đây
          </p>
        </div>
        
        <Button 
          onClick={() => router.push('/transactions/add')}
          className="rounded-xl h-12 px-6 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white font-bold transition-all hover:scale-[1.02] active:scale-[0.98] tap-highlight"
        >
          <Plus className="w-5 h-5 mr-2" />
          Thêm mới
        </Button>
      </div>

      {!currentRoom ? (
        <div className="text-center py-20 animate-in fade-in zoom-in-95 duration-700">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CreditCard className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-gray-500 font-bold mb-4">Chọn không gian để xem các giao dịch</p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/rooms')}
            className="rounded-xl border-gray-200"
          >
            Chọn không gian
          </Button>
        </div>
      ) : (
        <>
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Tìm giao dịch, lời nhắn, người trả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-12 bg-white border-gray-200 rounded-xl shadow-sm focus-visible:ring-primary focus-visible:border-primary transition-all font-medium"
              />
            </div>
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn(
                    "h-12 px-6 rounded-xl border-gray-200 bg-white shadow-sm font-bold text-gray-600 tap-highlight overflow-hidden relative group transition-all",
                    activeFilterCount > 0 && "border-primary text-primary bg-primary/5"
                  )}
                >
                  <Filter className={cn("w-4 h-4 mr-2 text-primary group-hover:scale-110 transition-transform", activeFilterCount > 0 && "fill-primary/20")} />
                  Bộ lọc
                  {activeFilterCount > 0 && (
                    <span className="ml-2 flex items-center justify-center w-5 h-5 bg-primary text-white text-[10px] rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0 rounded-2xl shadow-2xl border-none overflow-hidden" align="end">
                <div className="p-5 space-y-5 bg-white">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm uppercase tracking-widest text-gray-900">Tùy chọn bộ lọc</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={resetFilters}
                      className="h-8 px-2 text-[10px] font-black uppercase text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      LÀM MỚI
                    </Button>
                  </div>

                  {/* Category Filter */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Danh mục</p>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="h-11 rounded-xl border-gray-100 shadow-sm text-sm font-bold">
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-xl">
                        <SelectItem value="all" className="font-bold text-sm">Tất cả danh mục</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.name} value={cat.name} className="font-bold text-sm">
                            <div className="flex items-center gap-2">
                              <span>{cat.icon}</span>
                              <span>{cat.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range Filter */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Khoảng thời gian</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-11 justify-start text-left font-bold rounded-xl border-gray-100 shadow-sm",
                            !dateRange.from && "text-gray-400"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                          {dateRange.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "dd/MM", { locale: vi })} - {format(dateRange.to, "dd/MM", { locale: vi })}
                              </>
                            ) : (
                              format(dateRange.from, "dd/MM", { locale: vi })
                            )
                          ) : (
                            <span>Chọn ngày...</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl" align="center">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange.from}
                          selected={{ from: dateRange.from, to: dateRange.to }}
                          onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                          numberOfMonths={1}
                          locale={vi}
                          className="rounded-2xl border-none"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Sorting */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Sắp xếp theo</p>
                      <Select value={sortBy} onValueChange={(v: 'date' | 'amount') => setSortBy(v)}>
                        <SelectTrigger className="h-11 rounded-xl border-gray-100 shadow-sm text-sm font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-xl">
                          <SelectItem value="date" className="font-bold text-sm">Ngày</SelectItem>
                          <SelectItem value="amount" className="font-bold text-sm">Số tiền</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Thứ tự</p>
                      <Select value={sortOrder} onValueChange={(v: 'asc' | 'desc') => setSortOrder(v)}>
                        <SelectTrigger className="h-11 rounded-xl border-gray-100 shadow-sm text-sm font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-xl">
                          <SelectItem value="desc" className="font-bold text-sm">Giảm dần</SelectItem>
                          <SelectItem value="asc" className="font-bold text-sm">Tăng dần</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button 
                      className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                      onClick={() => setIsFilterOpen(false)}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      ÁP DỤNG
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Transactions List */}
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            {loading && !isFirstLoadComplete ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                  <CreditCard className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Không tìm thấy giao dịch nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredTransactions.map((t) => (
                  <Card 
                    key={t.id} 
                    className="group border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] tap-highlight"
                    onClick={() => {
                      setSelectedTransaction(t);
                      setShowDetailDialog(true);
                    }}
                  >
                    <CardContent className="p-0">
                      <div className="flex items-center p-4 sm:p-5">
                        {/* Date badge */}
                        <div className="flex flex-col items-center justify-center min-w-[50px] sm:min-w-[60px] h-[50px] sm:h-[60px] bg-gray-50 rounded-2xl mr-4 sm:mr-6 group-hover:bg-primary/10 transition-colors duration-300 border border-gray-100 group-hover:border-primary/20">
                          <span className="text-lg sm:text-xl font-black text-gray-900 leading-none group-hover:text-primary transition-colors">{getDayOnly(t.date)}</span>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight leading-none mt-1 group-hover:text-primary/70 transition-colors">{getMonthAndYear(t.date)}</span>
                        </div>

                        {/* Category Icon */}
                        <div 
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-sm border border-gray-50 mr-4 sm:mr-5 group-hover:scale-110 transition-transform duration-500"
                          style={{ backgroundColor: t.categories.color + '10', color: t.categories.color }}
                        >
                          {t.categories.icon}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center justify-between gap-3 mb-1">
                            <h3 className="font-black text-sm uppercase tracking-tight text-gray-900 truncate group-hover:text-primary transition-colors">
                              {t.categories.name}
                            </h3>
                            <span className="font-black text-sm sm:text-base tracking-tighter text-gray-900 group-hover:text-primary transition-colors shrink-0">
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

                        {/* Action - Desktop only */}
                        <div className="hidden sm:flex items-center gap-1 ml-4 border-l border-gray-100 pl-4">
                           <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-all">
                              <Pencil className="w-4 h-4" />
                           </Button>
                           <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                              <Trash2 className="w-4 h-4" />
                           </Button>
                           <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100">
                              <MoreVertical className="w-4 h-4" />
                           </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Detail Dialog */}
      <TransactionDetailDialog
        transaction={selectedTransaction}
        open={showDetailDialog}
        onOpenChange={(open) => setShowDetailDialog(open)}
        currentUserId={currentUserId}
        onDeleted={loadTransactions}
      />
    </div>
  );
}
