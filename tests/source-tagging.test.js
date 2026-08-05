// Source tagging — scripts/lib.js
// Run with: node --test
//
// Every row records where it came from, because the admin queue mixes two
// streams with very different trust levels: vetted feeds (auto-approved) and
// human submissions (which need reading). Before this column there was no way
// to tell them apart, so ~88 machine rows a week buried the ~1 that needed
// judgement — and submissions sat for weeks.
//
// The value is the origin, not a category, so a bad batch can be traced back
// to the feed that produced it.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { sourceForUrl } = require('../scripts/lib.js');

describe('sourceForUrl', () => {
  test('uses the hostname', () => {
    assert.equal(sourceForUrl('https://whatsontonight.ie/events/Kildare/Naas'), 'whatsontonight.ie');
  });

  // Bare and www forms of one site must not read as two different sources,
  // or a per-source tally splits in half and hides how much each feed gives.
  test('strips a www. prefix', () => {
    assert.equal(sourceForUrl('https://www.moattheatre.com/shows'), 'moattheatre.com');
  });

  test('ignores path, query and port', () => {
    assert.equal(sourceForUrl('https://example.com:8443/a/b?c=d'), 'example.com');
  });

  test('lowercases the host', () => {
    assert.equal(sourceForUrl('https://WhatsOnTonight.IE/events'), 'whatsontonight.ie');
  });

  // Never throw on the insert path: a source tag is diagnostic, and losing it
  // must not cost the event itself.
  test('returns null for something that is not a url', () => {
    assert.equal(sourceForUrl('not a url'), null);
  });

  test('returns null for undefined', () => {
    assert.equal(sourceForUrl(undefined), null);
  });
});
