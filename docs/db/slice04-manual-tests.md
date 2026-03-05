# Slice 04 — Manual acceptance tests

Run these in the Supabase SQL editor (or local `psql`) **after** applying the migration and seed. Use the same DB so seed UUIDs exist.

**Seed reference (from `supabase/seed.sql`):**
- Profiles: `11111111-1111-1111-1111-111111111111` (public), `22222222-...` (verified), `33333333-...` (admin)
- Properties: `a0000001-0001-4000-8000-000000000001` (prop A, 2 approved), `a0000002-...` (prop B, 1 pending), `a0000003-...` (prop C, inactive), `a0000004-...` (prop D, no reviews)

---

## 1. Schema applies

Apply the migration and seed, then confirm tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'properties', 'reviews', 'property_aggregates', 'distilled_insights', 'admin_audit_log', 'property_photos')
ORDER BY table_name;
```

Expected: 7 rows. No snippet needed to “prove” schema apply; migration runs without error.

---

## 2. Metric range (CHECK 0–5)

Insert a review with one metric set to 6; expect a CHECK constraint violation.

```sql
INSERT INTO public.reviews (
  property_id,
  user_id,
  status,
  management_responsiveness,
  maintenance_timeliness,
  listing_accuracy,
  fee_transparency,
  lease_clarity
) VALUES (
  'a0000004-0004-4000-8000-000000000004',
  '11111111-1111-1111-1111-111111111111',
  'pending',
  6,
  3,
  3,
  3,
  3
);
```

**Expected:** Error containing `reviews_management_responsiveness_check` or “violates check constraint” (metric must be between 0 and 5).

---

## 3. Uniqueness (one review per user per property)

Insert a second review for the same `(user_id, property_id)`; expect UNIQUE violation.

```sql
INSERT INTO public.reviews (
  property_id,
  user_id,
  status,
  management_responsiveness,
  maintenance_timeliness,
  listing_accuracy,
  fee_transparency,
  lease_clarity
) VALUES (
  'a0000001-0001-4000-8000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'pending',
  2,
  2,
  2,
  2,
  2
);
```

**Expected:** Error containing `reviews_unique_user_property` or “duplicate key value” (user already has a review for this property).

---

## 4. Rate limit (max 3 reviews per user per 6 months)

User `11111111` already has one review (property A). Insert three more reviews for that user on other properties so the 4th insert is rejected by the trigger.

```sql
-- 2nd review for user 11111111 (allowed)
INSERT INTO public.reviews (
  property_id,
  user_id,
  status,
  management_responsiveness,
  maintenance_timeliness,
  listing_accuracy,
  fee_transparency,
  lease_clarity
) VALUES (
  'a0000002-0002-4000-8000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  'pending',
  1, 1, 1, 1, 1
);

-- 3rd review for user 11111111 (allowed)
INSERT INTO public.reviews (
  property_id,
  user_id,
  status,
  management_responsiveness,
  maintenance_timeliness,
  listing_accuracy,
  fee_transparency,
  lease_clarity
) VALUES (
  'a0000003-0003-4000-8000-000000000003',
  '11111111-1111-1111-1111-111111111111',
  'pending',
  1, 1, 1, 1, 1
);

-- 4th review for user 11111111 (must fail)
INSERT INTO public.reviews (
  property_id,
  user_id,
  status,
  management_responsiveness,
  maintenance_timeliness,
  listing_accuracy,
  fee_transparency,
  lease_clarity
) VALUES (
  'a0000004-0004-4000-8000-000000000004',
  '11111111-1111-1111-1111-111111111111',
  'pending',
  1, 1, 1, 1, 1
);
```

**Expected:** The first two INSERTs succeed; the third (4th overall for this user) raises an exception such as: `Review limit reached: max 3 per 6 months`.

To re-run this test from a clean state, delete the two extra reviews for user `11111111` on properties `a0000002` and `a0000003` before running the snippet again.

---

## 5. Aggregates update (insert/update/delete approved review)

### 5a. Baseline: property D has 0 approved reviews

After seed, property D should have an aggregate row with `review_count = 0` and all `display_*_0_6 = 0`.

```sql
SELECT property_id, review_count,
       display_management_responsiveness_0_6,
       display_trustscore_0_6,
       last_updated
FROM public.property_aggregates
WHERE property_id = 'a0000004-0004-4000-8000-000000000004';
```

**Expected:** One row: `review_count = 0`, all display columns `0`, `last_updated` set.

### 5b. Insert approved review → aggregates and last_updated change

Use a user who does not yet have a review on property D (e.g. after seed, `22222222` has only property A). Insert an approved review for property D, then read aggregates.

```sql
INSERT INTO public.reviews (
  property_id,
  user_id,
  status,
  management_responsiveness,
  maintenance_timeliness,
  listing_accuracy,
  fee_transparency,
  lease_clarity
) VALUES (
  'a0000004-0004-4000-8000-000000000004',
  '22222222-2222-2222-2222-222222222222',
  'approved',
  5,
  5,
  5,
  5,
  5
);

SELECT property_id, review_count,
       avg_management_responsiveness,
       avg_trustscore,
       display_management_responsiveness_0_6,
       display_trustscore_0_6,
       last_updated
FROM public.property_aggregates
WHERE property_id = 'a0000004-0004-4000-8000-000000000004';
```

**Expected:** `review_count = 1`, averages = 5, `display_*_0_6 = 6` (round((5/5)*6) = 6), `last_updated` advanced.

### 5c. Update review status to approved → aggregates recompute

Add a second review as pending, then update it to approved and confirm aggregates.

```sql
-- Insert pending review (different user)
INSERT INTO public.reviews (
  property_id,
  user_id,
  status,
  management_responsiveness,
  maintenance_timeliness,
  listing_accuracy,
  fee_transparency,
  lease_clarity
) VALUES (
  'a0000004-0004-4000-8000-000000000004',
  '33333333-3333-3333-3333-333333333333',
  'pending',
  3,
  3,
  3,
  3,
  3
);

-- Update to approved
UPDATE public.reviews
SET status = 'approved'
WHERE property_id = 'a0000004-0004-4000-8000-000000000004'
  AND user_id = '33333333-3333-3333-3333-333333333333';

SELECT property_id, review_count,
       avg_management_responsiveness,
       display_management_responsiveness_0_6,
       last_updated
FROM public.property_aggregates
WHERE property_id = 'a0000004-0004-4000-8000-000000000004';
```

**Expected:** `review_count = 2`, averages between 3 and 5, display scores recomputed (e.g. avg 4 → display 5), `last_updated` advanced.

### 5d. Delete approved review → aggregates recompute (or zero)

Delete one approved review for property D and confirm aggregates update (or go back to 0 if none left).

```sql
DELETE FROM public.reviews
WHERE property_id = 'a0000004-0004-4000-8000-000000000004'
  AND user_id = '33333333-3333-3333-3333-333333333333';

SELECT property_id, review_count,
       display_management_responsiveness_0_6,
       display_trustscore_0_6,
       last_updated
FROM public.property_aggregates
WHERE property_id = 'a0000004-0004-4000-8000-000000000004';
```

**Expected:** `review_count = 1` again (only the first approved review left), display values and `last_updated` updated accordingly.

---

## Acceptance criteria checklist

- [ ] Schema applied without errors.
- [ ] Insert review with a metric outside 0..5 is rejected (Test 2).
- [ ] Second review for same (user_id, property_id) is rejected (Test 3).
- [ ] Fourth review in rolling 6 months for same user is rejected by trigger (Test 4).
- [ ] Insert/update/delete of approved review updates `property_aggregates` (review_count, display_*_0_6, last_updated) (Test 5).
