# Terms Page — Design Spec

**Date:** 2026-04-02
**Issue:** #5 — Add a terms/disclaimer page
**Status:** Approved

---

## Overview

Add a `/terms` page to Naas Today that sets user expectations around data accuracy, explains how event data is sourced, and provides a contact route for corrections or removal requests. This protects the project legally and builds trust with users and event organisers.

---

## Architecture

A single new Astro page at `src/pages/terms.astro`, using the existing `BaseLayout` for consistent HTML shell, meta tags, CSP headers, and global CSS. No client-side JS, no new components, no schema changes.

---

## Page: `src/pages/terms.astro`

**Route:** `/terms`

**BaseLayout props:**
- `title`: `"Terms — Naas Today"`
- `description`: `"How Naas Today sources events, accuracy expectations, and how to request corrections or removals."`

**Content sections (plain prose, no headings hierarchy deeper than h2):**

1. **What this site is**
   - Community-run resource for Naas locals
   - Not affiliated with Naas Town Council, any venue, or event organiser
   - Run independently as a free public service

2. **Where events come from**
   - Public sources: venue websites, RSS feeds, community listings
   - User submissions via the Submit Event form
   - Events are reviewed before appearing on the site

3. **Accuracy**
   - Event details (time, location, price) may change after publication
   - Always verify details directly with the organiser before attending
   - Naas Today is not responsible for errors or last-minute changes

4. **Corrections & removal**
   - To correct or remove an event listing, email `hello@naastoday.com`
   - Include the event name and date; requests are handled promptly

**Layout:** `.terms-page` wrapper div with `max-width: 640px`, `margin: 0 auto`, `padding: 2rem 1rem`. Uses existing BaseLayout global typography (Georgia for headings, system-ui for body). No new CSS variables.

---

## Footer update: `src/components/Footer.astro`

Add a "Terms" link between the existing "Contact" button and "Submit Event" button:

```
About · Contact · Terms · Submit Event
```

- Rendered as `<a href="/terms">Terms</a>` (not a `<button>`) since it navigates to a different page
- Styled to match existing footer link appearance (inherit colour, no underline by default)
- Flanked by `<span class="footer-dot">·</span>` separators on both sides

---

## What's not in scope

- Cookie policy (no cookies are set)
- Privacy policy (no user accounts, no tracking beyond Umami analytics which is cookieless)
- GDPR full compliance statement (out of scope for this task)

---

## Success criteria

- `/terms` renders correctly on mobile and desktop
- Footer shows "Terms" link that navigates to `/terms`
- Page content covers: what the site is, data sources, accuracy disclaimer, correction contact
- No regressions to existing pages
