DROP FUNCTION IF EXISTS public.get_balances(p_group_id uuid);

CREATE OR REPLACE FUNCTION public.get_balances(p_group_id uuid)
RETURNS TABLE (
    user_id text,
    user_name text,
    balance numeric
)
LANGUAGE sql
AS $$

-- Calculate the balance for all users (registered + invited) using v_users
WITH all_users AS (
    SELECT 
        vu.id::text AS user_id,
        vu.name AS user_name
    FROM public.v_users vu
    WHERE vu.group_id = p_group_id
),

-- Who paid how much
paid AS (
    SELECT 
        e.paid_by::text AS user_id,
        SUM(e.amount) AS amount_paid
    FROM public.expenses e
    WHERE e.group_id = p_group_id
    GROUP BY e.paid_by
),

-- Who owes how much
owed AS (
    SELECT 
        es.user_id::text AS user_id,
        SUM(es.amount) AS amount_owed
    FROM public.expense_splits es
    JOIN public.expenses e ON e.id = es.expense_id
    WHERE e.group_id = p_group_id
    GROUP BY es.user_id
)

-- Final balance: what they paid minus what they owe
SELECT 
    au.user_id,
    au.user_name,
    COALESCE(p.amount_paid, 0) - COALESCE(o.amount_owed, 0) AS balance
FROM all_users au
LEFT JOIN paid p ON au.user_id = p.user_id
LEFT JOIN owed o ON au.user_id = o.user_id
ORDER BY balance DESC;

$$;

COMMENT ON FUNCTION public.get_balances(p_group_id uuid) IS
'Calculates balances for all users in a group using v_users. Returns user_id, user_name, and balance (positive = they are owed, negative = they owe).';
