# Cursor Prompt — Direct Review Page Implementation (Facelift -> Livedin)

> Paste this entire prompt into a new Cursor chat on the `teamrenter` repo.
> Work on a feature branch.
> From `livedin/`, run `npm run lint` and `npm run build` before opening a PR.

---

## Goal

Implement the **Facelift review page UX directly** in `livedin` so the flow and visuals match:

- `New FE/Facelift/src/app/pages/WriteReviewPage.tsx`
- `New FE/Facelift/src/app/components/StepProgress.tsx`

Use this as the visual source of truth while keeping Livedin's real data and API behavior.

---

## Scope (this pass only)

Deliver a polished multi-step review page under the Facelift shell with:

1. Verify tenancy step
2. Rate categories step (7 sliders, 1-10)
3. Write review step
4. Confirmation success state

Do **not** implement Business Portal pages.

---

## Existing code to reuse

Read these first and extend them rather than rewriting from scratch:

```
livedin/app/(facelift)/submit-review/[propertyId]/page.tsx
livedin/components/reviews/ReviewSubmitFlow.tsx
livedin/components/facelift/FaceliftReviewFormStep.tsx
livedin/lib/facelift-seven-categories.ts
livedin/app/api/properties/[id]/reviews/route.ts
livedin/lib/types.ts
livedin/lib/validation/review.ts
New FE/Facelift/src/app/pages/WriteReviewPage.tsx
New FE/Facelift/src/app/components/StepProgress.tsx
```

---

## Required implementation changes

1. **Route + entrypoint**
   - Add a canonical Facelift route at `livedin/app/(facelift)/write-review/[propertyId]/page.tsx`.
   - Keep compatibility with current submit route by rendering the same flow from both routes (or redirect one to the other).
   - Update header CTA/link usage to point to the canonical review route if needed.

2. **Flow structure**
   - Refactor `ReviewSubmitFlow` facelift variant to match the Facelift sequence:
     - Step 1: Verify tenancy
     - Step 2: Rate categories
     - Step 3: Write review
     - Step 4: Confirmation
   - Keep animated transitions when feasible (`motion`), but do not block merge if only static transitions are possible.

3. **Step 1: Verify tenancy**
   - Include fields and copy aligned to Facelift:
     - Property address (prefilled + readonly when propertyId is known, editable fallback when property lookup fails)
     - Move-in date (required)
     - Move-out date (optional)
     - Privacy note block
   - Validation: cannot continue without required fields.

4. **Step 2: Rate categories**
   - Use 7 Facelift categories and 1-10 sliders with visible numeric value.
   - Keep mapping to 5 canonical metrics via `livedin/lib/facelift-seven-categories.ts`.
   - Preserve documented mapping comments; do not change stored review schema.

5. **Step 3: Write review**
   - Include large textarea with character count and min-length guard before submit (match Facelift intent; adapt to existing validation limits).
   - Include "best suited for" chips as UI-only (optional payload field only if already supported; otherwise do not send).
   - Submit through existing `POST /api/properties/[id]/reviews` flow with auth token behavior unchanged.

6. **Step 4: Confirmation**
   - Show success card matching Facelift style.
   - Keep actions:
     - Back to home
     - View dashboard (or existing equivalent)

7. **Styling parity**
   - Match Facelift colors/spacing/typography:
     - `#E8913A`, `#0F1F38`, `#E2DDD6`, `#F7F4EF`, `#717182`
   - Reuse existing Facelift components where possible:
     - `StepProgress`
     - `FaceliftReviewFormStep` (split into multiple step components if needed)
   - Keep the page within the Facelift layout and toaster behavior.

8. **Error handling**
   - Preserve current gate states and API error handling (`401`, `403`, `409`, `429`, generic errors).
   - Surface errors with Sonner and inline notices in Facelift styling.

---

## Data and behavior constraints

- Use real API submission; no mock data.
- Keep five canonical backend review metrics.
- Keep RLS/auth behavior intact.
- Do not expose service role keys.
- Do not break the existing `submit-review` URL behavior during this pass.

---

## Acceptance criteria

- [ ] Route exists for `/(facelift)/write-review/[propertyId]` and works end-to-end.
- [ ] UX visually matches Facelift `WriteReviewPage` flow and styling.
- [ ] 7-slider UI maps to 5 stored metrics via existing mapper utilities.
- [ ] Submission calls real reviews API and handles all current error states.
- [ ] Success confirmation state appears after `201` API response.
- [ ] `npm run lint` passes in `livedin/`.
- [ ] `npm run build` passes in `livedin/`.

---

## Suggested implementation order

1. Add canonical route and unify route behavior.
2. Split facelift review flow into 4 explicit steps.
3. Move current tenancy/date/review fields into the new step sequence.
4. Align styling and transitions with Facelift source.
5. Run lint/build and fix any regressions.

