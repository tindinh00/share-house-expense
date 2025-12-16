-- Fix missing emails in profiles table
-- Update profiles with email from auth.users

UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND p.email IS NULL
AND u.email IS NOT NULL;

-- Verify the fix
-- SELECT id, username, email FROM profiles WHERE email IS NULL;
