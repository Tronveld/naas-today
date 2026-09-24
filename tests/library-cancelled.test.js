'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { isCancelled } = require('../scripts/pull-library-events');

// Spydus marks a cancelled session by renaming it, e.g. 2026-09-25.
test('a title announcing a cancellation is cancelled', () => {
  assert.equal(isCancelled('Story Time - Storytime Cancelled on September 25th 2026'), true);
  assert.equal(isCancelled('CANCELED: Chess Club'), true);
  assert.equal(isCancelled('Book Club - Postponed'), true);
});

test('ordinary titles are not', () => {
  assert.equal(isCancelled('Story Time'), false);
  assert.equal(isCancelled('Re-pulp: Sustainable Paper Making (Adult Workshop)'), false);
});
