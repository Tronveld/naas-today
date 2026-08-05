// Pending-submission email — scripts/notify-pending.js
// Run with: node --test
//
// Submissions were sitting for weeks because nothing told anyone they were
// there. The daily job emails while any remain, so forgetting to open the
// admin panel stops being how a submission dies.
//
// `now` is injected rather than read from the clock: the age of a submission
// is the whole point of the email, and a test that cannot fix "today" cannot
// check the arithmetic.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { formatPendingEmail } = require('../scripts/notify-pending.js');

const NOW = new Date('2026-08-05T09:00:00Z');

const pending = (over = {}) => ({
  id: '11111111-2222-3333-4444-555555555555',
  title: 'Trad Session',
  date: '2026-08-20',
  location: "Lawlor's Hotel",
  created_at: '2026-08-05T08:00:00Z',
  source: 'submission',
  ...over,
});

describe('formatPendingEmail', () => {
  // Nothing waiting must produce no email at all. A daily "you have 0 to
  // review" is the fastest way to train someone to filter the alert away.
  test('returns null when nothing is pending', () => {
    assert.equal(formatPendingEmail([], NOW), null);
  });

  test('subject is singular for one event', () => {
    const mail = formatPendingEmail([pending()], NOW);
    assert.match(mail.subject, /1 event awaiting review/);
  });

  test('subject is plural for several', () => {
    const mail = formatPendingEmail([pending(), pending(), pending()], NOW);
    assert.match(mail.subject, /3 events awaiting review/);
  });

  test('body carries title, date and location', () => {
    const mail = formatPendingEmail([pending()], NOW);
    assert.match(mail.text, /Trad Session/);
    assert.match(mail.text, /2026-08-20/);
    assert.match(mail.text, /Lawlor's Hotel/);
  });

  describe('age', () => {
    test('reads as today when submitted an hour ago', () => {
      const mail = formatPendingEmail([pending({ created_at: '2026-08-05T08:00:00Z' })], NOW);
      assert.match(mail.text, /waiting since today/);
    });

    test('reads as 1 day for yesterday', () => {
      const mail = formatPendingEmail([pending({ created_at: '2026-08-04T08:00:00Z' })], NOW);
      assert.match(mail.text, /waiting 1 day/);
    });

    // The case that prompted all of this.
    test('reads as plural days for an old one', () => {
      const mail = formatPendingEmail([pending({ created_at: '2026-07-22T08:00:00Z' })], NOW);
      assert.match(mail.text, /waiting 14 days/);
    });
  });

  // Submissions are user-controlled text landing in an HTML email. Angle
  // brackets in a title must not become markup in the reader's client.
  describe('escaping', () => {
    test('escapes html in the title', () => {
      const mail = formatPendingEmail([pending({ title: '<script>alert(1)</script>' })], NOW);
      assert.ok(!mail.html.includes('<script>'), 'raw <script> reached the html body');
      assert.match(mail.html, /&lt;script&gt;/);
    });

    test('escapes html in the location', () => {
      const mail = formatPendingEmail([pending({ location: '<img src=x onerror=y>' })], NOW);
      assert.ok(!mail.html.includes('<img'), 'raw <img> reached the html body');
    });

    test('escapes ampersands', () => {
      const mail = formatPendingEmail([pending({ title: 'Fish & Chips' })], NOW);
      assert.match(mail.html, /Fish &amp; Chips/);
    });

    // The plain-text part is not markup, so it must NOT be escaped — an
    // escaped apostrophe there reads as a bug to whoever opens the mail.
    test('leaves the text part unescaped', () => {
      const mail = formatPendingEmail([pending({ title: 'Fish & Chips' })], NOW);
      assert.match(mail.text, /Fish & Chips/);
    });
  });

  test('oldest submission is listed first', () => {
    const mail = formatPendingEmail([
      pending({ title: 'Newer', created_at: '2026-08-04T08:00:00Z' }),
      pending({ title: 'Older', created_at: '2026-07-01T08:00:00Z' }),
    ], NOW);
    assert.ok(mail.text.indexOf('Older') < mail.text.indexOf('Newer'), 'newest was listed first');
  });
});
