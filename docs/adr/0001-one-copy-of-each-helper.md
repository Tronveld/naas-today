# 0001 — One copy of each helper

**Status:** accepted. Applied repeatedly 2026-08 → 2026-09.

## Context

Duplicated logic is the defect this project hits most. Each time, a fix landed in one copy and the other kept the bug:

- **Validators.** `submit-event`, `submit-recurring` and `admin-events` each had a `validDate`. Only the first checked month lengths, so `2026-02-31` was refused by the public form and accepted by the recurring form — the one that writes up to 104 rows.
- **Submit form.** `index.astro` and `AppModals.astro` each carried the modal system and submit form; the second was a TypeScript retype of the first.
- **Day phrasing.** Band and client script each built the day's sentence, and the page showed "Tomorrow, 10:00 AM" above "10am" for the same event.
- **Events query.** The column list was written in `get-events.js` and `index.astro`; adding a column to one left pre-rendered cards silently missing it.
- **Recurrence dates.** The form's occurrence counter was fixed for the UTC off-by-one (flagged in `docs/critique-2026-08-05-actions.md`); the server's generator was not, so under `netlify dev` every row was stored a day early. The same generator overflowed months (Jan 31 → Mar 3) and copied the first occurrence's `end_date` to every row.
- **Day matching.** "Is this event on day X" was written in four places.

## Decision

Logic used by more than one caller lives in exactly one module, and every caller imports it:

| Module | Holds |
|---|---|
| `netlify/functions/lib/validate.js` | Event validation for every write path |
| `netlify/functions/lib/events-query.js` | `approvedEventsQuery`, `dublinToday` |
| `netlify/functions/lib/recurrence.js` | Series date generation (UTC string arithmetic) |
| `netlify/functions/lib/rate-limit.js` | Per-IP limiter, `clientIp` |
| `src/scripts/date.js` | Date formatting, the day's phrasing, `isOnDay` |
| `src/scripts/modal-form.js`, `draft.js` | Modals, submit form, draft persistence |
| `src/scripts/flags.js` | Constants that govern both markup and behaviour |

Shared server modules sit in `netlify/functions/lib/` because Netlify deploys every top-level file in `netlify/functions/` as a function — an underscore prefix does not exempt it. Modules the Astro build also imports are ESM (Rollup cannot resolve CommonJS there); esbuild converts them for `require`.

## Consequences

`tests/validator-parity.test.js` runs one set of inputs through every write path so a new fork fails loudly. Before writing a helper, search for an existing one.
