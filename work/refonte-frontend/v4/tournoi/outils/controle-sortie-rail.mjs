#!/usr/bin/env node
// D134 (24.10, soir), sur le rail de l'étape de la maquette publiée : « Un petit délais lors du déplacement, une fois
// choisir au bon emplacement, il y a un peu de délai pour "sortir" du mode rail ». Mesuré : au lever du doigt, une tâche
// de 98 ms (les propositions d'ajout rapide reclassent tout le catalogue) retenait la première image ; sur un téléphone,
// deux à quatre fois plus.
//
// Ce contrôle joue un glisser de la première poignée du rail ([data-role="glisser-moment"]) à 390 × 844 au doigt, et
// refuse :
//   S1 plus de --max ms (50 par défaut, trois images) entre le lever du doigt et la première image rendue ;
//   S2 un rail encore en mode geste (data-geste sur [data-role="frise"]) à cette première image.
// Trois glisser ; la médiane fait foi. Usage : node controle-sortie-rail.mjs <dossier construit> [--max=50]
// Sortie : « SORTIE-RAIL OK (… ms) » ou « SORTIE-RAIL ECHEC (…) ».
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const args = process.argv.slice(2);
const dossier = args.find((a) => !a.startsWith('--'));
const max = Number((args.find((a) => a.startsWith('--max=')) ?? '--max=50').slice(6));
const page = dossier && path.resolve(RACINE, dossier, 'ma-biere/etat.html');
if (!page || !fs.existsSync(page)) { console.log('Usage : node controle-sortie-rail.mjs <dossier construit> [--max=50]'); process.exit(2); }

const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const mesures = [];
let geste = false;
for (let essai = 0; essai < 3; essai++) {
  const p = await nav.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await p.goto(pathToFileURL(page).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 800));
  await p.evaluate(() => {
    window.__sortie = {};
    addEventListener('pointerup', () => {
      const t0 = performance.now();
      window.__sortie.leve = t0;
      requestAnimationFrame(() => {
        window.__sortie.image = performance.now() - t0;
        window.__sortie.geste = document.querySelector('[data-role="frise"]')?.hasAttribute('data-geste') ?? null;
      });
    }, true);
  });
  const h = await p.$('[data-role="glisser-moment"]');
  if (!h) { await p.close(); console.log('SORTIE-RAIL ECHEC (aucune poignée [data-role="glisser-moment"])'); await nav.close(); process.exit(1); }
  const b = await h.boundingBox();
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await p.touchscreen.touchStart(x, y);
  for (let k = 1; k <= 12; k++) { await p.touchscreen.touchMove(x, y + k * 6); await new Promise((r) => setTimeout(r, 16)); }
  await new Promise((r) => setTimeout(r, 200));
  await p.touchscreen.touchEnd();
  await new Promise((r) => setTimeout(r, 600));
  const s = await p.evaluate(() => window.__sortie);
  await p.close();
  mesures.push(Math.round(s.image ?? 9999));
  if (s.geste) geste = true;
}
await nav.close();
const med = [...mesures].sort((a, c) => a - c)[1];
const ecarts = [];
if (med > max) ecarts.push(`S1 ${med} ms du lever du doigt à la première image (${max} au plus ; essais ${mesures.join(', ')} ms)`);
if (geste) ecarts.push('S2 le rail encore en mode geste à la première image');
console.log(ecarts.length ? `SORTIE-RAIL ECHEC (${ecarts.join(' ; ')})` : `SORTIE-RAIL OK (${med} ms du lever à la première image ; essais ${mesures.join(', ')} ms)`);
process.exit(ecarts.length ? 1 : 0);
