// Captures des trois mini maquettes (390 × 844) : <id>-repos.png (au repos, la liste défilée jusqu'au levier levure pour
// lva et lvb ; en haut pour lvc) et <id>-toucher.png (un toucher sur l'élément de la variante). Erreurs de page signalées.
// Usage : node outils/capturer.mjs [lva lvb lvc]
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
const ici = path.dirname(fileURLToPath(import.meta.url)); const lot = path.resolve(ici, '..');
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['lva', 'lvb', 'lvc'];
const att = (ms) => new Promise((r) => setTimeout(r, ms));
const CIBLE = { lva: '[data-role="lva-autre"]', lvb: '[data-role="lvb-pont"]', lvc: '[data-role="lvc-levure"]' };
const DEFILE = { lva: '[data-lva]', lvb: '[data-lvb]', lvc: null };
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const id of ids) {
  const p = await b.newPage(); const err = []; p.on('pageerror', (e) => err.push(String(e)));
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await p.goto(pathToFileURL(path.join(lot, id, 'etat.html')).href, { waitUntil: 'networkidle0' }); await att(900);
  if (DEFILE[id]) await p.evaluate((s) => { const e = document.querySelector(s); const m = document.querySelector('main'); m.scrollTop += e.getBoundingClientRect().top - 330; }, DEFILE[id]);
  await att(250);
  await p.screenshot({ path: path.join(lot, 'captures', id + '-repos.png') });
  const r = await p.evaluate((s) => { const e = document.querySelector(s); const q = e.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2, w: q.width, h: q.height }; }, CIBLE[id]);
  await p.touchscreen.tap(r.x, r.y); await att(400);
  await p.screenshot({ path: path.join(lot, 'captures', id + '-toucher.png') });
  console.log(id, 'cible', Math.round(r.w) + '×' + Math.round(r.h), 'px', err.length ? 'ERREURS ' + err.join(' | ') : 'sans erreur');
  await p.close();
}
await b.close();
