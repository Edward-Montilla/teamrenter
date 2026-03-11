-- Keep public.profiles in sync with auth.users so browser auth flows
-- automatically create a profile row and reflect email verification.

CREATE OR REPLACE FUNCTION public.sync_profile_from_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  next_email_verified boolean;
  next_role text;
BEGIN
  next_email_verified := NEW.email_confirmed_at IS NOT NULL;
  next_role := CASE
    WHEN next_email_verified THEN 'verified'
    ELSE 'public'
  END;

  INSERT INTO public.profiles (
    user_id,
    role,
    email_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    next_role,
    next_email_verified,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    email_verified = EXCLUDED.email_verified,
    role = CASE
      WHEN public.profiles.role = 'admin' THEN 'admin'
      WHEN EXCLUDED.email_verified THEN 'verified'
      ELSE 'public'
    END,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_from_auth_user ON auth.users;

CREATE TRIGGER sync_profile_from_auth_user
  AFTER INSERT OR UPDATE OF email_confirmed_at
  ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_from_auth_user();

-- Backfill existing auth users so new browser-based sign-up/sign-in flows
-- work without manually inserting profile rows.
INSERT INTO public.profiles (
  user_id,
  role,
  email_verified,
  created_at,
  updated_at
)
SELECT
  u.id,
  CASE
    WHEN u.email_confirmed_at IS NOT NULL THEN 'verified'
    ELSE 'public'
  END,
  u.email_confirmed_at IS NOT NULL,
  now(),
  now()
FROM auth.users u
ON CONFLICT (user_id) DO UPDATE
SET
  email_verified = EXCLUDED.email_verified,
  role = CASE
    WHEN public.profiles.role = 'admin' THEN 'admin'
    WHEN EXCLUDED.email_verified THEN 'verified'
    ELSE 'public'
  END,
  updated_at = now();
