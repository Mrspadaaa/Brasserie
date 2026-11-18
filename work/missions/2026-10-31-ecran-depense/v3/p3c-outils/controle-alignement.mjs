#!/usr/bin/env node
// D248 : « mettre plus en avant la quantité, juste mettre en gras, et bien alignées les champs » (sur p3c-3).
// node work/missions/2026-10-31-ecran-depense/v3/p3c-outils/controle-alignement.mjs <id…>
//   id = p3c-3 (v3/p3c-3/etat.html) ou p3c-3-avant (témoin, v3/p3c-outils/temoin-p3c-3/p3c-3-avant/etat.html)
// À 390 × 844 tactile et à 1280 × 800, états repos, defile, tous (ordre par catégorie, réseau externe coupé) :
//  - quantité de chaque ligne (.p3a3-dq > span:first-child) et de chaque sous-total de bande (.p3a3-gh .p3a3-q) : font-weight ≥ 600 ;
//    sa taille et sa couleur, celles du témoin (seul le gras change) ;
//  - prix (.p3a3-dq > span:last-child) et montants (.p3a3-mm des lignes, .p3a3-mt des bandes) : taille, couleur et graisse du témoin ;
//  - bords droits des quantités alignés à 1 px près, lignes ET sous-totaux, tous groupes confondus ;
//  - prix alignés sur leur virgule à 1 px près (le prix s'écrit tel qu'imprimé, 2 à 4 décimales : la virgule est le repère) ;
//  - bords droits des montants alignés à 1 px près, lignes ET sous-totaux.
// Les rangées de mouture (ordre du papier) n'existent pas en catégorie dans p3c-3 : la mouture y est la pastille de son malt, et le
// malt rattaché (état tous) est mesuré comme les autres. Sortie : une ligne par vue, puis ALIGNE OK ou ALIGNE ECHEC — raison.
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const V3 = path.resolve(import.meta.dirname, '..');
const RACINE = path.resolve(V3, '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TEMOIN = path.join(import.meta.dirname, 'temoin-p3c-3', 'p3c-3-avant', 'etat.html');
const fichier = (id) => { const a = path.join(V3, id, 'etat.html'); if (fs.existsSync(a)) return a; const b = path.join(import.meta.dirname, 'temoin-p3c-3', id, 'etat.html'); return fs.existsSync(b) ? b : null; };
const ids = process.argv.slice(2);
if (!ids.length) { console.log('usage : controle-alignement.mjs <id…>'); process.exit(2); }
const VUES = [[390, 844], [1280, 800]];
const ETATS = ['repos', 'defile', 'tous'];
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

function mesurer() {
  const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && !e.closest('[hidden]'); };
  const bornes = (e) => { const g = document.createRange(); g.selectNodeContents(e); const r = g.getBoundingClientRect(); return { l: r.left, r: r.right }; };
  const virgule = (e) => { // x de la virgule du prix
    const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let t;
    while ((t = w.nextNode())) { const i = t.data.indexOf(','); if (i >= 0) { const g = document.createRange(); g.setStart(t, i); g.setEnd(t, i + 1); const r = g.getBoundingClientRect(); return (r.left + r.right) / 2; } }
    return NaN;
  };
  const st = (e) => { const s = getComputedStyle(e); return { w: Number(s.fontWeight), z: s.fontSize, c: s.color }; };
  const grp = (e) => (e.closest('[data-groupe]') || {}).dataset?.groupe || '?';
  const nomLigne = (e) => { const li = e.closest('[data-ligne]'); return li ? 'ligne ' + li.dataset.ligne : 'bande ' + grp(e); };
  const out = { qte: [], prix: [], mont: [] };
  document.querySelectorAll('li[data-ligne] .p3a3-dq').forEach((dq) => {
    if (!vis(dq)) return;
    const q = dq.firstElementChild, p = dq.lastElementChild;
    out.qte.push({ ou: nomLigne(dq), x: bornes(q).r, ...st(q), sorte: 'ligne' });
    out.prix.push({ ou: nomLigne(dq), x: virgule(p), ...st(p), sorte: 'ligne' });
  });
  document.querySelectorAll('li[data-ligne] .p3a3-r .p3a3-mm').forEach((m) => { if (vis(m)) out.mont.push({ ou: nomLigne(m), x: bornes(m).r, ...st(m), sorte: 'ligne' }); });
  document.querySelectorAll('.p3a3-gh').forEach((gh) => {
    if (!vis(gh) || !gh.closest('[data-groupe]')) return;
    const q = gh.querySelector('.p3a3-q'), m = gh.querySelector('.p3a3-mt');
    if (q && q.textContent.trim()) out.qte.push({ ou: 'bande ' + grp(gh), x: bornes(q).r, ...st(q), sorte: 'bande' });
    if (m) out.mont.push({ ou: 'bande ' + grp(gh), x: bornes(m).r, ...st(m), sorte: 'bande' });
  });
  return out;
}

const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
async function vue(f, l, h, etat) {
  const p = await nav.newPage();
  await p.setViewport({ width: l, height: h, isMobile: l < 900, hasTouch: l < 900, deviceScaleFactor: 1 });
  await p.setRequestInterception(true);
  p.on('request', (r) => (/^(file:|data:|blob:|about:)/.test(r.url()) ? r.continue() : r.abort('blockedbyclient')));
  await p.goto('file:///' + f.replace(/\\/g, '/') + '?etat=' + etat, { waitUntil: 'load' });
  await p.waitForSelector('[data-ligne]');
  await p.evaluate(() => document.fonts && document.fonts.ready);
  await dormir(400);
  const m = await p.evaluate(mesurer);
  await p.close();
  return m;
}
const ecart = (xs) => (xs.length ? Math.max(...xs) - Math.min(...xs) : 0);
const pire = (arr) => { const xs = arr.map((a) => a.x); const med = [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]; const p = arr.reduce((a, b) => (Math.abs(b.x - med) > Math.abs(a.x - med) ? b : a)); return `${p.ou} à ${(p.x - med).toFixed(1)} px`; };
const pareil = (a, b) => a.z === b.z && a.c === b.c;

let echecs = [];
try {
  // le style de référence (témoin) : prix, montant de ligne, montant de bande, quantités (taille et couleur)
  const ref = await vue(TEMOIN, 390, 844, 'repos');
  const R = { prix: ref.prix[0], montL: ref.mont.find((m) => m.sorte === 'ligne'), montB: ref.mont.find((m) => m.sorte === 'bande'), qteL: ref.qte.find((q) => q.sorte === 'ligne'), qteB: ref.qte.find((q) => q.sorte === 'bande') };
  for (const id of ids) {
    const f = fichier(id);
    if (!f) { echecs.push(`${id} : etat.html absent`); continue; }
    for (const [l, h] of VUES) for (const etat of ETATS) {
      const m = await vue(f, l, h, etat);
      const r = [];
      const maigres = m.qte.filter((q) => q.w < 600);
      if (maigres.length) r.push(`${maigres.length}/${m.qte.length} quantités pas en gras (${maigres.slice(0, 2).map((q) => q.ou).join(', ')})`);
      const qStyle = m.qte.filter((q) => !pareil(q, q.sorte === 'ligne' ? R.qteL : R.qteB));
      if (qStyle.length) r.push(`quantité : taille ou couleur changée (${qStyle[0].ou})`);
      const pStyle = m.prix.filter((x) => !(pareil(x, R.prix) && x.w === R.prix.w));
      const mStyle = m.mont.filter((x) => { const b = x.sorte === 'ligne' ? R.montL : R.montB; return !(pareil(x, b) && x.w === b.w); });
      if (pStyle.length) r.push(`prix changé (${pStyle[0].ou})`);
      if (mStyle.length) r.push(`montant changé (${mStyle[0].ou})`);
      const eq = ecart(m.qte.map((q) => q.x)), ep = ecart(m.prix.map((x) => x.x)), em = ecart(m.mont.map((x) => x.x));
      if (eq > 1) r.push(`quantités : bords droits sur ${eq.toFixed(1)} px (pire : ${pire(m.qte)})`);
      if (ep > 1) r.push(`prix : virgules sur ${ep.toFixed(1)} px (pire : ${pire(m.prix)})`);
      if (em > 1) r.push(`montants : bords droits sur ${em.toFixed(1)} px (pire : ${pire(m.mont)})`);
      console.log(`${id} ${l} ${etat} : ${m.qte.length} quantités (${m.qte.filter((q) => q.sorte === 'bande').length} de bande), écart ${eq.toFixed(1)} px ; ${m.prix.length} prix, ${ep.toFixed(1)} px ; ${m.mont.length} montants, ${em.toFixed(1)} px${r.length ? ' → ' + r.join(' ; ') : ' ; ok'}`);
      if (r.length) echecs.push(`${id} ${l} ${etat} : ${r[0]}`);
    }
  }
} finally { await nav.close(); }
console.log(echecs.length ? `ALIGNE ECHEC — ${echecs.length} vue(s) : ${echecs.slice(0, 3).join(' | ')}` : `ALIGNE OK (${ids.length} × ${VUES.length * ETATS.length} vues)`);
process.exit(echecs.length ? 1 : 0);
