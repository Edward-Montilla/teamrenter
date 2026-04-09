# Software Requirements Specification

| Field | Value |
| --- | --- |
| **Product** | LivedIn — Verified Rental Review Platform |
| **Document** | Software Requirements Specification (SRS) |
| **Version** | 2.0 |
| **Date** | April 2026 |
| **Status** | Expanded scope (Consumer UX + Business Portal) |
| **Supersedes** | SRS v0.1 (2026-03-02) |

**Traceability note:** SRS v0.1 existed as `Software Requirements.pdf` and is not checked into this repository. Section 3 preserves requirement identifiers used in project slice specifications (`FD-*`, `REV-*`, `AGG-*`, `INS-*`, `ADM-*`, `AUTH-*`, `UI-*`, `DATA-*`, `DATA-IC-*`, `NFR-*`, `PHOTO-*`, `AC-*`). Version 2.0 adds `FR-CX-*`, `FR-BP-*`, `DR-V2-*`, `AC-CX-*`, `AC-BP-*`, and extended `NFR-*` identifiers.

---

## 1. Introduction

### 1.1 Purpose

This specification defines functional and non-functional requirements for LivedIn: a two-sided marketplace where renters discover properties, submit structured verified reviews, and view trust signals; landlords monitor portfolio reputation through a Business Portal; and platform administrators moderate content, manage listings, and maintain data integrity.

### 1.2 Scope

#### In scope

- Public property discovery (search, list, detail) and trust score presentation
- Neighbourhood browsing and property comparison (Consumer UX, v2.0)
- Email/password and OAuth authentication; email verification gating for review submission
- Structured review submission with five canonical metrics, anti-abuse rules, and moderation workflow
- Precomputed property aggregates and public rating display
- Distilled (AI-generated) insights with admin approval before public exposure
- Administration: properties CRUD, review and insight moderation, audit logging
- Optional property photos: admin upload, public display for active properties
- Business Portal: portfolio analytics, review feed, responses, benchmarks, team access, company profile, notifications (v2.0)

#### Out of scope

- Residency verification (identity documents, proof of address)
- Payment processing for landlord subscriptions
- Full real-time notification delivery infrastructure (email/push) — preferences and triggers may be specified; transport may be deferred
- Map-first geolocation search as a primary discovery mode
- Standalone Vite + React Router apps as production surfaces
- Seven-category prototype rating model (rejected — see §2.6)

### 1.3 Definitions

| Term | Definition |
| --- | --- |
| **Trust score / TrustScore** | Aggregate signal derived from approved structured reviews (five metrics). |
| **Metric (canonical five)** | `management_responsiveness`, `maintenance_timeliness`, `listing_accuracy`, `fee_transparency`, `lease_clarity`. |
| **Verified user** | Authenticated user with `email_verified = true` (and profile state consistent with review-insert policies). |
| **Approved review** | `reviews` row with `status = 'approved'`; included in aggregates and eligible for insight generation. |
| **Pending review** | `reviews` row with `status = 'pending'`; excluded from public aggregates until approved. |
| **Approved insight** | `distilled_insights` row with `status = 'approved'`; only such rows are exposed on public property pages. |
| **Portfolio** | Set of properties linked to a landlord (or delegated team) via `portfolio_properties` (v2.0). |
| **display_0_5** | Public display mapping aligned to half-star 0–5 scale (see §3.5 and §4.1). |
| **display_*_0_6** | Legacy integer 0–6 display mapping used in early specs and some aggregate column names; superseded for user-facing copy by `display_0_5` where implemented. |

---

## 2. Overall Description

### 2.1 Product perspective

LivedIn is a web application backed by **Supabase (PostgreSQL)** with **Row Level Security (RLS)** enforcing role-based access. The primary application shell is **Next.js (App Router)** with server-side data access patterns appropriate for public, authenticated renter, landlord portal, and admin surfaces.

External services may include object storage (e.g. **Cloudflare R2**) for property photo binaries, with metadata in Postgres.

### 2.2 User classes and characteristics

| Class | Description | Typical capabilities |
| --- | --- | --- |
| **Public (anonymous)** | Unauthenticated visitor | Browse/search properties, read aggregates and approved insights, view photos for active properties; cannot read raw reviews or `text_input`. |
| **Authenticated public** | Signed-in user not yet verified or without review privileges | Same as public for reads; may access account flows; review submission requires verification per policy. |
| **Verified renter** | Authenticated, email-verified user | Submit one review per property (subject to rate limits); read own reviews including private fields; use renter dashboard and shortlist (v2.0). |
| **Landlord** | User with `landlord` role (v2.0) | Access Business Portal scoped to portfolio; team-delegated access per `team_members`; no access to other landlords’ data or raw renter `text_input` in business-facing APIs. |
| **Admin** | Platform administrator | Full property CRUD; moderation of reviews and insights; photo management; audit visibility; approval of landlord review responses where applicable. |

### 2.3 Operating environment

- Modern evergreen browsers; **mobile-first** responsive layouts (see §6).
- Hosted Postgres with RLS enabled; application server compatible with Next.js deployment targets.
- Secure credential handling for storage providers (no raw storage secrets in client bundles).

### 2.4 Design and implementation constraints

- **Single web stack:** Next.js App Router for public, admin, and Business Portal (`/portal/...` or equivalent) unless otherwise documented in the Technical Specification.
- **Single data layer:** Postgres + RLS; privileged operations via server-side/service role where required.
- **Privacy:** Raw review text (`reviews.text_input`) is not exposed on public routes or to landlord-facing report APIs.
- **Anti-abuse:** Enforce at database and application layers (unique review per user per property, rolling review count limits, moderation states).

### 2.5 Assumptions and dependencies

- Email verification provider and auth integration remain available and consistent with `profiles` sync.
- Aggregate recomputation runs on review moderation state changes (triggers or equivalent jobs).
- Distilled insight generation depends on an approved pipeline (service role / background job) and admin moderation.

### 2.6 Decision record: five-metric model canonical; seven-category model rejected

The **five-metric** model (§1.3) is **canonical** for schema, validation, aggregates, and all surfaces (consumer, portal, admin).

The **seven-category** prototype model (`maintenance`, `responsiveness`, `value`, `safety`, `noise`, `moveInOut`, `cleanliness`) is **rejected** because it is incompatible with the existing database schema, validation, aggregate pipeline, and trust semantics; adopting it would require a breaking migration and rework of RLS and public display logic.

### 2.7 Implementation note: public display scale (0–6 integer → 0–5 half-star)

Early requirements and schema documentation described **integer display scores 0–6** (`display_*_0_6`) mapped from stored 0–5 metric averages. During implementation the **user-facing display model evolved** to **0–5 half-star** presentation (`display_0_5`), aligned with stored half-star inputs. APIs and UI SHALL document which fields are internal averages versus display-normalized fields; new work SHOULD prefer the `display_0_5` contract for consumer-facing copy unless backward compatibility requires dual fields.

---

## 3. Specific Requirements

### 3.1 Property discovery and public browse

| ID | Requirement |
| --- | --- |
| **FD-01** | The system shall provide property search/browse that returns **active** properties with safe list fields (e.g. display name, address summary, management company, trust display fields, `review_count`). |
| **FD-02** | The system shall provide a public property detail view for active properties, including aggregates and **approved** distilled insights only; inactive properties shall not appear in public browse. |
| **UI-PUB-01** | The browse experience shall present a search entry point, results list, and clear navigation to property detail. |
| **UI-PUB-02** | The property detail page shall present trust score, per-metric breakdown, review count, and confidence treatment for low sample sizes. |
| **UI-PUB-03** | Browse and detail views shall implement **loading**, **empty**, and **recoverable error** states consistently. |

### 3.2 Authentication and verification

| ID | Requirement |
| --- | --- |
| **AUTH-02** | Review submission and other gated actions shall require an **authenticated** user meeting **email verification** (and role) rules enforced consistently in app and RLS. |
| **NFR-SEC-03** | Verified users shall be permitted to **insert** their own reviews subject to constraints; unverified or anonymous users shall be denied. |

Note: Additional auth flows (sign-in, sign-up, OAuth) are required product capabilities; implement as specified in the Technical Specification and slice 12.

### 3.3 Structured review submission

| ID | Requirement |
| --- | --- |
| **REV-01** | A verified user shall be able to submit **one** review per property (enforced by uniqueness). |
| **REV-02** | New reviews shall be stored as **`pending`** until admin approval; public aggregates SHALL NOT reflect pending reviews. |
| **REV-03** | Reviews shall require all five canonical metrics on a valid scale (stored precision per schema — half-star 0–5). |
| **REV-04** | The system shall reject duplicate reviews (same user + property) and enforce **rate limits** (e.g. maximum reviews per user per rolling window). |
| **REV-05** | The system shall validate **tenancy date order** (`tenancy_start` ≤ `tenancy_end` when both set) and enforce **`text_input` maximum length 500 characters** when provided. |
| **UI-REV-01** | The review UI shall prevent submission when required metrics are missing. |
| **UI-REV-02** | The review UI shall enforce and communicate the **500-character** cap on free-text input. |
| **UI-REV-03** | The review UI shall present **gated** states for signed-out, unverified, already-reviewed, and rate-limited users. |
| **UI-REV-04** | After submission, the user shall receive clear confirmation and next-step guidance. |

### 3.4 Aggregation and public rating

| ID | Requirement |
| --- | --- |
| **AGG-01** | The system shall maintain **`property_aggregates`** (or equivalent) per property, updated when approved review sets change. |
| **AGG-02** | Aggregates shall be derived from **approved** reviews only. |
| **AGG-03** | When `review_count = 0`, public display shall use the defined zero-data presentation (no fabricated scores). |
| **AGG-04** | Aggregate outputs shall include **per-metric** summaries and overall trust signal consistent with the canonical five metrics. |
| **AGG-05** | Display mapping SHALL follow the documented scale (see §2.7; prefer **display_0_5** for new consumer surfaces). |
| **AGG-06** | Admin moderation actions (approve, reject, remove) shall **recompute** aggregates so public pages reflect current approved data. |

### 3.5 Distilled insights

| ID | Requirement |
| --- | --- |
| **INS-01** | The system shall support generation or update of distilled insights when underlying **approved** review text warrants it. |
| **INS-02** | New or updated insights shall enter a moderation state (e.g. **pending**) until admin action. |
| **INS-03** | **Pending** or non-approved insights shall **not** appear on public property pages. |
| **INS-04** | Only **approved** insights shall be readable on public property pages; raw user text remains private on public surfaces. |

### 3.6 Administration

| ID | Requirement |
| --- | --- |
| **ADM-01** | Only admins shall **create, update, and delete** properties and control **active/inactive** status. |
| **ADM-02** | Admins shall moderate **reviews** (approve, reject, remove, etc.) and **distilled insights** (approve, reject, hide, recompute as applicable). |
| **ADM-03** | The system shall record administrative actions in an **audit log** with actor, target, and timestamp. |
| **UI-ADM-01** | Non-admin users shall be blocked from admin routes and actions. |
| **UI-ADM-02** | Admins shall view moderation queues with sufficient context to decide on reviews. |
| **UI-ADM-03** | Admins shall be able to read **`text_input`** for moderation purposes only. |

### 3.7 Property photos

| ID | Requirement |
| --- | --- |
| **PHOTO-01** | Public users shall view property photos only for **active** properties, via safe URLs (signed or proxied); no storage secrets in the client. |
| **PHOTO-02** | Only **admins** shall upload or attach new property photo metadata (and binaries via controlled upload flow). |

### 3.8 Consumer UX (v2.0)

| ID | Requirement |
| --- | --- |
| **FR-CX-01** | **Neighbourhood browsing:** Users shall browse and open **neighbourhood detail** pages showing property counts, average scores, and featured properties (data backed by `neighbourhoods` and related queries). |
| **FR-CX-02** | **Property comparison:** Users shall compare **up to three** properties side by side across **all five** trust metrics (canonical model). |
| **FR-CX-03** | **Multi-step review wizard:** The review flow shall use **multi-step** presentation with **animated step progress** and motion transitions, **without** weakening existing **validation** or **verification gating** (§3.2–3.3). |
| **FR-CX-04** | **Renter dashboard:** Authenticated users shall access a dashboard showing **submitted reviews**, **moderation statuses**, and **shortlisted** properties (backed by `user_shortlists`). |
| **FR-CX-05** | **Trust score badges:** The UI shall present **visual trust score badges** with **category (metric) breakdowns** and **confidence** indicators derived from **review count** (and documented thresholds). |

### 3.9 Business Portal (v2.0)

| ID | Requirement |
| --- | --- |
| **FR-BP-01** | **Portfolio dashboard:** Landlords shall see **property cards** with trust scores, **funnel** metrics, and **trend** indicators scoped to `portfolio_properties`. |
| **FR-BP-02** | **Review feed:** Landlords shall access a **filterable** review feed with **flagging** and **response** actions (responses subject to moderation per `review_response_drafts`). |
| **FR-BP-03** | **Moderation queue:** Landlords shall see a queue of **flagged** reviews limited to their **portfolio** scope. |
| **FR-BP-04** | **Category performance:** The portal shall show **analytics charts** of **per-metric** scores over time (canonical five metrics). |
| **FR-BP-05** | **Benchmark comparison:** The portal shall support **side-by-side** comparison of portfolio properties against **city** and **neighbourhood** averages (see `benchmark_averages`). |
| **FR-BP-06** | **Renter signal tracking:** The portal shall surface **sentiment trends** and **common theme** analysis derived from approved, policy-compliant data — **not** raw `text_input` in landlord-facing APIs. |
| **FR-BP-07** | **Review gap alerts:** The system shall identify properties with **low review counts** and support generation of **tenant invite links** to encourage submissions. |
| **FR-BP-08** | **Team access management:** Landlords shall manage **team members** with **role-based** access: **viewer**, **editor**, **admin** (portal semantics per schema). |
| **FR-BP-09** | **Company profile:** Landlords shall maintain an **editable public-facing** company profile (`company_profiles`). |
| **FR-BP-10** | **Notification preferences:** Each user shall configure **per-user notification settings** (`notification_preferences`) for defined event types (delivery channel implementation may be phased). |

---

## 4. Data Requirements

### 4.1 Core entities and integrity (v0.1 baseline)

| ID | Requirement |
| --- | --- |
| **DATA-01** | Schema shall include **`profiles`** linked to auth users, with role and verification fields supporting **public**, **verified**, **admin**, and **landlord** (v2.0). |
| **DATA-02** | Schema shall include **`properties`** with lifecycle status (**active/inactive**) and administrative provenance fields as specified in migrations. |
| **DATA-03** | Schema shall include **`reviews`** with moderation status, five metric columns, optional `text_input`, tenancy dates, and timestamps. |
| **DATA-04** | Schema shall include **`property_aggregates`** precomputing counts and averages/display fields for fast public reads. |
| **DATA-05** | Schema shall include **`distilled_insights`** with moderation status and generation metadata. |
| **DATA-06** | Schema shall include **`admin_audit_log`** (and related admin request tables as specified). |
| **DATA-IC-01** | **Unique (user_id, property_id)** on reviews. |
| **DATA-IC-02** | **Metric range** integrity: each stored metric SHALL respect defined min/max (0–5 half-star storage per schema). |
| **DATA-IC-03** | **Rate limit:** enforce maximum submitted reviews per user per rolling window in DB or equivalent authoritative layer. |
| **DATA-IC-04** | **Tenancy order:** `tenancy_start` ≤ `tenancy_end` when both non-null. |
| **DATA-IC-05** | **`text_input` length** SHALL NOT exceed **500 characters** when present. |

### 4.2 PRD v2 additional tables

| ID | Table | Purpose |
| --- | --- | --- |
| **DR-V2-01** | **`neighbourhoods`** | Neighbourhood metadata, counts, and average scores for **FR-CX-01** and benchmark scoping (**FR-BP-05**). |
| **DR-V2-02** | **`user_shortlists`** | Per-user saved properties for **FR-CX-04**; unique `(user_id, property_id)`. |
| **DR-V2-03** | **`portfolio_properties`** | Links **landlord** users to managed properties; central scoping pivot for portal queries (**FR-BP-01**–**07**). |
| **DR-V2-04** | **`team_members`** | Delegated portal access with **viewer/editor/admin** roles (**FR-BP-08**). |
| **DR-V2-05** | **`notification_preferences`** | Per-user toggles for alert categories (**FR-BP-10**). |
| **DR-V2-06** | **`review_response_drafts`** | Landlord-authored responses with moderation lifecycle (**FR-BP-02**, **FR-BP-03**). |
| **DR-V2-07** | **`benchmark_averages`** | Precomputed **city** / **neighbourhood** baselines for **FR-BP-05**. |
| **DR-V2-08** | **`company_profiles`** | Public-facing landlord/management company profile (**FR-BP-09**). |

**Altered table (v2.0):** `properties` gains optional **`neighbourhood_id`** (FK → `neighbourhoods`) for neighbourhood browse and benchmark consistency.

Column-level detail SHALL match the **Database Schema Architecture — PRD v2** document and migrations.

### 4.3 Data exposure rules

Public and landlord-facing data contracts SHALL comply with **§5.2** (`NFR-PRIV-01`–`NFR-PRIV-03`).

---

## 5. Non-Functional Requirements

### 5.1 Security

| ID | Requirement |
| --- | --- |
| **NFR-SEC-02** | Anonymous users SHALL NOT **SELECT** from `reviews` in ways that expose private fields; public apps SHALL NOT depend on broad review table reads. |
| **NFR-SEC-03** | Review **insert** SHALL be limited to **verified** authenticated users meeting RLS policy; others SHALL be denied. |
| **NFR-SEC-04** | Admin-only operations SHALL require admin authorization in application and RLS layers. |

### 5.2 Privacy and confidentiality

| ID | Requirement |
| --- | --- |
| **NFR-PRIV-01** | Public readers SHALL NOT receive **`reviews.text_input`** or other non-approved insight text. |
| **NFR-PRIV-02** | Distilled content shown publicly SHALL be limited to **approved** distilled fields. |
| **NFR-PRIV-03** | **`text_input`** SHALL be visible only to **admins** (moderation), **owning reviewers** (where applicable), and **server-side** jobs — not to landlord analytics APIs. |

### 5.3 Performance and scalability

| ID | Requirement |
| --- | --- |
| **NFR-PERF-01** | Public browse and detail pages SHOULD meet agreed **time-to-interactive** targets under expected load; list endpoints SHOULD support pagination or caps. |
| **NFR-PERF-02** | **Portal analytics** (charts, benchmarks, feeds) SHOULD use **precomputed** or **indexed** data (`benchmark_averages`, aggregates, materialized views where needed) and SHALL avoid unbounded client-side fan-out. |
| **NFR-PERF-03** | Define **performance budgets** for Business Portal dashboards (initial load, chart data hydration, filter operations) in the Technical Specification and track in CI or manual audits. |

### 5.4 Reliability and maintainability

- Aggregate and benchmark jobs SHALL be **idempotent** where feasible and **observable** (timestamps, job status).
- Schema or formula changes to trust scoring SHALL be **versioned** or documented in migrations to avoid silent drift between environments.

### 5.5 Accessibility and mobile experience (v2.0)

| ID | Requirement |
| --- | --- |
| **NFR-A11Y-01** | New and updated UI for Consumer UX and Business Portal SHALL target **WCAG 2.1 Level AA** for primary flows (perceivable, operable, understandable). |
| **NFR-MOBILE-01** | Experiences SHALL be **mobile-first**: readable typography, touch targets (minimum **44×44 CSS px** for primary controls), and usable navigation on small viewports. |

---

## 6. Acceptance Criteria

### 6.1 Baseline (v0.1 traceability)

| ID | Criterion |
| --- | --- |
| **AC-01** | User can search/browse and open a property detail page from results. |
| **AC-02** | Property detail shows trust signal, metric breakdown, approved insights only, and appropriate empty states. |
| **AC-03** | Verified user can submit a review; it is stored as **pending**; aggregates update only after approval. |
| **AC-04** | Duplicate review and rate-limit violations return documented errors without corrupting aggregates. |
| **AC-05** | Approved distilled insight appears on property page; pending insight does not. |
| **AC-06** | Admin can create/activate/deactivate properties; only active properties appear in public browse. |

### 6.2 Consumer UX (v2.0)

| ID | Criterion |
| --- | --- |
| **AC-CX-01** | Neighbourhood list and detail pages render counts, averages, and featured properties from authoritative data. |
| **AC-CX-02** | User can select up to **three** properties and see all **five** metrics compared. |
| **AC-CX-03** | Multi-step review wizard preserves validation and auth gating; animations do not skip required steps. |
| **AC-CX-04** | Signed-in user sees dashboard with reviews (and statuses) and shortlist consistent with server state. |
| **AC-CX-05** | Trust badges reflect scores, metric breakdown, and confidence/review-count cues. |

### 6.3 Business Portal (v2.0)

| ID | Criterion |
| --- | --- |
| **AC-BP-01** | Landlord sees portfolio dashboard scoped to linked properties only. |
| **AC-BP-02** | Review feed supports filters; flag and response actions behave per moderation rules. |
| **AC-BP-03** | Flagged reviews appear in portfolio-scoped moderation queue. |
| **AC-BP-04** | Category performance charts show per-metric trends over time. |
| **AC-BP-05** | Benchmark view compares properties to city/neighbourhood baselines without cross-portfolio leakage. |
| **AC-BP-06** | Renter signals show trends/themes without exposing raw `text_input` in portal APIs. |
| **AC-BP-07** | Low-review properties trigger gap alerts; invite links can be generated/copied per spec. |
| **AC-BP-08** | Team roles enforce viewer/editor/admin restrictions. |
| **AC-BP-09** | Company profile edits persist and public-facing fields match policy. |
| **AC-BP-10** | Notification preferences persist per user. |

---

## 7. Open Questions

### 7.1 Resolved (v2.0)

The following items were open in earlier drafts; **decisions** for v2.0 are:

| Topic | Resolution |
| --- | --- |
| Default moderation state for new reviews | **Pending** until admin approval (**REV-02**). |
| Distilled insights publication | **Admin approval required** before public display (**INS-02**, **INS-03**). |
| Photo uploads | **Admin-only** (**PHOTO-02**). |
| Free-text review field cap | **`text_input` limited to 500 characters** (**REV-05**, **DATA-IC-05**). |

### 7.2 Remaining

- Exact **funnel metric** definitions and refresh cadence for **FR-BP-01** (clarify in Technical Specification).
- **Confidence threshold** numeric cutoffs for badges (**FR-CX-05**) and low-sample labels.
- **Invite link** format, expiry, and abuse controls for **FR-BP-07**.
- **Email/push** delivery architecture and SLAs once notification preferences (**FR-BP-10**) connect to real transport.

---

## 8. Related documents

- `proj_docs/PRD - Team Renter.pdf` / `proj_docs/PRD - Team Renter.tex` — product scope and personas (v2.0).
- `proj_docs/DB Schema Architecture - PRDv2.md` — v2 schema evolution and RLS notes.
- `slices/business/02-business-reporting-srs.md` — additional business-reporting requirements (`FR-001`–`FR-030`) that inform portal analytics; **FR-BP-*** identifiers in this SRS are the v2 portal feature IDs.

---
