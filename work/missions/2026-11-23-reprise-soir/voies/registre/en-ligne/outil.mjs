// Outil du Chrome de debug (9222), lecture seule : mon onglet neuf dans sa propre fenetre, telephone 390 x 844 tactile.
// Jamais browser.close() : seulement mon onglet, puis disconnect.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
export const DOSSIER = ICI;
const RACINE = path.resolve(ICI, '..', '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
export const APP = 'https://brasserie-l-affinee.web.app/';
const UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Mobile Safari/537.36';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function ouvrir() {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
  const cdpB = await browser.target().createCDPSession();
  const { targetId } = await cdpB.send('Target.createTarget', { url: 'about:blank', newWindow: true });
  const cible = await browser.waitForTarget((t) => t._targetId === targetId);
  const page = await cible.page();
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await cdp.send('Emulation.setUserAgentOverride', { userAgent: UA, platform: 'Android' });
  const fermer = async () => { await page.close().catch(() => undefined); browser.disconnect(); };
  return { browser, page, cdp, fermer };
}

/** Un vrai toucher CDP au centre d'un point. */
export async function toucher(cdp, x, y, ms = 60) {
  const p = { x: Math.round(x), y: Math.round(y), id: 1, radiusX: 4, radiusY: 4, force: 1 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [p] });
  await sleep(ms);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
/** Glisser du doigt de (x1,y1) a (x2,y2) en pas de ~8 px. */
export async function glisser(cdp, a, b, { pas = 8, attente = 16, pause = 0 } = {}) {
  const n = Math.max(2, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / pas));
  const pt = (x, y) => ({ x: Math.round(x), y: Math.round(y), id: 1, radiusX: 4, radiusY: 4, force: 1 });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt(a.x, a.y)] });
  await sleep(80);
  for (let i = 1; i <= n; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [pt(a.x + ((b.x - a.x) * i) / n, a.y + ((b.y - a.y) * i) / n)] });
    await sleep(attente);
  }
  if (pause) await sleep(pause);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
export async function centre(page, sel) {
  const r = await page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width, h: b.height, l: b.left, r: b.right, t: b.top, b: b.bottom }; }, sel);
  return r;
}
export async function photo(page, nom, entiere = true) {
  const f = path.join(DOSSIER, nom + '.png');
  await page.screenshot({ path: f, fullPage: entiere });
  return f;
}
export function log(...a) { const l = a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '); console.log(l); fs.appendFileSync(path.join(DOSSIER, 'journal.txt'), l + '\n'); }
