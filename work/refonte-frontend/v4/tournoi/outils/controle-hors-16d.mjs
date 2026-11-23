#!/usr/bin/env node
// D130 (24.10, soir), sur flb5b (« La matrice nettoyée », la liste de la fiche) : « Partie sur celle ci, elle met parcontre
// en avant qqch qu'il faut ajouter à plusieurs endroits. Les type spéciaux des houblons hors 16d ! C'est très important
// surtout dans la comparaison !!!! ». flb5b met en tête « Lui seul : vin blanc, raisin, groseille à maquereau, sauvignon
// blanc » : les mots de ses fiches hors des familles de la 16D. Ailleurs, ces mots restaient sous le premier écran (Comparer,
// D128 bis) ou absents (Substituer, la fiche de la maquette).
//
// LE CONTRAT : chaque houblon montré porte un élément `[data-role="hors-16d"]` (avec `data-houblon="<clé>"`) qui dit ses mots
// hors des familles de la 16D, tirés de ses fiches (jamais inventés). Ce contrôle joue une page à 390 × 844, sans geste, et
// refuse :
//   H1 moins de --min éléments `[data-role="hors-16d"]` affichés, chacun d'au moins un mot ;
//   H2 avec --premier-ecran : un de ces éléments sous le premier écran (sa tête au-delà de 844 px) ;
//   H3 un élément sans `data-houblon` (on ne saurait pas à quel houblon il est).
// Usage : node controle-hors-16d.mjs <page.html> [--min=3] [--premier-ecran]
// Sortie : « HORS-16D OK (n : houblon « mots »…) » ou « HORS-16D ECHEC (…) ».
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const args = process.argv.slice(2);
const page = args.find((a) => !a.startsWith('--'));
const min = Number((args.find((a) => a.startsWith('--min=')) ?? '--min=1').slice(6));
const premier = args.includes('--premier-ecran');
if (!page || !fs.existsSync(path.resolve(RACINE, page))) { console.log('Usage : node controle-hors-16d.mjs <page.html> [--min=3] [--premier-ecran]'); process.exit(2); }

const navigateur = await puppeteer.launch({ executablePath: CHROME, headless: true });
const p = await navigateur.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await p.goto(pathToFileURL(path.resolve(RACINE, page)).href, { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise((r) => setTimeout(r, 500));
const els = await p.evaluate(() => [...document.querySelectorAll('[data-role="hors-16d"]')].filter((e) => {
  const r = e.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' && !e.closest('dialog:not([open]), [hidden]');
}).map((e) => ({ h: e.getAttribute('data-houblon'), texte: (e.innerText || '').replace(/\s+/g, ' ').trim(), haut: Math.round(e.getBoundingClientRect().top + scrollY) })));
await navigateur.close();

const ecarts = [];
const pleins = els.filter((e) => /[\p{L}]{2,}/u.test(e.texte));
if (pleins.length < min) ecarts.push(`H1 ${pleins.length} élément(s) [data-role="hors-16d"] affiché(s) avec des mots (${min} au moins)`);
if (premier) for (const e of pleins.filter((x) => x.haut >= 844)) ecarts.push(`H2 ${e.h ?? '?'} sous le premier écran (${e.haut} px)`);
for (const e of pleins.filter((x) => !x.h)) ecarts.push(`H3 « ${e.texte.slice(0, 30)} » sans data-houblon`);
const liste = pleins.map((e) => `${e.h ?? '?'} « ${e.texte.slice(0, 40)} »`).join(' ; ');
console.log(ecarts.length ? `HORS-16D ECHEC (${ecarts.join(' ; ')})${liste ? ' — vus : ' + liste : ''}` : `HORS-16D OK (${pleins.length} : ${liste})`);
process.exit(ecarts.length ? 1 : 0);
