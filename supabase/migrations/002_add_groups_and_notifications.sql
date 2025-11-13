-- Add group_id to lunch_events table
ALTER TABLE public.lunch_events 
ADD COLUMN IF NOT EXISTS group_id UUID;

-- Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('owner', 'member')) NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(group_id, user_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('event_created', 'event_updated', 'member_invited', 'member_joined')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  related_event_id UUID REFERENCES public.lunch_events(id) ON DELETE CASCADE,
  related_group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create group_invitations table (for pending invitations)
CREATE TABLE IF NOT EXISTS public.group_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(group_id, email)
);

-- Add foreign key constraint for group_id in lunch_events
ALTER TABLE public.lunch_events
ADD CONSTRAINT fk_lunch_events_group_id 
FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lunch_events_group_id ON public.lunch_events(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_invitations_token ON public.group_invitations(token);
CREATE INDEX IF NOT EXISTS idx_group_invitations_group_id ON public.group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_email ON public.group_invitations(email);

-- Enable Row Level Security
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups
CREATE POLICY "Group members can view their groups"
  ON public.groups FOR SELECT
  USING (
    id IN (
      SELECT group_id FROM public.group_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group owners can update their groups"
  ON public.groups FOR UPDATE
  USING (
    created_by = auth.uid() OR
    id IN (
      SELECT group_id FROM public.group_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Group owners can delete their groups"
  ON public.groups FOR DELETE
  USING (created_by = auth.uid());

-- RLS Policies for group_members
CREATE POLICY "Group members can view members of their groups"
  ON public.group_members FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group owners can add members"
  ON public.group_members FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM public.group_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    ) OR
    group_id IN (
      SELECT id FROM public.groups 
      WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can join groups via invitation"
  ON public.group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Group owners can remove members"
  ON public.group_members FOR DELETE
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    ) OR
    group_id IN (
      SELECT id FROM public.groups 
      WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can leave groups"
  ON public.group_members FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for group_invitations
CREATE POLICY "Group owners can view invitations for their groups"
  ON public.group_invitations FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    ) OR
    group_id IN (
      SELECT id FROM public.groups 
      WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can view invitations sent to their email"
  ON public.group_invitations FOR SELECT
  USING (
    email IN (
      SELECT email FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Group owners can create invitations"
  ON public.group_invitations FOR INSERT
  WITH CHECK (
    invited_by = auth.uid() AND
    (
      group_id IN (
        SELECT group_id FROM public.group_members 
        WHERE user_id = auth.uid() AND role = 'owner'
      ) OR
      group_id IN (
        SELECT id FROM public.groups 
        WHERE created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update invitations sent to their email"
  ON public.group_invitations FOR UPDATE
  USING (
    email IN (
      SELECT email FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Update RLS Policies for lunch_events to be group-based
DROP POLICY IF EXISTS "Users can view all lunch events" ON public.lunch_events;
CREATE POLICY "Group members can view events in their groups"
  ON public.lunch_events FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create lunch events" ON public.lunch_events;
CREATE POLICY "Group members can create events in their groups"
  ON public.lunch_events FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    group_id IN (
      SELECT group_id FROM public.group_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own lunch events" ON public.lunch_events;
CREATE POLICY "Event creators can update their events"
  ON public.lunch_events FOR UPDATE
  USING (
    auth.uid() = created_by AND
    group_id IN (
      SELECT group_id FROM public.group_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own lunch events" ON public.lunch_events;
CREATE POLICY "Event creators can delete their events"
  ON public.lunch_events FOR DELETE
  USING (
    auth.uid() = created_by AND
    group_id IN (
      SELECT group_id FROM public.group_members 
      WHERE user_id = auth.uid()
    )
  );

-- Update RLS Policies for event_participants to be group-based
DROP POLICY IF EXISTS "Users can view all event participants" ON public.event_participants;
CREATE POLICY "Group members can view participants of events in their groups"
  ON public.event_participants FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.lunch_events 
      WHERE group_id IN (
        SELECT group_id FROM public.group_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Create function to create notifications when event is created
CREATE OR REPLACE FUNCTION public.notify_group_members_on_event_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notifications for all group members except the event creator
  INSERT INTO public.notifications (user_id, type, title, message, related_event_id, related_group_id)
  SELECT 
    gm.user_id,
    'event_created',
    '新しい予定が作成されました',
    NEW.title || ' が ' || to_char(NEW.date, 'YYYY年MM月DD日') || ' に作成されました',
    NEW.id,
    NEW.group_id
  FROM public.group_members gm
  WHERE gm.group_id = NEW.group_id
    AND gm.user_id != NEW.created_by;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for event creation notifications
DROP TRIGGER IF EXISTS on_event_created_notify ON public.lunch_events;
CREATE TRIGGER on_event_created_notify
  AFTER INSERT ON public.lunch_events
  FOR EACH ROW EXECUTE FUNCTION public.notify_group_members_on_event_created();

-- Create function to automatically add group owner as member
CREATE OR REPLACE FUNCTION public.add_group_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically add the creator as an owner member
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner')
  ON CONFLICT (group_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for adding group owner as member
DROP TRIGGER IF EXISTS on_group_created_add_owner ON public.groups;
CREATE TRIGGER on_group_created_add_owner
  AFTER INSERT ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.add_group_owner_as_member();

-- Create function to update updated_at timestamp for groups
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable pgcrypto extension for token generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create function to generate invitation token
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  -- Generate a random token using UUID and random bytes
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;

