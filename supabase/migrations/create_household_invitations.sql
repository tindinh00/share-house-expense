-- Create household_invitations table for invitation system

CREATE TABLE IF NOT EXISTS household_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  invited_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(household_id, invited_user_id)
);

-- Enable RLS
ALTER TABLE household_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their invitations" ON household_invitations;
DROP POLICY IF EXISTS "Household creators can view sent invitations" ON household_invitations;
DROP POLICY IF EXISTS "Household creators can create invitations" ON household_invitations;
DROP POLICY IF EXISTS "Invited users can update invitations" ON household_invitations;
DROP POLICY IF EXISTS "Household creators can delete invitations" ON household_invitations;

-- Policies for household_invitations

-- Users can view invitations sent to them
CREATE POLICY "Users can view their invitations"
  ON household_invitations FOR SELECT
  USING (invited_user_id = auth.uid());

-- Household creators can view invitations they sent
CREATE POLICY "Household creators can view sent invitations"
  ON household_invitations FOR SELECT
  USING (
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
    )
  );

-- Household creators can create invitations
CREATE POLICY "Household creators can create invitations"
  ON household_invitations FOR INSERT
  WITH CHECK (
    invited_by = auth.uid()
    AND household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
    )
  );

-- Invited users can update their invitations (accept/reject)
CREATE POLICY "Invited users can update invitations"
  ON household_invitations FOR UPDATE
  USING (invited_user_id = auth.uid())
  WITH CHECK (invited_user_id = auth.uid());

-- Household creators can delete invitations
CREATE POLICY "Household creators can delete invitations"
  ON household_invitations FOR DELETE
  USING (
    household_id IN (
      SELECT id FROM households WHERE created_by = auth.uid()
    )
  );

-- Drop existing indexes if any
DROP INDEX IF EXISTS idx_household_invitations_invited_user;
DROP INDEX IF EXISTS idx_household_invitations_household;
DROP INDEX IF EXISTS idx_household_invitations_status;

-- Create index for faster queries
CREATE INDEX idx_household_invitations_invited_user ON household_invitations(invited_user_id);
CREATE INDEX idx_household_invitations_household ON household_invitations(household_id);
CREATE INDEX idx_household_invitations_status ON household_invitations(status);

-- Drop existing trigger and function if any
DROP TRIGGER IF EXISTS household_invitations_updated_at ON household_invitations;
DROP FUNCTION IF EXISTS update_household_invitation_updated_at();

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_household_invitation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER household_invitations_updated_at
  BEFORE UPDATE ON household_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_household_invitation_updated_at();
