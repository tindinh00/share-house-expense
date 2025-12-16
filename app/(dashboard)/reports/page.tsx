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
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

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
    // Load all transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        amount,
        paid_by,
        profiles:paid_by (username)
      `)
      .eq('room_id', currentRoom!.id)
      .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
      .lte('date', format(dateRange.to, 'yyyy-MM-dd'))
      .eq('is_deleted', false);

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
        {/* Bar Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">
              Biểu đồ {currentRoom.split_by === 'USER' ? 'theo người' : 'theo hộ gia đình'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={currentRoom.split_by === 'USER' ? userSummary : householdSummary}
                margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey={currentRoom.split_by === 'USER' ? 'username' : 'household_name'}
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

        {/* Summary List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">
              {currentRoom.split_by === 'USER' ? 'Chi tiết theo người' : 'Chi tiết theo hộ gia đình'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {currentRoom.split_by === 'USER' ? (
                userSummary.map((user) => (
                  <div key={user.user_id} className="p-2 md:p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm md:text-base truncate flex-1 mr-2">{user.username}</p>
                      <p className={`font-bold text-sm md:text-base flex-shrink-0 ${user.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {user.balance >= 0 ? '+' : ''}{user.balance.toLocaleString('vi-VN')} ₫
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
                      <div>
                        <p className="text-gray-500">Đã trả</p>
                        <p className="font-medium">{user.total_paid.toLocaleString('vi-VN')} ₫</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Phải trả</p>
                        <p className="font-medium">{user.total_owed.toLocaleString('vi-VN')} ₫</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                householdSummary.map((household) => (
                  <div key={household.household_id} className="p-2 md:p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="font-medium text-sm md:text-base truncate">{household.household_name}</p>
                        <p className="text-xs md:text-sm text-gray-500">{household.member_count} thành viên</p>
                      </div>
                      <p className={`font-bold text-sm md:text-base flex-shrink-0 ${household.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {household.balance >= 0 ? '+' : ''}{household.balance.toLocaleString('vi-VN')} ₫
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
                      <div>
                        <p className="text-gray-500">Đã trả</p>
                        <p className="font-medium">{household.total_paid.toLocaleString('vi-VN')} ₫</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Phải trả</p>
                        <p className="font-medium">{household.total_owed.toLocaleString('vi-VN')} ₫</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settlements */}
      {settlements.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">Thanh toán đề xuất</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {settlements.map((s, idx) => (
                <div key={idx} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-blue-50 rounded-lg">
                  <span className="text-xl md:text-2xl flex-shrink-0">💸</span>
                  <p className="flex-1 min-w-0 text-sm md:text-base">
                    <span className="font-medium truncate inline-block max-w-[100px] md:max-w-none align-bottom">{s.from}</span>
                    {' trả '}
                    <span className="font-medium truncate inline-block max-w-[100px] md:max-w-none align-bottom">{s.to}</span>
                  </p>
                  <p className="font-bold text-blue-600 text-sm md:text-base flex-shrink-0">
                    {s.amount.toLocaleString('vi-VN')} ₫
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                <div key={t.id} className="flex items-start gap-2 md:gap-3 p-2 md:p-3 border rounded-lg hover:bg-gray-50">
                  <div 
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-lg md:text-xl flex-shrink-0"
                    style={{ backgroundColor: t.category.color + '20' }}
                  >
                    {t.category.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium text-gray-900 text-sm md:text-base line-clamp-2">{t.note}</p>
                      <p className="font-bold text-gray-900 text-sm md:text-base flex-shrink-0">
                        {t.amount.toLocaleString('vi-VN')} ₫
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-500">
                      <span>{format(new Date(t.date), 'dd/MM/yyyy', { locale: vi })}</span>
                      <span>•</span>
                      <span className="truncate max-w-[100px] md:max-w-none">{t.category.name}</span>
                      <span className="hidden md:inline">•</span>
                      <span className="truncate max-w-[120px] md:max-w-none">
                        <span className="hidden md:inline">Trả bởi: </span>{t.paid_by_user.username}
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
    </div>
  );
}
