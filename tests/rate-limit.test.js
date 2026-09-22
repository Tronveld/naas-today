// Password guessing is limited on every endpoint that checks the password.
// Run with: node --test
//
// admin-auth's login limited guesses to 10 per 15 minutes, but admin-events
// re-verifies the password on every request with no limit at all — so the
// login limit could be sidestepped by guessing against admin-events instead.

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const { rateLimiter } = require('../netlify/functions/lib/rate-limit.js');
const adminEvents = require('../netlify/functions/admin-events.js');

describe('rateLimiter', () => {
  test('hit() allows `limit` attempts in the window, then refuses', () => {
    const rl = rateLimiter(3, 1000);
    assert.deepEqual([1, 2, 3, 4].map(() => rl.hit('a', 0)), [false, false, false, true]);
  });

  test('a new window starts afresh', () => {
    const rl = rateLimiter(1, 1000);
    rl.hit('a', 0);
    assert.equal(rl.hit('a', 0), true);
    assert.equal(rl.hit('a', 1001), false);
  });

  test('over() reads without recording', () => {
    const rl = rateLimiter(2, 1000);
    assert.equal(rl.over('a', 0), false);
    assert.equal(rl.over('a', 0), false);
    rl.hit('a', 0); rl.hit('a', 0);
    assert.equal(rl.over('a', 0), true);
  });

  test('addresses are counted separately', () => {
    const rl = rateLimiter(1, 1000);
    rl.hit('a', 0);
    assert.equal(rl.over('b', 0), false);
  });
});

describe('admin-events refuses repeated wrong passwords', () => {
  let realFetch, calls;

  beforeEach(() => {
    realFetch = globalThis.fetch;
    calls = 0;
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SECRET_KEY = 'secret';
    // A stored hash no guess will match.
    globalThis.fetch = async () => {
      calls++;
      return { ok: true, json: async () => [{ password_hash: '00'.repeat(64), salt: 'ab' }] };
    };
  });
  afterEach(() => { globalThis.fetch = realFetch; });

  const guess = (ip) => adminEvents.handler({
    httpMethod: 'GET',
    headers: { 'x-admin-password': 'wrong guess', 'x-nf-client-connection-ip': ip },
    queryStringParameters: {},
  });

  test('the 11th wrong guess from one address gets 429 without a password check', async () => {
    for (let i = 0; i < 10; i++) assert.equal((await guess('198.51.100.7')).statusCode, 401);
    const before = calls;
    const res = await guess('198.51.100.7');
    assert.equal(res.statusCode, 429);
    assert.equal(calls, before, 'a limited request must not reach Supabase or PBKDF2');
  });

  test('another address is unaffected', async () => {
    assert.equal((await guess('198.51.100.8')).statusCode, 401);
  });
});
