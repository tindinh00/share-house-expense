-- Migration: Add Custom Categories Support
-- Date: 2026-01-12
-- Description: Thêm hỗ trợ categories tùy chỉnh (user + room level)
-- 
-- ⚠️ CẢNH BÁO SUPABASE: "destructive operation" là do DROP POLICY
--    Đây là AN TOÀN vì chỉ xóa quy tắc bảo mật, KHÔNG xóa data!
--
-- =====================================================
-- PHẦN 1: THÊM COLUMNS (100% AN TOÀN - KHÔNG MẤT DATA)
-- =====================================================

-- Thêm cột created_by - ai tạo category này (NULL = system)
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Thêm cột room_id - category thuộc room nào (NULL = global)
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id) ON DELETE CASCADE;

-- Thêm cột is_system - đánh dấu category hệ thống
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;

-- =====================================================
-- PHẦN 2: CẬP NHẬT DATA (100% AN TOÀN)
-- =====================================================

-- Đánh dấu 6 categories mặc định là system categories
-- Chỉ UPDATE, không DELETE
UPDATE categories 
SET is_system = TRUE 
WHERE created_by IS NULL AND room_id IS NULL;

-- =====================================================
-- PHẦN 3: TẠO INDEXES (100% AN TOÀN)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_categories_created_by ON categories(created_by);
CREATE INDEX IF NOT EXISTS idx_categories_room_id ON categories(room_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_system ON categories(is_system);

-- =====================================================
-- PHẦN 4: CẬP NHẬT RLS POLICIES
-- ⚠️ DROP POLICY chỉ xóa quy tắc bảo mật, KHÔNG xóa data
-- =====================================================

-- Xóa policy cũ (nếu tồn tại)
DROP POLICY IF EXISTS "Everyone can view categories" ON categories;

-- Policy 1: Xem categories
CREATE POLICY "Users can view accessible categories"
  ON categories FOR SELECT
  USING (
    is_system = TRUE 
    OR created_by = auth.uid()
    OR room_id IN (
      SELECT rm.room_id FROM room_members rm 
      WHERE rm.user_id = auth.uid()
    )
    OR room_id IN (
      SELECT rm.room_id FROM room_members rm
      JOIN household_members hm ON rm.household_id = hm.household_id
      WHERE hm.user_id = auth.uid()
    )
  );

-- Policy 2: Tạo categories
CREATE POLICY "Users can create personal categories"
  ON categories FOR INSERT
  WITH CHECK (
    created_by = auth.uid() 
    AND is_system = FALSE
    AND (
      room_id IS NULL 
      OR room_id IN (
        SELECT rm.room_id FROM room_members rm WHERE rm.user_id = auth.uid()
      )
      OR room_id IN (
        SELECT rm.room_id FROM room_members rm
        JOIN household_members hm ON rm.household_id = hm.household_id
        WHERE hm.user_id = auth.uid()
      )
    )
  );

-- Policy 3: Sửa categories của mình
CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (created_by = auth.uid() AND is_system = FALSE)
  WITH CHECK (created_by = auth.uid() AND is_system = FALSE);

-- Policy 4: Xóa categories của mình
CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (created_by = auth.uid() AND is_system = FALSE);

-- =====================================================
-- KIỂM TRA SAU KHI CHẠY
-- =====================================================
-- Chạy query này để verify:
-- SELECT id, name, is_system, created_by, room_id FROM categories;
-- 
-- Kết quả mong đợi: 6 categories với is_system = TRUE

