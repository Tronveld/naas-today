# 0002 — Feeds auto-approve; `pending` means a person wrote it

**Status:** accepted 2026-08-05; reminder narrowed 2026-09-23.

## Context

The admin queue mixed ~88 scraped rows a week with ~1 human submission. Nobody opens a list of 88 to find the 1, so submissions sat unreviewed for weeks.

## Decision

- Every row records its origin in `source`: `submission`, a scraped site's hostname, `naas-library`, or `csv-import`. `source` is not in `ALLOWED_PATCH_FIELDS` — it records what happened.
- The scheduled fetchers (the workflow's scraper, the launchd library pull) run with `--auto-approve`. Their feeds are vetted and every row is date-validated, Naas-filtered and duplicate-checked first.
- `notify-pending.js` emails daily while a `source = 'submission'` row that has not ended is pending. Daily, because a single email is what gets missed; silent on an empty queue, because a daily "0 waiting" teaches the reader to skip it.
- The anon insert policy requires `status = 'pending' AND source = 'submission'`, so nothing posted with the anon key can pose as a scraped source.

## Consequences

A scraper bug publishes to the live site with nobody in the loop. `scripts/audit-event-dates.js` is the read-only backstop; run it after any scraper change.

Until 2026-09-23 the reminder counted any pending row. A library row from a manual pull without `--auto-approve`, dated 2026-09-02, triggered it daily for five weeks.
