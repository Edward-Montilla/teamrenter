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
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
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
    '', '', '', '',
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
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
    '', '', '', '',
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
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
    '', '', '', '',
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
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

-- =============================================================================
-- Slice 50: Landlord auth user
-- =============================================================================
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmation_token, recovery_token,
  email_change_token_new, email_change,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'landlord@example.com',
  crypt('seedpassword', gen_salt('bf')),
  now(), '', '', '', '',
  now(), now(),
  '{"provider":"email","providers":["email"]}', '{}'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data, created_at, updated_at
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  '44444444-4444-4444-4444-444444444444',
  '44444444-4444-4444-4444-444444444444',
  'email',
  '{"sub":"44444444-4444-4444-4444-444444444444","email":"landlord@example.com"}'::jsonb,
  now(), now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (user_id, role, email_verified, created_at, updated_at)
VALUES ('44444444-4444-4444-4444-444444444444', 'landlord', true, now(), now())
ON CONFLICT (user_id) DO UPDATE SET role = 'landlord', email_verified = true, updated_at = now();

-- =============================================================================
-- Slice 50: Neighbourhoods
-- =============================================================================
INSERT INTO public.neighbourhoods (id, name, city, province, description, property_count, avg_trust_score)
VALUES
  ('cc000001-0001-4000-8000-000000000001', 'Downtown Core', 'Toronto', 'ON',
   'Central business district with high-density rentals.', 2, 4.25),
  ('cc000002-0002-4000-8000-000000000002', 'Midtown', 'Toronto', 'ON',
   'Mixed residential and commercial area.', 1, 3.50),
  ('cc000003-0003-4000-8000-000000000003', 'West End', 'Toronto', 'ON',
   'Family-friendly neighbourhood with parks.', 0, null),
  ('cc000004-0004-4000-8000-000000000004', 'Old Montreal', 'Montreal', 'QC',
   'Historic district with cobblestone streets.', 0, null)
ON CONFLICT (id) DO NOTHING;

-- Link properties to neighbourhoods
UPDATE public.properties SET neighbourhood_id = 'cc000001-0001-4000-8000-000000000001'
WHERE id = 'a0000001-0001-4000-8000-000000000001';

UPDATE public.properties SET neighbourhood_id = 'cc000001-0001-4000-8000-000000000001'
WHERE id = 'a0000002-0002-4000-8000-000000000002';

UPDATE public.properties SET neighbourhood_id = 'cc000002-0002-4000-8000-000000000002'
WHERE id = 'a0000004-0004-4000-8000-000000000004';

-- =============================================================================
-- Slice 50: Portfolio properties (landlord owns 2 properties)
-- =============================================================================
INSERT INTO public.portfolio_properties (id, user_id, property_id, added_at)
VALUES
  ('dd000001-0001-4000-8000-000000000001',
   '44444444-4444-4444-4444-444444444444',
   'a0000001-0001-4000-8000-000000000001', now()),
  ('dd000002-0002-4000-8000-000000000002',
   '44444444-4444-4444-4444-444444444444',
   'a0000004-0004-4000-8000-000000000004', now())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Slice 50: Team member (verified user is a viewer on landlord's team)
-- =============================================================================
INSERT INTO public.team_members (id, owner_user_id, member_user_id, role, invited_email, accepted_at)
VALUES (
  'ee000001-0001-4000-8000-000000000001',
  '44444444-4444-4444-4444-444444444444',
  '22222222-2222-2222-2222-222222222222',
  'viewer',
  'verified@example.com',
  now()
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Slice 50: Company profile
-- =============================================================================
INSERT INTO public.company_profiles (user_id, company_name, description, website_url, contact_email)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'Sunrise Property Group',
  'Professional property management serving the Greater Toronto Area since 2015.',
  'https://sunrise-properties.example.com',
  'contact@sunrise-properties.example.com'
)
ON CONFLICT (user_id) DO NOTHING;

-- =============================================================================
-- Slice 50: Benchmark averages
-- =============================================================================
INSERT INTO public.benchmark_averages (id, scope_type, scope_value, avg_management_responsiveness, avg_maintenance_timeliness, avg_listing_accuracy, avg_fee_transparency, avg_lease_clarity, avg_trust_score, property_count, review_count, computed_at)
VALUES
  ('ff000001-0001-4000-8000-000000000001', 'city', 'Toronto', 4.20, 3.80, 4.00, 3.50, 4.10, 3.92, 3, 2, now()),
  ('ff000002-0002-4000-8000-000000000002', 'neighbourhood', 'Downtown Core', 4.50, 4.25, 4.50, 3.50, 4.50, 4.25, 2, 2, now())
ON CONFLICT (scope_type, scope_value) DO NOTHING;

-- =============================================================================
-- Slice 50: Notification preferences
-- =============================================================================
INSERT INTO public.notification_preferences (user_id, new_review_alert, review_response_approved, weekly_summary, review_gap_alert, team_activity_alert)
VALUES ('44444444-4444-4444-4444-444444444444', true, true, true, true, true)
ON CONFLICT (user_id) DO NOTHING;

-- =============================================================================
-- Slice 50: Review response drafts (one approved, one pending)
-- =============================================================================
INSERT INTO public.review_response_drafts (id, review_id, author_user_id, body, status, reviewed_by, reviewed_at)
VALUES
  ('ab000001-0001-4000-8000-000000000001',
   'b0000001-0001-4000-8000-000000000001',
   '44444444-4444-4444-4444-444444444444',
   'Thank you for your feedback! We appreciate your kind words about our management team.',
   'approved',
   '33333333-3333-3333-3333-333333333333',
   now()),
  ('ab000002-0002-4000-8000-000000000002',
   'b0000002-0002-4000-8000-000000000002',
   '44444444-4444-4444-4444-444444444444',
   'We are working on improving fee transparency. Thank you for the review.',
   'pending',
   null, null)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Slice 50: User shortlists (verified user shortlists 2 properties)
-- =============================================================================
INSERT INTO public.user_shortlists (id, user_id, property_id)
VALUES
  ('ac000001-0001-4000-8000-000000000001',
   '22222222-2222-2222-2222-222222222222',
   'a0000001-0001-4000-8000-000000000001'),
  ('ac000002-0002-4000-8000-000000000002',
   '22222222-2222-2222-2222-222222222222',
   'a0000004-0004-4000-8000-000000000004')
ON CONFLICT (id) DO NOTHING;
