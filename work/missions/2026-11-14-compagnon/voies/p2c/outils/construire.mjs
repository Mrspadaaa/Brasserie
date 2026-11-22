// Construit p2c/etat.html et le capture en clair puis en cave (page entière, deviceScaleFactor 2).
// Mesure aussi, par cadre : débordement horizontal, chevauchement des marques de la frise (D164, « Pas super la
// superposition »), plus grand vide en bas de la feuille (120 px au plus). Recadrages de lecture : argument 2 (dossier).
// Usage (racine du dépôt) : node work/missions/2026-11-14-compagnon/voies/p2c/outils/construire.mjs [dossier-recadrages]
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { page } from './commun.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const VOIE = path.resolve(ICI, '..');
const RACINE = path.resolve(VOIE, '../../../../..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const id = 'p2c';
const recad = process.argv[2];

const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
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
const mes = await p.evaluate(() => [...document.querySelectorAll('[data-cadre]')].map((c) => {
  const r = c.getBoundingClientRect();
  const vis = (e) => { const b = e.getBoundingClientRect(); const s = getComputedStyle(e); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const hors = [...c.querySelectorAll('*')].filter((e) => vis(e) && !e.closest('[data-defile]') && (e.getBoundingClientRect().right > r.right + 1 || e.getBoundingClientRect().left < r.left - 1)).length;
  // Chevauchements entre marques de la frise (libellés, jours, épingles, tête d'aujourd'hui).
  const chev = [];
  for (const f of c.querySelectorAll('[data-booster^="frise"]')) {
    const m = [...f.querySelectorAll('[data-m]')].filter(vis).map((e) => ({ n: e.dataset.m, b: e.getBoundingClientRect() }));
    for (let i = 0; i < m.length; i++) for (let j = i + 1; j < m.length; j++) {
      const a = m[i].b, b = m[j].b;
      if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) chev.push(`${m[i].n}×${m[j].n}`);
    }
  }
  // Vide en bas : du dernier contenu du fil jusqu'au bas du fil.
  let vide = 0;
  for (const fil of c.querySelectorAll('[data-fil]')) {
    const fb = fil.getBoundingClientRect();
    const bas = Math.max(fb.top, ...[...fil.querySelectorAll('*')].filter(vis).map((e) => e.getBoundingClientRect().bottom));
    vide = Math.max(vide, Math.round(fb.bottom - bas));
  }
  return `${c.dataset.cadre}: hors ${hors}, chevauchements ${chev.length ? chev.join(',') : 0}, vide bas ${vide} px`;
}));
for (const theme of ['clair', 'cave']) {
  await p.evaluate((t) => { if (t === 'cave') document.documentElement.setAttribute('data-theme', 'cave'); else document.documentElement.removeAttribute('data-theme'); }, theme);
  await p.screenshot({ path: path.join(VOIE, id, `${id}-${theme}.png`), fullPage: true });
  if (recad) {
    mkdirSync(recad, { recursive: true });
    const boites = await p.evaluate(() => [...document.querySelectorAll('[data-cadre]')].map((c) => { const b = c.getBoundingClientRect(); return { n: c.dataset.cadre, x: b.left + scrollX, y: b.top + scrollY - 24, w: b.width, h: b.height + 24 }; }));
    // Rangées de cadres de téléphone, puis le cadre bureau seul.
    const rangs = {};
    for (const b of boites) (rangs[Math.round(b.y)] ??= []).push(b);
    let k = 0;
    for (const r of Object.values(rangs)) {
      const x = Math.min(...r.map((b) => b.x)), y = r[0].y, w = Math.max(...r.map((b) => b.x + b.w)) - x, h = Math.max(...r.map((b) => b.h));
      await p.screenshot({ path: path.join(recad, `${theme}-rang${++k}-${r.map((b) => b.n).join('-')}.png`), clip: { x, y, width: w, height: h } });
    }
  }
}
console.log(`${id} : ${erreurs.length ? 'ERREURS ' + erreurs.join(' | ') : 'sans erreur'}`);
console.log(mes.join('\n'));
await p.close();
await nav.close();
