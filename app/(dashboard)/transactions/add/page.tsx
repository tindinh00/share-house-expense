'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRoom } from '@/contexts/RoomContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useCallback } from 'react';
import { ArrowLeft, CalendarIcon, Save, Loader2, Sparkles } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string;
  is_system?: boolean;
  created_by?: string | null;
  room_id?: string | null;
}

export default function AddTransactionPage() {
  const router = useRouter();
  const supabase = createClient();
  const { currentRoom, loading: roomLoading } = useRoom();
  
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    amount: '',
    note: '',
    category_id: '',
  });

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setCategoriesLoading(false);
      return;
    }

    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('is_system', { ascending: false })
      .order('name');
    
    if (data) {
      const filtered = data.filter(cat => {
        if (cat.is_system) return true;
        if (cat.created_by === user.id && !cat.room_id) return true;
        if (currentRoom && cat.room_id === currentRoom.id) return true;
        return false;
      });

      setCategories(filtered);
      // Only set default category if none is selected yet
      setFormData(prev => {
        if (!prev.category_id && filtered.length > 0) {
          return { ...prev, category_id: filtered[0].id };
        }
        return prev;
      });
    }
    setCategoriesLoading(false);
  }, [supabase, currentRoom]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Vui lòng đăng nhập');
        router.push('/login');
        return;
      }

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Số tiền phải lớn hơn 0');
        setLoading(false);
        return;
      }

      if (amount > 1000000000) {
        toast.error('Số tiền quá lớn');
        setLoading(false);
        return;
      }

      const note = formData.note.trim();
      if (!note) {
        toast.error('Vui lòng nhập ghi chú');
        setLoading(false);
        return;
      }

      if (!currentRoom) {
        toast.error('Vui lòng chọn không gian');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('transactions').insert({
        amount,
        note,
        date: format(selectedDate, 'yyyy-MM-dd'),
        category_id: formData.category_id,
        room_id: currentRoom.id,
        paid_by: user.id,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success('✅ Đã thêm giao dịch!');
      router.push('/transactions');
    } catch (error: unknown) {
      console.error('Error:', error);
      const message = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      toast.error('❌ Lỗi: ' + message);
    } finally {
      setLoading(false);
    }
  };

  if (roomLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-8 w-full px-2 sm:px-0">
        <div className="px-1">
          <div className="w-24 h-10 bg-gray-200 rounded-xl animate-pulse mb-4" />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="flex-1">
              <div className="w-48 h-8 bg-gray-200 rounded-lg animate-pulse mb-2" />
              <div className="w-32 h-4 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-6">
          <div className="space-y-2">
            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          </div>
          <div className="flex gap-3 pt-6">
            <div className="flex-[0.8] h-12 bg-gray-100 rounded-xl animate-pulse" />
            <div className="flex-[1.5] h-14 bg-primary/20 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-8 w-full px-2 sm:px-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="px-1">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 -ml-2 gap-2 hover:gap-3 transition-all tap-highlight"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </Button>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Thêm giao dịch mới</h1>
            <p className="text-sm text-gray-500 font-medium">Ghi lại chi tiêu của bạn</p>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden w-full border-gray-100 shadow-xl shadow-gray-200/50 rounded-3xl">
        <CardHeader className="px-4 md:px-6 pb-4 bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="text-lg font-black tracking-tight">Thông tin giao dịch</CardTitle>
          {currentRoom && (
            <p className="text-xs text-gray-500 mt-1 font-medium">
              Thêm vào: <span className="font-black text-primary">
                {currentRoom.name}
              </span>
            </p>
          )}
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-6 pt-6">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-black text-gray-700 uppercase tracking-wider">Số tiền *</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder="100,000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="h-16 text-3xl font-black pr-16 border-2 border-gray-200 focus:border-primary rounded-2xl"
                  autoFocus
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">
                  ₫
                </span>
              </div>
              {formData.amount && parseFloat(formData.amount) > 0 && (
                <p className="text-sm text-primary font-bold animate-in fade-in slide-in-from-top-1 duration-300">
                  {formatCurrency(parseFloat(formData.amount))}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-3">
              <Label className="text-sm font-black text-gray-700 uppercase tracking-wider">Danh mục *</Label>
              {categoriesLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 max-h-80 overflow-y-auto p-1 custom-scrollbar">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, category_id: cat.id })}
                      className={`p-4 border-2 rounded-2xl transition-all duration-300 flex flex-col items-center gap-2 hover:scale-105 active:scale-95 ${
                        formData.category_id === cat.id
                          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-105'
                          : 'border-gray-100 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <span className="text-3xl">{cat.icon}</span>
                      <span className="text-xs font-bold truncate w-full text-center uppercase tracking-tighter text-gray-700">{cat.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note" className="text-sm font-black text-gray-700 uppercase tracking-wider">Ghi chú *</Label>
              <Textarea
                id="note"
                placeholder="VD: Tiền điện tháng 12"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                required
                rows={3}
                maxLength={200}
                className="border-2 border-gray-200 focus:border-primary rounded-2xl resize-none"
              />
              <p className="text-xs text-gray-400 font-bold">
                {formData.note.length}/200 ký tự
              </p>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label className="text-sm font-black text-gray-700 uppercase tracking-wider">Ngày chi tiêu *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-bold h-14 border-2 border-gray-200 hover:border-primary rounded-2xl gap-3"
                  >
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    <span className="text-gray-700">{format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi })}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                    initialFocus
                    locale={vi}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-6 border-t-2 border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-[0.8] h-12 rounded-xl border-2 font-bold hover:bg-gray-50 tap-highlight"
                disabled={loading}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.amount || !formData.note.trim()}
                className="flex-[1.5] h-14 rounded-xl font-black text-base shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all gap-2 tap-highlight"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Lưu giao dịch</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
