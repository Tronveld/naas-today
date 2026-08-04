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
const { loadEnv, stripHtml, KIDS_RE, createClient } = require('./lib');

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

// ── URL type classification ───────────────────────────────────────────────────
function classifyUrl(url) {
  if (url.includes('whatsontonight.ie')) return 'whatsontonight';
  if (url.includes('moattheatre.com'))   return 'moattheatre';
  return 'individual'; // Eventbrite, AllEvents.in, IntoKildare.ie, etc.
}

// ── Fetch HTML with browser-like headers ──────────────────────────────────────
async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-IE,en;q=0.9',
    },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.text();
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
function detectFree(offers, title, description) {
  if (offers) {
    const arr = Array.isArray(offers) ? offers : [offers];
    for (const o of arr) {
      const p = o.price;
      if (p === 0 || p === '0' || /^free$/i.test(String(p))) return true;
    }
  }
  return /\bfree\b/i.test(`${title} ${description}`);
}

// ── Convert a JSON-LD Event object to a Supabase row ─────────────────────────
// ── Naas relevance ───────────────────────────────────────────────────────────
// Broad search listings return county-wide results and location-less online
// events next to the real ones. This site is Naas-specific, so county-level
// content is filtered down rather than allowed to broaden it. An event with no
// location at all is not Naas — that is how Eventbrite represents online events.
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
  return /\bnaas\b/i.test(parts.join(' '));
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
  const is_for_kids = KIDS_RE.test(`${title} ${description}`);

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
    is_all_day: !time,
    url,
    status:    null, // set by caller
  };
}

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

// ── Generic listing-page HTML parser ─────────────────────────────────────────
// Used by site-specific parsers; tries JSON-LD first, then HTML block fallback.
//
// opts:
//   blockClass   — regex fragment matched against the block element's class attr
//   headingTag   — regex fragment for the heading element (default: 'h[2-4]|strong')
//   minTitleLen  — minimum character length for an accepted title (default: 1)
//   location     — default location string for events found via HTML fallback
//   isAllDay     — when true: extract description, detect free from text,
//                  test kids against title+description;
//                  when false: empty description, is_free=false, kids from title only
function parseListingPage(html, sourceUrl, opts) {
  const { blockClass, headingTag = 'h[2-4]|strong', minTitleLen = 1, location, isAllDay } = opts;

  const ldEvents = extractJsonLd(html);
  if (ldEvents.length > 0) {
    return ldEvents.map(e => jsonLdToEvent(e, sourceUrl)).filter(e => e.title && e.date);
  }

  const events  = [];
  const blockRe = new RegExp(
    `<(?:article|div)[^>]+class="[^"]*(?:${blockClass})[^"]*"[^>]*>([\\s\\S]*?)` +
    `(?=<(?:article|div)[^>]+class="[^"]*(?:${blockClass})|<\\/(?:main|section)>)`,
    'gi'
  );
  let m;
  while ((m = blockRe.exec(html)) !== null) {
    const block  = m[1];
    const titleM = block.match(new RegExp(`<(?:${headingTag})[^>]*>([\\s\\S]*?)<\\/(?:${headingTag})>`, 'i'));
    if (!titleM) continue;
    const title = stripHtml(titleM[1]).trim();
    if (!title || title.length < minTitleLen) continue;

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
    const desc  = isAllDay ? stripHtml(block).replace(title, '').trim().slice(0, 2000) : '';
    const text  = isAllDay ? `${title} ${desc}` : title;

    events.push({
      title:       title.slice(0, 150),
      date,
      time:        null,
      time_end:    null,
      end_date:    null,
      location,
      description: desc,
      is_free:     isAllDay ? /\bfree\b/i.test(text) : false,
      is_for_kids: KIDS_RE.test(text),
      is_all_day:  isAllDay,
      url,
      status:      null,
    });
  }
  return events;
}

// ── WhatsonTonight.ie listing page parser ─────────────────────────────────────
function parseWhatsonTonight(html, sourceUrl) {
  return parseListingPage(html, sourceUrl, {
    blockClass:  'event',
    headingTag:  'h[2-4]|strong',
    location:    'Naas',
    isAllDay:    true,
  });
}

// ── Moat Theatre homepage parser ──────────────────────────────────────────────
function parseMoatTheatre(html, sourceUrl) {
  return parseListingPage(html, sourceUrl, {
    blockClass:  'show|event|production|post',
    headingTag:  'h[1-4]',
    minTitleLen: 3,
    location:    'Moat Theatre, Naas',
    isAllDay:    false,
  });
}

// ── Extract events from one URL ───────────────────────────────────────────────
async function extractEvents(url) {
  const type = classifyUrl(url);
  const html = await fetchPage(url);

  let events  = [];
  let warning = null;
  let offTown = 0;   // JSON-LD events dropped as not Naas — reported, never silent

  if (type === 'individual') {
    const ldEvents = extractJsonLd(html);
    if (ldEvents.length > 0) {
      const naasOnly = ldEvents.filter(isNaasEvent);
      offTown = ldEvents.length - naasOnly.length;
      events = naasOnly.map(e => jsonLdToEvent(e, url)).filter(e => e.title && e.date);
    }
    if (events.length === 0 && offTown === 0) {
      warning = 'No JSON-LD Event found';
    }
  } else if (type === 'whatsontonight') {
    events = parseWhatsonTonight(html, url);
  } else if (type === 'moattheatre') {
    events = parseMoatTheatre(html, url);
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

  if (!dryRun && (!SUPABASE_URL || !SECRET_KEY)) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SECRET_KEY must be set (check .env).');
    process.exit(1);
  }

  if (dryRun) console.log('[DRY RUN] No events will be inserted.\n');

  const sb   = createClient(SUPABASE_URL, SECRET_KEY);
  const urls = readSources();
  console.log(`Loaded ${urls.length} source URL(s) from event-sources.md.\n`);

  let totalFound = 0, totalInserted = 0, totalSkipped = 0, totalErrors = 0, totalOffTown = 0;
  const log = [];

  for (const url of urls) {
    const shortUrl = url.length > 70 ? url.slice(0, 67) + '…' : url;
    process.stdout.write(`Fetching: ${shortUrl} … `);

    let result;
    try {
      result = await extractEvents(url);
    } catch (err) {
      console.log('ERROR');
      totalErrors++;
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
      if (dryRun) {
        log.push({ status: 'DRY  ', date: evt.date, title: evt.title, kids: evt.is_for_kids, loc: evt.location });
        totalInserted++;
        continue;
      }

      let dupe = false;
      try { dupe = await sb.isDuplicate(evt.title, evt.date); }
      catch (err) {
        totalErrors++;
        log.push({ status: 'ERROR', date: evt.date, title: evt.title, note: err.message });
        continue;
      }

      if (dupe) {
        totalSkipped++;
        log.push({ status: 'SKIP ', date: evt.date, title: evt.title, note: 'already exists' });
        continue;
      }

      try {
        await sb.post('/events', { ...evt, status: insertStatus });
        sb.cacheInserted(evt.title, evt.date);
        totalInserted++;
        log.push({ status: 'NEW  ', date: evt.date, title: evt.title, kids: evt.is_for_kids });
      } catch (err) {
        totalErrors++;
        log.push({ status: 'ERROR', date: evt.date, title: evt.title, note: err.message });
      }
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const bar = '─'.repeat(62);
  console.log('\n' + bar);
  console.log('NAAS TODAY — SCRAPE SOURCES SUMMARY');
  console.log(bar);
  console.log(`  URLs processed       : ${urls.length}`);
  console.log(`  Events found (future): ${totalFound}`);
  if (dryRun) {
    console.log(`  Would insert         : ${totalInserted}`);
  } else {
    console.log(`  Inserted (${insertStatus.padEnd(8)}) : ${totalInserted}`);
    console.log(`  Skipped (dupes)      : ${totalSkipped}`);
  }
  console.log(`  Dropped (not Naas)   : ${totalOffTown}`);
  console.log(`  Errors               : ${totalErrors}`);

  if (log.length) {
    console.log('');
    console.log('Details:');
    for (const r of log) {
      if (r.date) {
        const kids = r.kids ? ' [kids]'    : '';
        const loc  = r.loc  ? ` @ ${r.loc}` : '';
        const note = r.note ? ` — ${r.note}` : '';
        console.log(`  [${r.status}] ${r.date}  ${r.title}${kids}${loc}${note}`);
      } else {
        console.log(`  [${r.status}] ${r.url}${r.note ? ` — ${r.note}` : ''}`);
      }
    }
  }

  console.log(bar);
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
}

// Only run when invoked directly, so tests can require the pure helpers below
// without kicking off a live scrape.
if (require.main === module) {
  main().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
}

// Exported for tests only — the CLI path above is what actually runs.
module.exports = { extractJsonLd, isNaasEvent };
