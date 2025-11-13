-- Replace email with password_hash for participant identification
-- This improves privacy and security by using password instead of email

-- Add password_hash column to event_participants
ALTER TABLE public.event_participants 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add password_hash column to location_votes
ALTER TABLE public.location_votes 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Drop existing unique constraints that use email
DROP INDEX IF EXISTS idx_event_participants_unique_name_email;
DROP INDEX IF EXISTS idx_location_votes_unique_name_email;

-- Create new unique constraint: (event_id, name, password_hash)
-- This allows:
-- - Same name with different password_hash = different participants
-- - Same name with NULL password_hash = only one allowed (backward compatibility)
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_participants_unique_name_password 
ON public.event_participants(event_id, name, COALESCE(password_hash, ''))
WHERE user_id IS NULL AND name IS NOT NULL;

-- Create new unique constraint for location_votes: (event_id, name, password_hash)
CREATE UNIQUE INDEX IF NOT EXISTS idx_location_votes_unique_name_password 
ON public.location_votes(event_id, name, COALESCE(password_hash, ''))
WHERE name IS NOT NULL;

-- Update indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_event_participants_password_hash ON public.event_participants(password_hash);
CREATE INDEX IF NOT EXISTS idx_location_votes_password_hash ON public.location_votes(password_hash);

-- Note: email column is kept for backward compatibility but will not be used for new participants
-- Old data migration can be done separately if needed

