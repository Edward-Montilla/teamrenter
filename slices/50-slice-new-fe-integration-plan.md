# Slice 50 — New Frontend Integration: Documentation Update + Phased Implementation Plan

> **Note**: Slices 18 (UI design improvements) and 19 (mobile hamburger menu) are folded into this slice. Slice 18's scope (PageHeader, breadcrumbs, profile settings) is absorbed into Phase 2 and Phase 4. Slice 19's scope (hamburger menu, mobile nav drawer) is absorbed into Phase 6.

## Goal (demo in 1–3 minutes)

Align project documentation with the expanded product vision introduced by the New FE proposals (Business Portal and Facelift), then execute a phased integration that adopts the best UX patterns and feature ideas into the existing Next.js + Supabase architecture without abandoning SSR, auth, RLS, type safety, or the established design system.

## User story

As the development team, we need a single authoritative plan that reconciles the New FE proposals with the current app so we can expand into landlord-facing analytics and a richer consumer experience without framework fragmentation, schema drift, or duplicated codebases.

## What this slice covers

This is a cross-cutting planning and implementation slice. It spans documentation updates, schema evolution, design-system alignment, and frontend feature development across both public (renter) and business (landlord/manager) surfaces. It does not discard the New FE work — it extracts its value and integrates it properly.

The slice is organized into seven sequential phases:

1. Documentation reconciliation
2. Design-system unification
3. Schema and type evolution
4. Consumer UX adoption (Facelift patterns → Next.js)
5. Business Portal implementation (new route group in Next.js)
6. Shared infrastructure (API client, state management, a11y)
7. Cleanup and deprecation

---

## Phase 1 — Documentation Reconciliation

> **Status**: **Complete.** All documentation has been reconciled with PRD v2 scope. PDFs have been converted to Markdown as the canonical format.

### What this phase delivered

All project documentation was updated to reflect the expanded product scope before writing any code. Documentation is the source of truth — code follows docs, not the reverse.

### Completed deliverables

1. **PRD** — `proj_docs/PRD - Team Renter.tex` / `.pdf`
   - Landlord/property-manager persona and jobs-to-be-done documented
   - Two-sided marketplace model documented
   - Residency verification marked out of scope

2. **SRS v2.0** — `proj_docs/Software Requirements.md` (converted from PDF to Markdown)
   - Business Portal requirements: `FR-BP-01` through `FR-BP-10`
   - Consumer UX requirements: `FR-CX-01` through `FR-CX-05`
   - Five-metric model confirmed canonical; seven-category rejected (§2.6)
   - Non-functional requirements expanded: `NFR-A11Y-01`, `NFR-MOBILE-01`, `NFR-PERF-02/03`
   - Acceptance criteria: `AC-CX-01` through `AC-CX-05`, `AC-BP-01` through `AC-BP-10`

3. **Tech Spec v2.0** — `proj_docs/Tech Specs.md` (converted from PDF to Markdown)
   - Framework decision record: Next.js App Router only (TS-R-v2-FDR-01/02)
   - Portal route group architecture (§1.2)
   - Portal + consumer API contracts documented (§8.2–8.3): 6 portal + 4 consumer endpoints
   - Data layer principle: Supabase + RLS, no client-side queries for scoped data (TS-R-v2-SYS-01)
   - Portfolio scoping principle (§2.4)
   - Acceptance tests: TS-AT-v2-01 through TS-AT-v2-08

4. **Schema & ERD** — `proj_docs/Schema & ERD.md` (merged with `proj_docs/DB Schema Architecture - PRDv2.md`)
   - 8 new tables documented with full column specs and constraints
   - 2 altered tables (profiles role constraint, properties neighbourhood FK)
   - ~25 new RLS policies documented
   - 4 new helper functions, 3 new views
   - Full Mermaid ERD with all baseline + v2 entities

5. **Design tokens** — `proj_docs/UI Mockup/themes.md`
   - Palette 6 (navy/amber) added with full token mapping
   - Typography decision frozen: Playfair Display + Inter
   - Portal-specific tokens documented

6. **Security and access** — `docs/route-access-map.md`, `docs/security/rls.md`
   - All new routes, roles, and RLS policies documented
   - Landlord role and portfolio scoping documented

7. **Slice management** — `slices/00-index.md`, `slices/checklist.md`
   - Slice 50 added with phase grouping, dependency chain, and checklist
   - Slices 18/19 absorbed into Slice 50

8. **Decision records** — `proj_docs/SWOT - Rebuild vs Integrate.md`, `proj_docs/SWOT - Delete livedin and Restart.md`
   - Integration path chosen; rebuild rejected
   - Standing obstacles catalogued in `proj_docs/obstaclesV2.md`

9. **Architecture docs** — `livedin/ARCHITECTURE.md`, `livedin/README.md`, `implemented.md`
   - Portal and consumer UX expansion sections added
   - Current implementation status documented

### Acceptance criteria (all met)

- [x] PRD includes landlord persona and two-sided marketplace model
- [x] SRS includes `FR-BP-01` through `FR-BP-10` and `FR-CX-01` through `FR-CX-05`
- [x] SRS confirms the five-metric model and explicitly rejects the seven-category alternative
- [x] Tech Spec confirms Next.js as single framework and documents the `/portal` route group
- [x] Schema & ERD includes planned Business Portal and consumer feature tables (8 new + 2 altered)
- [x] `themes.md` documents the palette decision with full token mapping
- [x] `00-index.md` and `checklist.md` include Slice 50
- [x] All v2 documents converted from PDF to Markdown
- [x] Decision records and obstacles analysis completed

---

## Phase 2 — Design-System Unification

### Phase 2 scope

Resolve the three-way design-system conflict (documented palette vs `livedin` themes vs New FE navy/amber) into one coherent token system before building new screens.

### Phase 2 tasks

1. **Palette decision and token consolidation**
   - **Decision (frozen)**: The navy/amber direction from the New FE prototypes is adopted as Palette 6, added alongside existing Palettes 1–5. The multi-theme system is preserved.
   - Produce a single canonical token set that covers: page background, surface, primary accent, secondary accent, trust/verified, muted text, border, sidebar (portal), chart palette, and semantic status colors.
   - Implement Palette 6 CSS variables in `globals.css` following the token mapping documented in `themes.md`.

2. **Typography decision**
   - **Decision (frozen)**: Playfair Display (headings) + Inter (body) replaces Geist Sans as the canonical typography pairing. Geist Mono is retained for code/monospace content.
   - Implement the font loading change in `globals.css` and update `next/font/google` imports.

3. **Token enforcement**
   - Audit the New FE codebase for all inline hex values and `style={{}}` overrides.
   - Produce a mapping from every hardcoded color to its semantic token equivalent.
   - This mapping becomes the reference when porting New FE screens into the Next.js app.

4. **Component primitive inventory**
   - Inventory the `New FE/*/src/app/components/ui/` shadcn primitives against `livedin/components/ui/` and `livedin/lib/ui.ts`.
   - Identify which New FE primitives are net-new (not in `livedin`) and worth adopting.
   - Identify which are duplicates or superseded by existing `livedin` components.
   - Plan component additions as targeted installs via `shadcn/ui` CLI into `livedin`, not file copies from the New FE.

5. **Absorbed from Slice 18: PageHeader and breadcrumbs**
   - Add a `PageHeader` component with consistent h1, subtitle, and badge on every page.
   - Set matching browser title tags in "Page Name — LivedIn" format across all routes.
   - Wire Breadcrumbs component to all non-root routes with mobile-truncated behavior.

6. **Absorbed from Slice 18: Profile settings**
   - Build `/settings/profile` with read-only account info, editable display name, and embedded theme panel.
   - Add a settings entry point (link or avatar menu) in the signed-in header.

### Phase 2 deliverables

- A canonical design-token specification document
- A typography decision record
- An inline-color → token mapping table for the New FE codebase
- A component adoption plan (what to add to `livedin`, what to skip)

### Phase 2 acceptance criteria

- [ ] A single canonical token set exists and is documented
- [ ] Typography decision is made and documented
- [ ] Every hardcoded hex in the New FE codebase has a mapped semantic token
- [ ] Component adoption plan distinguishes net-new, duplicate, and superseded primitives
- [ ] No MUI, Emotion, or `next-themes` dependency is planned for adoption

---

## Phase 3 — Schema and Type Evolution

### Phase 3 scope

Extend the Supabase schema and `livedin/lib/types.ts` to support Business Portal and consumer features without breaking existing tables, RLS, or aggregate pipelines.

### Phase 3 tasks

1. **New migrations** (additive only — no destructive changes to existing tables)

   ```text
   20260403_slice50_neighbourhoods.sql
   20260403_slice50_user_shortlists.sql
   20260403_slice50_portfolio_properties.sql
   20260403_slice50_team_members.sql
   20260403_slice50_notification_preferences.sql
   20260403_slice50_review_responses.sql
   20260403_slice50_benchmark_averages.sql
   20260403_slice50_company_profiles.sql
   ```

2. **New role: `landlord`**
   - Add `'landlord'` to the `profiles.role` check constraint.
   - Add RLS policies: landlords can read their own portfolio properties and associated review/aggregate data.
   - Landlords cannot moderate reviews (that remains admin-only).
   - Landlords can create review response drafts (subject to admin approval).

3. **New types in `livedin/lib/types.ts`**
   - `PortfolioPropertyItem` — property + aggregates + funnel metrics for landlord dashboard
   - `BenchmarkData` — city/neighbourhood averages for comparison charts
   - `RenterSignal` — sentiment trend data point
   - `ReviewResponseDraft` — landlord response to a review
   - `TeamMemberItem` — team member with role and access scope
   - `NotificationPreference` — per-user notification settings
   - `NeighbourhoodListItem` and `NeighbourhoodDetail` — for consumer browsing
   - `UserShortlistItem` — saved property reference
   - `ComparisonPropertyItem` — property data shaped for side-by-side comparison

4. **New API routes** (documented contracts, not yet implemented)
   - `GET /api/portal/properties` — landlord's portfolio
   - `GET /api/portal/properties/[id]/analytics` — funnel metrics + category performance
   - `GET /api/portal/properties/[id]/reviews` — reviews for a specific property (landlord view)
   - `GET /api/portal/benchmarks` — city/neighbourhood averages
   - `GET /api/portal/signals` — renter sentiment trends
   - `POST /api/portal/reviews/[id]/respond` — draft a response
   - `GET /api/neighbourhoods` — public neighbourhood list
   - `GET /api/neighbourhoods/[id]` — neighbourhood detail with properties
   - `POST /api/user/shortlist` — add/remove shortlisted property
   - `GET /api/user/shortlist` — get user's shortlist

5. **Validation schemas**
   - Add `livedin/lib/validation/portal.ts` for Business Portal inputs.
   - Add `livedin/lib/validation/shortlist.ts` for consumer features.
   - Follow the existing half-star validation pattern from `livedin/lib/validation/review.ts`.

### Phase 3 deliverables

- Supabase migration files (tested via `supabase db reset`)
- Updated `types.ts` with all new data contracts
- API route contract documentation
- Validation schemas

### Phase 3 acceptance criteria

- [ ] All new migrations apply cleanly on top of existing migrations
- [ ] Existing tables, RLS policies, triggers, and aggregates are unchanged
- [ ] `landlord` role is added to profiles without breaking existing role checks
- [ ] New RLS policies enforce portfolio-scoped reads for landlords
- [ ] All new types are exported from `types.ts` and aligned with migration column names
- [ ] API route contracts are documented before implementation

---

## Phase 4 — Consumer UX Adoption (Facelift → Next.js)

### Phase 4 scope

Port the Facelift's best UX patterns into the existing Next.js app as new or improved page components, wired to real Supabase data through existing and new API routes.

### Phase 4 tasks

1. **Neighbourhood browsing**
   - Add `/neighbourhoods` and `/neighbourhoods/[id]` routes.
   - Create `NeighbourhoodCard` and `NeighbourhoodDetail` components.
   - Wire to `GET /api/neighbourhoods` and `GET /api/neighbourhoods/[id]`.
   - Include property counts, average scores, and featured properties per neighbourhood.

2. **Property comparison**
   - Add `/comparison` route.
   - Create `ComparisonTable` component using the Facelift's side-by-side layout as a reference.
   - Wire to existing `GET /api/properties` with comparison-specific query params.
   - Allow up to 3 properties compared simultaneously.

3. **Enhanced search**
   - Adopt the Facelift's filter sidebar pattern (price range, neighbourhood, property type, score range).
   - Add sort options (highest trust, most reviewed, recently added).
   - Persist filter/sort state in URL search params for shareability.

4. **Trust score badges and category breakdowns**
   - Create `TrustScoreBadge` and `CategoryScoreBar` components following the Facelift's visual pattern.
   - Wire to existing `PropertyAggregatePublic` data — use the five canonical metrics, not the Facelift's seven.
   - Add confidence indicators based on `review_count`.

5. **Multi-step review wizard improvements**
   - Adopt the Facelift's `StepProgress` and `motion` transition patterns.
   - Integrate into the existing `/submit-review/[propertyId]` flow.
   - Preserve all existing validation, gating, and rate-limit logic.

6. **Renter dashboard**
   - Add `/dashboard` route (auth-gated).
   - Show user's submitted reviews and their statuses.
   - Show shortlisted properties with `UserShortlistItem` data.
   - Wire shortlist add/remove to `POST /api/user/shortlist`.

7. **Shortlist functionality**
   - Add heart/bookmark button to `PropertyCard` components.
   - Persist shortlist in the database for signed-in users.
   - Use optimistic UI updates with error rollback.

### Phase 4 implementation direction

- Build each feature as a server component where possible (neighbourhood pages, comparison page).
- Use client components only for interactive elements (filters, shortlist toggles, wizard transitions).
- Reuse existing `livedin/lib/ui.ts` class helpers and the unified token system from Phase 2.
- Do not copy Facelift components wholesale — rewrite against the canonical types and design tokens.

### Phase 4 screens in scope

| Route | Source inspiration | Data source |
| --- | --- | --- |
| `/neighbourhoods` | `Facelift/pages/NeighbourhoodsPage.tsx` | `GET /api/neighbourhoods` |
| `/neighbourhoods/[id]` | `Facelift/pages/NeighbourhoodPage.tsx` | `GET /api/neighbourhoods/[id]` |
| `/comparison` | `Facelift/pages/ComparisonPage.tsx` | `GET /api/properties` |
| `/` (enhanced) | `Facelift/pages/HomePage.tsx` | Existing + filters |
| `/properties/[id]` (enhanced) | `Facelift/pages/PropertyProfilePage.tsx` | Existing + `TrustScoreBadge` |
| `/submit-review/[propertyId]` (enhanced) | `Facelift/pages/WriteReviewPage.tsx` | Existing flow + `motion` |
| `/dashboard` | `Facelift/pages/DashboardPage.tsx` | New user APIs |

### Phase 4 acceptance criteria

- [ ] `/neighbourhoods` renders real neighbourhood data with property counts and average scores
- [ ] `/comparison` allows side-by-side comparison of up to 3 properties using the five canonical metrics
- [ ] Search supports filters (neighbourhood, score range) and sort, with state persisted in URL params
- [ ] `TrustScoreBadge` and `CategoryScoreBar` render from `PropertyAggregatePublic` data
- [ ] Review wizard uses step progress and animated transitions without breaking validation or gating
- [ ] `/dashboard` shows user's reviews and shortlisted properties behind auth gate
- [ ] Shortlist persists to database and survives navigation/refresh

---

## Phase 5 — Business Portal Implementation

### Phase 5 scope

Build the landlord/property-manager portal as a new Next.js route group with its own layout, auth guard, and API routes — all within the existing `livedin` app.

### Phase 5 tasks

1. **Portal layout and auth**
   - Create `livedin/app/portal/layout.tsx` with sidebar navigation.
   - Implement `getLandlordFromRequest` auth helper (parallel to `getAdminFromRequest`).
   - Gate all `/portal` routes to users with `landlord` or `admin` role.
   - Add a portal entry point in the signed-in public header for landlord users.

2. **Portfolio dashboard** (`/portal`)
   - Port the Business Portal's `dashboard.tsx` visual pattern.
   - Wire to `GET /api/portal/properties` for real portfolio data.
   - Show property cards with trust scores, review counts, and trend indicators.
   - Link cards to property-specific analytics.

3. **Review feed** (`/portal/reviews`)
   - Port the Business Portal's `review-feed.tsx` pattern.
   - Wire to `GET /api/portal/properties/[id]/reviews`.
   - Support filtering by property, date range, and rating.
   - Allow landlords to draft responses (subject to admin approval).

4. **Analytics screens**
   - `/portal/performance` — category performance charts (Recharts, wired to real aggregate data).
   - `/portal/benchmarks` — benchmark comparison against city averages.
   - `/portal/signals` — renter sentiment trends.
   - All wire to new `/api/portal/*` endpoints.

5. **Review gap alerts** (`/portal/alerts`)
   - Port the Business Portal's `review-gap-alerts.tsx`.
   - Calculate review gaps from real portfolio data.
   - Generate shareable invite links for tenants.

6. **Team management** (`/portal/team`)
   - Port the Business Portal's `team-access.tsx`.
   - Wire to team member CRUD via new API routes.
   - Implement role-based access within the portal (viewer, editor, admin).

7. **Company profile and settings**
   - `/portal/profile` — company profile management.
   - `/portal/settings` — notification preferences.
   - Wire to profile and notification preference APIs.

### Phase 5 implementation direction

- Follow the existing admin area pattern: layout with sidebar, client layout for auth gating, `portalFetch` helper analogous to `adminFetch`.
- Use Recharts for analytics (already a dependency in the New FE; add to `livedin` if not present).
- Audit every Business Portal component for inline hex values and replace with canonical tokens.
- Do not port `mock-data.ts` — all data comes from API routes backed by Supabase.

### Phase 5 screens in scope

| Route | Source inspiration | Data source |
| --- | --- | --- |
| `/portal` | `Business Portal/dashboard.tsx` | `GET /api/portal/properties` |
| `/portal/reviews` | `Business Portal/review-feed.tsx` | `GET /api/portal/properties/[id]/reviews` |
| `/portal/moderation` | `Business Portal/moderation-queue.tsx` | Existing admin moderation APIs (scoped) |
| `/portal/performance` | `Business Portal/category-performance.tsx` | `GET /api/portal/properties/[id]/analytics` |
| `/portal/benchmarks` | `Business Portal/benchmark-comparison.tsx` | `GET /api/portal/benchmarks` |
| `/portal/signals` | `Business Portal/renter-signals.tsx` | `GET /api/portal/signals` |
| `/portal/alerts` | `Business Portal/review-gap-alerts.tsx` | Computed from portfolio data |
| `/portal/team` | `Business Portal/team-access.tsx` | New team CRUD APIs |
| `/portal/profile` | `Business Portal/company-profile.tsx` | New profile APIs |
| `/portal/settings` | `Business Portal/notification-settings.tsx` | New notification APIs |

### Phase 5 acceptance criteria

- [ ] `/portal` layout renders sidebar navigation with all portal routes
- [ ] All `/portal` routes are gated to `landlord` or `admin` role
- [ ] Dashboard shows real portfolio properties with trust scores and review counts
- [ ] Review feed loads real reviews filterable by property and date
- [ ] Analytics charts render from real aggregate data, not mock arrays
- [ ] Benchmark comparison shows real city/neighbourhood averages
- [ ] Team management supports invite, role change, and removal
- [ ] All portal API routes enforce landlord ownership scoping via RLS

---

## Phase 6 — Shared Infrastructure

### Phase 6 scope

Address cross-cutting concerns that improve all surfaces: API client patterns, global state where needed, accessibility, and mobile responsiveness.

### Phase 6 tasks

1. **API client layer**
   - Create `livedin/lib/portal-client.ts` (analogous to `admin-client.ts`) with auth-aware fetch wrapper.
   - Consider adopting React Query / SWR for portal and dashboard screens that benefit from caching, revalidation, and optimistic updates.
   - Document the pattern decision (manual fetch vs data-fetching library) for consistency.

2. **Global state for cross-page concerns**
   - Evaluate whether shortlist, comparison selection, and portal context need a lightweight store (Zustand or React Context).
   - If adopted, keep it minimal — shortlist IDs, active comparison set, portal property selection.
   - Persist to URL params where possible (comparison, filters) and to the database where required (shortlist).

3. **Accessibility audit**
   - Audit all new screens against WCAG 2.1 AA.
   - Ensure all interactive elements have accessible names.
   - Ensure all form inputs have associated labels.
   - Ensure color contrast meets 4.5:1 for text, 3:1 for large text and UI components.
   - Add `aria-live` regions for dynamic content updates (shortlist toggles, filter results).
   - Ensure keyboard navigation works for all portal sidebar items, dashboard cards, and chart interactions.

4. **Mobile responsiveness**
   - Ensure the portal sidebar collapses to a drawer on mobile (unlike the New FE's fixed `w-64`).
   - Apply existing Slice 19 hamburger menu pattern to portal layout.
   - Ensure comparison table scrolls horizontally on mobile with sticky property headers.
   - Ensure neighbourhood grid is responsive with appropriate breakpoints.

5. **Error boundaries and loading states**
   - Add React error boundaries to portal route segments.
   - Implement Suspense boundaries with skeleton loading for data-dependent sections.
   - Follow the existing `UiListState` / `UiSurfaceState` patterns from `types.ts`.

6. **Absorbed from Slice 19: Hamburger menu and mobile nav drawer**
   - Build `HamburgerButton` with 44x44 px touch target and bar-to-x morph animation.
   - Build `MobileNavDrawer` with role-aware links, focus trap, and close-on-navigate behavior.
   - Make `PublicSiteHeader` fully responsive: hamburger on mobile/tablet, links on desktop.
   - Apply the same hamburger-first pattern to the portal header/sidebar.
   - Audit and fix touch targets across key flows to meet 44x44 px minimum.

### Phase 6 acceptance criteria

- [ ] Portal API client handles auth tokens, error responses, and session expiry consistently
- [ ] Cross-page state (if any) is minimal, documented, and does not duplicate server state
- [ ] All new screens pass WCAG 2.1 AA automated checks (axe-core or equivalent)
- [ ] All form inputs have programmatically associated labels
- [ ] Portal sidebar collapses to a mobile drawer at the `md` breakpoint
- [ ] Comparison table is usable on mobile viewports
- [ ] Error boundaries catch and display recoverable errors without full-page crashes

---

## Phase 7 — Cleanup and Deprecation

### Phase 7 scope

Remove the New FE prototypes from the repository, clean up the broken root SPA stub, and ensure no dead code or unused dependencies remain.

### Phase 7 tasks

1. **Remove `New FE/` directory**
   - Once all valuable patterns are ported, remove `New FE/Business Portal/` and `New FE/Facelift/` from the repo.
   - Archive the directory in a separate branch (`archive/new-fe-prototypes`) for reference if needed.

2. **Remove root SPA stub**
   - Delete `/index.html` and `/src/main.tsx` — these reference missing files and will never build.

3. **Dependency audit on `livedin/package.json`**
   - Confirm no MUI, Emotion, `next-themes`, `canvas-confetti`, `react-dnd`, `react-slick`, or `react-responsive-masonry` dependencies were inadvertently added.
   - Add only the dependencies actually used by ported features (Recharts, Motion if adopted, etc.).
   - Run `npm ls --all` to verify no phantom peer dependency warnings.

4. **Lint and type-check pass**
   - Add `"lint"` and `"typecheck"` scripts to `livedin/package.json` if not present.
   - Run full lint and type-check; fix all errors introduced by Phases 3–6.
   - Ensure no unused imports remain.

5. **Update `livedin/ARCHITECTURE.md` and `livedin/README.md`**
   - Document the portal route group, new API routes, landlord role, and consumer features.
   - Update the folder map to reflect new directories.
   - Remove references to the New FE prototypes.

6. **Update `slices/checklist.md`**
   - Mark all Slice 50 phases as complete.

### Phase 7 acceptance criteria

- [ ] `New FE/` directory is removed from `main` (archived on a separate branch)
- [ ] Root `index.html` and `src/main.tsx` are removed
- [ ] `livedin/package.json` contains no unused dependencies
- [ ] `npm run lint` and `npm run typecheck` pass with zero errors
- [ ] `ARCHITECTURE.md` and `README.md` reflect the expanded app structure
- [ ] `checklist.md` Slice 50 items are all checked

---

## DB tasks (Supabase)

- Phase 3 migrations (8 new tables): `neighbourhoods`, `user_shortlists`, `portfolio_properties`, `team_members`, `notification_preferences`, `review_response_drafts`, `benchmark_averages`, `company_profiles`.
- Altered tables (2): `profiles` (add `landlord` to role CHECK), `properties` (add `neighbourhood_id` FK).
- New helper functions (4): `is_landlord()`, `is_portfolio_member()`, `recompute_neighbourhood_aggregates()`, `recompute_benchmark_averages()`.
- New views (3): `v_portfolio_overview`, `v_neighbourhood_browse`, `v_review_with_response`.
- RLS policies (~25 new): per `docs/security/rls.md` and `proj_docs/Schema & ERD.md` Part 2.
- No destructive changes to existing tables, triggers, aggregate functions, or RLS policies.
- Full schema spec: `proj_docs/Schema & ERD.md` Part 2.

## Integration tasks

- Phase 4–5: implement all new API routes under `livedin/app/api/portal/`, `livedin/app/api/neighbourhoods/`, and `livedin/app/api/user/`.
- Reuse existing `getSupabaseServerClient` and auth patterns.
- Add `getLandlordFromRequest` auth helper for portal routes.
- Add audit logging for portal-initiated actions (review responses, team changes).

## Data contracts

All new types are defined in Phase 3 and follow existing patterns in `livedin/lib/types.ts`. Key additions:

```ts
type PortfolioPropertyItem = {
  id: string;
  display_name: string;
  address_line1: string;
  city: string;
  province: string;
  trustscore_display_0_5: DisplayScore0_5;
  review_count: number;
  vacancy_status: "occupied" | "vacant" | "unknown";
  trend: "improving" | "stable" | "declining";
  page_views_30d: number;
  profile_visits_30d: number;
  conversion_rate: number;
};

type NeighbourhoodListItem = {
  id: string;
  name: string;
  city: string;
  property_count: number;
  avg_trustscore_0_5: DisplayScore0_5;
};

type UserShortlistItem = {
  property_id: string;
  display_name: string;
  address_line1: string;
  city: string;
  trustscore_display_0_5: DisplayScore0_5;
  added_at: string;
};

type ComparisonPropertyItem = PropertyDetailPublic & {
  neighbourhood: string;
};
```

## RLS / constraints notes

- All new tables must have RLS enabled from creation.
- Landlord-scoped reads: landlords can only read properties linked to them via `portfolio_properties`.
- Team member access inherits the landlord's portfolio scope.
- Review response drafts are visible to the authoring landlord and admins only; approved responses become public.
- User shortlists are private to the owning user.
- No changes to existing public, verified, or admin RLS policies.

## Dependency chain

```text
Phase 1 (docs) → Phase 2 (design tokens) → Phase 3 (schema + types)
Phase 3 → Phase 4 (consumer UX) + Phase 5 (business portal)  [parallel]
Phase 4 + Phase 5 → Phase 6 (shared infrastructure)
Phase 6 → Phase 7 (cleanup)
```

Phases 4 and 5 can execute in parallel once Phase 3 is complete. Phase 6 runs after both are functionally complete. Phase 7 is the final cleanup gate.

## Related documentation

- PRD v2: `proj_docs/PRD - Team Renter.tex` / `proj_docs/PRD - Team Renter.pdf`
- SRS v2: `proj_docs/Software Requirements.md` (Markdown canonical — v2.0)
- Tech Spec v2: `proj_docs/Tech Specs.md` (Markdown canonical — v2.0)
- Schema & ERD v2: `proj_docs/Schema & ERD.md` (Markdown canonical — merged with `DB Schema Architecture - PRDv2.md`)
- DB Schema Architecture: `proj_docs/DB Schema Architecture - PRDv2.md` (retained for reference; canonical is `Schema & ERD.md`)
- Design tokens: `proj_docs/UI Mockup/themes.md`
- Route access map: `docs/route-access-map.md` (includes all baseline + PRD v2 routes and roles)
- RLS policies: `docs/security/rls.md` (includes all baseline + PRD v2 policies)
- Decision records: `proj_docs/SWOT - Rebuild vs Integrate.md`, `proj_docs/SWOT - Delete livedin and Restart.md`
- Obstacles: `proj_docs/obstaclesV2.md`
- Dependency graph: `proj_docs/mermaidV2.md`
- Implementation status: `implemented.md`
- Architecture onboarding: `livedin/ARCHITECTURE.md` (§11–12 cover planned portal + consumer UX)

## Risk mitigations

| Risk | Mitigation | Status |
| --- | --- | --- |
| Schema drift between New FE types and DB | Phase 1 freezes the five-metric model in documentation before any code changes | **Mitigated** — five-metric canonical in SRS §2.6 |
| Design-system fragmentation | Phase 2 resolves palette/typography conflicts before building screens | Pending Phase 2 |
| Framework divergence | Decision to stay on Next.js is documented in Phase 1; no Vite/React Router code is ported | **Mitigated** — Tech Spec TS-R-v2-FDR-01/02 |
| Scope creep from porting all New FE features | Each phase has explicit acceptance criteria; features are adopted by pattern, not by file copy | Active |
| Breaking existing functionality | Phase 3 migrations are additive only; existing tables, RLS, and triggers are untouched | Active |
| Maintenance burden of parallel codebases | Phase 7 removes the New FE directory after porting is complete | Pending Phase 7 |
| PDF-only docs blocking collaboration | Phase 1 converted all v2 docs to Markdown | **Mitigated** — obstaclesV2 §9 resolved |

## Test notes (manual smoke steps per phase)

1. **Phase 1:** ~~Review updated docs for internal consistency; confirm five-metric model is stated as canonical; confirm framework decision is documented.~~ **Done** — SRS §2.6, Tech Spec §0.
2. **Phase 2:** Apply the unified token set to one existing page and one New FE-inspired page; verify visual consistency.
3. **Phase 3:** Run `supabase db reset`; verify all migrations apply cleanly; insert test data into new tables; verify RLS denies cross-landlord reads.
4. **Phase 4:** Navigate `/neighbourhoods`, `/comparison`, and `/dashboard`; verify real data renders; verify shortlist persists across navigation.
5. **Phase 5:** Sign in as landlord; navigate `/portal`; verify dashboard loads portfolio data; verify analytics charts render; verify team management CRUD works.
6. **Phase 6:** Run axe-core on all new pages; verify portal sidebar collapses on mobile; verify error boundaries catch simulated API failures.
7. **Phase 7:** Verify `New FE/` and root stub are gone; verify `npm run lint && npm run typecheck` pass; verify `ARCHITECTURE.md` is current.

## Out of scope

- Implementing the New FE as standalone Vite SPAs alongside the Next.js app
- Adopting the seven-category rating model from the New FE mock data
- Adopting MUI, Emotion, or any Figma export artifact dependencies
- Building a real-time notification delivery system (email/push infrastructure)
- Proof-of-residency or document verification features
- Payment processing for landlord subscriptions (business model, not technical scope)
- Replacing the existing admin area with the Business Portal's moderation features (admin remains separate)
