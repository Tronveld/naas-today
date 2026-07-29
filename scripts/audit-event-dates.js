#!/usr/bin/env node
'use strict';

/**
 * audit-event-dates.js
 * Checks every row already in the events table against the CURRENT validators.
 *
 * Read-only — this script never writes to Supabase. It answers a question tests
 * cannot: the test suite proves the validator is correct from now on, but says
 * nothing about rows inserted while the validator was wrong.
 *
 * The validators are imported from the live function rather than reimplemented,
 * so the audit cannot drift from what submissions are actually checked against.
 *
 * Requires Node.js 18+ (built-in fetch).
 * Reads SUPABASE_URL and SUPABASE_SECRET_KEY from environment or .env file.
 * The secret key is used so pending (unapproved) rows are visible too.
 *
 * Usage:
 *   node scripts/audit-event-dates.js
 */

const { loadEnv, createClient } = require('./lib');
const { validDate, validTime } = require('../netlify/functions/submit-event.js');

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SECRET_KEY   = process.env.SUPABASE_SECRET_KEY;

const COLUMNS = 'id,title,date,end_date,time,time_end,is_all_day,status';
const PAGE_LIMIT = 1000; // PostgREST default cap

// Each check: a label, and a predicate that returns true when the row is BAD.
const CHECKS = [
  {
    label: 'date fails validDate',
    bad: r => r.date != null && !validDate(r.date),
    show: r => r.date,
  },
  {
    label: 'end_date fails validDate',
    bad: r => r.end_date != null && !validDate(r.end_date),
    show: r => r.end_date,
  },
  {
    label: 'time fails validTime',
    bad: r => r.time != null && !validTime(r.time),
    show: r => r.time,
  },
  {
    label: 'time_end fails validTime',
    bad: r => r.time_end != null && !validTime(r.time_end),
    show: r => r.time_end,
  },
  {
    // Not enforced anywhere in submit-event.js — reported, not a validator bug.
    label: 'end_date is before date',
    bad: r => r.end_date != null && r.date != null && r.end_date < r.date,
    show: r => `${r.date} → ${r.end_date}`,
  },
];

function report(rows) {
  let offenders = 0;

  for (const check of CHECKS) {
    const hits = rows.filter(check.bad);
    const mark = hits.length === 0 ? 'ok  ' : 'FAIL';
    console.log(`[${mark}] ${check.label}: ${hits.length}`);
    offenders += hits.length;

    for (const r of hits) {
      const title = (r.title || '(untitled)').slice(0, 48);
      console.log(`         ${r.id}  ${r.status.padEnd(8)}  ${check.show(r)}  ${title}`);
    }
  }

  return offenders;
}

async function main() {
  if (!SUPABASE_URL || !SECRET_KEY) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SECRET_KEY must be set (check .env).');
    process.exit(1);
  }

  const db = createClient(SUPABASE_URL, SECRET_KEY);
  const rows = await db.get(`/events?select=${COLUMNS}&order=date&limit=${PAGE_LIMIT}`);

  console.log(`Audited ${rows.length} event row(s) against the current validators.\n`);
  if (rows.length === PAGE_LIMIT) {
    console.log(`WARNING: hit the ${PAGE_LIMIT}-row page cap — results may be incomplete.\n`);
  }

  const offenders = report(rows);

  console.log('');
  if (offenders === 0) {
    console.log('No stored row violates the current validators.');
  } else {
    console.log(`${offenders} problem(s) found. Nothing was modified — fix these by hand.`);
    process.exitCode = 1;
  }
}

main().catch(err => {
  console.error('Audit failed:', err.message);
  process.exit(1);
});
