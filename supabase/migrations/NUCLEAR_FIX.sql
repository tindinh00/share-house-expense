-- ============================================
-- NUCLEAR FIX - DROP ALL POLICIES AND RECREATE
-- ============================================
-- This completely removes all policies and recreates them from scratch

-- Step 1: Drop ALL policies on rooms and room_members
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on rooms
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'rooms') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON rooms';
    END LOOP;
    
    -- Drop all policies on room_members
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'room_members') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON room_members';
    END LOOP;
    
    -- Drop all policies on room_invitations
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'room_invitations') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON room_invitations';
    END LOOP;
END $$;

-- Step 2: Create simple, non-recursive policies for room_members
CREATE POLICY "room_members_select"
  ON room_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "room_members_insert"
  ON room_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "room_members_delete"
  ON room_members FOR DELETE
  USING (
    room_id IN (SELECT id FROM rooms WHERE created_by = auth.uid())
  );

-- Step 3: Create simple, non-recursive policy for rooms
-- Use a materialized subquery approach
CREATE POLICY "rooms_select"
  ON rooms FOR SELECT
  USING (
    created_by = auth.uid()
    OR id IN (
      SELECT room_id FROM room_members WHERE user_id = auth.uid()
    )
    OR id IN (
      SELECT rm.room_id 
      FROM room_members rm
      WHERE rm.household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "rooms_insert"
  ON rooms FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "rooms_update"
  ON rooms FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "rooms_delete"
  ON rooms FOR DELETE
  USING (created_by = auth.uid());

-- Step 4: Create policies for room_invitations (no recursion)
CREATE POLICY "room_invitations_select_user"
  ON room_invitations FOR SELECT
  USING (invited_user_id = auth.uid());

CREATE POLICY "room_invitations_select_household"
  ON room_invitations FOR SELECT
  USING (
    invited_household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "room_invitations_select_creator"
  ON room_invitations FOR SELECT
  USING (invited_by = auth.uid());

CREATE POLICY "room_invitations_insert"
  ON room_invitations FOR INSERT
  WITH CHECK (invited_by = auth.uid());

CREATE POLICY "room_invitations_update_user"
  ON room_invitations FOR UPDATE
  USING (invited_user_id = auth.uid());

CREATE POLICY "room_invitations_update_household"
  ON room_invitations FOR UPDATE
  USING (
    invited_household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() AND role = 'OWNER'
    )
  );

CREATE POLICY "room_invitations_delete"
  ON room_invitations FOR DELETE
  USING (invited_by = auth.uid());

-- Verify
SELECT 'Nuclear fix completed! All policies recreated.' as status;
