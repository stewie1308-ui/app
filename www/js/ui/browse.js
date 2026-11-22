// A calm scroll through cards, no quiz. Learned cards first, then the rest.
import { h, icon, TOPIC, TOPIC_KEYS } from './dom.js';
import { factBlock } from './card.js';

const PAGE = 12;

export function renderBrowse(app, params) {
  let topic = params.topic || 'all';
  let shown = PAGE;
  const feed = h('div', { class: 'feed' });
  const more = h('div', { class: 'feed-more' });
  const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Filter by topic' });

  function list() {
    const cards = app.cards.filter((c) => topic === 'all' || c.topic === topic);
    const seen = cards.filter((c) => app.state.cards[c.id]);
    const unseen = cards.filter((c) => !app.state.cards[c.id]);
    return [...seen, ...unseen];
  }

  function draw() {
    chips.replaceChildren(...['all', ...TOPIC_KEYS].map((t) => h('button', {
      class: 'chip', 'aria-pressed': String(t === topic),
      onclick: () => { topic = t; shown = PAGE; draw(); window.scrollTo(0, 0); },
    }, t === 'all' ? 'Everything' : TOPIC[t].name)));
    const cards = list();
    feed.replaceChildren(...cards.slice(0, shown).map((c) => h('article', { class: 'feed-card' },
      h('div', { class: `leaf t-${c.topic}` },
        h('p', { class: 'leaf-topic' }, icon(TOPIC[c.topic].icon), TOPIC[c.topic].name,
          h('span', { class: 'kind' }, app.state.cards[c.id] ? 'Learned' : '')),
        factBlock(c)))));
    more.replaceChildren(shown < cards.length
      ? h('button', { class: 'btn quiet', onclick: () => { shown += PAGE; draw(); } }, `Show more (${cards.length - shown} left)`)
      : h('p', { class: 'empty' }, cards.length ? "That's every card here." : 'No cards in this topic yet.'));
  }
  draw();

  return h('div', { class: 'screen' },
    h('header', { class: 'topbar' },
      h('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: () => app.back() }, icon('back')),
      h('span')),
    h('h1', { class: 'page-title' }, 'Browse'),
    chips, feed, more);
}
