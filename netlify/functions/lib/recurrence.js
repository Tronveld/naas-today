// The dates of a recurring series, shared by submit-recurring.js (which writes
// them) and the submit form's "~N occurrences" hint (which counts them).
//
// Those were two copies and they drifted: the form's was fixed for the UTC
// off-by-one and the server's was not, so under netlify dev in Irish time every
// row of a series was stored a day early. ESM for the same reason as
// events-query.js — Astro's build needs it, esbuild converts it for require().
//
// All arithmetic is in UTC on YYYY-MM-DD strings, so the host's time zone and
// clock changes cannot move a date.

export const MAX_OCCURRENCES = 104;

const parse = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const format = (t) => new Date(t).toISOString().slice(0, 10);

export function addDays(dateStr, n) {
  return format(parse(dateStr) + n * 86_400_000);
}

export function daysBetween(from, to) {
  return Math.round((parse(to) - parse(from)) / 86_400_000);
}

// Monthly keeps the start's day-of-month, clamped to short months: a series on
// the 31st runs Jan 31, Feb 28, Mar 31. Stepping with setMonth instead overflows
// (Jan 31 + 1 month = Mar 3) and the series never gets back to month-end.
function nthMonth(startStr, n) {
  const [y, m, d] = startStr.split('-').map(Number);
  const lastDay = new Date(Date.UTC(y, m - 1 + n + 1, 0)).getUTCDate();
  return format(Date.UTC(y, m - 1 + n, Math.min(d, lastDay)));
}

export function generateDates(startDate, frequency, untilDate) {
  const dates = [];
  for (let i = 0; dates.length < MAX_OCCURRENCES; i++) {
    const s = frequency === 'monthly'     ? nthMonth(startDate, i)
            : frequency === 'fortnightly' ? addDays(startDate, 14 * i)
            :                               addDays(startDate, 7 * i);
    if (s > untilDate) break;
    dates.push(s);
  }
  return dates;
}
