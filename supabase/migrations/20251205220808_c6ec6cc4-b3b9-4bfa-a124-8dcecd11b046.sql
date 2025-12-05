-- Create a safe view that excludes password_hash for client queries
CREATE VIEW public.user_profiles_safe AS
SELECT id, user_id, phone_number, has_password, created_at, updated_at
FROM public.user_profiles;

-- Enable RLS on the view
ALTER VIEW public.user_profiles_safe SET (security_invoker = true);

-- Drop existing SELECT policy on user_profiles (users should use the view instead)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;

-- Create policy for the safe view - users can only see their own profile
CREATE POLICY "Users can view own profile via safe view"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Revoke direct SELECT on user_profiles from anon and authenticated roles
-- They should use the view instead
REVOKE SELECT ON public.user_profiles FROM anon;
REVOKE SELECT ON public.user_profiles FROM authenticated;

-- Grant SELECT on the safe view to authenticated users
GRANT SELECT ON public.user_profiles_safe TO authenticated;