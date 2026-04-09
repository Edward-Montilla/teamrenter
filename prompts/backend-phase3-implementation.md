# Backend Implementation Prompt — Slice 50 Phase 3 (Schema + Types + API Routes)

> **Paste this entire prompt into a new Cursor chat to begin implementation.**
> **Work on a feature branch. Do NOT push until you've tested locally.**

---

## Context

You are working on **LivedIn** (`teamrenter/livedin`), a Next.js 16 + Supabase rental review platform. The app already has:
- 13 Supabase migrations in `supabase/migrations/` (schema through admin console support)
- 20 API route handlers under `livedin/app/api/` (public properties, reviews, full admin CRUD)
- Typed contracts in `livedin/lib/types.ts`
- RLS with helper functions `is_admin()`, `is_verified()` in the database
- Auth patterns: `getAdminFromRequest()` in `lib/admin-auth.ts`, browser/server Supabase clients

**Your task is to implement Slice 50 Phase 3** — the backend foundation for the Business Portal (landlord) and Consumer UX expansion. This is purely backend/data work: migrations, types, auth helpers, API route handlers, and validation. No frontend pages.

---

## Pre-flight: Read These Files First

Before writing any code, read these files to understand the existing patterns:

```
livedin/lib/types.ts                          — all current type contracts
livedin/lib/supabase-server.ts                — server Supabase client pattern
livedin/lib/admin-auth.ts                     — admin auth helper pattern (you'll create a parallel one for landlord)
livedin/app/api/properties/route.ts           — example public API route
livedin/app/api/admin/me/route.ts             — example admin-gated route
livedin/app/api/admin/properties/route.ts     — example admin CRUD route
livedin/lib/admin-client.ts                   — example client-side fetch wrapper
livedin/lib/validation/review.ts              — example validation schema
supabase/migrations/20250305120000_slice04_db_foundation.sql  — baseline schema
supabase/migrations/20250305130000_slice05_rls_roles.sql      — baseline RLS
proj_docs/Schema & ERD.md                     — PART 2 has exact column specs for all 8 new tables
docs/security/rls.md                          — RLS policy specs for all new tables
docs/route-access-map.md                      — API access matrix
slices/50-slice-new-fe-integration-plan.md    — Phase 3 spec
```

---

## Part A — Database Migrations (8 new tables + 2 alterations)

Create migration files in `supabase/migrations/`. Use timestamps starting from `20260409` and sequential ordering. All migrations are **additive only** — do not modify existing tables' columns or drop anything.

### Migration 1: `20260409100000_slice50_neighbourhoods.sql`

Create the `neighbourhoods` table and add `neighbourhood_id` FK to `properties`.

```sql
-- Table: neighbourhoods
-- Columns: id (uuid PK), name (text NOT NULL), city (text NOT NULL), province (text NOT NULL),
--   description (text nullable), property_count (integer NOT NULL default 0),
--   avg_trust_score (numeric(3,2) nullable), created_at, updated_at
-- Unique constraint: (name, city)
-- Trigger: set_updated_at on BEFORE UPDATE

-- Alter properties: ADD COLUMN neighbourhood_id uuid REFERENCES neighbourhoods(id) ON DELETE SET NULL
-- Index on properties(neighbourhood_id)

-- Enable RLS on neighbourhoods
-- Policies:
--   neighbourhoods_select_public: SELECT for everyone (USING true)
--   neighbourhoods_insert_admin: INSERT for is_admin()
--   neighbourhoods_update_admin: UPDATE for is_admin()
--   neighbourhoods_delete_admin: DELETE for is_admin()
```

### Migration 2: `20260409100100_slice50_user_shortlists.sql`

```sql
-- Table: user_shortlists
-- Columns: id (uuid PK), user_id (uuid FK profiles ON DELETE CASCADE),
--   property_id (uuid FK properties ON DELETE CASCADE), created_at
-- Unique: (user_id, property_id)
-- Enable RLS
-- Policies:
--   shortlists_select_own: SELECT WHERE auth.uid() = user_id
--   shortlists_insert_own: INSERT WITH CHECK auth.uid() = user_id AND is_verified()
--   shortlists_delete_own: DELETE WHERE auth.uid() = user_id
--   shortlists_select_admin: SELECT WHERE is_admin()
```

### Migration 3: `20260409100200_slice50_portfolio_properties.sql`

```sql
-- Table: portfolio_properties
-- Columns: id (uuid PK), user_id (uuid FK profiles ON DELETE CASCADE),
--   property_id (uuid FK properties ON DELETE CASCADE), added_at (timestamptz default now())
-- Unique: (user_id, property_id)
-- Enable RLS
-- Policies:
--   portfolio_select_own: SELECT WHERE auth.uid() = user_id OR user is team member of owner
--   portfolio_insert_admin: INSERT WITH CHECK is_admin()
--   portfolio_delete_admin: DELETE WHERE is_admin()
--   portfolio_select_admin: SELECT WHERE is_admin()
```

### Migration 4: `20260409100300_slice50_team_members.sql`

```sql
-- Table: team_members
-- Columns: id (uuid PK), owner_user_id (uuid FK profiles ON DELETE CASCADE),
--   member_user_id (uuid FK profiles ON DELETE CASCADE),
--   role (text NOT NULL CHECK IN ('viewer','editor','admin') default 'viewer'),
--   invited_email (text NOT NULL), accepted_at (timestamptz nullable),
--   created_at, updated_at
-- Unique: (owner_user_id, member_user_id)
-- CHECK: owner_user_id != member_user_id
-- Trigger: set_updated_at
-- Enable RLS
-- Policies per docs/security/rls.md
```

### Migration 5: `20260409100400_slice50_notification_preferences.sql`

```sql
-- Table: notification_preferences
-- Columns: user_id (uuid PK FK profiles ON DELETE CASCADE),
--   new_review_alert (boolean default true), review_response_approved (boolean default true),
--   weekly_summary (boolean default false), review_gap_alert (boolean default true),
--   team_activity_alert (boolean default true), updated_at
-- Trigger: set_updated_at
-- Enable RLS
-- Policies: notif_select_own, notif_upsert_own (auth.uid() = user_id)
```

### Migration 6: `20260409100500_slice50_review_response_drafts.sql`

```sql
-- Table: review_response_drafts
-- Columns: id (uuid PK), review_id (uuid FK reviews ON DELETE CASCADE),
--   author_user_id (uuid FK profiles ON DELETE CASCADE),
--   body (text NOT NULL CHECK length <= 1000),
--   status (text NOT NULL default 'pending' CHECK IN ('pending','approved','rejected')),
--   reviewed_by (uuid nullable FK profiles ON DELETE SET NULL),
--   reviewed_at (timestamptz nullable), created_at, updated_at
-- Partial unique index: UNIQUE(review_id) WHERE status = 'approved'
-- Trigger: set_updated_at
-- Enable RLS
-- Policies per docs/security/rls.md
```

### Migration 7: `20260409100600_slice50_benchmark_averages.sql`

```sql
-- Table: benchmark_averages
-- Columns: id (uuid PK), scope_type (text CHECK IN ('city','neighbourhood')),
--   scope_value (text NOT NULL), neighbourhood_id (uuid nullable FK neighbourhoods ON DELETE CASCADE),
--   avg_management_responsiveness/timeliness/accuracy/transparency/clarity (numeric(3,2)),
--   avg_trust_score (numeric(3,2)), property_count (integer default 0),
--   review_count (integer default 0), computed_at (timestamptz default now())
-- Unique: (scope_type, scope_value)
-- Enable RLS
-- Policies: benchmarks_select_public (everyone), benchmarks_crud_admin (is_admin())
```

### Migration 8: `20260409100700_slice50_company_profiles.sql`

```sql
-- Table: company_profiles
-- Columns: user_id (uuid PK FK profiles ON DELETE CASCADE), company_name (text NOT NULL),
--   description (text nullable CHECK length <= 2000), website_url, contact_email,
--   contact_phone, logo_r2_key (all text nullable), created_at, updated_at
-- Trigger: set_updated_at
-- Enable RLS
-- Policies: company_select_public, company_upsert_own (landlord), company_select_admin
```

### Migration 9: `20260409100800_slice50_landlord_role_and_helpers.sql`

```sql
-- 1. Alter profiles role CHECK to include 'landlord':
--    ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
--    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
--      CHECK (role IN ('public','verified','admin','landlord'));

-- 2. Create is_landlord() SECURITY DEFINER function
-- 3. Create is_portfolio_member(property_uuid) function
-- 4. Create recompute_neighbourhood_aggregates(neighbourhood_uuid) function
-- 5. Create recompute_benchmark_averages(scope_type, scope_value) function

-- 6. Create views:
--    v_portfolio_overview: portfolio_properties → properties → property_aggregates
--    v_neighbourhood_browse: neighbourhoods with counts/scores
--    v_review_with_response: reviews joined to approved review_response_drafts
```

---

## Part B — TypeScript Types

Add the following types to `livedin/lib/types.ts`. Follow existing patterns (use `DisplayScore0_5` where applicable, ISO timestamp strings, etc.).

```typescript
// --- Slice 50: Roles ---
// Update CurrentUserRole to include 'landlord':
export type CurrentUserRole = "public" | "verified" | "admin" | "landlord";

// --- Slice 50: Neighbourhoods (Consumer UX) ---
export type NeighbourhoodListItem = {
  id: string;
  name: string;
  city: string;
  province: string;
  description: string | null;
  property_count: number;
  avg_trust_score: DisplayScore0_5;
};

export type NeighbourhoodDetail = NeighbourhoodListItem & {
  properties: PropertyListItem[];
};

export type NeighbourhoodSearchResponse = {
  items: NeighbourhoodListItem[];
  total: number;
};

// --- Slice 50: User Shortlists (Consumer UX) ---
export type UserShortlistItem = {
  property_id: string;
  display_name: string;
  address_line1: string;
  city: string;
  trustscore_display_0_5: DisplayScore0_5;
  added_at: string;
};

export type ShortlistToggleInput = {
  property_id: string;
};

export type ShortlistToggleResponse = {
  action: "added" | "removed";
  property_id: string;
};

// --- Slice 50: Property Comparison (Consumer UX) ---
export type ComparisonPropertyItem = PropertyDetailPublic & {
  neighbourhood: string | null;
};

// --- Slice 50: Business Portal ---
export type PortfolioPropertyItem = {
  id: string;
  display_name: string;
  address_line1: string;
  city: string;
  province: string;
  trustscore_display_0_5: DisplayScore0_5;
  review_count: number;
  vacancy_status: "occupied" | "vacant" | "unknown";
  trend: "improving" | "stable" | "declining";
};

export type PortfolioOverviewResponse = {
  properties: PortfolioPropertyItem[];
  total: number;
};

export type BenchmarkData = {
  scope_type: "city" | "neighbourhood";
  scope_value: string;
  avg_trust_score: number | null;
  avg_management_responsiveness: number | null;
  avg_maintenance_timeliness: number | null;
  avg_listing_accuracy: number | null;
  avg_fee_transparency: number | null;
  avg_lease_clarity: number | null;
  property_count: number;
  review_count: number;
  computed_at: string;
};

export type BenchmarkResponse = {
  items: BenchmarkData[];
};

export type RenterSignal = {
  property_id: string;
  display_name: string;
  signal_type: string;
  signal_label: string;
  confidence: number | null;
  detected_at: string;
};

export type RenterSignalsResponse = {
  signals: RenterSignal[];
};

export type ReviewResponseDraft = {
  id: string;
  review_id: string;
  author_user_id: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReviewResponseCreateInput = {
  body: string;
};

export type TeamMemberItem = {
  id: string;
  owner_user_id: string;
  member_user_id: string;
  member_email: string;
  role: "viewer" | "editor" | "admin";
  accepted_at: string | null;
  created_at: string;
};

export type TeamMemberInviteInput = {
  email: string;
  role: "viewer" | "editor" | "admin";
};

export type NotificationPreference = {
  new_review_alert: boolean;
  review_response_approved: boolean;
  weekly_summary: boolean;
  review_gap_alert: boolean;
  team_activity_alert: boolean;
};

export type CompanyProfile = {
  company_name: string;
  description: string | null;
  website_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  logo_r2_key: string | null;
};
```

---

## Part C — Auth Helper: `getLandlordFromRequest`

Create `livedin/lib/portal-auth.ts` — modeled after `lib/admin-auth.ts` but checking for `landlord` or `admin` role.

```typescript
// Pattern: extract Bearer token from Authorization header → verify with Supabase →
// check profiles.role IN ('landlord', 'admin') → return user or null
// Export: getLandlordFromRequest(req: NextRequest): Promise<{ id: string; role: string } | null>
```

---

## Part D — API Route Handlers

Create these API routes. Follow the existing patterns in the codebase exactly (use `NextResponse.json`, `getSupabaseServerClient`, auth helpers, etc.).

### Consumer UX Routes

1. **`livedin/app/api/neighbourhoods/route.ts`** — `GET`
   - Public (no auth)
   - Query `neighbourhoods` table, return `NeighbourhoodSearchResponse`
   - Support optional `?city=` filter

2. **`livedin/app/api/neighbourhoods/[id]/route.ts`** — `GET`
   - Public (no auth)
   - Fetch neighbourhood by ID + its linked active properties with aggregates
   - Return `NeighbourhoodDetail`

3. **`livedin/app/api/user/shortlist/route.ts`** — `GET` and `POST`
   - Requires auth (Bearer token, any verified user)
   - `GET`: return user's shortlisted properties as `UserShortlistItem[]`
   - `POST`: toggle shortlist (add if not exists, remove if exists), return `ShortlistToggleResponse`

### Portal Routes (landlord-gated)

4. **`livedin/app/api/portal/me/route.ts`** — `GET`
   - Uses `getLandlordFromRequest`
   - Returns `{ id, role }` or 401/403

5. **`livedin/app/api/portal/properties/route.ts`** — `GET`
   - Uses `getLandlordFromRequest`
   - Query `portfolio_properties` → `properties` → `property_aggregates` for the authenticated landlord
   - Return `PortfolioOverviewResponse`

6. **`livedin/app/api/portal/properties/[id]/reviews/route.ts`** — `GET`
   - Uses `getLandlordFromRequest`
   - Verify property is in landlord's portfolio
   - Return reviews for the property (approved only for landlords, all for admins)

7. **`livedin/app/api/portal/properties/[id]/analytics/route.ts`** — `GET`
   - Uses `getLandlordFromRequest`
   - Return aggregate data + category performance for a portfolio property

8. **`livedin/app/api/portal/benchmarks/route.ts`** — `GET`
   - Uses `getLandlordFromRequest`
   - Return benchmark averages for the landlord's portfolio cities/neighbourhoods

9. **`livedin/app/api/portal/signals/route.ts`** — `GET`
   - Uses `getLandlordFromRequest`
   - Return renter sentiment signals for portfolio properties
   - Initially can return computed signals from low-scoring aggregate metrics

10. **`livedin/app/api/portal/reviews/[id]/respond/route.ts`** — `POST`
    - Uses `getLandlordFromRequest`
    - Verify the review's property is in the landlord's portfolio
    - Insert into `review_response_drafts` with status `'pending'`
    - Return the created draft

### Portal Client Helper

11. **Create `livedin/lib/portal-client.ts`** — analogous to `lib/admin-client.ts`
    - `portalFetch(path, options)` wrapper that attaches Bearer token
    - Helper functions for each portal endpoint

### Validation Schemas

12. **Create `livedin/lib/validation/portal.ts`**
    - `validateReviewResponse(input)` — body length <= 1000, not empty
    - `validateTeamInvite(input)` — valid email, valid role

13. **Create `livedin/lib/validation/shortlist.ts`**
    - `validateShortlistToggle(input)` — valid UUID for property_id

---

## Part E — Seed Data for Local Testing

Create `supabase/migrations/20260409110000_slice50_seed_test_data.sql` with:

```sql
-- 1. Insert 3-4 neighbourhoods (downtown, midtown, west end) for test cities
-- 2. Link some existing seeded properties to neighbourhoods
-- 3. Insert a landlord profile (or update an existing seeded user to role='landlord')
-- 4. Insert portfolio_properties linking the landlord to 2-3 properties
-- 5. Insert a team_member linking another seeded user as viewer
-- 6. Insert a company_profile for the landlord
-- 7. Insert benchmark_averages for the test cities/neighbourhoods
-- 8. Insert notification_preferences for the landlord
-- 9. Insert 1-2 review_response_drafts (one pending, one approved) on existing reviews
-- 10. Insert 1-2 user_shortlists for an existing verified user
```

---

## Local Testing Instructions

### Prerequisites

- Node.js 20+ (`node --version`)
- Supabase CLI installed (`supabase --version`; install with `brew install supabase/tap/supabase` or `npm i -g supabase`)
- Docker running (required for local Supabase)

### Step 1: Create a feature branch

```bash
cd ~/School/teamrenter
git checkout -b feat/slice50-phase3-backend
```

### Step 2: Reset the local database with new migrations

```bash
# From the repo root (where supabase/ directory lives)
supabase stop    # stop any running instance
supabase start   # start fresh local Supabase (Docker containers)
supabase db reset # apply ALL migrations from scratch including your new ones
```

Watch for errors. If any migration fails, fix it and re-run `supabase db reset`.

### Step 3: Verify schema in Supabase Studio

Open `http://localhost:54323` (Supabase Studio) and verify:
- All 8 new tables exist under the `public` schema
- `properties` table has the new `neighbourhood_id` column
- `profiles` role CHECK constraint accepts `'landlord'`
- RLS is enabled on all new tables (check the "Policies" tab for each table)

### Step 4: Verify helper functions

In the Supabase SQL Editor (`http://localhost:54323`), run:

```sql
-- Should return false (no auth context in SQL editor)
SELECT is_landlord();

-- Verify the view exists
SELECT * FROM v_portfolio_overview LIMIT 5;
SELECT * FROM v_neighbourhood_browse LIMIT 5;
```

### Step 5: Set up environment variables

```bash
cd livedin

# Create .env.local if it doesn't exist
cat > .env.local << 'EOF'
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<your-local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-local-service-role-key>
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-local-anon-key>
EOF
```

Get the keys from `supabase status` output after running `supabase start`.

### Step 6: Install dependencies and start the dev server

```bash
cd livedin
npm install
npm run dev
```

### Step 7: Test the API routes manually

#### Public endpoints (no auth needed):

```bash
# Neighbourhoods
curl http://localhost:3000/api/neighbourhoods
curl http://localhost:3000/api/neighbourhoods/<neighbourhood-id>
```

#### Authenticated endpoints (need a token):

```bash
# Get a token by signing in as the seeded landlord user
# Use the Supabase Auth API directly:
TOKEN=$(curl -s -X POST http://127.0.0.1:54321/auth/v1/token?grant_type=password \
  -H "apikey: <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"email":"landlord@example.com","password":"seedpassword"}' \
  | jq -r '.access_token')

echo $TOKEN

# Portal endpoints
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/portal/me
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/portal/properties
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/portal/benchmarks
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/portal/signals

# Shortlist (use a verified user token)
VERIFIED_TOKEN=$(curl -s -X POST http://127.0.0.1:54321/auth/v1/token?grant_type=password \
  -H "apikey: <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"email":"verified@example.com","password":"seedpassword"}' \
  | jq -r '.access_token')

curl -H "Authorization: Bearer $VERIFIED_TOKEN" http://localhost:3000/api/user/shortlist
curl -X POST -H "Authorization: Bearer $VERIFIED_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"property_id":"<a-property-uuid>"}' \
  http://localhost:3000/api/user/shortlist
```

### Step 8: Run existing tests to confirm nothing is broken

```bash
cd livedin
npm run lint
npx tsc --noEmit   # type-check without building

# If the dev server is running, run the API smoke test:
npm run api:test

# Run the RLS smoke test (from livedin/ dir):
npm run rls:test
```

### Step 9: Verify RLS manually

In Supabase SQL Editor, test that:

```sql
-- As anon: can read neighbourhoods
-- As anon: CANNOT read user_shortlists
-- As verified user: can insert/read own shortlists
-- As landlord: can read own portfolio_properties
-- As landlord: CANNOT read another landlord's portfolio
-- As admin: can read all portfolio_properties
```

### Step 10: Final checklist before pushing

- [ ] `supabase db reset` succeeds with zero errors
- [ ] `npm run dev` starts without errors
- [ ] All new API routes return expected responses
- [ ] `npx tsc --noEmit` passes (no type errors)
- [ ] `npm run lint` passes
- [ ] Existing `npm run api:test` still passes
- [ ] No `.env` or secret files are staged (`git status`)

---

## Implementation Order

Follow this sequence to avoid dependency issues:

1. **Migrations** (Part A) — schema must exist before anything else
2. **Types** (Part B) — needed by all TypeScript code
3. **Auth helper** (Part C) — needed by portal API routes
4. **Validation** (Part D, items 12-13) — needed by routes
5. **API routes** (Part D, items 1-10) — the actual endpoints
6. **Portal client** (Part D, item 11) — client-side helpers
7. **Seed data** (Part E) — for testing
8. **Test everything** (Local Testing Instructions above)

---

## Key Constraints

- **Do NOT modify existing migration files** — only create new ones
- **Do NOT change existing API routes** — they must continue working
- **Do NOT add frontend pages** — this is backend only
- **All new tables MUST have RLS enabled** from creation
- **Follow the exact column specs** from `proj_docs/Schema & ERD.md` Part 2
- **Follow the exact RLS policies** from `docs/security/rls.md`
- **Use `is_admin()` and `is_verified()`** functions that already exist in the DB
- **Use `getSupabaseServerClient()`** for all server-side DB access
- **Use `NextResponse.json()`** for all API responses
- **Match the existing code style** — no semicolons if the project doesn't use them, same import patterns, etc.
