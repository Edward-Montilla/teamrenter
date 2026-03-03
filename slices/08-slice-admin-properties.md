# Slice 08 — Admin UI: Property CRUD

## Goal (demo in 1–3 minutes)
Admin can list, create, edit, and deactivate properties; public browse shows only active properties.

## User story
As an admin, I need to manage the canonical list of valid rental properties.

## Screens (mockups)
- No explicit admin mockups in repo; implement minimal list and create/edit forms in same visual style as public pages (dark sidebar optional; keep layout consistent).

## Frontend tasks
- Create `/admin/properties`: list all properties (or filtered); show status, display_name, address, management_company; actions: New, Edit, Deactivate/Activate.
- Create new/edit form: display_name, address fields, management_company, status; submit creates or updates property.
- Admin-only route guard: redirect or show "Forbidden" if user is not admin (role from profiles or session).
- Public browse (`/`) already filters by status = 'active' (Slice 06); deactivating a property removes it from public list.

## DB tasks
- RLS already restricts property INSERT/UPDATE/DELETE to admin (Slice 05).
- Optional: on create/update/delete write to admin_audit_log (action_type, target_type = 'property', target_id).

## Integration tasks
- Wire list to Supabase: admin can SELECT all properties (RLS allows).
- Wire create: POST to create property (admin session or service role); set created_by to admin user id.
- Wire update: PATCH property by id (status, display_name, address, etc.).
- Wire deactivate: PATCH status to 'inactive' (or soft-delete per schema). Ensure public list and detail only show active (Slice 06).

## Data contracts
- Reuse property shape from schema; admin list may include status, created_at, etc.

## RLS/Constraints notes
- Only admin can INSERT/UPDATE/DELETE properties (`ADM-01`, `DATA-IC-04`).

## Acceptance criteria checklist
- [ ] Non-admin cannot access admin property routes (`UI-ADM-01`, `TST-07`)
- [ ] Admin can create property and see it in list; after activation it appears on public browse (`AC-06`)
- [ ] Admin can edit property (name, address, company, status).
- [ ] Deactivating property removes it from public browse (`FD-02`)

## Test notes (manual smoke steps)
- As non-admin, open `/admin/properties` → forbidden or redirect. As admin, create property, set active → verify on `/`. Deactivate → verify it no longer appears on `/`.

## Out of scope
- Bulk import.
- Photo upload (Slice 11).
