// Validators for public event submission — netlify/functions/submit-event.js
// Run with: node --test
//
// These cases are the edge cases from the throwaway curl checks in
// .claude/settings.local.json, made permanent and re-runnable.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { validDate, validTime, validUrl } = require('../netlify/functions/submit-event.js');

describe('validDate', () => {
  test('accepts a well-formed real date', () => {
    assert.equal(validDate('2026-07-20'), true);
  });

  test('rejects a month above twelve', () => {
    assert.equal(validDate('2026-13-01'), false);
  });

  test('rejects a month of zero', () => {
    assert.equal(validDate('2026-00-15'), false);
  });

  test('rejects a malformed date string', () => {
    assert.equal(validDate('20-07-2026'), false);
  });

  test('rejects a non-date entirely', () => {
    assert.equal(validDate('tomorrow'), false);
  });

  // The day is range-checked 1..31 with no reference to its month.
  test('rejects February 31st', () => {
    assert.equal(validDate('2026-02-31'), false);
  });

  test('rejects April 31st', () => {
    assert.equal(validDate('2026-04-31'), false);
  });

  // Leap years: 2028 is a leap year, 2027 is not.
  test('accepts February 29th in a leap year', () => {
    assert.equal(validDate('2028-02-29'), true);
  });

  test('rejects February 29th in a non-leap year', () => {
    assert.equal(validDate('2027-02-29'), false);
  });

  // 1900 is divisible by 4 but not a leap year (century rule); 2000 is.
  test('rejects February 29th in the year 1900', () => {
    assert.equal(validDate('1900-02-29'), false);
  });

  test('accepts February 29th in the year 2000', () => {
    assert.equal(validDate('2000-02-29'), true);
  });
});

describe('validTime', () => {
  test('accepts an evening start time', () => {
    assert.equal(validTime('18:30'), true);
  });

  test('accepts a time with seconds', () => {
    assert.equal(validTime('18:30:00'), true);
  });

  test('rejects twenty-four hundred hours', () => {
    assert.equal(validTime('24:00'), false);
  });

  test('rejects sixty minutes', () => {
    assert.equal(validTime('12:60'), false);
  });

  test('rejects a time without a colon', () => {
    assert.equal(validTime('1830'), false);
  });
});

describe('validUrl', () => {
  test('accepts an https url', () => {
    assert.equal(validUrl('https://naas.today/events'), true);
  });

  test('accepts an http url', () => {
    assert.equal(validUrl('http://example.com'), true);
  });

  test('rejects a javascript scheme url', () => {
    assert.equal(validUrl('javascript:alert(1)'), false);
  });

  test('rejects a mailto scheme url', () => {
    assert.equal(validUrl('mailto:hi@naas.today'), false);
  });

  test('rejects a string that is not a url', () => {
    assert.equal(validUrl('not a url'), false);
  });
});
