---
name: Naas Today
description: One saturated green field carrying the day's answer, over a near-white column of square white cards drawn in hairlines.
colors:
  page: "#F6F7F4"
  card: "#FFFFFF"
  accent-wash: "#F1F7F3"
  ink: "#14171A"
  ink-light: "#3E4642"
  ink-mid: "#5B6560"
  accent: "#186C42"
  accent-light: "#E7F1EA"
  on-accent: "#FFFFFF"
  on-accent-dim: "#A9D8BE"
  rule-on-accent: "rgba(255,255,255,0.3)"
  border: "#E4E7E4"
  border-light: "#EFF1EE"
  border-interactive: "#8A918C"
  tag-border: "#CBE0D3"
  action-underline: "#BEE0CC"
  nil: "#B9BFBB"
  danger: "#A32020"
  danger-tint: "#FBEAEA"
  scrim: "rgba(20,23,26,0.45)"
  shadow-tint: "rgba(20,23,26,0.07)"
  sheet-shadow: "rgba(0,0,0,0.12)"
  sheet-shadow-soft: "rgba(0,0,0,0.08)"
  pulse: "rgba(24, 108, 66, 0.22)"
typography:
  answer-xl:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "clamp(2.5rem, 11vw, 2.75rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.028em"
  answer-lg:
    fontFamily: "{typography.answer-xl.fontFamily}"
    fontSize: "1.6875rem"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.028em"
  document-title:
    fontFamily: "{typography.answer-xl.fontFamily}"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.028em"
  headline:
    fontFamily: "{typography.answer-xl.fontFamily}"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  answer-sm:
    fontFamily: "{typography.answer-xl.fontFamily}"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  subhead:
    fontFamily: "{typography.answer-xl.fontFamily}"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  title:
    fontFamily: "{typography.answer-xl.fontFamily}"
    fontSize: "1.0625rem"
    fontWeight: 700
    lineHeight: 1.24
    letterSpacing: "-0.017em"
  numeral:
    fontFamily: "{typography.answer-xl.fontFamily}"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
    fontFeature: "tabular-nums"
  lede:
    fontFamily: "{typography.answer-xl.fontFamily}"
    fontSize: "0.96875rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "normal"
  control:
    fontFamily: "{typography.answer-xl.fontFamily}"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.6
    letterSpacing: "normal"
  title-compact:
    fontFamily: "{typography.answer-xl.fontFamily}"
    fontSize: "0.90625rem"
    fontWeight: 700
    lineHeight: 1.26
    letterSpacing: "-0.012em"
  body:
    fontFamily: "{typography.answer-xl.fontFamily}"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  meta:
    fontFamily: "{typography.answer-xl.fontFamily}"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  meta-sm:
    fontFamily: "{typography.answer-xl.fontFamily}"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "{typography.answer-xl.fontFamily}"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.11em"
  label-sm:
    fontFamily: "{typography.answer-xl.fontFamily}"
    fontSize: "0.65625rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "0.07em"
  label-xs:
    fontFamily: "{typography.answer-xl.fontFamily}"
    fontSize: "0.625rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.1em"
rounded:
  none: "0"
  focus: "2px"
  day: "4px"
  chrome: "6px"
  control: "8px"
  sheet: "16px"
spacing:
  hair: "2px"
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  "2xl": "20px"
  "3xl": "24px"
  "4xl": "32px"
  "5xl": "48px"
components:
  band:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.none}"
    padding: "16px 0 18px"
  band-answer-xl:
    typography: "{typography.answer-xl}"
    textColor: "{colors.on-accent}"
  band-answer-lg:
    typography: "{typography.answer-lg}"
    textColor: "{colors.on-accent}"
  band-answer-sm:
    typography: "{typography.answer-sm}"
    textColor: "{colors.on-accent}"
  event-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "13px 15px 14px"
  upcoming-item:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "9px 13px 10px"
  weekstrip-day:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink-mid}"
    rounded: "{rounded.day}"
    padding: "4px 0"
  weekstrip-day-current:
    backgroundColor: "{colors.accent-light}"
    textColor: "{colors.accent}"
    rounded: "{rounded.day}"
  tag:
    backgroundColor: "{colors.accent-wash}"
    textColor: "{colors.accent}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.none}"
    padding: "3px 7px"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "12px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-accent}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink-mid}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "12px"
    height: "44px"
  button-secondary-hover:
    textColor: "{colors.accent}"
  button-text-action:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    typography: "{typography.meta-sm}"
    rounded: "{rounded.none}"
    padding: "0"
    height: "44px"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
    height: "44px"
  input-invalid:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
  modal-sheet:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "24px"
    width: "540px"
---

# Design System: Naas Today

## Overview

**Creative North Star: "The Answer Board"**

The page is a light room with one saturated object in it. A green field runs the
full width at the top and says, in words, whether anything is on today; below it a
seven-column strip of numbers shows the week ahead; below that a single column of
square white cards is the evidence. Nothing else in the interface is loud. There is
no webfont, no serif, no monospace, no icon set, no photography, no category
palette and no rounded corner on the page itself — the system UI stack with
tabular figures carries display, body and every numeral.

The green is a **field**, not an accent. It owns a whole region rather than dusting
a neutral page with brand colour, and at 5.62:1 against white both display and body
type clear WCAG AA on it, which is the technical fact that let the band carry the
day's answer at all. Everywhere else the accent appears it is small and functional:
a time, a link, a tag stamp, a focus ring.

Density is tight and vertical. The primary device is a phone belonging to someone
who may be older than the median web user, so every control clears 44px and every
affordance carries a real word rather than a glyph. Confirmed rejections: purple
gradients and SaaS hero patterns, Facebook Events clutter, aspirational
photography, the generic multi-column aggregator grid.

**Key Characteristics:**
- One saturated field, one accent hue, one tag stamp.
- Square everything on the page; radius exists only in the modal layer.
- Hairlines, not shadows, define surfaces at rest.
- System stack only; tabular figures where numbers align in a column.
- 44px touch floor everywhere, as a product constraint.
- Light mode only.

## Colors

A near-white room, one deep green field, and a graphite-to-sage neutral ramp; the
only hue outside the green is a red reserved entirely for form validation.

### Primary
- **Hedgerow Green** (`{colors.accent}`): The brand voice and the only saturated
  colour on the page. It fills the band as a field; elsewhere it appears only on
  the card's leading time line, on link and action text, on the tag stamp's letters,
  on the focus ring, on the primary button, and as `accent-color` on the form's
  native radios and checkboxes.
- **Green Wash** (`{colors.accent-light}`): The selected day in the week strip, the
  focus halo on a form field, and the filter chip's hover fill.
- **Tag Ground** (`{colors.accent-wash}`): Tag stamps, the modal header, and the
  stale-data note. A quieter green than the wash, used for a filled block behind text.
- **Pale Mint** (`{colors.on-accent-dim}`): Type on the green field — the brand
  line, the date, the kicker and the venue in the next-event block. 4.85:1 on the
  field, which is what an 11–12px uppercase label owes.
- **Action Underline** (`{colors.action-underline}`): A 2px underline under an
  in-page action's words. Never a fill, never a border.
- **Tag Hairline** (`{colors.tag-border}`): The 1px boundary of a tag stamp.

### Neutral
- **Page** (`{colors.page}`): The near-white ground. Faintly warm, never clinical white.
- **Card** (`{colors.card}`): Every card, the week strip, the modal sheet, form fields.
- **Ink** (`{colors.ink}`): Titles, headings, answers on white, the skip link's ground.
- **Ink Light** (`{colors.ink-light}`): Descriptions and body paragraphs — one step
  softer than a title so the title still leads.
- **Ink Mid** (`{colors.ink-mid}`): Meta, labels, venue names, footer, secondary controls.
- **Hairline** (`{colors.border}`): The structural line. Every card, the strip's base.
- **Hairline Soft** (`{colors.border-light}`): Divisions inside a surface — the
  footer's top rule, the modal header's base, a skeleton line's fill.
- **Pressable Line** (`{colors.border-interactive}`): The boundary of anything whose
  edge *is* the control: bordered buttons, form fields, the venue link's underline.
  3.11:1 on card white and 3.02:1 on the page, which is WCAG 1.4.11's floor.
- **Nil Grey** (`{colors.nil}`): The week strip's dash on a day with nothing on.
- **Scrim** (`{colors.scrim}`): The modal backdrop.
- **Sheet Shadow** (`{colors.sheet-shadow}` / `{colors.sheet-shadow-soft}`): The
  modal sheet's two-layer shadow, and the system's only untinted black. It is the
  documented exception to the ink-tinted shadow rule, because it falls on the scrim
  rather than on the page.

### Tertiary
- **Validation Red** (`{colors.danger}`) and **Validation Tint** (`{colors.danger-tint}`):
  Field errors, the invalid-field halo, and the form error banner. Nothing else.
  The tint is its own red rather than a colour borrowed from another job.

### Named Rules
**The One Field Rule.** The accent appears at full saturation in exactly one
full-width region per screen — the band. A second saturated green block anywhere
below it makes the ask compete with the answer; everything under the band gets the
accent as type, hairline or ring, never as a slab.

**The Red-Is-Validation Rule.** `{colors.danger}` and `{colors.danger-tint}` are
reserved for form validation. Nothing informational, no "stale data" note and no
empty state is allowed to borrow them — an empty day is the page's most common
state, not an error.

**The Pressable Line Rule.** If an element's border is its affordance, that border
is `{colors.border-interactive}` and must measure 3:1 against every ground it can
sit on. `{colors.border}` is a whisper; a control cannot afford one.

## Typography

**Display Font:** system UI stack (`ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`)
**Body Font:** the same stack
**Label/Mono Font:** none — `font-variant-numeric: tabular-nums` replaces it

**Character:** One family for everything, differentiated by weight, size and
tracking rather than by face. Display sizes are bold with negative tracking
(-0.017em to -0.028em) so the answer sets tight; labels are bold, uppercase and
widely tracked (0.06em–0.11em). There is no webfont on any page, which removes two
preconnects and a render-blocking stylesheet from a site whose stated constraint is
to stay cheap and light.

### Hierarchy
- **Answer XL** (700, `clamp(2.5rem, 11vw, 2.75rem)`, 1.04): The band's answer when
  nothing is on. Deliberately breaks to two lines on a 375px phone and fills the field.
- **Answer LG** (700, 1.6875rem, 1.08): The band's answer on a one-event day.
- **Document Title** (700, 1.75rem): The `/terms` page heading. The only display size
  outside the band.
- **Headline** (700, 1.375rem): Modal titles.
- **Answer SM** (700, 1.25rem, 1.08): The band's answer from two events up, and the
  success panel's heading.
- **Subhead** (700, 1.125rem): Empty-state and error-state headings.
- **Title** (700, 1.0625rem, 1.24): The event card's title, and the next-event
  when-line in the band.
- **Numeral** (700, 1rem, tabular): The day of the month in a Coming up row.
- **Lede** (400, 0.96875rem, 1.3): The next event's title inside the band.
- **Control** (500, 0.9375rem): Form fields, bordered buttons, loading text, `/terms` body.
- **Title Compact** (700, 0.90625rem, 1.26): A Coming up row's title — one density
  step below a card title, because it is another day.
- **Body** (400, 0.875rem, 1.55): Event descriptions, form labels, the submit ask.
  The column caps at 660px, which is roughly 70 characters at this size.
- **Meta** (400, 0.8125rem, 1.45): Venue, footer, field errors, the stale note. The
  card's leading time line uses this size at 700 in the accent.
- **Meta SM** (400, 0.75rem): The band's top line, the source hostname, Share,
  Read more, character counters, Coming up meta.
- **Label** (700, 0.6875rem, 0.11em, uppercase): "Coming up", and the band's kicker.
- **Label SM** (700, 0.65625rem, 0.07em, uppercase): Tag stamps, week strip day
  letters and counts, the Coming up date stamp.
- **Label XS** (700, 0.625rem, 0.1em, uppercase): "Week ahead" below 480px only.

### Named Rules
**The Tabular Figures Rule.** Every figure on this site is a time, a date or a
count, and all three are read down a column. `font-variant-numeric: tabular-nums`
is set on the band's next-event line, the week strip counts, the card's time line
and the Coming up date and meta. Any new numeral read in a column inherits it.

**The Sentence, Not The Stamp Rule.** Body-level content is set in sentence case.
Uppercase with tracking is reserved for the three label steps, which name a region
("Week ahead", "Coming up") or stamp a category ("Free", "For kids"). A venue, a
title or a description is never tracked uppercase.

**The Answer Outranks The Name Rule.** The brand line sets at 0.75rem beside the
date; the day's answer sets between 1.25rem and 2.75rem. On a page whose whole job
is one question, the largest thing is the reply, never the wordmark.

## Layout

A single 660px column, centred, with 1.5rem gutters that tighten to 1rem below
480px. **One column at every width** — a second column is the aggregator grid the
product rules out, so a wide screen simply gets margins.

Vertical order is fixed: band, sticky week strip, cards (or the empty state), the
Coming up list, the one-line submit ask, footer. The submit ask is a single line at
the very end, after Coming up, because either the cards or the upcoming list has
already answered the visitor by then.

Spacing rhythm is a 2/4/6/8/12/16/20/24/32/48px scale. Cards sit 9px apart, Coming
up rows 6px apart, and the footer is separated by 48px of margin above a soft
hairline.

The week strip is `position: sticky; top: 0` at z-index 100, laid out as a
`repeat(7, 1fr)` grid beside its label. The modal layer sits at z-index 1000 and
the skip link at 9999.

Above-the-fold budget on a 375×812 phone: about 110px before the first card on a
day with events. An empty day deliberately costs more, because there are no cards
to push down and the space buys the next real event instead of blank screen.

### Named Rules
**The Sized-By-Its-Answer Rule.** The band is one component in one order, sized by
its own content and never by its own importance: `is-xl` when nothing is on (the
answer fills the field and hands over the next real event), `is-lg` at one event,
`is-sm` from two up, where the cards are the answer and the band gets out of their
way in a single line. This is the system's signature move; anything new that
occupies the band obeys it.

**The Seven Days Rule.** The week strip is the entire date navigation: seven fixed
days from today, and no further. Fixed columns cannot reflow under a thumb the way
the previous four-button row did. Anything beyond the seventh day is the footer's
date picker, kept deliberately out of the way because going more than a week out is
the rare visit.

**The 44px Floor Rule.** Every interactive element clears a 44px minimum dimension
— by `min-height` on text actions, by `padding` where a border would otherwise
draw at the wrong place, by sizing the wrapping `<label>` around a native
checkbox. This is a product constraint from an audience that skews older, not a
style choice, and it is not negotiable against density. Adjacent targets may touch;
they may never overlap.

**The Dash, Not The Zero Rule.** A day with nothing on prints `–` in Nil Grey at
weight 400, not `0`. A column of numerals containing zeroes reads as data; a dash
reads as "nothing", which is the answer.

## Elevation & Depth

Flat at rest. Every surface on the page — card, week strip, Coming up row — is
defined by a 1px hairline against a near-white ground, with no resting shadow at
all. Depth appears only as a response to something the user is doing, and only in
two places on the page itself.

### Shadow Vocabulary
- **Attention** (`box-shadow: 0 4px 14px rgba(20,23,26,0.07)`): A card or Coming up
  row under the cursor, on hover-capable devices only. There is no accompanying
  translate — rising toward the cursor is a click affordance, and a card is not
  clickable; its title, venue, URL and Share button are.
- **Stuck** (`box-shadow: 0 2px 8px rgba(20,23,26,0.07)`): The week strip once it
  has reached the top of the viewport. The one authored motion moment in the
  system; it transitions in over 0.2s.
- **Sheet** (`box-shadow: 0 20px 60px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.08)`):
  The modal sheet, which floats over a scrim rather than over the page.
- **Focus Halo** (`box-shadow: 0 0 0 3px {colors.accent-light}`): A focused form
  field, paired with an accent border. Its validation counterpart swaps in
  `{colors.danger-tint}`.

### Named Rules
**The Flat-At-Rest Rule.** No surface carries a shadow at rest. A shadow means the
user is doing something — hovering, focusing, scrolling a header into place, or
opening a sheet. Page shadows are tinted with the ink hue, never pure black; the
modal sheet, which falls on the scrim rather than the page, is the sole exception.

**The Motion Budget Rule.** One authored motion moment (the strip's shadow as it
sticks), one staggered entrance (cards fade in over 0.3s at 40ms steps, capped at
440ms so a long list never crawls), one looping animation (the skeleton pulse), and
one two-beat pulse for a deep-linked card. Everything else is a 0.15–0.2s
transition on colour, border or shadow. `prefers-reduced-motion` is honoured
control by control, by name, for every animation and transition in the system —
adding a new one means adding it to that list.

## Shapes

**Squares.** The page has no border-radius anywhere: cards, Coming up rows, tags
and the band are all hard-cornered, and the 1px hairline is the whole of a
surface's definition. A softened corner would make a card look like a product tile,
which is precisely the aggregator language the product rejects.

Radius survives in exactly two places, and both are off the page proper:

- **The modal layer** (`{rounded.sheet}`, 16px): the sheet's corners, dropping to
  `16px 16px 0 0` below 480px where it becomes a bottom sheet.
- **Native form controls and the buttons beside them** (`{rounded.control}`, 8px):
  inputs, selects, textareas, and the primary/secondary buttons in a form's action
  row. These are chrome-adjacent; a hard-cornered native input reads as broken.

Three minor exceptions are real and documented rather than pretended away: the week
strip's day target uses a 4px radius (`{rounded.day}`) so its selected fill reads
as a soft tile rather than a block; the global focus ring uses a 2px radius
(`{rounded.focus}`) so it hugs a glyph run; and the skip link, which drops out of
the viewport's top edge on focus, is rounded on its lower corners only
(`{rounded.chrome}`, `0 0 6px 6px`) so it reads as a tab hanging off the edge
rather than as page content.

Borders are 1px everywhere on the page. 1.5px appears only on bordered buttons,
where the extra half-pixel is what makes a `{colors.border-interactive}` edge read
as a control rather than as a division.

**Not part of the system.** The loading skeleton card carries a 12px radius
(`BaseLayout.astro`, `.skeleton-card`). It is a leftover from the retired world and
it contradicts the square card it stands in for — a placeholder that does not match
what it is placeholding. It is recorded here as a defect the build carries, not as a
radius step, and nothing new should copy it.

### Named Rules
**The Squares Rule.** New surfaces on the page get 0 radius. If a new element wants
a corner, it belongs in the modal layer or it is a native form control; there is no
third case.

## Components

### Buttons
- **Shape:** Form buttons are gently rounded (`{rounded.control}`, 8px); everything
  else is square or has no box at all.
- **Primary:** Hedgerow green ground, white label, no border, 12px padding, 44px
  minimum height, weight 500 at 0.9375rem.
- **Hover / Focus:** Primary darkens to Ink on hover. Every focusable element takes
  a global 2px Hedgerow Green outline at 2px offset with a 2px radius.
- **Secondary:** Transparent ground, 1px Pressable Line border, Ink Mid label;
  hover shifts both border and label to the accent.
- **Text action:** No box at all — the dominant button form on the page. Accent
  label at 0.75rem, 44px minimum height held by `min-height`, with the pale green
  2px underline where it is an in-page action.

### Chips
Built and styled but **not rendered**: `FILTERS_ENABLED` in `src/scripts/flags.js`
is `false`, so no element on the site carries these classes today. Recorded because
the block is kept whole and flipping one boolean brings the row back. A chip is a
1.5px Pressable Line box with a 6px radius, Ink Mid label at 0.8125rem, 44px
minimum height; it hovers to the accent triad and inverts to a green fill when
active. A zero-count chip drops its fill to page ground and prints a literal `(0)`,
but keeps its label contrast and its full-strength border, because a zero-count
chip is still a live control. It speaks in the one accent — the six per-category
hues went with the world that held them, though `data-cat` stays on the markup as a
hook. **Its 6px radius is dormant-only and is not the system's radius language;**
if the row returns, it returns square.

### Cards / Containers
- **Corner Style:** Square (`{rounded.none}`).
- **Background:** Card white on the page ground.
- **Shadow Strategy:** None at rest; Attention on hover only.
- **Border:** 1px Hairline. This is the entire definition of the surface.
- **Internal Padding:** 13px 15px 14px; the Coming up row runs one density step
  tighter at 9px 13px 10px.

The card's order is fixed: the time leads as a full-width accent line at 0.8125rem
weight 700 (every case — timed, all-day, TBC, a date span, or a span plus a clock —
resolves to a string, so the slot is never empty and a mixed list keeps one shape);
then the title; then one 44px row carrying venue, source hostname and Share; then
the description; then the tag row. A description over 600 characters folds its tail
behind a "Read more" toggle clamped to three lines — only genuine outliers fold,
because the page's promise is that you do not have to tap to find out what
something is.

### Tags
A single quiet stamp: accent letters on Tag Ground with a 1px Tag Hairline, square,
uppercase at 0.65625rem tracked 0.07em, 3px by 7px of padding. One tag language for
all six categories.

### Inputs / Fields
- **Style:** Card-white ground, 1px Pressable Line border, 8px radius, 10px/12px
  padding, 44px minimum height, 0.9375rem text.
- **Focus:** Border shifts to the accent with a 3px Green Wash halo; the UA outline
  is suppressed only because that pair replaces it.
- **Error:** Border shifts to Validation Red with a 3px Validation Tint halo, and
  the field's own message renders beneath it in Validation Red at 0.8125rem weight
  600. The halo marks the field as well as the message, because colour alone cannot
  carry the meaning.
- **Native controls:** `accent-color: var(--accent)` on every radio and checkbox, so
  the browser's default blue — the one colour on the page belonging to nobody —
  never appears. Boxes are widened to 20px and their wrapping label sized to 44px.
- **Select:** appearance stripped, with an inline SVG chevron as a background image.

### Navigation
The week strip is the navigation. A card-white sticky bar with a hairline base,
carrying a tracked uppercase "Week ahead" label beside seven equal columns. Each
column is a link stacking a single day-initial over its count, centred, 4px radius,
and it reflows to nothing — the grid is fixed. The current day fills with Green
Wash and turns both its letter and its count accent green; hover-capable devices
get a Hairline Soft fill. Each link carries a full `aria-label` ("Saturday, 16
August — 6 events") because the visible letter and numeral are `aria-hidden`.

The footer is the secondary navigation: Ink Mid text links at 0.8125rem separated
by middots, each 44px tall, hovering to the accent.

### The Band
The signature component. A full-bleed Hedgerow Green field carrying, in order: a
0.75rem uppercase Pale Mint line with the brand name left and the long date right;
the day's answer in white; and, on an empty day only, a hairline-ruled block in
`{colors.rule-on-accent}` giving the next real event's relative day and time,
title, and venue. It is one component in one order at three sizes — see the
Sized-By-Its-Answer Rule. An empty day that ends at "nothing" is a dead end, so the
band says what there *is* in the same breath.

### Named Rules
**The Three Treatments Rule.** A link's treatment states what it is, and the three
are not interchangeable:
1. **Neutral Pressable Line underline** = a destination whose text gives no other
   clue that it is one (the venue name). Without it, on an audience that skews
   older, the venue simply is not a link.
2. **No underline, accent text** = an outbound link whose text already announces
   itself (the source hostname).
3. **Pale green 2px underline at 4px offset** = an in-page action (Share, the
   submit ask). It thickens to full accent on hover.
This was arrived at by fixing a real regression. Do not collapse the three.

**The Text-Action Rule.** A secondary action on a listing is text, not a box. A
bordered 44px button with a radius was the heaviest object on a card whose whole
language is hairlines, six times over on a Saturday. The 44px floor is held by
padding instead.

**The Venue Is A Name Rule.** A card names a place, not an address:
`location.split(',')[0]`, in sentence case, with the full string on `href` and
`title`. `width: fit-content` keeps the 44px floor while stopping the target from
covering the empty half of the row.

## Scope

This system describes the **public site** (`src/`). It does not describe `public/admin.html`.

The admin panel is an internal operator tool — one person, moderating a queue, not
admiring the page. It runs its own visual language deliberately: Inter and Libre
Baskerville rather than the system stack, an orange accent (`#E67E22`) rather than
hedgerow green, and its own radius steps. **The owner has confirmed this divergence
is intentional and does not want it reconciled.** Do not restyle the admin onto this
system, and do not treat its values as drift.

The design detector reflects that: the `design-system-*` rules and `overused-font`
are switched off for `public/admin.html` in `.impeccable/config.json`, scoped to
that file alone. Everything else still applies there — contrast, clipped or
overflowing content, broken images. A tool used every day should still be legible
and unbroken; it just doesn't have to match the noticeboard.

## Do's and Don'ts

### Do:
- **Do** define every surface on the page with the 1px hairline (`{colors.border}`).
  It is the system's structural element; shadow and spacing do not replace it.
- **Do** draw every pressable edge in Pressable Line (`{colors.border-interactive}`)
  and measure any replacement at 3:1 against card white and the page ground.
- **Do** size the band by its own answer, never by its own importance.
- **Do** keep the events list one column wide at every breakpoint.
- **Do** set `font-variant-numeric: tabular-nums` on any figure read down a column.
- **Do** give every interactive control a 44px minimum touch dimension and a real
  text label — an unlabelled glyph is never the only affordance.
- **Do** carry the accent below the band as type, hairline or ring only.
- **Do** point `accent-color` at `{colors.accent}` on any native radio or checkbox.
- **Do** tint page shadows with `rgba(20,23,26,…)`; the modal sheet, which falls on
  the scrim, is the sole exception.
- **Do** add any new animation or transition to the `prefers-reduced-motion` block
  by name in the same commit.
- **Do** keep the day's count honest about the *day*, not about whatever is
  filtered or rendered beneath it.

### Don't:
- **Don't** put a border-radius on anything that sits on the page. Radius belongs to
  the modal layer and native form controls, and nowhere else.
- **Don't** add a webfont. There is none, and the three-dependency budget now
  extends to fonts.
- **Don't** reintroduce a serif or a monospace face. Tabular figures do the mono's
  old job.
- **Don't** add a second saturated green region below the band.
- **Don't** bring back a per-category colour palette. One tag stamp, one voice.
- **Don't** use `{colors.danger}` or `{colors.danger-tint}` for anything but form
  validation — an empty day is the most-shown screen, not an error.
- **Don't** translate a card on hover. Rising toward the cursor claims the whole
  card is clickable; it is not.
- **Don't** let two 44px targets overlap. Touching is fine; overlapping means a tap
  on one lands on the other.
- **Don't** set body-level content in tracked uppercase.
- **Don't** extend the week strip past seven days, or reintroduce a stepping date
  control that reflows under the thumb.
