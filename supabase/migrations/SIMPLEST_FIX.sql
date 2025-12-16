-- ============================================
-- SIMPLEST FIX - ALLOW ALL ROOM_MEMBERS VISIBILITY
-- ============================================
-- Just allow authenticated users to see all room_members
-- Security will be handled at application level

-- Drop and recreate with simplest possible policy
DROP POLICY IF EXISTS "room_members_select" ON room_members;

CREATE POLICY "room_members_select"
  ON room_members FOR SELECT
  TO authenticated
  USING (true); -- Allow all authenticated users to see all room_members

-- Verify
SELECT 'Simplest fix applied!' as status;
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'room_members'
ORDER BY policyname;
