# 🏠 Room Context

## Tổng quan

Room Context quản lý "không gian" hiện tại mà user đang làm việc. Mỗi transaction phải thuộc về một room.

## Concept

- **Room** = Không gian quản lý chi tiêu
- User có thể có nhiều rooms
- Mỗi lúc chỉ làm việc trong 1 room
- Room được lưu trong localStorage để persist giữa các sessions

## Room Types

### PRIVATE (Riêng tư)
- Chỉ user tự quản lý
- Không chia sẻ với ai
- VD: "Ví cá nhân"

### SHARED (Chia sẻ)
- Nhiều người cùng quản lý
- Có thể split theo USER hoặc HOUSEHOLD
- VD: "Nhà chung", "Phòng 101"

## Implementation

### RoomContext.tsx

```typescript
interface Room {
  id: string;
  name: string;
  type: 'SHARED' | 'PRIVATE';
  split_by: 'USER' | 'HOUSEHOLD';
}

interface RoomContextType {
  currentRoom: Room | null;
  rooms: Room[];
  setCurrentRoom: (room: Room) => void;
  loading: boolean;
  refreshRooms: () => Promise<void>;
}
```

### Features

1. **Auto-create default room**
   - Khi user đăng nhập lần đầu
   - Tạo room "Ví cá nhân" (PRIVATE)
   - Add user vào room_members

2. **Persist selection**
   - Lưu currentRoomId vào localStorage
   - Restore khi reload page

3. **Room switching**
   - User chọn room từ dropdown trong Sidebar
   - Tất cả transactions filter theo room hiện tại

## Usage

### 1. Wrap app với RoomProvider

```tsx
// app/(dashboard)/layout.tsx
<RoomProvider>
  <div>
    {children}
  </div>
</RoomProvider>
```

### 2. Use trong components

```tsx
import { useRoom } from '@/contexts/RoomContext';

function MyComponent() {
  const { currentRoom, rooms, setCurrentRoom, loading } = useRoom();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <p>Current: {currentRoom?.name}</p>
      <select onChange={(e) => {
        const room = rooms.find(r => r.id === e.target.value);
        if (room) setCurrentRoom(room);
      }}>
        {rooms.map(room => (
          <option key={room.id} value={room.id}>
            {room.name}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### 3. Filter data by room

```tsx
// Fetch transactions for current room
const { data } = await supabase
  .from('transactions')
  .select('*')
  .eq('room_id', currentRoom.id);
```

## Components Using Room Context

### Sidebar
- Hiển thị dropdown chọn room
- Show room type (PRIVATE/SHARED)
- Persist selection

### Add Transaction Form
- Hiển thị room hiện tại
- Insert transaction vào currentRoom.id
- Validate room exists

### Transaction List
- Filter transactions theo currentRoom
- Show room name trong header
- Reload khi switch room

### Dashboard
- Show stats cho currentRoom
- Recent transactions từ currentRoom

## Database Schema

### rooms table
```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('SHARED', 'PRIVATE')),
  split_by TEXT CHECK (split_by IN ('USER', 'HOUSEHOLD')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### room_members table
```sql
CREATE TABLE room_members (
  id UUID PRIMARY KEY,
  room_id UUID REFERENCES rooms(id),
  user_id UUID REFERENCES profiles(id),
  household_id UUID REFERENCES households(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);
```

## Flow

### First Time User

1. User đăng nhập
2. RoomContext load rooms
3. Không tìm thấy room nào
4. Auto-create "Ví cá nhân" (PRIVATE)
5. Add user vào room_members
6. Set làm currentRoom
7. Save roomId vào localStorage

### Returning User

1. User đăng nhập
2. RoomContext load rooms
3. Tìm thấy rooms
4. Check localStorage cho savedRoomId
5. Restore room đã chọn trước đó
6. Nếu không có → Chọn room đầu tiên

### Switch Room

1. User chọn room khác từ dropdown
2. setCurrentRoom(newRoom)
3. Save newRoom.id vào localStorage
4. Components re-render với currentRoom mới
5. Data được filter lại theo room mới

## Edge Cases

### No rooms found
- Auto-create default room
- Should never happen after first login

### Room deleted
- If currentRoom deleted → Switch to first available room
- If no rooms left → Create new default room

### Multiple tabs
- Each tab has own localStorage
- Switching room in one tab doesn't affect others
- Reload to sync

## Future Enhancements

- [ ] Room settings page
- [ ] Create new room UI
- [ ] Delete room (with confirmation)
- [ ] Rename room
- [ ] Invite members to room
- [ ] Leave room
- [ ] Room statistics
- [ ] Room icon/color
- [ ] Archive room
- [ ] Room templates

## Troubleshooting

### Issue: "Room not found"
**Fix**: Check RLS policies on rooms table

### Issue: "Can't switch room"
**Fix**: Check room_members table has entry for user

### Issue: "Room not persisting"
**Fix**: Check localStorage is enabled in browser

### Issue: "Transactions not filtering"
**Fix**: Verify currentRoom.id is being used in query

## Related Files

- Context: `contexts/RoomContext.tsx`
- Sidebar: `components/layout/Sidebar.tsx`
- Layout: `app/(dashboard)/layout.tsx`
- Add Transaction: `app/(dashboard)/transactions/add/page.tsx`
- Transaction List: `app/(dashboard)/transactions/page.tsx`
