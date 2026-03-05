-- Slice 05: Supabase RLS, roles, and public exposure strategy
-- - Enable RLS on core tables
-- - Add helper functions for admin / verified checks
-- - Lock down profiles.role and profiles.email_verified to admins
-- - Define explicit, minimal policies per table

-- =============================================================================
-- RLS: enable on core tables
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distilled_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- Helper functions: roles and verification
-- =============================================================================

-- Helper: is_admin() — true when current auth.uid() has profiles.role = 'admin'
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = 'admin'
  );
$$;

-- Helper: is_verified() — true when current auth.uid() has profiles.email_verified = true
CREATE OR REPLACE FUNCTION public.is_verified()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.email_verified = true
  );
$$;


-- =============================================================================
-- Profiles: restrict sensitive updates (role, email_verified)
-- =============================================================================

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

DROP TRIGGER IF EXISTS profiles_restrict_sensitive_update ON public.profiles;

CREATE TRIGGER profiles_restrict_sensitive_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_restrict_sensitive_update();


-- =============================================================================
-- Defensive reset: drop policies if they exist
-- =============================================================================

-- profiles
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_select_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;

-- properties
DROP POLICY IF EXISTS properties_select_active ON public.properties;
DROP POLICY IF EXISTS properties_select_admin ON public.properties;
DROP POLICY IF EXISTS properties_insert_admin ON public.properties;
DROP POLICY IF EXISTS properties_update_admin ON public.properties;
DROP POLICY IF EXISTS properties_delete_admin ON public.properties;

-- property_aggregates
DROP POLICY IF EXISTS property_aggregates_select_public ON public.property_aggregates;
DROP POLICY IF EXISTS property_aggregates_select_admin ON public.property_aggregates;
DROP POLICY IF EXISTS property_aggregates_insert_admin ON public.property_aggregates;
DROP POLICY IF EXISTS property_aggregates_update_admin ON public.property_aggregates;
DROP POLICY IF EXISTS property_aggregates_delete_admin ON public.property_aggregates;

-- distilled_insights
DROP POLICY IF EXISTS distilled_insights_select_public ON public.distilled_insights;
DROP POLICY IF EXISTS distilled_insights_select_admin ON public.distilled_insights;
DROP POLICY IF EXISTS distilled_insights_insert_admin ON public.distilled_insights;
DROP POLICY IF EXISTS distilled_insights_update_admin ON public.distilled_insights;
DROP POLICY IF EXISTS distilled_insights_delete_admin ON public.distilled_insights;

-- reviews
DROP POLICY IF EXISTS reviews_select_own_verified ON public.reviews;
DROP POLICY IF EXISTS reviews_select_admin ON public.reviews;
DROP POLICY IF EXISTS reviews_insert_verified ON public.reviews;
DROP POLICY IF EXISTS reviews_update_admin ON public.reviews;
DROP POLICY IF EXISTS reviews_delete_admin ON public.reviews;

-- admin_audit_log
DROP POLICY IF EXISTS admin_audit_log_select_admin ON public.admin_audit_log;
DROP POLICY IF EXISTS admin_audit_log_insert_admin ON public.admin_audit_log;

-- property_photos
DROP POLICY IF EXISTS property_photos_select_public ON public.property_photos;
DROP POLICY IF EXISTS property_photos_select_admin ON public.property_photos;
DROP POLICY IF EXISTS property_photos_insert_admin ON public.property_photos;
DROP POLICY IF EXISTS property_photos_update_admin ON public.property_photos;
DROP POLICY IF EXISTS property_photos_delete_admin ON public.property_photos;


-- =============================================================================
-- Policies by table
-- =============================================================================

-- 1) profiles

CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY profiles_select_admin
  ON public.profiles
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY profiles_update_admin
  ON public.profiles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY profiles_insert_self
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin());


-- 2) properties

CREATE POLICY properties_select_active
  ON public.properties
  FOR SELECT
  USING (status = 'active');

CREATE POLICY properties_select_admin
  ON public.properties
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY properties_insert_admin
  ON public.properties
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY properties_update_admin
  ON public.properties
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY properties_delete_admin
  ON public.properties
  FOR DELETE
  USING (public.is_admin());


-- 3) property_aggregates

CREATE POLICY property_aggregates_select_public
  ON public.property_aggregates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.properties p
      WHERE p.id = property_id
        AND p.status = 'active'
    )
  );

CREATE POLICY property_aggregates_select_admin
  ON public.property_aggregates
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY property_aggregates_insert_admin
  ON public.property_aggregates
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY property_aggregates_update_admin
  ON public.property_aggregates
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY property_aggregates_delete_admin
  ON public.property_aggregates
  FOR DELETE
  USING (public.is_admin());


-- 4) distilled_insights

CREATE POLICY distilled_insights_select_public
  ON public.distilled_insights
  FOR SELECT
  USING (
    status = 'approved'
    AND EXISTS (
      SELECT 1
      FROM public.properties p
      WHERE p.id = property_id
        AND p.status = 'active'
    )
  );

CREATE POLICY distilled_insights_select_admin
  ON public.distilled_insights
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY distilled_insights_insert_admin
  ON public.distilled_insights
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY distilled_insights_update_admin
  ON public.distilled_insights
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY distilled_insights_delete_admin
  ON public.distilled_insights
  FOR DELETE
  USING (public.is_admin());


-- 5) reviews

CREATE POLICY reviews_select_own_verified
  ON public.reviews
  FOR SELECT
  USING (user_id = auth.uid() AND public.is_verified());

CREATE POLICY reviews_select_admin
  ON public.reviews
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY reviews_insert_verified
  ON public.reviews
  FOR INSERT
  WITH CHECK (public.is_verified() AND user_id = auth.uid());

CREATE POLICY reviews_update_admin
  ON public.reviews
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY reviews_delete_admin
  ON public.reviews
  FOR DELETE
  USING (public.is_admin());


-- 6) admin_audit_log

CREATE POLICY admin_audit_log_select_admin
  ON public.admin_audit_log
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY admin_audit_log_insert_admin
  ON public.admin_audit_log
  FOR INSERT
  WITH CHECK (public.is_admin() AND admin_user_id = auth.uid());

-- No UPDATE/DELETE policies => immutable log for non-bypass roles


-- 7) property_photos

CREATE POLICY property_photos_select_public
  ON public.property_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.properties p
      WHERE p.id = property_id
        AND p.status = 'active'
    )
  );

CREATE POLICY property_photos_select_admin
  ON public.property_photos
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY property_photos_insert_admin
  ON public.property_photos
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY property_photos_update_admin
  ON public.property_photos
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY property_photos_delete_admin
  ON public.property_photos
  FOR DELETE
  USING (public.is_admin());

