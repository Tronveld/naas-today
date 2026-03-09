---
allowed-tools: Bash(node scripts/import-events.js*)
description: Bulk-import events from a CSV file into Supabase as pending events
---

## Your task

Run the CSV event import script and show the results to the user.

```
node scripts/import-events.js $ARGUMENTS
```

The first argument should be the path to the CSV file. The optional `--dry-run` flag simulates the import without writing to the database.

**CSV format** — the file must have a header row with these column names (all optional except `title`, `date`, `location`):

```
title, date, time, location, description, end_date, time_end, is_all_day, is_free, is_for_kids, url
```

- `date` must be `YYYY-MM-DD`; rows with a missing or `UNKNOWN` date are skipped
- `time` / `time_end` should be `HH:MM` (24-hour)
- Boolean columns (`is_all_day`, `is_free`, `is_for_kids`) accept `true`/`false`, `1`/`0`, or `yes`/`no`
- All inserted events are set to `status = "pending"` and must be approved via the admin panel

After running, show the complete output (including the summary table and details list) to the user verbatim.

Do not use any other tools or take any other actions.
