-- Support richer admin-console user management without exposing auth.users
-- broadly. Admins can list users, their auth email, and latest admin-request
-- context through a privileged RPC.

CREATE OR REPLACE FUNCTION public.admin_list_users(
  p_query text DEFAULT NULL,
  p_role text DEFAULT NULL,
  p_email_verified boolean DEFAULT NULL,
  p_request_status text DEFAULT NULL,
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  user_id uuid,
  email text,
  role text,
  email_verified boolean,
  created_at timestamptz,
  updated_at timestamptz,
  latest_admin_request_id uuid,
  latest_admin_request_status text,
  latest_admin_request_created_at timestamptz,
  latest_admin_request_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  WITH latest_requests AS (
    SELECT DISTINCT ON (arr.user_id)
      arr.id,
      arr.user_id,
      arr.status,
      arr.created_at,
      arr.email_snapshot
    FROM public.admin_role_requests arr
    ORDER BY arr.user_id, arr.created_at DESC
  )
  SELECT
    p.user_id,
    u.email::text,
    p.role,
    p.email_verified,
    p.created_at,
    p.updated_at,
    lr.id,
    COALESCE(lr.status, 'none'),
    lr.created_at,
    lr.email_snapshot
  FROM public.profiles p
  LEFT JOIN auth.users u
    ON u.id = p.user_id
  LEFT JOIN latest_requests lr
    ON lr.user_id = p.user_id
  WHERE (
      p_query IS NULL
      OR btrim(p_query) = ''
      OR COALESCE(u.email, '') ILIKE '%' || btrim(p_query) || '%'
      OR p.user_id::text ILIKE '%' || btrim(p_query) || '%'
      OR COALESCE(lr.email_snapshot, '') ILIKE '%' || btrim(p_query) || '%'
    )
    AND (
      p_role IS NULL
      OR p_role = ''
      OR p.role = p_role
    )
    AND (
      p_email_verified IS NULL
      OR p.email_verified = p_email_verified
    )
    AND (
      p_request_status IS NULL
      OR p_request_status = ''
      OR COALESCE(lr.status, 'none') = p_request_status
    )
  ORDER BY
    CASE p.role
      WHEN 'admin' THEN 0
      WHEN 'verified' THEN 1
      ELSE 2
    END,
    COALESCE(u.email, lr.email_snapshot, p.user_id::text),
    p.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 100), 200));
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users(text, text, boolean, text, integer)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_users(text, text, boolean, text, integer)
  TO authenticated;
