import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeRelated } from '../scripts/related.mjs';
import { rabbitTrail, markRead } from '../www/js/rabbit.js';
import { defaultState } from '../www/js/storage.js';

const c = (id, title, body, topic = 'science') => ({ id, topic, title, body, why: '' });
const deck = [
  c('a', 'Venus spins slowly', 'Venus takes 243 days to rotate, longer than its orbit around the Sun.'),
  c('b', 'Venus is the hottest planet', 'Thick carbon dioxide on Venus traps heat from the Sun; the surface reaches 465 degrees.'),
  c('c', 'Honey keeps forever', 'Sealed honey resists microbes because it has little water.'),
  c('d', 'Bees dance directions', 'Honeybees waggle to show where flowers are, then store sealed honey.'),
];

test('computeRelated links cards that share distinctive words, never itself', () => {
  const rel = computeRelated(deck, 2);
  assert.equal(rel.a[0], 'b');
  assert.equal(rel.c[0], 'd');
  assert.ok(!rel.a.includes('a'));
  assert.ok(rel.a.length <= 2);
});

test('computeRelated needs more than one shared word', () => {
  const rel = computeRelated([c('x', 'Black Death', 'Plague killed many in Europe.'), c('y', 'Black boxes', 'Flight recorders are orange.')], 2);
  assert.deepEqual(rel.x, []);
});

test('shared subject tags link cards even with different wording, and beat coincidental words', () => {
  const cards = [
    { ...c('g', 'Giraffe necks', 'Seven long bones in mammals.'), tags: ['animal-bodies', 'mammals'] },
    { ...c('e', 'Elephants cannot jump', 'Heavy legs like pillars.'), tags: ['animal-bodies', 'mammals'] },
    { ...c('n', 'Ants weigh more', 'More than all wild mammals and birds combined, seven ways.'), tags: ['insects'] },
  ];
  assert.deepEqual(computeRelated(cards, 1).g, ['e']);
});

test('computeRelated leaves out cards with nothing in common', () => {
  const rel = computeRelated(deck, 3);
  assert.ok(!rel.a.includes('c'));
});

const cards = [
  { id: 'a', topic: 'science', related: ['b', 'c'] },
  { id: 'b', topic: 'science', related: ['a', 'd'] },
  { id: 'c', topic: 'science', related: ['a'] },
  { id: 'd', topic: 'history', related: ['e'] },
  { id: 'e', topic: 'history', related: [] },
];
const byId = new Map(cards.map((x) => [x.id, x]));

test('rabbitTrail gives related facts to read, skipping ones already shown', () => {
  assert.deepEqual(rabbitTrail(byId.get('a'), byId, new Set(['a']), 2), ['b', 'c']);
  assert.deepEqual(rabbitTrail(byId.get('a'), byId, new Set(['a', 'b']), 1), ['c']);
});

test('rabbitTrail digs a level deeper when the first level runs out', () => {
  assert.deepEqual(rabbitTrail(byId.get('a'), byId, new Set(['a']), 3), ['b', 'c', 'd']);
});

test('rabbitTrail ignores related ids that no longer exist', () => {
  assert.deepEqual(rabbitTrail({ id: 'x', related: ['ghost', 'e'] }, byId, new Set(['x']), 3), ['e']);
});

test('markRead files unseen facts as learned so they come back as review questions tomorrow', () => {
  const s = defaultState();
  s.cards.b = { box: 3, due: '2026-12-01', seen: 4, right: 4, wrong: 0, mastered: false, first: '2026-11-01' };
  const next = markRead(s, ['b', 'c'], '2026-11-22');
  assert.deepEqual(next.cards.b, s.cards.b); // already known: untouched
  assert.deepEqual(next.cards.c, { box: 0, due: '2026-11-23', seen: 0, right: 0, wrong: 0, mastered: false, first: '2026-11-22', read: true });
  assert.equal(s.cards.c, undefined); // original untouched
  assert.equal(next.streak.count, s.streak.count); // reading isn't answering
});
