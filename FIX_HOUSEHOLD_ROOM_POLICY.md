# Fix Household & Room Members Policies

## Vấn đề
Khi thêm household vào room hoặc quản lý household members, gặp lỗi:
```
new row violates row-level security policy for table "room_members"
new row violates row-level security policy for table "household_members"
```

## Nguyên nhân
1. Bảng `households` và `household_members` chưa có RLS policies
2. Policy INSERT của `room_members` chỉ cho phép user tự thêm mình, không cho phép room owner thêm household

## Giải pháp
Chạy SQL migration để thêm đầy đủ RLS policies:

### Bước 1: Mở Supabase SQL Editor
1. Vào https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào **SQL Editor** (menu bên trái)

### Bước 2: Chọn SQL phù hợp

**Nếu bạn chưa chạy migration nào:**
- Chạy file `supabase/migrations/COMPLETE_HOUSEHOLD_FIX.sql` (đầy đủ)

**Nếu bạn đã chạy một phần và gặp lỗi "policy already exists":**
- Chạy file `supabase/migrations/HOUSEHOLD_POLICIES_ONLY.sql` (chỉ households)

### Bước 3: Chạy SQL
Copy nội dung file đã chọn và paste vào SQL Editor, sau đó click **Run**.

<details>
<summary>📋 Click để xem SQL đầy đủ (COMPLETE_HOUSEHOLD_FIX.sql)</summary>

```sql
-- ============================================
-- COMPLETE HOUSEHOLD & ROOM MEMBERS FIX
-- ============================================

-- Enable RLS
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

-- Households policies
DROP POLICY IF EXISTS "Users can view their households" ON households;
DROP POLICY IF EXISTS "Users can create households" ON households;
DROP POLICY IF EXISTS "Household owners can update" ON households;
DROP POLICY IF EXISTS "Household owners can delete" ON households;

CREATE POLICY "Users can view their households"
  ON households FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm 
      WHERE hm.household_id = households.id 
      AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create households"
  ON households FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Household owners can update"
  ON households FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm 
      WHERE hm.household_id = households.id 
      AND hm.user_id = auth.uid()
      AND hm.role = 'OWNER'
    )
  );

CREATE POLICY "Household owners can delete"
  ON households FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm 
      WHERE hm.household_id = households.id 
      AND hm.user_id = auth.uid()
      AND hm.role = 'OWNER'
    )
  );

-- Household members policies
DROP POLICY IF EXISTS "Users can view household members" ON household_members;
DROP POLICY IF EXISTS "Users can insert household members" ON household_members;
DROP POLICY IF EXISTS "Household owners can update members" ON household_members;
DROP POLICY IF EXISTS "Users can delete household members" ON household_members;

CREATE POLICY "Users can view household members"
  ON household_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm 
      WHERE hm.household_id = household_members.household_id 
      AND hm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM room_members rm
      JOIN rooms r ON r.id = rm.room_id
      WHERE rm.household_id = household_members.household_id
      AND r.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert household members"
  ON household_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM household_members hm 
      WHERE hm.household_id = household_members.household_id 
      AND hm.user_id = auth.uid()
      AND hm.role = 'OWNER'
    )
  );

CREATE POLICY "Household owners can update members"
  ON household_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm 
      WHERE hm.household_id = household_members.household_id 
      AND hm.user_id = auth.uid()
      AND hm.role = 'OWNER'
    )
  );

CREATE POLICY "Users can delete household members"
  ON household_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM household_members hm 
      WHERE hm.household_id = household_members.household_id 
      AND hm.user_id = auth.uid()
      AND hm.role = 'OWNER'
    )
  );

-- Fix room_members policies
DROP POLICY IF EXISTS "Users can insert themselves as members" ON room_members;

CREATE POLICY "Users can insert members and households"
  ON room_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid() 
    OR 
    (
      household_id IS NOT NULL 
      AND room_id IN (
        SELECT r.id FROM rooms r WHERE r.created_by = auth.uid()
      )
    )
    OR
    (
      user_id IS NOT NULL 
      AND room_id IN (
        SELECT r.id FROM rooms r WHERE r.created_by = auth.uid()
      )
    )
  );
```
</details>

<details>
<summary>📋 Click để xem SQL chỉ households (HOUSEHOLD_POLICIES_ONLY.sql)</summary>

```sql
-- HOUSEHOLD POLICIES ONLY
-- Run this if you already have room_members policies fixed

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

-- Households policies
DROP POLICY IF EXISTS "Users can view their households" ON households;
DROP POLICY IF EXISTS "Users can create households" ON households;
DROP POLICY IF EXISTS "Household owners can update" ON households;
DROP POLICY IF EXISTS "Household owners can delete" ON households;

CREATE POLICY "Users can view their households"
  ON households FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm 
      WHERE hm.household_id = households.id 
      AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create households"
  ON households FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Household owners can update"
  ON households FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm 
      WHERE hm.household_id = households.id 
      AND hm.user_id = auth.uid()
      AND hm.role = 'OWNER'
    )
  );

CREATE POLICY "Household owners can delete"
  ON households FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm 
      WHERE hm.household_id = households.id 
      AND hm.user_id = auth.uid()
      AND hm.role = 'OWNER'
    )
  );

-- Household members policies
DROP POLICY IF EXISTS "Users can view household members" ON household_members;
DROP POLICY IF EXISTS "Users can insert household members" ON household_members;
DROP POLICY IF EXISTS "Household owners can update members" ON household_members;
DROP POLICY IF EXISTS "Users can delete household members" ON household_members;

CREATE POLICY "Users can view household members"
  ON household_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm 
      WHERE hm.household_id = household_members.household_id 
      AND hm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM room_members rm
      JOIN rooms r ON r.id = rm.room_id
      WHERE rm.household_id = household_members.household_id
      AND r.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert household members"
  ON household_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM household_members hm 
      WHERE hm.household_id = household_members.household_id 
      AND hm.user_id = auth.uid()
      AND hm.role = 'OWNER'
    )
  );

CREATE POLICY "Household owners can update members"
  ON household_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm 
      WHERE hm.household_id = household_members.household_id 
      AND hm.user_id = auth.uid()
      AND hm.role = 'OWNER'
    )
  );

CREATE POLICY "Users can delete household members"
  ON household_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM household_members hm 
      WHERE hm.household_id = household_members.household_id 
      AND hm.user_id = auth.uid()
      AND hm.role = 'OWNER'
    )
  );
```
</details>

### Bước 4: Verify
Sau khi chạy xong, thử lại chức năng thêm household vào room.

## Tính năng sau khi fix

### Households
✅ User có thể tạo household mới
✅ User có thể xem households mà mình là thành viên
✅ Household owner có thể sửa tên household
✅ Household owner có thể xóa household
✅ Household owner có thể thêm/xóa thành viên
✅ User có thể xem thành viên trong household của mình

### Room Members
✅ User có thể tự thêm mình vào room
✅ Room owner có thể thêm household vào room
✅ Room owner có thể mời user khác vào room
✅ Room owner có thể xóa household/user khỏi room

### Household Management trong Room Detail
✅ Xem danh sách households trong room
✅ Click "Chi tiết" để xem và quản lý household
✅ Sửa tên household
✅ Thêm thành viên vào household
✅ Xóa thành viên khỏi household (trừ owner)
✅ Xóa household khỏi room
