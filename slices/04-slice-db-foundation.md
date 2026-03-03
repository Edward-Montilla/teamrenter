# Slice 04 — Supabase DB Foundation (Schema + Constraints + Aggregates)

## Goal (demo in 1–3 minutes)
Supabase project has schema applied; inserting/updating/deleting approved reviews updates property_aggregates; invalid inserts are rejected by constraints and triggers.

## User story
As the system, I need a single source of truth with enforced rules and fast public reads via precomputed aggregates.

## Screens
- None (backend slice).

## Frontend tasks
- None for this slice (optional: minimal admin dev page to sanity-check data later).

## DB tasks (Supabase)
- Apply schema for:
  - **profiles**: user_id (PK, FK auth.users), role ('public'|'verified'|'admin'), email_verified, created_at, updated_at.
  - **properties**: id, display_name, address_line1, address_line2, city, province, postal_code, management_company, status ('active'|'inactive'), created_by (FK profiles), created_at, updated_at.
  - **reviews**: id, property_id, user_id, status ('pending'|'approved'|'rejected'|'removed'), five metric columns (smallint 0..5), text_input (nullable, length cap), tenancy_start, tenancy_end, created_at, updated_at; UNIQUE(user_id, property_id); CHECK(tenancy_start <= tenancy_end when both set).
  - **property_aggregates**: property_id (PK), review_count, avg_* (numeric 0..5), display_*_0_6 (smallint 0..6), last_updated.
  - **distilled_insights**: property_id (PK), insights_text, status ('pending'|'approved'|'rejected'|'hidden'), screened, screening_flags (jsonb), last_generated_at, screened_at, updated_at.
  - **admin_audit_log**: id, admin_user_id, action_type, target_type, target_id, details (jsonb), created_at.
  - Optional: **property_photos** (id, property_id, r2_bucket, r2_key, content_type, bytes, width, height, uploaded_by, created_at; UQ r2_bucket+r2_key).
  - Optional: **content_reports**, **moderation_events** per Schema & ERD.
- Add constraints:
  - Rating range checks: each metric 0..5 on reviews.
  - text_input: CHECK(char_length(text_input) <= 500) or equivalent.
  - tenancy_order: tenancy_start <= tenancy_end when both non-null.
- Add trigger/function:
  - **enforce_review_rate_limit**: BEFORE INSERT on reviews; count user's reviews where created_at >= now() - interval '6 months'; RAISE if count >= 3.
  - **recompute_property_aggregates(property_id)**: from approved reviews compute review_count, per-metric averages, avg_trustscore; set display_*_0_6 = round((avg/5)*6), or 0 when review_count = 0; UPSERT property_aggregates.
  - Trigger on reviews INSERT/UPDATE/DELETE (and status changes) to call recompute_property_aggregates for affected property_id.
- Ensure display 0–6 mapping and zero-floor (review_count = 0 => all display 0) in recompute function.
- Minimal seed strategy: a few profiles (including admin), active/inactive properties, optional approved/pending reviews so aggregates and "no data" states are testable.

## Integration tasks
- Deferred (RLS in Slice 05; app wiring in 06–07).

## Data contracts (documentation only; no code files)
- Document table columns and computed rules in this slice doc or in migration comments.
- property_aggregates columns must match PropertyAggregatePublic shape used in Slices 01–02.

## RLS/Constraints notes
- RLS policies are defined in Slice 05; this slice focuses on schema and trigger integrity only.
- All critical business rules (one review per user per property, 3 per 6 months, 0..5 metrics, tenancy order) must be enforced by DB.

## Acceptance criteria checklist
- [ ] Schema applied without errors (`DATA-01`–`DATA-06`, `DATA-IC-01`–`04`)
- [ ] Insert review with metric outside 0..5 is rejected (`TST-01`, `DATA-IC-02`)
- [ ] Second review same user+property is rejected (unique constraint) (`TST-02`, `DATA-IC-01`)
- [ ] Fourth review within rolling 6 months for same user is rejected by trigger (`TST-03`, `DATA-IC-03`)
- [ ] After approved review insert/update/delete, property_aggregates row is updated with correct review_count and display_*_0_6 (`AGG-01`, `AGG-02`, `AGG-04`, `AGG-06`, `TST-05`)

## Test notes (manual smoke steps)
- In Supabase SQL editor: insert property, insert profile, insert 1–3 approved reviews; verify property_aggregates. Insert duplicate (user, property); expect error. Insert 4th review within 6 months; expect trigger error. Delete a review; verify aggregates recompute.

## Out of scope
- Auth provider configuration.
- RLS policies (Slice 05).
- Frontend or API wiring.
