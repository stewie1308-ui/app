import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planReminders, REMINDER_IDS } from '../www/js/reminders.js';
import { loadState } from '../www/js/storage.js';

const at = (s) => new Date(s);

test('plans the next seven reminders at the chosen local time', () => {
  const plan = planReminders({ on: true, time: '19:00' }, { now: at('2026-11-22T08:00:00Z'), doneToday: false, streak: 0 });
  assert.equal(plan.length, 7);
  assert.equal(plan[0].at.getHours(), 19);
  assert.equal(plan[0].at.getMinutes(), 0);
  assert.equal(plan[0].at.getDate(), 22);
  assert.equal(plan[6].at.getDate(), 28);
  assert.deepEqual(plan.map((p) => p.id), REMINDER_IDS.slice(0, 7));
});

test("skips today if today's cards are done", () => {
  const plan = planReminders({ on: true, time: '19:00' }, { now: at('2026-11-22T08:00:00Z'), doneToday: true, streak: 3 });
  assert.equal(plan[0].at.getDate(), 23);
  assert.equal(plan.length, 7);
});

test("skips today if the time has already passed", () => {
  const plan = planReminders({ on: true, time: '07:30' }, { now: at('2026-11-22T08:00:00Z'), doneToday: false, streak: 0 });
  assert.equal(plan[0].at.getDate(), 23);
});

test('plans nothing when reminders are off or the time is malformed', () => {
  assert.deepEqual(planReminders({ on: false, time: '19:00' }, { now: new Date(), doneToday: false, streak: 0 }), []);
  assert.deepEqual(planReminders({ on: true, time: 'soon' }, { now: new Date(), doneToday: false, streak: 0 }), []);
});

test('mentions the streak when there is one to keep', () => {
  const plan = planReminders({ on: true, time: '19:00' }, { now: at('2026-11-22T08:00:00Z'), doneToday: false, streak: 4, cards: 5 });
  assert.match(plan[0].body, /4-day streak/);
  const fresh = planReminders({ on: true, time: '19:00' }, { now: at('2026-11-22T08:00:00Z'), doneToday: false, streak: 0, cards: 5 });
  assert.match(fresh[0].body, /5 cards/);
});

test('reminders default to off at 7pm', () => {
  const s = loadState({ getItem: () => null });
  assert.deepEqual(s.settings.reminder, { on: false, time: '19:00' });
});
