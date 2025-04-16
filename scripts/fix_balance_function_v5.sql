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
        -- Ensure the user is actually in the split_with array
        AND EXISTS (
            SELECT 1 
            FROM unnest(e.split_with) AS name
            WHERE name = (
                CASE 
                    WHEN es.is_invited_user THEN 
                        (SELECT iu.name FROM public.invited_users iu WHERE iu.id = es.user_id)
                    ELSE 
                        (SELECT u.name FROM public.users u WHERE u.id = es.user_id)
                END
            )
        )
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
Excludes invited users with declined status. Only includes users in expense splits they are actually part of based on the split_with array. 
Returns user_id, user_name, balance, and user_type.'; 