// Netlify function – submit a new event (saved as 'pending' for review)

// Simple in-memory rate limiter: max 5 submissions per IP per hour
const rateLimitMap = new Map();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return false;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT) return true;
  return false;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;

function validDate(s) {
  if (!DATE_RE.test(s)) return false;
  const parts = s.split('-').map(Number);
  const m = parts[1], d = parts[2];
  return m >= 1 && m <= 12 && d >= 1 && d <= 31;
}

function validTime(s) {
  if (!TIME_RE.test(s)) return false;
  const parts = s.split(':').map(Number);
  return parts[0] <= 23 && parts[1] <= 59;
}

function validUrl(value) {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

exports.handler = async function(event, context) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'text/plain' }, body: 'Method Not Allowed' };
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server not configured' })
    };
  }

  // Rate limiting — prefer Netlify's non-spoofable header over x-forwarded-for
  const ip = event.headers['x-nf-client-connection-ip']
    || event.headers['x-forwarded-for']?.split(',')[0].trim()
    || 'unknown';
  if (isRateLimited(ip)) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '3600' },
      body: JSON.stringify({ error: 'Too many submissions. Please try again later.' })
    };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { title, date, endDate, time, timeEnd, isAllDay, location, description, isFree, isForKids, isMusic, isSport, isMarket, isTheatre, url } = data;

  // Required field presence
  if (!title || !date || !location) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing required fields: title, date, location' })
    };
  }

  if (!isAllDay && !time) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing required field: time (or mark as all day)' })
    };
  }

  // Type validation
  if (typeof title !== 'string' || typeof date !== 'string' || typeof location !== 'string') {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid field types' }) };
  }
  if (typeof isAllDay !== 'boolean' || typeof isFree !== 'boolean' || typeof isForKids !== 'boolean' ||
      typeof isMusic !== 'boolean' || typeof isSport !== 'boolean' || typeof isMarket !== 'boolean' || typeof isTheatre !== 'boolean') {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid boolean fields' }) };
  }
  if (description !== undefined && typeof description !== 'string') {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid field types' }) };
  }

  // Length limits
  if (title.length > 150) {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Title too long (max 150 characters)' }) };
  }
  if (location.length > 150) {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Location too long (max 150 characters)' }) };
  }
  if (description && description.length > 2000) {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Description too long (max 2000 characters)' }) };
  }
  if (url && url.length > 500) {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'URL too long (max 500 characters)' }) };
  }

  // Format validation (regex + numeric range check)
  if (!validDate(date)) {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid date format' }) };
  }
  if (endDate && !validDate(endDate)) {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid end date format' }) };
  }
  if (time && !validTime(time)) {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid time format' }) };
  }
  if (timeEnd && !validTime(timeEnd)) {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid end time format' }) };
  }
  if (url && !validUrl(url)) {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid URL (must start with http:// or https://)' }) };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/events`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        title,
        date,
        end_date: endDate || null,
        time: time || null,
        time_end: timeEnd || null,
        is_all_day: isAllDay,
        location,
        description: description || '',
        is_free: isFree,
        is_for_kids: isForKids,
        is_music:   isMusic,
        is_sport:   isSport,
        is_market:  isMarket,
        is_theatre: isTheatre,
        url: url || null,
        status: 'pending'
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, message: 'Event submitted for review' })
    };
  } catch (error) {
    console.error('Error submitting event to Supabase:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to submit event' })
    };
  }
};
