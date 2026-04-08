# Project Checklist

Checked items are already implemented or documented in the repo. Unchecked items are still outstanding.

> **Last updated:** April 2026 — Phase 1 of Slice 50 is complete. All v2 documentation has been converted from PDF to Markdown and reconciled. See `proj_docs/obstaclesV2.md` for standing obstacles.

## Core Product Slices

### Slice 01 — Public browse/search

[x] Build `/` with hero content, search input, and a clear review CTA
[x] Render searchable property cards with loading, empty, and error states
[x] Let users open a property from the browse results

### Slice 02 — Property detail

[x] Build `/properties/[id]` for public property detail
[x] Show trust score, rating breakdown, review count, and confidence cues
[x] Show approved distilled insights only, with helpful no-review and no-insight states
[x] Keep raw review text out of the public detail page

### Slice 03 — Review form and gated states

[x] Build `/submit-review/[propertyId]` as a guided multi-step flow
[x] Support property selection, structured ratings, optional private notes, and tenancy dates
[x] Show gated states for signed-out, unverified, already-reviewed, and rate-limited users
[x] Show a submission confirmation state with next-step actions

### Slice 04 — DB foundation

[x] Create the core schema for profiles, properties, reviews, aggregates, insights, audit log, and optional photo metadata
[x] Add database constraints for review validation, uniqueness, and tenancy dates
[x] Add aggregate-refresh logic so approved moderation state drives public scores

### Slice 05 — RLS, roles, and security

[x] Enable RLS on the core public and admin tables
[x] Restrict public reads to safe fields and safe statuses only
[x] Gate review creation to verified users and admin actions to admins
[x] Keep private review text and admin audit data out of public access paths

### Slice 06 — Public reads wired to Supabase

[x] Replace mocked browse data with DB-backed public property reads
[x] Replace mocked property detail data with DB-backed property, aggregate, and approved insight reads
[x] Keep public routes free of raw review queries and private text exposure

### Slice 07 — Review submission integration

[x] Wire review submission to a real backend endpoint
[x] Insert new reviews as `pending` instead of changing public scores immediately
[x] Return clear auth and constraint-driven outcomes for submit failures
[x] Keep aggregate refresh tied to later admin approval

### Slice 08 — Admin properties CRUD

[x] Build `/admin/properties` with property listing, status, and actions
[x] Let admins create, edit, activate, and deactivate properties
[x] Keep non-admin users blocked from property-admin routes and actions
[x] Ensure only active properties appear in public browse flows

### Slice 09 — Admin moderation and audit

[x] Build `/admin/reviews` moderation tools with private review text visible to admins only
[x] Let admins approve, reject, remove, and reset review status
[x] Build `/admin/insights` moderation tools for approve, reject, hide, and recompute flows
[x] Record admin moderation and property actions in the audit log
[x] Recompute public aggregates when review moderation changes

### Slice 10 — Distilled insights pipeline

[x] Store distilled insights with moderation status
[x] Generate or recompute pending insights from approved review text
[x] Let admins review and publish insight summaries
[x] Show only approved insight summaries on public property pages

### Slice 11 — Optional photos via R2

[x] Lay DB groundwork for optional property photo metadata
[ ] Add admin photo upload to Cloudflare R2
[ ] Save photo metadata and safe public delivery URLs
[ ] Render uploaded property photos on the public property page

### Slice 12 — Authentication

[x] Add `/sign-in` with Google OAuth and email/password auth flows
[x] Support sign-up, sign-in, sign-out, and redirect back to the user's target flow
[x] Sync authenticated users into `public.profiles`
[x] Use real auth state in gated review and admin flows

### Slice 13 — Site-wide UI/UX polish

[x] Apply consistent page layout, CTA hierarchy, and shared feedback surfaces across public, auth, review, and admin pages
[x] Improve search, detail, sign-in, review, and admin usability
[x] Keep key flows responsive and keyboard/focus friendly

### Slice 14 — Admin access request path

[x] Add `/signup/request-admin` for authenticated, eligible users
[x] Add `admin_role_requests` persistence and request-status handling
[x] Prevent self-promotion and require explicit admin review or bootstrap flow
[x] Add admin review tooling for access requests and role promotion
[x] Record request review metadata and enforce one active request path

### Slice 15 — Gestalt-inspired UI system

[x] Write the planning spec for a Gestalt-inspired design system
[x] Cover public, auth, theme, review, and admin surfaces in the spec
[x] Keep this slice documentation-only with no required backend changes

### Slice 16 — Mobile-first UX polish

[x] Write the planning spec for mobile-first browse, detail, review, sign-in, and admin-access flows
[x] Define mobile priorities, before-scroll content, and progressive disclosure rules
[x] Keep this slice documentation-only with no required backend changes

### Slice 17 — Admin command center

[x] Add `/admin` as the consolidated admin landing page
[x] Show an admin entry point from the signed-in public header
[x] Let admins moderate reviews directly from the command center
[x] Let admins create, manage, and delete properties from the command center
[x] Surface recent admin audit activity in the command center

### Slice 18 — UI design improvements (absorbed into Slice 50)

> Slice 18 requirements are folded into Slice 50 Phases 2 (design system) and 4 (consumer UX). See Slice 50 checklist below.

[ ] Add a PageHeader component with consistent h1, subtitle, and badge on every page
[ ] Set matching browser title tags in "Page Name -- Livedin" format across all routes
[ ] Build a Breadcrumbs component and wire it to all non-root routes
[ ] Add mobile-truncated breadcrumb behavior (immediate parent + current page only)
[ ] Build /settings/profile with read-only account info, editable display name, and embedded theme panel
[ ] Add a settings entry point (link or avatar menu) in the signed-in header

### Slice 19 — Mobile UX: hamburger menu (absorbed into Slice 50)

> Slice 19 requirements are folded into Slice 50 Phase 6 (shared infrastructure). See Slice 50 checklist below.

[ ] Build HamburgerButton with 44x44 px touch target and bar-to-x morph animation
[ ] Build MobileNavDrawer with role-aware links, focus trap, and close-on-navigate behavior
[ ] Make PublicSiteHeader fully responsive: hamburger on mobile/tablet, links on desktop
[ ] Apply the same hamburger-first pattern to the admin header
[ ] Audit and fix touch targets across key flows to meet 44x44 px minimum

### Slice 20 — NLP semantic renter feedback

[ ] Add semantic_property_feedback storage and moderation status flow
[ ] Generate neutralized semantic feedback from approved renter review text
[ ] Add admin review, approval, hide, and regenerate controls for semantic feedback
[ ] Show approved semantic renter feedback on public property pages
[ ] Preserve the currently approved public feedback until replacement output is approved

### Slice 50 — New FE Integration (PRD v2)

#### Phase 1 — Documentation Reconciliation

[x] Convert Software Requirements PDF to Markdown (v2.0)
[x] Convert Tech Specs PDF to Markdown (v2.0)
[x] Convert Schema & ERD PDF to Markdown and merge with PRDv2 schema doc
[x] Verify PRD .tex matches v2 PDF content
[x] Add Palette 6 (navy/amber) and typography decision to themes.md
[x] Add landlord role and new routes to route-access-map.md
[x] Add new table RLS policies to rls.md
[x] Update 00-index.md with Slice 50 entries and frozen decisions
[x] Update checklist.md with Slice 50 checklist
[x] Update Slice 50 plan to absorb Slices 18/19
[x] Update ARCHITECTURE.md with portal and consumer UX sections
[x] Update livedin/README.md and root README.md
[x] Add decision/companion headers to analysis docs

#### Phase 2 — Design System Unification

> Prerequisite: Phase 1 complete. Reference `proj_docs/UI Mockup/themes.md` for palette decisions and `proj_docs/obstaclesV2.md` §4 for the three-way design conflict.

[ ] Finalize canonical token set from Palette 6 navy/amber direction (see themes.md Palette 6 spec)
[ ] Implement Playfair Display + Inter font loading in globals.css (replace Geist Sans)
[ ] Audit New FE codebase for inline hex values and produce token mapping
[ ] Inventory shadcn/ui primitives: identify net-new, duplicate, and superseded (New FE has ~50 ui/ components; livedin has Breadcrumbs + FeedbackPanel)
[ ] Plan component additions via shadcn CLI (not file copy from New FE)
[ ] Add PageHeader component (from Slice 18 scope)
[ ] Add Breadcrumbs component wiring (from Slice 18 scope)
[ ] Build /settings/profile page (from Slice 18 scope)

#### Phase 3 — Schema and Type Evolution

> Reference: `proj_docs/Schema & ERD.md` Part 2, `proj_docs/DB Schema Architecture - PRDv2.md`, `docs/security/rls.md`.
> All migrations are additive — no destructive changes to existing tables. Bootstraps from existing 13 migrations.

[ ] Write migration: neighbourhoods table (supports FR-CX-01, FR-BP-05)
[ ] Write migration: user_shortlists table (supports FR-CX-04)
[ ] Write migration: portfolio_properties table (central pivot for FR-BP-01–07)
[ ] Write migration: team_members table (supports FR-BP-08)
[ ] Write migration: notification_preferences table (supports FR-BP-10)
[ ] Write migration: review_response_drafts table (supports FR-BP-02/03)
[ ] Write migration: benchmark_averages table (supports FR-BP-05)
[ ] Write migration: company_profiles table (supports FR-BP-09)
[ ] Add 'landlord' to profiles.role check constraint
[ ] Add neighbourhood_id FK to properties table
[ ] Write RLS policies for all new tables (~25 policies per rls.md)
[ ] Add is_landlord() and is_portfolio_member() helper functions
[ ] Add recompute_neighbourhood_aggregates() and recompute_benchmark_averages() functions
[ ] Add new views: v_portfolio_overview, v_neighbourhood_browse, v_review_with_response
[ ] Add new types to livedin/lib/types.ts (PortfolioPropertyItem, NeighbourhoodListItem, UserShortlistItem, ComparisonPropertyItem, etc.)
[ ] Document API route contracts (6 portal + 4 consumer per Tech Spec §8.2–8.3)
[ ] Add validation schemas (portal.ts, shortlist.ts)

#### Phase 4 — Consumer UX Adoption

> Ports Facelift UX patterns into Next.js. Data from real Supabase queries, not mock data.
> Reference: SRS §3.8 (FR-CX-01–05), Facelift pages for visual inspiration.
> Reuses existing PropertyCard, SearchBar, review flow components — enhances, doesn't replace.

[ ] Build /neighbourhoods and /neighbourhoods/[id] routes (FR-CX-01; wire to GET /api/neighbourhoods)
[ ] Build /comparison route with side-by-side view (FR-CX-02; up to 3 properties, 5 canonical metrics)
[ ] Add filter sidebar and sort options to search (neighbourhood, score range, sort by trust/reviews)
[ ] Create TrustScoreBadge and CategoryScoreBar components (FR-CX-05; uses display_0_5 from property_aggregates)
[ ] Improve review wizard with step progress and motion transitions (FR-CX-03; preserve existing validation/gating)
[ ] Build /dashboard route (FR-CX-04; auth-gated, shows user's reviews + shortlist)
[ ] Add shortlist heart/bookmark to PropertyCard (persists to user_shortlists; optimistic UI)

#### Phase 5 — Business Portal Implementation

> New product surface for landlords/managers. Follows existing admin area patterns.
> Reference: SRS §3.9 (FR-BP-01–10), Tech Spec §1.2 (route groups), §8.2 (portal APIs).
> Auth: getLandlordFromRequest parallel to getAdminFromRequest. Client: portalFetch parallel to adminFetch.
> Recharts for analytics charts (Tech Spec TS-R-v2-FDR-03). No MUI/Emotion.

[ ] Create /portal layout with sidebar and landlord auth gate (TS-R-v2-RG-01/02)
[ ] Implement getLandlordFromRequest auth helper and portalFetch client (TS-R-v2-RG-02/03)
[ ] Build /portal dashboard (FR-BP-01; portfolio overview via v_portfolio_overview)
[ ] Build /portal/reviews (FR-BP-02; review feed with response drafting via review_response_drafts)
[ ] Build /portal/moderation (FR-BP-03; flagged reviews scoped to portfolio)
[ ] Build /portal/performance (FR-BP-04; category analytics with Recharts)
[ ] Build /portal/benchmarks (FR-BP-05; city/neighbourhood comparison via benchmark_averages)
[ ] Build /portal/signals (FR-BP-06; renter sentiment trends — no raw text_input exposure)
[ ] Build /portal/alerts (FR-BP-07; review gap monitoring with invite link generation)
[ ] Build /portal/team (FR-BP-08; team management CRUD via team_members)
[ ] Build /portal/profile (FR-BP-09; company profile via company_profiles)
[ ] Build /portal/settings (FR-BP-10; notification preferences via notification_preferences)

#### Phase 6 — Shared Infrastructure

> Cross-cutting concerns for all surfaces. Absorbs Slice 19 (hamburger menu).
> Reference: SRS §5.5 (NFR-A11Y-01, NFR-MOBILE-01), obstaclesV2.md §10 (no test infra).

[ ] Create portal API client (lib/portal-client.ts; parallel to admin-client.ts)
[ ] Evaluate and implement state management for cross-page state (shortlist, comparison selection)
[ ] WCAG 2.1 AA accessibility audit on all new screens (NFR-A11Y-01; 44x44 px touch targets per NFR-MOBILE-01)
[ ] Build HamburgerButton and MobileNavDrawer (from Slice 19 scope; 44x44 px, focus trap, role-aware)
[ ] Make portal sidebar collapse to drawer on mobile (md breakpoint)
[ ] Make PublicSiteHeader responsive: hamburger on mobile/tablet, links on desktop
[ ] Add error boundaries and Suspense skeletons (follow UiListState/UiSurfaceState patterns)
[ ] Ensure comparison table scrolls horizontally on mobile with sticky property headers

#### Phase 7 — Cleanup and Deprecation

> Final gate: remove prototype code, verify no dead deps, update all docs.

[ ] Archive New FE/ directory to archive/new-fe-prototypes branch, then remove from main
[ ] Remove root index.html and src/main.tsx (broken SPA stub)
[ ] Dependency audit: confirm no MUI, Emotion, next-themes, canvas-confetti, react-dnd, react-slick, react-responsive-masonry
[ ] Add recharts and motion (if adopted) as only new deps from the prototype influence
[ ] Run npm run lint && npm run typecheck with zero errors
[ ] Update ARCHITECTURE.md with portal route group, consumer features, new API routes
[ ] Update README.md with expanded app structure and landlord role docs
[ ] Remove references to New FE prototypes from all docs

## Remaining Work Summary

### Resolved obstacles (from obstaclesV2.md)

- [x] §9 Documentation in PDF format — all v2 docs converted to Markdown (SRS, Tech Spec, Schema & ERD)
- [x] §4 Design system conflict — Palette 6 (navy/amber) adopted; typography frozen (Playfair + Inter); documented in themes.md
- [x] §5 Metric model mismatch — five-metric canonical; seven-category rejected in SRS §2.6
- [x] Decision records — SWOT analyses completed; integration path chosen over rebuild

### Standing obstacles (see obstaclesV2.md for details)

- [ ] §2 Incomplete Slice 11 (photos: upload + display remain)
- [ ] §3 No `landlord` role yet (requires Phase 3 migration)
- [ ] §6 Mock data vs real data gap (Phase 3 creates tables; Phases 4–5 wire real data)
- [ ] §7 Framework translation overhead (Vite → Next.js; per-component during Phases 4–5)
- [ ] §8 Dependency conflicts (MUI/Emotion excluded; recharts to be added in Phase 5)
- [ ] §10 No test infrastructure (test framework not yet adopted)
- [ ] §11 No neighbourhood/portfolio data (Phase 3 creates tables + seed strategy)
- [ ] §12 Business Portal is a net-new product surface (Phase 5)

### Outstanding slices

[ ] Finish Slice 11 photo upload and public photo display (R2 integration)
[ ] Build Slice 20 semantic renter feedback pipeline and UI (independent of Slice 50)
[ ] Complete Slice 50 Phase 2 — Design system unification (tokens, typography, component inventory)
[ ] Complete Slice 50 Phase 3 — Schema evolution (8 new tables, landlord role, RLS, types, API contracts)
[ ] Complete Slice 50 Phase 4 — Consumer UX (neighbourhoods, comparison, dashboard, shortlist, trust badges)
[ ] Complete Slice 50 Phase 5 — Business Portal (10 portal screens, portal auth, analytics, team management)
[ ] Complete Slice 50 Phase 6 — Shared infrastructure (portal client, a11y, mobile nav, error boundaries)
[ ] Complete Slice 50 Phase 7 — Cleanup (remove New FE, root stub, dep audit, lint/typecheck, doc updates)
