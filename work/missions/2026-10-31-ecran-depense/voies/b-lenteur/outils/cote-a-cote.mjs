// Voie b-lenteur : met chaque capture du banc Chrome à côté de la maquette qu'il a choisie (« banc | sa maquette »), pour les ouvrir en image (L12).
// Usage, depuis la racine du dépôt : node work/missions/2026-10-31-ecran-depense/voies/b-lenteur/outils/cote-a-cote.mjs <dossier du banc> <dossier de sortie> [largeur]
// Les captures du banc (`<largeur>-NN-<label>.png`) sont retrouvées par leur label ; une paire dont la capture manque est dite, jamais ignorée en silence.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const RACINE = process.cwd();
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const [entree, sortie, largeur = '390'] = process.argv.slice(2);
if (!entree || !sortie) throw new Error('Usage : cote-a-cote.mjs <dossier du banc> <dossier de sortie> [largeur]');
const MISSION = path.join(RACINE, 'work/missions/2026-10-31-ecran-depense');
fs.mkdirSync(sortie, { recursive: true });
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

// [label de la capture du banc, maquette (relative à la mission), légende]
const PAIRES = [
  ['lenteur-provisoire-attente', 'choix-lenteur/img/d-06.png', 'd-06 : le fil, « Lectures ●●◌ », Confirmer gris avec sa roue'],
  ['lenteur-lue-repos', 'choix-lenteur/img/d-lue.png', 'd-lue : le fil part, « ↻ N corrigées », valeurs bleues, ancienne valeur barrée'],
  ['lenteur-lue-lignes', 'choix-lignes-38/img/q1-b.png', 'q1-b : la ligne ajoutée par la 3.8 (↻, rangée bleue)'],
  ['lenteur-touchee-apres', 'choix-lenteur/img/d-lue.png', 'd-lue (sa saisie : la quantité tapée n’est pas réécrite)'],
  ['lenteur-echec-repos', 'choix-cas-38/img/q2-a.png', 'q2-a : la 3.8 coupée, « 2 lectures », « Lecture coupée »'],
  ['lenteur-sans-38-repos', 'choix-cas-38/img/q2-avant.png', 'q2-avant : l’écran final d’emblée, sans fil'],
  ['lenteur-sans-resultat-fin', 'choix-cas-38/img/q2-a.png', 'q2-a : la forme d’une 3.8 coupée (le flux fermé sans résultat la prend)'],
  ['lenteur-perdues-2-arrivee', 'choix-valider/img/b-arrivee.png', 'b-arrivee : « Tout valider », bandeau 1/2'],
  ['lenteur-perdues-2-arrivee', 'choix-lignes-38/img/q2-d-arrivee.png', 'q2-d-arrivee : la ligne pas retrouvée, barrée, bandeau au pouce'],
  ['lenteur-perdues-2-garder', 'choix-valider/img/b-garder.png', 'b-garder : après Garder, la ligne est ordinaire, il reste une pas retrouvée'],
  ['lenteur-perdues-2-tout', 'choix-valider/img/tout.png', 'tout : « Tout valider » fait partir toutes les lignes'],
  ['lenteur-hors-ligne-coupe', 'choix-cas-38/img/q2-a.png', 'q2-a (le flux coupé par le réseau prend la forme d’une 3.8 coupée)']
];

const trouver = (label) => fs.readdirSync(entree).find((f) => f.startsWith(`${largeur}-`) && f.endsWith(`-${label}.png`));
const uri = (f) => `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`;
const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await nav.newPage();
const manquantes = [];
try {
  for (const [label, maquette, legende] of PAIRES) {
    const fichier = trouver(label);
    if (!fichier) { manquantes.push(label); continue; }
    const mq = path.join(MISSION, maquette);
    if (!fs.existsSync(mq)) { manquantes.push(`maquette ${maquette}`); continue; }
    await page.setViewport({ width: 2000, height: 900, deviceScaleFactor: 1 });
    await page.setContent(`<body style="margin:0;padding:12px;background:#ddd;font:14px sans-serif;color:#222"><div style="display:flex;gap:16px;align-items:flex-start">
      <figure style="margin:0"><figcaption style="margin-bottom:6px"><b>Le banc Chrome</b> · ${largeur} · ${label}</figcaption><img src="${uri(path.join(entree, fichier))}" style="display:block;border:1px solid #888"></figure>
      <figure style="margin:0"><figcaption style="margin-bottom:6px"><b>Sa maquette</b> · ${maquette} · ${legende}</figcaption><img src="${uri(mq)}" style="display:block;border:1px solid #888"></figure></div></body>`);
    await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
    const dim = await page.evaluate(() => ({ w: document.body.scrollWidth, h: document.body.scrollHeight }));
    await page.setViewport({ width: dim.w, height: dim.h, deviceScaleFactor: 1 });
    const nom = `cote-${largeur}-${label}-${path.basename(maquette, '.png')}.png`;
    await page.screenshot({ path: path.join(sortie, nom) });
    console.log(nom);
  }
} finally { await nav.close(); }
if (manquantes.length) console.log(`MANQUANTES : ${manquantes.join(' ; ')}`);
