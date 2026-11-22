// Construit etat.html de chaque variante s2 et la capture en clair puis en cave (page entière, deviceScaleFactor 2).
// Usage (racine du dépôt) : node work/missions/2026-11-14-compagnon/voies/s2/outils/construire.mjs s2a,s2b
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { page } from './commun.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const VOIE = path.resolve(ICI, '..');
const RACINE = path.resolve(VOIE, '../../../../..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');

const ids = (process.argv[2] || 's2a,s2b,s2c,s2d').split(',');
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const id of ids) {
  const mod = await import(pathToFileURL(path.join(VOIE, id, 'source.mjs')).href + `?t=${Date.now()}`);
  const fichier = path.join(VOIE, id, 'etat.html');
  writeFileSync(fichier, page({ id, ...mod.default }));
  const p = await nav.newPage();
  const erreurs = [];
  p.on('pageerror', (e) => erreurs.push(String(e)));
  p.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) erreurs.push('réseau ' + r.url()); });
  await p.setViewport({ width: 1740, height: 900, deviceScaleFactor: 2 });
  await p.goto(pathToFileURL(fichier).href, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  // Débordements dans chaque feuille : le contenu qui dépasse le cadre est signalé (pas une erreur, une information).
  const deb = await p.evaluate(() => [...document.querySelectorAll('[data-cadre]')].map((c) => {
    const r = c.getBoundingClientRect();
    const hors = [...c.querySelectorAll('*')].filter((e) => { const b = e.getBoundingClientRect(); return b.width && (b.right > r.right + 1 || b.left < r.left - 1); }).length;
    return `${c.dataset.cadre}:${hors}`;
  }).join(' '));
  for (const theme of ['clair', 'cave']) {
    await p.evaluate((t) => { if (t === 'cave') document.documentElement.setAttribute('data-theme', 'cave'); else document.documentElement.removeAttribute('data-theme'); }, theme);
    await p.screenshot({ path: path.join(VOIE, id, `${id}-${theme}.png`), fullPage: true });
  }
  console.log(`${id} : ${erreurs.length ? 'ERREURS ' + erreurs.join(' | ') : 'sans erreur'} ; débordement horizontal ${deb}`);
  await p.close();
}
await nav.close();
