-- Fix infinite recursion in room_members policies

-- Drop old policies
DROP POLICY IF EXISTS "Users can view members of their rooms" ON room_members;
DROP POLICY IF EXISTS "Room owners can manage members" ON room_members;

-- Create new policies without recursion
CREATE POLICY "Users can view members of their rooms"
  ON room_members FOR SELECT
  USING (user_id = auth.uid() OR room_id IN (
    SELECT r.id FROM rooms r WHERE r.created_by = auth.uid()
  ));

CREATE POLICY "Users can insert themselves as members"
  ON room_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Room creators can manage members"
  ON room_members FOR UPDATE
  USING (room_id IN (
    SELECT r.id FROM rooms r WHERE r.created_by = auth.uid()
  ));

CREATE POLICY "Room creators can delete members"
  ON room_members FOR DELETE
  USING (room_id IN (
    SELECT r.id FROM rooms r WHERE r.created_by = auth.uid()
  ));
