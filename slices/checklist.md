# Project Checklist

Checked items are already implemented or documented in the repo. Unchecked items are still outstanding.

## Core Product Slices

### Slice 01 — Public browse/search

[x] Build `/` with hero content, search input, and a clear review CTA
[x] Render searchable property cards with loading, empty, and error states
[x] Let users open a property from the browse results

### Slice 02 — Property detail

[x] Build `/properties/[id]` for public property detail
[x] Show trust score, rating breakdown, review count, and confidence cues
[x] Show approved distilled insights only, with helpful no-review and no-insight states
[x] Keep raw review text out of the public detail page

### Slice 03 — Review form and gated states

[x] Build `/submit-review/[propertyId]` as a guided multi-step flow
[x] Support property selection, structured ratings, optional private notes, and tenancy dates
[x] Show gated states for signed-out, unverified, already-reviewed, and rate-limited users
[x] Show a submission confirmation state with next-step actions

### Slice 04 — DB foundation

[x] Create the core schema for profiles, properties, reviews, aggregates, insights, audit log, and optional photo metadata
[x] Add database constraints for review validation, uniqueness, and tenancy dates
[x] Add aggregate-refresh logic so approved moderation state drives public scores

### Slice 05 — RLS, roles, and security

[x] Enable RLS on the core public and admin tables
[x] Restrict public reads to safe fields and safe statuses only
[x] Gate review creation to verified users and admin actions to admins
[x] Keep private review text and admin audit data out of public access paths

### Slice 06 — Public reads wired to Supabase

[x] Replace mocked browse data with DB-backed public property reads
[x] Replace mocked property detail data with DB-backed property, aggregate, and approved insight reads
[x] Keep public routes free of raw review queries and private text exposure

### Slice 07 — Review submission integration

[x] Wire review submission to a real backend endpoint
[x] Insert new reviews as `pending` instead of changing public scores immediately
[x] Return clear auth and constraint-driven outcomes for submit failures
[x] Keep aggregate refresh tied to later admin approval

### Slice 08 — Admin properties CRUD

[x] Build `/admin/properties` with property listing, status, and actions
[x] Let admins create, edit, activate, and deactivate properties
[x] Keep non-admin users blocked from property-admin routes and actions
[x] Ensure only active properties appear in public browse flows

### Slice 09 — Admin moderation and audit

[x] Build `/admin/reviews` moderation tools with private review text visible to admins only
[x] Let admins approve, reject, remove, and reset review status
[x] Build `/admin/insights` moderation tools for approve, reject, hide, and recompute flows
[x] Record admin moderation and property actions in the audit log
[x] Recompute public aggregates when review moderation changes

### Slice 10 — Distilled insights pipeline

[x] Store distilled insights with moderation status
[x] Generate or recompute pending insights from approved review text
[x] Let admins review and publish insight summaries
[x] Show only approved insight summaries on public property pages

### Slice 11 — Optional photos via R2

[x] Lay DB groundwork for optional property photo metadata
[ ] Add admin photo upload to Cloudflare R2
[ ] Save photo metadata and safe public delivery URLs
[ ] Render uploaded property photos on the public property page

### Slice 12 — Authentication

[x] Add `/sign-in` with Google OAuth and email/password auth flows
[x] Support sign-up, sign-in, sign-out, and redirect back to the user’s target flow
[x] Sync authenticated users into `public.profiles`
[x] Use real auth state in gated review and admin flows

### Slice 13 — Site-wide UI/UX polish

[x] Apply consistent page layout, CTA hierarchy, and shared feedback surfaces across public, auth, review, and admin pages
[x] Improve search, detail, sign-in, review, and admin usability
[x] Keep key flows responsive and keyboard/focus friendly

### Slice 14 — Admin access request path

[x] Add `/signup/request-admin` for authenticated, eligible users
[x] Add `admin_role_requests` persistence and request-status handling
[x] Prevent self-promotion and require explicit admin review or bootstrap flow
[x] Add admin review tooling for access requests and role promotion
[x] Record request review metadata and enforce one active request path

### Slice 15 — Gestalt-inspired UI system

[x] Write the planning spec for a Gestalt-inspired design system
[x] Cover public, auth, theme, review, and admin surfaces in the spec
[x] Keep this slice documentation-only with no required backend changes

### Slice 16 — Mobile-first UX polish

[x] Write the planning spec for mobile-first browse, detail, review, sign-in, and admin-access flows
[x] Define mobile priorities, before-scroll content, and progressive disclosure rules
[x] Keep this slice documentation-only with no required backend changes

### Slice 17 — Admin command center

[x] Add `/admin` as the consolidated admin landing page
[x] Show an admin entry point from the signed-in public header
[x] Let admins moderate reviews directly from the command center
[x] Let admins create, manage, and delete properties from the command center
[x] Surface recent admin audit activity in the command center

### Slice 20 — NLP semantic renter feedback

[ ] Add `semantic_property_feedback` storage and moderation status flow
[ ] Generate neutralized semantic feedback from approved renter review text
[ ] Add admin review, approval, hide, and regenerate controls for semantic feedback
[ ] Show approved semantic renter feedback on public property pages
[ ] Preserve the currently approved public feedback until replacement output is approved

## Remaining Work Summary

[ ] Finish Slice 11 photo upload and public photo display
[ ] Build Slice 20 semantic renter feedback pipeline and UI
