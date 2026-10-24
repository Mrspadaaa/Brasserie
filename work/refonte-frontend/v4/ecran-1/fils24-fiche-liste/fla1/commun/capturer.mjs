// Captures de la série a : premier écran (fiche ouverte par un vrai appui long, 390 × 844), page entière (la feuille
// dépliée), et les états du concept (C.etats : { nom, hop, geste(page) }). Navigateur et fichiers à soi.
// Usage : node capturer.mjs [fla3 …]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const lot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cap = path.join(lot, 'captures');
const voulus = process.argv.slice(2);
const ids = (voulus.length ? voulus : fs.readdirSync(lot).filter((d) => /^fla\d$/.test(d))).filter((d) => fs.existsSync(path.join(lot, d, 'etat.html')));
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function ouvrir(id, hop) {
  const pg = await b.newPage();
  await pg.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await pg.goto(pathToFileURL(path.join(lot, id, 'etat.html')).href, { waitUntil: 'networkidle0' });
  await wait(250);
  const pt = await pg.evaluate((k) => { const c = document.querySelector('[data-fla-h="' + k + '"] .' + document.title.split(' ')[0] + '-cl2') || document.querySelector('[data-fla-h="' + k + '"]'); const r = c.getBoundingClientRect(); return { x: r.left + r.width * 0.55, y: r.top + r.height / 2 }; }, hop);
  const t = await pg.touchscreen.touchStart(pt.x, pt.y); await wait(700); await t.end(); await wait(350);
  const ok = await pg.evaluate(() => !!document.querySelector('[data-role="fiche"]:not([hidden]), [data-fla-ouverte]:not(.x)'));
  if (!ok) throw new Error(id + ' : l\'appui long n\'a pas ouvert la fiche de ' + hop);
  return pg;
}
for (const id of ids) {
  const C = (await import(pathToFileURL(path.join(lot, id, 'concept.mjs')).href)).default;
  let pg = await ouvrir(id, C.hop);
  if (C.avant) { await C.avant(pg); await wait(300); }
  await pg.screenshot({ path: path.join(cap, id + '-premier-ecran.png') });
  // Page entière : la feuille dépliée sous le haut de l'étape.
  const h = await pg.evaluate(() => { const f = document.querySelector('[data-role="fiche"]:not([hidden]), [data-fla-ouverte]:not(.x)'); f.style.position = 'absolute'; f.style.bottom = 'auto'; f.style.overflow = 'visible'; f.style.height = 'auto'; const H = f.offsetTop + f.scrollHeight + 4; document.body.style.minHeight = H + 'px'; const v = document.querySelector('[class$="-voile"]'); v.style.position = 'absolute'; v.style.height = H + 'px'; return H; });
  await pg.setViewport({ width: 390, height: Math.max(844, h), deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await wait(200);
  await pg.screenshot({ path: path.join(cap, id + '-page.png'), fullPage: true });
  await pg.close();
  for (const e of C.etats || []) {
    pg = await ouvrir(id, e.hop || C.hop);
    if (e.geste) { await e.geste(pg); await wait(350); }
    await pg.screenshot({ path: path.join(cap, id + '-' + e.nom + '.png') });
    await pg.close();
  }
  // Au repos (l'étape), une fois : ce que voit le brasseur avant l'appui long.
  console.log(id + ' · captures : premier-ecran, page' + (C.etats || []).map((e) => ', ' + e.nom).join(''));
}
await b.close();
