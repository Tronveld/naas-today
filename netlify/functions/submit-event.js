// Netlify function – submit a new event (saved as 'pending' for review)
exports.handler = async function(event, context) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server not configured' })
    };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { title, date, endDate, time, timeEnd, isAllDay, location, description, isFree, isForKids, url } = data;

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
        is_all_day: Boolean(isAllDay),
        location,
        description: description || '',
        is_free: Boolean(isFree),
        is_kids_friendly: Boolean(isForKids),
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
