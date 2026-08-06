// Netlify function – submit a recurring event series
// Each occurrence is stored as a separate row with a shared recurring_group_id.
// Rate-limited at 5/IP/hour (separate counter from submit-event).

const crypto = require('crypto');
const { validDate, validTime, validUrl, json, err400, validateEventBody } = require('./lib/validate');

const VALID_FREQUENCIES = ['weekly', 'fortnightly', 'monthly'];
const MAX_OCCURRENCES = 104;

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

function generateDates(startDate, frequency, endDate) {
  const dates = [];
  let cur = new Date(startDate + 'T00:00:00');
  while (true) {
    const s = cur.toISOString().slice(0, 10);
    if (s > endDate || dates.length >= MAX_OCCURRENCES) break;
    dates.push(s);
    if (frequency === 'weekly') {
      cur.setDate(cur.getDate() + 7);
    } else if (frequency === 'fortnightly') {
      cur.setDate(cur.getDate() + 14);
    } else {
      // monthly — same day-of-month
      cur.setMonth(cur.getMonth() + 1);
    }
  }
  return dates;
}

// Re-exported for tests only — the Netlify runtime uses `handler` below.
exports.validDate = validDate;
exports.validTime = validTime;
exports.validUrl = validUrl;

exports.handler = async function(event) {
  const SUPABASE_URL     = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'text/plain' }, body: 'Method Not Allowed' };
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars');
    return json(500, { error: 'Server not configured' });
  }

  // Rate limiting
  const ip = event.headers['x-nf-client-connection-ip']
    || event.headers['x-forwarded-for']?.split(',')[0].trim()
    || 'unknown';
  if (isRateLimited(ip)) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '3600' },
      body: JSON.stringify({ error: 'Too many submissions. Please try again later.' }),
    };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return err400('Invalid JSON');
  }

  const { baseEvent, recurrence } = data || {};

  if (!baseEvent || typeof baseEvent !== 'object') return err400('Missing baseEvent');
  if (!recurrence || typeof recurrence !== 'object') return err400('Missing recurrence');

  const {
    title, date, endDate, time, timeEnd, isAllDay,
    location, description, isFree, isForKids, isMusic, isSport, isMarket, isTheatre, url,
  } = baseEvent;

  const invalid = validateEventBody(baseEvent);
  if (invalid) return err400(invalid);

  // Recurrence validation
  const { frequency, endDate: recEndDate } = recurrence;
  if (!VALID_FREQUENCIES.includes(frequency)) {
    return err400('recurrence.frequency must be "weekly", "fortnightly", or "monthly"');
  }
  if (!recEndDate || !validDate(recEndDate)) {
    return err400('recurrence.endDate must be a valid date (YYYY-MM-DD)');
  }
  if (recEndDate <= date) {
    return err400('recurrence.endDate must be after the event start date');
  }

  // Generate dates
  const dates = generateDates(date, frequency, recEndDate);
  if (dates.length === 0) {
    return err400('No occurrences generated — check recurrence.endDate');
  }

  // Build rows
  const groupId = crypto.randomUUID();
  const rows = dates.map(d => ({
    title,
    date: d,
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
    source: 'submission',   // written by a person — see submit-event.js
    recurring_group_id: groupId,
  }));

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/events`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(rows),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText);
    }

    return json(200, { success: true, count: rows.length, recurring_group_id: groupId });
  } catch (error) {
    console.error('Error submitting recurring events to Supabase:', error);
    return json(500, { error: 'Failed to submit events' });
  }
};
