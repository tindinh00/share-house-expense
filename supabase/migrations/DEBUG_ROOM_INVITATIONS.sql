-- ============================================
-- DEBUG ROOM INVITATIONS
-- ============================================
-- Check if invitation was accepted and household was added to room_members

-- 1. Check room_invitations status
SELECT 
  ri.id,
  ri.status,
  ri.invited_household_id,
  h.name as household_name,
  r.name as room_name
FROM room_invitations ri
LEFT JOIN households h ON h.id = ri.invited_household_id
LEFT JOIN rooms r ON r.id = ri.room_id
WHERE ri.invited_household_id IS NOT NULL
ORDER BY ri.created_at DESC
LIMIT 10;

-- 2. Check if household was added to room_members
SELECT 
  rm.id,
  rm.room_id,
  rm.household_id,
  r.name as room_name,
  h.name as household_name
FROM room_members rm
LEFT JOIN rooms r ON r.id = rm.room_id
LEFT JOIN households h ON h.id = rm.household_id
WHERE rm.household_id IS NOT NULL
ORDER BY rm.created_at DESC
LIMIT 10;

-- 3. Check household members
SELECT 
  hm.id,
  hm.household_id,
  hm.user_id,
  hm.role,
  h.name as household_name,
  p.email as user_email
FROM household_members hm
LEFT JOIN households h ON h.id = hm.household_id
LEFT JOIN profiles p ON p.id = hm.user_id
ORDER BY hm.created_at DESC
LIMIT 10;
