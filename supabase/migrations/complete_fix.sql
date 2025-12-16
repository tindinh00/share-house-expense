-- Complete Fix for Room Management
-- Run this SQL in Supabase SQL Editor to fix all issues

-- ============================================
-- Part 1: Add created_by column to rooms
-- ============================================

-- Add column if not exists
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Set existing rooms' created_by to the first member
UPDATE rooms r
SET created_by = (
  SELECT rm.user_id 
  FROM room_members rm 
  WHERE rm.room_id = r.id 
  AND rm.user_id IS NOT NULL
  LIMIT 1
)
WHERE created_by IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_created_by ON rooms(created_by);

-- ============================================
-- Part 2: Fix RLS policies (remove recursion)
-- ============================================

-- Fix rooms policies
DROP POLICY IF EXISTS "Users can view rooms they are members of" ON rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;

CREATE POLICY "Users can view their own rooms"
  ON rooms FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can create rooms"
  ON rooms FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own rooms"
  ON rooms FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own rooms"
  ON rooms FOR DELETE
  USING (created_by = auth.uid());

-- Fix room_members policies
DROP POLICY IF EXISTS "Users can view members of their rooms" ON room_members;
DROP POLICY IF EXISTS "Room owners can manage members" ON room_members;

CREATE POLICY "Users can view their own membership"
  ON room_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Room creators can view all members"
  ON room_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM rooms r WHERE r.id = room_id AND r.created_by = auth.uid()
  ));

CREATE POLICY "Users can insert themselves as members"
  ON room_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Room creators can delete members"
  ON room_members FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM rooms r WHERE r.id = room_id AND r.created_by = auth.uid()
  ));

-- Fix transactions policies
DROP POLICY IF EXISTS "Users can view transactions in their rooms" ON transactions;
DROP POLICY IF EXISTS "Users can create transactions in their rooms" ON transactions;

CREATE POLICY "Users can view transactions in their rooms"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_members rm 
      WHERE rm.room_id = transactions.room_id 
      AND rm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create transactions in their rooms"
  ON transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM room_members rm 
      WHERE rm.room_id = transactions.room_id 
      AND rm.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- ============================================
-- Verification
-- ============================================

-- Check if created_by column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rooms' AND column_name = 'created_by';

-- Check policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'room_members';

-- Success message
SELECT 'Migration completed successfully! Refresh your app.' as status;
