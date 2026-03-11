-- Slice 04 seed: profiles, properties, reviews, property_aggregates, distilled_insights
-- For local dev: auth.users + auth.identities are populated so profile FKs resolve.
-- If your Supabase project disallows auth schema writes, create 3 users via Dashboard
-- and replace the UUIDs below with their ids, then run only the public schema inserts.

-- Fixed UUIDs for reproducibility (use in manual tests)
-- Profiles: public=11111111-..., verified=22222222-..., admin=33333333-...
-- Properties: prop_a=...a1, prop_b=...a2, prop_c=...a3, prop_d=...a4

-- =============================================================================
-- 1) auth.users (minimal rows for profile FK; skip if your env forbids)
-- =============================================================================
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'public@example.com',
    crypt('seedpassword', gen_salt('bf')),
    null,
    now(),
    now(),
    '{}',
    '{}'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'verified@example.com',
    crypt('seedpassword', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{}',
    '{}'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@example.com',
    crypt('seedpassword', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{}',
    '{}'
  )
ON CONFLICT (id) DO NOTHING;

-- auth.identities (required for Supabase Auth to recognize users; id = PK)
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  provider,
  identity_data,
  created_at,
  updated_at
) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'email',
    '{"sub":"11111111-1111-1111-1111-111111111111","email":"public@example.com"}'::jsonb,
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'email',
    '{"sub":"22222222-2222-2222-2222-222222222222","email":"verified@example.com"}'::jsonb,
    now(),
    now()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    'email',
    '{"sub":"33333333-3333-3333-3333-333333333333","email":"admin@example.com"}'::jsonb,
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2) profiles (public, verified, admin)
-- =============================================================================
INSERT INTO public.profiles (user_id, role, email_verified, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'public', false, now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'verified', true, now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'admin', true, now(), now())
ON CONFLICT (user_id) DO UPDATE
SET
  role = EXCLUDED.role,
  email_verified = EXCLUDED.email_verified,
  updated_at = now();

-- =============================================================================
-- 3) properties (4 rows: 2 active with reviews, 1 inactive, 1 active no reviews)
-- =============================================================================
INSERT INTO public.properties (
  id,
  display_name,
  address_line1,
  address_line2,
  city,
  province,
  postal_code,
  management_company,
  status,
  created_by,
  created_at,
  updated_at
) VALUES
  (
    'a0000001-0001-4000-8000-000000000001',
    'Sunrise Apartments',
    '100 Main St',
    NULL,
    'Toronto',
    'ON',
    'M5V 1A1',
    'Sunrise Mgmt',
    'active',
    NULL,
    now(),
    now()
  ),
  (
    'a0000002-0002-4000-8000-000000000002',
    'Downtown Lofts',
    '200 King St',
    'Suite 5',
    'Toronto',
    'ON',
    'M5H 1K1',
    NULL,
    'active',
    NULL,
    now(),
    now()
  ),
  (
    'a0000003-0003-4000-8000-000000000003',
    'Closed Building',
    '300 Queen St',
    NULL,
    'Toronto',
    'ON',
    'M5V 2A2',
    NULL,
    'inactive',
    NULL,
    now(),
    now()
  ),
  (
    'a0000004-0004-4000-8000-000000000004',
    'Riverside Towers',
    '400 River Rd',
    NULL,
    'Toronto',
    'ON',
    'M5V 3B3',
    'Riverside Co',
    'active',
    NULL,
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 4) reviews
-- Property A (a0000001): 2 approved reviews (different users -> aggregates non-zero)
-- Property B (a0000002): 1 pending review (must NOT affect aggregates)
-- Property C (a0000003): 0 reviews
-- Property D (a0000004): 0 reviews
-- =============================================================================
INSERT INTO public.reviews (
  id,
  property_id,
  user_id,
  status,
  management_responsiveness,
  maintenance_timeliness,
  listing_accuracy,
  fee_transparency,
  lease_clarity,
  text_input,
  tenancy_start,
  tenancy_end,
  created_at,
  updated_at
) VALUES
  -- Property A: approved review from user 11111111
  (
    'b0000001-0001-4000-8000-000000000001',
    'a0000001-0001-4000-8000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'approved',
    4,
    5,
    4,
    3,
    5,
    'Good management overall.',
    '2022-01-01',
    '2023-06-30',
    now(),
    now()
  ),
  -- Property A: second approved review from user 22222222
  (
    'b0000002-0002-4000-8000-000000000002',
    'a0000001-0001-4000-8000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    'approved',
    5,
    4,
    5,
    4,
    4,
    NULL,
    '2021-09-01',
    '2022-08-31',
    now(),
    now()
  ),
  -- Property B: pending review from user 33333333 (must not affect aggregates)
  (
    'b0000003-0003-4000-8000-000000000003',
    'a0000002-0002-4000-8000-000000000002',
    '33333333-3333-3333-3333-333333333333',
    'pending',
    3,
    3,
    4,
    3,
    3,
    'Pending moderation.',
    '2023-01-01',
    '2024-12-31',
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- property_aggregates for Property A are filled by trigger (2 approved reviews).
-- Property B has only pending -> no aggregate row from trigger.
-- Property C and D: no approved reviews -> no row unless we call recompute.
-- Call recompute for all 4 so every property has a row (0-count for C and D).
SELECT public.recompute_property_aggregates('a0000001-0001-4000-8000-000000000001');
SELECT public.recompute_property_aggregates('a0000002-0002-4000-8000-000000000002');
SELECT public.recompute_property_aggregates('a0000003-0003-4000-8000-000000000003');
SELECT public.recompute_property_aggregates('a0000004-0004-4000-8000-000000000004');

-- =============================================================================
-- 5) distilled_insights (one row, pending)
-- =============================================================================
INSERT INTO public.distilled_insights (
  property_id,
  insights_text,
  status,
  screened,
  screening_flags,
  last_generated_at,
  screened_at,
  updated_at
) VALUES (
  'a0000001-0001-4000-8000-000000000001',
  'Tenants report responsive management and accurate listings. Fee transparency could improve.',
  'pending',
  false,
  NULL,
  now(),
  NULL,
  now()
)
ON CONFLICT (property_id) DO NOTHING;
