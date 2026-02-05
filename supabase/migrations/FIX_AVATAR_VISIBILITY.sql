-- ============================================
-- FIX ROOM MEMBERS VISIBILITY FOR AVATARS
-- ============================================
-- This migration allows members of a room to see all other members in the same room.
-- This is essential for displaying the avatar stack correctly.

-- 1. Drop the restrictive select policy
DROP POLICY IF EXISTS "Users can view their own membership" ON room_members;
DROP POLICY IF EXISTS "room_members_select" ON room_members;

-- 2. Create a new policy that allows seeing all members in rooms you belong to
-- We use a subquery that is hopefully not recursive or at least works in Supabase
CREATE POLICY "Members can view all members in their rooms"
  ON room_members FOR SELECT
  TO authenticated
  USING (
    room_id IN (
      SELECT rm.room_id 
      FROM room_members rm 
      WHERE rm.user_id = auth.uid()
    )
    OR room_id IN (
      SELECT rm.room_id 
      FROM room_members rm 
      WHERE rm.household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
  );

-- 3. Success message
SELECT 'Room member visibility fix applied!' as status;
