# Critique action list — public events page

Derived from `.impeccable/critique/2026-08-05T19-46-18Z__src-pages-index-astro.md`
(Impeccable `critique`, dual-agent, scored **22/40**, 5×P1 + 1×P2).

This is the same set of findings as the critique, **deduplicated and regrouped by the file
you would open to fix them**. The critique restates each finding from five angles — heuristic
score, specificity verdict, priority issue, cognitive load, persona walkthrough — which is
useful for understanding *why* and useless for working through. Every item below appears
exactly once.

**Line numbers are as of `d1489de` and will drift as you edit.** Each item carries enough
surrounding context to relocate it.

---

## How to work through this

Ordered by value, not by file. Each phase is a coherent chunk you can ship on its own.

73 items. The list below is grouped by file, but this is the order I'd work them in — each
phase is a coherent chunk you can ship on its own.

| Phase | Items | Count | Command | Why this order |
|---|---|---|---|---|
| 1. Empty day | 1–9 | 9 | `/impeccable clarify` | Highest value, smallest diff. This is the screen most visitors actually see. |
| 2. Mobile chrome | 39–41 | 3 | `/impeccable layout` | Structural. Do it right after phase 1 — item 31 changes the filter row's height, so settle the budget once. |
| 3. Form data loss | 10–12, 42 | 4 | `/impeccable harden` | Independent of everything else. Every lost submission is invisible to you. |
| 4. Accessibility | 13–16, 24–38, 43–49, 53–55, 57–58, 60–61 | 32 | `/impeccable audit` | The bulk of the list, but mostly one-line CSS. Item 38 needs a decision, not just an edit. |
| 5. Trust & consistency | 17–23, 50–52, 56, 59, 62–63 | 14 | `/impeccable polish` | Sweeps what's left; reads the critique snapshot as its own input. |
| 6. Doc truth | 64–69 | 6 | manual | Fix DESIGN.md's overstated claims *after* the code moves, so it describes what shipped. |
| 7. Open questions | 70–73 | 4 | `/impeccable shape` | Genuine product decisions. Don't let a refactor make them by accident. |

Phases 1–3 are ~16 items and cover both P1 findings that `polish` would refuse to touch (it
classifies them as conceptual mismatches and is instructed to flag rather than fix). If you
only do part of this list, do those.

### Two rules that apply throughout

1. **Modal fixes must be applied twice.** `src/pages/index.astro` and
   `src/components/AppModals.astro` carry independent copies of the modal system and the
   submit handler. They are currently line-for-line identical in behaviour — a fix to one
   silently diverges `/` from `/terms`. Items affected are marked **[×2]**.
2. **`npm test` is not triggered by anything here.** Nothing in this list touches
   `netlify/functions/`. If you end up changing a validator, CLAUDE.md's rule applies:
   failing test first, show it failing, then fix.

---

## `src/components/EventsGrid.astro` — the empty state

The empty state is currently built as an error screen: hidden until needed, decorative icon,
apology headline, then a request for labour. On a site where most weekdays have nothing on,
this is the primary screen, not the fallback.

- [ ] **1. [P1] Branch the empty state on cause.** `:52-53` renders "Quiet day in Naas —
  Nothing listed yet" whether the day is genuinely empty or a filter emptied it. Tap Theatre
  on a four-event day and the page states something false.
  **Done when:** a filtered-empty day reads "No theatre events on Wednesday 6 August — 4 other
  events on today" and an unfiltered-empty day keeps the current copy.

- [ ] **2. [P1] Add a "Show all events" button to the filtered-empty branch.** There is
  currently no clear-all-filters control anywhere on the page, and the filter row is not
  sticky, so a scrolled user cannot see which chip caused the emptiness.
  **Done when:** one tap from filtered-empty returns to the full day.

- [ ] **3. [P1] Make "Coming Up" the body of the empty state.** It currently sits *after* the
  submit CTA and below the fold (`index.astro:67-70`). The one useful thing on the screen
  ranks below a request for unpaid work.
  **Done when:** on an empty day the next few events appear above the submit button.

- [ ] **4. [P1] Demote the submit CTA below the upcoming list**, with quieter treatment than
  the current full-width green fill (`:54`).
  **Done when:** the visitor's question is answered before they are asked for anything.

- [ ] **5. [P2] Delete the decorative SVG** at `:42-50`. DESIGN.md's own Don'ts say
  "Don't introduce photography, illustration, or decorative imagery" — this is the only
  violation in the codebase.
  **Done when:** `grep -c "<svg" src/components/EventsGrid.astro` returns 0.

- [ ] **6. [P2] Reduce the empty state's vertical padding.** `.events-container` carries
  `padding: 0 0 4rem` (`BaseLayout.astro:243-245`) and the empty state adds its own. This is
  the most-shown state; it should not be the most padded.

- [ ] **7. [P1] Replace the container-wide live region.** `:36` puts
  `aria-live="polite"` on `.events-container`, so every filter tap re-announces every card's
  full text, descriptions included.
  **Done when:** a small dedicated status node announces "3 events" and the container has no
  `aria-live`.

- [ ] **8. [P2] Consider disabling rather than hiding zero-count filter chips.** Absence of a
  count is currently ambiguous with not-yet-loaded.

- [ ] **9. [P1] Pre-render upcoming events at build time.** `index.astro:67-70` ships
  `<h2>Coming Up</h2>` over an empty `<ul>` in the static HTML. First paint, no-JS, and
  slow-connection visitors see a heading promising content with nothing under it. Fetch the
  next 3–5 approved events in the page frontmatter alongside `initialEvents`.
  **Done when:** `npm run build && grep -A3 "Coming Up" dist/index.html` shows real `<li>`
  elements.

---

## `src/pages/index.astro` — client behaviour

- [ ] **10. [P1] Stop destroying the form on dismiss. [×2]** `:977` and `:987` call
  `document.getElementById('eventForm').reset()` on scrim-click and Escape, with no confirm and
  no undo, on a form with a required description up to 2000 characters.
  **Done when:** typing into the form, pressing Escape, and reopening restores the text.

- [ ] **11. [P1] Persist the form draft to `sessionStorage`** on input, restore on open, clear
  on successful submit.
  **Done when:** a submission survives a tab switch and return.

- [ ] **12. [P1] Confirm before discarding a dirty form**, and reset only on explicit Cancel or
  success.

- [ ] **13. [P1] Make the events heading track the current date.** `:65` hardcodes
  `<h2 class="visually-hidden" id="events-list-heading">Today's events</h2>`. Navigate to
  14 August and heading navigation still announces "Today's events". The id is also referenced
  by nothing — `grep -rn "events-list-heading" src/` returns only the declaration.
  **Done when:** the heading text follows `currentDate`, or the element is deleted.

- [ ] **14. [P1] Move `id="main-content"` above `<DateNav>`.** `:63` puts it on `<main>`, which
  starts *after* the date controls, so the skip link skips past prev/today/pick-a-date/next and
  a keyboard user must shift-tab back.

- [ ] **15. [P1] Replace `role="button"` on `<li>` with a real `<button>`.** `:581-582` sets
  `role="button"` and `tabindex="0"` on list items, which strips the `<ul>` of list semantics
  and produces accessible names like "Thu, 7 Aug 20:00 Trad Session The Storehouse".

- [ ] **16. [P1] Add a group label to the filter row.** Six unlabelled toggle buttons follow the
  date nav with nothing saying they filter anything.
  **Done when:** the row carries `role="group" aria-label="Filter events by category"`
  (in `src/components/FilterControls.astro`).

- [ ] **17. [P2] Replace the eight `alert()` calls. [×2]** `index.astro:907, 920, 937, 940,
  955, 958` plus `AppModals.astro:203, 206, 221, 224`. They are unstyled, render as
  "naastoday.com says" on iOS, and put validation errors nowhere near the offending field.
  **Done when:** inline validation sits next to each field and success shows an in-modal panel
  in the site's own voice.

- [ ] **18. [P2] Fix the contact address. [×2]** All eight alerts quote
  `naastoday.tile693@passinbox.com`. `ContactModal.astro:10` and `terms.astro:33` both say
  `hello@naastoday.com`, which is also PRODUCT.md's brand commitment. A machine-looking relay
  address in an OS dialog reads as a scam to exactly the older resident this is built for.
  **Done when:** `grep -rn "passinbox" src/` returns nothing.

- [ ] **19. [P2] Fix the UTC date bug in `updateRecurrenceHint`.** `:849` uses
  `cur.toISOString().slice(0, 10)` — the exact bug CLAUDE.md warns against everywhere else.
  The occurrence count can be off by one across Irish summer time. Use `localDateStr(cur)`,
  which already exists in this file.

- [ ] **20. [P2] Surface stale data.** `:250-252` only sets `isError` when
  `events.length === 0`, so a failed refresh over pre-rendered data serves silently. With
  rebuilds capped at 15 deploys/month, that data can be days old, and "nothing on today" is
  indistinguishable from "nobody has touched this in a week" — on a product positioned as
  *moderated, therefore trustworthy*.
  **Done when:** a failed refresh over stale data shows a quiet "showing saved listings" note.

- [ ] **21. [P3] Drop invalid `?event=` params.** `:165-167` preserves the param unconditionally,
  and `handleDeepLink` (`:998`) returns silently on a miss, so a bad link survives every
  subsequent navigation.

- [ ] **22. [P3] Guard the two smooth scrolls for reduced motion.** `:610`
  (`window.scrollTo`) and `:1006` (`card.scrollIntoView`) both hardcode `behavior: 'smooth'`
  with no `prefers-reduced-motion` check.

- [ ] **23. [P3] Give desktop Share a copy-link fallback.** `:322` opens a WhatsApp popup with
  no warning; popup blockers eat it silently.

---

## `src/layouts/BaseLayout.astro` — the stylesheet

### Touch targets — 13 of 17 control classes are below 44px

DESIGN.md claims "44px minimum touch targets throughout, for an audience that skews older",
and PRODUCT.md makes usability for older residents a *confirmed constraint*. Only
`.date-nav-btn`, `.modal-close`, `.skip-link` and the textarea currently meet it.

- [ ] **24. [P1] `.desc-toggle-btn` — ~14px** (`:393-405`, `padding: 0`). Worst in the file, and
  it is the **only** route to a clamped description.
- [ ] **25. [P1] `.footer-links a` / `button` — ~15–21px** (`:720-730`, `padding: 0`).
- [ ] **26. [P1] `a.event-location` — ~19px** (`:357-370`, no padding, 12px text).
- [ ] **27. [P1] `.event-url` — ~19px** (`:410-416`).
- [ ] **28. [P1] `input[type=checkbox]` / `[type=radio]` — native ~13px** (`:892-895`, `:590-593`).
- [ ] **29. [P1] `.radio-label` — ~26px** (`:581-588`, no padding).
- [ ] **30. [P1] `.checkbox-group label` — ~26px** (`:884-890`).
- [ ] **31. [P1] `.filter-btn` — ~32px** (`:206-220`). Six of these are the page's primary
  decision point.
- [ ] **32. [P1] `.share-btn` — 32px** (`:454-466`). The only one where a sub-44 value is
  written explicitly: `min-height: 32px`.
- [ ] **33. [P1] `.upcoming-item` — ~37px** (`:495-504`).
- [ ] **34. [P1] `.form-group input` / `select` — ~39px** (`:843-854`), 10 controls.
- [ ] **35. [P1] `.submit-area-btn` — ~41px** (`:253-265`).
- [ ] **36. [P1] `.form-actions button` — ~41px** (`:903-911`).

**Done when:** every interactive class declares a `min-height`/`min-width` of 44px, or padding
that reaches it. Note that raising `.filter-btn` will change the filter row's height — check
item 40's chrome budget after.

### Focus and contrast

- [ ] **37. [P1] Restore a real focus indicator on `.upcoming-item`.** `:505-508` sets
  `outline: none` and substitutes a ~1.05:1 background tint on a keyboard-operable control —
  a flat WCAG 2.4.7 failure.

- [ ] **38. [P1] Raise `--border` to clear 3:1 on interactive controls.** `#e0e0d8` on
  `--bg-card` is **1.33:1** and on `--bg` is **1.28:1**, against WCAG 1.4.11's 3:1 for UI
  component boundaries. That border is the *sole* visual definition of `.filter-btn`,
  `.share-btn`, `.date-nav-btn` and `.btn-secondary` — in a system with almost no fills, the
  control outlines are effectively invisible even though their text passes at 7:1.
  **Careful:** the same token also draws card and input edges, where 1.33:1 is a deliberate
  hairline. Consider a separate `--border-interactive` rather than darkening globally, and add
  it to DESIGN.md's frontmatter if you do.
  **Note:** all *text* contrast passes — every pair measured sits between 5.29:1 and 12.62:1,
  and DESIGN.md's claimed floor reproduces exactly. This is a non-text finding only.

### Mobile chrome budget

~247px of a 375×667 viewport is consumed before the first card — roughly 44%, leaving room for
about one and a half events.

- [ ] **39. [P1] Invert the stickiness.** The masthead is pinned (`:88-96`, `z-index: 100`) and
  the date scrolls away. Halfway down a busy Saturday there is no on-screen confirmation of
  which day you are reading. Pin the date instead — ideally with a compact active-filter
  summary — and let the masthead scroll away or collapse into the pinned bar.

- [ ] **40. [P1] Drop the tagline on mobile.** It restates the `<h1>` with no added information
  and costs vertical space on every visit.

- [ ] **41. [P2] Set `line-height: 1.2` on `.current-date`.** It inherits `1.6` from `body`
  (`:78`) while DESIGN.md's `date` token specifies `1.2` — ~13px of dead space in the region
  already over budget.

- [ ] **42. [P1] Use `100dvh` for the mobile bottom sheet.** `:1041` sets
  `max-height: 100vh`, which hides the Submit/Cancel row under the iOS Safari toolbar. Also
  lock `<body>` scroll while a modal is open — the page currently scroll-chains behind the
  sheet.

### `prefers-reduced-motion` — 7 selectors and 2 no-ops

DESIGN.md claims coverage is "explicit, control by control — not just the card entrance".
The block at `:1054-1060` misses:

- [ ] **43. [P2] `header`** `:96` — `transition: box-shadow 0.2s`.
- [ ] **44. [P2] `.event-card` *transition*** `:283` — the override kills only `animation`, so
  the hover `translateY(-2px)` still animates.
- [ ] **45. [P2] `.skeleton-line`** `:645` — `skeletonPulse 1.5s **infinite**`.
- [ ] **46. [P2] `.footer-links a` / `button`** `:729` — `transition: color 0.2s`.
- [ ] **47. [P2] `.form-group input` / `textarea` / `select`** `:853`.
- [ ] **48. [P2] `.deep-link-highlight`** `:1027` — `deep-link-pulse 0.8s ×2`.
- [ ] **49. [P3] Remove the two no-op entries** at `:1058-1059`: `.desc-toggle-btn` and
  `.event-url` are named in the override but declare no transition anywhere.

### Dead code

- [ ] **50. [P3] Delete `.loading-spinner` and the `spin` keyframe** (`:658-670`). Never
  reaches the DOM — `EventsGrid.astro:57-62` renders the skeleton instead.
- [ ] **51. [P3] Delete `.event-card:focus-visible`** (`:292-295`). Cards have no `tabindex`,
  so the rule can never match.
- [ ] **52. [P3] Reconsider the card hover lift** (`:287-290`). `translateY(-2px)` plus a
  shadow is a click affordance on an element that isn't clickable.

---

## `src/components/modals/SubmitEventModal.astro`

- [ ] **53. [P1] Label `#eventTimeStart` and `#eventTimeEnd`** (`:85`, `:87`). Both are
  unlabelled; `#eventTimeStart` is also `required`.
- [ ] **54. [P1] Fix the orphan `<label>Time *</label>`** (`:69`). It has no `for` and wraps no
  input, so it associates with nothing. Make it a `<legend>` inside a `<fieldset>` around the
  three radios, or point it at `#eventTimeStart`.
- [ ] **55. [P2] Make "Repeat until" honestly required** (`:62-63`). The asterisk is
  `aria-hidden="true"` and `#recurrenceEndDate` carries no `required` attribute — the
  requirement is conveyed to no assistive tech. JS applies it on toggle.
- [ ] **56. [P3] Reword the character counter.** "0 / 2000" states a ceiling on an empty
  required field where an expectation would help ("a sentence or two is plenty").

## `src/components/modals/DatePickerModal.astro`

- [ ] **57. [P1] Label `#dateInput`** (`:11`). The date picker's only field has no `<label>`
  and no `aria-label`; `<h2 id="dateModalTitle">` labels the dialog, not the input.

## `src/components/Footer.astro`

- [ ] **58. [P2] Hide the `·` separators from assistive tech** (`:8`, `:10`, `:12`). They are
  announced between every footer link.
- [ ] **59. [P2] Settle on one label for the submit action.** Three exist:
  "Submit an event" (`EventsGrid.astro:54`), "Submit Event" (`Footer.astro:13`), "Add an Event"
  (`SubmitEventModal.astro:6`).

## `src/components/AppModals.astro` — the second copy

The two modal implementations are currently identical in behaviour. Every fix marked **[×2]**
above lands here too. Four defects are present in *both* copies:

- [ ] **60. [P2] The focusable NodeList includes hidden elements. [×2]**
  (`index.astro:670` / `AppModals.astro:21`) It is captured once at open and includes controls
  inside `display: none` containers — `#recurringSection`, `#timeRangeSep`, `#eventTimeEnd`.
  `last.focus()` on a hidden element silently fails, so Tab-wrap breaks in the Submit modal's
  default state.
- [ ] **61. [P2] `openModal` focuses the ✕, not the first field. [×2]**
  (`index.astro:689` / `AppModals.astro:39`) The selector
  `button, [href], input, select, textarea` matches `.modal-close` first in all four modals.
- [ ] **62. [P3] `trapFocus` stacks listeners. [×2]** Added on every open, removed only by
  `closeModal`.
- [ ] **63. [P3] `.modal-header` isn't sticky** inside a scrolling sheet, so ✕ scrolls out of
  view on the long submit form.

---

## `DESIGN.md` — claims that don't hold

DESIGN.md is the authority the design detector enforces against, so an aspiration recorded as
a fact is load-bearing. Fix these **after** the code moves, so the file describes what shipped.

- [ ] **64.** "44px minimum touch targets throughout" — currently 4 of 17. True after items
  24–36.
- [ ] **65.** "`prefers-reduced-motion` disables every animation and transition in the system
  explicitly, control by control" — 7 selectors and 2 JS calls uncovered. True after items
  22 and 43–49.
- [ ] **66.** "Don't introduce photography, illustration, or decorative imagery" — the empty
  state ships a decorative SVG. True after item 5.
- [ ] **67.** The One Green Rule ("appears as a fill at most once per viewport") breaks on the
  first filter tap: active chip fill + submit button fill. Either restate the rule or restyle
  the active chip.
- [ ] **68.** DESIGN.md calls the section "What's next"; the code renders "Coming Up". Pick one.
- [ ] **69.** If item 38 introduces `--border-interactive`, add it to the frontmatter and
  re-run the sidecar refresh so `.impeccable/design.json` stays in step.

---

## Open questions — decide before building

These are product decisions the critique surfaced. A refactor will answer them by accident if
you let it; `/impeccable shape` is the command that answers them on purpose.

- [ ] **70.** **Is the single-day model right?** PRODUCT.md names *"what's on this weekend?"* as
  one of the two defining questions, and the interface has no answer that isn't four taps of
  "Next →" (and four history entries). Is the day-at-a-time shape a product decision or an
  inheritance from the name?

- [ ] **71.** **Should filters combine as AND or OR?** They currently AND, and nothing says so.
  "Free + For kids" yielding nothing shows "Quiet day in Naas" with no hint that dropping one
  chip would help — and that is PRODUCT.md's named recurring sub-case.

- [ ] **72.** **Are the description and specific-time fields earning their required status?**
  PRODUCT.md says growing community submissions is the central strategic goal and that
  submission *quality* matters as much as volume. The form currently refuses the neighbour who
  knows only "Saturday morning, the square" — while the card renderer can already display
  `TBC`.

- [ ] **73.** **Should filter toggles push history?** Each one calls `pushState`
  (`index.astro:742, 750, 758`), so three taps while browsing means Back doesn't leave the site.
  `replaceState` for filters and `pushState` only for date changes may match intent better.

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
