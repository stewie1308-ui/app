// Saved progress lives on the phone only (WebView localStorage).
const KEY = 'inkling.state';

export function defaultState() {
  return {
    version: 1,
    cards: {},
    streak: { count: 0, best: 0, lastDay: null, freezesLeft: 2, freezeWeek: null },
    settings: { sessionSize: 5, theme: 'auto', reminder: { on: false, time: '19:00' } },
    session: null,
    packs: {},
    browsed: {},
    log: {},
    recapSeen: null,
  };
}

function defaultStore() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

export function loadState(store = defaultStore()) {
  const base = defaultState();
  let raw = null;
  try { raw = store ? store.getItem(KEY) : null; } catch { raw = null; }
  if (!raw) return base;
  let saved;
  try { saved = JSON.parse(raw); } catch { return base; }
  if (!saved || typeof saved !== 'object') return base;
  return {
    ...base,
    ...saved,
    cards: { ...(saved.cards || {}) },
    streak: { ...base.streak, ...(saved.streak || {}) },
    settings: { ...base.settings, ...(saved.settings || {}) },
    packs: { ...(saved.packs || {}) },
    browsed: { ...(saved.browsed || {}) },
    log: { ...(saved.log || {}) },
    session: saved.session ?? null,
  };
}

export function saveState(state, store = defaultStore()) {
  try { store && store.setItem(KEY, JSON.stringify(state)); return true; } catch { return false; }
}
