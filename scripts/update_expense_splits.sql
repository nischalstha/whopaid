-- Drop existing foreign key constraint
ALTER TABLE public.expense_splits
DROP CONSTRAINT IF EXISTS expense_splits_user_id_fkey;

-- Add new columns for tracking invited users
ALTER TABLE public.expense_splits
ADD COLUMN IF NOT EXISTS is_invited_user BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS invited_user_email TEXT;

-- Update foreign key constraint to be conditional
-- Only enforce the user_id reference when is_invited_user is FALSE
ALTER TABLE public.expense_splits
ADD CONSTRAINT expense_splits_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.users(id)
DEFERRABLE INITIALLY DEFERRED;

-- Drop the problematic constraint
ALTER TABLE public.expense_splits
DROP CONSTRAINT IF EXISTS expense_splits_invited_check;

-- Recreate it with a better condition that handles null emails when is_invited_user is false
ALTER TABLE public.expense_splits
ADD CONSTRAINT expense_splits_invited_check
CHECK (
  (is_invited_user = FALSE) OR 
  (is_invited_user = TRUE AND invited_user_email IS NOT NULL)
);

-- Update existing row level security policies
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;

-- Users can view expense splits for expenses in their groups
CREATE POLICY IF NOT EXISTS "Users can view expense splits in their groups" ON public.expense_splits
FOR SELECT USING (
  expense_id IN (
    SELECT e.id FROM public.expenses e
    JOIN public.groups g ON e.group_id = g.id
    JOIN public.group_members gm ON g.id = gm.group_id
    WHERE gm.user_id = auth.uid()
  )
);

-- Only the expense creator or group admin can insert/update expense splits
CREATE POLICY IF NOT EXISTS "Expense creator can insert expense splits" ON public.expense_splits
FOR INSERT WITH CHECK (
  expense_id IN (
    SELECT e.id FROM public.expenses e
    WHERE e.paid_by = auth.uid()
  )
);

-- Add comment to explain the changes
COMMENT ON TABLE public.expense_splits IS 'Stores expense splits for both registered and invited users. When is_invited_user is TRUE, the user_id references the invited_users.id and invited_user_email contains the email.'; 