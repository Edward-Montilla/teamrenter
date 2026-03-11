# Supabase Setup

The schema for `livedin` is versioned in this directory.

## Files

- `migrations/20250305120000_slice04_db_foundation.sql`: core tables, constraints, triggers, and aggregate logic
- `migrations/20250305130000_slice05_rls_roles.sql`: row-level security policies and admin / verified helpers
- `migrations/20260310120000_auth_profile_sync.sql`: automatic `profiles` bootstrap and email verification sync from `auth.users`
- `seed.sql`: reproducible local users, profiles, properties, reviews, and aggregates
- `config.toml`: local Supabase CLI configuration for auth redirects and ports

## Auth And Profiles

`livedin` assumes every authenticated user has a row in `public.profiles`.

That is now handled automatically by `20260310120000_auth_profile_sync.sql`:

- new `auth.users` rows create a matching `public.profiles` row
- `profiles.email_verified` follows `auth.users.email_confirmed_at`
- non-admin users move between `public` and `verified`
- existing `admin` roles are preserved during sync

## RLS Assumptions

The app intentionally uses the anon key with user bearer tokens, so runtime behavior depends on the RLS policies in `20250305130000_slice05_rls_roles.sql`.

Key assumptions:

- `profiles.role = 'admin'` unlocks admin property management
- `profiles.email_verified = true` is required to create reviews
- public readers only see active properties
- public readers only see approved insights
- review uniqueness and 3 reviews / 6 months limits are enforced in the database

## Local Workflow

From the repository root:

```bash
supabase start
supabase db reset
```

`db reset` reapplies all migrations and `seed.sql`, which gives you reproducible test users:

- `public@example.com`
- `verified@example.com`
- `admin@example.com`

Use `SUPABASE_SEED_PASSWORD` if you want the smoke-test scripts to sign in with the seeded accounts.
