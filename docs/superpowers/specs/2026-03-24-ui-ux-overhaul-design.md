# UI/UX Overhaul — Naas Today

**Date:** 2026-03-24
**Scope:** Public site only (index page, all components, modals, forms). Admin page excluded.

## Context

Naas Today is a community events web app for Naas, Co. Kildare. The current UI is functional but dated — inconsistent styling (square inputs vs rounded cards), hardcoded category colors, a single responsive breakpoint, dense information layout on mobile, and plain loading states. This overhaul applies a cohesive warm/organic visual direction while improving mobile usability, event discovery, and form experience. The page structure stays the same to preserve familiarity for existing users.

## Design Direction

**Warm & Organic** — soft greens, warm neutrals, earthy tones that suit a rural Irish town. Approachable, calm, and natural. Serif headings for character.

**Layout:** Refined current structure (header → date nav → filters → event grid → what's next → footer).

**Card style:** Time sidebar — green time block on the left, content on the right.

---

## 1. Design System

### 1.1 Color Tokens

All colors defined as CSS custom properties in `:root`.

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#FAFBF6` | Page background |
| `--bg-card` | `#FFFFFF` | Card backgrounds |
| `--bg-muted` | `#F5F0E8` | Muted backgrounds (time badges, input fills) |
| `--ink` | `#1a3a1a` | Primary text (deep forest) |
| `--ink-mid` | `#6B7A6B` | Secondary text |
| `--ink-light` | `#8B8B7A` | Tertiary text |
| `--accent` | `#2d5a2d` | Primary accent (forest green) |
| `--accent-light` | `#E8F0E4` | Accent tint backgrounds |
| `--warm` | `#8B7355` | Time/date decorative elements |
| `--warm-light` | `#F5F0E8` | Warm tint backgrounds |
| `--border` | `#e0e0d8` | Card/input borders |
| `--border-light` | `#f0ece4` | Subtle dividers |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.04)` | Default card shadow |
| `--shadow-md` | `0 4px 16px rgba(0,0,0,0.06)` | Hover/elevated shadow |

**Category colors** (each gets `--cat-<name>` and `--cat-<name>-bg` variables):

| Category | Text color | Background | Variable prefix |
|----------|-----------|------------|-----------------|
| Free | `#2d5a2d` | `#E8F0E4` | `--cat-free` |
| Kids | `#1565C0` | `#E3F2FD` | `--cat-kids` |
| Music | `#6B21A8` | `#F3E8FF` | `--cat-music` |
| Sport | `#0D7C3F` | `#DCFCE7` | `--cat-sport` |
| Markets | `#8B5E00` | `#FFF3E0` | `--cat-markets` |
| Theatre | `#BE185D` | `#FCE7F3` | `--cat-theatre` |

### 1.2 Typography

| Role | Font | Weight | Notes |
|------|------|--------|-------|
| Headings (h1) | Georgia, serif | 700 | System serif — no Google Fonts dependency |
| Body / UI | system-ui, -apple-system, sans-serif | 400, 500, 600 | Native system font stack |
| Time badges | DM Mono | 500 | Keep Google Fonts import for this one face only |

Fluid h1 sizing: `clamp(2rem, 4vw, 3rem)`.

### 1.3 Spacing & Radius

| Element | Border radius |
|---------|--------------|
| Cards | `12px` |
| Inputs / selects | `8px` |
| Pills / tags | `999px` |
| Modals | `16px` |

Container max-width: `1100px`. Side padding: `1.5rem` (adjusts on mobile).

---

## 2. Components

### 2.1 Header

- Centered Georgia serif "Naas Today" heading
- Tagline below in `--ink-mid`
- Subtle bottom border (`--border-light`)
- No logo image — text-only brand

### 2.2 Date Navigation

- Structure: `← Previous | **Monday, 24 March** | Next →`
- "Today" button appears only when not viewing today
- Date text: `--warm`, bold
- Buttons: ghost style (transparent bg), `--accent` text/border on hover
- "Change date" opens DatePickerModal with native `<input type="date">`

### 2.3 Filter Controls

- Horizontal row of pill buttons with per-category colors
- Default: outlined (colored border + text, white bg)
- Active: filled background + white text
- Active filters show event count: `Music (3)`
- "Submit Event" button: `--accent` filled, pill shape, always visible at end of row
- **Mobile:** Horizontal scroll with CSS gradient fade hint on edges (no wrapping)

### 2.4 Event Cards (Time Sidebar)

```
┌──────────┬──────────────────────────────────────────┐
│          │ Live Music at The Venue                   │
│  7:30    │ 📍 Town Centre, Naas                     │
│   PM     │                                          │
│          │ Traditional Irish music session with      │
│ (accent  │ local musicians. All welcome...           │
│  green   │ [Read more ↓]                            │
│  bg)     │                                          │
│          │ [Free] [Music]              [Share ↗]    │
└──────────┴──────────────────────────────────────────┘
```

- **Left sidebar:** `--accent` (forest green) background, white text. Time in DM Mono, large weight. Note: `--warm` is for date/time *text* elements elsewhere (date nav, time labels); the card sidebar uses `--accent` for stronger visual anchoring.
  - All-day events: show "ALL DAY" vertically
  - Multi-day events: show compact date range
- **Content area:**
  - Title: 15px, font-weight 600, `--ink`
  - Location: 12px, `--ink-mid`, 📍 emoji + Google Maps link
  - Description: 12px, `--ink-light`, truncated to 3 lines with CSS `-webkit-line-clamp`
  - "Read more ↓" / "Show less ↑": smooth height transition (CSS `max-height` + `overflow`)
  - Tags: colored pills at bottom showing all applicable categories (Free, Kids, Music, Sport, Markets, Theatre)
  - Share: subtle text button, right-aligned in tag row
- **Card container:** `1px solid --border`, `border-radius: 12px`, `--shadow-sm`
- **Hover:** `--shadow-md`, `transform: translateY(-1px)`, 0.15s transition

### 2.5 Events Grid

- `grid-template-columns: repeat(auto-fill, minmax(420px, 1fr))`
- Gap: `16px`
- Staggered fade-in animation: 40ms delay per card (keep existing `cardFadeIn`)

### 2.6 What's Next Section

- Section heading: "Coming Up" in Georgia serif
- Card-based rows (not dense list):
  - Each row: date pill (e.g., "Tue 25") + event title + location
  - Clickable — navigates to that date
  - Subtle hover background
- Limited to 5 upcoming events
- Data source: renders from the same `window.__INITIAL_EVENTS__` data already fetched at build time — no new API calls
- Separated from main grid by `--border-light` divider

### 2.7 Modals

- `border-radius: 16px`, `max-width: 540px`
- Backdrop: `rgba(26, 58, 26, 0.4)` (warm forest tint)
- Header: modal title in Georgia serif, `×` close button top-right
- Close button hover: `--accent` color
- Open/close: CSS fade + scale transition (0.2s)
- **Mobile:** Full-screen, slide up from bottom (`transform: translateY`)

### 2.8 Submit Event Form (inside SubmitEventModal)

Three visual sections within the scrollable modal (not multi-step wizard — one continuous form with clear section breaks):

1. **What:** Title (required), Description (textarea, max 2000 chars with live counter), URL (optional)
2. **When:** Start date (required), time mode radio (Specific / Range / All-day), end date (optional), recurring checkbox → frequency dropdown + end date
3. **Where & Tags:** Location (with autocomplete datalist), category checkboxes (Free, Kids, Music, Sport, Markets, Theatre)

- All inputs: `border-radius: 8px`, `1px solid --border`, `padding: 10px 12px`
- Focus state: `--accent` border + `0 0 0 3px var(--accent-light)` box-shadow
- Validation: inline error messages below fields (red text, not browser defaults)
- Submit button: full-width `--accent` filled, bottom of form

### 2.9 Footer

- Centered layout
- Links: About · Contact · Submit Event (dot-separated)
- Font size: 13px (up from current tiny size)
- `--ink-mid` color, `--accent` on hover
- Copyright: `© 2026 Naas Today`
- Top border: `--border-light`

### 2.10 Loading & Empty States

- **Loading:** Skeleton cards — pulsing placeholder shapes matching card layout (time block + text lines). CSS `@keyframes` pulse animation.
- **Empty:** Centered message "No events today" with warm-toned calendar icon (CSS/SVG, not an image file), subtext "Check another day or submit an event!", link to submit modal.
- **Error:** Warm-toned error box with "Something went wrong" message and "Try again" button styled with `--accent`.

---

## 3. Responsive Design

### Breakpoints

| Breakpoint | Target | Layout |
|------------|--------|--------|
| `≤480px` | Small phones | Single column, compact cards |
| `481–768px` | Large phones / small tablets | Single column, larger cards |
| `769–1024px` | Tablets | 2-column grid |
| `≥1025px` | Desktop | 2-column grid, 1100px max-width |

### Mobile-specific (≤768px)

- **Filters:** Horizontal scroll, no wrap. CSS gradient fade on right edge.
- **Cards:** Full-width. Time sidebar: 48px wide (vs 56px desktop).
- **Date nav:** Larger touch targets (min 44×44px). Prev/Next buttons more prominent.
- **Modals:** Full-screen, slide-up-from-bottom animation. Close button enlarged.
- **What's Next:** Simple stacked list with chevron indicators.
- **Submit button:** Sticky bottom bar on mobile when scrolled past the filter row.
- **Touch targets:** All interactive elements minimum 44×44px (WCAG 2.5.8).

### Accessibility

- Preserve existing ARIA labels, roles, and focus management
- All color combos meet WCAG AA contrast ratios (4.5:1 for text, 3:1 for UI)
- Respect `prefers-reduced-motion`: disable card animations, transitions become instant
- Tab trapping in modals stays as-is
- Semantic HTML structure maintained

---

## 4. Technical Approach

### Files to modify

| File | Changes |
|------|---------|
| `src/layouts/BaseLayout.astro` | Replace all CSS variables and global styles (~1100 lines). Remove Playfair Display and Instrument Sans Google Font imports. |
| `src/components/Header.astro` | Update markup for new header design |
| `src/components/DateNav.astro` | Update button styling classes |
| `src/components/FilterControls.astro` | Add horizontal scroll wrapper, update filter button markup |
| `src/components/EventCard.astro` | New time-sidebar layout, add category tag pills |
| `src/components/EventsGrid.astro` | Update grid sizing, add skeleton loading states |
| `src/components/Footer.astro` | Update layout and sizing |
| `src/components/modals/DatePickerModal.astro` | Update modal styling |
| `src/components/modals/SubmitEventModal.astro` | Add form sections, validation UI, character counter |
| `src/components/modals/AboutModal.astro` | Update modal styling |
| `src/components/modals/ContactModal.astro` | Update modal styling |
| `src/pages/index.astro` | Update client-side JS: `createEventCard()` for new card HTML, skeleton loading, category tags rendering, smooth description toggle, mobile submit button |

### What stays the same

- Astro SSG architecture — no framework changes
- Vanilla JS for client-side interactivity — no library additions
- Supabase data model and API calls — unchanged
- Netlify Functions — unchanged
- Build/deploy pipeline — unchanged
- JSON-LD structured data generation — unchanged

### CSS organization

All CSS remains in `BaseLayout.astro` `<style is:global>` (matching current pattern), but reorganized with clear section comments:
1. CSS Variables (`:root`)
2. Reset & Base
3. Layout (container, grid)
4. Header
5. Date Navigation
6. Filter Controls
7. Event Cards
8. What's Next
9. Modals
10. Forms
11. Footer
12. Loading/Empty/Error States
13. Animations
14. Media Queries (mobile-first progression)

---

## 5. Verification

1. Run `netlify dev` and verify at `localhost:8888`
2. Check all pages load with new styling
3. Test filter buttons (toggle, count badges, active states)
4. Test date navigation (prev/next, change date modal)
5. Test event card interactions (read more/less, share, maps link)
6. Test submit event form (all fields, validation, recurring options)
7. Test modals (open/close, focus trap, backdrop click)
8. Test at all breakpoints: 375px, 480px, 768px, 1024px, 1440px
9. Verify skeleton loading appears briefly before events render
10. Test empty state on a date with no events
11. Verify `prefers-reduced-motion` disables animations
12. Run Lighthouse accessibility audit — target 90+ score
13. Verify Google Fonts only loads DM Mono (Playfair + Instrument Sans removed)
