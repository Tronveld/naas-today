// The approved-events feed only carries events that have not yet ended.
// Run with: node --test
//
// Past days are not viewable, so shipping past events was pure weight: on
// 2026-09-23, 450 of 887 approved rows were over, and the whole set went out
// twice per visit (inlined in the HTML, then again from get-events).

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { approvedEventsQuery, dublinToday } = require('../netlify/functions/lib/events-query.js');

test('filters out events that ended before the given day', () => {
  const q = approvedEventsQuery('2026-09-23');
  // A multi-day event that started last week and ends today must survive,
  // so the test is on either column, not on `date` alone.
  assert.match(q, /[?&]or=\(date\.gte\.2026-09-23,end_date\.gte\.2026-09-23\)/);
  assert.match(q, /[?&]status=eq\.approved/);
});

test('today is Naas\'s date, not the server\'s', () => {
  // 23:30 UTC on 1 July is already 2 July in Irish summer time.
  assert.equal(dublinToday(new Date('2026-07-01T23:30:00Z')), '2026-07-02');
  // In winter Dublin is on UTC.
  assert.equal(dublinToday(new Date('2026-01-01T23:30:00Z')), '2026-01-01');
});
