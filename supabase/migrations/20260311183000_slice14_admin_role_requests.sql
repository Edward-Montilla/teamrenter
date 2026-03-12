-- Slice 14: admin access request workflow

CREATE TABLE IF NOT EXISTS public.admin_role_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  email_snapshot text NOT NULL,
  reason text NOT NULL CHECK (char_length(btrim(reason)) > 0 AND char_length(reason) <= 1000),
  team_context text CHECK (team_context IS NULL OR char_length(team_context) <= 160),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_notes text,
  reviewed_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_role_requests_review_state_consistency CHECK (
    (
      status = 'pending'
      AND reviewed_by IS NULL
      AND reviewed_at IS NULL
    )
    OR (
      status IN ('approved', 'rejected')
      AND reviewed_by IS NOT NULL
      AND reviewed_at IS NOT NULL
    )
  )
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'admin_role_requests_set_updated_at'
      AND tgrelid = 'public.admin_role_requests'::regclass
  ) THEN
    CREATE TRIGGER admin_role_requests_set_updated_at
      BEFORE UPDATE ON public.admin_role_requests
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS admin_role_requests_one_pending_per_user
  ON public.admin_role_requests (user_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_admin_role_requests_status_created_at
  ON public.admin_role_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_role_requests_user_created_at
  ON public.admin_role_requests (user_id, created_at DESC);

ALTER TABLE public.admin_role_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_role_requests_select_own ON public.admin_role_requests;
DROP POLICY IF EXISTS admin_role_requests_insert_own ON public.admin_role_requests;
DROP POLICY IF EXISTS admin_role_requests_select_admin ON public.admin_role_requests;
DROP POLICY IF EXISTS admin_role_requests_update_admin ON public.admin_role_requests;

CREATE POLICY admin_role_requests_select_own
  ON public.admin_role_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY admin_role_requests_insert_own
  ON public.admin_role_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
  );

CREATE POLICY admin_role_requests_select_admin
  ON public.admin_role_requests
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY admin_role_requests_update_admin
  ON public.admin_role_requests
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

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
