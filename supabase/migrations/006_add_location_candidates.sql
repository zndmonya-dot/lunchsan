-- Add location_candidates table for voting on event locations
CREATE TABLE IF NOT EXISTS public.location_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.lunch_events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'restaurant')),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
  restaurant_name TEXT,
  restaurant_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add location_votes table for voting on location candidates
CREATE TABLE IF NOT EXISTS public.location_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.lunch_events(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.location_candidates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, email)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_location_candidates_event_id ON public.location_candidates(event_id);
CREATE INDEX IF NOT EXISTS idx_location_votes_event_id ON public.location_votes(event_id);
CREATE INDEX IF NOT EXISTS idx_location_votes_candidate_id ON public.location_votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_location_votes_email ON public.location_votes(email);

-- Enable RLS
ALTER TABLE public.location_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for location_candidates
CREATE POLICY "Anyone can view location candidates"
  ON public.location_candidates FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create location candidates"
  ON public.location_candidates FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update location candidates"
  ON public.location_candidates FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete location candidates"
  ON public.location_candidates FOR DELETE
  USING (true);

-- RLS Policies for location_votes
CREATE POLICY "Anyone can view location votes"
  ON public.location_votes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create location votes"
  ON public.location_votes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update location votes"
  ON public.location_votes FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete location votes"
  ON public.location_votes FOR DELETE
  USING (true);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_location_candidates_updated_at
  BEFORE UPDATE ON public.location_candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

