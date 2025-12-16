# ⚡ QUICK FIX: Infinite Recursion Error

## Lỗi bạn đang gặp:
```
infinite recursion detected in policy for relation "rooms"
```

## Giải pháp (1 phút):

### Bước 1: Mở Supabase SQL Editor
1. Vào https://supabase.com/dashboard
2. Chọn project của bạn
3. Click **SQL Editor** ở sidebar bên trái

### Bước 2: Copy & Run SQL
1. Mở file: `share-house-expense/supabase/migrations/FIX_INFINITE_RECURSION_NOW.sql`
2. Copy **TOÀN BỘ** nội dung
3. Paste vào SQL Editor
4. Click nút **Run** (hoặc Ctrl+Enter)

### Bước 3: Verify
Bạn sẽ thấy message:
```
Policy fix completed successfully!
```

### Bước 4: Refresh
- Refresh trang web của bạn
- Lỗi sẽ biến mất! ✅

---

## Sau khi fix xong, chạy migration đầy đủ:

Để enable room invitation system, chạy thêm file:
`share-house-expense/supabase/migrations/APPLY_ROOM_INVITATIONS.sql`

Xem chi tiết tại: `RUN_ROOM_INVITATIONS.md`

---

## Tại sao lỗi này xảy ra?

Policy cũ có circular dependency:
- `rooms` policy check `room_members`
- `room_members` policy check `rooms`
→ Infinite loop!

Fix: Dùng `IN` subquery thay vì `EXISTS` để break the cycle.
