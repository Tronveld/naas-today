// JSON-LD extraction for the scraper — scripts/scrape-sources.js
// Run with: node --test
//
// Listing pages are the durable sources (individual event pages go stale within
// weeks). Eventbrite's Naas listing publishes its events wrapped in a schema.org
// ItemList, which the extractor originally walked straight past — 56 events on
// the page, 0 found.
//
// Eventbrite itself was removed as a source on 2026-08-05 (it blocks scrapers —
// see event-sources.md). ItemList handling stays: it is the standard wrapper for
// any listing page, not an Eventbrite quirk. Do not re-add the source.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { extractJsonLd, isNaasEvent } = require('../scripts/scrape-sources.js');

const wrap = (obj) =>
  `<html><head><script type="application/ld+json">${JSON.stringify(obj)}</script></head></html>`;

const event = (name, startDate) => ({
  '@type': 'Event',
  name,
  startDate,
  location: { '@type': 'Place', name: 'Lawlor\'s Hotel', address: { addressLocality: 'Naas' } },
});

describe('extractJsonLd', () => {
  test('finds a bare Event object', () => {
    const html = wrap(event('Trad Session', '2026-08-25'));
    assert.equal(extractJsonLd(html).length, 1);
  });

  test('finds Events in a top-level array', () => {
    const html = wrap([event('One', '2026-08-25'), event('Two', '2026-08-26')]);
    assert.equal(extractJsonLd(html).length, 2);
  });

  test('finds Events in an @graph', () => {
    const html = wrap({ '@graph': [event('One', '2026-08-25'), { '@type': 'WebPage' }] });
    assert.equal(extractJsonLd(html).length, 1);
  });

  test('finds Events wrapped in an ItemList of ListItems', () => {
    const html = wrap({
      '@type': 'ItemList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, item: event('CPR Training', '2026-08-25') },
        { '@type': 'ListItem', position: 2, item: event('Card Show', '2026-08-23') },
      ],
    });
    const found = extractJsonLd(html);
    assert.equal(found.length, 2);
    assert.equal(found[0].name, 'CPR Training');
    assert.equal(found[0].startDate, '2026-08-25');
  });

  test('finds Events in an ItemList that holds them directly', () => {
    const html = wrap({
      '@type': 'ItemList',
      itemListElement: [event('Direct One', '2026-08-25')],
    });
    assert.equal(extractJsonLd(html).length, 1);
  });

  test('ignores non-Event entries in an ItemList', () => {
    const html = wrap({
      '@type': 'ItemList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, item: { '@type': 'Product', name: 'A ticket' } },
        { '@type': 'ListItem', position: 2, item: event('Real Event', '2026-08-25') },
      ],
    });
    const found = extractJsonLd(html);
    assert.equal(found.length, 1);
    assert.equal(found[0].name, 'Real Event');
  });

  test('returns nothing for malformed JSON rather than throwing', () => {
    const html = '<script type="application/ld+json">{ not json }</script>';
    assert.deepEqual(extractJsonLd(html), []);
  });
});

// A broad search listing (Eventbrite's Naas page) returns county-wide results
// and location-less online events alongside the real ones. PRODUCT.md records
// "Naas-specific, not regional" as a durable constraint, so county-level content
// is filtered down to Naas rather than allowed to broaden the site.
describe('isNaasEvent', () => {
  const at = (location) => ({ '@type': 'Event', name: 'Some Event', location });

  test('accepts an event whose addressLocality is Naas', () => {
    assert.equal(isNaasEvent(at({ name: 'Osprey Hotel', address: { addressLocality: 'Naas' } })), true);
  });

  test('accepts an event whose venue name contains Naas', () => {
    assert.equal(isNaasEvent(at({ name: 'Naas Court Hotel', address: {} })), true);
  });

  test('accepts a plain string location mentioning Naas', () => {
    assert.equal(isNaasEvent(at('Craddockstown School, Naas, Co. Kildare')), true);
  });

  test('rejects an event in another town', () => {
    assert.equal(isNaasEvent(at({ name: 'Royal Marine Hotel', address: { addressLocality: 'Dublin' } })), false);
  });

  test('rejects a nearby-but-not-Naas town', () => {
    assert.equal(isNaasEvent(at({ name: 'The Dew Drop Inn', address: { addressLocality: 'Kill' } })), false);
  });

  test('rejects an online event with no location at all', () => {
    assert.equal(isNaasEvent({ '@type': 'Event', name: 'Virtual Workshop' }), false);
  });

  test('does not match Naas as a substring of another word', () => {
    assert.equal(isNaasEvent(at({ name: 'Naasville Convention Center', address: { addressLocality: 'Naasville' } })), false);
  });

  test('handles an array of locations', () => {
    assert.equal(isNaasEvent(at([{ name: 'Somewhere' }, { address: { addressLocality: 'Naas' } }])), true);
  });
});
