-- Create contact_inquiries table for contact form submissions
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON public.contact_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON public.contact_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_email ON public.contact_inquiries(email);

-- Enable RLS
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_inquiries
-- Anyone can create contact inquiries (public form)
CREATE POLICY "Anyone can create contact inquiries"
  ON public.contact_inquiries FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can view contact inquiries (admin access)
CREATE POLICY "Authenticated users can view contact inquiries"
  ON public.contact_inquiries FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only authenticated users can update contact inquiries (admin access)
CREATE POLICY "Authenticated users can update contact inquiries"
  ON public.contact_inquiries FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Add trigger to update updated_at
CREATE TRIGGER update_contact_inquiries_updated_at
  BEFORE UPDATE ON public.contact_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

