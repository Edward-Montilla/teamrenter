# Project Checklist

This checklist is based on the slice docs in `slices/`, `implemented.md`, the current `livedin/` app, and the Supabase migrations/scripts that already exist in the repo.

Checked items are already implemented or already documented as planning/spec work. Unchecked items still need implementation, validation, or release-readiness follow-through.

## Core Product Slices

- [x] Slice 01: Public browse/search page exists with property cards, search, and navigation to property detail.
- [x] Slice 02: Public property detail page exists with aggregate scores, empty states, and approved insight display.
- [x] Slice 03: Review submission flow exists with gated states, validation, and confirmation UI.
- [x] Slice 04: Supabase schema, constraints, and aggregate recompute logic are present.
- [ ] Slice 04: Run and record the manual DB validation for constraints and aggregate recomputation.
- [x] Slice 05: RLS policies, role helpers, and profile protections are present.
- [ ] Slice 05: Run and record the anon/verified/admin RLS smoke tests in the supported environment.
- [x] Slice 06: Public browse and property detail are wired to Supabase reads.
- [x] Slice 07: Verified review submission is wired to Supabase with pending moderation flow and status handling.
- [x] Slice 08: Admin property CRUD pages and APIs exist.
- [x] Slice 09: Admin review moderation, insight moderation, and audit views exist.
- [x] Slice 10: Distilled insight recompute and approval workflow exist.
- [ ] Slice 11: Implement end-to-end property photo upload and public display via Cloudflare R2.
- [x] Slice 12: Authentication exists with email sign-in/sign-up, sign-out, and Google OAuth.
- [ ] Slice 13: Finish the site-wide UI/UX polish pass and verify consistent loading, empty, error, and success states across key flows.
- [x] Slice 14: Admin access request flow, admin review path, and first-admin bootstrap hardening exist.
- [x] Slice 15: Gestalt-inspired UI system specification document exists.
- [ ] Slice 15: Apply the Gestalt-inspired UI system in the shipped app.
- [x] Slice 16: Mobile-first UX polish specification document exists.
- [ ] Slice 16: Apply the mobile-first UX improvements in the shipped app.
- [x] Slice 17: Admin command center route exists with consolidated review/property workflows.
- [ ] Slice 20: Implement the semantic renter feedback feature end to end, including normalized categories, evidence signals, review gating, and safe public display.

## Quality And Alpha Readiness

- [x] Alpha readiness direction document exists.
- [ ] Confirm the core `/` -> `/properties/[id]` -> `/sign-in` -> `/submit-review/[propertyId]` -> `/admin` journey works end to end in one supported environment.
- [ ] Standardize one documented setup path for new contributors so they can run the app without slice-by-slice reconstruction.
- [ ] Add browser-level end-to-end smoke coverage for the highest-risk user and admin journey.
- [ ] Keep `api:test` and `rls:test` healthy and treat them as required alpha gates.
- [ ] Remove, hide, or clearly label leftover mock-era or optional surfaces that are not part of the supported alpha path.
- [ ] Add CI checks for install, lint, build, and smoke coverage where feasible.
- [ ] Define an internal alpha deployment target and release/checklist process.
- [ ] Add basic alpha observability for route/API failures, auth/admin failures, and migration/version traceability.
- [ ] Refresh top-level README and tester guidance so they describe the current implementation and supported flows only.

## Business Reporting Planning

- [x] Business reporting PRD exists.
- [x] Business reporting SRS exists.
- [x] Business reporting technical specification exists.
- [ ] Add organization ownership, membership, and property-mapping tables.
- [ ] Build Phase 1 admin-visible reporting to validate report calculations and UX.
- [ ] Build business reporting routes: `/business`, `/business/properties`, `/business/properties/[id]`, and `/business/issues`.
- [ ] Implement the portfolio overview report.
- [ ] Implement the property performance report with current-period metrics, previous-period comparison, and approved insight summary.
- [ ] Implement the portfolio benchmark report with sorting, filtering, ranking, percentile, and pagination.
- [ ] Implement the issue signals/watchlist report.
- [ ] Add low-sample labeling, freshness indicators, and reporting-period filtering.
- [ ] Enforce organization-scoped access for business users without exposing private review text.
- [ ] Add reporting tests for org scoping, approved-only data, missing-insight handling, and private-text exclusion.
