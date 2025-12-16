# 🔧 Troubleshooting Guide

## Common Errors

### Error 1: "Could not find the 'created_by' column"

**Cause**: Database schema outdated

**Solution**: Run migration in `RUN_THIS_SQL.md`

---

### Error 2: "infinite recursion detected in policy"

**Cause**: RLS policies reference each other

**Solution**: Run migration in `RUN_THIS_SQL.md` to fix policies

---

### Error 3: "violates foreign key constraint rooms_created_by_fkey"

**Full error**:
```
insert or update on table "rooms" violates foreign key constraint "rooms_created_by_fkey"
Key is not present in table "profiles"
```

**Cause**: User logged in but profile not created

**Solution**: Migration now includes profile creation. Run `RUN_THIS_SQL.md`

**Why it happens**:
- Trigger `on_auth_user_created` should create profile automatically
- But if user was created before trigger was added, profile is missing
- Migration now creates profiles for all existing auth users

---

### Error 4: "permission denied for table"

**Cause**: RLS policies not set correctly

**Solution**: 
1. Check if you ran the migration
2. Verify policies exist:
```sql
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('rooms', 'room_members', 'transactions');
```

---

### Error 5: "policy already exists"

**Cause**: Running migration multiple times

**Solution**: Migration includes `DROP POLICY IF EXISTS`, safe to run again

---

### Error 6: Toast not showing

**Cause**: Toaster component not mounted or theme issue

**Solution**: Already fixed in code. Check `TOAST_IMPLEMENTATION.md`

---

### Error 7: "Room not found" or empty room list

**Cause**: 
- No rooms created yet
- RLS policies blocking access

**Solution**:
1. Create a room from `/rooms/create`
2. Check RLS policies are correct
3. Verify user is in `room_members` table

---

## Verification Queries

### Check if profile exists
```sql
SELECT id, username, created_at 
FROM profiles 
WHERE id = auth.uid();
```

### Check rooms
```sql
SELECT r.id, r.name, r.created_by, rm.user_id
FROM rooms r
LEFT JOIN room_members rm ON rm.room_id = r.id
WHERE r.created_by = auth.uid() OR rm.user_id = auth.uid();
```

### Check policies
```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('rooms', 'room_members', 'transactions', 'profiles')
ORDER BY tablename, policyname;
```

### Check trigger exists
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

---

## Reset Database (Last Resort)

⚠️ **WARNING**: This will delete ALL data!

```sql
-- Drop all tables
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS room_members CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS household_members CASCADE;
DROP TABLE IF EXISTS households CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
```

Then run the full `schema.sql` file.

---

## Getting Help

1. Check `RUN_THIS_SQL.md` - Main fix
2. Check `QUICK_FIX.md` - Detailed guide
3. Check `DATABASE_MIGRATION.md` - Migration docs
4. Check Supabase logs in Dashboard → Logs
5. Check browser console for errors

---

## Prevention

To avoid these issues in the future:

1. ✅ Always run migrations when updating schema
2. ✅ Test in development before production
3. ✅ Backup database before major changes
4. ✅ Keep `schema.sql` up to date
5. ✅ Document all schema changes

---

## Quick Health Check

Run this to check if everything is OK:

```sql
-- Check profiles
SELECT COUNT(*) as profile_count FROM profiles;

-- Check rooms
SELECT COUNT(*) as room_count FROM rooms;

-- Check policies
SELECT COUNT(*) as policy_count FROM pg_policies 
WHERE tablename IN ('rooms', 'room_members', 'transactions');

-- Check trigger
SELECT COUNT(*) as trigger_count FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Expected results:
-- profile_count: >= 1 (your profile)
-- room_count: >= 0 (may be 0 if no rooms created)
-- policy_count: >= 10 (should have multiple policies)
-- trigger_count: 1 (trigger exists)
```

If all checks pass, your database is healthy! ✅
