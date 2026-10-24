#!/usr/bin/env node
// D135 et D136 (24.10, soir, commentaires sur la fiche de la maquette publiée) :
//   D135, sur « Substituts › » du pied (« Ouvrir les remplaçants de Nugget ») : « Substitut doit tout de suite ouvrir
//   l'onglet » ; le bouton dépliait une liste dans la fiche au lieu d'ouvrir Substituer ;
//   D136, sur « classé » dans la matrice de flb5b : « Que veux dire classé ? C'est pas du tout clair ».
// Ce contrôle ouvre la fiche (fiche/etat.html, Nugget, dans ma recette) à 390 × 844 et refuse :
//   F1 un toucher sur « Substituts › » ([aria-label^="Ouvrir les remplaçants"]) qui n'ouvre pas Substituer
//      (le hash de la route, #/substituer…) dans les 800 ms ;
//   F2 le mot « classé » seul dans la fiche (le libellé que le brasseur ne comprend pas).
// Usage : node controle-fiche-pied.mjs <dossier construit>  →  « FICHE-PIED OK » ou « FICHE-PIED ECHEC (…) ».
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const dossier = process.argv.slice(2).find((a) => !a.startsWith('--'));
const page = dossier && path.resolve(RACINE, dossier, 'fiche/etat.html');
if (!page || !fs.existsSync(page)) { console.log('Usage : node controle-fiche-pied.mjs <dossier construit>'); process.exit(2); }

const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await nav.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await p.goto(pathToFileURL(page).href, { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise((r) => setTimeout(r, 700));
const ecarts = [];
const texte = await p.evaluate(() => (document.querySelector('[data-ecran="fiche"]')?.closest('[role="dialog"], section, div')?.innerText ?? document.body.innerText));
if (/(^|[^\p{L}])classé([^\p{L}]|$)/u.test(texte)) ecarts.push('F2 « classé » dans la fiche');
const b = await p.$('[aria-label^="Ouvrir les remplaçants"]');
if (!b) ecarts.push('F1 pas de bouton « Substituts › » ([aria-label^="Ouvrir les remplaçants"])');
else {
  const box = await b.boundingBox();
  await p.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await new Promise((r) => setTimeout(r, 800));
  const hash = await p.evaluate(() => location.hash);
  if (!hash.startsWith('#/substituer')) ecarts.push(`F1 « Substituts › » n'ouvre pas Substituer (route : ${hash || 'aucune'})`);
}
await nav.close();
console.log(ecarts.length ? `FICHE-PIED ECHEC (${ecarts.join(' ; ')})` : 'FICHE-PIED OK (« Substituts › » ouvre Substituer ; pas de « classé »)');
process.exit(ecarts.length ? 1 : 0);
