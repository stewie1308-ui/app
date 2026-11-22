// Weekly recap: shown on Sunday (this week) and Monday (last week) until dismissed.
import { addDays, isoWeek } from './dates.js';

function weekday(day) { // Mon=1..Sun=7
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() || 7;
}

export function recapWeek(today) {
  const wd = weekday(today);
  let to;
  if (wd === 7) to = today;
  else if (wd === 1) to = addDays(today, -1);
  else return null;
  return { key: isoWeek(to), from: addDays(to, -6), to };
}

export function computeRecap(state, cards, today, rng = Math.random) {
  const week = recapWeek(today);
  if (!week || state.recapSeen === week.key) return null;
  const inWeek = (d) => d && d >= week.from && d <= week.to;
  const byId = new Map(cards.map((c) => [c.id, c]));
  const learnedIds = Object.entries(state.cards).filter(([id, c]) => inWeek(c.first) && byId.has(id)).map(([id]) => id);
  if (!learnedIds.length) return null;
  let answered = 0, right = 0, activeDays = 0;
  for (const [day, l] of Object.entries(state.log || {})) {
    if (!inWeek(day)) continue;
    answered += l.answered; right += l.right; if (l.answered) activeDays++;
  }
  const topicCount = {};
  for (const id of learnedIds) { const t = byId.get(id).topic; topicCount[t] = (topicCount[t] || 0) + 1; }
  const topTopic = Object.entries(topicCount).sort((a, b) => b[1] - a[1])[0][0];
  const pool = [...learnedIds];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return { week, learned: learnedIds.length, answered, right, activeDays, topTopic, quizIds: pool.slice(0, 5), streak: state.streak.count };
}
