# Livedin

Livedin is a Next.js app for browsing rental properties, reading public trust
signals, submitting verified renter reviews, and managing the property catalog
through an admin UI.

## What Is Implemented

- Public property search and detail pages
- Verified review submission backed by Supabase auth and RLS
- Admin property CRUD backed by bearer-token auth
- Supabase schema, seed data, and smoke-test scripts

## Prerequisites

- Node.js 20+
- npm
- A Supabase project, or the local Supabase CLI stack from the repository root

## Environment Variables

Copy `.env.example` to an env file that your local workflow loads.

Required variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional smoke-test helpers:

- `SUPABASE_SEED_PASSWORD`
- `PUBLIC_TEST_EMAIL`
- `PUBLIC_TEST_PASSWORD`
- `ADMIN_TEST_EMAIL`
- `ADMIN_TEST_PASSWORD`
- `REVIEW_TEST_EMAIL`
- `REVIEW_TEST_PASSWORD`

The browser variables must point at the same Supabase project as the server
variables.

## Local Development

From `livedin/`:

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

## Database Setup

The Supabase schema lives in the repository-level `supabase/` directory.

From the repository root:

```bash
supabase start
supabase db reset
```

That applies:

- core schema and aggregation logic in `../supabase/migrations/20250305120000_slice04_db_foundation.sql`
- RLS policies in `../supabase/migrations/20250305130000_slice05_rls_roles.sql`
- profile bootstrap and verification sync in `../supabase/migrations/20260310120000_auth_profile_sync.sql`
- seed data in `../supabase/seed.sql`

More detail is documented in `../supabase/README.md`.

## Auth Notes

- Review submission requires a signed-in account whose `profiles.email_verified`
  value is `true`
- New users can create an account from `/sign-in`
- Email verification is synced from `auth.users.email_confirmed_at` into
  `public.profiles`
- Admin access is controlled by `profiles.role = 'admin'`

## Scripts

- `npm run dev`: start the Next.js dev server
- `npm run build`: build the app
- `npm run start`: run the production build
- `npm run lint`: run ESLint
- `npm run api:test`: exercise the app route handlers against a seeded Supabase project
- `npm run rls:test`: verify database RLS behavior using seeded or explicitly configured test accounts

The smoke tests expect the Supabase env vars to be present in the current shell.
If you are not using the default seeded accounts, set the `PUBLIC_TEST_*`,
`ADMIN_TEST_*`, and `REVIEW_TEST_*` variables explicitly.

## Testing Strategy

The current integration coverage is intentionally focused on the highest-risk
surfaces:

- public property APIs
- review submission auth and validation
- admin auth and property CRUD
- database RLS guarantees

This keeps the MVP protected without introducing a full browser test stack yet.
