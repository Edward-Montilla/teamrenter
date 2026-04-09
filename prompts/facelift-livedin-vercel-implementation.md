# Implementation Prompt — Facelift UI on Livedin (Next.js) + Vercel

> **Paste this entire prompt into a new Cursor chat on the `teamrenter` repo.**  
> **Work on a feature branch. Verify `npm run build` in `livedin/` before opening a PR.**

---

## Goal

Ship the **consumer experience from `New FE/Facelift`** as the **public frontend** of **`livedin/`** (Next.js App Router + Supabase), deployed on **Vercel**. The result must be **visually indistinguishable** from the Facelift prototype: same layout, typography, colours, spacing, components, motion, and page flows.

**Source of truth for visuals:** `New FE/Facelift/src/` (pages, components, `styles/`, `guidelines/`). **Source of truth for data and auth:** existing `livedin/` APIs, `lib/types.ts`, Supabase RLS, and project docs (`slices/`, `docs/route-access-map.md`, `docs/security/rls.md`).

---

## Non-goals (for this prompt)

- Do **not** leave a separate Vite app as the production entrypoint; production is **only** Next.js on Vercel.
- Do **not** implement **`New FE/Business Portal`** in this pass unless explicitly scoped later (it is a different product surface).
- Where product docs reject a seven-metric review model (`slices/50-slice-new-fe-integration-plan.md`, SRS), **keep the canonical five stored metrics** and **map** Facelift’s seven category bars in the UI layer (duplicate or weighted display mapping is acceptable if documented in code comments).

---

## Vercel deployment (required outcome)

1. **Project configuration**
   - In Vercel: set **Root Directory** to `livedin` (this repo’s Next app lives there).
   - **Framework Preset:** Next.js (auto-detected).
   - **Build command:** `npm run build` (default when root is `livedin`).
   - **Install command:** `npm install` (default).

2. **Environment variables** (Production + Preview; align names with existing `livedin` code)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Any **server-only** variables already required by `livedin/lib/supabase-server.ts` and API routes (e.g. service role if used — **never** prefix with `NEXT_PUBLIC_`).
   - Do **not** commit secrets; document any new vars in `livedin` README or env example if the repo uses one.

3. **Runtime**
   - Use **Node.js** runtime for Next.js (Vercel default). No Edge-only constraints unless an existing route already requires Edge.
   - Ensure no code assumes a local filesystem beyond what Next/Vercel supports (no reliance on `New FE/` paths at runtime — **copy** assets into `livedin/public` or use remote URLs).

4. **Verification**
   - Local: from `livedin/`, `npm run build` and `npm run start` must succeed.
   - After deploy: smoke-test `/`, search, property detail, auth flows, and review submission paths touched by this work.

---

## Pre-flight: Read before coding

```
livedin/app/layout.tsx
livedin/app/globals.css
livedin/lib/types.ts
livedin/lib/property-detail.ts
livedin/lib/property-search.ts (or equivalent list/search helpers)
livedin/app/api/properties/route.ts
livedin/app/api/properties/[id]/route.ts
livedin/app/api/properties/[id]/reviews/route.ts
docs/route-access-map.md
docs/security/rls.md

# Facelift reference (visual + structure)
New FE/Facelift/src/app/routes.tsx
New FE/Facelift/src/styles/
New FE/Facelift/src/app/pages/
New FE/Facelift/src/app/components/
New FE/Facelift/package.json   # dependency inventory for parity
```

---

## Phase 1 — Dependencies and design tokens

1. Add npm packages needed to match Facelift behaviour (Radix primitives, `lucide-react`, `motion`, `class-variance-authority`, `clsx`, `tailwind-merge`, `sonner`, etc. — mirror `New FE/Facelift/package.json` where those libraries are used by copied components).
2. Port **Facelift CSS** into `livedin`:
   - Merge token colours (e.g. `#E8913A`, `#0F1F38`, `#E2DDD6`, `#F7F4EF`, `#717182`) and **Lora** (or the exact Facelift heading font from `fonts.css`) via `next/font/google` in `app/layout.tsx`.
   - Ensure Tailwind v4 setup in `livedin` can express Facelift utilities; adjust `@theme` / `@import` as needed so **compiled CSS matches the prototype**.

---

## Phase 2 — Component library port

1. Copy Facelift **`components/ui/*`** and shared components (`Header`, `PropertyCard`, `TrustScoreBadge`, `CategoryScoreBar`, `ReviewCard`, `StepProgress`, `figma/ImageWithFallback`, etc.) into `livedin/components/facelift/` (or a clear namespace).
2. Replace **`react-router`** usage with **Next.js**:
   - `Link` → `next/link`
   - `useParams` / `useNavigate` → `next/navigation`
3. Fix imports (`@/` alias consistent with `livedin/tsconfig.json`).
4. Keep **class names and structure** identical to Facelift so the UI stays pixel-consistent.

---

## Phase 3 — App Router pages (route mapping)

Implement Next.js pages that correspond to Facelift routes. Suggested mapping (adjust only if `livedin` already reserves paths):

| Facelift path | Next.js path (under `livedin/app/`) |
|---------------|-------------------------------------|
| `/` | `page.tsx` (replace or refactor current home) |
| `/search` | `search/page.tsx` |
| `/property/:id` | `properties/[id]/page.tsx` (align with existing dynamic segment) |
| `/write-review` | `write-review/page.tsx` |
| `/dashboard` | `dashboard/page.tsx` (auth-gated) |
| `/comparison` | `comparison/page.tsx` |
| `/neighbourhoods` | `neighbourhoods/page.tsx` |
| `/neighbourhood/:id` | `neighbourhoods/[id]/page.tsx` |
| `/signin`, `/signup` | reuse or restyle existing `sign-in` / sign-up routes — **URLs may stay as today** if redirects from Facelift paths are added |

Wrap public pages with the same **header layout** pattern as Facelift’s `RootLayout` in `routes.tsx`.

---

## Phase 4 — Data layer: APIs and types

1. **Remove runtime dependency on `mockData.ts`.** All pages load from:
   - **Server Components** calling existing lib functions (`getPropertyDetail`, list queries), and/or
   - **`fetch` to `livedin` Route Handlers** under `/api/*` with cookies/auth headers as required.

2. **List + search (`GET /api/properties`)**  
   Extend the JSON response (or add a dedicated DTO) so Facelift cards can render without hacks:
   - Primary image URL (from `property_photos` + existing display URL helper).
   - Fields needed for card subtitle: e.g. combined address line, city, province.
   - Trust score: **map** `trustscore_display_0_5` to the **same numeric presentation** Facelift uses (if the prototype uses a 0–10-style number, implement a single documented transform in one place, e.g. `lib/facelift-mappers.ts`).
   - Optional until DB exists: neighbourhood name, rent, unit type — see Phase 5.

3. **Detail (`GET /api/properties/[id]` or direct server fetch)**  
   Map `PropertyDetailPublic` + photos + aggregates into the shape Facelift `PropertyProfilePage` expects (category bars, hero image, description fallback).

4. **Reviews on property page**  
   - If public review cards cannot expose private `text_input` per current RLS/product rules, **do not fake data**: show **approved distilled insights** and/or a “Reviews summarize verified feedback” empty state that still matches Facelift **layout**.  
   - If the team approves public excerpts, add a **migration + RLS + `GET /api/properties/[id]/reviews`** in Phase 5 and wire `ReviewCard`.

5. **Write review**  
   Wire the multi-step UI to **`POST /api/properties/[id]/reviews`** with the **existing five-metric** body. Map seven sliders → five scores in the client with a documented matrix.

6. **Dashboard shortlist**  
   If Facelift uses local state only, either:
   - Persist via new table + API (Phase 5), or  
   - Keep **client-only** shortlist for v1 but document that refresh clears it (prefer persistence if auth exists).

---

## Phase 5 — Database (only if required for parity)

Add Supabase migrations under `supabase/migrations/` **only** when UI cannot be satisfied with mapping + existing tables:

| Feature | Suggested schema work |
|---------|------------------------|
| Neighbourhoods index + detail | `neighbourhoods` table; `properties.neighbourhood_id` FK; optional aggregate columns or views |
| Card fields | `monthly_rent_cents` or `rent_display`, `unit_type`, `listing_description` on `properties` |
| Primary photo | `sort_order` on `property_photos` or convention “first by created_at” |
| Public review cards | New columns + policies for safe public text; or stick to insights-only |
| Shortlist | `user_property_shortlist` + RLS |

After each migration: update **`livedin/lib/types.ts`**, API handlers, and **`docs/security/rls.md`** / **`docs/route-access-map.md`**.

---

## Phase 6 — Auth

1. **`/signin` / `/signup`**: use Supabase Auth patterns already in `livedin` (email/OAuth). Style the forms to match Facelift.
2. **Protected routes** (`/dashboard`, optionally `/write-review`): use existing middleware or server checks; redirect unauthenticated users to sign-in.

---

## Acceptance criteria

- [ ] All Facelift consumer routes exist in Next.js with **matching visual output** (spot-check against running Facelift dev server or screenshots).
- [ ] No imports from `New FE/Facelift` at build time; all code lives under `livedin/`.
- [ ] `npm run lint` and `npm run build` pass in `livedin/`.
- [ ] Production deploy on Vercel succeeds with **Root Directory = `livedin`** and documented env vars.
- [ ] Public pages work for anonymous users where allowed; authenticated flows respect RLS.
- [ ] Review submit uses the **real** API and shows server errors gracefully (Sonner/toast or Facelift-equivalent).

---

## Suggested implementation order

1. Tokens + fonts + global layout shell  
2. Shared components + header  
3. Home + search + property detail wired to real data  
4. Write review + auth pages  
5. Neighbourhoods / comparison / dashboard  
6. Optional DB migrations for remaining gaps  
7. Vercel env checklist + production smoke test  

---

## Notes for the implementing agent

- Prefer **small, reviewable PRs** per phase.  
- When Facelift mock data uses fields absent from Postgres, **implement mappers** with `null` fallbacks and TODOs tied to Phase 5 migrations rather than blocking the whole UI.  
- Never expose **service role** keys to the browser.  
- If `vercel.json` is added at repo root, document that it is optional when **Root Directory** is set in the dashboard; avoid duplicating conflicting settings.
