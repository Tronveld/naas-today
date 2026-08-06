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
  layouts/BaseLayout.astro   — <html> shell, all CSS (global), meta/OG tags, Umami analytics
  components/
    Header.astro             — logo, site title
    DateNav.astro            — date display + prev/today/change/next buttons
    FilterControls.astro     — scrolling row of six category filter buttons
                               (free, kids, music, sport, markets, theatre)
    EventCard.astro          — single event card (accepts raw Supabase row as prop)
    EventsGrid.astro         — grid of EventCards, empty/loading/error states,
                               and the submit-event area below the list
    Footer.astro             — copyright + about/contact/terms/submit links
    AppModals.astro          — About/Contact/Submit modals bundled with their own
                               copy of the modal JS (see the note below)
    modals/
      DatePickerModal.astro
      SubmitEventModal.astro
      AboutModal.astro
      ContactModal.astro
  pages/
    index.astro              — fetches events at build time, assembles all components, embeds client JS
    terms.astro              — static terms & disclaimer page (own scoped <style>)
public/
  admin.html                 — password-protected admin interface (static, no build step)
  robots.txt
```

**Note — the modal JS exists in two places.** `index.astro` imports the four modals individually and defines `openModal`/`closeModal`/`trapFocus` in its own client script. `terms.astro` imports `AppModals.astro`, which bundles three modals *plus a second TypeScript copy of the same logic*, because it does not load `index.astro`'s script. **A fix to the modal system in one file does not fix the other** — change both, or the About/Contact modals will behave differently on `/` and `/terms`.

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
| `admin-auth.js` | POST | First-time setup + login. Actions: `check_setup`, `setup`, `login`. Rate-limited (10/IP/15 min) |
| `admin-events.js` | GET / PATCH / DELETE | Protected event management. Requires `x-admin-password` header on every call. Supports bulk update/delete of recurring event groups from a given date forward. **`date` and `end_date` are stripped from both bulk paths** (`stripBulkImmutable`) — see below |

All functions use the Supabase REST API directly (`fetch` to `/rest/v1/`) — no Supabase client library.

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
| `setOutput(key, value)` | Appends `key=value` to `$GITHUB_OUTPUT`. No-op (returns `false`) when unset, i.e. everywhere but CI. |
| `reportInserted(count)` | `setOutput('inserted', count)`. Both fetchers call it so the workflow can decide whether a rebuild is worth 15 Netlify credits. Reports `0` on a dry run — nothing was written, so anything else would misstate it. |

#### Script files

| File | Purpose |
|---|---|
| `pull-library-events.js` | Fetches upcoming events from the Naas Library RSS feed and imports them into Supabase as `pending`. Skips duplicates via fuzzy title matching. Flags: `--auto-approve`, `--dry-run`. |
| `scrape-sources.js` | Fetches and extracts events from the URLs listed in `event-sources.md`. Three extraction paths: `JSON_ADAPTERS` for sources serving structured JSON from a separate endpoint (Moat Theatre and Kildare Heritage share one Squarespace adapter; IntoKildare has its own); JSON-LD extraction for pages that publish `Event` objects; and the `parseListingPage` helper for WhatsonTonight, the only remaining HTML scrape. **Prefer an adapter to a parser** — `parseListingPage` cannot extract a time at all, which is what left 81 Moat rows showing "TBC". Adapters map records into schema.org `Event` shapes so all three paths converge on the same `isNaasEvent` → `jsonLdToEvent` → duplicate-check → insert pipeline. Skips past events and duplicates. Exits non-zero if any source fails. Flags: `--auto-approve`, `--dry-run`. **Eventbrite was removed on 2026-08-05 — it blocks scrapers (`HTTP 405`) and its terms prohibit automated collection. Do not add it back;** see the "Removed sources" section of `event-sources.md`. See also the "Evaluated, not used" section there before researching new sources — 30+ candidates were probed on 2026-08-06. |
| `weekly-post.js` | Generates a social media post for the upcoming week's approved events and copies it to the clipboard. Flags: `--list` (output raw JSON), `--select=id1,id2` (pin specific events). |
| `import-events.js` | Bulk-imports events from a CSV file into Supabase as `pending`. Usage: `node scripts/import-events.js <file.csv> [--dry-run]`. CSV must have a header row; required columns: `title`, `date` (`YYYY-MM-DD`), `location`. |
| `check-deploy-budget.js` | **Read-only.** Counts production deploys in the trailing 30 days via the Netlify API and emits `allowed=true\|false` for the workflow's rebuild step. Env: `NETLIFY_AUTH_TOKEN` (optional), `NETLIFY_SITE_ID`, `REBUILD_CAP` (default 15). Fails **open** — no token, or an API error, warns and allows, because the "only rebuild when events arrived" gate is the primary control and a silently disabled rebuild is harder to notice than a warning. |
| `notify-pending.js` | Emails a reminder while any event is `status = 'pending'` (i.e. a human submission awaiting review). Sends nothing when the queue is empty. Exits non-zero if events are waiting but the mailer is unconfigured or the send fails — an undeliverable reminder must be loud. Flag: `--dry-run` (print the email instead of sending). Env: `RESEND_API_KEY`, `NOTIFY_EMAIL_TO`, optional `NOTIFY_EMAIL_FROM`. |
| `audit-event-dates.js` | **Read-only.** Checks every row already in `events` against the *current* validators, importing them from the live function rather than reimplementing them. Answers what tests cannot: whether rows inserted while a validator was wrong are still bad. Never writes to Supabase. **The backstop for auto-approved scraper output** — nobody reads those rows before they publish, so run this after any scraper change. |
| `fix-library-entities.js` | One-time migration: decodes HTML entities in existing Naas Library event records stored in Supabase. |
| `fix-moat-times.js` | One-time migration: backfills start/end times on Moat Theatre rows stored without one, reading them from the Squarespace feed. Matches on normalised title + date and never overwrites an existing time. Flag: `--dry-run`. Ran 2026-08-06: 77 of 81 fixed, 4 unmatched because Moat had renamed the show. |

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
- Both fetch steps retry three times with a backoff. The library RSS feed has been observed returning `503` transiently, and a blip should not read as a breakage.
- A step failure still turns the whole job red — silence is what caused the original problem, so a persistent break must be visible.
- Both scripts exit non-zero when *any* source errors, not only when the script itself crashes. A single rotting source therefore triggers the retry and, if it stays broken, turns the job red. Before this, `Errors: 1` in the summary still exited 0 and the run went green — the original silent failure one level down.
- Run it by hand from the Actions tab; the `dry_run` input previews without writing, skips the rebuild, and prints the email instead of sending it.

### Netlify credits — why the rebuild is conditional

**The free plan is 300 credits a month and a production deploy costs 15 of them, flat, regardless of build duration.** That is a hard ceiling of **20 production deploys a month**, out of a pool also drawn on by bandwidth (20/GB) and web requests (2 per 10k). Exhaust it and Netlify **pauses every project on the team** — visitors get "Site not available" until the next billing cycle. This is not a degraded-builds failure; the site goes dark.

A daily unconditional rebuild is 30 deploys — 450 credits — over budget before a single hand-pushed commit. So the rebuild step is gated twice:

1. **Only when events actually arrived.** Both fetchers report their insert count via `reportInserted`, and the step requires one of them to be above zero. Historically only 2–7 days a month bring new events, so this is the control that does the real work.
2. **A cap on total production deploys.** `check-deploy-budget.js` counts the trailing 30 days — including pushes to `main`, which cost the same 15 credits — and blocks past `REBUILD_CAP` (default 15, leaving headroom inside the 20).

A trailing 30-day window is used rather than the billing month because the team's cycle starts on the 14th, not the 1st, and guessing that boundary optimistically is what pauses the site.

**Known edge case, accepted.** The fetch steps retry up to three times. If attempt 1 inserts rows and then dies, attempt 2 sees them as duplicates and reports `inserted=0`, so no rebuild fires. Those events are still live for visitors — `fetchEvents()` reads `get-events` on every page load — and reach the static HTML on the next rebuild. It fails toward *fewer* deploys, which is the safe direction. The same applies to a submission approved by hand in the admin panel.

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

Three files at the repo root own design and product decisions. **Read them before changing UI; they outrank this section and the specs in `docs/superpowers/specs/`.**

| File | Owns |
|---|---|
| `PRODUCT.md` | Durable product truth — users, purpose, positioning, capabilities, constraints, and explicitly undecided facts. |
| `DESIGN.md` | The visual system — colour, type, layout, elevation, shape, and component tokens, with named rules. Frontmatter tokens are normative. |
| `.impeccable/design.json` | Sidecar extending DESIGN.md: tonal ramps, shadow/motion tokens, breakpoints, and renderable component snippets. |

The older specs in `docs/superpowers/specs/` are historical. The 2026-03-24 spec in particular describes a time-sidebar card layout and a brighter category palette that were **never shipped** — do not treat it as current.

A design detector runs on edit and flags any font-size, radius, or colour absent from DESIGN.md's frontmatter. When it fires, first check whether DESIGN.md is incomplete rather than assuming the CSS is wrong.

## Design Context

*Summary only — `PRODUCT.md` and `DESIGN.md` are authoritative where they disagree.*

### Users
Local residents of Naas, County Kildare, Ireland — all ages, checking what's happening today or this week. Primary use case: quick daily scan on mobile to find something to do. Secondary: parents filtering for kids/free events. Not tourists, not event organisers — just neighbours.

### Brand Personality
**Local, warm, practical.** Feels like a community noticeboard that got a tasteful upgrade. Approachable and no-nonsense. Should feel like it belongs to Naas specifically — not a white-label event aggregator.

### Aesthetic Direction
- **Visual tone**: Editorial warmth — newspaper meets community bulletin board. Not slick, not minimal-SaaS, not touristic.
- **Palette**: Forest green (#2d5a2d) as brand anchor, warm beige/linen backgrounds, DM Mono for timestamps — all intentional and Irish-feeling.
- **Typography**: Georgia serif for headings (editorial authority), system-ui for body (readable), DM Mono for time/tags (functional contrast).
- **Anti-references**: No purple gradients or SaaS hero metrics. No Facebook Events clutter. No Airbnb-style aspirational photography. No generic Eventbrite grid.
- **Theme**: Light mode only. Warm naturals, not clinical whites.

### Design Principles
1. **Utility first** — every element must make events easier to scan; no decorative elements that add noise.
2. **Rooted in place** — the design should feel unmistakably local, not generic; warmth over polish.
3. **Warm legibility** — typography and contrast prioritise readability for all ages (WCAG AA minimum).
4. **Quiet character** — personality through thoughtful details (font choices, colour warmth, small touches), not loud UI tricks.
5. **Mobile-first scanning** — cards must work at a glance on small screens; info hierarchy is paramount.
