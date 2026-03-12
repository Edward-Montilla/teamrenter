# Vertical Slice Plan (MVP)

## Ordering Rule

Frontend-first (mock data) -> DB (Supabase) -> Integration (wire-up)

## Source of Truth

- Product docs:
  - `proj_docs/PRD - Team Renter.docx.pdf`
  - `proj_docs/Software Requirements.pdf`
  - `proj_docs/Tech Specs.pdf`
  - `proj_docs/ Schema & ERD.pdf`
- UI mockups:
  - `proj_docs/UI Mockup/Rental Review Platform UI Mockups.png` (Frame 1: Landing/Home)
  - `proj_docs/UI Mockup/Rental Review Platform UI Mockups-1.png` (Frame 2: Search Results)
  - `proj_docs/UI Mockup/Rental Review Platform UI Mockups-2.png` (Frame 3: Property Detail)
  - `proj_docs/UI Mockup/Rental Review Platform UI Mockups-3.png` (Frame 4: Review Address)
  - `proj_docs/UI Mockup/Rental Review Platform UI Mockups-4.png` (Frame 5: Review Form)
  - `proj_docs/UI Mockup/Rental Review Platform UI Mockups-5.png` (Frame 6: Review Done)

## Cross-Slice Decisions (Frozen)

- Routes: `/`, `/properties/[id]`, `/submit-review/[propertyId]`, `/admin/*`
- Rating display mapping:
  - `display_0_6 = round((avg_0_5 / 5.0) * 6.0)`
  - If `review_count == 0`, display score is `0`
- Public never sees raw `reviews.text_input`
- Moderation defaults:
  - New reviews start as `pending`
  - New distilled insights start as `pending`

## Ordered Slices

1. `01` Public browse/search
2. `02` Property detail
3. `03` Review form (gated states)
4. `04` DB foundation (schema/constraints/triggers/aggregates)
5. `05` RLS + roles + security model
6. `06` Integration: public reads
7. `07` Integration: review submission + aggregates refresh
8. `08` Admin: properties CRUD
9. `09` Admin: moderation + audit
10. `10` Distilled insights pipeline + screening/approval flow
11. `11` Optional: photos via R2 + metadata
12. `12` Authentication (sign-in/sign-up + Google OAuth)
13. `13` Site-wide UI/UX polish + accessibility
14. `14` Admin access request path
15. `15` Gestalt-inspired UI system
16. `16` Mobile-first UX polish
17. `17` Admin command center
20. `20` NLP semantic renter feedback

## Phase Grouping

- Frontend-first: `01-03`
- DB/security foundation: `04-05`
- Integration/admin/optional: `06-11`
- Auth: `12` (can follow `05`; replaces mock auth in `03`/`07`)
- UI/UX polish: `13` (best after `06-12`, when real states and flows exist)
- Access request / role elevation: `14` (best after `05`, `09`, and `12`)
- UX refinements: `15-16`
- Admin consolidation: `17` (best after `08`, `09`, `12`, and `14`)
- AI enrichment: `20` (best after `07`, `09`, and `10`, when approved review text and insight moderation already exist)

## Dependency Chain

- `01` -> `02` -> `03` (UI-first vertical slices with mock contracts)
- `03` + frozen docs -> `04` (schema and constraints mirror mocked form contracts)
- `04` -> `05` (RLS policies applied on finalized entities/functions)
- `01-05` -> `06` (replace public mocks with Supabase reads)
- `03-05` -> `07` (wire verified review submit with DB enforcement)
- `05` -> `12` (auth uses profiles + RLS; real session replaces mocks in `03`/`07`)
- `05` -> `08` + `09` (admin flows require role/RLS)
- `07` + `09` -> `10` (insight recompute and moderation workflow)
- `08` + `05` -> `11` (optional R2 uploads and safe public display)
- `06-12` -> `13` (polish real public, auth, review, and admin journeys once they are wired)
- `05` + `09` + `12` -> `14` (request flow depends on auth, role enforcement, and an admin review surface)
- `08` + `09` + `12` + `14` -> `17` (consolidated admin workspace depends on working property CRUD, moderation, auth, and admin entry points)
- `07` + `09` + `10` -> `20` (semantic renter feedback depends on approved review text, moderation, and the earlier distilled-insights pipeline)
