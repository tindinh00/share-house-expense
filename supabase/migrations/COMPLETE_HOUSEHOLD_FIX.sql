-- ============================================
-- COMPLETE HOUSEHOLD & ROOM MEMBERS FIX
-- ============================================
-- This migration fixes all RLS policies for households and room_members
-- Run this in Supabase SQL Editor

-- ============================================
-- PART 1: Enable RLS for households tables
-- ============================================

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 2: Households policies
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their households" ON households;
DROP POLICY IF EXISTS "Users can create households" ON households;
DROP POLICY IF EXISTS "Household owners can update" ON households;
DROP POLICY IF EXISTS "Household owners can delete" ON households;

-- Users can view households they are members of
CREATE POLICY "Users can view their households"
  ON households FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm 
      WHERE hm.household_id = households.id 
      AND hm.user_id = auth.uid()
    )
  );

-- Users can create households
CREATE POLICY "Users can create households"
  ON households FOR INSERT
  WITH CHECK (true);

-- Household owners can update their households
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

-- Household owners can delete their households
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

-- ============================================
-- PART 3: Household members policies
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view household members" ON household_members;
DROP POLICY IF EXISTS "Users can insert household members" ON household_members;
DROP POLICY IF EXISTS "Household owners can update members" ON household_members;
DROP POLICY IF EXISTS "Users can delete household members" ON household_members;

-- Users can view members of their households
CREATE POLICY "Users can view household members"
  ON household_members FOR SELECT
  USING (
    -- User is a member of this household
    EXISTS (
      SELECT 1 FROM household_members hm 
      WHERE hm.household_id = household_members.household_id 
      AND hm.user_id = auth.uid()
    )
    OR
    -- Or user is viewing through a room
    EXISTS (
      SELECT 1 FROM room_members rm
      JOIN rooms r ON r.id = rm.room_id
      WHERE rm.household_id = household_members.household_id
      AND r.created_by = auth.uid()
    )
  );

-- Users can add themselves to households (when invited)
-- Household owners can add members
CREATE POLICY "Users can insert household members"
  ON household_members FOR INSERT
  WITH CHECK (
    -- User adding themselves
    user_id = auth.uid()
    OR
    -- Household owner adding members
    EXISTS (
      SELECT 1 FROM household_members hm 
      WHERE hm.household_id = household_members.household_id 
      AND hm.user_id = auth.uid()
      AND hm.role = 'OWNER'
    )
  );

-- Household owners can update member roles
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

-- Household owners can remove members
-- Users can remove themselves
CREATE POLICY "Users can delete household members"
  ON household_members FOR DELETE
  USING (
    -- User removing themselves
    user_id = auth.uid()
    OR
    -- Household owner removing members
    EXISTS (
      SELECT 1 FROM household_members hm 
      WHERE hm.household_id = household_members.household_id 
      AND hm.user_id = auth.uid()
      AND hm.role = 'OWNER'
    )
  );

-- ============================================
-- PART 4: Fix room_members policies
-- ============================================

-- Drop old insert policies (all possible names)
DROP POLICY IF EXISTS "Users can insert themselves as members" ON room_members;
DROP POLICY IF EXISTS "Users can insert members and households" ON room_members;

-- Create new insert policy that allows:
-- 1. Users to insert themselves (user_id = auth.uid())
-- 2. Room owners to insert households (household_id is not null)
-- 3. Room owners to invite other users
CREATE POLICY "Users can insert members and households"
  ON room_members FOR INSERT
  WITH CHECK (
    -- User can add themselves
    user_id = auth.uid() 
    OR 
    -- Room owner can add households
    (
      household_id IS NOT NULL 
      AND room_id IN (
        SELECT r.id FROM rooms r WHERE r.created_by = auth.uid()
      )
    )
    OR
    -- Room owner can add other users
    (
      user_id IS NOT NULL 
      AND room_id IN (
        SELECT r.id FROM rooms r WHERE r.created_by = auth.uid()
      )
    )
  );

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the policies are working:

-- Check households policies
-- SELECT * FROM households;

-- Check household_members policies  
-- SELECT * FROM household_members;

-- Check room_members policies
-- SELECT * FROM room_members;
