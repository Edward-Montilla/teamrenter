# Business Portal Implementation Prompt — Slice 50 Phase 5 (Local First)

> **Paste this entire prompt into a new Cursor chat to begin implementation.**  
> **Goal: ship the Business Portal inside `livedin` and verify everything on localhost before any deployment.**  
> **Work on a feature branch. Do not push until local checks pass.**

---

## Scope (exact)

Implement **only** the **Business Portal** — the landlord/property-manager surface under **`/portal/*`** in the **Next.js App Router** app at `teamrenter/livedin/`.

- **In scope:** Layout + auth gate, all **10** portal routes listed below, UI wired to **existing** `app/api/portal/*` route handlers, `portalFetch` usage, Recharts on analytics pages, canonical design tokens (no raw hex in components), loading/error/empty states, mobile-friendly sidebar, header link for landlords/admins.
- **Out of scope:** Consumer UX (`/neighbourhoods`, `/comparison`, `/dashboard`, etc.), Facelift-only work, changing Vite prototypes under `New FE/Business Portal/` (those are **design references only** per Tech Spec TS-R-v2-FDR-02), unrelated refactors.

**Authoritative specs (read and follow):**

- `slices/50-slice-new-fe-integration-plan.md` — **Phase 5 — Business Portal Implementation** (tasks, screen table, acceptance criteria)
- `docs/route-access-map.md` — page + API access matrix
- `proj_docs/Software Requirements.md` — §3.9 Business Portal, **NFR-PRIV-03** (landlord-facing APIs must not expose renter `text_input`; align UI and any new API shapes with this)
- `proj_docs/Tech Specs.md` — TS-R-v2-SYS-01 (no direct browser Supabase for scoped portal data; use Route Handlers + `portalFetch`), TS-R-v2-FDR-03 (Recharts for portal analytics)
- `proj_docs/UI Mockup/themes.md` — **Business Portal Token Roles** (sidebar + chart variables)

**Visual reference (rewrite, do not copy-paste):**  
`New FE/Business Portal/src/app/components/` — e.g. `layout.tsx`, `dashboard.tsx`, `review-feed.tsx`, `category-performance.tsx`, `benchmark-comparison.tsx`, `renter-signals.tsx`, `review-gap-alerts.tsx`, `team-access.tsx`, `company-profile.tsx`, `notification-settings.tsx`, `moderation-queue.tsx`.

---

## Context (what already exists)

- **Backend:** Portal APIs live under `livedin/app/api/portal/` (`me`, `properties`, `properties/[id]/reviews`, `properties/[id]/analytics`, `benchmarks`, `signals`, `reviews/[id]/respond`, `team`, `team/[id]`, `company-profile`, `notification-preferences`). Auth uses `getLandlordFromRequest` from `livedin/lib/portal-auth.ts` (landlord **or** admin).
- **Client helper:** `livedin/lib/portal-client.ts` — has `portalFetch`, `fetchPortalMe`, portfolio properties, per-property reviews/analytics, benchmarks, signals, `submitReviewResponse`. **Extend this file** with typed helpers for **team**, **company profile**, and **notification preferences** if callers would otherwise duplicate fetch boilerplate.
- **Types:** `livedin/lib/types.ts` — Slice 50 / portal-related types (portfolio, benchmarks, signals, team, company profile, notifications, five-metric model).
- **Local seed:** `supabase/seed.sql` defines landlord `landlord@example.com` / `seedpassword`, `profiles.role = 'landlord'`, and **two** `portfolio_properties` rows for that user.

There is **no** `livedin/app/portal/` tree yet — you are creating it.

---

## Pre-flight: read these files first

```
livedin/app/admin/layout.tsx                 — auth gate + shell pattern to mirror
livedin/lib/portal-auth.ts                   — landlord/admin resolution
livedin/lib/portal-client.ts                 — extend as needed
livedin/lib/types.ts                         — response/input types
livedin/lib/ui.ts                            — cn, button/card patterns
livedin/app/globals.css                      — ensure portal/sidebar/chart CSS variables exist (see themes.md)
livedin/components/auth/PublicSiteHeader.tsx — add Portal entry for landlord/admin
docs/route-access-map.md
slices/50-slice-new-fe-integration-plan.md   — Phase 5 only
```

If `globals.css` is missing **portal token roles** from `proj_docs/UI Mockup/themes.md` (`--sidebar-bg`, `--sidebar-text`, `--chart-1` …), **add them** as part of this work so the portal matches the documented design system.

---

## Routes to implement (10 screens)

| Route | Purpose | Primary data source |
| --- | --- | --- |
| `/portal` | Portfolio dashboard | `GET /api/portal/properties` |
| `/portal/reviews` | Review feed + response drafting | `GET /api/portal/properties` then `GET /api/portal/properties/[id]/reviews` per property (client-side merge/filter is OK for MVP); `POST /api/portal/reviews/[id]/respond` |
| `/portal/moderation` | Landlord “moderation” view | See **Moderation note** below |
| `/portal/performance` | Category performance charts | `GET /api/portal/properties/[id]/analytics` + Recharts |
| `/portal/benchmarks` | Benchmark comparison | `GET /api/portal/benchmarks` + Recharts |
| `/portal/signals` | Renter signals | `GET /api/portal/signals` |
| `/portal/alerts` | Review-gap / invite links | Derived from portfolio payload + links to `/submit-review/[propertyId]` |
| `/portal/team` | Team CRUD | `GET/POST /api/portal/team`, `PATCH/DELETE /api/portal/team/[id]` |
| `/portal/profile` | Company profile | `GET/PATCH /api/portal/company-profile` |
| `/portal/settings` | Notification preferences | `GET/PATCH /api/portal/notification-preferences` |

**Sidebar:** Every link above must appear in `livedin/app/portal/layout.tsx` with icons (`lucide-react`), active state using `--sidebar-active-text`, responsive drawer on small viewports.

**Auth gate:** Same spirit as admin: call `GET /api/portal/me` (via `fetchPortalMe` / `portalFetch`) with Bearer token; states **loading**, **unauthenticated** (prompt sign-in), **forbidden** (signed in but not landlord/admin), **allowed**.

**Public header:** For users with role `landlord` or `admin`, show a **Portal** link to `/portal`.

---

## Moderation note (`/portal/moderation`)

Slice 50 maps this screen to the Business Portal `moderation-queue.tsx` and mentions admin moderation APIs **scoped** for landlords. **`GET /api/admin/reviews` is admin-only** and must not be loosened without a security review.

**Implement as follows:**

1. **UI:** Port the **layout and workflow** from the prototype (queues, statuses, empty states) but bind to **landlord-safe** data only.
2. **Data:** Prefer a **dedicated** `GET /api/portal/moderation` (or `GET /api/portal/review-response-drafts`) that returns, for properties in the landlord’s portfolio, **review response drafts** / submission status — fields appropriate for landlords, **never** renter `text_input` in JSON responses if the row is renter-authored review content.
3. If you add a new route handler, keep it **minimal**, reuse `getLandlordFromRequest`, enforce portfolio scope, and update `docs/route-access-map.md` in the same change.

If you cannot complete the API in one pass, ship the **page shell** with an explicit “waiting on API” empty state only **after** you have opened a follow-up task — the acceptance criteria expect a **working** queue for something the landlord legitimately moderates (typically **their own responses** pending admin approval).

---

## Product rules (do not violate)

- **Five metrics only:** `management_responsiveness`, `maintenance_timeliness`, `listing_accuracy`, `fee_transparency`, `lease_clarity` (SRS §2.6). Ignore seven-category prototypes.
- **Scores:** Use **0–5 display** aggregates from API/types (`display_*_0_5` / typed fields); do not resurrect `0–6` display in new UI.
- **Data access:** Portal pages use **`portalFetch`** (or server components that call your own server helpers), **not** `getSupabaseBrowserClient()` for portfolio-scoped reads.
- **Styling:** Use **CSS variables** / theme tokens — no arbitrary hex in TSX.
- **Charts:** **Recharts** only on portal analytics routes; keep bundle impact reasonable (e.g. dynamic import if needed).

---

## Local development — run this first

### 1. Database and env

From **repository root** (where `supabase/` lives):

```bash
supabase stop
supabase start
supabase db reset
```

Copy keys from `supabase status` into `livedin/.env.local`:

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

See `livedin/README.md` for the full variable list.

### 2. App

```bash
cd livedin
npm install
npm run dev
```

Open `http://localhost:3000`.

### 3. Landlord sign-in (seeded)

- Email: **`landlord@example.com`**
- Password: **`seedpassword`**

(Defined in `supabase/seed.sql`.)

### 4. Manual test matrix

| Check | Expected |
| --- | --- |
| Anonymous → `/portal` | Sign-in prompt, not data |
| Verified non-landlord → `/portal` | Forbidden |
| Landlord → `/portal` | Dashboard with **two** portfolio properties from seed |
| Landlord → each `/portal/*` route | Renders without console errors; real API data or valid empty state |
| Admin → `/portal` | Allowed (same as route map) |
| Header | **Portal** visible for landlord/admin only |

### 5. Quality gates

```bash
cd livedin
npm run lint
npx tsc --noEmit
npm run api:test
```

Fix failures before you consider the task done.

---

## Acceptance criteria (from Slice 50 Phase 5)

Copy into your PR description and tick when true:

- [ ] `/portal` layout renders sidebar navigation with **all** portal routes (including **moderation**).
- [ ] All `/portal` routes are gated to **`landlord` or `admin`**.
- [ ] Dashboard shows **real** portfolio properties with trust scores and review counts from `GET /api/portal/properties`.
- [ ] Review feed loads **real** reviews (aggregated per property), filterable; response draft submit works via `POST /api/portal/reviews/[id]/respond`.
- [ ] Analytics charts use **real** aggregate data from `GET /api/portal/properties/[id]/analytics`.
- [ ] Benchmarks use **real** data from `GET /api/portal/benchmarks`.
- [ ] Team management supports invite, role change, and removal via portal team APIs.
- [ ] Company profile and notification settings persist via their APIs.
- [ ] **Moderation** page is portfolio-scoped and **privacy-safe** (no renter narrative leakage in landlord JSON).
- [ ] No direct client Supabase queries for scoped portal data.

---

## Suggested implementation order

1. Portal CSS variables (if missing) + `globals.css` / theme alignment  
2. `app/portal/layout.tsx` (auth gate + sidebar + mobile drawer)  
3. `app/portal/page.tsx` (dashboard)  
4. `reviews`, `performance`, `benchmarks`, `signals`  
5. `alerts`, `team`, `profile`, `settings`  
6. `moderation` (+ minimal API if required)  
7. `PublicSiteHeader` Portal link  
8. Extend `portal-client.ts` + types usage; update `docs/route-access-map.md` if new APIs are added  

---

## File checklist (expected new/updated paths)

```
CREATE  livedin/app/portal/layout.tsx
CREATE  livedin/app/portal/page.tsx
CREATE  livedin/app/portal/reviews/page.tsx
CREATE  livedin/app/portal/moderation/page.tsx
CREATE  livedin/app/portal/performance/page.tsx
CREATE  livedin/app/portal/benchmarks/page.tsx
CREATE  livedin/app/portal/signals/page.tsx
CREATE  livedin/app/portal/alerts/page.tsx
CREATE  livedin/app/portal/team/page.tsx
CREATE  livedin/app/portal/profile/page.tsx
CREATE  livedin/app/portal/settings/page.tsx
MODIFY  livedin/lib/portal-client.ts          — team, company profile, notifications, moderation fetch if added
MODIFY  livedin/components/auth/PublicSiteHeader.tsx
MODIFY  livedin/app/globals.css              — portal tokens if missing
MODIFY  docs/route-access-map.md             — only if new portal API routes are added
OPTIONAL CREATE livedin/app/api/portal/moderation/route.ts (or equivalent) — if required for landlord queue
```

---

## References (SRS / PRD wording)

- Landlord-facing portal: portfolio analytics, benchmarks, review responses, signals, team access, company profile, notifications (`proj_docs/PRD - Team Renter.tex`, `proj_docs/Software Requirements.md` §3.9).
- Single framework: Next.js App Router for public, admin, and Business Portal (`proj_docs/Tech Specs.md` TS-R-v2-FDR-01).

When this prompt is complete, the Business Portal should be **fully exercisable on `localhost:3000`** with **local Supabase** and the **seeded landlord** account.
