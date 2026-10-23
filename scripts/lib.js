#!/usr/bin/env node
'use strict';

/**
 * lib.js — shared utilities for Naas Today scripts.
 */

const fs   = require('fs');
const path = require('path');

// ── Load .env ─────────────────────────────────────────────────────────────────
function loadEnv() {
  const envFile = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let   v = t.slice(eq + 1).trim();
    if (v.length >= 2 && ((v[0] === '"' && v.endsWith('"')) || (v[0] === "'" && v.endsWith("'")))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

// ── Named HTML entities ────────────────────────────────────────────────────────
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
  return (html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?(p|div|li|tr|td|th|h[1-6])[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&([a-zA-Z]+);/g, (m, n) => HTML_ENT[n] ?? m)
    .replace(/&#(\d+);/g,      (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Matches common "for kids" signals ─────────────────────────────────────────
const KIDS_RE = /\b(bab(y|ies)|toddler|children|child\b|kids?|\d+\s*-?\s*year\s*-?\s*olds?|junior|youth|playgroup|storytime for)\b/i;

// ── Title normalisation for duplicate detection ───────────────────────────────
// Dash and apostrophe variants are folded to one form before comparing. Listing
// sites copy titles from each other by hand, so the same event reaches us as
// "Movicals – ..." from one source and "Movicals - ..." from another. Without
// this, isDuplicate says no and the event appears twice on the site.
function normaliseTitle(t) {
  return t
    .toLowerCase()
    .replace(/[–—]/g, '-')   // en dash, em dash → hyphen
    .replace(/[‘’]/g, "'")   // curly quotes → straight apostrophe
    .replace(/\s*[:\-\/|]\s*/g, '-')   // "A: B", "A - B", "A | B" are one separator
    .replace(/\s*([,;])\s*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Same-event check ──────────────────────────────────────────────────────────
// Two rows on one date are the same event when their titles match (equal or one
// a prefix of the other), or when the titles share two real words AND the rows
// share a url or a start time and venue. The second rule catches what titles
// alone miss: a source retitling an event ("Mindful Running with…" → "Mindful
// Running for Performance…", same url), and two sites naming one concert
// differently ("Bill Laurence" / "Music Network Presents Bill Laurance", same
// time and church — a one-letter misspelling still counts as a shared word).
// Two shared words, not one, keep a listing-page url or a busy venue from
// merging "Re-pulp … Workshop" with "Cyber Safety Workshop".
const FILLER_WORDS = new Set(['with', 'from', 'presents', 'featuring', 'live', 'music', 'night', 'naas', 'week', 'club', 'session', 'show', 'event']);

function titleWords(t) {
  return [...new Set(
    t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .split(/[^a-z0-9]+/)
      .filter(w => w.length >= 4 && !FILLER_WORDS.has(w)),
  )];
}

// Equal, or for words of five letters or more, one letter added, dropped or changed.
function sameWord(x, y) {
  if (x === y) return true;
  if (x.length < 5 || y.length < 5 || Math.abs(x.length - y.length) > 1) return false;
  let i = 0;
  while (i < x.length && x[i] === y[i]) i++;
  const tail = (u, v) => u.slice(i + (u.length >= v.length ? 1 : 0)) === v.slice(i + (v.length >= u.length ? 1 : 0));
  return tail(x, y);
}

function sharedWords(a, b) {
  const wordsB = titleWords(b);
  return titleWords(a).filter(w => wordsB.some(v => sameWord(w, v))).length;
}

// "The Moat Theatre, Abbey Rd" and "Moat Theatre" are one venue: compare the
// part before the first comma, without a leading "the" or punctuation.
function venueKey(loc) {
  if (!loc) return null;
  const key = loc.split(',')[0].toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]+/g, '');
  return key || null;
}

function host(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return null; }
}

function isSameEvent(a, b) {
  if (a.date !== b.date) return false;

  const time = t => (t ? t.slice(0, 5) : null);   // Postgres returns HH:MM:SS
  const timeA = time(a.time), timeB = time(b.time);
  const timesAgree = timeA == null || timeB == null || timeA === timeB;
  const ta = normaliseTitle(a.title), tb = normaliseTitle(b.title);

  if (ta === tb || ta.startsWith(tb) || tb.startsWith(ta)) {
    // A matinee and an evening showing: one site, one title, a page each. A time
    // alone does not separate them — sites move a show's time on the same page
    // (Dan McCabe 20:00 → 19:30), and that is still one event.
    const twoShowings = ta === tb && !timesAgree
      && a.url && b.url && a.url !== b.url && host(a.url) === host(b.url);
    return !twoShowings;
  }

  if (!timesAgree || sharedWords(a.title, b.title) < 2) return false;

  // A festival's events across town share one url, so a known venue must agree.
  const venueA = venueKey(a.location), venueB = venueKey(b.location);
  if (a.url && a.url === b.url) return venueA == null || venueB == null || venueA === venueB;
  return timeA != null && venueA != null && venueA === venueB;
}

// ── Supabase client factory ───────────────────────────────────────────────────
// Returns { get, post, isDuplicate, cacheInserted }.
// isDuplicate caches per-date DB queries for the lifetime of the client instance.
// Call cacheInserted after each successful insert so subsequent isDuplicate calls
// within the same run detect just-inserted events as duplicates.
function createClient(url, key) {
  const dateCache = new Map(); // date → rows with the fields isSameEvent reads

  async function get(p) {
    const res = await fetch(`${url}/rest/v1${p}`, {
      headers: { apikey: key },
    });
    if (!res.ok) throw new Error(`Supabase GET ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async function post(p, body) {
    const res = await fetch(`${url}/rest/v1${p}`, {
      method:  'POST',
      headers: {
        apikey:         key,
        'Content-Type': 'application/json',
        Prefer:         'return=minimal',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Supabase POST ${res.status}: ${await res.text()}`);
  }

  // evt: { title, date, time?, location?, url? }
  async function isDuplicate(evt) {
    let rows;
    if (dateCache.has(evt.date)) {
      rows = dateCache.get(evt.date);
    } else {
      rows = await get(`/events?date=eq.${encodeURIComponent(evt.date)}&select=title,date,time,location,url`);
      dateCache.set(evt.date, rows);
    }
    return rows.some(r => isSameEvent(evt, r));
  }

  function cacheInserted(evt) {
    const rows = dateCache.get(evt.date);
    if (rows) rows.push(evt);
  }

  return { get, post, isDuplicate, cacheInserted };
}

// ── Run summary ───────────────────────────────────────────────────────────────
// All three importers print the same shape: a titled bar, a block of counters,
// then one line per event. `counters` is an object so each caller keeps its own
// labels; `log` entries carry { status, date, title } plus optional note/kids/loc.
function printSummary(title, counters, log) {
  const bar = '─'.repeat(62);
  console.log(bar);
  console.log(title);
  console.log(bar);
  const width = Math.max(...Object.keys(counters).map(k => k.length));
  for (const [label, value] of Object.entries(counters)) {
    console.log(`  ${label.padEnd(width)} : ${value}`);
  }

  if (log.length) {
    console.log('');
    console.log('Details:');
    for (const r of log) {
      const note = r.note ? ` — ${r.note}` : '';
      // A source-level entry has a url and no date; an event entry has a date.
      if (!r.date) {
        console.log(`  [${r.status}] ${r.url}${note}`);
        continue;
      }
      const kids = r.kids ? ' [kids]'     : '';
      const loc  = r.loc  ? ` @ ${r.loc}` : '';
      console.log(`  [${r.status}] ${r.date}  ${r.title}${kids}${loc}${note}`);
    }
  }

  console.log(bar);
}

// A fetcher that hits errors must exit non-zero. Exiting 0 on a dead source is
// how a broken feed hides: the workflow goes green, nobody looks, and the site
// quietly thins out — the same failure that let the library feed go five and a
// half weeks without a pull. Non-zero makes the workflow retry, and makes a
// persistent break red.
//
// Inserting nothing is deliberately not an error: a run where every event is a
// duplicate is what a healthy second pull of the day looks like. A source whose
// page yields no events at all is — that is what a redesign looks like to a
// parser, and as a warning in a green run nobody saw it.
function exitCode({ sourceErrors = 0, emptySources = 0, eventErrors = 0 } = {}) {
  return sourceErrors > 0 || emptySources > 0 || eventErrors > 0 ? 1 : 0;
}

// Where a scraped row came from, for the `source` column. Bare host, so the
// bare and www. forms of one site do not tally as two separate feeds.
// Returns null rather than throwing: the tag is diagnostic, and failing to
// derive one must not cost the event itself.
function sourceForUrl(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

// Writes a GitHub Actions step output. Both fetchers report `inserted` this way,
// so the workflow can decide whether a rebuild is worth its 15 credits — most
// days the answer is zero and the rebuild is pure waste.
// Returns whether it wrote anything — off CI there is no $GITHUB_OUTPUT and
// this is a no-op, since the fetchers run locally far more often than in CI.
function setOutput(key, value) {
  const out = process.env.GITHUB_OUTPUT;
  if (!out) return false;
  fs.appendFileSync(out, `${key}=${value}\n`);
  return true;
}

// Retry the *source*, not the run. Two of the five block intermittently:
// whatsontonight.ie drops the connection from datacenter IPs and intokildare.ie
// returns 429. The workflow used to retry the whole script three times, which
// needed all five sources green in the same attempt — on 2026-08-23 every
// source succeeded at some point and the run still went red, because a
// different one failed each time. Retrying here makes each source's flakiness
// its own problem, and leaves the run red only for a source that is really down.
async function fetchWithRetry(url, headers, attempts = 3, delayMs = 5000) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers, redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return res;
    } catch (err) {
      if (i >= attempts) throw err;
      await new Promise(r => setTimeout(r, i * delayMs));
    }
  }
}

module.exports = {
  loadEnv, HTML_ENT, stripHtml, KIDS_RE, normaliseTitle, isSameEvent, createClient, exitCode, sourceForUrl,
  setOutput, printSummary, fetchWithRetry,
};
