# Terms Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/terms` page and wire it into the site footer, closing the legal gap from issue #5.

**Architecture:** One new Astro page (`src/pages/terms.astro`) using the existing `BaseLayout`. One edit to `src/components/Footer.astro` to add the Terms link. No JS, no backend changes, no schema changes.

**Tech Stack:** Astro SSG, BaseLayout, global CSS variables already defined in BaseLayout.

---

### Task 1: Create the terms page

**Files:**
- Create: `src/pages/terms.astro`

- [ ] **Step 1: Create `src/pages/terms.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout
  title="Terms — Naas Today"
  description="How Naas Today sources events, accuracy expectations, and how to request corrections or removals."
>
  <main class="terms-page">
    <div class="terms-content">
      <h1>Terms &amp; Disclaimer</h1>

      <section>
        <h2>What this site is</h2>
        <p>Naas Today is a community-run events resource for people living in and around Naas, County Kildare. It is not affiliated with Naas Town Council, any venue, or any event organiser. It is run independently as a free public service.</p>
      </section>

      <section>
        <h2>Where events come from</h2>
        <p>Events are sourced from publicly available information — venue websites, RSS feeds, and community listings — as well as user submissions via the Submit Event form. All submissions are reviewed before appearing on the site.</p>
      </section>

      <section>
        <h2>Accuracy</h2>
        <p>Event details (time, location, price, cancellations) may change after publication. Always verify details directly with the organiser before attending. Naas Today is not responsible for errors, omissions, or last-minute changes to any listed event.</p>
      </section>

      <section>
        <h2>Corrections &amp; removal</h2>
        <p>To correct or remove an event listing, email <a href="mailto:hello@naastoday.com">hello@naastoday.com</a> with the event name and date. Requests are handled promptly.</p>
      </section>
    </div>
  </main>
</BaseLayout>

<style>
  .terms-page {
    background: var(--bg);
    min-height: 100vh;
    padding: 2rem 1rem 4rem;
  }

  .terms-content {
    max-width: 640px;
    margin: 0 auto;
  }

  h1 {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1.75rem;
    color: var(--ink);
    margin-bottom: 2rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border);
  }

  section {
    margin-bottom: 1.75rem;
  }

  h2 {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1.0625rem;
    color: var(--ink);
    margin-bottom: 0.5rem;
  }

  p {
    font-size: 0.9375rem;
    line-height: 1.65;
    color: var(--ink-mid);
  }

  a {
    color: var(--accent);
  }
</style>
```

- [ ] **Step 2: Verify the build succeeds**

```bash
npm run build 2>&1 | tail -20
```

Expected: build completes with no errors and `dist/terms/index.html` is emitted.

```bash
ls dist/terms/
```

Expected output: `index.html`

- [ ] **Step 3: Commit**

```bash
git add src/pages/terms.astro
git commit -m "feat: add /terms page (issue #5)"
```

---

### Task 2: Add Terms link to footer

**Files:**
- Modify: `src/components/Footer.astro`

- [ ] **Step 1: Edit `src/components/Footer.astro`**

Replace the current footer links block:

```astro
            <div class="footer-links">
                <button id="aboutBtn">About</button>
                <span class="footer-dot">·</span>
                <button id="contactBtn">Contact</button>
                <span class="footer-dot">·</span>
                <button id="submitEventFooterBtn">Submit Event</button>
            </div>
```

With:

```astro
            <div class="footer-links">
                <button id="aboutBtn">About</button>
                <span class="footer-dot">·</span>
                <button id="contactBtn">Contact</button>
                <span class="footer-dot">·</span>
                <a href="/terms">Terms</a>
                <span class="footer-dot">·</span>
                <button id="submitEventFooterBtn">Submit Event</button>
            </div>
```

- [ ] **Step 2: Verify the build succeeds and footer renders correctly**

```bash
npm run build 2>&1 | tail -20
```

Expected: build completes with no errors.

Then start the dev server and check the footer visually:

```bash
npm run dev
```

Open `http://localhost:4321` — confirm the footer shows: `About · Contact · Terms · Submit Event`

Click the Terms link — confirm it navigates to `/terms` and the page renders correctly.

- [ ] **Step 3: Commit**

```bash
git add src/components/Footer.astro
git commit -m "feat: add Terms link to footer (issue #5)"
```

---

### Task 3: Close the GitHub issue

- [ ] **Step 1: Close issue #5**

```bash
gh issue close 5 --comment "Done. Terms page live at /terms, linked from the site footer."
```
