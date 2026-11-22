// Downloadable card packs. Packs live in the GitHub repo's packs/ folder; once downloaded they stay on the phone.
import { validateCards } from './validate.js';

export const PACK_BASE_URL = 'https://raw.githubusercontent.com/stewie1308-ui/app/main/packs/';

export class PackError extends Error {}

async function getJson(fetchImpl, url) {
  let res;
  try { res = await fetchImpl(url, { cache: 'no-store' }); }
  catch { throw new PackError("You're offline. Connect to the internet to get new cards."); }
  if (!res.ok) throw new PackError(`Couldn't reach the card library (error ${res.status}). Try again later.`);
  try { return await res.json(); }
  catch { throw new PackError('The card library sent something unexpected. Try again later.'); }
}

export async function fetchIndex(fetchImpl = globalThis.fetch) {
  const data = await getJson(fetchImpl, `${PACK_BASE_URL}index.json`);
  if (!data || !Array.isArray(data.packs)) throw new PackError('The card library sent something unexpected. Try again later.');
  return data.packs.filter((p) => p && p.id && p.file);
}

export async function downloadPack(fetchImpl = globalThis.fetch, entry) {
  return getJson(fetchImpl, `${PACK_BASE_URL}${entry.file}`);
}

export function mergePack(state, pack, starterCards) {
  if (!pack || typeof pack !== 'object' || !pack.id || !Array.isArray(pack.cards))
    throw new PackError("That pack looks broken, so it wasn't added.");
  const errors = validateCards(pack.cards);
  if (errors.length) throw new PackError("That pack has mistakes in it, so it wasn't added.");
  const taken = new Set(starterCards.map((c) => c.id));
  for (const [id, p] of Object.entries(state.packs || {})) if (id !== pack.id) for (const c of p.cards) taken.add(c.id);
  const fresh = pack.cards.filter((c) => !taken.has(c.id));
  const packs = { ...(state.packs || {}) };
  const before = new Set((packs[pack.id]?.cards || []).map((c) => c.id));
  packs[pack.id] = { title: pack.title || pack.id, version: pack.version || 1, cards: fresh };
  return {
    state: { ...state, packs },
    added: fresh.filter((c) => !before.has(c.id)).length,
    skipped: pack.cards.length - fresh.length,
  };
}

export function allCards(starterCards, state) {
  const out = [...starterCards];
  for (const p of Object.values(state.packs || {})) out.push(...p.cards);
  return out;
}
