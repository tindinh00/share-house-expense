'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRoom } from '@/contexts/RoomContext';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface RoomDetails {
  id: string;
  name: string;
  type: 'SHARED' | 'PRIVATE';
  split_by: 'USER' | 'HOUSEHOLD';
  created_by: string;
  created_at: string;
}

interface Member {
  id: string;
  user_id: string;
  created_at: string;
  profiles: {
    username: string;
    email: string;
  };
}

interface HouseholdMember {
  id: string;
  household_id: string;
  created_at: string;
  households: {
    name: string;
  };
  member_count?: number;
}

interface HouseholdMemberDetail {
  id: string;
  user_id: string;
  role: 'OWNER' | 'MEMBER';
  profiles: {
    username: string;
    email: string;
  };
}

export default function RoomDetailPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;
  const supabase = createClient();
  const { refreshRooms, currentRoom, setCurrentRoom } = useRoom();

  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);
  const [userHouseholds, setUserHouseholds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedHouseholdId, setSelectedHouseholdId] = useState('');
  const [inviting, setInviting] = useState(false);
  const [editName, setEditName] = useState('');
  const [editing, setEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [selectedHousehold, setSelectedHousehold] = useState<HouseholdMember | null>(null);
  const [householdDetails, setHouseholdDetails] = useState<HouseholdMemberDetail[]>([]);
  const [loadingHouseholdDetails, setLoadingHouseholdDetails] = useState(false);
  const [editHouseholdName, setEditHouseholdName] = useState('');
  const [editingHousehold, setEditingHousehold] = useState(false);
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    loadRoomDetails();
  }, [roomId]);

  const loadRoomDetails = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUserId(user.id);

      // Load room details
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;
      setRoom(roomData);
      setEditName(roomData.name);

      // Load based on split_by
      if (roomData.split_by === 'HOUSEHOLD') {
        // Load household members
        const { data: householdData, error: householdError } = await supabase
          .from('room_members')
          .select(`
            id,
            household_id,
            created_at,
            households:household_id (name)
          `)
          .eq('room_id', roomId)
          .not('household_id', 'is', null);

        if (householdError) throw householdError;

        // Get member counts for each household
        const householdsWithCounts = await Promise.all(
          (householdData || []).map(async (hm: any) => {
            const { count } = await supabase
              .from('household_members')
              .select('*', { count: 'exact', head: true })
              .eq('household_id', hm.household_id);

            return {
              ...hm,
              member_count: count || 0,
            };
          })
        );

        setHouseholdMembers(householdsWithCounts);

        // Load all households for invite dropdown (not just user's households)
        const { data: allHouseholds } = await supabase
          .from('households')
          .select('id, name')
          .order('name');

        setUserHouseholds(allHouseholds || []);
      } else {
        // Load user members
        const { data: membersData, error: membersError } = await supabase
          .from('room_members')
          .select(`
            id,
            user_id,
            created_at,
            profiles:user_id (username, email)
          `)
          .eq('room_id', roomId)
          .not('user_id', 'is', null);

        if (membersError) throw membersError;
        setMembers((membersData as any) || []);
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('❌ Không thể tải thông tin room');
    } finally {
      setLoading(false);
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
        .maybeSingle();

      if (profileError) {
        console.error('Profile query error:', profileError);
        toast.error('❌ Lỗi khi tìm người dùng');
        setInviting(false);
        return;
      }

      if (!profiles) {
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

      // Check if invitation already exists
      const { data: existingInvite } = await supabase
        .from('room_invitations')
        .select('id, status')
        .eq('room_id', roomId)
        .eq('invited_user_id', profiles.id)
        .maybeSingle();

      if (existingInvite) {
        if (existingInvite.status === 'pending') {
          toast.error('❌ Đã gửi lời mời cho người dùng này rồi');
        } else {
          toast.error('❌ Lời mời đã tồn tại');
        }
        setInviting(false);
        return;
      }

      // Create invitation instead of adding directly
      const { data: { user } } = await supabase.auth.getUser();
      const { error: inviteError } = await supabase
        .from('room_invitations')
        .insert({
          room_id: roomId,
          invited_user_id: profiles.id,
          invited_by: user?.id,
        });

      if (inviteError) throw inviteError;

      toast.success('Đã gửi lời mời!');
      setInviteEmail('');
      loadRoomDetails();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('❌ Lỗi: ' + error.message);
    } finally {
      setInviting(false);
    }
  };

  const handleInviteHousehold = async () => {
    if (!selectedHouseholdId) {
      toast.error('❌ Vui lòng chọn hộ gia đình');
      return;
    }

    setInviting(true);
    try {
      // Check if household already in room
      const existing = householdMembers.find(h => h.household_id === selectedHouseholdId);
      if (existing) {
        toast.error('❌ Hộ gia đình đã trong room');
        setInviting(false);
        return;
      }

      // Check if invitation already exists
      const { data: existingInvite } = await supabase
        .from('room_invitations')
        .select('id, status')
        .eq('room_id', roomId)
        .eq('invited_household_id', selectedHouseholdId)
        .maybeSingle();

      if (existingInvite) {
        if (existingInvite.status === 'pending') {
          toast.error('❌ Đã gửi lời mời cho hộ gia đình này rồi');
        } else {
          toast.error('❌ Lời mời đã tồn tại');
        }
        setInviting(false);
        return;
      }

      // Create invitation instead of adding directly
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('room_invitations')
        .insert({
          room_id: roomId,
          invited_household_id: selectedHouseholdId,
          invited_by: user?.id,
        });

      if (error) throw error;

      toast.success('Đã gửi lời mời!');
      setSelectedHouseholdId('');
      loadRoomDetails();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('❌ Lỗi: ' + error.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveHousehold = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Đã xóa hộ gia đình');
      loadRoomDetails();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('❌ Lỗi: ' + error.message);
    }
  };

  const handleRemoveMember = async (memberId: string, userId: string) => {
    if (userId === currentUserId) {
      toast.error('❌ Không thể xóa chính mình');
      return;
    }

    try {
      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Đã xóa thành viên');
      loadRoomDetails();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('❌ Lỗi: ' + error.message);
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
        .from('rooms')
        .update({ name: editName.trim() })
        .eq('id', roomId);

      if (error) throw error;

      toast.success('Đã cập nhật tên');
      await refreshRooms();
      loadRoomDetails();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('❌ Lỗi: ' + error.message);
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteRoom = async () => {
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;

      toast.success('Đã xóa không gian');
      await refreshRooms();
      router.push('/rooms');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('❌ Lỗi: ' + error.message);
    }
  };

  const handleSetActive = () => {
    if (room) {
      setCurrentRoom(room);
      toast.success(`Đã chuyển sang ${room.name}`);
    }
  };

  const loadHouseholdDetails = async (household: HouseholdMember) => {
    setSelectedHousehold(household);
    setEditHouseholdName(household.households.name);
    setLoadingHouseholdDetails(true);
    
    try {
      // Load household info to check creator
      const { data: householdData } = await supabase
        .from('households')
        .select('created_by')
        .eq('id', household.household_id)
        .single();

      // Load members
      const { data, error } = await supabase
        .from('household_members')
        .select(`
          id,
          user_id,
          role,
          profiles:user_id (username, email)
        `)
        .eq('household_id', household.household_id);

      if (error) throw error;
      setHouseholdDetails((data as any) || []);
      
      // Store creator info in selectedHousehold
      if (householdData) {
        setSelectedHousehold({
          ...household,
          created_by: householdData.created_by
        } as any);
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('❌ Không thể tải thành viên hộ gia đình');
    } finally {
      setLoadingHouseholdDetails(false);
    }
  };

  const handleUpdateHouseholdName = async () => {
    if (!selectedHousehold || !editHouseholdName.trim()) {
      toast.error('❌ Tên không được rỗng');
      return;
    }

    setEditingHousehold(true);
    try {
      const { error } = await supabase
        .from('households')
        .update({ name: editHouseholdName.trim() })
        .eq('id', selectedHousehold.household_id);

      if (error) throw error;

      toast.success('Đã cập nhật tên hộ gia đình');
      loadRoomDetails();
      if (selectedHousehold) {
        const updated = { ...selectedHousehold, households: { name: editHouseholdName.trim() } };
        loadHouseholdDetails(updated);
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('❌ Lỗi: ' + error.message);
    } finally {
      setEditingHousehold(false);
    }
  };

  const handleAddHouseholdMember = async () => {
    if (!selectedHousehold || !addMemberEmail.trim()) {
      toast.error('❌ Vui lòng nhập email');
      return;
    }

    setAddingMember(true);
    try {
      // Find user by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', addMemberEmail.trim().toLowerCase())
        .maybeSingle();

      if (profileError) {
        console.error('Profile query error:', profileError);
        toast.error('❌ Lỗi khi tìm người dùng');
        setAddingMember(false);
        return;
      }

      if (!profile) {
        toast.error('❌ Không tìm thấy người dùng với email này');
        setAddingMember(false);
        return;
      }

      // Check if already member
      const existing = householdDetails.find(m => m.user_id === profile.id);
      if (existing) {
        toast.error('❌ Người dùng đã là thành viên hộ gia đình');
        setAddingMember(false);
        return;
      }

      // Check if invitation already exists
      const { data: existingInvite } = await supabase
        .from('household_invitations')
        .select('id, status')
        .eq('household_id', selectedHousehold.household_id)
        .eq('invited_user_id', profile.id)
        .maybeSingle();

      if (existingInvite) {
        if (existingInvite.status === 'pending') {
          toast.error('❌ Đã gửi lời mời cho người dùng này rồi');
        } else {
          toast.error('❌ Lời mời đã tồn tại');
        }
        setAddingMember(false);
        return;
      }

      // Create invitation instead of adding directly
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('household_invitations')
        .insert({
          household_id: selectedHousehold.household_id,
          invited_user_id: profile.id,
          invited_by: user?.id,
        });

      if (error) throw error;

      toast.success('Đã gửi lời mời!');
      setAddMemberEmail('');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('❌ Lỗi: ' + error.message);
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveHouseholdMember = async (memberId: string, userId: string) => {
    if (!selectedHousehold) return;

    // Check if trying to remove owner
    const member = householdDetails.find(m => m.id === memberId);
    if (member?.role === 'OWNER') {
      toast.error('❌ Không thể xóa chủ hộ');
      return;
    }

    try {
      const { error } = await supabase
        .from('household_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Đã xóa thành viên');
      loadRoomDetails();
      loadHouseholdDetails(selectedHousehold);
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

  if (!room) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Không tìm thấy không gian</p>
        <Button onClick={() => router.push('/rooms')} className="mt-4">
          Quay lại
        </Button>
      </div>
    );
  }

  const isOwner = room.created_by === currentUserId;
  const isActive = currentRoom?.id === roomId;

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
            <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-3xl">
                {room.type === 'PRIVATE' ? '💼' : '🏠'}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{room.name}</h1>
              <p className="text-gray-600 mt-1">
                {room.type === 'PRIVATE' ? 'Riêng tư' : 'Chia sẻ'} • 
                Chia theo {room.split_by === 'USER' ? 'người dùng' : 'hộ gia đình'}
              </p>
            </div>
          </div>
          {!isActive && (
            <Button onClick={handleSetActive}>
              Chọn làm không gian hiện tại
            </Button>
          )}
          {isActive && (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded">
              Đang sử dụng
            </span>
          )}
        </div>
      </div>

      {/* Room Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Cài đặt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roomName">Tên không gian</Label>
            <div className="flex gap-2">
              <Input
                id="roomName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={!isOwner}
                maxLength={50}
              />
              {isOwner && (
                <Button
                  onClick={handleUpdateName}
                  disabled={editing || editName === room.name}
                >
                  {editing ? 'Đang lưu...' : 'Lưu'}
                </Button>
              )}
            </div>
          </div>

          {isOwner && (
            <div className="pt-4 border-t">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    🗑️ Xóa không gian
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Xác nhận xóa không gian</DialogTitle>
                    <DialogDescription>
                      Hành động này sẽ xóa vĩnh viễn không gian và tất cả giao dịch bên trong. 
                      Bạn có chắc chắn muốn tiếp tục?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex gap-3 justify-end">
                    <DialogTrigger asChild>
                      <Button variant="outline">Hủy</Button>
                    </DialogTrigger>
                    <Button variant="destructive" onClick={handleDeleteRoom}>
                      Xác nhận xóa
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members / Households */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {room.split_by === 'HOUSEHOLD' ? 'Hộ gia đình' : 'Thành viên'} 
              ({room.split_by === 'HOUSEHOLD' ? householdMembers.length : members.length})
            </CardTitle>
            {room.type === 'SHARED' && isOwner && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <span className="mr-2">➕</span>
                    {room.split_by === 'HOUSEHOLD' ? 'Thêm hộ' : 'Mời thành viên'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {room.split_by === 'HOUSEHOLD' ? 'Thêm hộ gia đình' : 'Mời thành viên mới'}
                    </DialogTitle>
                    <DialogDescription>
                      {room.split_by === 'HOUSEHOLD' 
                        ? 'Gửi lời mời cho hộ gia đình tham gia không gian này'
                        : 'Gửi lời mời cho người dùng tham gia không gian này'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  {room.split_by === 'HOUSEHOLD' ? (
                    <div className="space-y-4 pt-3">
                      <div className="space-y-2">
                        <Label>Chọn hộ gia đình</Label>
                        <Select
                          value={selectedHouseholdId}
                          onValueChange={setSelectedHouseholdId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="-- Chọn hộ --" />
                          </SelectTrigger>
                          <SelectContent>
                            {userHouseholds.map((h) => (
                              <SelectItem key={h.id} value={h.id}>
                                <span className="flex items-center gap-2">
                                  <span>👨‍👩‍👧‍👦</span>
                                  <span>{h.name}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {userHouseholds.length === 0 && (
                          <p className="text-sm text-gray-500">
                            Bạn chưa có hộ gia đình nào. <a href="/households/create" className="text-green-600 hover:underline">Tạo hộ mới</a>
                          </p>
                        )}
                      </div>
                      <div className="flex gap-3 justify-end">
                        <DialogTrigger asChild>
                          <Button variant="outline">Hủy</Button>
                        </DialogTrigger>
                        <Button onClick={handleInviteHousehold} disabled={inviting} className="bg-green-600 hover:bg-green-700">
                          {inviting ? 'Đang gửi...' : 'Gửi lời mời'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-3">
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
                        <Button onClick={handleInvite} disabled={inviting} className="bg-green-600 hover:bg-green-700">
                          {inviting ? 'Đang gửi...' : 'Gửi lời mời'}
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {room.split_by === 'HOUSEHOLD' ? (
              householdMembers.length > 0 ? (
                householdMembers.map((household) => (
                  <div
                    key={household.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">👨‍👩‍👧‍👦</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {household.households.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {household.member_count} thành viên
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => loadHouseholdDetails(household)}
                          >
                            Chi tiết
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Quản lý hộ gia đình</DialogTitle>
                            <DialogDescription>
                              Xem và quản lý thành viên của hộ gia đình
                            </DialogDescription>
                          </DialogHeader>
                          
                          {loadingHouseholdDetails ? (
                            <div className="flex justify-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {/* Household Name */}
                              {(selectedHousehold as any)?.created_by === currentUserId && (
                                <div className="space-y-2">
                                  <Label>Tên hộ gia đình</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      value={editHouseholdName}
                                      onChange={(e) => setEditHouseholdName(e.target.value)}
                                      maxLength={50}
                                    />
                                    <Button
                                      onClick={handleUpdateHouseholdName}
                                      disabled={editingHousehold || editHouseholdName === selectedHousehold?.households.name}
                                    >
                                      {editingHousehold ? 'Đang lưu...' : 'Lưu'}
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Add Member - Only for household creator */}
                              {(selectedHousehold as any)?.created_by === currentUserId && (
                                <div className="space-y-2">
                                  <Label>Mời thành viên mới</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      type="email"
                                      placeholder="Email thành viên"
                                      value={addMemberEmail}
                                      onChange={(e) => setAddMemberEmail(e.target.value)}
                                    />
                                    <Button
                                      onClick={handleAddHouseholdMember}
                                      disabled={addingMember}
                                    >
                                      {addingMember ? 'Đang gửi...' : 'Gửi lời mời'}
                                    </Button>
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    Người dùng sẽ nhận được lời mời và có thể chấp nhận hoặc từ chối
                                  </p>
                                </div>
                              )}

                              {/* Members List */}
                              <div className="space-y-2">
                                <Label>Thành viên ({householdDetails.length})</Label>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                  {householdDetails.map((member) => (
                                    <div
                                      key={member.id}
                                      className="flex items-center justify-between p-3 border rounded-lg"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                          <span className="text-sm font-medium text-green-700">
                                            {member.profiles.username?.[0]?.toUpperCase() || 
                                             member.profiles.email?.[0]?.toUpperCase()}
                                          </span>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-gray-900">
                                            {member.profiles.username || 'User'}
                                            {member.role === 'OWNER' && (
                                              <span className="ml-2 text-xs text-blue-600">(Chủ hộ)</span>
                                            )}
                                            {member.user_id === currentUserId && (
                                              <span className="ml-2 text-xs text-green-600">(Bạn)</span>
                                            )}
                                          </p>
                                          <p className="text-xs text-gray-500">{member.profiles.email}</p>
                                        </div>
                                      </div>
                                      {member.role !== 'OWNER' && (selectedHousehold as any)?.created_by === currentUserId && (
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
                                                onClick={() => handleRemoveHouseholdMember(member.id, member.user_id)}
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
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {isOwner && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Xóa
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xác nhận xóa hộ gia đình</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc chắn muốn xóa hộ gia đình này khỏi room?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveHousehold(household.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">Chưa có hộ gia đình nào</p>
              )
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="font-medium text-green-700">
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
                        {member.user_id === room.created_by && (
                          <span className="ml-2 text-xs text-blue-600">(Chủ)</span>
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
                            Bạn có chắc chắn muốn xóa thành viên này?
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
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
