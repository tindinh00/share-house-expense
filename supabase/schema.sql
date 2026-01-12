-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Households table (Hộ gia đình)
CREATE TABLE households (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Household members (Thành viên trong hộ)
CREATE TABLE household_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id UUID REFERENCES households ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(household_id, user_id)
);

-- Rooms table
CREATE TABLE rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('SHARED', 'PRIVATE')),
  split_method TEXT DEFAULT 'EQUAL' CHECK (split_method IN ('EQUAL', 'CUSTOM', 'PERCENTAGE')),
  split_config JSONB,
  split_by TEXT DEFAULT 'USER' CHECK (split_by IN ('USER', 'HOUSEHOLD')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Room members table (Có thể join bằng user hoặc household)
CREATE TABLE room_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES rooms ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles ON DELETE CASCADE,
  household_id UUID REFERENCES households ON DELETE CASCADE,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CHECK (
    (user_id IS NOT NULL AND household_id IS NULL) OR
    (user_id IS NULL AND household_id IS NOT NULL)
  ),
  UNIQUE(room_id, user_id),
  UNIQUE(room_id, household_id)
);

-- Categories table
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Transactions table
CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  note TEXT NOT NULL,
  category_id UUID REFERENCES categories ON DELETE RESTRICT NOT NULL,
  room_id UUID REFERENCES rooms ON DELETE CASCADE NOT NULL,
  paid_by UUID REFERENCES profiles ON DELETE RESTRICT NOT NULL,
  created_by UUID REFERENCES profiles ON DELETE RESTRICT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  is_settled BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_transactions_room_date ON transactions(room_id, date DESC);
CREATE INDEX idx_transactions_paid_by ON transactions(paid_by);
CREATE INDEX idx_room_members_user ON room_members(user_id);
CREATE INDEX idx_room_members_household ON room_members(household_id);
CREATE INDEX idx_room_members_room ON room_members(room_id);
CREATE INDEX idx_household_members_user ON household_members(user_id);
CREATE INDEX idx_household_members_household ON household_members(household_id);
CREATE INDEX idx_rooms_created_by ON rooms(created_by);
CREATE INDEX idx_categories_created_by ON categories(created_by);
CREATE INDEX idx_categories_room_id ON categories(room_id);
CREATE INDEX idx_categories_is_system ON categories(is_system);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Rooms policies
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

-- Room members policies
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

-- Categories policies
CREATE POLICY "Users can view accessible categories"
  ON categories FOR SELECT
  USING (
    is_system = TRUE 
    OR created_by = auth.uid()
    OR room_id IN (
      SELECT rm.room_id FROM room_members rm 
      WHERE rm.user_id = auth.uid()
    )
    OR room_id IN (
      SELECT rm.room_id FROM room_members rm
      JOIN household_members hm ON rm.household_id = hm.household_id
      WHERE hm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create personal categories"
  ON categories FOR INSERT
  WITH CHECK (
    created_by = auth.uid() 
    AND is_system = FALSE
    AND (
      room_id IS NULL 
      OR room_id IN (
        SELECT rm.room_id FROM room_members rm WHERE rm.user_id = auth.uid()
      )
      OR room_id IN (
        SELECT rm.room_id FROM room_members rm
        JOIN household_members hm ON rm.household_id = hm.household_id
        WHERE hm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (created_by = auth.uid() AND is_system = FALSE)
  WITH CHECK (created_by = auth.uid() AND is_system = FALSE);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (created_by = auth.uid() AND is_system = FALSE);

-- Transactions policies
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

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (created_by = auth.uid());

-- Insert default categories (system categories)
INSERT INTO categories (name, icon, color, is_system) VALUES
  ('Điện nước', '⚡', '#3b82f6', TRUE),
  ('Internet', '📡', '#8b5cf6', TRUE),
  ('Ăn uống', '🍜', '#ef4444', TRUE),
  ('Đồ dùng', '🛒', '#10b981', TRUE),
  ('Sửa chữa', '🔧', '#f59e0b', TRUE),
  ('Khác', '📝', '#6b7280', TRUE);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
