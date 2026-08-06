---
target: src/pages/index.astro
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 5
timestamp: 2026-08-05T19-46-18Z
slug: src-pages-index-astro
---
Method: dual-agent (A: a300d4c5ee9aad149 · B: a6a32f2b93e59b7ed)

Surface mode: **Operate** — the visitor completes a task ("is anything on today?"). All ten heuristics apply.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | A failed client refresh over pre-rendered data sets no error state (`index.astro:251`) — with rebuilds capped at 15 deploys/month, the page can silently serve days-old data. Nothing states freshness. Live filter counts are the redeeming feature. |
| 2 | Match System / Real World | 3 | Plain, local, warm language throughout. Deductions: the empty state says "Nothing listed yet" when a filter is the real cause; card hover-lift promises a click that doesn't exist; cards render `TBC` but the submit form can't express "time unknown". |
| 3 | User Control and Freedom | 2 | Escape and scrim-click both call `eventForm.reset()` (`index.astro:976-978, 986-988`) — typed work destroyed, no confirm, no undo. No clear-all-filters. No access to past dates, unexplained. Every filter toggle `pushState`s, so Back becomes a filter-undo maze. |
| 4 | Consistency and Standards | 2 | Three labels for one action ("Submit an event" / "Submit Event" / "Add an Event"). Two contact addresses: `hello@naastoday.com` in the Contact modal vs `naastoday.tile693@passinbox.com` in every alert. Native `alert()` inside a system that otherwise has bespoke modals. The documented One Green Rule breaks on the first filter tap. |
| 5 | Error Prevention | 2 | Real guardrails exist (`dateInput.min`, `maxlength`, `type=url`, end-date check). But the highest-cost error — losing a full submission to a mistap — has no guardrail and no draft persistence. |
| 6 | Recognition Rather Than Recall | 3 | Everything text-labelled, no icon-only controls, live counts, datalist venue suggestions built from real data. Deductions: Markets and Theatre sit off-screen at 375px with no scroll affordance; the chip row has no group label saying it filters anything. |
| 7 | Flexibility and Efficiency | 2 | Genuine accelerators: full URL round-trip for date+filters, `?event=` deep links, Escape, Web Share, Coming Up as jump-to-day. But zero accelerator for the page's actual repeated action — no arrow-key day stepping, no "this weekend", no clear-all. |
| 8 | Aesthetic and Minimalist Design | 3 | The page's strength: no imagery, no ads, one accent, restrained type. Not a 4 because ~44% of the first mobile viewport is chrome, plus a decorative SVG and 4rem padding on the most-shown state. |
| 9 | Error Recovery | 1 | Every success and every failure is a native `alert()` (six call sites). Vague copy, OS dialog rather than inline near the field, quoting an address that appears nowhere else on the site. Lifted off 0 only by the specific end-date message. |
| 10 | Help and Documentation | 2 | About/Contact/Terms exist in the right voice and the form has real inline hints. But nothing is contextual to *browsing*: no explanation of the six categories, why past dates are unreachable, or how often the list updates. |
| **Total** | | **22/40** | **Acceptable — significant improvements needed before users are happy** |

## Design Specificity Verdict

**Specific in surface, generic in structure. The skin is authored; the information architecture is inherited.**

**LLM assessment.** The visual system is genuinely this product's. The weathered category family (six hues levelled so no tag out-shouts another), Georgia over a system sans with DM Mono confined to times, hairline-defined surfaces with near-zero elevation, and copy like "Quiet day in Naas" could not be lifted onto AllEvents.in without looking wrong.

But the page's skeleton is the default event-aggregator template: sticky brand bar → date with prev/next → horizontal chip row → card list → green CTA → footer modals. Nothing in the composition encodes the most Naas-specific fact about this product — **that on most weekdays the honest answer is "nothing."** That case is handled as a failure state: hidden until needed, 4rem of padding, a decorative SVG, an apology headline, and a request for labour. That is how a national aggregator renders "0 results." The one structural chance to be unmistakably a one-town noticeboard is spent on a generic no-results screen. Restyling won't move this; re-architecting the empty day will.

**Deterministic scan.** Zero findings, exit 0, across all three scopes (target files, whole `src`, `public/admin.html`). Two things qualify that result:

- **Exit 0 is a subset, not a pass.** The registry holds 77 rules, but the CLI runs only the regex and static-HTML engines. `low-contrast`, `tiny-text`, `undersized-ui-text`, `skipped-heading`, `line-length`, `cramped-padding`, `text-overflow`, `content-hidden-at-rest` and `monotonous-spacing` live behind the browser engine and **never ran**. No rule in the registry covers touch-target size at all. Everything in the sections below was hand-derived, not detector-surfaced.
- **`admin.html` is clean only because of suppression.** Rescanned from a path the ignore list doesn't match: **58 findings** (`design-system-font` 22, `overused-font` 15, `design-system-color` 13, `design-system-radius` 6, `design-system-font-size` 2) — exactly the five rules `.impeccable/config.json` suppresses for that file, with the recorded reason. Working as designed; noted so the zero isn't misread.

The detector was verified live: a canary file with Comic Sans and `#ff00ff` produced 2 findings, exit 2. `src` is genuinely clean of what the static engines can evaluate.

**Visual overlays.** None. No browser automation is exposed in this session (no Playwright/Puppeteer in `node_modules` — the repo runs three dependencies by policy — and no browser or screenshot tool in the roster). No live server was started, no `detect.js` injected, no console messages read. **No user-visible overlay exists.**

## Overall Impression

The mechanical layer is clean and the *palette* work is genuinely excellent — better than most sites this size. What the score reflects is that the design was never pressure-tested against its own most common screen. On a site where most weekdays have nothing on, the empty day is the product, and it is currently built as an error state that asks the visitor for unpaid work. The single biggest opportunity is to make "nothing on today, but here's Thursday" the designed primary screen rather than the fallback.

A second theme runs underneath: **DESIGN.md documents several aspirations as facts.** Three of its claims don't hold in the code — the 44px touch-target floor, the "control by control" reduced-motion coverage, and the no-decorative-imagery Don't. Since DESIGN.md is the authority the detector enforces against, those gaps are load-bearing.

## What's Working

**1. Contrast discipline that is structural, not claimed.** Every text pair measured clears AA comfortably: `--ink-mid` on white 7.19:1, `--ink-light` on white 7.13:1, white on `--cat-kids` 7.08:1. DESIGN.md's claimed floor — Weathered Leather on Linen at 5.29:1 — reproduces *exactly*. This works because the six category colours were deliberately levelled into one weathered register, which means "every notice is equal" is enforced by the palette rather than by convention. A Theatre tag physically cannot become a promotion. For an audience PRODUCT.md confirms skews older, this is the highest-value thing on the page.

**2. The card's top-right slot is a genuinely solved problem.** `.ev-time` and `.ev-allday` share the same pill shell, linen fill, hairline border and `min-height: 28px` (`BaseLayout.astro:313-347`). A day mixing a timed gig, an all-day festival, a multi-day run and an unknown time produces one constant silhouette instead of a ragged right edge. That is what makes a mixed list scannable inside the fifteen-second budget PRODUCT.md sets, and most competitors get it wrong.

**3. URL state is complete and honest.** Date and filters both round-trip through `pushUrlState`/`readUrlState` (`index.astro:151-204`), `aria-pressed` re-syncs from the URL, and `popstate` re-renders correctly. That rigour is what makes the share button, the `?event=` deep link and the Coming Up jump trustworthy rather than decorative — a filtered view of a specific day survives being pasted into WhatsApp.

*Honourable mention:* `populateLocationSuggestions` builds the submit form's datalist from venue names already in the data, so a submitter typing "moat" gets "The Moat Theatre" — improving submission quality and moderation speed at once, exactly the double-win PRODUCT.md principle #3 asks for.

## Priority Issues

### [P1] The empty day — the most-shown screen — answers with a chore and buries the answer
**Why it matters:** PRODUCT.md principle #1 is "answer in one glance, then get out of the way," and on most weekdays the honest answer is "nothing today." The current sequence is: date → six filters → decorative SVG → "Quiet day in Naas" → *"add it to the noticeboard"* → green button → *then* Coming Up, below the fold. The one genuinely useful thing is ranked below a request for unpaid labour. Worse, in the pre-rendered HTML the Coming Up section is a heading over an empty `<ul>` (`index.astro:67-70`) — first paint, no-JS, and slow-3G visitors see a promise with nothing under it.
**Fix:** Make Coming Up the *body* of the empty state, not a section after it. Pre-render the next 3–5 upcoming events at build time in `EventsGrid.astro` so the SSG output answers without JS. Lead with the answer — "Nothing on today. Next up: Thursday 8pm, trad at The Storehouse" — and demote the submit CTA below it, quieter. Drop the decorative SVG (DESIGN.md's own Don'ts rule out decorative imagery) and the 4rem padding.
**Suggested command:** `/impeccable clarify` for the state copy and hierarchy, then `/impeccable layout` for the reorder.

### [P1] ~44% of the first mobile viewport is chrome, and the sticky element carries the wrong thing
**Why it matters:** On a 375×667 phone roughly 247px is consumed before the first card: sticky masthead ~79px repeating a brand name the visitor already knows plus a tagline that restates the H1; date section ~107px (of which ~13px is dead space because `.current-date` inherits `line-height: 1.6` from body while DESIGN.md's `date` token specifies 1.2); filter row ~61px. The visitor sees about one and a half events. Then the *date* — the only state telling you which day these events belong to — scrolls away while the brand bar stays pinned. Halfway down a busy Saturday there is no on-screen confirmation of what day you are reading.
**Fix:** Invert the stickiness. Pin the date (ideally with a compact "3 events · Free ×" active-filter summary); let the masthead scroll away or collapse into the pinned bar. Drop the tagline on mobile. Set `line-height: 1.2` on `.current-date` per the token. Target ~150px of chrome.
**Suggested command:** `/impeccable layout`, with `/impeccable distill` for the tagline and padding.

### [P1] The submit form silently destroys typed work on a mistap or Escape
**Why it matters:** `closeModal` + `eventForm.reset()` fire on both scrim click and Escape (`index.astro:976-978, 986-988`) with no confirmation, no draft, no undo. The form demands a required description up to 2000 characters, so the loss is maximal. This is precisely the interrupted one-handed mobile case, on the flow PRODUCT.md names as the central strategic goal. Every submission destroyed this way is a permanent loss the operator never learns about.
**Fix:** Don't reset on dismiss. Persist to `sessionStorage` on input, restore on open, confirm before discarding a dirty form, and reset only on explicit Cancel or successful submit. Also: `max-height: 100vh` on the mobile bottom sheet (`BaseLayout.astro:1041`) hides the Submit/Cancel row under the iOS Safari toolbar — use `100dvh` and lock body scroll while a modal is open.
**Suggested command:** `/impeccable harden`.

### [P1] Filtered-empty is indistinguishable from genuinely-empty, and there is no way out
**Why it matters:** Tap "Theatre" on a day with four non-theatre events and the page says *"Quiet day in Naas — Nothing listed yet."* That is factually false, and there is no clear-filters control anywhere. The filter row isn't sticky, so once scrolled the user can't see which chip caused it. A less tech-confident visitor concludes the site is broken and leaves. The chip's missing count is the only signal, and absence-of-count is ambiguous with not-yet-loaded.
**Fix:** Branch the empty state on cause. Filtered-empty should read "No theatre events on Wednesday 6 August — 4 other events on today" with a "Show all events" button that clears filters. Add a persistent active-filter summary with clear-all near the date. Consider disabling rather than hiding chips whose count is 0.
**Suggested command:** `/impeccable clarify`.

### [P1] Accessibility defects against constraints the project has already written down
**Why it matters:** PRODUCT.md names usability for older and less tech-confident residents as a *confirmed constraint*, and DESIGN.md claims a 44px touch-target floor "throughout". The measured reality: **4 of 17 interactive control classes meet 44px.** The worst are `.desc-toggle-btn` "Read more" at ~14px (`BaseLayout.astro:393-405`, `padding: 0`) — which is the *only* route to a clamped description — the footer link row at ~15–21px (`padding: 0`), `.event-location` and `.event-url` at ~19px, `.filter-btn` at ~32px, and `.share-btn` at an explicitly declared `min-height: 32px`. Four more defects: `.upcoming-item:focus-visible` sets `outline: none` and substitutes a ~1.05:1 background tint (`BaseLayout.astro:505-508`), a flat WCAG 2.4.7 failure on a keyboard-operable control; `aria-live="polite"` on the whole `.events-container` (`EventsGrid.astro:36`) re-announces every card, descriptions included, on each filter tap; three form controls have no accessible name (`#dateInput` in `DatePickerModal.astro:11`, `#eventTimeStart` and `#eventTimeEnd` in `SubmitEventModal.astro:85,87`, plus an orphan `<label>Time *</label>` at :69 with no `for`); and `#events-list-heading` (`index.astro:65`) is both hardcoded "Today's events" regardless of the date shown *and* referenced by nothing — a dead id.

Separately, **non-text contrast fails WCAG 1.4.11**: `--border` on `--bg-card` is 1.33:1 and on `--bg` is 1.28:1, against a 3:1 requirement. That border is the sole visual boundary of `.filter-btn`, `.share-btn`, `.date-nav-btn` and `.btn-secondary` — in a system with almost no fills, the control outlines are effectively invisible even though their text passes at 7:1.
**Fix:** Raise all control classes to 44px; restore a real focus outline on upcoming rows; replace the container-wide live region with a small status node announcing a count; label the three inputs; make the heading track `currentDate` or delete it; add `role="group" aria-label="Filter events by category"` to the chip row; move `#main-content` above `<DateNav>` so the skip link doesn't skip the date controls. Darken `--border` for interactive controls to clear 3:1.
**Suggested command:** `/impeccable audit`.

### [P2] Native `alert()` for every outcome, quoting an address that contradicts the site
**Why it matters:** Six `alert()` calls carry both success and failure (`index.astro:907, 920, 937, 940, 955, 958`). They're unstyled, render as "naastoday.com says" on iOS, sit outside the page so validation errors are nowhere near the offending field, and they quote `naastoday.tile693@passinbox.com` — while the Contact modal and PRODUCT.md's brand commitment both say `hello@naastoday.com`. A machine-looking relay address in a system dialog reads as a scam to exactly the older resident this product is built for, on a product whose entire positioning is *moderated, therefore trustworthy*.
**Fix:** Inline validation next to each field; a warm in-modal success panel in the site's own voice. Use `hello@naastoday.com` everywhere.
**Suggested command:** `/impeccable polish`, with `/impeccable clarify` for the copy.

## Cognitive Load: 4 failures of 8 — high (critical band)

| Item | Result | Why |
|---|---|---|
| Single focus | **FAIL** | ~247px of chrome before the first card on a 375px phone, ~44% of usable viewport. On the empty day a green CTA outranks and hides the Coming Up list that would answer the visitor. |
| Chunking (≤4/group) | **FAIL** | Filter row = 6. Submit form category checkboxes = 6 in one flat row. Card carries 7 distinct elements. |
| Grouping | PASS | Date section, filter band, bordered cards, and What/When/Where&Tags form headings all do real proximity work. |
| Visual hierarchy | **FAIL** | Inverted on the primary device. Masthead 1.625rem (sticky, permanent) > "Coming Up" 1.25rem > the date 1.125rem = event title 1.125rem. The brand name is 44% larger than the answer-bearing state. |
| One thing at a time | PASS | Browsing is one decision per step; the form is sectioned. |
| Minimal choices (≤4) | **FAIL** | Six filter chips at the primary decision point, two physically off-screen at 375px. |
| Working memory | PASS | Nothing must be carried across screens for the fifteen-second scan. |
| Progressive disclosure | PASS | Recurring section hidden until checked, time-range fields hidden until selected, descriptions clamped past 220 chars. Well done. |

## Emotional Journey

**Entry (0–2s) — good, and rarer than it should be.** Warm paper, Georgia masthead, no cookie banner, no interstitial, no ad. Trust is established before a word of content is read.

**Populated day (2–5s) — the peak.** The shared 28px pill shell gives the time column an unbroken right edge, so a mixed day scans as one list. The answer arrives.

**Empty day — the valley, and it is the common case.** Grey illustration, "Quiet day in Naas", then immediately a request for labour. The visitor asked a question and got homework. The one thing that would rescue the moment sits below the CTA and below the fold.

**Peak-end damage.** On most visits the *end* of the session is the empty state, so the durable memory of the product is "I asked, it had nothing, then it asked me for something."

**Missing reassurance.** Nothing says when the list was last updated. On a site whose rebuild is deliberately throttled to 15 deploys a month, *"nothing on today"* and *"nobody has touched this in a week"* render identically — which attacks the moderated-therefore-trustworthy claim at the exact moment it matters most.

## Persona Red Flags

**Casey — distracted mobile, one-handed, 375px, interrupted**
- ~1.5 event cards on first paint; 247px of chrome ahead of the content.
- Prev/Next — the most-used controls — sit ~150px from the top, outside the thumb zone entirely.
- Markets and Theatre chips overflow off-screen right (row needs ~506px, has 343px) with no fade, peek or scrollbar cue (`BaseLayout.astro:193-198`).
- Free → Kids → Music while browsing creates three `pushState` entries (`index.astro:742, 750, 758`); Back to leave the site lands on filter states instead.
- Starts a submission, gets a notification, returns, taps just outside the sheet — everything gone, silently.
- The bottom sheet's Submit/Cancel row hides under the iOS Safari toolbar (`max-height: 100vh`).

**Sam — screen reader + keyboard**
- Heading navigation permanently announces "Today's events" regardless of the date shown (`index.astro:65`).
- Tabs to an upcoming-event row and sees nothing — `outline: none` with a ~1.05:1 background substitute.
- Every filter tap floods the live region with the full text of every card, descriptions included, instead of a count.
- Six unlabelled toggle buttons after the date nav, no group context saying they filter anything.
- Three unlabelled form controls: the date picker's only input, and both time fields.
- "Repeat until" is functionally required but its only required marker is `aria-hidden="true"` (`SubmitEventModal.astro:62`).
- `role="button"` on `<li>` (`index.astro:581`) strips list semantics and produces button names like "Thu, 7 Aug 20:00 Trad Session The Storehouse".
- The skip link jumps to `#main-content`, which sits *after* `<DateNav>` — skipping to content skips past the date controls.
- "Read more" is a ~14px-tall unbordered text target and the only route to a clamped description.

**Riley — deliberate stress tester**
- Theatre filter on a four-event day → *"Quiet day in Naas — Nothing listed yet."* Demonstrably false, no escape.
- Built source ships `<h2>Coming Up</h2>` over an empty `<ul>` on every page (`index.astro:67-70`).
- Network dies with a stale build in place → client fetch fails, `events.length > 0` so `isError` stays false (`index.astro:251`); page serves days-old data with no staleness signal.
- `?event=nonexistent` → `handleDeepLink` returns silently (`index.astro:998`), and `pushUrlState` preserves the bogus param forever (`index.astro:166-167`).
- `updateRecurrenceHint` uses `cur.toISOString().slice(0,10)` (`index.astro:849`) — the exact UTC bug CLAUDE.md warns against everywhere else; occurrence counts can be off by one across Irish summer time.
- Types 2000 characters, taps the scrim, loses all of it.

**Margaret, 78, Naas resident, low tech confidence** *(derived from PRODUCT.md's confirmed constraint)*
- Opens for "what's on today" and gets a masthead, tagline, date, four buttons and six chips before one and a half events.
- Six word-chips with no heading: can't tell whether they're filters or today's categories. Taps "Theatre", sees "Quiet day in Naas", concludes the site is broken.
- "Read more ↓" is a ~14px unbordered text link she will miss repeatedly, with no other route to the description.
- Scrolled down a busy Saturday the date is gone and the pinned bar says "Naas Today" — no confirmation of which day she's reading.
- Tries to submit the Saturday market: the form refuses without a written description and a specific time. She knows "Saturday morning, the square" and the form won't take it.
- Every outcome arrives as a grey system dialog quoting an address that doesn't match the one under Contact. To this user that reads as fraud.

**Aoife, parent of two, filtering for kids' events** *(PRODUCT.md's named recurring sub-case)*
- "Free" and "For kids" are correctly first and second in the row — a genuine win, and the live counts are exactly right for her.
- But combining them is AND, not OR, and nothing says so. "Free + For kids" yielding nothing shows "Quiet day in Naas" with no hint that dropping one chip would help.
- She plans Saturday, not today. Four taps of "Next →" (and four history entries), or "Pick a date" → a modal whose first focused control is the ✕, not the date input. PRODUCT.md names *"what's on this weekend?"* as one of the two defining questions and the interface has no answer that isn't four taps.
- Counts are computed for the viewed day only, so scanning a week is six taps and six re-reads.

## Minor Observations

**DESIGN.md claims that don't hold in the code** (worth fixing in one direction or the other, since DESIGN.md is what the detector enforces against):
- "44px minimum touch targets throughout" — 4 of 17 control classes meet it.
- "`prefers-reduced-motion` disables every animation and transition explicitly, control by control" — **7 CSS selectors and 2 JS calls are uncovered**: `header` box-shadow (`:96`), `.event-card`'s *transition* (`:283` — the override kills only `animation`, so the hover `translateY(-2px)` still animates), `.skeleton-line` (`:645`, `infinite`), `.loading-spinner` (`:664`, `infinite`), `.footer-links a/button` (`:729`), `.form-group input/textarea/select` (`:853`), `.deep-link-highlight` (`:1027`), plus `scrollTo({behavior:'smooth'})` at `index.astro:610` and `scrollIntoView({behavior:'smooth'})` at `:1006`. Two entries in the override are no-ops naming selectors with no transition (`.desc-toggle-btn`, `.event-url`).
- "Don't introduce photography, illustration, or decorative imagery" — the empty state ships a decorative SVG.
- The One Green Rule ("accent appears as a fill at most once per viewport") breaks on the first filter tap: active chip fill + submit button fill.
- DESIGN.md calls the section "What's next"; the code renders "Coming Up".

**Dead or redundant code:**
- `.loading-spinner` and its `spin` keyframe (`BaseLayout.astro:658-670`) never reach the DOM; the skeleton replaced them.
- `.event-card:focus-visible` (`:292-295`) is a dead rule — cards have no `tabindex`.
- `#events-list-heading` is referenced by nothing.
- `<section aria-label="Coming up">` also contains `<h2>Coming Up</h2>` — the aria-label wins and the h2 is doubled.
- `.footer-dot` `·` separators (`Footer.astro:8,10,12`) aren't `aria-hidden`, so they're announced between each link.

**Shared modal defects present identically in both copies** (`index.astro:669-702` and `AppModals.astro:20-52` are otherwise line-for-line identical — no behavioural divergence found, but every fix must be applied twice):
- The focusable NodeList is captured once at open and includes elements inside `display:none` containers, so Tab-wrap breaks in the Submit modal's default state.
- `openModal` focuses the first match of `button, [href], input, select, textarea` — in all four modals that's the ✕, not the first field.
- `trapFocus` is added on every open without removing a prior handler; repeated opens stack listeners.
- `.modal-header` isn't sticky inside a `max-height: 100vh` scrolling sheet, so ✕ scrolls out of view on the long submit form.
- No `overflow: hidden` on `<body>` when a modal opens; the page scroll-chains behind the bottom sheet.

**Other:**
- Card hover `translateY(-2px)` + shadow is a click affordance on a non-clickable element.
- Desktop Share falls back to a WhatsApp popup (`index.astro:322`) with no warning and no copy-link option; popup blockers will silently eat it.
- Char counter reads "0 / 2000" on an empty required field — states a ceiling where an expectation would help.
- `.tag` and `.ev-allday` sit at exactly 11px, *at* the `undersized-ui-text` floor rather than below it.
- `.upcoming-title`/`.upcoming-location` carry `overflow:hidden; text-overflow:ellipsis` with `max-width: 8rem` — a truncation candidate only a live render could confirm.
- No `<noscript>` message: with JS off the pre-rendered list shows, but filters and date nav are inert while still looking interactive.

## Questions to Consider

1. **On a site where most weekdays are empty, why is the empty state built as a fallback rather than as the product's primary screen?** If "Quiet day in Naas" is what most visitors actually see, it deserves the design budget currently spent on the populated list — and its first line should probably be *"Next up: Thursday, 8pm, trad at The Storehouse"*, not an apology followed by a request for labour.

2. **The masthead is sticky and the date is not.** Which of those does a visitor scrolling a busy Saturday actually need pinned — and what is the brand bar earning in the ~79 vertical pixels it takes from every phone viewport, on every visit, forever?

3. **PRODUCT.md names "what's on this weekend?" as one of the two defining questions, and the interface has no answer to it that isn't four taps.** Is the single-day model the right shape for this product, or a shape inherited from the name?

4. **The submit form requires a description and a specific time.** PRODUCT.md says growing community submissions is the central strategic goal and that submission *quality* matters as much as volume. Which of those two required fields is genuinely improving moderation, and which is simply turning away the neighbour who knows the market is on Saturday morning?
