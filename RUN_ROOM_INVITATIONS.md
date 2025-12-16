# 🚀 Chạy Migration Room Invitations

## ⚠️ QUAN TRỌNG: Fix Infinite Recursion Trước!

Nếu bạn đang gặp lỗi **"infinite recursion detected in policy for relation rooms"**, chạy file này TRƯỚC:

### Fix Ngay:
1. Mở **Supabase Dashboard**
2. Vào **SQL Editor**
3. Copy toàn bộ nội dung file: `supabase/migrations/FIX_INFINITE_RECURSION_NOW.sql`
4. Paste vào SQL Editor
5. Click **Run** ▶️
6. Refresh trang web → Lỗi sẽ mất!

---

## Bước 1: Chạy SQL Migration

1. Mở **Supabase Dashboard**
2. Vào **SQL Editor**
3. Copy toàn bộ nội dung file: `supabase/migrations/APPLY_ROOM_INVITATIONS.sql`
4. Paste vào SQL Editor
5. Click **Run** ▶️

## Bước 2: Verify

Kiểm tra xem table đã được tạo:

```sql
SELECT * FROM room_invitations LIMIT 1;
```

Nếu không có lỗi → Thành công! ✅

## Bước 3: Test

### Test 1: Mời user vào room
1. Vào room detail (split_by = USER)
2. Click "Mời thành viên"
3. Nhập email user khác
4. Click "Gửi lời mời"
5. User kia sẽ thấy notification ở bell icon 🔔

### Test 2: Mời household vào room
1. Vào room detail (split_by = HOUSEHOLD)
2. Click "Thêm hộ"
3. Chọn household
4. Click "Gửi lời mời"
5. Household owner sẽ thấy notification ở bell icon 🔔

### Test 3: Accept invitation
1. Click vào bell icon 🔔
2. Thấy invitation
3. Click "Chấp nhận"
4. Room sẽ xuất hiện trong danh sách rooms

## Các thay đổi

### ✅ Fixed
1. **Add household vào room giờ gửi invitation** (không add trực tiếp nữa)
2. **Người được mời vào room giờ thấy được room** sau khi accept
3. **Fix infinite recursion error** trong room policies
4. **Household members giờ thấy được room** khi household được add vào

### 🎨 UI Changes
- Button text: "Thêm vào room" → "Gửi lời mời"
- Dialog description rõ ràng hơn
- InvitationsDropdown hiển thị cả household và room invitations
- Badge đếm tổng số invitations

## Troubleshooting

### Lỗi: "infinite recursion detected"
→ Chạy lại migration, nó sẽ fix policy

### Lỗi: "table already exists"
→ OK, table đã tồn tại, skip bước tạo table

### Không thấy invitation
→ Check:
1. User có đúng email không?
2. Household owner có đúng không?
3. Status có phải 'pending' không?

```sql
-- Check invitations
SELECT * FROM room_invitations WHERE status = 'pending';
```
