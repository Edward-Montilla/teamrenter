# Cursor Prompt — Facelift on Livedin: **Remaining Gaps**

> **Paste this entire prompt into a new Cursor chat on the `teamrenter` repo.**  
> **Work on a feature branch. From `livedin/`, run `npm run lint` and `npm run build` before opening a PR.**

This prompt **continues** [`prompts/facelift-livedin-vercel-implementation.md`](./facelift-livedin-vercel-implementation.md). Do **not** redo work listed under “Already shipped” unless you are fixing a bug or aligning visuals.

---

## Goal

Close the **functional and visual gaps** so the consumer surface matches the Facelift prototype (`New FE/Facelift/src/`) and the original acceptance criteria: real data only (no `mockData.ts`), five canonical review metrics in the API with **seven category bars mapped in the UI** (document the mapping in code), RLS-safe public data, and graceful errors (e.g. Sonner).

**Visual source of truth:** `New FE/Facelift/src/`  
**Data / auth source of truth:** `livedin/lib/types.ts`, `lib/property-detail.ts`, `/api/*`, `docs/route-access-map.md`, `docs/security/rls.md`

---

## Non-goals (unchanged)

- Do **not** implement **New FE/Business Portal** here.
- Do **not** import `New FE/Facelift` at runtime or build time — **copy** components and assets into `livedin/`.
- Do **not** add a seven-metric storage model; **map** Facelift’s seven UI bars from the **five** stored scores (see `slices/50-slice-new-fe-integration-plan.md` if needed).

---

## Already shipped (baseline — do not duplicate)

Skim these paths; extend them rather than replacing wholesale:

| Area | Location |
|------|-----------|
| Facelift shell | `livedin/app/(facelift)/layout.tsx` — `[data-ui="facelift"]`, `FaceliftHeader`, `FaceliftToaster` |
| Tokens + fonts | `livedin/styles/facelift-theme.css`, `livedin/app/globals.css` (`tw-animate-css`), Lora + DM Sans in `app/layout.tsx` |
| Home + search (real API) | `livedin/components/facelift/FaceliftHomePage.tsx`, `FaceliftSearchPage.tsx` |
| List API + card fields | `GET /api/properties` includes `primary_image_url`; `PropertyListItem` in `lib/types.ts` |
| Trust display mapping | `livedin/lib/facelift-mappers.ts` (`trustScoreDisplayFacelift`, placeholders for rent/type/neighbourhood) |
| Ported pieces | `components/facelift/FaceliftPropertyCard.tsx`, `TrustScoreBadge.tsx`, `ui/button.tsx`, `ui/utils.ts` |
| Property detail route | `livedin/app/(facelift)/properties/[id]/page.tsx` — **still old slate-themed layout** (see Gap 1) |
| Redirects | `livedin/next.config.ts`: `/signin` → `/sign-in`, `/write-review` → `/submit-review/new` |
| Stubs | `app/(facelift)/dashboard/page.tsx`, `neighbourhoods/page.tsx`, `comparison/page.tsx` |

---

## Gap 1 — Property detail page (Facelift `PropertyProfilePage`)

**Problem:** `/properties/[id]` uses the pre-Facelift card/metric UI (`sectionCardClass`, slate tokens) while sitting inside the Facelift chrome.

**Do:**

1. Read `New FE/Facelift/src/app/pages/PropertyProfilePage.tsx` and related components (`CategoryScoreBar`, hero, description blocks).
2. Rebuild the page (Server Component where possible) using **`getPropertyDetail`** or the existing **`GET /api/properties/[id]`** shape — same data rules as today (public aggregates, distilled insights only; **no fabricated review quotes** if RLS forbids `text_input`).
3. Implement **seven category bars** in the UI by **mapping** from `PropertyDetailPublic.aggregates` five `display_*_0_5` fields. Add a single module (e.g. extend `lib/facelift-mappers.ts` or `lib/facelift-property-detail.ts`) with a short comment matrix: which Facelift bar → which stored metric(s) or derived value.
4. Hero: first photo with URL from existing photo pipeline; fallback that matches Facelift layout (empty state, not random mock images).
5. Keep links consistent: review CTA → existing `/submit-review/[propertyId]` (or align with redirects if you add a dedicated `/write-review` flow).

**Verify:** Anonymous user can open an active property; no 500s; visuals match Facelift spacing/typography/colours under `[data-ui="facelift"]`.

---

## Gap 2 — Facelift `components/ui/*` and shared widgets

**Problem:** Only `button` + `utils` exist under `components/facelift/ui/`. Facelift pages expect sliders, cards, tabs, progress, etc.

**Do:**

1. Inventory `New FE/Facelift/src/app/components/ui/*.tsx` and copy **only what Gap 1–4 need** into `livedin/components/facelift/ui/`.
2. Swap `react-router` → `next/link`, `useNavigate` / `useParams` → `next/navigation`.
3. Add any **missing** npm dependencies (Radix packages, etc.) to `livedin/package.json` — mirror Facelift versions where practical.
4. Copy shared pieces as needed: `CategoryScoreBar`, `ReviewCard` (insights-only or empty state), `StepProgress`, `figma/ImageWithFallback`, etc.

---

## Gap 3 — Write review flow (Facelift multi-step → real POST)

**Problem:** Review UX lives at `app/submit-review/...` with the old design; Facelift expects a multi-step experience at `/write-review` (redirect currently sends users to `/submit-review/new`).

**Do:**

1. Read `New FE/Facelift/src/app/pages/WriteReviewPage.tsx` and wire steps to **`POST /api/properties/[id]/reviews`** using `ReviewCreateInput` (`lib/types.ts`) — **five** numeric fields server-side.
2. Implement **seven sliders** (or Facelift controls) on the client and map → **five** scores with a **documented** matrix in one file (comment block + pure functions).
3. Reuse or replace `livedin/components/reviews/*` only where it speeds things up; end state should **look** like Facelift and **call** the real API.
4. Surface validation and server errors with **Sonner** (Toaster already in `(facelift)` layout) or equivalent.
5. Decide URL strategy: either implement `app/(facelift)/write-review/page.tsx` and adjust redirects, or restyle `submit-review` under the Facelift layout — **one** canonical UX; update `FaceliftHeader` links if paths change.

**Verify:** Signed-in user with permission can submit; RLS errors show a clear toast/message.

---

## Gap 4 — Auth pages (Facelift look, Livedin behaviour)

**Problem:** `app/sign-in/page.tsx` (and any signup flow) is not Facelift-styled.

**Do:**

1. Read `New FE/Facelift/src/app/pages/SignInPage.tsx` and `SignUpPage.tsx`.
2. Restyle existing Supabase auth forms to match Facelift (or port layout wrappers) **without** breaking current auth behaviour.
3. If signup is not a first-class route yet, either add `app/(facelift)/sign-up/page.tsx` or document “signup via …” and link from the Facelift header/footer consistently.

---

## Gap 5 — Protected dashboard + shortlist

**Problem:** `app/(facelift)/dashboard/page.tsx` is a static placeholder.

**Do:**

1. Read `New FE/Facelift/src/app/pages/DashboardPage.tsx` for target layout.
2. **Auth gate:** redirect unauthenticated users to `/sign-in` (middleware in `livedin/middleware.ts` or server checks in the page/layout — follow patterns in `docs/route-access-map.md`).
3. **Shortlist:** either persist (`user_property_shortlist` + API + RLS — Phase 5 DB) or keep **client-only** but make the empty/loaded states match Facelift and document refresh behaviour in a code comment (parent prompt preferred persistence when auth exists).

---

## Gap 6 — Neighbourhoods + comparison (replace stubs)

**Problem:** `/neighbourhoods` and `/comparison` are copy stubs.

**Do:**

1. Read Facelift `NeighbourhoodsPage.tsx`, `NeighbourhoodPage.tsx`, `ComparisonPage.tsx`.
2. If **no** `neighbourhoods` table exists, render Facelift **layout** with honest empty states and links to `/search` (no fake neighbourhood rows). Optionally add `app/(facelift)/neighbourhoods/[id]/page.tsx` that 404s or “coming soon” with correct chrome.
3. **Comparison:** implement client-side comparison from **shortlist or selected IDs** if DB is not ready; when shortlist is client-only, comparison can be client-only too — still match Facelift grid behaviour.

---

## Gap 7 — Optional API: public reviews list

**Only if product + RLS allow public excerpts.**

If not approved, keep property page on **distilled insights** + Facelift-shaped empty review section (no fake `ReviewCard` text).

If approved: migration + policies + `GET /api/properties/[id]/reviews` + update `docs/security/rls.md` and `docs/route-access-map.md`.

---

## Gap 8 — Vercel / env (verification)

- Confirm **Root Directory = `livedin`** and env vars match `livedin/README.md` (including optional `PROPERTY_PHOTO_BASE_URL` for card images).
- Run production smoke: `/`, `/search`, `/properties/:id`, sign-in, submit-review path used after Gap 3.

---

## Pre-flight file list (read first)

```
livedin/app/(facelift)/layout.tsx
livedin/app/(facelift)/properties/[id]/page.tsx
livedin/lib/facelift-mappers.ts
livedin/lib/types.ts
livedin/lib/property-detail.ts
livedin/app/api/properties/[id]/route.ts
livedin/app/api/properties/[id]/reviews/route.ts
livedin/components/reviews/SubmitReviewPageClient.tsx   # or current submit-review entry
docs/route-access-map.md
docs/security/rls.md

New FE/Facelift/src/app/pages/PropertyProfilePage.tsx
New FE/Facelift/src/app/pages/WriteReviewPage.tsx
New FE/Facelift/src/app/pages/DashboardPage.tsx
New FE/Facelift/src/app/pages/SignInPage.tsx
```

---

## Acceptance criteria (this pass)

- [ ] Property detail matches Facelift **layout and styling** under `[data-ui="facelift"]`, fed by real `PropertyDetailPublic` data.
- [ ] Seven UI category bars are explained by a **documented map** from five stored display metrics.
- [ ] Write-review path uses **POST** review API; seven controls → five payload fields; errors surfaced in UI.
- [ ] Sign-in (and signup if applicable) **looks** like Facelift; auth still correct.
- [ ] Dashboard is auth-gated and no longer a bare placeholder (even if shortlist is client-only temporarily, state must be honest).
- [ ] Neighbourhoods / comparison: Facelift-level structure — no mock neighbourhood data unless backed by DB.
- [ ] `npm run lint` and `npm run build` pass in `livedin/`.
- [ ] No imports from `New FE/Facelift` in built code.

---

## Suggested implementation order

1. Gap 1 (property detail) + Gap 2 (ui primitives needed for it)  
2. Gap 3 (write review)  
3. Gap 4 (auth styling)  
4. Gap 5 (dashboard + shortlist)  
5. Gap 6 (neighbourhoods + comparison)  
6. Gap 7 (only if explicitly approved)  
7. Gap 8 (deploy checklist)

---

## Notes for the agent

- Prefer **small PRs** per gap.  
- When Postgres lacks a Facelift field, use **mappers + null/placeholder** and reference “Phase 5” in comments rather than blocking.  
- After any migration or new API: update **`docs/security/rls.md`** and **`docs/route-access-map.md`**.  
- Never expose service-role keys to the client.
