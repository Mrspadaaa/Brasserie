#!/usr/bin/env node
// p3a : une capture par état (?etat=) à 390 × 844 tactile, plus repos et échec à 1280 × 800, et deux gestes joués.
// Usage : node work/missions/2026-10-31-ecran-depense/v3/p3a-1/capturer.mjs <id>   (id = p3a-1, p3a-2, p3a-3)
import path from 'node:path';
import { createRequire } from 'node:module';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const id = process.argv[2] || 'p3a-1';
const dossier = path.join(import.meta.dirname, '..', id);
const url = 'file:///' + path.join(dossier, 'etat.html').replace(/\\/g, '/');
const ETATS = ['repos', 'defile', 'renvoi', 'regle', 'tous', 'papier', 'envoi', 'recu', 'echec', 'rouvert', 'lecture', 'horsligne', 'annexe'];
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
const erreurs = [];
async function prendre(etat, l, h, nom, geste) {
  const p = await nav.newPage();
  p.on('pageerror', (e) => erreurs.push(`${nom}: ${e.message}`));
  await p.setViewport({ width: l, height: h, isMobile: l < 900, hasTouch: l < 900, deviceScaleFactor: 1 });
  await p.goto(`${url}?etat=${etat}`, { waitUntil: 'networkidle0' }).catch(() => {});
  await p.evaluate(() => document.fonts && document.fonts.ready);
  await dormir(500);
  if (geste) { await geste(p); await dormir(700); }
  await p.screenshot({ path: path.join(dossier, `${id}-${nom}.png`) });
  await p.close();
}
for (const e of ETATS) await prendre(e, 390, 844, e);
await prendre('repos', 1280, 800, '1280-repos');
await prendre('echec', 1280, 800, '1280-echec');
await prendre('repos', 390, 844, 'geste-tva', (p) => p.click('[data-pan="1"]'));
await prendre('repos', 390, 844, 'geste-plateau', (p) => p.evaluate(() => { document.querySelector('[data-ouvrir="1"]').click(); }));
await nav.close();
console.log(erreurs.length ? 'CAPTURES ERREURS\n' + erreurs.join('\n') : `CAPTURES OK ${ETATS.length + 4} (${id})`);
