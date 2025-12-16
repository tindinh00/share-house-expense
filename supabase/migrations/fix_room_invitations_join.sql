-- ============================================
-- FIX ROOM INVITATIONS JOIN WITH ROOMS
-- ============================================
-- Allow room_invitations to join with rooms table

-- The issue is that when querying room_invitations with rooms join,
-- the rooms policy blocks the join even though user has permission to see the invitation

-- Solution: Add a policy that allows viewing rooms if there's a pending invitation
DROP POLICY IF EXISTS "rooms_select_for_invitations" ON rooms;

CREATE POLICY "rooms_select_for_invitations"
  ON rooms FOR SELECT
  USING (
    -- Allow if user has invitation to this room
    id IN (
      SELECT room_id 
      FROM room_invitations 
      WHERE invited_user_id = auth.uid() 
        AND status = 'pending'
    )
    OR id IN (
      SELECT ri.room_id
      FROM room_invitations ri
      INNER JOIN household_members hm ON hm.household_id = ri.invited_household_id
      WHERE hm.user_id = auth.uid()
        AND ri.status = 'pending'
    )
  );

-- Verify
SELECT 'Room invitations join fix completed!' as status;
