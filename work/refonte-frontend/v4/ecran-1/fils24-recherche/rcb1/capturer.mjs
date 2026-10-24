// Série rcb : captures (premier écran 390 × 844 ×2 → captures/<id>.png ; page entière → captures/<id>-page.png ;
// fiche ouverte à l'appui long → captures/<id>-fiche.png) et mesures du premier écran : mots visibles, tailles de
// texte distinctes, plus petite taille, erreurs de page, débordement.
// Usage : node rcb1/capturer.mjs rcb1 rcb2 rcb3 rcb4
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
const ici = path.dirname(fileURLToPath(import.meta.url));
const LOT = path.resolve(ici, '..'), C = path.join(LOT, 'captures');
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const mesure = () => {
  const vus = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const t = n.textContent.trim(); if (!t) continue;
    const el = n.parentElement; if (!el || el.closest('script,style,[hidden],[aria-hidden="true"]')) continue;
    const r = document.createRange(); r.selectNodeContents(n); const bx = r.getBoundingClientRect();
    if (!bx.width || bx.bottom < 0 || bx.top > innerHeight) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    vus.push({ t, fs: parseFloat(cs.fontSize) });
  }
  const mots = vus.flatMap((v) => v.t.split(/\s+/)).filter((m) => /[\p{L}\p{N}]/u.test(m)).length;
  const tailles = [...new Set(vus.map((v) => v.fs))].sort((a, b) => a - b);
  return { mots, tailles, resultats: document.querySelectorAll('[data-houblon]').length };
};
for (const id of process.argv.slice(2)) {
  const url = pathToFileURL(path.join(LOT, id, 'etat.html')).href;
  const p = await b.newPage(); const err = []; p.on('pageerror', (e) => err.push(e.message));
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(url, { waitUntil: 'load' }); await new Promise((r) => setTimeout(r, 250));
  const m = await p.evaluate(mesure);
  await p.screenshot({ path: path.join(C, id + '.png') });
  await p.screenshot({ path: path.join(C, id + '-page.png'), fullPage: true });
  const deb = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  // La fiche à l'appui long sur la première ligne visible.
  const l = await p.$('[data-role="ligne-houblon"]');
  if (l) { const t = await l.touchStart(); await new Promise((r) => setTimeout(r, 700)); await t.end(); await new Promise((r) => setTimeout(r, 300)); await p.screenshot({ path: path.join(C, id + '-fiche.png') }); }
  console.log(id, JSON.stringify(m), err.length ? 'ERREURS ' + err.join(' | ') : '', deb ? 'DÉBORDEMENT' : '');
  await p.close();
}
await b.close();
