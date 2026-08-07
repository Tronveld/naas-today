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

/** A Date (or anything Date accepts) as YYYY-MM-DD in *local* time. */
export function localDateStr(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
