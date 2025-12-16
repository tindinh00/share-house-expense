-- Fix room_members policies to allow household insertion

-- Drop old insert policy
DROP POLICY IF EXISTS "Users can insert themselves as members" ON room_members;

-- Create new insert policy that allows:
-- 1. Users to insert themselves (user_id = auth.uid())
-- 2. Room owners to insert households (household_id is not null)
CREATE POLICY "Users can insert members and households"
  ON room_members FOR INSERT
  WITH CHECK (
    -- User can add themselves
    user_id = auth.uid() 
    OR 
    -- Room owner can add households
    (
      household_id IS NOT NULL 
      AND room_id IN (
        SELECT r.id FROM rooms r WHERE r.created_by = auth.uid()
      )
    )
    OR
    -- Room owner can add other users
    (
      user_id IS NOT NULL 
      AND room_id IN (
        SELECT r.id FROM rooms r WHERE r.created_by = auth.uid()
      )
    )
  );
