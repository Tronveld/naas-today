#!/usr/bin/env node
'use strict';

/**
 * scrape-sources.js
 * Fetches event data from URLs listed in event-sources.md and imports them into Supabase.
 *
 * Requires Node.js 18+ (built-in fetch).
 * Reads SUPABASE_URL and SUPABASE_SECRET_KEY from environment or .env file.
 *
 * Usage:
 *   node scripts/scrape-sources.js [--auto-approve] [--dry-run]
 */

const fs   = require('fs');
const path = require('path');
const { loadEnv, stripHtml, KIDS_RE, createClient, exitCode, sourceForUrl, setOutput, printSummary } = require('./lib');

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SECRET_KEY   = process.env.SUPABASE_SECRET_KEY;

const SOURCES_FILE = path.resolve(__dirname, '..', 'event-sources.md');

// Today's date as YYYY-MM-DD in local time
const TODAY = new Date().toLocaleDateString('en-CA'); // en-CA locale gives YYYY-MM-DD

// ── Read source URLs from event-sources.md ────────────────────────────────────
function readSources() {
  const content = fs.readFileSync(SOURCES_FILE, 'utf8');
  return content
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('http'));
}

// ── Fetch HTML with browser-like headers ──────────────────────────────────────
const BROWSER_HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-IE,en;q=0.9',
};

async function fetchPage(url) {
  const res = await fetch(url, { headers: BROWSER_HEADERS, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.text();
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { ...BROWSER_HEADERS, Accept: 'application/json' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json();
}

// ── Extract all JSON-LD Event objects from HTML ───────────────────────────────
function extractJsonLd(html) {
  const events = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    let data;
    try { data = JSON.parse(m[1]); } catch { continue; }

    // Collect all objects from arrays, @graph, or bare objects
    const candidates = [];
    if (Array.isArray(data)) {
      candidates.push(...data);
    } else if (data['@graph']) {
      candidates.push(...(Array.isArray(data['@graph']) ? data['@graph'] : [data['@graph']]));
    } else {
      candidates.push(data);
    }

    // Listing pages (Eventbrite's Naas search, among others) publish their
    // events inside a schema.org ItemList rather than at the top level. Unwrap
    // one level: itemListElement holds either ListItem wrappers with the Event
    // under .item, or the Events directly.
    for (const obj of [...candidates]) {
      if (!obj || obj['@type'] !== 'ItemList') continue;
      const listed = obj.itemListElement;
      if (!Array.isArray(listed)) continue;
      for (const entry of listed) {
        if (!entry) continue;
        candidates.push(entry['@type'] === 'ListItem' && entry.item ? entry.item : entry);
      }
    }

    for (const obj of candidates) {
      if (!obj) continue;
      const type = obj['@type'];
      if (type === 'Event' || (Array.isArray(type) && type.includes('Event'))) {
        events.push(obj);
      }
    }
  }
  return events;
}

// ── Parse ISO 8601 date/time string ──────────────────────────────────────────
// Handles "2026-04-15", "2026-04-15T19:00:00", "2026-04-15T19:00:00+01:00"
function parseIsoDateTime(s) {
  if (!s) return { date: null, time: null };
  const m = s.match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?/);
  if (!m) return { date: null, time: null };
  return { date: m[1], time: m[2] || null };
}

// ── Extract a human-readable location from a JSON-LD location object ─────────
function extractLocation(loc) {
  if (!loc) return null;
  if (typeof loc === 'string') return stripHtml(loc) || null;
  if (loc.name) return stripHtml(loc.name) || null;
  if (loc.address) {
    const a = loc.address;
    if (typeof a === 'string') return stripHtml(a) || null;
    const parts = [a.streetAddress, a.addressLocality, a.addressRegion]
      .filter(Boolean)
      .map(p => stripHtml(p));
    return parts.join(', ') || null;
  }
  return null;
}

// ── Detect free admission from offers + text ─────────────────────────────────
// A stated price of zero is authoritative. Everything else is prose, and prose
// says "free" for reasons that have nothing to do with getting in: child
// concessions, free parking, gluten-free catering. Taste of Kildare published
// with a FREE badge on 2026-08-06 on the strength of "children under 10 enter
// completely free of charge" — adults pay €15.
//
// So the text fallback asks for the word in an admission sense, and returns
// false when it cannot tell. That direction is the cheap one to be wrong in: a
// free event missing its badge is a missed filter hit, whereas a paid event
// wearing one sends somebody out the door with no money.
//
// Note parseListingPage keeps its own looser /\bfree\b/ for the HTML sources.
// Left alone deliberately — no defect has been observed there, and those
// descriptions are short scraped blobs rather than full event copy.
const FREE_ADMISSION =
  /\bfree (admission|entry|entrance|event|to attend|and open)\b|\b(admission|entry|entrance|tickets?)\s*[:–-]?\s*free\b|\bevent is free\b|\bis free to\b/i;

function detectFree(offers, title, description) {
  if (offers) {
    const arr = Array.isArray(offers) ? offers : [offers];
    for (const o of arr) {
      const p = o.price;
      if (p === 0 || p === '0' || /^free$/i.test(String(p))) return true;
    }
  }
  return FREE_ADMISSION.test(`${title} ${description}`);
}

// ── Convert a JSON-LD Event object to a Supabase row ─────────────────────────
// ── Naas relevance ───────────────────────────────────────────────────────────
// Broad search listings return county-wide results and location-less online
// events next to the real ones. This site is Naas-specific, so county-level
// content is filtered down rather than allowed to broaden it. An event with no
// location at all is not Naas — that is how Eventbrite represents online events.
//
// Some venues genuinely in Naas do not carry the word in their name or address —
// Mondello Park is in Donore, Naas, and Punchestown Racecourse has a Naas
// address. Both were dropped by the \bnaas\b test alone. Grow this list as they
// turn up rather than loosening the test: widening the radius to neighbouring
// towns is a product decision (PRODUCT.md records "Naas-specific, not regional"),
// and a wrong entry publishes an off-town event to the live site with nobody in
// the loop, because these sources are auto-approved.
const NAAS_VENUES = /\b(mondello park|punchestown)\b/i;

function isNaasEvent(ldEvent) {
  const parts = [];
  const collect = (loc) => {
    if (!loc) return;
    if (Array.isArray(loc)) { loc.forEach(collect); return; }
    if (typeof loc === 'string') { parts.push(loc); return; }
    if (typeof loc !== 'object') return;
    if (loc.name) parts.push(String(loc.name));
    const addr = loc.address;
    if (typeof addr === 'string') parts.push(addr);
    else if (addr && typeof addr === 'object') {
      parts.push(String(addr.addressLocality || ''), String(addr.streetAddress || ''));
    }
  };
  collect(ldEvent && ldEvent.location);
  const text = parts.join(' ');
  return /\bnaas\b/i.test(text) || NAAS_VENUES.test(text);
}

// ── Source categories → the site's filter flags ──────────────────────────────
// Moat Theatre and IntoKildare both tag their events, and a curated tag beats
// guessing from prose every time. KIDS_RE over a full description gets Moat
// exactly backwards: Chris Kent's adult stand-up blurb says "Between kids,
// marriage and..." and scores true, while the children's panto — "The Panto
// Legends Return!" — scores false. Moat tags them Comedy and Children/Family.
//
// So when a source supplies categories they are trusted outright and the regex
// is not consulted. Sources that supply none keep the old text behaviour.
//
// Unmapped tags (Comedy, Coming Soon, This Week, Christmas, Talks, Art) simply
// set nothing — the site has no filter for them. Comedy in particular is left
// alone rather than folded into theatre: stand-up is not a play.
const CATEGORY_FLAGS = {
  music:    'is_music',
  drama:    'is_theatre',
  theatre:  'is_theatre',
  theater:  'is_theatre',
  family:   'is_for_kids',
  children: 'is_for_kids',
  kids:     'is_for_kids',
  sport:    'is_sport',
  sports:   'is_sport',
  market:   'is_market',
  markets:  'is_market',
};

// Accepts plain strings (Squarespace) or {name} objects (The Events Calendar).
// Trailing digits are stripped so Moat's duplicated "Drama 2" lands on drama.
function categoryFlags(categories) {
  const flags = {};
  if (!Array.isArray(categories)) return { flags, tagged: false };
  for (const c of categories) {
    const name = typeof c === 'string' ? c : (c && c.name) || '';
    const key  = name.toLowerCase().trim().replace(/\s*\d+$/, '');
    if (CATEGORY_FLAGS[key]) flags[CATEGORY_FLAGS[key]] = true;
  }
  return { flags, tagged: categories.length > 0 };
}

function jsonLdToEvent(ldEvent, sourceUrl) {
  const { date, time }         = parseIsoDateTime(ldEvent.startDate);
  const { date: endDate, time: timeEnd } = parseIsoDateTime(ldEvent.endDate);

  let title = stripHtml(ldEvent.name || '');
  if (title.length > 150) title = title.slice(0, 147) + '…';

  let description = stripHtml(
    typeof ldEvent.description === 'string' ? ldEvent.description : ''
  );
  if (description.length > 2000) description = description.slice(0, 1997) + '…';

  const location    = extractLocation(ldEvent.location) || extractLocation(ldEvent.organizer);
  const is_free     = detectFree(ldEvent.offers, title, description);

  const { flags, tagged } = categoryFlags(ldEvent.categories);
  const is_for_kids = tagged ? !!flags.is_for_kids : KIDS_RE.test(`${title} ${description}`);

  // Prefer the canonical URL embedded in JSON-LD over the source URL
  const url = ldEvent.url || ldEvent['@id'] || sourceUrl;

  return {
    title,
    date,
    time,
    time_end:  timeEnd || null,
    end_date:  (endDate && endDate !== date) ? endDate : null,
    location,
    description,
    is_free,
    is_for_kids,
    is_music:   !!flags.is_music,
    is_theatre: !!flags.is_theatre,
    is_sport:   !!flags.is_sport,
    is_market:  !!flags.is_market,
    is_all_day: !time,
    url,
    status:    null, // set by caller
  };
}

// ── JSON source adapters ─────────────────────────────────────────────────────
// Two sources publish structured JSON rather than JSON-LD inside a page. Rather
// than give each its own extraction, row-building and insert path, each adapter
// maps its records into schema.org Event shapes and hands them to the same
// isNaasEvent → jsonLdToEvent → isDuplicate pipeline the HTML sources use.
//
// Each is split into a fetch half and a pure mapper half. Only the mapper is
// exported, so the tests never touch the network.

// Squarespace timestamps are epoch milliseconds in true UTC, but the site renders
// Dublin local time — verified 2026-08-06 against the live feed. Formatting via
// toISOString() would show 11:00 for an event the organiser advertises at 12:00,
// and would date a past-midnight event to the previous day. Same class of bug
// CLAUDE.md warns about for localDateStr() on the frontend.
const DUBLIN_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Dublin',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

function dublinLocal(ms) {
  if (!ms) return null;
  const p = {};
  for (const { type, value } of DUBLIN_FMT.formatToParts(new Date(ms))) p[type] = value;
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

// Squarespace events collection, ?format=json → upcoming[]. Used by Kildare
// Heritage and by the Moat Theatre, which runs the same platform — the feed
// carries real start and end times, which no HTML parser here can extract.
//
// The venue name and its town live in separate fields; joined into one string so
// that isNaasEvent can see the town and extractLocation can show the venue.
function squarespaceEventToLd(item, sourceUrl) {
  const loc   = item.location || {};
  // Trim and de-punctuate each part, not just the join. Kildare Heritage's
  // addressTitle carries trailing whitespace ("Naas Racecourse , County
  // Kildare") and Moat's addressLine2 a trailing comma ("Naas, County Kildare,").
  const clean = (s) => (s || '').trim().replace(/[,\s]+$/, '');
  const place = [loc.addressTitle, loc.addressLine2].map(clean).filter(Boolean).join(', ');

  return {
    '@type':     'Event',
    name:        item.title,
    startDate:   dublinLocal(item.startDate),
    endDate:     dublinLocal(item.endDate),
    location:    place ? { '@type': 'Place', name: place } : null,
    description: item.excerpt || item.body || '',
    categories:  item.categories || [],
    url:         item.fullUrl ? new URL(item.fullUrl, sourceUrl).href : sourceUrl,
  };
}

async function fetchSquarespaceEvents(url) {
  const data = await fetchJson(`${url}?format=json`);
  return (data.upcoming || []).map(item => squarespaceEventToLd(item, url));
}

// IntoKildare — The Events Calendar REST API. Timestamps arrive as
// "2026-08-15 19:30:00", already in site-local time, so they need only the
// separator swapped. An all-day event, or one stored at midnight, is emitted as
// a bare date: jsonLdToEvent derives is_all_day from the absence of a time, and
// passing 00:00 through would render the card as "00:00" rather than "ALL DAY".
function intoKildareToLd(e) {
  const start = String(e.start_date || '').replace(' ', 'T');
  const end   = String(e.end_date   || '').replace(' ', 'T');
  const bare  = (s) => (e.all_day || s.endsWith('T00:00:00') ? s.slice(0, 10) : s) || null;

  // venue is [] rather than {} when an event has none.
  const v     = (e.venue && !Array.isArray(e.venue)) ? e.venue : {};
  const place = [v.venue, v.city].filter(Boolean).join(', ').trim();

  // An empty cost means "not stated", not "free" — claiming free would put a
  // paid event behind the site's free filter. Left to detectFree()'s text check,
  // which is what decides it for every other source.
  const cost = String(e.cost || '').trim();

  return {
    '@type':     'Event',
    name:        e.title,
    startDate:   bare(start),
    endDate:     bare(end),
    location:    place ? { '@type': 'Place', name: place } : null,
    description: e.excerpt || e.description || '',
    categories:  e.categories || [],
    offers:      /^(free|0|€\s*0)$/i.test(cost) ? { price: 0 } : undefined,
    url:         e.website || e.url,
  };
}

async function fetchIntoKildare(url) {
  const api  = new URL('/wp-json/tribe/events/v1/events?per_page=50', url).href;
  const data = await fetchJson(api);
  return (data.events || []).map(intoKildareToLd);
}

// Keyed by bare hostname, matching what sourceForUrl returns.
const JSON_ADAPTERS = {
  'kildareheritage.com': fetchSquarespaceEvents,
  'moattheatre.com':     fetchSquarespaceEvents,
  'intokildare.ie':      fetchIntoKildare,
};

// ── Parse a date written as "15 April 2026" from plain text ──────────────────
const MONTH_MAP = {
  january:'01', february:'02', march:'03',    april:'04',
  may:'05',     june:'06',     july:'07',      august:'08',
  september:'09', october:'10', november:'11', december:'12',
};

function parseDateText(text) {
  const m = text.match(/(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i);
  if (!m) return null;
  const mo = MONTH_MAP[m[2].toLowerCase()];
  return mo ? `${m[3]}-${mo}-${m[1].padStart(2, '0')}` : null;
}

// ── WhatsonTonight.ie listing page parser ─────────────────────────────────────
// The last remaining HTML scrape. Tries JSON-LD first, then falls back to
// matching `class="…event…"` blocks and reading a heading and a date out of each.
//
// This used to be a `parseListingPage(html, url, opts)` taking five options, from
// when several sources were scraped this way. One caller and one option set were
// left, so the options are baked in here. **Prefer a JSON adapter to a parser for
// anything new** — this path cannot extract a time at all, which is what left 81
// Moat Theatre rows showing "TBC" until the Squarespace adapter replaced it.
function parseWhatsonTonight(html, sourceUrl) {
  const ldEvents = extractJsonLd(html);
  if (ldEvents.length > 0) {
    return ldEvents.map(e => jsonLdToEvent(e, sourceUrl)).filter(e => e.title && e.date);
  }

  const events  = [];
  const blockRe = /<(?:article|div)[^>]+class="[^"]*(?:event)[^"]*"[^>]*>([\s\S]*?)(?=<(?:article|div)[^>]+class="[^"]*(?:event)|<\/(?:main|section)>)/gi;
  let m;
  while ((m = blockRe.exec(html)) !== null) {
    const block  = m[1];
    const titleM = block.match(/<(?:h[2-4]|strong)[^>]*>([\s\S]*?)<\/(?:h[2-4]|strong)>/i);
    if (!titleM) continue;
    const title = stripHtml(titleM[1]).trim();
    if (!title) continue;

    let date = null;
    const timeElemM = block.match(/<time[^>]*datetime="([^"]+)"/i);
    if (timeElemM) {
      ({ date } = parseIsoDateTime(timeElemM[1]));
    } else {
      date = parseDateText(stripHtml(block));
    }
    if (!date) continue;

    const linkM = block.match(/<a[^>]+href="([^"]+)"/i);
    const url   = linkM ? new URL(linkM[1], sourceUrl).href : sourceUrl;
    const desc  = stripHtml(block).replace(title, '').trim().slice(0, 2000);
    const text  = `${title} ${desc}`;

    events.push({
      title:       title.slice(0, 150),
      date,
      time:        null,
      time_end:    null,
      end_date:    null,
      location:    'Naas',
      description: desc,
      // A looser test than the JSON-LD path's FREE_ADMISSION on purpose: these
      // are short scraped blobs rather than full event copy, and no false
      // positive has been observed here.
      is_free:     /\bfree\b/i.test(text),
      is_for_kids: KIDS_RE.test(text),
      is_all_day:  true,
      url,
      status:      null,
    });
  }
  return events;
}

// ── Extract events from one URL ───────────────────────────────────────────────
async function extractEvents(url) {
  const adapter = JSON_ADAPTERS[sourceForUrl(url)];

  let events  = [];
  let warning = null;
  let offTown = 0;   // JSON-LD events dropped as not Naas — reported, never silent

  // A JSON adapter produces the same schema.org Event shapes the JSON-LD path
  // yields, so the two share everything downstream — the Naas filter, the
  // off-town count and jsonLdToEvent. WhatsonTonight is the one HTML scrape.
  if (!adapter && url.includes('whatsontonight.ie')) {
    events = parseWhatsonTonight(await fetchPage(url), url);
  } else {
    const ldEvents = adapter ? await adapter(url) : extractJsonLd(await fetchPage(url));
    if (ldEvents.length > 0) {
      const naasOnly = ldEvents.filter(isNaasEvent);
      offTown = ldEvents.length - naasOnly.length;
      events = naasOnly.map(e => jsonLdToEvent(e, url)).filter(e => e.title && e.date);
    }
    if (events.length === 0 && offTown === 0) {
      warning = adapter ? 'Feed returned no events' : 'No JSON-LD Event found';
    }
  }

  // Drop past events
  events = events.filter(e => e.date >= TODAY);

  return { events, warning, offTown };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const autoApprove  = process.argv.includes('--auto-approve');
  const dryRun       = process.argv.includes('--dry-run');
  const insertStatus = autoApprove ? 'approved' : 'pending';

  // Required even for a dry run: the preview checks for duplicates, so that
  // "would insert" means what it says rather than counting rows already stored.
  if (!SUPABASE_URL || !SECRET_KEY) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SECRET_KEY must be set (check .env).');
    process.exit(1);
  }

  if (dryRun) console.log('[DRY RUN] No events will be inserted.\n');

  const sb   = createClient(SUPABASE_URL, SECRET_KEY);
  const urls = readSources();
  console.log(`Loaded ${urls.length} source URL(s) from event-sources.md.\n`);

  // Source errors and per-event errors are counted apart: a dead source means
  // the whole listing is missing, which is the one worth naming in the summary.
  let totalFound = 0, totalInserted = 0, totalSkipped = 0, totalOffTown = 0;
  let sourceErrors = 0, eventErrors = 0;
  const log = [];

  for (const url of urls) {
    const shortUrl = url.length > 70 ? url.slice(0, 67) + '…' : url;
    const source   = sourceForUrl(url);
    process.stdout.write(`Fetching: ${shortUrl} … `);

    let result;
    try {
      result = await extractEvents(url);
    } catch (err) {
      console.log('ERROR');
      sourceErrors++;
      log.push({ status: 'ERROR', url: shortUrl, note: err.message });
      continue;
    }

    if (result.warning) {
      console.log(`WARN (${result.warning})`);
    } else {
      const offTownNote = result.offTown ? `, ${result.offTown} not Naas` : '';
      console.log(`OK (${result.events.length} event(s)${offTownNote})`);
    }
    totalOffTown += result.offTown || 0;

    totalFound += result.events.length;

    for (const evt of result.events) {
      let dupe = false;
      try { dupe = await sb.isDuplicate(evt.title, evt.date); }
      catch (err) {
        eventErrors++;
        log.push({ status: 'ERROR', date: evt.date, title: evt.title, note: err.message });
        continue;
      }

      if (dupe) {
        totalSkipped++;
        log.push({ status: 'SKIP ', date: evt.date, title: evt.title, note: 'already exists' });
        continue;
      }

      if (dryRun) {
        sb.cacheInserted(evt.title, evt.date);   // so repeats within one run dedupe too
        totalInserted++;
        log.push({ status: 'DRY  ', date: evt.date, title: evt.title, kids: evt.is_for_kids, loc: evt.location });
        continue;
      }

      try {
        await sb.post('/events', { ...evt, status: insertStatus, source });
        sb.cacheInserted(evt.title, evt.date);
        totalInserted++;
        log.push({ status: 'NEW  ', date: evt.date, title: evt.title, kids: evt.is_for_kids });
      } catch (err) {
        eventErrors++;
        log.push({ status: 'ERROR', date: evt.date, title: evt.title, note: err.message });
      }
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('');
  printSummary('NAAS TODAY — SCRAPE SOURCES SUMMARY', {
    'URLs processed':        urls.length,
    'Events found (future)': totalFound,
    [dryRun ? 'Would insert' : `Inserted (${insertStatus})`]: totalInserted,
    'Skipped (dupes)':       totalSkipped,
    'Dropped (not Naas)':    totalOffTown,
    'Sources failed':        `${sourceErrors} of ${urls.length}`,
    'Event errors':          eventErrors,
  }, log);

  if (dryRun) {
    console.log(`\n[DRY RUN] ${totalInserted} event(s) would be inserted as "${insertStatus}".`);
  } else if (totalInserted > 0) {
    console.log(`\n✓ ${totalInserted} new event(s) added with status "${insertStatus}".`);
    if (insertStatus === 'pending') {
      console.log('  Review and approve them in the admin panel (/admin.html).');
    }
  } else {
    console.log('\nNo new events to import.');
  }

  // Tells the workflow whether a rebuild is worth 15 credits. Zero on a dry run
  // because nothing was written — reporting the hypothetical count here would
  // make the output mean something other than what it says.
  setOutput('inserted', dryRun ? 0 : totalInserted);

  // process.exitCode rather than process.exit(): the summary above still has to
  // reach the log. process.exit() would truncate it mid-write.
  const code = exitCode({ sourceErrors, eventErrors });
  if (code !== 0) {
    console.error(
      `\nFAILED: ${sourceErrors} source(s) unreachable, ${eventErrors} event error(s). ` +
      'A source that stays broken needs removing from event-sources.md or fixing.'
    );
  }
  process.exitCode = code;
}

// Only run when invoked directly, so tests can require the pure helpers below
// without kicking off a live scrape.
if (require.main === module) {
  main().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
}

// Exported for tests — the CLI path above is what actually runs. Only the pure
// mappers, so the tests never touch the network.
module.exports = {
  extractJsonLd, isNaasEvent, squarespaceEventToLd, intoKildareToLd, detectFree,
  jsonLdToEvent,
};
