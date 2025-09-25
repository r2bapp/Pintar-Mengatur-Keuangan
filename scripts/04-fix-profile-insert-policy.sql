-- Drop the existing problematic INSERT policy for user_profiles
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.user_profiles;

-- Create a new policy that allows the service_role to insert into user_profiles.
-- This is necessary for the 'handle_new_user' trigger to work correctly,
-- as SECURITY DEFINER functions still respect RLS unless explicitly bypassed
-- or allowed by a policy for the role they effectively operate under (e.g., service_role).
CREATE POLICY "Allow service role to insert user profiles" ON public.user_profiles FOR INSERT
TO service_role
WITH CHECK (true);

-- Note: The existing SELECT and UPDATE policies for authenticated users remain unchanged
-- and are still valid for client-side operations.
