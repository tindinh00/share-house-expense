-- ============================================
-- FIX TRANSACTION VISIBILITY FOR HOUSEHOLDS
-- ============================================
-- Allow household members in the same room to view each other's transactions
-- But only allow editing/deleting own transactions

-- Drop old transaction policies
DROP POLICY IF EXISTS "Users can view transactions in their rooms" ON transactions;
DROP POLICY IF EXISTS "Users can create transactions in their rooms" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;

-- Recreate SELECT policy to include household members
CREATE POLICY "Users can view transactions in their rooms"
  ON transactions FOR SELECT
  USING (
    -- Direct room member
    room_id IN (
      SELECT room_id FROM room_members WHERE user_id = auth.uid()
    )
    OR
    -- Household member in the room
    room_id IN (
      SELECT rm.room_id 
      FROM room_members rm
      INNER JOIN household_members hm ON hm.household_id = rm.household_id
      WHERE hm.user_id = auth.uid()
    )
  );

-- Recreate INSERT policy to include household members
CREATE POLICY "Users can create transactions in their rooms"
  ON transactions FOR INSERT
  WITH CHECK (
    (
      -- Direct room member
      room_id IN (
        SELECT room_id FROM room_members WHERE user_id = auth.uid()
      )
      OR
      -- Household member in the room
      room_id IN (
        SELECT rm.room_id 
        FROM room_members rm
        INNER JOIN household_members hm ON hm.household_id = rm.household_id
        WHERE hm.user_id = auth.uid()
      )
    )
    AND created_by = auth.uid()
  );

-- Keep UPDATE policy - only own transactions
CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Keep DELETE policy - only own transactions
CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (created_by = auth.uid());

-- Verify
SELECT 'Transaction visibility for households fixed!' as status;
