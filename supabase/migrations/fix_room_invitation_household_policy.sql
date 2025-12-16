-- ============================================
-- FIX ROOM INVITATION HOUSEHOLD POLICY
-- ============================================
-- Allow household owners to see room invitations for their households

-- Drop and recreate the policy with case-insensitive role check
DROP POLICY IF EXISTS "room_invitations_select_household" ON room_invitations;

CREATE POLICY "room_invitations_select_household"
  ON room_invitations FOR SELECT
  USING (
    invited_household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
        AND LOWER(role) = 'owner'
    )
  );

-- Also update the update policy
DROP POLICY IF EXISTS "room_invitations_update_household" ON room_invitations;

CREATE POLICY "room_invitations_update_household"
  ON room_invitations FOR UPDATE
  USING (
    invited_household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
        AND LOWER(role) = 'owner'
    )
  );

-- Verify
SELECT 'Room invitation household policy fixed!' as status;
