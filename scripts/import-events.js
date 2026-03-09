#!/usr/bin/env node
'use strict';

/**
 * import-events.js
 * Bulk-imports events from a CSV file into Supabase as pending events.
 *
 * Requires Node.js 18+ (built-in fetch).
 * Reads SUPABASE_URL and SUPABASE_SECRET_KEY from environment or .env file.
 *
 * Usage: node scripts/import-events.js <file.csv> [--dry-run]
 *
 * CSV columns (header row required):
 *   title, date, time, location, description, end_date, time_end,
 *   is_all_day, is_free, is_for_kids, url
 *
 * All inserted events are set to status = 'pending'.
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

// ── CLI args ──────────────────────────────────────────────────────────────────
const args    = process.argv.slice(2);
const dryRun  = args.includes('--dry-run');
const csvPath = args.find(a => !a.startsWith('--'));

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function sbGet(p) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${p}`, {
    headers: { apikey: SECRET_KEY },
  });
  if (!res.ok) throw new Error(`Supabase GET ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sbPost(p, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${p}`, {
    method:  'POST',
    headers: {
      apikey:         SECRET_KEY,
      'Content-Type': 'application/json',
      Prefer:         'return=minimal',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase POST ${res.status}: ${await res.text()}`);
}

// ── Normalise a string for duplicate detection ────────────────────────────────
function normalise(s) {
  return s.toLowerCase().replace(/[''`]/g, "'").replace(/\s+/g, ' ').trim();
}

// ── Parse a single CSV line, respecting quoted fields ────────────────────────
function parseCsvLine(line) {
  const fields = [];
  let cur = '';
  let inQuote = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"') {
        // Escaped quote ("") or end of quoted field
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuote = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuote = true;
      } else if (ch === ',') {
        fields.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
  }
  fields.push(cur);
  return fields;
}

// ── Parse CSV text → array of objects ────────────────────────────────────────
function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  // Find first non-empty line as header
  let headerIdx = lines.findIndex(l => l.trim().length > 0);
  if (headerIdx === -1) return [];

  const headers = parseCsvLine(lines[headerIdx]).map(h => h.trim().toLowerCase());
  const rows = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const values = parseCsvLine(line);
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = (values[j] ?? '').trim();
    }
    rows.push(obj);
  }
  return rows;
}

// ── Coerce a CSV row into a Supabase event record ────────────────────────────
function rowToEvent(row) {
  const bool = v => v === '' ? null : (v === 'true' || v === '1' || v === 'yes');
  const optional = v => v === '' ? null : v;

  return {
    title:       row.title       || '',
    date:        row.date        || '',
    time:        optional(row.time),
    location:    row.location    || '',
    description: optional(row.description),
    end_date:    optional(row.end_date),
    time_end:    optional(row.time_end),
    is_all_day:  bool(row.is_all_day)  ?? false,
    is_free:     bool(row.is_free)     ?? false,
    is_for_kids: bool(row.is_for_kids) ?? false,
    url:         optional(row.url),
    status:      'pending',
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!csvPath) {
    console.error('Usage: node scripts/import-events.js <file.csv> [--dry-run]');
    process.exit(1);
  }

  if (!SUPABASE_URL || !SECRET_KEY) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SECRET_KEY must be set (check .env).');
    process.exit(1);
  }

  const resolvedPath = path.resolve(process.cwd(), csvPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`ERROR: File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const text = fs.readFileSync(resolvedPath, 'utf8');
  const rows = parseCsv(text);
  console.log(`Read ${rows.length} data row(s) from ${path.basename(resolvedPath)}.\n`);

  // ── Fetch existing events for duplicate detection ───────────────────────────
  console.log('Fetching existing events from Supabase…');
  let existing;
  try {
    existing = await sbGet('/events?select=title,date');
  } catch (err) {
    console.error('Failed to fetch existing events:', err.message);
    process.exit(1);
  }

  const existingKeys = new Set(
    existing.map(e => normalise(e.title) + '|' + e.date)
  );
  console.log(`Found ${existingKeys.size} existing event key(s) in DB.\n`);

  // ── Process rows ────────────────────────────────────────────────────────────
  let wouldInsert = 0, inserted = 0, skipDupe = 0, skipInvalid = 0;
  const log = [];

  for (const row of rows) {
    const evt = rowToEvent(row);

    // Validate required fields
    if (!evt.title) {
      skipInvalid++;
      log.push({ status: 'INVALID', date: evt.date || '??', title: '(no title)', note: 'missing title' });
      continue;
    }
    if (!evt.location) {
      skipInvalid++;
      log.push({ status: 'INVALID', date: evt.date, title: evt.title, note: 'missing location' });
      continue;
    }
    if (!evt.date || evt.date.toUpperCase() === 'UNKNOWN') {
      skipInvalid++;
      log.push({ status: 'INVALID', date: evt.date || '??', title: evt.title, note: 'missing or unknown date' });
      continue;
    }

    // Duplicate check
    const key = normalise(evt.title) + '|' + evt.date;
    if (existingKeys.has(key)) {
      skipDupe++;
      log.push({ status: 'SKIP   ', date: evt.date, title: evt.title, note: 'duplicate' });
      continue;
    }

    if (dryRun) {
      wouldInsert++;
      log.push({ status: 'DRY RUN', date: evt.date, title: evt.title });
    } else {
      try {
        await sbPost('/events', evt);
        inserted++;
        // Add key to set so later rows in same CSV don't duplicate each other
        existingKeys.add(key);
        log.push({ status: 'NEW    ', date: evt.date, title: evt.title });
      } catch (err) {
        skipInvalid++;
        log.push({ status: 'ERROR  ', date: evt.date, title: evt.title, note: err.message });
      }
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  const bar = '─'.repeat(62);
  const label = dryRun ? 'DRY RUN' : 'COMPLETE';
  console.log(bar);
  console.log(`CSV IMPORT — ${label}`);
  console.log(bar);
  if (dryRun) {
    console.log(`  Would insert          : ${wouldInsert}`);
  } else {
    console.log(`  Inserted (pending)    : ${inserted}`);
  }
  console.log(`  Skipped (duplicate)   : ${skipDupe}`);
  console.log(`  Skipped (invalid)     : ${skipInvalid}`);

  if (log.length) {
    console.log('');
    console.log('Details:');
    for (const r of log) {
      const note = r.note ? ` — ${r.note}` : '';
      console.log(`  [${r.status}] ${r.date}  ${r.title}${note}`);
    }
  }

  console.log(bar);
  if (!dryRun && inserted > 0) {
    console.log(`\n✓ ${inserted} new event(s) added with status "pending".`);
    console.log('  Review and approve them in the admin panel (/admin.html).');
  } else if (dryRun && wouldInsert > 0) {
    console.log(`\n(Dry run — no events written. Remove --dry-run to import.)`);
  } else if (!dryRun) {
    console.log('\nNo new events to import.');
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
