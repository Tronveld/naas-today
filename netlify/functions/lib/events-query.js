// The approved-events query, shared by the two places that read it.
//
// `get-events.js` serves it to the browser on every page load; `index.astro`
// runs the same query at build time to pre-render the day's cards for SEO.
// The column list was written out twice, and the failure mode was quiet: add a
// column, update only the function, and the pre-rendered first paint silently
// lacks the field while the client fetch has it. Nothing errors — the card just
// renders wrong until the client re-render replaces it.
//
// ESM, because Astro's build (Rollup) cannot resolve a CommonJS module here —
// it fails on `module`/`exports` being undefined. The Netlify side is bundled by
// esbuild (see netlify.toml), which converts this for get-events.js's `require`.

export const EVENT_COLUMNS = [
  'id', 'title', 'date', 'end_date', 'time', 'time_end', 'is_all_day',
  'location', 'description', 'is_free', 'is_for_kids', 'is_music',
  'is_sport', 'is_market', 'is_theatre', 'url',
].join(',');

// "Today" in Naas, not on the server: Netlify runs in UTC, which is still
// yesterday between midnight and 1am Irish summer time. en-CA gives YYYY-MM-DD.
export function dublinToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Dublin' }).format(now);
}

// Approved events that have not ended, ordered for display. Past days are not
// viewable, so past rows were pure weight — half the table by 2026-09, sent
// twice per visit. `end_date` is in the `or` so a multi-day event that began
// last week is still here on its final day.
export function approvedEventsQuery(today = dublinToday()) {
  return `/rest/v1/events?status=eq.approved&or=(date.gte.${today},end_date.gte.${today})`
    + `&order=date.asc,time.asc&select=${EVENT_COLUMNS}`;
}
