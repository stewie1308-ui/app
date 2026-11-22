// Merges content/<topic>*.json into www/content/starter.json, validating as it goes.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { normalizeCard, validateCards, TOPICS } from './content-lib.mjs';

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
mkdirSync('www/content', { recursive: true });
writeFileSync('www/content/starter.json', JSON.stringify(cards));
const counts = Object.fromEntries(TOPICS.map((t) => [t, cards.filter((c) => c.topic === t).length]));
console.log(`starter.json: ${cards.length} cards`, counts);
