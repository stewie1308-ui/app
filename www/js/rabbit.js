// Rabbit holes: after a card, offer a related card you haven't seen yet.
export function pickRabbit(card, state, byId) {
  const queued = new Set((state.session?.queue || []).map((x) => x.id));
  for (const id of card.related || []) {
    if (!byId.has(id) || id in state.cards || queued.has(id)) continue;
    return id;
  }
  return null;
}

export function addRabbit(state, id) {
  const s = state.session;
  const queue = [...s.queue];
  queue.splice(s.index, 0, { id, kind: 'rabbit' });
  return { ...state, session: { ...s, queue } };
}
