# Critique action list — public events page

Derived from `.impeccable/critique/2026-08-05T19-46-18Z__src-pages-index-astro.md`
(Impeccable `critique`, dual-agent, scored **22/40**, 5×P1 + 1×P2).

This is the same set of findings as the critique, **deduplicated and regrouped by the file
you would open to fix them**. The critique restates each finding from five angles — heuristic
score, specificity verdict, priority issue, cognitive load, persona walkthrough — which is
useful for understanding *why* and useless for working through. Every item below appears
exactly once.

**Line numbers are as of `d1489de` and will drift as you edit.** Each item carries enough
surrounding context to relocate it. Phase 1 and item 10 have since shipped (`17a5423`,
`fc3d8ed`, `34101d9`), so the line numbers in the EventsGrid, empty-state and modal-dismiss
items are already historical.

**Progress: 79 of 79 done. Phase 4 was device-walked on 2026-08-08 and two of its
items came back — see the handoff at the end.**

All seven phases are closed. **Nothing here is outstanding — but "closed" is not "verified",
and the two are far apart for the later phases. Read the verification status below before
treating this list as finished.**

| Phase | Verified how |
|---|---|
| 1–3 | Firefox at 375px **and on an iPhone** (2026-08-06). Found four bugs reading the diff had not. |
| 4 | **iPhone, 2026-08-08.** Item 8's fill dim was invisible in the hand; the trim it prompted is in PRODUCT.md's known gaps. Keyboard items verified statically instead — see below. |
| 5 | **Headless Firefox screenshots only.** No device, no keyboard, no real backend. |
| 6–7 | Documents and decisions; nothing to verify beyond reading them. |

The 2026-08-06 pass is the reason to take that gap seriously: walking phases 1–3 on a real
phone found four defects that careful reasoning had missed entirely. Phases 4 and 5 have had no
equivalent pass, and phase 5 in particular added a submission flow that has never run against
the real backend. **See "Still needs a real device" in the 2026-08-07 handoff.**

Six items were closed as **decided, not changed** — 8, 12, 52, 55, 67, 70. Each carries its
reasoning inline. Do not reopen them without reading it; three of them are cases where the
item's stated premise turned out to be wrong.

---

## How to work through this

All 79 landed. The list below is grouped by file; the table is the order they were worked in,
kept because the *why this order* column records decisions that outlived the work.

| Phase | Items | Count | Command | Why this order |
|---|---|---|---|---|
| ~~1. Empty day~~ **done** | 1–9 | 9 of 9 | `17a5423`, `fc3d8ed`, `292f294` | Item 8 was held back deliberately and decided on 2026-08-06 with the rebuilt screen in front of us. |
| ~~2. Mobile chrome~~ **done** | 39–41 | 3 of 3 | shipped in `03c21d0` | Also closed item 43, which the sticky move would otherwise have re-created under a new selector. |
| ~~3. Form data loss~~ **done** | 10–12, 42 | 4 of 4 | `34101d9`, `ee9d332` | Item 12's `confirm()` is flagged for item 17 to re-decide, not to inherit. |
| ~~4. Accessibility~~ **done** | 13–16, 24–38, 43, 44–49, 53–55, 57–58, 60–61 | 32 of 32 | `/impeccable audit` | The bulk of the list, but mostly one-line CSS. **Item 38 is decided and shipped** — the token the rest of the CSS sits on is settled. |
| ~~5. Trust & consistency~~ **done** | 17–23, 50–52, 56, 59, 62–63 | 14 of 14 | `/impeccable polish` | Sweeps what's left; reads the critique snapshot as its own input. Roughly half its work vanished with `45f3496` — see rule 1 below. |
| ~~6. Doc truth~~ **done** | 64–69 | 6 of 6 | manual | Fix DESIGN.md's overstated claims *after* the code moves, so it describes what shipped. 69 closed early because 38 created the token it was about. |
| ~~7. Open questions~~ **done** | 70–73 | 4 of 4 | owner decision | Genuine product decisions. Don't let a refactor make them by accident. |

That "if you only do part of this list" threshold is now historical — the whole list is done.

### Two rules that apply throughout

1. ~~**Modal fixes must be applied twice.**~~ **Obsolete as of `45f3496`** — the two copies of
   the modal system and the submit handler were merged into `src/scripts/modal-form.js`, which
   both `index.astro` and `AppModals.astro` import. **Every **[×2]** marking below is now void:
   fix it once.** The item text is left as written so the line numbers still relocate, but the
   affected items have moved and shrunk:
   - **17** — 4 `alert()` calls in `modal-form.js`, not 8 across two files.
   - **18** — one `CONTACT_EMAIL` constant (`modal-form.js:14`), not eight string literals.
   - **19** — the `toISOString()` bug is now `modal-form.js:93`.
   - **60–63** — one focus trap (`modal-form.js:19-21`), one `openModal`. The section heading
     "`AppModals.astro` — the second copy" no longer describes anything.
2. **`npm test` is not triggered by anything here.** Nothing in this list touches
   `netlify/functions/`. If you end up changing a validator, CLAUDE.md's rule applies:
   failing test first, show it failing, then fix.
   *Amended 2026-08-06:* item 11 added `tests/event-draft.test.mjs`, the first frontend test in
   the suite. It covers `src/scripts/draft.js` only — pure field-shape logic, no DOM. The rest
   of this list is still browser-verified or not verified at all.

---

## `src/components/EventsGrid.astro` — the empty state

The empty state is currently built as an error screen: hidden until needed, decorative icon,
apology headline, then a request for labour. On a site where most weekdays have nothing on,
this is the primary screen, not the fallback.

- [x] **1. [P1] Branch the empty state on cause.** `:52-53` renders "Quiet day in Naas —
  Nothing listed yet" whether the day is genuinely empty or a filter emptied it. Tap Theatre
  on a four-event day and the page states something false.
  **Done when:** a filtered-empty day reads "No theatre events on Wednesday 6 August — 4 other
  events on today" and an unfiltered-empty day keeps the current copy.

- [x] **2. [P1] Add a "Show all events" button to the filtered-empty branch.** There is
  currently no clear-all-filters control anywhere on the page, and the filter row is not
  sticky, so a scrolled user cannot see which chip caused the emptiness.
  **Done when:** one tap from filtered-empty returns to the full day.

- [x] **3. [P1] Make "Coming Up" the body of the empty state.** It currently sits *after* the
  submit CTA and below the fold (`index.astro:67-70`). The one useful thing on the screen
  ranks below a request for unpaid work.
  **Done when:** on an empty day the next few events appear above the submit button.

- [x] **4. [P1] Demote the submit CTA below the upcoming list**, with quieter treatment than
  the current full-width green fill (`:54`).
  **Done when:** the visitor's question is answered before they are asked for anything.

- [x] **5. [P2] Delete the decorative SVG** at `:42-50`. DESIGN.md's own Don'ts say
  "Don't introduce photography, illustration, or decorative imagery" — this is the only
  violation in the codebase.
  **Done when:** `grep -c "<svg" src/components/EventsGrid.astro` returns 0.

- [x] **6. [P2] Reduce the empty state's vertical padding.** `.events-container` carries
  `padding: 0 0 4rem` (`BaseLayout.astro:243-245`) and the empty state adds its own. This is
  the most-shown state; it should not be the most padded.

- [x] **7. [P1] Replace the container-wide live region.** `:36` puts
  `aria-live="polite"` on `.events-container`, so every filter tap re-announces every card's
  full text, descriptions included.
  **Done when:** a small dedicated status node announces "3 events" and the container has no
  `aria-live`.

- [x] **8. [P2] Consider disabling rather than hiding zero-count filter chips.** Absence of a
  count is currently ambiguous with not-yet-loaded.
  **The item's premise was slightly wrong** — nothing was hidden. Chips rendered `Free (3)` above
  zero and a bare `Free` at zero, so it was the *count* that vanished, not the chip.
  **Decided against disabling, dimmed instead.** A disabled chip strands anyone whose active
  filter has just fallen to zero — they cannot clear it — and disabled controls drop out of the
  tab order, which is the opposite of what the rest of phase 4 is doing.
  `.filter-btn.is-empty:not(.active)` recedes the *container* only (page background, lighter
  border); the label stays `--ink-mid` at **7.2:1**. Recolouring the label was the obvious first
  idea and is useless here — `--ink-light` measures 7.13:1 against `--ink-mid`'s 7.20:1, a hue
  change with no lightness change, so it would dim nothing.
  Also collapsed the six near-identical count blocks into `FILTER_CHIPS`.
  **Now unambiguous three ways:** solid + count = events; dimmed + no count = zero; solid +
  no count = not rendered yet.

- [x] **9. [P1] Pre-render upcoming events at build time.** `index.astro:67-70` ships
  `<h2>Coming Up</h2>` over an empty `<ul>` in the static HTML. First paint, no-JS, and
  slow-connection visitors see a heading promising content with nothing under it. Fetch the
  next 3–5 approved events in the page frontmatter alongside `initialEvents`.
  **Done when:** `npm run build && grep -A3 "Coming Up" dist/index.html` shows real `<li>`
  elements.

---

## `src/pages/index.astro` — client behaviour

- [x] **10. [P1] Stop destroying the form on dismiss. [×2]** `:977` and `:987` call
  `document.getElementById('eventForm').reset()` on scrim-click and Escape, with no confirm and
  no undo, on a form with a required description up to 2000 characters.
  **Done when:** typing into the form, pressing Escape, and reopening restores the text.

- [x] **11. [P1] Persist the form draft to `sessionStorage`** on input, restore on open, clear
  on successful submit.
  **Done when:** a submission survives a tab switch and return.
  **Restored at load rather than at open** — same effect, one fewer place to get wrong, and it
  covers the reload case directly. The shape moved to `src/scripts/draft.js` and is imported by
  **both** copies of the modal system: a draft written on `/` is read by the copy on `/terms`,
  so this is the one piece that must *not* be duplicated. Its `serialise`/`apply` pair is
  covered by `tests/event-draft.test.mjs`.
  **Knock-on:** `openSubmitModal` no longer overwrites the date with the day being viewed when
  a draft exists — a date the visitor typed outranks the day they happen to be looking at.

- [x] **12. [P1] Confirm before discarding a dirty form**, and reset only on explicit Cancel or
  success.
  Uses a native `confirm()`. **Check this against item 17** when that sweep happens: 17 removes
  eight `alert()` calls for being unstyled and iOS-ugly, and this is the same-looking box. The
  argument for keeping it is that 17's are validation and success messaging, while this is a
  destructive action — which is the one thing the platform dialog is actually for. Decide it
  deliberately rather than letting a find-and-replace answer it.
  **Re-decided 2026-08-07 alongside item 17: kept.** The distinction held up under the rewrite.
  Every alert 17 removed was the page *telling* the visitor something, which the page should do
  in its own voice and next to the thing it concerns. This one *asks*, and blocks on the answer,
  about an action that destroys up to 2000 characters of their typing. A styled panel would have
  to reimplement modality inside a modal to do that safely. Now written into DESIGN.md's Don'ts
  as the one sanctioned exception, so the next sweep does not have to re-derive it.

- [x] **13. [P1] Make the events heading track the current date.** `:65` hardcodes
  `<h2 class="visually-hidden" id="events-list-heading">Today's events</h2>`. Navigate to
  14 August and heading navigation still announces "Today's events". The id is also referenced
  by nothing — `grep -rn "events-list-heading" src/` returns only the declaration.
  **Done when:** the heading text follows `currentDate`, or the element is deleted.

- [x] **14. [P1] Move `id="main-content"` above `<DateNav>`.** `:63` puts it on `<main>`, which
  starts *after* the date controls, so the skip link skips past prev/today/pick-a-date/next and
  a keyboard user must shift-tab back.

- [x] **15. [P1] Replace `role="button"` on `<li>` with a real `<button>`.** `:581-582` sets
  `role="button"` and `tabindex="0"` on list items, which strips the `<ul>` of list semantics
  and produces accessible names like "Thu, 7 Aug 20:00 Trad Session The Storehouse".
  `renderUpcoming()` now builds `<li><button type="button" class="upcoming-item">`, and the
  hand-rolled Enter/Space `keydown` handler is gone — a real button gets both for free.
  The **pre-rendered** rows stay plain `<li>`, which is the existing deliberate call: without
  JS a button there would announce a control that does nothing. `.upcoming-item` carries the
  button resets so it styles either.

- [x] **16. [P1] Add a group label to the filter row.** Six unlabelled toggle buttons follow the
  date nav with nothing saying they filter anything.
  **Done when:** the row carries `role="group" aria-label="Filter events by category"`
  (in `src/components/FilterControls.astro`).

- [x] **17. [P2] Replace the eight `alert()` calls. [×2]** `index.astro:907, 920, 937, 940,
  955, 958` plus `AppModals.astro:203, 206, 221, 224`. They are unstyled, render as
  "naastoday.com says" on iOS, and put validation errors nowhere near the offending field.
  **Done when:** inline validation sits next to each field and success shows an in-modal panel
  in the site's own voice.

  Four alerts, not eight (`45f3496`). They became three different things, because they were
  never one kind of message:
  - **Two field complaints** → `.field-error` under the offending input, with `aria-invalid`,
    `aria-describedby` and focus moved to the field. Cleared the moment that field is edited.
  - **The network failure** → `.form-error`, a tinted panel directly above the buttons that
    caused it, naming the email as a fallback.
  - **Success** → an in-modal panel that replaces the form. It no longer closes the modal first:
    the confirmation used to arrive over a page that had already moved on.

  **This forced a palette decision.** The system had no error colour — DESIGN.md never needed
  one while every error was an OS dialog. Added `--danger`, **deliberately the same value as
  `--cat-theatre`** (`#7B2D2D`, 9.31:1 on card white), so the palette gains a job without
  gaining a hue. Recorded in DESIGN.md as **Fault Red**, in the sidecar, and as a new Don't
  that also writes down the `alert()`/`confirm()` rule this item establishes.

  **Two things the screenshot caught that the diff would not.** The intro copy
  ("Spotted something happening in Naas?") sits outside `<form>`, so hiding the form alone left
  it above the thank-you, still inviting the submission that had just been made — the panel now
  toggles a wrapper. And the one `mailto:` in the modal rendered as default browser blue, the
  only piece of browser chrome anywhere on the page.

- [x] **18. [P2] Fix the contact address. [×2]** All eight alerts quote
  `naastoday.tile693@passinbox.com`. `ContactModal.astro:10` and `terms.astro:33` both say
  `hello@naastoday.com`, which is also PRODUCT.md's brand commitment. A machine-looking relay
  address in an OS dialog reads as a scam to exactly the older resident this is built for.
  **Done when:** `grep -rn "passinbox" src/` returns nothing.

- [x] **19. [P2] Fix the UTC date bug in `updateRecurrenceHint`.** `:849` uses
  `cur.toISOString().slice(0, 10)` — the exact bug CLAUDE.md warns against everywhere else.
  The occurrence count can be off by one across Irish summer time. Use `localDateStr(cur)`,
  which already exists in this file.
  **It no longer existed in that file** — `45f3496` moved the function to `modal-form.js` and
  left the helper behind in `index.astro`, which is *why* the copy here was the broken one.
  Rather than paste a third copy, `localDateStr` moved to **`src/scripts/date.js`** and both
  import it. This project has now been bitten by exactly this twice before (three `validDate`s,
  two modal systems), and the third instance is a pattern.

- [x] **20. [P2] Surface stale data.** `:250-252` only sets `isError` when
  `events.length === 0`, so a failed refresh over pre-rendered data serves silently. With
  rebuilds capped at 15 deploys/month, that data can be days old, and "nothing on today" is
  indistinguishable from "nobody has touched this in a week" — on a product positioned as
  *moderated, therefore trustworthy*.
  **Done when:** a failed refresh over stale data shows a quiet "showing saved listings" note.

- [x] **21. [P3] Drop invalid `?event=` params.** `:165-167` preserves the param unconditionally,
  and `handleDeepLink` (`:998`) returns silently on a miss, so a bad link survives every
  subsequent navigation.

- [x] **22. [P3] Guard the two smooth scrolls for reduced motion.** `:610`
  (`window.scrollTo`) and `:1006` (`card.scrollIntoView`) both hardcode `behavior: 'smooth'`
  with no `prefers-reduced-motion` check. Pulled forward out of phase 5 because item 65's doc
  claim depends on it and it is one helper: `scrollBehavior()` returns `'auto'` or `'smooth'`
  and is read **per call**, since the OS setting can change while the tab is open.

- [x] **23. [P3] Give desktop Share a copy-link fallback.** `:322` opens a WhatsApp popup with
  no warning; popup blockers eat it silently.

---

## `src/layouts/BaseLayout.astro` — the stylesheet

### Touch targets — 13 of 17 control classes are below 44px

DESIGN.md claims "44px minimum touch targets throughout, for an audience that skews older",
and PRODUCT.md makes usability for older residents a *confirmed constraint*. Only
`.date-nav-btn`, `.modal-close`, `.skip-link` and the textarea currently meet it.

- [x] **24. [P1] `.desc-toggle-btn` — ~14px** (`:393-405`, `padding: 0`). Worst in the file, and
  it is the **only** route to a clamped description.
- [x] **25. [P1] `.footer-links a` / `button` — ~15–21px** (`:720-730`, `padding: 0`).
- [x] **26. [P1] `a.event-location` — ~19px** (`:357-370`, no padding, 12px text).
- [x] **27. [P1] `.event-url` — ~19px** (`:410-416`).
- [x] **28. [P1] `input[type=checkbox]` / `[type=radio]` — native ~13px** (`:892-895`, `:590-593`).
  **Fixed on the label, not the box.** Every one of these is wrapped in its own `<label>`, so
  the label *is* the target — sizing it to 44px (items 29–30) is what gives the 13px box a 44px
  hit area. The boxes went to 20px as well, because they still have to be *seen*. Both needed
  `min-height: 0` to escape the 44px that item 34 put on `.form-group input`.
- [x] **29. [P1] `.radio-label` — ~26px** (`:581-588`, no padding).
- [x] **30. [P1] `.checkbox-group label` — ~26px** (`:884-890`).
- [x] **31. [P1] `.filter-btn` — ~32px** (`:206-220`). Six of these are the page's primary
  decision point.
- [x] **32. [P1] `.share-btn` — 32px** (`:454-466`). The only one where a sub-44 value is
  written explicitly: `min-height: 32px`.
- [x] **33. [P1] `.upcoming-item` — ~37px** (`:495-504`).
- [x] **34. [P1] `.form-group input` / `select` — ~39px** (`:843-854`), 10 controls.
- [x] **35. [P1] `.submit-area-btn` — ~41px** (`:253-265`).
- [x] **36. [P1] `.form-actions button` — ~41px** (`:903-911`).

**Done when:** every interactive class declares a `min-height`/`min-width` of 44px, or padding
that reaches it.

**All thirteen shipped 2026-08-07.** Plain `min-height: 44px` in every case — no negative-margin
hit-area tricks. One was considered for the card's inline links and rejected: `.event-url` can
sit directly under `.desc-toggle-btn` with 12px between them, and two 44px targets that close
together *overlap*, so a tap meant for one lands on the other. Adjacent targets may touch; they
may not overlap. The two toggles' own margins were trimmed to pay for part of the added height.

**What it cost, measured at 375px** (Firefox headless, same page, stylesheet swapped):
**+32 to +50px per card**, roughly +15%. Four cards fitted above the submit button before;
about three and a half do now. That is a real trade against DESIGN.md's mobile-first scanning
principle, made knowingly in favour of its 44px claim and PRODUCT.md's confirmed
older-resident constraint. If it needs pulling back later, `.event-location` is the one to
revisit first — it is a whole 44px line for a link most visitors never tap.

**One regression, caught in the screenshot and fixed in the same commit.** `.desc-toggle-btn`
and `.event-url` went from `block`/`inline-block` to `flex`, and flex discards the whitespace
text node between the label and its trailing glyph — `facebook.com ↗` rendered as
`facebook.com↗`. Both now carry `gap: 0.25rem`. `.event-url` also got `width: fit-content`,
because `flex` had silently widened it from content-width to full-width and tapping the blank
half of that line should not open an external site. Neither was visible in the diff.

**Chrome budget re-measured 2026-08-07, before starting these** — the "check it after" note
that used to sit here was answered up front because item 79 changed the sums.

The original 247px figure predates both the sticky inversion (item 39) and the chip wrap
(item 79). At 375px the space above the first card is now **~262px**, but the important change
is that it is no longer one number:

| Band | Height | Behaviour |
|---|---|---|
| Masthead | ~54px | scrolls away (item 39) |
| Date section | ~110px | **pinned** — 44px nav buttons + 31px date + 24px padding + 1px rule |
| Filter row | ~98px | scrolls away — 26px padding + two 32px chip rows + 8px row gap |

**Only ~110px is permanent.** `.filter-btn` at 44px costs +12px per row, so item 31 is
**+24px on the two-row mobile layout** and lands entirely in the band that scrolls away — it
does not touch the pinned chrome the item-39 work settled. That makes item 31 cheaper than
this list has been assuming, and it should not be held back for budget reasons.

~~**One caveat to check on device:** the row count assumes chips without their count badges.~~
**Checked and clear.** A populated day at 375px renders `Free (4)` / `For kids (2)` /
`Markets (1)` and still wraps to **two** rows, so item 31 cost the predicted +24px, not +36px.

`.date-nav-btn` is already 44px, so of items 24–36 only item 31 affects any of this. The other
twelve are all below the fold or inside the modal.

### Focus and contrast

- [x] **37. [P1] Restore a real focus indicator on `.upcoming-item`.** `:505-508` sets
  `outline: none` and substitutes a ~1.05:1 background tint on a keyboard-operable control —
  a flat WCAG 2.4.7 failure.

- [x] **38. [P1] Raise `--border` to clear 3:1 on interactive controls.** `#e0e0d8` on
  `--bg-card` is **1.33:1** and on `--bg` is **1.28:1**, against WCAG 1.4.11's 3:1 for UI
  component boundaries. That border is the *sole* visual definition of `.filter-btn`,
  `.share-btn`, `.date-nav-btn` and `.btn-secondary` — in a system with almost no fills, the
  control outlines are effectively invisible even though their text passes at 7:1.
  **Note:** all *text* contrast passes — every pair measured sits between 5.29:1 and 12.62:1,
  and DESIGN.md's claimed floor reproduces exactly. This is a non-text finding only.

  **Decided 2026-08-07: a separate `--border-interactive: #8a8a7e`, not a global darkening.**
  3.36:1 on `--bg`, 3.49:1 on `--bg-card`, 3.08:1 on `--bg-muted` — clears 1.4.11 on every
  surface a bordered control can land on. Same hue as `#e0e0d8` walked down in lightness, so
  it stays inside the warm-grey family rather than reading as a new colour.

  **Six selectors take it:** `.date-nav-btn`, `.filter-btn`, `.share-btn`, `.empty-clear-btn`,
  `.form-group input/textarea/select`, `.btn-secondary`. **Six keep `--border`** and stay at
  1.33:1 deliberately: `.event-card`, `.ev-time`, `.ev-allday`, `.skeleton-card`,
  `.loading-spinner` (dead — item 50), `.modal-content`, plus `terms.astro`'s `h1` rule. The
  split is one question: does the line separate something, or can you press it? All hover and
  focus states already went to `--accent`, so none needed touching.

  **Knock-on decided at the same time:** `.filter-btn.is-empty:not(.active)` had
  `border-color: var(--border-light)` (**1.13:1**) from item 8. A zero-count chip is still a
  live control, so the override is gone — the chip now recedes by page-background fill alone,
  which item 8 already listed as the primary signal. This is a small walk-back of item 8's
  dimming, taken knowingly.

  Text-only controls (`.desc-toggle-btn`, `.event-url`, `.modal-close`) have no boundary to
  raise and pass on their glyph/text contrast; 1.4.11 does not apply.

- [x] **38a. Doc truth for the above — this is item 69, closed here.** `border-interactive` is
  in DESIGN.md's frontmatter and named **Pressable Line**; a new **Pressable Line Rule** in
  Named Rules states the 3:1 requirement and the separator-vs-control test. Three component
  descriptions that said "hairline" of a control (filter chips, form fields, date nav) and the
  Secondary button entry now say Pressable Line, and a matching `Do` was added.
  `.impeccable/design.json` carries the token (with `canonical` and `tonalRamp` computed the
  same way as the existing ones — the generator reproduces `border`'s recorded
  `oklch(90.4% 0.011 106.6)` exactly, so the new values are consistent, not invented), the rule,
  the `Do`, and the five updated component CSS snippets.

  **One wrinkle worth knowing:** weight and colour are now separate axes and they disagree.
  DESIGN.md's Shape section says 1px = structure, 1.5px = interactive, but a form input is 1px
  *and* takes the interactive colour. Both files now say so explicitly rather than leaving the
  next reader to spot the contradiction.

### Mobile chrome budget

~247px of a 375×667 viewport is consumed before the first card — roughly 44%, leaving room for
about one and a half events.

- [x] **39. [P1] Invert the stickiness.** The masthead is pinned (`:88-96`, `z-index: 100`) and
  the date scrolls away. Halfway down a busy Saturday there is no on-screen confirmation of
  which day you are reading. Pin the date instead — ideally with a compact active-filter
  summary — and let the masthead scroll away or collapse into the pinned bar.
  **Shipped without the filter summary.** `position: sticky` moved from `header` to
  `.date-section`; the `.scrolled` shadow and its JS moved with it, and now fire on
  `getBoundingClientRect().top <= 0` rather than `scrollY > 4`, because the bar no longer
  pins at scroll position zero. The compact active-filter summary is still open — it needs
  the filter row to settle (item 31 changes its height) and is really a shape question, not
  a layout one.

- [x] **40. [P1] Drop the tagline on mobile.** It restates the `<h1>` with no added information
  and costs vertical space on every visit.

- [x] **41. [P2] Set `line-height: 1.2` on `.current-date`.** It inherits `1.6` from `body`
  (`:78`) while DESIGN.md's `date` token specifies `1.2` — ~13px of dead space in the region
  already over budget.

- [x] **42. [P1] Use `100dvh` for the mobile bottom sheet.** `:1041` sets
  `max-height: 100vh`, which hides the Submit/Cancel row under the iOS Safari toolbar. Also
  lock `<body>` scroll while a modal is open — the page currently scroll-chains behind the
  sheet.
  The desktop `max-height: 90vh` moved to `90dvh` in the same edit — identical on desktop,
  correct on a phone in landscape. Scroll lock is `body.modal-open { overflow: hidden }`,
  toggled in `openModal`/`closeModal` (**both copies**), plus `overscroll-behavior: contain`
  on `.modal`, which is the property that actually stops the chaining. Deliberately *not* the
  `position: fixed` body trick — that fixes iOS's last stubborn case at the cost of losing
  scroll position, which is a worse bug than the one it solves here.

### `prefers-reduced-motion` — 7 selectors and 2 no-ops

DESIGN.md claims coverage is "explicit, control by control — not just the card entrance".
The block at `:1054-1060` misses:

- [x] **43. [P2] `header`** `:96` — `transition: box-shadow 0.2s`. Covered by item 39: the
  transition moved to `.date-section`, which was added to the reduced-motion override in the
  same edit. Leaving it uncovered would have been the same debt under a new selector name.
- [x] **44. [P2] `.event-card` *transition*** `:283` — the override kills only `animation`, so
  the hover `translateY(-2px)` still animates.
- [x] **45. [P2] `.skeleton-line`** `:645` — `skeletonPulse 1.5s **infinite**`.
- [x] **46. [P2] `.footer-links a` / `button`** `:729` — `transition: color 0.2s`.
- [x] **47. [P2] `.form-group input` / `textarea` / `select`** `:853`.
- [x] **48. [P2] `.deep-link-highlight`** `:1027` — `deep-link-pulse 0.8s ×2`.
- [x] **49. [P3] Remove the two no-op entries** at `:1058-1059`: `.desc-toggle-btn` and
  `.event-url` are named in the override but declare no transition anywhere.
  Also deleted a second, redundant `@media (prefers-reduced-motion: reduce)` block next to the
  card-entrance keyframes that repeated `.event-card { animation: none }` without the
  `!important` the real block already carries.

**Coverage checked by script, not by eye**, after the edits: every rule in the stylesheet that
declares a `transition` or `animation` was diffed against the override's selector list. Two
results worth recording:

- **`.btn-primary` / `.btn-secondary` look like no-ops but are not.** Their transition is
  declared on `.form-actions button`, not on the classes themselves, so a naive scan calls them
  unused. The override reaches them anyway via `!important`. Do not delete them the way item 49
  deleted the other two.
- **One animation is genuinely uncovered: `.loading-spinner`'s `spin`.** Left alone deliberately
  — it is the dead rule item 50 deletes, and it never reaches the DOM
  (`EventsGrid.astro` renders the skeleton). It costs nothing today, but **item 65 cannot claim
  full coverage until item 50 removes it.**

### Dead code

- [x] **50. [P3] Delete `.loading-spinner` and the `spin` keyframe** (`:658-670`). Never
  reaches the DOM — `EventsGrid.astro:57-62` renders the skeleton instead.
- [x] **51. [P3] Delete `.event-card:focus-visible`** (`:292-295`). Cards have no `tabindex`,
  so the rule can never match.
- [x] **52. [P3] Reconsider the card hover lift** (`:287-290`). `translateY(-2px)` plus a
  shadow is a click affordance on an element that isn't clickable.

---

## `src/components/modals/SubmitEventModal.astro`

- [x] **53. [P1] Label `#eventTimeStart` and `#eventTimeEnd`** (`:85`, `:87`). Both are
  unlabelled; `#eventTimeStart` is also `required`.
- [x] **54. [P1] Fix the orphan `<label>Time *</label>`** (`:69`). It has no `for` and wraps no
  input, so it associates with nothing. Make it a `<legend>` inside a `<fieldset>` around the
  three radios, or point it at `#eventTimeStart`.
- [x] **55. [P2] Make "Repeat until" honestly required** (`:62-63`). The asterisk is
  `aria-hidden="true"` and `#recurrenceEndDate` carries no `required` attribute — the
  requirement is conveyed to no assistive tech. JS applies it on toggle.
  **Premise wrong — closed with no change.** "JS applies it on toggle" *is* the conveyance:
  `modal-form.js:201` sets the `required` **property**, which lands in the accessibility tree
  exactly like the attribute would, and `:227` clears it on reset. The field is only required
  when the recurring section is open, so a static `required` would be wrong — it would block
  submission on a field the visitor cannot see. `aria-hidden` on the asterisk is correct
  alongside it; the alternative is a screen reader announcing "Repeat until star". Verified the
  set/clear pair covers open, close, reset and draft-restore.
- [x] **56. [P3] Reword the character counter.** "0 / 2000" states a ceiling on an empty
  required field where an expectation would help ("a sentence or two is plenty").

## `src/components/modals/DatePickerModal.astro`

- [x] **57. [P1] Label `#dateInput`** (`:11`). The date picker's only field has no `<label>`
  and no `aria-label`; `<h2 id="dateModalTitle">` labels the dialog, not the input.

## `src/components/Footer.astro`

- [x] **58. [P2] Hide the `·` separators from assistive tech** (`:8`, `:10`, `:12`). They are
  announced between every footer link.
- [x] **59. [P2] Settle on one label for the submit action.** Three exist:
  "Submit an event" (`EventsGrid.astro:54`), "Submit Event" (`Footer.astro:13`), "Add an Event"
  (`SubmitEventModal.astro:6`).

## `src/components/AppModals.astro` — the second copy

The two modal implementations are currently identical in behaviour. Every fix marked **[×2]**
above lands here too. Four defects are present in *both* copies:

- [x] **60. [P2] The focusable NodeList includes hidden elements. [×2]**
  (`index.astro:670` / `AppModals.astro:21`) It is captured once at open and includes controls
  inside `display: none` containers — `#recurringSection`, `#timeRangeSep`, `#eventTimeEnd`.
  `last.focus()` on a hidden element silently fails, so Tab-wrap breaks in the Submit modal's
  default state.
- [x] **61. [P2] `openModal` focuses the ✕, not the first field. [×2]**
  (`index.astro:689` / `AppModals.astro:39`) The selector
  `button, [href], input, select, textarea` matches `.modal-close` first in all four modals.
- [x] **62. [P3] `trapFocus` stacks listeners. [×2]** Added on every open, removed only by
  `closeModal`. Taken here rather than in phase 5 because it is two lines inside the function
  items 60–61 were already rewriting: `trapFocus` now removes any existing handler before
  attaching. `closeModal`'s single `removeEventListener` could never reach a second one.
- [x] **63. [P3] `.modal-header` isn't sticky** inside a scrolling sheet, so ✕ scrolls out of
  view on the long submit form.

## Found later — not in the original critique

- [x] **74. [P2] The same event shows two different time formats on one page.** The event card
  renders 12-hour with a meridiem — `{sidebarTime.time} {sidebarTime.ampm}` →
  **"2:00 PM"** (`EventCard.astro:68`, via `formatTimeShort` at `:27-32`). The upcoming list
  passes the stored value straight through — **"14:00"** (`index.astro:593`, and the
  build-time pre-render added in `17a5423`). So a 2pm event reads one way on its card and
  another in Coming Up.

  Consistency aside, 24-hour time is the less familiar form for the older audience PRODUCT.md
  names as a confirmed constraint, and the card's format is the one DESIGN.md documents as the
  signature Time Pill.

  **Fix in all three places at once** — `EventCard.astro` already has the helper, the client's
  `renderUpcoming()` needs it, and the pre-render needs it — or the client will overwrite the
  server's format on hydration and flicker.
  **Done when:** `grep -o 'class="upcoming-time">[^<]*' dist/index.html` shows meridiem times.

- [x] **75. [P2] DESIGN.md's page-order rule needs an empty-day clause.** The Layout section
  states the order is "fixed and load-bearing… masthead → date section → category filters →
  event list → submit prompt → 'What's next' → footer" and that "the submit call-to-action
  lives **after** the day's events, never before them, because the visitor's job comes first."

  `fc3d8ed` inverts the last two on an empty day: message → upcoming list → submit prompt. That
  follows the rule's stated *reason* — on a day with no events the visitor's job is answered by
  the upcoming list, not by the empty grid — while breaking its letter. Right now DESIGN.md
  contradicts shipped code, which is the precise failure mode items 64–68 exist to fix.

  Also record that the upcoming heading is now state-dependent: "Next up" when the day is
  empty, "Coming Up" otherwise. That interacts with item 68, which is about the same heading
  being called "What's next" in DESIGN.md and "Coming Up" in the code — settle all three names
  at once.
  **Done when:** DESIGN.md's Layout section describes both orders and names the condition.

- [x] **76. [P1] The submit sheet scrolled sideways on a phone.** `.checkbox-group` was a
  non-wrapping flex row, and six category labels at `gap: 1.5rem` are far wider than a 375px
  sheet. The whole modal scrolled left-right, with a blank gutter beside every other field.
  `.time-mode-group` directly above it already carried `flex-wrap: wrap` — the three radios hit
  the same wall first and nobody came back for the checkboxes. Fixed in `dee5c09`.
  **Only reproduces on a narrow viewport**, which is why 22 desktop-width passes missed it.

- [x] **77. [P3] iOS rubber-bands the sheet sideways. Won't fix — deliberate.** The page behind
  never moves and there is nothing out there to reach; it slides and springs back. Tried
  `overscroll-behavior: none` on `body.modal-open` — no effect, reverted rather than left in as
  a property that does nothing. The only remaining lever is `position: fixed` on `<body>` with
  a scrollY restore, which buys a cosmetic win at the price of a scroll-position bug. Recorded
  as a `ponytail:` ceiling in `BaseLayout.astro` so the debt ledger carries it.

- [x] **78. [P1] Every hover style stuck on after a tap on iOS.** iOS Safari leaves `:hover`
  applied to the last-tapped element until you tap elsewhere. Confirmed on an iPhone: switch a
  filter chip **off** and it keeps its category tint, so a chip you just cleared still looks
  half-selected. `.active` beats `:hover` at equal specificity by source order, so the *on*
  state was always safe — it was the *off* state that lied.

  **Fixed as a class, not an instance.** All 15 hover selectors in `BaseLayout.astro` had the
  same defect; only the chip was visible enough to notice. Each is now wrapped in
  `@media (hover: hover)`, which is the standard guard and changes nothing on desktop —
  media queries do not affect specificity, and source order is preserved, so
  `.is-empty` → `:hover` → `.active` still resolves as before.

  **One deliberate exception:** `.upcoming-item:hover, .upcoming-item:focus-visible` was a
  single rule. Wrapping it wholesale would have removed **keyboard focus styling on touch
  devices**, so it was split — hover inside the media query, `:focus-visible` outside. The
  `outline: none` in that rule is still item 37's WCAG 2.4.7 failure and was left alone.

  **Knock-on:** the card hover lift is now desktop-only, which weakens item 52 (a click
  affordance on a non-clickable element) — it never fires on the device where it misleads most.

  Found by asking why the filter chips only show their category colour on hover. The answer
  is that DESIGN.md intends exactly that (`:346-347`), but hover does not exist on touch — so
  the documented three-state control is two-state for most visitors, *and* the third state was
  leaking in as a stuck tint. **Retested on the iPhone and confirmed fixed.**

  **Settled while we were here — do not reopen:** the chips should *not* carry their category
  colour at rest to match the card tags. It was considered and rejected on 2026-08-06 for three
  reasons already written into DESIGN.md: colour *is* the selection signal (`:347`), the chip
  row is deliberately one type step down so six chips do not compete with the events beneath
  (`:275`), and `:407` forbids a category colour as a fill anywhere but an active chip. The
  chip and the tag also carry the same *word*, so the colour would be redundant reinforcement.

- [x] **79. [P1] Half the category chips were invisible on a phone.** The chip row was a
  horizontally-scrolling one-liner (`.filter-scroll` with `overflow-x: auto`, `.filter-group`
  with `flex-wrap: nowrap`). At 375px only Free, For kids and Music fit — and there was no cue
  that the rest existed: no edge fade, no chip clipped mid-word at the boundary, and no
  scrollbar, because iOS only paints one while you are actively scrolling. A visitor who never
  swiped would reasonably conclude the site has three categories, not six. Reported from an
  iPhone.

  `.filter-group` now wraps and `.filter-scroll` is deleted — it existed solely to enable the
  scroll, and `.controls-inner` was already a wrapping flex container, so the chips need no
  wrapper of their own. Two rows on a phone, still one on desktop; the existing `gap: 0.5rem`
  covers the row gap. `.filter-btn`'s `white-space: nowrap` is untouched, so labels still never
  break mid-word.

  **This overrides a design decision, not an oversight.** `DESIGN.md:348` read "The chip row
  scrolls horizontally rather than wrapping, so the filter bar is always exactly one line
  tall." Updated in the same change, or the detector would flag the correct CSS as the error.
  With six short chips, one-line-ness was not worth hiding three filters.

  **Knock-on for item 31:** raising `.filter-btn`'s height now multiplies across two rows on
  mobile, not one. The two should be sized together.

  Same failure as item 76 — a non-wrapping flex row that only breaks below ~400px. That is now
  twice. **Third instance is a pattern: audit every remaining `flex-wrap: nowrap`.**

---

## `DESIGN.md` — claims that don't hold

DESIGN.md is the authority the design detector enforces against, so an aspiration recorded as
a fact is load-bearing. Fix these **after** the code moves, so the file describes what shipped.

- [x] **64.** "44px minimum touch targets throughout" — currently 4 of 17. True after items
  24–36.
- [x] **65.** "`prefers-reduced-motion` disables every animation and transition in the system
  explicitly, control by control" — 7 selectors and 2 JS calls uncovered. True after items
  22 and 43–49.
- [x] **66.** "Don't introduce photography, illustration, or decorative imagery" — the empty
  state ships a decorative SVG. True after item 5.

**All three closed 2026-08-07 with no edit to DESIGN.md — the code caught up instead.** That is
what this section asked for: fix the claims *after* the code moves, and if the code moved far
enough the claim was simply true. Each was checked rather than assumed:

- **64** — 17 `min-height: 44px` / `width: 44px` declarations in `BaseLayout.astro`, against
  the 4 the critique counted.
- **65** — checked by script: every rule declaring a `transition` or `animation` diffed against
  the reduced-motion override's selector list, **uncovered: NONE**. Getting there needed two
  things beyond items 44–49. **Item 50 was pulled forward** and the dead `.loading-spinner` and
  its `spin` keyframe deleted, because a forever-looping animation on a rule that never reaches
  the DOM is still a hole in the claim. And `.form-actions button` was named explicitly:
  the override reached those buttons already through `.btn-primary` / `.btn-secondary` and
  `!important`, but only by inference, and a claim this section exists to make literal should
  not rest on one.
- **66** — `grep -c "<svg"` returns 0 across `src/`.

To re-check 65 after adding any transition, diff the rules declaring motion against the
override's selectors; eyeballing the list is what let seven selectors drift in the first place.
- [x] **67.** The One Green Rule ("appears as a fill at most once per viewport") breaks on the
  first filter tap: active chip fill + submit button fill. Either restate the rule or restyle
  the active chip.
- [x] **68.** DESIGN.md calls the section "What's next"; the code renders "Coming Up". Pick one.
- [x] **69.** ~~If item 38 introduces `--border-interactive`, add it to the frontmatter and
  re-run the sidecar refresh so `.impeccable/design.json` stays in step.~~ It did, and both are
  updated. Done as part of item 38 rather than after it — see **38a**. The rest of 64–68 still
  waits on the code, as this section says.
  **Same again for `--danger` in phase 5** — token, ramp and a new Don't in both files.
  **One gap left open on purpose:** the sidecar's `components` array does not describe the four
  UI pieces phase 5 added (`.field-error`, `.form-error`, `.submit-success`, `.stale-note`).
  Its snippets are hand-authored, and four half-written entries are worse than a known absence.
  Re-run the documenter when convenient; the colour tokens, which are what the detector actually
  validates against, are current.

---

## Open questions — decide before building

These are product decisions the critique surfaced. A refactor will answer them by accident if
you let it; `/impeccable shape` is the command that answers them on purpose.

- [x] **70.** **Is the single-day model right?** PRODUCT.md names *"what's on this weekend?"* as
  one of the two defining questions, and the interface has no answer that isn't four taps of
  "Next →" (and four history entries). Is the day-at-a-time shape a product decision or an
  inheritance from the name?

- [x] **71.** **Should filters combine as AND or OR?** They currently AND, and nothing says so.
  "Free + For kids" yielding nothing shows "Quiet day in Naas" with no hint that dropping one
  chip would help — and that is PRODUCT.md's named recurring sub-case.

- [x] **72.** **Are the description and specific-time fields earning their required status?**
  PRODUCT.md says growing community submissions is the central strategic goal and that
  submission *quality* matters as much as volume. The form currently refuses the neighbour who
  knows only "Saturday morning, the square" — while the card renderer can already display
  `TBC`.

- [x] **73.** **Should filter toggles push history?** Each one calls `pushState`
  (`index.astro:742, 750, 758`), so three taps while browsing means Back doesn't leave the site.
  `replaceState` for filters and `pushState` only for date changes may match intent better.

---

## Session handoff — 2026-08-05

Loose ends that are **not** numbered items above, because they are about the state of the work
rather than changes to make. Clear or confirm these before building on top.

- [x] **Confirm the `dev` push did not spend Netlify credits.** ~~`netlify.toml` carries no
  branch config, so the production branch lives in the Netlify dashboard.~~
  **Answered 2026-08-06: it did not.** `main` is the production branch — the live deploy
  reports `branch: "main"`, `context: "production"`, serving `naastoday.com`. A push to `dev`
  builds a branch deploy at `dev--naas-today.netlify.app` **at no credit cost**. Push to `dev`
  freely; only the merge to `main` spends. Recorded in CLAUDE.md's Deployment section, which
  is where a future session will look — do not re-raise this.

- [x] **Verify the three code paths that were never observed running.**
  **All three walked in a browser 2026-08-06 and confirmed working:**
  1. the filtered-empty branch — correct copy, correct singular/plural agreement;
  2. the "Show all events" button — clears all six chips *and* the URL;
  3. populated-day ordering — cards → submit-area → Coming Up, no empty-state leakage.

  One bug fell out of (1): the message read "There is 1 other event **on today**". Fixed in
  `ec528d0`.

- [x] **Nothing from 2026-08-05 *or* 2026-08-06 is live.** All of it is on `dev`, pushed and
  green. It reaches naastoday.com on the merge to `main`, which costs 15 credits — so it is
  worth batching rather than merging per phase. ~~**This is the one thing still waiting on a
  decision.**~~
  **Decided by the owner 2026-08-07: merge once, when the whole list is done.** Not per phase,
  not per session. So `dev` keeps accumulating and no phase boundary is a release boundary —
  stop treating it as one. **Do not re-raise this at the end of a phase.** The corollary is that
  `dev--naas-today.netlify.app` is the only place any of this can be seen until then, which
  makes the device pass more important, not less.

**Shipped 2026-08-05:** `eee3da8` (critique + this list), `17a5423` (item 9), `fc3d8ed`
(items 1–7), `259a182` (items 74–75), `34101d9` (item 10), `63d91f1` + `74a2e7e` (tracker).

## Session handoff — 2026-08-06

**All cleared the same day**, by walking each path in Firefox at 375px and on an iPhone over
the LAN (`netlify dev` binds `*:8888`, so `http://<laptop-lan-ip>:8888` works from a phone on
the same Wi-Fi — no tunnel, nothing exposed beyond the LAN).

- [x] **The sticky date bar (item 39).** Masthead scrolls away, date bar pins, shadow appears
  exactly on pin. The reworked trigger (`getBoundingClientRect().top <= 0`) is correct.
  Tagline confirmed gone at a measured 375px (item 40).
- [x] **The draft round trip (items 11–12).** Both halves. The restore *does* re-fire the
  dependent UI — recurring section open, end-time visible, occurrence hint filled, counter
  correct after a reload. Cancel prompts on a dirty form and not on a clean one.
- [x] **The bottom sheet on an actual iPhone (item 42).** Submit/Cancel clear the Safari
  toolbar — the `100vh` bug is gone. Scroll lock and containment both hold.

Two findings came out of the device pass — see items 76 and 77 below.

### Testing notes worth keeping

- **At 375px the submit sheet fills the viewport**, so there is no visible backdrop to drag
  and you cannot test scroll-lock with it. Use the **About or Contact** modal instead (short
  enough to leave a backdrop), or widen to ~800px where the submit modal centres.
  `body.modal-open` is not width- or modal-scoped, so either proves the same rule.
- **The Astro dev toolbar overlaps the sheet's Submit/Cancel row on mobile** when expanded.
  Dev-server artifact, not in the production build. Do not chase it.

**Shipped 2026-08-06:** `03c21d0` (items 39–41, 43), `ee9d332` (items 11, 12, 42), `78601ff`
(ponytail ceiling), `0737d38` (Netlify answer), `ec528d0` ("on today"), `dee5c09` (item 76),
`292f294` (item 8, closing phase 1), `4c053b1` (item 78). Twelve commits, all on `dev`.

### Picking this up next time

Phases 1–3 are done and **verified on a real device**, which is the "if you only do part of
this list" threshold the plan set. Phase 4 (accessibility, 31 items) is next and was
deliberately not started on 2026-08-06.

Two things to know before opening it: ~~item 38 needs a decision~~ and ~~re-check the chrome
budget~~. **Both were cleared on 2026-08-07** — see the 2026-08-07 handoff below. Item 38 is
shipped, and the budget was measured before rather than after, because item 79 had changed the
sums underneath it.

**The pattern that worked:** ship a phase, then walk every path it touched in a browser *and*
on a phone before moving on. The 2026-08-06 device pass found four bugs — items 76, 77, 78 and
the "on today" copy — that no amount of reading the diff had caught.

### Still open after the verification pass

- [x] **A successful submit clearing the draft is untested — accepted, not testing it.**
  Testing it means writing a real `pending` row to live Supabase and deleting it again via
  `/admin.html`. The path is the same `form.reset()` → `reset` listener → `clearDraft()` that
  Cancel uses, and Cancel *was* verified on device. Decision 2026-08-06: not worth the round
  trip. Do not re-raise.

- [x] **Item 1's copy deviates from its own acceptance check — confirmed fine.** The check asked
  for "No theatre events on Wednesday 6 August"; the code says "No matching events" and leaves
  the category unnamed, because the lit chip is on screen and item 39 made the date bar sticky,
  so naming either in prose restates what the visitor can see. Reviewed and accepted
  2026-08-06. The acceptance line above is now historical — the code is correct as shipped.

## Session handoff — 2026-08-07

**Phase 4 is closed — 32 of 32.** Plus items 22, 50 and 62 pulled forward out of phase 5, and
64–66 and 69 out of phase 6. 23 items in one session, 36 → 60 of 79. Four commits:

| Commit | Items |
|---|---|
| `0130f70` | 38, 69, 24–36 — the interactive border token, then the thirteen touch targets |
| `8c6763f` | 13–16, 53–55, 57–58 — labels, the fieldset, the skip-link target, the real button |
| `b447e0d` | 37, 44–49, 60–61, and 22 + 62 — focus, reduced motion, the focus trap |
| `273b416` | 64–66, and 50 — DESIGN.md's claims, verified rather than edited |

Started as bookkeeping and the two blockers in front of phase 4:

- **The tracker had drifted.** Header said 20 of 78 with item 79 already ticked; now 23 of 79.
- **The `[×2]` rule is dead** (`45f3496`, which landed after this file was last touched). One
  modal system in `src/scripts/modal-form.js`. Items 17, 18, 19 and 60–63 all shrank — see the
  amended rule 1 at the top. Nobody re-derived that; it is written down now so nobody has to.
- **Item 38 decided and shipped**, with item 69's doc work folded in. `--border-interactive`.
  Full reasoning under the item.
- **Chrome budget re-measured** and moved from "check after items 24–36" to a table under the
  touch-target section. The headline: only ~110px of the ~262px above the first card is
  actually pinned, and item 31 lands in the part that scrolls away.

### What was checked, and how

**Firefox headless is enough to catch layout regressions, and it earned its keep.** Screenshots
at `--window-size=375,1400` against the running `netlify dev`, plus a before/after pair taken by
swapping `BaseLayout.astro` back to `HEAD` between shots. That is how the +32/+50px per-card
figure is a measurement rather than an estimate, and how the chip row was confirmed to still
wrap to two rows *with* count badges.

It also caught a regression invisible in the diff: `.desc-toggle-btn` and `.event-url` moved to
`display: flex`, which discards the whitespace text node before a trailing glyph, so
`facebook.com ↗` rendered as `facebook.com↗`. Nothing about `min-height: 44px` suggests that.

The submit modal was rendered by copying `dist/index.html` to a scratch file, inlining the
stylesheet and forcing `#submitModal` visible — the sheet is server-rendered and only hidden,
so no JS is needed to see it. Fieldset legend, 20px boxes, 44px labels and the new field borders
all confirmed there.

### Phase 5, same session

Eleven more items (`d5f2e21`-ish — see git log), closing the list down to the eight that are
decisions. The three that were more than a one-liner:

- **17** turned four alerts into three different kinds of message and forced the `--danger`
  palette decision. Full note under the item.
- **19** was not where the item said it was, and fixing it properly meant a third shared module,
  `src/scripts/date.js`. The alternative was a third copy of `localDateStr`.
- **23** replaced the silent WhatsApp popup with a clipboard copy that confirms in the button
  itself, falling back to `prompt()` where the clipboard API is blocked. No toast system for
  one message.

**52 was a judgement call, not a deletion.** The item asks to reconsider the card hover lift.
The `translateY(-2px)` is gone — rising toward the cursor is a click affordance and a card is
not clickable — but the shadow stays, which DESIGN.md's Flat-At-Rest Rule explicitly sanctions.

### Phases 6 and 7, same session — the last eight

Two were owner decisions, taken via a direct question rather than assumed:

- **70 — the weekend gap: recorded, not built.** The single-day model stays. The gap is real
  (PRODUCT.md names "what's on this weekend?" as one of two defining questions and the interface
  answers only the other), so it is written into PRODUCT.md under a new **"Known gaps, decided
  but not closed"** heading rather than left to be rediscovered as a bug. A second navigation
  mode touches the URL model, the filters and the pre-render, and deserves its own pass.
- **72 — required fields dropped, both of them.** Description is optional and the time can be
  "Not sure yet", which stores no time and renders `TBC`. **`description` turned out to be
  optional server-side already** — only the client demanded it. The time needed a validator
  change, so per CLAUDE.md: `tests/event-body.test.js` written first, shown failing on exactly
  the missing-time case, then `validateEventBody` relaxed. Eleven tests, and four of them exist
  to prove the *format* checks did not go soft at the same time.

The rest:

- **67 — the One Green Rule restated, not the chip restyled.** The rule now says the accent
  appears as a fill at most once per viewport **as a call to action**, and an active filter chip
  is exempt because its fill is a selection state and the colour belongs to the category. Free's
  category colour is the same value as the accent, so a lit Free chip really does put a second
  green fill on screen — that is a coincidence of the palette, and recolouring Free to dodge it
  would break the Aged Family Rule for a 13px chip that competes for nothing.
- **68 + 75 together, since they are the same heading.** Three names existed. The canonical one
  is **"Coming up"**, sentence case like every other label on the site; **"Next up"** stays as
  the empty-day variant because that was a deliberate phase-1 decision — when the day is empty
  the list is the answer, not a footnote. DESIGN.md's Layout section now documents **both page
  orders** and names the condition that picks between them, which is item 75.
- **71 — the AND behaviour now says so.** When a filtered day comes up empty with two or more
  chips lit, the message adds "An event has to match every filter you have on — try turning one
  off." Only with two or more: with one chip there is no combining to explain.
- **73 — filters replace, dates push.** Filtering refines the current view; changing the date is
  navigation. `pushUrlState` became `writeUrlState({ replace })` so the distinction is visible
  at each of the six call sites rather than implied.
- **74 — three formatters, one module.** `formatTimeShort` and `shortTimeLabel` joined
  `localDateStr` in `src/scripts/date.js`, and the card, the pre-render and the client re-render
  all import them. Acceptance check passes: `grep -o 'class="upcoming-time">[^<]*' dist/index.html`
  now returns meridiem times.

**One stale claim fixed that no item had caught.** DESIGN.md still said "the masthead sticks at
`top: 0` … and gains a shadow only once the page has scrolled past 4px". Item 39 moved that to
`.date-section` and changed the trigger to `getBoundingClientRect().top <= 0` back on 2026-08-06.
Found while editing the paragraph next to it, which is an argument for doing doc-truth passes
adjacent to the code rather than from a list.

### Still needs a real device

Headless screenshots cannot answer these, and the 2026-08-06 pass is the precedent for how much
they matter:

- **Does the page read heavier now?** Item 38 changed the resting appearance of every control —
  six chips, four date-nav buttons, share, ten form fields. It looks fine in a screenshot; that
  is not the same as looking right.
- **A zero-count chip beside a populated one.** Its border no longer dims (item 38), so the
  recede is carried by fill alone. Worth confirming it still reads as "nothing here".
- **The +15% card height.** Four cards fitted above the submit button before, about three and a
  half now. Only scrolling a real busy day on a phone will say whether that is a real cost.
- **Focus and tab order**, which a screenshot cannot show at all: Tab through the submit sheet
  in each of the three time modes (items 60–61), and check the skip link now lands above the
  date controls (item 14).
- **The upcoming rows as real buttons** (item 15) — Enter and Space, and the focus outline that
  replaced `outline: none` (item 37).

Phase 5 adds four paths that have never run against the real backend, and the success one is
the one that matters:

- **A real submission.** The success panel, the draft clearing, and the modal *staying open*
  are all new. The 2026-08-06 note declined to test this because it writes a live `pending` row —
  that reasoning was sound when success was an `alert()`, and it is not any more. **Worth the
  round trip now**: submit something, confirm the panel, then delete the row in `/admin.html`.
- **A failed submission.** Offline in devtools, submit, and check the error panel appears above
  the buttons rather than as a dialog.
- **Both field errors** — an end date before the start, and a recurring event with no repeat-until.
- **Share on desktop** (item 23), which now copies instead of opening WhatsApp. The
  `prompt()` fallback needs a non-secure origin or a denied clipboard permission to see.
- **A submission with no time** (item 72) — pick "Not sure yet", submit, and confirm the row
  arrives with a null time and the card shows `TBC`. This is the one change that reaches the
  database schema's edges, and the validator no longer stops a null time from any source.

---

## Session handoff — 2026-08-08

**Phase 4 walked on an iPhone.** The pass held again: two of the five things it was asked to
check came back, and neither was visible in a screenshot.

- **Item 8's zero-count dim did not survive contact.** The fill was the only signal —
  `--bg` `#FAFBF6` against `--bg-card` `#FFFFFF`, a 1.5% luminance step — and at arm's length
  the chips looked identical. The border could not help: item 38 deliberately holds every chip's
  boundary at 3:1 because a zero-count chip is still a live control, and that is not being
  undone. **Fixed by showing the number**: every chip now reads `Music (0)`, not a bare label.
  That is *less* code than the conditional it replaced, and it also closes the ambiguity item 8
  originally raised — a bare label read the same as "counts have not loaded yet".
  **Note the pre-render still ships bare labels**; the counts arrive with JS. Pre-existing, not
  a regression, but it is the one moment the old ambiguity still exists.
- **The chrome, which no item had raised.** ~277px above the first card at 375×812 — masthead 54,
  date 101, filters 122. About 40% of an iPhone's real estate after Safari's bars. Trimmed by
  ~31px (padding, and the masthead down to 1.25rem below 480px); the rest is three settled
  decisions and a layout question. **Recorded in PRODUCT.md under "Known gaps, decided but not
  closed"** rather than solved here, on the item-70 precedent.

**Two of my own errors in the 2026-08-07 handoff, corrected:**

- **"Four cards fitted above the submit button, now three and a half" describes nothing.**
  `EventsGrid.astro:76` renders `.submit-area` only when the day *has* events, after the whole
  grid — so on a populated day it follows the list however long it is. The measurement came from
  the empty-day "Coming up" list, where the CTA does follow a bounded set. The owner caught it.
  Card height was walked and is fine.
- **Tab order and the upcoming-row keyboard checks were put on a phone list.** An iPhone has no
  Tab key. Those four were verified statically instead, which is weaker than a real keyboard but
  honest about being so:
  - Skip link targets `#main-content`, and DateNav is inside `<main>` (`index.astro:93`), so it
    lands above the date controls. Item 14 ✓
  - Upcoming rows are real `<button type="button">` inside the `<li>` (`index.astro:701`), so
    Enter and Space come from the platform. Item 15 ✓
  - `outline: none` survives only on form inputs, paired with a 3px `box-shadow` ring — an
    indicator, not a removal. Item 37 ✓
  - The focus trap reads focusables at Tab time and filters on `offsetParent`, which is exactly
    the hidden-field case the three time modes create. Items 60–61 ✓ (`modal-form.js:26-33`)

### Phase 5 walked on device, same day

The backend list above is now done. The real submission, the offline panel, desktop share and
the null-time row all behaved as written. **The two field-error paths did not**, and between them
they hid three separate defects — all in the half of phase 5 that only a device could reach.

- **The native date picker ate the error message.** `setFieldError` ended with `input.focus()`,
  and both guarded fields are `<input type="date">`. Focusing one on iOS opens the date wheel,
  which covers the message that was just written — so the reported experience was "it reopens a
  date dialogue, and if I close it and scroll up the text is there". **Now scrolls instead of
  focusing.** Nothing is lost: both slots are `role="alert"`, so the message announces itself
  without focus moving. This is the second time a `focus()` written for keyboard users has
  misfired on touch; check the platform before moving focus to an input.
- **"Pick a date to repeat until." was unreachable code.** Ticking *Recurring* set
  `recurrenceEndDate.required = true`, so on a blank field the browser blocked submit and showed
  its own **"Fill out this field"** bubble — the submit handler never ran, and the message written
  specifically to replace that kind of bubble could never appear. It is now `aria-required`,
  which keeps the semantics for assistive tech and leaves the decision with the JS that has the
  better message. **`eventTimeStart` keeps native `required` deliberately** — nothing custom
  competes for it there, and native validation is fine where it is the only validation.
- **The error text did not read as an error.** `--danger` is `#7B2D2D`, deliberately the same
  value as `--cat-theatre` so the palette gains a job rather than a hue. That is right for a tag
  on a tinted chip and too quiet for 13px on white; the on-device report was simply "it's not in
  red". Rather than spend a new colour, the **field itself is now marked** —
  `input[aria-invalid="true"]` gets a `--danger` border and a `--cat-theatre-bg` ring. That was
  owed regardless: `aria-invalid` was already being set with nothing rendering it, and WCAG 1.4.1
  says colour cannot be the only carrier. **Whether `--danger` should become a brighter dedicated
  error red is still open** — it is a palette decision, and it would break the one-value-two-jobs
  reasoning that put `#7B2D2D` there.

**Not a defect:** the success panel also carries "Anything wrong with it? Email
hello@naastoday.com." That is in the markup (`SubmitEventModal.astro:163`) and was missing from
the test script, not from the page.

---

## The list is finished. What that does and does not mean

**Done:** all 79 items, across seven phases, from a critique that scored 22/40 with five P1s.

**Not done:** any of it is live. Everything from 2026-08-05 onward is on `dev`, per the owner's
decision to merge once at the end rather than per phase. That merge is now the outstanding
action, and it costs 15 credits.

**Before merging, the honest sequence is:**

1. **Walk phases 4 and 5 on a phone**, using the two lists above. This is the step the
   2026-08-06 pass proved is not optional — it found four bugs that reading the diff had not,
   and phases 4 and 5 are twice the size of phases 1–3 combined.
2. **Make one real submission** and delete it from `/admin.html`. Nothing else exercises the
   success panel, the draft clearing, or the relaxed validator end to end.
3. Then merge, and **re-run the critique** (see below) to see where 22/40 landed.

**Do not treat a re-run critique as the finish line either.** It scores the same page against
the same heuristics; a second pass will surface a second list. The point of this one was the
five P1s, and those are closed.

---

## Re-measuring

After a phase, re-run the critique to see the score move:

```bash
# in Claude Code
/impeccable critique src/pages/index.astro
```

It writes a new snapshot beside the first one and prints a trend line
(`22 → n out of 40`). `/impeccable polish` reads the most recent snapshot automatically via
`critique-storage.mjs latest`, so it always works from the current backlog rather than this file.

**Known tooling bug (Impeccable 4.0.4, not this project):** `critique-storage.mjs` writes
`total_score` / `p0_count` / `p1_count` to the snapshot frontmatter, but `context-signals.mjs`
reads `score` / `p0` / `p1`. The no-argument `/impeccable` menu therefore reports every
critique as `score: 0, p0: 0, p1: 0`. The snapshot itself is correct and `polish` is
unaffected — only the recommendation menu misreads it.
