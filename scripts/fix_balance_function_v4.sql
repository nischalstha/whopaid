-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_balances(p_group_id uuid);

-- Create a completely simplified balance function that properly handles invited users
CREATE OR REPLACE FUNCTION public.get_balances(p_group_id uuid)
RETURNS TABLE (
    user_id text,
    user_name text,
    balance numeric
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
    
    -- Invited users
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

-- Money owed (negative)
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
    (COALESCE(p.amount_paid, 0) - COALESCE(o.amount_owed, 0)) AS balance
FROM 
    all_users au
    LEFT JOIN paid p ON au.user_id = p.user_id
    LEFT JOIN owed o ON au.user_id = o.user_id
ORDER BY 
    balance DESC;
$$; 