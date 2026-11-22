// Merges content/<topic>*.json into www/content/starter.json, validating as it goes.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { normalizeCard, validateCards, TOPICS } from './content-lib.mjs';
import { computeRelated } from './related.mjs';

const cards = [];
for (const file of readdirSync('content').filter((f) => f.endsWith('.json')).sort()) {
  const topic = TOPICS.find((t) => file.startsWith(t));
  if (!topic) throw new Error(`content/${file}: file name must start with a topic (${TOPICS.join(', ')})`);
  let raw;
  try { raw = JSON.parse(readFileSync(`content/${file}`, 'utf8')); }
  catch (e) { throw new Error(`content/${file}: ${e.message}`); }
  for (const r of raw) cards.push(normalizeCard(r, topic));
}
const errs = validateCards(cards);
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
// Subject tags (content/tags.txt) steer which cards link as rabbit holes.
const tags = Object.fromEntries(readFileSync('content/tags.txt', 'utf8').split('\n')
  .filter((l) => l.trim() && !l.startsWith('#')).map((l) => { const [id, ...t] = l.trim().split(/\s+/); return [id, t]; }));
for (const c of cards) c.tags = tags[c.id] || [];
const untagged = cards.filter((c) => !c.tags.length).map((c) => c.id);
if (untagged.length) console.warn(`No tags for: ${untagged.join(', ')}`);
const related = computeRelated(cards);
for (const c of cards) { c.related = related[c.id]; delete c.tags; }
mkdirSync('www/content', { recursive: true });
writeFileSync('www/content/starter.json', JSON.stringify(cards));
const counts = Object.fromEntries(TOPICS.map((t) => [t, cards.filter((c) => c.topic === t).length]));
console.log(`starter.json: ${cards.length} cards`, counts);
