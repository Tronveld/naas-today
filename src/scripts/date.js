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

// An empty day's answer — the server's version and the client's have to be the
// same string, character for character, or it rewrites itself on hydration.
// Both import from here for the same reason the time formatters were merged.

const COUNT_WORDS = ['Nothing', 'One', 'Two', 'Three', 'Four', 'Five', 'Six',
  'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

/**
 * The day's sentence, e.g. `Nothing on today.` / `Six things on Saturday.`
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

/**
 * Whether an event runs on a day. The one definition — the build-time grid, the
 * week strip counts, the band and the client re-render all ask this, and they
 * disagreed once already when only some of them understood a multi-day run.
 * Takes the dates rather than the event because the build reads Supabase's
 * `end_date` and the client script its own `endDate`.
 */
export function isOnDay(date, endDate, dayStr) {
  return endDate ? date <= dayStr && endDate >= dayStr : date === dayStr;
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

/**
 * What a week-strip column says above its count. The strip starts on today, not
 * Monday, so single initials lost the order that makes T/T and S/S readable:
 * three letters, and "Today" on the first so the run has an anchor. Shared by
 * WeekStrip.astro and the client re-render in index.astro.
 */
export function stripLabel(ds, todayStr) {
  if (ds === todayStr) return 'Today';
  return new Date(ds + 'T00:00:00').toLocaleDateString('en-IE', { weekday: 'short' });
}

