// Captures de flb3b : le même premier écran sur Nelson Sauvin, Nugget et Cascade (390 × 844), la page entière,
// la légende et la fiche courte. Usage : node flb3b/capturer.mjs
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
const ici = path.dirname(fileURLToPath(import.meta.url));
const url = pathToFileURL(path.join(ici, 'etat.html')).href, C = path.resolve(ici, '../captures');
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage(); const err = []; p.on('pageerror', (e) => err.push(e.message));
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
for (const [q, nom, plein] of [['', 'nelson'], ['?houblon=Nugget', 'nugget'], ['?houblon=Cascade', 'cascade'], ['', 'page', true], ['?houblon=Nugget', 'nugget-page', true], ['?legende=1', 'legende'], ['?fiche=Nugget', 'fiche-courte']]) {
  await p.goto(url + q, { waitUntil: 'load' }); await new Promise((r) => setTimeout(r, 250));
  await p.screenshot({ path: path.join(C, 'flb3b-' + nom + '.png'), fullPage: !!plein });
}
console.log('flb3b · captures écrites' + (err.length ? ' · ERREURS ' + err.join(' | ') : '') + ((await p.evaluate(() => document.documentElement.scrollWidth > innerWidth)) ? ' · DÉBORDEMENT' : ''));
await b.close();
