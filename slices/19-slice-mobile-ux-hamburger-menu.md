# Slice 19 — Mobile UX: Hamburger Menu and Mobile Navigation

## Goal (demo in 1–3 minutes)

The app is fully navigable on small screens without horizontal scrolling, overflowing navbars, or tapping tiny targets. A hamburger menu replaces the desktop header link row on mobile and gives every signed-in or signed-out user an accessible, thumb-friendly way to reach any primary route.

## User story

As a user on a phone, I want a clean navigation experience where I can tap a menu button, see all the key destinations clearly, and jump between them without the header breaking layout or crowding my screen.

## What this slice covers

This is a frontend-only slice. No business logic, auth model, database schema, or API routes change. Changes are:

1. **Hamburger menu** — on mobile viewports the top header link row collapses into a hamburger button that opens a full-screen or slide-in drawer with all navigation links.
2. **Mobile nav drawer** — a slide-in or bottom-anchored navigation panel with large touch targets, clear sign-in/out state, and role-aware links (admin vs. renter).
3. **Header responsiveness** — the public site header and any admin header are made fully responsive so they do not overflow or wrap awkwardly at any viewport width.
4. **Touch-target audit** — buttons, links, and interactive elements across key mobile flows are verified to meet a minimum 44 × 44 px touch target size.

---

## Breakpoint strategy

| Breakpoint | Behavior |
|---|---|
| `< 768px` (mobile) | Hamburger button visible; header links hidden; drawer available |
| `768px – 1024px` (tablet) | Hamburger button visible; header links hidden; drawer available |
| `> 1024px` (desktop) | Hamburger hidden; header links visible inline |

The threshold aligns with the Tailwind `md` breakpoint (`768px`) already used in the project.

---

## Component: `MobileNavDrawer`

**Location:** `livedin/components/nav/MobileNavDrawer.tsx`

**Behavior:**
- Triggered by a `HamburgerButton` in the site header.
- Opens as a slide-in panel from the left (or full-screen overlay on very small devices).
- Contains:
  - App logo / wordmark at the top of the drawer.
  - Primary navigation links (same links as the desktop header).
  - Signed-in state: user display name, role badge, links to `/settings/profile` and sign-out.
  - Signed-out state: Sign In link and a "Leave a Review" CTA.
  - Admin role: additional Admin link routing to `/admin`.
- Closes when:
  - A link is tapped.
  - The user taps the overlay behind the drawer.
  - The user presses `Escape`.
- Focus is trapped inside the drawer while open (`aria-modal`, `role="dialog"`).
- Focus returns to the hamburger button when the drawer closes.
- The drawer does not mount in the DOM on desktop (avoid hidden interactive elements from keyboard navigation).

**Accessibility requirements:**
- `<button aria-label="Open navigation menu">` for the hamburger trigger.
- `<button aria-label="Close navigation menu">` inside the drawer.
- `aria-expanded` on the hamburger button reflects open/closed state.
- `aria-controls` links the hamburger button to the drawer panel.
- Drawer panel: `role="dialog"` and `aria-label="Navigation"`.
- All links inside the drawer are standard `<a>` / Next.js `<Link>` elements with visible focus styles.

---

## Component: `HamburgerButton`

**Location:** `livedin/components/nav/HamburgerButton.tsx`

**Behavior:**
- Renders three horizontal bars (closed state) or an `×` icon (open state).
- Minimum touch target: 44 × 44 px, padded from the surrounding header content.
- Uses a CSS transition for the bar-to-× morph (keep it under 200 ms).
- Hidden on desktop (`hidden md:block` equivalent, or `lg:hidden` depending on threshold).

---

## Header responsiveness

### Public site header (`PublicSiteHeader.tsx`)

**Current state:** The header renders a horizontal row of links that may overflow or wrap on narrow viewports.

**Target state:**
- On mobile/tablet: only the logo and hamburger button are visible in the header bar.
- On desktop: the full link row is visible and the hamburger is hidden.
- The header bar itself never exceeds the viewport width or causes horizontal scroll.
- The header height remains consistent at a fixed value (e.g., `56px` or `64px`) regardless of viewport.

**Implementation direction:**
- Wrap existing desktop link list in a `hidden lg:flex` container.
- Add `<HamburgerButton>` in an `lg:hidden` container on the right side of the header.
- Render `<MobileNavDrawer>` adjacent to the header, controlled by shared open state.
- Use `usePathname()` to auto-close the drawer on route change.

### Admin header / admin layout

- Apply the same hamburger-first pattern to any admin-specific header or sidebar navigation.
- On mobile, the admin page header should collapse the admin section nav into the shared drawer, or render a separate admin-context drawer if the admin layout has its own navigation.

---

## Mobile nav link inventory

The drawer must include all routes a user may need to access on mobile:

**Always visible:**
- Browse (`/`) — "Browse Properties"
- Sign In (`/sign-in`) — shown only when signed out

**Signed-in (all roles):**
- Browse (`/`)
- Submit a Review (`/submit-review`) — link to the select-property entry point
- Profile Settings (`/settings/profile`)
- Sign Out

**Signed-in (admin role only, shown below a separator):**
- Admin Command Center (`/admin`)
- Manage Properties (`/admin/properties`)
- Moderate Reviews (`/admin/reviews`)
- Moderate Insights (`/admin/insights`)

---

## Touch-target audit (key flows)

Review these elements across mobile and ensure each has a minimum 44 × 44 px interactive area:

| Element | Location | Fix if needed |
|---|---|---|
| Hamburger button | Header | Ensure padding brings tap area to 44 × 44 |
| Nav drawer links | Drawer | Ensure each link row is at least `44px` tall |
| Sign In / Sign Out buttons | Header, drawer | Pad to 44 × 44 |
| Search input submit | `/` browse | Ensure submit icon button has 44 × 44 area |
| Property card tap area | Browse, detail | Cards should be fully tappable (not just text) |
| Review submission nav buttons | `/submit-review/[id]` | Next/Back buttons must be full-width or min 44 × 44 |
| Admin action buttons | `/admin`, `/admin/reviews` | Approve/reject buttons must be large enough on mobile |
| Breadcrumb links | All pages | Each crumb link needs adequate tap padding |
| Settings entry point | Signed-in header | Avatar or settings link must be 44 × 44 tappable |

---

## Animation and performance notes

- Drawer open/close animation: CSS `transform: translateX` or `opacity` transition, 200 ms ease-out. Avoid layout-triggering properties.
- Use `will-change: transform` only on the drawer panel element, not globally.
- The hamburger icon morph should use CSS transitions, not JavaScript-driven frame animations.
- Drawer overlay uses a semi-transparent background; prefer `background: rgba(0,0,0,0.5)` over a blur filter for performance on low-end phones.

---

## Acceptance criteria checklist

- [ ] On viewports below 1024 px, the header shows only the logo and a hamburger button (no inline links).
- [ ] On viewports 1024 px and above, the hamburger is hidden and header links are visible inline.
- [ ] Tapping the hamburger button opens the nav drawer.
- [ ] The nav drawer shows all primary links relevant to the user's signed-in/signed-out state and role.
- [ ] Tapping any link in the drawer navigates to the correct route and closes the drawer.
- [ ] Tapping the overlay outside the drawer closes it.
- [ ] Pressing `Escape` closes the drawer.
- [ ] Focus is trapped in the drawer while open and returns to the hamburger button on close.
- [ ] The hamburger button has `aria-expanded` reflecting open/closed state.
- [ ] The drawer has `role="dialog"` and `aria-label="Navigation"`.
- [ ] The header bar never causes horizontal scroll on any viewport width.
- [ ] All interactive elements in the key flows listed in the touch-target audit meet 44 × 44 px.
- [ ] Drawer open/close animation completes in 200 ms or less.
- [ ] Admin users see admin section links in the drawer; non-admin users do not.
- [ ] Signed-out users see only Browse and Sign In in the drawer.

---

## Test notes (manual smoke steps)

- Resize the browser to 375 px width (iPhone SE) and verify only the logo and hamburger button appear in the header.
- Tap the hamburger; verify the drawer slides in and shows all expected links for the signed-out state.
- Sign in as a renter; open the drawer and verify display name, Profile Settings, Submit a Review, and Sign Out are present.
- Sign in as an admin; open the drawer and verify admin links appear below a separator.
- Tap a link; verify navigation occurs and the drawer closes.
- Tap the overlay; verify the drawer closes.
- Press `Escape` with the drawer open; verify the drawer closes and focus returns to the hamburger button.
- Resize to 1280 px; verify the hamburger is gone and the full desktop nav is visible.
- Use browser DevTools to verify no horizontal scrollbar appears at 320 px, 375 px, and 768 px widths.

---

## Out of scope

- Bottom tab bar (native-app-style persistent tab row).
- Swipe gestures to open/close the drawer.
- Per-page contextual side navigation beyond the global nav drawer.
- Push notifications or in-app notification inbox.
- Admin-specific mobile dashboard redesign beyond header responsiveness.
