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

const fs   = require('fs');
const path = require('path');

// ── Load .env ─────────────────────────────────────────────────────────────────
(function loadEnv() {
  const envFile = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let   v = t.slice(eq + 1).trim();
    // Strip surrounding quotes
    if (v.length >= 2 && ((v[0] === '"' && v.endsWith('"')) || (v[0] === "'" && v.endsWith("'")))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}());

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

// Matches common "for kids" signals
const KIDS_RE = /\b(bab(y|ies)|toddler|children|child\b|kids?|\d+\s*-?\s*year\s*-?\s*olds?|junior|youth|playgroup|storytime for)\b/i;

// ── XML entity decode (outer envelope: &lt; → <, &amp; → &, etc.) ───────────
function xmlDecode(s) {
  return s
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g,  '&'); // must be last
}

// Named HTML entities that appear after XML-decoding (e.g. &rsquo; stays as-is)
const HTML_ENT = {
  nbsp: ' ',  rsquo: '\u2019', lsquo: '\u2018', rdquo: '\u201D', ldquo: '\u201C',
  mdash: '\u2014', ndash: '\u2013', hellip: '\u2026', bull: '\u2022',
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  copy: '\u00A9', reg: '\u00AE', trade: '\u2122', euro: '\u20AC', pound: '\u00A3',
  // Latin-1 supplement — accented characters common in European text
  aacute: 'á', Aacute: 'Á', agrave: 'à', Agrave: 'À', acirc: 'â', Acirc: 'Â',
  auml: 'ä', Auml: 'Ä', atilde: 'ã', Atilde: 'Ã', aring: 'å', Aring: 'Å',
  aelig: 'æ', AElig: 'Æ',
  eacute: 'é', Eacute: 'É', egrave: 'è', Egrave: 'È', ecirc: 'ê', Ecirc: 'Ê',
  euml: 'ë', Euml: 'Ë',
  iacute: 'í', Iacute: 'Í', igrave: 'ì', Igrave: 'Ì', icirc: 'î', Icirc: 'Î',
  iuml: 'ï', Iuml: 'Ï',
  oacute: 'ó', Oacute: 'Ó', ograve: 'ò', Ograve: 'Ò', ocirc: 'ô', Ocirc: 'Ô',
  ouml: 'ö', Ouml: 'Ö', otilde: 'õ', Otilde: 'Õ', oslash: 'ø', Oslash: 'Ø',
  uacute: 'ú', Uacute: 'Ú', ugrave: 'ù', Ugrave: 'Ù', ucirc: 'û', Ucirc: 'Û',
  uuml: 'ü', Uuml: 'Ü',
  ntilde: 'ñ', Ntilde: 'Ñ', ccedil: 'ç', Ccedil: 'Ç', szlig: 'ß',
  yacute: 'ý', Yacute: 'Ý', yuml: 'ÿ',
  // Math / misc
  times: '×', divide: '÷', frac12: '½', frac14: '¼', frac34: '¾',
  iexcl: '¡', iquest: '¿', ordf: 'ª', ordm: 'º', deg: '°',
};

// ── HTML → plain text ─────────────────────────────────────────────────────────
function stripHtml(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?(p|div|li|tr|td|th|h[1-6])[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&([a-zA-Z]+);/g, (m, n) => HTML_ENT[n] ?? m)
    .replace(/&#(\d+);/g,      (_, n)  => String.fromCharCode(+n))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\s+/g, ' ')
    .trim();
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

  // Title: use RSS title if meaningful, otherwise generate from first sentence
  // item.title comes through tagContent() which only XML-decodes, so named HTML
  // entities (e.g. &eacute;) survive — decode them here.
  let title = (item.title || '')
    .replace(/&([a-zA-Z]+);/g, (m, n) => HTML_ENT[n] ?? m)
    .replace(/&#(\d+);/g,      (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
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

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    headers: { apikey: SECRET_KEY },
  });
  if (!res.ok) throw new Error(`Supabase GET ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sbPost(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method:  'POST',
    headers: {
      apikey:          SECRET_KEY,
      'Content-Type':  'application/json',
      Prefer:          'return=minimal',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase POST ${res.status}: ${await res.text()}`);
}

// Normalise a title for fuzzy duplicate comparison:
//   • lowercase
//   • strip spaces around punctuation ( : - – — / )
//   • collapse whitespace
function normaliseTitle(t) {
  return t
    .toLowerCase()
    .replace(/\s*([:\-–—\/|,;])\s*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

// Fetch all events on this date and compare normalised titles.
// Treats one title as a match if it is a prefix of the other (handles
// cases where the same event was entered with a truncated or extended title).
async function isDuplicate(title, date) {
  const rows = await sbGet(
    `/events?date=eq.${encodeURIComponent(date)}&select=title`
  );
  const normNew = normaliseTitle(title);
  return rows.some(r => {
    const normEx = normaliseTitle(r.title);
    return normNew === normEx ||
           normNew.startsWith(normEx) ||
           normEx.startsWith(normNew);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const autoApprove = process.argv.includes('--auto-approve');
  const insertStatus = autoApprove ? 'approved' : 'pending';

  if (!SUPABASE_URL || !SECRET_KEY) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SECRET_KEY must be set (check .env).');
    process.exit(1);
  }

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

  let inserted = 0, dupes = 0, errors = 0;
  const log = [];

  for (const evt of events) {
    let dupe = false;
    try { dupe = await isDuplicate(evt.title, evt.date); }
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

    try {
      await sbPost('/events', { ...evt, status: insertStatus });
      inserted++;
      log.push({ status: 'NEW  ', date: evt.date, title: evt.title, kids: evt.is_for_kids });
    } catch (err) {
      errors++;
      log.push({ status: 'ERROR', date: evt.date, title: evt.title, note: err.message });
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const bar = '─'.repeat(62);
  console.log(bar);
  console.log('NAAS LIBRARY EVENT IMPORT — SUMMARY');
  console.log(bar);
  console.log(`  RSS items found      : ${rawItems.length}`);
  console.log(`  Parseable events     : ${events.length}  (${skipped} skipped — no date found)`);
  console.log(`  Inserted (${insertStatus.padEnd(8)}) : ${inserted}`);
  console.log(`  Skipped (dupes)      : ${dupes}`);
  console.log(`  Errors               : ${errors}`);

  if (log.length) {
    console.log('');
    console.log('Details:');
    for (const r of log) {
      const kids = r.kids ? ' [kids]' : '';
      const note = r.note ? ` — ${r.note}` : '';
      console.log(`  [${r.status}] ${r.date}  ${r.title}${kids}${note}`);
    }
  }

  console.log(bar);
  if (inserted > 0) {
    console.log(`\n✓ ${inserted} new event(s) added with status "${insertStatus}".`);
    if (insertStatus === 'pending') {
      console.log('  Review and approve them in the admin panel (/admin.html).');
    }
  } else {
    console.log('\nNo new events to import.');
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
