# 🚀 Quick Fix - Household Policies

## Lỗi gặp phải
```
403 Forbidden - new row violates row-level security policy
```

## Giải pháp nhanh

### 1. Mở Supabase SQL Editor
https://supabase.com/dashboard → Your Project → SQL Editor

### 2. Chạy SQL fix
**Nếu gặp lỗi "infinite recursion":**
→ Chạy `supabase/migrations/FINAL_HOUSEHOLD_FIX.sql` ⭐ **CHẠY FILE NÀY**

File này sẽ:
- Thêm column `created_by` vào bảng `households`
- Tạo lại tất cả policies không có recursion

### 3. Refresh trang
Sau khi chạy xong, refresh lại trang web và thử lại.

## Tính năng mới
- ✅ Thêm household vào room
- ✅ Quản lý household trong room detail
- ✅ Sửa tên household
- ✅ Thêm/xóa thành viên household

---

Chi tiết đầy đủ xem tại: `FIX_HOUSEHOLD_ROOM_POLICY.md`
