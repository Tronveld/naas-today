---
target: src/pages/index.astro
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-08T22-04-03Z
slug: src-pages-index-astro
---
**Method: dual-agent (A: a49143d653c707168 · B: a622345abd78bccb2)**

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Stale note gives no age; filter chips gain `(n)` counts on hydration and rewrap the row — visible layout shift at 375px |
| 2 | Match System / Real World | 3 | "Today" is a date, not a clock — at 8pm the page still leads with a 9:00 AM parkrun |
| 3 | User Control and Freedom | 3 | Draft survives dismissal but nothing offers a route back to it |
| 4 | Consistency and Standards | 3 | "Next up" renders on a filtered-empty day with 6 events; `aria-label="Coming up"` never follows the heading; "Market" vs "Markets"; `eventTimeStart` keeps native `required` while `recurrenceEndDate` uses `aria-required` |
| 5 | Error Prevention | 3 | Two validation voices in one form — browser bubble owns the time field, site voice owns everything else |
| 6 | Recognition Rather Than Recall | 3 | Sticky bar carries the date but not the filters |
| 7 | Flexibility and Efficiency | 2 | No week/weekend view; no remembered filters |
| 8 | Aesthetic and Minimalist Design | 3 | ~120px void between empty message and "Next up"; six `(0)` chips take ~110px above the fold |
| 9 | Error Recovery | 3 | "Something went sideways on our end" gives no next step |
| 10 | Help and Documentation | 3 | AND semantics explained only on a failure screen |
| **Total** | | **29/40** | **Good** |

## Design Specificity Verdict

**Authored for this product — with three category-interchangeable seams, all on the screens that matter most.**

Evidence it is this product: the time-pill invariant (one 28px silhouette holding a time, ALL DAY, TBC, or a date range); six category colours weathered into one family; DM Mono doing one job; Georgia only at boundaries; 660px held at 1920px; a page order that inverts on an empty day for a stated reason. Delete the word "Naas" and it still reads as a parish noticeboard.

Seams: the event card is structurally generic (the clearest tell is a full-width 44px "📍 Naas" band on a site called Naas Today); the six filter chips are the aggregator control (Eventbrite is the named anti-reference); the submit form is plain CRUD with the platform's own blue radios in it.

**Deterministic scan: 0 findings, exit 0** across `index.astro`, `BaseLayout.astro` + `src/components`, `dist/index.html`, and the built CSS bundle. Verified not a silent skip — planted violations in a probe `.astro` and in a copy of the real CSS returned 3 findings / exit 2 each time. `.impeccable/config.json` suppressions are scoped to `public/admin.html` alone.

Two literals the detector structurally cannot see:
- `BaseLayout.astro:1033` — `%235C5750` inside the select-chevron `data:` URI (URL-encoded). Not a DESIGN.md colour; nearest token `ink-light` `#5c5848`. **Real drift.**
- `BaseLayout.astro:67,68,139` — `rgba(26,42,26,0.05/0.08)`. Reads as **DESIGN.md being incomplete** (the green-cast shadow tint is in prose under Elevation but has no frontmatter token), not as CSS being wrong.

**Visual overlays: unavailable.** No Chrome, no Playwright/Puppeteer, no browser MCP — Firefox `--screenshot` cannot inject `detect.js`. No overlay rendered, none claimed. Fallback: headless screenshots at 375 and 1440 against `netlify dev` with real functions; four states captured.

## Overall Impression

A well-governed system that has been through a real critique cycle and shows it — 79 closed items, clean detector, no contrast violations, `alert()` eliminated. The biggest opportunity: the two screens carrying the most product-specific truth got the least authorship. The empty day — the *primary* screen — spends its top third on six controls that can do nothing and its middle on 120px of void, pushing the answer below the fold. And "today" is a date rather than a clock, so for most of the day the top of the answer is events that already finished.

## What's Working

1. **The time-pill / status-badge invariant.** Every card's top-right holds exactly one thing at a shared 28px minimum, defined as a *slot* rather than four treatments. That is why a mixed list reads as one column.
2. **The cause-aware empty state.** "There are 6 other events today. An event has to match every filter you have on" plus one-tap "Show all events". Suppressing the AND explanation when only one chip is lit is what makes it read as competence rather than boilerplate.
3. **Voice discipline in the failure paths.** Stale note in linen, not red. Submit failure names `hello@naastoday.com` in the operator's voice. Contrast reproduces DESIGN.md's Contrast Floor Rule exactly (7.08–9.92:1 on active chips, 5.29:1 warm-on-linen).

## Priority Issues

### [P1] The filtered-empty day contradicts itself in two words
`index.astro:692` picks the heading from `emptyState.classList.contains('visible')`, but `:600` adds that class for the *filtered*-empty branch too. Verified in source and screenshot: with Music + Theatre lit on a six-event Saturday the page says "There are 6 other events today" and then "Next up" ~100px lower.
**Why:** quietly undoes the item 68/75 decision on every filtered day.
**Fix:** condition on `dayEvents.length === 0`. One line. Also make `:107` `aria-labelledby="upcomingHeading"`.
**Command:** `/impeccable harden`

### [P1] "Today" is a date, not a clock — finished events lead the answer
`renderEvents()` filters on date alone and sorts ascending by time (`:613`). At 8pm the page leads with two events over by lunchtime.
**Why:** the product exists to answer "is anything on today?" and the top of the answer is stale for most of the day.
**Fix:** on the current day only, partition at `now` — still-to-come first, then a quiet `Earlier today` divider (hairline + `--ink-mid`) with the past below. Do not hide them: a market with no end time may still be running. ~10 lines, no new tokens.
**Command:** `/impeccable layout`

### [P1] The empty day spends its top third on dead controls and its middle on nothing
Measured at 375px on `?date=2026-08-10`: message ends ~348px, then ~122px of void before "Next up" at ~470px — below the fold. All six chips read `(0)`: six pressable 44px controls that can do nothing.
**Fix:** hide `.controls` when the day's unfiltered count is 0; zero `.events-container` bottom padding while `.empty-state.visible`. Lifts "Next up" ~200px onto the first screen. Neither touches a populated day. Direct answer to PRODUCT.md's open known-gaps question, for the zero-event case only.
**Command:** `/impeccable layout`

### [P2] Ten form controls render in browser blue
Zero `accent-color` declarations exist in `src/`. Four time-mode radios and six category checkboxes use the UA default — the same defect item 17 fixed for one `mailto:` link *in the same modal*.
**Fix:** `accent-color: var(--accent)` on both groups. One declaration.
**Command:** `/impeccable polish`

### [P2] The submission the product most wants is the hardest option to find
`.time-mode-group` wraps 3+1 at 375px, orphaning **"Not sure yet"** (`SubmitEventModal.astro:99`) onto its own row while "Specific time" is `checked` with an unlabelled `--:--` beneath it. PRODUCT.md calls that option the point of item 72. `#eventTimeStart` (`:104`) is the only field with no visible label, against DESIGN.md's own rule.
**Fix:** reorder to Specific time / Not sure yet / Time range / All day so the wrap becomes 2+2; give the time input a visible label.
**Command:** `/impeccable clarify`

## Cognitive Load — 5 clear failures, 2 partial, 1 pass

FAIL: single focus (empty day), chunking (6 chips / 6 checkboxes), one-thing-at-a-time (12 controls for a 3-field task), ≤4 options, working memory (filters scroll away). PARTIAL: grouping (orphaned "Not sure yet"), visual hierarchy (on the empty day "Quiet day in Naas" is larger than both the masthead and "Next up" — the biggest words on the most-shown screen announce nothing). PASS (partial): progressive disclosure.

Decision points over 4: the six-chip filter row, the six-checkbox category group. At exactly 4: date nav on a non-today day, time-mode radios, footer links. A populated six-card screen exposes **24 tap targets** with no ranking.

## Persona Red Flags

**Casey (one-handed, 375px, fifteen seconds)** — the date-nav row **reflows under her thumb**: one tap of Next makes `← Previous` and `Today` appear, pushing "Pick a date" into the third slot, so her second tap lands on a different control. Three of four nav labels wrap to two lines at 375px. `a.event-location` is a full-width 44px link wrapping "📍 Naas" — the largest target on the card, for information the masthead already gave her. Ten 44px targets sit above the first card, none of them what she came for.

**Sam (screen reader / keyboard, 200% zoom)** — pressing `Next →` announces "6 events." and nothing else; `#eventsListHeading` is updated but is `.visually-hidden` and not a live region. `#currentDateDisplay` is a `<div>`, not a heading. `<section aria-label="Coming up">` never changes while the `<h2>` swaps to "Next up". `openModal()` focuses `#eventTitle` inside the click's call stack, opening the iOS keyboard over an unread sheet — the exact lesson already learned in `setFieldError`. At 200% zoom the upcoming rows truncate twice with no expander.

**Máire, 71, Naas resident, not tech-confident** — the form marks required fields with a bare `*` and nothing says what `*` means, while marking others "(optional)". A mistap outside the sheet loses it with no message (the draft is kept; the button still says "Submit an event"). "TBC" is an 11px uppercase mono abbreviation in a slot that already flexes to hold "8 Aug – 12 Aug". "Market" / "Markets" / "MARKETS" for one thing.

## Minor Observations

- `.filter-group` wraps to two rows at **1440px** too — five chips and a lone `Theatre (0)`. DESIGN.md claims "one line on desktop"; CLAUDE.md still calls it a "scrolling row". Both are drift.
- `.date-section` background is identical to the page (1.00:1); only the hairline and scrolled shadow separate it. Fails the moment anything page-coloured scrolls under it.
- Pre-rendered chips ship bare labels; counts arrive with JS and rewrap the row. What crawlers and slow connections see.
- Four kinds of button on the pre-rendered page do nothing without JS (chips, date nav, Share, Read more) — while upcoming rows ship as plain `<li>` for exactly that reason (`:111-113`). Unresolved principle.
- `upcomingDateLabel` is duplicated between `:54` and `:707`. Item 74 consolidated three time formatters and left this one — a fourth instance of the project's known duplication pattern.
- Six Share buttons on a six-event day, competing with the category tags beside them.
- `.error-state` copy gives no next step beyond Retry.
- `confirm()` at `modal-form.js:280` is guarded by `hasDraft()` and discards up to 2000 characters — within what DESIGN.md permits. `alert()` fully gone.

## Questions to Consider

1. If most weekdays have nothing on, why is the day the unit? The empty state already renders "Next up" as *the answer* — a second navigation model, built and demoted. Not the weekend gap; an inversion of the default.
2. What is the filter row for on a day with six events? Would the chips earn their 110px if they filtered across the next seven days?
3. The form asks twelve questions to accept three. What happens to volume if the rest sits behind "Add more detail"?
4. The credibility claim is "moderated, therefore trustworthy" and the majority of rows auto-approve. Would "from Naas Library" on a card make the moderation visible, or the un-moderated majority visible?
5. Every card carries Share. Is the shareable object the listing, or the day? `weekly-post.js` already builds that string, off-site.
