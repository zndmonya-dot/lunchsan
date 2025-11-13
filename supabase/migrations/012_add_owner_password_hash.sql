-- Add password_hash for event owners (creators)
-- Owners are identified by email + password_hash

-- Add creator_password_hash column to lunch_events
ALTER TABLE public.lunch_events 
ADD COLUMN IF NOT EXISTS creator_password_hash TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_lunch_events_creator_password_hash ON public.lunch_events(creator_password_hash);

