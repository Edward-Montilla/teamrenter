> **Decision Record** — April 2026
> **Decision**: Option rejected. Deleting `livedin/` was assessed as the highest-risk option. The integration path (Slice 50) was chosen instead.
> **Status**: Closed — see `slices/50-slice-new-fe-integration-plan.md` for the chosen approach.

# SWOT Analysis: Delete `livedin/` and Start a New Web App

## What this scenario means

Delete the entire `livedin/` directory — the working Next.js application — and create a brand-new web app in its place. The new app would implement the full PRD v2 scope (consumer UX + Business Portal + admin) from scratch, using the New FE prototypes as UI reference or starting code.

### What gets destroyed

| Asset | Quantity | Effort to recreate |
|-------|----------|-------------------|
| API route handlers | 20 files | High — each has auth checks, Supabase queries, error handling, RLS enforcement |
| Page routes | 16 pages (home, property detail, review form, sign-in, admin × 10, theme picker, request-admin) | Medium — UI can be rebuilt, but wiring to real data is the hard part |
| Custom components | 21 files (PropertyCard, SearchBar, ReviewSubmitFlow, StarRatingInput, AdminSummaryCard, SignInForm, ThemeSync, etc.) | Medium — these encode business logic (review gating, admin auth, theme persistence) |
| Lib layer | 14 files (Supabase clients, admin auth, property search/detail, types, themes, validation, photo handling) | High — `types.ts` alone is 384 lines of battle-tested data contracts |
| Validation | `lib/validation/review.ts` (half-star scoring, 500-char cap, tenancy date ordering) | Low volume but high precision — bugs here break the review pipeline |
| Admin layout + auth gating | `app/admin/layout.tsx` with session check → API verify → role gate | High — this pattern took multiple iterations (slices 05, 12, 14, 17) to get right |
| Config | `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `package.json` with exact dependency versions | Low — boilerplate, but dependency version alignment matters |
| Architecture docs | `ARCHITECTURE.md`, `README.md` | Low — can be rewritten, but the knowledge captured is valuable |
| Test scripts | `api_smoke_test.ts`, `get-review-test-jwt.ts` | Low volume, high value — they test real auth flows |
| **Total custom code** | **79 files, ~14,049 lines** | |

### What survives

| Asset | Location | Notes |
|-------|----------|-------|
| Supabase migrations | `supabase/migrations/` (13 files, 2,604 lines) | Usable as-is if the new app connects to the same Supabase project |
| Seed data | `supabase/seed.sql` (302 lines) | Same |
| New FE prototypes | `New FE/Facelift/` and `New FE/Business Portal/` | UI reference / starting code |
| Project docs | `proj_docs/`, `slices/` | PRD v2, SWOT, obstacles, slice plans |
| Git history | Full history of `livedin/` in git | Can reference or cherry-pick from old commits |

---

## Strengths

### S1. Total freedom in technology choice
You're not locked into Next.js 16. You can choose:
- **Vite + React Router** (matches the prototypes natively — zero translation)
- **Next.js 15/16** (fresh project, clean config, no accumulated decisions)
- **Remix**, **Astro**, or any other framework
- A different CSS approach, state management library, or testing framework

### S2. The New FE components can be used directly
If you choose Vite + React Router, the Facelift's 69 files and Business Portal's 66 files drop in as-is. No framework translation, no `"use client"` directives, no server/client boundary decisions. The pages, routing, and component structure just work.

### S3. Design system is unified from day one
No three-way palette conflict. You adopt the New FE's navy/amber + Playfair/Inter (or Lora/DM Sans) direction as the canonical design and never deal with the purple/teal vs. navy/amber reconciliation.

### S4. Architecture matches PRD v2's two-sided model
The new app's routing, layouts, and data layer can be designed around the two-persona model (renter + landlord) from the start instead of retrofitting a landlord portal into a renter-only app.

### S5. Clean dependency tree
No risk of inheriting unused dependencies or conflicting versions. You install exactly what you need. The current `livedin` has only 3 runtime deps (`next`, `react`, `react-dom`, `@supabase/supabase-js`), but a new app can make different choices (e.g., add Recharts, Motion, React Query from the start).

### S6. Psychological fresh start
Working in a clean codebase without the cognitive overhead of understanding 17 slices of accumulated decisions can increase development velocity and motivation.

---

## Weaknesses

### W1. You delete 14,049 lines of working, tested code
This isn't prototype code — it's production code that handles:
- Real Supabase auth with session management
- 20 API routes with proper error handling and auth guards
- RLS enforcement tested across public, verified, and admin roles
- Aggregate refresh triggers on moderation actions
- Multi-step review submission with validation, gating, and rate limiting
- Full admin console (properties CRUD, review moderation, insight approval, audit log, user management, access requests)

Every line must be rewritten.

### W2. The Supabase schema expects the five-metric model
Even though the migrations survive in `supabase/`, they define:
- `reviews` table with columns: `management_responsiveness`, `maintenance_timeliness`, `listing_accuracy`, `fee_transparency`, `lease_clarity`
- Aggregate functions computing averages across these five columns
- RLS policies referencing these column names
- Check constraints for score ranges

If the new app adopts the seven-category model, the migrations are useless too. If it keeps the five-metric model, you're constrained by the same schema — and now you're rebuilding the app layer that already worked with it.

### W3. Auth and admin are 60%+ of the backend complexity
The current app's most valuable code isn't the UI — it's:
- `lib/supabase-server.ts` + `lib/supabase-browser.ts` (Supabase client setup)
- `lib/admin-auth.ts` + `lib/admin-client.ts` (admin auth helpers)
- `app/admin/layout.tsx` (client-side auth gate)
- 17 admin API routes with ownership verification
- `lib/admin-role-requests.ts` (access request state machine)

None of this is in the New FE prototypes. The prototypes have a `login.tsx` that renders a form and does nothing.

### W4. Git history becomes archaeology
The 46 commits that built the current app are still in git, but:
- You can't cherry-pick individual files cleanly once the directory is deleted and re-created with a different structure
- Diffing against the old code requires checking out old commits
- Blame history is lost for the directory

### W5. You lose the smoke test scripts
`api_smoke_test.ts` and the RLS test runner (`../scripts/rls_smoke_test.ts`) test real API endpoints and real RLS policies. In a new app, you have zero test coverage until you write new tests.

### W6. Component business logic must be reverse-engineered
Components like `ReviewSubmitFlow`, `ReviewGateBanner`, and `StarRatingInput` encode precise business rules (half-star increments, gate states, rate limiting). The New FE's `WriteReviewPage` has a visually similar form but none of this logic. You'll rebuild the UI quickly and then spend weeks rediscovering edge cases.

---

## Opportunities

### O1. Adopt Vite + React Router and skip SSR entirely
If SEO on property pages isn't a priority for the MVP/demo, a Vite SPA is simpler:
- No server/client component split
- No `"use client"` / `"use server"` directives
- Supabase client-side SDK directly (simpler than routing through API routes)
- Static hosting on Vercel/Netlify/Cloudflare Pages
- The New FE prototypes work out of the box

### O2. Supabase client-side direct access (simpler architecture)
The current app enforces all data access through Next.js API routes (server-side Supabase client). In a Vite SPA, you can use the Supabase browser client directly with RLS doing the heavy lifting. This eliminates 20 API route files — RLS becomes the API.

**Caveat**: This is less secure for admin operations and harder to audit. The current architecture's API-route pattern exists for good reasons.

### O3. Adopt React Query / TanStack from day one
Instead of manual `fetch` wrappers (`adminFetch`, future `portalFetch`), the new app can use React Query for:
- Automatic caching and revalidation
- Optimistic updates (shortlist toggles, review responses)
- Loading/error state management
- Pagination and infinite scroll

### O4. Build the portal and consumer UX in parallel
With no existing code to integrate around, two developers (if the team grows) could work simultaneously:
- Developer A: Consumer-facing pages (Facelift prototype)
- Developer B: Business Portal pages (Portal prototype)
- Shared: Supabase schema, types, auth

### O5. Choose the seven-category model if it's genuinely better
A fresh start is the only realistic way to adopt a different rating model. If the team believes `safety`, `noise`, `cleanliness`, `value`, and `moveInOut` better serve users than the current five metrics, this is when to change.

### O6. Modern project scaffolding
Start with Vite 6, React 19, TypeScript 5.x, Tailwind 4, and a proper test framework (Vitest + React Testing Library) configured from day one. The current app has no test framework.

---

## Threats

### T1. You have ~7 weeks until Demo Day 2 (May 27)

Here's a realistic time estimate for rebuilding:

| Work item | Estimated effort |
|-----------|-----------------|
| Project scaffolding + config | 1–2 days |
| Supabase client setup + auth flow (sign-in, sign-up, session, role gating) | 3–5 days |
| Consumer pages (home, search, property detail, neighbourhoods, comparison, dashboard) | 5–7 days |
| Review submission flow (validation, gating, rate limits, confirmation) | 3–4 days |
| Admin console (10 pages: properties CRUD, review moderation, insights, audit, users, access requests) | 7–10 days |
| Business Portal (10 pages: dashboard, reviews, analytics, benchmarks, signals, alerts, team, profile, settings) | 7–10 days |
| API routes or RLS-direct data layer | 5–7 days |
| New schema migrations (7 new tables + landlord role) | 2–3 days |
| Testing, polish, bug fixing | 3–5 days |
| **Total** | **~36–53 working days** |

You have ~35 working days until May 27. This is **extremely tight for a solo developer** even at full productivity. The integration path (Slice 50) estimates 4–6 weeks because it skips rebuilding the existing backend.

### T2. Demo Day regression risk
If the rebuild isn't complete by May 27, you demo a partially-working app that has **fewer features** than what you had before deleting `livedin/`. The integration path guarantees you at least demo the existing working app plus whatever new features you've added.

### T3. The "90% done, 90% to go" problem
The New FE prototypes look 90% done because the UI is polished. But the remaining work (auth, data fetching, error handling, validation, moderation, admin tools) is the other 90%. Mock data hides all the complexity.

### T4. Supabase RLS is your only security layer in a Vite SPA
If you go the Vite + direct Supabase route (Opportunity O2), RLS becomes your entire security model. Any RLS policy bug is a direct data exposure. The current app has two layers: API routes validate and sanitize, then RLS provides defense-in-depth.

### T5. You lose the admin console entirely
The admin console (10 pages, 17 API routes) is the most complex part of the current app and has **zero equivalent in the New FE prototypes**. The Business Portal's `moderation-queue.tsx` is a mock UI — it doesn't connect to any moderation backend. You must rebuild the entire admin surface from scratch.

### T6. Solo developer burnout
Rebuilding an entire application under deadline pressure, knowing that you previously had a working version, is psychologically taxing. The sunk-cost awareness can reduce motivation rather than increase it.

### T7. The new app inherits the prototypes' problems
The New FE prototypes have their own issues:
- MUI + Emotion dependencies (~300KB bundle weight)
- React 18 peer deps (not React 19)
- Seven-category model baked into mock data and components
- No accessibility considerations (no ARIA attributes, no focus management)
- No mobile responsiveness (portal sidebar is fixed `w-64`)
- Hardcoded hex colors throughout (no design tokens)

You inherit all of these and must fix them.

---

## Side-by-Side Comparison

| Factor | Delete + Restart | Integrate (Slice 50) | Rebuild from SWOT v1 |
|--------|-----------------|----------------------|----------------------|
| Working demo available | No (start from zero) | Yes (existing app + additions) | No (start from zero) |
| Time to feature parity with current app | ~4–6 weeks | Already there | ~4–6 weeks |
| Time to full PRD v2 | ~8–12 weeks | ~6–8 weeks | ~10–14 weeks |
| Backend work | Rebuild everything | Already done | Rebuild everything |
| UI starting point | New FE prototypes | Translate prototypes | New FE prototypes |
| Admin console | Rebuild from scratch | Already works | Rebuild from scratch |
| Auth system | Rebuild from scratch | Already works | Rebuild from scratch |
| Design consistency | Unified (new) | Requires Phase 2 reconciliation | Unified (new) |
| Framework choice | Free | Next.js (locked) | Free |
| Risk to Demo Day 2 | Very high | Low | Very high |
| Git history | Lost for livedin/ | Preserved | Preserved (separate branch) |

---

## Recommendation

**Deleting `livedin/` is the highest-risk option of the three considered** (integrate, rebuild on branch, delete and restart). It combines all the risks of a rebuild with the additional penalty of destroying the safety net — you can't fall back to the working app if the rebuild stalls.

If you want a fresh start, **Option 2 from the earlier analysis (rebuild on a separate branch) is strictly better** than deleting `livedin/`:
- Same outcome if the rebuild succeeds (you switch `main` to point at the new code)
- Safety net if it doesn't (the old code is still there, still works, still demable)
- Git history preserved for reference and cherry-picking

The only scenario where deleting `livedin/` makes sense is if:
1. You're certain you will never need the old code, not even as reference
2. You want to force yourself into a "no going back" commitment
3. The timeline extends well past Demo Day 2

Even then, archiving `livedin/` to a branch (`archive/livedin-v1`) before deleting is free insurance.
