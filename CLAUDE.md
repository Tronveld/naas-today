# CLAUDE.md

Naas Today is a community events site for Naas, County Kildare, Ireland: Astro static build on Netlify, Netlify Functions (Node) as the backend, Supabase (Postgres) for data.

## Develop

```bash
netlify dev      # Astro + functions + .env, at localhost:8888
npm run dev      # Astro only, no functions, at localhost:4321
npm test         # node --test over tests/
```

Env (Netlify dashboard or `.env`): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SECRET_KEY` — the service-role key, which bypasses RLS and is used only by server-side admin functions and `scripts/`. It stays out of the browser.

## Rules

- **Tests use `node:test` and `node:assert/strict` only** — the dependency list stays at three.
- After changing anything in `netlify/functions/`, run `npm test` and **show the output** in the reply. A change is done when that output is shown.
- Fixing a bug in a pure function: write the failing test, show it failing, then fix it.
- Helpers under test are exported from their file (Netlify only reads `handler`). Edge cases go in `tests/`.
- After a fix or feature: `npm test`, then `netlify dev` so the user can check `localhost:8888`.
- **One copy of each helper.** Search for an existing one before writing it; shared logic goes in the modules listed in [ADR 0001](docs/adr/0001-one-copy-of-each-helper.md). Duplicates are this project's most repeated defect.
- **Dates:** `YYYY-MM-DD` strings in Naas time. In the browser use `localDateStr()`; server-side `dublinToday()`; for arithmetic, UTC on the string (`lib/recurrence.js`). `toISOString()` on a local Date is the recurring off-by-one.
- **Cards are built with `textContent`**, never `innerHTML` with user data.
- Run one-shot migrations, then delete them; git keeps them.
- Before any UI change, read `PRODUCT.md`, `DESIGN.md` and `.impeccable/design.json` — they own product and design decisions. A design detector flags font sizes, radii and colours missing from DESIGN.md's frontmatter; when it fires, first check whether DESIGN.md is incomplete.

## Map

```
src/
  layouts/BaseLayout.astro   <html> shell, all global CSS, meta/OG, Umami, and the
                             direction contract comment opening <body> (must survive the build)
  components/
    Band.astro               green band: brand, date, the day's answer, "Next in Naas" when
                             empty. Sized by its answer (is-xl / is-lg / is-sm). Brand-only on /terms
    WeekStrip.astro          seven days from today with counts, plus a Later slot that opens
                             the date picker — the whole date navigation
    EventsGrid / EventCard   pre-rendered cards (EventCard takes a raw Supabase row)
    FilterControls.astro     not rendered: gated on FILTERS_ENABLED (false) in flags.js
    Footer.astro             about/contact/terms/submit
    AppModals.astro          modals for pages other than index
  scripts/
    date.js                  formatting, the day's phrasing (dayAnswer, nextPhrase…), isOnDay
    modal-form.js, draft.js  modal system + submit form + draft persistence, shared by all pages
    flags.js                 FILTERS_ENABLED, DESCRIPTION_CLAMP — read by frontmatter and client
  pages/index.astro          build-time fetch + all client JS; pages/terms.astro static
public/admin.html            admin panel, no build step
netlify/functions/           one file = one endpoint; shared code in lib/ (see ADR 0001)
scripts/                     local Node scripts; shared helpers in scripts/lib.js
docs/adr/                    decisions and the incidents behind them
```

### `index.astro`

- Frontmatter fetches `approvedEventsQuery(dublinToday())`, pre-renders today, emits JSON-LD, and exposes the events as `window.__INITIAL_EVENTS__`.
- The client script renders once from those events **before** `get-events` returns, because the static HTML is always today and a `?date=` link must not show today's cards under another day's date.
- **Date navigation is `<a href="?date=…">` links** (strip cells, Coming up rows, "Next in Naas"), intercepted by one delegated handler that lets modified clicks through. They work with JS off. A past `?date=` is ignored ([ADR 0006](docs/adr/0006-past-days-are-not-viewable.md)).
- `FILTER_CHIPS` is dormant while `FILTERS_ENABLED` is false: the chip DOM code is gated and `?filters=` is neither read nor written.

### Functions

| File | Does |
|---|---|
| `get-events.js` | GET approved events that have not ended |
| `submit-event.js` | POST one event as `pending`, `source = 'submission'`; 5/IP/hour |
| `submit-recurring.js` | POST a weekly/fortnightly/monthly series (≤104 rows sharing `recurring_group_id`); 5/IP/hour |
| `admin-auth.js` | `check_setup`, `setup`, `login`; login 10/IP/15 min |
| `admin-events.js` | GET/PATCH/DELETE, password on every call; failed checks 10/IP/15 min. Only `ALLOWED_PATCH_FIELDS` are writable. **Bulk PATCH drops `date` and `end_date`** ([ADR 0003](docs/adr/0003-bulk-edits-never-carry-a-date.md)) |

All call Supabase REST directly with `fetch` — no client library. Rate limits are per warm instance, best effort ([ADR 0008](docs/adr/0008-admin-auth-and-rate-limits.md)).

## Database

`events`: `id` uuid · `title`, `location`, `description`, `url` text · `date`, `end_date` date · `time`, `time_end` time (Postgres returns `HH:MM:SS`; the frontend trims) · `is_all_day`, `is_free`, `is_for_kids`, `is_music`, `is_market`, `is_sport`, `is_theatre` boolean · `status` · `recurring_group_id` uuid · `source` text (null before 2026-08-05) · `created_at`.

Constraints: `status in ('pending','approved')`; `end_date is null or end_date >= date`. RLS: public reads `approved`; anon inserts only `status = 'pending' AND source = 'submission'`.

`admin_config`: one row of `password_hash`, `salt` (PBKDF2-SHA256).

**`pending` means a person wrote it** ([ADR 0002](docs/adr/0002-pending-means-a-person-wrote-it.md)):

| Writer | `source` | Lands as |
|---|---|---|
| `submit-event.js`, `submit-recurring.js` | `submission` | `pending` |
| `scrape-sources.js` (CI) | site hostname, e.g. `moattheatre.com` | `approved` |
| `pull-library-events.js` (local launchd) | `naas-library` | `approved` |
| `import-events.js` | `csv-import` | `pending` |

Events appear on the site only when `approved` — set it in the admin panel or the Supabase table editor.

## Scripts

| File | Purpose |
|---|---|
| `scrape-sources.js` | Sources from `event-sources.md` → `isNaasEvent` → `jsonLdToEvent` → duplicate check → insert. **Prefer a `JSON_ADAPTERS` entry to an HTML parser** — the HTML path cannot extract times. Category flags come from the source's own tags ([ADR 0007](docs/adr/0007-category-flags-come-from-the-source.md)). Read `event-sources.md`'s removed and evaluated sections before adding a source. |
| `pull-library-events.js` | Naas Library RSS. Runs from launchd, not CI ([ADR 0005](docs/adr/0005-fetchers-fail-loudly-and-retry-per-source.md)). |
| `notify-pending.js` | Daily email while a live submission is pending. |
| `audit-event-dates.js` | Read-only check of every stored row against the current validators. **Run after any scraper change** — auto-approved rows publish unread. |
| `check-deploy-budget.js` | Read-only deploy count for the rebuild gate. |
| `import-events.js`, `weekly-post.js` | CSV import; weekly social post. |

Fetchers take `--auto-approve` and `--dry-run`, and exit non-zero when any source errors. An importer using `createClient().isDuplicate` calls `cacheInserted(title, date)` after each insert, or the per-date cache misses rows written earlier in the same run.

## Schedule and deploy

`.github/workflows/scrape-events.yml`, daily 05:10 UTC: scrape → rebuild only if events arrived and the deploy cap allows → email pending submissions. Secrets: `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (required); `RESEND_API_KEY`, `NOTIFY_EMAIL_TO` (required once something is pending); `NETLIFY_BUILD_HOOK`, `NETLIFY_AUTH_TOKEN` (optional, warn and skip). Manual runs take a `dry_run` input.

**Pushing to `dev` is free** (branch deploy, `dev--naas-today.netlify.app`). **Pushing to `main` is a production deploy costing 15 of 300 monthly Netlify credits**; running out takes the site dark. Think about budget at `/merge-to-main` — [ADR 0004](docs/adr/0004-netlify-credit-budget.md).

## Agent skills

- Issues: GitHub issues in `Tronveld/naas-today` via `gh` — `docs/agents/issue-tracker.md`.
- Triage labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix` — `docs/agents/triage-labels.md`.
- Domain docs: single-context, `CONTEXT.md` and `docs/adr/` — `docs/agents/domain.md`.
