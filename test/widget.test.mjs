import { test } from 'node:test';
import assert from 'node:assert/strict';
import { widgetPayload } from '../www/js/widget.js';
import { defaultState } from '../www/js/storage.js';

const card = (id, topic = 'science') => ({ id, topic, title: `T ${id}`, body: `Body ${id}`, why: 'w' });
const byId = new Map(['a', 'b', 'c', 'd'].map((id) => [id, card(id)]));

test('only cards you have learned go to the widget, newest first', () => {
  const s = defaultState();
  s.cards = { a: { first: '2026-11-10' }, c: { first: '2026-11-20' }, gone: { first: '2026-11-21' } };
  const p = widgetPayload(s, byId);
  assert.deepEqual(p.facts.map((f) => f.title), ['T c', 'T a']);
  assert.deepEqual(Object.keys(p.facts[0]).sort(), ['body', 'title', 'topic', 'topicName']);
  assert.equal(p.facts[0].topicName, 'Science & space');
});

test('the widget keeps at most 30 facts', () => {
  const many = new Map(Array.from({ length: 40 }, (_, i) => [`x${i}`, card(`x${i}`)]));
  const s = defaultState();
  for (const id of many.keys()) s.cards[id] = { first: '2026-11-01' };
  assert.equal(widgetPayload(s, many).facts.length, 30);
});

test('a new learner gets an empty list (the widget shows a nudge instead)', () => {
  assert.deepEqual(widgetPayload(defaultState(), byId).facts, []);
});
