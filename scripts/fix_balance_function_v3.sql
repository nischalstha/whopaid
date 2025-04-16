-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_balances(p_group_id uuid);

-- Create an improved balance function that properly handles invited users and correctly calculates balances
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

-- Calculate what each user owes to others
what_user_owes AS (
    SELECT 
        es.user_id::text AS user_id,
        e.paid_by::text AS paid_by,
        SUM(es.amount) AS amount_owed
    FROM 
        public.expense_splits es
        JOIN public.expenses e ON es.expense_id = e.id
    WHERE 
        e.group_id = p_group_id
        AND es.user_id::text != e.paid_by::text
    GROUP BY 
        es.user_id, e.paid_by
),

-- Calculate what each user paid for others
what_user_paid AS (
    SELECT 
        e.paid_by::text AS user_id,
        SUM(e.amount) AS total_paid
    FROM 
        public.expenses e
    WHERE 
        e.group_id = p_group_id
    GROUP BY 
        e.paid_by
),

-- Calculate what each user paid for themselves
what_user_paid_for_self AS (
    SELECT 
        e.paid_by::text AS user_id,
        SUM(es.amount) AS amount_paid_for_self
    FROM 
        public.expenses e
        JOIN public.expense_splits es ON e.id = es.expense_id
    WHERE 
        e.group_id = p_group_id
        AND es.user_id::text = e.paid_by::text
    GROUP BY 
        e.paid_by
),

-- Calculate net balances
net_balances AS (
    SELECT 
        au.user_id,
        au.user_name,
        au.user_type,
        COALESCE(p.total_paid, 0) - COALESCE(ps.amount_paid_for_self, 0) AS amount_paid_for_others,
        COALESCE(SUM(o.amount_owed), 0) AS amount_owed_to_others
    FROM 
        all_users au
        LEFT JOIN what_user_paid p ON au.user_id = p.user_id
        LEFT JOIN what_user_paid_for_self ps ON au.user_id = ps.user_id
        LEFT JOIN what_user_owes o ON au.user_id = o.user_id
    GROUP BY 
        au.user_id, au.user_name, au.user_type, p.total_paid, ps.amount_paid_for_self
)

-- Final result
SELECT 
    user_id,
    user_name,
    amount_paid_for_others - amount_owed_to_others AS balance,
    user_type
FROM 
    net_balances
ORDER BY 
    balance DESC;
$$;

-- Add a comment to explain the function
COMMENT ON FUNCTION public.get_balances(p_group_id uuid) IS
'Calculates balances for all users in a group, properly handling both registered and invited users.
Correctly accounts for users who pay for expenses and are also included in the splits.
Excludes invited users with declined status. Returns user_id, user_name, balance, and user_type.';

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_settlements(p_group_id uuid, p_user_id text);

-- Create a function to calculate who a specific user owes money to
CREATE OR REPLACE FUNCTION public.get_settlements(p_group_id uuid, p_user_id text)
RETURNS TABLE (
    person text,
    amount numeric,
    direction text,
    userType text
) 
LANGUAGE sql
AS $$
WITH user_balances AS (
    -- Get the balance for the specified user
    SELECT 
        balance
    FROM 
        public.get_balances(p_group_id)
    WHERE 
        user_id = p_user_id
),

-- Calculate what the user owes to each person who paid for expenses
user_settlements AS (
    SELECT 
        e.paid_by::text AS paid_by,
        u.name AS person_name,
        u.type AS user_type,
        SUM(es.amount) AS amount_owed
    FROM 
        public.expense_splits es
        JOIN public.expenses e ON es.expense_id = e.id
        JOIN (
            -- Get user type (registered or invited)
            SELECT 
                id::text, 
                name, 
                'registered' AS type
            FROM 
                public.users
            UNION ALL
            SELECT 
                id::text, 
                name, 
                'invited' AS type
            FROM 
                public.invited_users
            WHERE 
                status IN ('pending', 'registered')
        ) u ON e.paid_by::text = u.id
    WHERE 
        e.group_id = p_group_id
        AND es.user_id::text = p_user_id
        AND es.user_id::text != e.paid_by::text
    GROUP BY 
        e.paid_by, u.name, u.type
)

-- Return the settlements
SELECT 
    person_name AS person,
    amount_owed AS amount,
    'owe' AS direction,
    user_type AS "userType"
FROM 
    user_settlements
WHERE 
    amount_owed > 0
ORDER BY 
    amount_owed DESC;
$$;

-- Add a comment to explain the function
COMMENT ON FUNCTION public.get_settlements(p_group_id uuid, p_user_id text) IS
'Calculates who a specific user owes money to based on the actual expense splits.
Returns a list of people the user owes money to, the amount owed, and the direction (always "owe").
Also includes the user type (registered or invited) for each person.';

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_all_settlements(p_group_id uuid);

-- Create a function to calculate who owes whom for all users in the group
CREATE OR REPLACE FUNCTION public.get_all_settlements(p_group_id uuid)
RETURNS TABLE (
    from_user_id text,
    from_user_name text,
    from_user_type text,
    to_user_id text,
    to_user_name text,
    to_user_type text,
    amount numeric
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

-- Calculate what each user owes to each person who paid for expenses
user_settlements AS (
    SELECT 
        es.user_id::text AS from_user_id,
        e.paid_by::text AS to_user_id,
        SUM(es.amount) AS amount
    FROM 
        public.expense_splits es
        JOIN public.expenses e ON es.expense_id = e.id
    WHERE 
        e.group_id = p_group_id
        AND es.user_id::text != e.paid_by::text
    GROUP BY 
        es.user_id, e.paid_by
)

-- Return the settlements with user names and types
SELECT 
    s.from_user_id,
    fu.user_name AS from_user_name,
    fu.user_type AS from_user_type,
    s.to_user_id,
    tu.user_name AS to_user_name,
    tu.user_type AS to_user_type,
    s.amount
FROM 
    user_settlements s
    JOIN all_users fu ON s.from_user_id = fu.user_id
    JOIN all_users tu ON s.to_user_id = tu.user_id
WHERE 
    s.amount > 0
ORDER BY 
    s.amount DESC;
$$;

-- Add a comment to explain the function
COMMENT ON FUNCTION public.get_all_settlements(p_group_id uuid) IS
'Calculates who owes whom for all users in the group based on the actual expense splits.
Returns a comprehensive view of all debts between users, including user names and types.
This function provides a complete picture of the financial relationships between all users in the group.'; 