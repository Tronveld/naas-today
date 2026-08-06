// Shared validation for every function that writes to `events`.
//
// It lives in a subdirectory because Netlify deploys every top-level file in
// `netlify/functions/` as a function. A `_validate.js` was tried first and
// `netlify dev` reported "Loaded function _validate" — the underscore
// convention does not apply here. A subdirectory is only treated as a function
// when it contains a file matching its own name, so `lib/` holding `validate.js`
// is invisible to the detector while staying a normal require away.
//
// This file exists because the three write paths each grew their own copy.
// They drifted: submit-event.js checked month lengths and leap years, while
// submit-recurring.js and admin-events.js range-checked the day 1..31 and
// stopped there. 2026-02-31 was refused from the public form and accepted from
// the recurring form — the one that turns a single bad date into 104 rows.
// tests/validator-parity.test.js runs the same inputs through all three.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Gregorian rule: every 4th year, except centuries, except every 400th.
function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function validDate(s) {
  if (!DATE_RE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  if (m < 1 || m > 12) return false;
  const maxDay = m === 2 && isLeapYear(y) ? 29 : DAYS_IN_MONTH[m - 1];
  return d >= 1 && d <= maxDay;
}

function validTime(s) {
  if (!TIME_RE.test(s)) return false;
  const [h, min] = s.split(':').map(Number);
  return h <= 23 && min <= 59;
}

function validUrl(value) {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function err400(msg) {
  return json(400, { error: msg });
}

const BOOL_KEYS = ['isAllDay', 'isFree', 'isForKids', 'isMusic', 'isSport', 'isMarket', 'isTheatre'];

const MAX_LENGTHS = { title: 150, location: 150, description: 2000, url: 500 };

/**
 * Checks the event fields shared by submit-event and submit-recurring.
 * Returns an error string, or null when the body is acceptable.
 *
 * Presence and type before length before format, so the message names the
 * first thing actually wrong rather than a downstream consequence of it.
 */
function validateEventBody(e) {
  const { title, date, endDate, time, timeEnd, isAllDay, location, description, url } = e;

  if (!title || !date || !location) return 'Missing required fields: title, date, location';
  if (!isAllDay && !time)            return 'Missing required field: time (or mark as all day)';

  if (typeof title !== 'string' || typeof date !== 'string' || typeof location !== 'string') {
    return 'Invalid field types';
  }
  if (BOOL_KEYS.some(k => typeof e[k] !== 'boolean')) return 'Invalid boolean fields';
  if (description !== undefined && typeof description !== 'string') return 'Invalid field types';

  if (title.length       > MAX_LENGTHS.title)       return 'Title too long (max 150 characters)';
  if (location.length    > MAX_LENGTHS.location)    return 'Location too long (max 150 characters)';
  if (description && description.length > MAX_LENGTHS.description) return 'Description too long (max 2000 characters)';
  if (url && url.length  > MAX_LENGTHS.url)         return 'URL too long (max 500 characters)';

  if (!validDate(date))                return 'Invalid date format';
  if (endDate && !validDate(endDate))  return 'Invalid end date format';
  if (time    && !validTime(time))     return 'Invalid time format';
  if (timeEnd && !validTime(timeEnd))  return 'Invalid end time format';
  if (url     && !validUrl(url))       return 'Invalid URL (must start with http:// or https://)';

  return null;
}

module.exports = {
  validDate, validTime, validUrl, isLeapYear,
  json, err400, validateEventBody,
  DATE_RE, TIME_RE,
};
