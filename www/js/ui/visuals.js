// Ink-style explanatory visuals: timelines and size comparisons.
import { h, svg } from './dom.js';
import { formatYear, formatValue } from '../format.js';

function timeline(v) {
  const pts = [...v.points].sort((a, b) => a.year - b.year);
  const min = pts[0].year, max = pts.at(-1).year;
  const span = max - min || 1;
  const W = 320, L = 14, R = W - 14, Y = 46;
  const x = (yr) => L + ((yr - min) / span) * (R - L);
  let marks = `<path d="M${L - 6} ${Y}C${W * 0.3} ${Y - 1.2} ${W * 0.6} ${Y + 1.2} ${R + 6} ${Y}" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  pts.forEach((p, i) => {
    const px = x(p.year);
    const up = i % 2 === 0;
    const anchor = i === 0 ? 'start' : i === pts.length - 1 ? 'end' : 'middle';
    const tx = anchor === 'start' ? Math.max(px - 4, 2) : anchor === 'end' ? Math.min(px + 4, W - 2) : px;
    const ly = up ? Y - 26 : Y + 30;
    marks += `<circle cx="${px}" cy="${Y}" r="4.2" fill="var(--paper)" stroke="currentColor" stroke-width="1.6"/>`;
    marks += `<text x="${tx}" y="${ly}" text-anchor="${anchor}" font-weight="600">${esc(p.label)}</text>`;
    marks += `<text x="${tx}" y="${ly + 14}" text-anchor="${anchor}" class="faint">${esc(formatYear(p.year))}</text>`;
  });
  const el = h('figure', { class: 'visual', role: 'img', 'aria-label': `Timeline: ${pts.map((p) => `${p.label}, ${formatYear(p.year)}`).join('; ')}` });
  el.append(svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 96">${marks}</svg>`));
  el.style.margin = '4px 0 18px';
  return el;
}

function compare(v) {
  const max = Math.max(...v.items.map((i) => i.value)) || 1;
  return h('div', { class: 'bars', role: 'img', 'aria-label': v.items.map((i) => `${i.label}: ${formatValue(i.value)} ${i.unit || ''}`).join('; ') },
    v.items.map((i) => h('div', { class: 'bar-row' },
      h('div', { class: 'lbl' }, h('span', {}, i.label), h('span', {}, `${formatValue(i.value)} ${i.unit || ''}`.trim())),
      h('div', { class: 'bar-track' }, h('div', { class: 'bar-fill', style: `width:${Math.max(2, (i.value / max) * 100)}%` })),
    )));
}

function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

export function renderVisual(v) {
  if (!v) return null;
  if (v.type === 'timeline') return timeline(v);
  if (v.type === 'compare') return compare(v);
  return null;
}
