# Slice 06 — Integration: Public Reads Wired to Supabase

## Goal (demo in 1–3 minutes)
Home/search and property detail pages load from Supabase (no mocks); safe public exposure preserved; loading/empty/error states retained.

## User story
As a visitor, I want real data from the database powering browse and detail views.

## Screens (mockups)
- `proj_docs/UI Mockup/Rental Review Platform UI Mockups.png` (Landing/Home)
- `proj_docs/UI Mockup/Rental Review Platform UI Mockups-1.png` (Search Results)
- `proj_docs/UI Mockup/Rental Review Platform UI Mockups-2.png` (Property Detail)

## Frontend tasks
- Replace mock data with server actions or route handlers that call Supabase.
- Preserve loading, empty, and error states from Slices 01–02.
- Keep existing UI components and data contracts unchanged where possible.

## DB tasks
- Ensure minimal seed data exists for demo (active properties, aggregates, optionally approved insights).
- No schema changes in this slice; rely on Slice 04/05.

## Integration tasks
- Implement GET list: query active properties joined with property_aggregates; support query param for search (e.g. address/company ILIKE); return array of PropertyListItem shape.
- Implement GET property detail: fetch property by id (only if active), property_aggregates for that id, distilled_insights only where status = 'approved'; return PropertyDetailPublic shape.
- Ensure no query touches reviews table for these public routes.
- Use Supabase client with anon key (or authenticated without elevated privileges) so RLS enforces visibility.

## Data contracts
- Same as Slices 01–02: PropertyListItem, PropertySearchResponse, PropertyDetailPublic, PropertyAggregatePublic, DistilledInsightPublic. Data now sourced from DB.

## RLS/Constraints notes
- Validate with anon key: public reads must succeed for active properties + aggregates + approved insights only.
- Public must never receive reviews or text_input.

## Acceptance criteria checklist
- [ ] `/` search returns DB-backed results (`FD-01`, `AC-01`, `GET /api/properties` or equivalent)
- [ ] `/properties/[id]` returns DB-backed property + aggregates + approved insights only (`FD-02`, `AC-02`, `GET /api/properties/:id`, `TST-04`, `TST-06`)
- [ ] "No reviews" state when review_count = 0 (`UI-PUB-03`, `TST-05`)
- [ ] Loading and error states still work (`UI-PUB-03`)

## Test notes (manual smoke steps)
- Run app with anon (public) session; load `/` and search; open a property; confirm no private data (no review text, no pending insights). Verify empty state when no results.

## Out of scope
- Auth-required features (review submit, admin).
- Changes to SRS or schema.
