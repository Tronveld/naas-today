// Title normalisation for duplicate detection — scripts/lib.js
// Run with: node --test
//
// Every fetcher routes its duplicate check through normaliseTitle, so a gap here
// shows up as the same event appearing twice on the site.
//
// Found 2026-08-06, when Kildare Heritage was added as a second source covering
// the Moat Theatre. Moat publishes "Movicals - The Best of Movie Musicals" and
// Kildare Heritage publishes "Movicals – The Best of Movie Musicals". Identical
// event, identical date, different dash character — and isDuplicate said no.
// Titles are copy-pasted between listing sites by hand, so punctuation variants
// are the normal case, not an edge case.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { normaliseTitle } = require('../scripts/lib.js');

describe('normaliseTitle', () => {
  const same = (a, b) => assert.equal(normaliseTitle(a), normaliseTitle(b));

  test('treats an en dash and a hyphen as the same separator', () => {
    same('Movicals – The Best of Movie Musicals', 'Movicals - The Best of Movie Musicals');
  });

  test('treats an em dash and a hyphen as the same separator', () => {
    same('Féile Liam O\'Flynn — MARTIN HAYES', 'Féile Liam O\'Flynn - MARTIN HAYES');
  });

  test('treats a curly and a straight apostrophe as the same', () => {
    same('Deirdre O’Kane - All The Rage', 'Deirdre O\'Kane - All The Rage');
  });

  test('still ignores spacing around separators', () => {
    same('Al Porter : Comedy', 'Al Porter:Comedy');
  });

  test('still ignores case and repeated whitespace', () => {
    same('  THE   Love Hungry Farmer ', 'the love hungry farmer');
  });

  test('does not collapse genuinely different titles', () => {
    assert.notEqual(normaliseTitle('Sip & Paint'), normaliseTitle('Sip and Paint'));
  });
});
