// Finds related cards by shared distinctive words (TF-IDF cosine similarity). Used at build time.
const STOP = new Set(('the a an and or but of to in on at by for with from as is are was were be been being it its this that these those ' +
  'than then so such can could would should may might will just only about into over after before more most less very also not no ' +
  'their there they them his her he she you your our we us who what which when where how why all any each every some many much ' +
  'one two three first other another same up down out off like even still while because around through between under above year years ' +
  'called made make makes used use uses using known about been have has had do does did same often').split(' '));

function tokens(card) {
  return `${card.title} ${card.title} ${card.body} ${card.why || ''}`
    .toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/[\s-]+/)
    .filter((w) => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w))
    .map((w) => w.replace(/(ies)$/, 'y').replace(/(?<=[a-z]{3})s$/, ''));
}

export function computeRelated(cards, max = 4, minScore = 0.06) {
  const docs = cards.map((c) => tokens(c));
  const df = new Map();
  for (const d of docs) for (const w of new Set(d)) df.set(w, (df.get(w) || 0) + 1);
  const N = cards.length;
  const vecs = docs.map((d) => {
    const tf = new Map();
    for (const w of d) tf.set(w, (tf.get(w) || 0) + 1);
    const v = new Map();
    let norm = 0;
    for (const [w, n] of tf) {
      if (df.get(w) < 2) continue; // a word only one card uses can't link anything
      const x = (1 + Math.log(n)) * Math.log(1 + N / df.get(w));
      v.set(w, x);
      norm += x * x;
    }
    norm = Math.sqrt(norm) || 1;
    for (const [w, x] of v) v.set(w, x / norm);
    return v;
  });
  const out = {};
  cards.forEach((c, i) => {
    const scores = [];
    cards.forEach((o, j) => {
      if (i === j) return;
      let s = 0;
      let shared = 0;
      const [small, big] = vecs[i].size < vecs[j].size ? [vecs[i], vecs[j]] : [vecs[j], vecs[i]];
      for (const [w, x] of small) if (big.has(w)) { s += x * big.get(w); shared++; }
      if (c.topic === o.topic) s *= 1.25; // same-topic links feel more natural
      // Hand-assigned subject tags are the strongest signal; wording breaks ties.
      const tagsShared = (c.tags || []).filter((t) => (o.tags || []).includes(t)).length;
      if (tagsShared) scores.push([o.id, tagsShared * 10 + s]); // tag links always outrank word-only links
      // Without a shared tag, one shared word is usually coincidence ('black' death vs 'black' box); ask for two.
      else if (s >= minScore && shared >= 2) scores.push([o.id, s]);
    });
    out[c.id] = scores.sort((a, b) => b[1] - a[1]).slice(0, max).map(([id]) => id);
  });
  return out;
}
