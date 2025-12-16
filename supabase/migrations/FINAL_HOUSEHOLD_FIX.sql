-- ============================================
-- FINAL FIX: Add created_by to households and fix all policies
-- ============================================

-- ============================================
-- STEP 1: Add created_by column to households
-- ============================================

-- Add created_by column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'households' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE households ADD COLUMN created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
    
    -- Update existing households: set created_by to the OWNER of the household
    UPDATE households h
    SET created_by = (
      SELECT hm.user_id 
      FROM household_members hm 
      WHERE hm.household_id = h.id AND hm.role = 'OWNER' 
      LIMIT 1
    );
  END IF;
END $$;

-- ============================================
-- STEP 2: Drop all existing policies
-- ============================================

DROP POLICY IF EXISTS "Users can view their households" ON households;
DROP POLICY IF EXISTS "Users can view all households" ON households;
DROP POLICY IF EXISTS "Users can view households they created or are members of" ON households;
DROP POLICY IF EXISTS "Users can view households they created" ON households;
DROP POLICY IF EXISTS "Authenticated users can view all households" ON households;
DROP POLICY IF EXISTS "Users can create households" ON households;
DROP POLICY IF EXISTS "Household owners can update" ON households;
DROP POLICY IF EXISTS "Users can update households" ON households;
DROP POLICY IF EXISTS "Creators can update their households" ON households;
DROP POLICY IF EXISTS "Household owners can delete" ON households;
DROP POLICY IF EXISTS "Users can delete households" ON households;
DROP POLICY IF EXISTS "Creators can delete their households" ON households;

DROP POLICY IF EXISTS "Users can view household members" ON household_members;
DROP POLICY IF EXISTS "Users can insert household members" ON household_members;
DROP POLICY IF EXISTS "Users can insert themselves as household members" ON household_members;
DROP POLICY IF EXISTS "Household owners can update members" ON household_members;
DROP POLICY IF EXISTS "Household creators can update members" ON household_members;
DROP POLICY IF EXISTS "Users can delete household members" ON household_members;
DROP POLICY IF EXISTS "Users can delete themselves from households" ON household_members;

-- ============================================
-- STEP 3: Create SIMPLE policies (NO RECURSION!)
-- ============================================

-- Households policies using created_by (NO RECURSION!)
-- Allow viewing all households so users can invite any household to their rooms
CREATE POLICY "Users can view all households"
  ON households FOR SELECT
  USING (true);

CREATE POLICY "Users can create households"
  ON households FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can update their households"
  ON households FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Creators can delete their households"
  ON households FOR DELETE
  USING (created_by = auth.uid());

-- ============================================
-- Household members policies (SIMPLE!)
-- ============================================

-- SELECT: Users can view their own membership OR household creator can view all members
CREATE POLICY "Users can view household members"
  ON household_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
    )
  );

-- INSERT: Only users can add themselves (when accepting invitation)
CREATE POLICY "Users can insert themselves as household members"
  ON household_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: No UPDATE policy (handle through application)

-- DELETE: Users can remove themselves OR household creator can remove members
CREATE POLICY "Users can delete themselves from households"
  ON household_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
    )
  );

-- ============================================
-- DONE! No more infinite recursion!
-- ============================================
