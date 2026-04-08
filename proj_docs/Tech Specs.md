# Team Renter — Technical Specification

| Field | Value |
| --- | --- |
| **Version** | 2.0 |
| **Date** | April 2026 |
| **Supersedes** | Tech Spec v0.1 (2026-03-02, PDF) |
| **Related** | [PRD v2](PRD%20-%20Team%20Renter.pdf), [Database Schema Architecture — PRD v2](DB%20Schema%20Architecture%20-%20PRDv2.md) |

This document carries forward the **substance** of **Tech Spec v0.1** (2026-03-02 PDF) and extends it for **PRD v2**. The v0.1 PDF is not stored in this repository; requirement and acceptance IDs below (`TS-R-*`, `TS-AT-*`) are **aligned to each v0.1 section and checklist item** so they stay stable in git. If the PDF used different labels, add a short crosswalk table under Document history. **v2-only** items use `TS-R-v2-*` and `TS-AT-v2-*`.

---

## 0. Framework Decision Record (v2.0)

| ID | Decision | Rationale |
| --- | --- | --- |
| **TS-R-v2-FDR-01** | **Next.js App Router** is the **single** application framework for all user-facing surfaces (public site, renter dashboard, Business Portal, admin). | One routing model, one data-fetching story (RSC + Route Handlers), aligned deployment and auth middleware patterns. |
| **TS-R-v2-FDR-02** | **Vite + React Router** prototypes (e.g. under `New FE/Facelift`, `New FE/Business Portal`) are **design references only** — not production runtimes. | Prototypes inform UI and IA; production code lives in the Next.js app. |
| **TS-R-v2-FDR-03** | **Recharts** is an approved dependency for **Business Portal** analytics charts (category performance, funnels, trends). | Matches portal mockups; keep bundle scoped to portal routes where practical. |

---

## 1. System Overview

### 1.1 High-level architecture

| ID | Requirement |
| --- | --- |
| **TS-R-SYS-01** | The system is a **web application** backed by **Supabase** (Postgres + Auth + Storage/R2 integration) and **server-side** API routes for privileged operations. |
| **TS-R-SYS-02** | **Public reads** of listings, aggregates, and approved content may be served with appropriate caching; **writes** (reviews, admin actions, portal mutations) go through authenticated paths with RLS enforcement in the database. |
| **TS-R-SYS-03** | **Runtime responsibilities:** Next.js handles UI, session-aware server logic, and HTTP APIs; Postgres holds authoritative data; RLS enforces row-level access; background or trigger-driven jobs refresh aggregates and insights where specified. |
| **TS-R-v2-SYS-01** | **Data layer principle:** **Supabase Postgres + RLS is the single data layer.** The **Business Portal** (and other privileged surfaces) **must not** use direct client-side Supabase queries for tenant-scoped data; use **server Route Handlers** (or Server Actions) that run with service role or user JWT as designed, so secrets and policy boundaries stay on the server. |

### 1.2 Route groups (App Router)

Portal and admin are isolated **route groups** with dedicated layouts and guards.

| Route group | Path prefix | Auth | Role / notes |
| --- | --- | --- | --- |
| **Public** | `/` | None required for browsing | Verified identity required **to submit reviews** (see §5). |
| **Dashboard** | `/dashboard` | Authenticated renter | Renter-scoped data (e.g. own reviews, shortlist). |
| **Portal** | `/portal/*` | Authenticated | **Landlord** or **admin** (admin may use portal APIs for support). |
| **Admin** | `/admin/*` | Authenticated | **Admin** only. |
| **Auth** | `/sign-in`, `/sign-up` | None | Sign-in/up flows. |

| ID | Requirement |
| --- | --- |
| **TS-R-v2-RG-01** | Business Portal uses **`app/portal/layout.tsx`** as its **own layout** (navigation shell, theme, shared portal chrome). |
| **TS-R-v2-RG-02** | Portal pages are **auth-guarded** using a **`getLandlordFromRequest`** helper, **parallel** in responsibility to existing **`getAdminFromRequest`** (resolve session, load profile, confirm `landlord` or elevated access as specified). |
| **TS-R-v2-RG-03** | Portal client code uses a **`portalFetch`** helper **parallel** to **`adminFetch`** (consistent base URL, credentials, error handling). |

---

## 2. Data Model

### 2.1 Core tables (v0.1 — retained)

| Table | Purpose | IDs |
| --- | --- | --- |
| `profiles` | User accounts linked to auth; role and verification state. | **TS-R-DM-01** |
| `properties` | Rental property records. | **TS-R-DM-02** |
| `property_photos` | Photo metadata (e.g. R2 keys). | **TS-R-DM-03** |
| `reviews` | Structured multi-metric reviews + moderation status. | **TS-R-DM-04** |
| `property_aggregates` | Precomputed per-property averages and display fields. | **TS-R-DM-05** |
| `distilled_insights` | AI-generated property insights + moderation/screening. | **TS-R-DM-06** |
| `admin_audit_log` | Admin action audit trail. | **TS-R-DM-07** |

### 2.2 Additional baseline tables (present in live schema; reference v0.1 implementations)

| Table | Purpose |
| --- | --- |
| `admin_role_requests` | Self-service admin promotion requests. |
| `admin_bootstrap_allowlist` | Bootstrap admin email allowlist. |

### 2.3 PRD v2 tables (brief — full columns, constraints, and ERD in Schema doc)

| Table | Purpose | ID |
| --- | --- | --- |
| `neighbourhoods` | City/neighbourhood browse and benchmark scope. | **TS-R-v2-DM-01** |
| `user_shortlists` | Renter shortlist (user ↔ property). | **TS-R-v2-DM-02** |
| `portfolio_properties` | **Pivot:** landlord (owner) ↔ property; **all portal property access is scoped through this table**. | **TS-R-v2-DM-03** |
| `team_members` | Delegated portal access; members inherit portfolio via **`owner_user_id`**. | **TS-R-v2-DM-04** |
| `notification_preferences` | Per-user notification toggles for portal workflows. | **TS-R-v2-DM-05** |
| `review_response_drafts` | Landlord draft responses; admin approve/reject before public display. | **TS-R-v2-DM-06** |
| `benchmark_averages` | Precomputed city/neighbourhood metric baselines. | **TS-R-v2-DM-07** |
| `company_profiles` | Public-facing landlord/company profile. | **TS-R-v2-DM-08** |

**Schema alterations (v2):** `profiles` adds **`landlord`** to the role enum/constraint; `properties` adds optional **`neighbourhood_id`** FK. See [Database Schema Architecture — PRD v2](DB%20Schema%20Architecture%20-%20PRDv2.md).

### 2.4 Portfolio scoping principle

| ID | Requirement |
| --- | --- |
| **TS-R-v2-PF-01** | Landlords **access properties only** through **`portfolio_properties`** (and effective membership via **`team_members`** to an **`owner_user_id`** who owns the portfolio link). |
| **TS-R-v2-PF-02** | Team members **inherit** the same property scope as their **`owner_user_id`**’s portfolio rows; policies and APIs must not expose properties outside that scope. |

---

## 3. Derived Values

| ID | Requirement |
| --- | --- |
| **TS-R-DV-01** | **TrustScore** is derived from the configured combination of the five category scores (typically mean of dimension averages for approved reviews); exact formula version should be recorded in code or migration comments when changed. |
| **TS-R-DV-02** | **Public display mapping (v0.1):** the original spec described a **0–6** public rating mapping for some surfaces. |
| **TS-R-DV-v2-01** | **Implementation note (v2):** the **display score model** in **`property_aggregates`** evolved to **0–5 half-star** integer columns (**`display_*_0_5`**, including **`display_trustscore_0_5`**). New UI must use **`display_0_5`** for stars/badges unless a deliberate product change reintroduces 0–6. |
| **TS-R-DV-03** | Aggregates and display fields must stay **consistent** with approved-review-only business rules (see §5–§6). |

---

## 4. Security Model (RLS and roles)

### 4.1 Roles

| Role | Summary |
| --- | --- |
| `public` | Unverified or default; limited writes. |
| `verified` | Email verified; may submit reviews per business rules. |
| `admin` | Full admin surface; audit obligations. |
| `landlord` | **(v2)** Business Portal access; portfolio-scoped reads/writes per policies. |

| ID | Requirement |
| --- | --- |
| **TS-R-SEC-01** | **RLS** is enabled on tenant tables; **no** bypass from client code for scoped data. |
| **TS-R-SEC-02** | Policies exist for **public**, **verified**, and **admin** as in v0.1 (read/write matrices per table). |
| **TS-R-v2-SEC-01** | **`landlord`** (and team-derived access) receives **portfolio-scoped** policies on portal-relevant tables (`portfolio_properties`, `reviews` for owned properties, `review_response_drafts`, etc.) per [Schema — PRD v2](DB%20Schema%20Architecture%20-%20PRDv2.md). |
| **TS-R-v2-SEC-02** | **`neighbourhoods`**, **`benchmark_averages`** (select), and **`company_profiles`** (select) support **public** discovery where product requires it; mutations remain admin or owner as defined. |

### 4.2 SQL helper functions (v2)

| Function | Purpose | ID |
| --- | --- | --- |
| `is_landlord()` | True when `auth.uid()`’s profile role is **`landlord`**. | **TS-R-v2-HF-01** |
| `is_portfolio_member(property_uuid)` | True when caller may act on the property via **own** `portfolio_properties` row or **team** inheritance from **`team_members.owner_user_id`**. | **TS-R-v2-HF-02** |

---

## 5. Business Rule Enforcement

| ID | Rule |
| --- | --- |
| **TS-R-BR-01** | **One review per property** per user (unique constraint or equivalent enforcement). |
| **TS-R-BR-02** | **Rate limit:** at most **3** reviews per user per **rolling 6 months** (enforce in API + DB constraint/trigger as implemented). |
| **TS-R-BR-03** | **Email verification gate:** only **verified** profiles may submit reviews. |
| **TS-R-BR-04** | Review text and scores validated server-side (length, numeric ranges, required fields). |

---

## 6. Aggregation and Refresh

| ID | Requirement |
| --- | --- |
| **TS-R-AR-01** | **Property aggregates** update when review status or scores change (trigger or deferred job — implementation-specific but must be **eventually consistent** within defined SLO). |
| **TS-R-AR-02** | A documented **SQL function or job** recomputes `property_aggregates` from **approved** reviews (and excludes rejected/pending per rules). |
| **TS-R-AR-03** | **Confidence / low-sample** behaviour: UI and APIs expose when counts are insufficient (threshold configurable; align with product). |
| **TS-R-v2-AR-01** | **Neighbourhood** and **benchmark** aggregates may be refreshed via **`recompute_neighbourhood_aggregates`**, **`recompute_benchmark_averages`** (see Schema doc) on a schedule or after significant data changes. |

---

## 7. Distilled Insights Pipeline

| ID | Requirement |
| --- | --- |
| **TS-R-DI-01** | **Inputs:** approved (or eligible) review content and metadata per property; pipeline must respect **privacy** (no leakage of rejected/private fields to public). |
| **TS-R-DI-02** | **Processing:** generate `distilled_insights.insights_text` with versioned prompt/model as configured. |
| **TS-R-DI-03** | **Output contract:** row keyed by `property_id`, status workflow (`pending` → `approved` / `rejected` / `hidden`), timestamps. |
| **TS-R-DI-04** | **Screening gate:** `screened` / `screening_flags` must be set before **public** display; blocked content is not shown publicly. |

---

## 8. API / Endpoint Specification

### 8.1 v0.1 surface areas (conceptual)

| Area | Examples | ID |
| --- | --- | --- |
| Public | Property search/detail, public aggregates | **TS-R-API-PUB-01** |
| Review | Submit, validate, rate limits | **TS-R-API-REV-01** |
| Admin | Moderation, properties CRUD, audit | **TS-R-API-ADM-01** |
| Photos | Upload/init, metadata | **TS-R-API-PHO-01** |

### 8.2 Portal APIs (v2) — Next.js Route Handlers

All **`/api/portal/*`** routes require **authenticated** landlord (or admin where explicitly allowed); enforce **`getLandlordFromRequest`** + **`is_portfolio_member`** / RLS.

| Method | Path | Purpose | ID |
| --- | --- | --- | --- |
| GET | `/api/portal/properties` | Landlord’s **portfolio** property list. | **TS-R-v2-API-P01** |
| GET | `/api/portal/properties/[id]/analytics` | **Funnel** metrics + **category performance** for one property. | **TS-R-v2-API-P02** |
| GET | `/api/portal/properties/[id]/reviews` | Reviews for a property (**landlord view**; no extra PII beyond policy). | **TS-R-v2-API-P03** |
| GET | `/api/portal/benchmarks` | City / neighbourhood **averages** (from `benchmark_averages` or server-side join). | **TS-R-v2-API-P04** |
| GET | `/api/portal/signals` | **Renter sentiment** / trend signals for scoped portfolio. | **TS-R-v2-API-P05** |
| POST | `/api/portal/reviews/[id]/respond` | Create/update **draft** response to a review (moderation flow). | **TS-R-v2-API-P06** |

### 8.3 Consumer APIs (v2)

| Method | Path | Purpose | ID |
| --- | --- | --- | --- |
| GET | `/api/neighbourhoods` | Public **neighbourhood list**. | **TS-R-v2-API-C01** |
| GET | `/api/neighbourhoods/[id]` | **Neighbourhood detail** with properties (or paged subset). | **TS-R-v2-API-C02** |
| POST | `/api/user/shortlist` | **Add/remove** shortlisted property (body specifies action). | **TS-R-v2-API-C03** |
| GET | `/api/user/shortlist` | Current user’s **shortlist**. | **TS-R-v2-API-C04** |

### 8.4 General API rules

| ID | Requirement |
| --- | --- |
| **TS-R-API-01** | JSON request/response shapes are **versioned** implicitly by deployment; breaking changes require migration notes. |
| **TS-R-API-02** | Errors use consistent HTTP status codes and **safe** error bodies (no stack traces in production). |

---

## 9. Frontend Technical Notes

| ID | Requirement |
| --- | --- |
| **TS-R-FE-01** | **Pages** map to route groups in §1.2; shared components use design tokens. |
| **TS-R-FE-02** | **Validation:** client UX validation mirrors server rules; server remains authoritative. |
| **TS-R-FE-03** | **Admin** and **portal** surfaces use **distinct** layouts; do not mix admin chrome into public routes. |
| **TS-R-v2-FE-01** | **Portal analytics** pages may use **Recharts** (see **TS-R-v2-FDR-03**). |
| **TS-R-v2-FE-02** | Trust/category display uses **`display_0_5`** half-star model (**TS-R-DV-v2-01**). |

---

## 10. Observability and Operations

| ID | Requirement |
| --- | --- |
| **TS-R-OPS-01** | **Logging:** structured logs for API errors, moderation actions, and insight generation failures. |
| **TS-R-OPS-02** | **Failure modes:** document behaviour when aggregates or insights are stale or unavailable (degraded UI, not silent wrong numbers). |
| **TS-R-OPS-03** | **Rate limiting** on auth and write-heavy endpoints (reviews, uploads, portal writes). |
| **TS-R-v2-OPS-01** | Portal and shortlist endpoints participate in the same **rate-limit** and **audit** strategy as other authenticated APIs. |

---

## 11. Acceptance Test Checklist

### 11.1 v0.1 (retained)

| ID | Test |
| --- | --- |
| **TS-AT-01** | Public user can browse properties and see **approved** aggregates and **`display_0_5`**-consistent UI. |
| **TS-AT-02** | Verified user can submit **one** review per property; second submission blocked. |
| **TS-AT-03** | Fourth review within **6 months** blocked by **TS-R-BR-02**. |
| **TS-AT-04** | Unverified user **cannot** submit a review (**TS-R-BR-03**). |
| **TS-AT-05** | RLS: user A cannot read or mutate user B’s private data. |
| **TS-AT-06** | Admin can moderate reviews and insights; actions appear in **`admin_audit_log`** where applicable. |
| **TS-AT-07** | **Property aggregates** update after approval workflow (within expected delay). |
| **TS-AT-08** | **Distilled insight** not public until **screening** and **approval** rules satisfied. |
| **TS-AT-09** | Photo upload flow respects auth and property association. |
| **TS-AT-10** | APIs return appropriate **401/403** for unauthorized access. |

### 11.2 v2.0 additions

| ID | Test |
| --- | --- |
| **TS-AT-v2-01** | **`/portal/*`** is wrapped in **`app/portal/layout.tsx`** and rejects unauthenticated users. |
| **TS-AT-v2-02** | **`getLandlordFromRequest`** correctly allows **landlord** and denies **verified-only** renters from portal APIs. |
| **TS-AT-v2-03** | **`portalFetch`** sends credentials and handles errors consistently with **`adminFetch`** patterns. |
| **TS-AT-v2-04** | Landlord sees **only** properties linked in **`portfolio_properties`** (or team inheritance). |
| **TS-AT-v2-05** | **`GET /api/neighbourhoods`** and **`GET /api/neighbourhoods/[id]`** work without auth for public data. |
| **TS-AT-v2-06** | Shortlist **POST/GET** require auth; users cannot read or modify other users’ shortlists. |
| **TS-AT-v2-07** | Portal analytics and benchmarks render using **Recharts** without loading forbidden client Supabase keys for scoped data (**TS-R-v2-SYS-01**). |
| **TS-AT-v2-08** | **`is_landlord()`** and **`is_portfolio_member()`** match API results for edge cases (non-member, wrong property). |

---

## 12. Traceability (PRD v2)

| PRD ID | Tech spec references |
| --- | --- |
| FR-CX-01 | **TS-R-v2-API-C01**, **TS-R-v2-API-C02**, **TS-R-v2-DM-01** |
| FR-CX-04 | **TS-R-v2-API-C03**, **TS-R-v2-API-C04**, **TS-R-v2-DM-02** |
| FR-BP-01–07 | **TS-R-v2-DM-03**, **TS-R-v2-API-P01**–**P06**, **TS-R-v2-PF-01** |
| FR-BP-08 | **TS-R-v2-DM-04**, **TS-R-v2-HF-02** |
| FR-BP-09 | **TS-R-v2-DM-08** |
| FR-BP-10 | **TS-R-v2-DM-05** |

---

## Document history

| Version | Date | Notes |
| --- | --- | --- |
| 0.1 | 2026-03-02 | Original PDF (sections §1–§11). |
| 2.0 | April 2026 | Markdown consolidation; FDR; portal route group; landlord role; new tables/APIs; **`display_0_5`**; data-layer principle; portfolio scoping; Recharts; extended acceptance tests. |
