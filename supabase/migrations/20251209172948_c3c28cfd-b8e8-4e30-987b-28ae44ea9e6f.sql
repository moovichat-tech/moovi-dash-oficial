-- Drop the redundant user_profiles_safe view that exposes phone numbers without RLS protection
-- The main user_profiles table already has proper RLS policies for user access control
DROP VIEW IF EXISTS public.user_profiles_safe;