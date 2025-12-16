-- ============================================
-- FINAL FIX - Run this to fix all RLS issues
-- ============================================

-- Step 1: Add email column to profiles if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Step 2: Ensure all auth users have profiles with email
INSERT INTO public.profiles (id, username, email, avatar_url)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'username', au.email, 'User'),
  au.email,
  au.raw_user_meta_data->>'avatar_url'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Update existing profiles with email from auth.users
UPDATE profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id AND p.email IS NULL;

-- Step 2: Add created_by column
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

UPDATE rooms r
SET created_by = (
  SELECT rm.user_id FROM room_members rm 
  WHERE rm.room_id = r.id AND rm.user_id IS NOT NULL
  LIMIT 1
)
WHERE created_by IS NULL;

CREATE INDEX IF NOT EXISTS idx_rooms_created_by ON rooms(created_by);

-- Step 2: Drop ALL old policies
DROP POLICY IF EXISTS "Users can view rooms they are members of" ON rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
DROP POLICY IF EXISTS "Users can view their own rooms" ON rooms;
DROP POLICY IF EXISTS "Users can update their own rooms" ON rooms;
DROP POLICY IF EXISTS "Users can delete their own rooms" ON rooms;

DROP POLICY IF EXISTS "Users can view members of their rooms" ON room_members;
DROP POLICY IF EXISTS "Room owners can manage members" ON room_members;
DROP POLICY IF EXISTS "Room creators can manage members" ON room_members;
DROP POLICY IF EXISTS "Room creators can delete members" ON room_members;
DROP POLICY IF EXISTS "Users can view their own membership" ON room_members;
DROP POLICY IF EXISTS "Room creators can view all members" ON room_members;
DROP POLICY IF EXISTS "Users can insert themselves as members" ON room_members;

DROP POLICY IF EXISTS "Users can view transactions in their rooms" ON transactions;
DROP POLICY IF EXISTS "Users can create transactions in their rooms" ON transactions;

-- Step 3: Create simple policies for ROOMS
CREATE POLICY "Users can view their own rooms"
  ON rooms FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can create rooms"
  ON rooms FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own rooms"
  ON rooms FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own rooms"
  ON rooms FOR DELETE
  USING (created_by = auth.uid());

-- Step 4: Create simple policies for ROOM_MEMBERS
CREATE POLICY "Users can view their own membership"
  ON room_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Room creators can view all members"
  ON room_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM rooms r WHERE r.id = room_id AND r.created_by = auth.uid()
  ));

CREATE POLICY "Users can insert themselves as members"
  ON room_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Room creators can delete members"
  ON room_members FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM rooms r WHERE r.id = room_id AND r.created_by = auth.uid()
  ));

-- Step 5: Create simple policies for TRANSACTIONS
CREATE POLICY "Users can view transactions in their rooms"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_members rm 
      WHERE rm.room_id = transactions.room_id 
      AND rm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create transactions in their rooms"
  ON transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM room_members rm 
      WHERE rm.room_id = transactions.room_id 
      AND rm.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Done!
SELECT 'All policies fixed! Refresh your app.' as status;
