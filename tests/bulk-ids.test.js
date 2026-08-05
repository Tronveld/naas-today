// Bulk id validation for admin PATCH/DELETE — netlify/functions/admin-events.js
// Run with: node --test
//
// The ids go into a PostgREST `id=in.(...)` filter, which is string
// interpolation into a URL. Every id must be proven to be a UUID before it
// gets there — this validator is the only thing standing between the admin
// panel and an injected filter.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { validateBulkIds, MAX_BULK_IDS } = require('../netlify/functions/admin-events.js');

const uuid = (n) => `0000000${n}-0000-4000-8000-000000000000`.slice(-36);

describe('validateBulkIds', () => {
  test('accepts a single valid uuid', () => {
    const [ids, err] = validateBulkIds([uuid(1)]);
    assert.equal(err, null);
    assert.equal(ids.length, 1);
  });

  test('accepts several valid uuids', () => {
    const [ids, err] = validateBulkIds([uuid(1), uuid(2), uuid(3)]);
    assert.equal(err, null);
    assert.equal(ids.length, 3);
  });

  test('rejects a non-array', () => {
    assert.ok(validateBulkIds('not-an-array')[1]);
    assert.ok(validateBulkIds({})[1]);
    assert.ok(validateBulkIds(null)[1]);
  });

  test('rejects an empty array', () => {
    assert.ok(validateBulkIds([])[1]);
  });

  test('rejects an array containing a non-uuid', () => {
    assert.ok(validateBulkIds([uuid(1), 'nope'])[1]);
  });

  test('rejects a PostgREST filter injection attempt', () => {
    const [ids, err] = validateBulkIds([`${uuid(1)})&status=eq.approved&id=in.(${uuid(2)}`]);
    assert.equal(ids, null);
    assert.ok(err);
  });

  test('rejects a comma-smuggled id', () => {
    assert.ok(validateBulkIds([`${uuid(1)},${uuid(2)}`])[1]);
  });

  test('rejects non-string entries', () => {
    assert.ok(validateBulkIds([123])[1]);
    assert.ok(validateBulkIds([null])[1]);
    assert.ok(validateBulkIds([{ id: uuid(1) }])[1]);
  });

  test('rejects more than MAX_BULK_IDS entries', () => {
    const many = Array.from({ length: MAX_BULK_IDS + 1 }, (_, i) => uuid(i % 9));
    assert.ok(validateBulkIds(many)[1]);
  });

  test('accepts exactly MAX_BULK_IDS entries', () => {
    const many = Array.from({ length: MAX_BULK_IDS }, (_, i) => uuid(i % 9));
    assert.equal(validateBulkIds(many)[1], null);
  });

  test('de-duplicates repeated ids', () => {
    const [ids, err] = validateBulkIds([uuid(1), uuid(1), uuid(2)]);
    assert.equal(err, null);
    assert.equal(ids.length, 2);
  });
});
