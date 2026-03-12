-- Refresh all test properties with diverse, realistic-ish dummy data.
-- Properties are spread across major Canadian cities to exercise multi-city
-- display paths.  Score distribution remains intentionally bell-shaped.

-- ─── properties ──────────────────────────────────────────────────────────────

UPDATE public.properties SET
  display_name       = 'Harbourview Commons',
  address_line1      = '150 Queens Quay E',
  address_line2      = NULL,
  city               = 'Toronto',
  province           = 'ON',
  postal_code        = 'M5A 1B6',
  management_company = 'Harbourview Living Inc.',
  status             = 'active',
  updated_at         = now()
WHERE id = 'c0000001-0001-4000-8000-000000000001';

UPDATE public.properties SET
  display_name       = 'Maple Court Residences',
  address_line1      = '55 Carlton St',
  address_line2      = NULL,
  city               = 'Toronto',
  province           = 'ON',
  postal_code        = 'M5B 2G3',
  management_company = 'Maple Court Management',
  status             = 'active',
  updated_at         = now()
WHERE id = 'c0000002-0002-4000-8000-000000000002';

UPDATE public.properties SET
  display_name       = 'Yaletown Heights',
  address_line1      = '1055 Richards St',
  address_line2      = NULL,
  city               = 'Vancouver',
  province           = 'BC',
  postal_code        = 'V6B 3E1',
  management_company = 'Pacific Rim Properties',
  status             = 'active',
  updated_at         = now()
WHERE id = 'c0000003-0003-4000-8000-000000000003';

UPDATE public.properties SET
  display_name       = 'Beltline Suites',
  address_line1      = '215 12 Ave SW',
  address_line2      = NULL,
  city               = 'Calgary',
  province           = 'AB',
  postal_code        = 'T2R 0G5',
  management_company = 'Bow River Residential',
  status             = 'active',
  updated_at         = now()
WHERE id = 'c0000004-0004-4000-8000-000000000004';

UPDATE public.properties SET
  display_name       = 'Midwood Place',
  address_line1      = '450 Eglinton Ave W',
  address_line2      = NULL,
  city               = 'Toronto',
  province           = 'ON',
  postal_code        = 'M5N 1A7',
  management_company = 'Willow Property Group',
  status             = 'active',
  updated_at         = now()
WHERE id = 'c0000005-0005-4000-8000-000000000005';

UPDATE public.properties SET
  display_name       = 'Le Plateau Residences',
  address_line1      = '3535 Boul. Saint-Laurent',
  address_line2      = NULL,
  city               = 'Montréal',
  province           = 'QC',
  postal_code        = 'H2X 2V2',
  management_company = 'Groupe Immobilier Montréal',
  status             = 'active',
  updated_at         = now()
WHERE id = 'c0000006-0006-4000-8000-000000000006';

UPDATE public.properties SET
  display_name       = 'River Valley Terrace',
  address_line1      = '10150 Jasper Ave NW',
  address_line2      = 'Suite 300',
  city               = 'Edmonton',
  province           = 'AB',
  postal_code        = 'T5J 1W7',
  management_company = 'Capital City Housing',
  status             = 'active',
  updated_at         = now()
WHERE id = 'c0000007-0007-4000-8000-000000000007';

UPDATE public.properties SET
  display_name       = 'Stadium District Flats',
  address_line1      = '888 Hamilton St',
  address_line2      = NULL,
  city               = 'Vancouver',
  province           = 'BC',
  postal_code        = 'V6B 2R6',
  management_company = 'Metro Pacific Living',
  status             = 'active',
  updated_at         = now()
WHERE id = 'c0000008-0008-4000-8000-000000000008';

UPDATE public.properties SET
  display_name       = 'ByWard Commons',
  address_line1      = '340 Queen St',
  address_line2      = NULL,
  city               = 'Ottawa',
  province           = 'ON',
  postal_code        = 'K1R 7T4',
  management_company = 'National Capital Realty',
  status             = 'active',
  updated_at         = now()
WHERE id = 'c0000009-0009-4000-8000-000000000009';

UPDATE public.properties SET
  display_name       = 'Downtown Core Residences',
  address_line1      = '525 8 Ave SW',
  address_line2      = NULL,
  city               = 'Calgary',
  province           = 'AB',
  postal_code        = 'T2P 1G1',
  management_company = 'Summit Property Group',
  status             = 'active',
  updated_at         = now()
WHERE id = 'c0000010-0010-4000-8000-000000000010';

-- ─── property_aggregates ─────────────────────────────────────────────────────
-- Bell-shaped distribution: properties 01–02 are weak, 03–06 are mid-range,
-- 07–08 are solid, 09–10 are top-tier.
-- avg_* values are on the 0..5 review scale; display_*_0_5 are rounded integers.

UPDATE public.property_aggregates SET
  review_count                          = 4,
  avg_management_responsiveness         = 2.0,
  avg_maintenance_timeliness            = 1.5,
  avg_listing_accuracy                  = 2.5,
  avg_fee_transparency                  = 1.5,
  avg_lease_clarity                     = 2.0,
  avg_trustscore                        = 1.9,
  display_management_responsiveness_0_5 = 2,
  display_maintenance_timeliness_0_5    = 2,
  display_listing_accuracy_0_5          = 3,
  display_fee_transparency_0_5          = 2,
  display_lease_clarity_0_5             = 2,
  display_trustscore_0_5                = 2,
  last_updated                          = now()
WHERE property_id = 'c0000001-0001-4000-8000-000000000001';

UPDATE public.property_aggregates SET
  review_count                          = 5,
  avg_management_responsiveness         = 2.5,
  avg_maintenance_timeliness            = 2.5,
  avg_listing_accuracy                  = 3.0,
  avg_fee_transparency                  = 2.0,
  avg_lease_clarity                     = 2.5,
  avg_trustscore                        = 2.5,
  display_management_responsiveness_0_5 = 3,
  display_maintenance_timeliness_0_5    = 3,
  display_listing_accuracy_0_5          = 3,
  display_fee_transparency_0_5          = 2,
  display_lease_clarity_0_5             = 3,
  display_trustscore_0_5                = 3,
  last_updated                          = now()
WHERE property_id = 'c0000002-0002-4000-8000-000000000002';

UPDATE public.property_aggregates SET
  review_count                          = 6,
  avg_management_responsiveness         = 3.0,
  avg_maintenance_timeliness            = 3.0,
  avg_listing_accuracy                  = 3.0,
  avg_fee_transparency                  = 3.0,
  avg_lease_clarity                     = 3.0,
  avg_trustscore                        = 3.0,
  display_management_responsiveness_0_5 = 3,
  display_maintenance_timeliness_0_5    = 3,
  display_listing_accuracy_0_5          = 3,
  display_fee_transparency_0_5          = 3,
  display_lease_clarity_0_5             = 3,
  display_trustscore_0_5                = 3,
  last_updated                          = now()
WHERE property_id = 'c0000003-0003-4000-8000-000000000003';

UPDATE public.property_aggregates SET
  review_count                          = 7,
  avg_management_responsiveness         = 3.5,
  avg_maintenance_timeliness            = 3.0,
  avg_listing_accuracy                  = 3.5,
  avg_fee_transparency                  = 3.5,
  avg_lease_clarity                     = 3.0,
  avg_trustscore                        = 3.3,
  display_management_responsiveness_0_5 = 4,
  display_maintenance_timeliness_0_5    = 3,
  display_listing_accuracy_0_5          = 4,
  display_fee_transparency_0_5          = 4,
  display_lease_clarity_0_5             = 3,
  display_trustscore_0_5                = 3,
  last_updated                          = now()
WHERE property_id = 'c0000004-0004-4000-8000-000000000004';

UPDATE public.property_aggregates SET
  review_count                          = 8,
  avg_management_responsiveness         = 3.5,
  avg_maintenance_timeliness            = 3.5,
  avg_listing_accuracy                  = 3.5,
  avg_fee_transparency                  = 3.5,
  avg_lease_clarity                     = 3.5,
  avg_trustscore                        = 3.5,
  display_management_responsiveness_0_5 = 4,
  display_maintenance_timeliness_0_5    = 4,
  display_listing_accuracy_0_5          = 4,
  display_fee_transparency_0_5          = 4,
  display_lease_clarity_0_5             = 4,
  display_trustscore_0_5                = 4,
  last_updated                          = now()
WHERE property_id = 'c0000005-0005-4000-8000-000000000005';

UPDATE public.property_aggregates SET
  review_count                          = 9,
  avg_management_responsiveness         = 3.5,
  avg_maintenance_timeliness            = 4.0,
  avg_listing_accuracy                  = 3.5,
  avg_fee_transparency                  = 3.5,
  avg_lease_clarity                     = 3.5,
  avg_trustscore                        = 3.6,
  display_management_responsiveness_0_5 = 4,
  display_maintenance_timeliness_0_5    = 4,
  display_listing_accuracy_0_5          = 4,
  display_fee_transparency_0_5          = 4,
  display_lease_clarity_0_5             = 4,
  display_trustscore_0_5                = 4,
  last_updated                          = now()
WHERE property_id = 'c0000006-0006-4000-8000-000000000006';

UPDATE public.property_aggregates SET
  review_count                          = 8,
  avg_management_responsiveness         = 4.0,
  avg_maintenance_timeliness            = 3.5,
  avg_listing_accuracy                  = 4.0,
  avg_fee_transparency                  = 4.0,
  avg_lease_clarity                     = 4.0,
  avg_trustscore                        = 3.9,
  display_management_responsiveness_0_5 = 4,
  display_maintenance_timeliness_0_5    = 4,
  display_listing_accuracy_0_5          = 4,
  display_fee_transparency_0_5          = 4,
  display_lease_clarity_0_5             = 4,
  display_trustscore_0_5                = 4,
  last_updated                          = now()
WHERE property_id = 'c0000007-0007-4000-8000-000000000007';

UPDATE public.property_aggregates SET
  review_count                          = 7,
  avg_management_responsiveness         = 4.0,
  avg_maintenance_timeliness            = 4.0,
  avg_listing_accuracy                  = 4.5,
  avg_fee_transparency                  = 4.0,
  avg_lease_clarity                     = 4.0,
  avg_trustscore                        = 4.1,
  display_management_responsiveness_0_5 = 4,
  display_maintenance_timeliness_0_5    = 4,
  display_listing_accuracy_0_5          = 5,
  display_fee_transparency_0_5          = 4,
  display_lease_clarity_0_5             = 4,
  display_trustscore_0_5                = 4,
  last_updated                          = now()
WHERE property_id = 'c0000008-0008-4000-8000-000000000008';

UPDATE public.property_aggregates SET
  review_count                          = 6,
  avg_management_responsiveness         = 4.5,
  avg_maintenance_timeliness            = 4.5,
  avg_listing_accuracy                  = 4.5,
  avg_fee_transparency                  = 4.0,
  avg_lease_clarity                     = 4.5,
  avg_trustscore                        = 4.4,
  display_management_responsiveness_0_5 = 5,
  display_maintenance_timeliness_0_5    = 5,
  display_listing_accuracy_0_5          = 5,
  display_fee_transparency_0_5          = 4,
  display_lease_clarity_0_5             = 5,
  display_trustscore_0_5                = 4,
  last_updated                          = now()
WHERE property_id = 'c0000009-0009-4000-8000-000000000009';

UPDATE public.property_aggregates SET
  review_count                          = 5,
  avg_management_responsiveness         = 5.0,
  avg_maintenance_timeliness            = 4.5,
  avg_listing_accuracy                  = 5.0,
  avg_fee_transparency                  = 4.5,
  avg_lease_clarity                     = 5.0,
  avg_trustscore                        = 4.8,
  display_management_responsiveness_0_5 = 5,
  display_maintenance_timeliness_0_5    = 5,
  display_listing_accuracy_0_5          = 5,
  display_fee_transparency_0_5          = 5,
  display_lease_clarity_0_5             = 5,
  display_trustscore_0_5                = 5,
  last_updated                          = now()
WHERE property_id = 'c0000010-0010-4000-8000-000000000010';

-- ─── distilled_insights ──────────────────────────────────────────────────────

UPDATE public.distilled_insights SET
  insights_text    = 'Tenants appreciate the waterfront location but frequently flag slow maintenance response times and surprise charges that were not disclosed upfront. Fee transparency is a recurring concern.',
  status           = 'approved',
  screened         = true,
  screening_flags  = NULL,
  last_generated_at = now(),
  screened_at      = now(),
  updated_at       = now()
WHERE property_id = 'c0000001-0001-4000-8000-000000000001';

UPDATE public.distilled_insights SET
  insights_text    = 'Reviews describe this building as functional but uninspiring. Day-to-day management is predictable, though several tenants noted difficulty getting timely responses for non-urgent requests.',
  status           = 'approved',
  screened         = true,
  screening_flags  = NULL,
  last_generated_at = now(),
  screened_at      = now(),
  updated_at       = now()
WHERE property_id = 'c0000002-0002-4000-8000-000000000002';

UPDATE public.distilled_insights SET
  insights_text    = 'Tenants find Yaletown Heights a solid mid-range option. Maintenance is handled within a reasonable window and the listing details generally match what renters find on move-in.',
  status           = 'approved',
  screened         = true,
  screening_flags  = NULL,
  last_generated_at = now(),
  screened_at      = now(),
  updated_at       = now()
WHERE property_id = 'c0000003-0003-4000-8000-000000000003';

UPDATE public.distilled_insights SET
  insights_text    = 'Beltline Suites scores above average on listing accuracy and fee transparency. A few renters mention that maintenance timeliness could improve for issues reported in winter months.',
  status           = 'approved',
  screened         = true,
  screening_flags  = NULL,
  last_generated_at = now(),
  screened_at      = now(),
  updated_at       = now()
WHERE property_id = 'c0000004-0004-4000-8000-000000000004';

UPDATE public.distilled_insights SET
  insights_text    = 'Midwood Place earns consistently balanced marks across all categories. Tenants highlight clear lease terms and reliable management communication as standout positives.',
  status           = 'approved',
  screened         = true,
  screening_flags  = NULL,
  last_generated_at = now(),
  screened_at      = now(),
  updated_at       = now()
WHERE property_id = 'c0000005-0005-4000-8000-000000000005';

UPDATE public.distilled_insights SET
  insights_text    = 'Le Plateau Residences receives strong marks for maintenance timeliness. Renters appreciate the well-kept common areas and responsive property staff, though some note minor billing ambiguities.',
  status           = 'approved',
  screened         = true,
  screening_flags  = NULL,
  last_generated_at = now(),
  screened_at      = now(),
  updated_at       = now()
WHERE property_id = 'c0000006-0006-4000-8000-000000000006';

UPDATE public.distilled_insights SET
  insights_text    = 'River Valley Terrace is rated as a strong performer. Management responsiveness and transparent fee structures are highlighted across multiple reviews, with only occasional dips in maintenance speed.',
  status           = 'approved',
  screened         = true,
  screening_flags  = NULL,
  last_generated_at = now(),
  screened_at      = now(),
  updated_at       = now()
WHERE property_id = 'c0000007-0007-4000-8000-000000000007';

UPDATE public.distilled_insights SET
  insights_text    = 'Stadium District Flats earns top marks for listing accuracy — renters consistently report that units look exactly as advertised. Management is professional and proactive about building updates.',
  status           = 'approved',
  screened         = true,
  screening_flags  = NULL,
  last_generated_at = now(),
  screened_at      = now(),
  updated_at       = now()
WHERE property_id = 'c0000008-0008-4000-8000-000000000008';

UPDATE public.distilled_insights SET
  insights_text    = 'ByWard Commons is one of the highest-rated properties in the set. Tenants praise fast maintenance turnaround, crystal-clear lease terms, and consistent communication from management.',
  status           = 'approved',
  screened         = true,
  screening_flags  = NULL,
  last_generated_at = now(),
  screened_at      = now(),
  updated_at       = now()
WHERE property_id = 'c0000009-0009-4000-8000-000000000009';

UPDATE public.distilled_insights SET
  insights_text    = 'Downtown Core Residences is the standout property in the test set. Reviewers are unusually positive across every dimension, citing a seamless rental experience from application through lease renewal.',
  status           = 'approved',
  screened         = true,
  screening_flags  = NULL,
  last_generated_at = now(),
  screened_at      = now(),
  updated_at       = now()
WHERE property_id = 'c0000010-0010-4000-8000-000000000010';
