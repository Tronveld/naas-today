// Every write path must judge a date the same way.
// Run with: node --test
//
// The three functions that write to `events` each grew their own validDate.
// They did not agree: submit-event.js checked month lengths and leap years,
// while submit-recurring.js and admin-events.js range-checked the day 1..31
// and nothing else. So 2026-02-31 was refused from the public submit form and
// accepted from the recurring form and the admin panel — and a recurring
// series is the one that writes up to 104 rows from a single bad date.
//
// These cases run the same input through all three. They are the guard against
// a fourth fork: the bug was never that one validator was wrong, it was that
// there were three of them.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const submitEvent    = require('../netlify/functions/submit-event.js');
const submitRecurring = require('../netlify/functions/submit-recurring.js');
const adminEvents    = require('../netlify/functions/admin-events.js');

const DATE_VALIDATORS = [
  ['submit-event',     submitEvent.validDate],
  ['submit-recurring', submitRecurring.validDate],
  ['admin-events',     adminEvents.validDate],
];

const TIME_VALIDATORS = [
  ['submit-event',     submitEvent.validTime],
  ['submit-recurring', submitRecurring.validTime],
  ['admin-events',     adminEvents.validTime],
];

describe('validDate agrees across every write path', () => {
  const cases = [
    ['2026-07-20', true,  'a well-formed real date'],
    ['2026-02-31', false, 'February 31st'],
    ['2026-04-31', false, 'April 31st — a 30-day month'],
    ['2026-06-31', false, 'June 31st — a 30-day month'],
    ['2027-02-29', false, 'February 29th in a non-leap year'],
    ['2028-02-29', true,  'February 29th in a leap year'],
    ['1900-02-29', false, 'February 29th in 1900 — the century rule'],
    ['2000-02-29', true,  'February 29th in 2000 — the 400-year rule'],
    ['2026-13-01', false, 'a month above twelve'],
    ['2026-00-15', false, 'a month of zero'],
    ['2026-07-00', false, 'a day of zero'],
    ['20-07-2026', false, 'a malformed date string'],
    ['tomorrow',   false, 'a non-date entirely'],
  ];

  for (const [input, expected, label] of cases) {
    test(`${expected ? 'accepts' : 'rejects'} ${label}`, () => {
      for (const [name, validDate] of DATE_VALIDATORS) {
        assert.equal(validDate(input), expected, `${name} disagrees on "${input}"`);
      }
    });
  }
});

describe('validTime agrees across every write path', () => {
  const cases = [
    ['18:30',    true,  'an evening start time'],
    ['18:30:00', true,  'a time with seconds'],
    ['00:00',    true,  'midnight'],
    ['23:59',    true,  'the last minute of the day'],
    ['24:00',    false, 'twenty-four hundred hours'],
    ['12:60',    false, 'sixty minutes'],
    ['1830',     false, 'a time without a colon'],
  ];

  for (const [input, expected, label] of cases) {
    test(`${expected ? 'accepts' : 'rejects'} ${label}`, () => {
      for (const [name, validTime] of TIME_VALIDATORS) {
        assert.equal(validTime(input), expected, `${name} disagrees on "${input}"`);
      }
    });
  }
});
