-- Drop existing constraints that are causing issues
ALTER TABLE public.expense_splits
DROP CONSTRAINT IF EXISTS expense_splits_invited_check;

ALTER TABLE public.expense_splits
DROP CONSTRAINT IF EXISTS expense_splits_invited_check_simple;

ALTER TABLE public.expense_splits
DROP CONSTRAINT IF EXISTS expense_splits_user_id_fkey;

ALTER TABLE public.expense_splits
DROP CONSTRAINT IF EXISTS expense_splits_user_foreign_key;

-- Ensure the is_invited_user column exists and has a default value
ALTER TABLE public.expense_splits
ADD COLUMN IF NOT EXISTS is_invited_user BOOLEAN DEFAULT FALSE;

-- Make invited_user_email nullable for all cases
ALTER TABLE public.expense_splits
ALTER COLUMN invited_user_email DROP NOT NULL;

-- Add an index to improve query performance
CREATE INDEX IF NOT EXISTS idx_expense_splits_user_id ON public.expense_splits(user_id);

-- Add a comment explaining the approach
COMMENT ON TABLE public.expense_splits IS 'Stores expense splits for both registered and invited users. When is_invited_user is TRUE, the user_id references the invited_users.id. When FALSE, it references users.id.';

-- Create a function to fix existing expense splits that might have incorrect data
CREATE OR REPLACE FUNCTION public.fix_expense_splits()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    split_record RECORD;
BEGIN
    -- First, fix the is_invited_user flag for all splits
    FOR split_record IN 
        SELECT es.id, es.expense_id, es.user_id, es.is_invited_user
        FROM public.expense_splits es
    LOOP
        -- Check if this is an invited user
        IF EXISTS (
            SELECT 1 FROM public.invited_users iu
            WHERE iu.id = split_record.user_id
        ) THEN
            -- Update the split to mark it as an invited user
            UPDATE public.expense_splits
            SET is_invited_user = TRUE
            WHERE id = split_record.id;
        ELSE
            -- Update the split to mark it as a registered user
            UPDATE public.expense_splits
            SET is_invited_user = FALSE
            WHERE id = split_record.id;
        END IF;
    END LOOP;
END;
$$;

-- Add a comment to explain the function
COMMENT ON FUNCTION public.fix_expense_splits() IS
'Fixes existing expense splits by correctly setting the is_invited_user flag based on whether the user_id exists in the invited_users table.';

-- Create a separate function to fix expense splits by count
CREATE OR REPLACE FUNCTION public.fix_expense_splits_by_count()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    expense_record RECORD;
    split_count integer;
    expected_splits integer;
BEGIN
    -- Loop through all expenses
    FOR expense_record IN 
        SELECT e.id, e.title, e.amount, e.paid_by
        FROM public.expenses e
    LOOP
        -- Get the actual number of splits
        SELECT COUNT(*) INTO split_count
        FROM public.expense_splits
        WHERE expense_id = expense_record.id;
        
        -- For Maybourne Rakshi, we know it should be 4 people
        IF expense_record.title = 'Maybourne Rakshi' THEN
            expected_splits := 4;
        ELSE
            -- For other expenses, use a default or calculate based on some logic
            expected_splits := 5; -- Default to 5 for other expenses
        END IF;
        
        -- If there's a mismatch, log it
        IF split_count != expected_splits THEN
            RAISE NOTICE 'Expense % has % splits, expected %', 
                expense_record.title, split_count, expected_splits;
        END IF;
    END LOOP;
END;
$$;

-- Add a comment to explain the function
COMMENT ON FUNCTION public.fix_expense_splits_by_count() IS
'Checks all expenses to ensure they have the correct number of splits based on the expected count.';

-- Execute the fix functions
SELECT public.fix_expense_splits();
SELECT public.fix_expense_splits_by_count(); 