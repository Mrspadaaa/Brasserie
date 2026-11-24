// Onglet persistant dans le Chrome de debug 9222 : jamais browser.close().
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
export const CAP = path.join(ICI, 'cap');
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
export const APP = 'https://brasserie-l-affinee.web.app/';
const UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Mobile Safari/537.36';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ONGLET = path.join(ICI, 'onglet.txt');
export async function ouvrir(w = 390, h = 844) {
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
  let id = fs.existsSync(ONGLET) ? fs.readFileSync(ONGLET, 'utf8').trim() : '';
  let cible = id ? browser.targets().find((t) => t._targetId === id) : null;
  if (!cible) {
    const cdpB = await browser.target().createCDPSession();
    ({ targetId: id } = await cdpB.send('Target.createTarget', { url: 'about:blank', newWindow: true }));
    fs.writeFileSync(ONGLET, id);
    cible = await browser.waitForTarget((t) => t._targetId === id);
  }
  const page = await cible.page();
  await page.bringToFront().catch(() => undefined);
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(() => undefined);
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: true });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await cdp.send('Emulation.setUserAgentOverride', { userAgent: UA, platform: 'Android' });
  const lacher = () => browser.disconnect();
  const fermer = async () => { await page.close().catch(() => undefined); fs.rmSync(ONGLET, { force: true }); browser.disconnect(); };
  return { browser, page, cdp, lacher, fermer };
}
const pt = (x, y) => ({ x: Math.round(x), y: Math.round(y), id: 1, radiusX: 4, radiusY: 4, force: 1 });
export async function toucher(cdp, x, y, ms = 60) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt(x, y)] });
  await sleep(ms);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
/** Glisser au doigt : tenir `tenir` ms, puis n pas jusqu'à (x2,y2). `pendant` : rappel avant de lâcher. */
export async function glisser(cdp, x1, y1, x2, y2, { tenir = 0, n = 12, pas = 30, pendant } = {}) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt(x1, y1)] });
  await sleep(tenir || 40);
  for (let i = 1; i <= n; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [pt(x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n)] }); await sleep(pas); }
  await sleep(250);
  if (pendant) await pendant();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
/** Élément visible par aria-label exact, puis texte exact, puis inclusion. */
export async function ou(page, texte, sel = 'button, a, [role=button], [role=tab], [role=menuitem], [role=option], li, summary', centrer = false) {
  return page.evaluate((t, s, c) => {
    const els = [...document.querySelectorAll(s)].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; });
    const lab = (x) => x.getAttribute('aria-label') || '';
    const e = els.find((x) => lab(x) === t) || els.find((x) => (x.textContent || '').trim() === t) || els.find((x) => lab(x).startsWith(t)) || els.find((x) => (x.textContent || '').trim().includes(t) || lab(x).includes(t));
    if (!e) return null;
    if (c) e.scrollIntoView({ block: 'center' });
    const b = e.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2, l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width, h: b.height, txt: (e.textContent || '').trim().slice(0, 60), aria: lab(e) };
  }, texte, sel, centrer);
}
export async function taper(page, cdp, texte, sel) {
  const r = await ou(page, texte, sel);
  if (!r) throw new Error('introuvable : ' + texte);
  await toucher(cdp, r.x, r.y);
  await sleep(600);
  return r;
}
/** Pleine échelle (jugement) par défaut ; demi = intermédiaire. */
export async function photo(page, nom, demi = false) {
  const f = path.join(CAP, nom + '.png');
  if (demi) {
  const cdp = await page.createCDPSession();
    const m = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: m.w, height: m.h, scale: 0.5 } });
    fs.writeFileSync(f, Buffer.from(data, 'base64'));
    await cdp.detach();
  } else await page.screenshot({ path: f });
  fs.writeFileSync(path.join(CAP, nom + '.txt'), await page.evaluate(() => document.body.innerText).catch(() => ''));
  return f;
}
/** Boutons visibles : aria ou texte, position. */
export async function boutons(page, filtre = '') {
  return page.evaluate((f) => [...document.querySelectorAll('button,[role=button],[role=tab],[role=slider],[role=menuitem],[role=option]')].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight; }).map((b) => { const r = b.getBoundingClientRect(); return (b.getAttribute('aria-label') || b.textContent.trim()).slice(0, 70) + ' @' + Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height); }).filter((t) => !f || new RegExp(f, 'i').test(t)), filtre);
}
export function log(...a) { const l = a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '); console.log(l); fs.appendFileSync(path.join(ICI, 'journal.txt'), new Date().toISOString().slice(11, 19) + ' ' + l + '\n'); }
