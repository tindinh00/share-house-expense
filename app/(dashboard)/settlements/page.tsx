'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRoom } from '@/contexts/RoomContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SettlementCard, CreateSettlementDialog } from '@/components/SettlementCard';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  ArrowRightLeft,
  Send,
  House,
  Briefcase,
  Clock,
  CheckCircle2,
  TrendingUp,
  Calendar as CalendarIcon,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Settlement {
  id: string;
  room_id: string;
  from_household_id: string;
  to_household_id: string;
  transaction_ids: string[];
  amount: number;
  status: 'pending' | 'confirmed' | 'rejected';
  requested_by: string;
  requested_at: string;
  confirmed_by: string | null;
  confirmed_at: string | null;
  rejected_reason: string | null;
  note: string | null;
  from_household?: { name: string };
  to_household?: { name: string };
  requester?: { username: string };
  confirmer?: { username: string };
}

interface HouseholdBalance {
  household_id: string;
  household_name: string;
  total_paid: number;
  share: number;
  balance: number;
}

interface UnsettledDebt {
  from_household_id: string;
  from_household_name: string;
  to_household_id: string;
  to_household_name: string;
  amount: number;
  transaction_ids: string[];
}

export default function SettlementsPage() {
  const supabase = createClient();
  const { currentRoom, loading: roomLoading } = useRoom();

  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [unsettledDebts, setUnsettledDebts] = useState<UnsettledDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserHouseholdId, setCurrentUserHouseholdId] = useState<string | null>(null);

  // Date range filter state
  const [isDateFilterActive, setIsDateFilterActive] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [transactionCount, setTransactionCount] = useState<number>(0);
  const [householdsCount, setHouseholdsCount] = useState<number>(0);

  // Create settlement dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<UnsettledDebt | null>(null);

  const loadSettlements = useCallback(async () => {
    if (!currentRoom) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);

        // Get households that are part of this room
        const { data: roomHouseholds } = await supabase
          .from('room_members')
          .select('household_id')
          .eq('room_id', currentRoom.id)
          .not('household_id', 'is', null);

        const roomHouseholdIds = (roomHouseholds || []).map(h => h.household_id);

        // Get user's household that is in this room
        if (roomHouseholdIds.length > 0) {
          const { data: hmData } = await supabase
            .from('household_members')
            .select('household_id')
            .eq('user_id', user.id)
            .in('household_id', roomHouseholdIds)
            .single();

          if (hmData) {
            setCurrentUserHouseholdId(hmData.household_id);
          }
        }
      }

      // Load settlements for this room
      const { data: settlementsData, error: settlementsError } = await supabase
        .from('settlements')
        .select(`
          *,
          from_household:from_household_id(name),
          to_household:to_household_id(name),
          requester:requested_by(username),
          confirmer:confirmed_by(username)
        `)
        .eq('room_id', currentRoom.id)
        .order('requested_at', { ascending: false });

      if (settlementsError) throw settlementsError;

      setSettlements(settlementsData as unknown as Settlement[] || []);
    } catch (error) {
      console.error('Error loading settlements:', error);
    } finally {
      setLoading(false);
    }
  }, [currentRoom, supabase]);

  const loadUnsettledDebts = useCallback(async () => {
    if (!currentRoom || currentRoom.split_by !== 'HOUSEHOLD') return;

    try {
      // Get unsettled transactions
      let query = supabase
        .from('transactions')
        .select('id, amount, paid_by, date, is_settled')
        .eq('room_id', currentRoom.id)
        .eq('is_deleted', false)
        .eq('is_settled', false);

      if (isDateFilterActive) {
        const startDateStr = format(dateRange.from, 'yyyy-MM-dd');
        const endDateStr = format(dateRange.to, 'yyyy-MM-dd');
        console.log('Loading unsettled debts for date range:', startDateStr, 'to', endDateStr);
        query = query.gte('date', startDateStr).lte('date', endDateStr);
      } else {
        console.log('Loading unsettled debts for ALL TIME');
      }

      const { data: transData, error } = await query;

      console.log('Unsettled transactions found:', transData?.length || 0);

      if (error) throw error;

      // Fetch pending settlements to exclude their transactions
      const { data: pendingSettlements } = await supabase
        .from('settlements')
        .select('transaction_ids')
        .eq('room_id', currentRoom.id)
        .eq('status', 'pending');

      const pendingTransactionIds = new Set<string>();
      (pendingSettlements || []).forEach(s => {
        s.transaction_ids.forEach((id: string) => pendingTransactionIds.add(id));
      });

      // Filter out transactions that are already in pending settlements
      const activeTransactions = (transData || []).filter(t => !pendingTransactionIds.has(t.id));
      console.log('Active transactions after filtering pending:', activeTransactions.length);

      // Set transaction count for display
      setTransactionCount(activeTransactions.length);

      // Get households in this room
      const { data: householdsData } = await supabase
        .from('room_members')
        .select('household_id, households:household_id(name)')
        .eq('room_id', currentRoom.id)
        .not('household_id', 'is', null);

      const households = (householdsData as unknown as { household_id: string; households: { name: string } | null }[]) || [];
      setHouseholdsCount(households.length);

      if (households.length < 2) {
        setUnsettledDebts([]);
        return;
      }

      // Get user to household mapping
      const householdIds = households.map(h => h.household_id);
      const { data: hmData } = await supabase
        .from('household_members')
        .select('household_id, user_id')
        .in('household_id', householdIds);

      const userToHousehold = new Map<string, string>();
      (hmData || []).forEach((item: { household_id: string; user_id: string }) => {
        userToHousehold.set(item.user_id, item.household_id);
      });

      // Calculate what each household paid
      const householdPaid = new Map<string, { total: number; transactionIds: string[] }>();
      households.forEach(h => householdPaid.set(h.household_id, { total: 0, transactionIds: [] }));

      let totalSpent = 0;
      activeTransactions.forEach((t: { id: string; amount: string; paid_by: string; date: string }) => {
        const householdId = userToHousehold.get(t.paid_by);
        if (householdId && householdPaid.has(householdId)) {
          const amt = parseFloat(t.amount);
          totalSpent += amt;
          const hData = householdPaid.get(householdId)!;
          hData.total += amt;
          hData.transactionIds.push(t.id);
        }
      });

      // Calculate share per household
      const sharePerHousehold = totalSpent / households.length;

      // Calculate balances
      const balances: HouseholdBalance[] = households.map(h => {
        const hData = householdPaid.get(h.household_id)!;
        return {
          household_id: h.household_id,
          household_name: h.households?.name || 'Hộ gia đình',
          total_paid: hData.total,
          share: sharePerHousehold,
          balance: hData.total - sharePerHousehold,
        };
      });

      // Calculate debts (who owes whom)
      const debts: UnsettledDebt[] = [];
      const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
      const debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);

      let j = 0;
      const creditorsCopy = creditors.map(c => ({ ...c }));
      const debtorsCopy = debtors.map(d => ({ ...d }));

      for (let i = 0; i < creditorsCopy.length; i++) {
        const creditor = creditorsCopy[i];
        while (creditor.balance > 0.01 && j < debtorsCopy.length) {
          const debtor = debtorsCopy[j];
          const amount = Math.min(creditor.balance, Math.abs(debtor.balance));

          if (amount > 0.01) {
            // Get transaction IDs from ALL households for this month (to mark as settled)
            const allTransactionIds: string[] = [];
            householdPaid.forEach((data) => {
              allTransactionIds.push(...data.transactionIds);
            });

            debts.push({
              from_household_id: debtor.household_id,
              from_household_name: debtor.household_name,
              to_household_id: creditor.household_id,
              to_household_name: creditor.household_name,
              amount: Math.round(amount),
              transaction_ids: allTransactionIds,
            });
          }

          creditor.balance -= amount;
          debtor.balance += amount;

          if (Math.abs(debtor.balance) < 0.01) j++;
        }
      }

      setUnsettledDebts(debts);
    } catch (error) {
      console.error('Error loading unsettled debts:', error);
    }
  }, [currentRoom, supabase, dateRange, isDateFilterActive]);

  // Load settlements when room changes
  useEffect(() => {
    if (currentRoom) {
      setLoading(true);
      loadSettlements();
    }
  }, [currentRoom, loadSettlements]);

  // Reload unsettled debts when parameters change
  useEffect(() => {
    if (currentRoom && currentRoom.split_by === 'HOUSEHOLD') {
      loadUnsettledDebts();
    }
  }, [dateRange, isDateFilterActive, currentRoom, loadUnsettledDebts]);

  const pendingCount = settlements.filter(s => s.status === 'pending').length;
  const confirmedCount = settlements.filter(s => s.status === 'confirmed').length;

  const handleCreateSettlement = (debt: UnsettledDebt) => {
    setSelectedDebt(debt);
    setShowCreateDialog(true);
  };

  const clearDateFilter = () => {
    setIsDateFilterActive(false);
  };

  if (roomLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-48 bg-gray-200 rounded-lg animate-pulse" />
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
      <div className="pt-10 pb-6 px-1 flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-in fade-in slide-in-from-top-4 duration-700">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-black drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)] tracking-tight leading-tight">
            Thanh toán
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {currentRoom ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/5 backdrop-blur-sm text-black/70">
                {currentRoom.type === 'PRIVATE' ? <Briefcase className="w-3.5 h-3.5" /> : <House className="w-3.5 h-3.5" />}
                <span className="text-xs font-black uppercase tracking-widest">{currentRoom.name}</span>
              </div>
            ) : (
              <p className="text-xs font-bold text-gray-400">Chọn không gian để xem thanh toán</p>
            )}
          </div>
        </div>

        {/* Date Range Picker */}
        {currentRoom && currentRoom.split_by === 'HOUSEHOLD' && (
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "h-11 px-4 rounded-xl shadow-sm border-gray-200 hover:border-primary/30 transition-all font-bold gap-2 w-full md:w-auto tap-highlight",
                  !isDateFilterActive ? "text-gray-500" : "text-primary border-primary/20 bg-primary/5"
                )}
              >
                <CalendarIcon className={cn("w-4 h-4", isDateFilterActive ? "text-primary" : "text-gray-400")} />
                <span>
                  {isDateFilterActive 
                    ? `${format(dateRange.from, 'dd/MM/yyyy', { locale: vi })} - ${format(dateRange.to, 'dd/MM/yyyy', { locale: vi })}`
                    : "Toàn bộ thời gian"
                  }
                </span>
                {isDateFilterActive && (
                  <div 
                    className="ml-1 p-0.5 rounded-full hover:bg-primary/10 text-primary/60 hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearDateFilter();
                    }}
                  >
                    <XCircle className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden shadow-2xl border-none" align="end">
              <div className="p-3 bg-white space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-xs font-bold text-gray-500 hover:text-primary hover:bg-primary/5 mb-2"
                  onClick={() => setIsDateFilterActive(false)}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 mr-2" />
                  Xem toàn bộ thời gian
                </Button>
                
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Từ ngày:</p>
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => {
                      if (date) {
                        setDateRange({ ...dateRange, from: date });
                        setIsDateFilterActive(true);
                      }
                    }}
                    locale={vi}
                    className="rounded-xl border border-gray-100"
                  />
                </div>
                <div className="pt-2 border-t border-gray-50">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Đến ngày:</p>
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => {
                      if (date) {
                        setDateRange({ ...dateRange, to: date });
                        setIsDateFilterActive(true);
                      }
                    }}
                    locale={vi}
                    className="rounded-xl border border-gray-100"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {!currentRoom ? (
        <div className="text-center py-20 animate-in fade-in zoom-in-95 duration-700">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ArrowRightLeft className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-gray-500 font-bold mb-4">Chọn không gian để xem thanh toán</p>
          <Button variant="outline" asChild className="rounded-xl border-gray-200">
            <Link href="/rooms">Chọn không gian</Link>
          </Button>
        </div>
      ) : currentRoom.split_by !== 'HOUSEHOLD' ? (
        <div className="text-center py-20 animate-in fade-in zoom-in-95 duration-700">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <House className="w-10 h-10 text-amber-400" />
          </div>
          <p className="text-gray-500 font-bold mb-4">
            Chức năng xác nhận thanh toán chỉ áp dụng cho không gian chia theo hộ gia đình
          </p>
          <p className="text-xs text-gray-400 mb-6">
            Không gian hiện tại đang chia theo người dùng
          </p>
        </div>
      ) : (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <Card className="rounded-2xl border-none shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-amber-500/10 to-amber-500/5 active:scale-[0.98] tap-highlight">
              <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-amber-900">{pendingCount}</p>
                  <p className="text-[10px] sm:text-[11px] font-black text-amber-600/70 uppercase tracking-widest">Đang chờ</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-green-500/10 to-green-500/5 active:scale-[0.98] tap-highlight">
              <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-green-900">{confirmedCount}</p>
                  <p className="text-[10px] sm:text-[11px] font-black text-green-600/70 uppercase tracking-widest">Đã xác nhận</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Unsettled Debts - Action Required */}
          {unsettledDebts.length > 0 && (
            <Card className="rounded-3xl border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-xl shadow-blue-100/50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <CardHeader className="pb-3 px-5 sm:px-6 pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-2.5 bg-blue-500 rounded-xl shadow-lg shadow-blue-200">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg sm:text-xl font-black text-blue-900 tracking-tight">
                        Công nợ {isDateFilterActive 
                          ? `từ ${format(dateRange.from, 'dd/MM/yyyy', { locale: vi })} đến ${format(dateRange.to, 'dd/MM/yyyy', { locale: vi })}`
                          : "toàn bộ thời gian"
                        }
                      </CardTitle>
                      <p className="text-[11px] sm:text-xs font-bold text-blue-700/70 uppercase tracking-wider mt-0.5">
                        {transactionCount} giao dịch chưa thanh toán
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-5 sm:px-6 pb-6 pt-2 space-y-3 sm:space-y-4">
                {unsettledDebts.map((debt, index) => {
                  const isFromCurrentHousehold = debt.from_household_id === currentUserHouseholdId;

                  return (
                    <div
                      key={index}
                      className="bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
                          <div className="px-3 py-1.5 bg-red-100 rounded-lg shrink-0">
                            <span className="text-xs font-black text-red-800 uppercase tracking-wider whitespace-nowrap">
                              {debt.from_household_name}
                            </span>
                          </div>
                          <ArrowRightLeft className="w-4 h-4 text-blue-300 shrink-0" />
                          <div className="px-3 py-1.5 bg-green-100 rounded-lg shrink-0">
                            <span className="text-xs font-black text-green-800 uppercase tracking-wider whitespace-nowrap">
                              {debt.to_household_name}
                            </span>
                          </div>
                        </div>
                        <div className="text-left sm:text-right pl-1 sm:pl-0">
                          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-0.5 sm:hidden">Số tiền cần trả</p>
                          <p className="font-black text-2xl sm:text-3xl text-blue-900 tracking-tighter">
                            {debt.amount.toLocaleString('vi-VN')} <span className="text-sm sm:text-base font-bold text-blue-400">₫</span>
                          </p>
                        </div>
                      </div>

                      {isFromCurrentHousehold && (
                        <Button
                          className="w-full h-12 sm:h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider text-xs shadow-lg shadow-blue-200 active:scale-[0.98] transition-all tap-highlight"
                          onClick={() => handleCreateSettlement(debt)}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Xác nhận đã trả tiền
                        </Button>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Settlement Cards */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 space-y-4">
            <SettlementCard
              settlements={settlements}
              currentUserId={currentUserId}
              currentUserHouseholdId={currentUserHouseholdId}
              onSettlementChanged={() => {
                loadSettlements();
              }}
            />
          </div>

          {/* Empty State */}
          {!loading && (
            <>
              {householdsCount < 2 ? (
                <div className="text-center py-20 bg-amber-50/50 rounded-3xl border border-dashed border-amber-200 animate-in fade-in zoom-in-95 duration-700">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
                    <House className="w-8 h-8 text-amber-600" />
                  </div>
                  <p className="text-sm font-bold text-amber-800 uppercase tracking-widest">
                    Chưa đủ hộ gia đình
                  </p>
                  <p className="text-xs text-amber-600 mt-2 max-w-xs mx-auto">
                    Cần ít nhất 2 hộ gia đình trong không gian này để tính toán công nợ và thanh toán.
                  </p>
                  <Button variant="outline" asChild className="mt-4 border-amber-200 text-amber-700 hover:bg-amber-100">
                    <Link href={`/rooms/${currentRoom.id}`}>Mời thêm hộ gia đình</Link>
                  </Button>
                </div>
              ) : settlements.length === 0 && unsettledDebts.length === 0 ? (
                <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 animate-in fade-in zoom-in-95 duration-700">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    Không có công nợ nào
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Tuyệt vời! Tất cả các khoản chi tiêu đã được thanh toán sòng phẳng.
                  </p>
                </div>
              ) : null}
            </>
          )}
        </>
      )}

      {/* Create Settlement Dialog */}
      {selectedDebt && currentRoom && (
        <CreateSettlementDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          roomId={currentRoom.id}
          fromHouseholdId={selectedDebt.from_household_id}
          fromHouseholdName={selectedDebt.from_household_name}
          toHouseholdId={selectedDebt.to_household_id}
          toHouseholdName={selectedDebt.to_household_name}
          transactionIds={selectedDebt.transaction_ids}
          amount={selectedDebt.amount}
          currentUserId={currentUserId}
          onCreated={() => {
            loadSettlements();
            setSelectedDebt(null);
          }}
        />
      )}
    </div>
  );
}
