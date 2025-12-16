-- Fix infinite recursion in room policies
-- This migration fixes the circular dependency between rooms and room_members policies

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Users can view their own rooms" ON rooms;
DROP POLICY IF EXISTS "Users can view their own membership" ON room_members;
DROP POLICY IF EXISTS "Room creators can view all members" ON room_members;

-- Recreate room_members policies (simple, no recursion)
CREATE POLICY "Users can view their own membership"
  ON room_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      household_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM household_members hm
        WHERE hm.household_id = room_members.household_id
        AND hm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Room creators can view all members"
  ON room_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rooms r 
      WHERE r.id = room_id 
      AND r.created_by = auth.uid()
    )
  );

-- Recreate rooms policy with IN subquery to avoid recursion
CREATE POLICY "Users can view their own rooms"
  ON rooms FOR SELECT
  USING (
    created_by = auth.uid()
    OR id IN (
      SELECT rm.room_id 
      FROM room_members rm
      WHERE rm.user_id = auth.uid()
    )
    OR id IN (
      SELECT rm.room_id
      FROM room_members rm
      INNER JOIN household_members hm ON hm.household_id = rm.household_id
      WHERE hm.user_id = auth.uid()
    )
  );
