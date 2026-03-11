# Slice 16 — Mobile-First UX Polish + Screen Simplification

## Goal (demo in 1–3 minutes)

The web app feels intentionally designed for mobile browsing and review submission: each screen emphasizes one primary action, the first screenful answers the user's key questions quickly, forms feel lighter, and critical actions are easier to tap, understand, and complete with one hand.

## User story

As a renter using the site on my phone, I want to find a property, judge whether it seems trustworthy, and leave a review without friction so I can make quick decisions without getting lost in dense layouts or long forms.

## What this slice is

This is a planning-only mobile UX slice.

It defines how the current product should be prioritized, structured, and simplified on small screens without changing the underlying business logic, moderation model, auth model, or route structure.

## What "mobile-first polish" means for Livedin

For this product, mobile polish does not mean "shrink the desktop layout until it fits."

It means:

- every screen has one obvious primary action
- the first visible content explains why the screen matters
- important actions are reachable with a thumb
- dense side-by-side layouts collapse into a clear vertical flow
- structured taps replace typing wherever possible
- long flows are split into visible steps
- scores and trust signals are explained in plain language
- advanced detail is hidden until needed
- navigation stays predictable and low-branch
- success, failure, limits, and saved states are obvious
- touch targets are large and forgiving
- modals are used sparingly in favor of inline expansion, bottom sheets, or full-screen flows
- accessibility is treated as part of intuitive design, not a separate add-on

## Mobile-first content priority for this app

On small screens, the product should optimize for these questions in this order:

1. Can I find a property fast?
2. Can I tell if it is good or bad fast?
3. Can I trust the score?
4. Can I leave a review without friction?

If a mobile screen does not help answer one of those quickly, it is probably carrying too much secondary content.

## Core mobile heuristics for every screen

For each mobile screen, validate these questions:

1. What is the one thing the user came here to do?
2. What is the one thing they must see before scrolling?
3. What can be removed, collapsed, or delayed?

Required design rules:

- one primary CTA per screen
- one clear hero block or top summary above the fold
- critical actions placed in the lower half or sticky footer when possible
- no competing clusters of equally loud buttons
- no dependence on tiny top-right controls for core tasks
- no essential information hidden behind technical wording

## Screens

- Public browse/search: `/`
- Property detail: `/properties/[id]`
- Review gate and review flow: `/submit-review/[propertyId]`
- Sign-in and account-entry points: `/sign-in`
- Admin access request entry: `/signup/request-admin`

## Screen-by-screen mobile UX direction

### 1. Public browse/search (`/`)

Primary action:

- search for a property

Must be visible before scroll:

- search input
- short explanation of what the product helps answer
- one clear supporting action at most, such as `Start a review`

Mobile-first direction:

- keep the top of the page focused on search instead of splitting attention across multiple hero actions
- reduce introductory copy to a short, scannable explanation
- move secondary education, tips, or long supporting text below results or into collapsible sections
- ensure the search box is large, obvious, and immediately tappable
- if filters are needed, present them from a single `Filters` entry point that opens a bottom sheet rather than showing many small controls inline
- keep result cards in a single-column vertical list with clear spacing

Information hierarchy for result cards:

- property name and address
- overall score
- review count
- confidence cue or evidence cue
- one clear next action

Avoid on mobile:

- multiple primary buttons in the hero
- inline rows of tiny chips competing with search
- dense metadata blocks before the first results

### 2. Property detail (`/properties/[id]`)

Primary action:

- decide whether to inspect the score breakdown or leave a review

Must be visible before scroll:

- property name and address
- overall score
- review count or confidence cue
- short distilled insight
- one clear CTA such as `See breakdown` or `Leave review`

Mobile-first direction:

- make the opening summary block answer "Is this property worth considering?" without requiring scroll
- keep top content vertically stacked in this order:
  - identity
  - trust score
  - review evidence
  - distilled insight
  - primary CTA
- treat score meaning as plain-language content, not only a number
- show confidence or limited-data context directly beside the score rather than burying it lower on the page
- move deeper breakdowns, supporting text, and additional sections below the fold
- avoid trying to preserve desktop-style dual-column or sidebar patterns on mobile

Recommended section order after the top summary:

- score breakdown
- insights
- photos
- related actions

Progressive disclosure guidance:

- collapsed category breakdown with `See all categories`
- short insight preview with `Read more`
- supporting explanation for score/confidence hidden until expanded

### 3. Filters, sorting, and secondary controls

Primary action:

- refine results without overwhelming the main screen

Mobile-first direction:

- consolidate filters into a single bottom sheet or full-screen filter view
- keep sort as a simple segmented control or single selector, not a dense toolbar
- use large chips or rows with comfortable spacing
- make active filters obvious and removable with one tap
- after applying filters, show clear feedback that the result set changed

Avoid on mobile:

- persistent filter sidebars
- tiny top-right sort menus
- multiple rows of chips above the main content

### 4. Review gate states (`/submit-review/[propertyId]` before form access)

Primary action:

- understand the block and complete the next required step

Must be visible before scroll:

- property context
- what happened
- why the user is blocked
- the next action

Mobile-first direction:

- blocked states should still feel like part of the review journey, not an error dead end
- keep the page focused on one next step such as `Sign in`, `Verify email`, or `Back to property`
- separate explanatory copy from the main action so the CTA remains obvious
- place the action low enough to be thumb-friendly, especially on tall screens
- avoid showing multiple competing escape hatches with the same visual priority

### 5. Review property selection

Primary action:

- choose the correct property

Must be visible before scroll:

- title explaining the task
- address/property search field
- current selected property state if one is prefilled
- primary `Continue` action only when the choice is clear

Mobile-first direction:

- treat property selection as a focused full-screen step, not a busy mixed form
- use autocomplete, result cards, or tappable rows instead of manual typing wherever possible
- keep the currently selected property visually distinct from the raw result list
- tie `Continue` directly to the current selection and keep it sticky if the list is long
- reduce uncertainty by explicitly answering "Is this the right place?"

Avoid on mobile:

- showing the full review form before the property is confirmed
- requiring the user to scroll past search noise to find the selected state
- mixing confirm, cancel, and back actions too tightly together

### 6. Review ratings step

Primary action:

- answer the current rating prompt

Must be visible before scroll:

- step progress such as `2 of 4`
- current category name
- short explanation of what the category means
- large tappable rating control
- next action

Mobile-first direction:

- break the review into distinct steps instead of a long all-in-one form
- present one category or one grouped task at a time
- prefer tap cards, chips, segmented controls, or large half-step rating controls over small stars or free-text explanations
- keep the `Next` or `Continue` action sticky when the screen height is constrained
- use reassuring progress language so the flow feels finite

Reduce typing:

- ratings should be tapped, not typed
- tenancy dates should use pickers
- any optional narrative field should be clearly marked optional and kept short

### 7. Review optional context step

Primary action:

- add extra private context only if the user wants to

Must be visible before scroll:

- explanation that the step is optional
- short prompt for what kind of context is useful
- clear skip path
- primary action to continue

Mobile-first direction:

- keep optional text short and clearly secondary to the structured ratings
- do not overwhelm the user with long prompts or multiple textareas
- if private context helps moderation, explain that in plain language
- let users skip without guilt or confusion

### 8. Review confirmation and submit step

Primary action:

- review answers and submit confidently

Must be visible before scroll:

- summary of what will be submitted
- moderation/privacy reminder if relevant
- primary `Submit review` CTA

Mobile-first direction:

- show a concise summary rather than forcing the user to re-read the entire form
- keep edit affordances available but secondary
- ensure submit and back/edit actions are visually distinct and well spaced
- after submission, use a clear success state that explains what happened and what happens next

State feedback requirements:

- success should confirm submission clearly
- failure should explain what went wrong in plain language
- limits and duplicate-review states should say what the user can do next

### 9. Sign-in (`/sign-in`)

Primary action:

- sign in and return to the task the user came to complete

Must be visible before scroll:

- why sign-in is needed
- primary sign-in method
- what changes after sign-in

Mobile-first direction:

- keep the sign-in page focused on one main path, especially when entered from a review gate
- reduce redirect details and technical explanation above the fold
- make alternative auth options visibly secondary if one method is preferred
- keep labels explicit and avoid icon-only affordances

### 10. Admin access request (`/signup/request-admin`)

Primary action:

- understand eligibility and request access if allowed

Must be visible before scroll:

- current status
- eligibility explanation
- one next action

Mobile-first direction:

- keep this screen informational and task-focused
- avoid dense policy copy before the current status is known
- if the user is ineligible or already pending, treat the state as the main content rather than showing a live form first

## Navigation guidance for mobile

Navigation should be predictable and low-branch.

Guidelines:

- keep the number of top-level destinations small
- prioritize destinations that map to the product's core jobs:
  - search
  - recent or saved context if that exists
  - leave review
  - profile/account
- always provide an obvious way back from deep-link entry points
- avoid dead-end screens with no clear return path

If navigation evolves later, bottom navigation is preferable to hidden branching for the highest-frequency mobile tasks.

## Shared mobile interaction rules

### Touch targets

- rating controls, chips, segmented controls, toggles, and buttons should be comfortably large
- destructive and safe actions must have enough spacing to prevent accidental taps
- icon-only controls should be avoided for primary actions

### Thumb reach

- use sticky bottom CTAs for long or high-intent flows
- keep the most important controls in the lower half when feasible
- do not place essential actions only in the top-right corner

### State clarity

When a user saves, submits, fails verification, hits a limit, or encounters an error, the UI should clearly state:

- what happened
- whether the action succeeded
- what to do next

Avoid vague messaging such as `Something went wrong` without guidance.

### Modal usage

- prefer bottom sheets for filters and action lists
- prefer inline expansion for secondary detail
- prefer full-screen step flows for multi-step forms
- reserve true modal dialogs for high-importance confirmation only

### Accessibility

- maintain readable type size on small screens
- preserve strong color contrast
- label controls with text, not only icons
- support keyboard focus and screen readers
- do not rely on color alone for score meaning or status meaning

## Frontend tasks

- Audit each mobile screen for a single clear primary action.
- Rewrite above-the-fold content so each screen answers its key question before scroll.
- Convert dense mobile layouts into a vertical content order:
  - summary
  - breakdown
  - insights
  - photos
  - related actions
- Standardize sticky mobile CTA treatment for long or high-intent flows.
- Refactor filters and secondary actions into bottom-sheet or collapsed patterns instead of persistent clutter.
- Break the review flow into explicit steps with visible progress.
- Replace typed interactions with tappable controls wherever existing business logic allows:
  - property lookup autocomplete
  - rating chips/cards/sliders
  - date pickers
- Normalize mobile state feedback for:
  - submit success
  - submit failure
  - saved changes
  - verification failure
  - review limit reached
  - duplicate-review block
- Verify touch-target sizing and spacing for all critical interactive controls.
- Audit mobile accessibility for headings, labels, focus states, announcements, and contrast.

## DB tasks

- None required for this slice.
- No schema, RLS, trigger, policy, or aggregate changes should be necessary for mobile UX polish alone.

## Integration tasks

- Reuse the existing routes, review gating rules, auth rules, and moderation behavior from earlier slices.
- Keep current backend contracts intact; this slice is about mobile presentation, flow structure, and content hierarchy.
- Reuse existing property, review, auth, and moderation data rather than introducing new business entities just to support mobile layouts.

## Data contracts

- No backend API changes required.
- Optional frontend-only planning types:

```ts
type MobilePrimaryActionPlacement =
  | "inline"
  | "sticky_footer"
  | "bottom_sheet";

type MobileReviewStep =
  | "property"
  | "ratings"
  | "context"
  | "review"
  | "submitted";

type ScoreEvidenceLevel =
  | "no_reviews"
  | "few_reviews"
  | "moderate"
  | "high";

type MobileStateMessage = {
  title: string;
  body: string;
  ctaLabel?: string;
};
```

## RLS/Constraints notes

- This slice must not weaken auth, verification, moderation, admin, or anti-abuse enforcement.
- Clearer mobile wording may explain restrictions better, but server-side enforcement remains authoritative.
- Mobile simplification must not hide or remove important compliance, moderation, or trust information; it should reorder and progressively disclose it.

## Implementation plan

### Phase 1 — Mobile audit and content triage

- Review all key public and auth/review screens at mobile widths.
- Identify the current primary action, the first visible content, and all competing secondary actions.
- Mark content that should be removed, collapsed, delayed, or moved below the fold.

Deliverable:

- a screen inventory with above-the-fold priorities and clutter to reduce

### Phase 2 — Shared mobile patterns

- Define shared patterns for:
  - sticky footer CTA
  - mobile summary hero
  - bottom-sheet filters/actions
  - step progress
  - mobile state feedback
  - tappable chips/cards/segmented controls
- Document content rules for short mobile copy and plain-language trust explanations.

Deliverable:

- a lightweight mobile pattern spec

### Phase 3 — Browse and property-detail pass

- Redesign `/` and `/properties/[id]` around first-screen understanding and single-column flow.
- Ensure search, score meaning, evidence/confidence, and next actions are understandable before deep scrolling.

Deliverable:

- a mobile-first public browsing checklist

### Phase 4 — Review-flow pass

- Restructure the review journey into explicit, low-friction steps.
- Reduce typing, clarify progress, and keep next actions thumb-reachable.
- Improve blocked-state screens so they remain actionable instead of feeling broken.

Deliverable:

- a mobile review-flow specification

### Phase 5 — Auth and account-entry pass

- Simplify sign-in and admin access request screens for mobile context.
- Keep the main reason for signing in or requesting access visible above the fold.

Deliverable:

- a mobile auth/account-entry checklist

### Phase 6 — Accessibility and feedback QA pass

- Validate contrast, text size, touch-target sizing, focus behavior, screen-reader labels, and error/success clarity.
- Confirm that mobile flows communicate obvious system feedback after every important state change.

Deliverable:

- a mobile accessibility and feedback QA checklist

## Acceptance criteria checklist

- [ ] A planning-only mobile UX specification exists for browse, property detail, review flow, sign-in, and admin access request entry
- [ ] The spec defines one primary action per key mobile screen
- [ ] The spec defines what must be visible before scrolling on the most important screens
- [ ] The spec prioritizes vertical mobile flow over dense desktop-style layouts
- [ ] The spec reduces typing and recommends structured tap-based interactions where appropriate
- [ ] The spec breaks the review flow into explicit steps with progress guidance
- [ ] The spec explains score trust, confidence, and evidence in plain language
- [ ] The spec uses progressive disclosure for secondary detail rather than front-loading everything
- [ ] The spec requires clearer state feedback for success, failure, limits, and blocked states
- [ ] The spec requires no schema, RLS, or backend API changes
- [ ] The slice remains documentation-only and does not implement app changes yet

## Test notes (manual planning review)

1. Review the home screen recommendations and confirm the first mobile screenful is centered on property search, not competing actions.
2. Review the property-detail recommendations and confirm users can understand the property identity, score, evidence, insight, and next action before scrolling.
3. Review the review-flow recommendations and confirm the form is broken into steps that minimize typing and make progress obvious.
4. Review the blocked-state guidance and confirm each gate state explains what happened and what to do next.
5. Review filter, sort, and secondary-action guidance and confirm it prefers bottom sheets or collapsed patterns over persistent mobile clutter.
6. Review accessibility guidance and confirm it covers touch-target sizing, readable type, labels, focus treatment, and non-color-dependent status meaning.
7. Confirm the slice changes planning only and does not require code implementation in this step.

## Out of scope

- Implementing any of the mobile UX changes in app code during this step
- Adding new routes, backend endpoints, schema changes, or permission changes
- Creating new business features such as saved properties, recent history, or a brand-new navigation system unless separately scoped
- Changing review eligibility, moderation policy, scoring rules, or auth policy
- Turning desktop admin tooling into a fully mobile-native admin product beyond essential responsive usability
