# Slice 01A — Alpha Readiness Direction

## Goal (demo in 1–3 minutes)
Show an internally usable alpha build where a new user can browse properties, open a property detail page, sign in, submit a verified review, and an admin can moderate the review with confidence using stable seeded environments and repeatable smoke tests.

## User story
As the product team, we need to move from a feature-complete MVP toward an alpha-quality product that is stable enough for internal evaluation, guided testing, and early stakeholder demos without relying on manual recovery or tribal knowledge.

## Why this slice exists
- The project is already beyond prototype stage and has most core flows implemented.
- The main gap is not "missing app screens"; it is alpha readiness:
- tighter integration quality
- clearer operational setup
- stronger testing confidence
- reduced stale/mock-era ambiguity
- documented go/no-go criteria for internal deployment

## Alpha target
An alpha release for this project should mean:
- core public browse, property detail, auth, review submission, and admin moderation flows work end to end against a real Supabase environment
- seeded test data and setup steps are reliable for any developer on the team
- the highest-risk flows have repeatable smoke coverage
- major user-facing dead ends, stale routes, and confusing placeholders are removed or intentionally labeled
- core error states are handled cleanly enough for internal testers to use the app without engineering assistance

## Current-state summary
- Strengths:
- public browse/search is implemented
- property detail is implemented
- review submission is implemented with real auth and gate states
- admin property, review, insights, and access-request workflows exist
- Supabase schema, RLS, and audit-oriented hardening are in place
- Main gaps before alpha:
- no visible CI pipeline or deployment guardrails
- browser-level end-to-end coverage is still missing
- some docs still describe earlier mock-based behavior
- leftover mock/stub artifacts can create confusion
- optional photo support is not implemented end to end

## Direction to reach alpha

## Workstream 1 — Lock the core journey
- Treat the following as the alpha-critical path:
- `/`
- `/properties/[id]`
- `/sign-in`
- `/submit-review/[propertyId]`
- `/admin`
- Define one internal demo script that exercises:
- browse/search
- property detail trust signals
- verified sign-in
- review submission
- admin moderation
- aggregate/insight visibility after moderation
- Fix any UX dead ends or unclear transitions in those routes before adding new surface area.

## Workstream 2 — Replace ambiguity with one supported path
- Remove or clearly quarantine stale mock-era helpers that are no longer part of the live runtime path.
- Update docs that still describe mocked behavior as the current workflow.
- Ensure every key route either:
- works,
- intentionally redirects,
- or is explicitly marked out of scope for alpha.
- Keep optional features such as photos out of the alpha promise unless the full upload-to-display flow is actually implemented.

## Workstream 3 — Raise confidence with repeatable testing
- Keep the existing API and RLS smoke tests, but treat them as the minimum baseline rather than the finish line.
- Add one browser-level test path for the highest-risk flows:
- public browse to property detail
- sign-in
- verified review submission
- admin moderation
- Add a pre-release checklist that must pass before any alpha deployment.
- Make seeded accounts and environment assumptions explicit and reproducible.

## Workstream 4 — Stabilize developer and tester setup
- Standardize one local setup path for:
- app environment variables
- Supabase startup/reset
- seed data
- test account credentials
- Make it easy for a new team member to bring up the app and run the smoke suite without reading multiple slice docs first.
- Add one "alpha demo environment" recipe for internal testing on hosted infrastructure if local-only testing is no longer enough.

## Workstream 5 — Establish minimum operational readiness
- Add CI to run at least:
- install
- lint
- build
- API smoke tests where feasible
- Define how alpha deployments are promoted and who can approve them.
- Add basic runtime observability for alpha:
- route/API error visibility
- failed auth/admin actions
- migration/version traceability

## Workstream 6 — Finalize alpha documentation
- Refresh top-level README guidance so it reflects the current product, not only early slices.
- Create a concise tester guide for:
- how to sign in
- which accounts to use
- which flows to validate
- what known limitations remain
- Record explicit alpha entry criteria and beta exit criteria.

## Frontend tasks
- Audit alpha-critical routes for broken, confusing, or placeholder states.
- Tighten error messaging and retry states on public, review, and admin flows.
- Remove or hide unfinished surfaces that weaken confidence during testing.
- Make sure the signed-in navigation clearly exposes the supported review and admin paths.
- Confirm mobile usability of the alpha-critical routes, even if full polish remains a later slice.

## Backend and data tasks
- Validate that migrations, seed data, and auth/profile sync cover the supported alpha flows consistently.
- Reconfirm RLS behavior for anonymous, verified, and admin roles using the intended test accounts.
- Verify moderation side effects:
- review status changes
- aggregate recomputation
- insight visibility
- Decide whether optional tables and unfinished data paths stay dormant for alpha or need completion.

## Testing tasks
- Keep `api:test` and `rls:test` healthy and required for alpha readiness.
- Add one browser-driven smoke suite for the main user and admin journey.
- Create an "alpha validation" checklist that can be run manually in under 30 minutes.
- Track known gaps explicitly instead of leaving them implied in slice docs.

## Deployment tasks
- Define an `alpha` deployment target meant for:
- internal team testing
- stakeholder demos
- integration verification against hosted services
- Protect alpha deployments with:
- successful build
- migration discipline
- env-var validation
- named release notes or change summaries

## RLS/Constraints notes
- Public surfaces must continue to exclude private review text.
- Review submission must stay gated by authentication, verification, duplicate prevention, and rate limits.
- Admin actions must remain bearer-token protected and auditable.
- First-admin bootstrap and admin-request workflows must be treated as security-sensitive alpha features and tested explicitly.

## Acceptance criteria checklist
- [ ] The core public -> auth -> review -> admin moderation journey works end to end in one supported environment.
- [ ] A new contributor can follow one documented setup path and run the app successfully.
- [ ] Smoke coverage exists for public reads, review submission rules, admin auth, and at least one browser-level end-to-end flow.
- [ ] README/testing docs describe the current implementation rather than the earlier mocked slices.
- [ ] Unfinished or optional features are either completed for alpha or clearly excluded from the alpha promise.
- [ ] CI/build/deployment checks exist at a level appropriate for internal alpha releases.

## Test notes (manual smoke steps)
1. Start the supported local or hosted alpha environment.
2. Browse properties from `/` and open a real property detail page.
3. Sign in with a verified user and submit a review.
4. Confirm the review enters the expected moderation state.
5. Sign in as admin, moderate the review, and verify downstream public behavior.
6. Run the documented smoke scripts and confirm they pass.
7. Review known limitations and confirm they match the current alpha scope.

## Beta readiness (not required for alpha)
- broader external-user testing
- stronger observability and alerting
- fuller E2E coverage across edge cases
- performance budgets and load testing
- polished onboarding/support materials
- optional media features such as full property photo workflows

## Out of scope
- Full public launch readiness.
- Large new feature expansions unrelated to the core trust/review workflow.
- Enterprise-grade analytics, growth tooling, or broad role-management redesign.
