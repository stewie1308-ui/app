// Dev tool: serves www/ and screenshots key screens at phone size into .shots/.
import puppeteer from 'puppeteer-core';
import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = http.createServer(async (req, res) => {
  const p = join('www', decodeURIComponent(new URL(req.url, 'http://x').pathname.replace(/\/$/, '/index.html')));
  let body;
  try { body = await readFile(p); } catch { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(body);
}).listen(8765);

await mkdir('.shots', { recursive: true });
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage();
await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const DARK = process.env.DARK === '1';
if (DARK) await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const shot = async (name, full = false) => { await new Promise((r) => setTimeout(r, 700)); await page.screenshot({ path: `.shots/${DARK ? 'dark-' : ''}${name}.png`, fullPage: full }); console.log('shot', name); };
const click = async (text) => {
  const ok = await page.evaluate((t) => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().startsWith(t)); if (b) { b.click(); return true; } return false; }, text);
  if (!ok) throw new Error(`no button "${text}"`);
};

await page.goto('http://localhost:8765/', { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle0' });
await shot('01-home');
await click('Begin');
await shot('02-question');
await click("I'm sure");
await page.evaluate(() => document.querySelectorAll('.option')[1].click());
await shot('03-reveal', true);
if (await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent === 'Tell me more'))) {
  await click('Tell me more');
  await shot('03b-rabbit');
  await click('Keep going').catch(() => {});
  await shot('03c-rabbit-deeper', true);
  await click('Back to my cards');
}
for (let i = 0; i < 12; i++) {
  const next = await page.evaluate(() => !!document.querySelector('.option:not([disabled])'));
  if (!next) { const fin = await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => /Next card|Finish/.test(b.textContent))); if (!fin) break; }
  await page.evaluate(() => { const o = document.querySelector('.option:not([disabled])'); if (o) o.click(); });
  await new Promise((r) => setTimeout(r, 150));
  // capture a card with a visual if we see one
  if (await page.evaluate(() => !!document.querySelector('.visual, .bars'))) await shot('04-visual', true);
  const more = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /Next card|Finish/.test(x.textContent)); if (b) { b.click(); return true; } return false; });
  if (!more) break;
}
await shot('05-done', true);
await click('Back home');
await shot('06-home-done');
await click('Science & space');
await shot('07-browse');
await page.evaluate(() => window.inkling.go('home'));
await click('History & oddities');
await page.evaluate(() => document.querySelector('.visual')?.closest('.feed-card')?.scrollIntoView());
await shot('07b-timeline');
await page.evaluate(() => { window.inkling.go('browse', { topic: 'science' }); });
await page.evaluate(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.startsWith('Show more')); b&&b.click(); });
await page.evaluate(() => document.querySelector('.bars')?.closest('.feed-card')?.scrollIntoView());
await shot('07c-bars');
await page.evaluate(() => window.inkling.go('stats'));
await shot('08-stats');
await page.evaluate(() => window.inkling.go('settings'));
await click('On');
await new Promise((r) => setTimeout(r, 200));
console.log('reminder time row visible:', await page.evaluate(() => !document.querySelector('.time-row').hidden), 'saved:', await page.evaluate(() => JSON.parse(localStorage.getItem('inkling.state')).settings.reminder));
await shot('09-settings', true);
await click('Reset progress');
await shot('10-reset-sheet');
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
server.close();
