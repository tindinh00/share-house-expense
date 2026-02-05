'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useCallback } from 'react';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_system?: boolean;
  created_by?: string | null;
  room_id?: string | null;
}

interface Transaction {
  id: string;
  date: string;
  amount: number;
  note: string;
  category_id: string;
  paid_by: string;
  room_id: string;
  created_by: string;
}

export default function EditTransactionPage() {
  const router = useRouter();
  const params = useParams();
  const transactionId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  // Form state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Load transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (transactionError) throw transactionError;

      // Check if user owns this transaction
      if (transactionData.created_by !== user.id) {
        toast.error('❌ Bạn không có quyền sửa giao dịch này');
        router.push('/transactions');
        return;
      }

      setTransaction(transactionData);
      setDate(transactionData.date);
      setSelectedDate(new Date(transactionData.date));
      setAmount(transactionData.amount.toString());
      setNote(transactionData.note);
      setCategoryId(transactionData.category_id);

      // Load categories với logic mới
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('is_system', { ascending: false })
        .order('name');

      // Filter categories theo logic:
      // - System categories (is_system = true)
      // - Personal categories (created_by = user.id, room_id = null)
      // - Room categories (room_id = transaction.room_id)
      const filtered = (categoriesData || []).filter(cat => {
        if (cat.is_system) return true;
        if (cat.created_by === user.id && !cat.room_id) return true;
        if (cat.room_id === transactionData.room_id) return true;
        return false;
      });

      setCategories(filtered);
    } catch (error: unknown) {
      console.error('Error:', error);
      toast.error('❌ Không thể tải giao dịch');
      router.push('/transactions');
    } finally {
      setLoading(false);
    }
  }, [supabase, transactionId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !amount || !note || !categoryId) {
      toast.error('❌ Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (!transaction) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          date: format(selectedDate, 'yyyy-MM-dd'),
          amount: parseFloat(amount),
          note: note.trim(),
          category_id: categoryId,
        })
        .eq('id', transactionId);

      if (error) throw error;

      toast.success('Đã cập nhật giao dịch!');
      router.push('/transactions');
    } catch (error: unknown) {
      console.error('Error:', error);
      const message = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      toast.error('❌ Lỗi: ' + message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Không tìm thấy giao dịch</p>
        <Button onClick={() => router.push('/transactions')} className="mt-4">
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 overflow-hidden pb-8 w-full px-2 sm:px-0">
      {/* Header */}
      <div className="px-1">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 -ml-2"
        >
          ← Quay lại
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">
          Sửa giao dịch
        </h1>
        <p className="text-gray-600 mt-1 truncate">
          Cập nhật thông tin giao dịch
        </p>
      </div>

      {/* Form */}
      <Card className="overflow-hidden w-full">
        <CardHeader className="px-4 md:px-6">
          <CardTitle>Thông tin giao dịch</CardTitle>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Date */}
            <div className="space-y-2">
              <Label>Ngày chi tiêu</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-12"
                  >
                    <span className="mr-2">📅</span>
                    {format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Số tiền (VNĐ)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="100000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="h-12 text-lg font-medium"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Danh mục</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 max-h-72 overflow-y-auto p-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setCategoryId(category.id)}
                    className={`p-3 sm:p-4 border-2 rounded-xl transition flex flex-col items-center gap-1 sm:gap-2 ${
                      categoryId === category.id
                        ? 'border-green-600 bg-green-50 shadow-sm'
                        : 'border-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl">{category.icon}</span>
                    <span className="text-xs sm:text-sm font-medium truncate w-full text-center">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">Ghi chú</Label>
              <Textarea
                id="note"
                placeholder="Ví dụ: Tiền điện tháng 12"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                required
                maxLength={200}
              />
              <p className="text-xs text-gray-500">
                {note.length}/200 ký tự
              </p>
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? 'Đang lưu...' : '💾 Lưu thay đổi'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
