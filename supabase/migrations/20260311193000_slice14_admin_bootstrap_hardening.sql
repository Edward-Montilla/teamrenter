-- Slice 14 hardening: first-admin bootstrap + constrained review path

CREATE TABLE IF NOT EXISTS public.admin_bootstrap_allowlist (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_bootstrap_allowlist_email_lowercase CHECK (email = lower(btrim(email))),
  CONSTRAINT admin_bootstrap_allowlist_email_not_blank CHECK (char_length(btrim(email)) > 0)
);

ALTER TABLE public.admin_bootstrap_allowlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_bootstrap_allowlist_select_admin ON public.admin_bootstrap_allowlist;
DROP POLICY IF EXISTS admin_bootstrap_allowlist_insert_admin ON public.admin_bootstrap_allowlist;
DROP POLICY IF EXISTS admin_bootstrap_allowlist_update_admin ON public.admin_bootstrap_allowlist;
DROP POLICY IF EXISTS admin_bootstrap_allowlist_delete_admin ON public.admin_bootstrap_allowlist;

CREATE POLICY admin_bootstrap_allowlist_select_admin
  ON public.admin_bootstrap_allowlist
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY admin_bootstrap_allowlist_insert_admin
  ON public.admin_bootstrap_allowlist
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY admin_bootstrap_allowlist_update_admin
  ON public.admin_bootstrap_allowlist
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY admin_bootstrap_allowlist_delete_admin
  ON public.admin_bootstrap_allowlist
  FOR DELETE
  USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.profiles_restrict_sensitive_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- If role or email_verified are changing, only allow admins (or callers with no auth context)
  IF (NEW.role IS DISTINCT FROM OLD.role)
     OR (NEW.email_verified IS DISTINCT FROM OLD.email_verified)
  THEN
    -- Allow a tightly scoped first-admin bootstrap for the signed-in allowlisted user.
    IF current_setting('teamrenter.bootstrap_first_admin', true) = 'on' THEN
      IF auth.uid() = OLD.user_id
         AND OLD.role <> 'admin'
         AND NEW.role = 'admin'
         AND NEW.email_verified IS NOT DISTINCT FROM OLD.email_verified
         AND NOT EXISTS (
           SELECT 1
           FROM public.profiles p
           WHERE p.role = 'admin'
         )
      THEN
        RETURN NEW;
      ELSE
        RAISE EXCEPTION 'Invalid first-admin bootstrap attempt';
      END IF;
    END IF;

    -- Allow changes from contexts without auth.uid() (e.g., service role, direct SQL)
    IF auth.uid() IS NULL THEN
      RETURN NEW;
    ELSIF public.is_admin() THEN
      RETURN NEW;
    ELSE
      RAISE EXCEPTION 'Only admins can change role or email_verified';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_first_admin_bootstrap_status()
RETURNS TABLE (
  has_admin_accounts boolean,
  can_claim boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
BEGIN
  v_email := lower(btrim(coalesce(auth.jwt() ->> 'email', '')));

  RETURN QUERY
  SELECT
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.role = 'admin'
    ) AS has_admin_accounts,
    (
      auth.uid() IS NOT NULL
      AND v_email <> ''
      AND EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.user_id = auth.uid()
      )
      AND EXISTS (
        SELECT 1
        FROM public.admin_bootstrap_allowlist abl
        WHERE abl.email = v_email
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.role = 'admin'
      )
    ) AS can_claim;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS TABLE (
  user_id uuid,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
  v_rowcount integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'An admin account already exists';
  END IF;

  v_email := lower(btrim(coalesce(auth.jwt() ->> 'email', '')));
  IF v_email = '' THEN
    RAISE EXCEPTION 'A verified email address is required to claim first admin';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.admin_bootstrap_allowlist abl
    WHERE abl.email = v_email
  ) THEN
    RAISE EXCEPTION 'This account is not allowed to claim first admin';
  END IF;

  PERFORM set_config('teamrenter.bootstrap_first_admin', 'on', true);

  UPDATE public.profiles
  SET role = 'admin'
  WHERE user_id = auth.uid();

  GET DIAGNOSTICS v_rowcount = ROW_COUNT;

  IF v_rowcount <> 1 THEN
    RAISE EXCEPTION 'Profile could not be promoted to admin';
  END IF;

  INSERT INTO public.admin_audit_log (
    admin_user_id,
    action_type,
    target_type,
    target_id,
    details
  )
  VALUES (
    auth.uid(),
    'admin_bootstrap_claimed',
    'profile',
    auth.uid(),
    jsonb_build_object(
      'email', v_email,
      'source', 'admin_bootstrap_allowlist'
    )
  );

  RETURN QUERY
  SELECT
    p.user_id,
    p.role
  FROM public.profiles p
  WHERE p.user_id = auth.uid();
END;
$$;

DROP POLICY IF EXISTS admin_role_requests_update_admin ON public.admin_role_requests;

CREATE OR REPLACE FUNCTION public.review_admin_role_request(
  p_request_id uuid,
  p_status text,
  p_review_notes text DEFAULT NULL
)
RETURNS TABLE (
  request_id uuid,
  user_id uuid,
  status text,
  email_snapshot text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_request public.admin_role_requests%ROWTYPE;
  v_notes text;
  v_rowcount integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Only approved or rejected are allowed review states';
  END IF;

  SELECT *
  INTO v_request
  FROM public.admin_role_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin role request not found';
  END IF;

  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending admin role requests can be reviewed';
  END IF;

  v_notes := nullif(btrim(coalesce(p_review_notes, '')), '');

  IF p_status = 'approved' THEN
    UPDATE public.profiles
    SET role = 'admin'
    WHERE user_id = v_request.user_id;

    GET DIAGNOSTICS v_rowcount = ROW_COUNT;

    IF v_rowcount <> 1 THEN
      RAISE EXCEPTION 'Profile could not be promoted to admin';
    END IF;
  END IF;

  RETURN QUERY
  UPDATE public.admin_role_requests
  SET
    status = p_status,
    review_notes = v_notes,
    reviewed_by = auth.uid(),
    reviewed_at = now()
  WHERE id = p_request_id
  RETURNING
    admin_role_requests.id,
    admin_role_requests.user_id,
    admin_role_requests.status,
    admin_role_requests.email_snapshot;
END;
$$;
