# Event Card Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 2-column sidebar layout on event cards with a single-column, title-first layout where time appears inline beside the title.

**Architecture:** Three files need to change in concert: `EventCard.astro` (SSG HTML structure), `BaseLayout.astro` (all card CSS), and `index.astro` (client-side `createEventCard()` JS which mirrors the Astro component for dynamic rendering). The Astro component controls pre-rendered HTML; the JS function controls cards rendered after client-side fetch. Both must produce identical markup so CSS applies uniformly.

**Tech Stack:** Astro SSG, vanilla JS (no framework), CSS custom properties already defined in `BaseLayout.astro`

---

## File Map

| File | Change |
|---|---|
| `src/components/EventCard.astro` | Rewrite HTML: remove sidebar div, add `.ev-top` row with inline time |
| `src/layouts/BaseLayout.astro` | Replace sidebar CSS, update grid to single column, add `.ev-top`/`.ev-time`/`.ev-allday` styles, update `.event-title` size |
| `src/pages/index.astro` | Rewrite `createEventCard()` (lines ~276–426) to match new Astro HTML structure |

---

## Task 1: Rewrite `EventCard.astro` HTML structure

**Files:**
- Modify: `src/components/EventCard.astro`

This is the SSG component — rendered at build time. The new structure removes the sidebar `div` entirely and adds an `.ev-top` row containing the title and inline time.

- [ ] **Step 1: Replace the HTML in `EventCard.astro`**

Replace the entire HTML section (line 76 onwards, below `---`) with:

```astro
<div class="event-card" data-event-id={event.id}>
  <div class="ev-top">
    <h3 class="event-title">{event.title}</h3>
    {isAllDay && <span class="ev-allday">ALL DAY</span>}
    {isMultiDay && !isAllDay && (
      <span class="ev-allday">{formatDateShort(event.date)} – {formatDateShort(event.end_date!)}</span>
    )}
    {sidebarTime && !isMultiDay && (
      <span class="ev-time">{sidebarTime.time} {sidebarTime.ampm}</span>
    )}
    {!isAllDay && !isMultiDay && !hasTime && <span class="ev-allday">TBC</span>}
  </div>
  <a class="event-location" href={mapsUrl} target="_blank" rel="noopener noreferrer">📍 {event.location}</a>
  {(() => {
    const desc = event.description ?? '';
    const isLong = desc.length > 220;
    return (
      <>
        <p
          class="event-description"
          data-truncatable={isLong ? 'true' : undefined}
          style={isLong ? 'margin-bottom: 0;' : undefined}
        >
          {desc}
        </p>
        {isLong && (
          <button class="desc-toggle-btn" aria-expanded="false" type="button">
            Read more ↓
          </button>
        )}
      </>
    );
  })()}
  {parsedUrl && (
    <a class="event-url" href={parsedUrl.href} target="_blank" rel="noopener noreferrer">
      {parsedUrl.hostname.replace(/^www\./, '')} ↗
    </a>
  )}
  <div class="card-footer">
    <div class="event-tags">
      {event.is_free && <span class="tag free">Free</span>}
      {event.is_for_kids && <span class="tag kids">For kids</span>}
      {event.is_music && <span class="tag music">Music</span>}
      {event.is_sport && <span class="tag sport">Sport</span>}
      {event.is_market && <span class="tag market">Markets</span>}
      {event.is_theatre && <span class="tag theatre">Theatre</span>}
    </div>
    <button class="share-btn" aria-label={`Share ${event.title}`} data-share-title={event.title} data-share-date={event.date} data-share-time={event.time || ''} data-share-time-end={event.time_end || ''} data-share-location={event.location} data-share-allday={event.is_all_day ? 'true' : 'false'}>Share ↗</button>
  </div>
</div>
```

Key structural changes vs. the old layout:
- **No `event-card-inner` wrapper** — children go directly inside `.event-card`
- **No `event-card-sidebar`** — time is now inline in `.ev-top`
- **No `event-card-body` wrapper** — location/description/tags are direct children of `.event-card`
- **`card-footer` is a direct child of `.event-card`**, not nested inside a body div

Also remove the now-unused frontmatter variables (lines ~70–74). The `isAllDay`, `isMultiDay`, `hasTime`, `sidebarTime` variables stay — they're still used in the new `.ev-top`.

- [ ] **Step 2: Verify Astro builds without errors**

```bash
npm run build 2>&1 | tail -20
```

Expected: build completes, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/EventCard.astro
git commit -m "refactor: rewrite EventCard.astro to single-column title-first layout"
```

---

## Task 2: Update CSS in `BaseLayout.astro`

**Files:**
- Modify: `src/layouts/BaseLayout.astro:264–478` (grid + event card CSS block)

Two groups of changes:
1. Grid → single column (max-width 640px centred)
2. Remove sidebar CSS, add `.ev-top`/`.ev-time`/`.ev-allday`, bump `.event-title` to 17px

- [ ] **Step 1: Update `.events-grid` to single column (centred)**

Find (line ~269):
```css
        .events-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
            gap: 16px;
        }
```

Replace with:
```css
        .events-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
            max-width: 640px;
            margin: 0 auto;
        }
```

- [ ] **Step 2: Remove sidebar CSS and rewrite card inner styles**

Remove the following blocks entirely (lines ~290–343):
- `.event-card-inner { ... }`
- `.event-card-sidebar { ... }`
- `.sidebar-time { ... }`
- `.sidebar-ampm { ... }`
- `.sidebar-allday { ... }`
- `.sidebar-multi { ... }`
- `.event-card-body { ... }`
- `.event-time-inline { ... }` (and any continuation of it)

Replace them with the new layout classes. Also **merge `padding: 16px 20px` into the existing `.event-card` rule** (the one that already has `background`, `border`, `border-radius`, etc.) rather than adding a second `.event-card` block:

```css
        /* ── Card layout ── */
        /* (add padding to existing .event-card rule, do not duplicate it) */

        .ev-top {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 12px;
            margin-bottom: 4px;
        }

        .ev-time {
            font-family: 'DM Mono', monospace;
            color: var(--accent);
            font-size: 0.8125rem;
            font-weight: 600;
            white-space: nowrap;
            flex-shrink: 0;
        }

        .ev-allday {
            font-family: 'DM Mono', monospace;
            color: var(--accent);
            font-size: 0.6875rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            white-space: nowrap;
            flex-shrink: 0;
        }
```

- [ ] **Step 3: Update `.event-title` font size**

Find:
```css
        .event-title {
            font-size: 0.9375rem;
```

Replace `0.9375rem` with `1.0625rem` (17px).

- [ ] **Step 4: Remove `overflow: hidden` from `.event-card`** (the sidebar used it; no longer needed)

Find in `.event-card`:
```css
            overflow: hidden;
```

Delete that line.

- [ ] **Step 5: Remove responsive sidebar rules and dead grid override**

Find in the `@media (max-width: 480px)` block (line ~1034):
```css
            .events-grid { grid-template-columns: 1fr; }
            .event-card-sidebar { width: 48px; }
            .sidebar-time { font-size: 0.875rem; }
```

Delete all three lines. The `.events-grid` override is now redundant (the base rule already sets `1fr`); the sidebar lines reference removed elements.

- [ ] **Step 6: Build and visually verify**

```bash
netlify dev
```

Open `http://localhost:8888` and confirm:
- Cards are single-column, max-width ~640px
- Title is visibly larger and on the left
- Time appears right-aligned beside the title in green monospace
- All-day events show "ALL DAY" inline
- Tags and Share button still appear in the footer row

- [ ] **Step 7: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "style: replace sidebar card CSS with single-column title-first layout"
```

---

## Task 3: Rewrite `createEventCard()` in `index.astro`

**Files:**
- Modify: `src/pages/index.astro:276–426` (the `createEventCard` function)

The client-side JS function must produce the same DOM structure as `EventCard.astro` so CSS applies identically to dynamically fetched cards.

- [ ] **Step 1: Replace the `createEventCard` function body**

Find the function starting at line ~276:
```js
    function createEventCard(event) {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.dataset.eventId = event.id;

        const inner = document.createElement('div');
        inner.className = 'event-card-inner';
        // ... (sidebar block through inner.appendChild(body) on line ~423)
        card.appendChild(inner);

        return card;
    }
```

Replace the entire function with:

```js
    function createEventCard(event) {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.dataset.eventId = event.id;

        // Top row: title + inline time
        const top = document.createElement('div');
        top.className = 'ev-top';

        const title = document.createElement('h3');
        title.className = 'event-title';
        title.textContent = event.title;
        top.appendChild(title);

        const isMultiDay = event.endDate && event.endDate !== event.date;
        const hasTime = event.time && !event.isAllDay;

        if (event.isAllDay) {
            const t = document.createElement('span');
            t.className = 'ev-allday';
            t.textContent = 'ALL DAY';
            top.appendChild(t);
        } else if (isMultiDay && !event.isAllDay) {
            const t = document.createElement('span');
            t.className = 'ev-allday';
            t.textContent = formatDateShort(event.date) + ' – ' + formatDateShort(event.endDate);
            top.appendChild(t);
        } else if (hasTime) {
            const st = formatTimeShort(event.time);
            const t = document.createElement('span');
            t.className = 'ev-time';
            t.textContent = st.time + ' ' + st.ampm;
            top.appendChild(t);
        } else {
            const t = document.createElement('span');
            t.className = 'ev-allday';
            t.textContent = 'TBC';
            top.appendChild(t);
        }
        card.appendChild(top);

        const loc = document.createElement('a');
        loc.className = 'event-location';
        loc.href = `https://maps.google.com/?q=${encodeURIComponent(event.location + ', Naas, Ireland')}`;
        loc.target = '_blank';
        loc.rel = 'noopener noreferrer';
        loc.textContent = '📍 ' + event.location;
        card.appendChild(loc);

        const descText = event.description || '';
        const isLong = descText.length > DESC_THRESHOLD;
        const desc = document.createElement('p');
        desc.className = 'event-description';
        desc.textContent = descText;
        if (isLong) {
            desc.dataset.truncatable = 'true';
            desc.style.marginBottom = '0';
        }
        card.appendChild(desc);
        if (isLong) {
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'desc-toggle-btn';
            toggleBtn.type = 'button';
            toggleBtn.textContent = 'Read more ↓';
            toggleBtn.setAttribute('aria-expanded', 'false');
            card.appendChild(toggleBtn);
        }

        if (event.url) {
            try {
                const parsed = new URL(event.url);
                if (['http:', 'https:'].includes(parsed.protocol)) {
                    const urlEl = document.createElement('a');
                    urlEl.className = 'event-url';
                    urlEl.href = parsed.href;
                    urlEl.target = '_blank';
                    urlEl.rel = 'noopener noreferrer';
                    urlEl.textContent = parsed.hostname.replace(/^www\./, '') + ' ↗';
                    card.appendChild(urlEl);
                }
            } catch {
                // Invalid URL — skip
            }
        }

        const footer = document.createElement('div');
        footer.className = 'card-footer';

        const tags = document.createElement('div');
        tags.className = 'event-tags';
        const tagDefs = [
            [event.isFree,     'free',    'Free'],
            [event.isForKids,  'kids',    'For kids'],
            [event.isMusic,    'music',   'Music'],
            [event.isSport,    'sport',   'Sport'],
            [event.isMarket,   'market',  'Markets'],
            [event.isTheatre,  'theatre', 'Theatre'],
        ];
        tagDefs.forEach(([flag, cls, label]) => {
            if (flag) {
                const tag = document.createElement('span');
                tag.className = 'tag ' + cls;
                tag.textContent = label;
                tags.appendChild(tag);
            }
        });
        footer.appendChild(tags);

        const shareBtn = document.createElement('button');
        shareBtn.className = 'share-btn';
        shareBtn.textContent = 'Share ↗';
        shareBtn.setAttribute('aria-label', `Share ${event.title}`);
        // Mirror the data-share-* attributes from the Astro component for DOM parity
        shareBtn.dataset.shareTitle = event.title;
        shareBtn.dataset.shareDate = event.date;
        shareBtn.dataset.shareTime = event.time || '';
        shareBtn.dataset.shareTimeEnd = event.timeEnd || '';
        shareBtn.dataset.shareLocation = event.location;
        shareBtn.dataset.shareAllday = event.isAllDay ? 'true' : 'false';
        shareBtn.addEventListener('click', () => shareEvent(event));
        footer.appendChild(shareBtn);

        card.appendChild(footer);
        return card;
    }
```

- [ ] **Step 2: Build and smoke-test dynamic rendering**

```bash
npm run build 2>&1 | tail -5
netlify dev
```

Open `http://localhost:8888`:
- Navigate to a date with events — pre-rendered cards should match the new layout
- Reload and wait for client-side fetch to complete — dynamically rendered cards should look identical to the pre-rendered ones
- Check an event with a long description collapses to 2 lines with "Read more ↓"
- Check an all-day event shows "ALL DAY" inline

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "refactor: rewrite createEventCard() JS to match new single-column layout"
```

---

## Done

All three files updated. The sidebar is gone. Title-first single-column cards with inline time are live. Run `netlify dev` and hand off to user for final review.
