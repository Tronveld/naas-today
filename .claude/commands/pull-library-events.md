---
allowed-tools: Bash(node scripts/pull-library-events.js*)
description: Fetch upcoming events from Naas Library RSS feed and import into Supabase
---

## Your task

Run the Naas Library event import script and show the results to the user.

If the user passed `--auto-approve` as an argument (`$ARGUMENTS`), forward it to the script:

```
node scripts/pull-library-events.js $ARGUMENTS
```

Otherwise run without flags:

```
node scripts/pull-library-events.js
```

The `--auto-approve` flag sets inserted events to `status = "approved"` (immediately visible on the public site). Without it, events are inserted as `status = "pending"` and must be approved via the admin panel.

After running, show the complete output (including the summary table) to the user verbatim.

Do not use any other tools or take any other actions.
