> **Decision Record** — April 2026
> **Decision**: Integration path (Slice 50) chosen over full rebuild.
> **Status**: Closed — this analysis informed the decision. The integration plan is documented in `slices/50-slice-new-fe-integration-plan.md`.

# SWOT Analysis: Abandoning the Current Build in Favour of a Ground-Up Rebuild Using the New FE + PRD v2

## Context

This analysis evaluates the strategic trade-offs of **discarding the existing `livedin` Next.js application** (46 commits, ~108K lines, 20 API routes, 13 Supabase migrations, 3,496 files) and **rebuilding from scratch** using the New FE prototypes (Facelift + Business Portal, ~15K lines combined across 135 files) as the starting codebase, implementing the expanded PRD v2 scope from day one.

### What exists today

| Asset | Size | Maturity |
|-------|------|----------|
| `livedin` (Next.js 16, React 19) | ~7,900 lines app code, ~1,800 lines lib, ~3,700 lines UI components | Slices 01–17 complete (auth, CRUD, moderation, RLS, insights, admin) |
| Supabase schema | 13 migrations, 2,604 lines SQL, seed data | Production-ready with RLS, triggers, aggregates |
| New FE / Facelift (Vite + React Router) | ~7,600 lines across 69 files | UI prototype only, mock data, no backend |
| New FE / Business Portal (Vite + React Router) | ~7,600 lines across 66 files | UI prototype only, mock data, no backend |

### What the rebuild would mean

Start a new project (either Vite SPA or fresh Next.js) using the New FE component code as the foundation, wire it to a new or rebuilt Supabase backend, and implement the full PRD v2 (consumer + landlord + admin) from scratch.

---

## Strengths (of rebuilding)

### S1. Clean architecture from day one
A rebuild lets you design the data model, routing, and component hierarchy around the full PRD v2 scope (two-sided marketplace, landlord role, neighbourhoods, comparisons) rather than bolting it onto an architecture that was designed for a renter-only MVP.

### S2. The New FE UI is already built
The Facelift has 10 consumer pages and the Business Portal has 10 portal screens — all with polished UI, shadcn components, Recharts charts, and motion transitions. In a rebuild, these become your starting point rather than something you have to reverse-engineer and translate.

### S3. No framework translation overhead
In the integration path, every New FE component must be translated from Vite + React Router → Next.js App Router (client/server boundaries, `useParams` → `params` props, `<Outlet />` → `{children}`, etc.). In a rebuild, you either stay on Vite/React Router natively or do the translation once during initial scaffolding before any complexity accumulates.

### S4. Unified design language
The New FE prototypes share a consistent visual direction (navy/amber, sidebar layout, Recharts charts). A rebuild adopts this wholesale instead of trying to reconcile it with the existing purple/teal palette, Geist fonts, and five-theme system.

### S5. Simpler metric model migration
If the team decides the seven-category model from the prototypes is actually better than the five-metric model, a rebuild is the only realistic path to adopt it — the existing schema, validation, RLS policies, and aggregate pipeline are all hardcoded to five metrics.

### S6. No legacy baggage
The current codebase has ~95K lines of generated/vendored UI code (shadcn, Tailwind output) alongside custom code. A rebuild starts lean with only what's needed.

---

## Weaknesses (of rebuilding)

### W1. You lose 4+ months of backend work
The existing `livedin` app has a fully working backend:
- 20 API routes (properties, reviews, admin CRUD, moderation, insights, audit, access requests, photos)
- 13 Supabase migrations with RLS policies, triggers, aggregate refresh functions, and constraints
- Auth flow (email/password + Google OAuth, session management, role gating)
- Admin console with moderation, audit logging, and property management

None of this exists in the New FE prototypes. Every line must be rewritten.

### W2. The New FE prototypes have zero backend integration
Both prototypes import from local `mockData.ts` files. There is no:
- Supabase client setup
- API route handlers
- Auth guards or session management
- RLS policy enforcement
- Error handling, loading states, or empty states for real data
- Form validation tied to database constraints

The prototypes are UI shells, not applications. The gap between "looks good with mock data" and "works with real data" is where most of the engineering time lives.

### W3. The Supabase schema must be rebuilt or migrated
The existing 13 migrations represent a carefully sequenced, tested schema with:
- Profile sync triggers (auth.users → public.profiles)
- Aggregate refresh on moderation status changes
- Check constraints (one review per property per user, score ranges, tenancy date ordering)
- RLS policies for public, verified, and admin roles

Rebuilding means either (a) rewriting all of this from scratch, or (b) reusing the existing migration files — in which case you're carrying over the "legacy" anyway.

### W4. React 18 vs. React 19 compatibility
The New FE prototypes list React 18 as a peer dependency. The current app uses React 19. A rebuild on the New FE base starts on an older React version. Upgrading to React 19 may introduce breaking changes with the prototype's dependencies (MUI, Emotion, Radix versions).

### W5. MUI and Emotion dependency baggage
Both New FE prototypes include `@mui/material` and Emotion in their `package.json`. These are heavy dependencies (~300KB+ bundled) that the current app deliberately avoids. A rebuild inherits them unless you strip them out — at which point you're doing translation work anyway.

### W6. Demo Day 2 is May 27 — approximately 7 weeks away
A ground-up rebuild of the backend, auth, admin console, moderation pipeline, AND the new consumer/portal features within 7 weeks is extremely aggressive for a solo developer (46 commits total, one contributor).

### W7. Proven RLS and security model is lost
The existing RLS policies have been tested (there's an `rls:test` smoke test script). Rebuilding means re-deriving and re-testing every security boundary — a process where mistakes are silent and dangerous.

---

## Opportunities (that a rebuild enables)

### O1. Adopt a simpler deployment model
If the team decides SSR/server components aren't needed, a Vite SPA + Supabase client-side architecture is simpler to deploy (static hosting) and reason about (no server/client boundary decisions).

### O2. Build the landlord experience as a first-class citizen
In the current architecture, the landlord portal is retrofitted into an app designed for renters. A rebuild can structure routing, layout, and data fetching around the two-persona model from the start.

### O3. Adopt a different rating model if desired
If the team believes the seven-category model better serves users, a rebuild is the natural point to make that change. The integration path has explicitly frozen the five-metric model because changing it in the existing schema is too costly.

### O4. Modern tooling choices
A rebuild lets you adopt current best practices:
- React Query / TanStack Query from day one (instead of manual fetch wrappers)
- Zustand or Jotai for client state (instead of ad-hoc React Context)
- Vitest for testing (instead of having no test framework)
- Proper CI/CD pipeline designed for the new stack

### O5. Attract contributors with a cleaner codebase
A fresh, well-structured codebase with clear separation of concerns may be easier for new team members to contribute to than one with 17 slices of accumulated architectural decisions.

---

## Threats (risks of rebuilding)

### T1. The "rewrite trap" — second-system effect
Rewrites are notoriously underestimated. The existing app's complexity is largely invisible (edge cases in auth flows, RLS policy interactions, aggregate refresh timing, moderation state machines). A rebuild will rediscover each of these problems and must solve them again.

### T2. Timeline risk is existential
With Demo Day 2 on May 27 (~7 weeks), a rebuild that doesn't reach feature parity with the current app results in a demo with **less** functionality than what already works today. The integration path at least preserves the working product while adding to it.

### T3. Loss of tested security surface
The current RLS policies, auth guards, and admin gating have been iterated on across slices 05, 09, 12, 14, and 17. A rebuild must re-derive all of these. Any gap is a security vulnerability that may not surface until production.

### T4. Supabase schema divergence
If the rebuild uses a different schema (new metric model, different table structure), it creates a fork from the existing migration history. If the team later needs to merge work or revert, the schemas are incompatible.

### T5. Framework choice risk
If the rebuild stays on Vite + React Router (the New FE's stack), you lose:
- Server-side rendering (SEO for property pages)
- API routes co-located with the app (must use Supabase Edge Functions or a separate backend)
- Incremental static regeneration for property listings
- Server components for data-heavy pages (neighbourhood listings, analytics)

If the rebuild switches to Next.js anyway, you're back to the same framework translation overhead — but now without the existing working code to reference.

### T6. Mock data gives false confidence
The New FE prototypes look complete because they render beautifully with curated mock data. But mock data never has:
- Missing fields or null values
- Empty states (zero reviews, zero properties)
- Error responses
- Slow network conditions
- Stale cache
- Concurrent users

The distance from "demo-ready prototype" to "production-ready application" is much larger than the UI suggests.

### T7. Solo developer bandwidth
The git history shows 46 commits from a single contributor. A rebuild doubles the work (rebuild existing + build new) without doubling the workforce. The integration path at least parallelises by preserving existing work while adding new features.

---

## Decision Matrix

| Factor | Rebuild | Integrate (Slice 50) |
|--------|---------|----------------------|
| Time to working demo | ~10–14 weeks (estimate) | ~4–6 weeks (phases 1–5) |
| Backend work required | Rebuild from scratch | Already done (20 routes, 13 migrations) |
| UI starting point | New FE prototypes (polished) | Must translate prototypes to Next.js |
| Security model | Must rebuild and retest | Existing, tested RLS + auth |
| Design consistency | Unified from day one | Requires Phase 2 reconciliation |
| Risk of regression | High (rewriting proven code) | Low (additive changes only) |
| Framework flexibility | Can choose Vite or Next.js | Locked to Next.js (but this is a strength) |
| Demo Day 2 readiness | High risk of incomplete demo | Working product + new features |
| Long-term architecture | Cleaner if executed well | Adequate with Phase 7 cleanup |
| Metric model flexibility | Can adopt 7-category | Frozen at 5-metric |

---

## Recommendation

**The integration path (Slice 50) is the lower-risk, higher-certainty option** given the constraints:
- Solo developer
- 7-week deadline
- Working backend that took 4+ months to build
- Prototypes that are UI shells with no backend integration

A rebuild makes strategic sense **only if**:
1. The timeline is extended significantly (3+ months beyond Demo Day 2)
2. The team grows (2+ developers who can work in parallel on backend and frontend)
3. The five-metric model is genuinely wrong and must change (not just aesthetically different)
4. The team is willing to lose the admin console, moderation pipeline, and auth system temporarily

If the team does choose to rebuild, the pragmatic middle path is: **start a fresh Next.js project, copy the Supabase migrations as-is, and rebuild only the frontend** — preserving the backend investment while getting the clean-architecture benefits.
