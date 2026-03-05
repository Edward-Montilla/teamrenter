# teamrenter

## Testing slices 03–07

The slice docs already contain detailed "Test notes (manual smoke steps)" sections. Use this README as the quick entry point for how to run things and where to look:

- **Prerequisites**
  - **Supabase project**: Create or use an existing Supabase project and apply the SQL migrations in `supabase/migrations` (they correspond to the DB-focused slices like 04–05).
  - **Environment**: In the `livedin` app, configure your Supabase URL and keys as described in the project setup docs or `.env.example` (if present).
  - **Install dependencies**:
    - From the repo root: `cd livedin`
    - Then: `npm install` (or `pnpm install` / `yarn install`, matching your preferred package manager).

- **Run the Next.js app**
  - From `livedin`: `npm run dev`
  - Open `http://localhost:3000` in your browser.

- **Slice 03 — Review Submission Form**
  - Feature work and manual test steps live in `slices/03-slice-review-form.md`.
  - After the app is running, follow the "Test notes (manual smoke steps)" section in that file to verify the gated review form behaviour.

- **Slice 04 — Supabase DB Foundation**
  - Schema, triggers, and manual test steps live in `slices/04-slice-db-foundation.md`.
  - Use the Supabase SQL editor and the "Test notes" section in that file to validate constraints and aggregate recomputation.

- **Slice 05 — Supabase RLS + Roles**
  - RLS and role strategy are documented in `slices/05-slice-rls-roles-security.md`.
  - To smoke-test RLS from the command line, you can also run (from `livedin`):
    - `npm run rls:test`
  - Combine the script output with the "Test notes" section in the slice doc to confirm policies behave as expected.

- **Slice 06 — Integration: Public Reads**
  - Integration behaviour and manual tests live in `slices/06-slice-integration-public-reads.md`.
  - With the app running and Supabase seeded, follow the "Test notes" steps to confirm that `/` and `/properties/[id]` read from Supabase using only public-safe data.

- **Slice 07 — Integration: Review Submission + Aggregates**
  - End-to-end review submission and aggregate refresh behaviour are defined in `slices/07-slice-integration-review-submit.md`.
  - Use the "Test notes" section there to:
    - Submit reviews as a verified user.
    - Exercise duplicate and rate-limit scenarios.
    - Approve reviews as an admin and confirm aggregate updates on the property detail page.
