// Scraped titles that repeat the date and time — scripts/scrape-sources.js
// Run with: node --test
//
// Moat Theatre titles some multi-night shows per performance, e.g.
// "My Fair Lady - The Odd Theatre Company (Thursday 24th Sept 2026 - 7:30pm)".
// The card already shows the date and time, so the suffix is noise.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { jsonLdToEvent } = require('../scripts/scrape-sources.js');

const titleOf = name => jsonLdToEvent({ name, startDate: '2026-09-24T19:30:00' }, 'https://x').title;

describe('jsonLdToEvent title', () => {
  test('drops a trailing (weekday date - time) suffix', () => {
    assert.equal(
      titleOf('My Fair Lady - The Odd Theatre Company (Thursday 24th Sept 2026 - 7:30pm)'),
      'My Fair Lady - The Odd Theatre Company');
  });

  test('drops a date-only suffix', () => {
    assert.equal(titleOf('Panto (Sat 26 September)'), 'Panto');
  });

  test('keeps a parenthetical that is not a date', () => {
    assert.equal(titleOf('Macbeth (Youth Production)'), 'Macbeth (Youth Production)');
  });
});
