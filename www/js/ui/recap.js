// "Your week": a Sunday summary plus an optional five-question quiz that doesn't touch the review schedule.
import { h, icon, inkMark, TOPIC } from './dom.js';
import { computeRecap } from '../recap.js';
import { orderOptions } from '../format.js';
import { factBlock } from './card.js';

function dismiss(app, week) {
  app.update((s) => ({ ...s, recapSeen: week.key }));
  app.go('home', {}, { replace: true });
}

function summary(app, r) {
  const pct = r.answered ? `${Math.round((r.right / r.answered) * 100)}%` : '–';
  const titles = r.quizIds.slice(0, 3).map((id) => app.byId.get(id)?.title).filter(Boolean);
  return h('div', { class: 'screen has-bar' },
    h('header', { class: 'topbar' },
      h('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: () => app.back() }, icon('back')), h('span')),
    h('h1', { class: 'page-title' }, 'Your week'),
    h('div', { class: 'big-stats' },
      h('div', {}, h('b', {}, r.learned), h('span', {}, r.learned === 1 ? 'new card learned' : 'new cards learned')),
      h('div', {}, h('b', {}, r.activeDays), h('span', {}, r.activeDays === 1 ? 'day you showed up' : 'days you showed up')),
      h('div', {}, h('b', {}, pct), h('span', {}, 'answers right')),
      h('div', {}, h('b', {}, r.streak), h('span', {}, 'day streak'))),
    h('p', { class: 'recap-note' }, `Most of it was ${TOPIC[r.topTopic].name.toLowerCase()}.`),
    titles.length ? h('div', {},
      h('h2', { class: 'section-title' }, 'A few things you learned'),
      h('ul', { class: 'recap' }, titles.map((t) => h('li', {}, icon('sprig'), h('span', {}, t))))) : null,
    h('div', { class: 'bottombar' }, h('div', { class: 'bottombar-inner' },
      h('button', { class: 'btn quiet', onclick: () => dismiss(app, r.week) }, 'Done'),
      h('button', { class: 'btn', onclick: () => app.go('recap', { mode: 'quiz', recap: r, i: 0, score: 0 }, { replace: true }) }, r.quizIds.length > 1 ? `Quiz me on ${r.quizIds.length}` : "Quiz me"))));
}

function quiz(app, p) {
  const { recap: r } = p;
  const i = p.i, total = r.quizIds.length;
  if (i >= total) {
    return h('div', { class: 'screen has-bar' },
      h('header', { class: 'topbar' }, h('p', { class: 'wordmark' }, 'Inkling')),
      h('h1', { class: 'done-head' }, p.score === total ? 'Full marks.' : `${p.score} of ${total}.`),
      h('p', { class: 'done-sub' }, p.score === total ? 'This week stuck.' : "Anything you missed will still come back in your normal reviews."),
      h('div', { class: 'bottombar' }, h('div', { class: 'bottombar-inner' },
        h('button', { class: 'btn', onclick: () => dismiss(app, r.week) }, 'Back home'))));
  }
  const card = app.byId.get(r.quizIds[i]);
  if (!card) return quiz(app, { ...p, i: i + 1 });
  const qz = orderOptions(card.rq, `${card.id}|recap`);
  const bar = h('div', { class: 'bottombar' });
  const reveal = h('div');
  let done = false;
  const buttons = qz.options.map((t, j) => h('button', { class: 'option', onclick: () => {
    if (done) return;
    done = true;
    const ok = j === qz.answer;
    buttons.forEach((b, k) => {
      b.disabled = true;
      if (k === qz.answer) { b.classList.add('is-right'); b.append(inkMark()); }
      else if (k === j) { b.classList.add('is-wrong'); b.append(inkMark()); }
      else b.classList.add('is-dim');
    });
    reveal.replaceChildren(h('div', { class: 'reveal reveal-enter' },
      h('p', { class: `verdict ${ok ? 'right' : 'wrong'}` }, icon(ok ? 'tick' : 'cross'), h('span', {}, ok ? 'Still remembered.' : 'Not quite.')),
      factBlock(card)));
    bar.replaceChildren(h('div', { class: 'bottombar-inner' },
      h('button', { class: 'btn', onclick: () => app.go('recap', { ...p, i: i + 1, score: p.score + (ok ? 1 : 0) }, { replace: true }) }, i + 1 >= total ? 'See score' : 'Next question')));
  } }, h('span', {}, t)));
  return h('div', { class: 'screen has-bar' },
    h('header', { class: 'topbar' },
      h('button', { class: 'icon-btn', 'aria-label': 'Stop the quiz', onclick: () => app.go('home', {}, { replace: true }) }, icon('close')),
      h('div', { class: 'progress' }, h('span', {}, `${i + 1} of ${total}`))),
    h('article', { class: `leaf t-${card.topic}` },
      h('p', { class: 'leaf-topic' }, icon(TOPIC[card.topic].icon), TOPIC[card.topic].name, h('span', { class: 'kind' }, 'Weekly quiz')),
      h('h1', { class: 'question' }, qz.prompt),
      h('ul', { class: 'options' }, buttons.map((b) => h('li', {}, b))),
      reveal),
    bar);
}

export function renderRecap(app, params) {
  if (params.mode === 'quiz') return quiz(app, params);
  const r = computeRecap(app.state, app.cards, app.today());
  if (!r) { queueMicrotask(() => app.go('home', {}, { replace: true })); return h('div'); }
  return summary(app, r);
}

// Compact banner for the home screen.
export function recapBanner(app) {
  const r = computeRecap(app.state, app.cards, app.today());
  if (!r) return null;
  return h('button', { class: 'recap-banner', onclick: () => app.go('recap') },
    h('span', {}, h('b', {}, 'Your week is ready'), h('small', {}, `${r.learned} new ${r.learned === 1 ? 'card' : 'cards'}, ${r.activeDays} ${r.activeDays === 1 ? 'day' : 'days'}`)),
    icon('back', 'chev'));
}
