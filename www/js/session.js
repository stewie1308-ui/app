// Builds and runs the daily session: due reviews first, with room kept for new cards.
import { grade } from './srs.js';
import { recordActivity } from './streak.js';

const NEW_RESERVE = 2;
const TOPIC_ORDER = ['science', 'history', 'how', 'words'];

export function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFor(today) {
  let h = 2166136261;
  for (const ch of today) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

function shuffle(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickNew(allCards, state, count, rng) {
  if (count <= 0) return [];
  const byTopic = new Map();
  for (const c of allCards) {
    if (c.id in state.cards) continue;
    if (!byTopic.has(c.topic)) byTopic.set(c.topic, []);
    byTopic.get(c.topic).push(c);
  }
  const topics = shuffle(
    [...byTopic.keys()].sort((a, b) => TOPIC_ORDER.indexOf(a) - TOPIC_ORDER.indexOf(b)),
    rng,
  );
  const pools = topics.map((t) => shuffle(byTopic.get(t), rng));
  const out = [];
  while (out.length < count && pools.some((p) => p.length)) {
    for (const p of pools) {
      if (out.length >= count) break;
      if (p.length) out.push({ id: p.pop().id, kind: 'new' });
    }
  }
  return out;
}

export function buildSession(allCards, state, today, rng) {
  const size = state.settings?.sessionSize || 5;
  const known = new Set(allCards.map((c) => c.id));
  const due = Object.entries(state.cards)
    .filter(([id, c]) => known.has(id) && !c.mastered && c.due <= today)
    .sort((a, b) => (a[1].due < b[1].due ? -1 : a[1].due > b[1].due ? 1 : 0))
    .map(([id]) => ({ id, kind: 'review' }));
  const newAvailable = allCards.filter((c) => !(c.id in state.cards)).length;
  const reserve = Math.min(NEW_RESERVE, newAvailable, size);
  const reviews = due.slice(0, size - reserve);
  const fresh = pickNew(allCards, state, size - reviews.length, rng);
  return [...reviews, ...fresh];
}

export function startSession(allCards, state, today, rng) {
  return {
    ...state,
    session: { day: today, queue: buildSession(allCards, state, today, rng), index: 0, results: [] },
  };
}

export function currentSession(state, today) {
  const s = state.session;
  return s && s.day === today ? s : null;
}

export function sessionDone(session) {
  return !session || session.index >= session.queue.length;
}

export function answer(state, today, { id, kind, correct, sure }) {
  const s = state.session;
  const cards = { ...state.cards };
  if (kind !== 'recheck') cards[id] = grade(cards[id], correct, today);
  const queue = [...s.queue];
  const hasRecheck = queue.some((x) => x.id === id && x.kind === 'recheck');
  if (sure && !correct && kind !== 'recheck' && !hasRecheck) queue.push({ id, kind: 'recheck' });
  const day = state.log?.[today] || { answered: 0, right: 0 };
  const log = { ...(state.log || {}), [today]: { answered: day.answered + 1, right: day.right + (correct ? 1 : 0) } };
  return {
    ...state,
    cards,
    log,
    streak: recordActivity(state.streak, today),
    session: {
      ...s,
      queue,
      index: s.index + 1,
      results: [...s.results, { id, kind, correct, sure }],
    },
  };
}
