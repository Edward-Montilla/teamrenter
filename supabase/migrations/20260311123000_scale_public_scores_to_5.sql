-- Convert public property aggregate display scores from a 0..6 scale to 0..5.
-- This keeps the review input scale and public display scale aligned.

ALTER TABLE public.property_aggregates
  DROP CONSTRAINT IF EXISTS property_aggregates_display_management_responsiveness_0_6_check,
  DROP CONSTRAINT IF EXISTS property_aggregates_display_maintenance_timeliness_0_6_check,
  DROP CONSTRAINT IF EXISTS property_aggregates_display_listing_accuracy_0_6_check,
  DROP CONSTRAINT IF EXISTS property_aggregates_display_fee_transparency_0_6_check,
  DROP CONSTRAINT IF EXISTS property_aggregates_display_lease_clarity_0_6_check,
  DROP CONSTRAINT IF EXISTS property_aggregates_display_trustscore_0_6_check;

ALTER TABLE public.property_aggregates
  RENAME COLUMN display_management_responsiveness_0_6 TO display_management_responsiveness_0_5;

ALTER TABLE public.property_aggregates
  RENAME COLUMN display_maintenance_timeliness_0_6 TO display_maintenance_timeliness_0_5;

ALTER TABLE public.property_aggregates
  RENAME COLUMN display_listing_accuracy_0_6 TO display_listing_accuracy_0_5;

ALTER TABLE public.property_aggregates
  RENAME COLUMN display_fee_transparency_0_6 TO display_fee_transparency_0_5;

ALTER TABLE public.property_aggregates
  RENAME COLUMN display_lease_clarity_0_6 TO display_lease_clarity_0_5;

ALTER TABLE public.property_aggregates
  RENAME COLUMN display_trustscore_0_6 TO display_trustscore_0_5;

UPDATE public.property_aggregates
SET
  display_management_responsiveness_0_5 = LEAST(5, display_management_responsiveness_0_5),
  display_maintenance_timeliness_0_5 = LEAST(5, display_maintenance_timeliness_0_5),
  display_listing_accuracy_0_5 = LEAST(5, display_listing_accuracy_0_5),
  display_fee_transparency_0_5 = LEAST(5, display_fee_transparency_0_5),
  display_lease_clarity_0_5 = LEAST(5, display_lease_clarity_0_5),
  display_trustscore_0_5 = LEAST(5, display_trustscore_0_5);

ALTER TABLE public.property_aggregates
  ADD CONSTRAINT property_aggregates_display_management_responsiveness_0_5_check CHECK (display_management_responsiveness_0_5 >= 0 AND display_management_responsiveness_0_5 <= 5),
  ADD CONSTRAINT property_aggregates_display_maintenance_timeliness_0_5_check CHECK (display_maintenance_timeliness_0_5 >= 0 AND display_maintenance_timeliness_0_5 <= 5),
  ADD CONSTRAINT property_aggregates_display_listing_accuracy_0_5_check CHECK (display_listing_accuracy_0_5 >= 0 AND display_listing_accuracy_0_5 <= 5),
  ADD CONSTRAINT property_aggregates_display_fee_transparency_0_5_check CHECK (display_fee_transparency_0_5 >= 0 AND display_fee_transparency_0_5 <= 5),
  ADD CONSTRAINT property_aggregates_display_lease_clarity_0_5_check CHECK (display_lease_clarity_0_5 >= 0 AND display_lease_clarity_0_5 <= 5),
  ADD CONSTRAINT property_aggregates_display_trustscore_0_5_check CHECK (display_trustscore_0_5 >= 0 AND display_trustscore_0_5 <= 5);

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

  IF v_review_count > 0 AND v_avg_mgmt IS NOT NULL THEN
    v_avg_trust := (
      coalesce(v_avg_mgmt, 0) +
      coalesce(v_avg_maint, 0) +
      coalesce(v_avg_list, 0) +
      coalesce(v_avg_fee, 0) +
      coalesce(v_avg_lease, 0)
    ) / 5.0;
  ELSE
    v_avg_trust := NULL;
    v_review_count := 0;
  END IF;

  -- display_*_0_5: 0 when no reviews or null avg; otherwise round the 0..5 average
  -- to the nearest integer and clamp to the same 0..5 display scale.
  IF v_review_count = 0 OR v_avg_mgmt IS NULL THEN
    v_d_mgmt := 0;
    v_d_maint := 0;
    v_d_list := 0;
    v_d_fee := 0;
    v_d_lease := 0;
    v_d_trust := 0;
  ELSE
    v_d_mgmt := LEAST(5, GREATEST(0, round(v_avg_mgmt)::int));
    v_d_maint := LEAST(5, GREATEST(0, round(v_avg_maint)::int));
    v_d_list := LEAST(5, GREATEST(0, round(v_avg_list)::int));
    v_d_fee := LEAST(5, GREATEST(0, round(v_avg_fee)::int));
    v_d_lease := LEAST(5, GREATEST(0, round(v_avg_lease)::int));
    v_d_trust := LEAST(5, GREATEST(0, round(v_avg_trust)::int));
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
    display_management_responsiveness_0_5,
    display_maintenance_timeliness_0_5,
    display_listing_accuracy_0_5,
    display_fee_transparency_0_5,
    display_lease_clarity_0_5,
    display_trustscore_0_5,
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
    display_management_responsiveness_0_5 = EXCLUDED.display_management_responsiveness_0_5,
    display_maintenance_timeliness_0_5 = EXCLUDED.display_maintenance_timeliness_0_5,
    display_listing_accuracy_0_5 = EXCLUDED.display_listing_accuracy_0_5,
    display_fee_transparency_0_5 = EXCLUDED.display_fee_transparency_0_5,
    display_lease_clarity_0_5 = EXCLUDED.display_lease_clarity_0_5,
    display_trustscore_0_5 = EXCLUDED.display_trustscore_0_5,
    last_updated = now();
END;
$$;

DO $$
DECLARE
  p record;
BEGIN
  FOR p IN SELECT id FROM public.properties LOOP
    PERFORM public.recompute_property_aggregates(p.id);
  END LOOP;
END;
$$;
