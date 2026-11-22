// Construit les etat.html de la série s1 et les capture (clair puis cave, page entière, deviceScaleFactor 2),
// plus un cadre par fichier dans <id>/cadres/ pour le contrôle du panel.
// Usage : node work/missions/2026-11-14-compagnon/voies/s1/outils/build.mjs [ids…] [--sans-capture]
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ico, page } from './commun.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const VOIE = path.resolve(ICI, '..');
const RACINE = path.resolve(VOIE, '../../../../..');
const args = process.argv.slice(2);
const ids = args.filter((a) => !a.startsWith('--'));
const liste = ids.length ? ids : ['s1a', 's1b', 's1c', 's1d'];

for (const id of liste) {
  const mod = (await import(pathToFileURL(path.join(ICI, `${id}.mjs`)).href)).default(id, ico);
  mkdirSync(path.join(VOIE, id, 'cadres'), { recursive: true });
  writeFileSync(path.join(VOIE, id, 'etat.html'), page({ id, ...mod }));
}
if (args.includes('--sans-capture')) process.exit(0);

const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
try {
  for (const id of liste) {
    const p = await nav.newPage();
    const erreurs = [];
    p.on('pageerror', (e) => erreurs.push(e.message));
    await p.setViewport({ width: 1608, height: 900, deviceScaleFactor: 2 });
    await p.goto(pathToFileURL(path.join(VOIE, id, 'etat.html')).href, { waitUntil: 'networkidle0' });
    for (const theme of ['clair', 'cave']) {
      await p.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
      await p.evaluate(() => document.fonts.ready);
      await p.screenshot({ path: path.join(VOIE, id, `${id}-${theme}.png`), fullPage: true });
      for (const el of await p.$$('[data-cadre]')) {
        const c = await el.evaluate((e) => e.dataset.cadre);
        const tel = await el.$(`.${id}-tel`);
        await tel.screenshot({ path: path.join(VOIE, id, 'cadres', `${id}-${c}-${theme}.png`) });
      }
    }
    // Mesures : tailles de texte distinctes et débordements par cadre (lecture seule).
    const m = await p.evaluate((id) => [...document.querySelectorAll('[data-cadre]')].map((cad) => {
      const tailles = new Set();
      const w = document.createTreeWalker(cad.querySelector(`.${id}-tel`), NodeFilter.SHOW_TEXT);
      for (let t = w.nextNode(); t; t = w.nextNode()) {
        const e = t.parentElement; if (!t.textContent.trim() || !e) continue;
        const r = e.getBoundingClientRect(); if (!r.width) continue;
        tailles.add(Math.round(parseFloat(getComputedStyle(e).fontSize)));
      }
      const fil = cad.querySelector(`.${id}-fil`);
      return `${cad.dataset.cadre}: tailles ${[...tailles].sort((a, b) => a - b).join('/')}${fil && fil.scrollHeight > fil.clientHeight + 1 ? ` · fil déborde de ${fil.scrollHeight - fil.clientHeight} px` : ''}`;
    }), id);
    console.log(id, erreurs.length ? `ERREURS ${erreurs.join(' | ')}` : 'rendu sans erreur', '\n  ' + m.join('\n  '));
    await p.close();
  }
} finally { await nav.close(); }
