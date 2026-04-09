# Frontend Implementation Prompt — Slice 50 Phase 2 + 4 + 5 (Design System + Consumer UX + Business Portal)

> **Paste this entire prompt into a new Cursor chat to begin implementation.**
> **Work on a feature branch. Do NOT push until you've tested locally.**

---

## Context

You are working on **LivedIn** (`teamrenter/livedin`), a Next.js 16 + Supabase rental review platform. The app already has:
- A working public site: property browse, property detail, review submission, auth (email + Google OAuth)
- A full admin console under `/admin/*` with properties CRUD, moderation, audit, user management
- 21 Supabase migrations (baseline + Phase 3 Slice 50 tables)
- 30+ API routes including new portal and consumer endpoints from Phase 3
- Typed contracts in `livedin/lib/types.ts` (baseline + Phase 3 additions)
- Multi-theme palette system (Palettes 1–5) with CSS variables in `globals.css`
- Shared UI helpers in `livedin/lib/ui.ts` (`cn`, button/card/input classes)
- Auth patterns: `getAdminFromRequest()`, `getLandlordFromRequest()`, browser/server Supabase clients
- Portal client helper in `livedin/lib/portal-client.ts` (analogous to `admin-client.ts`)

**Your task is to implement Slice 50 Phases 2, 4, and 5** — the design-system unification, consumer UX facelift, and business portal frontend. This is frontend-only work: pages, components, layouts, and styling. The backend (migrations, types, API routes) is already in place.

---

## Pre-flight: Read These Files First

Before writing any code, read these files to understand existing patterns and what you're building:

```
# Existing code patterns (READ FIRST)
livedin/app/layout.tsx                           — root layout, font loading, theme script
livedin/app/globals.css                          — CSS variables, theme system, Tailwind v4
livedin/lib/themes.ts                            — theme keys, token types, multi-theme system
livedin/lib/ui.ts                                — shared class helpers (cn, button, card, input classes)
livedin/lib/types.ts                             — ALL type contracts including Phase 3 additions
livedin/app/page.tsx                             — current home page
livedin/app/properties/[id]/page.tsx             — property detail page
livedin/components/PropertyCard.tsx              — current property card
livedin/components/SearchBar.tsx                 — current search bar
livedin/components/auth/PublicSiteHeader.tsx     — current site header
livedin/app/admin/layout.tsx                     — admin layout pattern (portal layout will mirror this)

# API clients (already implemented)
livedin/lib/portal-client.ts                     — portal API fetch wrapper
livedin/lib/admin-client.ts                      — admin API fetch wrapper (reference pattern)
livedin/lib/supabase-browser.ts                  — browser Supabase client

# Specs and docs
slices/50-slice-new-fe-integration-plan.md       — full integration plan (Phase 2, 4, 5 specs)
proj_docs/UI Mockup/themes.md                    — palette system with Palette 6, typography decisions, portal tokens
docs/route-access-map.md                         — page + API route access matrix
proj_docs/obstaclesV2.md                         — standing obstacles (design conflicts, metric model, etc.)

# Reference prototypes (design inspiration ONLY — do NOT copy wholesale)
New FE/Facelift/src/app/pages/                   — consumer page patterns
New FE/Facelift/src/app/components/              — TrustScoreBadge, StepProgress, PropertyCard, ReviewCard
New FE/Business Portal/src/app/components/       — dashboard, review-feed, benchmark, signals, layout
```

---

## Part A — Design-System Unification (Phase 2)

### A1. Typography change: Playfair Display + Inter

**Decision (frozen):** Playfair Display (headings, weight 600–700) + Inter (body, weight 400–600) replaces Geist Sans. Geist Mono is retained for code/monospace.

Update `livedin/app/layout.tsx`:

```typescript
// Replace the Geist import with Playfair_Display and Inter from next/font/google
// Keep Geist_Mono for monospace

import { Playfair_Display, Inter, Geist_Mono } from "next/font/google";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// In the <body> className, replace geistSans.variable with playfair.variable and inter.variable
// <body className={`${playfair.variable} ${inter.variable} ${geistMono.variable} antialiased`}>
```

Update `livedin/app/globals.css`:

```css
/* In the @theme inline block, update font variables: */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-inter);
  --font-heading: var(--font-playfair);
  --font-mono: var(--font-geist-mono);
}

/* Update body font-family: */
body {
  font-family: var(--font-inter), 'Inter', Arial, Helvetica, sans-serif;
}
```

Add heading typography utility classes or apply `font-[family-name:var(--font-playfair)]` to h1/h2/h3 elements globally or via a shared class in `lib/ui.ts`.

### A2. Add Palette 6 (Navy + Amber) to the theme system

Add to `livedin/lib/themes.ts`:

```typescript
// 1. Add "navy-amber" to AppThemeKey union:
export type AppThemeKey =
  | "recommended"
  | "ink-blue-peach-pop"
  | "forest-charcoal"
  | "navy-digital-sky"
  | "aubergine-rose"
  | "navy-amber";

// 2. Add the Palette 6 entry to APP_THEMES array:
{
  key: "navy-amber",
  name: "Navy + Amber",
  description: "Trust-first with warm amber energy — navy authority meets approachable warmth",
  tokens: {
    primaryText: "#0F1F38",
    pageBg: "#F7F4EF",
    surfaceCard: "#FFFFFF",
    surfaceAlt: "#F7F4EF",
    primaryAccent: "#E8913A",
    primaryAccentText: "#FFFFFF",
    softAccent: "#F7F4EF",
    secondaryAccent: "#F59E0B",
    neutralSupport: "#E2DDD6",
    mutedText: "#717182",
  },
},
```

Add the corresponding CSS variables to `globals.css`:

```css
[data-theme="navy-amber"] {
  --background: #F7F4EF;
  --foreground: #0F1F38;
  --theme-surface: #FFFFFF;
  --theme-surface-alt: #F7F4EF;
  --theme-primary: #E8913A;
  --theme-primary-foreground: #FFFFFF;
  --theme-secondary: #F59E0B;
  --theme-border: #E2DDD6;
  --theme-muted: #717182;
}
```

### A3. Add portal-specific CSS variables

Add these to `globals.css` for the business portal sidebar and charts. These are used regardless of active palette but can be overridden per-theme:

```css
:root {
  /* Existing variables... */

  /* Portal sidebar tokens */
  --sidebar-bg: #0F1F3A;
  --sidebar-text: #FFFFFF;
  --sidebar-text-muted: #4D6899;
  --sidebar-accent: #1A2F52;
  --sidebar-border: #2A4266;
  --sidebar-active-text: #F59E0B;

  /* Chart tokens */
  --chart-1: #0F1F3A;
  --chart-2: #F59E0B;
  --chart-3: #3B5580;
  --chart-4: #FBBF24;
  --chart-5: #2A4266;
  --chart-grid: #E5E7EB;
  --chart-axis-text: #6B7280;
  --chart-tooltip-bg: #FFFFFF;
}
```

### A4. Add shared heading class to `lib/ui.ts`

```typescript
export const headingClass = "font-[family-name:var(--font-playfair)] font-semibold";
export const h1Class = `${headingClass} text-3xl sm:text-4xl`;
export const h2Class = `${headingClass} text-2xl sm:text-3xl`;
export const h3Class = `${headingClass} text-xl sm:text-2xl`;
```

### A5. Install new dependencies

```bash
cd livedin
npm install recharts lucide-react
npm install motion    # only if adopting motion transitions for the review wizard
```

**Do NOT install:** `@mui/material`, `@emotion/*`, `next-themes`, `canvas-confetti`, `react-dnd`, `react-slick`, `react-responsive-masonry`, or any React Router packages.

---

## Part B — Consumer UX Adoption (Phase 4)

### B1. Neighbourhood browsing

**Create `livedin/app/neighbourhoods/page.tsx`** — server component.
- Fetch from `GET /api/neighbourhoods` (or use `getSupabaseServerClient()` directly for SSR)
- Render a responsive grid of `NeighbourhoodCard` components
- Support optional `?city=` filter via URL search params
- Display: neighbourhood name, city, property count, average trust score
- Page title: "Neighbourhoods — LivedIn"

**Create `livedin/app/neighbourhoods/[id]/page.tsx`** — server component.
- Fetch from `GET /api/neighbourhoods/[id]`
- Show neighbourhood detail: name, city, description, average trust score
- List linked properties using `PropertyCard`
- Breadcrumb: Home → Neighbourhoods → [Name]

**Create `livedin/components/NeighbourhoodCard.tsx`**:
- Card linking to `/neighbourhoods/[id]`
- Show name, city, property count, average trust score badge
- Use `sectionCardClass` from `lib/ui.ts`
- Reference `New FE/Facelift/src/app/pages/NeighbourhoodsPage.tsx` for visual layout inspiration

### B2. Property comparison

**Create `livedin/app/comparison/page.tsx`** — client component.
- Accept property IDs via URL search params: `?ids=uuid1,uuid2,uuid3`
- Fetch property details for up to 3 properties
- Render a side-by-side comparison table with the **5 canonical metrics** (not 7):
  - `management_responsiveness`
  - `maintenance_timeliness`
  - `listing_accuracy`
  - `fee_transparency`
  - `lease_clarity`
- Also compare: trust score, review count, address, city
- Allow removing properties from comparison
- Mobile: horizontal scroll with sticky first column (property name)
- Reference `New FE/Facelift/src/app/pages/ComparisonPage.tsx` for visual pattern

**Create `livedin/components/ComparisonTable.tsx`**:
- Props: `properties: ComparisonPropertyItem[]`
- Render a responsive table/grid with the 5 metrics
- Include a "No properties selected" empty state

### B3. Enhanced search (home page improvements)

**Update `livedin/app/page.tsx`**:
- Add a filter sidebar or collapsible filter panel:
  - Neighbourhood filter (dropdown or multi-select)
  - Score range filter (minimum trust score)
  - Sort options: highest trust, most reviewed, recently added
- Persist filter/sort state in URL search params (`?sort=trust&minScore=3&neighbourhood=...`)
- Keep existing search bar functionality
- Reference `New FE/Facelift/src/app/pages/HomePage.tsx` for filter layout inspiration

### B4. Trust score visualization components

**Create `livedin/components/TrustScoreBadge.tsx`**:
- Props: `score: DisplayScore0_5`, `reviewCount: number`
- Render a circular or pill badge showing the trust score (0–5 scale)
- Color-code: green (4–5), amber (2.5–3.9), red (0–2.4), gray (no reviews)
- Show confidence indicator based on `reviewCount` (e.g., "12 reviews" or "Not enough data")
- Use semantic token colors from CSS variables
- Reference `New FE/Facelift/src/app/components/TrustScoreBadge.tsx` for visual pattern

**Create `livedin/components/CategoryScoreBar.tsx`**:
- Props: `label: string`, `score: DisplayScore0_5`, `maxScore: 5`
- Render a horizontal bar showing the score with label
- Use `--theme-primary` or `--theme-secondary` for the bar fill
- Show the numeric score beside the bar

**Integrate into existing pages:**
- Add `TrustScoreBadge` to `PropertyCard.tsx`
- Add `CategoryScoreBar` for all 5 metrics on the property detail page

### B5. Renter dashboard

**Create `livedin/app/dashboard/page.tsx`** — client component (auth-gated).
- Check auth: signed-in + verified user required
- Two sections:
  1. **My Reviews** — fetch from `GET /api/reviews?mine=true` or similar, show review status (pending/approved/rejected)
  2. **My Shortlist** — fetch from `GET /api/user/shortlist`, show shortlisted properties
- Empty states for both sections when no data
- Page title: "Dashboard — LivedIn"

**Create `livedin/app/dashboard/layout.tsx`**:
- Auth gate similar to admin layout pattern
- Check for verified user via `GET /api/user/me` or Supabase session
- Show appropriate messages for unauthenticated/unverified users

### B6. Shortlist functionality

**Add shortlist toggle to `PropertyCard.tsx`**:
- Heart/bookmark icon button (use `lucide-react` Heart icon)
- When signed in: toggle via `POST /api/user/shortlist`
- Optimistic UI: toggle icon immediately, rollback on error
- When not signed in: redirect to sign-in or show tooltip

**Create `livedin/components/ShortlistButton.tsx`**:
- Props: `propertyId: string`, `initialShortlisted: boolean`
- Heart icon: filled when shortlisted, outline when not
- Uses `portalFetch` or direct fetch to toggle
- Include `aria-label` for accessibility

### B7. Update `PublicSiteHeader` navigation

**Update `livedin/components/auth/PublicSiteHeader.tsx`**:
- Add navigation links: Neighbourhoods, Dashboard (if signed in)
- Add portal entry point for landlord users: "Portal" link visible when user role is `landlord` or `admin`
- Reference `New FE/Facelift/src/app/components/Header.tsx` for layout

---

## Part C — Business Portal Implementation (Phase 5)

### C1. Portal layout with sidebar

**Create `livedin/app/portal/layout.tsx`** — client component.
- Auth gate: check for `landlord` or `admin` role via `GET /api/portal/me`
- States: `loading`, `unauthenticated`, `forbidden`, `allowed` (mirror admin layout pattern)
- Sidebar navigation with these links:
  - Dashboard (`/portal`)
  - Reviews (`/portal/reviews`)
  - Performance (`/portal/performance`)
  - Benchmarks (`/portal/benchmarks`)
  - Signals (`/portal/signals`)
  - Alerts (`/portal/alerts`)
  - Team (`/portal/team`)
  - Profile (`/portal/profile`)
  - Settings (`/portal/settings`)
- Sidebar uses portal CSS variables: `--sidebar-bg`, `--sidebar-text`, `--sidebar-active-text`, etc.
- Desktop: fixed sidebar (w-64), main content area offset
- Mobile: sidebar collapses; add a toggle button to show/hide as a drawer/overlay
- Include "Public site" and "Sign out" links
- Use `lucide-react` icons for sidebar items (e.g., `LayoutDashboard`, `Star`, `BarChart3`, `Target`, `Radio`, `Bell`, `Users`, `Building2`, `Settings`)

**Reference:** `New FE/Business Portal/src/app/components/layout.tsx` for sidebar design, but rewrite using the canonical portal tokens and CSS variables.

### C2. Portal dashboard (`/portal`)

**Create `livedin/app/portal/page.tsx`** — client component.
- Fetch from `GET /api/portal/properties` using `portalFetch`
- Summary cards at top:
  - Total properties in portfolio
  - Average trust score across portfolio
  - Total reviews across portfolio
  - Properties needing attention (low scores or declining trends)
- Property grid/list below: each card shows property name, trust score badge, review count, trend indicator
- Each card links to property analytics: `/portal/performance?property=[id]`
- Empty state if no portfolio properties

### C3. Portal review feed (`/portal/reviews`)

**Create `livedin/app/portal/reviews/page.tsx`** — client component.
- Fetch reviews across all portfolio properties
- Filter by: property (dropdown), date range, rating
- Each review card shows: property name, reviewer info (anonymized), scores, text excerpt, date, response status
- "Respond" button opens a response form (inline or modal)
- Response form: text input (max 1000 chars), submit as draft (status: `pending`)
- Wire to `POST /api/portal/reviews/[id]/respond`

### C4. Portal analytics screens

**Create `livedin/app/portal/performance/page.tsx`**:
- Category performance charts using **Recharts** (`BarChart` or `RadarChart`)
- Show all 5 metrics for selected property or portfolio average
- Property selector dropdown
- Wire to `GET /api/portal/properties/[id]/analytics`
- Use chart CSS variables: `--chart-1` through `--chart-5`, `--chart-grid`, `--chart-axis-text`

**Create `livedin/app/portal/benchmarks/page.tsx`**:
- Benchmark comparison: portfolio properties vs city/neighbourhood averages
- Use Recharts `BarChart` with grouped bars (property vs benchmark)
- Wire to `GET /api/portal/benchmarks`
- Show each of the 5 metrics side by side

**Create `livedin/app/portal/signals/page.tsx`**:
- Renter sentiment signals for portfolio properties
- Wire to `GET /api/portal/signals`
- Show signal cards with: property name, signal type, label, confidence, date
- Color-code by signal type (positive/negative/neutral)

### C5. Review gap alerts (`/portal/alerts`)

**Create `livedin/app/portal/alerts/page.tsx`**:
- Calculate and display review gaps from portfolio data
- Show properties with low review counts or stale reviews
- "Generate invite link" button (generates a URL to `/submit-review/[propertyId]` that can be shared with tenants)
- List of generated invite links with copy-to-clipboard

### C6. Team management (`/portal/team`)

**Create `livedin/app/portal/team/page.tsx`**:
- List current team members with roles
- Invite form: email + role selector (viewer/editor/admin)
- Change role dropdown for existing members
- Remove member button with confirmation
- Wire to team CRUD API endpoints
- Show pending invitations vs accepted members

### C7. Company profile (`/portal/profile`)

**Create `livedin/app/portal/profile/page.tsx`**:
- Form to view/edit company profile: company name, description, website, contact email, phone
- Save button wires to company profile API
- Read-only display of profile data that's publicly visible

### C8. Notification settings (`/portal/settings`)

**Create `livedin/app/portal/settings/page.tsx`**:
- Toggle switches for each notification preference:
  - New review alert
  - Review response approved
  - Weekly summary
  - Review gap alert
  - Team activity alert
- Auto-save or explicit save button
- Wire to notification preferences API

---

## Part D — Shared Component Patterns

### D1. Page header pattern

**Create `livedin/components/PageHeader.tsx`**:
- Props: `title: string`, `subtitle?: string`, `badge?: string`
- Uses `h1Class` from `lib/ui.ts` for the title
- Browser title tag: use Next.js `metadata` or a `<title>` element for "Page Name — LivedIn"

### D2. Loading and error states

For all new pages, implement:
- **Loading state:** skeleton loader or spinner while data fetches
- **Error state:** friendly error message with retry button
- **Empty state:** appropriate message when no data exists
- Follow the existing `UiListState` / `UiSurfaceState` patterns from `types.ts`

### D3. Breadcrumbs

Wire the existing `livedin/components/ui/Breadcrumbs.tsx` to all new non-root routes:
- `/neighbourhoods` → Home → Neighbourhoods
- `/neighbourhoods/[id]` → Home → Neighbourhoods → [Name]
- `/comparison` → Home → Comparison
- `/dashboard` → Home → Dashboard
- `/portal/*` → Portal → [Section Name]

---

## Implementation Order

Follow this sequence to avoid dependency issues:

1. **Phase 2 — Design tokens** (Part A) — typography + Palette 6 + portal CSS variables + dependency install
2. **Shared components** (Part D) — PageHeader, loading/error patterns
3. **Trust score components** (Part B4) — TrustScoreBadge, CategoryScoreBar
4. **Consumer pages** (Part B1–B3) — neighbourhoods, comparison, enhanced search
5. **Shortlist + dashboard** (Part B5–B6) — shortlist button, dashboard page
6. **Header update** (Part B7) — add new nav links
7. **Portal layout** (Part C1) — sidebar layout + auth gate
8. **Portal dashboard** (Part C2) — portfolio overview
9. **Portal review feed** (Part C3) — review browsing + response drafting
10. **Portal analytics** (Part C4) — performance, benchmarks, signals charts
11. **Portal remaining** (Part C5–C8) — alerts, team, profile, settings

---

## Key Constraints

- **Do NOT copy New FE components wholesale** — rewrite against canonical types and tokens
- **Use the 5-metric model** (`management_responsiveness`, `maintenance_timeliness`, `listing_accuracy`, `fee_transparency`, `lease_clarity`) — the 7-category model from the prototypes is rejected
- **Do NOT add MUI, Emotion, next-themes, or React Router** — use existing patterns only
- **All data must come from API routes** — no mock data, no direct Supabase queries from client components
- **Server components by default** — use `"use client"` only for interactive elements (filters, forms, shortlist toggles, portal pages)
- **Use existing `lib/ui.ts` class helpers** — `cn`, `sectionCardClass`, `primaryButtonClass`, etc.
- **Use CSS variables for all colors** — no hardcoded hex values in components
- **Use `lucide-react` for icons** — no other icon library
- **Use `recharts` for charts** — only in portal analytics pages
- **Respect the multi-theme system** — all components must look correct across all 6 palettes
- **Match existing code style** — check for semicolon usage, import patterns, component structure
- **All portal routes must be auth-gated** — mirror the admin layout auth pattern
- **Portal data must use `portalFetch`** — the client-side fetch wrapper with Bearer token
- **Add `aria-label`, `role`, and keyboard navigation** to all interactive elements

---

## File Summary — What You're Creating

```
# Phase 2 (Design System)
MODIFY  livedin/app/layout.tsx                    — new fonts
MODIFY  livedin/app/globals.css                   — Palette 6 + portal tokens + typography
MODIFY  livedin/lib/themes.ts                     — add "navy-amber" theme
MODIFY  livedin/lib/ui.ts                         — heading classes

# Phase 4 (Consumer UX)
CREATE  livedin/app/neighbourhoods/page.tsx
CREATE  livedin/app/neighbourhoods/[id]/page.tsx
CREATE  livedin/app/comparison/page.tsx
MODIFY  livedin/app/page.tsx                      — enhanced filters/sort
CREATE  livedin/app/dashboard/page.tsx
CREATE  livedin/app/dashboard/layout.tsx
CREATE  livedin/components/NeighbourhoodCard.tsx
CREATE  livedin/components/ComparisonTable.tsx
CREATE  livedin/components/TrustScoreBadge.tsx
CREATE  livedin/components/CategoryScoreBar.tsx
CREATE  livedin/components/ShortlistButton.tsx
MODIFY  livedin/components/PropertyCard.tsx        — trust badge + shortlist button
MODIFY  livedin/components/auth/PublicSiteHeader.tsx — nav links + portal entry

# Phase 5 (Business Portal)
CREATE  livedin/app/portal/layout.tsx
CREATE  livedin/app/portal/page.tsx
CREATE  livedin/app/portal/reviews/page.tsx
CREATE  livedin/app/portal/performance/page.tsx
CREATE  livedin/app/portal/benchmarks/page.tsx
CREATE  livedin/app/portal/signals/page.tsx
CREATE  livedin/app/portal/alerts/page.tsx
CREATE  livedin/app/portal/team/page.tsx
CREATE  livedin/app/portal/profile/page.tsx
CREATE  livedin/app/portal/settings/page.tsx

# Shared components
CREATE  livedin/components/PageHeader.tsx
```

---

## Local Testing Instructions

### Prerequisites

- Node.js 20+ (`node --version`)
- Supabase CLI installed (`supabase --version`)
- Docker running (required for local Supabase)
- Phase 3 backend must be complete (migrations, types, API routes all in place)

### Step 1: Create a feature branch

```bash
cd ~/School/teamrenter
git checkout -b feat/slice50-phase4-5-frontend
```

### Step 2: Verify backend is ready

```bash
# From the repo root (where supabase/ directory lives)
supabase stop
supabase start
supabase db reset   # apply ALL migrations — should succeed with zero errors

# Verify in Supabase Studio (http://localhost:54323):
# - neighbourhoods, portfolio_properties, user_shortlists, etc. tables exist
# - Test data is seeded
```

### Step 3: Set up environment variables

```bash
cd livedin

# .env.local should already exist from Phase 3 work. If not:
cat > .env.local << 'EOF'
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<your-local-anon-key-from-supabase-status>
SUPABASE_SERVICE_ROLE_KEY=<your-local-service-role-key-from-supabase-status>
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-local-anon-key-from-supabase-status>
EOF
```

Get the keys from `supabase status` output.

### Step 4: Install dependencies and start dev server

```bash
cd livedin
npm install recharts lucide-react
npm install    # ensure all deps are resolved
npm run dev
```

The dev server runs at `http://localhost:3000`.

### Step 5: Test Phase 2 (Design System)

1. Open `http://localhost:3000` — verify Playfair Display renders on headings, Inter on body text
2. Open the theme picker — verify Palette 6 ("Navy + Amber") appears and looks correct
3. Cycle through all 6 palettes — verify no visual breakage on any existing page
4. Check the browser console for any font loading errors

### Step 6: Test Phase 4 (Consumer UX)

#### Neighbourhoods
```bash
# Open in browser:
http://localhost:3000/neighbourhoods          # should show neighbourhood grid
http://localhost:3000/neighbourhoods/<id>      # should show neighbourhood detail with properties
```

#### Comparison
```bash
# Get property IDs from the home page, then:
http://localhost:3000/comparison?ids=<id1>,<id2>,<id3>
# Should show side-by-side comparison with 5 metrics
```

#### Enhanced search
```bash
http://localhost:3000
# Test the filter sidebar:
# - Select a neighbourhood → URL updates, results filter
# - Set a minimum score → results filter
# - Change sort order → results re-sort
# - Refresh → filters persist from URL params
```

#### Shortlist
```bash
# Sign in as a verified user
# Click the heart icon on a property card → should toggle
# Navigate away and back → shortlist state should persist
# Open /dashboard → shortlisted properties should appear
```

#### Dashboard
```bash
http://localhost:3000/dashboard
# Must be signed in as verified user
# Should show "My Reviews" and "My Shortlist" sections
# If not signed in → should show auth prompt
```

### Step 7: Test Phase 5 (Business Portal)

#### Sign in as a landlord user

```bash
# In the browser, sign in with the seeded landlord account
# (check supabase/seed.sql for the landlord email and password)
# Or use the Supabase Auth API:
curl -s -X POST http://127.0.0.1:54321/auth/v1/token?grant_type=password \
  -H "apikey: <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"email":"landlord@example.com","password":"seedpassword"}'
```

#### Portal pages
```bash
# After signing in as landlord, navigate to:
http://localhost:3000/portal                  # dashboard with portfolio properties
http://localhost:3000/portal/reviews          # review feed with filter/respond
http://localhost:3000/portal/performance      # category performance charts
http://localhost:3000/portal/benchmarks       # benchmark comparison charts
http://localhost:3000/portal/signals          # renter sentiment signals
http://localhost:3000/portal/alerts           # review gap alerts
http://localhost:3000/portal/team             # team management
http://localhost:3000/portal/profile          # company profile
http://localhost:3000/portal/settings         # notification preferences
```

#### Auth gating tests
```bash
# Sign out → navigate to /portal → should show "Sign in" prompt
# Sign in as a regular verified user → navigate to /portal → should show "Forbidden"
# Sign in as admin → navigate to /portal → should be allowed (admins can access portal)
```

### Step 8: Cross-cutting checks

```bash
# Type check
cd livedin
npx tsc --noEmit

# Lint
npm run lint

# Run existing smoke tests to confirm nothing is broken
npm run api:test
```

#### Mobile responsiveness
- Open Chrome DevTools → toggle device toolbar
- Test at 375px, 768px, 1024px, 1440px widths:
  - Home page filters should stack vertically on mobile
  - Portal sidebar should collapse to a drawer on mobile
  - Comparison table should scroll horizontally on mobile
  - Neighbourhood grid should go from multi-column to single-column

#### Theme consistency
- Switch through all 6 palettes on:
  - Home page
  - Neighbourhood pages
  - Dashboard
  - Portal (sidebar + content)
- Verify no hardcoded colors break the theming

### Step 9: Final checklist before pushing

- [ ] `npm run dev` starts without errors
- [ ] `npx tsc --noEmit` passes (no type errors)
- [ ] `npm run lint` passes
- [ ] All 6 themes render correctly across all new pages
- [ ] Playfair Display loads on headings, Inter loads on body text
- [ ] Neighbourhoods page renders with real data
- [ ] Comparison page shows 5-metric side-by-side (not 7)
- [ ] Home page filters work and persist in URL
- [ ] Dashboard shows reviews and shortlist (auth-gated)
- [ ] Shortlist toggle works on property cards
- [ ] Portal sidebar renders with all navigation links
- [ ] Portal is gated to landlord/admin roles
- [ ] Portal dashboard shows real portfolio data
- [ ] Portal charts render (Recharts) with real data
- [ ] Mobile: sidebar collapses, tables scroll, grids stack
- [ ] No hardcoded hex values in new components (use CSS variables)
- [ ] No MUI, Emotion, or React Router imports in any file
- [ ] `npm run api:test` still passes
- [ ] No `.env` or secret files are staged (`git status`)

---

## Troubleshooting

### "Module not found" for recharts or lucide-react
```bash
cd livedin && npm install recharts lucide-react
```

### Fonts not loading
- Check the browser Network tab for font requests
- Verify `next/font/google` imports match exact font family names: `Playfair_Display`, `Inter`, `Geist_Mono`
- Clear the Next.js cache: `rm -rf livedin/.next && npm run dev`

### Portal shows "forbidden" for landlord user
- Verify the seeded user has `role = 'landlord'` in the `profiles` table (check Supabase Studio)
- Verify `GET /api/portal/me` returns 200 with the landlord's token:
  ```bash
  curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/portal/me
  ```

### Charts don't render
- Recharts requires the container to have explicit width/height. Wrap chart components in a `div` with `className="w-full h-[400px]"` or use `ResponsiveContainer` from recharts.

### Theme variables not applying
- Check that `data-theme` attribute is set on the `<html>` element (inspect in DevTools)
- Verify the theme key in `globals.css` matches the key in `themes.ts`

### Supabase connection errors
- Run `supabase status` to verify the local instance is running
- Check that `.env.local` keys match the output of `supabase status`
- Run `supabase db reset` if the schema seems stale
