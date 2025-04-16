-- Insert the current user into the public.users table
-- Replace 'YOUR_USER_ID' with your actual Supabase Auth user ID
-- Replace 'Your Name' with your actual name
-- Replace 'your.email@example.com' with your actual email

INSERT INTO public.users (id, name, email, created_at)
SELECT 
  id,
  raw_user_meta_data->>'name',
  email,
  created_at
FROM auth.users
WHERE id = 'YOUR_USER_ID'
ON CONFLICT (id) DO NOTHING; 