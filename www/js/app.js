// Inkling: app shell, state and navigation.
import { loadState, saveState, defaultState } from './storage.js';
import { dayKey } from './dates.js';
import { allCards } from './packs.js';
import { renderHome } from './ui/home.js';
import { renderCard } from './ui/card.js';
import { renderBrowse } from './ui/browse.js';
import { renderStats } from './ui/stats.js';
import { renderSettings } from './ui/settings.js';
import { renderRecap } from './ui/recap.js';
import { closeSheet } from './ui/dom.js';
import { Capacitor, registerPlugin, SystemBars } from '../vendor/capacitor-core.js';
import { applyTheme } from './theme.js';

const root = document.getElementById('app');
const VIEWS = { home: renderHome, card: renderCard, browse: renderBrowse, stats: renderStats, settings: renderSettings, recap: renderRecap };

const app = {
  state: loadState(),
  starter: [],
  cards: [],
  byId: new Map(),
  view: 'home',
  params: {},
  stack: [],
  today: () => dayKey(new Date()),
  update(fn) {
    this.state = fn(this.state);
    saveState(this.state);
    this.refreshCards();
  },
  applyTheme() {
    applyTheme(this.state.settings.theme, (t) => {
      if (Capacitor.isNativePlatform()) SystemBars.setStyle({ style: t === 'dark' ? 'DARK' : 'LIGHT' }).catch(() => {});
    });
  },
  reset() {
    this.state = defaultState();
    saveState(this.state);
    this.refreshCards();
    this.applyTheme();
  },
  refreshCards() {
    this.cards = allCards(this.starter, this.state);
    this.byId = new Map(this.cards.map((c) => [c.id, c]));
  },
  go(view, params = {}, { replace = false } = {}) {
    if (view === 'home') this.stack = [];
    else if (!replace && this.view !== view) this.stack.push(this.view);
    this.view = view;
    this.params = params;
    this.render();
  },
  back() {
    if (closeSheet()) return true;
    if (this.view === 'home') return false;
    this.view = this.stack.pop() || 'home';
    if (this.view === 'card') this.view = 'home';
    this.params = {};
    this.render();
    return true;
  },
  render() {
    root.replaceChildren(VIEWS[this.view](this, this.params));
    window.scrollTo(0, 0);
    const heading = root.querySelector('h1, h2');
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true, focusVisible: false }); }
  },
};

function setupBackButton() {
  if (!Capacitor.isNativePlatform()) return;
  const App = registerPlugin('App');
  App.addListener('backButton', () => { if (!app.back()) App.exitApp(); });
}

app.applyTheme();
globalThis.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => app.applyTheme());

async function boot() {
  try {
    const res = await fetch('content/starter.json');
    app.starter = await res.json();
  } catch {
    app.starter = [];
  }
  app.refreshCards();
  setupBackButton();
  document.addEventListener('visibilitychange', () => { if (!document.hidden && app.view === 'home') app.render(); });
  app.render();
}

window.inkling = app; // handy for debugging
boot();
