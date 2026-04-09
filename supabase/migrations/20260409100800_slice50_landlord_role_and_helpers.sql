-- Slice 50 Phase 3: landlord role, helper functions, and views

-- 1. Expand profiles role constraint to include 'landlord'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('public', 'verified', 'admin', 'landlord'));

-- 2. is_landlord() helper
CREATE OR REPLACE FUNCTION public.is_landlord()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = 'landlord'
  );
$$;

-- 3. is_portfolio_member(property_uuid) helper
CREATE OR REPLACE FUNCTION public.is_portfolio_member(p_property_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.portfolio_properties pp
    WHERE pp.property_id = p_property_id
      AND (
        pp.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.team_members tm
          WHERE tm.owner_user_id = pp.user_id
            AND tm.member_user_id = auth.uid()
            AND tm.accepted_at IS NOT NULL
        )
      )
  );
$$;

-- 4. recompute_neighbourhood_aggregates(neighbourhood_uuid)
CREATE OR REPLACE FUNCTION public.recompute_neighbourhood_aggregates(p_neighbourhood_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_count integer;
  v_avg_trust numeric(3,2);
BEGIN
  SELECT
    count(*)::integer,
    CASE WHEN count(*) > 0
      THEN round(avg(pa.avg_trustscore)::numeric, 2)
      ELSE NULL
    END
  INTO v_count, v_avg_trust
  FROM public.properties p
  JOIN public.property_aggregates pa ON pa.property_id = p.id
  WHERE p.neighbourhood_id = p_neighbourhood_id
    AND p.status = 'active'
    AND pa.review_count > 0;

  UPDATE public.neighbourhoods
  SET
    property_count = (
      SELECT count(*)::integer
      FROM public.properties
      WHERE neighbourhood_id = p_neighbourhood_id AND status = 'active'
    ),
    avg_trust_score = v_avg_trust,
    updated_at = now()
  WHERE id = p_neighbourhood_id;
END;
$$;

-- 5. recompute_benchmark_averages(p_scope_type, p_scope_value)
CREATE OR REPLACE FUNCTION public.recompute_benchmark_averages(
  p_scope_type text,
  p_scope_value text
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_avg_mgmt numeric(3,2);
  v_avg_maint numeric(3,2);
  v_avg_list numeric(3,2);
  v_avg_fee numeric(3,2);
  v_avg_lease numeric(3,2);
  v_avg_trust numeric(3,2);
  v_prop_count integer;
  v_review_count integer;
BEGIN
  IF p_scope_type = 'city' THEN
    SELECT
      round(avg(pa.avg_management_responsiveness)::numeric, 2),
      round(avg(pa.avg_maintenance_timeliness)::numeric, 2),
      round(avg(pa.avg_listing_accuracy)::numeric, 2),
      round(avg(pa.avg_fee_transparency)::numeric, 2),
      round(avg(pa.avg_lease_clarity)::numeric, 2),
      round(avg(pa.avg_trustscore)::numeric, 2),
      count(DISTINCT p.id)::integer,
      coalesce(sum(pa.review_count), 0)::integer
    INTO v_avg_mgmt, v_avg_maint, v_avg_list, v_avg_fee, v_avg_lease,
         v_avg_trust, v_prop_count, v_review_count
    FROM public.properties p
    JOIN public.property_aggregates pa ON pa.property_id = p.id
    WHERE p.city = p_scope_value AND p.status = 'active' AND pa.review_count > 0;
  ELSIF p_scope_type = 'neighbourhood' THEN
    SELECT
      round(avg(pa.avg_management_responsiveness)::numeric, 2),
      round(avg(pa.avg_maintenance_timeliness)::numeric, 2),
      round(avg(pa.avg_listing_accuracy)::numeric, 2),
      round(avg(pa.avg_fee_transparency)::numeric, 2),
      round(avg(pa.avg_lease_clarity)::numeric, 2),
      round(avg(pa.avg_trustscore)::numeric, 2),
      count(DISTINCT p.id)::integer,
      coalesce(sum(pa.review_count), 0)::integer
    INTO v_avg_mgmt, v_avg_maint, v_avg_list, v_avg_fee, v_avg_lease,
         v_avg_trust, v_prop_count, v_review_count
    FROM public.properties p
    JOIN public.property_aggregates pa ON pa.property_id = p.id
    JOIN public.neighbourhoods n ON n.id = p.neighbourhood_id
    WHERE n.name = p_scope_value AND p.status = 'active' AND pa.review_count > 0;
  END IF;

  INSERT INTO public.benchmark_averages (
    scope_type, scope_value,
    avg_management_responsiveness, avg_maintenance_timeliness,
    avg_listing_accuracy, avg_fee_transparency, avg_lease_clarity,
    avg_trust_score, property_count, review_count, computed_at
  ) VALUES (
    p_scope_type, p_scope_value,
    v_avg_mgmt, v_avg_maint, v_avg_list, v_avg_fee, v_avg_lease,
    v_avg_trust, coalesce(v_prop_count, 0), coalesce(v_review_count, 0), now()
  )
  ON CONFLICT (scope_type, scope_value) DO UPDATE SET
    avg_management_responsiveness = EXCLUDED.avg_management_responsiveness,
    avg_maintenance_timeliness = EXCLUDED.avg_maintenance_timeliness,
    avg_listing_accuracy = EXCLUDED.avg_listing_accuracy,
    avg_fee_transparency = EXCLUDED.avg_fee_transparency,
    avg_lease_clarity = EXCLUDED.avg_lease_clarity,
    avg_trust_score = EXCLUDED.avg_trust_score,
    property_count = EXCLUDED.property_count,
    review_count = EXCLUDED.review_count,
    computed_at = now();
END;
$$;

-- 6. Views

-- v_portfolio_overview: portfolio + properties + aggregates
CREATE OR REPLACE VIEW public.v_portfolio_overview AS
SELECT
  pp.user_id AS landlord_user_id,
  pp.property_id,
  p.display_name,
  p.address_line1,
  p.city,
  p.province,
  p.status AS property_status,
  coalesce(pa.review_count, 0) AS review_count,
  pa.display_trustscore_0_5,
  pa.avg_trustscore,
  pp.added_at
FROM public.portfolio_properties pp
JOIN public.properties p ON p.id = pp.property_id
LEFT JOIN public.property_aggregates pa ON pa.property_id = p.id;

-- v_neighbourhood_browse: neighbourhoods with counts and scores
CREATE OR REPLACE VIEW public.v_neighbourhood_browse AS
SELECT
  n.id,
  n.name,
  n.city,
  n.province,
  n.description,
  n.property_count,
  n.avg_trust_score,
  n.created_at
FROM public.neighbourhoods n;

-- v_review_with_response: reviews joined to approved response drafts
CREATE OR REPLACE VIEW public.v_review_with_response AS
SELECT
  r.id AS review_id,
  r.property_id,
  r.user_id AS reviewer_user_id,
  r.status AS review_status,
  r.management_responsiveness,
  r.maintenance_timeliness,
  r.listing_accuracy,
  r.fee_transparency,
  r.lease_clarity,
  r.created_at AS review_created_at,
  rrd.id AS response_id,
  rrd.body AS response_body,
  rrd.author_user_id AS response_author_id,
  rrd.created_at AS response_created_at
FROM public.reviews r
LEFT JOIN public.review_response_drafts rrd
  ON rrd.review_id = r.id AND rrd.status = 'approved';
