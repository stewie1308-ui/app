// Dev tool: fakes a week of use and screenshots the weekly recap at Galaxy S25 size. Only shows a recap on a Sunday or Monday.
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2' };
const srv = http.createServer(async (q, r) => { const p = join('www', new URL(q.url, 'http://x').pathname.replace(/\/$/, '/index.html')); let b; try { b = await readFile(p); } catch { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': T[extname(p)] || 'application/octet-stream' }); r.end(b); }).listen(8768);
const br = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const pg = await br.newPage();
const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
await pg.setViewport({ width: 360, height: 780, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await pg.goto('http://localhost:8768/', { waitUntil: 'networkidle0' });
await pg.evaluate(() => {
  const ids = ['s001','s028','h002','w020','i061','s054','h047','w043','i055','s035','h012','w026'];
  const days = ['2026-11-16','2026-11-17','2026-11-19','2026-11-20','2026-11-21','2026-11-22'];
  const cards = {}; ids.forEach((id, i) => cards[id] = { box: 1, due: '2026-11-30', seen: 1, right: 1, wrong: 0, mastered: false, first: days[i % days.length] });
  const log = {}; days.slice(0, 5).forEach((d) => log[d] = { answered: 5, right: 4 });
  localStorage.setItem('inkling.state', JSON.stringify({ version: 1, cards, log, streak: { count: 5, best: 5, lastDay: '2026-11-21', freezesLeft: 2, freezeWeek: '2026-W47' }, settings: { sessionSize: 5, theme: 'auto' }, session: null, packs: {} }));
});
await pg.reload({ waitUntil: 'networkidle0' });
await pg.evaluate(() => { document.documentElement.style.setProperty('--safe-area-inset-top', '40px'); document.documentElement.style.setProperty('--safe-area-inset-bottom', '24px'); });
await new Promise((r) => setTimeout(r, 400));
const m = await pg.evaluate(() => ({ scroll: document.scrollingElement.scrollHeight, view: innerHeight }));
console.log('home S25', m, m.scroll > m.view ? 'SCROLLS' : 'fits');
await pg.screenshot({ path: '.shots/recap-home.png' });
await pg.evaluate(() => document.querySelector('.recap-banner').click());
await new Promise((r) => setTimeout(r, 400));
await pg.screenshot({ path: '.shots/recap-summary.png' });
await pg.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.startsWith('Quiz me')).click());
await new Promise((r) => setTimeout(r, 300));
await pg.evaluate(() => document.querySelector('.option').click());
await new Promise((r) => setTimeout(r, 700));
await pg.screenshot({ path: '.shots/recap-quiz.png' });
for (let i = 0; i < 5; i++) {
  await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /Next question|See score/.test(x.textContent)); b && b.click(); });
  await new Promise((r) => setTimeout(r, 200));
  await pg.evaluate(() => { const o = document.querySelector('.option:not([disabled])'); o && o.click(); });
  await new Promise((r) => setTimeout(r, 200));
}
await pg.screenshot({ path: '.shots/recap-score.png' });
await pg.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent === 'Back home')?.click());
await new Promise((r) => setTimeout(r, 300));
console.log('banner after dismiss:', await pg.evaluate(() => !!document.querySelector('.recap-banner')), 'errors:', errs);
await br.close(); srv.close();
