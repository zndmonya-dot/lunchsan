-- Change identification from email to name for participants and votes
-- This allows users to participate using only their name

-- Drop existing unique constraints on email
ALTER TABLE public.location_votes 
DROP CONSTRAINT IF EXISTS location_votes_event_id_email_key;

-- Create unique constraint on (event_id, name) instead
-- Note: This allows multiple people with the same name, but we'll use the latest one
ALTER TABLE public.location_votes 
ADD CONSTRAINT location_votes_event_id_name_key UNIQUE(event_id, name);

-- Update event_participants constraint
-- Remove the email requirement from check_participant_identity
ALTER TABLE public.event_participants 
DROP CONSTRAINT IF EXISTS check_participant_identity;

-- New constraint: either user_id or name must be provided
ALTER TABLE public.event_participants 
ADD CONSTRAINT check_participant_identity 
CHECK (
  (user_id IS NOT NULL) OR 
  (name IS NOT NULL)
);

-- Create unique constraint on (event_id, name) for anonymous participants
-- This replaces the email-based identification
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_participants_unique_name 
ON public.event_participants(event_id, name) 
WHERE user_id IS NULL AND name IS NOT NULL;

-- Update indexes
DROP INDEX IF EXISTS idx_location_votes_email;
CREATE INDEX IF NOT EXISTS idx_location_votes_name ON public.location_votes(name);
CREATE INDEX IF NOT EXISTS idx_event_participants_name ON public.event_participants(name);

