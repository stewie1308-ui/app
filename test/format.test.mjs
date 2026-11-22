import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatYear, formatValue, orderOptions, greeting } from '../www/js/format.js';

test('formatYear handles deep time, BC, AD and the present', () => {
  assert.equal(formatYear(-13800000000), '13.8 billion years ago');
  assert.equal(formatYear(-450000000), '450 million years ago');
  assert.equal(formatYear(-67000000), '67 million years ago');
  assert.equal(formatYear(-2560), '2560 BC');
  assert.equal(formatYear(1096), '1096');
  assert.equal(formatYear(859), 'AD 859');
  assert.equal(formatYear(0), 'Today');
});

test('formatValue uses UK thousands separators and trims decimals', () => {
  assert.equal(formatValue(30000), '30,000');
  assert.equal(formatValue(0.69), '0.69');
  assert.equal(formatValue(2.0), '2');
});

test('orderOptions shuffles deterministically and tracks the answer', () => {
  const q = { prompt: 'Q', options: ['Right', 'Wrong A', 'Wrong B'], answer: 0 };
  const a = orderOptions(q, 's001|2026-11-22');
  const b = orderOptions(q, 's001|2026-11-22');
  assert.deepEqual(a, b);
  assert.equal(a.options[a.answer], 'Right');
  assert.deepEqual([...a.options].sort(), [...q.options].sort());
});

test('orderOptions does not always put the right answer first', () => {
  const q = { prompt: 'Q', options: ['Right', 'Wrong A', 'Wrong B'], answer: 0 };
  const positions = new Set(Array.from({ length: 30 }, (_, i) => orderOptions(q, `c${i}|d`).answer));
  assert.ok(positions.size > 1);
});

test('greeting follows the time of day', () => {
  assert.equal(greeting(7), 'Good morning.');
  assert.equal(greeting(14), 'Good afternoon.');
  assert.equal(greeting(19), 'Good evening.');
  assert.equal(greeting(23), 'Still up?');
  assert.equal(greeting(3), 'Still up?');
});
