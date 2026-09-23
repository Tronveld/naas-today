// What submit-recurring actually writes. Run with: node --test
//
// These drive the real handler with fetch stubbed, and assert on the rows it
// would have POSTed to Supabase — the rows are what the site reads, so that is
// where a wrong date matters.

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const { handler } = require('../netlify/functions/submit-recurring.js');
const { validateEventBody } = require('../netlify/functions/lib/validate.js');

const BASE = {
  title: 'Market', location: 'Naas', description: '', url: '',
  time: '10:00', timeEnd: '', endDate: null,
  isAllDay: false, isFree: true, isForKids: false,
  isMusic: false, isSport: false, isMarket: true, isTheatre: false,
};

let posted, realFetch, realTZ, ipCounter = 0;

beforeEach(() => {
  posted = null;
  realFetch = globalThis.fetch;
  realTZ = process.env.TZ;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'anon';
  globalThis.fetch = async (_url, opts) => {
    posted = JSON.parse(opts.body);
    return { ok: true, text: async () => '' };
  };
});

afterEach(() => {
  globalThis.fetch = realFetch;
  if (realTZ === undefined) delete process.env.TZ; else process.env.TZ = realTZ;
});

async function submit(baseEvent, recurrence) {
  const res = await handler({
    httpMethod: 'POST',
    // A fresh IP per call, so the in-memory rate limiter never trips mid-suite.
    headers: { 'x-nf-client-connection-ip': `10.0.0.${++ipCounter}` },
    body: JSON.stringify({ baseEvent: { ...BASE, ...baseEvent }, recurrence }),
  });
  return { res, rows: posted };
}

const dayDiff = (a, b) => (Date.parse(b) - Date.parse(a)) / 86_400_000;

describe('multi-day recurring events', () => {
  test('every occurrence keeps the same span, not the first one\'s end date', async () => {
    // A two-day weekend event, weekly. Copying end_date verbatim gave week two
    // end_date < date, and every "is this on day X" check skips such a row.
    const { res, rows } = await submit(
      { date: '2026-10-03', endDate: '2026-10-04' },
      { frequency: 'weekly', endDate: '2026-10-24' },
    );
    assert.equal(res.statusCode, 200);
    assert.deepEqual(rows.map(r => [r.date, r.end_date]), [
      ['2026-10-03', '2026-10-04'],
      ['2026-10-10', '2026-10-11'],
      ['2026-10-17', '2026-10-18'],
      ['2026-10-24', '2026-10-25'],
    ]);
  });

  test('an end date that runs into the next occurrence is refused', async () => {
    // A 10-week Thursday course submitted with the course's last day as the
    // event's end date: every row spanned the whole course, so it showed daily.
    const { res, rows } = await submit(
      { date: '2026-09-24', endDate: '2026-11-26' },
      { frequency: 'weekly', endDate: '2026-11-26' },
    );
    assert.equal(res.statusCode, 400);
    assert.match(JSON.parse(res.body).error, /end date/i);
    assert.equal(rows, null);
  });

  test('a single-day series still stores no end date', async () => {
    const { rows } = await submit(
      { date: '2026-10-03' },
      { frequency: 'weekly', endDate: '2026-10-10' },
    );
    assert.deepEqual(rows.map(r => r.end_date), [null, null]);
  });
});

describe('monthly recurrence', () => {
  test('a series on the 31st lands on each month\'s last day, and comes back to the 31st', async () => {
    // setMonth overflowed: Jan 31 → Mar 3 → Apr 3 → May 3, and never recovered.
    const { rows } = await submit(
      { date: '2026-01-31' },
      { frequency: 'monthly', endDate: '2026-05-31' },
    );
    assert.deepEqual(rows.map(r => r.date),
      ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31']);
  });

  test('the 29th of February in a leap year', async () => {
    const { rows } = await submit(
      { date: '2028-01-29' },
      { frequency: 'monthly', endDate: '2028-03-29' },
    );
    assert.deepEqual(rows.map(r => r.date), ['2028-01-29', '2028-02-29', '2028-03-29']);
  });
});

describe('the server\'s time zone does not move the dates', () => {
  // Production runs in UTC, where toISOString happens to be right. netlify dev
  // runs on a Mac in Irish time, where local midnight is 23:00 UTC the day before.
  for (const tz of ['UTC', 'Europe/Dublin', 'America/New_York', 'Pacific/Auckland']) {
    test(`weekly across the October clock change, TZ=${tz}`, async () => {
      process.env.TZ = tz;
      const { rows } = await submit(
        { date: '2026-10-19' },
        { frequency: 'weekly', endDate: '2026-11-02' },
      );
      assert.deepEqual(rows.map(r => r.date), ['2026-10-19', '2026-10-26', '2026-11-02']);
    });
  }
});

describe('validateEventBody — end date', () => {
  test('an end date before the start date is refused', () => {
    assert.match(validateEventBody({ ...BASE, date: '2026-10-04', endDate: '2026-10-03' }), /end date/i);
  });

  test('an end date equal to the start date is accepted', () => {
    assert.equal(validateEventBody({ ...BASE, date: '2026-10-04', endDate: '2026-10-04' }), null);
  });
});
