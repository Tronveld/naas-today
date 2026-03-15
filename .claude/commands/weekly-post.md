---
allowed-tools: Bash(node scripts/weekly-post.js*), Bash(pbcopy*)
description: Generate a social media post summarising this week's events in Naas and copy it to the clipboard
---

## Your task

The user may have passed optional instructions in `$ARGUMENTS` (e.g. "include the Racecourse event, no more than two library events, include one music gig").

---

**Step 1 — Fetch all events for the week as JSON:**

```
node scripts/weekly-post.js --list
```

This outputs a JSON object with `week`, `total`, and `events` (array). Each event has: `id`, `title`, `date`, `time`, `time_end`, `location`, `description`, `is_free`, `is_for_kids`, `is_all_day`, `url`.

**Step 2 — Select events.**

If `$ARGUMENTS` contains instructions, apply them as constraints or strong preferences:
- "include the Racecourse event" → find events where `location` or `title` contains "Racecourse"
- "no more than two library events" → at most 2 events where `location` contains "Library"
- "prioritise free events" → prefer events where `is_free` is true
- Fill remaining slots with variety (different days, different types/venues, prefer free and kids' events)

If `$ARGUMENTS` is empty, pick 4–6 events yourself: lead with the most interesting/unusual one, then choose for variety of day, type, and audience.

**Step 3 — Write the Facebook post yourself** using the selected events. Follow these guidelines exactly:

- **Hook**: Lead with ONE specific event described conversationally, as if telling a friend — not listing it. Include a concrete detail from the description that makes it feel real (e.g. "the library has a free craft morning for kids this Saturday — handy if you need to entertain the little ones").
- **Body**: Briefly mention 2–3 more events in a casual way — weave them into a sentence or two, not a bulleted list. Prioritise variety (different days, different types, free events).
- **Closing**: A low-key mention of the total count and the website, e.g. "There are 15 more things on this week — I keep the full list at naastoday.com". Do NOT put the URL on its own line or as a bare hyperlink in the post body.
- **Tone**: Warm, local, genuine. Write like a Naas resident sharing tips, not a marketing account. No hashtags. One or two emojis max for the whole post. No "check it out!". Not every sentence needs punctuation excitement.
- **Variety**: Vary the opening each time — sometimes a question ("Anyone been to a show at the Moat Theatre lately?"), sometimes a recommendation, sometimes a "did you know" framing. Never open with "Here's what's on in Naas this week" or any variation of that.
- **Length**: Under 150 words total — short enough that Facebook shows it without a "See more" truncation.
- **First comment**: Do NOT include naastoday.com in the main post body. Instead, write a separate "first comment" line, e.g. "Full list for this week: naastoday.com".

**Step 4 — Copy post to clipboard:**

```
echo "<post text>" | pbcopy
```

Replace `<post text>` with the exact post body (not the first comment).

**Step 5 — Output to the user:**

Show the post and the first comment clearly separated, like this:

```
📋 POST (copied to clipboard)
──────────────────────────────
<post text>

💬 FIRST COMMENT
──────────────────────────────
<first comment text>
```

Do not use any other tools or take any other actions.
