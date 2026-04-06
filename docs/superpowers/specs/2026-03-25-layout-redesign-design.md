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

- In `@media (max-width: 480px)`: remove the `.controls-inner { flex-direction: column; align-items: stretch }` and `.submit-btn { margin-left: 0 }` rules. Keep all other rules in that block (`.container`, `.current-date`, `.date-header`, `.date-nav`, `.modal`).
- In `@media (min-width: 481px) and (max-width: 768px)`: remove the entire block. All three rules inside it (`.events-grid`, `.controls-inner`, `.submit-btn`) target elements that are being removed or made obsolete by this change — the block is dead code.
- Remove the global `.controls-label` CSS rule (unused after FilterControls change).
- Remove the global `.submit-btn` CSS rule. Also remove the `.submit-btn { margin-left: 0 }` rule inside `@media (max-width: 480px)` (noted above). The submit button is now `.submit-area-btn` with its own CSS. **Note:** the inline button inside `#emptyState` currently uses `class="submit-btn"` — change its class to `submit-area-btn` in `EventsGrid.astro` so it retains its styling from the new `.submit-area-btn` rule (it will look identical, just not full-width since the inline style remains).
- Remove `max-width: 640px; margin: 0 auto` from `.skeleton-grid`. The loading state is rendered inside `.events-container` in `EventsGrid.astro`, which is itself inside `.container` in `index.astro`, so the container's 660px constraint already applies.

### 3. Submit event button — move below the events grid

In `EventsGrid.astro`, add a `.submit-area` block after the `#eventsGrid` div (and after the empty/loading/error states):

```html
<div class="submit-area" id="submitArea">
  <button class="submit-area-btn" id="submitEventBtn">+ Submit an event</button>
</div>
```

- Visible at all times (not conditional on event count). Intentional: when the empty state is showing, two submit CTAs will be visible simultaneously — the contextual "Submit Event" button inside `#emptyState` and this persistent one. This is deliberate; the empty-state button is inline with the "no events" message, while this one is the persistent page-level CTA.
- Opens the submit modal on click (same behaviour as the old `#submitEventBtn`).
- The ID `submitEventBtn` stays the same so the existing `document.getElementById('submitEventBtn')` in `index.astro` requires no change. There is no ID conflict: the inline button inside `#emptyState` has **no ID** (it uses only an `onclick` attribute), so `getElementById` will find only this new button.
- No new focus style needed: `.submit-area-btn` inherits the browser default `:focus-visible` ring, consistent with all other buttons on the page.

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

The existing `#submitEventBtn` click handler in `index.astro` wires up `openModal('submitModal')` and pre-fills the date. The new button in `EventsGrid.astro` is server-rendered and present in the DOM before any client JS runs, so `getElementById('submitEventBtn')` will find it correctly on page load. No re-wiring required.

---

## Files changed

| File | Change |
|---|---|
| `src/layouts/BaseLayout.astro` | Container `max-width: 660px`; remove controls mobile override, label CSS, redundant skeleton/grid breakpoints; add `.submit-area` CSS |
| `src/components/FilterControls.astro` | Remove label and submit button |
| `src/components/EventsGrid.astro` | Add `.submit-area` block with `#submitEventBtn`; change empty-state button class to `submit-area-btn` |

---

## Out of scope

- Card internals (title-first layout) — already implemented on `dev`, no changes.
- Admin panel, backend, Netlify functions — unaffected.
- Any other visual/style changes beyond what is listed above.
