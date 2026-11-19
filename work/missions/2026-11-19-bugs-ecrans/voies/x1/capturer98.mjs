#!/usr/bin/env node
// Voie x1 : BR-98 seul, liste « Houblon pour ce style » ouverte (frappe « Cit »), banc de la fiche recette. Même lancement que capturer.mjs (port 3108).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const port = (process.env.WITH_SERVER_PORTS ?? '3108').split(',')[0];
const SORTIE = path.join(import.meta.dirname, 'captures');
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const cas = [['1280-clair', 1280, 800, false, 1, 'clair'], ['390-cave', 390, 844, true, 2, 'cave'], ['390-clair', 390, 844, true, 2, 'clair'], ['1280-cave', 1280, 800, false, 1, 'cave']];
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
const sortie = [];
for (const [tag, l, h, tactile, echelle, theme] of cas) {
  const q = await nav.newPage(); q.setDefaultNavigationTimeout(180000);
  await q.setViewport({ width: l, height: h, isMobile: tactile, hasTouch: tactile, deviceScaleFactor: echelle });
  await q.goto(`http://localhost:${port}/work/missions/2026-11-19-bugs-ecrans/voies/x1/banc/banc.html?theme=${theme}`, { waitUntil: 'domcontentloaded' });
  await q.waitForFunction(() => document.querySelector('button.rc-lien') !== null, { timeout: 120000 });
  const clic = (re) => q.evaluate((m) => { const b = [...document.querySelectorAll('button,[role="tab"]')].find((x) => new RegExp(m).test(x.getAttribute('aria-label') ?? x.textContent ?? '')); if (b) b.click(); return !!b; }, re);
  await clic('Potentiel'); await dormir(1500); await clic('^Simuler$'); await dormir(800);
  await q.select('select[aria-label="Ajout à simuler"]', '-1'); await dormir(600);
  const combo = await q.$('[aria-label="Houblon du scénario"]');
  sortie.push(`${tag} combobox : ${!!combo}`);
  if (combo) { await combo.evaluate((c) => c.scrollIntoView({ block: 'start' })); await combo.click(); await combo.type('Cit'); await dormir(900); }
  sortie.push(`${tag} options : ${await q.evaluate(() => [...document.querySelectorAll('[role="option"]')].slice(0, 3).map((o) => o.textContent).join(' || '))}`);
  await q.screenshot({ path: path.join(SORTIE, `br98-liste-${tag}.png`) });
  await q.close();
}
await nav.close();
console.log(sortie.join('\n'));
console.log('CAPTURES98 OK');
