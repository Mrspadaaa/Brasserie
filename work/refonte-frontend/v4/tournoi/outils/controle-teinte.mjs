#!/usr/bin/env node
// D106 (23.10, soir) : « Pourquoi c'est en thème pastel horrible ??? C'est pas ce que j'ai demandé ??? ». Il avait dit
// « On garde celle des maquettes » : ses maquettes choisies ont une page blanche et des gris neutres ; la maquette
// jouable avait reçu le « clair » à papier chaud du prototype (#F2ECE4), et controle-choix, qui compare des
// éléments, ne voyait pas les couleurs.
//
// Règle, pour chaque écran choisi du registre (work/refonte-frontend/v4/choix/ecrans.json) : la photo de l'écran
// construit (<dossier>/<route>/<page>, 390 × 844) et la capture de sa maquette choisie ont
//   - D106 fond : la même couleur de page (la plus fréquente), à 8 au plus par canal ;
//   - D106 teinte : des aplats clairs aussi neutres que les siens (écart max − min des canaux, 6 de plus au plus) ;
//   - D106 encre : la même encre la plus fréquente (couleur sombre), à 24 au plus par canal.
// Usage : node controle-teinte.mjs <dossier construit> [--ecran=<écran>] [--registre=<chemin>] [--page=etat.html]
// Imprime une ligne par écran, puis TEINTE OK n/n, ou TEINTE ECHEC et la liste (lignes « D106 fond / teinte / encre »).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ici, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const args = process.argv.slice(2);
const opt = (nom, defaut) => { const a = args.find((x) => x.startsWith(`--${nom}=`)); return a ? a.slice(nom.length + 3) : defaut; };
const dossier = path.resolve(RACINE, args.find((a) => !a.startsWith('--')) ?? '.');
const registre = JSON.parse(fs.readFileSync(path.resolve(RACINE, opt('registre', 'work/refonte-frontend/v4/choix/ecrans.json')), 'utf8'));
const seul = opt('ecran', null);
const page = opt('page', 'etat.html');
const ecrans = registre.ecrans.filter((e) => e.statut === 'choisi' && e.capture && (!seul || e.ecran === seul));

// Dans la page : histogramme d'une image (couleurs regroupées par pas de 4), puis fond, aplats clairs et encre.
function analyser(url) {
  return new Promise((ok, ko) => {
    const img = new Image();
    img.onerror = () => ko(new Error('image illisible'));
    img.onload = () => {
      const l = Math.min(390, img.naturalWidth), h = Math.round(img.naturalHeight * (l / img.naturalWidth));
      const c = document.createElement('canvas'); c.width = l; c.height = h;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0, l, h);
      const d = x.getImageData(0, 0, l, h).data, n = new Map();
      for (let i = 0; i < d.length; i += 4) { const k = ((d[i] >> 2) << 12) | ((d[i + 1] >> 2) << 6) | (d[i + 2] >> 2); n.set(k, (n.get(k) ?? 0) + 1); }
      const total = d.length / 4;
      const couleurs = [...n].sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ rgb: [(k >> 12) << 2, ((k >> 6) & 63) << 2, (k & 63) << 2], part: v / total }));
      const somme = (c) => c.rgb[0] + c.rgb[1] + c.rgb[2];
      const clairs = couleurs.filter((c) => somme(c) > 600 && c.part >= 0.01).slice(0, 4);
      const encre = couleurs.find((c) => somme(c) < 330 && c.part >= 0.002) ?? null;
      ok({ fond: couleurs[0].rgb, clairs: clairs.map((c) => c.rgb), encre: encre && encre.rgb });
    };
    img.src = url;
  });
}

const hex = (rgb) => (rgb ? `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}` : '—');
const ecart = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));
const chroma = (rgbs) => Math.max(0, ...rgbs.map((c) => Math.max(...c) - Math.min(...c)));

const nav = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const problemes = [];
let bons = 0;
try {
  const outil = await nav.newPage();
  for (const e of ecrans) {
    const f = path.join(dossier, e.route, page);
    if (!fs.existsSync(f)) { problemes.push(`D106 ${e.ecran} : page ${path.relative(RACINE, f)} absente`); continue; }
    const p = await nav.newPage();
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await p.goto(pathToFileURL(f).href, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 400));
    const photo = `data:image/png;base64,${await p.screenshot({ encoding: 'base64' })}`;
    await p.close();
    const capture = `data:image/png;base64,${fs.readFileSync(path.resolve(RACINE, e.capture)).toString('base64')}`;
    const vu = await outil.evaluate(analyser, photo);
    const choisi = await outil.evaluate(analyser, capture);
    const fautes = [];
    if (ecart(vu.fond, choisi.fond) > 8) fautes.push(`D106 fond : ${e.ecran} ${hex(vu.fond)}, sa maquette choisie ${hex(choisi.fond)} (écart ${ecart(vu.fond, choisi.fond)})`);
    if (chroma(vu.clairs) > chroma(choisi.clairs) + 6) fautes.push(`D106 teinte : ${e.ecran} aplats ${vu.clairs.map(hex).join(' ')} (teinte ${chroma(vu.clairs)}), les siens ${choisi.clairs.map(hex).join(' ')} (teinte ${chroma(choisi.clairs)})`);
    if (vu.encre && choisi.encre && ecart(vu.encre, choisi.encre) > 24) fautes.push(`D106 encre : ${e.ecran} ${hex(vu.encre)}, sa maquette choisie ${hex(choisi.encre)} (écart ${ecart(vu.encre, choisi.encre)})`);
    console.log(`${e.ecran} · fond ${hex(vu.fond)} (choisi ${hex(choisi.fond)}) · encre ${hex(vu.encre)} (choisi ${hex(choisi.encre)}) · teinte ${chroma(vu.clairs)} (choisi ${chroma(choisi.clairs)})`);
    if (fautes.length) problemes.push(...fautes); else bons += 1;
  }
} finally {
  await nav.close();
}
if (!ecrans.length) problemes.push('aucun écran choisi lu dans le registre');
for (const p of problemes) console.log(`  - ${p}`);
console.log(problemes.length ? `TEINTE ECHEC (${bons}/${ecrans.length} conformes)` : `TEINTE OK ${bons}/${ecrans.length}`);
process.exitCode = problemes.length ? 1 : 0;
