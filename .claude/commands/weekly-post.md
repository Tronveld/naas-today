---
allowed-tools: Bash(node scripts/weekly-post.js*)
description: Generate a social media post summarising this week's events in Naas and copy it to the clipboard
---

## Your task

The user may have passed optional instructions in `$ARGUMENTS` (e.g. "include the Racecourse event, no more than two library events, include one music gig").

---

### If `$ARGUMENTS` is empty or not provided

Run the default generator and show the output verbatim:

```
node scripts/weekly-post.js
```

---

### If `$ARGUMENTS` contains instructions

**Step 1 — Fetch all events for the week as JSON:**

```
node scripts/weekly-post.js --list
```

This outputs a JSON object with `week`, `total`, and `events` (array). Each event has: `id`, `title`, `date`, `time`, `time_end`, `location`, `description`, `is_free`, `is_for_kids`, `is_all_day`, `url`.

**Step 2 — Select up to 5 event IDs** that best satisfy the user's instructions.

Apply the instructions as constraints or strong preferences. Examples of how to interpret them:
- "include the Racecourse event" → find events where `location` or `title` contains "Racecourse" and include one
- "no more than two library events" → at most 2 events where `location` contains "Library"
- "include one music gig" → find an event that sounds like a music gig and include it
- "prioritise free events" → prefer events where `is_free` is true
- Any remaining slots after satisfying explicit constraints: fill with variety (different days, different types/venues, prefer free and kids' events)

**Step 3 — Generate the post** by running the script with the selected IDs:

```
node scripts/weekly-post.js --select=<id1>,<id2>,...
```

Replace `<id1>,<id2>,...` with the comma-separated UUIDs of your chosen events.

---

Show the complete terminal output verbatim — including the generated post — so the user can review and tweak it before posting.

Do not use any other tools or take any other actions.
