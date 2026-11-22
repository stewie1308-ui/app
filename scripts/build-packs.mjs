// Builds packs/<id>.json and packs/index.json from content/packs/*.json (short-key format).
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { normalizeCard, validateCards } from './content-lib.mjs';

const starterIds = new Set(JSON.parse(readFileSync('www/content/starter.json', 'utf8')).map((c) => c.id));
const index = [];
mkdirSync('packs', { recursive: true });
let failed = false;
for (const file of readdirSync('content/packs').filter((f) => f.endsWith('.json')).sort()) {
  const raw = JSON.parse(readFileSync(`content/packs/${file}`, 'utf8'));
  const cards = raw.cards.map((c) => normalizeCard(c, c.topic));
  const errs = validateCards(cards);
  for (const c of cards) if (starterIds.has(c.id)) errs.push(`${c.id}: clashes with a starter card id`);
  if (errs.length) { console.error(`${file}:\n${errs.join('\n')}`); failed = true; continue; }
  const pack = { id: raw.id, title: raw.title, description: raw.description, version: raw.version, cards };
  writeFileSync(`packs/${raw.id}.json`, JSON.stringify(pack));
  index.push({ id: raw.id, title: raw.title, description: raw.description, count: cards.length, version: raw.version, file: `${raw.id}.json` });
}
if (failed) process.exit(1);
writeFileSync('packs/index.json', JSON.stringify({ version: 1, packs: index }, null, 1));
console.log('packs:', index.map((p) => `${p.id} (${p.count})`).join(', '));
