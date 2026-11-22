// Tiny DOM helpers, ink icons and topic metadata.
const SVG_NS = 'http://www.w3.org/2000/svg';

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c != null && c !== false) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
}

export function svg(markup, cls = '') {
  const tpl = document.createElement('template');
  tpl.innerHTML = markup.trim();
  const el = tpl.content.firstElementChild;
  if (cls) el.setAttribute('class', cls);
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('focusable', 'false');
  return el;
}

const S = (paths, vb = '0 0 32 32') =>
  `<svg xmlns="${SVG_NS}" viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

// Single-stroke, slightly wobbly ink drawings.
export const ICONS = {
  planet: S('<path d="M16.2 7.6c4.7.1 8.3 3.9 8.2 8.6-.1 4.6-3.9 8.3-8.6 8.2-4.6-.1-8.2-3.9-8.1-8.5.1-4.7 3.8-8.4 8.5-8.3z"/><path d="M5.2 21.4c-2.4 1.9-3 3.6-1.9 4.3 2.2 1.4 9.6-1.3 16.4-6.2 6.9-4.8 11.1-10.4 9-11.9-1-.7-2.9-.3-5.3.9"/><path d="M12.4 12.6c.9-.8 2-1.2 3.2-1.2" stroke-width="1.3"/>'),
  hourglass: S('<path d="M9.5 4.6h13.2M9.3 27.4h13.4"/><path d="M10.6 4.8c-.2 5.3 2.6 8.3 5.4 11.2 2.8-2.9 5.7-5.9 5.4-11.2"/><path d="M10.6 27.2c-.2-5.2 2.6-8.2 5.4-11.2 2.8 3 5.7 6 5.4 11.2"/><path d="M13.3 25.6c.8-1.7 1.7-2.4 2.7-2.4s1.9.7 2.7 2.4z" stroke-width="1.3"/>'),
  gear: S('<path d="M16 11.4c2.6 0 4.6 2 4.6 4.6s-2.1 4.7-4.6 4.6c-2.6 0-4.6-2.1-4.6-4.6 0-2.6 2-4.6 4.6-4.6z"/><path d="M14.4 4.4h3.2l.6 3.1 2.4 1 2.7-1.8 2.3 2.3-1.8 2.7 1 2.4 3.1.6v3.2l-3.1.6-1 2.4 1.8 2.7-2.3 2.3-2.7-1.8-2.4 1-.6 3.1h-3.2l-.6-3.1-2.4-1-2.7 1.8-2.3-2.3 1.8-2.7-1-2.4-3.1-.6v-3.2l3.1-.6 1-2.4-1.8-2.7 2.3-2.3 2.7 1.8 2.4-1z"/>'),
  quill: S('<path d="M26.6 4.2C17.8 5.6 11.4 12 9.2 21.6l1.4 1.2C20 20.4 25.4 13.6 26.6 4.2z"/><path d="M10.4 22.6 5.4 27.8"/><path d="M13.6 17.8c2.4-.3 4.6-1 6.6-2.2M16.2 12.6c1.6-.1 3.2-.4 4.6-1"/><path d="M5 27.6c3.4.8 6.2.9 9.8.4" stroke-width="1.3"/>'),
  sprig: S('<path d="M8.4 27.6c3-6.6 6.8-12.4 15.2-20.4"/><path d="M13.2 18.6c-3.6-.4-5.8-2.8-6.2-6.6 3.8.4 6 2.6 6.2 6.6z"/><path d="M16.8 14c-.6-3.6.8-6.4 4.4-8-.2 3.8-1.6 6.4-4.4 8z"/><path d="M17.4 17.8c3.4-1.2 6.4-.4 8.6 2.8-3.6 1-6.6.2-8.6-2.8z"/>'),
  cog: S('<path d="M5 9.4h12.6M23.2 9.4H27M5 22.6h3.8M14.4 22.6H27"/><path d="M20.4 6.6c1.6 0 2.8 1.2 2.8 2.8s-1.3 2.8-2.8 2.8-2.8-1.3-2.8-2.8 1.2-2.8 2.8-2.8zM11.6 19.8c1.6 0 2.8 1.2 2.8 2.8s-1.3 2.8-2.8 2.8-2.8-1.3-2.8-2.8 1.2-2.8 2.8-2.8z"/>'),
  close: S('<path d="M8.6 8.4 23.4 23.6M23.5 8.5 8.5 23.5"/>'),
  back: S('<path d="M19.6 7.4 11 16l8.6 8.6"/>'),
  tick: S('<path d="M7 16.6 13 22.4 25.4 9.4"/>'),
  cross: S('<path d="M9.4 9.2 22.8 22.8M22.7 9.3 9.3 22.7"/>'),
  ext: S('<path d="M13 7H7.4v17.6H25V19"/><path d="M18 6.6h7.4V14M25.2 6.8 14.6 17.4"/>'),
};

export const icon = (name, cls) => svg(ICONS[name], cls);

export const TOPIC = {
  science: { name: 'Science & space', icon: 'planet' },
  history: { name: 'History & oddities', icon: 'hourglass' },
  how: { name: 'How things work', icon: 'gear' },
  words: { name: 'Words & ideas', icon: 'quill' },
};
export const TOPIC_KEYS = Object.keys(TOPIC);

// A hand-drawn underline / strike path, drawn with stroke-dash animation.
export function inkMark() {
  const wobble = (Math.random() * 1.6 - 0.8).toFixed(2);
  return svg(`<svg xmlns="${SVG_NS}" viewBox="0 0 100 10" preserveAspectRatio="none" class="mark"><path pathLength="1" d="M1 6.2C18 ${4 + +wobble} 34 7.4 52 5.6S84 ${4.4 - +wobble} 99 5.4"/></svg>`, 'mark');
}

export function toast(message) {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const t = h('div', { class: 'toast', role: 'status' }, message);
  document.body.append(t);
  setTimeout(() => t.remove(), 2600);
}

export function openSheet(content) {
  closeSheet();
  const scrim = h('div', { class: 'scrim', onclick: (e) => { if (e.target === scrim) closeSheet(); } },
    h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true' }, content));
  document.getElementById('sheet-root').append(scrim);
  scrim.querySelector('button')?.focus();
}
export function closeSheet() {
  const s = document.querySelector('#sheet-root .scrim');
  if (s) { s.remove(); return true; }
  return false;
}

