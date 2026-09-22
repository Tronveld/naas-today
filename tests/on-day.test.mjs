// isOnDay — the one definition of "this event runs on this day".
// Run with: node --test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isOnDay } from '../src/scripts/date.js';

test('a single-day event is on its date only', () => {
  assert.equal(isOnDay('2026-10-03', null, '2026-10-03'), true);
  assert.equal(isOnDay('2026-10-03', null, '2026-10-04'), false);
});

test('a multi-day event is on every day of its run, ends included', () => {
  for (const d of ['2026-10-03', '2026-10-04', '2026-10-05']) {
    assert.equal(isOnDay('2026-10-03', '2026-10-05', d), true, d);
  }
  assert.equal(isOnDay('2026-10-03', '2026-10-05', '2026-10-02'), false);
  assert.equal(isOnDay('2026-10-03', '2026-10-05', '2026-10-06'), false);
});

test('an empty-string end date is treated as none, as the client maps it', () => {
  assert.equal(isOnDay('2026-10-03', '', '2026-10-03'), true);
});
