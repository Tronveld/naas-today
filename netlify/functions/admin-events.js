// Netlify function – admin event management (protected)
// Requires x-admin-password header on every request.
// Password is re-verified against admin_config on every call (stateless auth).
//
// GET    /.netlify/functions/admin-events[?status=pending|approved]
// PATCH  /.netlify/functions/admin-events  body: { id, fields: {...} }
// DELETE /.netlify/functions/admin-events  body: { id }

const crypto = require('crypto');

const ITERATIONS = 310_000;
const KEYLEN     = 64;
const DIGEST     = 'sha256';

// Columns that an admin is allowed to update (whitelist)
const ALLOWED_PATCH_FIELDS = new Set([
  'status', 'title', 'date', 'end_date', 'time', 'time_end',
  'is_all_day', 'location', 'description', 'is_free', 'is_for_kids', 'url',
]);

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

// ── Auth helper ──────────────────────────────────────────────────────────────
// Secret keys (sb_secret_…) are not JWTs — use only the apikey header.
async function verifyAdminPassword(password, supabaseUrl, secretKey) {
  if (!password) return false;
  const headers = {
    'apikey': secretKey,
  };
  const res = await fetch(
    `${supabaseUrl}/rest/v1/admin_config?select=password_hash,salt&limit=1`,
    { headers }
  );
  if (!res.ok) return false;
  const rows = await res.json();
  if (rows.length === 0) return false;

  const { password_hash, salt } = rows[0];
  const candidate = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(candidate,     'hex'),
      Buffer.from(password_hash, 'hex')
    );
  } catch {
    return false; // length mismatch → not equal
  }
}

// ── Handlers ─────────────────────────────────────────────────────────────────

async function handleGet(event, supabaseUrl, secretKey) {
  const params  = event.queryStringParameters || {};
  const status  = params.status; // 'pending' | 'approved' | undefined

  let url = `${supabaseUrl}/rest/v1/events?order=created_at.desc&select=id,title,date,end_date,time,time_end,is_all_day,location,description,is_free,is_for_kids,url,status,created_at`;
  if (status === 'pending' || status === 'approved') {
    url += `&status=eq.${status}`;
  }

  const res = await fetch(url, {
    headers: { 'apikey': secretKey },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return json(200, await res.json());
}

async function handlePatch(event, supabaseUrl, secretKey) {
  let body;
  try { body = JSON.parse(event.body); } catch { return json(400, { error: 'Invalid JSON' }); }

  const { id, fields } = body || {};
  if (!id || !fields || typeof fields !== 'object' || Object.keys(fields).length === 0) {
    return json(400, { error: 'Missing id or empty fields' });
  }

  // Whitelist — strip any keys not in ALLOWED_PATCH_FIELDS
  const safeFields = {};
  for (const [k, v] of Object.entries(fields)) {
    if (ALLOWED_PATCH_FIELDS.has(k)) safeFields[k] = v;
  }
  if (Object.keys(safeFields).length === 0) {
    return json(400, { error: 'No valid fields provided' });
  }

  // Validate status value if present
  if ('status' in safeFields && !['pending', 'approved'].includes(safeFields.status)) {
    return json(400, { error: 'status must be "pending" or "approved"' });
  }

  const res = await fetch(
    `${supabaseUrl}/rest/v1/events?id=eq.${encodeURIComponent(id)}`,
    {
      method:  'PATCH',
      headers: {
        'apikey':       secretKey,
        'Content-Type': 'application/json',
        'Prefer':       'return=representation',
      },
      body: JSON.stringify(safeFields),
    }
  );
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);

  const updated = await res.json();
  if (!updated || updated.length === 0) {
    return json(404, { error: 'Event not found' });
  }
  return json(200, { success: true, event: updated[0] });
}

async function handleDelete(event, supabaseUrl, secretKey) {
  let body;
  try { body = JSON.parse(event.body); } catch { return json(400, { error: 'Invalid JSON' }); }

  const { id } = body || {};
  if (!id) return json(400, { error: 'Missing id' });

  const res = await fetch(
    `${supabaseUrl}/rest/v1/events?id=eq.${encodeURIComponent(id)}`,
    {
      method:  'DELETE',
      headers: {
        'apikey': secretKey,
        'Prefer': 'return=minimal',
      },
    }
  );
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return json(200, { success: true });
}

// ── Main handler ─────────────────────────────────────────────────────────────

exports.handler = async function(event) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SECRET_KEY   = process.env.SUPABASE_SECRET_KEY;

  if (!SUPABASE_URL || !SECRET_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY');
    return json(500, { error: 'Server not configured' });
  }

  // Verify password on every request
  const password = event.headers['x-admin-password'];
  let authed;
  try {
    authed = await verifyAdminPassword(password, SUPABASE_URL, SECRET_KEY);
  } catch (err) {
    console.error('Auth error:', err);
    return json(500, { error: 'Auth check failed' });
  }
  if (!authed) return json(401, { error: 'Unauthorized' });

  try {
    const method = event.httpMethod;
    if (method === 'GET')    return await handleGet(event, SUPABASE_URL, SECRET_KEY);
    if (method === 'PATCH')  return await handlePatch(event, SUPABASE_URL, SECRET_KEY);
    if (method === 'DELETE') return await handleDelete(event, SUPABASE_URL, SECRET_KEY);
    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (err) {
    console.error('admin-events error:', err);
    return json(500, { error: 'Operation failed' });
  }
};
