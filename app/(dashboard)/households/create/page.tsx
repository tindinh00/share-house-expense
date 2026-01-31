'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function CreateHouseholdPage() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('❌ Vui lòng nhập tên hộ gia đình');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Create household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert({ 
          name: name.trim(),
          created_by: user.id 
        })
        .select()
        .single();

      if (householdError) throw householdError;

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('household_members')
        .insert({
          household_id: household.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      toast.success('Đã tạo hộ gia đình!');
      router.push(`/households/${household.id}`);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('❌ Lỗi: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          ← Quay lại
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Tạo hộ gia đình mới
        </h1>
        <p className="text-gray-600 mt-1">
          Tạo hộ gia đình để chia chi tiêu theo hộ
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin hộ gia đình</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Tên hộ gia đình *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Ví dụ: Gia đình Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
              />
              <p className="text-xs text-gray-500">
                {name.length}/100 ký tự
              </p>
            </div>

            {/* Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Lưu ý:</strong> Sau khi tạo hộ, bạn có thể mời thêm thành viên vào hộ gia đình này.
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
                {submitting ? 'Đang tạo...' : '✓ Tạo hộ gia đình'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
