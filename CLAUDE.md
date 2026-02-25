# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Naas Today is a community events web app for Naas, County Kildare, Ireland. It is a no-build frontend deployed on Netlify with serverless Node.js functions as the backend. Data is stored in Supabase (PostgreSQL).

## Development

There is no build step. To preview locally, use the Netlify CLI:

```bash
netlify dev
```

This starts a local server that emulates the Netlify Functions environment, reads `.env` (or `netlify.toml` env) for `SUPABASE_URL` and `SUPABASE_ANON_KEY`, and serves `index.html` at `localhost:8888`.

Required environment variables (set in Netlify dashboard, or a local `.env` file for `netlify dev`):

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SECRET_KEY=<service_role or secret key>   # used by admin functions only
```

`SUPABASE_SECRET_KEY` is the Supabase service-role (or secret) key — it bypasses Row Level Security and is only used server-side by the protected admin functions. Never expose it to the browser.

## Workflow

After completing any bug fix or feature addition, run `netlify dev` so the user can verify the result at `localhost:8888`.

## Architecture

### Frontend — `index.html` and `admin.html`
Both pages are standalone HTML files with all HTML, CSS, and JavaScript inline. There is no framework, bundler, or npm dependencies.

`index.html` — public-facing events listing. Key JS sections (marked with `// ──` comments):
- **`localDateStr(date)`** — converts a JS Date to `YYYY-MM-DD` in local time (not UTC). Always use this instead of `toISOString()` for date comparisons.
- **`fetchEvents()`** — calls `/.netlify/functions/get-events`, maps the snake_case Supabase response to camelCase event objects, falls back to `SAMPLE_EVENTS` on any error or empty result.
- **`renderEvents()`** — filters `events` array by `currentDate`, active filters, then calls `createEventCard()` per event.
- **`createEventCard(event)`** — builds event cards using DOM methods (`textContent` only — never `innerHTML` with user data).
- **Modal system** — `openModal(id)` / `closeModal(id)` manage focus, ARIA, and a per-modal Tab key trap stored on `modal._trapHandler`.

`admin.html` — password-protected admin interface. On load it calls `admin-auth` with `check_setup` to determine whether to show the first-time setup form or the login form. Once authenticated, it calls `admin-events` to list, approve/reject, edit, or delete events. The password is stored only in `sessionStorage` (cleared on tab close) and sent via the `x-admin-password` header on every admin API request.

### Backend — `netlify/functions/`

| File | Method | Purpose |
|---|---|---|
| `get-events.js` | GET | Queries Supabase for `status = 'approved'` events, returns JSON |
| `submit-event.js` | POST | Inserts a new event with `status = 'pending'`; rate-limited (5/IP/hour) |
| `submit-feedback.js` | POST | Forwards feedback to an optional `FEEDBACK_WEBHOOK_URL` |
| `admin-auth.js` | POST | First-time setup + login. Actions: `check_setup`, `setup`, `login`. Rate-limited (10/IP/15 min) |
| `admin-events.js` | GET / PATCH / DELETE | Protected event management. Requires `x-admin-password` header on every call |

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
| `url` | text | Optional event website URL |
| `status` | text | `'pending'` (submitted) or `'approved'` (visible on site) |
| `created_at` | timestamptz | |

To approve a submitted event, change its `status` to `'approved'` — either in the Supabase Table Editor or via the admin panel at `/admin.html`. Events only appear on the public site when `status = 'approved'`.

#### `admin_config` table

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `password_hash` | text | PBKDF2-SHA256 hex digest |
| `salt` | text | 32-byte random hex salt |

This table must exist before `admin.html` can be used. Create it in Supabase with the columns above. Only one row should ever exist.

## Deployment

Pushing to the connected branch auto-deploys via Netlify. The `netlify.toml` sets the functions directory, `esbuild` as the bundler, and security response headers (CSP, HSTS, X-Frame-Options, etc.) — no other build config is needed.

Analytics are provided by Umami Cloud (`https://cloud.umami.is`), which is allowed in the CSP.
