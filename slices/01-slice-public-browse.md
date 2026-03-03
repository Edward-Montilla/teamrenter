# Slice 01 — Public Browse/Search Results

## Goal (demo in 1–3 minutes)
Demo `/` with mocked data: search text, results list cards, empty/loading/error states, and navigation to property detail.

## User story
As a public visitor, I want to search by address or management company and quickly compare properties before opening a specific listing.

## Screens (mockups)
- `proj_docs/UI Mockup/Rental Review Platform UI Mockups.png` (Frame 1: Landing/Home)
- `proj_docs/UI Mockup/Rental Review Platform UI Mockups-1.png` (Frame 2: Search Results)

## Frontend tasks (mocked)
- Create route `/` with:
  - Hero section and search input
  - “Leave a review” CTA
  - Results area with list cards and map placeholder panel
- Build `SearchBar` with client-side query state and submit handling.
- Build `PropertyCard` showing:
  - display name
  - address summary
  - management company
  - `trustscore_display_0_6` and `review_count`
- Implement UI states:
  - loading skeleton list
  - empty state (`No results`)
  - recoverable error state with retry
- Wire card click to `/properties/[id]`.
- Use a mock data provider returning shapes identical to expected Supabase read contracts.

## DB tasks (Supabase)
- Deferred until DB phase (Slice 04/05):
  - `properties` entity with active/inactive status
  - `property_aggregates` preview fields for public cards
  - baseline search indexes (`ILIKE` now; FTS optional later)

## Integration tasks
- Deferred until integration phase (Slice 06):
  - Replace mock provider with server-side query endpoint for active properties + aggregates.

## Data contracts (TypeScript shapes in markdown)
```ts
type PropertyListItem = {
  id: string; // uuid
  display_name: string;
  address_line1: string;
  city: string;
  province: string;
  management_company: string | null;
  trustscore_display_0_6: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  review_count: number;
};

type PropertySearchResponse = {
  items: PropertyListItem[];
  total: number;
  query: string;
};

type UiListState = "loading" | "ready" | "empty" | "error";
```

## RLS/Constraints notes (must be enforced later)
- Public reads limited to active properties (`status='active'`).
- Public list route must never query `reviews` directly.
- Public response may include only safe fields from properties + aggregates.

## Acceptance criteria checklist
- [ ] `/` renders mocked property cards and search input (`UI-PUB-01`, `FD-01`)
- [ ] Query filters mocked results by address/company text (`FD-01`)
- [ ] Card click navigates to `/properties/[id]` (`AC-01`)
- [ ] Loading/empty/error states are implemented and demo-able (`UI-PUB-03`)
- [ ] Public list contract excludes private review fields by design (`NFR-SEC-02`, `TST-04`)

## Test notes (manual smoke steps)
1. Open `/` and confirm initial result cards render.
2. Enter a matching query and verify filtered list.
3. Enter a non-matching query and verify `No results`.
4. Simulate network error from mock provider and verify retry.
5. Click a card and confirm navigation to `/properties/[id]`.

## Out of scope
- Real Supabase queries
- Auth/session logic
- Real map provider integration
- Admin controls
