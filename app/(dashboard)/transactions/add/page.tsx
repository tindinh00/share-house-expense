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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  icon: string;
}

export default function AddTransactionPage() {
  const router = useRouter();
  const supabase = createClient();
  const { currentRoom, loading: roomLoading } = useRoom();
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    amount: '',
    note: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (data) {
      setCategories(data);
      // Set default category
      if (data.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: data[0].id }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('❌ Vui lòng đăng nhập');
        router.push('/login');
        return;
      }

      // Validate amount
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('❌ Số tiền phải lớn hơn 0');
        setLoading(false);
        return;
      }

      if (amount > 1000000000) {
        toast.error('❌ Số tiền quá lớn');
        setLoading(false);
        return;
      }

      // Validate note
      if (!formData.note.trim()) {
        toast.error('❌ Vui lòng nhập ghi chú');
        setLoading(false);
        return;
      }

      // Check if current room exists
      if (!currentRoom) {
        toast.error('❌ Vui lòng chọn không gian');
        setLoading(false);
        return;
      }

      // Insert transaction
      const { error } = await supabase.from('transactions').insert({
        amount,
        note: formData.note.trim(),
        date: formData.date,
        category_id: formData.category_id,
        room_id: currentRoom.id,
        paid_by: user.id,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success('✅ Đã thêm giao dịch!');
      router.push('/transactions');
      router.refresh();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('❌ Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          ← Quay lại
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Thêm giao dịch mới</h1>
        <p className="text-gray-600 mt-1">Ghi lại chi tiêu của bạn</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin giao dịch</CardTitle>
          {currentRoom && (
            <p className="text-sm text-gray-600 mt-1">
              Thêm vào: <span className="font-medium text-green-600">
                {currentRoom.type === 'PRIVATE' ? '💼' : '🏠'} {currentRoom.name}
              </span>
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Số tiền *</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder="100000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="text-2xl font-bold pr-12"
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-normal text-base">
                  ₫
                </span>
              </div>
              {formData.amount && parseFloat(formData.amount) > 0 && (
                <p className="text-sm text-green-600 font-medium">
                  {formatCurrency(parseFloat(formData.amount))}
                </p>
              )}
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">Ghi chú *</Label>
              <Textarea
                id="note"
                placeholder="VD: Tiền điện tháng 12"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                required
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-gray-500">
                {formData.note.length}/200 ký tự
              </p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Danh mục *</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat.icon}</span>
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Ngày chi tiêu *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
                disabled={loading}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.amount || !formData.note.trim()}
                className="flex-1"
              >
                {loading ? 'Đang lưu...' : '💾 Lưu giao dịch'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
