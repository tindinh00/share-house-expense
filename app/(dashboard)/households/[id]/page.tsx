'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface HouseholdDetails {
  id: string;
  name: string;
  created_at: string;
}

interface Member {
  id: string;
  user_id: string;
  role: 'owner' | 'member';
  profiles: {
    username: string;
    email: string;
  };
}

export default function HouseholdDetailPage() {
  const router = useRouter();
  const params = useParams();
  const householdId = params.id as string;
  const supabase = createClient();

  const [household, setHousehold] = useState<HouseholdDetails | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [editName, setEditName] = useState('');
  const [editing, setEditing] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    loadHouseholdDetails();
  }, [householdId]);

  const loadHouseholdDetails = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUserId(user.id);

      // Load household details
      const { data: householdData, error: householdError } = await supabase
        .from('households')
        .select('*')
        .eq('id', householdId)
        .single();

      if (householdError) throw householdError;
      setHousehold(householdData);
      setEditName(householdData.name);

      // Load members
      const { data: membersData, error: membersError } = await supabase
        .from('household_members')
        .select(`
          id,
          user_id,
          role,
          profiles:user_id (username, email)
        `)
        .eq('household_id', householdId);

      if (membersError) throw membersError;
      setMembers((membersData as any) || []);

      // Check if current user is owner
      const userMember = (membersData as any)?.find((m: any) => m.user_id === user.id);
      setIsOwner(userMember?.role === 'owner');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('❌ Không thể tải thông tin hộ gia đình');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!editName.trim()) {
      toast.error('❌ Tên không được rỗng');
      return;
    }

    setEditing(true);
    try {
      const { error } = await supabase
        .from('households')
        .update({ name: editName.trim() })
        .eq('id', householdId);

      if (error) throw error;

      toast.success('✅ Đã cập nhật tên');
      loadHouseholdDetails();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('❌ Lỗi: ' + error.message);
    } finally {
      setEditing(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('❌ Vui lòng nhập email');
      return;
    }

    setInviting(true);
    try {
      // Find user by email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', inviteEmail.trim().toLowerCase())
        .single();

      if (profileError || !profiles) {
        toast.error('❌ Không tìm thấy người dùng với email này');
        setInviting(false);
        return;
      }

      // Check if already member
      const existing = members.find(m => m.user_id === profiles.id);
      if (existing) {
        toast.error('❌ Người dùng đã là thành viên');
        setInviting(false);
        return;
      }

      // Add member
      const { error: memberError } = await supabase
        .from('household_members')
        .insert({
          household_id: householdId,
          user_id: profiles.id,
          role: 'member',
        });

      if (memberError) throw memberError;

      toast.success('✅ Đã mời thành công!');
      setInviteEmail('');
      loadHouseholdDetails();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('❌ Lỗi: ' + error.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, userId: string) => {
    if (userId === currentUserId) {
      toast.error('❌ Không thể xóa chính mình');
      return;
    }

    try {
      const { error } = await supabase
        .from('household_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('✅ Đã xóa thành viên');
      loadHouseholdDetails();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('❌ Lỗi: ' + error.message);
    }
  };

  const handleDeleteHousehold = async () => {
    try {
      const { error } = await supabase
        .from('households')
        .delete()
        .eq('id', householdId);

      if (error) throw error;

      toast.success('✅ Đã xóa hộ gia đình');
      router.push('/households');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('❌ Lỗi: ' + error.message);
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

  if (!household) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Không tìm thấy hộ gia đình</p>
        <Button onClick={() => router.push('/households')} className="mt-4">
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          ← Quay lại
        </Button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-3xl">👨‍👩‍👧‍👦</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{household.name}</h1>
              <p className="text-gray-600 mt-1">
                {members.length} thành viên
              </p>
            </div>
          </div>
          {isOwner && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded">
              Chủ hộ
            </span>
          )}
        </div>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Cài đặt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="householdName">Tên hộ gia đình</Label>
            <div className="flex gap-2">
              <Input
                id="householdName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={!isOwner}
                maxLength={100}
              />
              {isOwner && (
                <Button
                  onClick={handleUpdateName}
                  disabled={editing || editName === household.name}
                >
                  {editing ? 'Đang lưu...' : 'Lưu'}
                </Button>
              )}
            </div>
          </div>

          {isOwner && (
            <div className="pt-4 border-t">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    🗑️ Xóa hộ gia đình
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận xóa hộ gia đình</AlertDialogTitle>
                    <AlertDialogDescription>
                      Hành động này sẽ xóa vĩnh viễn hộ gia đình và tất cả thành viên. 
                      Bạn có chắc chắn muốn tiếp tục?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteHousehold}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Xác nhận xóa
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Thành viên ({members.length})</CardTitle>
            {isOwner && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <span className="mr-2">➕</span>
                    Mời thành viên
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Mời thành viên mới</DialogTitle>
                    <DialogDescription>
                      Nhập email của người bạn muốn mời vào hộ gia đình này
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-3 justify-end">
                      <DialogTrigger asChild>
                        <Button variant="outline">Hủy</Button>
                      </DialogTrigger>
                      <Button onClick={handleInvite} disabled={inviting}>
                        {inviting ? 'Đang mời...' : 'Gửi lời mời'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="font-medium text-blue-700">
                      {member.profiles.username?.[0]?.toUpperCase() || 
                       member.profiles.email?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.profiles.username || 'User'}
                      {member.user_id === currentUserId && (
                        <span className="ml-2 text-xs text-green-600">(Bạn)</span>
                      )}
                      {member.role === 'owner' && (
                        <span className="ml-2 text-xs text-blue-600">(Chủ hộ)</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">{member.profiles.email}</p>
                  </div>
                </div>
                {isOwner && member.user_id !== currentUserId && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        Xóa
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa thành viên</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc chắn muốn xóa thành viên này khỏi hộ gia đình?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveMember(member.id, member.user_id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Xóa
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
