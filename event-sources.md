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
| `moattheatre.com` | Custom listing parser (`parseListingPage`) |
| `whatsontonight.ie` | Custom listing parser (`parseListingPage`) |
| `kildareheritage.com` | JSON adapter — Squarespace `?format=json` → `upcoming[]` |
| `intokildare.ie` | JSON adapter — The Events Calendar REST API |
| anything else | JSON-LD extraction — works when the page publishes `Event` objects, including inside a schema.org `ItemList` |

A new host without JSON-LD needs a parser adding to `scrape-sources.js` (see
`classifyUrl()` near the top). Checked on 2026-08-04: `allevents.in` and
`intokildare.ie` listing *pages* publish no usable JSON-LD `Event` data.

The two JSON adapters are the way around that. Both sources serve structured JSON
from a separate endpoint, so instead of parsing their pages, `JSON_ADAPTERS` in
`scrape-sources.js` maps their records into schema.org `Event` shapes and feeds
them to the same pipeline the JSON-LD sources use — the same Naas filter, the same
duplicate check, the same insert. Adding another JSON-backed source means writing
one mapper, not another script.

Past events are skipped automatically. Duplicates are skipped by fuzzy title
match within a date.

## Listing pages

### Moat Theatre — the single biggest source

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

### Possible, but needs a hand-written parser

- **Naas Racecourse fixtures** — `https://www.naasracecourse.com/fixtures/`. Clean
  `race-event-block` markup, and a genuinely Naas source. The blocker is the date:
  it is split across a `race-month` header ("August 2026") and a `race-date` cell
  ("Sunday 23rd"), which `parseDateText()` cannot read. Roughly 7 fixtures visible
  ahead. Note Naas parkrun also runs here weekly, and is not listed anywhere
  machine-readable.
- **Lawlor's of Naas** — `https://www.lawlors.ie/live-music-events.html`. A real
  Naas gig venue running country and tribute acts, but the page has almost no
  markup to anchor a parser to.

### Dead ends — checked 2026-08-06, do not re-try without new evidence

| Source | Why not |
|---|---|
| Naas GAA fixtures | No fixture data in the HTML at all, and no embedded widget |
| Naas Parish | Runs The Events Calendar, but publishes **0** events |
| Kildare PPN | Same — plugin present, 0 events |
| `mytown.ie` | No event content in the page |
| `allevents.in` | Still no JSON-LD, confirming the 2026-08-04 finding |
| Leinster Leader / Kildare Live | HTTP 403 to scrapers |
| Bandsintown | HTTP 403 |
| Songkick | HTTP 406 |
| Punchestown, Mondello Park | WordPress, but no events API and no JSON-LD |
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
