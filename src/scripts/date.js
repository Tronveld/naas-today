// The local-date rule, in one place.
//
// `toISOString()` converts to UTC first, so for any date built at local midnight
// it can return the previous day west of Greenwich and — during Irish summer
// time — hand back yesterday for a date the visitor picked as today. CLAUDE.md
// warns about this everywhere and the codebase still grew a copy that did it
// (`updateRecurrenceHint`, which could miscount a recurring series by one
// occurrence across the DST boundary).
//
// index.astro and modal-form.js both import this rather than keeping a local
// copy. This project has been bitten twice by a helper duplicated and left to
// drift — the three `validDate`s, and the two modal systems.

// The same applies to *time* formatting, for a different reason. The card, the
// pre-rendered upcoming list and the client's re-render of that list each had
// their own formatter, and two of the three disagreed: a 2pm event read
// "2:00 PM" on its card and "14:00" in Coming up, on the same screen. 12-hour
// with a meridiem is the form DESIGN.md documents for the Time Pill, and the
// less surprising one for the audience PRODUCT.md names.

/** `HH:MM[:SS]` split into its 12-hour parts, e.g. `{ time: '2:00', ampm: 'PM' }`. */
export function formatTimeShort(time) {
  const [hours, minutes] = time.substring(0, 5).split(':');
  const hour = parseInt(hours, 10);
  return {
    time: `${hour % 12 || 12}:${minutes}`,
    ampm: hour >= 12 ? 'PM' : 'AM',
  };
}

/** `HH:MM[:SS]` as a single display string, e.g. `2:00 PM`. */
export function shortTimeLabel(time) {
  const { time: t, ampm } = formatTimeShort(time);
  return `${t} ${ampm}`;
}

/**
 * The compact clock the cards, the strip and the band all read in: `10am`,
 * `10:30am`. Drops `:00` because a whole hour is the common case and `10:00 AM`
 * spends four characters saying nothing — which matters when the time now leads
 * the card instead of sitting in a pill beside it.
 */
export function clockLabel(time) {
  const [h, m] = time.substring(0, 5).split(':').map(Number);
  const suffix = h < 12 ? 'am' : 'pm';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, '0')}${suffix}`;
}

/** `10am–3pm`, or just the start when there is no end time. En dash, not hyphen. */
export function timeRangeLabel(start, end) {
  return end ? `${clockLabel(start)}–${clockLabel(end)}` : clockLabel(start);
}

/** A Date (or anything Date accepts) as YYYY-MM-DD in *local* time. */
export function localDateStr(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// The day's answer, in the band, is now the largest thing on the page — so the
// server's version and the client's have to be the same string, character for
// character, or the sentence rewrites itself under the reader on hydration.
// Both import from here for the same reason the time formatters were merged.

const COUNT_WORDS = ['Nothing', 'One', 'Two', 'Three', 'Four', 'Five', 'Six',
  'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

/**
 * The band's sentence, e.g. `Nothing on today.` / `Six things on Saturday.`
 * `dayWord` is what the day is called — see `dayWordFor`.
 */
export function dayAnswer(count, dayWord) {
  if (count === 0) return `Nothing on ${dayWord}.`;
  if (count === 1) return `One thing on ${dayWord}.`;
  return `${COUNT_WORDS[count] ?? count} things on ${dayWord}.`;
}

/**
 * What to call the day inside the sentence: `today` on the day itself, the
 * weekday otherwise. Deliberately not "tomorrow" — "Nothing on tomorrow" reads
 * worse than "Nothing on Tuesday", and the band already carries the full date.
 */
export function dayWordFor(dateStr, todayStr) {
  if (dateStr === todayStr) return 'today';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IE', { weekday: 'long' });
}

/** `Tomorrow` / `Saturday` — used by the band's "Next in Naas" line only. */
export function relativeDayLabel(dateStr, fromStr) {
  const a = new Date(fromStr + 'T00:00:00');
  const b = new Date(dateStr + 'T00:00:00');
  if (Math.round((b - a) / 86400000) === 1) return 'Tomorrow';
  return b.toLocaleDateString('en-IE', { weekday: 'long' });
}

/**
 * The band's "next in Naas" sentence, e.g. `Next in Naas is tomorrow at 10am`.
 * One sentence rather than a label above a time, and one definition rather than
 * two: Band.astro renders it and renderBand() rewrites it on hydration.
 * `time` is `HH:MM[:SS]` or falsy.
 */
export function nextPhrase({ date, time, isAllDay }, fromStr) {
  const rel = relativeDayLabel(date, fromStr);
  const day = rel === 'Tomorrow' ? 'tomorrow' : `on ${rel}`;
  if (isAllDay) return `Next in Naas is ${day}, all day`;
  if (!time) return `Next in Naas is ${day}, time to be confirmed`;
  return `Next in Naas is ${day} at ${clockLabel(time)}`;
}

/** The seven dates the week strip offers, starting today. */
export function weekAhead(todayStr) {
  const start = new Date(todayStr + 'T00:00:00');
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return localDateStr(d);
  });
}
