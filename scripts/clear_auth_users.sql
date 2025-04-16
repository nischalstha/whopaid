-- Delete all users from the auth.users table
-- This will cascade to delete related records in other auth tables
DELETE FROM auth.users;

-- Reset any sequences if needed
-- This is optional but can be helpful for a clean slate
-- ALTER SEQUENCE auth.users_id_seq RESTART WITH 1; 