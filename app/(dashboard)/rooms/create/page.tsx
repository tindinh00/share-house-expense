'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRoom } from '@/contexts/RoomContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function CreateRoomPage() {
  const router = useRouter();
  const supabase = createClient();
  const { refreshRooms } = useRoom();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'PRIVATE' as 'SHARED' | 'PRIVATE',
    split_by: 'USER' as 'USER' | 'HOUSEHOLD',
  });

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

      // Validate name
      if (!formData.name.trim()) {
        toast.error('❌ Vui lòng nhập tên không gian');
        setLoading(false);
        return;
      }

      if (formData.name.length > 50) {
        toast.error('❌ Tên không gian quá dài (tối đa 50 ký tự)');
        setLoading(false);
        return;
      }

      // Create room
      const { data: newRoom, error: roomError } = await supabase
        .from('rooms')
        .insert({
          name: formData.name.trim(),
          type: formData.type,
          split_by: formData.split_by,
          created_by: user.id,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add creator as member
      const { error: memberError } = await supabase
        .from('room_members')
        .insert({
          room_id: newRoom.id,
          user_id: user.id,
        });

      if (memberError) throw memberError;

      toast.success('Đã tạo không gian mới!');
      
      // Refresh rooms list
      await refreshRooms();
      
      router.push('/rooms');
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
        <h1 className="text-2xl font-bold text-gray-900">Tạo không gian mới</h1>
        <p className="text-gray-600 mt-1">
          Tạo không gian để quản lý chi tiêu riêng hoặc chia sẻ
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Room Name */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên không gian *</Label>
              <Input
                id="name"
                placeholder="VD: Nhà chung, Ví cá nhân, Phòng 101"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                maxLength={50}
                autoFocus
              />
              <p className="text-xs text-gray-500">
                {formData.name.length}/50 ký tự
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Room Type */}
        <Card>
          <CardHeader>
            <CardTitle>Loại không gian</CardTitle>
            <CardDescription>
              Chọn loại không gian phù hợp với nhu cầu của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={formData.type}
              onValueChange={(value: 'SHARED' | 'PRIVATE') => 
                setFormData({ ...formData, type: value })
              }
            >
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="PRIVATE" id="private" />
                  <div className="flex-1">
                    <Label htmlFor="private" className="cursor-pointer">
                      <div className="flex items-center gap-2 font-medium">
                        <span className="text-xl">💼</span>
                        <span>Riêng tư</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Chỉ bạn quản lý. Phù hợp cho chi tiêu cá nhân.
                      </p>
                    </Label>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="SHARED" id="shared" />
                  <div className="flex-1">
                    <Label htmlFor="shared" className="cursor-pointer">
                      <div className="flex items-center gap-2 font-medium">
                        <span className="text-xl">🏠</span>
                        <span>Chia sẻ</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Nhiều người cùng quản lý. Phù hợp cho nhà chung, phòng trọ.
                      </p>
                    </Label>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Split By (only for SHARED) */}
        {formData.type === 'SHARED' && (
          <Card>
            <CardHeader>
              <CardTitle>Cách chia chi tiêu</CardTitle>
              <CardDescription>
                Chọn cách tính toán quyết toán
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={formData.split_by}
                onValueChange={(value: 'USER' | 'HOUSEHOLD') => 
                  setFormData({ ...formData, split_by: value })
                }
              >
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="USER" id="user" />
                    <div className="flex-1">
                      <Label htmlFor="user" className="cursor-pointer">
                        <div className="font-medium">Theo người dùng</div>
                        <p className="text-sm text-gray-600 mt-1">
                          Mỗi người tự tính riêng. VD: A nợ B 100k, B nợ C 50k.
                        </p>
                      </Label>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="HOUSEHOLD" id="household" />
                    <div className="flex-1">
                      <Label htmlFor="household" className="cursor-pointer">
                        <div className="font-medium">Theo hộ gia đình</div>
                        <p className="text-sm text-gray-600 mt-1">
                          Tính theo nhóm/hộ. VD: Hộ A nợ Hộ B 200k.
                        </p>
                      </Label>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <div className="flex gap-3">
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
            disabled={loading || !formData.name.trim()}
            className="flex-1"
          >
            {loading ? 'Đang tạo...' : '✨ Tạo không gian'}
          </Button>
        </div>
      </form>
    </div>
  );
}
