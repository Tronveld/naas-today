// validateEventBody — the shared body check for both public write paths.
// Run with: node --test
//
// Added for critique item 72, which asked whether the submit form's required
// fields are earning their keep. The form refused the neighbour who knows only
// "Saturday morning, the square", while the card renderer, the database and the
// scrapers all handle a missing time perfectly well — it renders as TBC.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { validateEventBody } = require('../netlify/functions/lib/validate.js');

const BOOLS = {
  isAllDay: false, isFree: false, isForKids: false,
  isMusic: false, isSport: false, isMarket: false, isTheatre: false,
};

const base = (over = {}) => ({
  title: 'Trad Session',
  date: '2026-08-15',
  location: 'The Storehouse',
  description: 'Weekly session in the back bar.',
  time: '20:00',
  ...BOOLS,
  ...over,
});

describe('validateEventBody', () => {
  test('accepts a complete event', () => {
    assert.equal(validateEventBody(base()), null);
  });

  // The three fields that genuinely identify an event. These stay required.
  test('rejects a missing title', () => {
    assert.match(validateEventBody(base({ title: '' })), /Missing required fields/);
  });

  test('rejects a missing date', () => {
    assert.match(validateEventBody(base({ date: '' })), /Missing required fields/);
  });

  test('rejects a missing location', () => {
    assert.match(validateEventBody(base({ location: '' })), /Missing required fields/);
  });

  // Item 72. A time nobody knows yet is a real state, not a malformed body.
  test('accepts an event with no time — it renders as TBC', () => {
    assert.equal(validateEventBody(base({ time: null })), null);
  });

  test('accepts an all-day event with no time', () => {
    assert.equal(validateEventBody(base({ time: null, isAllDay: true })), null);
  });

  test('accepts an event with no description', () => {
    assert.equal(validateEventBody(base({ description: undefined })), null);
  });

  // Relaxing presence must not relax format: a time that is *supplied* and
  // malformed is still a bug, and this is the check that catches it.
  test('still rejects a malformed time', () => {
    assert.match(validateEventBody(base({ time: '25:00' })), /Invalid time format/);
  });

  test('still rejects a malformed end time', () => {
    assert.match(validateEventBody(base({ timeEnd: '10:70' })), /Invalid end time format/);
  });

  test('still rejects an impossible date', () => {
    assert.match(validateEventBody(base({ date: '2026-02-31' })), /Invalid date format/);
  });

  test('still rejects a description over 2000 characters', () => {
    assert.match(validateEventBody(base({ description: 'x'.repeat(2001) })), /Description too long/);
  });
});
