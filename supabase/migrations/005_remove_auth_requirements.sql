-- Make created_by nullable and add creator_name and creator_email
ALTER TABLE public.lunch_events 
ALTER COLUMN created_by DROP NOT NULL;

-- Add creator name and email columns
ALTER TABLE public.lunch_events 
ADD COLUMN IF NOT EXISTS creator_name TEXT,
ADD COLUMN IF NOT EXISTS creator_email TEXT;

-- Update RLS policies to allow anonymous creation
DROP POLICY IF EXISTS "Users can create lunch events" ON public.lunch_events;
DROP POLICY IF EXISTS "Users can create events" ON public.lunch_events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.lunch_events;
DROP POLICY IF EXISTS "Anyone can create events" ON public.lunch_events;
CREATE POLICY "Anyone can create events"
  ON public.lunch_events FOR INSERT
  WITH CHECK (true);

-- Update RLS policies to allow anonymous viewing
DROP POLICY IF EXISTS "Users can view events" ON public.lunch_events;
DROP POLICY IF EXISTS "Users can view all lunch events" ON public.lunch_events;
DROP POLICY IF EXISTS "Anyone can view events" ON public.lunch_events;
CREATE POLICY "Anyone can view events"
  ON public.lunch_events FOR SELECT
  USING (true);

-- Update RLS policies to allow event creators to update/delete
-- Note: Since we're removing auth, update/delete will be handled by application logic
-- For now, allow all updates and deletes (can be restricted later if needed)
DROP POLICY IF EXISTS "Users can update their own lunch events" ON public.lunch_events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.lunch_events;
DROP POLICY IF EXISTS "Event creators can update events" ON public.lunch_events;
DROP POLICY IF EXISTS "Anyone can update events" ON public.lunch_events;
CREATE POLICY "Anyone can update events"
  ON public.lunch_events FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Users can delete their own lunch events" ON public.lunch_events;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.lunch_events;
DROP POLICY IF EXISTS "Event creators can delete events" ON public.lunch_events;
DROP POLICY IF EXISTS "Anyone can delete events" ON public.lunch_events;
CREATE POLICY "Anyone can delete events"
  ON public.lunch_events FOR DELETE
  USING (true);

-- Update event_participants RLS policies to allow anonymous updates/deletes by email
-- First, ensure we can view and create (may already exist from 003)
DROP POLICY IF EXISTS "Anyone can view event participants" ON public.event_participants;
CREATE POLICY "Anyone can view event participants"
  ON public.event_participants FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can create participant records" ON public.event_participants;
CREATE POLICY "Anyone can create participant records"
  ON public.event_participants FOR INSERT
  WITH CHECK (true);

-- Update policies for updates and deletes
DROP POLICY IF EXISTS "Participants can update their own records" ON public.event_participants;
DROP POLICY IF EXISTS "Users can update their own participant records" ON public.event_participants;
DROP POLICY IF EXISTS "Anyone can update participant records" ON public.event_participants;
CREATE POLICY "Anyone can update participant records"
  ON public.event_participants FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Participants can delete their own records" ON public.event_participants;
DROP POLICY IF EXISTS "Users can delete their own participant records" ON public.event_participants;
DROP POLICY IF EXISTS "Users can create their own participant records" ON public.event_participants;
DROP POLICY IF EXISTS "Anyone can delete participant records" ON public.event_participants;
CREATE POLICY "Anyone can delete participant records"
  ON public.event_participants FOR DELETE
  USING (true);

-- Update restaurants RLS policies to allow anonymous inserts/updates
DROP POLICY IF EXISTS "Users can view all restaurants" ON public.restaurants;
CREATE POLICY "Anyone can view restaurants"
  ON public.restaurants FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert restaurants" ON public.restaurants;
CREATE POLICY "Anyone can insert restaurants"
  ON public.restaurants FOR INSERT
  WITH CHECK (true);

-- Allow updates to restaurants (for updating ratings, etc.)
DROP POLICY IF EXISTS "Anyone can update restaurants" ON public.restaurants;
CREATE POLICY "Anyone can update restaurants"
  ON public.restaurants FOR UPDATE
  USING (true);

