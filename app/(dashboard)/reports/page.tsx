'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRoom } from '@/contexts/RoomContext';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { TransactionDetailDialog } from '@/components/TransactionDetailDialog';
import { 
  Calendar as CalendarIcon, 
  CircleDollarSign, 
  BarChart3, 
  Banknote, 
  ClipboardList, 
  Lightbulb, 
  ChevronDown,
  House,
  Briefcase,
  FileText,
  TrendingUp,
  CreditCard,
  ArrowRightLeft
} from 'lucide-react';

interface CategorySummary {
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  total: number;
  count: number;
  [key: string]: string | number;
}

interface UserSummary {
  user_id: string;
  username: string;
  email: string;
  total_paid: number;
  total_owed: number;
  balance: number;
}

interface HouseholdSummary {
  household_id: string;
  household_name: string;
  total_paid: number;
  total_owed: number;
  balance: number;
  member_count: number;
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

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

// Supabase Response Interfaces
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

interface SupabaseMemberResponse {
  user_id: string;
  profiles: {
    username: string;
    email: string;
  } | null;
}

interface SupabaseRoomHouseholdResponse {
  household_id: string;
  households: {
    name: string;
  } | null;
}

export default function ReportsPage() {
  const supabase = createClient();
  const { currentRoom, loading: roomLoading } = useRoom();
  
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [loading, setLoading] = useState(true);
  const [isFirstLoadComplete, setIsFirstLoadComplete] = useState(false);
  const [totalExpense, setTotalExpense] = useState(0);
  const [actualSpending, setActualSpending] = useState<{user_id: string; username: string; total: number}[]>([]);
  const [householdSpending, setHouseholdSpending] = useState<{household_id: string; household_name: string; total: number; transactions: Transaction[]}[]>([]);
  const [expandedHousehold, setExpandedHousehold] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const calculateSettlements = useCallback((summary: UserSummary[]) => {
    const creditors = summary.filter(u => u.balance > 0).sort((a, b) => b.balance - a.balance);
    const debtors = summary.filter(u => u.balance < 0).sort((a, b) => a.balance - b.balance);
    
    const calculatedSettlements: Settlement[] = [];
    let j = 0;
    
    const creditorsCopy = creditors.map(c => ({ ...c }));
    const debtorsCopy = debtors.map(d => ({ ...d }));
    
    for (let i = 0; i < creditorsCopy.length; i++) {
        const creditor = creditorsCopy[i];
        while (creditor.balance > 0.01 && j < debtorsCopy.length) {
            const debtor = debtorsCopy[j];
            const amount = Math.min(creditor.balance, Math.abs(debtor.balance));
            
            if (amount > 0.01) {
                calculatedSettlements.push({
                    from: debtor.username,
                    to: creditor.username,
                    amount: Math.round(amount),
                });
            }
            
            creditor.balance -= amount;
            debtor.balance += amount;
            
            if (Math.abs(debtor.balance) < 0.01) j++;
        }
    }
    
    setSettlements(calculatedSettlements);
  }, []);

  const calculateSettlementsForHouseholds = useCallback((summary: HouseholdSummary[]) => {
    const creditors = summary.filter(h => h.balance > 0).sort((a, b) => b.balance - a.balance);
    const debtors = summary.filter(h => h.balance < 0).sort((a, b) => a.balance - b.balance);
    
    const calculatedSettlements: Settlement[] = [];
    let j = 0;
    
    const creditorsCopy = creditors.map(c => ({ ...c }));
    const debtorsCopy = debtors.map(d => ({ ...d }));
    
    for (let i = 0; i < creditorsCopy.length; i++) {
        const creditor = creditorsCopy[i];
        while (creditor.balance > 0.01 && j < debtorsCopy.length) {
            const debtor = debtorsCopy[j];
            const amount = Math.min(creditor.balance, Math.abs(debtor.balance));
            
            if (amount > 0.01) {
                calculatedSettlements.push({
                    from: debtor.household_name,
                    to: creditor.household_name,
                    amount: Math.round(amount),
                });
            }
            
            creditor.balance -= amount;
            debtor.balance += amount;
            
            if (Math.abs(debtor.balance) < 0.01) j++;
        }
    }
    
    setSettlements(calculatedSettlements);
  }, []);

  const loadTransactionDetails = useCallback(async () => {
    if (!currentRoom) return;
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
      .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
      .lte('date', format(dateRange.to, 'yyyy-MM-dd'))
      .eq('is_deleted', false)
      .order('date', { ascending: false });

    if (error) throw error;

    const details: Transaction[] = (data as unknown as SupabaseTransactionResponse[] || []).map(t => ({
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
      },
    }));

    setTransactions(details);
    setFilteredTransactions(details);
  }, [currentRoom, dateRange, supabase]);

  const loadCategorySummary = useCallback(async () => {
    if (!currentRoom) return;
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        amount,
        category_id,
        categories:category_id (name, icon, color)
      `)
      .eq('room_id', currentRoom.id)
      .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
      .lte('date', format(dateRange.to, 'yyyy-MM-dd'))
      .eq('is_deleted', false);

    if (error) throw error;

    const grouped = (data as unknown as SupabaseTransactionResponse[] || []).reduce((acc: Record<string, CategorySummary>, t) => {
      const catId = t.category_id;
      if (!acc[catId]) {
        acc[catId] = {
          category_id: catId,
          category_name: t.categories?.name || 'Chưa phân loại',
          category_icon: t.categories?.icon || '📁',
          category_color: t.categories?.color || '#94a3b8',
          total: 0,
          count: 0,
        };
      }
      acc[catId].total += parseFloat(t.amount);
      acc[catId].count += 1;
      return acc;
    }, {});

    const summary = Object.values(grouped);
    summary.sort((a, b) => b.total - a.total);
    
    const total = summary.reduce((sum, cat) => sum + cat.total, 0);
    setTotalExpense(total);
    setCategorySummary(summary);
  }, [currentRoom, dateRange, supabase]);

  const loadUserSummary = useCallback(async () => {
    if (!currentRoom) return;
    const { data: transData, error } = await supabase
      .from('transactions')
      .select(`
        amount,
        paid_by
      `)
      .eq('room_id', currentRoom.id)
      .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
      .lte('date', format(dateRange.to, 'yyyy-MM-dd'))
      .eq('is_deleted', false);

    if (error) throw error;

    const { data: membersData } = await supabase
      .from('room_members')
      .select('user_id, profiles:user_id (username, email)')
      .eq('room_id', currentRoom.id)
      .not('user_id', 'is', null);

    const members = membersData as unknown as SupabaseMemberResponse[] || [];
    const transactions = transData as { amount: string; paid_by: string }[] || [];

    const memberCount = members.length || 1;
    const totalExp = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const perPersonShare = totalExp / memberCount;

    const spending = members.map(m => {
      const total = transactions
        .filter(t => t.paid_by === m.user_id)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      return {
        user_id: m.user_id,
        username: m.profiles?.username || 'Người dùng',
        total: total,
      };
    });
    spending.sort((a, b) => b.total - a.total);
    setActualSpending(spending);

    const summary: UserSummary[] = members.map(m => {
      const paid = transactions
        .filter(t => t.paid_by === m.user_id)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      return {
        user_id: m.user_id,
        username: m.profiles?.username || 'Người dùng',
        email: m.profiles?.email || '',
        total_paid: paid,
        total_owed: perPersonShare,
        balance: paid - perPersonShare,
      };
    });

    summary.sort((a, b) => b.balance - a.balance);
    calculateSettlements(summary);
  }, [currentRoom, dateRange, supabase, calculateSettlements]);

  const loadHouseholdSummary = useCallback(async () => {
    if (!currentRoom) return;
    const { data: transData, error } = await supabase
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
      .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
      .lte('date', format(dateRange.to, 'yyyy-MM-dd'))
      .eq('is_deleted', false)
      .order('date', { ascending: false });

    if (error) throw error;

    const { data: householdsData } = await supabase
      .from('room_members')
      .select(`
        household_id,
        households:household_id (name)
      `)
      .eq('room_id', currentRoom.id)
      .not('household_id', 'is', null);

    const transactions = transData as unknown as SupabaseTransactionResponse[] || [];
    const roomHouseholds = householdsData as unknown as SupabaseRoomHouseholdResponse[] || [];

    const householdCount = roomHouseholds.length || 1;
    const totalExp = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const perHouseholdShare = totalExp / householdCount;

    const householdIds = roomHouseholds.map(h => h.household_id);
    const { data: hmData } = await supabase
      .from('household_members')
      .select('household_id, user_id')
      .in('household_id', householdIds);

    const userToHousehold = new Map<string, string>();
    (hmData || []).forEach((item: { household_id: string; user_id: string }) => {
      userToHousehold.set(item.user_id, item.household_id);
    });

    const summary: HouseholdSummary[] = await Promise.all(
      roomHouseholds.map(async (h) => {
        const { count } = await supabase
          .from('household_members')
          .select('*', { count: 'exact', head: true })
          .eq('household_id', h.household_id);

        const paid = transactions
          .filter(t => userToHousehold.get(t.paid_by) === h.household_id)
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        return {
          household_id: h.household_id,
          household_name: h.households?.name || 'Hộ gia đình',
          total_paid: paid,
          total_owed: perHouseholdShare,
          balance: paid - perHouseholdShare,
          member_count: count || 0,
        };
      })
    );

    summary.sort((a, b) => b.balance - a.balance);
    
    const spending = roomHouseholds.map((h) => {
      const hTrans: Transaction[] = transactions
        .filter(t => userToHousehold.get(t.paid_by) === h.household_id)
        .map(t => ({
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
          },
        }));

      const total = hTrans.reduce((sum, t) => sum + t.amount, 0);

      return {
        household_id: h.household_id,
        household_name: h.households?.name || 'Hộ gia đình',
        total: total,
        transactions: hTrans,
      };
    });
    spending.sort((a, b) => b.total - a.total);
    setHouseholdSpending(spending);
    calculateSettlementsForHouseholds(summary);
  }, [currentRoom, dateRange, supabase, calculateSettlementsForHouseholds]);

  const loadReports = useCallback(async () => {
    if (!currentRoom) return;
    
    try {
      Promise.resolve().then(() => setLoading(true));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      await Promise.all([
        loadCategorySummary(),
        loadTransactionDetails(),
        currentRoom.split_by === 'USER' ? loadUserSummary() : loadHouseholdSummary(),
      ]);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
      setIsFirstLoadComplete(true);
    }
  }, [currentRoom, supabase, loadCategorySummary, loadTransactionDetails, loadUserSummary, loadHouseholdSummary]);

  useEffect(() => {
    if (currentRoom) {
      loadReports();
    }
  }, [currentRoom, dateRange, loadReports]);

  useEffect(() => {
    let filtered = [...transactions];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.categories.name === selectedCategory);
    }

    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else {
      filtered.sort((a, b) => b.amount - a.amount);
    }

    setFilteredTransactions(filtered);
  }, [transactions, selectedCategory, sortBy]);

  const showSkeletons = useMemo(() => loading && !isFirstLoadComplete, [loading, isFirstLoadComplete]);

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Header Area */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-in fade-in slide-in-from-top-4 duration-700">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Báo cáo chi tiêu
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {currentRoom ? (
               <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                 {currentRoom.type === 'PRIVATE' ? <Briefcase className="w-3.5 h-3.5" /> : <House className="w-3.5 h-3.5" />}
                 <span className="text-xs font-bold uppercase tracking-wider">{currentRoom.name}</span>
               </div>
            ) : roomLoading ? (
               <div className="w-32 h-6 bg-gray-100 rounded animate-pulse" />
            ) : (
               <p className="text-xs font-bold text-gray-400">Chọn không gian để xem báo cáo</p>
            )}
          </div>
        </div>
        
        {/* Date Range Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-11 px-4 rounded-xl shadow-sm border-gray-200 hover:border-primary/30 transition-all font-bold text-gray-700 gap-2 w-full md:w-auto tap-highlight">
              <CalendarIcon className="w-4 h-4 text-primary" />
              <span>{format(dateRange.from, 'dd/MM/yyyy', { locale: vi })} - {format(dateRange.to, 'dd/MM/yyyy', { locale: vi })}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden shadow-2xl border-none" align="end">
            <div className="p-3 bg-white space-y-2">
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Từ ngày:</p>
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                  locale={vi}
                  className="rounded-xl border border-gray-100"
                />
              </div>
              <div className="pt-2 border-t border-gray-50">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Đến ngày:</p>
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                  locale={vi}
                  className="rounded-xl border border-gray-100"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {showSkeletons ? (
        <div className="space-y-6">
          <div className="h-32 bg-primary/20 rounded-3xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-white rounded-3xl border border-gray-100 animate-pulse" />
            <div className="h-64 bg-white rounded-3xl border border-gray-100 animate-pulse" />
          </div>
          <div className="h-96 bg-white rounded-3xl border border-gray-100 animate-pulse" />
        </div>
      ) : !currentRoom ? (
        <div className="text-center py-20 animate-in fade-in zoom-in-95 duration-700">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-gray-500 font-bold mb-8">Vui lòng chọn không gian để xem báo cáo chi tiết</p>
          <Link href="/rooms">
            <Button className="rounded-xl px-8 shadow-lg shadow-primary/20">Chọn không gian</Button>
          </Link>
        </div>
      ) : (
        <>
          <Card className="overflow-hidden border-none shadow-xl shadow-primary/5 bg-gradient-to-br from-primary to-green-600 rounded-3xl animate-in zoom-in-95 duration-700">
            <CardContent className="p-8 text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <TrendingUp className="w-32 h-32" />
              </div>
              <div className="relative z-10 text-center">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/70 mb-2">Tổng chi tiêu</p>
                <p className="text-4xl sm:text-5xl font-black tracking-tighter mb-1">
                  {totalExpense.toLocaleString('vi-VN')} <span className="text-2xl font-bold opacity-80">₫</span>
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-bold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Dữ liệu thống kê định kỳ</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {currentRoom.split_by === 'USER' && currentRoom.type !== 'PRIVATE' && actualSpending.length > 1 && (
            <Card className="rounded-3xl border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
              <CardHeader className="pb-3 px-6 pt-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CircleDollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black text-gray-900 tracking-tight">Chi tiêu thực tế</CardTitle>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Số tiền mỗi người đã chi trong kỳ</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2">
                <div className="space-y-4">
                  {actualSpending.map((person, index) => (
                    <div key={person.user_id} className="space-y-4">
                      <div className="group relative overflow-hidden bg-gray-50 border border-gray-100 p-4 sm:p-5 rounded-2xl hover:bg-white hover:border-primary/20 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center font-black text-primary text-xl group-hover:bg-primary group-hover:text-white transition-colors duration-300 shrink-0">
                              {index + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-gray-900 leading-none mb-1.5 uppercase tracking-wide truncate">{person.username}</p>
                              <p className="text-xs font-bold text-gray-400 tracking-widest truncate">
                                {((person.total / totalExpense) * 100).toFixed(1)}% TỔNG CHI TIÊU
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-lg sm:text-xl text-primary tracking-tighter">
                              {person.total.toLocaleString('vi-VN')} <span className="text-sm font-bold">₫</span>
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {index === 0 && actualSpending.length > 1 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-4">
                          <div className="flex flex-col gap-2 min-w-0">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 truncate">Phân tích từ {person.username}:</p>
                            {actualSpending.slice(1).map((other) => {
                              const difference = person.total - other.total;
                              const halfDiff = difference / 2;
                              if (Math.abs(halfDiff) < 1000) return null;
                              
                              return (
                                <div key={other.user_id} className={`flex items-start gap-3 p-3 rounded-xl border border-dashed ${halfDiff > 0 ? 'bg-blue-50/50 border-blue-200' : 'bg-orange-50/50 border-orange-200'}`}>
                                  <div className={`p-1.5 rounded-lg ${halfDiff > 0 ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                    {halfDiff > 0 ? <Banknote className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    {halfDiff > 0 ? (
                                      <p className="text-xs text-gray-700 leading-snug break-words">
                                        <span className="font-black text-blue-800 uppercase tracking-tighter break-all">{other.username}</span> cần trả <span className="font-black text-blue-800">{Math.round(halfDiff).toLocaleString('vi-VN')} ₫</span> cho bạn
                                      </p>
                                    ) : (
                                      <p className="text-xs text-gray-700 leading-snug break-words">
                                        Bạn cần trả cho <span className="font-black text-orange-800 uppercase tracking-tighter break-all">{other.username}</span> <span className="font-black text-orange-800">{Math.round(Math.abs(halfDiff)).toLocaleString('vi-VN')} ₫</span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {currentRoom.split_by === 'HOUSEHOLD' && householdSpending.length > 1 && (
            <Card className="rounded-3xl border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
              <CardHeader className="pb-3 px-6 pt-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <House className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black text-gray-900 tracking-tight">Chi tiêu hộ gia đình</CardTitle>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Tổng chi tiêu theo từng hộ</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2">
                <div className="space-y-3">
                  {householdSpending.map((household, index) => (
                    <div key={household.household_id} className="space-y-2">
                      <div 
                        className={`flex items-center justify-between p-4 sm:p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] ${expandedHousehold === household.household_id ? 'bg-primary/5 border-primary/20 shadow-lg shadow-primary/5' : 'bg-gray-50 border-gray-100 hover:border-gray-200'}`}
                        onClick={() => setExpandedHousehold(expandedHousehold === household.household_id ? null : household.household_id)}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg transition-colors duration-300 shadow-sm ${expandedHousehold === household.household_id ? 'bg-primary text-white' : 'bg-white text-primary border border-gray-100'}`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-gray-900 leading-none mb-1.5 uppercase tracking-wide truncate">{household.household_name}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              {household.transactions.length} GIAO DỊCH • {((household.total / totalExpense) * 100).toFixed(1)}% TỔNG CHI
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className={`font-black tracking-tighter text-lg sm:text-xl transition-colors duration-300 ${expandedHousehold === household.household_id ? 'text-primary' : 'text-gray-900'}`}>
                              {household.total.toLocaleString('vi-VN')} <span className="text-sm font-bold">₫</span>
                            </p>
                          </div>
                          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expandedHousehold === household.household_id ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      {expandedHousehold === household.household_id && (
                        <div className="mx-2 p-4 bg-white border border-gray-100 rounded-2xl shadow-inner space-y-4 animate-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center gap-2 mb-2 px-1">
                            <ClipboardList className="w-4 h-4 text-primary" />
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Lịch sử giao dịch</p>
                          </div>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {household.transactions.map((t) => (
                              <div 
                                key={t.id} 
                                className="flex items-start gap-4 p-3 bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 rounded-xl cursor-pointer transition-all group"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTransaction(t);
                                  setShowDetailDialog(true);
                                }}
                              >
                                <div 
                                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm bg-white border border-gray-100 group-hover:scale-110 duration-300 transition-transform"
                                  style={{ color: t.categories.color }}
                                >
                                  {t.categories.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="min-w-0 truncate">
                                      <p className="font-bold text-sm text-gray-900 truncate leading-tight mb-0.5 uppercase tracking-tighter">{t.categories.name}</p>
                                      <p className="text-[10px] font-bold text-gray-400 truncate">{t.profiles.username} • {format(new Date(t.date), 'dd/MM/yyyy')}</p>
                                    </div>
                                    <p className="font-black text-sm text-gray-900 tracking-tighter shrink-0">{t.amount.toLocaleString('vi-VN')} ₫</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="pt-4 border-t border-gray-50">
                            <div className="flex items-center gap-2 mb-3 px-1">
                              <Lightbulb className="w-4 h-4 text-amber-500" />
                              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Gợi ý tài chính</p>
                            </div>
                            <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl space-y-3">
                              <div className="flex justify-between items-center text-xs font-bold text-gray-600">
                                <span>Mỗi hộ chi:</span>
                                <span className="font-black">{(totalExpense / householdSpending.length).toLocaleString('vi-VN')} ₫</span>
                              </div>
                              <div className="flex justify-between items-center text-xs font-bold text-gray-600">
                                <span>Hộ đã chi:</span>
                                <span className="font-black">{household.total.toLocaleString('vi-VN')} ₫</span>
                              </div>
                              <div className={`p-2.5 rounded-lg text-xs font-black text-center uppercase tracking-tighter ${household.total >= (totalExpense / householdSpending.length) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {household.total >= (totalExpense / householdSpending.length) 
                                  ? `Đã trả đủ (Thừa ${(household.total - (totalExpense / householdSpending.length)).toLocaleString('vi-VN')} ₫)`
                                  : `Cần trả thêm ${((totalExpense / householdSpending.length) - household.total).toLocaleString('vi-VN')} ₫`
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {settlements.length > 0 && (
            <Card className="rounded-3xl border-none shadow-2xl shadow-orange-200/40 bg-gradient-to-br from-orange-500 to-orange-600 overflow-hidden text-white">
              <CardHeader className="pb-3 px-6 pt-6 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                    <ArrowRightLeft className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black tracking-tight">Thanh toán đề xuất</CardTitle>
                    <p className="text-[10px] font-black uppercase text-white/70 tracking-widest">Cách thanh toán tối ưu nhất</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {settlements.map((s, idx) => (
                    <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 relative group overflow-hidden">
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black uppercase text-white/60 tracking-widest mb-1.5">Người gửi</p>
                          <p className="font-black text-sm uppercase tracking-wider truncate">{s.from}</p>
                        </div>

                        <div className="flex flex-col items-center gap-2 shrink-0">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition duration-300">
                            <ArrowRightLeft className="w-5 h-5 text-orange-600" />
                          </div>
                          <div className="px-3 py-1 bg-white/20 rounded-full border border-white/20">
                            <p className="font-black text-xs whitespace-nowrap">{s.amount.toLocaleString('vi-VN')} ₫</p>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 text-right">
                          <p className="text-[10px] font-black uppercase text-white/60 tracking-widest mb-1.5">Người nhận</p>
                          <p className="font-black text-sm uppercase tracking-wider truncate">{s.to}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-white/10 rounded-xl text-center">
                  <p className="text-xs font-bold text-white/80">
                    ⭐ Tính toán tự động cho <span className="font-black">{settlements.length}</span> giao dịch
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-2">
            <Card className="rounded-3xl border-gray-100 shadow-xl shadow-gray-200/50">
              <CardHeader className="pb-3 px-6 pt-6">
                <div className="flex items-center gap-2">
                   <div className="p-2 bg-primary/10 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-black text-gray-900 tracking-tight">Chi tiêu theo danh mục</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={categorySummary}
                      dataKey="total"
                      nameKey="category_name"
                      cx="50%"
                      cy="55%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                    >
                      {categorySummary.map((cat) => (
                        <Cell key={cat.category_id} fill={cat.category_color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                      formatter={(value: number | string | undefined) => 
                        value !== undefined ? [`${Number(value).toLocaleString('vi-VN')} ₫`, ''] : ['', '']
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                   {categorySummary.slice(0, 4).map((cat) => (
                     <div key={cat.category_id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.category_color }}></div>
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter truncate">{cat.category_name}</span>
                     </div>
                   ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
              <CardHeader className="pb-3 px-6 pt-6 bg-gray-50/50 border-b border-gray-100">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <ClipboardList className="w-5 h-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg font-black text-gray-900 tracking-tight">Chi tiết danh mục</CardTitle>
                    </div>
                    <span className="text-[10px] font-black bg-white px-2 py-1 rounded-md border border-gray-100 shadow-sm uppercase">{categorySummary.length} LOẠI</span>
                 </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-50 max-h-[360px] overflow-y-auto custom-scrollbar">
                  {categorySummary.map((cat) => (
                    <div key={cat.category_id} className="flex items-center justify-between p-4 px-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4 min-w-0">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm bg-white border border-gray-100"
                          style={{ color: cat.category_color }}
                        >
                          {cat.category_icon}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-gray-900 truncate uppercase tracking-tighter">{cat.category_name}</p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{cat.count} GIAO DỊCH</p>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-black text-gray-900 text-sm tracking-tight">
                          {cat.total.toLocaleString('vi-VN')} <span className="text-xs font-bold text-gray-400">₫</span>
                        </p>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                           <div className="h-full rounded-full" style={{ width: `${(cat.total / totalExpense) * 100}%`, backgroundColor: cat.category_color }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-3xl border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
            <CardHeader className="pb-3 px-6 pt-6 border-b border-gray-100">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                   <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-black text-gray-900 tracking-tight">Chi tiết giao dịch</CardTitle>
                </div>
                
                <div className="flex gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-10 text-[10px] font-black uppercase tracking-widest rounded-xl border-gray-200 min-w-[140px] shadow-sm">
                      <SelectValue placeholder="DANH MỤC" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="all" className="text-[10px] font-black uppercase tracking-widest py-3">Tất cả</SelectItem>
                      {categorySummary.map((cat) => (
                        <SelectItem key={cat.category_id} value={cat.category_name} className="text-[10px] font-black uppercase tracking-widest py-3">
                          <div className="flex items-center gap-2">
                            <span>{cat.category_icon}</span>
                            <span>{cat.category_name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'date' | 'amount')}>
                    <SelectTrigger className="h-10 text-[10px] font-black uppercase tracking-widest rounded-xl border-gray-200 min-w-[120px] shadow-sm">
                      <SelectValue placeholder="SẮP XẾP" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="date" className="text-[10px] font-black uppercase tracking-widest py-3">Theo ngày</SelectItem>
                      <SelectItem value="amount" className="text-[10px] font-black uppercase tracking-widest py-3">Giá trị</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto custom-scrollbar">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((t) => (
                    <div 
                      key={t.id} 
                      className="flex items-start gap-4 p-5 px-6 hover:bg-gray-50/80 cursor-pointer transition-all duration-300 group"
                      onClick={() => {
                        setSelectedTransaction(t);
                        setShowDetailDialog(true);
                      }}
                    >
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm bg-white border border-gray-100 group-hover:scale-110 duration-500 transition-transform"
                        style={{ color: t.categories.color }}
                      >
                        {t.categories.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="min-w-0">
                            <p className="font-black text-gray-900 leading-none mb-1 text-sm uppercase tracking-tighter truncate group-hover:text-primary transition-colors">{t.categories.name}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{format(new Date(t.date), 'dd/MM/yyyy')} • {t.profiles.username}</p>
                          </div>
                          <p className="font-black text-gray-900 tracking-tighter text-base sm:text-lg">
                            {t.amount.toLocaleString('vi-VN')} <span className="text-xs font-bold text-gray-400">₫</span>
                          </p>
                        </div>
                        {t.note && (
                          <p className="text-xs font-medium text-gray-500 line-clamp-1 bg-gray-100/50 px-2 py-1 rounded-md inline-block max-w-full truncate">{t.note}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                      <CreditCard className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Không có giao dịch nào phù hợp</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <TransactionDetailDialog
            transaction={selectedTransaction}
            open={showDetailDialog}
            onOpenChange={(open) => setShowDetailDialog(open)}
            currentUserId={currentUserId}
            onDeleted={loadReports}
          />
        </>
      )}
    </div>
  );
}
