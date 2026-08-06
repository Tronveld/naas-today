#!/usr/bin/env node
'use strict';

/**
 * fix-moat-times.js
 * One-time migration: fill in the start and end times on Moat Theatre rows that
 * were stored without one.
 *
 * Moat Theatre was scraped with parseListingPage until 2026-08-06. That parser
 * never extracted a time — it reads <time datetime="..."> for the date only, and
 * Squarespace puts the date in that attribute and the time in the element's
 * text. So 81 future rows landed with time = null AND is_all_day = false, a
 * combination EventCard renders as "TBC": no time, and no ALL DAY badge either.
 *
 * The times were always published. Moat runs the same Squarespace events
 * collection as Kildare Heritage, and its ?format=json feed carries real start
 * and end times. This reads that feed and backfills the stored rows.
 *
 * Rows are matched on normalised title + date, and only rows that currently have
 * no time are touched — an existing time is never overwritten.
 *
 * Requires Node.js 18+ (built-in fetch).
 * Reads SUPABASE_URL and SUPABASE_SECRET_KEY from environment or .env file.
 *
 * Usage: node scripts/fix-moat-times.js [--dry-run]
 */

const { loadEnv, createClient, normaliseTitle, stripHtml } = require('./lib');
const { fetchSquarespaceEvents } = require('./scrape-sources');

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SECRET_KEY   = process.env.SUPABASE_SECRET_KEY;

const FEED_URL = 'https://www.moattheatre.com/shows';
const TODAY    = new Date().toLocaleDateString('en-CA');

// stripHtml before comparing: the adapter hands titles over raw, and it is
// jsonLdToEvent that decodes them on the way into the database. So the feed says
// "Sip &amp; Paint" and "Andrea Bocelli Experience&nbsp;" where the stored rows
// say "Sip & Paint" and "Andrea Bocelli Experience".
const key = (title, date) => `${normaliseTitle(stripHtml(title))}|${date}`;

// "2026-08-21T19:00" → { date, time }. The feed is already Dublin-local by the
// time the adapter has run, so no conversion happens here.
function split(iso) {
  const m = String(iso || '').match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?/);
  return m ? { date: m[1], time: m[2] || null } : { date: null, time: null };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (!SUPABASE_URL || !SECRET_KEY) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SECRET_KEY must be set (check .env).');
    process.exit(1);
  }
  if (dryRun) console.log('[DRY RUN] No rows will be updated.\n');

  const sb = createClient(SUPABASE_URL, SECRET_KEY);

  // ── The feed, indexed by title + date ──────────────────────────────────────
  const ldEvents = await fetchSquarespaceEvents(FEED_URL);
  const feed = new Map();
  for (const e of ldEvents) {
    const start = split(e.startDate);
    if (!start.date || !start.time) continue;      // nothing to backfill from
    // Some rows carry endDate == startDate. Storing an end equal to the start
    // would render "19:00–19:00" on the card; no end time is the honest answer.
    const end = split(e.endDate).time;
    feed.set(key(e.name, start.date), { time: start.time, time_end: end === start.time ? null : end });
  }
  console.log(`Feed: ${ldEvents.length} upcoming event(s), ${feed.size} with a usable start time.`);

  // ── The stored rows that need one ──────────────────────────────────────────
  const rows = await sb.get(
    `/events?select=id,title,date,time,is_all_day,location,source&date=gte.${TODAY}&time=is.null`
  );
  const moat = rows.filter(r => /moat/i.test(r.location || '') || r.source === 'moattheatre.com');
  console.log(`Stored: ${moat.length} future Moat row(s) with no time.\n`);

  let fixed = 0, unmatched = 0, errors = 0;

  for (const row of moat) {
    const hit = feed.get(key(row.title, row.date));
    if (!hit) {
      unmatched++;
      console.log(`  [MISS ] ${row.date}  ${row.title.slice(0, 62)}`);
      continue;
    }

    const patch = { time: hit.time, time_end: hit.time_end, is_all_day: false };
    if (dryRun) {
      fixed++;
      console.log(`  [DRY  ] ${row.date}  ${hit.time}${hit.time_end ? '–' + hit.time_end : ''}  ${row.title.slice(0, 52)}`);
      continue;
    }

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${row.id}`, {
        method:  'PATCH',
        headers: {
          apikey:         SECRET_KEY,
          Authorization:  `Bearer ${SECRET_KEY}`,
          'Content-Type': 'application/json',
          Prefer:         'return=minimal',
        },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`Supabase PATCH ${res.status}: ${await res.text()}`);
      fixed++;
      console.log(`  [FIX  ] ${row.date}  ${hit.time}${hit.time_end ? '–' + hit.time_end : ''}  ${row.title.slice(0, 52)}`);
    } catch (err) {
      errors++;
      console.log(`  [ERROR] ${row.date}  ${row.title.slice(0, 52)} — ${err.message}`);
    }
  }

  const bar = '─'.repeat(62);
  console.log('\n' + bar);
  console.log(`  ${dryRun ? 'Would fix' : 'Fixed   '}          : ${fixed}`);
  console.log(`  Not in the feed    : ${unmatched}`);
  console.log(`  Errors             : ${errors}`);
  console.log(bar);

  if (unmatched) {
    console.log(
      '\nUnmatched rows are events the feed no longer lists — a past run picked them\n' +
      'up and Moat has since removed or renamed them. They keep showing "TBC".'
    );
  }

  process.exitCode = errors > 0 ? 1 : 0;
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
