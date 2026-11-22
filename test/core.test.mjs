import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayKey, addDays, daysBetween, isoWeek } from '../www/js/dates.js';
import { loadState, saveState, defaultState } from '../www/js/storage.js';
import { grade, INTERVALS } from '../www/js/srs.js';
import { recordActivity, streakAlive } from '../www/js/streak.js';

function memStore(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
    data,
  };
}

// ---- dates ----
test('dayKey uses local (London) date, not UTC, late in the evening during BST', () => {
  assert.equal(dayKey(new Date('2026-06-01T23:30:00+01:00')), '2026-06-01');
});
test('dayKey rolls over just after local midnight', () => {
  assert.equal(dayKey(new Date('2026-06-02T00:10:00+01:00')), '2026-06-02');
});
test('addDays crosses month and year boundaries', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
});
test('daysBetween counts whole days across a DST change', () => {
  assert.equal(daysBetween('2026-03-28', '2026-03-30'), 2);
});
test('isoWeek gives ISO week labels', () => {
  assert.equal(isoWeek('2026-11-22'), '2026-W47');
  assert.equal(isoWeek('2026-11-23'), '2026-W48');
  assert.equal(isoWeek('2027-01-01'), '2026-W53');
});

// ---- storage ----
test('loadState returns defaults when nothing is saved', () => {
  assert.deepEqual(loadState(memStore()), defaultState());
});
test('loadState survives corrupt saved data', () => {
  assert.deepEqual(loadState(memStore({ 'inkling.state': '{bad' })), defaultState());
});
test('loadState fills in missing fields from older saves', () => {
  const s = loadState(memStore({ 'inkling.state': JSON.stringify({ version: 1, cards: { a: { box: 2 } } }) }));
  assert.equal(s.cards.a.box, 2);
  assert.equal(s.settings.sessionSize, 5);
  assert.equal(s.streak.count, 0);
});
test('saveState then loadState round-trips', () => {
  const store = memStore();
  const s = defaultState();
  s.cards.x = { box: 1, due: '2026-11-23', seen: 1, right: 1, wrong: 0, mastered: false };
  saveState(s, store);
  assert.deepEqual(loadState(store), s);
});
test('loadState survives storage that throws', () => {
  const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  assert.deepEqual(loadState(broken), defaultState());
  assert.doesNotThrow(() => saveState(defaultState(), broken));
});

// ---- srs ----
test('INTERVALS are 1,3,7,16,35', () => {
  assert.deepEqual(INTERVALS, [1, 3, 7, 16, 35]);
});
test('a new card answered correctly goes to box 1, due tomorrow', () => {
  const c = grade(undefined, true, '2026-11-22');
  assert.equal(c.box, 1);
  assert.equal(c.due, '2026-11-23');
  assert.equal(c.right, 1);
  assert.equal(c.seen, 1);
  assert.equal(c.mastered, false);
});
test('box 2 correct moves to box 3, due in 7 days', () => {
  const c = grade({ box: 2, due: '2026-11-22', seen: 2, right: 2, wrong: 0, mastered: false }, true, '2026-11-22');
  assert.equal(c.box, 3);
  assert.equal(c.due, '2026-11-29');
});
test('box 4 correct is mastered, due in 35 days', () => {
  const c = grade({ box: 4, due: '2026-11-22', seen: 4, right: 4, wrong: 0, mastered: false }, true, '2026-11-22');
  assert.equal(c.mastered, true);
  assert.equal(c.due, addDays('2026-11-22', 35));
});
test('a wrong answer resets to box 0, due tomorrow', () => {
  const c = grade({ box: 3, due: '2026-11-22', seen: 3, right: 3, wrong: 0, mastered: false }, false, '2026-11-22');
  assert.equal(c.box, 0);
  assert.equal(c.due, '2026-11-23');
  assert.equal(c.wrong, 1);
  assert.equal(c.mastered, false);
});

// ---- streak ----
const fresh = () => defaultState().streak;
test('first activity starts the streak at 1', () => {
  const s = recordActivity(fresh(), '2026-11-22');
  assert.equal(s.count, 1);
  assert.equal(s.best, 1);
});
test('activity twice on the same day does not double count', () => {
  const s = recordActivity(recordActivity(fresh(), '2026-11-22'), '2026-11-22');
  assert.equal(s.count, 1);
});
test('next-day activity extends the streak', () => {
  const s = recordActivity(recordActivity(fresh(), '2026-11-23'), '2026-11-24');
  assert.equal(s.count, 2);
});
test('missing one day uses a freeze and keeps the streak', () => {
  let s = recordActivity(fresh(), '2026-11-23'); // Monday
  s = recordActivity(s, '2026-11-25');
  assert.equal(s.count, 2);
  assert.equal(s.freezesLeft, 1);
});
test('missing three days with two freezes resets to 1', () => {
  let s = recordActivity(fresh(), '2026-11-23');
  s = recordActivity(s, '2026-11-27');
  assert.equal(s.count, 1);
  assert.equal(s.best, 1);
});
test('freezes refill to 2 in a new ISO week', () => {
  let s = recordActivity(fresh(), '2026-11-23');
  s = recordActivity(s, '2026-11-25'); // used 1 freeze, W48
  s = recordActivity(s, '2026-11-30'); // Monday W49: refilled to 2, gap of 4 days (26..29) > 2 -> reset
  assert.equal(s.freezeWeek, '2026-W49');
  assert.equal(s.count, 1);
  s = recordActivity(s, '2026-12-02'); // gap 1 -> freeze
  assert.equal(s.count, 2);
  assert.equal(s.freezesLeft, 1);
});
test('streakAlive is true today, true with a coverable gap, false otherwise', () => {
  const s = recordActivity(fresh(), '2026-11-23');
  assert.equal(streakAlive(s, '2026-11-23'), true);
  assert.equal(streakAlive(s, '2026-11-24'), true);
  assert.equal(streakAlive(s, '2026-11-26'), true);  // 2 missed days, 2 freezes
  assert.equal(streakAlive(s, '2026-11-27'), false);
  assert.equal(streakAlive(fresh(), '2026-11-23'), false);
});
