-- Enable RLS for households and household_members tables
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

-- Households policies
-- Users can view households they are members of
CREATE POLICY "Users can view their households"
  ON households FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm 
      WHERE hm.household_id = households.id 
      AND hm.user_id = auth.uid()
    )
  );

-- Users can create households
CREATE POLICY "Users can create households"
  ON households FOR INSERT
  WITH CHECK (true);

-- Household owners can update their households
CREATE POLICY "Household owners can update"
  ON households FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm 
      WHERE hm.household_id = households.id 
      AND hm.user_id = auth.uid()
      AND hm.role = 'OWNER'
    )
  );

-- Household owners can delete their households
CREATE POLICY "Household owners can delete"
  ON households FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm 
      WHERE hm.household_id = households.id 
      AND hm.user_id = auth.uid()
      AND hm.role = 'OWNER'
    )
  );

-- Household members policies
-- Users can view members of their households
CREATE POLICY "Users can view household members"
  ON household_members FOR SELECT
  USING (
    -- User is a member of this household
    EXISTS (
      SELECT 1 FROM household_members hm 
      WHERE hm.household_id = household_members.household_id 
      AND hm.user_id = auth.uid()
    )
    OR
    -- Or user is viewing through a room
    EXISTS (
      SELECT 1 FROM room_members rm
      JOIN rooms r ON r.id = rm.room_id
      WHERE rm.household_id = household_members.household_id
      AND r.created_by = auth.uid()
    )
  );

-- Users can add themselves to households (when invited)
-- Household owners can add members
CREATE POLICY "Users can insert household members"
  ON household_members FOR INSERT
  WITH CHECK (
    -- User adding themselves
    user_id = auth.uid()
    OR
    -- Household owner adding members
    EXISTS (
      SELECT 1 FROM household_members hm 
      WHERE hm.household_id = household_members.household_id 
      AND hm.user_id = auth.uid()
      AND hm.role = 'OWNER'
    )
  );

-- Household owners can update member roles
CREATE POLICY "Household owners can update members"
  ON household_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm 
      WHERE hm.household_id = household_members.household_id 
      AND hm.user_id = auth.uid()
      AND hm.role = 'OWNER'
    )
  );

-- Household owners can remove members
-- Users can remove themselves
CREATE POLICY "Users can delete household members"
  ON household_members FOR DELETE
  USING (
    -- User removing themselves
    user_id = auth.uid()
    OR
    -- Household owner removing members
    EXISTS (
      SELECT 1 FROM household_members hm 
      WHERE hm.household_id = household_members.household_id 
      AND hm.user_id = auth.uid()
      AND hm.role = 'OWNER'
    )
  );
