-- Add email as optional identifier for participants
-- This allows multiple people with the same name to participate in the same event

-- Update unique constraint on event_participants
-- Drop the existing unique index
DROP INDEX IF EXISTS idx_event_participants_unique_name;

-- Create new unique constraint: (event_id, name, email)
-- This allows:
-- - Same name with different emails = different participants
-- - Same name with NULL email = only one allowed (backward compatibility)
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_participants_unique_name_email 
ON public.event_participants(event_id, name, COALESCE(email, ''))
WHERE user_id IS NULL AND name IS NOT NULL;

-- Update location_votes unique constraint
-- Drop the existing constraint
ALTER TABLE public.location_votes 
DROP CONSTRAINT IF EXISTS location_votes_event_id_name_key;

-- Create new unique constraint: (event_id, name, email)
-- This allows multiple votes from people with the same name but different emails
CREATE UNIQUE INDEX IF NOT EXISTS idx_location_votes_unique_name_email 
ON public.location_votes(event_id, name, COALESCE(email, ''))
WHERE name IS NOT NULL;

-- Update indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_event_participants_email ON public.event_participants(email);
CREATE INDEX IF NOT EXISTS idx_location_votes_email ON public.location_votes(email);

