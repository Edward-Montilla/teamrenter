# Testing and Validation Guide for Team Renter Slices

This document provides comprehensive testing and validation instructions for each slice implementation. Each slice includes manual smoke test steps, acceptance criteria validation, and integration testing guidance.

## Prerequisites

Before testing any slice, ensure:

1. **Supabase Project Setup**
   - Create or use an existing Supabase project
   - Apply SQL migrations from `supabase/migrations` (for slices 04-05 and beyond)
   - Configure environment variables (Supabase URL and keys) in `.env` or `.env.example`

2. **Application Setup**
   - Navigate to `livedin` directory: `cd livedin`
   - Install dependencies: `npm install` (or `pnpm install` / `yarn install`)
   - Start the development server: `npm run dev`
   - Open `http://localhost:3000` in your browser

3. **Test Data**
   - Seed the database with test data (profiles, properties, reviews, aggregates)
   - Ensure at least one admin user exists for admin slices (08-09)

---

## Slice 01 — Public Browse/Search Results

### Goal
Verify that the home page (`/`) displays mocked property cards with search functionality, proper UI states, and navigation to property detail pages.

### Test Steps

1. **Initial Render Test**
   - Open `/` in browser
   - Verify that property cards render with:
     - Display name
     - Address summary (address_line1, city, province)
     - Management company (if present)
     - TrustScore display (0-6 scale)
     - Review count

2. **Search Functionality Test**
   - Enter a search query matching an address or management company
   - Verify that the results list filters correctly
   - Enter a non-matching query
   - Verify that "No results" empty state appears

3. **Error Handling Test**
   - Simulate a network error from the mock provider
   - Verify that an error state appears with retry functionality
   - Click retry and verify recovery

4. **Navigation Test**
   - Click on a property card
   - Verify navigation to `/properties/[id]` route

5. **UI States Test**
   - Verify loading skeleton appears during data fetch
   - Verify empty state when no results match
   - Verify error state with retry option

### Acceptance Criteria Validation

- [ ] `/` renders mocked property cards and search input
- [ ] Query filters mocked results by address/company text
- [ ] Card click navigates to `/properties/[id]`
- [ ] Loading/empty/error states are implemented and demo-able
- [ ] Public list contract excludes private review fields by design

### Data Contract Validation

Verify that `PropertyListItem` shape matches:
```ts
{
  id: string;
  display_name: string;
  address_line1: string;
  city: string;
  province: string;
  management_company: string | null;
  trustscore_display_0_6: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  review_count: number;
}
```

---

## Slice 02 — Property Detail (Public Read)

### Goal
Verify that property detail pages display TrustScore, metric breakdowns, review counts, and approved distilled insights correctly, with proper handling of "no reviews" and "no insights" states.

### Test Steps

1. **Property with Reviews and Insights**
   - Open `/properties/[id]` for a property with reviews and approved insights
   - Verify:
     - Overall TrustScore displays (0-6 scale)
     - All five metric scores display (0-6 scale):
       - Management Responsiveness
       - Maintenance Timeliness
       - Listing Accuracy
       - Fee Transparency
       - Lease Clarity
     - Review count displays correctly
     - Approved distilled insights panel shows text
     - "Back to results" and "Leave a review" CTAs are present

2. **Property with No Reviews**
   - Open `/properties/[id]` for a property with `review_count = 0`
   - Verify:
     - All display scores show 0
     - "No reviews yet" or "Not enough data" message appears
     - TrustScore displays as 0

3. **Property with No Approved Insights**
   - Open `/properties/[id]` for a property without approved insights
   - Verify:
     - "No insights yet" or "Not enough data" message appears
     - Insights panel does not show raw review text

4. **Privacy Validation**
   - Inspect the page source and network requests
   - Verify that no raw `reviews.text_input` appears anywhere
   - Verify that only approved insights are displayed (not pending/rejected)

5. **Rating Display Validation**
   - For properties with reviews, verify that:
     - Display scores follow the mapping: `display_0_6 = round((avg_0_5 / 5.0) * 6.0)`
     - When `review_count == 0`, all display scores are `0`

### Acceptance Criteria Validation

- [ ] Property page renders from mock data
- [ ] Shows correct "no reviews" state when review_count = 0
- [ ] Per-metric and overall display scores follow 0-6 mapping
- [ ] Never displays raw user text; only approved distilled insights
- [ ] "No insights yet" when no approved insight

### Data Contract Validation

Verify that `PropertyDetailPublic` shape matches:
```ts
{
  property: {
    id: string;
    display_name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    province: string;
    postal_code: string;
    management_company: string | null;
  };
  aggregates: PropertyAggregatePublic;
  insights: DistilledInsightPublic | null;
}
```

---

## Slice 03 — Review Submission Form (Gated UI)

### Goal
Verify that the review submission form handles all gated states correctly and validates input properly using mocked authentication states.

### Test Steps

1. **Unauthenticated State**
   - Toggle mock auth state to unauthenticated
   - Navigate to `/submit-review/[propertyId]`
   - Verify that a sign-in prompt appears
   - Verify that the form cannot be submitted

2. **Unverified Email State**
   - Toggle mock auth state to authenticated but unverified
   - Navigate to `/submit-review/[propertyId]`
   - Verify that "Verify email to submit" message appears
   - Verify that the form cannot be submitted

3. **Limit Reached State**
   - Toggle mock state to "limit reached" (3 reviews in 6 months)
   - Navigate to `/submit-review/[propertyId]`
   - Verify that "Review limit reached" message appears
   - Verify that the form cannot be submitted

4. **Already Reviewed State**
   - Toggle mock state to "already reviewed"
   - Navigate to `/submit-review/[propertyId]`
   - Verify that "You have already reviewed this property" message appears
   - Verify that the form cannot be submitted

5. **Form Validation Tests**
   - Toggle to "allowed" state
   - Try submitting with missing required metrics
   - Verify validation errors appear
   - Try submitting with `text_input` > 500 characters
   - Verify character cap enforcement (max 500 chars)
   - Try submitting with `tenancy_start > tenancy_end`
   - Verify date validation error

6. **Valid Submission Test**
   - Fill all required fields:
     - All five metrics (0-5)
     - Optional text_input (≤500 chars)
     - Optional tenancy dates (start ≤ end)
   - Submit the form
   - Verify confirmation screen appears: "Review Submitted"
   - Verify navigation options: "View Property Listing" and "Return to Search"

7. **Two-Step Flow Test**
   - Navigate to `/submit-review/[propertyId]`
   - Verify Step 1: Property search/select (or pre-filled)
   - Click "Continue" to form
   - Verify Step 2: Structured form appears
   - Complete and submit

### Acceptance Criteria Validation

- [ ] Form cannot submit with missing required metrics
- [ ] Text input capped and validated at 500 chars
- [ ] Tenancy dates validated (start <= end)
- [ ] All gated states render correctly via mocks
- [ ] Confirmation screen matches mock (Review Submitted, verification message)
- [ ] Error contract aligns with 401/403/409/429 for integration

### Data Contract Validation

Verify that `ReviewCreateInput` shape matches:
```ts
{
  property_id: string;
  management_responsiveness: 0 | 1 | 2 | 3 | 4 | 5;
  maintenance_timeliness: 0 | 1 | 2 | 3 | 4 | 5;
  listing_accuracy: 0 | 1 | 2 | 3 | 4 | 5;
  fee_transparency: 0 | 1 | 2 | 3 | 4 | 5;
  lease_clarity: 0 | 1 | 2 | 3 | 4 | 5;
  text_input: string | null; // max 500 chars
  tenancy_start: string | null; // ISO date
  tenancy_end: string | null;   // ISO date, >= tenancy_start
}
```

---

## Slice 04 — Supabase DB Foundation (Schema + Constraints + Aggregates)

### Goal
Verify that the database schema is correctly applied, constraints enforce business rules, and aggregate recomputation triggers work correctly.

### Test Steps

1. **Schema Application Test**
   - Apply all migrations from `supabase/migrations`
   - Verify no errors during migration
   - In Supabase SQL editor, verify all tables exist:
     - `profiles`
     - `properties`
     - `reviews`
     - `property_aggregates`
     - `distilled_insights`
     - `admin_audit_log`
     - `property_photos` (if implemented)

2. **Constraint Tests - Rating Range**
   - Insert a review with a metric value outside 0-5 (e.g., 6 or -1)
   - Verify that the insert is rejected with a constraint error
   - Test all five metric columns

3. **Constraint Tests - Unique User+Property**
   - Insert a review for a user+property combination
   - Attempt to insert a second review for the same user+property
   - Verify that the second insert is rejected with a unique constraint error

4. **Constraint Tests - Rate Limit Trigger**
   - Insert 3 reviews for the same user within 6 months
   - Verify all 3 inserts succeed
   - Attempt to insert a 4th review for the same user within 6 months
   - Verify that the trigger rejects the insert with a rate limit error

5. **Constraint Tests - Text Input Length**
   - Insert a review with `text_input` > 500 characters
   - Verify that the insert is rejected with a constraint error
   - Insert a review with `text_input` = 500 characters
   - Verify that the insert succeeds

6. **Constraint Tests - Tenancy Date Order**
   - Insert a review with `tenancy_start > tenancy_end`
   - Verify that the insert is rejected with a constraint error
   - Insert a review with `tenancy_start <= tenancy_end`
   - Verify that the insert succeeds

7. **Aggregate Recompute Tests - Insert**
   - Insert a property (if not exists)
   - Insert an approved review for that property
   - Verify that `property_aggregates` row is created/updated with:
     - `review_count = 1`
     - Correct `avg_*` values (0-5 scale)
     - Correct `display_*_0_6` values (0-6 scale, rounded)
     - `last_updated` timestamp updated

8. **Aggregate Recompute Tests - Update**
   - Update an approved review's metrics
   - Verify that `property_aggregates` recomputes with new averages
   - Verify `display_*_0_6` values update correctly

9. **Aggregate Recompute Tests - Delete**
   - Delete an approved review
   - Verify that `property_aggregates` recomputes:
     - `review_count` decreases
     - Averages recalculate
     - If `review_count = 0`, all `display_*_0_6` values become 0

10. **Aggregate Recompute Tests - Status Change**
    - Insert a review with `status = 'pending'`
    - Verify aggregates do NOT update (only approved reviews count)
    - Update review status to `approved`
    - Verify aggregates recompute and include this review
    - Update review status to `rejected` or `removed`
    - Verify aggregates recompute and exclude this review

11. **Display Score Calculation Test**
    - Create a property with multiple approved reviews
    - Calculate expected averages manually
    - Verify `display_*_0_6 = round((avg/5) * 6)`
    - Verify that when `review_count = 0`, all display scores are 0

### Acceptance Criteria Validation

- [ ] Schema applied without errors
- [ ] Insert review with metric outside 0..5 is rejected
- [ ] Second review same user+property is rejected (unique constraint)
- [ ] Fourth review within rolling 6 months for same user is rejected by trigger
- [ ] After approved review insert/update/delete, property_aggregates row is updated with correct review_count and display_*_0_6

### SQL Test Queries

```sql
-- Test 1: Insert property
INSERT INTO properties (id, display_name, address_line1, city, province, postal_code, status, created_by)
VALUES (gen_random_uuid(), 'Test Property', '123 Main St', 'Toronto', 'ON', 'M1A 1A1', 'active', '<admin_user_id>');

-- Test 2: Insert profile
INSERT INTO profiles (user_id, role, email_verified)
VALUES ('<test_user_id>', 'verified', true);

-- Test 3: Insert approved review
INSERT INTO reviews (property_id, user_id, status, management_responsiveness, maintenance_timeliness, listing_accuracy, fee_transparency, lease_clarity)
VALUES ('<property_id>', '<user_id>', 'approved', 4, 5, 3, 4, 5);

-- Test 4: Verify aggregates
SELECT * FROM property_aggregates WHERE property_id = '<property_id>';

-- Test 5: Attempt duplicate review
INSERT INTO reviews (property_id, user_id, status, management_responsiveness, maintenance_timeliness, listing_accuracy, fee_transparency, lease_clarity)
VALUES ('<property_id>', '<user_id>', 'approved', 3, 3, 3, 3, 3);
-- Should fail with unique constraint error
```

---

## Slice 05 — Supabase RLS + Roles + Public Exposure Strategy

### Goal
Verify that Row Level Security policies correctly restrict access: public can only read safe data, verified users can insert reviews, and admins have full access.

### Test Steps

1. **Public (Anonymous) Access Tests**
   - Use Supabase client with anon key
   - Attempt `SELECT * FROM reviews`
   - Verify: Returns empty result or error (RLS denies access)
   - Attempt `SELECT * FROM properties WHERE status = 'active'`
   - Verify: Returns active properties only
   - Attempt `SELECT * FROM property_aggregates` (for active properties)
   - Verify: Returns aggregates for active properties
   - Attempt `SELECT * FROM distilled_insights WHERE status = 'approved'`
   - Verify: Returns only approved insights
   - Attempt `SELECT * FROM distilled_insights WHERE status = 'pending'`
   - Verify: Returns empty (no pending insights for public)

2. **Verified User Access Tests**
   - Authenticate as a verified user (`profiles.email_verified = true`)
   - Attempt `INSERT INTO reviews` with valid data
   - Verify: Insert succeeds (subject to constraints)
   - Attempt `SELECT * FROM reviews WHERE user_id = '<own_id>'`
   - Verify: Returns own reviews (including text_input)
   - Attempt `SELECT * FROM reviews WHERE user_id != '<own_id>'`
   - Verify: Returns empty (cannot see others' reviews)
   - Attempt `UPDATE reviews` on own review
   - Verify: Behavior matches spec (may be admin-only per spec)

3. **Admin Access Tests**
   - Authenticate as admin (`profiles.role = 'admin'`)
   - Attempt `SELECT * FROM reviews`
   - Verify: Returns all reviews (including text_input)
   - Attempt `SELECT * FROM properties`
   - Verify: Returns all properties (active and inactive)
   - Attempt `INSERT INTO properties`
   - Verify: Insert succeeds
   - Attempt `UPDATE properties`
   - Verify: Update succeeds
   - Attempt `DELETE FROM properties`
   - Verify: Delete succeeds (or soft delete if implemented)
   - Attempt `SELECT * FROM distilled_insights`
   - Verify: Returns all insights (all statuses)
   - Attempt `UPDATE distilled_insights SET status = 'approved'`
   - Verify: Update succeeds
   - Attempt `INSERT INTO admin_audit_log`
   - Verify: Insert succeeds

4. **Email Verification Gate Test**
   - Authenticate as user with `email_verified = false`
   - Attempt `INSERT INTO reviews`
   - Verify: Insert is rejected (RLS enforces email_verified check)
   - Update profile: `UPDATE profiles SET email_verified = true`
   - Attempt `INSERT INTO reviews` again
   - Verify: Insert succeeds

5. **Property Status Filter Test**
   - Create an inactive property
   - As anonymous user, attempt to read inactive property
   - Verify: RLS prevents access (only active properties visible)
   - As admin, attempt to read inactive property
   - Verify: Admin can read all properties

6. **Insights Status Filter Test**
   - Create a pending distilled insight
   - As anonymous user, attempt to read pending insight
   - Verify: RLS prevents access (only approved insights visible)
   - As admin, attempt to read pending insight
   - Verify: Admin can read all insights

### Acceptance Criteria Validation

- [ ] Anonymous SELECT from reviews fails
- [ ] Anonymous can read active properties and their aggregates
- [ ] Anonymous can read distilled_insights only when status = 'approved'
- [ ] Verified user (email_verified = true) can INSERT review subject to constraints
- [ ] Admin can CRUD properties and moderate reviews/insights

### RLS Test Script

Run from `livedin` directory:
```bash
npm run rls:test
```

Combine script output with manual tests above to confirm policies behave as expected.

---

## Slice 06 — Integration: Public Reads Wired to Supabase

### Goal
Verify that home/search and property detail pages load real data from Supabase (no mocks), with proper RLS enforcement and error handling.

### Test Steps

1. **Home Page Integration Test**
   - Open `/` in browser (using anon/public session)
   - Verify that property cards load from Supabase
   - Verify that search functionality queries Supabase
   - Enter a search query
   - Verify filtered results from database
   - Verify loading states during fetch
   - Verify empty state when no results match

2. **Property Detail Integration Test**
   - Open `/properties/[id]` for an active property with reviews
   - Verify:
     - Property data loads from Supabase
     - Aggregates display correctly (TrustScore, metrics, review count)
     - Approved insights display (if present)
   - Open `/properties/[id]` for a property with `review_count = 0`
   - Verify: "No reviews yet" state and all scores = 0
   - Open `/properties/[id]` for a property without approved insights
   - Verify: "No insights yet" message

3. **Privacy Validation**
   - Open browser DevTools → Network tab
   - Load `/` and `/properties/[id]`
   - Inspect API responses
   - Verify: No `reviews.text_input` in any response
   - Verify: No pending/rejected insights in responses
   - Verify: Only approved insights are included

4. **RLS Enforcement Test**
   - Ensure app uses anon key for public routes
   - Attempt to access inactive property via `/properties/[id]`
   - Verify: 404 or error (RLS prevents access)
   - Verify: Only active properties appear in search results

5. **Error Handling Test**
   - Simulate database connection error
   - Verify: Error state appears with retry option
   - Verify: Loading states work correctly
   - Verify: Empty states work correctly

6. **Data Consistency Test**
   - Insert a new approved review via admin
   - Verify aggregates recompute (Slice 04)
   - Reload property detail page
   - Verify: Updated TrustScore and review count display
   - Approve a pending insight via admin
   - Reload property detail page
   - Verify: Approved insight appears

### Acceptance Criteria Validation

- [ ] `/` search returns DB-backed results
- [ ] `/properties/[id]` returns DB-backed property + aggregates + approved insights only
- [ ] "No reviews" state when review_count = 0
- [ ] Loading and error states still work

### Network Inspection Checklist

- [ ] API calls use Supabase client (not mock data)
- [ ] Responses match `PropertyListItem` and `PropertyDetailPublic` contracts
- [ ] No `reviews` table queries in public routes
- [ ] Only `status = 'active'` properties returned
- [ ] Only `status = 'approved'` insights returned

---

## Slice 07 — Integration: Review Submission + Aggregates Refresh

### Goal
Verify that verified users can submit reviews, constraints are enforced, and aggregates update correctly after admin approval.

### Test Steps

1. **Successful Submission Test**
   - Authenticate as verified user (`email_verified = true`)
   - Navigate to `/submit-review/[propertyId]`
   - Fill form with valid data:
     - All five metrics (0-5)
     - Optional text_input (≤500 chars)
     - Optional tenancy dates (start ≤ end)
   - Submit the form
   - Verify: Review is inserted with `status = 'pending'`
   - Verify: Confirmation screen appears
   - Verify: Review ID is returned

2. **Duplicate Review Test**
   - As verified user, submit a review for a property
   - Attempt to submit a second review for the same property
   - Verify: Request returns 409 (Conflict) error
   - Verify: Error message indicates "already reviewed"
   - Verify: Form shows "already reviewed" state

3. **Rate Limit Test**
   - As verified user, submit 3 reviews for different properties within 6 months
   - Verify: All 3 submissions succeed
   - Attempt to submit a 4th review
   - Verify: Request returns 429 (Too Many Requests) error
   - Verify: Error message indicates "limit reached"
   - Verify: Form shows "limit reached" state

4. **Authentication/Authorization Tests**
   - As unauthenticated user, attempt to submit review
   - Verify: Request returns 401 (Unauthorized)
   - Verify: Form shows sign-in prompt
   - As authenticated but unverified user, attempt to submit review
   - Verify: Request returns 403 (Forbidden)
   - Verify: Form shows "verify email" message

5. **Validation Tests**
   - Submit review with missing required metrics
   - Verify: Validation error (400 Bad Request)
   - Submit review with `text_input` > 500 chars
   - Verify: Validation error
   - Submit review with `tenancy_start > tenancy_end`
   - Verify: Validation error

6. **Aggregate Refresh Test**
   - Submit a review as verified user (status = 'pending')
   - Verify: Property aggregates do NOT update yet
   - As admin, approve the review (Slice 09)
   - Verify: DB trigger recomputes `property_aggregates`
   - Reload property detail page
   - Verify: Updated TrustScore and review count display
   - Verify: New review contributes to averages

7. **Review Status Change Test**
   - Submit a review (pending)
   - Approve it → verify aggregates update
   - Reject it → verify aggregates recompute (exclude rejected review)
   - Remove it → verify aggregates recompute (exclude removed review)

### Acceptance Criteria Validation

- [ ] Verified user can submit review successfully; stored as pending
- [ ] Duplicate review (same user+property) returns 409
- [ ] Fourth review within 6 months returns 429
- [ ] Unverified or unauthenticated receive 403/401
- [ ] After admin approval, property aggregates and detail page show updated 0-6 and review_count

### End-to-End Test Flow

1. Verified user submits review → pending
2. Admin approves review → aggregates recompute
3. Property detail page shows updated scores
4. Verified user attempts duplicate → 409 error
5. Verified user submits 3 more reviews → all succeed
6. Verified user attempts 4th review → 429 error

---

## Slice 08 — Admin UI: Property CRUD

### Goal
Verify that admins can create, read, update, and deactivate properties, and that public browse correctly filters by active status.

### Test Steps

1. **Access Control Test**
   - As non-admin user, navigate to `/admin/properties`
   - Verify: Redirected or "Forbidden" message appears
   - As admin user, navigate to `/admin/properties`
   - Verify: Admin properties page loads

2. **Property List Test**
   - As admin, view `/admin/properties`
   - Verify: All properties are listed (active and inactive)
   - Verify: Each property shows:
     - Status (active/inactive)
     - Display name
     - Address
     - Management company
   - Verify: Actions available: New, Edit, Deactivate/Activate

3. **Create Property Test**
   - As admin, click "New" or navigate to create form
   - Fill form:
     - Display name
     - Address fields (line1, line2, city, province, postal_code)
     - Management company (optional)
     - Status (active/inactive)
   - Submit form
   - Verify: Property is created in database
   - Verify: `created_by` is set to admin user ID
   - Verify: Property appears in admin list
   - If status = 'active', verify property appears on public browse (`/`)

4. **Edit Property Test**
   - As admin, click "Edit" on a property
   - Modify fields (name, address, company, status)
   - Submit form
   - Verify: Property is updated in database
   - Verify: Changes appear in admin list
   - Verify: Changes reflect on public property detail page (if active)

5. **Deactivate Property Test**
   - As admin, deactivate a property (set status = 'inactive')
   - Verify: Property status updates in database
   - Verify: Property no longer appears on public browse (`/`)
   - Verify: Attempting to access `/properties/[id]` for inactive property returns 404 or error
   - Verify: Property still appears in admin list (with inactive status)

6. **Activate Property Test**
   - As admin, activate an inactive property (set status = 'active')
   - Verify: Property status updates in database
   - Verify: Property appears on public browse (`/`)
   - Verify: Property detail page is accessible

7. **Audit Log Test** (if implemented)
   - As admin, create/edit/deactivate a property
   - Verify: Entry is created in `admin_audit_log`:
     - `admin_user_id` matches admin
     - `action_type` is correct (create/update/delete)
     - `target_type` = 'property'
     - `target_id` matches property ID
     - `created_at` timestamp is set

### Acceptance Criteria Validation

- [ ] Non-admin cannot access admin property routes
- [ ] Admin can create property and see it in list; after activation it appears on public browse
- [ ] Admin can edit property (name, address, company, status)
- [ ] Deactivating property removes it from public browse

### Integration Test Flow

1. Admin creates property (inactive) → verify in admin list only
2. Admin activates property → verify appears on public browse
3. Admin edits property → verify changes reflect everywhere
4. Admin deactivates property → verify removed from public browse
5. Non-admin attempts access → verify forbidden

---

## Slice 09 — Admin UI: Moderation (Reviews + Insights) + Audit

### Goal
Verify that admins can moderate reviews and insights, view private text_input, and that actions are logged in audit trail. Verify that aggregate recomputation occurs on approval/removal.

### Test Steps

1. **Access Control Test**
   - As non-admin, navigate to `/admin/reviews` or `/admin/insights`
   - Verify: Redirected or "Forbidden" message
   - As admin, navigate to moderation pages
   - Verify: Moderation UI loads

2. **Review Moderation List Test**
   - As admin, view `/admin/reviews`
   - Verify: Reviews are listed with filters:
     - Status filter: pending, approved, rejected, removed
   - Verify: Each review shows:
     - Property name/ID
     - User ID (or anonymized)
     - Status
     - Created date
   - Filter by status = 'pending'
   - Verify: Only pending reviews appear

3. **Review Detail Test**
   - As admin, open a review detail (drawer/modal)
   - Verify: All structured metrics display (0-5 scale)
   - Verify: Optional tenancy dates display (if present)
   - Verify: **Private text_input displays** (admin-only)
   - Verify: Actions available: Approve, Reject, Remove

4. **Approve Review Test**
   - As admin, approve a pending review
   - Verify: Review status updates to 'approved' in database
   - Verify: DB trigger recomputes `property_aggregates` for that property
   - Verify: Property detail page shows updated TrustScore and review count
   - Verify: Audit log entry created (if implemented):
     - `action_type` = 'approve' or 'update'
     - `target_type` = 'review'
     - `target_id` = review ID
   - Refresh admin review list
   - Verify: Review status shows as 'approved'

5. **Reject Review Test**
   - As admin, reject a pending review
   - Verify: Review status updates to 'rejected' in database
   - Verify: Review does NOT contribute to aggregates
   - Verify: Audit log entry created
   - Verify: Review no longer appears in pending filter

6. **Remove Review Test**
   - As admin, remove an approved review
   - Verify: Review status updates to 'removed' in database
   - Verify: DB trigger recomputes `property_aggregates` (excludes removed review)
   - Verify: Property detail page shows updated (lower) TrustScore and review count
   - Verify: Audit log entry created

7. **Insights Moderation Test**
   - As admin, view `/admin/insights` or insights panel
   - Verify: All distilled insights listed (all statuses)
   - Verify: Status and snippet displayed
   - Verify: Actions available: Approve, Reject, Hide
   - Approve a pending insight
   - Verify: Insight status updates to 'approved'
   - Verify: Insight appears on public property detail page
   - Reject or hide an approved insight
   - Verify: Insight status updates
   - Verify: Insight no longer appears on public property detail page

8. **Aggregate Recompute Verification**
   - Submit a review as verified user (pending)
   - Verify: Property aggregates do NOT update
   - Approve review as admin
   - Verify: Property aggregates update immediately (trigger)
   - Verify: Property detail page shows new scores on reload
   - Remove the review
   - Verify: Property aggregates recompute (scores decrease)

9. **Privacy Validation**
   - As admin, verify that `text_input` is visible in moderation UI
   - As public user, verify that `text_input` never appears on property pages
   - Verify: Only approved insights appear publicly

### Acceptance Criteria Validation

- [ ] Admin can view pending reviews and their private text_input
- [ ] Approving a pending review updates property_aggregates and property page shows new scores
- [ ] Removing/rejecting a review updates aggregates (count and scores)
- [ ] Admin can approve/reject/hide distilled insights
- [ ] Audit log records actions with timestamp and admin id

### End-to-End Moderation Flow

1. Verified user submits review → pending
2. Admin views moderation queue → sees review with text_input
3. Admin approves review → aggregates recompute
4. Property detail page shows updated scores
5. Admin removes review → aggregates recompute again
6. Property detail page shows decreased scores

---

## Slice 10 — Distilled Insights Pipeline + Screening/Approval Flow

### Goal
Verify that the insights generation pipeline works, screening gates function, and only approved insights appear publicly.

### Test Steps

1. **Insight Generation Trigger Test**
   - Add an approved review with `text_input` for a property
   - Trigger insight recompute (manual or automatic)
   - Verify: New `distilled_insights` row created with:
     - `status = 'pending'`
     - `insights_text` contains generated summary
     - `last_generated_at` timestamp set
     - `screening_flags` set (if screening ran)
     - `screened = true` (if automated screening ran)

2. **Screening Gate Test**
   - Generate insight with potentially problematic content
   - Verify: Screening flags are set appropriately
   - Verify: Insight remains `pending` until admin approval
   - Verify: Screening metadata stored in `screening_flags` jsonb

3. **Pending Insight Visibility Test**
   - Generate a pending insight for a property
   - As public user, view property detail page
   - Verify: Insight does NOT appear (only approved insights visible)
   - As admin, view insights moderation panel
   - Verify: Pending insight appears in admin UI

4. **Insight Approval Test**
   - As admin, approve a pending insight
   - Verify: Insight status updates to 'approved'
   - As public user, view property detail page
   - Verify: Approved insight appears in insights panel
   - Verify: Insight text does NOT contain raw user text
   - Verify: Insight text is non-identifying (no names, unit numbers)

5. **Insight Rejection/Hide Test**
   - As admin, reject or hide an approved insight
   - Verify: Insight status updates to 'rejected' or 'hidden'
   - As public user, view property detail page
   - Verify: Insight no longer appears

6. **Insight Refresh Test**
   - Property has existing approved insight
   - Add new approved review with text_input
   - Trigger insight recompute
   - Verify: Existing insight is updated (or new one created)
   - Verify: Updated insight starts as 'pending'
   - Admin approves updated insight
   - Verify: New insight text appears on property page

7. **Privacy Validation**
   - Generate insight from multiple reviews with text_input
   - Verify: Insight text is aggregated summary (not verbatim quotes)
   - Verify: No user-identifying information in insight
   - Verify: No property-specific details that could identify reviewers

8. **No Text Input Test**
   - Property has approved reviews but no reviews with `text_input`
   - Trigger insight recompute
   - Verify: Behavior matches spec (may skip or generate minimal insight)

### Acceptance Criteria Validation

- [ ] New or updated approved review text_input can trigger recompute; pending insight created or updated
- [ ] Pending insight does not appear on public property page
- [ ] Approved insight appears on property page
- [ ] No raw user text is exposed publicly; only distilled summary

### End-to-End Insight Flow

1. Verified user submits review with text_input → approved
2. Trigger insight recompute → pending insight created
3. Public views property → insight does NOT appear
4. Admin approves insight → status = 'approved'
5. Public views property → insight appears (distilled, non-identifying)
6. Admin hides insight → insight no longer appears publicly

---

## Slice 11 — Optional: Property Photos via Cloudflare R2 + Metadata

### Goal
Verify that admins can upload photos to R2, metadata is stored correctly, and public can view photos via safe URLs.

### Test Steps

1. **Access Control Test**
   - As non-admin, attempt to access photo upload UI
   - Verify: Access denied or redirect
   - As admin, access photo upload UI
   - Verify: Upload form loads

2. **Photo Upload Test**
   - As admin, select a property (or upload from property context)
   - Choose an image file
   - Initiate upload
   - Verify: Signed upload URL is generated (server-side)
   - Verify: File uploads to R2 successfully
   - Verify: After upload confirmation, `property_photos` row is created with:
     - `property_id` matches selected property
     - `r2_bucket` and `r2_key` set correctly
     - `content_type` set (e.g., 'image/jpeg')
     - `bytes` size recorded
     - `width` and `height` recorded (if extracted)
     - `uploaded_by` set to admin user ID
     - `created_at` timestamp set

3. **Photo Display Test**
   - As public user, view property detail page for property with photos
   - Verify: Photos are displayed (gallery section)
   - Verify: Photo URLs are signed or proxied (not raw R2 URLs with credentials)
   - Verify: Only photos for active properties are visible
   - Verify: Inactive property photos are not accessible

4. **RLS Enforcement Test**
   - As anonymous user, attempt to query `property_photos` directly
   - Verify: Only photos for active properties are returned
   - As admin, verify can see photos for all properties (active and inactive)

5. **Photo Metadata Test**
   - Upload photo and verify metadata stored correctly
   - Verify: `content_type` matches file type
   - Verify: `bytes` matches file size
   - Verify: Unique constraint on `(r2_bucket, r2_key)` prevents duplicates

6. **Multiple Photos Test**
   - Upload multiple photos for same property
   - Verify: All photos appear in gallery
   - Verify: Each photo has unique `r2_key`
   - Verify: All metadata stored correctly

7. **Security Test**
   - Inspect browser network requests
   - Verify: No R2 credentials (access keys, secrets) exposed client-side
   - Verify: Photo URLs are ephemeral signed URLs or proxied through Next.js
   - Verify: Direct R2 bucket access is not possible without signed URL

### Acceptance Criteria Validation

- [ ] Only admin can upload photos
- [ ] Public can view photos on property page for active properties
- [ ] No raw R2 credentials exposed client-side

### Upload Flow Validation

1. Admin selects property and file
2. Server generates signed PUT URL
3. Client uploads to R2 using signed URL
4. Server creates `property_photos` metadata row
5. Public views property → photos displayed via signed GET URLs
6. Non-admin attempts upload → access denied

---

## Cross-Slice Integration Testing

### End-to-End User Journey Tests

1. **Public Browse → Property Detail → Review Submission**
   - Public user browses properties on `/`
   - Clicks property card → navigates to `/properties/[id]`
   - Clicks "Leave a review" → navigates to `/submit-review/[propertyId]`
   - Signs in and verifies email
   - Submits review → receives confirmation
   - Admin approves review → aggregates update
   - Property detail page shows updated scores

2. **Admin Property Management → Public Visibility**
   - Admin creates property (inactive)
   - Property does NOT appear on public browse
   - Admin activates property
   - Property appears on public browse
   - Admin edits property details
   - Changes reflect on public property page

3. **Review Submission → Moderation → Insights**
   - Verified user submits review with text_input
   - Admin approves review
   - Aggregates recompute
   - Insight generation triggered
   - Admin approves insight
   - Public property page shows insight

### Performance Testing

- Verify: Public browse loads quickly (<2s)
- Verify: Property detail loads quickly (<2s)
- Verify: Aggregate recomputation completes within reasonable time
- Verify: Search queries perform well with indexes

### Security Testing

- Verify: No SQL injection vulnerabilities
- Verify: No XSS vulnerabilities in user-generated content
- Verify: RLS policies cannot be bypassed
- Verify: Admin routes require proper authentication
- Verify: Private data (text_input) never exposed publicly

---

## Test Data Setup Recommendations

### Seed Data for Testing

1. **Profiles**
   - Admin user (`role = 'admin'`)
   - Verified user (`role = 'verified'`, `email_verified = true`)
   - Unverified user (`role = 'verified'`, `email_verified = false`)
   - Public user (no profile or `role = 'public'`)

2. **Properties**
   - 5-10 active properties
   - 2-3 inactive properties
   - Mix of properties with and without management companies

3. **Reviews**
   - Properties with 0 reviews (for empty state testing)
   - Properties with 1-5 approved reviews
   - Properties with pending reviews
   - Properties with rejected/removed reviews
   - Reviews with and without text_input
   - Reviews spanning different date ranges (for rate limit testing)

4. **Aggregates**
   - Pre-computed aggregates for all properties with reviews
   - Properties with review_count = 0 (all display scores = 0)

5. **Insights**
   - Properties with approved insights
   - Properties with pending insights
   - Properties with rejected/hidden insights
   - Properties with no insights

---

## Troubleshooting Common Issues

### Aggregate Not Updating
- Check that review status is 'approved'
- Verify trigger is enabled on reviews table
- Check trigger function `recompute_property_aggregates` exists
- Verify property_id matches

### RLS Policy Not Working
- Verify RLS is enabled on table
- Check policy conditions match test scenario
- Verify user role/email_verified status
- Check Supabase client is using correct key (anon vs authenticated)

### Review Submission Failing
- Verify user is authenticated
- Verify `email_verified = true` in profiles
- Check for unique constraint violation (already reviewed)
- Check rate limit (3 reviews per 6 months)
- Verify all required metrics provided (0-5 range)

### Photos Not Displaying
- Verify R2 bucket configuration
- Check signed URL generation
- Verify property_photos RLS policies
- Check property status is 'active'

---

## Notes

- All slices should be tested in order (01-11) as they build upon each other
- Frontend slices (01-03) can be tested with mock data before backend integration
- Backend slices (04-05) require Supabase setup
- Integration slices (06-07) require both frontend and backend
- Admin slices (08-09) require admin user setup
- Optional slice (11) can be skipped if not implementing photo feature

For detailed implementation requirements, refer to individual slice documentation files in the `slices/` directory.
