# Slice 13 — Site-wide UI/UX Polish + Accessibility

## Goal (demo in 1–3 minutes)
Public, auth, review, and admin flows feel cohesive and easier to use: navigation is clearer, key actions are easier to find, loading/empty/error/success states are consistent, layouts work better on small screens, and critical interactions are keyboard- and screen-reader-friendly. In particular, the property rating flow should move closer to the provided review-address mockup so the "pick a property, confirm it, then continue" journey feels more guided and trustworthy.

## User story
As a renter or admin, I want the site to feel trustworthy and easy to navigate so I can complete tasks quickly without guessing what to do next.

## Screens
- Public browse: `/`
- Property detail: `/properties/[id]`
- Review submission: `/submit-review/[propertyId]`
  - Visual direction: `proj_docs/UI Mockup/Rental Review Platform UI Mockups-3.png` (Frame 4: Review - Address)
- Sign-in: `/sign-in`
- Admin: `/admin/properties`, `/admin/reviews`, `/admin/insights`

## Frontend tasks
- Establish a small set of shared UI patterns used across public and admin pages:
  - consistent page width, spacing, section headers, card styling, and CTA hierarchy
  - consistent loading, empty, error, and success surfaces
  - consistent form field spacing, help text, validation copy, and disabled/loading button states
- Improve global navigation and orientation:
  - make primary actions easier to discover in header/nav
  - add lightweight breadcrumbs or "back" affordances where users can enter deep links
  - ensure page titles and section headings clearly describe where the user is and what they can do next
- Improve browse/search UX on `/`:
  - make search and clear actions more obvious
  - improve empty-state copy so users know how to broaden or reset search
  - make result cards easier to scan on mobile and desktop
- Improve property detail UX:
  - strengthen information hierarchy between trust score, review count, insight summary, and review CTA
  - make no-review and no-insight states more helpful and less ambiguous
  - ensure sidebar/secondary content degrades cleanly on smaller screens
- Improve review submission UX:
  - align the property-selection step more closely to the provided mockup:
    - a focused review shell with a simple top bar, clear title, and dismiss/cancel action
    - a prominent search field for address or management company
    - a scannable result list that makes the currently selected property obvious
    - a separate confirmation area that answers "Is this the correct location?" before advancing
    - a strong primary `Continue` CTA tied to the selected property
  - show clearer progress between property selection, form completion, and confirmation
  - make gating states more actionable (sign in, verify email, already reviewed, review limit reached)
  - keep validation inline and close to the field or action that needs attention
  - preserve the mockup's calmer, single-task layout so users focus on selecting the right property before entering ratings
- Improve sign-in UX:
  - clarify redirect/return behavior after sign-in
  - make Google sign-in, fallback auth options, and verification messaging easier to understand
- Improve admin UX:
  - make queue states, filters, and actions easier to scan
  - keep destructive or high-impact actions visually distinct from safe actions
  - ensure admin tables/cards remain usable on narrower laptop widths
- Accessibility pass:
  - visible focus states for all interactive elements
  - keyboard access for navigation, search, drawers/modals, and form actions
  - semantic headings, labels, and announcements for loading/errors/success feedback
  - sufficient color contrast for text, borders, status badges, and focus rings

## DB tasks
- None required.
- No schema, RLS, trigger, or aggregate changes should be necessary for this slice.

## Integration tasks
- Reuse existing routes and backend contracts from Slices `06-12`; this slice should not introduce new core business flows.
- Where state already exists (loading, empty, error, success, forbidden, unauthenticated), normalize presentation rather than changing backend behavior.
- If useful, extract shared UI primitives/helpers so public and admin areas use the same interaction patterns.
- For the review flow, keep the existing property search/select behavior from Slice `03`, but restyle and restructure it to match the mockup's interaction model rather than changing the underlying data contract.

## Data contracts
- No backend API shape changes required.
- Optional shared frontend-only shapes:
```ts
type UiFeedbackTone = "info" | "success" | "warning" | "error";

type UiSurfaceState =
  | "idle"
  | "loading"
  | "empty"
  | "error"
  | "success";

type BreadcrumbItem = {
  label: string;
  href?: string;
};
```

## RLS/Constraints notes
- This slice must not weaken existing auth, admin, or moderation gates.
- UX improvements may explain gated states more clearly, but existing authorization and DB enforcement remain authoritative.

## Acceptance criteria checklist
- [ ] Public pages use a more consistent layout and CTA hierarchy without changing core behavior
- [ ] Search, property detail, sign-in, review submission, and admin pages all show consistent loading/empty/error/success treatment
- [ ] Mobile and narrow-width layouts remain usable for key public and admin flows
- [ ] The review property-selection step visually and structurally follows the `Review - Address` mockup more closely: focused shell, prominent search, obvious selected state, confirmation summary, and primary `Continue` action
- [ ] Gated review states give users a clear next step instead of a dead end
- [ ] Keyboard navigation and visible focus states work for primary interactive flows
- [ ] No new backend endpoints, schema changes, or permission changes are required for the polish work

## Test notes (manual smoke steps)
1. Browse `/`, run a search, clear it, and verify the page communicates loading, empty, and retry states consistently.
2. Open `/properties/[id]` on desktop and mobile widths; verify trust score, insights, and "Leave a review" remain easy to find.
3. Open `/submit-review/[propertyId]` and verify the property-selection step feels like the mockup: clear title, large search field, readable result list, obvious selected property, confirmation summary, and primary `Continue` CTA.
4. Open `/submit-review/[propertyId]` in each gate state (signed out, unverified, limit reached, already reviewed, allowed) and confirm each state tells the user what to do next without breaking the focused review layout.
5. Sign in from `/sign-in` with a redirect target and confirm the post-auth path is understandable.
6. Open each admin page and confirm filters, statuses, actions, and empty/error states are readable and keyboard accessible.
7. Navigate core flows using keyboard only and confirm visible focus indicators and logical tab order.

## Out of scope
- New product features or business logic changes.
- Rebranding, logo redesign, or a full visual redesign.
- New analytics, personalization, or experimentation infrastructure.
- Changes to review rules, moderation rules, auth policy, or data exposure.
