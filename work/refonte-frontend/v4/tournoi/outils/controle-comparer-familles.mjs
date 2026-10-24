#!/usr/bin/env node
// D128 (24.10, soir), sur la référence de la pastille dans « Choix de vues · 24.10 », qui montrait le premier écran de la
// Comparer du jour sous le nom « r6a » : « C'est pas du tout cette vue là réf ??? ». Sa r6a (lot 22, son choix) montre au
// premier écran le radar, les colonnes et ses rangées de familles (une barre par houblon) ; la maquette 24.10 avait mis les
// rangées 60′ / 10′ / dry hop de x3b à leur place et repoussé les familles à 872 px, sous le premier écran, alors que D107
// disait « r6a garde la forme ; les étapes […] viennent de x3b ». Les relevés d'états ne nommaient pas ces rangées.
//
// Joue une page de Comparer à 390 × 844, sans geste, et compte les rangées de familles du premier écran : une étiquette dont
// le texte est le nom d'une des 12 familles, dans la colonne de gauche (60 px au plus du bord), en haut à 844 px au plus.
// Sa r6a en montre 10 (témoin positif : work/refonte-frontend/v4/ecran-1/fils22-comparer/r6a/etat.html).
// Usage : node controle-comparer-familles.mjs <page.html> [--min=9]
// Sortie : « FAMILLES OK (n rangées au premier écran : …) » ou « FAMILLES ECHEC (… ; m plus bas, à partir de y px) ».
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const args = process.argv.slice(2);
const page = args.find((a) => !a.startsWith('--'));
const min = Number((args.find((a) => a.startsWith('--min=')) ?? '--min=9').slice(6));
if (!page || !fs.existsSync(path.resolve(RACINE, page))) { console.log('Usage : node controle-comparer-familles.mjs <page.html> [--min=9]'); process.exit(2); }

const FAMILLES = ['Floral', 'Herbacé', 'Terreux', 'Agrumes', 'Tropicaux', 'Noyau', 'Pépins', 'Baies', 'Melon', 'Résineux', 'Épicé', 'Végétal'];
const navigateur = await puppeteer.launch({ executablePath: CHROME, headless: true });
const p = await navigateur.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await p.goto(pathToFileURL(path.resolve(RACINE, page)).href, { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise((r) => setTimeout(r, 500));
const etiquettes = await p.evaluate((F) => [...document.querySelectorAll('body *')].filter((e) => {
  const r = e.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.left <= 60 && getComputedStyle(e).visibility !== 'hidden' && !e.closest('dialog:not([open]), [hidden]')
    && F.includes((e.innerText ?? '').replace(/[↑↓\s]+/g, ' ').trim()) && ![...e.children].some((c) => (c.innerText ?? '').trim());
}).map((e) => ({ nom: e.innerText.replace(/[↑↓\s]+/g, ' ').trim(), haut: Math.round(e.getBoundingClientRect().top + scrollY) })), FAMILLES);
await navigateur.close();
const haut = etiquettes.filter((e) => e.haut < 844);
const bas = etiquettes.filter((e) => e.haut >= 844);
const ok = new Set(haut.map((e) => e.nom)).size >= min;
const suite = bas.length ? ` ; ${bas.length} plus bas, à partir de ${Math.min(...bas.map((e) => e.haut))} px` : '';
console.log(`FAMILLES ${ok ? 'OK' : 'ECHEC'} (${haut.length} rangées au premier écran${ok ? '' : `, ${min} au moins`} : ${haut.map((e) => e.nom).join(', ') || 'aucune'}${suite})`);
process.exit(ok ? 0 : 1);
