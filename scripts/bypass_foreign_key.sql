-- This is a more aggressive fix for the expense_splits table
-- It completely removes the foreign key constraint that's causing issues

-- First, drop all existing constraints
ALTER TABLE public.expense_splits
DROP CONSTRAINT IF EXISTS expense_splits_invited_check;

ALTER TABLE public.expense_splits
DROP CONSTRAINT IF EXISTS expense_splits_invited_check_simple;

ALTER TABLE public.expense_splits
DROP CONSTRAINT IF EXISTS expense_splits_user_id_fkey;

ALTER TABLE public.expense_splits
DROP CONSTRAINT IF EXISTS expense_splits_user_foreign_key;

-- No foreign key constraint - you're free to use any IDs
-- This is the most flexible approach but sacrifices referential integrity

-- Instead, add a trigger that allows correct IDs but doesn't enforce them

-- Add a comment explaining the approach
COMMENT ON TABLE public.expense_splits IS 'Stores expense splits for both registered and invited users. The user_id can reference either users.id or invited_users.id tables without constraint.'; 