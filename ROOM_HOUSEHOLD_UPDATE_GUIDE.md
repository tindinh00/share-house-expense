# Room Detail - Household Support Update Guide

## Cần update file: `app/(dashboard)/rooms/[id]/page.tsx`

### 1. Đã thêm interfaces ✅
```typescript
interface HouseholdMember {
  id: string;
  household_id: string;
  created_at: string;
  households: {
    name: string;
  };
  member_count?: number;
}
```

### 2. Đã thêm states ✅
```typescript
const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);
const [userHouseholds, setUserHouseholds] = useState<any[]>([]);
const [selectedHouseholdId, setSelectedHouseholdId] = useState('');
```

### 3. Cần update `loadRoomDetails` function

Thêm logic load households sau phần load members:

```typescript
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

      // Load user's households for invite dropdown
      const { data: userHouseholdData } = await supabase
        .from('household_members')
        .select('household_id, households:household_id (id, name)')
        .eq('user_id', user.id);

      setUserHouseholds((userHouseholdData || []).map((h: any) => h.households));
    } else {
      // Load user members (existing code)
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
```

### 4. Thêm function invite household

```typescript
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

    // Add household to room
    const { error } = await supabase
      .from('room_members')
      .insert({
        room_id: roomId,
        household_id: selectedHouseholdId,
      });

    if (error) throw error;

    toast.success('✅ Đã thêm hộ gia đình!');
    setSelectedHouseholdId('');
    loadRoomDetails();
  } catch (error: any) {
    console.error('Error:', error);
    toast.error('❌ Lỗi: ' + error.message);
  } finally {
    setInviting(false);
  }
};
```

### 5. Thêm function remove household

```typescript
const handleRemoveHousehold = async (memberId: string) => {
  try {
    const { error } = await supabase
      .from('room_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;

    toast.success('✅ Đã xóa hộ gia đình');
    loadRoomDetails();
  } catch (error: any) {
    console.error('Error:', error);
    toast.error('❌ Lỗi: ' + error.message);
  }
};
```

### 6. Update UI - Members Card

Thay thế phần Members Card bằng conditional rendering:

```tsx
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
                  ? 'Chọn hộ gia đình để thêm vào room'
                  : 'Nhập email của người bạn muốn mời vào không gian này'
                }
              </DialogDescription>
            </DialogHeader>
            
            {room.split_by === 'HOUSEHOLD' ? (
              // Household invite UI
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Chọn hộ gia đình</Label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    value={selectedHouseholdId}
                    onChange={(e) => setSelectedHouseholdId(e.target.value)}
                  >
                    <option value="">-- Chọn hộ --</option>
                    {userHouseholds.map((h) => (
                      <option key={h.id} value={h.id}>
                        👨‍👩‍👧‍👦 {h.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 justify-end">
                  <DialogTrigger asChild>
                    <Button variant="outline">Hủy</Button>
                  </DialogTrigger>
                  <Button onClick={handleInviteHousehold} disabled={inviting}>
                    {inviting ? 'Đang thêm...' : 'Thêm vào room'}
                  </Button>
                </div>
              </div>
            ) : (
              // User invite UI (existing code)
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
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  </CardHeader>
  <CardContent>
    <div className="space-y-3">
      {room.split_by === 'HOUSEHOLD' ? (
        // Household list
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
        ))
      ) : (
        // User list (existing code)
        members.map((member) => (
          // ... existing member UI ...
        ))
      )}
    </div>
  </CardContent>
</Card>
```

## Summary

**Đã làm:**
- ✅ Thêm interfaces
- ✅ Thêm states

**Cần làm thủ công:**
1. Update `loadRoomDetails` function
2. Thêm `handleInviteHousehold` function
3. Thêm `handleRemoveHousehold` function
4. Update Members Card UI với conditional rendering

**Lý do:** File quá dài (400+ lines), update từng phần sẽ dễ kiểm soát hơn.
