# 0003 — Bulk edits never carry a date

**Status:** accepted 2026-08.

## Context

Both bulk PATCH paths in `admin-events.js` (`ids` and `group_id`) apply one field object to many rows. Editing one Naas Country Market occurrence with "this and all future events" sent its `date` along, collapsing 85 Friday occurrences onto 2026-08-07; the live site showed 85 copies of the market on one day.

## Decision

`stripBulkImmutable` drops `date` and `end_date` in both bulk modes and reports them as `ignored`. Dropped, not rejected: `public/admin.html` always includes `date: editDate.value` in the fields it passes to `apiPatchGroup`, so a 400 would block bulk-editing a time or a flag. Single-event edits can still change a date.

## Consequences

Fixing a date across a series means editing each row. The DB constraint `events_end_not_before_start` (2026-09-23) guards the other half: a row cannot end before it starts.
