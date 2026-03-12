## Repository Implementation Status

This summary reflects the current implemented state of the repository, including
application code, API routes, database migrations, and admin UI flows.

### Implemented features

#### Core product and public experience

- Public property browse and search are implemented on `/`.
- Public property detail is implemented on `/properties/[id]`.
- Property detail shows:
  - trust score
  - structured rating breakdown
  - approved distilled insights only
  - optional public property photos when photo metadata exists
- Review submission is implemented on `/submit-review/[propertyId]`.
- Auth flows are implemented on `/sign-in`, including sign-in, sign-up, sign-out,
  and redirect handling.

#### Core data model and Supabase integration

- The main schema is implemented for:
  - `profiles`
  - `properties`
  - `reviews`
  - `property_aggregates`
  - `distilled_insights`
  - `admin_audit_log`
  - `property_photos`
  - `admin_role_requests`
- Review validation is enforced with database constraints.
- Duplicate reviews per `(user_id, property_id)` are prevented.
- Approved review moderation drives aggregate recomputation.
- Public pages are wired to Supabase-backed property, aggregate, insight, and
  photo reads.

#### Security, roles, and verification

- RLS is enabled on the core public and admin tables.
- Public reads are limited to safe data:
  - active `properties`
  - matching `property_aggregates`
  - approved `distilled_insights`
  - `property_photos` for active properties
- Raw review text remains admin-only.
- Review submission is gated by authenticated and email-verified user state.
- `profiles.role` is the source of truth for admin access.
- Profile sync from `auth.users` is implemented to keep `email_verified` and
  baseline role state in sync.
- Trigger protections prevent non-admin users from changing their own `role` or
  `email_verified` fields.

#### Admin access request workflow

- Non-admin users can request admin access on `/signup/request-admin`.
- Eligible users can submit and track admin-access requests.
- Admins can review access requests in `/admin/access-requests`.
- Request approval promotes the target user to `profiles.role = 'admin'`.
- First-admin bootstrap is implemented with allowlist protections and audit
  logging.

#### Admin console and operations

- The admin area is implemented under `/admin` with guarded access via
  `/api/admin/me`.
- Admin navigation now includes:
  - `Dashboard`
  - `Properties`
  - `Users`
  - `Reviews`
  - `Insights`
  - `Access requests`
  - `Audit`
- `/admin` now acts as a real command center with dashboard summary cards for:
  - pending reviews
  - pending insights
  - pending access requests
  - inactive properties

#### Admin user and role management

- A dedicated user-management screen is implemented at `/admin/users`.
- Admins can:
  - list users
  - filter by role, verification state, and request status
  - search by email or user ID
  - change user role graphically
  - repair `email_verified` state graphically
- Guardrails are implemented for user management:
  - self-demotion from admin is blocked
  - removing the last remaining admin is blocked
  - unverified users cannot be assigned the admin role
- Supporting admin-user APIs are implemented at:
  - `/api/admin/users`
  - `/api/admin/users/[id]`
- Supporting database RPC is implemented for admin user listing.

#### Admin property management

- Property CRUD is implemented in the admin area.
- `/admin/properties` now supports:
  - search
  - sort
  - status filtering
  - direct view, edit, activate/deactivate, and delete actions
- Property create and edit flows are implemented.
- Property photo management UI is implemented at
  `/admin/properties/[id]/photos`.
- Photo metadata APIs are implemented at:
  - `/api/admin/properties/[id]/photos`
  - `/api/admin/properties/[id]/photos/[photoId]`
- Public property pages can render registered photos when a photo base URL is
  configured.

#### Admin moderation workflows

- `/admin/reviews` supports:
  - status filtering
  - search
  - sort
  - single-item moderation
  - batch moderation
  - selected-review history via audit log
- `/admin/insights` supports:
  - status filtering
  - search
  - sort
  - single-item moderation
  - batch moderation
  - recompute action
  - selected-insight history via audit log
- Review moderation supports:
  - approve
  - reject
  - remove
  - reset to pending
- Insight moderation supports:
  - approve
  - reject
  - hide
  - reset to pending
  - recompute

#### Audit and admin visibility

- Admin audit logging is implemented for:
  - property create/update/delete
  - property photo create/delete
  - review moderation
  - insight moderation and recompute
  - admin-role request decisions
  - user/profile admin updates
- A dedicated audit page is implemented at `/admin/audit`.
- Audit filtering now supports:
  - target type
  - target ID
  - action type
  - admin user ID
- Shared audit widgets remain available through `AdminAuditFeed`.

### Still pending or partial

#### Photo upload is metadata-first

- Admin photo management currently registers and manages photo metadata plus
  public display URLs.
- Direct binary upload to Cloudflare R2 from the admin UI is not yet implemented.

#### Moderation notes are still limited

- Review and insight queues have better throughput tooling, but dedicated
  internal moderation notes/history storage beyond the audit log is not yet
  implemented.

#### Remaining checklist items outside the admin-console expansion

- Slice 11 is not fully complete because direct photo upload/storage flow is
  still pending.
- Slice 20 semantic renter feedback pipeline and UI are still pending.

### Verification completed

- `npm run lint` passes in `livedin/`.
- `npm run build` passes in `livedin/`.
