> **Companion Document** — Slice 50 standing obstacles analysis.
> **Related**: `slices/50-slice-new-fe-integration-plan.md` (integration plan), `proj_docs/mermaidV2.md` (dependency graph).

# Slice 50 — Standing Obstacles

## 1. Scale and Scope

Slice 50 is a 7-phase plan that spans documentation, design, schema, two major feature surfaces (consumer UX + business portal), shared infrastructure, and cleanup. Unlike the prior slices (01–17), which were incremental features, this is a full product expansion — adding a landlord persona, ~10 new portal screens, ~7 new consumer pages, 7+ new database tables, 10+ new API routes, and a new auth role. The sheer surface area is the single biggest obstacle.

## 2. Incomplete Prior Slices

Per `checklist.md`, slices 11, 18, 19, and 20 are still open or partially done. Slice 50 explicitly depends on slices 01–17 being complete.


| Slice                           | Status                                 | Impact on Slice 50                                                                                            |
| ------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **11** — Photos via R2          | Partial (DB done, upload/display open) | Property photos may not fully work yet, affecting both consumer UX and portal screens that display properties |
| **18** — UI Design Improvements | Not started                            | Page headers, breadcrumbs, and profile settings are prerequisites for a polished consumer UX and portal       |
| **19** — Mobile Hamburger Menu  | Not started                            | Phase 6 assumes the hamburger pattern is available for portal sidebar collapse on mobile                      |
| **20** — NLP Semantic Feedback  | Not started                            | Independent of Slice 50 but competes for the same development bandwidth                                       |


## 3. No `landlord` Role Exists Yet

The current `profiles.role` only supports `public`, `verified`, and `admin`. Adding `landlord` requires:

- A schema migration altering the check constraint
- New RLS policies scoped to portfolio ownership
- A new auth helper (`getLandlordFromRequest`) modeled after `getAdminFromRequest`
- Portal-specific client auth gating modeled after the admin layout in `app/admin/layout.tsx`

This is foundational — Phases 4–5 cannot start without it, and it touches auth, RLS, and the profile system.

## 4. Three-Way Design System Conflict

There are currently three competing design directions:


| Source                        | Fonts                    | Palette Direction                                                  |
| ----------------------------- | ------------------------ | ------------------------------------------------------------------ |
| `**livedin` production**      | Geist + Geist Mono       | Purple/teal (5 palette options in `themes.md` and `lib/themes.ts`) |
| **Facelift prototype**        | Lora + DM Sans           | Navy/amber tones                                                   |
| **Business Portal prototype** | Playfair Display + Inter | Navy/amber with sidebar-specific tokens                            |


Resolving this into a single canonical token set (Phase 2) requires design decisions that cannot be automated — someone needs to make aesthetic judgments about typography and palette direction. The current `globals.css` has extensive per-theme CSS variable blocks that would all need updating if the palette direction changes.

## 5. Metric Model Mismatch

The New FE prototypes use a **7-category model** while production uses a **5-metric model**:


| Production (canonical)      | Prototype (rejected) |
| --------------------------- | -------------------- |
| `management_responsiveness` | `maintenance`        |
| `maintenance_timeliness`    | `responsiveness`     |
| `listing_accuracy`          | `value`              |
| `fee_transparency`          | `safety`             |
| `lease_clarity`             | `noise`              |
|                             | `moveInOut`          |
|                             | `cleanliness`        |


The slice plan explicitly rejects the 7-category model, meaning:

- Every Facelift/Portal component that renders category scores must be **rewritten**, not copied
- Mock data structures are fundamentally incompatible with production types
- Visual designs showing 7 bars need to be adapted to show 5

## 6. Mock Data vs. Real Data Gap

Both New FE prototypes are entirely mock-data-driven with no Supabase integration. Porting them means:

- Writing 7+ new migration files with proper RLS
- Creating ~10 new API route handlers
- Replacing every mock data import with real API calls or server-component data fetching
- Handling empty states, error states, and loading states that mock-data prototypes never need to address
- Creating seed data or a data ingestion pipeline for neighbourhoods
- Establishing how landlords get linked to properties (manual admin action? self-service claim?)

## 7. Framework Translation Overhead

The New FE prototypes use **Vite + React Router 7** (client-side SPA), while production is **Next.js 16 App Router** (server components, file-based routing). Every component must be translated:


| Prototype Pattern                          | Next.js Equivalent                     |
| ------------------------------------------ | -------------------------------------- |
| `createBrowserRouter` routes               | File-based `app/` directory routes     |
| All client-side components                 | Server vs. client component decisions  |
| No `"use client"` / `"use server"`         | Explicit directives required           |
| `<Outlet />` nesting                       | `{children}` layout pattern            |
| `useParams` / `useNavigate` (React Router) | `params` props / `useRouter` (Next.js) |
| Direct state management                    | URL params + server state              |


## 8. Dependency Conflicts

The New FE `package.json` files include dependencies that are either excluded or need evaluation:


| Dependency                                                                | Status               | Notes                                                        |
| ------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------ |
| `@mui/material` + Emotion                                                 | **Excluded**         | Explicitly rejected in Slice 50 plan                         |
| `react-router` v7                                                         | **Excluded**         | Not applicable in Next.js                                    |
| React 18 (peer dep)                                                       | **Conflict**         | Production uses React 19; component compatibility concerns   |
| `motion` (Framer Motion)                                                  | **Needs evaluation** | May be adopted for wizard transitions                        |
| `recharts`                                                                | **Needs addition**   | Not in `livedin/package.json`; required for portal analytics |
| `canvas-confetti`, `react-dnd`, `react-slick`, `react-responsive-masonry` | **Excluded**         | Must not be inadvertently adopted                            |


## 9. Documentation Exists Only as PDFs

Phase 1 requires updating the PRD, SRS, Tech Spec, and Schema & ERD. These are stored as PDF files:

- `proj_docs/PRD - Team Renter.docx.pdf`
- `proj_docs/Software Requirements.pdf`
- `proj_docs/Tech Specs.pdf`
- `proj_docs/ Schema & ERD.pdf`

Editing PDFs programmatically is impractical. The team needs the original source documents (Word/Google Docs) or must recreate them in an editable format (LaTeX, Markdown). The PRD has been recreated as a `.tex` file (`PRD - Team Renter.tex`); the remaining three documents still need conversion.

## 10. No Existing Test Infrastructure

The `livedin` app has only two smoke-test scripts (`api:test` and `rls:test` run via `tsx`). There is:

- No unit test framework (Jest, Vitest, etc.)
- No component tests (React Testing Library, etc.)
- No integration tests
- No accessibility test runner (axe-core)

Phase 6 calls for WCAG 2.1 AA audits and error boundary verification. Phase 7 requires `lint` + `typecheck` passes. Adding a proper test suite is implicit work not explicitly scoped in the slice plan.

## 11. No Neighbourhood or Portfolio Data Exists

The production database has no data for any of the new features:

- No `neighbourhoods` table or seed data
- No `portfolio_properties` linking landlords to properties
- No `benchmark_averages` for comparison charts
- No `user_shortlists` for the renter dashboard
- No `team_members` for portal team management
- No `notification_preferences` for portal settings

Before any consumer UX or portal feature can show real data, all 7 migrations must be written and tested, and a data population strategy must be defined (seed scripts, admin tools, or automated ingestion).

## 12. Business Portal Is an Entirely New Product Surface

Unlike consumer UX improvements (which enhance existing pages), the Business Portal requires building from scratch:

- New sidebar layout with its own navigation chrome
- 10 new route pages, each with distinct data requirements
- New API routes with landlord-scoped auth enforcement
- Review response workflow (draft → admin approval → public)
- Team management with invite flows and role-based access within the portal
- Analytics with charting (Recharts) that doesn't exist in the current app
- A `portalFetch` client-side helper analogous to the existing `adminFetch`

This is effectively a second application embedded within the same Next.js project.

---

## Summary

The obstacles fall into three categories:

**Foundational blockers** (must resolve before building features):

- Incomplete prior slices (11, 18, 19)
- No `landlord` role in the database
- Design system conflict unresolved
- Documentation in non-editable PDF format

**Translation overhead** (cost of porting prototypes):

- Framework mismatch (Vite → Next.js)
- Metric model mismatch (7 → 5 categories)
- Mock data → real Supabase data
- Dependency conflicts

**Missing infrastructure** (implicit work not scoped):

- No test framework
- No neighbourhood/portfolio data
- Business Portal is a net-new product surface
- No data population strategy for new tables

