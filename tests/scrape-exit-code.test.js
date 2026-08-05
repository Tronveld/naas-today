// Fetcher exit codes — scripts/lib.js, used by both fetchers
// Run with: node --test
//
// The scraper used to exit 0 even when a source failed outright. On 2026-08-05
// the first scheduled run reported "Errors: 1" (Eventbrite, HTTP 405) and the
// job still went green. That is the same silent-failure shape that let the
// library feed go five and a half weeks without a pull — just one level down:
// not a dead fetcher, a dead source inside a working fetcher.
//
// An error must fail the run so the workflow's retry fires and, if it stays
// broken, the job goes red.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { exitCode } = require('../scripts/lib.js');

describe('exitCode', () => {
  test('is 0 when everything succeeded', () => {
    assert.equal(exitCode({ sourceErrors: 0, eventErrors: 0 }), 0);
  });

  test('is 1 when a source could not be fetched', () => {
    assert.equal(exitCode({ sourceErrors: 1, eventErrors: 0 }), 1);
  });

  test('is 1 when an individual event failed to insert', () => {
    assert.equal(exitCode({ sourceErrors: 0, eventErrors: 3 }), 1);
  });

  test('is 1 when both kinds of error occurred', () => {
    assert.equal(exitCode({ sourceErrors: 2, eventErrors: 2 }), 1);
  });

  // Finding nothing is not an error. Every source can legitimately return only
  // duplicates — that is what a healthy second run of the day looks like, and
  // the 2026-08-05 dry run was exactly this: 86 found, 86 dupes, 0 inserted.
  test('is 0 when no events were inserted but nothing errored', () => {
    assert.equal(exitCode({ sourceErrors: 0, eventErrors: 0, inserted: 0 }), 0);
  });
});
