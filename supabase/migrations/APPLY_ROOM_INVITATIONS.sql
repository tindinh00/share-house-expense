-- ============================================
-- ROOM INVITATION SYSTEM - COMPLETE MIGRATION
-- ============================================
-- Run this file in Supabase SQL Editor to enable room invitation system

-- Step 1: Create room_invitations table
CREATE TABLE IF NOT EXISTS room_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES rooms ON DELETE CASCADE NOT NULL,
  invited_user_id UUID REFERENCES profiles ON DELETE CASCADE,
  invited_household_id UUID REFERENCES households ON DELETE CASCADE,
  invited_by UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CHECK (
    (invited_user_id IS NOT NULL AND invited_household_id IS NULL) OR
    (invited_user_id IS NULL AND invited_household_id IS NOT NULL)
  ),
  UNIQUE(room_id, invited_user_id),
  UNIQUE(room_id, invited_household_id)
);

-- Enable RLS
ALTER TABLE room_invitations ENABLE ROW LEVEL SECURITY;

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_room_invitations_invited_user ON room_invitations(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_room_invitations_invited_household ON room_invitations(invited_household_id);
CREATE INDEX IF NOT EXISTS idx_room_invitations_room ON room_invitations(room_id);
CREATE INDEX IF NOT EXISTS idx_room_invitations_status ON room_invitations(status);

-- Step 3: Create policies for room_invitations
-- Room creator can view all invitations for their rooms
DROP POLICY IF EXISTS "Room creators can view invitations" ON room_invitations;
CREATE POLICY "Room creators can view invitations"
  ON room_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rooms r 
      WHERE r.id = room_id 
      AND r.created_by = auth.uid()
    )
  );

-- Invited users can view their own invitations
DROP POLICY IF EXISTS "Users can view their invitations" ON room_invitations;
CREATE POLICY "Users can view their invitations"
  ON room_invitations FOR SELECT
  USING (invited_user_id = auth.uid());

-- Invited household members can view household invitations
DROP POLICY IF EXISTS "Household members can view household invitations" ON room_invitations;
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

-- Room creator can create invitations
DROP POLICY IF EXISTS "Room creators can create invitations" ON room_invitations;
CREATE POLICY "Room creators can create invitations"
  ON room_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms r 
      WHERE r.id = room_id 
      AND r.created_by = auth.uid()
    )
    AND invited_by = auth.uid()
  );

-- Invited users can update their own invitations (accept/reject)
DROP POLICY IF EXISTS "Users can update their invitations" ON room_invitations;
CREATE POLICY "Users can update their invitations"
  ON room_invitations FOR UPDATE
  USING (invited_user_id = auth.uid())
  WITH CHECK (invited_user_id = auth.uid());

-- Household owners can update household invitations (accept/reject)
DROP POLICY IF EXISTS "Household owners can update household invitations" ON room_invitations;
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

-- Room creator can delete invitations
DROP POLICY IF EXISTS "Room creators can delete invitations" ON room_invitations;
CREATE POLICY "Room creators can delete invitations"
  ON room_invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM rooms r 
      WHERE r.id = room_id 
      AND r.created_by = auth.uid()
    )
  );

-- Step 4: Create trigger function to auto-add member when invitation is accepted
CREATE OR REPLACE FUNCTION handle_room_invitation_accepted()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Add to room_members
    IF NEW.invited_user_id IS NOT NULL THEN
      INSERT INTO room_members (room_id, user_id)
      VALUES (NEW.room_id, NEW.invited_user_id)
      ON CONFLICT (room_id, user_id) DO NOTHING;
    ELSIF NEW.invited_household_id IS NOT NULL THEN
      INSERT INTO room_members (room_id, household_id)
      VALUES (NEW.room_id, NEW.invited_household_id)
      ON CONFLICT (room_id, household_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_room_invitation_accepted ON room_invitations;
CREATE TRIGGER on_room_invitation_accepted
  AFTER UPDATE ON room_invitations
  FOR EACH ROW
  EXECUTE FUNCTION handle_room_invitation_accepted();

-- Step 5: Fix infinite recursion in policies
-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view their own rooms" ON rooms;
DROP POLICY IF EXISTS "Users can view their own membership" ON room_members;
DROP POLICY IF EXISTS "Room creators can view all members" ON room_members;

-- Recreate room_members policies (simple, no recursion)
CREATE POLICY "Users can view their own membership"
  ON room_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      household_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM household_members hm
        WHERE hm.household_id = room_members.household_id
        AND hm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Room creators can view all members"
  ON room_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rooms r 
      WHERE r.id = room_id 
      AND r.created_by = auth.uid()
    )
  );

-- Recreate rooms policy with IN subquery to avoid recursion
CREATE POLICY "Users can view their own rooms"
  ON rooms FOR SELECT
  USING (
    created_by = auth.uid()
    OR id IN (
      SELECT rm.room_id 
      FROM room_members rm
      WHERE rm.user_id = auth.uid()
    )
    OR id IN (
      SELECT rm.room_id
      FROM room_members rm
      INNER JOIN household_members hm ON hm.household_id = rm.household_id
      WHERE hm.user_id = auth.uid()
    )
  );

-- Done!
-- Now you can:
-- 1. Invite users to rooms (they receive notifications)
-- 2. Invite households to rooms (household owner receives notification)
-- 3. Accept/reject invitations
-- 4. Auto-add to room_members when accepted
