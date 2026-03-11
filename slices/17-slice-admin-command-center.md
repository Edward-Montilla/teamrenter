# Slice 17 — Admin Command Center

## Goal (demo in 1–3 minutes)
Admins can open a single admin landing page from the public navbar, audit reviews, create properties, and delete properties without bouncing between disconnected screens.

## User story
As an admin, I need one clear workspace where I can exercise core admin privileges quickly and confidently.

## Screens (mockups)
- Reuse the current admin visual system. If dedicated mockups are unavailable in-repo, implement a consolidated command-center layout consistent with the existing polished admin/public styles.

## Frontend tasks
- Create `/admin` as the default admin landing page.
- Add an admin button in the signed-in public header that routes to `/admin`.
- On `/admin`, include:
- A review audit panel with moderation actions and private review text.
- An inline property creation form.
- A property management table with edit, activate/deactivate, and delete actions.
- Surface recent admin audit activity for review/property actions.
- Keep links to the deeper dedicated pages (`/admin/reviews`, `/admin/properties`) for overflow workflows.

## Integration tasks
- Reuse existing admin review APIs for loading and moderating review records.
- Reuse existing property list/create/update APIs for property management.
- Add property DELETE support to `/api/admin/properties/[id]`.
- Write property deletion events to `admin_audit_log`.

## RLS/Constraints notes
- Only authenticated admins can access `/admin` or invoke its API actions.
- Property deletion should respect existing foreign-key behavior; related dependent rows may cascade based on schema.
- Private `reviews.text_input` remains admin-only and must never be exposed in public UI or APIs.

## Acceptance criteria checklist
- [ ] Signed-in admins see an `Admin` button in the public header that opens `/admin`.
- [ ] `/admin` lets admins moderate reviews from the page itself.
- [ ] `/admin` lets admins create a property from the page itself.
- [ ] `/admin` lets admins delete a property from the page itself.
- [ ] Property deletion is audited and non-admins remain blocked from the route and API actions.

## Test notes (manual smoke steps)
- Sign in as admin and verify the public header shows `Admin`.
- Open `/admin` and confirm the command center loads review moderation, create-property, and property-management areas.
- Approve/reject/remove a review and verify the action succeeds.
- Create a property and verify it appears in property management.
- Delete a property and verify it disappears from admin lists and public browse if it had been active.

## Out of scope
- Bulk moderation or bulk property deletes.
- Advanced analytics dashboards beyond the existing audit feed and dedicated admin pages.
