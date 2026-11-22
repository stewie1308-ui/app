// Gentle streak: one answered card a day counts; two automatic freezes per ISO week.
import { daysBetween, isoWeek } from './dates.js';

const FREEZES_PER_WEEK = 2;

function refill(s, today) {
  const week = isoWeek(today);
  return s.freezeWeek === week ? s : { ...s, freezeWeek: week, freezesLeft: FREEZES_PER_WEEK };
}

export function recordActivity(streak, today) {
  let s = refill({ ...streak }, today);
  if (s.lastDay === today) return s;
  if (!s.lastDay || daysBetween(s.lastDay, today) < 0) {
    s.count = 1;
  } else {
    const missed = daysBetween(s.lastDay, today) - 1;
    if (missed === 0) s.count += 1;
    else if (missed <= s.freezesLeft) { s.freezesLeft -= missed; s.count += 1; }
    else s.count = 1;
  }
  s.lastDay = today;
  s.best = Math.max(s.best || 0, s.count);
  return s;
}

export function streakAlive(streak, today) {
  if (!streak.lastDay || !streak.count) return false;
  const missed = daysBetween(streak.lastDay, today) - 1;
  if (missed < 0) return true;
  const left = streak.freezeWeek === isoWeek(today) ? streak.freezesLeft : FREEZES_PER_WEEK;
  return missed <= left;
}
