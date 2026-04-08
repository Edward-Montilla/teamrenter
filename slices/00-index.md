# Vertical Slice Plan (MVP → PRD v2)

## Ordering Rule

Frontend-first (mock data) -> DB (Supabase) -> Integration (wire-up)

## Source of Truth

- Product docs (v2 — Markdown canonical, PDFs archived):
  - `proj_docs/PRD - Team Renter.tex` / `proj_docs/PRD - Team Renter.pdf`
  - `proj_docs/Software Requirements.md` (SRS v2.0)
  - `proj_docs/Tech Specs.md` (Tech Spec v2.0)
  - `proj_docs/Schema & ERD.md` (authoritative; merged with `proj_docs/DB Schema Architecture - PRDv2.md`)
- Decision records and analysis:
  - `proj_docs/SWOT - Rebuild vs Integrate.md` (decision: integration path chosen)
  - `proj_docs/SWOT - Delete livedin and Restart.md` (decision: restart rejected)
  - `proj_docs/obstaclesV2.md` (standing obstacles analysis)
  - `proj_docs/mermaidV2.md` (dependency graph)
- Security and access:
  - `docs/route-access-map.md` (page + API route matrix, all roles)
  - `docs/security/rls.md` (RLS policies, baseline + PRD v2)
- UI design:
  - `proj_docs/UI Mockup/themes.md` (palette system, Palette 6, typography decisions)
  - `proj_docs/UI Mockup/Rental Review Platform UI Mockups.png` (Frame 1: Landing/Home)
  - `proj_docs/UI Mockup/Rental Review Platform UI Mockups-1.png` (Frame 2: Search Results)
  - `proj_docs/UI Mockup/Rental Review Platform UI Mockups-2.png` (Frame 3: Property Detail)
  - `proj_docs/UI Mockup/Rental Review Platform UI Mockups-3.png` (Frame 4: Review Address)
  - `proj_docs/UI Mockup/Rental Review Platform UI Mockups-4.png` (Frame 5: Review Form)
  - `proj_docs/UI Mockup/Rental Review Platform UI Mockups-5.png` (Frame 6: Review Done)
- Implementation reference:
  - `implemented.md` (current build status)
  - `livedin/ARCHITECTURE.md` (onboarding + planned portal/consumer sections)

## Cross-Slice Decisions (Frozen)

- Routes (baseline): `/`, `/properties/[id]`, `/submit-review/[propertyId]`, `/admin/*`
- Routes (PRD v2): `/portal/*`, `/dashboard`, `/neighbourhoods`, `/neighbourhoods/[id]`, `/comparison`, `/settings/profile`
- Rating display mapping:
  - Production uses `display_*_0_5` (half-star 0–5 scale); the PDF-era `display_0_6` spec is superseded by migration `20260311123000_scale_public_scores_to_5.sql`
  - If `review_count == 0`, display score is `0`
- Public never sees raw `reviews.text_input`; landlord portal APIs also exclude `text_input` (SRS §5.2 NFR-PRIV-03)
- Moderation defaults:
  - New reviews start as `pending`
  - New distilled insights start as `pending`
  - Landlord review responses start as `pending` (admin approval required before public display)
- Five-metric model (`management_responsiveness`, `maintenance_timeliness`, `listing_accuracy`, `fee_transparency`, `lease_clarity`) is canonical. Seven-category alternative from New FE prototypes rejected (SRS §2.6).
- Next.js App Router is the single framework for all surfaces (public, business portal, admin). Vite + React Router prototypes are design references only (Tech Spec §0 TS-R-v2-FDR-01/02).
- Typography: Playfair Display (headings) + Inter (body) is the canonical pairing. Geist Mono retained for code.
- Multi-theme palette system: Palettes 1–5 retained, Palette 6 (navy/amber) added from New FE prototypes.
- Data layer: Supabase Postgres + RLS is the single data layer; portal and dashboard must not use direct client-side Supabase for scoped data (Tech Spec §1.1 TS-R-v2-SYS-01).
- Portfolio scoping: `portfolio_properties` is the pivot table for all Business Portal queries; team members inherit scope via `team_members.owner_user_id` (Tech Spec §2.4).
- Roles: `public`, `verified`, `admin` (baseline) + `landlord` (PRD v2). Landlords access `/portal/*` only; team delegation via `team_members`.

## Ordered Slices

1. `01` Public browse/search — **complete**
2. `02` Property detail — **complete**
3. `03` Review form (gated states) — **complete**
4. `04` DB foundation (schema/constraints/triggers/aggregates) — **complete**
5. `05` RLS + roles + security model — **complete**
6. `06` Integration: public reads — **complete**
7. `07` Integration: review submission + aggregates refresh — **complete**
8. `08` Admin: properties CRUD — **complete**
9. `09` Admin: moderation + audit — **complete**
10. `10` Distilled insights pipeline + screening/approval flow — **complete**
11. `11` Optional: photos via R2 + metadata — **partial** (DB done; upload + public display outstanding)
12. `12` Authentication (sign-in/sign-up + Google OAuth) — **complete**
13. `13` Site-wide UI/UX polish + accessibility — **complete**
14. `14` Admin access request path — **complete**
15. `15` Gestalt-inspired UI system — **complete** (docs only)
16. `16` Mobile-first UX polish — **complete** (docs only)
17. `17` Admin command center — **complete**
18. `18` UI design improvements — **absorbed into Slice 50** Phase 2 + Phase 4
19. `19` Mobile hamburger menu — **absorbed into Slice 50** Phase 6
20. `20` NLP semantic renter feedback — **pending** (independent of Slice 50)
21. `50` New FE integration — **Phase 1 complete**; Phases 2–7 pending (design → schema → consumer UX → business portal → infrastructure → cleanup; absorbs slices 18 and 19)

## Phase Grouping

- Frontend-first: `01-03` — **all complete**
- DB/security foundation: `04-05` — **all complete**
- Integration/admin/optional: `06-11` — **06-10 complete; 11 partial**
- Auth: `12` — **complete**
- UI/UX polish: `13` — **complete**
- Access request / role elevation: `14` — **complete**
- UX refinements: `15-16` — **complete** (docs only)
- Admin consolidation: `17` — **complete**
- AI enrichment: `20` — **pending** (independent; best after `07`, `09`, and `10`)
- Absorbed into 50: `18`, `19` (UI improvements and mobile hamburger folded into Slice 50 Phases 2, 4, and 6)
- New FE integration: `50` — **Phase 1 complete** (docs → design → schema → consumer UX → business portal → infrastructure → cleanup)

## Dependency Chain

- `01` -> `02` -> `03` (UI-first vertical slices with mock contracts) — **done**
- `03` + frozen docs -> `04` (schema and constraints mirror mocked form contracts) — **done**
- `04` -> `05` (RLS policies applied on finalized entities/functions) — **done**
- `01-05` -> `06` (replace public mocks with Supabase reads) — **done**
- `03-05` -> `07` (wire verified review submit with DB enforcement) — **done**
- `05` -> `12` (auth uses profiles + RLS; real session replaces mocks in `03`/`07`) — **done**
- `05` -> `08` + `09` (admin flows require role/RLS) — **done**
- `07` + `09` -> `10` (insight recompute and moderation workflow) — **done**
- `08` + `05` -> `11` (optional R2 uploads and safe public display) — **partial**
- `06-12` -> `13` (polish real public, auth, review, and admin journeys once they are wired) — **done**
- `05` + `09` + `12` -> `14` (request flow depends on auth, role enforcement, and an admin review surface) — **done**
- `08` + `09` + `12` + `14` -> `17` (consolidated admin workspace depends on working property CRUD, moderation, auth, and admin entry points) — **done**
- `07` + `09` + `10` -> `20` (semantic renter feedback depends on approved review text, moderation, and the earlier distilled-insights pipeline) — **pending**
- `01-17` -> `50` (Slice 50 depends on existing foundation being complete) — **foundation ready; Phase 1 complete**
- `50` internal: Phase 1 (done) → Phase 2 → Phase 3 → Phase 4 + Phase 5 (parallel) → Phase 6 → Phase 7
- `18` and `19` are folded into Slice 50 Phases 2, 4, and 6 respectively

## Bootstrappable Assets (Do NOT Reimplement)

The following implemented features and infrastructure carry forward into PRD v2 without modification:

- **Supabase schema** (13 migrations): profiles, properties, reviews, property_aggregates, distilled_insights, property_photos, admin_audit_log, admin_role_requests, admin_bootstrap_allowlist — all with RLS, triggers, and aggregate functions
- **Auth system**: email/password + Google OAuth, session management, profile sync, role gating, email verification
- **Admin console**: properties CRUD, review/insight moderation, audit log, access request review, admin command center
- **Public experience**: property search/browse, property detail with trust scores, review submission flow with gating
- **API routes** (20): properties, reviews, admin CRUD, moderation, insights, audit, access requests, photos
- **RLS policies**: public, verified, admin — all tested via `rls:test` smoke test
- **Design system**: shadcn/ui primitives, Tailwind CSS, multi-theme palette (5 palettes), `lib/ui.ts` helpers
- **Type system**: `livedin/lib/types.ts` with display-score types, form types, API response types
