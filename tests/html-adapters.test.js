// HTML source adapters for the scraper — scripts/scrape-sources.js
// Run with: node --test
//
// Naas Racecourse and Lawlor's publish no JSON-LD and no API, so each
// has a parser that turns its page into schema.org Event shapes for the shared
// isNaasEvent → jsonLdToEvent → isDuplicate pipeline. The fixtures below are
// trimmed from the live pages as fetched on 2026-09-25.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  parseNaasRacecourse, parseLawlors,
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
