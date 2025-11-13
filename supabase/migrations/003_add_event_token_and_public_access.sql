-- Add token to lunch_events for public access (調整さん方式)
ALTER TABLE public.lunch_events 
ADD COLUMN IF NOT EXISTS token TEXT UNIQUE;

-- Create index for token lookup
CREATE INDEX IF NOT EXISTS idx_lunch_events_token ON public.lunch_events(token);

-- Update event_participants to support anonymous participants
ALTER TABLE public.event_participants 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Modify event_participants to allow null user_id for anonymous participants
ALTER TABLE public.event_participants 
ALTER COLUMN user_id DROP NOT NULL;

-- Add constraint: either user_id or (name and email) must be provided
ALTER TABLE public.event_participants 
ADD CONSTRAINT check_participant_identity 
CHECK (
  (user_id IS NOT NULL) OR 
  (name IS NOT NULL AND email IS NOT NULL)
);

-- Create function to generate event token
CREATE OR REPLACE FUNCTION public.generate_event_token()
RETURNS TEXT AS $$
BEGIN
  -- Generate a random token using UUID and random bytes
  -- Format: base64 encoded random bytes (URL-safe)
  RETURN encode(gen_random_bytes(24), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Update RLS Policies for lunch_events to allow public access via token
-- Remove the group-based restriction and allow public read access
DROP POLICY IF EXISTS "Group members can view events in their groups" ON public.lunch_events;
DROP POLICY IF EXISTS "Users can view all lunch events" ON public.lunch_events;

-- Allow anyone to view events (for public access via token)
CREATE POLICY "Anyone can view events"
  ON public.lunch_events FOR SELECT
  USING (true);

-- Only authenticated users can create events
DROP POLICY IF EXISTS "Group members can create events in their groups" ON public.lunch_events;
CREATE POLICY "Authenticated users can create events"
  ON public.lunch_events FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Only event creators can update their events
DROP POLICY IF EXISTS "Event creators can update their events" ON public.lunch_events;
CREATE POLICY "Event creators can update events"
  ON public.lunch_events FOR UPDATE
  USING (auth.uid() = created_by);

-- Only event creators can delete their events
DROP POLICY IF EXISTS "Event creators can delete their events" ON public.lunch_events;
CREATE POLICY "Event creators can delete events"
  ON public.lunch_events FOR DELETE
  USING (auth.uid() = created_by);

-- Update RLS Policies for event_participants
DROP POLICY IF EXISTS "Group members can view participants of events in their groups" ON public.event_participants;
DROP POLICY IF EXISTS "Users can view all event participants" ON public.event_participants;

-- Allow anyone to view participants (for public access)
CREATE POLICY "Anyone can view event participants"
  ON public.event_participants FOR SELECT
  USING (true);

-- Allow anyone to create participant records (for anonymous participation)
DROP POLICY IF EXISTS "Users can create their own participant records" ON public.event_participants;
CREATE POLICY "Anyone can create participant records"
  ON public.event_participants FOR INSERT
  WITH CHECK (
    -- If user_id is provided, it must match the authenticated user
    (user_id IS NULL) OR (auth.uid() = user_id)
  );

-- Allow participants to update their own records (by user_id or email)
DROP POLICY IF EXISTS "Users can update their own participant records" ON public.event_participants;
CREATE POLICY "Participants can update their own records"
  ON public.event_participants FOR UPDATE
  USING (
    -- Authenticated users can update their own records
    (user_id IS NOT NULL AND auth.uid() = user_id) OR
    -- Anonymous users can update by email (will be handled by application logic)
    (user_id IS NULL AND email IS NOT NULL)
  );

-- Allow participants to delete their own records
DROP POLICY IF EXISTS "Users can delete their own participant records" ON public.event_participants;
CREATE POLICY "Participants can delete their own records"
  ON public.event_participants FOR DELETE
  USING (
    -- Authenticated users can delete their own records
    (user_id IS NOT NULL AND auth.uid() = user_id) OR
    -- Anonymous users can delete by email (will be handled by application logic)
    (user_id IS NULL AND email IS NOT NULL)
  );

-- Create function to automatically generate token when event is created
CREATE OR REPLACE FUNCTION public.set_event_token()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate token if not provided
  IF NEW.token IS NULL THEN
    NEW.token := public.generate_event_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set token on event creation
DROP TRIGGER IF EXISTS set_event_token_trigger ON public.lunch_events;
CREATE TRIGGER set_event_token_trigger
  BEFORE INSERT ON public.lunch_events
  FOR EACH ROW EXECUTE FUNCTION public.set_event_token();

-- Remove group_id requirement (make it optional)
-- Events can now exist without groups (調整さん方式)
-- Group functionality can be added later as an optional feature

