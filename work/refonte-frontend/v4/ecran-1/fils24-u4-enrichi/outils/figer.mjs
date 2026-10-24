// Fige les cinq petites variantes de u4 enrichi (voie r9, 24.10, soir ; le brasseur : « U4 enrichir semble vraiment
// mieux même si pas du 100% regarde pour faire quelques petites variante, amélioration »). Chaque variante ne touche
// qu'un point ; elle est rendue par la maquette jouable (Substituer, `?u4e=u4e1`…, moteur v4 en direct), puis son DOM
// rendu est figé, comme jc-graphes : outerHTML et style.css copiés, classes `pq-substituer-` renommées `u4e-`, ids
// React renommés, aucun script de l'app. Trois moments par page (60′, whirlpool, dry hop), changés par la puce ; la
// fiche de chaque houblon montré (appui long, survol) est figée aussi.
// Lecture seule de prototypes/ (la construction `maquettes/parcours-substituer` doit être faite avant).
// Usage (racine du dépôt) : node work/refonte-frontend/v4/ecran-1/fils24-u4-enrichi/outils/figer.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const LOT = path.resolve(ici, '..');
const RACINE = path.resolve(LOT, '../../../../..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const MAQ = path.join(RACINE, 'prototypes/houblons-v4/maquettes/parcours-substituer');
const PAGE = pathToFileURL(path.join(MAQ, 'substituer/etat.html')).href;
const VARIANTES = ['u4e1', 'u4e2', 'u4e3', 'u4e4', 'u4e5'];
const MOMENTS = ['chaud', 'whirlpool', 'dryhop'];
const attente = (ms) => new Promise((r) => setTimeout(r, ms));
const sub = (s, a, b) => s.split(a).join(b);
// Renommages (L26) : nos classes et les ids de React appartiennent à la maquette, pas à la page figée.
const renommer = (s) => sub(sub(s, 'pq-substituer-', 'u4e-'), '_r_', 'u4e-r');

const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const ouvrir = async (q) => {
  const p = await nav.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await p.goto(PAGE + q, { waitUntil: 'networkidle0' });
  await attente(700);
  return p;
};
const moment = async (p, m) => { if (m === 'chaud') return; await p.click(`[data-moment="${m}"]`); await attente(800); };

// Marque les clés des houblons (appui long → fiche) et pose data-houblon sur les noms (convention de controle-fiche).
const marquer = () => {
  const nug = 'beermaverick-nugget';
  for (const e of document.querySelectorAll('[data-houblon]')) { e.setAttribute('data-u4e-houblon-nom', e.getAttribute('data-houblon')); e.removeAttribute('data-houblon'); }
  for (const e of document.querySelectorAll('[data-remplacant]')) e.setAttribute('data-u4e-cle', e.dataset.remplacant);
  for (const e of document.querySelectorAll('.pq-substituer-bande[data-col]')) e.setAttribute('data-u4e-cle', e.dataset.col);
  for (const e of document.querySelectorAll('[data-role="original-rang"] > div')) e.setAttribute('data-u4e-cle', nug);
  for (const e of document.querySelectorAll('[data-u4e-cle] .pq-substituer-nom > span:last-child, .pq-substituer-bande-n > span:first-child')) {
    e.setAttribute('data-houblon', e.closest('[data-u4e-cle]').getAttribute('data-u4e-cle'));
  }
  // La puce reste un vrai choix figé : la page le jouera entre ses trois états.
  return document.getElementById('parcours').innerHTML;
};

// 1. Les fiches : une par houblon montré (rangs, bandes, Nugget), à chaque moment, depuis u4 enrichi.
const fiches = {};
for (const m of MOMENTS) {
  const p = await ouvrir('');
  await moment(p, m);
  const cles = await p.evaluate(() => [...new Set(['beermaverick-nugget', ...[...document.querySelectorAll('[data-remplacant]')].map((e) => e.dataset.remplacant), ...[...document.querySelectorAll('.pq-substituer-bande[data-col]')].map((e) => e.dataset.col)])]);
  for (const k of cles) {
    if (fiches[k]) continue;
    const sel = k === 'beermaverick-nugget' ? '[data-role="original-rang"] > div' : `[data-remplacant="${k}"]`;
    let h = await p.$(sel);
    if (!h) h = await p.$(`.pq-substituer-bande[data-col="${k}"]`);
    await h.evaluate((e) => e.scrollIntoView({ block: 'center' }));
    await attente(200);
    const avant = await p.evaluate(() => [...document.body.children].length);
    const b = await h.boundingBox();
    const t = await p.touchscreen.touchStart(b.x + 24, b.y + b.height / 2);
    await attente(720); await t.end(); await attente(600);
    const html = await p.evaluate((n) => [...document.body.children].slice(n).map((e) => e.outerHTML).join(''), avant);
    if (!html.includes('data-role="fiche"')) { console.log('ECHEC fiche', k); continue; }
    fiches[k] = renommer(html);
    await p.keyboard.press('Escape'); await attente(400);
  }
  await p.close();
}
fs.writeFileSync(path.join(LOT, 'assets/fiches.js'), `// Fiches figées (appui long, survol), une par houblon montré, depuis la maquette jouable (outils/figer.mjs).\nwindow.U4E_FICHES = ${JSON.stringify(fiches)};\n`);
console.log('fiches', Object.keys(fiches).length, Math.round(JSON.stringify(fiches).length / 1024) + ' ko');

// 2. La feuille de style de la maquette, renommée.
fs.writeFileSync(path.join(LOT, 'assets/style.css'), renommer(fs.readFileSync(path.join(MAQ, 'assets/style.css'), 'utf8')));

// 3. Chaque variante, ses trois moments.
const tete = fs.readFileSync(path.join(MAQ, 'substituer/etat.html'), 'utf8').split('<body')[0]
  .split('<title>Stout export · Houblons</title>').join('<title>Substituer · u4 enrichi · VARIANTE</title>');
for (const v of VARIANTES) {
  const etats = {};
  for (const m of MOMENTS) {
    const p = await ouvrir(`?u4e=${v}`);
    await moment(p, m);
    etats[m] = renommer(await p.evaluate(marquer));
    await p.close();
  }
  const page = [
    tete.split('VARIANTE').join(v),
    `<body data-route="substituer" data-u4e-page="${v}" class="overflow-x-hidden font-sans bg-cave-950">\n`,
    `<!-- Page figée (outils/figer.mjs) : DOM rendu par la maquette jouable, ${v}, moteur v4 du 24.10. -->\n`,
    `<div id="parcours">${etats.chaud}</div>\n`,
    ...MOMENTS.map((m) => `<template data-u4e-moment="${m}">${etats[m]}</template>\n`),
    '<link rel="stylesheet" href="../assets/style.css" />\n<script src="../assets/fiches.js"></script>\n<script src="../assets/u4e.js"></script>\n</body>\n</html>\n',
  ].join('');
  fs.mkdirSync(path.join(LOT, v), { recursive: true });
  fs.writeFileSync(path.join(LOT, v, 'etat.html'), page);
  console.log(v, Math.round(page.length / 1024) + ' ko');
}
await nav.close();
