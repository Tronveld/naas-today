# Event sources

Input for `scripts/scrape-sources.js`. Any line starting with `http` is treated as
a source URL; everything else is ignored, so headings and notes are safe to add.

Keep URLs bare — no `?` query strings. Tracking parameters (`aff=`, `_gl=`) add
nothing for the scraper and can carry personal analytics identifiers.

## Prefer listing pages over individual event pages

**Listing pages endure; individual event pages rot.** A page for one event stops
returning anything once that event passes, and within a couple of months a list
of them yields nothing at all.

Measured on 2026-08-04: of 28 sources, 26 were individual event pages left over
from March and Easter. They produced **1 event between them**. The two listing
pages produced **86**. The individual pages have been removed.

Add a listing page for a venue or aggregator, not a link to tonight's gig.

## How each source is parsed

| Host | Method |
|---|---|
| `whatsontonight.ie` | Custom listing parser (`parseWhatsonTonight`) |
| `punchestown.com` | HTML adapter — fixture blocks, plus each fixture's page for the first-race time |
| `naasracecourse.com` | HTML adapter — month blocks with "Saturday 10th" rows |
| `lawlors.ie` | HTML adapter — `<h3>Title - date</h3>` headings |
| `ospreyhotel.ie` | HTML adapter — bold title, italic hand-written dates |
| `moattheatre.com` | JSON adapter — Squarespace `?format=json` → `upcoming[]` |
| `kildareheritage.com` | JSON adapter — same Squarespace feed, same code |
| `intokildare.ie` | JSON adapter — The Events Calendar REST API |
| anything else | JSON-LD extraction — works when the page publishes `Event` objects, including inside a schema.org `ItemList` |

A new host without JSON-LD needs an entry in `JSON_ADAPTERS` or, failing that,
`HTML_ADAPTERS` in `scrape-sources.js`. Checked on 2026-08-04: `allevents.in` and
`intokildare.ie` listing *pages* publish no usable JSON-LD `Event` data.

The two JSON adapters are the way around that. Both sources serve structured JSON
from a separate endpoint, so instead of parsing their pages, `JSON_ADAPTERS` in
`scrape-sources.js` maps their records into schema.org `Event` shapes and feeds
them to the same pipeline the JSON-LD sources use — the same Naas filter, the same
duplicate check, the same insert. Adding another JSON-backed source means writing
one mapper, not another script.

`HTML_ADAPTERS` does the same for four venues with no JSON at all: each parses
its one page into `Event` shapes and joins the same pipeline. They are the
fallback, not the pattern — a layout change breaks them quietly, returning no
events and a warning rather than an error. If a venue's count drops to zero, look
at its page before assuming it has nothing on.

Past events are skipped automatically. Duplicates are skipped by fuzzy title
match within a date.

## Listing pages

### Moat Theatre — the single biggest source

Read through the Squarespace JSON adapter since 2026-08-06. It was scraped with
`parseListingPage` before that, which **never recorded a time**: it reads
`<time datetime="…">` for the date, and Squarespace puts the date in that
attribute and the time in the element's text. 81 future rows had landed with
`time = null` and `is_all_day = false` — the combination `EventCard` renders as
"TBC". The times had been published all along. A one-off migration backfilled 77
of them on 2026-08-06; the remaining 4 never matched, because Moat had renamed
the show. The script was deleted once it had run — recover it from git if a
similar backfill is ever needed.

If another HTML source ever looks like it is missing times, check whether it is
Squarespace first — `?format=json` on any events collection is worth a try
before writing a parser.

https://www.moattheatre.com/shows

### WhatsOnTonight — Naas listings

https://whatsontonight.ie/events/Kildare/Naas

### Kildare Heritage

Squarespace events collection, read through its JSON adapter. The richest of the
three: it carries real start *and* end times, which the HTML listing parsers cannot
extract at all.

Measured 2026-08-06: 49 upcoming events, of which 28 fall Monday to Thursday. **That
midweek weighting does not survive the Naas filter**, though — 44 of the 49 are
elsewhere in the county, and of the 5 that remain only 1 is midweek. It is a good
source, but it is not the answer to the coverage gap below. Nothing found in the
2026-08-06 survey was.

https://www.kildareheritage.com/event-calendar

### IntoKildare — county tourism listings

Read through its JSON adapter, not its pages. Community and workshop listings here
are the nearest replacement for what Eventbrite used to reach.

https://intokildare.ie/events/

### What's Going On in Kildare

Publishes JSON-LD `Event` objects on its homepage, so it needs no adapter at all.

https://www.whatsgoingon.ie/

## Venue pages — HTML adapters

Surveyed and added 2026-09-25. Each was previously entered by hand or not at all.

### Punchestown Racecourse — fixtures

The 2026-08-06 survey dismissed it for having no API or JSON-LD, but the fixture
list is server-rendered in regular blocks, and each fixture's own page states the
first race ("First race 1.45pm", "around 12noon"), so these rows carry a time.
16 fixtures ahead on 2026-09-25, several midweek (Mon 9 Nov, Mon/Tue 18–19 Jan).
Punchestown has a Naas address and is already in `NAAS_VENUES`. The weekend pass,
listed as a "fixture" of its own, is skipped.

https://punchestown.com/fixtures/

### Naas Racecourse — fixtures

The date the 2026-08-06 survey could not read is split between a month block
("October 2026") and a row ("Saturday 10th"); the adapter joins them. Titles are
"Racing at Naas: {event}", the form the hand-entered rows already used, so the
duplicate check recognises most of them. The fixture pages publish no times.
Naas parkrun, also held here, is still listed nowhere machine-readable.

https://naasracecourse.com/fixtures/

### Lawlor's of Naas — ballroom shows

Each show is one `<h3>` of "Title - [Weekday] 25th October 2026" with its blurb
below. Only 3 shows ahead at the time, and the markup is pasted from Word, so this
is the most fragile source here. No times are published. The Friday and Saturday
bar music is mentioned only as prose with no acts named, so it is not listed.

https://www.lawlors.ie/live-music-events.html

### Osprey Hotel — events guide

Marketing prose with hand-written dates: "Saturday – 19th June 2026 / 15th August
2026 / 26th September / 13th November". The parser ignores weekdays (the page
called Friday 13 November a Saturday), skips dates with no day ("April, 2026"),
and gives a year-less date the last year written *above it* — never the next
occurrence — so a page left stale resolves to the past and drops out instead of
republishing a year on. Links go to the guide itself: its ticket links were wrong
at least once (a Bingo Loco date pointed at DAREcon).

https://www.ospreyhotel.ie/events-guide

## Removed sources

### Eventbrite — removed 2026-08-05

`https://www.eventbrite.ie/d/ireland--naas/events/` — **do not add back.**

It returned `HTTP 405 Not Allowed` on the first scheduled run, which is a
deliberate block rather than a fault: the method was refused outright before any
content was served. Eventbrite's terms prohibit automated collection, and a site
that answers that way is asking not to be scraped. Removed for that reason, not
the technical one — working around the block would be the wrong fix.

It was the only source reaching community classes, training and meetups, so its
removal widens the midweek gap below. Direct submission is the route back to
that material.

## Evaluated, not used

A survey on 2026-08-06 probed 30+ candidate sites directly for JSON-LD, REST APIs,
iCal and RSS. The three added above were the only ones with usable structured data.
The rest are recorded here so the same ground is not covered twice.

### Dead ends — do not re-try without new evidence

| Source | Why not |
|---|---|
| Naas GAA fixtures | No fixture data in the HTML at all, and no embedded widget. Rechecked 2026-09-25: the feed's only post is "Hello world!" from 2020 |
| Naas Parish | Runs The Events Calendar, but publishes **0** events |
| Kildare PPN | Same — plugin present, 0 events |
| `mytown.ie` | No event content in the page |
| `allevents.in` | Still no JSON-LD, confirming the 2026-08-04 finding. Rechecked 2026-09-25: `/naas` redirects to a generic search page |
| Leinster Leader / Kildare Live | HTTP 403 to scrapers |
| Bandsintown | HTTP 403; a Cloudflare challenge on 2026-09-25 |
| Songkick | HTTP 406 |
| Mondello Park | WordPress, but no events API and no JSON-LD |
| Hayden's Bar (2026-09-25) | Only weekly nights ("Friday: bring your own vinyl"); specifics are on Facebook |
| Fletcher's, 33 South Main (2026-09-25) | HTTP 403 to any fetch, identical from both — a hosting-level block |
| KildareNow (2026-09-25) | robots.txt disallows AI crawlers, behind a Cloudflare challenge. Off limits |
| Monread Community Centre (2026-09-25) | Squarespace, but no events collection — room booking and 2018 news only |
| Kildare Sports Partnership (2026-09-25) | `/kildaresp/events/` is empty |
| Kildare County Council (2026-09-25) | No events listing |
| Riverbank Arts Centre | Has a working Events Calendar API — but it is Newbridge, not Naas |

Riverbank is the one to revisit if the site's scope ever widens beyond Naas; the
integration would be a two-line addition to `JSON_ADAPTERS`. That is a product
decision, not a technical one — `PRODUCT.md` records "Naas-specific, not regional".

## Known coverage gap — midweek

As of 2026-08-04 the recurring series carrying most of the database (Naas
Racecourse, Moat Theatre, Naas Potato Market) are **weekend-only**: zero of their
events fall Monday to Thursday. Naas Library is the only regular weekday source.

What would close the gap is not aggregator-shaped — GAA and soccer clubs, pub
trad sessions, the parish newsletter, community centre classes. Most publish to
Facebook or nowhere, so they likely need direct submission rather than scraping.

The 2026-08-06 survey tested that conclusion directly and confirmed it. The three
sources added that day are all county-level aggregators, and they behave exactly as
this section predicts: plenty of midweek events, almost none of them in Naas. Naas
GAA publishes no machine-readable fixtures at all, and Naas Parish has the software
to publish events but has never used it. **Adding more aggregators will not fix
this** — the material genuinely is not online in a form anything can read. Direct
submission, or a person entering it, remains the route.

Punchestown, added 2026-09-25, is the one exception found so far: a Naas venue
racing on Mondays, Tuesdays and Wednesdays through the winter.
