-- Add time fields to lunch_events
ALTER TABLE public.lunch_events 
ADD COLUMN IF NOT EXISTS start_time TIME DEFAULT '12:00:00',
ADD COLUMN IF NOT EXISTS end_time TIME DEFAULT '13:00:00';

-- Make title optional (not required)
ALTER TABLE public.lunch_events 
ALTER COLUMN title DROP NOT NULL;

-- Add creator location for restaurant search
ALTER TABLE public.lunch_events 
ADD COLUMN IF NOT EXISTS creator_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS creator_longitude DECIMAL(11, 8);

-- Create restaurant_votes table for voting on restaurants
CREATE TABLE IF NOT EXISTS public.restaurant_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.lunch_events(id) ON DELETE CASCADE NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add constraint: either user_id or (name and email) must be provided
ALTER TABLE public.restaurant_votes 
ADD CONSTRAINT check_restaurant_vote_identity 
CHECK (
  (user_id IS NOT NULL) OR 
  (name IS NOT NULL AND email IS NOT NULL)
);

-- Create unique indexes for user_id-based votes (when user_id is NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurant_votes_unique_user 
ON public.restaurant_votes(event_id, restaurant_id, user_id) 
WHERE user_id IS NOT NULL;

-- Create unique indexes for email-based votes (when user_id is NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurant_votes_unique_email 
ON public.restaurant_votes(event_id, restaurant_id, email) 
WHERE user_id IS NULL AND email IS NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_restaurant_votes_event_id ON public.restaurant_votes(event_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_votes_restaurant_id ON public.restaurant_votes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_votes_user_id ON public.restaurant_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_votes_email ON public.restaurant_votes(email);

-- Enable Row Level Security
ALTER TABLE public.restaurant_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for restaurant_votes
CREATE POLICY "Anyone can view restaurant votes"
  ON public.restaurant_votes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create restaurant votes"
  ON public.restaurant_votes FOR INSERT
  WITH CHECK (
    -- If user_id is provided, it must match the authenticated user
    (user_id IS NULL) OR (auth.uid() = user_id)
  );

CREATE POLICY "Participants can update their own votes"
  ON public.restaurant_votes FOR UPDATE
  USING (
    -- Authenticated users can update their own votes
    (user_id IS NOT NULL AND auth.uid() = user_id) OR
    -- Anonymous users can update by email (will be handled by application logic)
    (user_id IS NULL AND email IS NOT NULL)
  );

CREATE POLICY "Participants can delete their own votes"
  ON public.restaurant_votes FOR DELETE
  USING (
    -- Authenticated users can delete their own votes
    (user_id IS NOT NULL AND auth.uid() = user_id) OR
    -- Anonymous users can delete by email (will be handled by application logic)
    (user_id IS NULL AND email IS NOT NULL)
  );

