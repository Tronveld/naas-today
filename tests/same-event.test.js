// Duplicate detection across fetchers — isSameEvent in scripts/lib.js
// Run with: node --test
//
// Found 2026-10-23, when three events showed twice on the same day:
//   - "Enya Martin - Acting The Divil" / "Enya Martin: Acting The Divil" — the
//     title check folded dash variants but treated a colon as a different
//     separator.
//   - "Bill Laurence" (whatsontonight.ie) / "Music Network Presents Bill Laurance"
//     (kildareheritage.com) — two sites, one misspelling, no shared prefix. Only
//     date, time and venue say it is one concert.
//   - "Mindful Running with Paul Spain. Week 2" / "Mindful Running for
//     Performance, Wellbeing and Enjoyment with Paul Spain. Week 2" — the library
//     retitled the event; the URL did not change.
// A title comparison alone cannot catch the last two, so the check also looks at
// the url, start time and venue — but only for titles that share a real word.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { isSameEvent, normaliseTitle } = require('../scripts/lib.js');

const ev = (o) => ({ date: '2026-10-23', time: null, location: null, url: null, ...o });

describe('isSameEvent', () => {
  test('treats a colon and a dash as the same separator', () => {
    assert.equal(normaliseTitle('Enya Martin: Acting The Divil'), normaliseTitle('Enya Martin - Acting The Divil'));
    assert.ok(isSameEvent(
      ev({ title: 'Enya Martin - Acting The Divil' }),
      ev({ title: 'Enya Martin: Acting The Divil' }),
    ));
  });

  test('matches a retitled event by its url', () => {
    const url = 'https://kildare.spydus.ie/cgi-bin/spydus.exe/ENQ/WPAC/EVSESENQ?RNI=27731020';
    assert.ok(isSameEvent(
      ev({ title: 'Mindful Running with Paul Spain. Week 2', time: '11:30:00', url }),
      ev({ title: 'Mindful Running for Performance, Wellbeing and Enjoyment with Paul Spain. Week 2', time: '11:30', url }),
    ));
  });

  test('matches across sites by time and venue when the titles share a word', () => {
    assert.ok(isSameEvent(
      ev({ title: 'Bill Laurence', time: '20:00:00', location: "St. David's Church" }),
      ev({ title: 'Music Network Presents Bill Laurance', time: '20:00', location: "St. David's Church, Naas, County Kildare" }),
    ));
  });

  test('ignores a leading "The" in the venue', () => {
    assert.ok(isSameEvent(
      ev({ title: 'Naas Country Market', time: '09:30', location: 'The Moat Theatre, Abbey Rd' }),
      ev({ title: 'Country Market at the Moat', time: '09:30:00', location: 'Moat Theatre' }),
    ));
  });

  test('keeps two different events at one venue and time apart', () => {
    assert.ok(!isSameEvent(
      ev({ title: 'Story Time', time: '10:30', location: 'Naas Library' }),
      ev({ title: 'Lego Club', time: '10:30', location: 'Naas Library' }),
    ));
  });

  test('keeps two events from one listing-page url apart', () => {
    const url = 'https://www.whatsontonight.ie/naas';
    assert.ok(!isSameEvent(
      ev({ title: 'Pauls Boogie Bingo', time: '21:45', url }),
      ev({ title: 'Trad Session', time: '21:45', url }),
    ));
  });

  test('keeps two showings of one show apart', () => {
    assert.ok(!isSameEvent(
      ev({ title: 'The Music of Lord of the Rings 7PM show', time: '19:00', url: 'https://www.moattheatre.com/shows/the-music-of-lord-of-the-rings-ja62m' }),
      ev({ title: 'The Music of Lord of the Rings 9PM show', time: '21:00', url: 'https://www.moattheatre.com/shows/the-music-of-lord-of-the-rings' }),
    ));
    assert.ok(!isSameEvent(
      ev({ title: 'Panto Club Presents: Cinderella', time: '14:00:00', url: 'https://www.moattheatre.com/shows/panto-club-presents-cinderella-d4st4' }),
      ev({ title: 'Panto Club Presents: Cinderella', time: '19:00', url: 'https://www.moattheatre.com/shows/panto-club-presents-cinderella' }),
    ));
  });

  test('a show whose time moved on its own page is still one event', () => {
    const url = 'https://www.moattheatre.com/shows/4nrqbs6ket7cpc5dghg9hece3nmi65';
    assert.ok(isSameEvent(
      ev({ title: 'Dan McCabe', time: '20:00:00', url }),
      ev({ title: 'Dan McCabe in Concert', time: '19:30', url }),
    ));
    assert.ok(isSameEvent(
      ev({ title: 'Adam Kay', time: '19:30:00', url: 'https://www.moattheatre.com/shows/adam-kay' }),
      ev({ title: 'Adam Kay: Undoctored', time: '20:00', url: 'https://www.moattheatre.com/shows/adam-kay-2027' }),
    ));
  });

  test("keeps a festival's events at different venues apart", () => {
    const url = 'https://cilldaralegaeilge.ie/seachtain2026/';
    assert.ok(!isSameEvent(
      ev({ title: 'Seachtain na Gaeilge: Reflection with Helen Doyle', time: '19:00', location: 'Naas Library', url }),
      ev({ title: 'Seachtain na Gaeilge: Sing Together Workshop', time: '19:00', location: 'Luisce Centre', url }),
    ));
  });

  test('a shared filler word is not enough', () => {
    assert.ok(!isSameEvent(
      ev({ title: 'Live Music with Paddy', time: '21:00', location: 'Lawlors' }),
      ev({ title: 'Quiz Night with Friends', time: '21:00', location: 'Lawlors' }),
    ));
  });

  test('never matches across dates', () => {
    assert.ok(!isSameEvent(
      ev({ title: 'Story Time' }),
      ev({ title: 'Story Time', date: '2026-10-24' }),
    ));
  });

  test('still matches on a title prefix', () => {
    assert.ok(isSameEvent(
      ev({ title: 'Movicals' }),
      ev({ title: 'Movicals – The Best of Movie Musicals' }),
    ));
  });
});
