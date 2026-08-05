# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: residents of Naas, County Kildare, Ireland — all ages.** The defining situation is a short, low-commitment check: someone on a phone, often mid-day or mid-week, asking "is anything on today?" or "what's on this weekend?" They are not planning a trip and not researching — they are scanning. They leave as soon as they have an answer, and a good visit can last fifteen seconds.

A recurring sub-case: **parents looking for something to do with children**, filtering for kids' events and free events specifically.

Explicitly **not** the audience: tourists and visitors, and event organisers looking for a marketing channel. Organisers interact with the site (see Operating Context) but the site is not built to serve their promotional goals.

Age range is genuinely wide and skews older than a typical web product. Usability for less tech-confident and older residents is a confirmed constraint, not an aspiration — see Accessibility & Inclusion.

## Product Purpose

Naas Today answers one question — *what's happening in Naas today?* — without the visitor having to check several places.

Events for the town are scattered across individual Facebook pages, venue websites, the library's RSS feed, ticketing platforms, and newsletters. No single place holds them. The product's job is to collapse that scatter into one scannable daily list.

**Success is being a low-maintenance public good.** The measure is that the site stays genuinely useful to the town while staying cheap and light to run. Growth targets, engagement metrics, and revenue are not the goal. This is a durable strategic fact, not a phase: work that makes the site more useful at the cost of substantially more ongoing operator effort is usually the wrong trade.

## Positioning

The specificity is the position. Naas Today covers one town, curates it, and moderates it — where the alternatives are either too broad (Eventbrite, AllEvents.in, IntoKildare cover the county or the country and bury Naas in noise) or too fragmented (individual Facebook pages, each holding one venue's events).

A general aggregator cannot truthfully claim this, because the value comes from a human deciding what belongs to Naas and what does not. Every event is moderated before publication; nothing appears automatically.

## Operating Context

**How events reach the site (three paths, all converging on a moderation queue):**

1. **Automated scraping** — `scripts/scrape-sources.js` pulls from a maintained URL list in `event-sources.md` (Eventbrite, AllEvents.in, WhatsonTonight.ie, IntoKildare.ie, Moat Theatre). `scripts/pull-library-events.js` pulls the Naas Library RSS feed.
2. **Community submission** — a public form on the site, including a recurring-series option (weekly/fortnightly/monthly).
3. **Bulk CSV import** — `scripts/import-events.js`, operator-run.

Everything lands as `pending`. The operator approves or rejects via a password-protected admin page. Nothing is published unmoderated.

**Today the supply is mostly operator-driven** — scrapers plus manual curation, with the public submit form used comparatively little. **Shifting that balance toward community submission is an explicit goal.** This is the central product tension and future work should be read against it: more community submission is wanted *because* it should reduce operator effort, so any change that grows submissions while growing the moderation burden proportionally has not actually helped. Submission quality and moderation speed matter as much as submission volume.

**Operator rituals:** approving the queue via `/admin.html`; running the scrapers; generating a weekly social post (`scripts/weekly-post.js`) that summarises the coming week and copies it to the clipboard for posting elsewhere.

**Distribution is partly off-site.** The weekly social post means some of the product's reach happens on other platforms, pointing back.

## Capabilities and Constraints

**Confirmed capabilities**
- Browse approved events for a chosen date; move day by day or jump to a date.
- Filter by all six categories — free, kids, music, sport, markets, theatre. Filters combine, persist to the URL as a `filters` parameter (so a filtered view is shareable), and each button shows a live count of matching events for the current day, dropping the count when none match.
- Submit a single event, or a recurring series stored as separate occurrences sharing a `recurring_group_id`.
- Operator moderation: list, approve, reject, edit, delete, including bulk operations across a recurring series from a given date forward.
- Multi-day events (`end_date`), all-day events (`is_all_day`), optional end times, optional event URL.
- A terms page.

**Technical constraints that shape design**
- Astro static output (SSG) on Netlify. Approved events are fetched at **build time** and pre-rendered for SEO, then re-rendered client-side on load. Content freshness therefore depends on either a rebuild or the client-side fetch — this is a real constraint on anything that assumes live data in the initial HTML.
- Backend is Netlify serverless functions calling the Supabase REST API directly. No Supabase client library.
- Dependency list is deliberately three packages. Tests use Node's built-in runner; no test framework is to be added. **Restraint about dependencies is a standing project value**, not an accident, and follows from the low-maintenance goal.
- A CSP is enforced via `netlify.toml`. Umami Cloud is the only allowed analytics origin.
- Locale is `en_IE`. Dates are handled in local time, never UTC.

**Explicitly undecided — do not assume either way**
- **Monetisation.** No ads, sponsored placement, or paid promotion exist today, and none are planned, but the operator has not ruled them out as a permanent commitment. Do not design as though sponsored slots are coming, and do not state anywhere that the site will never carry them.
- Whether the six categories are the right set, and whether events should carry more than one. Nothing about adding or retiring a category is settled.

## Brand Commitments

- **Name:** Naas Today. **Domain:** naastoday.com. **Contact:** hello@naastoday.com.
- **Voice:** first-person, plain, warm, unpolished in a deliberate way. The existing About copy — *"Hi! Naas Today was created to solve a simple problem: it's hard to know what's happening around town"* — is the reference register. Not corporate, not markety, not chirpy.
- **Personality:** local, warm, practical. A community noticeboard that got a tasteful upgrade.
- **Binding visual constraints already in force:** forest green `#2d5a2d` as the brand anchor; warm beige/linen backgrounds; Georgia for headings, system UI stack for body, DM Mono for times and tags; **light mode only**.
- **Anti-references** the operator has already ruled out: purple gradients and SaaS hero patterns; Facebook Events clutter; Airbnb-style aspirational photography; the generic Eventbrite grid.

Design system detail beyond these commitments lives in the code and in `docs/superpowers/specs/`, not here.

## Evidence on Hand

- **Real event data** in Supabase — genuine Naas events with real titles, venues, dates. Never fabricate sample events that read as real listings.
- **Real source list** — `event-sources.md`, the actual scraper input.
- **Prior design records** — `docs/superpowers/specs/` and `docs/superpowers/plans/` hold the 2026-03-24 UI/UX overhaul, the 2026-03-25 layout and event-card redesigns, and the 2026-04-02 terms page.
- **Analytics** via Umami Cloud exist, but no traffic figures have been shared.

**Absences future work must not fill by invention:** no testimonials, no user research, no traffic or usage numbers, no press, no partnership or endorsement from any venue, business, or Kildare County Council body, no logo asset beyond the wordmark treatment in the header. Do not imply official or council backing — the site is independent.

## Product Principles

1. **Answer in one glance, then get out of the way.** The visit is short by design. Anything that delays the answer — interstitials, onboarding, promotional blocks above the listings — works against the product.
2. **Low maintenance is a design constraint, not just an ops preference.** Prefer solutions that survive neglect. A feature that needs weekly operator attention costs more than it looks.
3. **Grow submissions by lowering friction on both sides.** The goal is more community-supplied events *and* less operator work. Submission ease and moderation ease are one problem, not two.
4. **Rooted in Naas.** The product's credibility comes from being unmistakably about one town. Generic-aggregator patterns dilute the only thing that cannot be copied.
5. **Moderated, therefore trustworthy.** Nothing publishes itself. Anything that appears on the site carries an implicit human endorsement, and the design should not undermine that by making unvetted content look published.

## Accessibility & Inclusion

- **WCAG AA is the floor**, particularly contrast — the audience skews older.
- **Confirmed constraint: the site must work for older and less tech-confident residents.** In practice: generous touch targets, plain language over cleverness, no gesture-only interactions, no essential action reachable only by hover, and no reliance on an unlabelled icon carrying meaning alone.
- Mobile-first. The primary device is a phone, and small-screen scanning is the case that must work before any other.
- Light mode only is a deliberate decision, not an omission.

## Durable Constraints

Confirmed by the operator as things future work must preserve:

- **Naas-specific, not regional.** Not a Kildare-wide or Ireland-wide aggregator, even though several scraper sources cover the whole county. County-level content is filtered *down* to Naas relevance, never allowed to broaden the product.
- **Free both ways.** Free to browse and free to submit. No paywall, no listing fee. (Distinct from the open advertising question above.)
- **Usable by older residents.** See Accessibility & Inclusion.
