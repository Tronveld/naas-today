// Netlify function to submit feedback to an external webhook

// Rate limit: max 10 submissions per IP per hour
const rateLimitMap = new Map();
const RATE_LIMIT   = 10;
const RATE_WINDOW  = 60 * 60 * 1000;

function isRateLimited(ip) {
  const now   = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

function validUrl(value) {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

exports.handler = async function(event) {
  const FEEDBACK_WEBHOOK = process.env.FEEDBACK_WEBHOOK_URL || '';

  const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://naastoday.com',
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'text/plain' }, body: 'Method Not Allowed' };
  }

  // Rate limiting — prefer Netlify's non-spoofable header over x-forwarded-for
  const ip = event.headers['x-nf-client-connection-ip']
    || event.headers['x-forwarded-for']?.split(',')[0].trim()
    || 'unknown';
  if (isRateLimited(ip)) {
    return {
      statusCode: 429,
      headers: { ...CORS_HEADERS, 'Retry-After': '3600' },
      body: JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    };
  }

  let feedback;
  try {
    feedback = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { response: feedbackResponse, comment, timestamp, url } = feedback || {};

  if (!feedbackResponse || typeof feedbackResponse !== 'string' || feedbackResponse.length > 50) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid feedback response' }) };
  }
  if (comment !== undefined && (typeof comment !== 'string' || comment.length > 1000)) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Comment too long (max 1000 characters)' }) };
  }
  // Validate optional timestamp: must be a string within a reasonable length
  if (timestamp !== undefined && (typeof timestamp !== 'string' || timestamp.length > 50)) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid timestamp' }) };
  }
  // Validate optional url: must be a valid http/https URL
  if (url !== undefined && (typeof url !== 'string' || url.length > 500 || !validUrl(url))) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid url' }) };
  }

  try {
    if (FEEDBACK_WEBHOOK) {
      await fetch(FEEDBACK_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: feedbackResponse,
          comment: comment || '',
          timestamp,
          url,
        }),
      });
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: true, message: 'Feedback received' }),
    };
  } catch (error) {
    console.error('Error processing feedback:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Failed to process feedback' }),
    };
  }
};
