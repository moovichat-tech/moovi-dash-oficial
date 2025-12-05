-- Remove redundant service role policy
-- Service role already bypasses RLS by default in Supabase
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.user_profiles;