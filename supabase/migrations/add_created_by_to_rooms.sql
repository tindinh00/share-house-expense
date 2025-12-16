-- Add created_by column to rooms table
ALTER TABLE rooms 
ADD COLUMN created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Set existing rooms' created_by to the first member (owner)
UPDATE rooms r
SET created_by = (
  SELECT rm.user_id 
  FROM room_members rm 
  WHERE rm.room_id = r.id 
  AND rm.role = 'owner'
  LIMIT 1
);

-- If no owner found, set to first member
UPDATE rooms r
SET created_by = (
  SELECT rm.user_id 
  FROM room_members rm 
  WHERE rm.room_id = r.id 
  AND rm.user_id IS NOT NULL
  LIMIT 1
)
WHERE created_by IS NULL;

-- Create index for better performance
CREATE INDEX idx_rooms_created_by ON rooms(created_by);
