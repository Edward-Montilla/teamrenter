# Slice 14 — Admin Access Request Path

## Goal (demo in 1–3 minutes)

Eligible signed-up users can visit a dedicated request path, submit an admin access request, and enter a review flow that may later promote their `profiles.role` to `admin`; no user can self-promote directly.

## User story

As an eligible team member or trusted operator, I want a clear path to request admin access after signing up so the platform can review my request and promote my account safely if approved.

## Screens

- Request page: `/signup/request-admin`
- Success state: confirmation view or inline success message after submission
- Admin review surface: can reuse an existing admin area or a minimal review queue page in a later implementation step

## Frontend tasks

- Add a dedicated request path at `/signup/request-admin`.
- Gate the page behind authentication so only signed-in users can submit a request.
- Show the request path only for eligible accounts. Eligibility should be driven by an allowlist rule such as specific email addresses, approved domains, or a curated profile flag; do not expose the path as a generic self-serve admin upgrade.
- Present a lightweight request form for the signed-in user with fields such as reason for access and optional team or organization context.
- Show clear state handling:
  - ineligible account -> explain that admin access is restricted
  - existing pending request -> show current status instead of allowing duplicate submissions
  - approved account -> direct user to admin area once role change is complete
  - rejected request -> show non-sensitive status with guidance to contact platform owners if needed

## DB tasks

- Add a dedicated request record rather than changing `profiles.role` during sign-up.
- Preferred table: `admin_role_requests`
  - `id`
  - `user_id`
  - `email_snapshot`
  - `reason`
  - `status` (`pending`, `approved`, `rejected`)
  - `review_notes`
  - `reviewed_by`
  - `reviewed_at`
  - `created_at`
  - `updated_at`
- Keep `public.profiles.role` unchanged at sign-up time; the user remains non-admin until an approval action explicitly promotes the account.
- Enforce one active request per user unless a rejected request is allowed to be resubmitted under a documented rule.

## Integration tasks

- On submission, create an admin access request tied to the authenticated user.
- Before insert, verify the eligibility rule for the signed-in account.
- On approval, update `public.profiles.role` from its current non-admin value to `admin` through a privileged admin-only action.
- Record who reviewed the request and when the promotion occurred.
- If the app already exposes an admin audit log, approval and rejection actions should also be written there.

## Data contracts

- Request create payload:
  - `reason: string`
- Request create response:
  - `status: 'pending'`
  - `submittedAt: string`
- Request status shape for current user:
  - `eligible: boolean`
  - `hasActiveRequest: boolean`
  - `requestStatus: 'none' | 'pending' | 'approved' | 'rejected'`
  - `currentRole: 'public' | 'verified' | 'admin'`

## RLS/Constraints notes

- Users must never be allowed to update their own `profiles.role` directly.
- Authenticated users may create and view only their own request record.
- Only admins may approve or reject requests and perform the eventual role promotion.
- If email/domain allowlisting is used, enforce it server-side or in the database path, not only in the UI.

## Acceptance criteria checklist

- [ ] Signed-in eligible users can open `/signup/request-admin` and submit a request
- [ ] Ineligible users cannot use the path to create an admin request
- [ ] Submitting a request does not immediately change `profiles.role`
- [ ] Approved requests result in an explicit admin-driven role promotion to `profiles.role = 'admin'`
- [ ] Duplicate active requests are blocked or handled by a documented resubmission rule
- [ ] Review actions are attributable to an admin user and timestamped

## Test notes (manual smoke steps)

1. Sign up or sign in as an eligible non-admin user and open `/signup/request-admin`; submit a request and verify status becomes `pending`.
2. Sign in as an ineligible user and confirm the request cannot be submitted.
3. Confirm the requesting user still has a non-admin `profiles.role` while the request is pending.
4. Approve the request through the admin review flow and verify the user's `profiles.role` changes to `admin`.
5. Reject another request and verify the user remains non-admin and the review metadata is recorded.

## Out of scope

- Automatic self-serve admin upgrades during public sign-up
- A public invite-code system for admin creation
- Full organization or RBAC hierarchy beyond the existing `admin` role
- Implementation of the actual request page, API route, table, or approval UI in this slice document
