import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recapWeek, computeRecap } from '../www/js/recap.js';
import { grade } from '../www/js/srs.js';
import { answer, startSession, makeRng } from '../www/js/session.js';
import { defaultState } from '../www/js/storage.js';

// 2026-11-22 is a Sunday, 2026-11-23 a Monday.
test('recapWeek covers this week on Sunday and last week on Monday, nothing midweek', () => {
  assert.deepEqual(recapWeek('2026-11-22'), { key: '2026-W47', from: '2026-11-16', to: '2026-11-22' });
  assert.deepEqual(recapWeek('2026-11-23'), { key: '2026-W47', from: '2026-11-16', to: '2026-11-22' });
  assert.equal(recapWeek('2026-11-25'), null);
});

test('grade records the day a card was first learned, and keeps it', () => {
  const c1 = grade(undefined, true, '2026-11-17');
  assert.equal(c1.first, '2026-11-17');
  assert.equal(grade(c1, false, '2026-11-20').first, '2026-11-17');
});

test('answer keeps a daily log of answers and right answers', () => {
  const cards = [{ id: 'a', topic: 'science' }, { id: 'b', topic: 'words' }];
  let s = startSession(cards, defaultState(), '2026-11-20', makeRng(1));
  s = answer(s, '2026-11-20', { ...s.session.queue[0], correct: true, sure: false });
  s = answer(s, '2026-11-20', { ...s.session.queue[1], correct: false, sure: false });
  assert.deepEqual(s.log['2026-11-20'], { answered: 2, right: 1 });
});

const cards = [
  { id: 'a', topic: 'science', title: 'A' }, { id: 'b', topic: 'science', title: 'B' },
  { id: 'c', topic: 'words', title: 'C' }, { id: 'd', topic: 'history', title: 'D' },
];

test('computeRecap summarises the week', () => {
  const s = defaultState();
  s.cards = {
    a: { first: '2026-11-17' }, b: { first: '2026-11-18' }, c: { first: '2026-11-21' },
    d: { first: '2026-11-09' }, // last week, not counted
  };
  s.log = { '2026-11-17': { answered: 5, right: 4 }, '2026-11-18': { answered: 5, right: 3 }, '2026-11-10': { answered: 9, right: 9 } };
  s.streak = { ...s.streak, count: 3 };
  const r = computeRecap(s, cards, '2026-11-22', () => 0.1);
  assert.equal(r.week.key, '2026-W47');
  assert.equal(r.learned, 3);
  assert.equal(r.activeDays, 2);
  assert.equal(r.answered, 10);
  assert.equal(r.right, 7);
  assert.equal(r.topTopic, 'science');
  assert.deepEqual([...r.quizIds].sort(), ['a', 'b', 'c']);
});

test('no recap when nothing was learned, or when already dismissed', () => {
  const s = defaultState();
  assert.equal(computeRecap(s, cards, '2026-11-22'), null);
  s.cards = { a: { first: '2026-11-17' } };
  s.recapSeen = '2026-W47';
  assert.equal(computeRecap(s, cards, '2026-11-22'), null);
});

test('the recap quiz holds at most five cards', () => {
  const many = Array.from({ length: 9 }, (_, i) => ({ id: `x${i}`, topic: 'how', title: `X${i}` }));
  const s = defaultState();
  for (const c of many) s.cards[c.id] = { first: '2026-11-19' };
  assert.equal(computeRecap(s, many, '2026-11-22').quizIds.length, 5);
});
