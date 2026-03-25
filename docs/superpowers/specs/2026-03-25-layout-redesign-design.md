# Layout Redesign — Design Spec

**Date:** 2026-03-25
**Status:** Approved
**Branch:** dev

---

## Problem

The current single-column card layout has two issues:

1. **Readability on desktop:** Cards stretch to `max-width: 1100px`, producing uncomfortably long lines.
2. **Controls bar on mobile:** Filter pills wrap and stretch to fill the row, producing inconsistently-sized buttons. "Submit event" is isolated at the bottom of the controls, disconnected from the rest of the page.

---

## Decision

**Option A — Narrow everything.**
Reduce the container to `max-width: 660px` so controls and cards share one column, centered on wide screens. Move "Submit event" below the event cards as a full-width button.

Chosen because: most visitors are on mobile (single-column is natural), 3–5 events/day (no need for a grid), and it requires minimal code change.

---

## Changes

### 1. Container width

In `BaseLayout.astro` (`.container`):

```css
max-width: 660px;  /* was 1100px */
```

This narrows the entire page content area — header text, date nav, filter row, and cards — to a single readable column. Full-width background bands (header bar, date section, controls section) remain unchanged.

### 2. Filter controls — remove wrapping, remove submit button

In `FilterControls.astro`:

- Remove the `<span class="controls-label">Filter:</span>` element.
- Remove the `<button class="submit-btn" id="submitEventBtn">Submit event</button>` element.
- The `.filter-group` already has `flex-wrap: nowrap` and `.filter-scroll` already has `overflow-x: auto` — these are correct. The wrapping was caused by the mobile override `align-items: stretch` on `.controls-inner`, which no longer applies once the controls only contain the filter scroll row.

In `BaseLayout.astro`:

- Remove or simplify the mobile CSS override for `.controls-inner` that sets `flex-direction: column; align-items: stretch`. With only the filter scroll row remaining, no column stacking is needed.
- Remove the `.controls-label` CSS rule (unused).
- Remove the `.submit-btn` rule from the controls context (the submit button moves elsewhere — see below).
- Remove the skeleton grid's `max-width: 640px; margin: 0 auto` — the container handles this now.
- The `481px–768px` breakpoint rule for `.events-grid` (`grid-template-columns: 1fr`) is redundant with a 660px container and can be removed.

### 3. Submit event button — move below the events grid

In `EventsGrid.astro`, add a `.submit-area` block after the `#eventsGrid` div (and after the empty/loading/error states):

```html
<div class="submit-area" id="submitArea">
  <button class="submit-area-btn" id="submitEventBtn">+ Submit an event</button>
</div>
```

- Visible at all times (not conditional on event count).
- Opens the submit modal on click (same behaviour as the old `#submitEventBtn`).
- The ID `submitEventBtn` stays the same so the existing JS wire-up in `index.astro` requires no change.

In `BaseLayout.astro`, add CSS for `.submit-area` and `.submit-area-btn`:

```css
.submit-area {
    padding: 1.5rem 0 2rem;
    text-align: center;
}

.submit-area-btn {
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 999px;
    padding: 0.75rem 2rem;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
    width: 100%;
    max-width: 320px;
}

.submit-area-btn:hover {
    background: var(--ink);
}
```

### 4. JS — no changes needed

The existing `#submitEventBtn` click handler in `index.astro` wires up `openModal('submitModal')` and pre-fills the date. The ID is preserved on the new button, so the JS requires no changes.

---

## Files changed

| File | Change |
|---|---|
| `src/layouts/BaseLayout.astro` | Container `max-width: 660px`; remove controls mobile override, label CSS, redundant skeleton/grid breakpoints; add `.submit-area` CSS |
| `src/components/FilterControls.astro` | Remove label and submit button |
| `src/components/EventsGrid.astro` | Add `.submit-area` block with `#submitEventBtn` |

---

## Out of scope

- Card internals (title-first layout) — already implemented on `dev`, no changes.
- Admin panel, backend, Netlify functions — unaffected.
- Any other visual/style changes beyond what is listed above.
