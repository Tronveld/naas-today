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

const { validDate, validTime, validUrl, json, err400, validateEventBody } = require('./lib/validate');

// Re-exported for tests only — the Netlify runtime uses `handler` below.
exports.validDate = validDate;
exports.validTime = validTime;
exports.validUrl = validUrl;

exports.handler = async function(event, context) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'text/plain' }, body: 'Method Not Allowed' };
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars');
    return json(500, { error: 'Server not configured' });
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
    return err400('Invalid JSON');
  }

  const { title, date, endDate, time, timeEnd, isAllDay, location, description, isFree, isForKids, isMusic, isSport, isMarket, isTheatre, url } = data;

  const invalid = validateEventBody(data);
  if (invalid) return err400(invalid);

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
        status: 'pending',
        // A person wrote this, so it needs a person to read it. The vetted
        // feeds auto-approve; anything tagged 'submission' is what the daily
        // notify script emails about.
        source: 'submission'
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err);
    }

    return json(200, { success: true, message: 'Event submitted for review' });
  } catch (error) {
    console.error('Error submitting event to Supabase:', error);
    return json(500, { error: 'Failed to submit event' });
  }
};
