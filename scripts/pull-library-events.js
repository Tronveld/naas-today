#!/usr/bin/env node
'use strict';

/**
 * pull-library-events.js
 * Fetches upcoming events from Naas Library RSS feed and imports them into Supabase.
 *
 * Requires Node.js 18+ (built-in fetch).
 * Reads SUPABASE_URL and SUPABASE_SECRET_KEY from environment or .env file.
 *
 * Usage: node scripts/pull-library-events.js
 */

const { loadEnv, stripHtml, KIDS_RE, createClient, exitCode, setOutput, printSummary } = require('./lib');

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SECRET_KEY   = process.env.SUPABASE_SECRET_KEY;

const RSS_URL =
  'https://kildare.spydus.ie/cgi-bin/spydus.exe/ENQ/WPAC/EVSESENQ' +
  '?QRY=EVSCFLG%3A0%20%2B%20EVSEDTE%3A%22%3E%3DTODAY%22%20%2B%20EVSESLOC%3A%2025959' +
  '&QRYTEXT=Location%3A%20Kildare%20Naas&SETLVL=SET&ISGLB=0' +
  '&SORTS=MAIN.CREATED_DATE.DESC]MAIN.CREATED_TIME.DESC' +
  '&FMT=RSS&XSLT=rss.xsl&NRECS=100';

const MONTH = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

// ── XML entity decode (outer envelope: &lt; → <, &amp; → &, etc.) ───────────
function xmlDecode(s) {
  return s
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g,  '&'); // must be last
}

// ── "DD Mon YYYY" → "YYYY-MM-DD" ─────────────────────────────────────────────
function toIsoDate(s) {
  const m = s.trim().match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!m) return null;
  const mo = MONTH[m[2].slice(0, 3).toLowerCase()];
  return mo ? `${m[3]}-${mo}-${m[1].padStart(2, '0')}` : null;
}

// ── "H:MM AM/PM" → "HH:MM" (24-hour) ────────────────────────────────────────
function to24h(s) {
  const m = s.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = +m[1];
  if (m[3].toUpperCase() === 'AM') { if (h === 12) h = 0; }
  else                             { if (h !== 12) h += 12; }
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

// ── Extract content from an XML element, XML-decoding it ─────────────────────
// Handles both plain-text and CDATA-wrapped values.
function tagContent(xml, tag) {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
  const m = xml.match(re);
  if (!m) return '';
  // If the content looks XML-escaped (contains &lt; or &amp;), decode it
  const raw = m[1].trim();
  return raw.includes('&lt;') || raw.includes('&amp;') ? xmlDecode(raw) : raw;
}

// ── Parse RSS XML → array of raw items ───────────────────────────────────────
function parseRss(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    items.push({
      title:          tagContent(m[1], 'title'),
      description:    tagContent(m[1], 'description'),
      contentEncoded: tagContent(m[1], 'content:encoded'),
      link:           tagContent(m[1], 'link'),
    });
  }
  return items;
}

// ── Convert one RSS item → event record ──────────────────────────────────────
function itemToEvent(item) {
  // Session date lives in <content:encoded> (HTML), not <description>.
  // Strip HTML from it first so the regex can match plain text.
  const ceText = stripHtml(item.contentEncoded || '');

  // "Session date: DD Mon YYYY - H:MM AM to H:MM AM"
  const SESSION_RE =
    /Session\s+date:\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4})\s*[-–]\s*(\d{1,2}:\d{2}\s*[AP]M)\s+to\s+(\d{1,2}:\d{2}\s*[AP]M)/i;
  const sm = ceText.match(SESSION_RE);

  const date     = sm ? toIsoDate(sm[1]) : null;
  const time     = sm ? to24h(sm[2])     : null;
  const time_end = sm ? to24h(sm[3])     : null;

  // <description> has the body text without the session-date footer — use it.
  let desc = stripHtml(item.description || '');

  // Remove duplicate text: library systems sometimes include the description twice.
  // If the first 60 chars appear again after index 40, cut at the second occurrence.
  if (desc.length > 80) {
    const probe    = desc.slice(0, 60);
    const laterIdx = desc.indexOf(probe, 40);
    if (laterIdx > 0) desc = desc.slice(0, laterIdx).trim();
  }

  desc = desc.replace(/\s+/g, ' ').trim();
  if (desc.length > 2000) desc = desc.slice(0, 1997) + '…';

  // Title: use RSS title if meaningful, otherwise generate from first sentence.
  // tagContent() only XML-decodes, so named HTML entities (e.g. &eacute;) survive
  // — stripHtml decodes them here.
  let title = stripHtml(item.title || '');
  if (!title && desc) {
    const first = desc.match(/^[\s\S]{10,}?[.!?](?=\s|$)/);
    title = first ? first[0].trim() : desc.slice(0, 80).trim();
  }
  if (title.length > 150) title = title.slice(0, 147) + '…';

  const is_for_kids = KIDS_RE.test(`${title} ${desc}`);

  return {
    title,
    date,
    time,
    time_end,
    location:    'Naas Library',
    description: desc,
    is_free:     true,
    is_for_kids,
    is_all_day:  !time,
    status:      null, // set by caller
    url:         item.link || null,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const autoApprove  = process.argv.includes('--auto-approve');
  const dryRun       = process.argv.includes('--dry-run');
  const insertStatus = autoApprove ? 'approved' : 'pending';

  // Credentials are required even for a dry run: the preview still checks for
  // duplicates, so that "would insert" means what it says.
  if (!SUPABASE_URL || !SECRET_KEY) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SECRET_KEY must be set (check .env).');
    process.exit(1);
  }

  if (dryRun) console.log('[DRY RUN] No events will be inserted.\n');

  console.log('Fetching Naas Library RSS feed…');
  let xml;
  try {
    const res = await fetch(RSS_URL, { headers: { 'User-Agent': 'naas-today-importer/1.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    xml = await res.text();
  } catch (err) {
    console.error('Failed to fetch RSS feed:', err.message);
    process.exit(1);
  }

  const rawItems = parseRss(xml);
  console.log(`Found ${rawItems.length} item(s) in feed.\n`);

  // Parse; drop any event with no parseable date or title
  const events  = rawItems.map(itemToEvent).filter(e => e.title && e.date);
  const skipped = rawItems.length - events.length;

  const sb = createClient(SUPABASE_URL, SECRET_KEY);
  let inserted = 0, dupes = 0, errors = 0;
  const log = [];

  for (const evt of events) {
    let dupe = false;
    try { dupe = await sb.isDuplicate(evt.title, evt.date); }
    catch (err) {
      errors++;
      log.push({ status: 'ERROR', date: evt.date, title: evt.title, note: err.message });
      continue;
    }

    if (dupe) {
      dupes++;
      log.push({ status: 'SKIP ', date: evt.date, title: evt.title, note: 'already exists' });
      continue;
    }

    if (dryRun) {
      sb.cacheInserted(evt.title, evt.date);   // so repeats within one feed dedupe too
      inserted++;
      log.push({ status: 'DRY  ', date: evt.date, title: evt.title, kids: evt.is_for_kids });
      continue;
    }

    try {
      await sb.post('/events', { ...evt, status: insertStatus, source: 'naas-library' });
      sb.cacheInserted(evt.title, evt.date);
      inserted++;
      log.push({ status: 'NEW  ', date: evt.date, title: evt.title, kids: evt.is_for_kids });
    } catch (err) {
      errors++;
      log.push({ status: 'ERROR', date: evt.date, title: evt.title, note: err.message });
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  printSummary('NAAS LIBRARY EVENT IMPORT — SUMMARY', {
    'RSS items found':   rawItems.length,
    'Parseable events':  `${events.length}  (${skipped} skipped — no date found)`,
    [dryRun ? 'Would insert' : `Inserted (${insertStatus})`]: inserted,
    'Skipped (dupes)':   dupes,
    'Errors':            errors,
  }, log);

  if (dryRun) {
    console.log(`\n[DRY RUN] ${inserted} event(s) would be inserted as "${insertStatus}".`);
  } else if (inserted > 0) {
    console.log(`\n✓ ${inserted} new event(s) added with status "${insertStatus}".`);
    if (insertStatus === 'pending') {
      console.log('  Review and approve them in the admin panel (/admin.html).');
    }
  } else {
    console.log('\nNo new events to import.');
  }

  // Tells the workflow whether a rebuild is worth 15 credits. Zero on a dry run
  // because nothing was written — see scrape-sources.js.
  setOutput('inserted', dryRun ? 0 : inserted);

  // A failed feed fetch already exits above. This catches the quieter case: the
  // feed read fine but every insert was rejected. That used to exit 0.
  // process.exitCode rather than process.exit(), so the summary above still
  // reaches the log instead of being truncated mid-write.
  const code = exitCode({ eventErrors: errors });
  if (code !== 0) {
    console.error(`\nFAILED: ${errors} event error(s) — see the details above.`);
  }
  process.exitCode = code;
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
