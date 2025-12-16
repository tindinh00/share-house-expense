# Room Invitation System Setup

## Vấn đề đã fix

1. ✅ **Add household vào room giờ gửi invitation** thay vì add trực tiếp
2. ✅ **Người được mời vào room giờ thấy được room** sau khi accept
3. ✅ **Fix infinite recursion** trong room policies

## Cách chạy migration

### Bước 1: Chạy migration tạo room_invitations table

Vào Supabase Dashboard → SQL Editor, chạy file:
```
share-house-expense/supabase/migrations/create_room_invitations.sql
```

### Bước 2: Fix infinite recursion policies

Chạy file:
```
share-house-expense/supabase/migrations/fix_room_invitation_policies.sql
```

## Cách hoạt động

### 1. Mời người dùng vào room (USER split)

- Room creator nhập email người dùng
- Hệ thống tạo `room_invitations` với `invited_user_id`
- Người được mời thấy notification ở bell icon 🔔
- Accept → Tự động add vào `room_members` (trigger)
- Reject → Invitation status = 'rejected'

### 2. Mời household vào room (HOUSEHOLD split)

- Room creator chọn household từ dropdown
- Hệ thống tạo `room_invitations` với `invited_household_id`
- **Chỉ household owner** thấy invitation và có thể accept/reject
- Accept → Tự động add household vào `room_members` (trigger)
- Reject → Invitation status = 'rejected'

### 3. Xem room sau khi được mời

- User được mời trực tiếp: Thấy room ngay sau khi accept
- User trong household được mời: Thấy room sau khi household owner accept

## UI Changes

### Room Detail Page
- Button "Thêm vào room" → "Gửi lời mời"
- Text "Đang thêm..." → "Đang gửi..."
- Description rõ ràng hơn về invitation flow

### InvitationsDropdown
- Hiển thị 2 loại invitation:
  - **Hộ gia đình**: Lời mời tham gia household
  - **Không gian**: Lời mời tham gia room
- Badge đếm tổng số invitations
- Accept/Reject cho từng loại

## Database Schema

### room_invitations table
```sql
- id: UUID (PK)
- room_id: UUID (FK → rooms)
- invited_user_id: UUID (FK → profiles) [nullable]
- invited_household_id: UUID (FK → households) [nullable]
- invited_by: UUID (FK → profiles)
- status: 'pending' | 'accepted' | 'rejected'
- created_at: timestamp
- updated_at: timestamp
```

### Trigger
```sql
handle_room_invitation_accepted()
- Khi status = 'accepted'
- Tự động insert vào room_members
- Với user_id hoặc household_id tương ứng
```

## Policies

### room_invitations
- Room creator: view, create, delete invitations
- Invited user: view, update own invitations
- Household owner: view, update household invitations

### rooms (fixed)
- User thấy room nếu:
  - Là creator
  - Là member trực tiếp (user_id)
  - Là member của household trong room

### room_members (fixed)
- User thấy membership nếu:
  - Là member trực tiếp
  - Là member của household

## Testing

1. **Test user invitation:**
   - Tạo room với split_by = 'USER'
   - Mời user khác bằng email
   - User nhận notification
   - Accept → Thấy room trong list

2. **Test household invitation:**
   - Tạo room với split_by = 'HOUSEHOLD'
   - Mời household
   - Household owner nhận notification
   - Accept → Tất cả members thấy room

3. **Test rejection:**
   - Reject invitation
   - Không add vào room
   - Invitation status = 'rejected'
