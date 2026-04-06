# Layout Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Narrow the page container to 660px, clean up the mobile filter controls, and move the Submit event button to below the event cards.

**Architecture:** Pure CSS/HTML changes across three files — no JS changes, no backend changes. The container max-width narrows everything (header, date nav, filters, cards) in one move. The submit button migrates from FilterControls to EventsGrid. Dead CSS rules are removed.

**Tech Stack:** Astro (SSG), vanilla CSS in BaseLayout.astro, Netlify Dev for local preview.

**Spec:** `docs/superpowers/specs/2026-03-25-layout-redesign-design.md`

---

### Task 1: Narrow the container and clean up CSS in BaseLayout.astro

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

**Context:** All global CSS lives in `BaseLayout.astro` inside a `<style is:global>` block. The `.container` rule is near line 80. The `.controls-label` and `.submit-btn` rules are in the `/* ── Controls ── */` section (~lines 176–262). The responsive breakpoints are at the bottom of the style block (~lines 981–1027).

- [ ] **Step 1: Narrow the container**

Find this rule (around line 80):
```css
.container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 1.5rem;
}
```
Change `max-width` to `660px`:
```css
.container {
    max-width: 660px;
    margin: 0 auto;
    padding: 0 1.5rem;
}
```

- [ ] **Step 2: Remove `.controls-label` CSS rule**

Find and delete this entire rule block:
```css
.controls-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-light);
}
```

- [ ] **Step 3: Remove the global `.submit-btn` CSS rule**

Find and delete this entire rule block (in the `/* ── Controls ── */` section):
```css
.submit-btn {
    margin-left: auto;
    flex-shrink: 0;
    background: var(--accent);
    border: 1.5px solid var(--accent);
    color: white;
    font-size: 0.8125rem;
    font-weight: 600;
    border-radius: 999px;
    padding: 0.4375rem 1rem;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
}

.submit-btn:hover {
    background: var(--ink);
    border-color: var(--ink);
}
```

- [ ] **Step 4: Remove the skeleton grid's width constraint**

Find in the `.skeleton-grid` rule (in the `/* ── Loading State ── */` section):
```css
.skeleton-grid {
    display: grid;
    grid-template-columns: 1fr;
    max-width: 640px;
    margin: 0 auto;
    gap: 16px;
}
```
Remove `max-width: 640px;` and `margin: 0 auto;`:
```css
.skeleton-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
}
```

- [ ] **Step 5: Clean up mobile breakpoint — remove controls rules from @media (max-width: 480px)**

Find the `@media (max-width: 480px)` block (~line 981). Inside it, remove these two rules:
```css
.controls-inner {
    flex-direction: column;
    align-items: stretch;
}
.submit-btn { margin-left: 0; }
```
Leave all other rules in the block untouched (`.container`, `.current-date`, `.date-header`, `.date-nav`, `.modal-content`, `.modal`).

- [ ] **Step 6: Remove the entire @media (min-width: 481px) and (max-width: 768px) block**

Find and delete this entire block:
```css
@media (min-width: 481px) and (max-width: 768px) {
    .events-grid { grid-template-columns: 1fr; }
    .date-header {
        flex-direction: column;
        align-items: flex-start;
    }
    .date-nav {
        width: 100%;
        justify-content: space-between;
    }
    .controls-inner {
        flex-direction: column;
        align-items: stretch;
    }
    .submit-btn { margin-left: 0; }
}
```

- [ ] **Step 7: Add `.submit-area` and `.submit-area-btn` CSS**

Add this block in the `/* ── Events Grid ── */` section, after the `.events-container` rule:
```css
/* ── Submit Area ── */
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

- [ ] **Step 8: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "style: narrow container to 660px, remove submit-btn CSS, add submit-area CSS"
```

---

### Task 2: Clean up FilterControls.astro

**Files:**
- Modify: `src/components/FilterControls.astro`

**Context:** This component renders the controls section. It currently has three children inside `.controls-inner`: a label span, a filter-scroll div, and a submit button. Remove the label and button; leave the filter-scroll div untouched.

- [ ] **Step 1: Remove the label span**

Find and delete:
```html
<span class="controls-label">Filter:</span>
```

- [ ] **Step 2: Remove the submit button**

Find and delete:
```html
<button class="submit-btn" id="submitEventBtn">Submit event</button>
```

The final component should look like:
```html
---
---
<div class="controls">
    <div class="controls-inner">
        <div class="filter-scroll">
            <div class="filter-group">
                <button class="filter-btn" id="filterFree" data-cat="free" aria-pressed="false">
                    <span>Free</span>
                </button>
                <button class="filter-btn" id="filterKids" data-cat="kids" aria-pressed="false">
                    <span>For kids</span>
                </button>
                <button class="filter-btn" id="filterMusic" data-cat="music" aria-pressed="false">
                    <span>Music</span>
                </button>
                <button class="filter-btn" id="filterSport" data-cat="sport" aria-pressed="false">
                    <span>Sport</span>
                </button>
                <button class="filter-btn" id="filterMarket" data-cat="markets" aria-pressed="false">
                    <span>Markets</span>
                </button>
                <button class="filter-btn" id="filterTheatre" data-cat="theatre" aria-pressed="false">
                    <span>Theatre</span>
                </button>
            </div>
        </div>
    </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/FilterControls.astro
git commit -m "refactor: remove label and submit button from FilterControls"
```

---

### Task 3: Update EventsGrid.astro — add submit area, fix empty-state button class

**Files:**
- Modify: `src/components/EventsGrid.astro`

**Context:** This component renders `.events-container` which contains four children: `#eventsGrid`, `#emptyState`, `#loadingState`, `#errorState`. Add a new `.submit-area` div after all four. Also update the class on two existing buttons — the empty-state submit button and the error-state "Try again" button — from `submit-btn` to `submit-area-btn`, so they retain their styling after the global `.submit-btn` CSS rule is removed.

- [ ] **Step 1: Change the empty-state button class**

Find inside `#emptyState`:
```html
<button class="submit-btn" style="margin-top: 1rem;" onclick="document.getElementById('eventDate').value = localDateStr(currentDate); openModal('submitModal');">Submit Event</button>
```
Change `class="submit-btn"` to `class="submit-area-btn"`:
```html
<button class="submit-area-btn" style="margin-top: 1rem;" onclick="document.getElementById('eventDate').value = localDateStr(currentDate); openModal('submitModal');">Submit Event</button>
```

- [ ] **Step 2: Change the error-state "Try again" button class**

Find inside `#errorState`:
```html
<button class="submit-btn" style="margin-top: 1rem;" onclick="fetchEvents()">Try again</button>
```
Change `class="submit-btn"` to `class="submit-area-btn"`:
```html
<button class="submit-area-btn" style="margin-top: 1rem;" onclick="fetchEvents()">Try again</button>
```

- [ ] **Step 3: Add the submit area after the error state div**

After the closing `</div>` of `#errorState`, and before the closing `</div>` of `.events-container`, add:
```html
    <div class="submit-area">
        <button class="submit-area-btn" id="submitEventBtn">+ Submit an event</button>
    </div>
```

The end of the component should now look like:
```html
    <div class="error-state" id="errorState">
        <h3>Something went wrong</h3>
        <p>We had trouble loading events. Please try again.</p>
        <button class="submit-area-btn" style="margin-top: 1rem;" onclick="fetchEvents()">Try again</button>
    </div>

    <div class="submit-area">
        <button class="submit-area-btn" id="submitEventBtn">+ Submit an event</button>
    </div>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/EventsGrid.astro
git commit -m "feat: move submit event button below event cards"
```

---

### Task 4: Verify and wrap up

**Files:** None (verification only)

- [ ] **Step 1: Build and preview**

```bash
netlify dev
```

Open `http://localhost:8888` and verify:
- On desktop (>660px viewport): page content is centered in a ~660px column with whitespace on both sides. Header, date nav, filter pills, and cards all align to the same column.
- Filter pills are on a single horizontal row. They scroll if they overflow — they do not wrap or stretch.
- "Submit an event" button appears below the event cards, full-width green pill (max 320px), centered.
- On mobile (resize to <480px): layout looks identical to desktop (single column filling the screen). No layout shift or wrapping.
- Click "Submit an event" button — the submit modal opens and the date field is pre-filled with the current date.

- [ ] **Step 2: Check empty and error states**

Change to a date with no events. Verify:
- `#emptyState` shows with its "Submit Event" button still styled correctly (green pill).
- The `.submit-area` button is still visible below the empty state.

To check the error state styling: in browser DevTools, add class `visible` to `#errorState` manually. Verify the "Try again" button still looks like a green pill (not an unstyled browser-default button).

- [ ] **Step 3: Final commit if any fixes were needed, then push**

```bash
git push origin dev
```
