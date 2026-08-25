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

## Testing

```bash
npm test
```

Runs the Node built-in test runner (`node --test`) over `tests/`. No test framework is installed and none should be added — `node:test` and `node:assert/strict` ship with Node and keep the dependency list at three.

Rules:

- After changing anything in `netlify/functions/`, run `npm test` and **show the output** in the reply. Do not report a change as done or working without it.
- When fixing a bug in a validator or other pure function, write the failing test first, show it failing, then fix it. A test written after the fix proves much less.
- Pure helpers that need testing must be exported from their function file (see the test-only exports in `submit-event.js`). Netlify only uses the `handler` export, so adding others is safe.
- New edge cases belong in `tests/`, not in throwaway `curl` commands.

## Workflow

After completing any bug fix or feature addition, run `npm test`, then run `netlify dev` so the user can verify the result at `localhost:8888`. Tests first — they are faster and they catch the class of bug that looking at the page does not.

## Architecture

### Frontend — `src/` (Astro) and `public/admin.html`

The public-facing site is built with Astro (static output). The build fetches approved events from Supabase at build time and pre-renders event cards into HTML for SEO. Client-side JS then re-renders dynamically on load.

**Source structure:**
```
src/
  layouts/BaseLayout.astro   — <html> shell, all CSS (global), meta/OG tags, Umami
                               analytics, and the direction contract comment that
                               opens <body> (it must survive the production build)
  components/
    Band.astro               — the green band. Brand + date, then the day's answer
                               as a sentence, then "Next in Naas" when the day is
                               empty. **Sized by its own answer** via an is-xl /
                               is-lg / is-sm class. Called with no props by
                               /terms, where it is brand only
    WeekStrip.astro          — seven days from today with their real counts; this
                               is the whole of the date navigation. Sticky. Takes
                               all events so the counts are right pre-JS
    FilterControls.astro     — six category filter buttons. **Not rendered** —
                               index.astro gates it on FILTERS_ENABLED, which is
                               false. Left intact so the row is one boolean away
    EventCard.astro          — single event card (accepts raw Supabase row as prop)
    EventsGrid.astro         — grid of EventCards, plus loading/error states. Its
                               empty panel is now only for a *filter*-emptied day;
                               a genuinely empty day is answered by the band
    Footer.astro             — pick-a-date (day view only) + about/contact/terms/
                               submit links + copyright
    AppModals.astro          — About/Contact/Submit modals for pages that are not
                               index.astro; wires the shared script (see below)
    modals/
      DatePickerModal.astro
      SubmitEventModal.astro
      AboutModal.astro
      ContactModal.astro
  scripts/
    draft.js                 — submit-form draft persistence (sessionStorage)
    modal-form.js            — modal system + submit form, shared by index and AppModals
    date.js                  — shared date/time formatters **and the day's own
                               phrasing**: `dayAnswer`, `dayWordFor`, `nextPhrase`,
                               `clockLabel`, `timeRangeLabel`, `weekAhead`.
                               Everything the band and the strip say lives here
                               because Band.astro renders it and index.astro's
                               client script rewrites it on hydration — two
                               copies of one sentence is how this project got
                               "Tomorrow, 10:00 AM" above "10am" for the same
                               event on the same screen
    flags.js                 — FILTERS_ENABLED. Imported by both index.astro's
                               frontmatter and its client script, because Astro
                               compiles those separately and a shared module is
                               the only way one constant governs markup and
                               behaviour together
  pages/
    index.astro              — fetches events at build time, assembles all components, embeds client JS
    terms.astro              — static terms & disclaimer page (own scoped <style>)
public/
  admin.html                 — password-protected admin interface (static, no build step)
  robots.txt
```

**The modal system and the submit form live in `src/scripts/modal-form.js`**, shared by `index.astro` and `AppModals.astro` (which `/terms` uses). It exports `openModal`, `closeModal`, `initModals()` and `initSubmitForm({ defaultDate })`; `defaultDate` is the only thing that differs between the two callers — on `/` the day being viewed, on `/terms` today.

This used to be two copies, the second a TypeScript retype of the first, and CLAUDE.md carried a warning that fixing one did not fix the other. Two copies of a form that takes a 2000-character description is two chances to lose someone's typing. `src/scripts/draft.js` was already shared for the same reason — a draft started on `/` has to still be there on `/terms`.

**`src/pages/index.astro`** — Key sections:
- Frontmatter fetches approved events from Supabase at build time; pre-renders `EventsGrid` with today's events; emits JSON-LD structured data.
- `<script define:vars={{ initialEvents }}>` exposes build-time events as `window.__INITIAL_EVENTS__`.
- Client-side `<script>` block contains all interactive JS (identical logic to the old `index.html`):
  - **`localDateStr(date)`** — converts a JS Date to `YYYY-MM-DD` in local time (not UTC). Always use this instead of `toISOString()` for date comparisons.
  - **`fetchEvents()`** — calls `/.netlify/functions/get-events`; skips loading spinner if pre-rendered events are already visible.
  - **`renderEvents()`** — filters `events` array by `currentDate`, active filters, then calls `createEventCard()` per event.
  - **`createEventCard(event)`** — builds event cards using DOM methods (`textContent` only — never `innerHTML` with user data).
  - **`FILTER_CHIPS`** — the six category chips as one array carrying `id`, `slug`, `label`, `match` and `active`. The count badges, the toggle handlers, the `?filters=` round-trip and the filtering all read it; there is no separate per-filter variable. **Dormant while `FILTERS_ENABLED` is false:** the array and the AND loop stay, the three places that touch chip DOM are gated, and `?filters=` is neither written nor read — honouring an old link would drop a visitor into a filtered day with no visible control to undo it.
  - **`renderBand(n)`** — writes the day's answer (`Six things on Saturday.` / `Nothing on today.`), sets the band's size class, and fills or hides "Next in Naas". Counts the day, not the filtered result. `Band.astro` pre-renders the identical string from the same `date.js` helper.
  - **`renderWeekStrip()`** — rebuilds the seven day cells and their counts, marking the current day. Re-run on every render because a `get-events` refresh can change the counts.
  - **Date navigation is links, not buttons.** Every week-strip cell, every Coming up row and the band's "Next in Naas" is a real `<a href="?date=YYYY-MM-DD">`, and one delegated click handler intercepts them (letting modified clicks through so cmd-click still opens a tab). They therefore work with JS off, and `?date=` was already read on load. There is no prev/next/today button any more.
  - **The initial render happens before the fetch.** `renderEvents()` runs once from the build-time events as soon as the URL is read, because the pre-rendered HTML is always *today* — following a `?date=` link used to show the requested day's date above today's answer, today's strip marker and today's cards until `get-events` returned.
  - **Modal system** — imported from `src/scripts/modal-form.js`; `index.astro` calls `openModal`/`closeModal` directly only for the date picker, which now lives in the footer.

`public/admin.html` — password-protected admin interface. On load it calls `admin-auth` with `check_setup` to determine whether to show the first-time setup form or the login form. Once authenticated, it calls `admin-events` to list, approve/reject, edit, or delete events. The password is stored only in `sessionStorage` (cleared on tab close) and sent via the `x-admin-password` header on every admin API request.

### Backend — `netlify/functions/`

| File | Method | Purpose |
|---|---|---|
| `get-events.js` | GET | Queries Supabase for `status = 'approved'` events, returns JSON |
| `submit-event.js` | POST | Inserts a new event with `status = 'pending'`; rate-limited (5/IP/hour) |
| `submit-recurring.js` | POST | Submits a recurring event series (weekly/fortnightly/monthly); each occurrence stored as a separate row sharing a `recurring_group_id`; rate-limited (5/IP/hour) |
| `admin-auth.js` | POST | First-time setup + login. Actions: `check_setup`, `setup`, `login`. Rate-limited (10/IP/15 min) |
| `admin-events.js` | GET / PATCH / DELETE | Protected event management. Requires `x-admin-password` header on every call. Supports bulk update/delete of recurring event groups from a given date forward. **`date` and `end_date` are stripped from both bulk paths** (`stripBulkImmutable`) — see below |

All functions use the Supabase REST API directly (`fetch` to `/rest/v1/`) — no Supabase client library.

**Shared validation lives in `netlify/functions/lib/validate.js`** — `validDate`, `validTime`, `validUrl`, `json`, `err400` and `validateEventBody`. It is in a subdirectory because **Netlify deploys every top-level file in `netlify/functions/` as a function**; a `_validate.js` was tried first and `netlify dev` reported "Loaded function _validate", so the underscore convention does not apply. A subdirectory is only a function when it holds a file matching its own name, so `lib/` is invisible to the detector.

It exists because the three write paths each had their own `validDate` and they had drifted: submit-event checked month lengths and leap years while submit-recurring and admin-events range-checked the day `1..31` and stopped. `2026-02-31` was refused from the public form and **accepted from the recurring form** — the one that turns a single bad date into up to 104 rows. `tests/validator-parity.test.js` runs the same inputs through all three so a fourth fork fails loudly. `submit-event.js` and `submit-recurring.js` re-export the validators for those tests; `scripts/audit-event-dates.js` imports the module directly.

**Bulk edits never carry a date.** Both PATCH bulk paths (`ids` and `group_id`) apply one field object to many rows, so a `date` in it lands on every row and flattens a recurring series into a single day. That happened on the live site: editing one Naas Country Market occurrence with "this and all future events" collapsed 85 Friday occurrences onto 2026-08-07, and the site showed 85 copies of the same market on one date.

`stripBulkImmutable` drops `date` and `end_date` in bulk modes and returns them in the response as `ignored`. Dropped rather than rejected because `public/admin.html` always builds `date: editDate.value` into its fields object and passes it straight to `apiPatchGroup` — a 400 would make it impossible to bulk-edit a time or a category flag. Single-event edits are unaffected and can still change a date.

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
| `is_music` | boolean | Category filter flag; default `false`. Set from the source's own categories — see below |
| `is_market` | boolean | Category filter flag; default `false` |
| `is_sport` | boolean | Category filter flag; default `false` |
| `is_theatre` | boolean | Category filter flag; default `false` |
| `url` | text | Optional event website URL |
| `status` | text | `'pending'` (submitted) or `'approved'` (visible on site) |
| `recurring_group_id` | uuid | Optional; shared by all occurrences in a recurring series |
| `source` | text | Where the row came from — see below. Null on rows created before 2026-08-05 |
| `created_at` | timestamptz | |

#### `source` and what `pending` means

`source` records the origin of every row, because the admin queue used to mix two streams with very different trust levels and no way to tell them apart:

| Writer | `source` | Lands as |
|---|---|---|
| `submit-event.js`, `submit-recurring.js` | `submission` | `pending` |
| `scrape-sources.js` | the URL's hostname (`moattheatre.com`, `whatsontonight.ie`, `kildareheritage.com`, `intokildare.ie`, `whatsgoingon.ie`) | `approved` in CI |
| `pull-library-events.js` | `naas-library` | `approved` in CI |
| `import-events.js` | `csv-import` | `pending` |

The scheduled workflow passes `--auto-approve` to both fetchers, so **`status = 'pending'` now means "a person wrote this and it needs reading"**. That is what `notify-pending.js` relies on. Before this, ~88 scraped rows a week buried the ~1 human submission, and submissions sat unreviewed for weeks.

`source` is read-only: it is in the `admin-events` GET select list but deliberately **not** in `ALLOWED_PATCH_FIELDS`. It records what happened and should not be editable.

To approve a submitted event, change its `status` to `'approved'` — either in the Supabase Table Editor or via the admin panel at `/admin.html`. Events only appear on the public site when `status = 'approved'`.

#### Category flags come from the source, not from the text

`CATEGORY_FLAGS` in `scrape-sources.js` maps a source's own tags onto the six
filters: `Music` → `is_music`, `Drama`/`Theatre` → `is_theatre`,
`Family`/`Children`/`Kids` → `is_for_kids`, and so on. Both Moat Theatre
(Squarespace) and IntoKildare (The Events Calendar) publish tags; plain strings
and `{name}` objects are both accepted, and a trailing digit is stripped so
Moat's duplicated `Drama 2` lands on `drama`.

**When a source supplies categories they are trusted outright and `KIDS_RE` is
not consulted.** The regex over a full description gets Moat exactly backwards:
Chris Kent's adult stand-up blurb says "Between kids, marriage and…" and scores
true, while the children's panto — "The Panto Legends Return!" — scores false.
Moat tags them `Comedy` and `Children`/`Family`. Sources with no categories keep
the old text-matching behaviour.

Unmapped tags (`Comedy`, `Coming Soon`, `This Week`, `Christmas`, `Talks`) set
nothing. Comedy is deliberately not folded into theatre — stand-up is not a play.

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
| `exitCode({ sourceErrors, eventErrors })` | Returns `1` if either count is above zero, else `0`. Both fetchers set `process.exitCode` from it so a dead source fails the run instead of passing quietly. Finding nothing is deliberately **not** an error — an all-duplicates run is what a healthy second pull of the day looks like. |
| `sourceForUrl(url)` | Bare hostname for the `source` column (`www.` stripped, lowercased), or `null` if the URL will not parse. Never throws — the tag is diagnostic and must not cost the event. |
| `printSummary(title, counters, log)` | The titled bar + counter block + per-event detail lines all three importers end with. `counters` is an object so each caller keeps its own labels; a `log` entry with a `date` prints as an event, one with a `url` as a source. |
| `setOutput(key, value)` | Appends `key=value` to `$GITHUB_OUTPUT`. No-op (returns `false`) when unset, i.e. everywhere but CI. Both fetchers call `setOutput('inserted', n)` so the workflow can decide whether a rebuild is worth 15 Netlify credits. They report `0` on a dry run — nothing was written, so anything else would misstate it. |

#### Script files

| File | Purpose |
|---|---|
| `pull-library-events.js` | Fetches upcoming events from the Naas Library RSS feed and imports them into Supabase as `pending`. Skips duplicates via fuzzy title matching. Flags: `--auto-approve`, `--dry-run`. |
| `scrape-sources.js` | Fetches and extracts events from the URLs listed in `event-sources.md`. Three extraction paths: `JSON_ADAPTERS` for sources serving structured JSON from a separate endpoint (Moat Theatre and Kildare Heritage share one Squarespace adapter; IntoKildare has its own); JSON-LD extraction for pages that publish `Event` objects; and `parseWhatsonTonight` for WhatsonTonight, the only remaining HTML scrape. **Prefer an adapter to a parser** — the HTML path cannot extract a time at all, which is what left 81 Moat rows showing "TBC". Adapters map records into schema.org `Event` shapes so all three paths converge on the same `isNaasEvent` → `jsonLdToEvent` → duplicate-check → insert pipeline. Skips past events and duplicates. Exits non-zero if any source fails. Flags: `--auto-approve`, `--dry-run`. **Eventbrite was removed on 2026-08-05 — it blocks scrapers (`HTTP 405`) and its terms prohibit automated collection. Do not add it back;** see the "Removed sources" section of `event-sources.md`. See also the "Evaluated, not used" section there before researching new sources — 30+ candidates were probed on 2026-08-06. |
| `weekly-post.js` | Generates a social media post for the upcoming week's approved events and copies it to the clipboard. Flags: `--list` (output raw JSON), `--select=id1,id2` (pin specific events). |
| `import-events.js` | Bulk-imports events from a CSV file into Supabase as `pending`. Usage: `node scripts/import-events.js <file.csv> [--dry-run]`. CSV must have a header row; required columns: `title`, `date` (`YYYY-MM-DD`), `location`. |
| `check-deploy-budget.js` | **Read-only.** Counts production deploys in the trailing 30 days via the Netlify API and emits `allowed=true\|false` for the workflow's rebuild step. Env: `NETLIFY_AUTH_TOKEN` (optional), `NETLIFY_SITE_ID`, `REBUILD_CAP` (default 15). Fails **open** — no token, or an API error, warns and allows, because the "only rebuild when events arrived" gate is the primary control and a silently disabled rebuild is harder to notice than a warning. |
| `notify-pending.js` | Emails a reminder while any event is `status = 'pending'` (i.e. a human submission awaiting review). Sends nothing when the queue is empty. Exits non-zero if events are waiting but the mailer is unconfigured or the send fails — an undeliverable reminder must be loud. Flag: `--dry-run` (print the email instead of sending). Env: `RESEND_API_KEY`, `NOTIFY_EMAIL_TO`, optional `NOTIFY_EMAIL_FROM`. |
| `audit-event-dates.js` | **Read-only.** Checks every row already in `events` against the *current* validators, importing them from `netlify/functions/lib/validate.js` rather than reimplementing them. Answers what tests cannot: whether rows inserted while a validator was wrong are still bad. Never writes to Supabase. **The backstop for auto-approved scraper output** — nobody reads those rows before they publish, so run this after any scraper change. |

Two one-off migrations lived here and were deleted on 2026-08-06 once they had
run: `fix-library-entities.js` (decoded HTML entities in stored Naas Library
rows) and `fix-moat-times.js` (backfilled Moat Theatre start/end times from the
Squarespace feed — 77 of 81 fixed, 4 unmatched because Moat had renamed the
show). Recover either from git if a similar backfill is ever needed. **Do not
add new one-shot migrations to this table** — run them, then delete them.

## Scheduled fetching

`.github/workflows/scrape-events.yml` runs daily at 05:10 UTC and does three things: fetches both feeds, rebuilds the site, and emails about anything awaiting review. It exists because both scripts were manual and the library went five and a half weeks without a pull — the site quietly showed nothing on most weekdays, with no error to notice.

**Requires repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Value | Required? |
|---|---|---|
| `SUPABASE_URL` | Same as the local `.env` | Yes — the job fails on its first step without it |
| `SUPABASE_SECRET_KEY` | The service-role key | Yes — same |
| `RESEND_API_KEY` | Resend API key for the review reminder | Only when something is pending; the step then fails without it |
| `NOTIFY_EMAIL_TO` | Where the reminder goes | Same |
| `NETLIFY_BUILD_HOOK` | Build hook URL | No — the step warns and skips |
| `NETLIFY_AUTH_TOKEN` | Netlify personal access token, for reading the deploy count | No — the cap is skipped with a warning |

Notes:
- **The fetchers pass `--auto-approve`.** Their feeds are vetted and every row is date-validated, Naas-filtered and duplicate-checked before insert. This is a deliberate trust decision: a scraper bug now publishes to the live site with nobody in the loop. `scripts/audit-event-dates.js` is the read-only backstop — run it after any scraper change.
- Because of that, `status = 'pending'` means a human submission. `notify-pending.js` emails while any remain, every day until they are dealt with. The repetition is the point; a single email is what gets missed.
- The notify step runs even when a fetcher failed (`if: !cancelled()`) — a broken scrape is no reason to leave a waiting submission unmentioned. It is deliberately *not* `continue-on-error`: an undeliverable reminder must go red.
- **Retries are per source, inside the script** (`fetchWithRetry` in `scrape-sources.js`): three attempts with a 5s/10s backoff on any thrown error or non-OK status. The workflow runs the script once. It used to retry the whole run three times, which required all five sources healthy in the *same* attempt — on 2026-08-23 every source succeeded at some point and the job still went red, because a different one failed each time. whatsontonight.ie drops the connection from datacenter IPs and intokildare.ie returns `429`; a blip should not read as a breakage.
- A step failure still turns the whole job red — silence is what caused the original problem, so a persistent break must be visible.
- Both scripts exit non-zero when *any* source errors, not only when the script itself crashes. A single rotting source therefore triggers the retry and, if it stays broken, turns the job red. Before this, `Errors: 1` in the summary still exited 0 and the run went green — the original silent failure one level down.
- Run it by hand from the Actions tab; the `dry_run` input previews without writing, skips the rebuild, and prints the email instead of sending it.

### Netlify credits — why the rebuild is conditional

**The free plan is 300 credits a month and a production deploy costs 15 of them, flat, regardless of build duration.** That is a hard ceiling of **20 production deploys a month**, out of a pool also drawn on by bandwidth (20/GB) and web requests (2 per 10k). Exhaust it and Netlify **pauses every project on the team** — visitors get "Site not available" until the next billing cycle. This is not a degraded-builds failure; the site goes dark.

A daily unconditional rebuild is 30 deploys — 450 credits — over budget before a single hand-pushed commit. So the rebuild step is gated twice:

1. **Only when events actually arrived.** Both fetchers report their insert count via `setOutput('inserted', n)`, and the step requires one of them to be above zero. Historically only 2–7 days a month bring new events, so this is the control that does the real work.
2. **A cap on total production deploys.** `check-deploy-budget.js` counts the trailing 30 days — including pushes to `main`, which cost the same 15 credits — and blocks past `REBUILD_CAP` (default 15, leaving headroom inside the 20).

A trailing 30-day window is used rather than the billing month because the team's cycle starts on the 14th, not the 1st, and guessing that boundary optimistically is what pauses the site.

**Known edge case, accepted.** A submission approved by hand in the admin panel inserts nothing through the fetchers, so `inserted=0` and no rebuild fires. It is still live for visitors — `fetchEvents()` reads `get-events` on every page load — and reaches the static HTML on the next rebuild. It fails toward *fewer* deploys, which is the safe direction. (The old whole-run retry had a second version of this: attempt 1 inserting rows and then dying left attempt 2 reporting `inserted=0`. Per-source retry removed it — the script now runs once.)

Nothing here affects what visitors see. The rebuild only refreshes the pre-rendered HTML that first paint and SEO read.

## Deployment

Pushing auto-deploys via Netlify. The `netlify.toml` sets the build command (`npm run build`), publish directory (`dist`), functions directory, `esbuild` as the bundler, and security response headers (CSP, HSTS, X-Frame-Options, etc.).

**`main` is the production branch; `dev` is not.** `netlify.toml` carries no branch config — it lives in the Netlify dashboard, so the repo cannot tell you. Recording it here because it is not otherwise discoverable and the answer decides whether a push costs anything:

| Push to | Result | Credit cost |
|---|---|---|
| `main` | Production deploy → `naastoday.com` | 15 credits — counts against the ceiling below |
| `dev` | Branch deploy → `dev--naas-today.netlify.app` | **None.** Push freely. |

So day-to-day work on `dev` is free, and only the merge to `main` spends. That is what makes the `/merge-to-main` skill the moment to think about budget, not the individual commits.

Analytics are provided by Umami Cloud (`https://cloud.umami.is`), which is allowed in the CSP.

## Design authority

Three files at the repo root own design and product decisions. **Read them before changing UI; they outrank this section.**

| File | Owns |
|---|---|
| `PRODUCT.md` | Durable product truth — users, purpose, positioning, capabilities, constraints, and explicitly undecided facts. |
| `DESIGN.md` | The visual system — colour, type, layout, elevation, shape, and component tokens, with named rules. Frontmatter tokens are normative. |
| `.impeccable/design.json` | Sidecar extending DESIGN.md: tonal ramps, shadow/motion tokens, breakpoints, and renderable component snippets. |

`docs/superpowers/specs/` was deleted on 2026-08-06. Those three specs described a
time-sidebar card layout and a brighter category palette that were **never
shipped**, so every reader had to be warned off them. The plans in
`docs/superpowers/plans/` are kept: they record what was actually built.

A design detector runs on edit and flags any font-size, radius, or colour absent from DESIGN.md's frontmatter. When it fires, first check whether DESIGN.md is incomplete rather than assuming the CSS is wrong.

## Design Context

*Summary only — `PRODUCT.md` and `DESIGN.md` are authoritative where they disagree.*

### Users
Local residents of Naas, County Kildare, Ireland — all ages, checking what's happening today or this week. Primary use case: quick daily scan on mobile to find something to do. Secondary: parents filtering for kids/free events. Not tourists, not event organisers — just neighbours.

### Brand Personality
**Local, warm, practical.** Feels like a community noticeboard that got a tasteful upgrade. Approachable and no-nonsense. Should feel like it belongs to Naas specifically — not a white-label event aggregator.

### Aesthetic Direction
- **Visual tone**: Editorial warmth — newspaper meets community bulletin board. Not slick, not minimal-SaaS, not touristic.
- **Palette**: Hedgerow green (#186C42) as brand anchor, carried as a *field* that owns a whole region rather than as an accent; a near-white page; no category palette. Changed 2026-08-10 — see PRODUCT.md's Brand Commitments for what was released and why.
- **Typography**: The system UI stack, at every size, with `font-variant-numeric: tabular-nums` where figures align. **No webfont at all** — Georgia and DM Mono are both retired, which took two preconnects and a stylesheet off every page.
- **Anti-references**: No purple gradients or SaaS hero metrics. No Facebook Events clutter. No Airbnb-style aspirational photography. No generic Eventbrite grid.
- **Theme**: Light mode only. Warm naturals, not clinical whites.

### Design Principles
1. **Utility first** — every element must make events easier to scan; no decorative elements that add noise.
2. **Rooted in place** — the design should feel unmistakably local, not generic; warmth over polish.
3. **Warm legibility** — typography and contrast prioritise readability for all ages (WCAG AA minimum).
4. **Quiet character** — personality through thoughtful details (font choices, colour warmth, small touches), not loud UI tricks.
5. **Mobile-first scanning** — cards must work at a glance on small screens; info hierarchy is paramount.

## Agent skills

### Issue tracker

Issues live as GitHub issues in `Tronveld/naas-today`, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, each label string equal to its name (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — `CONTEXT.md` and `docs/adr/` at the repo root, created lazily when there is something to record. See `docs/agents/domain.md`.
