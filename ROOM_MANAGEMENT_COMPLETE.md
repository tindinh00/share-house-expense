# 🏠 Room Management - Complete Feature

## Tổng quan

Room Management là hệ thống quản lý "không gian" chi tiêu, cho phép user tạo nhiều rooms và quản lý transactions riêng biệt cho mỗi room.

## Features Implemented

### ✅ 1. Room Context
- Global state management cho current room
- Persist selection trong localStorage
- Auto-create default room khi user đăng nhập lần đầu
- Switch room functionality

**File**: `contexts/RoomContext.tsx`

### ✅ 2. Rooms List Page
- Hiển thị tất cả rooms của user
- Show member count, type, split method
- Highlight room đang sử dụng
- Quick switch room
- Link đến room details
- Empty state với CTA

**Route**: `/rooms`
**File**: `app/(dashboard)/rooms/page.tsx`

### ✅ 3. Create Room Page
- Form tạo room mới
- Chọn type: PRIVATE (riêng tư) hoặc SHARED (chia sẻ)
- Chọn split_by: USER hoặc HOUSEHOLD (nếu SHARED)
- Validation
- Auto add creator vào room_members
- Refresh rooms list sau khi tạo

**Route**: `/rooms/create`
**File**: `app/(dashboard)/rooms/create/page.tsx`

### ✅ 4. Room Details Page
- Xem thông tin room
- Edit room name (chỉ owner)
- Set làm current room
- Quản lý members:
  - Xem danh sách
  - Mời member mới (bằng email)
  - Xóa member (chỉ owner)
  - Hiển thị role (Chủ, Bạn)
- Delete room với confirmation (chỉ owner)

**Route**: `/rooms/[id]`
**File**: `app/(dashboard)/rooms/[id]/page.tsx`

### ✅ 5. Sidebar Integration
- Room selector dropdown
- Show current room
- Button "Tạo không gian mới"
- Empty state

**File**: `components/layout/Sidebar.tsx`

### ✅ 6. Transaction Integration
- Transactions filter theo current room
- Add transaction vào current room
- Show room name trong transaction list

**Files**: 
- `app/(dashboard)/transactions/page.tsx`
- `app/(dashboard)/transactions/add/page.tsx`

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
  role TEXT CHECK (role IN ('owner', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);
```

## User Flows

### Flow 1: First Time User
1. User đăng nhập
2. RoomContext auto-create "Ví cá nhân" (PRIVATE)
3. Set làm currentRoom
4. User có thể thêm transactions ngay

### Flow 2: Create New Room
1. Click "Tạo không gian mới" trong Sidebar
2. Điền form (name, type, split_by)
3. Submit → Room được tạo
4. User được add vào room_members
5. Redirect về /rooms

### Flow 3: Invite Member
1. Vào room details
2. Click "Mời thành viên"
3. Nhập email
4. System tìm user theo email
5. Add vào room_members
6. Member có thể thấy room và transactions

### Flow 4: Switch Room
1. Chọn room khác từ dropdown
2. currentRoom được update
3. localStorage được update
4. Transactions list reload với room mới

### Flow 5: Delete Room
1. Owner vào room details
2. Click "Xóa không gian"
3. Confirm dialog (2 lần)
4. Room và tất cả transactions bị xóa
5. Redirect về /rooms

## Permissions

### Owner (created_by)
- ✅ Edit room name
- ✅ Invite members
- ✅ Remove members
- ✅ Delete room

### Member
- ✅ View room details
- ✅ View members
- ✅ Add transactions
- ✅ View transactions
- ❌ Edit room
- ❌ Invite/remove members
- ❌ Delete room

## Room Types

### PRIVATE (Riêng tư)
- Chỉ 1 user
- Không thể invite members
- Phù hợp cho chi tiêu cá nhân
- Icon: 💼

### SHARED (Chia sẻ)
- Nhiều users
- Có thể invite members
- Phù hợp cho nhà chung, phòng trọ
- Icon: 🏠

## Split Methods

### USER
- Tính toán theo từng người
- VD: A nợ B 100k, B nợ C 50k
- Phù hợp khi mỗi người tự quản lý

### HOUSEHOLD
- Tính toán theo hộ gia đình
- VD: Hộ A nợ Hộ B 200k
- Phù hợp khi có nhiều hộ cùng ở

## Components Used

- `Button` - Actions
- `Input` - Form inputs
- `Label` - Form labels
- `Card` - Containers
- `Select` - Dropdowns
- `RadioGroup` - Type selection
- `Dialog` - Modals (invite, delete)
- `toast` - Notifications

## API Endpoints (Supabase)

### Rooms
- `GET /rooms` - List rooms
- `POST /rooms` - Create room
- `PATCH /rooms/:id` - Update room
- `DELETE /rooms/:id` - Delete room

### Room Members
- `GET /room_members?room_id=:id` - List members
- `POST /room_members` - Add member
- `DELETE /room_members/:id` - Remove member

## Error Handling

- Invalid email → Toast error
- User not found → Toast error
- Already member → Toast error
- Permission denied → Toast error
- Network error → Toast error with message

## Performance Optimizations

- Room list cached in context
- localStorage for persistence
- Indexed queries (room_id, user_id)
- Lazy loading room details
- Optimistic UI updates

## Security

- RLS policies on all tables
- Only members can view room
- Only owner can edit/delete
- Email validation for invites
- Confirmation for destructive actions

## Testing Checklist

- [ ] Create PRIVATE room
- [ ] Create SHARED room
- [ ] Switch between rooms
- [ ] Invite member (valid email)
- [ ] Invite member (invalid email)
- [ ] Remove member
- [ ] Edit room name
- [ ] Delete room
- [ ] Transactions filter by room
- [ ] Add transaction to specific room
- [ ] Room persists after refresh

## Known Issues

- ⚠️ Need to run migration to add `created_by` column
- See `QUICK_FIX.md` for solution

## Future Enhancements

- [ ] Room icons/colors
- [ ] Room templates
- [ ] Bulk invite (CSV)
- [ ] Member roles (admin, viewer, editor)
- [ ] Room statistics
- [ ] Archive room
- [ ] Transfer ownership
- [ ] Room activity log
- [ ] Email notifications for invites
- [ ] QR code invite
- [ ] Room settings (currency, timezone)

## Documentation

- `ROOM_CONTEXT.md` - Room Context API
- `DATABASE_MIGRATION.md` - Migration guide
- `QUICK_FIX.md` - Quick fix for created_by column

## Related Files

```
contexts/
  └── RoomContext.tsx

app/(dashboard)/
  └── rooms/
      ├── page.tsx              # List
      ├── create/
      │   └── page.tsx          # Create
      └── [id]/
          └── page.tsx          # Details

components/layout/
  └── Sidebar.tsx               # Room selector

supabase/
  ├── schema.sql                # Main schema
  └── migrations/
      └── add_created_by_to_rooms.sql
```

## Summary

Room Management feature hoàn chỉnh với:
- ✅ Create/Read/Update/Delete rooms
- ✅ Member management
- ✅ Permission system
- ✅ Room switching
- ✅ Transaction isolation
- ✅ Responsive UI
- ✅ Error handling
- ✅ Documentation

User có thể tạo nhiều rooms, mời bạn bè, và quản lý chi tiêu riêng biệt cho từng không gian!
