// Rabbit holes: after a card, read a few related facts (no questions).
import { addDays } from './dates.js';

// Up to n related card ids not in `exclude`, widening to related-of-related if needed.
export function rabbitTrail(card, byId, exclude = new Set(), n = 3) {
  const out = [];
  const seen = new Set(exclude);
  let frontier = [card];
  while (out.length < n && frontier.length) {
    const next = [];
    for (const c of frontier) {
      for (const id of c.related || []) {
        if (out.length >= n) break;
        if (seen.has(id) || !byId.has(id)) continue;
        seen.add(id);
        out.push(id);
        next.push(byId.get(id));
      }
    }
    frontier = next;
  }
  return out;
}

// Facts read in a rabbit hole join your deck, so they return tomorrow as review questions
// (the review question differs from the guess-first one, so nothing is spoiled).
export function markRead(state, ids, today) {
  const cards = { ...state.cards };
  for (const id of ids) {
    if (cards[id]) continue;
    cards[id] = { box: 0, due: addDays(today, 1), seen: 0, right: 0, wrong: 0, mastered: false, first: today, read: true };
  }
  return { ...state, cards };
}
