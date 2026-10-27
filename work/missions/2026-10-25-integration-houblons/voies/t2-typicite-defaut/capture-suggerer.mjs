// t2 : capture de Suggérer (stout S1) dans la maquette construite, mobile 390x844, pour voir l'ordre des lignes avec la typicité par défaut.
// Usage : node work/missions/2026-10-25-integration-houblons/voies/t2-typicite-defaut/capture-suggerer.mjs [dossier construit] [sortie.png]
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ici = path.dirname(fileURLToPath(import.meta.url));
const depot = path.resolve(ici, '../../../../..');
const dossier = path.resolve(depot, process.argv[2] ?? 'prototypes/houblons-v4/maquettes/parcours');
const sortie = path.resolve(process.argv[3] ?? path.join(ici, 'suggerer-defaut.png'));
const navigateur = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await navigateur.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
await page.goto(pathToFileURL(path.join(dossier, 'suggerer', 'etat.html')).href, { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 2500));
await page.screenshot({ path: sortie });
const lignes = await page.evaluate(() => [...document.querySelectorAll('li')].map((l) => (l.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 90)).filter(Boolean).slice(0, 14));
console.log(lignes.join('\n'));
// Le texte de chaque section « objectif » (ce que lit etat-acquis-q2b-suite-s5).
const sections = await page.evaluate(() => [...document.querySelectorAll('section[data-role="objectif"]')].map((s) => (s.textContent ?? '').replace(/\s+/g, ' ').trim()));
sections.forEach((t, i) => console.log(`SECTION ${i} : ${t.slice(0, 700)}`));
await navigateur.close();
console.log(`CAPTURE ${sortie}`);
