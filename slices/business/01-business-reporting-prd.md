# Business Reporting PRD

## Product name
Business Reports and Portfolio Views

## Problem statement
The platform already captures structured renter review data, aggregate property scores, moderation state, and distilled insights. What it does not yet provide is a business-facing reporting layer that helps a development or property company understand what that data means across its portfolio.

Without dedicated reports and views, a company cannot quickly answer questions such as:
- Which properties are improving or declining?
- Which operational dimensions are weakest across the portfolio?
- Where are residents consistently signaling trust or risk issues?
- Which properties need action now because scores are low, review volume is rising, or recent feedback changed materially?

## Product vision
Turn approved review data into a secure portfolio intelligence workspace that helps development-company stakeholders monitor property health, spot recurring issues, prioritize interventions, and track whether changes improve renter sentiment over time.

## Target users
- Asset managers who want a cross-portfolio view of property health
- Development and operations leaders who need to identify weak properties and common issues
- Property managers who want property-level drill-downs and action queues
- Internal admins who support moderation, account access, and customer onboarding

## Primary goals
- Provide clear portfolio-level reporting from approved review data
- Make property-level drill-downs understandable without exposing private raw review text
- Highlight trends, outliers, and risk signals that help teams act
- Support secure access so each company only sees its own properties
- Reuse existing aggregates and insight-generation logic wherever possible

## Non-goals
- Public-facing analytics
- Exposure of private `reviews.text_input` to business users
- Complex predictive modeling in the first release
- Full custom report builders in the first release
- Financial reporting not derived from platform review data

## User needs
As a company stakeholder, I want to:
- see a portfolio summary with average trust score, review volume, and properties at risk
- compare properties against each other and against portfolio averages
- inspect trends for the five review dimensions over time
- understand recurring issues using approved distilled insights and structured issue signals
- know whether a property has too little data to trust conclusions
- filter by city, province, management company, and reporting period

## Proposed product surfaces

### 1. Portfolio Overview
Purpose: give executives and operators a fast summary of overall portfolio health.

Key content:
- total properties in portfolio
- properties with enough review volume for reporting
- average trust score across portfolio
- average score by review dimension
- highest-performing properties
- lowest-performing properties
- properties with largest negative trend over selected period
- properties with newest meaningful feedback activity

### 2. Property Performance View
Purpose: help users understand a single property's current standing and recent movement.

Key content:
- current trust score and review count
- metric-by-metric breakdown
- trend vs previous period
- approved distilled insight summary
- low-sample warning when review count is below reporting threshold
- recent moderation-approved review activity counts

### 3. Portfolio Benchmark View
Purpose: compare properties within the same company portfolio.

Key content:
- sortable table of all portfolio properties
- side-by-side trust and metric scores
- rank and percentile within portfolio
- filters for geography and management company
- minimum review threshold indicator

### 4. Issue Signals View
Purpose: surface the issues that a company is most likely to act on.

Key content:
- repeated weak dimensions, such as fee transparency or maintenance timeliness
- issue tags extracted from approved insights or structured classification
- watchlist of properties with low scores or negative movement
- freshness indicator so users know whether signals are current

### 5. Review Activity and Data Freshness View
Purpose: help users judge data reliability and operational recency.

Key content:
- approved review counts by month
- moderation throughput summary
- properties with stale or sparse data
- last update date for aggregates and insights

## Core product principles
- Approved data only: business-facing reports must use approved reviews and approved insights only.
- Privacy first: private free-text review content stays admin-only.
- Actionable over decorative: every report should help a user compare, prioritize, or decide.
- Explain confidence: reports must show review counts and low-sample warnings.
- Consistent numbers: portfolio and property views must be derived from the same reporting logic.

## Functional scope

### MVP scope
- Portfolio Overview
- Property Performance View
- Portfolio Benchmark View
- Issue Signals View
- basic period filters: last 30 days, 90 days, 12 months, all time
- low-sample labeling
- company-to-property access controls

### Later scope
- downloadable CSV and PDF exports
- scheduled email digests
- custom saved views
- advanced theme clustering from review text
- recommendations or predictive risk scoring

## Success metrics
- At least one stakeholder can identify the bottom 10 percent of properties in under 2 minutes
- At least one stakeholder can compare a property against portfolio averages in under 1 minute
- At least one stakeholder can identify top recurring issue areas without reading raw text
- Fewer support requests asking engineering to manually interpret review data
- Positive stakeholder feedback that the reports are trustworthy and actionable

## Risks and assumptions
- Current schema supports property-level aggregates but not yet company ownership mapping
- Current product has admin/public role structure, so business-company access likely requires new membership modeling
- Distilled insights exist per property, but structured issue tagging may need additional derived logic
- Review counts may be too low for some properties, so confidence labeling is necessary

## Release recommendation
- Phase 1: internal admin-facing reporting that validates the reports and calculations
- Phase 2: secure self-serve company access with organization and portfolio mapping

## Open questions
- Should company users see only owned properties, or also benchmark against anonymous market peers?
- What minimum approved review count is required before a property can be fully ranked?
- Should issue signals come from admin-approved tags, automated classification, or both?
- Do stakeholders want exports in MVP, or is in-app viewing enough for first release?
