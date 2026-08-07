---
name: Naas Today
description: A parish noticeboard for a Kildare town — warm, flat, border-defined, and legible to everyone.
colors:
  bg: "#FAFBF6"
  bg-card: "#FFFFFF"
  bg-muted: "#F5F0E8"
  ink: "#1a3a1a"
  ink-mid: "#4d5b4d"
  ink-light: "#5c5848"
  accent: "#2d5a2d"
  accent-light: "#E8F0E4"
  warm: "#775F43"
  border: "#e0e0d8"
  border-light: "#f0ece4"
  border-interactive: "#8a8a7e"
  scrim: "rgba(26,58,26,0.45)"
  overlay-shadow: "rgba(0,0,0,0.12)"
  overlay-shadow-soft: "rgba(0,0,0,0.08)"
  cat-free: "#2d5a2d"
  cat-free-bg: "#E8F0E4"
  cat-kids: "#1A5F7A"
  cat-kids-bg: "#E0F0F5"
  cat-music: "#5C3D1E"
  cat-music-bg: "#F0E8DE"
  cat-sport: "#1A4C2E"
  cat-sport-bg: "#DCF0E6"
  cat-markets: "#7A4F1F"
  cat-markets-bg: "#F5EADB"
  cat-theatre: "#7B2D2D"
  cat-theatre-bg: "#F0E0DE"
typography:
  display:
    fontFamily: "Georgia, serif"
    fontSize: "clamp(1.625rem, 3vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  document-title:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  subhead:
    fontFamily: "Georgia, serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  section:
    fontFamily: "Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "normal"
  date:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "clamp(1.625rem, 3.5vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "normal"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  control:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  control-compact:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  meta:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  label:
    fontFamily: "'DM Mono', monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.6
    letterSpacing: "0.06em"
  time:
    fontFamily: "'DM Mono', monospace"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.6
    letterSpacing: "normal"
rounded:
  hairline: "2px"
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "48px"
components:
  event-card:
    backgroundColor: "{colors.bg-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px 20px"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "12px 32px"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "#FFFFFF"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink-mid}"
    rounded: "{rounded.md}"
    padding: "12px"
  button-secondary-hover:
    textColor: "{colors.accent}"
  filter-chip:
    backgroundColor: "{colors.bg-card}"
    textColor: "{colors.ink-mid}"
    rounded: "{rounded.sm}"
    padding: "7px 16px"
  filter-chip-active:
    backgroundColor: "{colors.cat-free}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "7px 16px"
  date-nav-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink-mid}"
    rounded: "{rounded.sm}"
    padding: "6px 14px"
    height: "44px"
  date-nav-button-today:
    backgroundColor: "{colors.accent-light}"
    textColor: "{colors.accent}"
    rounded: "{rounded.sm}"
    padding: "6px 14px"
    height: "44px"
  modal-scrim:
    backgroundColor: "{colors.scrim}"
  time-pill:
    backgroundColor: "{colors.bg-muted}"
    textColor: "{colors.warm}"
    typography: "{typography.time}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
    height: "28px"
  tag:
    backgroundColor: "{colors.cat-free-bg}"
    textColor: "{colors.cat-free}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  input:
    backgroundColor: "{colors.bg-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  modal:
    backgroundColor: "{colors.bg-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    width: "540px"
---

# Design System: Naas Today

## Overview

**Creative North Star: "The Parish Noticeboard"**

This is the civic board everyone in town reads, given a tasteful upgrade. Each event is a pinned notice: a bordered rectangle of equal weight to every other, carrying its own information and asking for nothing. No notice is promoted, enlarged, or given a photograph to make it shout over its neighbours. The board's job is to hold them all legibly, and the design's job is to disappear into that.

The mood is **calm, warm, dependable** — unhurried and trustworthy, a page that isn't competing for attention and doesn't need to. Warmth comes from the substrate, not from decoration: an off-white with a green cast (#FAFBF6) rather than clinical white, linen (#F5F0E8) behind the small monospaced details, and a deep forest green that reads as hedgerow rather than corporate. Everything sits on a single 660px column that behaves like a reading measure, not an app viewport. There is no dark mode, no hero, no imagery, and no illustration; the visitor came for an answer and the page gives it in one glance.

The system's discipline is **restraint enforced by borders**. Surfaces are separated by a 1px hairline (#e0e0d8), not by shadow, colour-blocking, or spacing tricks. The accent green appears on roughly one element per screen. The six category colours have been deliberately weathered into a single earthy family so that no category out-shouts another. The result is a page that looks maintained rather than designed — which, for a community resource run by one person, is exactly the right impression.

**Key Characteristics:**
- Single 660px column, always one card wide, at every breakpoint
- Hairline borders define every surface; shadows are near-subliminal
- Georgia mastheads over a system sans body; DM Mono reserved strictly for times and tags
- Six category colours muted into one aged, sun-faded family
- 44px minimum touch targets throughout, for an audience that skews older
- Light mode only, warm naturals, no imagery whatsoever

## Colors

A warm, low-saturation palette built on off-white paper and hedgerow green, with every non-neutral hue pulled toward earth.

### Primary
- **Hedgerow Green** (`{colors.accent}`): The single brand voice. Primary buttons, the active "Today" chip, link text, focus rings, every filled state, and the favicon. It is also `cat-free`, which is deliberate — free events are the brand's own category.
- **Meadow Tint** (`{colors.accent-light}`): The only accent fill used behind text. Backs the active Today button and forms the 3px input focus halo. Never used as a page or card background.

### Secondary
- **Weathered Leather** (`{colors.warm}`): The single warm counterpoint to all that green. Reserved exclusively for time — the time pill, the ALL DAY / TBC badge, and multi-day date ranges. It exists so that *when* an event happens reads as a different kind of fact from *what* it is. Deepened from an earlier `#8B7355` to clear the contrast floor on linen; see Named Rules.

### Tertiary — the category family
Six flags, all pulled to the same weathered register. Each is a text colour paired with a tinted background of the same hue.

- **Hedgerow Green** (`{colors.cat-free}` on `{colors.cat-free-bg}`): Free.
- **Canal Slate** (`{colors.cat-kids}` on `{colors.cat-kids-bg}`): For kids. A teal-navy, not a children's primary blue.
- **Fiddle Wood** (`{colors.cat-music}` on `{colors.cat-music-bg}`): Music. Warm brown, the colour of an instrument body.
- **Pitch Green** (`{colors.cat-sport}` on `{colors.cat-sport-bg}`): Sport. Deeper and cooler than the brand green so the two don't collide.
- **Sacking Ochre** (`{colors.cat-markets}` on `{colors.cat-markets-bg}`): Markets. Hessian and stall canvas.
- **Curtain Brick** (`{colors.cat-theatre}` on `{colors.cat-theatre-bg}`): Theatre. Faded red velvet.

### Neutral
- **Green-Cast Paper** (`{colors.bg}`): The page. Warmed off-white with a faint green tint — never `#FFFFFF`.
- **Notice White** (`{colors.bg-card}`): Cards, modals, inputs, the header bar. The only true white, and it earns its brightness by contrast with the page.
- **Linen** (`{colors.bg-muted}`): Small warm fills — the time pill, badge backgrounds, modal headers, and the hover state on upcoming-list rows.
- **Deep Forest Ink** (`{colors.ink}`): All primary text and headings. A near-black carrying the same green as the brand, so nothing on the page is neutral grey.
- **Sage Ink** (`{colors.ink-mid}`): Secondary text — locations, footer, button labels at rest, form hints.
- **Bark Ink** (`{colors.ink-light}`): Tertiary text — event descriptions, character counters, empty-state copy. Warm rather than cool, which is why descriptions feel like prose and not metadata.
- **Hairline** (`{colors.border}`): The structural line. Cards, the time pill, skeletons, modal edges — every surface that is only a surface.
- **Whisper Rule** (`{colors.border-light}`): Section dividers and the header underline, where a full hairline would be too assertive.
- **Pressable Line** (`{colors.border-interactive}`): The same warm grey walked down until it clears 3:1. Every edge that *is* a control — filter chips, date-nav buttons, share, the empty state's clear button, form fields, secondary buttons. See the Pressable Line Rule.

### Named Rules

**The One Green Rule.** Hedgerow green is the only fully saturated voice on the page and appears as a *fill* at most once per viewport — the submit button, or the active Today chip, not both competing. Everywhere else it is a text or border colour. Its rarity is what makes the submit action findable without a single arrow or animation.

**The Aged Family Rule.** All six category colours must read as the same weathered, sun-faded palette. No category may be brighter, more saturated, or louder than its siblings — a Markets tag and a Theatre tag have equal visual weight, always. Harmony outranks distinguishability here: these are labels on a noticeboard, not a wayfinding system. When adding a category, desaturate it until it sits inside the family, then check it still clears 4.5:1 on its own tint.

**The Warm Text Rule.** Text never uses a neutral grey. Every ink carries either the page's green or the palette's brown. `#666` and its relatives are banned outright; they are the single fastest way to make this page look like a template.

**The Contrast Floor Rule.** Every text colour clears WCAG AA (4.5:1) against every background it is placed on. The audience skews older and this is a product constraint, not a preference. The palette currently has **no violations**: the tightest pair is Weathered Leather on Linen (the time pill, 13px) at **5.29:1**, and every other text pair sits between 5.96:1 and 12.6:1. Weathered Leather was deepened from `#8B7355` (3.95:1, failing) to reach this floor. When adding or adjusting any text colour, measure it against every surface it can land on — for this palette that means white, the page, and linen.

**The Pressable Line Rule.** A border that is a control's *only* definition owes 3:1 (WCAG 1.4.11), the same as any other non-text affordance. This system is flat and nearly fill-free, so that describes most of its controls — which is exactly why Hairline at 1.33:1 was not enough on its own. Hence two border colours, chosen on one question: **does this line separate something, or can you press it?** Separators keep Hairline; controls take Pressable Line (`{colors.border-interactive}`, **3.36:1** on the page, **3.49:1** on card white, **3.08:1** on linen). Note this is a *colour* axis and cuts across the *weight* axis in Shape — a form input is 1px like a card but takes the pressable colour, because it is a control. A zero-count filter chip takes it too: it recedes by dropping to the page fill, and a dimmed boundary on a live control was buying the recede with the thing the rule protects.

## Typography

**Display Font:** Georgia (with `serif` fallback)
**Body Font:** System UI stack (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `Helvetica Neue`, Arial, sans-serif)
**Label/Mono Font:** DM Mono (with `monospace` fallback) — the only webfont, loaded deferred

**Character:** Georgia supplies the small-town-newspaper authority that a community resource needs to be believed; the system sans keeps the body text native and instantly familiar on whatever device it lands on. DM Mono does one job — it makes times read as data rather than prose, so the eye can find "8:00 PM" without reading the sentence around it. The pairing is deliberately unfashionable: three faces most people already have opinions about, used correctly.

### Hierarchy
- **Display** (`{typography.display}`): The masthead only. One per page. Tight negative tracking keeps "Naas Today" feeling set rather than typed.
- **Document Title** (`{typography.document-title}`): The `<h1>` on a standalone document page such as Terms, underscored by a hairline rule. The only place an `<h1>` appears that isn't the masthead, and the only place the serif stack carries a `'Times New Roman'` fallback.
- **Headline** (`{typography.headline}`): Georgia at its largest below the masthead — empty-state and error-state headings, where the page has nothing else to say.
- **Subhead** (`{typography.subhead}`): Modal titles. Serif marks the overlay as a distinct place.
- **Section** (`{typography.section}`): The smallest serif step — the "What's next" heading. Serif always marks a change of section; the body never uses it.
- **Date** (`{typography.date}`): The current-date display. Sans, not serif, because it changes constantly and must feel like state rather than a heading. Drops to 1.125rem below 480px.
- **Title** (`{typography.title}`): Event titles. Sans and semibold, sized only 1.28× the body — a notice, not a headline. This restraint is what lets twelve cards scan as equals.
- **Body** (`{typography.body}`): Event descriptions and interface prose. The 660px column keeps the measure near 70 characters without needing a `max-width` on the paragraph.
- **Control** (`{typography.control}`): Form fields and the labels on primary and secondary buttons. Deliberately the largest interactive text in the system — a form is where a less confident user is most likely to falter.
- **Control Compact** (`{typography.control-compact}`): The chrome that surrounds content rather than acting on it — filter chips, date-nav buttons, footer links, and upcoming-list dates. One step below Control, which is what keeps a row of six filter chips from competing with the events beneath them.
- **Meta** (`{typography.meta}`): The smallest sans step, for card apparatus rather than card content — location, source link, Share, the read-more toggle, character counters, and the upcoming-list detail. It marks text as supporting, which is what lets the description hold the body size without the card feeling crowded.
- **Label** (`{typography.label}`): Category tags. Uppercase, tracked, monospaced — reads as a rubber stamp on a notice.
- **Time** (`{typography.time}`): The time pill. Semibold mono, the highest-priority scannable fact on a card after the title.

### Named Rules

**The Serif-Is-Structure Rule.** Georgia marks a boundary — the masthead, a section heading, a modal title. It never appears inside a card. If serif starts showing up in event content, the hierarchy has collapsed.

**The Mono-Means-Time Rule.** DM Mono is reserved for times, dates, and the tag stamps. It is never used for body copy, buttons, or emphasis. One webfont, one job — which is also why it can be lazy-loaded without a flash that matters.

**The Modest Title Rule.** An event title is never more than ~1.3× body size. On a noticeboard every notice is the same size; the day's most interesting event earns attention from its own words, not from typography.

## Layout

A **single 660px column**, centred, with 1.5rem side padding tightening to 1rem below 480px. The events grid is `grid-template-columns: 1fr` and stays that way at every width — there is no multi-column breakpoint, and adding one would break the noticeboard reading. 660px is a reading measure, not a container width, and the page should not be widened to fill a desktop viewport.

The vertical rhythm is a coarse rem scale (0.25 / 0.5 / 0.75 / 1 / 1.5 / 2 / 3rem) with cards separated by exactly 12px — tight enough that a dozen events read as one list rather than a series of panels. Card padding is asymmetric (`16px 20px`), giving slightly more horizontal breathing room than vertical, which keeps titles off the border without lengthening the scroll.

Page order is fixed and load-bearing: masthead → date section → category filters → event list → submit prompt → "What's next" → footer. The submit call-to-action lives **after** the day's events, never before them, because the visitor's job comes first.

**Sticky header.** The masthead sticks at `top: 0` (`z-index: 100`) and gains a shadow only once the page has scrolled past 4px. It is the one element allowed to acknowledge scroll position.

**Breakpoints.** Only two, both narrow: `520px` reflows the "What's next" rows from a four-column grid into a two-by-two block, and `480px` tightens the container, shrinks the date display, spreads the date nav to full width, and converts modals into bottom sheets. There is no tablet or desktop breakpoint — the design is the same object at 375px and 1920px.

### Named Rules

**The One Column Rule.** Never introduce a multi-column event grid at any breakpoint. The single column is the noticeboard; a grid is an aggregator, which is the anti-reference.

## Elevation & Depth

**Borders do the work.** This system is essentially flat. Every surface is defined by a 1px hairline, and the resting shadow (`0 1px 3px rgba(26,42,26,0.05)`) exists only to lift paper off the table — it should be invisible if you look for it directly. Shadow is never used to signal importance, hierarchy, or priority. A card that matters more does not get a bigger shadow; it does not get a bigger anything.

Depth appears in exactly two circumstances: brief response to pointer interaction, and genuine overlay above the page. Everything else stays on the table.

Critically, **shadows are tinted with the page's own ink** (`rgba(26,42,26,…)`), never pure black. A black shadow on a warm background reads as grey and instantly cheapens the palette. The modal overlay is the one deliberate exception (`{colors.overlay-shadow}` / `{colors.overlay-shadow-soft}`): it falls on the scrim rather than on the page, so there is no warm surface for it to dull. The modal backdrop itself is scrim green (`{colors.scrim}`), not black — the page tints its own dimming.

### Shadow Vocabulary
- **Resting** (`box-shadow: 0 1px 3px rgba(26,42,26,0.05)`): Cards at rest. Barely present by design.
- **Hover** (`box-shadow: 0 4px 16px rgba(26,42,26,0.08)`): Card hover, paired with `translateY(-2px)`. The lift is the feedback; the shadow just makes it physical.
- **Header scrolled** (`box-shadow: 0 2px 8px rgba(26,42,26,0.08)`): The sticky masthead once scrolled, so it reads as a layer above the list.
- **Overlay** (`box-shadow: 0 20px 60px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08)`): Modals only. The single place where real, two-layer depth is warranted, because a modal genuinely floats above everything.

### Named Rules

**The Flat-At-Rest Rule.** Any shadow beyond the resting hairline means the user is doing something — hovering, focusing, or looking at an overlay. Static emphasis must be achieved with type, border, or the accent colour, never with elevation.

## Shapes

Corners are **gently curved, never soft**, and the radius encodes scale: the bigger the surface, the rounder the corner. Small controls take 6px (`{rounded.sm}` — filter chips, date-nav buttons, share buttons, upcoming rows), interactive blocks take 8px (`{rounded.md}` — buttons, inputs, modal close), cards take 12px (`{rounded.lg}`), and modals take 16px (`{rounded.xl}`). Below the ladder sit two non-interactive steps: 4px (`{rounded.xs}`) for skeleton shimmer bars and 2px (`{rounded.hairline}`) for focus outlines. Nothing is a perfect square and nothing is a squircle.

**Pills are for stamps only.** Full 999px rounding is reserved for the two elements that behave like stamps on a notice — the time pill and the category tags. Nothing else in the system is a pill; a fully-rounded button would immediately read as a different product.

Borders are the primary form-giver, and their weight carries meaning: **1px for structure** (cards, inputs, dividers) and **1.5px for interactive controls** (filter chips, date-nav buttons, share buttons, secondary buttons). The heavier line is how a control announces that it can be pressed, in a system with almost no fills.

Weight and colour are separate axes and do not always agree. Inputs and secondary buttons are 1px like a card but take Pressable Line, because the Pressable Line Rule asks whether a thing can be pressed and this one asks how structural it is. When they disagree, colour wins on accessibility grounds and weight wins on look.

**No icons.** The system uses no icon library. Directional and semantic marks are text glyphs (`←` `→` `↗` `↓` `✕`) or a single emoji pin (`📍`) for locations, always `aria-hidden` with a real text label beside it. Every arrow in a link ships as a character, not an SVG.

### Named Rules

**The Radius-Follows-Scale Rule.** Never give a small control a large radius or a card a small one. 6 / 8 / 12 / 16 maps to control / button / card / modal, and the ladder is what makes the surfaces feel like one family.

## Components

### Buttons
- **Shape:** Gently curved (8px), full-width up to a 320px cap for the primary submit action.
- **Primary:** Solid hedgerow green with white text (12px 32px), semibold at 0.9375rem. Hovers to **deep forest ink**, not to a lighter or darker green — the darkening-toward-black move is deliberate and gives the press a sense of weight.
- **Secondary:** Transparent with a 1px Pressable Line and sage-ink text; on hover the border and text both take the accent. No fill ever appears.
- **Hover / Focus:** All transitions are 0.15–0.2s. Focus-visible draws a 2px accent outline at 2px offset, on every focusable element without exception.
- **Character:** *Plain and sturdy.* Nothing precious — honest borders, generous targets, obvious affordances. Built to be used confidently by a seventy-year-old on a bus.

### Chips
- **Filter chips:** White fill, 1.5px Pressable Line, sage-ink label at 0.8125rem, 6px radius. Each carries a `data-cat` attribute that binds it to its own category colour pair.
- **State:** On hover, the chip previews its category — border, text, and background all shift to that category's colours. When active, it inverts fully: category colour as the fill, white text. **A filter chip is the only element permitted to use a category colour as a background fill.**
- **Overflow:** The chip row **wraps** rather than scrolling — one line on desktop, two on a phone. Every filter must be visible without interaction; a horizontally-scrolling row clipped at the viewport edge hid half the categories from anyone who did not think to swipe. Height is the cheaper thing to spend.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** Notice white on the green-cast page.
- **Shadow Strategy:** Resting shadow only; see Elevation.
- **Border:** 1px hairline — the card's actual definition.
- **Internal Padding:** `16px 20px`.
- **Composition:** Title and time pill share a baseline-aligned top row (title left, pill right); then location as a maps link, description, optional source link, and a footer holding category tags left and Share right. The footer holds a 28px minimum height so cards with no tags don't collapse unevenly against their neighbours.
- **Long descriptions:** Clamped to three lines past 220 characters, with a "Read more ↓" toggle in accent text.

### Inputs / Fields
- **Style:** White fill, 1px Pressable Line, 8px radius, 10px 12px padding at 0.9375rem — comfortably above the 16px iOS zoom threshold in practice.
- **Focus:** Border shifts to accent and a 3px meadow-tint halo appears (`box-shadow: 0 0 0 3px`). Soft, not a glow.
- **Selects:** Native chrome removed and replaced with an inline SVG chevron as a data-URI, right-aligned at 0.75rem. No dependency, no icon font.
- **Labels:** Always visible above the field, sage-ink, 0.875rem, medium weight. Placeholder text is never a substitute for a label.

### Navigation
- **Date nav:** Four text buttons — Previous, Today, Pick a date, Next — each a minimum 44×44px with 1.5px Pressable Line borders and 6px radius. Prev and Today are hidden when not applicable rather than disabled. Today, when shown, is the sole tinted control on the row (meadow tint, accent border and text).
- **Footer:** Plain text buttons and links separated by middot characters, sage-ink, hovering to accent. No underlines at rest.
- **Skip link:** Ink-filled, parked at `top: -100%`, drops to `top: 0` on focus.
- **Mobile:** Below 480px the date nav spreads to `justify-content: space-between` across the full width, putting Previous and Next at opposite thumb reaches.

### Time Pill *(signature component)*
The one element carrying the system's warm counterpoint. Linen fill, hairline border, fully rounded, weathered-leather DM Mono at 0.9375rem semibold, sitting baseline-aligned against the event title. At roughly 1.2× the title's size ratio it reads as a peer of the title rather than an annotation — the time is the second thing the eye lands on, which is the whole point of a listing that answers "what's on *tonight*".

Its variant, the **status badge**, uses the same shell at 0.6875rem uppercase with 0.08em tracking to carry `ALL DAY`, `TBC`, or a multi-day range — so a card always has exactly one thing in that top-right slot, whether or not a time is known. **Both share a 28px minimum height**, so the slot holds one constant silhouette regardless of which variant fills it. That evenness is what lets a mixed list of timed, all-day, and TBC events scan as a single column rather than a ragged one.

### Tags *(signature component)*
Uppercase DM Mono stamps at 0.6875rem with 0.06em tracking, fully rounded, each in its category's text colour on its category's tint. They read as stamped onto the notice rather than attached to it. Multiple tags wrap and stay left-aligned in the card footer.

### Motion
Cards fade in with a 10px rise over 0.3s ease-out, staggered 40ms per card and **capped at 440ms** — the twelfth card and the fortieth start together, so a long day never feels slow. State transitions are 0.15s; modals scale from 0.95 over 0.2s and become bottom sheets below 480px. A deep-linked card pulses an 8px accent ring twice, then stops. `prefers-reduced-motion: reduce` disables every animation and transition in the system explicitly, control by control — not just the card entrance.

## Scope

This system describes the **public site** (`src/`). It does not describe `public/admin.html`.

The admin panel is an internal operator tool — one person, moderating a queue, not admiring the page. It runs its own visual language deliberately: Inter and Libre Baskerville rather than the system stack and Georgia, an orange accent (`#E67E22`) rather than hedgerow green, and its own radius steps. **The owner has confirmed this divergence is intentional and does not want it reconciled.** Do not restyle the admin onto this system, and do not treat its values as drift.

The design detector reflects that: the `design-system-*` rules and `overused-font` are switched off for `public/admin.html` in `.impeccable/config.json`, scoped to that file alone. Everything else still applies there — contrast, clipped or overflowing content, broken images. A tool used every day should still be legible and unbroken; it just doesn't have to match the noticeboard.

## Do's and Don'ts

### Do:
- **Do** define every surface with the 1px hairline (`{colors.border}`). It is the system's structural element, and removing it in favour of shadow or spacing breaks the noticeboard.
- **Do** draw every pressable edge with Pressable Line (`{colors.border-interactive}`) instead, and measure any replacement at 3:1 against white, the page, and linen. Hairline is a whisper and a control cannot afford one.
- **Do** keep the events list one column wide at every breakpoint.
- **Do** tint shadows with `rgba(26,42,26,…)`, never pure black — the modal overlay, which falls on the scrim rather than the page, is the sole documented exception.
- **Do** reserve DM Mono for times, dates, and tag stamps.
- **Do** give every interactive control a 44px minimum touch dimension and a real text label — an unlabelled glyph is never the only affordance.
- **Do** put a status badge (`ALL DAY`, `TBC`, or a date range) in the card's top-right whenever there is no time, so every card has the same silhouette.
- **Do** desaturate any new category colour into the aged family, then verify it clears 4.5:1 on its own tint.
- **Do** hover primary buttons toward deep forest ink (`{colors.ink}`), not toward a lighter green.
- **Do** extend `prefers-reduced-motion` coverage explicitly whenever a new transition is added.

### Don't:
- **Don't** use pure `#FFFFFF` as a page background or neutral grey (`#666`, `#888`) for any text. Every neutral in this system carries green or brown.
- **Don't** add a second accent colour. Hedgerow green is the only brand voice, and it appears as a fill roughly once per viewport.
- **Don't** use elevation to signal importance. Shadows respond to interaction; they never rank content.
- **Don't** use a category colour as a background fill anywhere except an active filter chip.
- **Don't** make an event title more than ~1.3× body size, or promote any single event with size, colour, or imagery. Every notice is equal.
- **Don't** introduce photography, illustration, or decorative imagery. The system deliberately has none.
- **Don't** add a dark mode. Light-only with warm naturals is a committed decision, not an oversight.
- **Don't** add an icon library. Text glyphs and inline data-URI SVGs only — the three-dependency budget is a project value.
- **Don't** put the submit call-to-action above the day's events.
- **Don't** use a pill radius (999px) on anything that isn't a time pill or a category tag.
- **Don't** add a webfont beyond DM Mono. Georgia and the system stack are already on the device, and that is the point.
