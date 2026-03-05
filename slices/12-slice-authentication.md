# Slice 12 — Authentication (Sign-in / Sign-up + Google OAuth)

## Goal (demo in 1–3 minutes)
Users can sign in with Google (and optionally with email/password); a session is established and the app creates or updates their `profiles` row; gated flows (Slice 03, 07) use real session instead of mocks.

## User story
As a renter, I want to sign in with my Google account so I can submit reviews without creating a separate password; the app should remember me and show the right UI (signed in, verified, or prompt to sign in).

## Screens
- Sign-in page: e.g. `/login` or `/auth/signin` (or modal/sheet from any page).
- Optional: sign-up page or combined sign-in/sign-up with email+password for users who prefer not to use Google.
- No dedicated “account settings” in this slice; focus on sign-in/sign-up and session only.

## Frontend tasks
- Add a **Sign in** entry point (header/nav or CTA) that routes to the sign-in screen.
- **Google sign-in**: Button that calls Supabase Auth `signInWithOAuth({ provider: 'google' })`; handle redirect (or popup) and post-auth redirect back to app (e.g. return URL or `/`).
- **Optional — Email/password**: If supporting email sign-up/sign-in, add form(s) for sign up and sign in using `signUp` and `signInWithPassword`; link “Forgot password” to Supabase password reset if desired.
- **Session provider**: Wrap app (or relevant layout) with Supabase auth state (e.g. `onAuthStateChange`); expose `user`, `session`, and `loading` so components can replace mock auth with real session.
- **Replace mock auth in Slice 03**: Review submission flow (`/submit-review/[propertyId]`) and any gated banners should read real session and profile (e.g. `profiles.email_verified`) instead of mock toggles; remove or disable mock sign-in once real auth is wired.
- **Sign out**: Sign-out button/link that calls `signOut()` and redirects to home or current page.
- **Guarded routes (optional)**: Optionally redirect unauthenticated users from `/submit-review/*` to sign-in with a return URL so they land back on the form after signing in.

## DB tasks (Supabase)
- **Profile on first sign-in**: Ensure every new auth user gets a `public.profiles` row. Prefer a **trigger** on `auth.users` (AFTER INSERT) that inserts into `public.profiles` with `user_id = NEW.id`, `role = 'public'`, and `email_verified` set from Supabase’s email confirmation state (e.g. `NEW.email_confirmed_at IS NOT NULL` for OAuth/verified email). If trigger is not possible (e.g. restricted auth schema), document that the app must upsert profile on first sign-in (e.g. server action or API route that INSERTs profile when missing).
- **email_verified for Google**: For Google (and other OAuth) sign-ins, Supabase sets `auth.users.email_confirmed_at`. The profile trigger (or app upsert) should set `profiles.email_verified = true` when `email_confirmed_at` is set so RLS `is_verified()` (Slice 05) allows review submission without extra verification step.
- No new tables; use existing `profiles` (Slice 04) and RLS (Slice 05).

## Integration tasks
- **Supabase project**: In Dashboard, enable **Google** under Authentication → Providers; configure OAuth client ID/secret (Google Cloud Console). Optionally enable Email provider for email/password.
- **Redirect URLs**: Add app URLs to Supabase Auth redirect allowlist (e.g. `https://yourapp.com/**`, `http://localhost:3000/**` for dev).
- **Server/client usage**: Use Supabase client that respects session (e.g. createClient with cookies or session persistence) so server components and API routes see the same user as the client; use anon key for public reads and rely on session for authenticated requests (Slice 06, 07).
- **Profile fetch**: Where the app needs `role` or `email_verified` (e.g. gated UI, review submit), fetch the current user’s profile (e.g. `profiles` filtered by `auth.uid()`) once session is available; cache or pass into layout as needed.
- **Error handling**: Map auth errors (e.g. popup closed, consent denied) to friendly messages; 401/403 for API routes remain as in Slice 07 when session is missing or user not verified.

## Data contracts
- No new API response shapes. Session is provided by Supabase Auth (`User`, `Session`); app-specific role/verification comes from `public.profiles` (existing schema).
- For client components that need auth state, a minimal shape can be:
  - `user: User | null`, `profile: { role, email_verified } | null`, `loading: boolean`.

## RLS/Constraints notes
- Existing RLS (Slice 05) already allows users to INSERT their own profile (`profiles_insert_self`) and SELECT/UPDATE own row; trigger or app must set `user_id = auth.uid()` on insert.
- `is_verified()` gates review INSERT; setting `profiles.email_verified = true` for OAuth users (when `email_confirmed_at` is set) keeps behavior consistent with Slice 07.

## Acceptance criteria checklist
- [ ] User can sign in with Google and is redirected back to the app with an active session
- [ ] After first Google sign-in, a `profiles` row exists with `email_verified = true` (so they can submit reviews per Slice 07)
- [ ] Sign-out clears session and UI reflects unauthenticated state
- [ ] Review submission flow (Slice 03/07) uses real session; unauthenticated users see sign-in prompt and cannot submit; verified users can submit
- [ ] Public browse and property detail (Slice 06) still work for anonymous users with anon key

## Test notes (manual smoke steps)
1. Sign in with Google from the sign-in page; confirm redirect and that header/UI shows signed-in state.
2. Open a property and go to “Submit review”; confirm form is available (verified) or appropriate gate (unverified/sign-in) based on profile.
3. Sign out; confirm session is cleared and gated flows show sign-in again.
4. In Supabase (SQL or Table Editor), confirm new Google user has a `profiles` row with `email_verified = true`.
5. Optional: Test email/password sign-up and sign-in if implemented; confirm profile creation and verification behavior.

## Out of scope
- Magic link / passwordless as primary flow (can add later).
- Full account settings UI (change email, password, linked accounts).
- Custom “verify email” flow for email/password beyond Supabase’s built-in (OAuth users are treated as verified via `email_confirmed_at`).
- Admin creation of users (admins still created via seed or Dashboard for Slice 08/09).
