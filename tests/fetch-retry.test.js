'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { fetchWithRetry } = require('../scripts/scrape-sources');

// Replace the global fetch for one call. delayMs is passed as 0 throughout so
// the backoff does not make the suite sleep.
async function withFetch(impl, fn) {
  const real = globalThis.fetch;
  globalThis.fetch = impl;
  try { return await fn(); } finally { globalThis.fetch = real; }
}

const ok = { ok: true, status: 200, statusText: 'OK' };

test('returns the response without retrying when the first call succeeds', async () => {
  let calls = 0;
  const res = await withFetch(async () => { calls++; return ok; },
    () => fetchWithRetry('https://example.test/', {}, 3, 0));
  assert.equal(calls, 1);
  assert.equal(res.status, 200);
});

test('retries a thrown network error and succeeds on a later attempt', async () => {
  let calls = 0;
  await withFetch(async () => {
    if (++calls < 3) throw new TypeError('fetch failed');
    return ok;
  }, () => fetchWithRetry('https://whatsontonight.test/', {}, 3, 0));
  assert.equal(calls, 3);
});

test('retries a 429 — intokildare returned these on 2026-08-23', async () => {
  let calls = 0;
  await withFetch(async () => {
    if (++calls < 2) return { ok: false, status: 429, statusText: 'Too Many Requests' };
    return ok;
  }, () => fetchWithRetry('https://intokildare.test/', {}, 3, 0));
  assert.equal(calls, 2);
});

test('gives up after the attempt limit and rethrows the last error', async () => {
  let calls = 0;
  await assert.rejects(
    withFetch(async () => { calls++; return { ok: false, status: 403, statusText: 'Forbidden' }; },
      () => fetchWithRetry('https://blocked.test/', {}, 3, 0)),
    /HTTP 403 Forbidden/,
  );
  assert.equal(calls, 3);
});
