## Slice 05 — Supabase RLS and roles

This slice enables Row Level Security (RLS) on the core Postgres tables and pushes access control down into the database. Public/anon, verified users, and admins see different slices of the data, enforced by SQL policies rather than only by API code.

### Public-readable tables

- **properties**: only rows where `status = 'active'`.
- **property_aggregates**: only rows whose `property_id` belongs to a property with `status = 'active'` (checked via an `EXISTS` subquery on `public.properties`).
- **distilled_insights**: only rows where `status = 'approved'` and the associated property is `status = 'active'`.
- **property_photos**: only rows whose `property_id` belongs to a property with `status = 'active'`.

Anonymous and general authenticated clients can read only these “safe slices” of data. Inactive properties and unapproved insights are never exposed publicly.

### Tables that are never public-readable

- **reviews**:
  - No public/anon read access at all.
  - Verified users can only `SELECT` their own rows (including `text_input`) via a policy on `user_id = auth.uid()` plus the verified gate.
  - Admins can `SELECT` all reviews for moderation.
  - There is no broad “authenticated read” policy, so `reviews.text_input` is never exposed to anonymous clients.
- **admin_audit_log**:
  - Admin-only `SELECT` and `INSERT`.
  - No `UPDATE`/`DELETE` policies, so the log is effectively immutable from application roles.
- **profiles**:
  - Users can `SELECT` and `UPDATE` only their own row.
  - Admins can `SELECT`/`UPDATE` all rows.
  - A trigger prevents non-admin users from changing `role` or `email_verified` even if they can update their profile.

### How “verified” is enforced

- **Source of truth**: `public.profiles.email_verified boolean`.
- Helper function: `public.is_verified()` (SECURITY DEFINER, safe `search_path`) returns `true` when:
  - `auth.uid()` is not null, and
  - there is a `public.profiles` row for that user with `email_verified = true`.
- RLS uses `public.is_verified()` to gate reviews:
  - `INSERT` into `public.reviews` requires `public.is_verified() AND user_id = auth.uid()`.
  - Verified users can `SELECT` only their own rows (`user_id = auth.uid()`) when `public.is_verified()` is true.

The `role` column still exists and can be `public`, `verified`, or `admin`, but **email verification is the gate** for being allowed to write and read one’s own reviews.

### Admin capabilities summary

Admins are represented by `public.profiles.role = 'admin'`, and the helper function `public.is_admin()` encapsulates that check. When `public.is_admin()` is true, RLS policies allow admins to:

- **profiles**: `SELECT` and `UPDATE` any profile row, including `role` and `email_verified`.
- **properties**: full CRUD (insert, update, delete, select) on all properties regardless of `status`.
- **reviews**: `SELECT` all reviews and `UPDATE`/`DELETE` them for moderation.
- **distilled_insights**: `SELECT` all rows and `INSERT`/`UPDATE`/`DELETE` them to manage generated insights and moderation state.
- **property_aggregates**: `SELECT` and maintain rows (insert/update/delete) as needed (typically via triggers and recompute functions).
- **property_photos**: full CRUD on photos for any property.
- **admin_audit_log**: `SELECT` and `INSERT` audit entries, with policies ensuring `admin_user_id = auth.uid()` on inserts.

### Running the RLS smoke tests

There is a small Node/TypeScript script that exercises the critical access paths for anon, non-verified, verified, and admin users:

- Script: `scripts/rls_smoke_test.ts`
- NPM script (run from the `livedin` app directory):
  - `npm run rls:test`

Required environment variables:

- `SUPABASE_URL`: your Supabase project URL.
- `SUPABASE_ANON_KEY`: the anon key for the project.
- (Optional) `SUPABASE_SEED_PASSWORD`: password for the seeded users (defaults to `seedpassword`, matching `supabase/seed.sql`).

The script signs in as the seeded users (`public@example.com`, `verified@example.com`, `admin@example.com`) and verifies that:

- Anonymous clients can read only active properties, their aggregates, and approved distilled insights, and cannot read reviews.
- Non-verified users cannot insert reviews.
- Verified users can insert a review, read their own reviews (including `text_input`), and cannot see others’ reviews.
- Admins can CRUD properties, moderate reviews and distilled insights, and write to `admin_audit_log`.

### New Role: `landlord`

The `landlord` role is added to the `profiles.role` check constraint alongside existing roles. Landlords have portfolio-scoped access — they can only see and act on properties linked to them via `portfolio_properties`.

### New Helper Functions

- **`is_landlord()`** — `SECURITY DEFINER`; returns true if `profiles.role = 'landlord'` for `auth.uid()`.
- **`is_portfolio_member(property_uuid)`** — Returns true if the caller owns the property via `portfolio_properties` or is a team member of someone who does.

### New Table RLS Policies

Document each new table’s RLS policies in table form.

**`neighbourhoods`**

| Policy | Operation | Rule |
| --- | --- | --- |
| neighbourhoods_select_public | SELECT | Everyone (no auth required) |
| neighbourhoods_insert_admin | INSERT | `is_admin()` |
| neighbourhoods_update_admin | UPDATE | `is_admin()` |
| neighbourhoods_delete_admin | DELETE | `is_admin()` |

**`user_shortlists`**

| Policy | Operation | Rule |
| --- | --- | --- |
| shortlists_select_own | SELECT | `auth.uid() = user_id` |
| shortlists_insert_own | INSERT | `auth.uid() = user_id` AND `is_verified()` |
| shortlists_delete_own | DELETE | `auth.uid() = user_id` |
| shortlists_select_admin | SELECT | `is_admin()` |

**`portfolio_properties`**

| Policy | Operation | Rule |
| --- | --- | --- |
| portfolio_select_own | SELECT | `auth.uid() = user_id` OR user is a team member of the owner |
| portfolio_insert_admin | INSERT | `is_admin()` (admins assign properties to landlord portfolios) |
| portfolio_delete_admin | DELETE | `is_admin()` |
| portfolio_select_admin | SELECT | `is_admin()` |

**`team_members`**

| Policy | Operation | Rule |
| --- | --- | --- |
| team_select_own | SELECT | `auth.uid() = owner_user_id` OR `auth.uid() = member_user_id` |
| team_insert_owner | INSERT | `auth.uid() = owner_user_id` AND `role = 'landlord'` |
| team_update_owner | UPDATE | `auth.uid() = owner_user_id` |
| team_delete_owner | DELETE | `auth.uid() = owner_user_id` |
| team_crud_admin | ALL | `is_admin()` |

**`notification_preferences`**

| Policy | Operation | Rule |
| --- | --- | --- |
| notif_select_own | SELECT | `auth.uid() = user_id` |
| notif_upsert_own | INSERT/UPDATE | `auth.uid() = user_id` |

**`review_response_drafts`**

| Policy | Operation | Rule |
| --- | --- | --- |
| response_insert_landlord | INSERT | Author is landlord AND review’s property is in their portfolio |
| response_select_own | SELECT | `auth.uid() = author_user_id` |
| response_select_public_approved | SELECT | `status = 'approved'` (anyone can read approved responses) |
| response_update_admin | UPDATE | `is_admin()` (for approval/rejection) |
| response_select_admin | SELECT | `is_admin()` |

**`benchmark_averages`**

| Policy | Operation | Rule |
| --- | --- | --- |
| benchmarks_select_public | SELECT | Everyone |
| benchmarks_crud_admin | ALL | `is_admin()` |

**`company_profiles`**

| Policy | Operation | Rule |
| --- | --- | --- |
| company_select_public | SELECT | Everyone (public-facing) |
| company_upsert_own | INSERT/UPDATE | `auth.uid() = user_id` AND `role = 'landlord'` |
| company_select_admin | SELECT | `is_admin()` |

### Portfolio-Scoping Principle

- **`portfolio_properties`** is the central pivot table connecting landlords to properties.
- Every Business Portal query is scoped through this table.
- A landlord can only see properties, reviews, aggregates, and insights for properties that appear in their portfolio.
- Team members inherit this scope through `team_members.owner_user_id`.

