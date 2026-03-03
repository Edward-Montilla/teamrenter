# Slice 03 — Review Submission Form (Gated UI)

## Goal (demo in 1–3 minutes)
User can complete the structured review flow (address select + form + confirmation) and see gated states (not logged in, not verified, limit reached, already reviewed) using mocks.

## User story
As a verified renter, I want to submit an objective, structured review for a property I lived at.

## Screens (mockups)
- `proj_docs/UI Mockup/Rental Review Platform UI Mockups-3.png` (Frame 4: Review - Address)
- `proj_docs/UI Mockup/Rental Review Platform UI Mockups-4.png` (Frame 5: Review - Form)
- `proj_docs/UI Mockup/Rental Review Platform UI Mockups-5.png` (Frame 6: Review - Done)

## Frontend tasks (mocked)
- Create route `/submit-review/[propertyId]` with two-step flow:
  - Step 1: property search/select (or pre-filled from propertyId); "Continue" to form.
  - Step 2: structured form; submit leads to confirmation.
- Form fields:
  - Five required metric ratings (int 0..5): management_responsiveness, maintenance_timeliness, listing_accuracy, fee_transparency, lease_clarity.
  - Optional `text_input` (private, max 500 chars).
  - Optional tenancy_start / tenancy_end (validate start <= end).
- Gated states (mock toggles or mock auth state):
  - Unauthenticated: prompt to sign in.
  - Authenticated but email not verified: "Verify email to submit".
  - Limit reached (3 per 6 months): "Review limit reached".
  - Already reviewed this property: "You have already reviewed this property".
- Client-side validation and friendly error messages.
- Submit confirmation screen: "Review Submitted" with "View Property Listing" and "Return to Search" (mock only).

## DB tasks (Supabase)
- Deferred until DB phase (Slice 04/05):
  - reviews table and constraints (metric 0..5, uq(user_id, property_id), text cap, tenancy order).
  - Rolling limit trigger (max 3 reviews per 6 months per user).

## Integration tasks
- Deferred until integration phase (Slice 07):
  - POST review via server action/route handler.
  - On success, backend triggers aggregates recompute when review is approved.

## Data contracts (TypeScript shapes in markdown)
```ts
type ReviewCreateInput = {
  property_id: string;
  management_responsiveness: 0 | 1 | 2 | 3 | 4 | 5;
  maintenance_timeliness: 0 | 1 | 2 | 3 | 4 | 5;
  listing_accuracy: 0 | 1 | 2 | 3 | 4 | 5;
  fee_transparency: 0 | 1 | 2 | 3 | 4 | 5;
  lease_clarity: 0 | 1 | 2 | 3 | 4 | 5;
  text_input: string | null; // max 500 chars
  tenancy_start: string | null; // ISO date
  tenancy_end: string | null;   // ISO date, >= tenancy_start
};

type ReviewGateState =
  | "unauthenticated"
  | "unverified"
  | "limit_reached"
  | "already_reviewed"
  | "allowed";

type ReviewSubmitResult =
  | { ok: true; review_id: string }
  | { ok: false; code: 401 | 403 | 409 | 429; message: string };
```

## RLS/Constraints notes (must be enforced later)
- Insert allowed only for users with profiles.email_verified = true.
- DB enforces: one review per (user_id, property_id); max 3 reviews per user in rolling 6 months.
- UI gating is UX only; RLS and constraints are authoritative.

## Acceptance criteria checklist
- [ ] Form cannot submit with missing required metrics (`UI-REV-01`, `REV-02`, `REV-03`)
- [ ] Text input capped and validated at 500 chars (`UI-REV-02`, `REV-05`)
- [ ] Tenancy dates validated (start <= end) (`REV-05`)
- [ ] All gated states render correctly via mocks (`UI-REV-03`, `UI-REV-04`, `AUTH-02`, `AC-03`, `AC-04`)
- [ ] Confirmation screen matches mock (Review Submitted, verification message) (`Frame 6`)
- [ ] Error contract aligns with 401/403/409/429 for integration (`POST /api/properties/:id/reviews`)

## Test notes (manual smoke steps)
1. Toggle mock state to unauthenticated; verify sign-in prompt.
2. Toggle to authenticated but unverified; verify "verify email" message.
3. Toggle to limit reached; verify "limit reached" state.
4. Toggle to already reviewed; verify "already reviewed" state.
5. Submit valid form; verify confirmation and navigation options.
6. Submit with missing metrics; verify validation errors.
7. Submit with text_input > 500 chars; verify cap enforcement.

## Out of scope
- Full auth UI implementation (signup/login screens); use mock session for this slice.
- Real email verification flow wiring (handled in integration/security slices).
- Actual Supabase insert and aggregate recompute (Slice 07).
