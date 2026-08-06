// Covers src/scripts/draft.js — the serialise/apply pair behind the submit
// form's draft persistence. The DOM wiring around it (event dispatch, storage,
// the modal) is not testable here and has to be checked in a browser; this
// pins the field-shape logic, which is where the branches are.
//
// `serialise`/`apply` only ever touch type/id/name/value/checked and iterate
// with forEach, so a plain array of plain objects stands in for the NodeList.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serialise, apply } from '../src/scripts/draft.js';

const field = (o) => ({ type: 'text', id: '', name: '', value: '', checked: false, ...o });

const timeModeRadios = (checked) => [
  field({ type: 'radio', name: 'timeMode', value: 'specific', checked: checked === 'specific' }),
  field({ type: 'radio', name: 'timeMode', value: 'range',    checked: checked === 'range' }),
  field({ type: 'radio', name: 'timeMode', value: 'allday',   checked: checked === 'allday' }),
];

test('serialise keeps typed text and drops empty fields', () => {
  const fields = [
    field({ id: 'eventTitle', value: 'Trad Session' }),
    field({ id: 'eventUrl', value: '' }),
    field({ id: 'eventDate', type: 'date', value: '2026-08-14' }),
  ];
  assert.deepEqual(serialise(fields), { eventTitle: 'Trad Session', eventDate: '2026-08-14' });
});

test('serialise records checkboxes even when unchecked', () => {
  // Unlike text, false is meaningful: the visitor may have deliberately
  // unticked a box, and omitting it would let apply() leave it ticked.
  const fields = [
    field({ type: 'checkbox', id: 'isFree', checked: true }),
    field({ type: 'checkbox', id: 'isForKids', checked: false }),
  ];
  assert.deepEqual(serialise(fields), { isFree: true, isForKids: false });
});

test('serialise records only the checked radio, keyed by name', () => {
  assert.deepEqual(serialise(timeModeRadios('range')), { timeMode: 'range' });
});

test('apply restores values and checks the right radio', () => {
  const fields = [
    field({ id: 'eventTitle' }),
    field({ type: 'checkbox', id: 'isFree' }),
    ...timeModeRadios('specific'),
  ];
  apply(fields, { eventTitle: 'Trad Session', isFree: true, timeMode: 'allday' });

  assert.equal(fields[0].value, 'Trad Session');
  assert.equal(fields[1].checked, true);
  assert.deepEqual(fields.slice(2).map(r => r.checked), [false, false, true]);
});

test('apply leaves fields the draft never mentions alone', () => {
  const fields = [field({ id: 'eventLocation', value: 'The Storehouse' })];
  apply(fields, { eventTitle: 'Trad Session' });
  assert.equal(fields[0].value, 'The Storehouse');
});

test('a full round trip returns the form to where it was', () => {
  const before = [
    field({ id: 'eventTitle', value: 'Farmers Market' }),
    field({ id: 'eventDescription', type: 'textarea', value: 'Every Saturday on the square.' }),
    field({ id: 'eventUrl', value: '' }),
    field({ id: 'recurrenceFrequency', type: 'select-one', value: 'weekly' }),
    field({ type: 'checkbox', id: 'isFree', checked: true }),
    field({ type: 'checkbox', id: 'isMusic', checked: false }),
    ...timeModeRadios('range'),
  ];
  const after = [
    field({ id: 'eventTitle' }),
    field({ id: 'eventDescription', type: 'textarea' }),
    field({ id: 'eventUrl' }),
    field({ id: 'recurrenceFrequency', type: 'select-one' }),
    field({ type: 'checkbox', id: 'isFree' }),
    field({ type: 'checkbox', id: 'isMusic' }),
    ...timeModeRadios('specific'),
  ];

  apply(after, JSON.parse(JSON.stringify(serialise(before))));
  assert.deepEqual(after, before);
});
