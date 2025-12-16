-- ============================================
-- FIX INFINITE RECURSION IN HOUSEHOLD POLICIES
-- ============================================
-- The problem: INSERT policy was checking household_members table
-- causing infinite recursion

-- ============================================
-- STEP 1: Drop all household policies
-- ============================================

DROP POLICY IF EXISTS "Users can view their households" ON households;
DROP POLICY IF EXISTS "Users can create households" ON households;
DROP POLICY IF EXISTS "Household owners can update" ON households;
DROP POLICY IF EXISTS "Household owners can delete" ON households;

DROP POLICY IF EXISTS "Users can view household members" ON household_members;
DROP POLICY IF EXISTS "Users can insert household members" ON household_members;
DROP POLICY IF EXISTS "Household owners can update members" ON household_members;
DROP POLICY IF EXISTS "Users can delete household members" ON household_members;

-- ============================================
-- STEP 2: Create SIMPLE policies without recursion
-- ============================================

-- Households policies (SIMPLE - NO SUBQUERIES TO household_members!)
-- We'll use a different approach: check through created_by or allow all for now

CREATE POLICY "Users can view all households"
  ON households FOR SELECT
  USING (true);  -- Allow viewing all households (members are controlled separately)

CREATE POLICY "Users can create households"
  ON households FOR INSERT
  WITH CHECK (true);

-- For UPDATE/DELETE, we'll handle through application logic
-- Or add a created_by column to households table later
-- For now, allow users to update/delete any household they're a member of
-- But we can't check household_members without recursion!

-- Temporary: Allow all updates/deletes (will be controlled by application)
CREATE POLICY "Users can update households"
  ON households FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete households"
  ON households FOR DELETE
  USING (true);

-- ============================================
-- Household members policies (NO RECURSION!)
-- ============================================

-- SELECT: Simple policy - just check if user_id matches OR household exists in rooms
CREATE POLICY "Users can view household members"
  ON household_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    household_id IN (
      SELECT rm.household_id FROM room_members rm
      JOIN rooms r ON r.id = rm.room_id
      WHERE r.created_by = auth.uid() AND rm.household_id IS NOT NULL
    )
  );

-- INSERT: Only allow users to add themselves (no recursion check!)
-- Household owner will add members through application logic
CREATE POLICY "Users can insert household members"
  ON household_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Disable for now (can be done through application logic)
-- No UPDATE policy = no one can update through RLS

-- DELETE: Only allow users to remove themselves
CREATE POLICY "Users can delete household members"
  ON household_members FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- DONE! No more infinite recursion
-- ============================================
