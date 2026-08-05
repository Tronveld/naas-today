// Netlify function – submit a recurring event series
// Each occurrence is stored as a separate row with a shared recurring_group_id.
// Rate-limited at 5/IP/hour (separate counter from submit-event).

const crypto = require('crypto');

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
const VALID_FREQUENCIES = ['weekly', 'fortnightly', 'monthly'];
const MAX_OCCURRENCES = 104;

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

function err400(msg) {
  return {
    statusCode: 400,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: msg }),
  };
}

exports.handler = async function(event) {
  const SUPABASE_URL     = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'text/plain' }, body: 'Method Not Allowed' };
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server not configured' }),
    };
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

  // Required presence
  if (!title || !date || !location) return err400('Missing required fields: title, date, location');
  if (!isAllDay && !time) return err400('Missing required field: time (or mark as all day)');

  // Type checks
  if (typeof title !== 'string' || typeof date !== 'string' || typeof location !== 'string') {
    return err400('Invalid field types');
  }
  if (typeof isAllDay !== 'boolean' || typeof isFree !== 'boolean' || typeof isForKids !== 'boolean' ||
      typeof isMusic !== 'boolean' || typeof isSport !== 'boolean' || typeof isMarket !== 'boolean' || typeof isTheatre !== 'boolean') {
    return err400('Invalid boolean fields');
  }
  if (description !== undefined && typeof description !== 'string') return err400('Invalid field types');

  // Length limits
  if (title.length > 150)                         return err400('Title too long (max 150 characters)');
  if (location.length > 150)                      return err400('Location too long (max 150 characters)');
  if (description && description.length > 2000)   return err400('Description too long (max 2000 characters)');
  if (url && url.length > 500)                    return err400('URL too long (max 500 characters)');

  // Format validation
  if (!validDate(date))                           return err400('Invalid date format');
  if (endDate && !validDate(endDate))             return err400('Invalid end date format');
  if (time && !validTime(time))                   return err400('Invalid time format');
  if (timeEnd && !validTime(timeEnd))             return err400('Invalid end time format');
  if (url && !validUrl(url))                      return err400('Invalid URL (must start with http:// or https://)');

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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, count: rows.length, recurring_group_id: groupId }),
    };
  } catch (error) {
    console.error('Error submitting recurring events to Supabase:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to submit events' }),
    };
  }
};
