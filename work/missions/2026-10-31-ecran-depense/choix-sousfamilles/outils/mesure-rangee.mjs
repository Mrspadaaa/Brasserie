#!/usr/bin/env node
// Critère 3 (VOIE r2-sousfamilles) : la rangée de l'option A et la rangée servie, mesurées au pixel sur les captures (×2), puis posées côte à côte.
// Servie : voies/p3c-bandes/captures/tactile390-nettoyage.png, rangée « Divers fictif XJ-17 » (aucune barre de geste sous elle).
// Maquette : img/a-repos.png, rangée « Siphon de sol inox ». Mesures en px CSS : pas de rangée (bord à bord), hauteur des glyphes de « 1 Stk »
// (même texte des deux côtés), début du nom, fin du montant (marge droite), début du picto (marge gauche).
// Usage (racine) : node work/missions/2026-10-31-ecran-depense/choix-sousfamilles/outils/mesure-rangee.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const DOSSIER = path.resolve(ICI, '..');
const RACINE = path.resolve(DOSSIER, '..', '..', '..', '..');
const SERVIE = path.join(DOSSIER, '..', 'voies', 'p3c-bandes', 'captures', 'tactile390-nettoyage.png');
const MAQ = path.join(DOSSIER, 'img', 'a-repos.png');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await nav.newPage();
await p.setViewport({ width: 900, height: 900 });
const data = (f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');

// Dans une image, autour du y donné (px image), trouve la rangée : bords (lignes grises pleine largeur au bord droit), puis l'encre.
const MESURE = async (src, yGuess) => {
  const img = new Image(); img.src = src; await img.decode();
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const px = (x, y) => { const d = g.getImageData(x, y, 1, 1).data; return (d[0] + d[1] + d[2]) / 3; };
  const xBord = img.width - 6; // dans la marge droite : seuls les filets et les fonds y passent
  let haut = yGuess, bas = yGuess;
  while (haut > 0 && px(xBord, haut) > 240) haut--;
  while (bas < img.height - 1 && px(xBord, bas) > 240) bas++;
  // encre : le nom de x = 70 à 300 (son début) ; « 1 Stk » de x = 440 à 530 (hauteur des glyphes, même texte des deux côtés)
  let t = Infinity, b = -1, gauche = Infinity, droite = -1, picto = Infinity;
  for (let y = haut + 2; y < bas - 1; y++) for (let x = 20; x < img.width - 8; x++) {
    const v = px(x, y); if (v > 140) continue;
    if (x >= 70 && x < 300) gauche = Math.min(gauche, x);
    if (x >= 440 && x < 530) { t = Math.min(t, y); b = Math.max(b, y); }
    if (x < 70) picto = Math.min(picto, x);
    droite = Math.max(droite, x);
  }
  return { pas: (bas - haut) / 2, glyphes: (b - t + 1) / 2, nom: gauche / 2, picto: picto / 2, margeDroite: (img.width - 1 - droite) / 2, haut, bas };
};
await p.goto('about:blank');
const servie = await p.evaluate(MESURE, data(SERVIE), 946);
const maq = await p.evaluate(MESURE, data(MAQ), 912);
console.log('servie  ', JSON.stringify(servie));
console.log('maquette', JSON.stringify(maq));
const ecarts = ['pas', 'glyphes', 'nom', 'picto', 'margeDroite'].map((k) => [k, Math.abs(servie[k] - maq[k])]);
for (const [k, e] of ecarts) console.log(`${k.padEnd(12)} servie ${servie[k]} · A ${maq[k]} · écart ${e} px`);
// Côte à côte : les deux rangées recadrées, l'une sous l'autre, à l'échelle 1:1 de l'image (×2).
const html = `<body style="margin:0;background:#fff;font:600 22px system-ui"><div style="padding:8px">servie (p3c-bandes, tactile390-nettoyage)</div>
<div style="height:${servie.bas - servie.haut + 1}px;overflow:hidden;width:780px"><img src="${data(SERVIE)}" style="margin-top:-${servie.haut}px;display:block"></div>
<div style="padding:8px">option A (img/a-repos.png)</div><div style="height:${maq.bas - maq.haut + 1}px;overflow:hidden;width:780px"><img src="${data(MAQ)}" style="margin-top:-${maq.haut}px;display:block"></div></body>`;
await p.setViewport({ width: 780, height: 300 });
await p.setContent(html);
await p.screenshot({ path: path.join(DOSSIER, 'controle', 'rangee-cote-a-cote.png'), fullPage: true });
await nav.close();
const ko = ecarts.filter(([, e]) => e > 1);
console.log(ko.length ? `RANGEE ECHEC (${ko.map(([k]) => k).join(', ')})` : 'RANGEE OK (écarts ≤ 1 px)');
process.exit(ko.length ? 1 : 0);
