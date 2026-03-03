# Slice 07 — Integration: Review Submission + Aggregates Refresh

## Goal (demo in 1–3 minutes)
A verified user submits a review; it is stored with status pending; after admin approval, aggregates update and property detail reflects new 0–6 ratings and review count.

## User story
As a verified renter, I want my review to be saved and, once approved, contribute to the property's trust signals.

## Screens (mockups)
- `proj_docs/UI Mockup/Rental Review Platform UI Mockups-4.png` (Review Form)
- `proj_docs/UI Mockup/Rental Review Platform UI Mockups-5.png` (Review Done)
- Property detail after submission (and after approval)

## Frontend tasks
- Wire submit form to backend (server action or route handler) that inserts into Supabase.
- Handle constraint/RLS errors and map to UX: 401 (unauthenticated), 403 (not verified), 409 (already reviewed), 429 (limit reached).
- On success, show confirmation and redirect options (e.g. "View Property Listing", "Return to Search").
- Do not assume immediate aggregate change (reviews default to pending); property page updates after admin approves.

## DB tasks
- Review insert triggers aggregate recompute only for approved reviews; new rows start as pending, so recompute runs when status transitions to approved (Slice 04 trigger on UPDATE).
- Document MVP demo path: submit → pending; admin approves in Slice 09 → aggregates refresh.

## Integration tasks
- Implement POST review endpoint (e.g. server action or POST /api/properties/:id/reviews):
  - Require authenticated session; check profiles.email_verified (or RLS enforces).
  - Validate body: five metrics 0..5, optional text_input (max 500), optional tenancy dates (start <= end).
  - Insert into reviews with status = 'pending'.
  - On success return 201 and review_id; on constraint/trigger failure return 409 or 429 with clear message; on auth failure 401/403.
- After admin approves review (Slice 09), DB trigger recomputes property_aggregates; property detail page (Slice 06) will show updated data on next load.

## RLS/Constraints notes
- Insert must satisfy RLS (verified) and DB constraints (unique user+property, rate limit); app handles errors and surfaces correct status codes.

## Acceptance criteria checklist
- [ ] Verified user can submit review successfully; stored as pending (`REV-01`, `REV-02`, `REV-03`, `AC-03`)
- [ ] Duplicate review (same user+property) returns 409 (`REV-04`, `AC-04`)
- [ ] Fourth review within 6 months returns 429 (`REV-04`, `AC-04`)
- [ ] Unverified or unauthenticated receive 403/401 (`AUTH-02`)
- [ ] After admin approval, property aggregates and detail page show updated 0–6 and review_count (`AGG-06`, `TST-08`)

## Test notes (manual smoke steps)
- As verified user: submit one review; verify pending and confirmation. Attempt second review same property → 409. As same user submit reviews for two other properties (3 total in 6 months); then attempt 4th → 429. As admin approve a pending review; reload property page and verify updated scores.

## Out of scope
- Auto-approval of reviews (MVP uses pending-by-default).
- Full moderation queue UI (Slice 09).
