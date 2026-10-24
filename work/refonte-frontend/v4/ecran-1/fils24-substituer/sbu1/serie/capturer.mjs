// Captures de la série sbu (390 × 844, échelle 2) : premier écran, page entière, l'état choisi (?choix=…) et la fiche.
// node capturer.mjs [sbu3 …]. Écrit dans ../../captures/ (OWNS : captures/sbu*). Rien ailleurs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
const ici = path.dirname(fileURLToPath(import.meta.url));
const LOT = path.resolve(ici, '../..');
const CAP = path.join(LOT, 'captures');
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['sbu1', 'sbu2', 'sbu3', 'sbu4', 'sbu5', 'sbu6', 'sbu7', 'sbu8'];
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
for (const id of ids) {
  const url = pathToFileURL(path.join(LOT, id, 'etat.html')).href;
  const etats = JSON.parse(fs.readFileSync(path.join(LOT, id, 'etats.json'), 'utf8'));
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const erreurs = []; p.on('pageerror', (e) => erreurs.push(e.message));
  const prendre = async (q, nom, plein = false) => { await p.goto(url + q, { waitUntil: 'networkidle0' }); await attendre(350); if (plein) await p.addStyleTag({ content: 'footer[class$="-pied"]{position:static !important}' }); await p.screenshot({ path: path.join(CAP, id + '-' + nom + '.png'), fullPage: plein }); };
  await prendre('', 'premier-ecran');
  await prendre('', 'page', true);
  for (const [nom, q] of Object.entries(etats)) await prendre(q, nom);
  const larg = await p.evaluate(() => document.documentElement.scrollWidth);
  console.log(id + ' · captures ' + (2 + Object.keys(etats).length) + ' · largeur ' + larg + (erreurs.length ? ' · ERREURS ' + erreurs.join(' | ') : ''));
  await p.close();
}
await b.close();
