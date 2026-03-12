# Business Reporting SRS

## 1. Purpose
This document defines the functional and non-functional requirements for business reporting and portfolio views derived from renter review data. The feature set is intended for internal admins first and then for development-company users with scoped access to their own properties.

## 2. System context
The current platform already provides:
- `reviews` with moderation status and five scored dimensions
- `property_aggregates` derived from approved reviews
- `distilled_insights` derived from approved review text and moderated before public exposure
- admin moderation and audit capabilities

The reporting layer must build on those assets without exposing private review text to business users.

## 3. User classes
- `platform_admin`: full access to reporting across all properties and organizations
- `business_user`: access only to reports for properties mapped to their organization
- `business_manager`: same read access as `business_user`, plus permission to manage report filters, saved views, and exports in later phases

## 4. Definitions
- Approved review: a `reviews` row where `status = 'approved'`
- Approved insight: a `distilled_insights` row where `status = 'approved'`
- Portfolio: the set of properties assigned to one development company or business organization
- Reporting period: the user-selected time window used for trend and comparison calculations
- Low-sample property: a property with approved review volume below the configured reporting threshold

## 5. Functional requirements

### 5.1 Access and authorization
- `FR-001`: The system shall require authentication for all business reporting routes and APIs.
- `FR-002`: The system shall restrict business users to properties mapped to their organization.
- `FR-003`: Platform admins shall be able to view reports across all organizations.
- `FR-004`: Unauthorized users shall receive a denied response and shall not receive report payload data.

### 5.2 Data eligibility rules
- `FR-005`: Business-facing reports shall include only approved reviews.
- `FR-006`: Business-facing insight summaries shall include only approved distilled insights.
- `FR-007`: Raw `reviews.text_input` shall not be returned to business-facing views or APIs.
- `FR-008`: Pending, rejected, and removed reviews shall be excluded from reporting metrics unless explicitly shown in an admin-only operational view.

### 5.3 Portfolio Overview
- `FR-009`: The system shall provide a portfolio overview summarizing property count, approved review count, average trust score, and average dimension scores.
- `FR-010`: The system shall show best-performing and worst-performing properties for the selected reporting period.
- `FR-011`: The system shall identify properties with the largest negative score change compared with the previous equivalent period.
- `FR-012`: The system shall label properties with insufficient review volume as low confidence or low sample.

### 5.4 Property Performance View
- `FR-013`: The system shall provide a property detail report with trust score, review count, and all five review dimensions.
- `FR-014`: The system shall show the selected period and the comparison against the previous equivalent period.
- `FR-015`: The system shall show the latest approved distilled insight when one exists.
- `FR-016`: The system shall display the last refresh time of the reporting data.

### 5.5 Portfolio Benchmark View
- `FR-017`: The system shall provide a sortable property comparison table for the selected portfolio.
- `FR-018`: The system shall support sorting by trust score, review count, and each review dimension.
- `FR-019`: The system shall support filters for city, province, management company, and reporting period.
- `FR-020`: The system shall indicate rank and percentile within the visible comparison set.

### 5.6 Issue Signals View
- `FR-021`: The system shall highlight the lowest-scoring dimensions by property and across the portfolio.
- `FR-022`: The system shall provide recurring issue signals derived from approved insights or structured classifications.
- `FR-023`: The system shall show a watchlist of properties meeting configurable risk thresholds.
- `FR-024`: The system shall show whether issue signals are fresh enough to trust, based on configurable staleness rules.

### 5.7 Review Activity and freshness
- `FR-025`: The system shall provide approved review counts by month for the selected period.
- `FR-026`: The system shall identify properties with no recent approved reviews.
- `FR-027`: The system shall expose last aggregate refresh time and last insight refresh time per property.
- `FR-028`: Admin-only operational reporting may include moderation funnel counts for pending, approved, rejected, and removed review states.

### 5.8 Export and sharing
- `FR-029`: The MVP may omit exports.
- `FR-030`: If exports are enabled later, exported data shall respect the same scoping and privacy rules as in-app views.

## 6. Data requirements
- `DR-001`: Reporting calculations shall use the same five review dimensions already defined in `reviews`.
- `DR-002`: Trust score calculations shall align with the existing aggregate methodology unless an explicit versioned reporting formula replaces it.
- `DR-003`: Reports shall include review count with each scored summary so users can judge confidence.
- `DR-004`: Trend calculations shall compare the selected period to the immediately preceding equivalent period.
- `DR-005`: If review volume is below threshold, the report shall still render but clearly indicate reduced confidence.

## 7. API requirements
- `AR-001`: The system shall expose a portfolio summary endpoint for the authenticated user's visible organization scope.
- `AR-002`: The system shall expose a property performance endpoint for one visible property.
- `AR-003`: The system shall expose a benchmark list endpoint with sorting, filtering, and pagination.
- `AR-004`: The system shall expose an issue signals endpoint for the selected organization scope and period.
- `AR-005`: API responses shall exclude private free-text review content for business-facing roles.

## 8. UI requirements
- `UIR-001`: All report views shall show the active period filter.
- `UIR-002`: All score-based views shall show review count beside score values.
- `UIR-003`: Views shall show empty states when no eligible approved data exists.
- `UIR-004`: Views shall show low-sample warnings when thresholds are not met.
- `UIR-005`: Views shall show loading and error states consistently with the rest of the app.
- `UIR-006`: Trend indicators shall use clear increase, decrease, or unchanged states.

## 9. Security and privacy requirements
- `SPR-001`: Business users shall never receive raw review text from `reviews.text_input`.
- `SPR-002`: Business users shall never receive cross-organization property data.
- `SPR-003`: Admin-only operational views shall remain separate from business-facing report views when they include moderation state or private content.
- `SPR-004`: Audit logs should capture organization membership changes and report export actions when those features are implemented.

## 10. Performance requirements
- `NFR-001`: Report pages should return an initial payload quickly enough for dashboard use under normal portfolio sizes.
- `NFR-002`: Benchmark tables shall support pagination so large portfolios remain responsive.
- `NFR-003`: Trend and summary queries should rely on precomputed or indexed derived data once live data volume makes on-demand queries slow.

## 11. Reliability requirements
- `NFR-004`: Reporting views shall degrade gracefully when insights are missing but score aggregates exist.
- `NFR-005`: Failed refresh jobs or stale derived data shall be detectable through timestamps or admin diagnostics.
- `NFR-006`: Reporting formulas shall be versioned if calculation logic changes in the future.

## 12. Acceptance criteria
- `AC-001`: A business user can sign in and see only organization-scoped properties in the portfolio views.
- `AC-002`: Portfolio Overview shows average trust score, dimension averages, review counts, and a top/bottom property summary.
- `AC-003`: Property Performance View shows current scores, previous-period deltas, review count, and approved insight summary when available.
- `AC-004`: Portfolio Benchmark View allows sorting and filtering without leaking other organizations' properties.
- `AC-005`: Issue Signals View identifies low-scoring dimensions and flags watchlist properties.
- `AC-006`: Low-sample properties are clearly labeled in every applicable report.
- `AC-007`: Business-facing APIs never return private `text_input` content.
- `AC-008`: Empty, loading, and error states are handled across all views.

## 13. Out of scope
- Public-facing analytics pages
- Cross-market benchmarking against external data sources
- Predictive forecasts or recommendations in MVP
- Free-form query builders in MVP
- Exposing moderation notes or admin-only audit detail to company users
