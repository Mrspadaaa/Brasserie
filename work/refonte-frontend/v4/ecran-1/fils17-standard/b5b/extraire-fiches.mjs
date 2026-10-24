// Récupère les vraies fiches (g1) de la base : appui long de 650 ms sur le nom du houblon dans
// ecran-1/base/consolide/etat-b.html, puis le section.f-fiche[data-role="fiche"] ouvert (outerHTML).
// Usage : node extraire-fiches.mjs <sortie.json>
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const REPO = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie';
const SRC = REPO + '/work/refonte-frontend/v4/ecran-1/base/consolide/etat-b.html';
const out = process.argv[2];
const CLES = ['beermaverick-nelson-sauvin', 'beermaverick-motueka', 'beermaverick-aurum', 'beermaverick-east-kent-goldings', 'beermaverick-columbus', 'beermaverick-celeia', 'beermaverick-citra:cryo', 'beermaverick-galaxy', 'beermaverick-hallertau-blanc'];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await page.goto(pathToFileURL(SRC).href, { waitUntil: 'networkidle0' });
await wait(300);
const presents = await page.evaluate(() => ({ dom: [...new Set([...document.querySelectorAll('[data-houblon]')].map((e) => e.dataset.houblon))], fiches: typeof D !== 'undefined' && D.fichesH ? Object.keys(D.fichesH) : [] }));
console.log('data-houblon de la page :', presents.dom.join(', '));
console.log('fiches de la page :', presents.fiches.join(', '));
const res = {};
for (const cle of CLES) {
  const el = await page.$('[data-houblon="' + cle + '"]');
  let html = null, geste = 'appui long';
  if (el) {
    await el.evaluate((e) => e.scrollIntoView({ block: 'center' }));
    await wait(200);
    const b = await el.boundingBox();
    if (b) {
      await page.touchscreen.touchStart(b.x + Math.min(20, b.width / 2), b.y + b.height / 2);
      await wait(650);
      await page.touchscreen.touchEnd();
      await wait(450);
      html = await page.evaluate(() => { const f = document.querySelector('section.f-fiche[data-role="fiche"]'); return f ? f.outerHTML : null; });
    }
  }
  if (!html && presents.fiches.includes(cle)) {
    geste = 'ouvrirFiche (houblon sans nom visible sur la page)';
    html = await page.evaluate((c) => { ouvrirFiche(c, { mode: 'feuille' }); const f = document.querySelector('section.f-fiche[data-role="fiche"]'); return f ? f.outerHTML : null; }, cle);
  }
  if (html) {
    const nom = await page.evaluate(() => document.querySelector('section.f-fiche[data-role="fiche"]').getAttribute('aria-label').replace(/^Fiche de /, ''));
    // Les replis (Styles, Huiles, Sources, Substituts) : le rendu de la base, section par section.
    const sections = await page.evaluate(() => { const o = {}; for (const id of ["styles", "huiles", "sources", "subs"]) { FICHE.sec = id; construireFiche(); const x = document.querySelector("section.f-fiche .f-sec"); o[id] = x ? x.outerHTML : null; } FICHE.sec = null; construireFiche(); return o; });
    res[cle] = { nom, geste, html, sections };
    console.log(cle, '→', nom, '(' + geste + ', ' + html.length + ' o)');
  } else console.log(cle, '→ aucune fiche dans la base');
  await page.evaluate(() => { const b = document.querySelector('[data-role="fermer-fiche"]'); if (b) b.click(); });
  await wait(250);
  await page.keyboard.press('Escape');
  await wait(150);
}
await browser.close();
fs.writeFileSync(out, JSON.stringify(res, null, 1));
console.log('écrit ' + out);
