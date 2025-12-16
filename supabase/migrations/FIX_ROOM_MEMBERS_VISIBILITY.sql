-- ============================================
-- FIX ROOM MEMBERS VISIBILITY
-- ============================================
-- Allow users to see all members in rooms they belong to

-- Drop and recreate room_members_select policy
DROP POLICY IF EXISTS "room_members_select" ON room_members;

CREATE POLICY "room_members_select"
  ON room_members FOR SELECT
  TO authenticated
  USING (
    -- Can see own membership
    user_id = auth.uid()
    -- Can see household membership if user is in that household
    OR household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
    -- Can see all members in rooms where user is a member (directly)
    OR room_id IN (
      SELECT room_id FROM room_members WHERE user_id = auth.uid()
    )
    -- Can see all members in rooms where user's household is a member
    OR room_id IN (
      SELECT rm.room_id 
      FROM room_members rm
      WHERE rm.household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
  );

-- Verify
SELECT 'Room members visibility fixed!' as status;
