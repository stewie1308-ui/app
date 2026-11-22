import { h, icon, toast, openSheet, closeSheet } from './dom.js';
import { fetchIndex, downloadPack, mergePack, PackError } from '../packs.js';

function sizePicker(app) {
  const wrap = h('div', { class: 'segmented', role: 'group', 'aria-label': 'Cards per session' });
  const draw = () => wrap.replaceChildren(...[3, 5, 10].map((n) => h('button', {
    'aria-pressed': String(app.state.settings.sessionSize === n),
    onclick: () => { app.update((s) => ({ ...s, settings: { ...s.settings, sessionSize: n } })); draw(); },
  }, String(n))));
  draw();
  return wrap;
}

function themePicker(app) {
  const wrap = h('div', { class: 'segmented', role: 'group', 'aria-label': 'Appearance' });
  const opts = [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']];
  const draw = () => wrap.replaceChildren(...opts.map(([v, label]) => h('button', {
    'aria-pressed': String((app.state.settings.theme || 'auto') === v),
    onclick: () => { app.update((s) => ({ ...s, settings: { ...s.settings, theme: v } })); app.applyTheme(); draw(); },
  }, label)));
  draw();
  return wrap;
}

function packsSection(app) {
  const list = h('ul', { class: 'pack-list' });
  const status = h('p', { class: 'note', role: 'status' });
  const checkBtn = h('button', { class: 'btn quiet', onclick: check }, 'Check for new cards');

  function installedList() {
    const installed = Object.entries(app.state.packs);
    list.replaceChildren(...installed.map(([, p]) => h('li', { class: 'pack' },
      h('div', {}, h('b', {}, p.title), h('small', {}, `${p.cards.length} cards, on your phone`)))));
  }

  async function check() {
    checkBtn.disabled = true;
    status.className = 'note';
    status.textContent = 'Looking for new cards…';
    try {
      const packs = await fetchIndex();
      list.replaceChildren(...packs.map((entry) => {
        const have = app.state.packs[entry.id];
        const upToDate = have && have.version >= entry.version;
        const btn = h('button', { class: upToDate ? 'btn quiet' : 'btn', disabled: upToDate }, upToDate ? 'Added' : have ? 'Update' : 'Add');
        btn.addEventListener('click', async () => {
          btn.disabled = true; btn.textContent = 'Adding…';
          try {
            const pack = await downloadPack(undefined, entry);
            let result;
            app.update((s) => { result = mergePack(s, pack, app.starter); return result.state; });
            btn.textContent = 'Added'; btn.className = 'btn quiet';
            toast(result.added ? `Added ${result.added} new cards` : 'No new cards in that pack');
          } catch (e) {
            btn.disabled = false; btn.textContent = have ? 'Update' : 'Add';
            status.className = 'note error';
            status.textContent = e instanceof PackError ? e.message : "Couldn't add that pack. Try again later.";
          }
        });
        return h('li', { class: 'pack' },
          h('div', {}, h('b', {}, entry.title), h('small', {}, `${entry.count} cards${entry.description ? `. ${entry.description}` : ''}`)),
          btn);
      }));
      status.textContent = packs.length ? 'Packs download once, then work offline.' : 'No packs yet. Check back soon.';
    } catch (e) {
      status.className = 'note error';
      status.textContent = e instanceof PackError ? e.message : "Couldn't check for cards. Try again later.";
      installedList();
    } finally {
      checkBtn.disabled = false;
    }
  }

  installedList();
  return h('section', { class: 'group', id: 'packs', 'aria-labelledby': 'packs-h' },
    h('h2', { id: 'packs-h' }, 'Get more cards'),
    h('p', {}, 'Download new card packs when you have signal. This is the only part of Inkling that uses the internet.'),
    list, checkBtn, status);
}

function confirmReset(app) {
  openSheet(h('div', {},
    h('h2', {}, 'Reset all progress?'),
    h('p', {}, 'This clears your streak, reviews and stats. Downloaded packs are removed too. It can’t be undone.'),
    h('div', { class: 'row' },
      h('button', { class: 'btn quiet', onclick: closeSheet }, 'Keep my progress'),
      h('button', { class: 'btn danger', onclick: () => { closeSheet(); app.reset(); app.go('home', {}, { replace: true }); toast('Progress reset'); } }, 'Reset'))));
}

export function renderSettings(app, params) {
  const screen = h('div', { class: 'screen' },
    h('header', { class: 'topbar' },
      h('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: () => app.back() }, icon('back')), h('span')),
    h('h1', { class: 'page-title' }, 'Settings'),
    h('section', { class: 'group', 'aria-labelledby': 'size-h' },
      h('h2', { id: 'size-h' }, 'Cards per session'),
      h('p', {}, 'Reviews come first, with room kept for new cards.'),
      sizePicker(app)),
    h('section', { class: 'group', 'aria-labelledby': 'theme-h' },
      h('h2', { id: 'theme-h' }, 'Appearance'),
      h('p', {}, 'Auto matches your phone, so night mode turns on when your phone goes dark.'),
      themePicker(app)),
    packsSection(app),
    h('section', { class: 'group', 'aria-labelledby': 'reset-h' },
      h('h2', { id: 'reset-h' }, 'Start over'),
      h('button', { class: 'btn quiet', onclick: () => confirmReset(app) }, 'Reset progress')),
    h('section', { class: 'group', 'aria-labelledby': 'about-h' },
      h('h2', { id: 'about-h' }, 'About Inkling'),
      h('p', { class: 'credits' },
        'Facts are written in our own words and checked against the linked sources, mostly Wikipedia, plus NASA, USGS and others. ',
        'Card text is shared under CC BY-SA 4.0. Your progress stays on this phone. No accounts, ads or tracking.')));
  if (params.focus === 'packs') queueMicrotask(() => screen.querySelector('#packs')?.scrollIntoView());
  return screen;
}
