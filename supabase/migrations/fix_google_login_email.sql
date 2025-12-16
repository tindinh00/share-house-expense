-- ============================================
-- FIX GOOGLE LOGIN - SAVE EMAIL TO PROFILES
-- ============================================
-- This ensures email is saved when users login with Google

-- Drop and recreate the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update existing users who don't have email
UPDATE profiles
SET email = auth.users.email
FROM auth.users
WHERE profiles.id = auth.users.id
  AND (profiles.email IS NULL OR profiles.email = '');

-- Verify
SELECT 'Google login email fix completed!' as status;
