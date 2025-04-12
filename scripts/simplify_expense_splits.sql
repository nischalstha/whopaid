-- Remove the problematic constraint completely
ALTER TABLE public.expense_splits
DROP CONSTRAINT IF EXISTS expense_splits_invited_check;

-- Make invited_user_email nullable for all cases
ALTER TABLE public.expense_splits
ALTER COLUMN invited_user_email DROP NOT NULL;

-- Add a simpler constraint that's more lenient
ALTER TABLE public.expense_splits
ADD CONSTRAINT expense_splits_invited_check_simple
CHECK (
  (is_invited_user IS NOT NULL)
); 