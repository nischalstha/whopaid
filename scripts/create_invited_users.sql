-- Create invited_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.invited_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invited_users_email ON public.invited_users(email);
CREATE INDEX IF NOT EXISTS idx_invited_users_group_id ON public.invited_users(group_id);

-- Add comment explaining statuses
COMMENT ON COLUMN public.invited_users.status IS 'Status can be: pending, registered, declined';

-- Add RLS policies for security
ALTER TABLE public.invited_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see invitations to groups they belong to
CREATE POLICY "Users can view invitations for their groups" ON public.invited_users
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Only authenticated users can create invitations
CREATE POLICY "Users can create invitations" ON public.invited_users
  FOR INSERT WITH CHECK (
    invited_by = auth.uid() AND 
    auth.uid() IN (
      SELECT user_id FROM public.group_members 
      WHERE group_id = invited_users.group_id AND is_admin = true
    )
  );

-- Policy: Only group admins can update invitations
CREATE POLICY "Admins can update invitations" ON public.invited_users
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM public.group_members 
      WHERE group_id = invited_users.group_id AND is_admin = true
    )
  ); 