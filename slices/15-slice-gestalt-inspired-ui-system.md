# Slice 15 — Gestalt-Inspired UI System + Screen-by-Screen UX Plan

## Goal (demo in 1–3 minutes)

The app keeps its current product behavior but feels more trustworthy, more guided, and easier to scan across public, auth, review, theme, and admin flows by adopting a small Gestalt-inspired design system: clearer hierarchy, more consistent states, stronger trust signaling, and reusable semantic UI patterns.

## User story

As a renter or admin, I want the interface to communicate confidence, status, and next steps clearly so I can browse properties, submit reviews, sign in, choose a theme, and moderate content without guessing how the system works.

## What "Gestalt" means for this slice

This slice does not mean "make the app look like Pinterest."

For this project, a Gestalt-inspired direction means:

- use a clear visual hierarchy so the primary action is obvious on every screen
- separate high-confidence information from low-confidence or pending information
- standardize loading, empty, error, success, gated, and moderation states
- make dense interfaces easier to scan using reusable cards, badges, steppers, filters, and helper text
- reinforce accessibility, keyboard use, and clear content design
- rely on semantic theme tokens instead of one-off grayscale styling

## Why this matters for Livedin

Livedin is a trust-sensitive product, not a decorative one. Users need to answer questions like:

- Can I trust this score?
- How much evidence supports it?
- Is this insight approved and public yet?
- What can I do next?
- Why am I blocked from submitting a review?

The product already has a strong foundation:

- shared layout/button/input primitives in `livedin/lib/ui.ts`
- site-wide theming with CSS variables in `livedin/app/globals.css`
- persisted theme choice and account-based theme sync in `livedin/components/theme/ThemeSync.tsx`
- multi-theme preview and save flow in `livedin/components/theme/ThemeSettingsPanel.tsx`

This slice builds on those foundations and turns them into a more coherent, reusable UX system.

## Screens

- Public browse: `/`
- Property detail: `/properties/[id]`
- Review submission: `/submit-review/[propertyId]`
- Sign-in: `/sign-in`
- Theme settings surface using `ThemeSettingsPanel`
- Admin properties: `/admin/properties`
- Admin reviews: `/admin/reviews`
- Admin insights: `/admin/insights`

## Screen-by-screen UX direction

### 1. Public browse (`/`)

Current strengths:

- clear hero section
- search-first entry point
- scannable property cards
- visible "Start a review" CTA

Gestalt-inspired improvements:

- turn browse into a guided discovery surface, not only a search box plus result list
- introduce stronger separation between primary action, support information, and secondary tips
- make result cards communicate trust score, confidence, and review count as distinct signals
- make empty and error states action-oriented instead of purely descriptive

Implementation direction:

- add filter chips for dimensions like city, management company, review count, and score band
- add sorting such as highest trust, most reviewed, or recently added
- standardize the browse empty state with "what happened" plus a next action
- promote a consistent CTA hierarchy across hero, search, result list, and side panels

### 2. Property detail (`/properties/[id]`)

Current strengths:

- good section structure
- visible trust score and review CTA
- rating breakdown and insight summary already separated

Gestalt-inspired improvements:

- distinguish trust score from evidence quality
- make confidence and moderation state visible near the top of the page
- clarify what data is public, what is pending, and what appears after enough reviews
- make the rating breakdown easier to compare at a glance

Implementation direction:

- add a confidence badge such as `High confidence`, `Moderate confidence`, or `Few reviews`
- create a shared explanation pattern for "how this score is formed"
- standardize public data states:
  - no reviews yet
  - not enough data
  - summary pending approval
  - summary approved
- improve the top summary layout so score, count, confidence, and insight status are visually distinct

### 3. Review gate (`/submit-review/[propertyId]` before form access)

Current strengths:

- gated submission states already exist
- flow is intentionally task-focused

Gestalt-inspired improvements:

- show a clearer step model so blocked users still understand the full journey
- make each gate state feel intentional, not like a dead end
- explain why the gate exists in terms of trust and moderation quality

Implementation direction:

- standardize gate-state surfaces for:
  - unauthenticated
  - unverified
  - already reviewed
  - rate limit reached
- use a reusable layout with:
  - what happened
  - why it matters
  - next step
- keep property context visible even when the user is blocked

### 4. Review property selection

Current strengths:

- selection step exists as a distinct task
- flow supports searching and continuing

Gestalt-inspired improvements:

- reduce uncertainty around "Did I pick the right property?"
- make selected state more obvious
- reduce the feeling that the user is starting over when the route already contains a property id

Implementation direction:

- preselect or pin the routed property as the most likely choice
- visually separate search results from the current selection summary
- tie the main `Continue` CTA directly to the selected property
- use a focused, single-task layout aligned to the existing mockup direction

### 5. Review form

Current strengths:

- clear separation of ratings, private notes, and tenancy dates
- inline validation already exists
- helper copy clarifies public versus private text

Gestalt-inspired improvements:

- use a true stepper instead of plain step text
- separate required inputs from optional context more clearly
- make progress and completion feel lighter and more encouraging
- reduce interaction ambiguity around half-star input

Implementation direction:

- introduce a shared stepper primitive for multi-step flows
- label sections as `Required` and `Optional`
- keep current inline validation model but normalize error placement and helper copy
- improve progress cues such as completed rating count or completion summary
- consider a sticky action/footer pattern on long forms

### 6. Review confirmation

Current strengths:

- clear success state
- obvious next actions

Gestalt-inspired improvements:

- explain what happens after submission
- reinforce user trust and effort value
- distinguish success message, reference id, and next-step CTA hierarchy

Implementation direction:

- add a simple post-submit timeline:
  - submitted
  - reviewed by admin
  - contributes to public trust signals
- reinforce that private text is moderated and not shown directly on the public page

### 7. Sign-in (`/sign-in`)

Current strengths:

- strong explanation of why authentication matters
- Google path is prominent
- redirect handling is already described

Gestalt-inspired improvements:

- make sign-in versus sign-up intent easier to scan
- clarify what changes after auth and verification
- reduce nonessential cognitive load around redirect details

Implementation direction:

- strengthen tab/toggle styling for sign-in versus sign-up
- standardize success and error messaging surfaces
- make Google the dominant path when the user arrived from a gated review flow
- treat redirect details as supporting information, not primary content

### 8. Theme settings

Current strengths:

- account-level theme persistence exists
- preview cards already show token usage
- theme is applied globally via CSS variables

Gestalt-inspired improvements:

- turn theme choice into a more explicit semantic system, not only a palette picker
- explain what tokens control and where each semantic role appears in the product
- make theme previews reflect real product states more clearly

Implementation direction:

- document and expose semantic token roles such as:
  - primary action
  - trust/verified
  - muted/supporting text
  - surface
  - selected state
  - warning/error/info
- preview a real product scenario in the theme panel:
  - property card
  - trust score card
  - status badge
  - button hierarchy
- ensure themed states still meet contrast requirements

### 9. Admin properties (`/admin/properties`)

Current strengths:

- table layout is efficient for operational work
- actions are already visible inline

Gestalt-inspired improvements:

- increase scannability for status and action safety
- better separate informational actions from consequential actions
- make the page more useful at a glance

Implementation direction:

- add summary stats such as total, active, and inactive properties
- add search and filters above the table
- create a consistent status badge pattern shared with other admin screens
- make destructive or state-changing actions more visually distinct

### 10. Admin review moderation (`/admin/reviews`)

Current strengths:

- split-pane queue plus detail pattern is already useful
- moderation actions are clear

Gestalt-inspired improvements:

- make the queue easier to triage
- improve detail scanning for rating data, tenancy context, and private text
- clarify public impact of each moderation action

Implementation direction:

- add shared queue metadata such as pending counts or oldest pending item
- group review details into labeled sections:
  - moderation metadata
  - structured scores
  - tenancy context
  - private text
- document action meaning for approve, reject, remove, and reset

### 11. Admin insight moderation (`/admin/insights`)

Current strengths:

- queue and detail surfaces already exist
- screening metadata is visible

Gestalt-inspired improvements:

- make AI-generated moderation feel governed and transparent
- prioritize insight text evaluation before metadata
- standardize insight status language with review moderation patterns

Implementation direction:

- show summary text first, screening metadata second, actions third
- create a reusable moderation checklist for public summaries
- clarify the difference between `hidden` and `rejected`
- explain public impact of each status

## Frontend tasks

- Define a small set of shared Gestalt-inspired UI primitives and patterns:
  - stepper
  - status badge
  - confidence badge
  - empty-state panel
  - gated-state panel
  - section header pattern
  - filter chip
  - table/list toolbar
- Convert current hardcoded visual intent into semantic usage:
  - primary action
  - supporting action
  - destructive action
  - trust/verified
  - info/warning/error
  - selected/active state
- Refactor public pages so hierarchy and state treatment are consistent across `/`, `/properties/[id]`, and `/submit-review/[propertyId]`.
- Refactor auth, theme, and admin surfaces so status badges, feedback panels, and high-impact actions behave consistently.
- Add shared content patterns for:
  - "how this works"
  - "why you are blocked"
  - "what happens next"
  - "not enough data yet"

## Theme-system tasks

- Audit the existing theme-token model in `livedin/lib/themes.ts` and `livedin/app/globals.css` against semantic UI roles rather than palette names alone.
- Extend the planning model for tokens so each token maps to a product job:
  - page background
  - card/surface background
  - secondary surface
  - primary CTA
  - primary CTA text
  - selected/hover fill
  - trust/verified accent
  - border/supporting neutral
  - muted/supporting text
  - success/warning/error/info
- Normalize component usage so shared primitives in `livedin/lib/ui.ts` eventually consume semantic styling consistently.
- Ensure theme previews in `ThemeSettingsPanel` represent real interface patterns, not only abstract color blocks.

## DB tasks

- None required for the Gestalt-inspired design-system work itself.
- No schema, RLS, aggregate, or policy changes should be required to complete this slice.

## Integration tasks

- Reuse existing flows and contracts from Slices `01-14`; this slice is about UX systemization and screen architecture, not new business logic.
- Preserve all current permissions, moderation rules, and review gating behavior.
- Reuse current theme persistence and auth/profile reads rather than creating new storage models for styling.
- Keep current routes and page responsibilities intact while reorganizing visual hierarchy and UI patterns.

## Data contracts

- No backend API changes required.
- Optional frontend-only planning types:

```ts
type UiStatusTone =
  | "default"
  | "info"
  | "success"
  | "warning"
  | "error";

type UiConfidenceLevel =
  | "none"
  | "few_reviews"
  | "moderate"
  | "high";

type StepItem = {
  id: string | number;
  label: string;
  active: boolean;
  complete: boolean;
  blocked?: boolean;
};

type EmptyStateAction = {
  label: string;
  href?: string;
  onClick?: () => void;
};

type ModerationActionMeaning = {
  action: "approve" | "reject" | "remove" | "reset" | "hide";
  publicEffect: string;
};
```

## RLS/Constraints notes

- This slice must not weaken current auth, verification, moderation, or admin boundaries.
- UX improvements may explain permissions and gated states more clearly, but backend enforcement remains authoritative.
- Theme personalization must continue to respect current account and profile rules.

## Implementation plan

### Phase 1 — Design-system audit and semantic mapping

- Inventory current shared primitives in `livedin/lib/ui.ts`, `FeedbackPanel`, review flow shells, and admin table patterns.
- Audit current token usage in `livedin/app/globals.css`, `livedin/lib/themes.ts`, `ThemeSync`, and `ThemeSettingsPanel`.
- Produce a semantic style map from existing tokens and classes to product roles.
- Identify duplicate state treatments across public, auth, review, theme, and admin surfaces.

Deliverable:

- a documented semantic UI map and component inventory

### Phase 2 — Shared pattern definitions

- Define the reusable patterns to standardize before screen refactors:
  - page section headers
  - state panels
  - status and confidence badges
  - steppers
  - filter/toolbars
  - moderation action grouping
- Decide which patterns belong in shared components versus page-local composition.
- Document content rules for helper copy and status messages.

Deliverable:

- a lightweight component and copy specification for shared UI patterns

### Phase 3 — Public-flow redesign pass

- Apply the shared system to:
  - home/browse
  - property detail
  - review gate
  - property selection
  - review form
  - review confirmation
- Prioritize clarity of trust score, confidence, review evidence, and next steps.

Deliverable:

- a screen-by-screen public-flow redesign checklist

### Phase 4 — Auth and theme pass

- Apply the same hierarchy and state rules to sign-in and theme settings.
- Reframe theme selection around semantic roles and real product previews.
- Confirm redirect and verification messaging is consistent with review gating.

Deliverable:

- a cohesive auth and theme UX specification

### Phase 5 — Admin-system pass

- Normalize queue, detail, status, and action patterns across:
  - properties
  - reviews
  - insights
- Improve triage, readability, and action safety.

Deliverable:

- an admin UX consistency checklist and moderation pattern spec

### Phase 6 — Accessibility and QA pass

- Verify keyboard navigation, focus states, heading order, color contrast, and live-region behavior for updated patterns.
- Confirm all states still read clearly under each supported theme.
- Verify public, auth, review, theme, and admin flows remain behaviorally unchanged.

Deliverable:

- a manual QA checklist for accessibility and thematic consistency

## Acceptance criteria checklist

- [ ] A planning-only Gestalt-inspired UX specification exists for public, auth, theme, review, and admin surfaces
- [ ] The spec clearly explains how Gestalt principles map to Livedin rather than to Pinterest branding
- [ ] The spec includes screen-by-screen recommendations for `/`, `/properties/[id]`, `/submit-review/[propertyId]`, `/sign-in`, theme settings, `/admin/properties`, `/admin/reviews`, and `/admin/insights`
- [ ] The spec includes a phased implementation plan that can be executed later without changing product behavior
- [ ] The spec treats the existing theme system as part of the design-system plan
- [ ] The spec requires no schema, RLS, or API contract changes

## Test notes (manual planning review)

1. Review the proposed semantic token roles against `livedin/lib/themes.ts` and `livedin/app/globals.css` and confirm every important UI state has a planned semantic mapping.
2. Review public browse, property detail, and review submission recommendations and confirm they improve trust, confidence signaling, and next-step clarity without changing backend behavior.
3. Review auth and theme recommendations and confirm they align with current sign-in, verification, and saved-theme flows.
4. Review admin recommendations and confirm they improve moderation clarity and action safety without changing moderation rules.
5. Confirm this slice remains documentation-only and does not require implementation in the current step.

## Out of scope

- Implementing any of the design-system, token, or component changes in app code
- Adding new product features, routes, or backend contracts
- Changing review rules, moderation rules, or auth policy
- Rebranding Livedin to visually resemble Pinterest
- Replacing the existing theme system with a new persistence model
