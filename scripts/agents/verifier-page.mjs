#!/usr/bin/env node
// Vérifie une page de lot avant publication (leçon L12) : rendu réel dans Chrome au format téléphone,
// aucune erreur de script, chaque image du contenu chargée, pas de défilement horizontal.
// Usage : node scripts/agents/verifier-page.mjs <page.html> [--captures <préfixe>] [--min-images N]
// Le 22.10, la page du lot 22 a été publiée avec une apostrophe qui cassait son script : les
// variantes n'apparaissaient pas, et rien ne l'avait vérifié.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const args = process.argv.slice(2);
const option = (nom, defaut) => { const i = args.indexOf(nom); return i >= 0 ? args[i + 1] : defaut; };
const page = path.resolve(args[0] ?? '');
const captures = option('--captures', null);
const minImages = Number(option('--min-images', 1));

const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const erreurs = [];
try {
  const p = await nav.newPage();
  p.on('pageerror', (e) => erreurs.push(`erreur de script : ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') erreurs.push(`console : ${m.text()}`); });
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await p.goto(`file:///${page.split(path.sep).join('/')}`, { waitUntil: 'networkidle0' });
  const r = await p.evaluate(() => {
    // Les images sans source (une visionneuse fermée) ne font pas partie du contenu.
    const imgs = [...document.images].filter((i) => i.getAttribute('src'));
    return {
      images: imgs.length,
      ratees: imgs.filter((i) => !(i.complete && i.naturalWidth > 0)).map((i) => i.getAttribute('src')),
      debord: document.documentElement.scrollWidth - innerWidth,
    };
  });
  if (r.ratees.length) erreurs.push(`images non chargées : ${r.ratees.join(', ')}`);
  if (r.images < minImages) erreurs.push(`${r.images} images (${minImages} au moins)`);
  if (r.debord > 0) erreurs.push(`défilement horizontal de ${r.debord} px à 390 px`);
  if (captures) {
    await p.screenshot({ path: `${captures}-haut.png` });
    await p.screenshot({ path: `${captures}-page.png`, fullPage: true });
  }
  for (const e of erreurs) console.log(`  - ${e}`);
  console.log(erreurs.length ? 'PAGE ECHEC' : `PAGE OK (${r.images} images chargées, 390 px, sans erreur)`);
  if (captures) console.log(`Captures à ouvrir avant de publier : ${captures}-haut.png, ${captures}-page.png`);
} finally {
  await nav.close();
}
process.exitCode = erreurs.length ? 1 : 0;
