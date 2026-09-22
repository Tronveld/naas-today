# 0006 — Past days are not viewable

**Status:** accepted 2026-09-23.

## Context

`get-events` and the build both fetched every approved event ever. By 2026-09-23 that was 887 rows, 450 already over; the homepage inlined all of them (566 KB) and then fetched them again (542 KB) on every visit, drawing on the bandwidth credits in ADR 0004 and growing daily.

## Decision

Visitors see today and later only. `approvedEventsQuery(today)` returns events with `date >= today` or `end_date >= today` (so a multi-day event is kept through its last day). The date picker's `min` is today, and `readUrlState` ignores a past `?date=` as it would a malformed one. "Today" is Naas's date — `dublinToday()` server-side, `localDateStr()` in the browser.

## Consequences

Homepage HTML 298 KB, feed 274 KB at the time of the change. Past rows stay in the database; nothing deletes them.
