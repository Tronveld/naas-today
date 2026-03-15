#!/usr/bin/env node
'use strict';

/**
 * fix-library-entities.js
 * One-time migration: decode HTML entities in existing Naas Library event
 * records stored in Supabase (title and description fields).
 *
 * Requires Node.js 18+ (built-in fetch).
 * Reads SUPABASE_URL and SUPABASE_SECRET_KEY from environment or .env file.
 *
 * Usage: node scripts/fix-library-entities.js
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
    if (v.length >= 2 && ((v[0] === '"' && v.endsWith('"')) || (v[0] === "'" && v.endsWith("'")))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SECRET_KEY   = process.env.SUPABASE_SECRET_KEY;

// ── Entity table (kept in sync with pull-library-events.js) ──────────────────
const HTML_ENT = {
  nbsp: ' ',  rsquo: '\u2019', lsquo: '\u2018', rdquo: '\u201D', ldquo: '\u201C',
  mdash: '\u2014', ndash: '\u2013', hellip: '\u2026', bull: '\u2022',
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  copy: '\u00A9', reg: '\u00AE', trade: '\u2122', euro: '\u20AC', pound: '\u00A3',
  // Latin-1 supplement
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

function decodeEntities(str) {
  if (!str) return str;
  return str
    .replace(/&([a-zA-Z]+);/g,      (m, n) => HTML_ENT[n] ?? m)
    .replace(/&#(\d+);/g,           (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function sbGet(url) {
  const res = await fetch(url, { headers: { apikey: SECRET_KEY } });
  if (!res.ok) throw new Error(`Supabase GET ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sbPatch(id, fields) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${id}`, {
    method:  'PATCH',
    headers: {
      apikey:         SECRET_KEY,
      'Content-Type': 'application/json',
      Prefer:         'return=minimal',
    },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error(`Supabase PATCH ${res.status}: ${await res.text()}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!SUPABASE_URL || !SECRET_KEY) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SECRET_KEY must be set (check .env).');
    process.exit(1);
  }

  console.log('Fetching Naas Library events from Supabase…');

  // Fetch all rows from the library (any status) — paginate in case there are many
  let rows = [];
  const pageSize = 1000;
  let offset = 0;
  while (true) {
    const url =
      `${SUPABASE_URL}/rest/v1/events` +
      `?location=eq.Naas%20Library` +
      `&select=id,title,description` +
      `&order=id.asc` +
      `&limit=${pageSize}&offset=${offset}`;
    const page = await sbGet(url);
    rows = rows.concat(page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }

  console.log(`Found ${rows.length} Naas Library event(s).\n`);

  let updated = 0, skipped = 0, errors = 0;
  const log = [];

  for (const row of rows) {
    const newTitle = decodeEntities(row.title);
    const newDesc  = decodeEntities(row.description);

    const titleChanged = newTitle !== row.title;
    const descChanged  = newDesc  !== row.description;

    if (!titleChanged && !descChanged) {
      skipped++;
      continue;
    }

    const patch = {};
    if (titleChanged) patch.title       = newTitle;
    if (descChanged)  patch.description = newDesc;

    try {
      await sbPatch(row.id, patch);
      updated++;
      if (titleChanged) {
        log.push(`  [UPDATED] title: "${row.title}" → "${newTitle}"`);
      }
      if (descChanged) {
        // Show only a diff snippet for descriptions to keep output readable
        const before = (row.description || '').slice(0, 80);
        const after  = (newDesc         || '').slice(0, 80);
        if (before !== after) {
          log.push(`  [UPDATED] desc (first 80 chars): "${before}" → "${after}"`);
        } else {
          log.push(`  [UPDATED] description (entity further in text) for id=${row.id}`);
        }
      }
    } catch (err) {
      errors++;
      log.push(`  [ERROR] id=${row.id} title="${row.title}": ${err.message}`);
    }
  }

  const bar = '─'.repeat(62);
  console.log(bar);
  console.log('NAAS LIBRARY ENTITY FIX — SUMMARY');
  console.log(bar);
  console.log(`  Rows examined : ${rows.length}`);
  console.log(`  Updated       : ${updated}`);
  console.log(`  Skipped       : ${skipped}  (no entities found)`);
  console.log(`  Errors        : ${errors}`);

  if (log.length) {
    console.log('');
    console.log('Details:');
    for (const line of log) console.log(line);
  }

  console.log(bar);
  if (updated > 0) {
    console.log(`\n✓ ${updated} event(s) updated with decoded text.`);
  } else if (errors === 0) {
    console.log('\nNo entities found — nothing to update.');
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
