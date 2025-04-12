-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_balances(p_group_id uuid);

-- Create updated function that handles invited users
CREATE OR REPLACE FUNCTION public.get_balances(p_group_id uuid)
RETURNS TABLE (
    user_id text,
    user_name text,
    balance numeric
) 
LANGUAGE plpgsql
AS $$
BEGIN
    -- First, create a temporary table to store all users (registered and invited)
    CREATE TEMPORARY TABLE temp_all_users (
        user_id text,
        user_name text,
        is_invited boolean
    ) ON COMMIT DROP;
    
    -- Insert registered users
    INSERT INTO temp_all_users (user_id, user_name, is_invited)
    SELECT 
        u.id::text, 
        u.name, 
        FALSE
    FROM 
        public.group_members gm
        JOIN public.users u ON gm.user_id = u.id
    WHERE 
        gm.group_id = p_group_id;
    
    -- Insert invited users
    INSERT INTO temp_all_users (user_id, user_name, is_invited)
    SELECT 
        iu.id::text, 
        iu.name, 
        TRUE
    FROM 
        public.invited_users iu
    WHERE 
        iu.group_id = p_group_id AND
        iu.status IN ('pending', 'registered');
    
    -- Return calculated balances for all users
    RETURN QUERY
    WITH payments AS (
        -- Amounts paid by each user
        SELECT 
            CASE 
                WHEN e.paid_by IN (SELECT user_id FROM temp_all_users WHERE is_invited = FALSE) THEN e.paid_by
                ELSE e.paid_by -- This is already the invited_users.id
            END AS user_id,
            e.amount AS paid_amount
        FROM 
            public.expenses e
        WHERE 
            e.group_id = p_group_id
    ),
    splits AS (
        -- Amounts owed by each user
        SELECT 
            CASE 
                WHEN es.is_invited_user = FALSE THEN es.user_id
                ELSE es.user_id -- This is the invited_users.id
            END AS user_id,
            es.amount AS split_amount
        FROM 
            public.expense_splits es
            JOIN public.expenses e ON es.expense_id = e.id
        WHERE 
            e.group_id = p_group_id
    ),
    balances AS (
        -- Calculate net balance for each user
        SELECT 
            tau.user_id,
            tau.user_name,
            (COALESCE(SUM(p.paid_amount), 0) - COALESCE(SUM(s.split_amount), 0)) AS balance
        FROM 
            temp_all_users tau
            LEFT JOIN payments p ON tau.user_id = p.user_id
            LEFT JOIN splits s ON tau.user_id = s.user_id
        GROUP BY 
            tau.user_id, tau.user_name
    )
    SELECT 
        user_id,
        user_name,
        balance
    FROM 
        balances
    ORDER BY 
        balance DESC;
END;
$$; 