# Slice 10 — Distilled Insights Pipeline + Screening/Approval Flow

## Goal (demo in 1–3 minutes)
After new approved review text_input (or when approved reviews have text), system can generate or refresh a pending distilled insight; it is not public until screened/approved; once approved, it appears on property page.

## User story
As a visitor, I want a short objective summary of aggregated reviewer context without seeing raw text.

## Screens (mockups)
- Property detail insights panel (Slice 02/06); Admin insights moderation (Slice 09).

## Frontend tasks
- Property detail already shows insights only when status = 'approved' (Slices 02, 06).
- Admin UI: view pending insight text, approve/reject/hide (covered in Slice 09).

## DB tasks
- distilled_insights table with status flow: pending → approved | rejected | hidden (Slice 04).
- Store screening_flags (jsonb) and screened_at when screening runs.

## Integration tasks
- Implement recompute endpoint (e.g. POST /api/admin/properties/:id/insights/recompute or server action):
  - Called after new approved review with text_input, or manually by admin.
  - Reads approved reviews for property where text_input IS NOT NULL; aggregate text for input to semantic/summary step.
  - Run screening gate (e.g. harm/slander/privacy check; MVP can be simple keyword or external moderation API).
  - Generate short, non-identifying summary (no verbatim user text, no names/unit numbers).
  - Upsert distilled_insights: insights_text, status = 'pending', screening_flags, last_generated_at; set screened = true if automated screening ran.
- Admin approves/rejects/hides via Slice 09; public page only selects status = 'approved'.

## RLS/Constraints notes
- Public SELECT only approved insights. Admin can read all and update status.

## Acceptance criteria checklist
- [ ] New or updated approved review text_input can trigger recompute; pending insight created or updated (`INS-01`, `INS-02`, `TST-09`)
- [ ] Pending insight does not appear on public property page (`INS-03`, `INS-04`, `TST-06`)
- [ ] Approved insight appears on property page (`AC-02`, `AC-05`)
- [ ] No raw user text is exposed publicly; only distilled summary (`NFR-PRIV-01`, `NFR-PRIV-02`)

## Test notes (manual smoke steps)
- Add approved review with text_input; run recompute; verify pending insight in admin. Approve insight; verify public property page shows it. Reject or hide; verify it no longer shows on public page.

## Out of scope
- Full background job infrastructure; MVP can use synchronous or manual-trigger recompute.
- Complex NLP; MVP can use simple summarization or placeholder text as long as screening and approval flow are in place.
