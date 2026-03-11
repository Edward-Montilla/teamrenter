-- Allow review ratings to be stored in 0.5 increments so the submit flow can
-- use Amazon-style half-star inputs while keeping the 0..5 scale intact.

ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_management_responsiveness_check,
  DROP CONSTRAINT IF EXISTS reviews_maintenance_timeliness_check,
  DROP CONSTRAINT IF EXISTS reviews_listing_accuracy_check,
  DROP CONSTRAINT IF EXISTS reviews_fee_transparency_check,
  DROP CONSTRAINT IF EXISTS reviews_lease_clarity_check;

ALTER TABLE public.reviews
  ALTER COLUMN management_responsiveness TYPE numeric(2,1) USING management_responsiveness::numeric(2,1),
  ALTER COLUMN maintenance_timeliness TYPE numeric(2,1) USING maintenance_timeliness::numeric(2,1),
  ALTER COLUMN listing_accuracy TYPE numeric(2,1) USING listing_accuracy::numeric(2,1),
  ALTER COLUMN fee_transparency TYPE numeric(2,1) USING fee_transparency::numeric(2,1),
  ALTER COLUMN lease_clarity TYPE numeric(2,1) USING lease_clarity::numeric(2,1);

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_management_responsiveness_check CHECK (
    management_responsiveness >= 0
    AND management_responsiveness <= 5
    AND management_responsiveness * 2 = trunc(management_responsiveness * 2)
  ),
  ADD CONSTRAINT reviews_maintenance_timeliness_check CHECK (
    maintenance_timeliness >= 0
    AND maintenance_timeliness <= 5
    AND maintenance_timeliness * 2 = trunc(maintenance_timeliness * 2)
  ),
  ADD CONSTRAINT reviews_listing_accuracy_check CHECK (
    listing_accuracy >= 0
    AND listing_accuracy <= 5
    AND listing_accuracy * 2 = trunc(listing_accuracy * 2)
  ),
  ADD CONSTRAINT reviews_fee_transparency_check CHECK (
    fee_transparency >= 0
    AND fee_transparency <= 5
    AND fee_transparency * 2 = trunc(fee_transparency * 2)
  ),
  ADD CONSTRAINT reviews_lease_clarity_check CHECK (
    lease_clarity >= 0
    AND lease_clarity <= 5
    AND lease_clarity * 2 = trunc(lease_clarity * 2)
  );
