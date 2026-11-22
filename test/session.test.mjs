import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSession, startSession, currentSession, answer, makeRng } from '../www/js/session.js';
import { defaultState } from '../www/js/storage.js';

const TOPICS = ['science', 'history', 'how', 'words'];
const deck = (n) => Array.from({ length: n }, (_, i) => ({ id: `c${i}`, topic: TOPICS[i % 4] }));
const TODAY = '2026-11-22';

function withDue(state, ids, due = TODAY) {
  for (const id of ids) state.cards[id] = { box: 1, due, seen: 1, right: 1, wrong: 0, mastered: false };
  return state;
}

test('7 due reviews with size 5 gives 3 reviews then 2 new cards', () => {
  const cards = deck(20);
  const state = withDue(defaultState(), ['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6']);
  const q = buildSession(cards, state, TODAY, makeRng(1));
  assert.equal(q.length, 5);
  assert.deepEqual(q.map((x) => x.kind), ['review', 'review', 'review', 'new', 'new']);
  for (const x of q.filter((x) => x.kind === 'new')) assert.ok(!(x.id in state.cards));
});

test('few due reviews are topped up with new cards', () => {
  const state = withDue(defaultState(), ['c0']);
  const q = buildSession(deck(20), state, TODAY, makeRng(1));
  assert.equal(q.filter((x) => x.kind === 'review').length, 1);
  assert.equal(q.filter((x) => x.kind === 'new').length, 4);
});

test('no new cards left means all slots go to reviews', () => {
  const cards = deck(6);
  const state = withDue(defaultState(), cards.map((c) => c.id));
  const q = buildSession(cards, state, TODAY, makeRng(1));
  assert.equal(q.length, 5);
  assert.ok(q.every((x) => x.kind === 'review'));
});

test('nothing due and nothing new gives an empty session', () => {
  const cards = deck(3);
  const state = withDue(defaultState(), cards.map((c) => c.id), '2026-12-25');
  assert.deepEqual(buildSession(cards, state, TODAY, makeRng(1)), []);
});

test('reviews not yet due and mastered cards are left out', () => {
  const cards = deck(2);
  const state = withDue(defaultState(), ['c0'], '2026-11-23');
  state.cards.c1 = { box: 5, due: '2026-11-01', seen: 5, right: 5, wrong: 0, mastered: true };
  assert.deepEqual(buildSession(cards, state, TODAY, makeRng(1)), []);
});

test('the most overdue reviews come first', () => {
  const state = withDue(defaultState(), ['c1'], '2026-11-21');
  withDue(state, ['c2'], '2026-11-10');
  const q = buildSession(deck(3), state, TODAY, makeRng(1));
  assert.deepEqual(q.slice(0, 2).map((x) => x.id), ['c2', 'c1']);
});

test('new cards rotate through all four topics', () => {
  const state = defaultState();
  state.settings.sessionSize = 4;
  const q = buildSession(deck(40), state, TODAY, makeRng(7));
  const topics = q.map((x) => deck(40).find((c) => c.id === x.id).topic);
  assert.equal(new Set(topics).size, 4);
});

test('session size setting is respected', () => {
  const state = defaultState();
  state.settings.sessionSize = 10;
  assert.equal(buildSession(deck(40), state, TODAY, makeRng(1)).length, 10);
});

test('a stale session from yesterday is dropped but card progress is kept', () => {
  let state = startSession(deck(10), defaultState(), '2026-11-21', makeRng(1));
  const first = state.session.queue[0];
  state = answer(state, '2026-11-21', { ...first, correct: true, sure: true });
  assert.equal(currentSession(state, '2026-11-22'), null);
  assert.ok(state.cards[first.id]);
});

test('a session started today can be resumed where it was left', () => {
  let state = startSession(deck(10), defaultState(), TODAY, makeRng(1));
  state = answer(state, TODAY, { ...state.session.queue[0], correct: true, sure: false });
  const s = currentSession(state, TODAY);
  assert.equal(s.index, 1);
});

test('answering grades the card, advances, records the result and the streak', () => {
  let state = startSession(deck(10), defaultState(), TODAY, makeRng(1));
  const item = state.session.queue[0];
  state = answer(state, TODAY, { ...item, correct: false, sure: false });
  assert.equal(state.cards[item.id].box, 0);
  assert.equal(state.session.index, 1);
  assert.deepEqual(state.session.results[0], { id: item.id, kind: item.kind, correct: false, sure: false });
  assert.equal(state.streak.count, 1);
});

test('a confident miss adds a recheck to the end of the session, once', () => {
  let state = startSession(deck(10), defaultState(), TODAY, makeRng(1));
  const item = state.session.queue[0];
  const len = state.session.queue.length;
  state = answer(state, TODAY, { ...item, correct: false, sure: true });
  assert.equal(state.session.queue.length, len + 1);
  assert.deepEqual(state.session.queue.at(-1), { id: item.id, kind: 'recheck' });
  // Missing the recheck confidently again does not add another
  state.session.index = state.session.queue.length - 1;
  state = answer(state, TODAY, { id: item.id, kind: 'recheck', correct: false, sure: true });
  assert.equal(state.session.queue.length, len + 1);
});

test('a recheck does not grade the card a second time', () => {
  let state = startSession(deck(10), defaultState(), TODAY, makeRng(1));
  const item = state.session.queue[0];
  state = answer(state, TODAY, { ...item, correct: false, sure: true });
  const before = { ...state.cards[item.id] };
  state.session.index = state.session.queue.length - 1;
  state = answer(state, TODAY, { id: item.id, kind: 'recheck', correct: true, sure: true });
  assert.deepEqual(state.cards[item.id], before);
});

test('answer does not mutate the state it was given', () => {
  const s0 = startSession(deck(10), defaultState(), TODAY, makeRng(1));
  const snapshot = JSON.stringify(s0);
  answer(s0, TODAY, { ...s0.session.queue[0], correct: true, sure: false });
  assert.equal(JSON.stringify(s0), snapshot);
});
