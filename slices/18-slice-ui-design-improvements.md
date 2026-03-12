# Slice 18 — UI Design Improvements: Page Content Labels, Breadcrumbs, and Profile Settings

## Goal (demo in 1–3 minutes)

Every page communicates where the user is and what it contains before they scroll: breadcrumbs give a persistent location trail on nested routes, page-level headings clearly label what each screen does, and users can open a dedicated profile settings page to manage their account details and preferences.

## User story

As a signed-in renter or admin, I want to always know where I am in the app, understand what each page contains at a glance, and have a single place to manage my profile and account preferences without hunting through menus or guessing.

## What this slice covers

This is a frontend slice. It does not change business logic, the moderation model, or any public-facing data. Changes are:

1. **Page content labels** — each page has a clear, consistent heading and subtitle that describe what it contains.
2. **Breadcrumbs** — a breadcrumb trail appears on all nested routes so the user always knows their location and can step back.
3. **Profile settings page** — a dedicated `/settings/profile` page where signed-in users can view and update their display name, avatar preference, and notification preferences.

---

## Screens in scope

| Route | Breadcrumb trail | Page heading |
|---|---|---|
| `/` | *(root, no breadcrumb)* | Browse Properties |
| `/properties/[id]` | Home › Properties | Property Detail |
| `/submit-review/[propertyId]` | Home › Properties › [property name] | Submit a Review |
| `/sign-in` | Home › Sign In | Sign In |
| `/signup/request-admin` | Home › Sign In › Request Admin Access | Request Admin Access |
| `/settings/profile` | Home › Settings › Profile | Profile Settings |
| `/admin` | Home › Admin | Admin Command Center |
| `/admin/properties` | Home › Admin › Properties | Manage Properties |
| `/admin/reviews` | Home › Admin › Reviews | Moderate Reviews |
| `/admin/insights` | Home › Admin › Insights | Moderate Insights |

---

## Screen-by-screen details

### 1. Page content labels (all pages)

**Current state:** Some pages have implicit titles baked into hero sections or card headers. There is no consistent `<h1>` pattern or subtitle pattern across pages.

**Target state:**
- Every page has exactly one `<h1>` that clearly names what the page does.
- Every page has an optional subtitle/description `<p>` that explains the purpose in plain language for new users.
- Admin pages include a badge or tag indicating the admin-only context.
- The page `<title>` tag (document title in the browser tab) matches the `<h1>` using a consistent `Page Name — Livedin` pattern.

**Implementation direction:**
- Add a `PageHeader` component that accepts `title`, `subtitle`, and optional `badge` props.
- Use `PageHeader` at the top of every page layout below the site header.
- Ensure `<title>` is set per-page using Next.js `metadata` or `<Head>`.

### 2. Breadcrumbs (nested routes)

**Current state:** No breadcrumbs exist. Users on deep routes like `/submit-review/[propertyId]` or `/admin/reviews` have no visual trail showing how they got there or how to step back.

**Target state:**
- A `Breadcrumbs` component renders a horizontal trail on all non-root routes.
- Each crumb is a clickable link except the last (current page), which is plain text.
- The trail uses the semantic `<nav aria-label="Breadcrumb">` and `<ol>` structure for accessibility.
- On mobile, long trails are truncated to show only the immediate parent and current page, with an ellipsis for deeper paths.
- Breadcrumbs sit between the site header and the page `<h1>`, with low visual weight so they do not compete with the primary content.

**Implementation direction:**
- Create a `Breadcrumbs` component in `livedin/components/ui/Breadcrumbs.tsx`.
- Accept a `crumbs: { label: string; href?: string }[]` prop array.
- Define static breadcrumb configs in each page's layout or route component.
- For dynamic segments (e.g. property name in `/properties/[id]`), pass the resolved name as the crumb label once the data loads; show a short skeleton placeholder while loading.
- Style using existing semantic theme tokens for muted text, separator color, and hover state.

**Breadcrumb rules:**
- Root (`/`) never shows a breadcrumb.
- Single-level routes (e.g. `/sign-in`) show a single `Home ›` prefix to signal they are one level deep.
- Admin routes always prefix with `Home › Admin`.
- The current-page crumb is never a link (it is `aria-current="page"`).

### 3. Profile settings page (`/settings/profile`)

**Current state:** There is no profile settings page. Users have no in-app way to update their display name, avatar, or notification preferences.

**Target state:**
- A `/settings/profile` route is accessible to any signed-in user.
- The page is blocked from unauthenticated users with a redirect to `/sign-in`.
- The page contains three sections:

  **Account info (read-only display)**
  - Email address (from Supabase Auth — read-only, with a note explaining it cannot be changed here)
  - Account role badge (`Renter`, `Admin`)
  - Member since date

  **Display name**
  - Editable text field bound to `profiles.display_name`
  - Save button with optimistic feedback (loading, success, error states)
  - Validation: 2–60 characters, no leading/trailing whitespace

  **Theme preference**
  - Embed the existing `ThemeSettingsPanel` component here so users have a single settings location for visual preferences
  - Remove any duplication if `ThemeSettingsPanel` is currently surfaced elsewhere in a floating or disconnected panel

- A `Settings` or avatar link in the signed-in header routes to `/settings/profile`.
- Breadcrumb: `Home › Settings › Profile`
- Page heading: `Profile Settings`

**Integration notes:**
- Read `profiles.display_name`, `profiles.role`, and `created_at` from the existing `profiles` table via a server component or client-side Supabase query.
- Update `profiles.display_name` via the existing `profiles` RLS policy (users can update their own row).
- No new backend endpoints are required for the display-name update; use the Supabase client directly.
- The `ThemeSettingsPanel` integration reuses existing theme sync infrastructure.

---

## Shared component additions

| Component | Path | Purpose |
|---|---|---|
| `PageHeader` | `livedin/components/ui/PageHeader.tsx` | Consistent `<h1>` + subtitle + optional badge |
| `Breadcrumbs` | `livedin/components/ui/Breadcrumbs.tsx` | Accessible breadcrumb trail |
| Profile settings page | `livedin/app/settings/profile/page.tsx` | Dedicated profile and preferences screen |
| Settings layout | `livedin/app/settings/layout.tsx` | Auth guard + shared settings shell |

---

## RLS / constraints notes

- Display name update uses the existing `profiles` RLS policy allowing users to update their own row.
- No new tables, columns, or policies are required for this slice.
- If `profiles.display_name` is not yet a column, add a migration to add it as `text null` on `public.profiles`.

---

## Acceptance criteria checklist

- [ ] Every page has a visible `<h1>` that clearly names the page.
- [ ] Every page has a matching browser `<title>` in `Page Name — Livedin` format.
- [ ] Breadcrumbs appear on all non-root routes between the header and the page heading.
- [ ] Each breadcrumb crumb (except the last) is a clickable link.
- [ ] The current-page crumb is plain text with `aria-current="page"`.
- [ ] On mobile, long breadcrumb trails are truncated to immediate parent + current page.
- [ ] `/settings/profile` is accessible to signed-in users only.
- [ ] Profile page shows email (read-only), role badge, and member-since date.
- [ ] Users can update their display name with clear save/success/error feedback.
- [ ] `ThemeSettingsPanel` is embedded on the profile settings page.
- [ ] A settings entry point (link or avatar menu) in the signed-in header opens `/settings/profile`.
- [ ] Non-signed-in users visiting `/settings/profile` are redirected to `/sign-in`.

---

## Test notes (manual smoke steps)

- Open each route listed in the screens table and verify the `<h1>` and `<title>` match the expected labels.
- Navigate to `/properties/[id]` and verify `Home › Properties › [name]` breadcrumb renders with the loaded property name.
- Click the `Home` crumb and verify it navigates to `/`.
- Sign in and open the settings entry point in the header; verify it routes to `/settings/profile`.
- On `/settings/profile`, verify email is read-only and role badge is correct.
- Update the display name, save, and verify the success state appears and the name persists on refresh.
- Sign out and visit `/settings/profile` directly; verify redirect to `/sign-in`.

---

## Out of scope

- Password change or email change (requires Supabase Auth email flow — separate slice).
- Avatar image upload (deferred to a photo slice).
- Notification delivery (email/push) infrastructure.
- A full settings section with multiple sub-pages beyond profile.
- Admin-specific settings (those belong in the admin command center).
