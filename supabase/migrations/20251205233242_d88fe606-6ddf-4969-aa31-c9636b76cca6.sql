-- Create a separate table for password credentials (no SELECT allowed)
CREATE TABLE public.user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  phone_number TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

-- NO SELECT policy - password hashes should never be readable, even by the owner
-- Only service role (used by edge functions) can access this table

-- Trigger for updated_at
CREATE TRIGGER update_user_credentials_updated_at
  BEFORE UPDATE ON public.user_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing password data from user_profiles to user_credentials
INSERT INTO public.user_credentials (user_id, phone_number, password_hash, created_at, updated_at)
SELECT user_id, phone_number, password_hash, created_at, updated_at
FROM public.user_profiles
WHERE user_id IS NOT NULL AND password_hash IS NOT NULL;

-- Remove password_hash from user_profiles table
ALTER TABLE public.user_profiles DROP COLUMN password_hash;