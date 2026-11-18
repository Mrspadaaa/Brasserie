#!/usr/bin/env node
// Contrôle 3 de VOIE.md : la référence A de chaque question reprend choix-lenteur/img/d-lue.png au pixel, hors de la ligne du cas.
// Compare chaque capture A (390 × 780, ×2) à d-lue.png (390 × 700, ×2) par zones : au-dessus de la ligne du cas, telle quelle ;
// sous elle, décalée de sa hauteur ; le pied, ramené au bas de l'écran. Rend les pixels différents, regroupés en boîtes (y, x),
// pour les nommer : seuls doivent différer les nombres que la ligne du cas change (total, lignes, Qté × prix, puce, bande).
// Usage (racine) : node work/missions/2026-10-31-ecran-depense/choix-lignes-38/outils/mesure-a.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const DOSSIER = path.resolve(ICI, '..');
const RACINE = path.resolve(DOSSIER, '..', '..', '..', '..');
const REF = path.join(DOSSIER, '..', 'choix-lenteur', 'img', 'd-lue.png');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await nav.newPage();
await p.setViewport({ width: 390, height: 780, deviceScaleFactor: 2 });

// La ligne du cas : sa boîte dans la maquette (px CSS). Aucune pour q2-a (retirée sans marque).
async function boite(nom, texte) {
  await p.goto(pathToFileURL(path.join(DOSSIER, 'maquettes', `${nom}.html`)).href, { waitUntil: 'networkidle0' }).catch(() => {});
  await p.evaluate(() => document.fonts.ready);
  return p.evaluate((t) => {
    const r = t && [...document.querySelectorAll('.cl-li')].find((e) => e.textContent.includes(t))?.getBoundingClientRect();
    return { haut: r ? r.top : null, h: r ? r.height : 0, pied: document.querySelector('.cl-pied').getBoundingClientRect().top };
  }, texte);
}

const url = (f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
async function comparer(nom, b) {
  await p.goto('about:blank');
  return p.evaluate(async ({ a, r, b }) => {
    const charge = (s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = s; });
    const [ia, ir] = await Promise.all([charge(a), charge(r)]);
    const px = (i) => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height); };
    const A = px(ia), R = px(ir), W = A.width, S = 2;
    const piedA = Math.round(b.pied * S), piedR = piedA - (A.height - R.height); // le pied est collé au bas : 80 px plus haut dans d-lue
    const y0 = b.haut === null ? piedR : Math.round(b.haut * S), h = Math.round(b.h * S);
    // Correspondance : ligne de A -> ligne de d-lue (ou -1 : zone sans équivalent, la ligne du cas ou le blanc ajouté).
    const vers = (y) => y < y0 ? y : y < y0 + h ? -1 : y >= piedA ? piedR + (y - piedA) : (y - h < piedR ? y - h : -1);
    const diff = []; let compare = 0; const blanc = [];
    for (let y = 0; y < A.height; y++) {
      const yr = vers(y);
      if (yr < 0 || yr >= R.height) { if (!(y >= y0 && y < y0 + h)) blanc.push(y); continue; }
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4, j = (yr * W + x) * 4; compare++;
        if (Math.abs(A.data[i] - R.data[j]) + Math.abs(A.data[i + 1] - R.data[j + 1]) + Math.abs(A.data[i + 2] - R.data[j + 2]) > 6) diff.push([x, y]);
      }
    }
    // Le blanc ajouté (780 contre 700 px de haut) doit être uni : on compte ses pixels non blancs.
    let tache = 0; for (const y of blanc) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (A.data[i] + A.data[i + 1] + A.data[i + 2] < 750) tache++; }
    // Boîtes : les pixels différents regroupés par bandes de lignes contiguës (écart ≤ 6 px), puis par x.
    const boites = []; diff.sort((u, v) => u[1] - v[1]);
    for (const [x, y] of diff) {
      const bo = boites.find((q) => y - q.y2 <= 6 && x >= q.x1 - 40 && x <= q.x2 + 40);
      if (bo) { bo.x1 = Math.min(bo.x1, x); bo.x2 = Math.max(bo.x2, x); bo.y2 = Math.max(bo.y2, y); bo.n++; } else boites.push({ x1: x, x2: x, y1: y, y2: y, n: 1 });
    }
    return { compare, diff: diff.length, tache, blanc: blanc.length, y0, h, boites: boites.map((q) => ({ x: [q.x1 / S, q.x2 / S], y: [q.y1 / S, q.y2 / S], n: q.n })) };
  }, { a: url(path.join(DOSSIER, 'img', `${nom}.png`)), r: url(REF), b });
}

const CAS = [['q2-a', null], ['q1-a', 'Mosaic']];
let ko = 0;
for (const [nom, texte] of CAS) {
  const b = await boite(nom, texte);
  const m = await comparer(nom, b);
  console.log(`${nom} : ligne du cas ${b.haut === null ? 'aucune' : `y ${b.haut}–${b.haut + b.h} px`} · ${m.compare} pixels comparés · ${m.diff} différents · blanc ajouté ${m.blanc / 2} px, ${m.tache} pixels non blancs`);
  for (const q of m.boites) console.log(`   diffère : x ${q.x[0]}–${q.x[1]}, y ${q.y[0]}–${q.y[1]} (${q.n} px)`);
  const reel = m.boites.filter((q) => q.n > 2); // une boîte de 1 ou 2 pixels : lissage du texte au rendu, pas un dessin
  console.log(`   ${reel.length} boîte(s) de plus de 2 pixels`);
  if (nom === 'q2-a' && reel.length) ko++;
  if (m.tache) ko++;
}
await nav.close();
console.log(ko ? 'MESURE-A ECHEC' : 'MESURE-A OK (q2-a : identique hors lissage ; q1-a : seules les boîtes listées diffèrent, à nommer)');
process.exit(ko ? 1 : 0);
