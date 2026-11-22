// Leitner-style spaced repetition.
import { addDays } from './dates.js';

export const INTERVALS = [1, 3, 7, 16, 35];

export function grade(card, correct, today) {
  const c = { box: 0, due: today, seen: 0, right: 0, wrong: 0, mastered: false, first: today, ...(card || {}) };
  c.seen += 1;
  if (correct) {
    const old = Math.min(c.box, INTERVALS.length - 1);
    c.right += 1;
    c.box = old + 1;
    c.due = addDays(today, INTERVALS[old]);
    if (old === INTERVALS.length - 1) c.mastered = true;
  } else {
    c.wrong += 1;
    c.box = 0;
    c.mastered = false;
    c.due = addDays(today, 1);
  }
  return c;
}
