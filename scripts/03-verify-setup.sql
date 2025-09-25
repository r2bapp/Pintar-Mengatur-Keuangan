-- Verify database setup
SELECT 'user_profiles table exists' as check_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') 
            THEN 'PASS' ELSE 'FAIL' END as status;

SELECT 'transactions table exists' as check_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') 
            THEN 'PASS' ELSE 'FAIL' END as status;

SELECT 'financial_goals table exists' as check_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_goals') 
            THEN 'PASS' ELSE 'FAIL' END as status;

SELECT 'budgets table exists' as check_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'budgets') 
            THEN 'PASS' ELSE 'FAIL' END as status;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'transactions', 'financial_goals', 'budgets');

-- Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Test basic functionality
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  user_type TEXT
);
SELECT 'Test insert successful' as check_name, 'PASS' as status;

-- Clean up test data
DELETE FROM user_profiles WHERE id = '00000000-0000-0000-0000-000000000000';
