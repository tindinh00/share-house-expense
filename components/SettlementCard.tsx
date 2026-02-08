'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  ArrowRight, 
  Check, 
  X, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Send,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

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
  // Joined data
  from_household?: { name: string };
  to_household?: { name: string };
  requester?: { username: string };
  confirmer?: { username: string };
}

interface SettlementCardProps {
  settlements: Settlement[];
  currentUserId: string;
  currentUserHouseholdId: string | null;
  onSettlementChanged: () => void;
}

export function SettlementCard({ 
  settlements, 
  currentUserId, 
  currentUserHouseholdId,
  onSettlementChanged 
}: SettlementCardProps) {
  const supabase = createClient();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);

  const pendingSettlements = settlements.filter(s => s.status === 'pending');
  const confirmedSettlements = settlements.filter(s => s.status === 'confirmed');
  const rejectedSettlements = settlements.filter(s => s.status === 'rejected');

  const handleConfirm = async (settlement: Settlement) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('settlements')
        .update({
          status: 'confirmed',
          confirmed_by: currentUserId,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', settlement.id);

      if (error) throw error;

      toast.success('Đã xác nhận thanh toán!');
      onSettlementChanged();
    } catch (error) {
      console.error('Error confirming settlement:', error);
      toast.error('Có lỗi xảy ra khi xác nhận');
    } finally {
      setLoading(false);
      setConfirmingId(null);
    }
  };

  const handleReject = async (settlement: Settlement) => {
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('settlements')
        .update({
          status: 'rejected',
          rejected_reason: rejectReason.trim(),
          confirmed_by: currentUserId,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', settlement.id);

      if (error) throw error;

      toast.success('Đã từ chối yêu cầu thanh toán');
      onSettlementChanged();
    } catch (error) {
      console.error('Error rejecting settlement:', error);
      toast.error('Có lỗi xảy ra khi từ chối');
    } finally {
      setLoading(false);
      setRejectingId(null);
      setRejectReason('');
    }
  };

  const canConfirmOrReject = (settlement: Settlement) => {
    return currentUserHouseholdId === settlement.to_household_id && settlement.status === 'pending';
  };

  const isRequester = (settlement: Settlement) => {
    return currentUserHouseholdId === settlement.from_household_id;
  };

  if (settlements.length === 0) {
    return null;
  }

  return (
    <>
      {/* Pending Settlements - Needs Action */}
      {pendingSettlements.length > 0 && (
        <Card className="rounded-2xl sm:rounded-3xl border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg sm:shadow-xl shadow-amber-100/50 overflow-hidden">
          <CardHeader className="pb-3 px-5 sm:px-6 pt-5 sm:pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 bg-amber-500 rounded-xl shadow-lg shadow-amber-200">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl font-black text-amber-900 tracking-tight">
                  Yêu cầu chờ xử lý
                </CardTitle>
                <p className="text-[11px] sm:text-xs font-bold text-amber-700/70 uppercase tracking-wider mt-0.5">
                  {pendingSettlements.length} yêu cầu đang chờ
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 sm:px-6 pb-6 pt-2 space-y-3 sm:space-y-4">
            {pendingSettlements.map((settlement) => (
              <div
                key={settlement.id}
                className="bg-white/80 backdrop-blur-sm border border-amber-200/50 rounded-2xl p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
                    <div className="px-3 py-1.5 bg-amber-100 rounded-lg shrink-0">
                      <span className="text-xs font-black text-amber-800 uppercase tracking-wider whitespace-nowrap">
                        {settlement.from_household?.name || 'Hộ gửi'}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="px-3 py-1.5 bg-green-100 rounded-lg shrink-0">
                      <span className="text-xs font-black text-green-800 uppercase tracking-wider whitespace-nowrap">
                        {settlement.to_household?.name || 'Hộ nhận'}
                      </span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right pl-1 sm:pl-0">
                    <p className="font-black text-2xl sm:text-3xl text-amber-900 tracking-tighter">
                      {settlement.amount.toLocaleString('vi-VN')} <span className="text-sm sm:text-base font-bold text-amber-500">₫</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-amber-700/70 pt-1 border-t border-amber-100/50">
                  <span className="font-bold flex items-center gap-1">
                    <span className="bg-amber-100 px-1.5 py-0.5 rounded text-[10px] uppercase font-black text-amber-800">{settlement.requester?.username}</span>
                    <span>• {format(new Date(settlement.requested_at), 'dd/MM HH:mm', { locale: vi })}</span>
                  </span>
                  <span className="font-black uppercase tracking-wider bg-white/50 px-2 py-1 rounded-lg border border-amber-100">
                    {settlement.transaction_ids.length} giao dịch
                  </span>
                </div>

                {settlement.note && (
                  <div className="text-xs text-amber-800 bg-amber-100/50 px-3 py-2.5 rounded-xl italic border border-amber-100">
                    "{settlement.note}"
                  </div>
                )}

                {canConfirmOrReject(settlement) && (
                  <div className="flex gap-3 pt-1">
                    <Button
                      className="flex-1 h-12 sm:h-11 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-wider text-xs shadow-lg shadow-green-200 active:scale-[0.98] transition-all tap-highlight"
                      onClick={() => setConfirmingId(settlement.id)}
                      disabled={loading}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Xác nhận
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-12 sm:h-11 rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-black uppercase tracking-wider text-xs active:scale-[0.98] transition-all"
                      onClick={() => setRejectingId(settlement.id)}
                      disabled={loading}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Từ chối
                    </Button>
                  </div>
                )}

                {isRequester(settlement) && (
                  <div className="flex items-center gap-2 pt-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl border border-amber-100/50">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="font-bold">Đang chờ xác nhận...</span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Confirmed Settlements */}
      {confirmedSettlements.length > 0 && (
        <Card className="rounded-2xl sm:rounded-3xl border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg sm:shadow-xl shadow-green-100/50 overflow-hidden">
          <CardHeader className="pb-3 px-5 sm:px-6 pt-5 sm:pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 bg-green-500 rounded-xl shadow-lg shadow-green-200">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl font-black text-green-900 tracking-tight">
                  Đã thanh toán
                </CardTitle>
                <p className="text-[11px] sm:text-xs font-bold text-green-700/70 uppercase tracking-wider mt-0.5">
                  {confirmedSettlements.length} yêu cầu đã xác nhận
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 sm:px-6 pb-6 pt-2 space-y-2 sm:space-y-3">
            {confirmedSettlements.slice(0, 3).map((settlement) => (
              <div
                key={settlement.id}
                className="flex items-center justify-between bg-white/60 backdrop-blur-sm border border-green-200/50 rounded-xl p-3 sm:p-4 shadow-sm"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xs sm:text-sm font-bold text-green-800">
                    {settlement.from_household?.name}
                  </span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                  <span className="text-xs sm:text-sm font-bold text-green-800">
                    {settlement.to_household?.name}
                  </span>
                </div>
                <span className="font-black text-green-800 text-sm sm:text-base">
                  {settlement.amount.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            ))}
            {confirmedSettlements.length > 3 && (
              <p className="text-xs text-center font-bold text-green-600 pt-2 uppercase tracking-wide">
                Xem thêm {confirmedSettlements.length - 3} thanh toán khác
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rejected Settlements */}
      {rejectedSettlements.length > 0 && (
        <Card className="rounded-2xl sm:rounded-3xl border-red-200 bg-gradient-to-br from-red-50 to-rose-50 shadow-lg sm:shadow-xl shadow-red-100/50 overflow-hidden">
          <CardHeader className="pb-3 px-5 sm:px-6 pt-5 sm:pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 bg-red-500 rounded-xl shadow-lg shadow-red-200">
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl font-black text-red-900 tracking-tight">
                  Bị từ chối
                </CardTitle>
                <p className="text-[11px] sm:text-xs font-bold text-red-700/70 uppercase tracking-wider mt-0.5">
                  {rejectedSettlements.length} yêu cầu bị từ chối
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 sm:px-6 pb-6 pt-2 space-y-2 sm:space-y-3">
            {rejectedSettlements.slice(0, 2).map((settlement) => (
              <div
                key={settlement.id}
                className="bg-white/60 backdrop-blur-sm border border-red-200/50 rounded-xl p-3 sm:p-4 space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold text-red-800">
                    {settlement.from_household?.name} → {settlement.to_household?.name}
                  </span>
                  <span className="font-black text-red-800 text-sm sm:text-base">
                    {settlement.amount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                {settlement.rejected_reason && (
                  <div className="text-xs text-red-600 italic bg-red-50 px-2 py-1.5 rounded-lg border border-red-100">
                    Lý do: "{settlement.rejected_reason}"
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Confirm Dialog */}
      <Dialog open={!!confirmingId} onOpenChange={() => setConfirmingId(null)}>
        <DialogContent className="rounded-3xl w-[90%] sm:w-full tracking-tight">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Xác nhận đã nhận tiền?</DialogTitle>
            <DialogDescription>
              Bạn xác nhận đã nhận được tiền từ hộ gia đình. Các giao dịch liên quan sẽ được đánh dấu đã thanh toán.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 flex-col-reverse sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setConfirmingId(null)}
              disabled={loading}
              className="rounded-xl h-11 sm:h-10 mt-2 sm:mt-0"
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                const settlement = settlements.find(s => s.id === confirmingId);
                if (settlement) handleConfirm(settlement);
              }}
              disabled={loading}
              className="rounded-xl h-11 sm:h-10 bg-green-600 hover:bg-green-700 font-bold"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectingId} onOpenChange={() => { setRejectingId(null); setRejectReason(''); }}>
        <DialogContent className="rounded-3xl w-[90%] sm:w-full tracking-tight">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">Từ chối yêu cầu thanh toán</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối để thông báo cho người gửi.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Lý do từ chối (VD: Chưa nhận được tiền)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="rounded-xl h-12 my-4"
          />
          <DialogFooter className="gap-2 sm:gap-2 flex-col-reverse sm:flex-row">
            <Button
              variant="outline"
              onClick={() => { setRejectingId(null); setRejectReason(''); }}
              disabled={loading}
              className="rounded-xl h-11 sm:h-10 mt-2 sm:mt-0"
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const settlement = settlements.find(s => s.id === rejectingId);
                if (settlement) handleReject(settlement);
              }}
              disabled={loading || !rejectReason.trim()}
              className="rounded-xl h-11 sm:h-10 font-bold"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <X className="w-4 h-4 mr-2" />}
              Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface CreateSettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  fromHouseholdId: string;
  fromHouseholdName: string;
  toHouseholdId: string;
  toHouseholdName: string;
  transactionIds: string[];
  amount: number;
  currentUserId: string;
  onCreated: () => void;
}

export function CreateSettlementDialog({
  open,
  onOpenChange,
  roomId,
  fromHouseholdId,
  fromHouseholdName,
  toHouseholdId,
  toHouseholdName,
  transactionIds,
  amount,
  currentUserId,
  onCreated,
}: CreateSettlementDialogProps) {
  const supabase = createClient();
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('settlements').insert({
        room_id: roomId,
        from_household_id: fromHouseholdId,
        to_household_id: toHouseholdId,
        transaction_ids: transactionIds,
        amount: amount,
        status: 'pending',
        requested_by: currentUserId,
        note: note.trim() || null,
      });

      if (error) throw error;

      toast.success('Đã gửi yêu cầu xác nhận thanh toán!');
      onCreated();
      onOpenChange(false);
      setNote('');
    } catch (error) {
      console.error('Error creating settlement:', error);
      toast.error('Có lỗi xảy ra khi gửi yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Xác nhận đã trả tiền</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Gửi yêu cầu xác nhận đến hộ gia đình nhận tiền
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-center gap-4">
            <div className="px-4 py-2 bg-blue-100 rounded-xl">
              <span className="text-sm font-black text-blue-800 uppercase tracking-wider">
                {fromHouseholdName}
              </span>
            </div>
            <Send className="w-5 h-5 text-gray-400" />
            <div className="px-4 py-2 bg-green-100 rounded-xl">
              <span className="text-sm font-black text-green-800 uppercase tracking-wider">
                {toHouseholdName}
              </span>
            </div>
          </div>

          <div className="text-center py-4">
            <p className="text-3xl font-black text-gray-900 tracking-tighter">
              {amount.toLocaleString('vi-VN')} <span className="text-xl">₫</span>
            </p>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">
              {transactionIds.length} giao dịch
            </p>
          </div>

          <Input
            placeholder="Ghi chú (tùy chọn)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="rounded-xl h-12"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="rounded-xl"
          >
            Hủy
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading}
            className="rounded-xl bg-primary"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Gửi yêu cầu xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
