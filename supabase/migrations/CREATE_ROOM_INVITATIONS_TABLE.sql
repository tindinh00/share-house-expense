-- ============================================
-- CREATE ROOM INVITATIONS TABLE & TRIGGER
-- ============================================

-- Create room_invitations table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_room_invitations_invited_user ON room_invitations(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_room_invitations_invited_household ON room_invitations(invited_household_id);
CREATE INDEX IF NOT EXISTS idx_room_invitations_room ON room_invitations(room_id);
CREATE INDEX IF NOT EXISTS idx_room_invitations_status ON room_invitations(status);

-- Create trigger function to auto-add member when invitation is accepted
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

-- Verify
SELECT 'Room invitations table created successfully!' as status;
