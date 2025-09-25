-- Drop the previous policy for service_role insert if it exists,
-- as we will now handle RLS bypass directly within the trigger function.
DROP POLICY IF EXISTS "Allow service role to insert user profiles" ON public.user_profiles;

-- Revise the handle_new_user function to temporarily bypass RLS for its insert operation.
-- This ensures the profile creation succeeds regardless of other RLS policies.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Temporarily disable RLS for the current session/transaction for the INSERT operation.
  -- The 'true' argument ensures this setting is local to the current transaction.
  PERFORM set_config('row_security.force_enable', 'off', true);

  -- Perform the insert into user_profiles
  INSERT INTO public.user_profiles (id, email, full_name, user_type)
  VALUES (new.id, new.email, '', 'personal');

  -- Re-enable RLS (though it will automatically reset at the end of the transaction)
  PERFORM set_config('row_security.force_enable', 'on', true);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is still active (no changes needed if it was already created by 02-fix-rls-policies.sql)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
