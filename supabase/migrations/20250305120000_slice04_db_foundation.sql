-- Slice 04: DB Foundation — Schema, constraints, triggers, indexes
-- No RLS (Slice 05). Backend only.

-- Extensions (gen_random_uuid is in pgcrypto; Supabase often has it)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- TABLES (dependency order)
-- =============================================================================

-- 1) profiles
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'public' CHECK (role IN ('public', 'verified', 'admin')),
  email_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) properties
CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  province text NOT NULL,
  postal_code text NOT NULL,
  management_company text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) reviews
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'removed')),
  management_responsiveness smallint NOT NULL CHECK (management_responsiveness >= 0 AND management_responsiveness <= 5),
  maintenance_timeliness smallint NOT NULL CHECK (maintenance_timeliness >= 0 AND maintenance_timeliness <= 5),
  listing_accuracy smallint NOT NULL CHECK (listing_accuracy >= 0 AND listing_accuracy <= 5),
  fee_transparency smallint NOT NULL CHECK (fee_transparency >= 0 AND fee_transparency <= 5),
  lease_clarity smallint NOT NULL CHECK (lease_clarity >= 0 AND lease_clarity <= 5),
  text_input text CHECK (text_input IS NULL OR char_length(text_input) <= 500),
  tenancy_start date,
  tenancy_end date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_tenancy_order CHECK (
    tenancy_start IS NULL OR tenancy_end IS NULL OR tenancy_start <= tenancy_end
  ),
  CONSTRAINT reviews_unique_user_property UNIQUE (user_id, property_id)
);

-- 4) property_aggregates (must match PropertyAggregatePublic; UI reads in Slice 06)
CREATE TABLE public.property_aggregates (
  property_id uuid PRIMARY KEY REFERENCES public.properties(id) ON DELETE CASCADE,
  review_count int NOT NULL DEFAULT 0,
  avg_management_responsiveness numeric,
  avg_maintenance_timeliness numeric,
  avg_listing_accuracy numeric,
  avg_fee_transparency numeric,
  avg_lease_clarity numeric,
  avg_trustscore numeric,
  display_management_responsiveness_0_6 smallint NOT NULL DEFAULT 0 CHECK (display_management_responsiveness_0_6 >= 0 AND display_management_responsiveness_0_6 <= 6),
  display_maintenance_timeliness_0_6 smallint NOT NULL DEFAULT 0 CHECK (display_maintenance_timeliness_0_6 >= 0 AND display_maintenance_timeliness_0_6 <= 6),
  display_listing_accuracy_0_6 smallint NOT NULL DEFAULT 0 CHECK (display_listing_accuracy_0_6 >= 0 AND display_listing_accuracy_0_6 <= 6),
  display_fee_transparency_0_6 smallint NOT NULL DEFAULT 0 CHECK (display_fee_transparency_0_6 >= 0 AND display_fee_transparency_0_6 <= 6),
  display_lease_clarity_0_6 smallint NOT NULL DEFAULT 0 CHECK (display_lease_clarity_0_6 >= 0 AND display_lease_clarity_0_6 <= 6),
  display_trustscore_0_6 smallint NOT NULL DEFAULT 0 CHECK (display_trustscore_0_6 >= 0 AND display_trustscore_0_6 <= 6),
  last_updated timestamptz NOT NULL DEFAULT now()
);

-- 5) distilled_insights
CREATE TABLE public.distilled_insights (
  property_id uuid PRIMARY KEY REFERENCES public.properties(id) ON DELETE CASCADE,
  insights_text text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')),
  screened boolean NOT NULL DEFAULT false,
  screening_flags jsonb,
  last_generated_at timestamptz NOT NULL DEFAULT now(),
  screened_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6) admin_audit_log
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  action_type text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7) property_photos (optional; bytes in R2 later, metadata in Postgres)
CREATE TABLE public.property_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  r2_bucket text NOT NULL,
  r2_key text NOT NULL,
  content_type text,
  bytes bigint,
  width int,
  height int,
  uploaded_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT property_photos_unique_r2 UNIQUE (r2_bucket, r2_key)
);

-- =============================================================================
-- TRIGGER: set_updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER properties_set_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER reviews_set_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER distilled_insights_set_updated_at
  BEFORE UPDATE ON public.distilled_insights
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- RATE LIMIT: enforce_review_rate_limit (BEFORE INSERT on reviews)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.enforce_review_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  recent_count int;
BEGIN
  SELECT count(*)::int INTO recent_count
  FROM public.reviews
  WHERE user_id = NEW.user_id
    AND created_at >= now() - interval '6 months';

  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'Review limit reached: max 3 per 6 months';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER reviews_enforce_rate_limit
  BEFORE INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.enforce_review_rate_limit();

-- =============================================================================
-- AGGREGATION: recompute_property_aggregates(p_property_id)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.recompute_property_aggregates(p_property_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_review_count int;
  v_avg_mgmt numeric;
  v_avg_maint numeric;
  v_avg_list numeric;
  v_avg_fee numeric;
  v_avg_lease numeric;
  v_avg_trust numeric;
  v_d_mgmt smallint;
  v_d_maint smallint;
  v_d_list smallint;
  v_d_fee smallint;
  v_d_lease smallint;
  v_d_trust smallint;
BEGIN
  SELECT
    count(*)::int,
    avg(management_responsiveness),
    avg(maintenance_timeliness),
    avg(listing_accuracy),
    avg(fee_transparency),
    avg(lease_clarity)
  INTO
    v_review_count,
    v_avg_mgmt,
    v_avg_maint,
    v_avg_list,
    v_avg_fee,
    v_avg_lease
  FROM public.reviews
  WHERE property_id = p_property_id AND status = 'approved';

  -- avg_trustscore = mean of the 5 metric averages (equal weights)
  IF v_review_count > 0 AND v_avg_mgmt IS NOT NULL THEN
    v_avg_trust := (coalesce(v_avg_mgmt, 0) + coalesce(v_avg_maint, 0) + coalesce(v_avg_list, 0) + coalesce(v_avg_fee, 0) + coalesce(v_avg_lease, 0)) / 5.0;
  ELSE
    v_avg_trust := NULL;
    v_review_count := 0;
  END IF;

  -- display_*_0_6: 0 when no reviews or null avg; else round((avg/5)*6) clamped 0..6
  IF v_review_count = 0 OR v_avg_mgmt IS NULL THEN
    v_d_mgmt := 0; v_d_maint := 0; v_d_list := 0; v_d_fee := 0; v_d_lease := 0; v_d_trust := 0;
  ELSE
    v_d_mgmt := least(6, greatest(0, round((v_avg_mgmt / 5.0) * 6.0)::int));
    v_d_maint := least(6, greatest(0, round((v_avg_maint / 5.0) * 6.0)::int));
    v_d_list := least(6, greatest(0, round((v_avg_list / 5.0) * 6.0)::int));
    v_d_fee := least(6, greatest(0, round((v_avg_fee / 5.0) * 6.0)::int));
    v_d_lease := least(6, greatest(0, round((v_avg_lease / 5.0) * 6.0)::int));
    v_d_trust := least(6, greatest(0, round((v_avg_trust / 5.0) * 6.0)::int));
  END IF;

  INSERT INTO public.property_aggregates (
    property_id,
    review_count,
    avg_management_responsiveness,
    avg_maintenance_timeliness,
    avg_listing_accuracy,
    avg_fee_transparency,
    avg_lease_clarity,
    avg_trustscore,
    display_management_responsiveness_0_6,
    display_maintenance_timeliness_0_6,
    display_listing_accuracy_0_6,
    display_fee_transparency_0_6,
    display_lease_clarity_0_6,
    display_trustscore_0_6,
    last_updated
  ) VALUES (
    p_property_id,
    coalesce(v_review_count, 0),
    v_avg_mgmt,
    v_avg_maint,
    v_avg_list,
    v_avg_fee,
    v_avg_lease,
    v_avg_trust,
    v_d_mgmt,
    v_d_maint,
    v_d_list,
    v_d_fee,
    v_d_lease,
    v_d_trust,
    now()
  )
  ON CONFLICT (property_id) DO UPDATE SET
    review_count = EXCLUDED.review_count,
    avg_management_responsiveness = EXCLUDED.avg_management_responsiveness,
    avg_maintenance_timeliness = EXCLUDED.avg_maintenance_timeliness,
    avg_listing_accuracy = EXCLUDED.avg_listing_accuracy,
    avg_fee_transparency = EXCLUDED.avg_fee_transparency,
    avg_lease_clarity = EXCLUDED.avg_lease_clarity,
    avg_trustscore = EXCLUDED.avg_trustscore,
    display_management_responsiveness_0_6 = EXCLUDED.display_management_responsiveness_0_6,
    display_maintenance_timeliness_0_6 = EXCLUDED.display_maintenance_timeliness_0_6,
    display_listing_accuracy_0_6 = EXCLUDED.display_listing_accuracy_0_6,
    display_fee_transparency_0_6 = EXCLUDED.display_fee_transparency_0_6,
    display_lease_clarity_0_6 = EXCLUDED.display_lease_clarity_0_6,
    display_trustscore_0_6 = EXCLUDED.display_trustscore_0_6,
    last_updated = now();
END;
$$;

-- =============================================================================
-- TRIGGER: reviews_aggregate_trigger (AFTER INSERT/UPDATE/DELETE on reviews)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.reviews_aggregate_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'approved' THEN
      PERFORM public.recompute_property_aggregates(NEW.property_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'approved' THEN
      PERFORM public.recompute_property_aggregates(OLD.property_id);
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.property_id IS DISTINCT FROM OLD.property_id THEN
      IF OLD.status = 'approved' THEN
        PERFORM public.recompute_property_aggregates(OLD.property_id);
      END IF;
      IF NEW.status = 'approved' THEN
        PERFORM public.recompute_property_aggregates(NEW.property_id);
      END IF;
    ELSE
      IF OLD.status = 'approved' OR NEW.status = 'approved' THEN
        PERFORM public.recompute_property_aggregates(NEW.property_id);
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER reviews_aggregate_insert
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.reviews_aggregate_trigger();

CREATE TRIGGER reviews_aggregate_update
  AFTER UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.reviews_aggregate_trigger();

CREATE TRIGGER reviews_aggregate_delete
  AFTER DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.reviews_aggregate_trigger();

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX idx_reviews_property ON public.reviews (property_id);
CREATE INDEX idx_reviews_user ON public.reviews (user_id);
CREATE INDEX idx_reviews_status ON public.reviews (status);
CREATE INDEX idx_reviews_created_at ON public.reviews (created_at);

CREATE INDEX idx_property_aggregates_review_count ON public.property_aggregates (review_count);

CREATE INDEX idx_insights_status ON public.distilled_insights (status);
