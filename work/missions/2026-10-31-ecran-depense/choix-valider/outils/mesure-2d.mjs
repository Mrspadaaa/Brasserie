#!/usr/bin/env node
// Contrôle 3 de VOIE.md (l2b-valider) : hors de la seconde ligne et du bandeau, A reprend choix-lignes-38/img/q2-d-arrivee.png au pixel.
// Zones de a-arrivee (390 × 860, ×2) : au-dessus d'Amarillo telle quelle ; sous elle, décalée de sa hauteur ; le pied ramené au bas.
// Exclus : la rangée Amarillo et le bandeau de A, le bandeau de sa maquette. Le blanc sans équivalent doit être uni.
// Rend les pixels différents en boîtes, à nommer. Usage (racine) : node work/missions/2026-10-31-ecran-depense/choix-valider/outils/mesure-2d.mjs [vue]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const DOSSIER = path.resolve(ICI, '..');
const RACINE = path.resolve(DOSSIER, '..', '..', '..', '..');
const L38 = path.join(DOSSIER, '..', 'choix-lignes-38');
const vue = process.argv[2] ?? 'a-arrivee';
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await nav.newPage();

async function boites(fichier, haut) {
  await p.setViewport({ width: 390, height: haut, deviceScaleFactor: 2 });
  await p.goto(pathToFileURL(fichier).href, { waitUntil: 'networkidle0' }).catch(() => {});
  await p.evaluate(() => document.fonts.ready);
  return p.evaluate(() => {
    const r = (e) => e ? { t: e.getBoundingClientRect().top, b: e.getBoundingClientRect().bottom } : null;
    return { cas: r([...document.querySelectorAll('.cl-li')].find((e) => e.textContent.includes('Amarillo'))),
      band: r(document.querySelector('.l38-band, .l2b-band')), pied: document.querySelector('.cl-pied').getBoundingClientRect().top };
  });
}
const bA = await boites(path.join(DOSSIER, 'maquettes', `${vue}.html`), 860);
const bR = await boites(path.join(L38, 'maquettes', 'q2-d-arrivee.html'), 780);
const url = (f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
await p.goto('about:blank');
const m = await p.evaluate(async ({ a, r, bA, bR }) => {
  const charge = (s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = s; });
  const [ia, ir] = await Promise.all([charge(a), charge(r)]);
  const px = (i) => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height); };
  const A = px(ia), R = px(ir), W = A.width, S = 2;
  // Un bandeau compte avec son ombre (box-shadow 0 2px 10px : 12 px de chaque côté).
  const dans = (y, z, marge = 0) => z && y >= Math.floor((z.t - marge) * S) && y < Math.ceil((z.b + marge) * S);
  const y0 = Math.round(bA.cas.t * S), h = Math.round((bA.cas.b - bA.cas.t) * S), piedA = Math.round(bA.pied * S), piedR = Math.round(bR.pied * S);
  // -1 : exclu (ligne du cas, bandeau de A) ; -2 : sans équivalent (bandeau de sa maquette, blanc ajouté) : doit être blanc.
  const vers = (y) => {
    if (dans(y, bA.cas) || dans(y, bA.band, 12)) return -1;
    if (y >= piedA) return piedR + (y - piedA);
    const yr = y >= y0 + h ? y - h : y;
    if (dans(yr, bR.band, 12) || yr >= piedR) return -2;
    return yr;
  };
  const diff = []; let compare = 0, tache = 0, blanc = 0;
  for (let y = 0; y < A.height; y++) {
    const yr = vers(y);
    if (yr === -1) continue;
    if (yr === -2) { blanc++; for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (A.data[i] + A.data[i + 1] + A.data[i + 2] < 750) tache++; } continue; }
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4, j = (yr * W + x) * 4; compare++;
      if (Math.abs(A.data[i] - R.data[j]) + Math.abs(A.data[i + 1] - R.data[j + 1]) + Math.abs(A.data[i + 2] - R.data[j + 2]) > 6) diff.push([x, y]);
    }
  }
  const bo = [];
  for (const [x, y] of diff) {
    const q = bo.find((q) => y - q.y2 <= 6 && x >= q.x1 - 40 && x <= q.x2 + 40);
    if (q) { q.x1 = Math.min(q.x1, x); q.x2 = Math.max(q.x2, x); q.y2 = Math.max(q.y2, y); q.n++; } else bo.push({ x1: x, x2: x, y1: y, y2: y, n: 1 });
  }
  return { compare, diff: diff.length, blanc: blanc / S, tache, y0: y0 / S, h: h / S, boites: bo.map((q) => ({ x: [q.x1 / S, q.x2 / S], y: [q.y1 / S, q.y2 / S], n: q.n })) };
}, { a: url(path.join(DOSSIER, 'img', `${vue}.png`)), r: url(path.join(L38, 'img', 'q2-d-arrivee.png')), bA, bR });
await nav.close();
console.log(`${vue} contre q2-d-arrivee : seconde ligne y ${m.y0}–${m.y0 + m.h} px, bandeaux exclus · ${m.compare} pixels comparés · ${m.diff} différents · blanc sans équivalent ${m.blanc} px, ${m.tache} pixels non blancs`);
for (const q of m.boites) console.log(`   diffère : x ${q.x[0]}–${q.x[1]}, y ${q.y[0]}–${q.y[1]} (${q.n} px)`);
const reel = m.boites.filter((q) => q.n > 2);
console.log(`   ${reel.length} boîte(s) de plus de 2 pixels (1 ou 2 pixels : lissage du texte au rendu)`);
console.log(m.tache ? 'MESURE-2D ECHEC (blanc non uni)' : 'MESURE-2D OK (seules les boîtes listées diffèrent, à nommer)');
process.exit(m.tache ? 1 : 0);
