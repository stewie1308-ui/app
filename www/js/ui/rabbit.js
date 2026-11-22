// "Tell me more": a short read of related facts, with a button to dig deeper.
import { h, icon, TOPIC } from './dom.js';
import { factBlock } from './card.js';
import { rabbitTrail, markRead } from '../rabbit.js';

const STEP = 3;

export function renderRabbit(app, params) {
  const from = app.byId.get(params.from);
  if (!from) { queueMicrotask(() => app.go('card', {}, { replace: true })); return h('div'); }
  const shown = [];
  const list = h('div', { class: 'feed' });
  const more = h('div', { class: 'feed-more' });

  function addLayer() {
    const exclude = new Set([from.id, ...shown]);
    // Dig from the most recently shown fact, falling back to the original card.
    const anchor = shown.length ? app.byId.get(shown.at(-1)) : from;
    let ids = rabbitTrail(anchor, app.byId, exclude, STEP);
    if (ids.length < STEP) ids = [...ids, ...rabbitTrail(from, app.byId, new Set([...exclude, ...ids]), STEP - ids.length)];
    if (!ids.length) return false;
    shown.push(...ids);
    app.update((s) => markRead(s, ids, app.today()));
    list.append(...ids.map((id) => {
      const c = app.byId.get(id);
      return h('article', { class: 'feed-card' },
        h('div', { class: `leaf t-${c.topic}` },
          h('p', { class: 'leaf-topic' }, icon(TOPIC[c.topic].icon), TOPIC[c.topic].name),
          factBlock(c)));
    }));
    return true;
  }

  function drawMore() {
    const exclude = new Set([from.id, ...shown]);
    const anchor = app.byId.get(shown.at(-1)) || from;
    const canDig = rabbitTrail(anchor, app.byId, exclude, 1).length || rabbitTrail(from, app.byId, exclude, 1).length;
    more.replaceChildren(canDig
      ? h('button', { class: 'btn quiet', onclick: () => { addLayer(); drawMore(); } }, 'Keep going')
      : h('p', { class: 'empty' }, "That's the bottom of this rabbit hole."));
  }

  addLayer();
  drawMore();
  const back = () => app.go('card', {}, { replace: true });
  return h('div', { class: 'screen has-bar' },
    h('header', { class: 'topbar' },
      h('button', { class: 'icon-btn', 'aria-label': 'Back to my cards', onclick: back }, icon('close')), h('span')),
    h('h1', { class: 'page-title' }, 'Rabbit hole'),
    h('p', { class: 'recap-note' }, `Following on from “${from.title}”`),
    list, more,
    h('p', { class: 'note' }, "Facts you read here come back later as review questions."),
    h('div', { class: 'bottombar' }, h('div', { class: 'bottombar-inner' },
      h('button', { class: 'btn', onclick: back }, 'Back to my cards'))));
}
