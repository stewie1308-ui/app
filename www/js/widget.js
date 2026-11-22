// Builds what the home-screen widget shows: facts you've already learned (never new ones, so no spoilers).
const TOPIC_NAMES = { science: 'Science & space', history: 'History & oddities', how: 'How things work', words: 'Words & ideas' };
const MAX = 30;

export function widgetPayload(state, byId) {
  const facts = Object.entries(state.cards)
    .filter(([id]) => byId.has(id))
    .sort((a, b) => ((b[1].first || '') > (a[1].first || '') ? 1 : (b[1].first || '') < (a[1].first || '') ? -1 : 0))
    .slice(0, MAX)
    .map(([id]) => {
      const c = byId.get(id);
      return { topic: c.topic, topicName: TOPIC_NAMES[c.topic] || '', title: c.title, body: c.body };
    });
  return { version: 1, facts };
}
