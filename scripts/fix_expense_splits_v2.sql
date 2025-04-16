-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_balances(p_group_id uuid);

-- Create an improved balance function that properly handles invited users and only includes users in splits
CREATE OR REPLACE FUNCTION public.get_balances(p_group_id uuid)
RETURNS TABLE (
    user_id text,
    user_name text,
    balance numeric,
    user_type text
) 
LANGUAGE sql
AS $$
WITH all_users AS (
    -- Registered users
    SELECT 
        u.id::text AS user_id, 
        u.name AS user_name,
        'registered' AS user_type
    FROM 
        public.users u
        JOIN public.group_members gm ON u.id = gm.user_id
    WHERE 
        gm.group_id = p_group_id
    
    UNION ALL
    
    -- Invited users (excluding declined)
    SELECT 
        iu.id::text AS user_id,
        iu.name AS user_name,
        'invited' AS user_type
    FROM 
        public.invited_users iu
    WHERE 
        iu.group_id = p_group_id
        AND iu.status IN ('pending', 'registered')
),

-- Money paid (positive)
paid AS (
    SELECT 
        e.paid_by::text AS user_id,
        SUM(e.amount) AS amount_paid
    FROM 
        public.expenses e 
    WHERE 
        e.group_id = p_group_id
    GROUP BY 
        e.paid_by
),

-- Money owed (negative) - ONLY for users who are actually in the expense splits
owed AS (
    SELECT 
        es.user_id::text AS user_id, 
        SUM(es.amount) AS amount_owed
    FROM 
        public.expense_splits es
        JOIN public.expenses e ON es.expense_id = e.id
    WHERE 
        e.group_id = p_group_id
    GROUP BY 
        es.user_id
)

-- Combine everything
SELECT 
    au.user_id,
    au.user_name,
    (COALESCE(p.amount_paid, 0) - COALESCE(o.amount_owed, 0)) AS balance,
    au.user_type
FROM 
    all_users au
    LEFT JOIN paid p ON au.user_id = p.user_id
    LEFT JOIN owed o ON au.user_id = o.user_id
ORDER BY 
    balance DESC;
$$;

-- Add a comment to explain the function
COMMENT ON FUNCTION public.get_balances(p_group_id uuid) IS
'Calculates balances for all users in a group, properly handling both registered and invited users. 
Excludes invited users with declined status. Only includes users in expense splits they are actually part of. 
Returns user_id, user_name, balance, and user_type.';

-- Fix the expense splits table to ensure proper handling of user types
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
    -- Loop through all expense splits
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

-- Execute the fix function
SELECT public.fix_expense_splits(); 