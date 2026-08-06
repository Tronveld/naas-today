// Netlify function – admin event management (protected)
// Requires x-admin-password header on every request.
// Password is re-verified against admin_config on every call (stateless auth).
//
// GET    /.netlify/functions/admin-events[?status=pending|approved]
// PATCH  /.netlify/functions/admin-events  body: { id, fields: {...} }
// DELETE /.netlify/functions/admin-events  body: { id }

const crypto = require('crypto');
const { validDate, validTime, json, DATE_RE } = require('./lib/validate');

const ITERATIONS = 310_000;
const KEYLEN     = 64;
const DIGEST     = 'sha256';

// Columns that an admin is allowed to update (whitelist)
const ALLOWED_PATCH_FIELDS = new Set([
  'status', 'title', 'date', 'end_date', 'time', 'time_end',
  'is_all_day', 'location', 'description', 'is_free', 'is_for_kids',
  'is_music', 'is_sport', 'is_market', 'is_theatre', 'url',
  'recurring_group_id',
]);

const UUID_RE   = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOOL_FIELDS    = new Set(['is_all_day', 'is_free', 'is_for_kids', 'is_music', 'is_sport', 'is_market', 'is_theatre']);
const DATE_FIELDS    = new Set(['date', 'end_date']);
const TIME_FIELDS    = new Set(['time', 'time_end']);
const STR_FIELDS     = new Set(['title', 'location', 'description', 'url', 'status']);
const STR_MAX_LENGTHS = { title: 150, location: 150, description: 2000, url: 500, status: 10 };

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

  let url = `${supabaseUrl}/rest/v1/events?order=date.asc,time.asc&select=id,title,date,end_date,time,time_end,is_all_day,location,description,is_free,is_for_kids,is_music,is_sport,is_market,is_theatre,url,status,created_at,recurring_group_id,source`;
  if (status === 'pending' || status === 'approved') {
    url += `&status=eq.${status}`;
  }
  if (params.recurring === 'true') {
    url += '&recurring_group_id=not.is.null';
  }

  const res = await fetch(url, {
    headers: { 'apikey': secretKey },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return json(200, await res.json());
}

// Cap on a single bulk operation. Every id is interpolated into a PostgREST
// `id=in.(...)` filter, so this bounds the URL length as well as the blast
// radius of one mistaken click in the admin panel.
const MAX_BULK_IDS = 200;

// Returns [ids, null] with duplicates removed, or [null, errorString].
// Every entry must be proven to be a UUID before it reaches the query string.
function validateBulkIds(ids) {
  if (!Array.isArray(ids)) return [null, 'ids must be an array'];
  if (ids.length === 0) return [null, 'ids must not be empty'];
  if (ids.length > MAX_BULK_IDS) {
    return [null, `ids may contain at most ${MAX_BULK_IDS} entries`];
  }
  for (const id of ids) {
    if (typeof id !== 'string' || !UUID_RE.test(id)) {
      return [null, 'ids must all be valid UUIDs'];
    }
  }
  return [[...new Set(ids)], null];
}

// A date belongs to one occurrence, never to a set. Both bulk paths PATCH many
// rows with one field object, so a date in it lands on every row and flattens
// the series into a single day — which is exactly what happened to the Naas
// Country Market series: 85 future Fridays collapsed onto 2026-08-07 and the
// live site showed 85 copies of the same market on one date.
//
// Dropped rather than rejected. The admin edit form always includes `date`
// (admin.html builds `date: editDate.value` and passes the same object to
// apiPatchGroup), so a 400 would make it impossible to bulk-edit a time or a
// flag. The response reports what was ignored instead of staying quiet about it.
const BULK_IMMUTABLE = new Set(['date', 'end_date']);

function stripBulkImmutable(fields) {
  const safe = {}, ignored = [];
  for (const [k, v] of Object.entries(fields)) {
    if (BULK_IMMUTABLE.has(k)) ignored.push(k);
    else safe[k] = v;
  }
  return [safe, ignored];
}

function validatePatchFields(fields) {
  // Returns an error string, or null if valid
  const safeFields = {};
  for (const [k, v] of Object.entries(fields)) {
    if (ALLOWED_PATCH_FIELDS.has(k)) safeFields[k] = v;
  }
  if (Object.keys(safeFields).length === 0) return [null, 'No valid fields provided'];

  if ('status' in safeFields && !['pending', 'approved'].includes(safeFields.status)) {
    return [null, 'status must be "pending" or "approved"'];
  }

  for (const [k, v] of Object.entries(safeFields)) {
    if (BOOL_FIELDS.has(k) && typeof v !== 'boolean') {
      return [null, `Field "${k}" must be a boolean`];
    }
    if (STR_FIELDS.has(k) && typeof v !== 'string') {
      return [null, `Field "${k}" must be a string`];
    }
    if (STR_FIELDS.has(k) && typeof v === 'string' && STR_MAX_LENGTHS[k] && v.length > STR_MAX_LENGTHS[k]) {
      return [null, `Field "${k}" exceeds maximum length of ${STR_MAX_LENGTHS[k]}`];
    }
    if (DATE_FIELDS.has(k) && v !== null && !validDate(v)) {
      return [null, `Field "${k}" must be a valid date (YYYY-MM-DD)`];
    }
    if (TIME_FIELDS.has(k) && v !== null && !validTime(v)) {
      return [null, `Field "${k}" must be a valid time (HH:MM)`];
    }
    if (k === 'url' && v !== null) {
      try {
        const parsed = new URL(v);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return [null, 'Field "url" must use http:// or https://'];
        }
      } catch {
        return [null, 'Field "url" must be a valid URL'];
      }
    }
    if (k === 'recurring_group_id' && v !== null && !UUID_RE.test(v)) {
      return [null, 'Field "recurring_group_id" must be a valid UUID or null'];
    }
  }
  return [safeFields, null];
}

async function handlePatch(event, supabaseUrl, secretKey) {
  let body;
  try { body = JSON.parse(event.body); } catch { return json(400, { error: 'Invalid JSON' }); }

  const { id, ids, fields, group_id, from_date } = body || {};

  // ── Bulk mode: update a named set of events (the admin panel's "approve
  // selected"). Distinct from group_id mode, which follows a recurring series. ──
  if (ids !== undefined) {
    const [safeIds, idErr] = validateBulkIds(ids);
    if (idErr) return json(400, { error: idErr });
    if (!fields || typeof fields !== 'object' || Object.keys(fields).length === 0) {
      return json(400, { error: 'Missing or empty fields' });
    }

    const [validFields, fieldErr] = validatePatchFields(fields);
    if (fieldErr) return json(400, { error: fieldErr });
    const [safeFields, ignored] = stripBulkImmutable(validFields);
    if (Object.keys(safeFields).length === 0) {
      return json(400, { error: `Nothing to update — ${ignored.join(', ')} cannot be set on multiple events` });
    }

    const list = safeIds.map(encodeURIComponent).join(',');
    const res = await fetch(
      `${supabaseUrl}/rest/v1/events?id=in.(${list})`,
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
    return json(200, { success: true, count: updated.length, ignored });
  }

  // ── Bulk mode: update all future events in a recurring series ──
  if (group_id !== undefined) {
    if (!UUID_RE.test(group_id)) return json(400, { error: 'Invalid group_id' });
    if (!from_date || !DATE_RE.test(from_date)) return json(400, { error: 'Invalid or missing from_date' });
    if (!fields || typeof fields !== 'object' || Object.keys(fields).length === 0) {
      return json(400, { error: 'Missing or empty fields' });
    }

    const [validFields, fieldErr] = validatePatchFields(fields);
    if (fieldErr) return json(400, { error: fieldErr });
    const [safeFields, ignored] = stripBulkImmutable(validFields);
    if (Object.keys(safeFields).length === 0) {
      return json(400, { error: `Nothing to update — ${ignored.join(', ')} cannot be set across a series` });
    }

    const res = await fetch(
      `${supabaseUrl}/rest/v1/events?recurring_group_id=eq.${encodeURIComponent(group_id)}&date=gte.${encodeURIComponent(from_date)}`,
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
    return json(200, { success: true, count: updated.length, ignored });
  }

  // ── Single event mode ──
  if (!id || !fields || typeof fields !== 'object' || Object.keys(fields).length === 0) {
    return json(400, { error: 'Missing id or empty fields' });
  }
  if (!UUID_RE.test(id)) {
    return json(400, { error: 'Invalid id' });
  }

  const [safeFields, fieldErr] = validatePatchFields(fields);
  if (fieldErr) return json(400, { error: fieldErr });

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

  const { id, group_id, from_date } = body || {};

  // ── Bulk mode: delete all future events in a recurring series ──
  if (group_id !== undefined) {
    if (!UUID_RE.test(group_id)) return json(400, { error: 'Invalid group_id' });
    if (!from_date || !DATE_RE.test(from_date)) return json(400, { error: 'Invalid or missing from_date' });

    const res = await fetch(
      `${supabaseUrl}/rest/v1/events?recurring_group_id=eq.${encodeURIComponent(group_id)}&date=gte.${encodeURIComponent(from_date)}`,
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

  // ── Single event mode ──
  if (!id) return json(400, { error: 'Missing id' });
  if (!UUID_RE.test(id)) return json(400, { error: 'Invalid id' });

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
    return { statusCode: 405, headers: { 'Content-Type': 'text/plain' }, body: 'Method Not Allowed' };
  } catch (err) {
    console.error('admin-events error:', err);
    return json(500, { error: 'Operation failed' });
  }
};

// Exported for tests only — Netlify uses the handler above.
exports.validateBulkIds     = validateBulkIds;
exports.MAX_BULK_IDS        = MAX_BULK_IDS;
exports.stripBulkImmutable  = stripBulkImmutable;
exports.validDate           = validDate;
exports.validTime           = validTime;
