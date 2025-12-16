-- ============================================
-- ENSURE ROOM INVITATION TRIGGER EXISTS
-- ============================================
-- Make sure trigger is created to auto-add members when invitation is accepted

-- Create or replace the trigger function
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

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_room_invitation_accepted ON room_invitations;
CREATE TRIGGER on_room_invitation_accepted
  AFTER UPDATE ON room_invitations
  FOR EACH ROW
  EXECUTE FUNCTION handle_room_invitation_accepted();

-- Verify trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_room_invitation_accepted';

-- Also verify that household members can see rooms
-- This should show the policy
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'rooms'
  AND policyname LIKE '%select%'
ORDER BY policyname;
