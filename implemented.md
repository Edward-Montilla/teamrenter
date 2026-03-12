## Implementation Status from `docs/`

This summary is based only on the files currently present under `docs/`:

- `docs/db/slice04-manual-tests.md`
- `docs/security/rls.md`

Because these documents are mostly acceptance-test and security notes, the "pending" section below reflects items that still appear to need verification, smoke testing, or explicit completion confirmation in the docs.

### Implemented features

#### Core review and property data model

- Core public tables are documented as part of the applied schema:
  - `profiles`
  - `properties`
  - `reviews`
  - `property_aggregates`
  - `distilled_insights`
  - `admin_audit_log`
  - `property_photos`
- Review metric validation is defined with database-level `CHECK` constraints for values in the `0..5` range.
- Duplicate reviews are prevented with a uniqueness rule of one review per `(user_id, property_id)`.
- A rolling submission limit is documented: max 3 reviews per user within 6 months.

#### Aggregate scoring and derived property metrics

- `property_aggregates` is documented as being automatically maintained.
- Approved review insertions update aggregate counts and averages.
- Review status changes from pending to approved trigger recomputation of aggregates.
- Deleting approved reviews also recomputes aggregate values.
- Display-oriented normalized scores (`display_*_0_6`) and `last_updated` are part of the implemented aggregate behavior.

#### Row Level Security and role-based access control

- RLS is documented as enabled for the core Postgres tables.
- Public read access is limited to safe data slices:
  - active `properties`
  - `property_aggregates` tied to active properties
  - approved `distilled_insights` tied to active properties
  - `property_photos` tied to active properties
- `reviews` are not publicly readable.
- Verified users can read only their own reviews and can insert their own reviews.
- Admins can read all reviews for moderation.
- `admin_audit_log` is admin-only for reads and inserts and is effectively immutable to app roles.
- `profiles` access is scoped so users can read/update only their own row, while admins can manage all rows.

#### Verification and admin helpers

- Email verification is documented as the effective gate for review access via `public.profiles.email_verified`.
- Helper functions `public.is_verified()` and `public.is_admin()` are documented as the database-level access checks.
- A trigger is documented to prevent non-admin users from changing `role` or `email_verified` on their own profile.

#### Admin capabilities

- Admins are documented as having full or moderation-level access across the main platform data:
  - full CRUD on `properties`
  - select/update/delete on `reviews`
  - full management of `distilled_insights`
  - maintenance access to `property_aggregates`
  - full CRUD on `property_photos`
  - select/insert on `admin_audit_log`
  - select/update on `profiles`

### Still pending or not yet confirmed

#### Acceptance verification still unchecked

The checklist in `docs/db/slice04-manual-tests.md` is still unchecked, so these items appear implemented in design but not explicitly confirmed as passed in the docs:

- Schema application without errors
- Rejection of out-of-range review metrics
- Rejection of duplicate user/property reviews
- Enforcement of the 3-reviews-per-6-months rate limit
- Automatic aggregate updates on insert/update/delete of approved reviews

#### RLS smoke-test execution not confirmed

`docs/security/rls.md` documents a smoke-test script and expected behavior, but the docs do not confirm that the script has been run successfully in the current environment. The following therefore remain pending verification:

- Anonymous access restrictions
- Non-verified user review insert denial
- Verified user self-review read/write behavior
- Admin CRUD and moderation flows
- Admin audit log write behavior

#### Documentation-level gaps

- The `docs/` directory does not include explicit pass/fail evidence, completion dates, or test results for the documented features.
- No additional pending product features are listed in `docs/`; the main outstanding items are validation and confirmation rather than clearly undocumented feature work.
