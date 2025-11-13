-- Clear all data from tables
-- WARNING: This will delete all data. Use with caution.

-- Delete all location votes
DELETE FROM public.location_votes;

-- Delete all location candidates
DELETE FROM public.location_candidates;

-- Delete all restaurant votes
DELETE FROM public.restaurant_votes;

-- Delete all event participants
DELETE FROM public.event_participants;

-- Delete all lunch events
DELETE FROM public.lunch_events;

-- Delete all restaurants (optional, if you want to keep restaurant data)
-- DELETE FROM public.restaurants;

-- Reset sequences if needed (for PostgreSQL)
-- ALTER SEQUENCE IF EXISTS public.location_votes_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS public.location_candidates_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS public.restaurant_votes_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS public.event_participants_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS public.lunch_events_id_seq RESTART WITH 1;

