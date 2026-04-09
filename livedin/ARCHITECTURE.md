# Livedin — Architecture & Onboarding Guide

Hey! Welcome to the team. If you've never written a line of JavaScript, never touched web development, and the word "Next.js" means absolutely nothing to you — that's totally okay. That's exactly who this document is written for.

Grab a coffee. We're going to walk through *everything*, from "what does this app even do" all the way to "here's how to make your first change without breaking anything." Take it one section at a time. You don't have to memorize it; think of this as the map you come back to when you're lost.

---

## Table of Contents

1. [What Even Is This Project?](#1-what-even-is-this-project)
2. [The Big Picture — How a Web App Works](#2-the-big-picture--how-a-web-app-works)
3. [The Languages We Use](#3-the-languages-we-use)
4. [What Is Next.js? (And Why Should I Care?)](#4-what-is-nextjs-and-why-should-i-care)
5. [The Folder Structure — A Guided Tour](#5-the-folder-structure--a-guided-tour)
6. [How the App Actually Runs — The Request Journey](#6-how-the-app-actually-runs--the-request-journey)
7. [The Data Layer — Where Information Lives](#7-the-data-layer--where-information-lives)
8. [Key Concepts Cheat Sheet](#8-key-concepts-cheat-sheet)
9. [Your First Week — What To Do](#9-your-first-week--what-to-do)
10. [Common Mistakes & Gotchas](#10-common-mistakes--gotchas)

---

## 1. What Even Is This Project?

**Livedin** is a website where renters can look up rental properties, see trust scores based on verified tenant reviews, and submit their own review after they've lived somewhere. Think of it like a Yelp or Google Reviews — but specifically for rental properties, and with a built-in admin dashboard where moderators can manage listings, approve reviews, and keep things clean.

If you've ever moved into a new apartment and had no idea what to expect from the landlord, this app is meant to fix that problem. Other renters who lived there before you left a score — and you're about to see it before you sign anything.

---

## 2. The Big Picture — How a Web App Works

### What is a web app, anyway?

You've used regular apps before — maybe a calculator, a game, or Microsoft Word. Those apps live entirely on your computer. You install them, they run locally, done.

A **web app** is different. It lives on a computer somewhere on the internet (called a **server**), and you access it through your browser (Chrome, Firefox, Safari). The browser is just the window; the real work happens on that server, and your browser displays the result.

### The restaurant analogy

Imagine a restaurant:

- **You (the customer)** sit at a table and look at a menu. You don't go into the kitchen. → This is the **frontend**: what you see in the browser.
- **The kitchen** is where food is actually made. You never see it directly. → This is the **backend**: the server-side code that processes data.
- **You place an order** and a waiter brings back the food. → This is an **API request**: your browser asking the server for data.
- **The pantry and fridge** store all the ingredients. → This is the **database**: where all the actual data lives.

In Livedin:
- The **frontend** is everything in `app/` and `components/` — the pages you see.
- The **backend** is the `app/api/` folder — the routes that talk to the database.
- The **database** is **Supabase** — a cloud-hosted database that stores properties, reviews, and users.

### What does a browser actually do?

Your browser is basically a very powerful document reader. It downloads files (HTML, CSS, JavaScript) from a server and renders them into the visual page you see. When you click a button, JavaScript (code written by developers) runs inside the browser and decides what happens next — like fetching new data or changing what you see.

---

## 3. The Languages We Use

This project uses four main file types: **TypeScript**, **CSS**, **JSON**, and **SQL**. Here's a plain-English breakdown of each, with examples pulled directly from this codebase.

---

### TypeScript (`.ts` and `.tsx` files)

**What it is:** TypeScript is the main programming language used to write the logic of this app. It's actually JavaScript with an extra layer on top — one that catches mistakes before they cause bugs. Think of JavaScript as writing instructions in a casual notebook, and TypeScript as writing them in a form that a spell-checker (the TypeScript compiler) reads over before anything runs.

A `.tsx` file is a TypeScript file that also contains HTML-like code (called JSX) for building visual components. A `.ts` file is pure TypeScript with no visual elements.

**Hello-world style example with every line explained:**

```typescript
// "type" defines a "shape" — think of it like a template for what a thing must look like.
// A "variable" is just a named box that holds a value.
// Here we say: anything of type "Person" must have a name (text) and an age (a number).
type Person = {
  name: string;   // "string" means text, like "Alice" or "Bob"
  age: number;    // "number" means a numeric value, like 25 or 100
};

// A "function" is a reusable block of instructions.
// This one takes a Person (called "p") and gives back a text greeting.
// The ": string" after the parentheses says "this function will return text."
function greet(p: Person): string {
  // Backtick strings let you insert variables using ${ }.
  // Here we build a greeting like "Hello, Alice! You are 25 years old."
  return `Hello, ${p.name}! You are ${p.age} years old.`;
}

// Create a variable called "alice" that holds a Person value.
const alice: Person = { name: "Alice", age: 25 };

// Call the function with "alice" and store the result in "message".
const message = greet(alice);

// Print the message to the console (a debug output window).
console.log(message); // Prints: Hello, Alice! You are 25 years old.
```

**Real example from this project — `lib/types.ts`:**

```typescript
// This "type" describes what a single rental property listing looks like.
// It's like a blueprint: every property object in the app must have these exact fields.
export type PropertyListItem = {
  id: string;                              // A unique ID for the property, like "abc-123"
  display_name: string;                   // The building or address name shown on screen
  address_line1: string;                  // Street address, like "123 Main St"
  city: string;                           // The city, like "Toronto"
  province: string;                       // The province, like "ON"
  management_company: string | null;      // Who manages the building — or null if unknown
  trustscore_display_0_5: 0 | 1 | 2 | 3 | 4 | 5;  // Trust score from 0 to 5
  review_count: number;                   // How many reviews this property has
};
```

The `| null` after `string` means the value can either be text or completely absent — kind of like a form field that's optional. The `0 | 1 | 2 | 3 | 4 | 5` means the trust score can *only* be one of those exact numbers, nothing in between (for the display version — the actual review scores allow halves like 2.5).

**Where you'll see TypeScript:** Everywhere. Every `.ts` and `.tsx` file in `app/`, `components/`, `lib/`, and `scripts/`.

---

### CSS (`.css` files)

**What it is:** CSS is the language that controls how things *look*. It can't do logic — it just says things like "this heading should be big and dark" or "this button should have rounded corners." Without CSS, everything would just be plain black-and-white text.

This project also uses **Tailwind CSS**, which is a shortcut system for CSS. Instead of writing a separate CSS file for each component, you add short class names directly to your HTML-like code (like `className="text-lg font-bold"`). Tailwind turns those class names into real CSS automatically.

**Hello-world style example:**

```css
/* A CSS "rule" targets an element (like a paragraph or button) and styles it. */
/* "p" means "select all paragraph elements". */
p {
  color: blue;         /* Set the text colour to blue */
  font-size: 16px;     /* Set the text size to 16 pixels */
}

/* A "class selector" starts with a dot. */
/* This targets any element with class="fancy-button". */
.fancy-button {
  background-color: purple;   /* Fill the background with purple */
  border-radius: 8px;         /* Round the corners slightly */
  padding: 12px 24px;         /* Add space inside: 12px top/bottom, 24px left/right */
}
```

**Real example from this project — `app/globals.css`:**

```css
/* ":root" means "the very top of the HTML document". */
/* CSS variables start with "--" and can be reused anywhere. */
/* This sets up the default colour palette for the whole app. */
:root {
  --background: #f3f4f6;          /* Light grey page background */
  --foreground: #1f2937;          /* Dark grey text colour */
  --theme-surface: #ffffff;       /* White card backgrounds */
  --theme-primary: #8b5cf6;       /* Purple — the main accent colour */
  --theme-primary-foreground: #ffffff;  /* White text on purple backgrounds */
  --theme-muted: #6b7280;         /* Dimmer grey for secondary text */
}

/* "[data-theme="recommended"]" targets any element that has a data-theme="recommended" attribute. */
/* The app switches themes by changing this attribute on the <html> tag. */
[data-theme="recommended"] {
  --background: #f3f4f6;          /* Same light grey for the Recommended theme */
  --theme-primary: #8b5cf6;       /* Purple primary accent */
}

/* "@theme inline" is a Tailwind v4 feature that maps our CSS variables */
/* into Tailwind utility classes so we can use them as class names in components. */
@theme inline {
  --color-background: var(--background);   /* Makes "bg-background" work as a Tailwind class */
  --color-foreground: var(--foreground);   /* Makes "text-foreground" work */
}
```

**Where you'll see CSS:** `app/globals.css` is the only CSS file. All other styling is done with Tailwind class names inside the `.tsx` component files.

---

### JSON (`.json` files)

**What it is:** JSON (JavaScript Object Notation) is a simple format for storing structured data as text. Think of it like a very strict outline format. The computer can read and write it easily. Humans can too, once you know the syntax.

**Hello-world style example:**

```json
{
  "name": "Alice",
  "age": 25,
  "hobbies": ["reading", "hiking"],
  "address": {
    "city": "Toronto",
    "province": "ON"
  }
}
```

In JSON: curly braces `{}` hold named fields (called "objects"). Square brackets `[]` hold lists (called "arrays"). Text values go in double quotes. Numbers don't.

**Real example from this project — `package.json`:**

```json
{
  "name": "livedin",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "api:test": "npx tsx scripts/api_smoke_test.ts"
  },
  "dependencies": {
    "next": "16.1.6",
    "react": "19.2.3",
    "@supabase/supabase-js": "^2.98.0"
  },
  "devDependencies": {
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

`package.json` is like a recipe card for the project. `"scripts"` lists commands you can run (e.g. `npm run dev` starts the app). `"dependencies"` lists the third-party libraries the app needs to run. `"devDependencies"` lists tools only needed during development (like TypeScript itself, which compiles your code but isn't needed at runtime).

**Where you'll see JSON:** `package.json`, `tsconfig.json`, `package-lock.json`. Not in the UI logic — just configuration files.

---

### SQL (`.sql` files — database migrations)

**What it is:** SQL (Structured Query Language) is the language used to talk to databases. It lets you create tables (like spreadsheets), insert rows, fetch data, and define rules. The SQL files in this project live in `../supabase/migrations/` — outside the `livedin/` folder — and set up the database schema.

**Hello-world style example:**

```sql
-- Two dashes start a comment in SQL.
-- "CREATE TABLE" makes a new table, like creating a spreadsheet with named columns.
CREATE TABLE users (
  id   TEXT PRIMARY KEY,   -- A text column called "id"; PRIMARY KEY means it must be unique
  name TEXT NOT NULL,      -- A text column called "name"; NOT NULL means it can't be blank
  age  INTEGER             -- A whole-number column called "age"
);

-- "INSERT INTO" adds a new row to the table.
INSERT INTO users (id, name, age)
VALUES ('user-1', 'Alice', 25);

-- "SELECT" fetches rows. The "*" means "give me all columns".
SELECT * FROM users WHERE age > 20;
```

**Real example from this project — the database schema:**

The `properties` table (from `supabase/migrations/20250305120000_slice04_db_foundation.sql`) looks roughly like:

```sql
-- Creates the main "properties" table that stores every rental listing.
CREATE TABLE public.properties (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,  -- Unique auto-generated ID
  display_name       TEXT NOT NULL,                               -- Building name shown in the UI
  address_line1      TEXT NOT NULL,                               -- Street address
  city               TEXT NOT NULL,                               -- City
  province           TEXT NOT NULL,                               -- Province code, e.g. "ON"
  postal_code        TEXT NOT NULL,                               -- Postal code
  management_company TEXT,                                        -- Optional management company name
  status             TEXT NOT NULL DEFAULT 'active'               -- "active" or "inactive"
);
```

**Where you'll see SQL:** Only in `../supabase/migrations/`. You won't write SQL in the Next.js app — all database communication goes through the Supabase client library, which writes the SQL for you behind the scenes.

---

## 4. What Is Next.js? (And Why Should I Care?)

### The LEGO analogy

Imagine you want to build a car. You could:

**Option A — From raw plastic:** Melt plastic pellets, pour them into custom moulds, design each part from scratch, figure out how to assemble everything. This is like writing a web app from scratch.

**Option B — LEGO:** Snap together pre-made bricks that are designed to fit together. You still build *your* car, but the hard structural problems are already solved. This is using a **framework**.

**Next.js is the LEGO set for building web apps with React.** It gives you:
- A ready-made system for pages and URLs
- A server that runs your TypeScript code
- Smart features like server-side rendering (explained below)
- A way to write both the frontend *and* backend in the same project

### Pages and Routing

In Next.js, **the folder structure is the URL**. If you make a file at `app/dashboard/page.tsx`, the URL `/dashboard` automatically shows that page. No extra configuration needed.

In this project:
- `app/page.tsx` → the home page at `/`
- `app/sign-in/page.tsx` → the sign-in page at `/sign-in`
- `app/properties/[id]/page.tsx` → a property detail page at `/properties/abc-123` (the `[id]` is a **dynamic segment** — a placeholder that gets replaced with the actual property ID)
- `app/admin/page.tsx` → the admin dashboard at `/admin`

### Components

A **component** is a reusable piece of UI — like a LEGO brick. Instead of writing the same button HTML ten times in ten different files, you write it once as a component and drop it in wherever you need it.

In this project, `components/PropertyCard.tsx` is a component that displays a single property in the list. It gets used in `app/page.tsx` like this:

```tsx
// This line is like using a LEGO brick — we "import" the PropertyCard component
// from the components folder so we can use it here.
import { PropertyCard } from "@/components/PropertyCard";

// Later in the UI code:
// "items" is an array (a list) of property objects.
// ".map()" goes through each item in the list and does something with it.
// For each "item", we render a <PropertyCard> component and pass the item data into it.
{items.map((item) => (
  <PropertyCard key={item.id} item={item} />  // key= helps React track which card is which
))}
```

### Server vs. Client

This is one of the most confusing parts of Next.js, so let's take it slow.

**"Client" means the browser.** Code that runs in the browser is "client-side." It can respond to clicks, update the screen without reloading, and read things like the user's local storage.

**"Server" means the computer hosting the app.** Code that runs on the server can talk to the database securely (since database secrets never leave the server), do heavy computation, and return results to the browser.

In Next.js, components can be one or the other:

- A file that starts with `"use client";` at the very top runs **in the browser**. Most of the pages in this app are client components because they need to react to user input (typing in the search box, clicking buttons).
- A file without `"use client"` runs on the **server** by default. The root `app/layout.tsx` is a server component.

API route files (in `app/api/`) *always* run on the server — they're the backend. They talk to Supabase, apply authentication checks, and return data as JSON.

### Folder Structure Recap

```
app/           ← pages and API routes (the "brain" of the app)
components/    ← reusable UI pieces (the "building blocks")
lib/           ← shared utilities, types, and data access functions
public/        ← static files served directly (images, SVGs)
scripts/       ← helper scripts for testing and development
```

---

## 5. The Folder Structure — A Guided Tour

Here's a full annotated tour of every meaningful file and folder:

```
livedin/
│
├── app/                         ← Everything in here becomes a URL or an API route.
│   │                              This is the heart of a Next.js App Router project.
│   │
│   ├── layout.tsx               ← The ROOT layout. Wraps every single page in the app.
│   │                              Sets up fonts, the theme system, and global CSS.
│   │
│   ├── page.tsx                 ← The HOME PAGE at "/". Shows the search bar and property list.
│   │
│   ├── globals.css              ← The ONE CSS file for the whole app. Sets colour variables
│   │                              and Tailwind imports. All other styling is done with
│   │                              Tailwind class names inline in components.
│   │
│   ├── favicon.ico              ← The tiny icon that appears in the browser tab.
│   │
│   ├── sign-in/
│   │   └── page.tsx             ← The sign-in page at "/sign-in".
│   │
│   ├── signup/
│   │   └── request-admin/
│   │       └── page.tsx         ← The page where a user can request admin access at
│   │                              "/signup/request-admin".
│   │
│   ├── themes/
│   │   └── page.tsx             ← A page at "/themes" where users pick their colour theme.
│   │
│   ├── properties/
│   │   └── [id]/                ← "[id]" is a dynamic segment. The actual property ID goes here.
│   │       ├── page.tsx         ← The public property detail page at "/properties/abc-123".
│   │       └── not-found.tsx    ← What shows if the property ID doesn't exist (404 page).
│   │
│   ├── submit-review/
│   │   └── [propertyId]/
│   │       └── page.tsx         ← The multi-step review submission flow at
│   │                              "/submit-review/new" or "/submit-review/abc-123".
│   │
│   ├── admin/                   ← Everything in here is the admin dashboard.
│   │   ├── layout.tsx           ← Admin layout — checks if the user has admin role before
│   │   │                          showing anything. Acts as a security gate.
│   │   ├── page.tsx             ← Admin dashboard home at "/admin".
│   │   ├── access-requests/
│   │   │   └── page.tsx         ← Manage admin access requests at "/admin/access-requests".
│   │   ├── audit/
│   │   │   └── page.tsx         ← Audit log viewer at "/admin/audit".
│   │   ├── insights/
│   │   │   └── page.tsx         ← Approve/reject AI-distilled insights at "/admin/insights".
│   │   ├── properties/
│   │   │   ├── page.tsx         ← List of all properties for admin at "/admin/properties".
│   │   │   ├── new/
│   │   │   │   └── page.tsx     ← Form to create a new property at "/admin/properties/new".
│   │   │   └── [id]/
│   │   │       ├── edit/
│   │   │       │   └── page.tsx ← Edit an existing property at "/admin/properties/abc-123/edit".
│   │   │       └── photos/
│   │   │           └── page.tsx ← Manage photos for a property at "/admin/properties/abc-123/photos".
│   │   ├── reviews/
│   │   │   └── page.tsx         ← Moderate reviews at "/admin/reviews".
│   │   └── users/
│   │       └── page.tsx         ← View and manage users at "/admin/users".
│   │
│   └── api/                     ← API routes. These don't show pages — they return data (JSON).
│       │                          Think of these as the "kitchen" the frontend orders from.
│       │
│       ├── properties/
│       │   ├── route.ts         ← GET /api/properties — returns the list of properties.
│       │   └── [id]/
│       │       ├── route.ts     ← GET /api/properties/abc-123 — returns one property's detail.
│       │       └── reviews/
│       │           └── route.ts ← POST /api/properties/abc-123/reviews — submits a review.
│       │
│       └── admin/               ← All admin API routes. Require a Bearer token + admin role.
│           ├── me/
│           │   └── route.ts     ← GET /api/admin/me — checks if the current user is an admin.
│           ├── overview/
│           │   └── route.ts     ← GET /api/admin/overview — fetches dashboard stats.
│           ├── audit/
│           │   └── route.ts     ← GET /api/admin/audit — returns the audit log.
│           ├── insights/
│           │   ├── route.ts     ← GET/PATCH /api/admin/insights — list + moderate insights.
│           │   └── [propertyId]/
│           │       └── route.ts ← Insights for a specific property.
│           ├── access-requests/
│           │   ├── route.ts     ← GET /api/admin/access-requests — list all requests.
│           │   └── [id]/
│           │       └── route.ts ← PATCH /api/admin/access-requests/abc — approve/reject one.
│           ├── users/
│           │   ├── route.ts     ← GET /api/admin/users — list users.
│           │   └── [id]/
│           │       └── route.ts ← PATCH /api/admin/users/abc — update a user's role.
│           ├── reviews/
│           │   ├── route.ts     ← GET /api/admin/reviews — list reviews for moderation.
│           │   └── [id]/
│           │       └── route.ts ← PATCH /api/admin/reviews/abc — approve/reject a review.
│           └── properties/
│               ├── route.ts     ← GET/POST /api/admin/properties — list + create properties.
│               └── [id]/
│                   ├── route.ts ← GET/PATCH/DELETE /api/admin/properties/abc — manage one.
│                   ├── photos/
│                   │   ├── route.ts      ← GET/POST photos for a property.
│                   │   └── [photoId]/
│                   │       └── route.ts  ← DELETE a specific photo.
│                   └── insights/
│                       └── recompute/
│                           └── route.ts  ← POST — trigger re-generation of distilled insights.
│
├── components/                  ← Reusable UI components. Not pages. Just building blocks.
│   │
│   ├── PropertyCard.tsx         ← One property in the search results list. Clickable card.
│   ├── SearchBar.tsx            ← The search input + button at the top of the home page.
│   │
│   ├── admin/
│   │   ├── AdminAuditFeed.tsx   ← Renders the list of admin audit log entries.
│   │   ├── AdminSummaryCard.tsx ← A summary card on the admin dashboard.
│   │   └── PropertyForm.tsx     ← The form used to create and edit properties.
│   │
│   ├── auth/
│   │   ├── AuthPromptCard.tsx   ← A card that says "please sign in to continue."
│   │   ├── PublicSiteHeader.tsx ← The header bar shown on public pages (home, property detail).
│   │   ├── RequestAdminAccessPage.tsx ← The form for requesting admin access.
│   │   ├── SignInForm.tsx       ← The email + password sign-in form.
│   │   └── SignOutButton.tsx    ← A button that signs the user out when clicked.
│   │
│   ├── reviews/
│   │   ├── PropertySelectStep.tsx    ← Step 1 of the review flow: pick a property.
│   │   ├── ReviewFormStep.tsx        ← Step 2: fill in star ratings and optional text.
│   │   ├── ReviewGateBanner.tsx      ← Shows a message if the user can't review (not verified, etc).
│   │   ├── ReviewSubmittedScreen.tsx ← Confirmation screen after a review is submitted.
│   │   ├── ReviewSubmitFlow.tsx      ← The parent component that manages which step is shown.
│   │   ├── StarRatingInput.tsx       ← The interactive star rating picker.
│   │   └── SubmitReviewPageClient.tsx ← Client wrapper for the full review submission page.
│   │
│   ├── theme/
│   │   ├── ThemeMenu.tsx        ← The dropdown menu where users pick their colour theme.
│   │   └── ThemeSync.tsx        ← A tiny invisible component that reads the saved theme from
│   │                              localStorage and applies it on page load.
│   │
│   └── ui/
│       ├── Breadcrumbs.tsx      ← The "Home > Properties > 123 Main St" navigation trail.
│       └── FeedbackPanel.tsx    ← A reusable panel for showing errors, empty states, and notices.
│
├── lib/                         ← Shared logic. Not UI. Think of this as the toolbox.
│   │
│   ├── types.ts                 ← THE central TypeScript types file. Every shared data shape
│   │                              lives here: PropertyListItem, ReviewCreateInput, etc.
│   │                              If you want to know what a piece of data looks like, start here.
│   │
│   ├── supabase-server.ts       ← Creates the Supabase database client for server-side use
│   │                              (API routes). Uses secret environment variables.
│   │
│   ├── supabase-browser.ts      ← Creates the Supabase client for browser-side use (auth).
│   │                              Uses public environment variables (NEXT_PUBLIC_...).
│   │
│   ├── admin-auth.ts            ← Authentication helper for admin API routes. Reads the
│   │                              Bearer token from the request header, verifies it with
│   │                              Supabase, and checks that the user has the "admin" role.
│   │
│   ├── admin-client.ts          ← Functions the admin UI uses to call the admin API routes.
│   ├── admin-display.ts         ← Helper functions to format admin data for display.
│   ├── admin-role-requests.ts   ← Logic for the admin access request flow (submit + check status).
│   │
│   ├── property-search.ts       ← The function the home page uses to search properties.
│   │                              Calls GET /api/properties and returns the result.
│   │
│   ├── property-detail.ts       ← Fetches a single property's full detail from the API.
│   ├── property-detail-mock.ts  ← A mock version used during early development (returns fake data).
│   ├── property-photos.ts       ← Functions for fetching and uploading property photos.
│   │
│   ├── distilled-insights.ts    ← Helpers for the AI-generated property insight summaries.
│   │
│   ├── themes.ts                ← Defines all five colour themes, their CSS variable tokens,
│   │                              and the script that sets the theme on page load.
│   │
│   ├── ui.ts                    ← Shared CSS class strings used by many components.
│   │                              Things like "primaryButtonClass" so every button looks the same.
│   │
│   └── validation/
│       └── review.ts            ← Validates review form input before sending it to the server.
│
├── public/                      ← Static files. Served directly, no processing.
│   ├── file.svg                 ← Default SVG icon (from Next.js starter template).
│   ├── globe.svg                ← Same.
│   ├── next.svg                 ← Same.
│   ├── vercel.svg               ← Same.
│   └── window.svg               ← Same.
│                                  Note: none of these are actually used in the app UI.
│                                  They're leftovers from the Next.js project template.
│
├── scripts/                     ← Developer-only scripts. Not part of the app itself.
│   ├── api_smoke_test.ts        ← A script that fires real HTTP requests at the running app
│   │                              to check all the API routes work. Run with "npm run api:test".
│   └── get-review-test-jwt.ts   ← A helper to get a JWT token for testing the review API.
│
├── package.json                 ← Project recipe: dependencies, scripts, metadata.
├── package-lock.json            ← Auto-generated lockfile that pins exact dependency versions.
│                                  Never edit this by hand.
├── tsconfig.json                ← TypeScript configuration: how strict to be, what to compile.
├── next.config.ts               ← Next.js configuration. Currently minimal.
├── postcss.config.mjs           ← PostCSS configuration: tells the CSS pipeline to use Tailwind v4.
├── eslint.config.mjs            ← ESLint configuration: rules for catching code style issues.
├── next-env.d.ts                ← Auto-generated TypeScript declarations for Next.js. Don't touch.
└── .env.production              ← Environment variables for production deployment.
                                   NEVER commit this file to git — it contains secrets.
```

---

## 6. How the App Actually Runs — The Request Journey

Let's trace what happens, step by step, when someone visits `http://localhost:3000` for the first time.

### Step 1 — User types the URL

You type `http://localhost:3000` and press Enter. Your browser sends a network request to the Next.js development server running on your computer (port 3000 is the default).

### Step 2 — Next.js receives the request

The Next.js server wakes up and looks at the URL path. It's `/` (just a slash, meaning "the root"). It knows from the folder structure that `app/page.tsx` handles this path.

### Step 3 — The root layout wraps everything

Before rendering the page, Next.js looks for the nearest `layout.tsx`. The root layout is at `app/layout.tsx`. It runs first and sets up the `<html>` and `<body>` tags with the right fonts, global CSS, and a theme-loading script.

```tsx
// app/layout.tsx

// "import" loads code from another file or library so we can use it here.
import type { Metadata } from "next";            // TypeScript type for page metadata
import { Geist, Geist_Mono } from "next/font/google";  // Load two fonts from Google
import "./globals.css";                           // Load the global CSS file
import { ThemeSync } from "@/components/theme/ThemeSync";  // Our theme component
import { DEFAULT_THEME_KEY, themeScript } from "@/lib/themes";  // Theme utilities

// Load the Geist Sans font and assign it a CSS variable name.
// A "CSS variable" is a named slot in CSS we can reuse anywhere.
const geistSans = Geist({
  variable: "--font-geist-sans",   // The CSS variable name this font will be stored under
  subsets: ["latin"],              // Only load Latin characters (smaller download)
});

// Same for the monospace font (used for code-style text).
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// "export const metadata" tells Next.js what to put in the browser tab title and SEO tags.
export const metadata: Metadata = {
  title: "Livedin",
  description: "Verified renter reviews, structured trust scores, and property insights.",
};

// "export default function" is the main exported component — Next.js calls this automatically.
// "children" is a special prop that means "whatever pages or components are nested inside this layout."
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;  // "React.ReactNode" means "any valid React content"
}>) {
  return (
    // The outer HTML element. suppressHydrationWarning prevents a console warning
    // that can happen when the theme changes between server and client rendering.
    <html lang="en" suppressHydrationWarning data-theme={DEFAULT_THEME_KEY}>
      <head>
        {/* This tiny inline script runs BEFORE the page paints, to set the saved theme.
            Without it, you'd see a flash of the wrong colours on page load. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript() }} />
      </head>
      <body
        // Apply both font CSS variables to the body so all text uses the right fonts.
        // "antialiased" is a Tailwind class that makes text look smoother.
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeSync />    {/* Reads the saved theme from localStorage and syncs it */}
        {children}       {/* This is where the actual page content gets rendered */}
      </body>
    </html>
  );
}
```

### Step 4 — The home page component runs

`app/page.tsx` is a **client component** (it has `"use client"` at the top). It sets up a few **state variables** — think of these as the component's memory. Then it immediately triggers a search.

A **state variable** (using `useState`) is a variable that, when it changes, causes the page to redraw with the new value. It's like a label on a whiteboard — when you erase "loading" and write "ready", the whole room (component) updates to reflect that.

```tsx
// app/page.tsx (simplified excerpt)

"use client";  // This component runs in the browser (not on the server)

// "useEffect" and "useState" are React hooks — special functions that give components
// abilities like memory (useState) and running code at specific moments (useEffect).
import { useEffect, useState } from "react";

// Import the SearchBar component (the text field + button at the top).
import { SearchBar } from "@/components/SearchBar";

// Import the function that talks to our API to search for properties.
import { searchProperties } from "@/lib/property-search";

// Import the type that describes the shape of a single property.
import type { PropertyListItem, PropertySearchResponse, UiListState } from "@/lib/types";

export default function Home() {
  // "useState" creates a state variable.
  // "query" is the current search text the user has typed.
  // "setQuery" is the function we call to change it.
  // The initial value is "" (empty string).
  const [query, setQuery] = useState("");

  // "state" tracks whether we're loading, have results, have no results, or hit an error.
  // "UiListState" can only be: "loading" | "ready" | "empty" | "error"
  const [state, setState] = useState<UiListState>("loading");

  // "data" holds the search results returned from the API.
  // It starts as null (nothing yet).
  const [data, setData] = useState<PropertySearchResponse | null>(null);

  // This function runs a search: sets state to "loading", calls the API,
  // then updates state and data based on the result.
  const runSearch = async (q: string) => {
    setState("loading");   // Show the loading skeleton while we wait
    try {
      const res = await searchProperties(q);  // Call the API (see lib/property-search.ts)
      setData(res);                           // Store the results
      setState(res.items.length > 0 ? "ready" : "empty");  // Ready or empty depending on results
    } catch {
      setState("error");  // If the request failed, show an error state
    }
  };

  // "useEffect" runs code AFTER the component first appears on screen.
  // The empty [] at the end means "run this only once, when the page loads."
  useEffect(() => {
    async function loadInitialResults() {
      try {
        const res = await searchProperties("");  // Search with no query = show all properties
        setData(res);
        setState(res.items.length > 0 ? "ready" : "empty");
      } catch {
        setState("error");
      }
    }
    void loadInitialResults();  // "void" just means we're not using the return value
  }, []);  // The [] means "only run once"

  // ... (the return statement renders the visual HTML)
}
```

### Step 5 — The search function calls the API

`lib/property-search.ts` calls `GET /api/properties`. This is an **HTTP request** — like a text message from the browser to the server asking "hey, give me the property list."

```typescript
// lib/property-search.ts

import type { PropertySearchResponse } from "./types";  // Import the type for the response shape

// This function takes a search query string and returns a PropertySearchResponse.
// "async" means it runs asynchronously — it doesn't block everything while waiting for a response.
// "Promise<PropertySearchResponse>" means it will eventually return a PropertySearchResponse.
export async function searchProperties(query: string): Promise<PropertySearchResponse> {
  // "URLSearchParams" builds the query string part of a URL (the "?q=..." part).
  const params = new URLSearchParams();

  // Only add the "q" parameter if there's actually something to search.
  if (query.trim()) {           // ".trim()" removes leading/trailing whitespace
    params.set("q", query.trim());
  }

  // "fetch" is the browser's built-in function for making HTTP requests.
  // We're requesting /api/properties with an optional ?q= search parameter.
  const res = await fetch(`/api/properties?${params.toString()}`, {
    method: "GET",  // GET means "give me data" (as opposed to POST which sends data)
  });

  // If the server responded with an error status (like 500), throw an error.
  if (!res.ok) {
    throw new Error("Failed to fetch properties");
  }

  // ".json()" reads the response body and parses it from JSON text into a JavaScript object.
  // "as PropertySearchResponse" tells TypeScript "trust me, this matches our type."
  const data = (await res.json()) as PropertySearchResponse;
  return data;
}
```

### Step 6 — The API route runs on the server

`app/api/properties/route.ts` handles the GET request. It runs on the server (not the browser), connects to Supabase, queries the database, and returns a JSON response.

```typescript
// app/api/properties/route.ts (simplified)

import { NextResponse, type NextRequest } from "next/server";  // Next.js server utilities
import { getSupabaseServerClient } from "@/lib/supabase-server";  // Our database client factory
import type { PropertyListItem, PropertySearchResponse } from "@/lib/types";  // Our data types

// "export async function GET" tells Next.js to call this function when a GET request arrives.
// "req" is the incoming request object — it has the URL, headers, body, etc.
export async function GET(req: NextRequest) {
  // Parse the URL to extract the "?q=..." query parameter.
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";  // "?? """" means "use "" if q is null"
  const query = q.trim();

  // Get the Supabase database client.
  const supabase = getSupabaseServerClient();

  // Build a search pattern for the SQL LIKE query.
  // "%" is a SQL wildcard meaning "any characters here".
  // So "%main%" matches "123 Main St", "Mainstreet Tower", etc.
  const pattern = query ? `%${query}%` : null;

  // Start building a database query.
  // ".from("properties")" means "query the properties table".
  // ".select(...)" means "give me these specific columns, plus related data from property_aggregates".
  let dbQuery = supabase
    .from("properties")
    .select(`
      id, display_name, address_line1, city, province, management_company,
      property_aggregates ( review_count, display_trustscore_0_5 )
    `)
    .eq("status", "active");  // Only return active listings (not inactive/deleted ones)

  // If there's a search query, add filter conditions.
  if (pattern) {
    dbQuery = dbQuery.or(
      `display_name.ilike.${pattern},address_line1.ilike.${pattern},city.ilike.${pattern}`
    );  // "ilike" is a case-insensitive SQL LIKE — matches regardless of uppercase/lowercase
  }

  // Execute the query and get the results.
  // "data" is the array of matching properties; "error" is any database error.
  const { data, error } = await dbQuery;

  if (error) {
    // If the database returned an error, respond with a 500 status (Internal Server Error).
    return NextResponse.json({ message: "Failed to load properties" }, { status: 500 });
  }

  // Transform the raw database rows into the shape our UI expects (PropertyListItem[]).
  const items: PropertyListItem[] = (data ?? []).map((row) => {
    const aggregates = row.property_aggregates?.[0] ?? null;  // "?." safely handles null
    return {
      id: row.id,
      display_name: row.display_name,
      address_line1: row.address_line1,
      city: row.city,
      province: row.province,
      management_company: row.management_company,
      trustscore_display_0_5: aggregates?.display_trustscore_0_5 ?? 0,
      review_count: aggregates?.review_count ?? 0,
    };
  });

  // Return the data as JSON with a 200 OK status (the default).
  return NextResponse.json({ items, total: items.length, query });
}
```

### Step 7 — The browser receives the data and renders the UI

Back in the browser, the `await searchProperties(q)` call resolves with the data. `setData(res)` and `setState("ready")` are called, which triggers React to re-render the page with the results. Each item in `data.items` becomes a `<PropertyCard>` component.

### Step 8 — User sees the page

The browser paints the final UI. The user sees a list of property cards, each showing the building name, address, trust score, and review count.

---

## 7. The Data Layer — Where Information Lives

### The database — Supabase

All persistent data (properties, reviews, users, audit logs) lives in **Supabase** — a hosted database service. It uses PostgreSQL (a very popular SQL database) and adds extras like authentication, Row Level Security (RLS), and a client library that makes querying from JavaScript feel natural.

Think of Supabase as a cloud-hosted spreadsheet with superpowers: it enforces rules about who can see what (RLS), automatically hashes passwords, and sends emails for verification.

### Two Supabase clients

The app has two different ways to connect to Supabase, kept in separate files:

**Server client** (`lib/supabase-server.ts`) — used in API routes:

```typescript
// lib/supabase-server.ts

// Import the createClient function from the Supabase library.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// A helper function that reads an environment variable.
// "process.env" is how Node.js reads variables set in .env files.
// If the variable is missing, we throw an error immediately — we'd rather crash loudly
// than silently send requests to the wrong place.
function getEnv(name: string): string {
  const value = process.env[name];   // Read the named variable from the environment
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);  // Crash if it's missing
  }
  return value;  // Return the value if it exists
}

// "cachedClient" stores the Supabase client so we don't create a new connection every request.
// It starts as null (no connection yet). "SupabaseClient | null" means it's either a client or null.
let cachedClient: SupabaseClient | null = null;

// This function returns the Supabase client, creating it once if needed.
export function getSupabaseServerClient(): SupabaseClient {
  if (cachedClient) return cachedClient;  // If already created, return it (avoid duplicate connections)

  const url = getEnv("SUPABASE_URL");           // The URL of the Supabase project
  const anonKey = getEnv("SUPABASE_ANON_KEY");  // The anonymous public API key

  // Create the client with auth session persistence disabled (server doesn't need sessions)
  cachedClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,  // Don't store auth sessions on the server
    },
  });

  return cachedClient;  // Return the newly created client
}
```

**Browser client** (`lib/supabase-browser.ts`) — used in React components for auth:

```typescript
// lib/supabase-browser.ts

"use client";  // This code only runs in the browser

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

// Returns a Supabase client for use in the browser, or null if env vars aren't set.
export function getSupabaseBrowserClient(): SupabaseClient | null {
  // "typeof window === "undefined"" is true when running on the server.
  // If we're on the server, don't try to create a browser client.
  if (typeof window === "undefined") return null;

  // NEXT_PUBLIC_ variables are safe to expose to the browser.
  // Variables WITHOUT NEXT_PUBLIC_ are secret and only available on the server.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If either env var is missing, return null (auth won't work, which is handled gracefully).
  if (!url || !anonKey) return null;

  // Reuse existing client if already created (same pattern as the server client).
  if (cachedClient) return cachedClient;

  cachedClient = createClient(url, anonKey);  // Create a new client with these credentials
  return cachedClient;
}
```

### How admin authentication works

When an admin opens any page under `/admin`, the admin layout (`app/admin/layout.tsx`) runs a check:

1. It calls `getSupabaseBrowserClient()` to get the browser Supabase client.
2. It calls `supabase.auth.getSession()` to see if the user is logged in and get their **access token** (a temporary credential, like a signed ticket).
3. It sends that token to `GET /api/admin/me` in the `Authorization: Bearer <token>` header.
4. The API route calls `getAdminFromRequest()` (in `lib/admin-auth.ts`) which verifies the token with Supabase and checks that the user's profile has `role = 'admin'`.
5. If the check passes, the admin layout renders the admin UI. Otherwise it shows an "access denied" screen.

### How data flows for a search

```
User types in SearchBar
       ↓
SearchBar calls onSubmit → Home page's handleSearchSubmit function
       ↓
handleSearchSubmit calls runSearch(query)
       ↓
runSearch calls searchProperties(query) from lib/property-search.ts
       ↓
searchProperties calls fetch("/api/properties?q=...")
       ↓
Next.js routes the request to app/api/properties/route.ts (runs on the SERVER)
       ↓
route.ts calls getSupabaseServerClient() → connects to Supabase
       ↓
Supabase queries the "properties" table with a LIKE filter
       ↓
Results come back as rows → route.ts transforms them into PropertyListItem[]
       ↓
route.ts returns NextResponse.json({ items, total, query })
       ↓
Browser receives the JSON response
       ↓
searchProperties returns it → runSearch calls setData(res) and setState("ready")
       ↓
React re-renders the page → items.map() creates PropertyCard components
       ↓
User sees the updated property list
```

---

## 8. Key Concepts Cheat Sheet

Here are 15 terms you'll encounter constantly in this codebase. Keep this as a quick reference.

**`useState`** — A React tool that lets a component "remember" a value between renders. When the value changes, React redraws the component. Think of it as a whiteboard inside a component.
Used in: `app/page.tsx`, `app/admin/layout.tsx`, `components/reviews/ReviewSubmitFlow.tsx`

**`useEffect`** — A React tool that runs code *after* a component appears on screen. Often used to load data when a page first opens.
Used in: `app/page.tsx` (loads initial property list), `app/admin/layout.tsx` (checks admin auth)

**`async/await`** — A way to write code that has to wait for something (like a network request) without freezing the whole browser. `async` marks a function as "this might wait." `await` pauses until a result arrives.
Used in: `app/page.tsx` (`runSearch`), `app/api/properties/route.ts` (the GET handler)

**`export default function`** — Declares the main component or function of a file. Next.js pages *must* export a default function — that's what gets rendered.
Used in: every `page.tsx` and `layout.tsx` file

**`import`** — Loads code from another file so you can use it. Like `#include` in C, or `import` in Python.
Used in: every file that uses a component, type, or utility function

**`type` (TypeScript)** — Defines the exact shape that a piece of data must have. Acts as a contract: if your data doesn't match the type, TypeScript gives you a red squiggle and refuses to compile.
Used in: `lib/types.ts` (central home of all data types)

**`null`** — A special value meaning "intentionally empty / not present." In TypeScript, `string | null` means "either a string or nothing at all." You'll see it on optional fields like `management_company`.
Used in: everywhere — `PropertyListItem.management_company`, `data` state variable before first fetch, etc.

**`props`** — Short for "properties." The inputs you pass into a component, like function arguments. In `<PropertyCard item={item} />`, the `item` is a prop.
Used in: `components/PropertyCard.tsx` (`PropertyCardProps`), `components/SearchBar.tsx` (`SearchBarProps`)

**`Route Handler`** — A Next.js API endpoint. A `route.ts` file inside `app/api/` that exports functions named `GET`, `POST`, `PATCH`, or `DELETE` to handle HTTP requests.
Used in: every file in `app/api/**`

**`Bearer token`** — A security credential sent in the `Authorization` HTTP header. The admin UI gets this token from Supabase after sign-in and sends it with every admin API request to prove identity.
Used in: `app/admin/layout.tsx` (sends it), `lib/admin-auth.ts` (reads and verifies it)

**`RLS` (Row Level Security)** — A Supabase/PostgreSQL feature that enforces access rules at the database level. Even if an API route forgets to check permissions, the database itself will block unauthorised reads or writes.
Defined in: `../supabase/migrations/20250305130000_slice05_rls_roles.sql`

**`dynamic segment`** — A folder named `[something]` in the `app/` directory. The `something` becomes a variable the page can read. For example, `app/properties/[id]/page.tsx` receives the property's ID as a variable.
Used in: `app/properties/[id]/`, `app/submit-review/[propertyId]/`, `app/admin/properties/[id]/`

**`Tailwind CSS`** — A styling system where you apply tiny class names directly in your JSX. Instead of writing `color: blue` in a separate CSS file, you write `className="text-blue-500"` on the element. All the actual CSS is generated automatically.
Used in: every `.tsx` file — look for `className="..."` attributes

**`environment variable`** — A setting stored outside the code, in a `.env` file. Keeps secrets (like database passwords) out of version control. In this project: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and their `NEXT_PUBLIC_` counterparts.
Used in: `lib/supabase-server.ts`, `lib/supabase-browser.ts`, `lib/admin-auth.ts`

**`cn()` (class name utility)**  — A tiny helper function in `lib/ui.ts` that joins CSS class names together, skipping any falsy values. Used to conditionally apply classes: `cn("base-class", isActive && "active-class")`.
Used in: `components/PropertyCard.tsx`, and anywhere conditional styling is needed

---

## 9. Your First Week — What To Do

Here's a practical checklist to get from "I just cloned this repo" to "I made my first real change."

### Day 1 — Set up the environment

- [ ] **Install Node.js 20+.** Check your version with `node --version`. If it's below 20, download it from [nodejs.org](https://nodejs.org).
- [ ] **Clone the repository** (if you haven't already): `git clone <repo-url>` then `cd teamrenter/livedin`
- [ ] **Install dependencies:** Run `npm install` inside the `livedin/` folder. This reads `package.json` and downloads all the libraries into a `node_modules/` folder.
- [ ] **Set up environment variables:** Copy the example env file and fill in your Supabase credentials. Ask your team lead for the Supabase project URL and keys. Create a `.env.local` file in `livedin/` with:
  ```
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_ANON_KEY=your-anon-key-here
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
  ```
- [ ] **Start the database** (if running locally): From the repo root (`teamrenter/`), run `supabase start` then `supabase db reset`. This spins up a local PostgreSQL database and applies all the migrations.
- [ ] **Start the app:** From `livedin/`, run `npm run dev`. Open your browser and go to `http://localhost:3000`. You should see the Livedin home page.

### Day 2 — Explore the running app

- [ ] **Browse the public site.** Search for properties, click on one, look at the trust scores.
- [ ] **Try signing in.** Use the sign-in page at `/sign-in`. Use a test account from the seed data (ask your team lead for credentials).
- [ ] **Look at the admin area.** If you have admin credentials, visit `/admin` to see the dashboard.
- [ ] **Open the browser developer tools.** Press F12 in Chrome. Go to the "Network" tab and watch what happens when you search — you should see a request to `/api/properties`.

### Day 3 — Read the code

- [ ] **Read `lib/types.ts` top to bottom.** This is the map of all data shapes. Even if you don't understand every line, skim through the names — it'll orient you.
- [ ] **Read `app/page.tsx`.** This is the home page. Trace how the state variables connect to the UI.
- [ ] **Read `app/api/properties/route.ts`.** This is the simplest API route. Follow how the request comes in, how the query is built, and how the response goes out.
- [ ] **Read `components/PropertyCard.tsx`.** This is a simple, self-contained component. Good starting point for understanding component structure.

### Day 4 — Make a small UI change

A safe first change: find the "Search tips" sidebar on the home page and add a new tip.

- [ ] Open `app/page.tsx`.
- [ ] Find the `<ul>` element with the "Search tips" list (around line 212).
- [ ] Add a new `<li>` item with your tip.
- [ ] Save the file. The browser should hot-reload and show your change instantly (no need to restart `npm run dev`).

### Day 5 — Make your first commit

- [ ] Check what you changed: `git status` and `git diff`
- [ ] Stage your change: `git add app/page.tsx`
- [ ] Write a commit message: `git commit -m "docs: add search tip to home page sidebar"`
- [ ] Push to your branch: `git push origin your-branch-name`
- [ ] Open a pull request for review

---

## 10. Common Mistakes & Gotchas

Here are the traps that are easy to fall into in this specific project. Learn from others' pain.

---

### 1. Forgetting `"use client"` on a component that uses `useState` or `useEffect`

**What happens:** You write a component that calls `useState(...)`, but don't put `"use client"` at the top. Next.js tries to render it on the server (where there's no browser state), and crashes with a confusing error like: *"You're importing a component that needs useState. It only works in a Client Component..."*

**How to avoid it:** Any component that uses `useState`, `useEffect`, event handlers (like `onClick`), or browser APIs (like `window` or `localStorage`) must have `"use client"` as the very first line of the file. No exceptions.

---

### 2. Using server-only environment variables on the client

**What happens:** You try to use `process.env.SUPABASE_ANON_KEY` (without `NEXT_PUBLIC_`) inside a component marked `"use client"`. It always evaluates to `undefined` in the browser, because Next.js only exposes `NEXT_PUBLIC_` variables to client code.

**How to avoid it:** 
- Variables that start with `NEXT_PUBLIC_` are available in the browser and on the server.
- Variables *without* `NEXT_PUBLIC_` are *only* available on the server (in API routes and server components).
- Never put `NEXT_PUBLIC_` on a variable that contains secrets — it'll be visible in the browser's source code.

---

### 3. Calling an admin API route without the Bearer token

**What happens:** You fetch `/api/admin/something` from the browser but forget to include the `Authorization: Bearer <token>` header. The server calls `getAdminFromRequest()`, gets `null` back, and returns a 401 Unauthorized response. Your UI gets an error that's hard to debug if you don't know where to look.

**How to avoid it:** Look at `app/admin/layout.tsx` — specifically how it gets the session token and passes it as a header. Every admin API call must follow the same pattern:

```typescript
// First, get the Supabase browser client and read the session:
const supabase = getSupabaseBrowserClient();
const { data: { session } } = await supabase.auth.getSession();

// Then pass the token in the Authorization header of every admin fetch:
const res = await fetch("/api/admin/something", {
  headers: { Authorization: `Bearer ${session.access_token}` },
});
```

---

### 4. Editing the wrong Supabase client file

**What happens:** You're debugging a database issue and you edit `lib/supabase-browser.ts` to log something — but the failing code is in an API route that uses `lib/supabase-server.ts`. Nothing shows up. You spend an hour confused.

**How to avoid it:** Remember there are *two* Supabase client files:
- `lib/supabase-server.ts` → used in `app/api/**` (server-side API routes)
- `lib/supabase-browser.ts` → used in React components for auth (browser-side)

If you're debugging an API route, check `supabase-server.ts`. If you're debugging auth in a component, check `supabase-browser.ts`.

---

### 5. Adding a new data shape without updating `lib/types.ts`

**What happens:** You add a new API route that returns a new kind of object. You define the TypeScript type inline inside the route file. Later, someone else tries to use that data in a component, can't find the type, and either duplicates it or skips typing altogether. Over time, the codebase gets inconsistent types everywhere.

**How to avoid it:** All shared data types go in `lib/types.ts`. If your new type is only used inside one single file and nowhere else, it's okay to define it locally. But the moment two files need to know about a data shape, it belongs in `lib/types.ts`.

---

### 6. Changing the database schema without adding a migration

**What happens:** You connect to the Supabase dashboard and manually add a column to a table. Everything works on your machine. When someone else runs `supabase db reset`, their database doesn't have your column — their app crashes. You've created a "works on my machine" situation.

**How to avoid it:** All database changes must go through SQL migration files in `../supabase/migrations/`. Never use the Supabase dashboard to make structural changes to the database. Write a new `.sql` file, apply it with `supabase db reset` or `supabase migration up`, and commit the file.

---

### 7. Importing from `@/lib/supabase-browser` inside a server component or API route

**What happens:** The file starts with `"use client"` — it's explicitly marked as browser-only code. If Next.js tries to bundle it for the server, it can cause build errors or unexpected `null` returns (the function returns `null` when `typeof window === "undefined"`).

**How to avoid it:** The rule of thumb is:
- **Server code** (API routes, server components) → use `lib/supabase-server.ts`
- **Client code** (components with `"use client"`) → use `lib/supabase-browser.ts`

Never cross-import between them.

---

### 8. Hardcoding a class name that looks styled but is actually overridden by the theme system

**What happens:** You write `className="bg-white text-zinc-950"` expecting a white card with dark text. In default mode it looks fine. But when a user switches to the "Forest Charcoal" theme, `app/globals.css` overrides `bg-white` with a different colour via `[data-theme] .bg-white { background-color: var(--theme-surface); }`. Your card doesn't look how you expected on non-default themes.

**How to avoid it:** Understand that the theme system in `app/globals.css` intercepts many standard Tailwind colours (`bg-white`, `bg-zinc-50`, `text-zinc-950`, etc.) and remaps them to CSS variables. This is intentional — it's how theming works. Before assuming a colour class does exactly what it says, check if it's in the `[data-theme]` overrides section of `globals.css`. If you need a colour that definitely won't be overridden by the theme system, use a `style` prop with a hardcoded hex value (but only for things that genuinely should be theme-independent).

---

## 11. Business Portal Architecture (Planned — Slice 50)

The Business Portal is a new product surface for landlords and property managers, built as a `/portal/*` route group within the existing Next.js app.

### Route group and layout

The portal lives under `app/portal/` with its own `layout.tsx` that provides:
- A sidebar navigation (collapsible to a drawer on mobile)
- Auth gating: only users with `profiles.role = 'landlord'` or `profiles.role = 'admin'` can access portal pages
- A `portalFetch` helper (analogous to `adminFetch`) that attaches the user's Bearer token to all portal API requests

### Portal pages (planned)

| Route | Purpose |
|-------|---------|
| `/portal` | Portfolio dashboard — property cards with trust scores, review counts, trend indicators |
| `/portal/reviews` | Review feed — filterable by property, date, rating; response drafting |
| `/portal/moderation` | Flagged reviews within the landlord's portfolio |
| `/portal/performance` | Category performance analytics (Recharts charts) |
| `/portal/benchmarks` | Benchmark comparison against city/neighbourhood averages |
| `/portal/signals` | Renter sentiment trends and common themes |
| `/portal/alerts` | Review gap alerts with tenant invite link generation |
| `/portal/team` | Team management — invite, role assignment (viewer/editor/admin), removal |
| `/portal/profile` | Company profile management |
| `/portal/settings` | Notification preferences |

### Auth pattern

The landlord auth pattern mirrors the existing admin pattern:

1. `app/portal/layout.tsx` calls `getSupabaseBrowserClient()` to get the session
2. Sends the access token to `GET /api/portal/me` (or equivalent)
3. Server-side: `getLandlordFromRequest()` verifies the token and checks for `landlord` or `admin` role
4. If the check passes, the portal layout renders; otherwise, it shows an access-denied screen

### Data scoping

All portal data is **portfolio-scoped**. The `portfolio_properties` table links landlords to the properties they manage. Every portal query filters through this table — a landlord can only see properties, reviews, aggregates, and insights for properties in their portfolio.

Team members (via `team_members`) inherit the landlord's portfolio scope with role-based permissions (viewer, editor, admin).

### API routes (planned)

All portal API routes live under `app/api/portal/`:
- `GET /api/portal/properties` — portfolio property list
- `GET /api/portal/properties/[id]/analytics` — funnel metrics + category performance
- `GET /api/portal/properties/[id]/reviews` — reviews for a specific property
- `GET /api/portal/benchmarks` — city/neighbourhood averages
- `GET /api/portal/signals` — renter sentiment trends
- `POST /api/portal/reviews/[id]/respond` — draft a response to a review

---

## 12. Consumer UX Expansion (Planned — Slice 50)

Slice 50 adds several new consumer-facing features to the existing public app.

### New routes

| Route | Purpose |
|-------|---------|
| `/neighbourhoods` | Grid of neighbourhood cards with property counts and average trust scores |
| `/neighbourhoods/[id]` | Neighbourhood detail with featured properties and area statistics |
| `/comparison` | Side-by-side comparison of up to 3 properties across all five trust metrics |
| `/dashboard` | Auth-gated renter dashboard showing submitted reviews and shortlisted properties |

### New components

- **TrustScoreBadge** — visual trust score display with category breakdowns and confidence indicators based on review count
- **CategoryScoreBar** — horizontal bar showing a single metric score with label

### Shortlist functionality

Signed-in users can bookmark/shortlist properties:
- Heart/bookmark button on `PropertyCard` components
- Persisted in the `user_shortlists` table via `POST /api/user/shortlist`
- Displayed on the renter `/dashboard`
- Uses optimistic UI updates with error rollback

### New API routes

- `GET /api/neighbourhoods` — public neighbourhood list
- `GET /api/neighbourhoods/[id]` — neighbourhood detail with properties
- `POST /api/user/shortlist` — add/remove shortlisted property
- `GET /api/user/shortlist` — get user's shortlist

---

That's it! You now have a full map of how this project works. Don't worry if it feels like a lot — no one memorizes all of this at once. Bookmark this file and come back to the relevant sections when you get stuck. And if something isn't explained here, ask the team. Good luck, and welcome aboard! 🎉
