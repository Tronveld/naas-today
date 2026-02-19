# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Naas Today is a community events web app for Naas, County Kildare, Ireland. It is a no-build, single-file frontend deployed on Netlify with two serverless Node.js functions as the backend. Data is stored in Supabase (PostgreSQL).

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
```

## Architecture

### Frontend — `index.html`
All HTML, CSS, and JavaScript live in a single file. There is no framework, bundler, or npm dependencies. Key JS sections (marked with `// ──` comments):
- **`localDateStr(date)`** — converts a JS Date to `YYYY-MM-DD` in local time (not UTC). Always use this instead of `toISOString()` for date comparisons.
- **`fetchEvents()`** — calls `/.netlify/functions/get-events`, maps the snake_case Supabase response to camelCase event objects, falls back to `SAMPLE_EVENTS` on any error or empty result.
- **`renderEvents()`** — filters `events` array by `currentDate`, active filters, then calls `createEventCard()` per event.
- **`createEventCard(event)`** — builds event cards using DOM methods (`textContent` only — never `innerHTML` with user data).
- **Modal system** — `openModal(id)` / `closeModal(id)` manage focus, ARIA, and a per-modal Tab key trap stored on `modal._trapHandler`.

### Backend — `netlify/functions/`

| File | Method | Purpose |
|---|---|---|
| `get-events.js` | GET | Queries Supabase for `status = 'approved'` events, returns JSON |
| `submit-event.js` | POST | Inserts a new event with `status = 'pending'` |
| `submit-feedback.js` | POST | Forwards feedback to an optional `FEEDBACK_WEBHOOK_URL` |

Functions use the Supabase REST API directly (`fetch` to `/rest/v1/events`) — no Supabase client library.

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
| `is_free` | boolean | |
| `is_kids_friendly` | boolean | |
| `status` | text | `'pending'` (submitted) or `'approved'` (visible on site) |
| `contact_email` | text | Optional organiser contact |
| `created_at` | timestamptz | |

To approve a submitted event, change its `status` to `'approved'` in the Supabase Table Editor. Events only appear on the site when `status = 'approved'`.

## Deployment

Pushing to the connected branch auto-deploys via Netlify. The `netlify.toml` sets the functions directory and `esbuild` as the bundler — no other build config is needed.
