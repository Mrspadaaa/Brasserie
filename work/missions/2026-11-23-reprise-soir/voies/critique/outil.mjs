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
export async function ouvrir() {
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
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await cdp.send('Emulation.setUserAgentOverride', { userAgent: UA, platform: 'Android' });
  const lacher = () => browser.disconnect();
  const fermer = async () => { await page.close().catch(() => undefined); fs.rmSync(ONGLET, { force: true }); browser.disconnect(); };
  return { browser, page, cdp, lacher, fermer };
}
export async function toucher(cdp, x, y, ms = 60) {
  const p = { x: Math.round(x), y: Math.round(y), id: 1, radiusX: 4, radiusY: 4, force: 1 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [p] });
  await sleep(ms);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
/** Trouve un élément cliquable par texte (ou aria-label), le centre, rend ses coordonnées. */
export async function ou(page, texte, sel = 'button, a, [role=button], [role=tab], li, summary') {
  return page.evaluate((t, s) => {
    const els = [...document.querySelectorAll(s)].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; });
    const e = els.find((x) => (x.getAttribute('aria-label') || '') === t) || els.find((x) => (x.textContent || '').trim() === t) || els.find((x) => (x.textContent || '').trim().includes(t) || (x.getAttribute('aria-label') || '').includes(t));
    if (!e) return null;
    e.scrollIntoView({ block: 'center' });
    const b = e.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2, txt: (e.textContent || '').trim().slice(0, 60) };
  }, texte, sel);
}
export async function taper(page, cdp, texte, sel) {
  const r = await ou(page, texte, sel);
  if (!r) throw new Error('introuvable : ' + texte);
  await toucher(cdp, r.x, r.y);
  await sleep(500);
  return r;
}
export async function photo(page, nom, entiere = false) {
  const f = path.join(CAP, nom + '.png');
  await page.screenshot({ path: f, fullPage: entiere });
  const txt = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync(path.join(CAP, nom + '.txt'), txt);
  return f;
}
export function log(...a) { const l = a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '); console.log(l); fs.appendFileSync(path.join(ICI, 'journal.txt'), new Date().toISOString().slice(11, 19) + ' ' + l + '\n'); }
