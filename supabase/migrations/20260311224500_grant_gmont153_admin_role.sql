-- Promote the known Mt. Royal account to admin by email.
-- This runs in a privileged migration context, so the profiles trigger allows it.

DO $$
DECLARE
  v_user_id uuid;
  v_match_count integer;
  v_affected_count integer;
BEGIN
  SELECT COUNT(*)
  INTO v_match_count
  FROM auth.users u
  WHERE lower(btrim(u.email)) = 'gmont153@mtroyal.ca';

  IF v_match_count = 0 THEN
    RAISE EXCEPTION 'No auth.users record found for email gmont153@mtroyal.ca';
  ELSIF v_match_count > 1 THEN
    RAISE EXCEPTION 'Multiple auth.users records found for email gmont153@mtroyal.ca';
  END IF;

  SELECT u.id
  INTO v_user_id
  FROM auth.users u
  WHERE lower(btrim(u.email)) = 'gmont153@mtroyal.ca';

  INSERT INTO public.profiles (
    user_id,
    role,
    email_verified,
    created_at,
    updated_at
  )
  SELECT
    u.id,
    'admin',
    u.email_confirmed_at IS NOT NULL,
    now(),
    now()
  FROM auth.users u
  WHERE u.id = v_user_id
  ON CONFLICT (user_id) DO UPDATE
  SET
    role = 'admin',
    email_verified = EXCLUDED.email_verified,
    updated_at = now();

  GET DIAGNOSTICS v_affected_count = ROW_COUNT;

  IF v_affected_count <> 1 THEN
    RAISE EXCEPTION 'Profile promotion failed for email gmont153@mtroyal.ca';
  END IF;
END;
$$;
