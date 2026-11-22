import { h, icon, TOPIC, TOPIC_KEYS } from './dom.js';
import { greeting } from '../format.js';
import { streakAlive } from '../streak.js';
import { currentSession, sessionDone, startSession, buildSession, makeRng, seedFor } from '../session.js';

function streakLine(state, today) {
  const s = state.streak;
  const alive = streakAlive(s, today);
  if (!alive) return h('p', { class: 'streak' }, icon('sprig'), 'Answer one card to start a streak.');
  const doneToday = s.lastDay === today;
  const days = s.count === 1 ? '1 day' : `${s.count} days`;
  return h('p', { class: 'streak' }, icon('sprig'),
    h('span', {}, h('strong', {}, `${days} in a row. `), doneToday ? 'See you tomorrow.' : 'One card keeps it going.'));
}

function todayCard(app, today) {
  const session = currentSession(app.state, today);
  const begin = () => {
    const seed = seedFor(today + (session ? `#${session.queue.length}` : ''));
    const queue = buildSession(app.cards, app.state, today, makeRng(seed));
    if (!queue.length) return app.render();
    app.update((s) => startSession(app.cards, s, today, makeRng(seed)));
    app.go('card');
  };
  if (session && !sessionDone(session)) {
    return h('section', { class: 'today', 'aria-labelledby': 'today-h' },
      h('h2', { id: 'today-h' }, 'Pick up where you left off'),
      h('p', {}, `${session.index} of ${session.queue.length} done`),
      h('button', { class: 'btn', onclick: () => app.go('card') }, 'Continue'));
  }
  const preview = buildSession(app.cards, app.state, today, makeRng(1));
  if (!preview.length) {
    return h('section', { class: 'today', 'aria-labelledby': 'today-h' },
      h('h2', { id: 'today-h' }, 'All caught up'),
      h('p', {}, "You've seen every card and nothing is due for review. Browse what you've learned, or get more cards."),
      h('button', { class: 'btn', onclick: () => app.go('settings', { focus: 'packs' }) }, 'Get more cards'));
  }
  if (session && sessionDone(session)) {
    return h('section', { class: 'today', 'aria-labelledby': 'today-h' },
      h('div', { class: 'done-mark' }, icon('tick'), h('h2', { id: 'today-h' }, 'Done for today')),
      h('p', {}, 'Your reviews are scheduled. Fancy a few more?'),
      h('button', { class: 'btn quiet', onclick: begin }, `${preview.length} more cards`));
  }
  const reviews = preview.filter((x) => x.kind === 'review').length;
  const minutes = Math.max(1, Math.round(preview.length * 0.6));
  return h('section', { class: 'today', 'aria-labelledby': 'today-h' },
    h('h2', { id: 'today-h' }, `Today's ${preview.length} cards`),
    h('p', {}, reviews ? `${reviews} to review and ${preview.length - reviews} new, about ${minutes} min` : `About ${minutes} minutes`),
    h('button', { class: 'btn', onclick: begin }, 'Begin'));
}

export function renderHome(app) {
  const today = app.today();
  const counts = Object.fromEntries(TOPIC_KEYS.map((t) => [t, { total: 0, seen: 0 }]));
  for (const c of app.cards) {
    if (!counts[c.topic]) continue;
    counts[c.topic].total++;
    if (app.state.cards[c.id]) counts[c.topic].seen++;
  }
  return h('div', { class: 'screen' },
    h('header', { class: 'topbar' },
      h('p', { class: 'wordmark' }, 'Inkling'),
      h('button', { class: 'icon-btn', 'aria-label': 'Settings', onclick: () => app.go('settings') }, icon('cog'))),
    h('h1', { class: 'greeting' }, greeting(new Date().getHours())),
    streakLine(app.state, today),
    todayCard(app, today),
    h('h2', { class: 'section-title' }, 'Browse a topic'),
    h('ul', { class: 'topics' }, TOPIC_KEYS.map((t) => h('li', {},
      h('button', { class: `topic-tile t-${t}`, onclick: () => app.go('browse', { topic: t }) },
        icon(TOPIC[t].icon), h('b', {}, TOPIC[t].name), h('small', {}, `${counts[t].seen} of ${counts[t].total} seen`))))),
    h('nav', { class: 'home-links', 'aria-label': 'More' },
      h('button', { class: 'link-btn', onclick: () => app.go('browse', { topic: 'all' }) }, 'Browse everything'),
      h('button', { class: 'link-btn', onclick: () => app.go('stats') }, 'Your progress')),
  );
}
