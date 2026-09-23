// Netlify function – submit a recurring event series
// Each occurrence is stored as a separate row with a shared recurring_group_id.
// Rate-limited at 5/IP/hour (separate counter from submit-event).

const crypto = require('crypto');
const { validDate, validTime, validUrl, json, err400, validateEventBody } = require('./lib/validate');
const { generateDates, addDays, daysBetween } = require('./lib/recurrence');

const VALID_FREQUENCIES = ['weekly', 'fortnightly', 'monthly'];

const { rateLimiter, clientIp } = require('./lib/rate-limit');
const submissions = rateLimiter(5, 60 * 60 * 1000); // 5 per IP per hour

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

  if (submissions.hit(clientIp(event))) {
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
  // An occurrence that lasts until the next one starts is the series' end typed
  // into the event's end date: every row then covers every day of the series.
  if (endDate && dates[1] && endDate >= dates[1]) {
    return err400('The end date is for one occurrence; it must be before the next one starts');
  }

  // Build rows
  // A multi-day event keeps its span on every occurrence. Copying the first
  // occurrence's end_date left every later row ending before it began, and
  // no day's "date <= X <= end_date" check ever matched it.
  const span = endDate ? daysBetween(date, endDate) : null;
  const groupId = crypto.randomUUID();
  const rows = dates.map(d => ({
    title,
    date: d,
    end_date: span === null ? null : addDays(d, span),
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
