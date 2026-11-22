// Shared helpers for turning hand-written card files into the app's card format and checking them.
export const TOPICS = ['science', 'history', 'how', 'words'];
const MAX_BODY_WORDS = 60;

const quiz = (x) => x && { prompt: x.p ?? x.prompt, options: x.o ?? x.options, answer: x.a ?? x.answer };

export function normalizeCard(raw, topic) {
  const src = raw.src ?? raw.source?.name ?? '';
  const isWiki = !raw.srcUrl && !raw.source?.url;
  const source = raw.source?.url
    ? raw.source
    : {
        name: isWiki && src ? `Wikipedia: ${src}` : src,
        url: raw.srcUrl ?? (src ? `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(src)}` : ''),
      };
  const card = {
    id: raw.id,
    topic: raw.topic ?? topic,
    title: raw.t ?? raw.title,
    body: raw.b ?? raw.body,
    q: quiz(raw.q),
    rq: quiz(raw.rq),
    why: raw.why,
    source,
  };
  if (raw.vis ?? raw.visual) card.visual = raw.vis ?? raw.visual;
  return card;
}

function checkQuiz(errs, id, name, q) {
  if (!q || typeof q.prompt !== 'string' || !q.prompt.trim()) { errs.push(`${id}: ${name}.prompt missing`); return; }
  if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 4) { errs.push(`${id}: ${name}.options must have 2-4 entries`); return; }
  if (new Set(q.options.map((o) => String(o).trim().toLowerCase())).size !== q.options.length) errs.push(`${id}: ${name}.options has duplicates`);
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) errs.push(`${id}: ${name}.answer out of range`);
}

function checkVisual(errs, id, v) {
  if (v.type === 'timeline') {
    if (!Array.isArray(v.points) || v.points.length < 2 || v.points.some((p) => !p.label || !Number.isFinite(p.year)))
      errs.push(`${id}: visual timeline needs 2+ points with label and numeric year`);
  } else if (v.type === 'compare') {
    if (!Array.isArray(v.items) || v.items.length < 2 || v.items.some((p) => !p.label || !Number.isFinite(p.value) || p.value < 0))
      errs.push(`${id}: visual compare needs 2+ items with label and non-negative numeric value`);
  } else errs.push(`${id}: visual type "${v.type}" unknown`);
}

export function validateCards(cards) {
  const errs = [];
  const seen = new Set();
  for (const c of cards) {
    const id = c.id || '(no id)';
    if (!c.id) errs.push('card without id');
    else if (seen.has(c.id)) errs.push(`duplicate id ${c.id}`);
    seen.add(c.id);
    if (!TOPICS.includes(c.topic)) errs.push(`${id}: topic "${c.topic}" unknown`);
    if (!c.title?.trim()) errs.push(`${id}: title missing`);
    const words = (c.body || '').trim().split(/\s+/).filter(Boolean).length;
    if (!words) errs.push(`${id}: body missing`);
    if (words > MAX_BODY_WORDS) errs.push(`${id}: body is ${words} words (max ${MAX_BODY_WORDS})`);
    checkQuiz(errs, id, 'q', c.q);
    checkQuiz(errs, id, 'rq', c.rq);
    if (!c.why?.trim()) errs.push(`${id}: why missing`);
    if (!c.source?.name || !/^https:\/\//.test(c.source?.url || '')) errs.push(`${id}: source needs a name and https url`);
    if (c.visual) checkVisual(errs, id, c.visual);
  }
  return errs;
}
