// HTML source adapters for the scraper — scripts/scrape-sources.js
// Run with: node --test
//
// Naas Racecourse, Lawlor's and the Osprey publish no JSON-LD and no API, so each
// has a parser that turns its page into schema.org Event shapes for the shared
// isNaasEvent → jsonLdToEvent → isDuplicate pipeline. The fixtures below are
// trimmed from the live pages as fetched on 2026-09-25.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  parseNaasRacecourse, parseLawlors, parseOsprey,
  isNaasEvent, jsonLdToEvent,
} = require('../scripts/scrape-sources.js');

describe('parseNaasRacecourse', () => {
  const SRC = 'https://naasracecourse.com/fixtures/';
  const row = (date, race, event, slug) => `<div class="rc-right-block">
    <div class="race-date"><a href="https://naasracecourse.com/racing-event/${slug}/">${date}</a></div>
    <div class="race-name"><a href="https://naasracecourse.com/racing-event/${slug}/">${race}</a></div>
    <div class="race-event"><a href="https://naasracecourse.com/racing-event/${slug}/">${event}</a></div> </div>`;
  const html = `<div class="race-calender-main mobile-race-hide">
    <div class="race-event-block race-event-header"> <div class="race-month"> Month </div>
      <div class="rc-right-block"> <div class="race-date">Date</div> <div class="race-name">Feature Race</div> <div class="race-event">Event</div> </div> </div>
    <div class="race-event-block block-events"> <div class="race-month"> October 2026 </div> <div class="race-right-content-main">
      ${row('Saturday 10th', 'Irish Stallion Farms EBF Birdcatcher Premier Nursery Handicap', 'Day 1 &#8211; October Weekend Meeting', 'day-1-october-weekend-meeting-2026')}
      ${row('Sunday 11th', 'The Irish EBF Auction Series Race Final', 'Day 2 &#8211; October Weekend Meeting', 'day-2-october-weekend-meeting-2026')}
    </div> </div>
    <div class="race-event-block block-events"> <div class="race-month"> November 2026 </div> <div class="race-right-content-main">
      ${row('Sunday 8th', 'Barberstown Castle Steeplechase (Grade 3)', 'Return Of The Jumps', 'return-of-the-jumps-2026')}
    </div> </div></div>`;

  test('the day comes from the row and the month and year from its block', () => {
    assert.deepEqual(parseNaasRacecourse(html, SRC).map(e => [e.name, e.startDate]), [
      ['Racing at Naas: Day 1 – October Weekend Meeting', '2026-10-10'],
      ['Racing at Naas: Day 2 – October Weekend Meeting', '2026-10-11'],
      ['Racing at Naas: Return Of The Jumps', '2026-11-08'],
    ]);
  });

  test('names the feature race and links the fixture page', () => {
    const e = parseNaasRacecourse(html, SRC)[2];
    assert.equal(e.description, 'Feature race: Barberstown Castle Steeplechase (Grade 3).');
    assert.equal(e.url, 'https://naasracecourse.com/racing-event/return-of-the-jumps-2026/');
    assert.deepEqual(e.categories, ['sport']);
    assert.ok(isNaasEvent(e));
  });
});

describe('parseLawlors', () => {
  const SRC = 'https://www.lawlors.ie/live-music-events.html';
  const html = `
    <p>We also have live music every Friday and Saturday in our main bar from 9.30pm.</p>
    <h3 class="MsoNormal"><span lang="EN-GB">Elvis Spectacular plus The Get Back Beatles - 25th October 2026</span></h3>
    <p>&nbsp;</p><p>Two legendary acts. One unforgettable night.</p>
    <p>&nbsp;Tickets available online at:&nbsp;<a href="https://www.downdaroad.com/tickets.html">Downda Road</a></p>
    <h3 class="MsoNormal">&nbsp;</h3>
    <h3 class="MsoNormal"><span lang="EN-GB">Cash Returns Live at Lawlor's of Naas - The Man In Black Tour - Sunday 27th December 2026</span></h3>
    <p>Make the most of the festive season.</p>
    <h3>Book to Dine:</h3>`;

  test('splits the heading into title and date, dropping the weekday', () => {
    const events = parseLawlors(html, SRC);
    assert.deepEqual(events.map(e => [e.name, e.startDate]), [
      ['Elvis Spectacular plus The Get Back Beatles', '2026-10-25'],
      ["Cash Returns Live at Lawlor's of Naas - The Man In Black Tour", '2026-12-27'],
    ]);
  });

  test('uses the ticket link and cuts the ticket line from the description', () => {
    const [elvis, cash] = parseLawlors(html, SRC);
    assert.equal(elvis.url, 'https://www.downdaroad.com/tickets.html');
    assert.equal(elvis.description, 'Two legendary acts. One unforgettable night.');
    assert.equal(cash.url, SRC);
    assert.deepEqual(elvis.categories, ['music']);
    assert.ok(isNaasEvent(elvis));
  });
});

describe('parseOsprey', () => {
  const SRC = 'https://www.ospreyhotel.ie/events-guide';
  const wrap = (body) => `<h1>Events Guide at Osprey Hotel</h1> ${body} </main><footer><b>Stay Connected</b></footer>`;
  const dates = (body) => parseOsprey(wrap(body), SRC).map(e => [e.name, e.startDate, e.endDate || null]);

  test('one bold title, one italic date', () => {
    assert.deepEqual(dates('<p><b>Mamma Mia Brunch<br /></b><em>Saturday, 8th August, 2026</em></p>'),
      [['Mamma Mia Brunch', '2026-08-08', null]]);
  });

  test('a slash list gives one event per date; a missing year carries from the left', () => {
    assert.deepEqual(dates('<p><b>Bingo Loco<br /></b><em>Saturday &#8211; 19th June 2026 / 15th August 2026 / 26th September / 13th November</em></p>'), [
      ['Bingo Loco', '2026-06-19', null], ['Bingo Loco', '2026-08-15', null],
      ['Bingo Loco', '2026-09-26', null], ['Bingo Loco', '2026-11-13', null],
    ]);
  });

  test('"5th & 12th December" is two nights', () => {
    assert.deepEqual(dates('<p><b>Shared Christmas Party Nights<br /></b><i>Saturday, 5th &amp; 12th December 2026<br /></i>A festive night.</p>'), [
      ['Shared Christmas Party Nights', '2026-12-05', null], ['Shared Christmas Party Nights', '2026-12-12', null],
    ]);
  });

  test('a dash between two dates is a range, taking its year from the end', () => {
    assert.deepEqual(dates('<p><b>Punchestown Festival<br /></b><i>27th April &#8211; 1st May 2026<br /></i></p>'),
      [['Punchestown Festival', '2026-04-27', '2026-05-01']]);
  });

  test('a year-less date takes the last year written above it, never a guessed one', () => {
    assert.deepEqual(dates(
      '<p><b>Mamma Mia Brunch<br /></b><em>Saturday, 8th August, 2026</em></p>' +
      '<p><b>DAREcon<br /></b><em>Saturday &amp; Sunday &#8211; 17th &amp; 18th October <br /></em>A board gaming convention.</p>'
    ).slice(1), [['DAREcon', '2026-10-17', null], ['DAREcon', '2026-10-18', null]]);
    assert.deepEqual(dates('<p><b>Bingo Loco<br /></b><em>Saturday &#8211; 13th November </em></p>'), [],
      'no year anywhere on the page: skipped');
  });

  test('a date with no day is skipped; a title and date both in bold still pair', () => {
    assert.deepEqual(dates(
      '<p><b>Easter Family Escapes<br /></b><em>April, 2026</em></p>' +
      '<p><b>Comedy Club : Dave McSavage</b></p><p><b><i>Friday, 1st January 2027</i></b></p>'
    ), [['Comedy Club : Dave McSavage', '2027-01-01', null]]);
  });

  test('description is the text under the date, without the call to action', () => {
    const [e] = parseOsprey(wrap(
      '<p><b>DAREcon<br /></b><em>17th &amp; 18th October 2026<br /></em>A board gaming convention in Naas.</p>' +
      '<p><a href="https://darecon.ie/">Buy Your Tickets Here</a></p><p><b>Next<br /></b></p>'), SRC);
    assert.equal(e.description, 'A board gaming convention in Naas.');
    assert.equal(e.url, SRC);
    assert.ok(isNaasEvent(e));
  });

  test('the last entry stops at the next heading, not the page footer', () => {
    const [e] = parseOsprey(wrap(
      '<p><b>Comedy Club : Dave McSavage</b></p><p><b><i>Friday, 1st January 2027</i></b></p><p> </p>' +
      '<h2><a href="http://www.ospreyspa.ie">Osprey Spa</a></h2> And enjoy a free drink with your dinner'), SRC);
    assert.equal(e.description, '');
  });

  test('flows through jsonLdToEvent as a dated, all-day row', () => {
    const [e] = parseOsprey(wrap('<p><b>DAREcon<br /></b><em>17th October 2026</em></p>'), SRC);
    const row = jsonLdToEvent(e, SRC);
    assert.equal(row.date, '2026-10-17');
    assert.equal(row.location, 'Osprey Hotel, Naas');
    assert.equal(row.is_all_day, true);
  });
});
