# 🔄 Database Migrations

## Quick Start

Nếu bạn gặp lỗi khi sử dụng Room Management, chạy file này:

**`complete_fix.sql`** - Fix tất cả issues trong 1 lần

### Cách chạy:

1. Mở Supabase Dashboard
2. Vào **SQL Editor**
3. Copy nội dung file `complete_fix.sql`
4. Paste và click **Run**
5. Refresh app

## Migration Files

### `complete_fix.sql` ⭐ (Recommended)
- Fix tất cả issues
- Add `created_by` column
- Fix RLS policies
- Verification queries

### `add_created_by_to_rooms.sql`
- Chỉ add `created_by` column
- Set giá trị cho existing rooms
- Create index

### `fix_room_members_policies.sql`
- Chỉ fix RLS policies
- Remove infinite recursion
- Update permissions

## Common Issues

### Issue 1: "Could not find the 'created_by' column"
**Solution**: Run `add_created_by_to_rooms.sql` hoặc `complete_fix.sql`

### Issue 2: "infinite recursion detected in policy"
**Solution**: Run `fix_room_members_policies.sql` hoặc `complete_fix.sql`

### Issue 3: "permission denied"
**Solution**: Check RLS policies, run `complete_fix.sql`

## Verification

Sau khi chạy migration, verify bằng SQL:

```sql
-- Check created_by column
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'rooms' AND column_name = 'created_by';

-- Check policies
SELECT policyname FROM pg_policies 
WHERE tablename = 'room_members';

-- Check data
SELECT id, name, created_by FROM rooms LIMIT 5;
```

## Rollback

Nếu cần rollback:

```sql
-- Remove created_by column
ALTER TABLE rooms DROP COLUMN IF EXISTS created_by;

-- Restore old policies (not recommended)
-- Better to keep new policies
```

## Migration History

| Date | File | Description |
|------|------|-------------|
| 2024-12-16 | `add_created_by_to_rooms.sql` | Add created_by column to rooms |
| 2024-12-16 | `fix_room_members_policies.sql` | Fix infinite recursion in RLS |
| 2024-12-16 | `complete_fix.sql` | Combined fix for all issues |

## Notes

- Migrations are **idempotent** - safe to run multiple times
- Always backup before running migrations
- Test in development first
- Migrations use `IF NOT EXISTS` to prevent errors

## Support

If you encounter issues:
1. Check `QUICK_FIX.md` in root folder
2. Check `DATABASE_MIGRATION.md` for detailed guide
3. Verify Supabase project is active
4. Check RLS is enabled on tables
