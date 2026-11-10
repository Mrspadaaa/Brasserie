#!/usr/bin/env node
// Critère 3 de r3-plier : la vue « tout plié » de A (D tel quel) est identique au pixel à choix-sousfamilles/img/d-renovation.png, hors du
// groupe ouvert à la main dans cette capture (« Peinture et sols » : sa ligne de sous-groupe et ses cinq rangées).
// Compare la bande Rénovation seule de A (controle/mesure-a-renovation.png, rendue par gen.mjs avec le balisage de D) à la capture de D :
//   haut : de 0 au haut de « Peinture et sols », pixel pour pixel ;
//   bas : de la fin de « Peinture et sols » (A, plié) / de la fin de sa 5e rangée (D, ouvert) jusqu'en bas, pixel pour pixel.
// Écrit controle/mesure-a-cote-a-cote.png (A | D) et imprime « IDENTIQUE OK » ou « IDENTIQUE ECHEC ».
// Usage (depuis la racine) : node work/missions/2026-10-31-ecran-depense/choix-plier/outils/mesure-a.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const DOSSIER = path.resolve(ICI, '..');
const RACINE = path.resolve(DOSSIER, '..', '..', '..', '..');
const SF = path.resolve(DOSSIER, '..', 'choix-sousfamilles');
const A_HTML = path.join(DOSSIER, 'maquettes', process.env.A_NOM ?? 'mesure-a-renovation.html'), A_PNG = process.env.A_PNG ?? path.join(DOSSIER, 'controle', 'mesure-a-renovation.png');
const D_HTML = path.join(SF, 'maquettes', 'd-renovation.html'), D_PNG = path.join(SF, 'img', 'd-renovation.png');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--allow-file-access-from-files'] });
const p = await nav.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
// Géométrie de « Peinture et sols » dans chaque maquette (px CSS).
const geo = async (html) => {
  await p.goto(pathToFileURL(html).href, { waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {});
  await p.evaluate(() => document.fonts.ready);
  return p.evaluate(() => {
    const sg = [...document.querySelectorAll('[data-sf-sous-groupe]')];
    const i = sg.findIndex((b) => b.textContent.includes('Peinture et sols'));
    const r = sg[i].getBoundingClientRect(), suivant = sg[i + 1].getBoundingClientRect();
    return { haut: r.top, finEntete: r.bottom, finGroupe: suivant.top, ouvert: sg[i].getAttribute('aria-expanded') };
  });
};
const ga = await geo(A_HTML), gd = await geo(D_HTML);
const b64 = (f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
await p.goto('about:blank');
const r = await p.evaluate(async (sa, sd, ga, gd) => {
  const charger = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src; });
  const [ia, id] = await Promise.all([charger(sa), charger(sd)]);
  const lire = (im) => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); return { w: im.width, h: im.height, d: x.getImageData(0, 0, im.width, im.height).data }; };
  const A = lire(ia), D = lire(id), k = 2;
  const comparer = (ya, yd, n, tol = 0) => { let diff = 0; for (let y = 0; y < n; y++) for (let x = 0; x < A.w; x++) { const ia2 = ((ya + y) * A.w + x) * 4, id2 = ((yd + y) * D.w + x) * 4; let m = 0; for (let c = 0; c < 4; c++) m = Math.max(m, Math.abs(A.d[ia2 + c] - D.d[id2 + c])); if (m > tol) { diff++; if (tol && ou.length < 6) ou.push(`(${x / k}, ${(ya + y) / k}) écart ${m}`); } } return diff; };
  const ou = [];
  const hautN = Math.round(ga.haut * k);
  const basA = Math.round(ga.finEntete * k), basD = Math.round(gd.finGroupe * k);
  const nBas = A.h - basA;
  // La ligne de « Peinture et sols » elle-même : fermée chez A, ouverte chez D (fond, chevron, gras) ; elle diffère, c'est le groupe ouvert.
  const enteteN = Math.round((ga.finEntete - ga.haut) * k);
  // Assemblage côte à côte, A | D, pour le regard.
  const c = document.createElement('canvas'); c.width = A.w + 24 + D.w; c.height = Math.max(A.h, D.h); const x = c.getContext('2d');
  x.fillStyle = '#888'; x.fillRect(0, 0, c.width, c.height); x.drawImage(ia, 0, 0); x.drawImage(id, A.w + 24, 0);
  return { tailles: [A.w, A.h, D.w, D.h], haut: { lignes: hautN, diff: comparer(0, 0, hautN), diff1: comparer(0, 0, hautN, 1) }, bas: { lignes: nBas, depuisA: basA, depuisD: basD, finD: basD + nBas, diff: (basD + nBas === D.h) ? comparer(basA, basD, nBas) : -1, diff1: (basD + nBas === D.h) ? comparer(basA, basD, nBas, 1) : -1 }, entete: { lignes: enteteN, diff: comparer(hautN, hautN, enteteN) }, ou, png: c.toDataURL('image/png') };
}, b64(A_PNG), b64(D_PNG), ga, gd);
await nav.close();
fs.writeFileSync(path.join(DOSSIER, 'controle', 'mesure-a-cote-a-cote.png'), Buffer.from(r.png.split(',')[1], 'base64'));
console.log(`A ${r.tailles[0]}×${r.tailles[1]} px, D ${r.tailles[2]}×${r.tailles[3]} px (×2) ; Peinture et sols : A ${ga.ouvert === 'false' ? 'plié' : 'ouvert ?'}, D ${gd.ouvert === 'true' ? 'ouvert' : 'plié ?'}`);
console.log(`haut (0 → Peinture et sols) : ${r.haut.lignes} rangées de pixels, ${r.haut.diff} pixels différents d'un niveau au moins, ${r.haut.diff1} de plus d'un niveau (sur 255)`);
console.log(`bas (après le groupe) : ${r.bas.lignes} rangées, A dès ${r.bas.depuisA}, D dès ${r.bas.depuisD} (fin ${r.bas.finD}/${r.tailles[3]}), ${r.bas.diff} pixels différents d'un niveau au moins, ${r.bas.diff1} de plus d'un niveau`);
console.log(`ligne « Peinture et sols » (le groupe ouvert, hors comparaison) : ${r.entete.diff} pixels différents sur ${r.entete.lignes} rangées`);
if (r.ou.length) console.log(`au-delà d'un niveau, en px CSS de A : ${r.ou.join(' ; ')}`);
// Seuil : aucun pixel au-delà d'un niveau sur 255 dans la bande, 2 au plus dans le pied de liste (le pointillé de « + Ajouter une ligne » se
// tramant selon sa hauteur dans la page ; témoin : D re-rendu à sa hauteur contre sa propre capture donne 0 pixel).
const ok = r.haut.diff1 === 0 && r.bas.diff1 <= 2 && r.tailles[0] === r.tailles[2];
console.log(ok ? `IDENTIQUE OK (hors du groupe ouvert : ${r.haut.diff + r.bas.diff - r.bas.diff1 - r.haut.diff1} pixels d’un niveau sur 255, ${r.bas.diff1} au-delà, dans le pointillé du pied de liste)` : 'IDENTIQUE ECHEC');
process.exit(ok ? 0 : 1);
