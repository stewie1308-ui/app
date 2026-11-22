import { h, icon, TOPIC, TOPIC_KEYS } from './dom.js';

export function renderStats(app) {
  const st = app.state;
  const entries = Object.entries(st.cards);
  const seen = entries.length;
  const mastered = entries.filter(([, c]) => c.mastered).length;
  const right = entries.reduce((n, [, c]) => n + c.right, 0);
  const total = entries.reduce((n, [, c]) => n + c.right + c.wrong, 0);
  const accuracy = total ? `${Math.round((right / total) * 100)}%` : '–';

  return h('div', { class: 'screen' },
    h('header', { class: 'topbar' },
      h('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: () => app.back() }, icon('back')), h('span')),
    h('h1', { class: 'page-title' }, 'Your progress'),
    h('div', { class: 'big-stats' },
      h('div', {}, h('b', {}, seen), h('span', {}, 'cards learned')),
      h('div', {}, h('b', {}, mastered), h('span', {}, 'mastered')),
      h('div', {}, h('b', {}, accuracy), h('span', {}, 'answers right')),
      h('div', {}, h('b', {}, st.streak.best || 0), h('span', {}, 'best streak (days)'))),
    h('h2', { class: 'section-title' }, 'By topic'),
    h('div', { class: 'topic-progress' }, TOPIC_KEYS.map((t) => {
      const cards = app.cards.filter((c) => c.topic === t);
      const n = cards.filter((c) => st.cards[c.id]).length;
      return h('div', { class: `bar-row t-${t}` },
        h('div', { class: 'lbl' }, h('span', {}, TOPIC[t].name), h('span', {}, `${n} of ${cards.length}`)),
        h('div', { class: 'bar-track' }, h('div', { class: 'bar-fill', style: `width:${cards.length ? Math.max(n ? 2 : 0, (n / cards.length) * 100) : 0}%` })));
    })),
    h('p', { class: 'note' }, 'A card is mastered after five right answers in a row, spread over about four weeks.'));
}
