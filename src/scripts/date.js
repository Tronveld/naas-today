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

/** A Date (or anything Date accepts) as YYYY-MM-DD in *local* time. */
export function localDateStr(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
