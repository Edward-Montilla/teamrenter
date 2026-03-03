# Slice 05 — Supabase RLS + Roles + Public Exposure Strategy

## Goal (demo in 1–3 minutes)
Public can read only safe data; verified users can insert their own reviews subject to constraints; admins can manage properties and moderation; anonymous cannot read reviews or text_input.

## User story
As the platform, I must prevent unauthorized reads/writes and never expose private text inputs publicly.

## Screens
- None (backend slice).

## Frontend tasks
- None.

## DB tasks (Supabase)
- Enable RLS on all tables that require it.
- **profiles**: SELECT own row for user; admin SELECT all; user UPDATE limited own fields (exclude role/email_verified); admin can update role/email_verified.
- **properties**: SELECT for anon/authenticated only where status = 'active'; admin SELECT all; INSERT/UPDATE/DELETE admin only.
- **property_aggregates**: SELECT for anon/authenticated (e.g. join via active properties only in app, or policy that only exposes rows for active properties); INSERT/UPDATE/DELETE service role or admin only (writes via trigger/service).
- **distilled_insights**: SELECT for anon/authenticated only when status = 'approved'; admin SELECT all; INSERT/UPDATE (status transitions) service role or admin.
- **reviews**: SELECT public none; verified user SELECT own rows (including text_input for self); admin SELECT all; INSERT verified only when profiles.email_verified = true (join profiles); UPDATE/DELETE admin only (or reviewer only for limited fields if spec allows; otherwise admin only).
- **admin_audit_log**: SELECT/INSERT admin only (or service role for server-side logging).
- **property_photos** (if present): SELECT for anon only for active properties; INSERT admin only.
- Decide and document how "verified" is represented: e.g. profiles.role = 'verified' and/or profiles.email_verified = true; review INSERT policy must require email_verified = true.

## Integration tasks
- Deferred; app will use anon key for public routes and authenticated session for verified actions; service role only where required (e.g. server-side aggregate recompute or audit logging).

## Data contracts
- Explicitly list what public endpoints/pages may query:
  - properties (status = 'active'), property_aggregates (for those properties), distilled_insights (status = 'approved' only).
- Explicitly forbid public access to:
  - reviews.text_input and any per-review raw text; reviews table at all for anonymous.

## RLS/Constraints notes
- Enforce email_verified gate at RLS for review INSERT, not only in app code.
- Anonymous SELECT on reviews must be denied.
- Admin capabilities: full CRUD properties; read/update reviews and insights; read/insert audit_log.

## Acceptance criteria checklist
- [ ] Anonymous SELECT from reviews fails (`NFR-SEC-02`, `TST-04`)
- [ ] Anonymous can read active properties and their aggregates (`FD-02`, `NFR-SEC-02`)
- [ ] Anonymous can read distilled_insights only when status = 'approved' (`INS-04`, `TST-06`, `NFR-PRIV-01`)
- [ ] Verified user (email_verified = true) can INSERT review subject to constraints (`REV-01`, `AUTH-02`, `NFR-SEC-03`)
- [ ] Admin can CRUD properties and moderate reviews/insights (`ADM-01`, `ADM-02`, `ADM-03`, `NFR-SEC-04`, `TST-07`)

## Test notes (manual smoke steps)
- Use Supabase client with anon key: try SELECT from reviews → expect empty or error per RLS. SELECT from properties where active, property_aggregates, approved insights → expect success.
- As authenticated verified user: INSERT review → success when under limits; SELECT own reviews → success.
- As admin: SELECT/UPDATE reviews and insights; INSERT audit_log; full property CRUD.

## Out of scope
- Token/claim propagation details for role (document during integration if needed).
- Application-level session handling; this slice is DB policies only.
