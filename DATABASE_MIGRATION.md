# 🔄 Database Migration Guide

## Vấn đề

Nếu bạn thấy lỗi:
```
Could not find the 'created_by' column of 'rooms' in the schema cache
```

Có nghĩa là database của bạn đang dùng schema cũ thiếu column `created_by` trong bảng `rooms`.

## Giải pháp

### Option 1: Chạy Migration (Recommended)

1. Mở Supabase Dashboard
2. Vào **SQL Editor**
3. Copy và paste nội dung file `supabase/migrations/add_created_by_to_rooms.sql`
4. Click **Run**

Migration sẽ:
- Thêm column `created_by` vào bảng `rooms`
- Set giá trị cho các rooms hiện có
- Tạo index để tăng performance

### Option 2: Reset Database (Nếu chưa có data quan trọng)

1. Mở Supabase Dashboard
2. Vào **SQL Editor**
3. Xóa tất cả tables hiện có:

```sql
-- Drop all tables
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS room_members CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS household_members CASCADE;
DROP TABLE IF EXISTS households CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
```

4. Copy toàn bộ nội dung file `supabase/schema.sql`
5. Paste vào SQL Editor
6. Click **Run**

## Verify Migration

Sau khi chạy migration, verify bằng cách:

1. Vào **Table Editor**
2. Chọn bảng `rooms`
3. Kiểm tra có column `created_by` không

Hoặc chạy SQL:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rooms';
```

Kết quả phải có:
- `id`
- `name`
- `type`
- `split_method`
- `split_config`
- `split_by`
- `created_by` ← Column mới
- `created_at`

## Sau khi Migration

1. Refresh trang web
2. Thử tạo room mới
3. Kiểm tra room details page

Mọi thứ sẽ hoạt động bình thường!

## Troubleshooting

### Issue: "permission denied for table rooms"
**Fix**: Check RLS policies, đảm bảo user có quyền INSERT

### Issue: "null value in column created_by"
**Fix**: Migration đã set giá trị cho existing rooms. Nếu vẫn lỗi, check lại migration đã chạy chưa

### Issue: "foreign key violation"
**Fix**: Đảm bảo user_id tồn tại trong bảng profiles

## Migration History

- **2024-12-16**: Add `created_by` column to `rooms` table
  - Reason: Cần track ai tạo room để phân quyền owner
  - Impact: Tất cả rooms phải có creator
  - Rollback: `ALTER TABLE rooms DROP COLUMN created_by;`

## Future Migrations

Khi có schema changes mới, sẽ tạo file migration trong folder `supabase/migrations/` với format:
- `YYYY-MM-DD_description.sql`

Luôn backup database trước khi chạy migration!
