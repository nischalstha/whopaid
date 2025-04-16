-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_balances(p_group_id uuid);

-- Create a simplified balance function that just calculates net balances directly
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
        -- Get all users who are either paying or part of splits
        SELECT DISTINCT
            u.id::text AS user_id,
            u.name AS user_name,
            'registered' AS user_type
        FROM public.users u
        WHERE EXISTS (
            -- User has paid for an expense
            SELECT 1 FROM public.expenses e
            WHERE e.group_id = p_group_id AND e.paid_by::text = u.id::text
            UNION
            -- User is part of an expense split
            SELECT 1 FROM public.expense_splits es
            JOIN public.expenses e ON e.id = es.expense_id
            WHERE e.group_id = p_group_id AND es.user_id::text = u.id::text
            AND es.is_invited_user = false
        )
        
        UNION
        
        -- Include invited users who are part of splits
        SELECT DISTINCT
            iu.id::text AS user_id,
            iu.name AS user_name,
            'invited' AS user_type
        FROM public.invited_users iu
        WHERE EXISTS (
            SELECT 1 FROM public.expense_splits es
            JOIN public.expenses e ON e.id = es.expense_id
            WHERE e.group_id = p_group_id 
            AND es.user_id::text = iu.id::text
            AND es.is_invited_user = true
            AND iu.status IN ('pending', 'registered')
        )
    ),
    
    -- Calculate what each user has paid
    payments AS (
        SELECT 
            CASE 
                WHEN e.is_paid_by_invited_user THEN e.paid_by::text
                ELSE e.paid_by::text
            END AS user_id,
            SUM(e.amount) AS amount_paid
        FROM public.expenses e
        WHERE e.group_id = p_group_id
        GROUP BY e.paid_by, e.is_paid_by_invited_user
    ),
    
    -- Calculate what each user owes
    debts AS (
        SELECT 
            es.user_id::text AS user_id,
            SUM(es.amount) AS amount_owed
        FROM public.expense_splits es
        JOIN public.expenses e ON e.id = es.expense_id
        WHERE e.group_id = p_group_id
        GROUP BY es.user_id
    )
    
    -- Calculate final balances
    SELECT 
        au.user_id,
        au.user_name,
        ROUND((COALESCE(p.amount_paid, 0) - COALESCE(d.amount_owed, 0))::numeric, 2) as balance,
        au.user_type
    FROM all_users au
    LEFT JOIN payments p ON au.user_id::text = p.user_id::text
    LEFT JOIN debts d ON au.user_id::text = d.user_id::text
    ORDER BY balance DESC;
$$;

-- Add a comment to explain the function
COMMENT ON FUNCTION public.get_balances(p_group_id uuid) IS 
'Calculates net balances for users in a group.
Only includes users who have either paid for expenses or are part of splits.
Returns user_id, user_name, balance, and user_type.'; 