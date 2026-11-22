// The session: guess first, reveal, next. Ends with a short recap.
import { h, icon, inkMark, TOPIC } from './dom.js';
import { renderVisual } from './visuals.js';
import { orderOptions } from '../format.js';
import { currentSession, sessionDone, answer } from '../session.js';
import { rabbitTrail } from '../rabbit.js';

const KIND_LABEL = { new: 'New', review: 'Review', recheck: 'Second look', rabbit: 'Rabbit hole' };

export function factBlock(card) {
  return h('div', {},
    h('h2', { class: 'fact-title' }, card.title),
    h('p', { class: 'fact-body' }, card.body),
    renderVisual(card.visual),
    h('p', { class: 'fact-why' }, card.why),
    h('a', { class: 'source', href: card.source.url, rel: 'noopener' }, icon('ext'), card.source.name));
}

function dots(session) {
  const n = session.queue.length;
  return h('div', { class: 'dots', 'aria-hidden': 'true' },
    Array.from({ length: n }, (_, i) => h('i', { class: i < session.index ? 'on' : i === session.index ? 'now' : '' })));
}

function header(app, session) {
  return h('header', { class: 'topbar' },
    h('button', { class: 'icon-btn', 'aria-label': 'Close and save progress', onclick: () => app.go('home', {}, { replace: true }) }, icon('close')),
    h('div', { class: 'progress' }, h('span', {}, `${Math.min(session.index + 1, session.queue.length)} of ${session.queue.length}`), dots(session)));
}

function renderDone(app, session) {
  const results = session.results;
  const right = results.filter((r) => r.correct).length;
  const back = results.filter((r) => !r.correct && r.kind !== 'recheck').length;
  const head = right === results.length ? 'A clean sweep.' : right >= results.length / 2 ? 'Nicely done.' : 'Good effort. Those will stick next time.';
  const seenIds = [...new Set(results.map((r) => r.id))];
  return h('div', { class: 'screen has-bar' },
    h('header', { class: 'topbar' }, h('p', { class: 'wordmark' }, 'Inkling')),
    h('h1', { class: 'done-head' }, head),
    h('p', { class: 'done-sub' }, back ? `${back === 1 ? 'One card comes' : `${back} cards come`} back tomorrow for another try.` : 'Everything you got right will come back later, just before you might forget it.'),
    h('ul', { class: 'tally' },
      h('li', {}, h('span', {}, 'Answered right'), h('b', {}, `${right} of ${results.length}`)),
      h('li', {}, h('span', {}, 'Streak'), h('b', {}, `${app.state.streak.count} ${app.state.streak.count === 1 ? 'day' : 'days'}`))),
    h('h2', { class: 'section-title' }, 'What you learned'),
    h('ul', { class: 'recap' }, seenIds.map((id) => {
      const c = app.byId.get(id);
      const ok = results.filter((r) => r.id === id).every((r) => r.correct);
      return c && h('li', {}, icon(ok ? 'tick' : 'cross', ok ? 'r' : 'w'), h('span', {}, c.title));
    })),
    h('div', { class: 'bottombar' }, h('div', { class: 'bottombar-inner' },
      h('button', { class: 'btn', onclick: () => app.go('home', {}, { replace: true }) }, 'Back home'))));
}

export function renderCard(app) {
  const today = app.today();
  const session = currentSession(app.state, today);
  if (!session) { queueMicrotask(() => app.go('home', {}, { replace: true })); return h('div'); }
  if (sessionDone(session)) return renderDone(app, session);

  const item = session.queue[session.index];
  const card = app.byId.get(item.id);
  if (!card) { // card from a pack that no longer exists: skip it
    app.update((s) => ({ ...s, session: { ...s.session, index: s.session.index + 1 } }));
    return renderCard(app);
  }
  const firstTime = item.kind === 'new' || item.kind === 'rabbit';
  const quiz = orderOptions(firstTime ? card.q : card.rq, `${card.id}|${today}|${item.kind}`);
  let sure = false;
  let answered = false;

  const sureBtn = h('button', { class: 'sure', 'aria-pressed': 'false', onclick: () => {
    sure = !sure; sureBtn.setAttribute('aria-pressed', String(sure));
  } }, h('span', { class: 'box' }, icon('tick')), "I'm sure");

  const revealArea = h('div');
  const bar = h('div', { class: 'bottombar' });
  const optionButtons = quiz.options.map((text, i) => h('button', { class: 'option', onclick: () => choose(i) }, h('span', {}, text)));

  function choose(i) {
    if (answered) return;
    answered = true;
    const correct = i === quiz.answer;
    optionButtons.forEach((b, j) => {
      b.disabled = true;
      if (j === quiz.answer) { b.classList.add('is-right'); b.append(inkMark()); }
      else if (j === i) { b.classList.add('is-wrong'); b.append(inkMark()); }
      else b.classList.add('is-dim');
    });
    sureBtn.remove();
    hint.remove();
    app.update((s) => answer(s, today, { id: item.id, kind: item.kind, correct, sure }));
    const verdict = correct
      ? h('p', { class: 'verdict right' }, icon('tick'), h('span', {}, sure ? 'Right, and you knew it.' : 'Right!'))
      : h('p', { class: 'verdict wrong' }, icon('cross'), h('span', {}, sure ? 'You were sure!' : 'Not quite.',
          h('small', {}, sure && item.kind !== 'recheck' ? "Surprises stick. You'll see this again at the end." : 'It will come back tomorrow.')));
    revealArea.replaceChildren(h('div', { class: 'reveal reveal-enter' }, verdict, factBlock(card)));
    const last = app.state.session.index >= app.state.session.queue.length;
    const hasMore = rabbitTrail(card, app.byId, new Set([card.id]), 1).length > 0;
    const more = hasMore && h('button', { class: 'btn quiet', onclick: () => app.go('rabbit', { from: card.id }) }, 'Tell me more');
    bar.replaceChildren(h('div', { class: 'bottombar-inner' }, more, h('button', { class: 'btn', onclick: () => app.render() }, last ? 'Finish' : 'Next card')));
    bar.querySelector('button').focus({ preventScroll: true, focusVisible: false });
  }

  const hint = h('p', { class: 'sure-hint' }, 'Guessing is fine. Tap "I\'m sure" first if you are.');
  const topic = TOPIC[card.topic];
  return h('div', { class: 'screen has-bar' },
    header(app, session),
    h('article', { class: `leaf t-${card.topic}` },
      h('p', { class: 'leaf-topic' }, icon(topic.icon), topic.name, h('span', { class: 'kind' }, item.kind === 'new' ? '' : KIND_LABEL[item.kind])),
      h('h1', { class: 'question' }, quiz.prompt),
      h('ul', { class: 'options' }, optionButtons.map((b) => h('li', {}, b))),
      sureBtn, hint,
      revealArea),
    bar);
}
