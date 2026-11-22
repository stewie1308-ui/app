// Renders the Inkling launcher icons and splash images with headless Chrome.
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';

const INK = '#2B2620', PAPER = '#F6F0E4', OCHRE = '#C4932F';
const mark = `
  <path d="M54 27c5.6 11.4 16.4 21.6 16.4 35a16.4 16.4 0 1 1-32.8 0C37.6 48.6 48.4 38.4 54 27z" fill="${INK}"/>
  <path d="M46.2 64.4c.4 4.6 3.4 7.8 7.6 8.6" fill="none" stroke="${PAPER}" stroke-width="2.6" stroke-linecap="round" opacity=".85"/>
  <path d="M71.6 30.2c.5 3.4 1.6 4.5 5 5-3.4.5-4.5 1.6-5 5-.5-3.4-1.6-4.5-5-5 3.4-.5 4.5-1.6 5-5z" fill="${OCHRE}"/>`;
const svg = (bg, shape) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="100%" height="100%">${bg ? shape : ''}${mark}</svg>`;
const R = 'android/app/src/main/res';
const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const page = await browser.newPage();
async function render(markup, w, h, path, transparent = false) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.setContent(`<html><body style="margin:0;background:${transparent ? 'transparent' : PAPER}">${markup}</body></html>`);
  await page.screenshot({ path, omitBackground: transparent, clip: { x: 0, y: 0, width: w, height: h } });
}
for (const [d, k] of Object.entries(dens)) {
  const dir = `${R}/mipmap-${d}`;
  await mkdir(dir, { recursive: true });
  const legacy = 48 * k, fg = 108 * k;
  // Legacy icons: the mark zoomed so it fills the icon like the adaptive version.
  const zoom = (inner) => `<div style="width:${legacy}px;height:${legacy}px;overflow:hidden;${inner}"><div style="width:${legacy * 1.5}px;height:${legacy * 1.5}px;margin:${-legacy * 0.25}px">${svg(false)}</div></div>`;
  await render(zoom(`background:${PAPER};border-radius:${legacy * 0.22}px`), legacy, legacy, `${dir}/ic_launcher.png`, true);
  await render(zoom(`background:${PAPER};border-radius:50%`), legacy, legacy, `${dir}/ic_launcher_round.png`, true);
  await render(`<div style="width:${fg}px;height:${fg}px">${svg(false)}</div>`, fg, fg, `${dir}/ic_launcher_foreground.png`, true);
}
// Splash images (pre-Android 12): cream with the mark in the middle.
const splash = async (w, h, path) => render(`<div style="width:${w}px;height:${h}px;display:grid;place-items:center;background:${PAPER}"><div style="width:${Math.min(w, h) * 0.42}px;height:${Math.min(w, h) * 0.42}px">${svg(false)}</div></div>`, w, h, path);
await splash(480, 800, `${R}/drawable/splash.png`);
const sizes = { mdpi: [320, 480], hdpi: [480, 800], xhdpi: [720, 1280], xxhdpi: [960, 1600], xxxhdpi: [1280, 1920] };
for (const [d, [w, h]] of Object.entries(sizes)) {
  await splash(w, h, `${R}/drawable-port-${d}/splash.png`);
  await splash(h, w, `${R}/drawable-land-${d}/splash.png`);
}
// A 512px preview for the README.
await mkdir('docs', { recursive: true });
await render(`<div style="width:512px;height:512px;overflow:hidden;border-radius:112px;background:${PAPER}"><div style="width:768px;height:768px;margin:-128px">${svg(false)}</div></div>`, 512, 512, 'docs/icon.png', true);
await browser.close();
console.log('icons and splash written');
