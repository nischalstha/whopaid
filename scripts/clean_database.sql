-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Clean all tables
TRUNCATE TABLE public.expense_splits CASCADE;
TRUNCATE TABLE public.expenses CASCADE;
TRUNCATE TABLE public.group_members CASCADE;
TRUNCATE TABLE public.invited_users CASCADE;
TRUNCATE TABLE public.groups CASCADE;
TRUNCATE TABLE public.users CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = 'origin'; 