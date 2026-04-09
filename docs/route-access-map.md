# Route Access Map

This file visualizes the routes currently exposed by the `livedin` web app and
which user types can reach them based on the route files and auth checks in the
codebase.

## User Types

- `Anonymous`: not signed in
- `Signed-in public`: signed in, not admin, email may be unverified
- `Email-verified user`: signed in with `profiles.email_verified = true`
- `Admin`: signed in with `profiles.role = 'admin'`
- `Landlord`: signed in with `profiles.role = 'landlord'`; has access to all public pages plus `/portal/*` routes; portfolio-scoped data access

## Page Routes

```mermaid
flowchart LR
  anon["Anonymous"]
  public["Signed-in public"]
  verified["Email-verified user"]
  admin["Admin"]
  landlord["Landlord"]

  subgraph PublicPages["Public and self-service pages"]
    home["/"]
    signIn["/sign-in"]
    requestAdmin["/signup/request-admin"]
    themes["/themes<br/>redirects to /"]
    property["/properties/[id]"]
    submitReview["/submit-review/[propertyId]<br/>includes /submit-review/new sentinel"]
    dashboard["/dashboard<br/>auth-gated"]
    neighbourhoods["/neighbourhoods"]
    neighbourhoodDetail["/neighbourhoods/[id]"]
    comparison["/comparison"]
  end

  subgraph PortalPages["Portal pages (PRD v2)"]
    portal["/portal"]
    portalReviews["/portal/reviews"]
    portalModeration["/portal/moderation"]
    portalPerformance["/portal/performance"]
    portalBenchmarks["/portal/benchmarks"]
    portalSignals["/portal/signals"]
    portalAlerts["/portal/alerts"]
    portalTeam["/portal/team"]
    portalProfile["/portal/profile"]
    portalSettings["/portal/settings"]
  end

  subgraph AdminPages["Admin pages"]
    adminHome["/admin"]
    adminProps["/admin/properties"]
    adminNewProp["/admin/properties/new"]
    adminEditProp["/admin/properties/[id]/edit"]
    adminPhotos["/admin/properties/[id]/photos"]
    adminUsers["/admin/users"]
    adminReviews["/admin/reviews"]
    adminRequests["/admin/access-requests"]
    adminInsights["/admin/insights"]
    adminAudit["/admin/audit"]
  end

  anon --> home
  anon --> signIn
  anon --> requestAdmin
  anon --> themes
  anon --> property
  anon --> submitReview
  anon --> neighbourhoods
  anon --> neighbourhoodDetail
  anon --> comparison

  public --> home
  public --> signIn
  public --> requestAdmin
  public --> themes
  public --> property
  public --> submitReview
  public --> neighbourhoods
  public --> neighbourhoodDetail
  public --> comparison

  verified --> home
  verified --> signIn
  verified --> requestAdmin
  verified --> themes
  verified --> property
  verified --> submitReview
  verified --> dashboard
  verified --> neighbourhoods
  verified --> neighbourhoodDetail
  verified --> comparison

  admin --> home
  admin --> signIn
  admin --> requestAdmin
  admin --> themes
  admin --> property
  admin --> submitReview
  admin --> dashboard
  admin --> neighbourhoods
  admin --> neighbourhoodDetail
  admin --> comparison
  admin --> portal
  admin --> portalReviews
  admin --> portalModeration
  admin --> portalPerformance
  admin --> portalBenchmarks
  admin --> portalSignals
  admin --> portalAlerts
  admin --> portalTeam
  admin --> portalProfile
  admin --> portalSettings
  admin --> adminHome
  admin --> adminProps
  admin --> adminNewProp
  admin --> adminEditProp
  admin --> adminPhotos
  admin --> adminUsers
  admin --> adminReviews
  admin --> adminRequests
  admin --> adminInsights
  admin --> adminAudit

  landlord --> home
  landlord --> signIn
  landlord --> requestAdmin
  landlord --> themes
  landlord --> property
  landlord --> submitReview
  landlord --> dashboard
  landlord --> neighbourhoods
  landlord --> neighbourhoodDetail
  landlord --> comparison
  landlord --> portal
  landlord --> portalReviews
  landlord --> portalModeration
  landlord --> portalPerformance
  landlord --> portalBenchmarks
  landlord --> portalSignals
  landlord --> portalAlerts
  landlord --> portalTeam
  landlord --> portalProfile
  landlord --> portalSettings
```

### Page Matrix

| Route | Anonymous | Signed-in public | Email-verified user | Admin | Landlord | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | Yes | Yes | Yes | Yes | Yes | Public property search |
| `/sign-in` | Yes | Yes | Yes | Yes | Yes | Existing session may redirect away |
| `/signup/request-admin` | Prompt only | Yes | Yes | Yes | Yes | Non-admin flow; admin sees already-has-access state |
| `/themes` | Yes | Yes | Yes | Yes | Yes | Immediate redirect to `/` |
| `/properties/[id]` | Yes | Yes | Yes | Yes | Yes | Only for active properties |
| `/submit-review/[propertyId]` | Page opens | Page opens | Yes | Yes | Yes | Submit action still requires verified email |
| `/dashboard` | No | No | Yes | Yes | Yes | Auth required |
| `/neighbourhoods` | Yes | Yes | Yes | Yes | Yes | |
| `/neighbourhoods/[id]` | Yes | Yes | Yes | Yes | Yes | |
| `/comparison` | Yes | Yes | Yes | Yes | Yes | |
| `/portal` | No | No | No | Yes | Yes | Landlord or admin |
| `/portal/reviews` | No | No | No | Yes | Yes | Landlord or admin |
| `/portal/moderation` | No | No | No | Yes | Yes | Landlord or admin |
| `/portal/performance` | No | No | No | Yes | Yes | Landlord or admin |
| `/portal/benchmarks` | No | No | No | Yes | Yes | Landlord or admin |
| `/portal/signals` | No | No | No | Yes | Yes | Landlord or admin |
| `/portal/alerts` | No | No | No | Yes | Yes | Landlord or admin |
| `/portal/team` | No | No | No | Yes | Yes | Landlord or admin |
| `/portal/profile` | No | No | No | Yes | Yes | Landlord or admin |
| `/portal/settings` | No | No | No | Yes | Yes | Landlord or admin |
| `/admin` | Guarded UI only | Guarded UI only | Guarded UI only | Yes | Guarded UI only | Admin content protected client-side and by API |
| `/admin/properties` | Guarded UI only | Guarded UI only | Guarded UI only | Yes | Guarded UI only | Admin only |
| `/admin/properties/new` | Guarded UI only | Guarded UI only | Guarded UI only | Yes | Guarded UI only | Admin only |
| `/admin/properties/[id]/edit` | Guarded UI only | Guarded UI only | Guarded UI only | Yes | Guarded UI only | Admin only |
| `/admin/properties/[id]/photos` | Guarded UI only | Guarded UI only | Guarded UI only | Yes | Guarded UI only | Admin only |
| `/admin/users` | Guarded UI only | Guarded UI only | Guarded UI only | Yes | Guarded UI only | Admin only |
| `/admin/reviews` | Guarded UI only | Guarded UI only | Guarded UI only | Yes | Guarded UI only | Admin only |
| `/admin/access-requests` | Guarded UI only | Guarded UI only | Guarded UI only | Yes | Guarded UI only | Admin only |
| `/admin/insights` | Guarded UI only | Guarded UI only | Guarded UI only | Yes | Guarded UI only | Admin only |
| `/admin/audit` | Guarded UI only | Guarded UI only | Guarded UI only | Yes | Guarded UI only | Admin only |

## API Routes

```mermaid
flowchart LR
  anonApi["Anonymous"]
  publicApi["Signed-in public"]
  verifiedApi["Email-verified user"]
  adminApi["Admin"]
  landlordApi["Landlord"]

  subgraph PublicApi["Public and self-service APIs"]
    apiProps["GET /api/properties"]
    apiProp["GET /api/properties/[id]"]
    apiReviews["POST /api/properties/[id]/reviews"]
    apiAdminReqGet["GET /api/admin-access-request"]
    apiAdminReqPost["POST /api/admin-access-request"]
    apiNeighbourhoods["GET /api/neighbourhoods"]
    apiNeighbourhoodDetail["GET /api/neighbourhoods/[id]"]
    apiShortlistPost["POST /api/user/shortlist"]
    apiShortlistGet["GET /api/user/shortlist"]
  end

  subgraph PortalApi["Portal APIs"]
    apiPortalProps["GET /api/portal/properties"]
    apiPortalAnalytics["GET /api/portal/properties/[id]/analytics"]
    apiPortalReviews["GET /api/portal/properties/[id]/reviews"]
    apiPortalBenchmarks["GET /api/portal/benchmarks"]
    apiPortalSignals["GET /api/portal/signals"]
    apiPortalRespond["POST /api/portal/reviews/[id]/respond"]
    apiPortalModeration["GET /api/portal/moderation"]
    apiPortalTeam["GET, POST /api/portal/team"]
    apiPortalTeamMember["PATCH, DELETE /api/portal/team/[id]"]
    apiPortalProfile["GET, PUT /api/portal/company-profile"]
    apiPortalPrefs["GET, PUT /api/portal/notification-preferences"]
  end

  subgraph AdminApi["Admin APIs"]
    apiAdminMe["GET /api/admin/me"]
    apiOverview["GET /api/admin/overview"]
    apiReqList["GET /api/admin/access-requests"]
    apiReqPatch["PATCH /api/admin/access-requests/[id]"]
    apiUsers["GET /api/admin/users"]
    apiUserPatch["PATCH /api/admin/users/[id]"]
    apiReviewsList["GET /api/admin/reviews"]
    apiReviewPatch["PATCH /api/admin/reviews/[id]"]
    apiInsights["GET /api/admin/insights"]
    apiInsightPatch["PATCH /api/admin/insights/[propertyId]"]
    apiAudit["GET /api/admin/audit"]
    apiAdminProps["GET, POST /api/admin/properties"]
    apiAdminProp["GET, PATCH, DELETE /api/admin/properties/[id]"]
    apiPhotos["GET, POST /api/admin/properties/[id]/photos"]
    apiPhotoDelete["DELETE /api/admin/properties/[id]/photos/[photoId]"]
    apiRecompute["POST /api/admin/properties/[id]/insights/recompute"]
  end

  anonApi --> apiProps
  anonApi --> apiProp
  anonApi --> apiNeighbourhoods
  anonApi --> apiNeighbourhoodDetail

  publicApi --> apiProps
  publicApi --> apiProp
  publicApi --> apiNeighbourhoods
  publicApi --> apiNeighbourhoodDetail
  publicApi --> apiShortlistPost
  publicApi --> apiShortlistGet
  publicApi --> apiAdminReqGet
  publicApi --> apiAdminReqPost

  verifiedApi --> apiProps
  verifiedApi --> apiProp
  verifiedApi --> apiNeighbourhoods
  verifiedApi --> apiNeighbourhoodDetail
  verifiedApi --> apiShortlistPost
  verifiedApi --> apiShortlistGet
  verifiedApi --> apiReviews
  verifiedApi --> apiAdminReqGet
  verifiedApi --> apiAdminReqPost

  landlordApi --> apiProps
  landlordApi --> apiProp
  landlordApi --> apiNeighbourhoods
  landlordApi --> apiNeighbourhoodDetail
  landlordApi --> apiShortlistPost
  landlordApi --> apiShortlistGet
  landlordApi --> apiReviews
  landlordApi --> apiAdminReqGet
  landlordApi --> apiAdminReqPost
  landlordApi --> apiPortalProps
  landlordApi --> apiPortalAnalytics
  landlordApi --> apiPortalReviews
  landlordApi --> apiPortalBenchmarks
  landlordApi --> apiPortalSignals
  landlordApi --> apiPortalRespond
  landlordApi --> apiPortalModeration
  landlordApi --> apiPortalTeam
  landlordApi --> apiPortalTeamMember
  landlordApi --> apiPortalProfile
  landlordApi --> apiPortalPrefs

  adminApi --> apiProps
  adminApi --> apiProp
  adminApi --> apiNeighbourhoods
  adminApi --> apiNeighbourhoodDetail
  adminApi --> apiShortlistPost
  adminApi --> apiShortlistGet
  adminApi --> apiReviews
  adminApi --> apiAdminReqGet
  adminApi --> apiAdminMe
  adminApi --> apiOverview
  adminApi --> apiReqList
  adminApi --> apiReqPatch
  adminApi --> apiUsers
  adminApi --> apiUserPatch
  adminApi --> apiReviewsList
  adminApi --> apiReviewPatch
  adminApi --> apiInsights
  adminApi --> apiInsightPatch
  adminApi --> apiAudit
  adminApi --> apiAdminProps
  adminApi --> apiAdminProp
  adminApi --> apiPhotos
  adminApi --> apiPhotoDelete
  adminApi --> apiRecompute
  adminApi --> apiPortalProps
  adminApi --> apiPortalAnalytics
  adminApi --> apiPortalReviews
  adminApi --> apiPortalBenchmarks
  adminApi --> apiPortalSignals
  adminApi --> apiPortalRespond
  adminApi --> apiPortalModeration
  adminApi --> apiPortalTeam
  adminApi --> apiPortalTeamMember
  adminApi --> apiPortalProfile
  adminApi --> apiPortalPrefs
```

### API Matrix

| Route | Anonymous | Signed-in public | Email-verified user | Admin | Landlord | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `GET /api/properties` | Yes | Yes | Yes | Yes | Yes | Public list of active properties |
| `GET /api/properties/[id]` | Yes | Yes | Yes | Yes | Yes | Public detail for active property |
| `POST /api/properties/[id]/reviews` | No | No | Yes | Yes | Yes | Requires valid token and `email_verified = true` |
| `GET /api/admin-access-request` | No | Yes | Yes | Yes | Yes | Requires signed-in account with profile |
| `POST /api/admin-access-request` | No | Eligible only | Eligible only | No | Eligible only | Non-admin only; bootstrap and allowlist rules apply |
| `GET /api/neighbourhoods` | Yes | Yes | Yes | Yes | Yes | |
| `GET /api/neighbourhoods/[id]` | Yes | Yes | Yes | Yes | Yes | |
| `POST /api/user/shortlist` | No | Yes | Yes | Yes | Yes | Authenticated user |
| `GET /api/user/shortlist` | No | Yes | Yes | Yes | Yes | Authenticated user |
| `GET /api/portal/properties` | No | No | No | Yes | Yes | Portfolio-scoped for landlord |
| `GET /api/portal/properties/[id]/analytics` | No | No | No | Yes | Yes | Portfolio-scoped for landlord |
| `GET /api/portal/properties/[id]/reviews` | No | No | No | Yes | Yes | Portfolio-scoped for landlord |
| `GET /api/portal/benchmarks` | No | No | No | Yes | Yes | |
| `GET /api/portal/signals` | No | No | No | Yes | Yes | |
| `POST /api/portal/reviews/[id]/respond` | No | No | No | Yes | Yes | |
| `GET /api/portal/moderation` | No | No | No | Yes | Yes | Response draft moderation queue (landlord-safe) |
| `GET /api/portal/team` | No | No | No | Yes | Yes | List team members |
| `POST /api/portal/team` | No | No | No | Yes | Yes | Landlord only for invites |
| `PATCH /api/portal/team/[id]` | No | No | No | Yes | Yes | Landlord only for role changes |
| `DELETE /api/portal/team/[id]` | No | No | No | Yes | Yes | Landlord only for removals |
| `GET /api/portal/company-profile` | No | No | No | Yes | Yes | |
| `PUT /api/portal/company-profile` | No | No | No | Yes | Yes | Landlord only for updates |
| `GET /api/portal/notification-preferences` | No | No | No | Yes | Yes | |
| `PUT /api/portal/notification-preferences` | No | No | No | Yes | Yes | Landlord only for updates |
| `GET /api/admin/me` | No | No | No | Yes | No | Admin only |
| `GET /api/admin/overview` | No | No | No | Yes | No | Admin only |
| `GET /api/admin/access-requests` | No | No | No | Yes | No | Admin only |
| `PATCH /api/admin/access-requests/[id]` | No | No | No | Yes | No | Admin only |
| `GET /api/admin/users` | No | No | No | Yes | No | Admin only |
| `PATCH /api/admin/users/[id]` | No | No | No | Yes | No | Admin only |
| `GET /api/admin/reviews` | No | No | No | Yes | No | Admin only |
| `PATCH /api/admin/reviews/[id]` | No | No | No | Yes | No | Admin only |
| `GET /api/admin/insights` | No | No | No | Yes | No | Admin only |
| `PATCH /api/admin/insights/[propertyId]` | No | No | No | Yes | No | Admin only |
| `GET /api/admin/audit` | No | No | No | Yes | No | Admin only |
| `GET /api/admin/properties` | No | No | No | Yes | No | Admin only |
| `POST /api/admin/properties` | No | No | No | Yes | No | Admin only |
| `GET /api/admin/properties/[id]` | No | No | No | Yes | No | Admin only |
| `PATCH /api/admin/properties/[id]` | No | No | No | Yes | No | Admin only |
| `DELETE /api/admin/properties/[id]` | No | No | No | Yes | No | Admin only |
| `GET /api/admin/properties/[id]/photos` | No | No | No | Yes | No | Admin only |
| `POST /api/admin/properties/[id]/photos` | No | No | No | Yes | No | Admin only |
| `DELETE /api/admin/properties/[id]/photos/[photoId]` | No | No | No | Yes | No | Admin only |
| `POST /api/admin/properties/[id]/insights/recompute` | No | No | No | Yes | No | Admin only |

## Important Notes

- `/admin/*` does not use server middleware. The page guard is implemented in the
  admin layout, and privileged data is enforced by the `/api/admin/*` handlers.
- `/portal/*` uses a layout guard pattern identical to `/admin/*` but checks for
  `landlord` or `admin` role.
- Portal data is portfolio-scoped: landlords can only see properties linked via
  `portfolio_properties`.
- Team members inherit the landlord's portfolio scope.
- `/submit-review/new` is not its own page file. It is handled by the dynamic
  route `/submit-review/[propertyId]` and treated as a special sentinel value in
  the review flow UI.
- The review submission API checks `profiles.email_verified`, not
  `profiles.role === 'verified'`.
- The admin-request flow includes extra states beyond role alone:
  `eligible`, `pending`, `rejected`, `approved`, and first-admin bootstrap.
