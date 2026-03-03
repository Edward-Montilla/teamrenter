# Slice 09 — Admin UI: Moderation (Reviews + Insights) + Audit

## Goal (demo in 1–3 minutes)
Admin can view pending reviews, see private text_input, approve/reject/remove reviews; approve/reject/hide distilled insights; actions recorded in audit log; aggregate recompute runs on approval/removal.

## User story
As an admin, I need to keep content safe and maintain trust signal integrity.

## Screens (mockups)
- No dedicated mockups; implement minimal table/drawer UI for review queue and insights moderation consistent with app style.

## Frontend tasks
- `/admin/reviews`: list reviews with filters (e.g. status: pending, approved, rejected, removed); show property, user (id or anonymized), status, created_at.
- Review detail drawer/modal: structured metrics, optional tenancy dates, **private text_input** (admin-only); actions: Approve, Reject, Remove.
- `/admin/insights` or per-property insights panel: list distilled_insights by property; show status and snippet; actions: Approve, Reject, Hide.
- After approve/reject/remove, refresh list and optionally trigger aggregate recompute (or rely on DB trigger).

## DB tasks
- RLS: admin SELECT/UPDATE on reviews and distilled_insights; admin SELECT/INSERT on admin_audit_log (Slice 05).
- Ensure aggregate trigger runs on review status change (Slice 04: trigger on reviews UPDATE/DELETE). Approving a review should recompute that property's aggregates.

## Integration tasks
- GET admin reviews: fetch reviews with optional filter by status (admin session).
- PATCH review: update status to approved/rejected/removed; write audit entry (admin_user_id, action_type, target_type = 'review', target_id).
- GET insights for moderation: fetch distilled_insights (all statuses) for admin.
- PATCH insights: update status to approved/rejected/hidden; write audit entry.
- On review status change to approved/rejected/removed, DB trigger already recomputes property_aggregates; ensure UI reflects after refresh or refetch.

## Data contracts
- Admin review list/detail includes text_input; never expose this to public APIs or public UI.

## RLS/Constraints notes
- Public never sees reviews or text_input; only admin (and own user for own reviews per Slice 05) can read reviews with text_input.

## Acceptance criteria checklist
- [ ] Admin can view pending reviews and their private text_input (`UI-ADM-02`, `UI-ADM-03`, `ADM-02`, `NFR-PRIV-03`)
- [ ] Approving a pending review updates property_aggregates and property page shows new scores (`AGG-06`, `TST-08`)
- [ ] Removing/rejecting a review updates aggregates (count and scores) (`AGG-06`)
- [ ] Admin can approve/reject/hide distilled insights (`ADM-02`, `INS-03`)
- [ ] Audit log records actions with timestamp and admin id (`ADM-03`)

## Test notes (manual smoke steps)
- Submit review as verified user (pending). As admin open moderation queue, view review and text_input, approve. Reload property detail and verify updated TrustScore and review count. Reject or remove another review; verify aggregates update.

## Out of scope
- Automated abuse detection heuristics.
- Content_reports workflow (optional table; can be minimal in MVP).
