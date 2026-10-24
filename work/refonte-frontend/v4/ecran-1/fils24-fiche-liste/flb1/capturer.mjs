// Captures de la série b : premier écran et page entière à 390 px, plus la fiche courte à l'appui long
// et la légende ouverte. Usage : node capturer.mjs flb1 [flb2…] ; écrit dans ../captures/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ici = path.dirname(fileURLToPath(import.meta.url));
const LOT = path.resolve(ici, '..');
const ids = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
for (const id of ids) {
  const url = pathToFileURL(path.join(LOT, id, 'etat.html')).href;
  const p = await b.newPage();
  const erreurs = [];
  p.on('pageerror', (e) => erreurs.push(e.message));
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const tir = async (q, nom, plein = false) => {
    await p.goto(url + q, { waitUntil: 'load' }); await attendre(250);
    await p.screenshot({ path: path.join(LOT, 'captures', id + '-' + nom + '.png'), fullPage: plein });
  };
  await tir('', 'premier-ecran');
  await tir('', 'page', true);
  await tir('?legende=1', 'legende');
  await tir('?houblon=Motueka', 'motueka', true);
  await tir('?fiche=Nelson%20Sauvin', 'fiche-courte');
  const debord = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  console.log(id + ' · captures écrites' + (erreurs.length ? ' · ERREURS ' + erreurs.join(' | ') : '') + (debord ? ' · DÉBORDEMENT horizontal' : ''));
  await p.close();
}
await b.close();
