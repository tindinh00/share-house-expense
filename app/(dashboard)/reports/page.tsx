'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRoom } from '@/contexts/RoomContext';
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
  Legend,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { TransactionDetailDialog } from '@/components/TransactionDetailDialog';

interface CategorySummary {
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  total: number;
  count: number;
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

interface TransactionDetail {
  id: string;
  date: string;
  amount: number;
  note: string;
  category: {
    name: string;
    icon: string;
    color: string;
  };
  paid_by_user: {
    username: string;
    email: string;
  };
}

export default function ReportsPage() {
  const supabase = createClient();
  const { currentRoom } = useRoom();
  
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const [userSummary, setUserSummary] = useState<UserSummary[]>([]);
  const [householdSummary, setHouseholdSummary] = useState<HouseholdSummary[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionDetail[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [loading, setLoading] = useState(true);
  const [totalExpense, setTotalExpense] = useState(0);
  const [actualSpending, setActualSpending] = useState<{user_id: string; username: string; total: number}[]>([]);
  const [householdSpending, setHouseholdSpending] = useState<{household_id: string; household_name: string; total: number; transactions: TransactionDetail[]}[]>([]);
  const [expandedHousehold, setExpandedHousehold] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [dailySpending, setDailySpending] = useState<any[]>([]);

  useEffect(() => {
    if (currentRoom) {
      loadReports();
    }
  }, [currentRoom, dateRange]);

  useEffect(() => {
    // Filter and sort transactions
    let filtered = [...transactions];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category.name === selectedCategory);
    }

    // Sort
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else {
      filtered.sort((a, b) => b.amount - a.amount);
    }

    setFilteredTransactions(filtered);
  }, [transactions, selectedCategory, sortBy]);

  const loadReports = async () => {
    if (!currentRoom) return;
    
    setLoading(true);
    try {
      // Get current user
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
    }
  };

  const loadTransactionDetails = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id,
        date,
        amount,
        note,
        categories:category_id (name, icon, color),
        paid_by_user:paid_by (username, email)
      `)
      .eq('room_id', currentRoom!.id)
      .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
      .lte('date', format(dateRange.to, 'yyyy-MM-dd'))
      .eq('is_deleted', false)
      .order('date', { ascending: false });

    if (error) throw error;

    const details: TransactionDetail[] = (data || []).map((t: any) => ({
      id: t.id,
      date: t.date,
      amount: parseFloat(t.amount),
      note: t.note,
      category: {
        name: t.categories.name,
        icon: t.categories.icon,
        color: t.categories.color,
      },
      paid_by_user: {
        username: t.paid_by_user.username,
        email: t.paid_by_user.email,
      },
    }));

    setTransactions(details);
    setFilteredTransactions(details);
  };

  const loadCategorySummary = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        amount,
        category_id,
        categories:category_id (name, icon, color)
      `)
      .eq('room_id', currentRoom!.id)
      .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
      .lte('date', format(dateRange.to, 'yyyy-MM-dd'))
      .eq('is_deleted', false);

    if (error) throw error;

    // Group by category
    const grouped = (data || []).reduce((acc: any, t: any) => {
      const catId = t.category_id;
      if (!acc[catId]) {
        acc[catId] = {
          category_id: catId,
          category_name: t.categories.name,
          category_icon: t.categories.icon,
          category_color: t.categories.color,
          total: 0,
          count: 0,
        };
      }
      acc[catId].total += parseFloat(t.amount);
      acc[catId].count += 1;
      return acc;
    }, {});

    const summary = Object.values(grouped) as CategorySummary[];
    summary.sort((a, b) => b.total - a.total);
    
    const total = summary.reduce((sum, cat) => sum + cat.total, 0);
    setTotalExpense(total);
    setCategorySummary(summary);
  };

  const loadUserSummary = async () => {
    // Load all transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        amount,
        paid_by,
        profiles:paid_by (username, email)
      `)
      .eq('room_id', currentRoom!.id)
      .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
      .lte('date', format(dateRange.to, 'yyyy-MM-dd'))
      .eq('is_deleted', false);

    if (error) throw error;

    // Get all room members
    const { data: members } = await supabase
      .from('room_members')
      .select('user_id, profiles:user_id (username, email)')
      .eq('room_id', currentRoom!.id)
      .not('user_id', 'is', null);

    const memberCount = members?.length || 1;
    const totalExpense = (transactions || []).reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const perPersonShare = totalExpense / memberCount;

    // Calculate actual spending (chi tiêu thực tế)
    const spending = (members || []).map((m: any) => {
      const total = (transactions || [])
        .filter(t => t.paid_by === m.user_id)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      return {
        user_id: m.user_id,
        username: m.profiles.username,
        total: total,
      };
    });
    spending.sort((a, b) => b.total - a.total);
    setActualSpending(spending);

    // Calculate summary
    const summary: UserSummary[] = (members || []).map((m: any) => {
      const paid = (transactions || [])
        .filter(t => t.paid_by === m.user_id)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      return {
        user_id: m.user_id,
        username: m.profiles.username,
        email: m.profiles.email,
        total_paid: paid,
        total_owed: perPersonShare,
        balance: paid - perPersonShare,
      };
    });

    summary.sort((a, b) => b.balance - a.balance);
    setUserSummary(summary);
    
    // Calculate settlements
    calculateSettlements(summary);
  };

  const loadHouseholdSummary = async () => {
    // Load all transactions with full details
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        id,
        date,
        amount,
        note,
        paid_by,
        categories:category_id (name, icon, color),
        profiles:paid_by (username, email)
      `)
      .eq('room_id', currentRoom!.id)
      .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
      .lte('date', format(dateRange.to, 'yyyy-MM-dd'))
      .eq('is_deleted', false)
      .order('date', { ascending: false });

    if (error) throw error;

    // Get all households in room
    const { data: roomHouseholds } = await supabase
      .from('room_members')
      .select(`
        household_id,
        households:household_id (name)
      `)
      .eq('room_id', currentRoom!.id)
      .not('household_id', 'is', null);

    const householdCount = roomHouseholds?.length || 1;
    const totalExpense = (transactions || []).reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const perHouseholdShare = totalExpense / householdCount;

    // Get household members to map user -> household
    const householdIds = (roomHouseholds || []).map(h => h.household_id);
    const { data: householdMembers } = await supabase
      .from('household_members')
      .select('household_id, user_id')
      .in('household_id', householdIds);

    const userToHousehold = new Map();
    (householdMembers || []).forEach((hm: any) => {
      userToHousehold.set(hm.user_id, hm.household_id);
    });

    // Calculate summary
    const summary: HouseholdSummary[] = await Promise.all(
      (roomHouseholds || []).map(async (h: any) => {
        // Get member count
        const { count } = await supabase
          .from('household_members')
          .select('*', { count: 'exact', head: true })
          .eq('household_id', h.household_id);

        // Calculate total paid by this household
        const paid = (transactions || [])
          .filter(t => userToHousehold.get(t.paid_by) === h.household_id)
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        return {
          household_id: h.household_id,
          household_name: h.households.name,
          total_paid: paid,
          total_owed: perHouseholdShare,
          balance: paid - perHouseholdShare,
          member_count: count || 0,
        };
      })
    );

    summary.sort((a, b) => b.balance - a.balance);
    setHouseholdSummary(summary);
    
    // Calculate actual spending with transactions for each household
    const spending = await Promise.all(
      (roomHouseholds || []).map(async (h: any) => {
        const householdTransactions = (transactions || [])
          .filter(t => userToHousehold.get(t.paid_by) === h.household_id)
          .map((t: any) => ({
            id: t.id,
            date: t.date,
            amount: parseFloat(t.amount),
            note: t.note,
            category: {
              name: t.categories.name,
              icon: t.categories.icon,
              color: t.categories.color,
            },
            paid_by_user: {
              username: t.profiles.username,
              email: t.profiles.email,
            },
          }));

        const total = householdTransactions.reduce((sum, t) => sum + t.amount, 0);

        return {
          household_id: h.household_id,
          household_name: h.households.name,
          total: total,
          transactions: householdTransactions,
        };
      })
    );
    spending.sort((a, b) => b.total - a.total);
    setHouseholdSpending(spending);
    
    // Calculate daily spending for chart
    const dailyData: any = {};
    (transactions || []).forEach((t: any) => {
      const date = t.date;
      const householdId = userToHousehold.get(t.paid_by);
      const household = (roomHouseholds || []).find((h: any) => h.household_id === householdId);
      
      if (!dailyData[date]) {
        dailyData[date] = { date };
      }
      
      if (household && household.households) {
        const householdName = Array.isArray(household.households) 
          ? household.households[0]?.name 
          : (household.households as any).name;
        
        if (householdName) {
          if (!dailyData[date][householdName]) {
            dailyData[date][householdName] = 0;
          }
          dailyData[date][householdName] += parseFloat(t.amount);
        }
      }
    });
    
    const dailyArray = Object.values(dailyData).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    setDailySpending(dailyArray);
    
    // Calculate settlements
    calculateSettlementsForHouseholds(summary);
  };

  const calculateSettlements = (summary: UserSummary[]) => {
    const creditors = summary.filter(u => u.balance > 0).sort((a, b) => b.balance - a.balance);
    const debtors = summary.filter(u => u.balance < 0).sort((a, b) => a.balance - b.balance);
    
    const settlements: Settlement[] = [];
    let i = 0, j = 0;
    
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      const amount = Math.min(creditor.balance, Math.abs(debtor.balance));
      
      if (amount > 0.01) {
        settlements.push({
          from: debtor.username,
          to: creditor.username,
          amount: Math.round(amount),
        });
      }
      
      creditor.balance -= amount;
      debtor.balance += amount;
      
      if (creditor.balance < 0.01) i++;
      if (Math.abs(debtor.balance) < 0.01) j++;
    }
    
    setSettlements(settlements);
  };

  const calculateSettlementsForHouseholds = (summary: HouseholdSummary[]) => {
    const creditors = summary.filter(h => h.balance > 0).sort((a, b) => b.balance - a.balance);
    const debtors = summary.filter(h => h.balance < 0).sort((a, b) => a.balance - b.balance);
    
    const settlements: Settlement[] = [];
    let i = 0, j = 0;
    
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      const amount = Math.min(creditor.balance, Math.abs(debtor.balance));
      
      if (amount > 0.01) {
        settlements.push({
          from: debtor.household_name,
          to: creditor.household_name,
          amount: Math.round(amount),
        });
      }
      
      creditor.balance -= amount;
      debtor.balance += amount;
      
      if (creditor.balance < 0.01) i++;
      if (Math.abs(debtor.balance) < 0.01) j++;
    }
    
    setSettlements(settlements);
  };

  if (!currentRoom) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Vui lòng chọn không gian để xem báo cáo</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải báo cáo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            Báo cáo chi tiêu
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Không gian: {currentRoom.name}
          </p>
        </div>
        
        {/* Date Range Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="text-xs md:text-sm w-full md:w-auto">
              📅 {format(dateRange.from, 'dd/MM/yyyy', { locale: vi })} - {format(dateRange.to, 'dd/MM/yyyy', { locale: vi })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-3 space-y-2">
              <div>
                <p className="text-sm font-medium mb-2">Từ ngày:</p>
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                  locale={vi}
                />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Đến ngày:</p>
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                  locale={vi}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Total Expense */}
      <Card>
        <CardContent className="pt-4 md:pt-6">
          <div className="text-center">
            <p className="text-xs md:text-sm text-gray-600">Tổng chi tiêu</p>
            <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-green-600 mt-2">
              {totalExpense.toLocaleString('vi-VN')} ₫
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actual Spending Summary - For USER split (only for shared rooms with multiple users) */}
      {currentRoom.split_by === 'USER' && currentRoom.type !== 'PRIVATE' && actualSpending.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">💰 Chi tiêu thực tế trong tháng</CardTitle>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Tổng số tiền mỗi người đã chi (không chia đều)
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {actualSpending.map((person, index) => (
                <div key={person.user_id} className="relative">
                  <div className="flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-green-50 to-transparent rounded-lg border-2 border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-base md:text-lg text-gray-900">{person.username}</p>
                        <p className="text-xs md:text-sm text-gray-500">
                          {((person.total / totalExpense) * 100).toFixed(1)}% tổng chi tiêu
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg md:text-xl text-green-600">
                        {person.total.toLocaleString('vi-VN')} ₫
                      </p>
                    </div>
                  </div>
                  
                  {/* Show debt relationship from this person's perspective */}
                  {index === 0 && actualSpending.length > 1 && (
                    <div className="mt-3 ml-4 md:ml-6 pl-4 border-l-2 border-gray-200 space-y-2">
                      <p className="text-xs md:text-sm font-medium text-gray-600 mb-2">
                        📊 Từ góc nhìn của {person.username}:
                      </p>
                      {actualSpending.slice(1).map((other) => {
                        const difference = person.total - other.total;
                        const halfDiff = difference / 2;
                        
                        if (Math.abs(halfDiff) < 1000) return null;
                        
                        return (
                          <div key={other.user_id} className="flex items-center gap-2 text-xs md:text-sm p-2 bg-blue-50 rounded">
                            {halfDiff > 0 ? (
                              <>
                                <span className="text-blue-600">💵</span>
                                <span className="flex-1">
                                  <span className="font-medium">{other.username}</span> cần trả{' '}
                                  <span className="font-bold text-blue-600">
                                    {Math.round(halfDiff).toLocaleString('vi-VN')} ₫
                                  </span>
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-orange-600">💸</span>
                                <span className="flex-1">
                                  Cần trả <span className="font-medium">{other.username}</span>{' '}
                                  <span className="font-bold text-orange-600">
                                    {Math.round(Math.abs(halfDiff)).toLocaleString('vi-VN')} ₫
                                  </span>
                                </span>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actual Spending Summary - For HOUSEHOLD split (only for shared rooms with multiple households) */}
      {currentRoom.split_by === 'HOUSEHOLD' && householdSpending.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">💰 Chi tiêu thực tế của các hộ gia đình</CardTitle>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Tổng số tiền mỗi hộ đã chi trong kỳ (click để xem chi tiết)
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {householdSpending.map((household, index) => (
                <div key={household.household_id} className="relative">
                  <div 
                    className="flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-green-50 to-transparent rounded-lg border-2 border-green-100 cursor-pointer hover:border-green-300 transition"
                    onClick={() => setExpandedHousehold(expandedHousehold === household.household_id ? null : household.household_id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base md:text-lg text-gray-900 truncate">{household.household_name}</p>
                        <p className="text-xs md:text-sm text-gray-500">
                          {household.transactions.length} giao dịch • {((household.total / totalExpense) * 100).toFixed(1)}% tổng chi tiêu
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-lg md:text-xl text-green-600">
                          {household.total.toLocaleString('vi-VN')} ₫
                        </p>
                      </div>
                      <svg 
                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedHousehold === household.household_id ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded transactions list */}
                  {expandedHousehold === household.household_id && (
                    <div className="mt-2 ml-4 md:ml-6 pl-4 border-l-2 border-green-200">
                      <p className="text-xs md:text-sm font-medium text-gray-600 mb-2 mt-2">
                        📋 Danh sách giao dịch:
                      </p>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {household.transactions.map((t) => (
                          <div 
                            key={t.id} 
                            className="flex items-start gap-2 p-2 bg-white border rounded-lg hover:bg-gray-50 cursor-pointer transition"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTransaction({
                                ...t,
                                created_by: currentUserId,
                                created_at: t.date,
                                categories: t.category,
                                profiles: t.paid_by_user,
                              });
                              setShowDetailDialog(true);
                            }}
                          >
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                            style={{ backgroundColor: t.category.color + '20' }}
                          >
                            {t.category.icon}
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-900 truncate">{t.category.name}</p>
                                <p className="text-xs text-gray-500 break-all line-clamp-1">{t.note}</p>
                                <p className="text-xs text-gray-400">
                                  {format(new Date(t.date), 'dd/MM/yyyy', { locale: vi })} • {t.paid_by_user.username}
                                </p>
                              </div>
                              <p className="font-bold text-sm text-gray-900 whitespace-nowrap flex-shrink-0">
                                {t.amount.toLocaleString('vi-VN')} ₫
                              </p>
                            </div>
                          </div>
                        </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Show debt relationship from this household's perspective */}
                  {expandedHousehold === household.household_id && householdSpending.length > 1 && (
                    <div className="mt-3 ml-4 md:ml-6 pl-4 border-l-2 border-blue-200 space-y-2">
                      <p className="text-xs md:text-sm font-medium text-gray-600 mb-2">
                        💡 Từ góc nhìn của {household.household_name}:
                      </p>
                      <div className="text-xs md:text-sm p-2 bg-amber-50 rounded border border-amber-200 mb-2">
                        <p className="text-amber-800">
                          📊 Mỗi hộ phải trả: <span className="font-bold">{(totalExpense / householdSpending.length).toLocaleString('vi-VN')} ₫</span>
                        </p>
                        <p className="text-amber-700 mt-1">
                          {household.household_name} đã chi: <span className="font-bold">{household.total.toLocaleString('vi-VN')} ₫</span>
                        </p>
                        <p className={`mt-1 font-bold ${household.total >= (totalExpense / householdSpending.length) ? 'text-green-700' : 'text-red-700'}`}>
                          {household.total >= (totalExpense / householdSpending.length) 
                            ? `✅ Đã trả đủ (thừa ${(household.total - (totalExpense / householdSpending.length)).toLocaleString('vi-VN')} ₫)`
                            : `⚠️ Còn thiếu ${((totalExpense / householdSpending.length) - household.total).toLocaleString('vi-VN')} ₫`
                          }
                        </p>
                      </div>
                      {householdSpending
                        .filter(other => other.household_id !== household.household_id)
                        .map((other) => {
                          const perHouseholdShare = totalExpense / householdSpending.length;
                          const currentBalance = household.total - perHouseholdShare;
                          const otherBalance = other.total - perHouseholdShare;
                          
                          // If current household paid more than share
                          if (currentBalance > 1000 && otherBalance < -1000) {
                            const amountOwed = Math.min(Math.abs(otherBalance), currentBalance);
                            return (
                              <div key={other.household_id} className="flex items-center gap-2 text-xs md:text-sm p-2 bg-blue-50 rounded">
                                <span className="text-blue-600">💵</span>
                                <span className="flex-1">
                                  <span className="font-medium">{other.household_name}</span> cần trả{' '}
                                  <span className="font-bold text-blue-600">
                                    {Math.round(amountOwed).toLocaleString('vi-VN')} ₫
                                  </span>
                                </span>
                              </div>
                            );
                          }
                          
                          // If current household paid less than share
                          if (currentBalance < -1000 && otherBalance > 1000) {
                            const amountOwed = Math.min(Math.abs(currentBalance), otherBalance);
                            return (
                              <div key={other.household_id} className="flex items-center gap-2 text-xs md:text-sm p-2 bg-orange-50 rounded">
                                <span className="text-orange-600">💸</span>
                                <span className="flex-1">
                                  Cần trả <span className="font-medium">{other.household_name}</span>{' '}
                                  <span className="font-bold text-orange-600">
                                    {Math.round(amountOwed).toLocaleString('vi-VN')} ₫
                                  </span>
                                </span>
                              </div>
                            );
                          }
                          
                          // Both paid similar to their share
                          return (
                            <div key={other.household_id} className="flex items-center gap-2 text-xs md:text-sm p-2 bg-gray-50 rounded">
                              <span>ℹ️</span>
                              <span className="flex-1 text-gray-600">
                                <span className="font-medium">{other.household_name}</span> đã chi {other.total.toLocaleString('vi-VN')} ₫
                                {otherBalance > 0 ? ` (thừa ${Math.round(otherBalance).toLocaleString('vi-VN')} ₫)` : 
                                 otherBalance < 0 ? ` (thiếu ${Math.round(Math.abs(otherBalance)).toLocaleString('vi-VN')} ₫)` : 
                                 ' (đủ)'}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settlements */}
      {settlements.length > 0 && (
        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardHeader className="pb-3 border-b border-orange-100">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">💸</span>
              </div>
              <div>
                <CardTitle className="text-base md:text-lg text-orange-900">Thanh toán đề xuất</CardTitle>
                <p className="text-xs md:text-sm text-orange-700 mt-0.5">
                  {currentRoom.split_by === 'HOUSEHOLD' && householdSpending.length > 0 
                    ? `Mỗi hộ phải trả: ${(totalExpense / householdSpending.length).toLocaleString('vi-VN')} ₫`
                    : 'Cách thanh toán tối ưu'
                  }
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {settlements.map((s, idx) => (
                <div key={idx} className="relative group">
                  {/* Arrow decoration */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gradient-to-r from-orange-300 via-orange-400 to-orange-300 opacity-20 group-hover:opacity-40 transition -z-10"></div>
                  
                  <div className="flex items-center gap-3 md:gap-4">
                    {/* From */}
                    <div className="flex-1 bg-white rounded-lg p-3 md:p-4 shadow-sm border border-orange-100 group-hover:shadow-md transition">
                      <p className="text-xs text-orange-600 font-medium mb-1">Người trả</p>
                      <p className="font-bold text-sm md:text-base text-gray-900 truncate">{s.from}</p>
                    </div>

                    {/* Arrow & Amount */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                        <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                      <div className="bg-orange-600 text-white px-2 md:px-3 py-1 rounded-full shadow-sm">
                        <p className="font-bold text-xs md:text-sm whitespace-nowrap">
                          {s.amount.toLocaleString('vi-VN')} ₫
                        </p>
                      </div>
                    </div>

                    {/* To */}
                    <div className="flex-1 bg-white rounded-lg p-3 md:p-4 shadow-sm border border-green-100 group-hover:shadow-md transition">
                      <p className="text-xs text-green-600 font-medium mb-1">Người nhận</p>
                      <p className="font-bold text-sm md:text-base text-gray-900 truncate">{s.to}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Summary */}
            <div className="mt-4 p-3 bg-white/50 rounded-lg border border-orange-200">
              <p className="text-xs md:text-sm text-orange-800 text-center">
                ✨ Tổng cộng <span className="font-bold">{settlements.length}</span> giao dịch để cân bằng chi tiêu
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Summary with Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">Biểu đồ chi tiêu theo danh mục</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categorySummary as any}
                  dataKey="total"
                  nameKey="category_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry: any) => 
                    `${entry.category_icon}: ${((entry.percent || 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {categorySummary.map((cat) => (
                    <Cell key={cat.category_id} fill={cat.category_color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => `${Number(value).toLocaleString('vi-VN')} ₫`}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">Chi tiết theo danh mục</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {categorySummary.map((cat) => (
                <div key={cat.category_id} className="flex items-center justify-between p-2 md:p-3 border rounded-lg">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                    <div 
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-lg md:text-xl flex-shrink-0"
                      style={{ backgroundColor: cat.category_color + '20' }}
                    >
                      {cat.category_icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm md:text-base truncate">{cat.category_name}</p>
                      <p className="text-xs md:text-sm text-gray-500">{cat.count} giao dịch</p>
                    </div>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <p className="font-bold text-gray-900 text-sm md:text-base">
                      {cat.total.toLocaleString('vi-VN')} ₫
                    </p>
                    <p className="text-xs md:text-sm text-gray-500">
                      {((cat.total / totalExpense) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User/Household Summary with Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Horizontal Bar Chart for Households */}
        {currentRoom.split_by === 'HOUSEHOLD' && householdSpending.length > 0 ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">
                So sánh chi tiêu các hộ
              </CardTitle>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                Tổng chi tiêu của mỗi hộ trong kỳ
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(150, householdSpending.length * 60)}>
                <BarChart
                  data={householdSpending}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis 
                    type="number"
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="household_name"
                    tick={{ fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`${Number(value).toLocaleString('vi-VN')} ₫`, 'Chi tiêu']}
                    labelFormatter={(label) => `🏠 ${label}`}
                  />
                  <Bar 
                    dataKey="total" 
                    fill="#10b981" 
                    radius={[0, 4, 4, 0]}
                    name="Chi tiêu"
                  >
                    {householdSpending.map((entry, index) => {
                      const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : (
          /* Bar Chart for Users */
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">
                Biểu đồ chi tiêu theo người
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={userSummary}
                  margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="username"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: any) => `${Number(value).toLocaleString('vi-VN')} ₫`}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="total_paid" fill="#10b981" name="Đã trả" />
                  <Bar dataKey="total_owed" fill="#f59e0b" name="Phải trả" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Transaction Details */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-base md:text-lg">Chi tiết giao dịch ({filteredTransactions.length})</CardTitle>
            <div className="flex gap-2">
              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="flex-1 md:flex-none md:w-[180px] text-xs md:text-sm">
                  <SelectValue placeholder="Tất cả danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {categorySummary.map((cat) => (
                    <SelectItem key={cat.category_id} value={cat.category_name}>
                      <span className="flex items-center gap-2">
                        <span>{cat.category_icon}</span>
                        <span>{cat.category_name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'date' | 'amount')}>
                <SelectTrigger className="flex-1 md:flex-none md:w-[140px] text-xs md:text-sm">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Theo ngày</SelectItem>
                  <SelectItem value="amount">Theo tiền</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((t) => (
                <div 
                  key={t.id} 
                  className="flex items-start gap-2 md:gap-3 p-2 md:p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => {
                    setSelectedTransaction({
                      ...t,
                      created_by: currentUserId,
                      created_at: t.date,
                      categories: t.category,
                      profiles: t.paid_by_user,
                    });
                    setShowDetailDialog(true);
                  }}
                >
                  <div 
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-lg md:text-xl flex-shrink-0"
                    style={{ backgroundColor: t.category.color + '20' }}
                  >
                    {t.category.icon}
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium text-gray-900 text-sm md:text-base truncate">{t.category.name}</p>
                      <p className="font-bold text-gray-900 text-sm md:text-base flex-shrink-0 whitespace-nowrap">
                        {t.amount.toLocaleString('vi-VN')} ₫
                      </p>
                    </div>
                    <p className="text-xs md:text-sm text-gray-500 break-all line-clamp-2 mb-1">{t.note}</p>
                    <div className="flex flex-wrap items-center gap-1 md:gap-2 text-xs text-gray-400">
                      <span className="whitespace-nowrap">{format(new Date(t.date), 'dd/MM/yyyy', { locale: vi })}</span>
                      <span>•</span>
                      <span className="break-all line-clamp-1">
                        {t.paid_by_user.username}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                Không có giao dịch nào
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Detail Dialog - View only, no edit/delete */}
      <TransactionDetailDialog
        transaction={selectedTransaction}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        currentUserId={undefined}
        onDeleted={loadReports}
      />
    </div>
  );
}
