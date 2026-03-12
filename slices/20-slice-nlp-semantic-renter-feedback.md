# Slice 20 — NLP Semantic Renter Feedback

## Goal (demo in 1–3 minutes)

After a property has enough approved renter reviews with text, the system can call an NLP/AI service to convert those reviews into neutral, structured, evidence-oriented feedback that highlights recurring lived-experience signals without exposing raw reviewer wording publicly.

## User story

As a prospective renter, I want review text reduced into consistent objective feedback from people who actually lived in the property so I can compare places quickly without having to interpret subjective or emotional comments myself.

## Screens

- Property detail: add a `Renter feedback` section near or below the existing distilled insights area.
- Admin review surface: reuse an existing admin insights moderation page or command-center panel for review, approval, regeneration, and hiding of semantic feedback output.

## Frontend tasks

- Add a `Renter feedback` panel on the property page that renders only approved semantic feedback output.
- Present the feedback as structured cards or rows, for example:
  - category (`maintenance`, `noise`, `cleanliness`, `safety`, `management communication`, `value`)
  - neutral statement
  - signal direction (`positive`, `mixed`, `negative`)
  - supporting review count
  - confidence indicator or confidence band
- Show an empty or unavailable state when there are not enough approved renter reviews to produce reliable feedback.
- Clearly label the section as AI-distilled from approved renter reviews and note that it summarizes patterns rather than every individual experience.
- In admin UI, show the generated output, the source review count, flagged claims, model/version metadata, and actions such as approve, reject, hide, or regenerate.

## DB tasks

- Add a dedicated table for semantic output, preferred name: `semantic_property_feedback`
  - `id`
  - `property_id`
  - `status` (`pending`, `approved`, `rejected`, `hidden`)
  - `source_review_count`
  - `source_review_ids` (`uuid[]` or a normalized join table if preferred)
  - `objective_summary`
  - `category_feedback` (`jsonb`)
  - `risk_flags` (`jsonb`)
  - `confidence_score`
  - `model_provider`
  - `model_name`
  - `prompt_version`
  - `generated_at`
  - `reviewed_by`
  - `reviewed_at`
  - `created_at`
  - `updated_at`
- The `category_feedback` payload should be structured and machine-validated. Suggested item shape:
  - `category: string`
  - `signal: 'positive' | 'mixed' | 'negative'`
  - `statement: string`
  - `supportCount: number`
  - `confidence: number`
  - `keywords: string[]`
- Only include approved reviews with non-empty `reviews.text_input`; if the product distinguishes verified renters from other users, this pipeline should use renter-lived-experience reviews only.
- Preserve prior approved output until a replacement is approved, rather than immediately replacing public feedback with a new pending generation.

## Integration tasks

- Add a recompute path such as `POST /api/admin/properties/:id/semantic-feedback/recompute` or an equivalent server action.
- On recompute:
  - fetch approved source reviews for the property
  - enforce a minimum sample threshold before calling the model
  - remove or mask identifying details such as names, phone numbers, email addresses, unit numbers, and highly specific personal anecdotes when possible
  - send the cleaned review corpus to an NLP/AI provider with strict instructions to output only neutral, non-defamatory, non-identifying, evidence-based feedback
  - require a structured response that groups semantically similar comments into normalized categories and converts subjective wording into plain objective statements
  - reject unsupported claims, legal conclusions, or personally identifying content into `risk_flags`
  - upsert the generated result as `status = 'pending'`
- Trigger recompute when:
  - a new approved renter review with text is added
  - an admin manually requests regeneration
  - prompt/model versions change and admins want a refresh
- Public property pages must read only `approved` semantic feedback output.
- Admin reviewers should be able to compare the generated objective statements against the underlying private reviews before approving them.

## Prompt/analysis notes

- The model prompt should instruct the service to:
  - focus on repeated lived-experience patterns, not one-off anecdotes unless explicitly marked low-confidence
  - rewrite emotional or subjective language into neutral statements
  - avoid quoting renters directly
  - avoid inferring facts not supported by the source text
  - avoid names, unit identifiers, protected-class language, accusations, or legal conclusions
  - return `insufficient_evidence` when the review set is too thin or too contradictory
- Prefer deterministic structured output over free-form prose so the app can render categories consistently and validate the response.

## Data contracts

- Recompute request:
  - `propertyId: string`
- Recompute response:
  - `status: 'pending'`
  - `sourceReviewCount: number`
  - `generatedAt: string`
- Public semantic feedback shape:
  - `propertyId: string`
  - `summary: string`
  - `items: Array<{ category: string; signal: 'positive' | 'mixed' | 'negative'; statement: string; supportCount: number; confidence: number }>`
  - `generatedAt: string`

## RLS/Constraints notes

- Public users can read only `approved` semantic feedback records.
- Only admins can trigger recompute, read pending output, or approve/reject/hide results.
- Raw review text and source review identifiers remain admin-only.
- If the AI provider call happens server-side, provider credentials must never be exposed to the client.
- Add schema or application validation so malformed model output cannot be published.

## Acceptance criteria checklist

- [ ] Approved renter reviews with text can trigger a semantic-feedback generation run for a property
- [ ] The NLP/AI output is saved as `pending` and requires admin approval before public display
- [ ] Public property pages show only approved neutralized feedback, never raw review text
- [ ] Generated feedback is grouped into normalized categories with support counts or equivalent evidence signals
- [ ] Personally identifying, defamatory, or unsupported content is flagged and blocked from public display
- [ ] Existing approved feedback remains public until a replacement generation is reviewed and approved

## Test notes (manual smoke steps)

1. Approve several renter reviews with varied text for one property and trigger recompute.
2. Verify a pending semantic feedback record is created with category output, support counts, and any applicable risk flags.
3. Confirm the property page still hides the new output until an admin approves it.
4. Approve the pending result and verify the property page shows only the neutralized renter feedback.
5. Submit or seed a review containing names, unit references, or emotional accusations; recompute and verify the generated output removes or flags that content instead of publishing it.
6. Trigger a regeneration and verify the prior approved feedback remains public until the new pending version is reviewed.

## Out of scope

- Fully automated public publishing with no admin review step
- Fine-tuning or custom model training in MVP
- Cross-property market comparisons or investor analytics
- Real-time streaming analysis while a review is being typed
