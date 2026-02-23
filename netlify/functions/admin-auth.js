// Netlify function – admin authentication (first-time setup + login)
// POST /.netlify/functions/admin-auth
//
// Body: { action: "check_setup" | "setup" | "login", password?: string }
//
// check_setup  – no password required; returns { configured: bool }
// setup        – hashes + stores password in admin_config; 403 if already set
// login        – verifies password; 200 { success: true } or 401

const crypto = require('crypto');

const ITERATIONS = 310_000; // OWASP 2023 recommendation for PBKDF2-SHA256
const KEYLEN     = 64;      // bytes → 128-char hex output
const DIGEST     = 'sha256';

// Rate limit login attempts: max 10 per IP per 15 minutes
const loginAttempts = new Map();
const LOGIN_LIMIT   = 10;
const LOGIN_WINDOW  = 15 * 60 * 1000;

function isLoginRateLimited(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now - entry.windowStart > LOGIN_WINDOW) {
    loginAttempts.set(ip, { windowStart: now, count: 1 });
    return false;
  }
  entry.count++;
  if (entry.count > LOGIN_LIMIT) return true;
  return false;
}

function hashPassword(plaintext) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(plaintext, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
  return { hash, salt };
}

function checkPassword(plaintext, storedHash, storedSalt) {
  const candidate = crypto.pbkdf2Sync(plaintext, storedSalt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
  return crypto.timingSafeEqual(
    Buffer.from(candidate, 'hex'),
    Buffer.from(storedHash,  'hex')
  );
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const SUPABASE_URL  = process.env.SUPABASE_URL;
  const SECRET_KEY    = process.env.SUPABASE_SECRET_KEY;

  if (!SUPABASE_URL || !SECRET_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY');
    return json(500, { error: 'Server not configured' });
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const { action, password } = body || {};

  // Secret keys (sb_secret_…) are not JWTs — use only the apikey header,
  // not Authorization: Bearer, which expects a JWT and will reject this format.
  const supabaseHeaders = {
    'apikey':       SECRET_KEY,
    'Content-Type': 'application/json',
  };

  // ── check_setup ──────────────────────────────────────────────────────────
  if (action === 'check_setup') {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/admin_config?select=id&limit=1`,
        { headers: supabaseHeaders }
      );
      if (!res.ok) throw new Error(`Supabase ${res.status}`);
      const rows = await res.json();
      return json(200, { configured: rows.length > 0 });
    } catch (err) {
      console.error('check_setup error:', err);
      return json(500, { error: 'Failed to check setup status' });
    }
  }

  // ── setup ─────────────────────────────────────────────────────────────────
  if (action === 'setup') {
    if (!password || password.length < 12) {
      return json(400, { error: 'Password must be at least 12 characters' });
    }

    try {
      // Reject if already configured
      const checkRes = await fetch(
        `${SUPABASE_URL}/rest/v1/admin_config?select=id&limit=1`,
        { headers: supabaseHeaders }
      );
      if (!checkRes.ok) throw new Error(`Supabase ${checkRes.status}`);
      const existing = await checkRes.json();
      if (existing.length > 0) {
        return json(403, { error: 'Admin already configured' });
      }

      const { hash, salt } = hashPassword(password);

      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/admin_config`, {
        method:  'POST',
        headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
        body:    JSON.stringify({ password_hash: hash, salt }),
      });
      if (!insertRes.ok) {
        const err = await insertRes.text();
        throw new Error(err);
      }

      return json(200, { success: true });
    } catch (err) {
      console.error('setup error:', err);
      return json(500, { error: 'Failed to save password' });
    }
  }

  // ── login ─────────────────────────────────────────────────────────────────
  if (action === 'login') {
    if (!password) {
      return json(400, { error: 'Password required' });
    }

    const ip = event.headers['x-forwarded-for']?.split(',')[0].trim() || 'unknown';
    if (isLoginRateLimited(ip)) {
      return json(429, { error: 'Too many login attempts. Please wait before trying again.' });
    }

    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/admin_config?select=password_hash,salt&limit=1`,
        { headers: supabaseHeaders }
      );
      if (!res.ok) throw new Error(`Supabase ${res.status}`);
      const rows = await res.json();

      if (rows.length === 0) {
        return json(404, { error: 'not_configured' });
      }

      const { password_hash, salt } = rows[0];
      const valid = checkPassword(password, password_hash, salt);

      if (!valid) {
        return json(401, { error: 'Invalid password' });
      }

      return json(200, { success: true });
    } catch (err) {
      console.error('login error:', err);
      return json(500, { error: 'Login failed' });
    }
  }

  return json(400, { error: 'Unknown action' });
};
