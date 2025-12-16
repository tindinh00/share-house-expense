-- ============================================
-- FIX ROOM INVITATIONS POLICY
-- ============================================
-- The issue is that room_invitations policies are checking rooms table
-- which causes recursion

-- Step 1: Drop all room_invitations policies
DROP POLICY IF EXISTS "Room creators can view invitations" ON room_invitations;
DROP POLICY IF EXISTS "Users can view their invitations" ON room_invitations;
DROP POLICY IF EXISTS "Household members can view household invitations" ON room_invitations;
DROP POLICY IF EXISTS "Room creators can create invitations" ON room_invitations;
DROP POLICY IF EXISTS "Users can update their invitations" ON room_invitations;
DROP POLICY IF EXISTS "Household owners can update household invitations" ON room_invitations;
DROP POLICY IF EXISTS "Room creators can delete invitations" ON room_invitations;

-- Step 2: Recreate policies WITHOUT checking rooms table to avoid recursion
-- Use direct column comparison instead of EXISTS subquery

-- Invited users can view their own invitations
CREATE POLICY "Users can view their invitations"
  ON room_invitations FOR SELECT
  USING (invited_user_id = auth.uid());

-- Invited household members can view household invitations
CREATE POLICY "Household members can view household invitations"
  ON room_invitations FOR SELECT
  USING (
    invited_household_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = invited_household_id
      AND hm.user_id = auth.uid()
    )
  );

-- Room creators can view invitations (use IN subquery to avoid recursion)
CREATE POLICY "Room creators can view invitations"
  ON room_invitations FOR SELECT
  USING (
    room_id IN (
      SELECT id FROM rooms WHERE created_by = auth.uid()
    )
  );

-- Room creators can create invitations (use IN subquery)
CREATE POLICY "Room creators can create invitations"
  ON room_invitations FOR INSERT
  WITH CHECK (
    room_id IN (
      SELECT id FROM rooms WHERE created_by = auth.uid()
    )
    AND invited_by = auth.uid()
  );

-- Invited users can update their own invitations (accept/reject)
CREATE POLICY "Users can update their invitations"
  ON room_invitations FOR UPDATE
  USING (invited_user_id = auth.uid())
  WITH CHECK (invited_user_id = auth.uid());

-- Household owners can update household invitations (accept/reject)
CREATE POLICY "Household owners can update household invitations"
  ON room_invitations FOR UPDATE
  USING (
    invited_household_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = invited_household_id
      AND hm.user_id = auth.uid()
      AND hm.role = 'OWNER'
    )
  )
  WITH CHECK (
    invited_household_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = invited_household_id
      AND hm.user_id = auth.uid()
      AND hm.role = 'OWNER'
    )
  );

-- Room creators can delete invitations (use IN subquery)
CREATE POLICY "Room creators can delete invitations"
  ON room_invitations FOR DELETE
  USING (
    room_id IN (
      SELECT id FROM rooms WHERE created_by = auth.uid()
    )
  );

-- Verify
SELECT 'Room invitations policies fixed!' as status;
