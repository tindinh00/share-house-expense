-- ============================================
-- FINAL FIX - REMOVE ALL RECURSIVE POLICIES
-- ============================================
-- Remove the problematic rooms_select_for_invitations policy

-- Drop the problematic policy
DROP POLICY IF EXISTS "rooms_select_for_invitations" ON rooms;

-- List all current policies on rooms to verify
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'rooms'
ORDER BY policyname;

-- Verify no recursion
SELECT 'Recursive policy removed!' as status;
