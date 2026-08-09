// Fields that must not be applied across a whole set — netlify/functions/admin-events.js
// Run with: node --test
//
// The admin panel's edit form always submits `date` (admin.html builds the
// fields object with `date: editDate.value`), and hands that same object to
// apiPatchGroup when the admin picks "this and all future events". The server
// then PATCHed every row in the series with it, so one date landed on all of
// them.
//
// That is what happened to Naas Country Market on the live site: 85 future
// Friday occurrences collapsed onto 2026-08-07, and the site showed 85 copies
// of the same market on one day.
//
// A date is inherently per-occurrence. It is dropped from bulk and group
// updates rather than rejected, because rejecting would break the workflow
// outright — the form cannot help sending it, so an error would make it
// impossible to bulk-edit a time or a flag.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { stripBulkImmutable } = require('../netlify/functions/admin-events.js');

describe('stripBulkImmutable', () => {
  test('drops date and reports it', () => {
    const [safe, ignored] = stripBulkImmutable({ date: '2026-08-07', time: '10:00' });
    assert.deepEqual(safe, { time: '10:00' });
    assert.deepEqual(ignored, ['date']);
  });

  test('drops end_date too', () => {
    const [safe, ignored] = stripBulkImmutable({ end_date: '2026-08-08', is_market: true });
    assert.deepEqual(safe, { is_market: true });
    assert.deepEqual(ignored, ['end_date']);
  });

  test('drops both at once', () => {
    const [safe, ignored] = stripBulkImmutable({ date: '2026-08-07', end_date: '2026-08-08', title: 'X' });
    assert.deepEqual(safe, { title: 'X' });
    assert.deepEqual(ignored.sort(), ['date', 'end_date']);
  });

  // The whole point: everything else still goes through, so bulk-editing a
  // time, a location or a category flag across a series keeps working.
  test('leaves every other field untouched', () => {
    const fields = {
      title: 'Naas Country Market', time: '10:00', time_end: '14:00',
      location: 'The Moat', description: 'x', is_free: true, is_for_kids: false,
      is_music: false, is_sport: false, is_market: true, is_theatre: false,
      is_all_day: false, url: 'https://example.ie', status: 'approved',
    };
    const [safe, ignored] = stripBulkImmutable(fields);
    assert.deepEqual(safe, fields);
    assert.deepEqual(ignored, []);
  });

  test('reports nothing when no date was sent', () => {
    const [safe, ignored] = stripBulkImmutable({ status: 'approved' });
    assert.deepEqual(safe, { status: 'approved' });
    assert.deepEqual(ignored, []);
  });

  test('does not mutate the object it was given', () => {
    const fields = { date: '2026-08-07', time: '10:00' };
    stripBulkImmutable(fields);
    assert.deepEqual(fields, { date: '2026-08-07', time: '10:00' });
  });
});
