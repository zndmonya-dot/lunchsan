-- Add index for creator_email to improve search performance
CREATE INDEX IF NOT EXISTS idx_lunch_events_creator_email ON public.lunch_events(creator_email);

-- Create a function to normalize email (lowercase) for consistent searching
-- This will be used in application code, but we can also create a trigger if needed
-- For now, we'll rely on application-level normalization

-- Note: If you want to ensure all emails are stored in lowercase,
-- you can create a trigger, but for backward compatibility,
-- we'll handle normalization in the application code

