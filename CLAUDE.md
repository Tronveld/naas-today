# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Naas Today is a community events web app for Naas, County Kildare, Ireland. It uses Astro for build-time pre-rendering (SSG) deployed on Netlify, with serverless Node.js functions as the backend. Data is stored in Supabase (PostgreSQL).

## Development

The project uses Astro as the build tool. To preview locally with Netlify Functions support:

```bash
netlify dev
```

This runs the Astro build/dev server and proxies Netlify Functions, reads `.env` for environment variables, and serves the site at `localhost:8888`.

To run just the Astro dev server (no functions):

```bash
npm run dev
```

This serves the site at `localhost:4321`.

Required environment variables (set in Netlify dashboard, or a local `.env` file):

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SECRET_KEY=<service_role or secret key>   # used by admin functions only
```

`SUPABASE_SECRET_KEY` is the Supabase service-role (or secret) key — it bypasses Row Level Security and is only used server-side by the protected admin functions. Never expose it to the browser.

## Workflow

After completing any bug fix or feature addition, run `netlify dev` so the user can verify the result at `localhost:8888`.

## Architecture

### Frontend — `src/` (Astro) and `public/admin.html`

The public-facing site is built with Astro (static output). The build fetches approved events from Supabase at build time and pre-renders event cards into HTML for SEO. Client-side JS then re-renders dynamically on load.

**Source structure:**
```
src/
  layouts/BaseLayout.astro   — <html> shell, all CSS (global), meta/OG tags, Umami analytics
  components/
    Header.astro             — logo, site title, feedback button
    DateNav.astro            — date display + prev/today/change/next buttons
    FilterControls.astro     — free/kids filter buttons + submit event button
    EventCard.astro          — single event card (accepts raw Supabase row as prop)
    EventsGrid.astro         — grid of EventCards + empty/loading/error state divs
    Footer.astro             — copyright + about/contact/submit links
    modals/
      DatePickerModal.astro
      SubmitEventModal.astro
      FeedbackModal.astro
      AboutModal.astro
      ContactModal.astro
  pages/
    index.astro              — fetches events at build time, assembles all components, embeds client JS
public/
  admin.html                 — password-protected admin interface (static, no build step)
  robots.txt
```

**`src/pages/index.astro`** — Key sections:
- Frontmatter fetches approved events from Supabase at build time; pre-renders `EventsGrid` with today's events; emits JSON-LD structured data.
- `<script define:vars={{ initialEvents }}>` exposes build-time events as `window.__INITIAL_EVENTS__`.
- Client-side `<script>` block contains all interactive JS (identical logic to the old `index.html`):
  - **`localDateStr(date)`** — converts a JS Date to `YYYY-MM-DD` in local time (not UTC). Always use this instead of `toISOString()` for date comparisons.
  - **`fetchEvents()`** — calls `/.netlify/functions/get-events`; skips loading spinner if pre-rendered events are already visible.
  - **`renderEvents()`** — filters `events` array by `currentDate`, active filters, then calls `createEventCard()` per event.
  - **`createEventCard(event)`** — builds event cards using DOM methods (`textContent` only — never `innerHTML` with user data).
  - **Modal system** — `openModal(id)` / `closeModal(id)` manage focus, ARIA, and a per-modal Tab key trap stored on `modal._trapHandler`.

`public/admin.html` — password-protected admin interface. On load it calls `admin-auth` with `check_setup` to determine whether to show the first-time setup form or the login form. Once authenticated, it calls `admin-events` to list, approve/reject, edit, or delete events. The password is stored only in `sessionStorage` (cleared on tab close) and sent via the `x-admin-password` header on every admin API request.

### Backend — `netlify/functions/`

| File | Method | Purpose |
|---|---|---|
| `get-events.js` | GET | Queries Supabase for `status = 'approved'` events, returns JSON |
| `submit-event.js` | POST | Inserts a new event with `status = 'pending'`; rate-limited (5/IP/hour) |
| `submit-recurring.js` | POST | Submits a recurring event series (weekly/fortnightly/monthly); each occurrence stored as a separate row sharing a `recurring_group_id`; rate-limited (5/IP/hour) |
| `submit-feedback.js` | POST | Forwards feedback to an optional `FEEDBACK_WEBHOOK_URL` |
| `admin-auth.js` | POST | First-time setup + login. Actions: `check_setup`, `setup`, `login`. Rate-limited (10/IP/15 min) |
| `admin-events.js` | GET / PATCH / DELETE | Protected event management. Requires `x-admin-password` header on every call. Supports bulk update/delete of recurring event groups from a given date forward |

All functions use the Supabase REST API directly (`fetch` to `/rest/v1/`) — no Supabase client library.

**Admin authentication**: passwords are hashed with PBKDF2-SHA256 (310,000 iterations, OWASP 2023 recommendation) and stored in the `admin_config` table. The password is re-verified on every `admin-events` request (stateless — no session tokens). Only whitelisted fields (`ALLOWED_PATCH_FIELDS`) can be updated via PATCH.

### Database — Supabase

Table: `events`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `title` | text | |
| `date` | date | `YYYY-MM-DD` |
| `time` | time | Returned as `HH:MM:SS` by Postgres — frontend trims to `HH:MM` |
| `location` | text | |
| `description` | text | |
| `end_date` | date | Optional end date for multi-day events |
| `time_end` | time | Optional end time; returned as `HH:MM:SS` by Postgres |
| `is_all_day` | boolean | When true, no time is required or shown |
| `is_free` | boolean | |
| `is_for_kids` | boolean | |
| `is_music` | boolean | Category filter flag; default `false` |
| `is_market` | boolean | Category filter flag; default `false` |
| `is_sport` | boolean | Category filter flag; default `false` |
| `is_theatre` | boolean | Category filter flag; default `false` |
| `url` | text | Optional event website URL |
| `status` | text | `'pending'` (submitted) or `'approved'` (visible on site) |
| `recurring_group_id` | uuid | Optional; shared by all occurrences in a recurring series |
| `created_at` | timestamptz | |

To approve a submitted event, change its `status` to `'approved'` — either in the Supabase Table Editor or via the admin panel at `/admin.html`. Events only appear on the public site when `status = 'approved'`.

#### `admin_config` table

| Column | Type | Notes |
|---|---|---|
| `id` | integer | Primary key (auto-increment) |
| `password_hash` | text | PBKDF2-SHA256 hex digest |
| `salt` | text | 32-byte random hex salt |
| `created_at` | timestamptz | |

This table must exist before `admin.html` can be used. Create it in Supabase with the columns above. Only one row should ever exist.

### Scripts — `scripts/`

Node.js utility scripts run locally (not deployed). All require Node.js 18+ and read `SUPABASE_URL` and `SUPABASE_SECRET_KEY` from `.env`.

#### `lib.js` — shared utilities

All scripts `require('./lib')`. Exports:

| Export | Description |
|---|---|
| `loadEnv()` | Loads `.env` from the repo root into `process.env` |
| `HTML_ENT` | Named HTML entity map used by `stripHtml` |
| `stripHtml(html)` | Strips tags and decodes HTML/numeric entities → plain text |
| `KIDS_RE` | Regex that matches common "for kids" signals in event text |
| `normaliseTitle(t)` | Lowercases and collapses punctuation spacing for fuzzy title comparison |
| `createClient(url, key)` | Returns `{ get, post, isDuplicate, cacheInserted }` bound to the given Supabase URL/key. `isDuplicate` caches per-date DB queries for the lifetime of the instance; call `cacheInserted(title, date)` after each successful insert to keep the cache consistent within a run. |

#### Script files

| File | Purpose |
|---|---|
| `pull-library-events.js` | Fetches upcoming events from the Naas Library RSS feed and imports them into Supabase as `pending` (use `--auto-approve` to insert as `approved` directly). Skips duplicates via fuzzy title matching. |
| `scrape-sources.js` | Fetches and extracts events from the URLs listed in `event-sources.md` (Eventbrite, AllEvents.in, WhatsonTonight.ie, IntoKildare.ie, Moat Theatre). Uses JSON-LD extraction for individual event pages and a shared `parseListingPage` helper for listing pages (configured per-site via options). Skips past events and duplicates. Flags: `--auto-approve`, `--dry-run`. |
| `weekly-post.js` | Generates a social media post for the upcoming week's approved events and copies it to the clipboard. Flags: `--list` (output raw JSON), `--select=id1,id2` (pin specific events). |
| `import-events.js` | Bulk-imports events from a CSV file into Supabase as `pending`. Usage: `node scripts/import-events.js <file.csv> [--dry-run]`. CSV must have a header row; required columns: `title`, `date` (`YYYY-MM-DD`), `location`. |
| `fix-library-entities.js` | One-time migration: decodes HTML entities in existing Naas Library event records stored in Supabase. |

## Deployment

Pushing to the connected branch auto-deploys via Netlify. The `netlify.toml` sets the build command (`npm run build`), publish directory (`dist`), functions directory, `esbuild` as the bundler, and security response headers (CSP, HSTS, X-Frame-Options, etc.).

Analytics are provided by Umami Cloud (`https://cloud.umami.is`), which is allowed in the CSP.
