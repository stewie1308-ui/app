// Small pure helpers for display.
import { makeRng, seedFor } from './session.js';

export function formatYear(y) {
  if (y === 0) return 'Today';
  const a = Math.abs(y);
  if (y < 0 && a >= 1e9) return `${trim(a / 1e9)} billion years ago`;
  if (y < 0 && a >= 1e6) return `${trim(a / 1e6)} million years ago`;
  if (y < 0 && a >= 1e4) return `${Math.round(a).toLocaleString('en-GB')} years ago`;
  if (y < 0) return `${a} BC`;
  if (y < 1000) return `AD ${y}`;
  return String(y);
}

function trim(n) { return String(Math.round(n * 10) / 10); }

export function formatValue(v) {
  return Number.isInteger(v) ? v.toLocaleString('en-GB') : String(Math.round(v * 100) / 100);
}

export function orderOptions(q, seedKey) {
  const rng = makeRng(seedFor(seedKey));
  const idx = q.options.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return { prompt: q.prompt, options: idx.map((i) => q.options[i]), answer: idx.indexOf(q.answer) };
}

export function greeting(hour) {
  if (hour >= 22 || hour < 5) return 'Still up?';
  if (hour < 12) return 'Good morning.';
  if (hour < 18) return 'Good afternoon.';
  return 'Good evening.';
}
