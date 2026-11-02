#!/usr/bin/env node
// Série u (QR v0) : une capture par état (?etat=) à 390 × 844 tactile, confirme et contredit à 1280 × 800, puis le geste
// principal joué sur « contredit » (le premier [data-geste] de la page, puis les suivants s'il y en a) : avant / après.
// Usage : node work/missions/2026-10-31-ecran-depense/qr/v0/u-outils/capturer.mjs u1
import path from 'node:path';
import { createRequire } from 'node:module';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const id = process.argv[2] || 'u1';
const dossier = path.join(import.meta.dirname, '..', id);
const url = 'file:///' + path.join(dossier, 'etat.html').replace(/\\/g, '/');
const ETATS = ['confirme', 'contredit', 'partiel', 'illisible', 'sans', 'lecture'];
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
const erreurs = [];
let n = 0;
async function prendre(etat, l, h, nom, geste) {
  const p = await nav.newPage();
  p.on('pageerror', (e) => erreurs.push(`${nom}: ${e.message}`));
  await p.setViewport({ width: l, height: h, isMobile: l < 900, hasTouch: l < 900, deviceScaleFactor: 1 });
  await p.goto(`${url}?etat=${etat}`, { waitUntil: 'networkidle0' }).catch(() => {});
  await p.evaluate(() => document.fonts && document.fonts.ready);
  await dormir(400);
  if (geste) {
    const ok = await geste(p);
    if (!ok) erreurs.push(`${nom}: geste introuvable`);
    await dormir(900);
  }
  await p.screenshot({ path: path.join(dossier, `${id}-${nom}.png`) });
  n++;
  await p.close();
}
for (const e of ETATS) await prendre(e, 390, 844, e);
await prendre('confirme', 1280, 800, '1280-confirme');
await prendre('contredit', 1280, 800, '1280-contredit');
await prendre('contredit', 390, 844, 'geste-apres', (p) => p.evaluate(() => {
  const g = [...document.querySelectorAll('[data-geste]')].sort((a, b) => Number(a.dataset.geste) - Number(b.dataset.geste));
  if (!g.length) return false;
  g.forEach((x) => x.click());
  return true;
}));
// Le second geste : toucher le signe du QR (sceau, rangée QR, ou à défaut le compte des lignes) sur « partiel ».
await prendre('partiel', 390, 844, 'geste-toucher', (p) => p.evaluate(() => {
  const g = document.querySelector('[data-booster="sceau"]') || document.querySelector('[data-booster="detail-qr"]') || document.querySelector('[data-booster="preuve"]');
  if (!g) return false;
  g.click();
  return true;
}));
await nav.close();
console.log(erreurs.length ? 'CAPTURES ERREURS\n' + erreurs.join('\n') : `CAPTURES OK ${n} (${id})`);
