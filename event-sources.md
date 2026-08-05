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
| anything else | JSON-LD extraction — works when the page publishes `Event` objects, including inside a schema.org `ItemList` |

A new host without JSON-LD needs a parser adding to `scrape-sources.js` (see
`sourceKind()` near the top). Checked on 2026-08-04: `allevents.in` and
`intokildare.ie` listing pages publish no usable JSON-LD `Event` data, so they
would need that work before they can be added back.

Past events are skipped automatically. Duplicates are skipped by fuzzy title
match within a date.

## Listing pages

### Moat Theatre — the single biggest source

https://www.moattheatre.com/shows

### WhatsOnTonight — Naas listings

https://whatsontonight.ie/events/Kildare/Naas

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

## Known coverage gap — midweek

As of 2026-08-04 the recurring series carrying most of the database (Naas
Racecourse, Moat Theatre, Naas Potato Market) are **weekend-only**: zero of their
events fall Monday to Thursday. Naas Library is the only regular weekday source.

What would close the gap is not aggregator-shaped — GAA and soccer clubs, pub
trad sessions, the parish newsletter, community centre classes. Most publish to
Facebook or nowhere, so they likely need direct submission rather than scraping.
