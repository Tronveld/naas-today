// stripLabel — what one week-strip column shows above its count.
// Run with: node --test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stripLabel } from '../src/scripts/date.js';

test('today is named, not abbreviated', () => {
  assert.equal(stripLabel('2026-09-23', '2026-09-23'), 'Today');
});

test('other days get three letters, so T and S are no longer ambiguous', () => {
  assert.equal(stripLabel('2026-09-24', '2026-09-23'), 'Thu');
  assert.equal(stripLabel('2026-09-29', '2026-09-23'), 'Tue');
  assert.equal(stripLabel('2026-09-26', '2026-09-23'), 'Sat');
  assert.equal(stripLabel('2026-09-27', '2026-09-23'), 'Sun');
});

