import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { normalizeCard, validateCards } from '../scripts/content-lib.mjs';

const good = {
  id: 'h001', t: 'Older than the Aztecs', b: 'Teaching at Oxford began around 1096. Tenochtitlan was founded in 1325.',
  q: { p: 'Which is older?', o: ['Oxford University', 'The Aztec Empire'], a: 0 },
  rq: { p: 'Roughly when did teaching begin at Oxford?', o: ['Around 1096', 'Around 1450', 'Around 1700'], a: 0 },
  why: 'Oxford predates Tenochtitlan by over 200 years.', src: 'University of Oxford',
};

test('normalizeCard expands short keys and builds a Wikipedia search link', () => {
  const c = normalizeCard(good, 'history');
  assert.equal(c.topic, 'history');
  assert.equal(c.title, good.t);
  assert.deepEqual(c.q, { prompt: 'Which is older?', options: ['Oxford University', 'The Aztec Empire'], answer: 0 });
  assert.equal(c.source.name, 'Wikipedia: University of Oxford');
  assert.equal(c.source.url, 'https://en.wikipedia.org/w/index.php?search=University%20of%20Oxford');
});

test('normalizeCard keeps an explicit source url', () => {
  const c = normalizeCard({ ...good, src: 'NASA: Venus', srcUrl: 'https://science.nasa.gov/venus/' }, 'science');
  assert.deepEqual(c.source, { name: 'NASA: Venus', url: 'https://science.nasa.gov/venus/' });
});

test('validateCards accepts a good card', () => {
  assert.deepEqual(validateCards([normalizeCard(good, 'history')]), []);
});

test('validateCards rejects duplicates, bad answers, long bodies, missing sources, bad topics', () => {
  const c = normalizeCard(good, 'history');
  const errs = validateCards([
    c, c,
    { ...c, id: 'x1', q: { ...c.q, answer: 5 } },
    { ...c, id: 'x2', body: Array(61).fill('word').join(' ') },
    { ...c, id: 'x3', source: { name: '', url: '' } },
    { ...c, id: 'x4', topic: 'cooking' },
    { ...c, id: 'x5', rq: { prompt: 'p', options: ['only one'], answer: 0 } },
    { ...c, id: 'x6', q: { ...c.q, options: ['Same', 'Same'] } },
  ]).join('\n');
  for (const needle of ['duplicate id h001', 'x1: q.answer', 'x2: body', 'x3: source', 'x4: topic', 'x5: rq.options', 'x6: q.options']) {
    assert.ok(errs.includes(needle), `expected error "${needle}" in:\n${errs}`);
  }
});

test('validateCards checks timeline and compare visuals', () => {
  const c = normalizeCard(good, 'history');
  const errs = validateCards([
    { ...c, id: 'v1', visual: { type: 'timeline', points: [{ label: 'A', year: 1096 }] } },
    { ...c, id: 'v2', visual: { type: 'compare', items: [{ label: 'A', value: 'x' }, { label: 'B', value: 2 }] } },
    { ...c, id: 'v3', visual: { type: 'spiral' } },
  ]).join('\n');
  for (const needle of ['v1: visual', 'v2: visual', 'v3: visual']) assert.ok(errs.includes(needle), errs);
});

test('the built starter deck is valid and has at least 100 cards per topic', { skip: !existsSync('www/content/starter.json') }, () => {
  const cards = JSON.parse(readFileSync('www/content/starter.json', 'utf8'));
  assert.deepEqual(validateCards(cards), []);
  for (const topic of ['science', 'history', 'how', 'words']) {
    const n = cards.filter((c) => c.topic === topic).length;
    assert.ok(n >= 100, `${topic} has ${n} cards`);
  }
});
