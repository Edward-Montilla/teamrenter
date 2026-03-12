# Business Reporting Technical Specification

## 1. Overview
This specification describes a practical implementation path for business reporting built on the current TeamRenter data model. The goal is to turn approved review data into organization-scoped portfolio reporting without breaking the platform's privacy model.

The current system already has the core analytical inputs:
- `reviews`
- `property_aggregates`
- `distilled_insights`
- `properties`
- admin moderation and audit flows

The main missing pieces are:
- organization ownership and membership mapping
- organization-scoped reporting queries
- trend-ready derived datasets
- business-facing routes and APIs

## 2. Delivery strategy

### Phase 1
Admin-visible reporting across all properties to validate metrics, report structure, and UX.

### Phase 2
Organization-scoped reporting for development-company users using explicit property-to-organization mapping.

### Phase 3
Performance hardening with snapshot tables, scheduled refreshes, exports, and optional issue classification.

## 3. Existing data reused

### Source tables
- `public.properties`
- `public.reviews`
- `public.property_aggregates`
- `public.distilled_insights`
- `public.admin_audit_log`

### Reporting rules
- Use only `reviews.status = 'approved'` for business score calculations.
- Use only `distilled_insights.status = 'approved'` for business insight summaries.
- Never expose `reviews.text_input` to business-facing APIs or UI.
- Show review counts with all score summaries.

## 4. Proposed schema additions

### 4.1 Organization model
Add explicit ownership mapping so a development company can see only its portfolio.

```sql
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  role text not null check (role in ('viewer', 'manager')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.organization_properties (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (organization_id, property_id)
);
```

### 4.2 Optional issue-signal support
If the team wants more actionable issue reporting than one free-form distilled summary per property, add a structured derived table.

```sql
create table public.property_issue_signals (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  signal_key text not null,
  signal_label text not null,
  signal_group text not null,
  confidence numeric,
  source text not null check (source in ('insight_classifier', 'admin_tag')),
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  created_at timestamptz not null default now()
);
```

This table is optional for MVP. Without it, the first release can surface weak dimensions and the current approved insight text only.

## 5. Derived reporting layer
Start with SQL views for correctness and speed of iteration. Promote to snapshot tables or materialized views only when data volume requires it.

### 5.1 `organization_visible_properties_v1`
Purpose: resolve which properties the current requester can see.

Contents:
- `organization_id`
- `property_id`
- property metadata fields needed for reporting

Implementation notes:
- For admins, visibility can be unrestricted in admin routes.
- For business routes, visibility is constrained through `organization_members` and `organization_properties`.

### 5.2 `property_reporting_period_metrics_v1`
Purpose: aggregate approved review data by property and reporting period.

Suggested columns:
- `property_id`
- `period_start`
- `period_end`
- `approved_review_count`
- `avg_management_responsiveness`
- `avg_maintenance_timeliness`
- `avg_listing_accuracy`
- `avg_fee_transparency`
- `avg_lease_clarity`
- `avg_trustscore`
- `last_approved_review_at`

Notes:
- This view should aggregate directly from `reviews` for period-specific trends.
- The existing `property_aggregates` table can continue to power all-time values and public reads.

### 5.3 `organization_portfolio_summary_v1`
Purpose: provide one-row portfolio KPI summaries per organization and period.

Suggested columns:
- `organization_id`
- `property_count`
- `properties_with_reviews`
- `approved_review_count`
- `portfolio_avg_trustscore`
- `portfolio_avg_management_responsiveness`
- `portfolio_avg_maintenance_timeliness`
- `portfolio_avg_listing_accuracy`
- `portfolio_avg_fee_transparency`
- `portfolio_avg_lease_clarity`
- `at_risk_property_count`

### 5.4 `organization_property_benchmark_v1`
Purpose: provide the benchmark table backing the portfolio comparison view.

Suggested columns:
- `organization_id`
- `property_id`
- `display_name`
- `city`
- `province`
- `management_company`
- `approved_review_count`
- `avg_trustscore`
- all five dimension averages
- `trustscore_rank`
- `trustscore_percentile`
- `is_low_sample`
- `delta_vs_previous_period`

### 5.5 `organization_issue_watchlist_v1`
Purpose: identify properties needing action.

Suggested rules:
- `avg_trustscore` below threshold
- any dimension below threshold
- negative change greater than threshold
- stale data beyond threshold
- optional structured issue signals present

Suggested columns:
- `organization_id`
- `property_id`
- `watch_reason`
- `severity`
- `current_trustscore`
- `delta_vs_previous_period`
- `approved_review_count`
- `last_approved_review_at`

## 6. API design

### 6.1 Routes
- `GET /api/business/reports/overview`
- `GET /api/business/reports/properties`
- `GET /api/business/reports/properties/[id]`
- `GET /api/business/reports/issues`

Admin validation routes may initially live under `/api/admin/reports/*` in Phase 1.

### 6.2 Common query params
- `period=30d|90d|12m|all`
- `city`
- `province`
- `managementCompany`
- `sortBy`
- `sortDir=asc|desc`
- `page`
- `pageSize`

### 6.3 Response shapes

#### Overview
```ts
type BusinessPortfolioOverview = {
  organizationId: string;
  period: "30d" | "90d" | "12m" | "all";
  propertyCount: number;
  propertiesWithReviews: number;
  approvedReviewCount: number;
  portfolioAvgTrustscore: number | null;
  dimensionAverages: {
    managementResponsiveness: number | null;
    maintenanceTimeliness: number | null;
    listingAccuracy: number | null;
    feeTransparency: number | null;
    leaseClarity: number | null;
  };
  topProperties: Array<{
    propertyId: string;
    displayName: string;
    avgTrustscore: number | null;
    approvedReviewCount: number;
  }>;
  watchlistCount: number;
  lastRefreshedAt: string;
};
```

#### Benchmark row
```ts
type BusinessBenchmarkRow = {
  propertyId: string;
  displayName: string;
  city: string;
  province: string;
  managementCompany: string | null;
  approvedReviewCount: number;
  avgTrustscore: number | null;
  avgManagementResponsiveness: number | null;
  avgMaintenanceTimeliness: number | null;
  avgListingAccuracy: number | null;
  avgFeeTransparency: number | null;
  avgLeaseClarity: number | null;
  deltaVsPreviousPeriod: number | null;
  rank: number | null;
  percentile: number | null;
  isLowSample: boolean;
  latestApprovedInsight: string | null;
};
```

#### Property report
```ts
type BusinessPropertyReport = {
  propertyId: string;
  displayName: string;
  location: {
    city: string;
    province: string;
  };
  currentPeriod: {
    approvedReviewCount: number;
    avgTrustscore: number | null;
    dimensions: {
      managementResponsiveness: number | null;
      maintenanceTimeliness: number | null;
      listingAccuracy: number | null;
      feeTransparency: number | null;
      leaseClarity: number | null;
    };
  };
  previousPeriod: {
    approvedReviewCount: number;
    avgTrustscore: number | null;
  } | null;
  deltas: {
    trustscore: number | null;
    managementResponsiveness: number | null;
    maintenanceTimeliness: number | null;
    listingAccuracy: number | null;
    feeTransparency: number | null;
    leaseClarity: number | null;
  };
  lowSample: boolean;
  latestApprovedInsight: {
    text: string;
    generatedAt: string;
  } | null;
  lastApprovedReviewAt: string | null;
  lastRefreshedAt: string;
};
```

## 7. UI surface proposal

### Routes
- `/business`
- `/business/properties`
- `/business/properties/[id]`
- `/business/issues`

### Page responsibilities
- `/business`: portfolio overview cards, top movers, bottom performers, summary charts
- `/business/properties`: benchmark table with filters and sort
- `/business/properties/[id]`: property report with deltas and insight summary
- `/business/issues`: watchlist and repeated weak-dimension signals

### Navigation notes
- Do not expose business routes to public users.
- Keep admin and business workspaces distinct even if they share backend reporting helpers.

## 8. Authorization and RLS

### Access model
- Admins may bypass organization scoping in admin-only reporting routes.
- Business users must pass organization membership checks before any report query executes.

### Recommended database helpers
Add helper functions such as:
- `public.is_organization_member(p_organization_id uuid)`
- `public.can_view_property_report(p_property_id uuid)`

### Policy guidance
- `organization_members`: users can read only their own memberships unless admin
- `organization_properties`: readable only to admins and organization members
- business reporting views should be exposed either through `SECURITY DEFINER` RPCs or carefully policy-protected views

## 9. Calculation rules

### Trust score
- Use the existing trust score formula based on the mean of the five dimension averages.
- Keep one formula version for public and business reporting unless there is a clearly versioned change.

### Previous period comparison
- If user selects `30d`, compare against the 30 days immediately before that window.
- If user selects `90d`, compare against the previous 90 days.
- If user selects `12m`, compare against the previous 12 months.
- For `all`, omit delta comparisons or compare against the prior full-year snapshot only if explicitly defined.

### Low-sample threshold
- Recommended default: fewer than 3 approved reviews in the selected period.
- Render the property, but mark it with `isLowSample = true`.

### Watchlist thresholds
Recommended defaults:
- trust score below `2.5`
- any dimension below `2.5`
- trust score decline greater than `0.5`
- no approved reviews in the last 180 days

These should be configurable later.

## 10. Refresh strategy

### MVP
- Compute period views on demand with indexes on `reviews(property_id, status, created_at)`.
- Reuse `property_aggregates` for all-time and current all-approved summaries.

### Scale-up path
- Add a nightly or event-driven refresh job that writes to snapshot tables such as `organization_property_report_snapshots`.
- Persist `formula_version` and `refreshed_at` on snapshot rows.

## 11. Observability
- Add audit entries when organization memberships or property mappings change.
- Log report endpoint errors and slow queries.
- Expose `lastRefreshedAt` and optional `dataStaleness` indicators in responses.

## 12. Testing strategy

### Unit tests
- formula calculations for averages, deltas, low-sample flags, and watchlist thresholds

### Integration tests
- organization scoping
- correct exclusion of non-approved reviews
- exclusion of private review text
- correct handling of missing insights
- benchmark sorting and filtering

### Manual smoke tests
1. Sign in as admin and verify portfolio reporting loads for seeded properties.
2. Sign in as a business user mapped to one organization and verify only mapped properties appear.
3. Approve a new review and verify affected reports update as expected.
4. Verify a property with fewer than three approved reviews is labeled low sample.
5. Confirm no business-facing payload contains raw `text_input`.

## 13. Risks
- Current schema does not yet model organizations, so self-serve company access cannot be delivered safely without new access-control tables.
- Trend queries may become slow if period calculations are always computed live at scale.
- Insight quality may be uneven if issue signals depend only on one approved distilled summary per property.

## 14. Recommended first implementation slice
Build Phase 1 as an admin-only reporting MVP using current tables plus reporting views. Once report usefulness and formulas are validated, add organization mapping and business-user access as a separate secure slice.
