import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergePack, fetchIndex, downloadPack, allCards, PackError, PACK_BASE_URL } from '../www/js/packs.js';
import { defaultState } from '../www/js/storage.js';

const card = (id, topic = 'science') => ({
  id, topic, title: `Title ${id}`, body: 'A short true fact.',
  q: { prompt: 'Q?', options: ['A', 'B'], answer: 0 },
  rq: { prompt: 'RQ?', options: ['A', 'B'], answer: 1 },
  why: 'Because.', source: { name: 'Wikipedia: X', url: 'https://en.wikipedia.org/w/index.php?search=X' },
});
const pack = (cards, extra = {}) => ({ id: 'weird-animals', title: 'Weird animals', version: 1, cards, ...extra });
const starter = [card('s001'), card('s002')];

test('mergePack adds new cards and records the pack', () => {
  const { state, added, skipped } = mergePack(defaultState(), pack([card('p1'), card('p2')]), starter);
  assert.equal(added, 2);
  assert.equal(skipped, 0);
  assert.equal(state.packs['weird-animals'].cards.length, 2);
  assert.equal(state.packs['weird-animals'].title, 'Weird animals');
});

test('mergePack skips cards whose ids already exist', () => {
  const { state, added, skipped } = mergePack(defaultState(), pack([card('s001'), card('p1')]), starter);
  assert.equal(added, 1);
  assert.equal(skipped, 1);
  assert.deepEqual(state.packs['weird-animals'].cards.map((c) => c.id), ['p1']);
});

test('re-downloading a newer version of a pack replaces its cards without counting them as duplicates', () => {
  let { state } = mergePack(defaultState(), pack([card('p1')]), starter);
  const r = mergePack(state, pack([card('p1'), card('p2')], { version: 2 }), starter);
  assert.equal(r.added, 1);
  assert.equal(r.skipped, 0);
  assert.equal(r.state.packs['weird-animals'].version, 2);
  assert.equal(r.state.packs['weird-animals'].cards.length, 2);
});

test('a malformed pack throws PackError and leaves state untouched', () => {
  const s0 = defaultState();
  const snapshot = JSON.stringify(s0);
  assert.throws(() => mergePack(s0, { nope: true }, starter), PackError);
  assert.throws(() => mergePack(s0, pack([{ ...card('p1'), q: { prompt: 'x', options: ['a'], answer: 3 } }]), starter), PackError);
  assert.throws(() => mergePack(s0, null, starter), PackError);
  assert.equal(JSON.stringify(s0), snapshot);
});

test('allCards combines starter cards and every downloaded pack', () => {
  const { state } = mergePack(defaultState(), pack([card('p1')]), starter);
  assert.deepEqual(allCards(starter, state).map((c) => c.id), ['s001', 's002', 'p1']);
});

test('fetchIndex reports being offline in plain words', async () => {
  const offline = () => Promise.reject(new TypeError('Failed to fetch'));
  await assert.rejects(fetchIndex(offline), (e) => e instanceof PackError && /offline/i.test(e.message));
});

test('fetchIndex reports a server error', async () => {
  const notFound = async () => ({ ok: false, status: 404, json: async () => ({}) });
  await assert.rejects(fetchIndex(notFound), (e) => e instanceof PackError && /404/.test(e.message));
});

test('fetchIndex rejects an unexpected response shape', async () => {
  const weird = async () => ({ ok: true, status: 200, json: async () => ({ hello: 1 }) });
  await assert.rejects(fetchIndex(weird), PackError);
});

test('fetchIndex returns the list of packs from the repo', async () => {
  let asked;
  const ok = async (url) => { asked = url; return { ok: true, status: 200, json: async () => ({ packs: [{ id: 'a', title: 'A', count: 3, file: 'a.json', version: 1 }] }) }; };
  const packs = await fetchIndex(ok);
  assert.equal(asked, `${PACK_BASE_URL}index.json`);
  assert.equal(packs[0].id, 'a');
});

test('downloadPack fetches the pack file next to the index', async () => {
  let asked;
  const ok = async (url) => { asked = url; return { ok: true, status: 200, json: async () => pack([card('p1')]) }; };
  const p = await downloadPack(ok, { id: 'weird-animals', file: 'weird-animals.json' });
  assert.equal(asked, `${PACK_BASE_URL}weird-animals.json`);
  assert.equal(p.cards.length, 1);
});
