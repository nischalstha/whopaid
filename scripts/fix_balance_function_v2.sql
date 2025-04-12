-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_balances(p_group_id uuid);

-- Create updated function with proper type handling
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
    
    -- Insert registered users with explicit type conversion
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
    
    -- Insert invited users with explicit type conversion
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
        -- Amounts paid by each user - with explicit type casting
        SELECT 
            e.paid_by::text AS user_id,
            e.amount AS paid_amount
        FROM 
            public.expenses e
        WHERE 
            e.group_id = p_group_id
    ),
    splits AS (
        -- Amounts owed by each user - with explicit type casting
        SELECT 
            es.user_id::text AS user_id,
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
        b.user_id,
        b.user_name,
        b.balance
    FROM 
        balances b
    ORDER BY 
        b.balance DESC;
END;
$$; 