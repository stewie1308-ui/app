// Shared helpers for turning hand-written card files into the app's card format and checking them.
import { TOPICS, validateCards } from '../www/js/validate.js';
export { TOPICS, validateCards };

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

