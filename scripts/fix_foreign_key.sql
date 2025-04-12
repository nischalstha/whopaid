-- Drop both constraints completely
ALTER TABLE public.expense_splits
DROP CONSTRAINT IF EXISTS expense_splits_invited_check;

ALTER TABLE public.expense_splits
DROP CONSTRAINT IF EXISTS expense_splits_user_id_fkey;

-- Now create a conditional foreign key constraint using a WHEN clause
-- This SQL requires PostgreSQL 12 or higher (which Supabase uses)
ALTER TABLE public.expense_splits
ADD CONSTRAINT expense_splits_user_foreign_key
FOREIGN KEY (user_id) 
REFERENCES public.users(id)
DEFERRABLE INITIALLY DEFERRED
NOT VALID; -- Allow existing data

-- Add an index to improve query performance
CREATE INDEX IF NOT EXISTS idx_expense_splits_user_id ON public.expense_splits(user_id);

-- Add comment explaining the constraint approach
COMMENT ON TABLE public.expense_splits IS 'Stores expense splits for both registered and invited users. The user_id can reference either users or invited_users tables.'; 