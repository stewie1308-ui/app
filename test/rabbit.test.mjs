import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeRelated } from '../scripts/related.mjs';
import { pickRabbit, addRabbit } from '../www/js/rabbit.js';
import { startSession, makeRng } from '../www/js/session.js';
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
  { id: 'b', topic: 'science', related: ['a'] },
  { id: 'c', topic: 'science', related: [] },
  { id: 'd', topic: 'history', related: [] },
];
const byId = new Map(cards.map((x) => [x.id, x]));

test('pickRabbit returns the first related card not yet seen and not already queued', () => {
  const s = defaultState();
  s.cards.b = { box: 1 };
  s.session = { day: 'd', queue: [{ id: 'a', kind: 'new' }], index: 1, results: [] };
  assert.equal(pickRabbit(byId.get('a'), s, byId), 'c');
  s.session.queue.push({ id: 'c', kind: 'new' });
  assert.equal(pickRabbit(byId.get('a'), s, byId), null);
});

test('pickRabbit ignores related ids that no longer exist', () => {
  const s = defaultState();
  s.session = { day: 'd', queue: [], index: 0, results: [] };
  assert.equal(pickRabbit({ id: 'x', related: ['ghost'] }, s, byId), null);
});

test('addRabbit puts the related card next in the session', () => {
  let s = startSession(cards, { ...defaultState(), settings: { sessionSize: 3 } }, '2026-11-22', makeRng(1));
  s = { ...s, session: { ...s.session, index: 1 } };
  const before = s.session.queue.length;
  const next = addRabbit(s, 'zz');
  assert.equal(next.session.queue.length, before + 1);
  assert.deepEqual(next.session.queue[1], { id: 'zz', kind: 'rabbit' });
  assert.equal(s.session.queue.length, before); // original untouched
});
