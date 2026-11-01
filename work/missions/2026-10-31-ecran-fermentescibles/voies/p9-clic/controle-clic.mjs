#!/usr/bin/env node
// Voie p9-clic : le premier appui sous les tuiles ne se perd plus. Chrome réel, l'app servie, fixtures `?dev-local` seulement (recette et stock SIMULÉS
// de la maquette, apercuDev.ts) : aucune donnée réelle, aucun Gemini, aucun domaine hors localhost et polices Google.
//
// Scène : l'étape Malts/sucres au repos (la première ligne a son plateau ouvert), le champ d'ajout reçoit le focus (les tuiles s'ouvrent sur deux colonnes
// sous lui), puis UN appui sur « Ajouter un cran » du plateau, plus bas que les tuiles : la masse de la ligne doit monter d'un cran.
//   - souris : mouse.move, mouse.down, 120 ms, mouse.up ;
//   - doigt  : touchscreen.tap (Chrome rejoue alors mousedown, mouseup, click au toucher : même risque).
// Avec l'ancien `onBlur={() => setOuvert(false)}` : les tuiles se replient au mousedown, la page remonte, le mouseup tombe ailleurs, pas de click.
//
// Usage (le serveur tourne dans le dossier de travail) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5616 --strictPort" --port 5616 --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake \
//     -- node work/missions/2026-10-31-ecran-fermentescibles/voies/p9-clic/controle-clic.mjs [--sortie=<dossier>]
// Sortie : « CLIC OK » (code 0) ou « CLIC ECHEC n » et la liste.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const argv = process.argv.slice(2);
const valeur = (n) => argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const port = (process.env.WITH_SERVER_PORTS ?? '').split(',')[0];
const ADRESSE = (valeur('url') ?? `http://localhost:${port}`).replace(/\/$/, '');
if (/localhost:$/.test(ADRESSE)) { console.log('CLIC ECHEC 1\n  - pas de serveur : with_server.mjs ou --url='); process.exit(1); }
const SORTIE = path.resolve(valeur('sortie') ?? path.join(os.tmpdir(), 'p9-clic'));
fs.mkdirSync(SORTIE, { recursive: true });
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const MODES = [
  { id: 'souris390', l: 390, h: 844, tactile: false, echelle: 1 },
  { id: 'tactile390', l: 390, h: 844, tactile: true, echelle: 2 },
  { id: 'souris1280', l: 1280, h: 800, tactile: false, echelle: 1 },
];
const fautes = [];
const infos = [];
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const noter = (ok, texte) => { infos.push(`${ok ? 'OK   ' : 'ECHEC'} ${texte}`); if (!ok) fautes.push(texte); };
const local = (u) => ['http://localhost', 'http://127.0.0.1', 'ws://localhost', 'ws://127.0.0.1', 'data:', 'blob:', 'about:', 'file:',
  'https://fonts.googleapis.com', 'https://fonts.gstatic.com'].some((d) => u.startsWith(d));
const nombre = (t) => Number(String(t).replace(',', '.').replace(/[^\d.\-]/g, ''));

async function ouvrir(navigateur, mode) {
  const p = await navigateur.newPage();
  await p.setViewport({ width: mode.l, height: mode.h, isMobile: mode.tactile, hasTouch: mode.tactile, deviceScaleFactor: mode.echelle });
  p.erreurs = [];
  p.on('pageerror', (e) => p.erreurs.push(e.message));
  await p.setRequestInterception(true);
  p.on('request', (r) => (local(r.url()) ? r.continue() : r.abort('blockedbyclient')));
  p.setDefaultNavigationTimeout(120000);
  await p.goto(`${ADRESSE}/?dev-local&etape=houblons&recette=vide&malts=maquette`);
  await p.waitForFunction(() => document.body.dataset.apercu === 'repos' && document.querySelector('[data-sel]') !== null, { timeout: 120000 });
  await p.evaluate(() => document.fonts.ready);
  await dormir(500);
  // Vite recharge la page quand une autre voie écrit dans le dépôt : on le compte, et la scène se rejoue.
  p.rechargements = 0;
  p.on('load', () => { p.rechargements++; });
  return p;
}

const etat = (p) => p.evaluate(() => {
  const bouton = document.querySelector('[data-role="bal"] [aria-label="Ajouter un cran"]');
  const r = bouton?.getBoundingClientRect();
  return {
    masse: document.querySelector('[data-role="bal"] [data-role="bin"]')?.value ?? null,
    masseLigne: document.querySelector('[data-sel="0"] [data-role="kg-ligne"]')?.value ?? null,
    tuiles: document.querySelectorAll('[data-role="puces"].fer-tuiles').length,
    nTuiles: document.querySelectorAll('[data-role="puces"] [data-role="resultat"]').length,
    actif: document.activeElement?.dataset?.role ?? document.activeElement?.tagName ?? '',
    bouton: r ? { x: r.left + r.width / 2, y: r.top + r.height / 2, h: r.height, w: r.width } : null,
    h: innerHeight,
  };
});

async function scene(navigateur, mode) {
  const p = await ouvrir(navigateur, mode);
  try {
    const champ = await p.$('[data-role="ajout"]');
    if (!champ) throw new Error('champ d\'ajout introuvable');
    // Le focus du champ ouvre les tuiles (souris : clic ; doigt : tap).
    if (mode.tactile) await champ.tap(); else await champ.click();
    await p.waitForSelector('[data-role="puces"].fer-tuiles [data-role="resultat"]', { timeout: 8000 });
    await dormir(400);
    const avant = await etat(p);
    noter(avant.tuiles === 1 && avant.nTuiles >= 5 && avant.actif === 'ajout', `${mode.id} : le champ a le focus, ${avant.nTuiles} tuiles ouvertes (focus « ${avant.actif} »)`);
    if (!avant.bouton) throw new Error('« Ajouter un cran » introuvable');
    // Le bouton doit se voir en entier dans l'écran, sans défilement de page qui gênerait la comparaison.
    await p.evaluate(() => document.querySelector('[data-role="bal"] [aria-label="Ajouter un cran"]').scrollIntoView({ block: 'center' }));
    await dormir(200);
    const pret = await etat(p);
    const b = pret.bouton;
    if (b.y < 0 || b.y > pret.h) throw new Error(`le bouton est hors de l'écran (y ${Math.round(b.y)})`);
    await p.screenshot({ path: path.join(SORTIE, `${mode.id}-1-avant.png`) });
    if (mode.tactile) {
      await p.touchscreen.tap(b.x, b.y);
    } else {
      await p.mouse.move(b.x, b.y);
      await p.mouse.down();
      await dormir(120);
      await p.mouse.up();
    }
    await dormir(500);
    const apres = await etat(p);
    await p.screenshot({ path: path.join(SORTIE, `${mode.id}-2-apres.png`) });
    const monte = nombre(apres.masse) > nombre(pret.masse);
    noter(monte, `${mode.id} : masse du plateau ${pret.masse} -> ${apres.masse} kg (ligne ${pret.masseLigne} -> ${apres.masseLigne}), un cran attendu au premier appui`);
    noter(apres.tuiles === 0, `${mode.id} : les tuiles se replient après l'appui (${apres.tuiles} grille ouverte)`);
    if (p.erreurs.length) noter(false, `${mode.id} : erreur de page (${p.erreurs[0].slice(0, 120)})`);
    return p.rechargements;
  } finally { await p.close(); }
}

const navigateur = await puppeteer.launch({ executablePath: CHROME, headless: true });
for (const mode of MODES) {
  for (let essai = 1; essai <= 3; essai++) {
    const avantFautes = fautes.length, avantInfos = infos.length;
    let recharge = 0;
    try { recharge = await scene(navigateur, mode); } catch (e) { noter(false, `${mode.id} : ${String(e.message).split('\n')[0]}`); }
    // Un rechargement de Vite (une autre voie a écrit) ou un échec d'ouverture : la scène se rejoue, trois essais au plus.
    if (fautes.length > avantFautes && essai < 3 && recharge > 0) { fautes.length = avantFautes; infos.length = avantInfos; continue; }
    break;
  }
}
await navigateur.close();
for (const l of infos) console.log(l);
if (fautes.length) { console.log(`CLIC ECHEC ${fautes.length}`); process.exit(1); }
console.log('CLIC OK');
