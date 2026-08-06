// JSON source adapters for the scraper — scripts/scrape-sources.js
// Run with: node --test
//
// Two sources publish structured JSON rather than JSON-LD in a page:
//
//   kildareheritage.com  — Squarespace, ?format=json → upcoming[]
//   intokildare.ie       — The Events Calendar REST API
//
// Both are adapted into schema.org Event shapes so they reuse the existing
// isNaasEvent → jsonLdToEvent → isDuplicate pipeline unchanged. The adapters are
// split into a fetch half and a pure mapper half; only the mapper is exported and
// only the mapper is tested, so no test touches the network.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  kildareHeritageToLd,
  intoKildareToLd,
  isNaasEvent,
} = require('../scripts/scrape-sources.js');

const SRC = 'https://www.kildareheritage.com/event-calendar';

// Squarespace stores startDate/endDate as epoch milliseconds in true UTC, while
// the page renders Dublin local time. Verified 2026-08-06 against the live feed:
// Taste of Kildare is epoch 1786791600275 = 11:00 UTC, and the event page shows
// <time class="event-time-localized">12:00</time>. Dublin, not UTC, is the number
// a reader of this site expects to see.
describe('kildareHeritageToLd', () => {
  const item = (over = {}) => ({
    title:     'Taste of Kildare',
    startDate: Date.UTC(2026, 7, 15, 11, 0),
    endDate:   Date.UTC(2026, 7, 16, 17, 0),
    excerpt:   'A celebration of food and drink.',
    fullUrl:   '/event-calendar/taste-of-kildare-1',
    location:  { addressTitle: 'Naas Racecourse', addressLine2: 'County Kildare Ireland' },
    ...over,
  });

  test('converts the epoch to Dublin local time, not UTC', () => {
    const ld = kildareHeritageToLd(item(), SRC);
    assert.equal(ld.startDate, '2026-08-15T12:00'); // 11:00 UTC + 1h summer time
    assert.equal(ld.endDate,   '2026-08-16T18:00');
  });

  // The bug this guards: toISOString() would date a 00:30 Dublin gig to the
  // previous day, because in summer Dublin is UTC+1 and 00:30 local is 23:30 UTC.
  // Same class of error CLAUDE.md warns about for localDateStr() on the frontend.
  test('keeps a past-midnight event on its own local day', () => {
    const ld = kildareHeritageToLd(item({ startDate: Date.UTC(2026, 7, 15, 23, 30), endDate: null }), SRC);
    assert.equal(ld.startDate, '2026-08-16T00:30');
  });

  test('applies no offset in winter, when Dublin is UTC', () => {
    const ld = kildareHeritageToLd(item({ startDate: Date.UTC(2026, 0, 15, 20, 0), endDate: null }), SRC);
    assert.equal(ld.startDate, '2026-01-15T20:00');
  });

  test('merges addressTitle and addressLine2 so the Naas filter can see the town', () => {
    const ld = kildareHeritageToLd(
      item({ location: { addressTitle: 'Moat Theatre', addressLine2: 'Naas, County Kildare' } }),
      SRC,
    );
    assert.equal(ld.location.name, 'Moat Theatre, Naas, County Kildare');
    assert.equal(isNaasEvent(ld), true);
  });

  // The live feed's addressTitle carries trailing whitespace, which reached the
  // card as "Naas Racecourse , County Kildare Ireland".
  test('trims each address part, not just the joined string', () => {
    const ld = kildareHeritageToLd(
      item({ location: { addressTitle: 'Naas Racecourse ', addressLine2: 'County Kildare Ireland' } }),
      SRC,
    );
    assert.equal(ld.location.name, 'Naas Racecourse, County Kildare Ireland');
  });

  test('drops an event with no location rather than inventing one', () => {
    const ld = kildareHeritageToLd(item({ location: {} }), SRC);
    assert.equal(ld.location, null);
    assert.equal(isNaasEvent(ld), false);
  });

  test('resolves fullUrl against the source URL', () => {
    const ld = kildareHeritageToLd(item(), SRC);
    assert.equal(ld.url, 'https://www.kildareheritage.com/event-calendar/taste-of-kildare-1');
  });

  test('survives an item with no dates at all', () => {
    const ld = kildareHeritageToLd(item({ startDate: null, endDate: null }), SRC);
    assert.equal(ld.startDate, null);
    assert.equal(ld.endDate, null);
  });
});

describe('intoKildareToLd', () => {
  const ev = (over = {}) => ({
    title:      'Heritage Walk',
    start_date: '2026-08-15 19:30:00',
    end_date:   '2026-08-15 21:00:00',
    all_day:    false,
    cost:       '',
    excerpt:    'A guided walk.',
    url:        'https://intokildare.ie/event/heritage-walk/',
    venue:      { venue: 'Naas Library', city: 'Naas' },
    ...over,
  });

  test('rewrites the space-separated timestamp into ISO form', () => {
    const ld = intoKildareToLd(ev());
    assert.equal(ld.startDate, '2026-08-15T19:30:00');
    assert.equal(ld.endDate,   '2026-08-15T21:00:00');
  });

  // jsonLdToEvent derives is_all_day from the absence of a time, so an all-day
  // event has to arrive as a bare date. Passing 00:00 through would render the
  // card as "00:00" instead of "ALL DAY".
  test('emits a bare date for an all-day event', () => {
    const ld = intoKildareToLd(ev({ all_day: true }));
    assert.equal(ld.startDate, '2026-08-15');
  });

  test('treats a midnight start as no time given', () => {
    const ld = intoKildareToLd(ev({ start_date: '2026-08-15 00:00:00' }));
    assert.equal(ld.startDate, '2026-08-15');
  });

  // The API returns an empty array, not an empty object, when an event has no
  // venue. Reading .venue off it yields undefined rather than throwing, but the
  // joined string must still come out empty rather than "undefined".
  test('handles the empty-array venue the API returns when none is set', () => {
    const ld = intoKildareToLd(ev({ venue: [] }));
    assert.equal(ld.location, null);
    assert.equal(isNaasEvent(ld), false);
  });

  test('builds a location the Naas filter accepts', () => {
    const ld = intoKildareToLd(ev());
    assert.equal(ld.location.name, 'Naas Library, Naas');
    assert.equal(isNaasEvent(ld), true);
  });

  test('marks a stated zero cost as free', () => {
    assert.deepEqual(intoKildareToLd(ev({ cost: 'Free' })).offers, { price: 0 });
    assert.deepEqual(intoKildareToLd(ev({ cost: '€0' })).offers,   { price: 0 });
  });

  // An empty cost field means "not stated", not "free". Claiming free here would
  // put a paid event behind the site's free filter, so it is left for
  // detectFree()'s text check to decide like it does for every other source.
  test('does not claim free for a priced or unstated cost', () => {
    assert.equal(intoKildareToLd(ev({ cost: '€15' })).offers, undefined);
    assert.equal(intoKildareToLd(ev({ cost: '' })).offers, undefined);
  });

  test('prefers the organiser website over the aggregator page', () => {
    const ld = intoKildareToLd(ev({ website: 'https://example.ie/walk' }));
    assert.equal(ld.url, 'https://example.ie/walk');
  });
});

// A "FREE" badge on a paid event is the expensive direction of this error: a
// parent filters for free, turns up, and it costs €15. detectFree's text
// fallback originally matched any occurrence of the word, so Taste of Kildare —
// "children under 10 enter completely free of charge", adults €15 — published
// with the badge on 2026-08-06. The fallback now requires the word to be about
// admission, and biases toward not-free when it cannot tell.
describe('detectFree', () => {
  const { detectFree } = require('../scripts/scrape-sources.js');
  const text = (s) => detectFree(undefined, '', s);

  test('a stated zero price is free regardless of the text', () => {
    assert.equal(detectFree({ price: 0 }, 'Gig', 'Tickets €15'), true);
    assert.equal(detectFree([{ price: '0' }], 'Gig', ''), true);
  });

  test('accepts the ordinary ways a listing says admission is free', () => {
    assert.equal(text('Free admission, all welcome.'), true);
    assert.equal(text('Entry: Free'), true);
    assert.equal(text('A free event for all the family.'), true);
    assert.equal(text('This event is free to attend.'), true);
    assert.equal(text('Free and open to the public.'), true);
  });

  test('does not treat a child concession as free admission', () => {
    assert.equal(
      text('Tickets €15. Children under 10 enter completely free of charge when accompanied by an adult.'),
      false,
    );
  });

  test('does not treat a free amenity as free admission', () => {
    assert.equal(text('Free parking on site. Tickets from €20.'), false);
    assert.equal(text('Gluten-free options available at the food stalls.'), false);
  });
});
