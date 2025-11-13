-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create restaurants table (lunch_eventsより先に作成する必要がある)
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  place_id TEXT UNIQUE,
  rating DECIMAL(2, 1),
  price_level INTEGER CHECK (price_level >= 0 AND price_level <= 4),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create lunch_events table
CREATE TABLE IF NOT EXISTS public.lunch_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  location_type TEXT CHECK (location_type IN ('freeroom', 'restaurant', 'undecided')) NOT NULL DEFAULT 'undecided',
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
  restaurant_name TEXT,
  restaurant_address TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create event_participants table
CREATE TABLE IF NOT EXISTS public.event_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.lunch_events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('going', 'not_going', 'maybe')) NOT NULL DEFAULT 'maybe',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(event_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lunch_events_date ON public.lunch_events(date);
CREATE INDEX IF NOT EXISTS idx_lunch_events_created_by ON public.lunch_events(created_by);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON public.event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON public.restaurants(latitude, longitude);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lunch_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for lunch_events
CREATE POLICY "Users can view all lunch events"
  ON public.lunch_events FOR SELECT
  USING (true);

CREATE POLICY "Users can create lunch events"
  ON public.lunch_events FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own lunch events"
  ON public.lunch_events FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own lunch events"
  ON public.lunch_events FOR DELETE
  USING (auth.uid() = created_by);

-- RLS Policies for event_participants
CREATE POLICY "Users can view all event participants"
  ON public.event_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own participant records"
  ON public.event_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participant records"
  ON public.event_participants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own participant records"
  ON public.event_participants FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for restaurants
CREATE POLICY "Users can view all restaurants"
  ON public.restaurants FOR SELECT
  USING (true);

CREATE POLICY "Users can insert restaurants"
  ON public.restaurants FOR INSERT
  WITH CHECK (true);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lunch_events_updated_at BEFORE UPDATE ON public.lunch_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_participants_updated_at BEFORE UPDATE ON public.event_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

