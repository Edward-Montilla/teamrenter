# Slice 02 — Property Detail (Public Read)

## Goal (demo in 1–3 minutes)
User opens a property page and sees TrustScore (0–6), metric breakdown (0–6), review count, and approved distilled insights if present; "no reviews" and "no insights" states render correctly.

## User story
As a public visitor, I want to understand a property's trust signals before deciding to pursue it.

## Screens (mockups)
- `proj_docs/UI Mockup/Rental Review Platform UI Mockups-2.png` (Frame 3: Property Detail)

## Frontend tasks (mocked)
- Create route `/properties/[id]`.
- Build rating components:
  - Overall TrustScore (0–6).
  - Per-metric scores (0–6): management_responsiveness, maintenance_timeliness, listing_accuracy, fee_transparency, lease_clarity.
  - Review count / confidence label.
- Distilled insights panel:
  - Show text only when `insights_status === 'approved'`.
  - Otherwise show "No insights yet" or "Not enough data".
- Handle "no reviews" case: all display scores 0; show "No reviews yet / Not enough data".
- "Back to results" and "Leave a review" CTAs.
- Use mocked dataset shaped like eventual DB read (property + aggregates + approved insights only).

## DB tasks (Supabase)
- Deferred until DB phase (Slice 04/05):
  - property_aggregates computed fields and last_updated.
  - distilled_insights status gating for public read.

## Integration tasks
- Deferred until integration phase (Slice 06):
  - Server action / route handler: fetch property + aggregates + approved insights only.

## Data contracts (TypeScript shapes in markdown)
```ts
type PropertyDetailPublic = {
  property: {
    id: string;
    display_name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    province: string;
    postal_code: string;
    management_company: string | null;
  };
  aggregates: PropertyAggregatePublic;
  insights: DistilledInsightPublic | null;
};

type PropertyAggregatePublic = {
  review_count: number;
  display_trustscore_0_6: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  display_management_responsiveness_0_6: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  display_maintenance_timeliness_0_6: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  display_listing_accuracy_0_6: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  display_fee_transparency_0_6: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  display_lease_clarity_0_6: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  last_updated: string; // ISO timestamp
};

type DistilledInsightPublic = {
  insights_text: string;
  last_generated_at: string; // ISO timestamp
};
// Only included when status === 'approved'; never raw review text.
```

## RLS/Constraints notes (must be enforced later)
- Public can select aggregates for active properties only.
- Public can select distilled_insights only when status = 'approved'.
- Public must never receive reviews.text_input or per-review raw text.

## Acceptance criteria checklist
- [ ] Property page renders from mock data (`UI-PUB-02`, `AC-02`)
- [ ] Shows correct "no reviews" state when review_count = 0 (`UI-PUB-03`, `AGG-03`, `AGG-04`)
- [ ] Per-metric and overall display scores follow 0–6 mapping (`AGG-04`, `AGG-05`, `TST-05`)
- [ ] Never displays raw user text; only approved distilled insights (`INS-04`, `NFR-PRIV-01`, `TST-06`)
- [ ] "No insights yet" when no approved insight (`UI-PUB-03`)

## Test notes (manual smoke steps)
1. Open `/properties/[id]` with mock property that has reviews and approved insight; verify scores and insights panel.
2. Open `/properties/[id]` with mock property where review_count = 0; verify "No reviews yet" and all scores 0.
3. Open property with no approved insight; verify "No insights yet".
4. Confirm no raw review text appears anywhere on the page.

## Out of scope
- Photos (optional Slice 11)
- Admin edit from this page
- Per-review list/feed (structured metrics only; no public review body)
