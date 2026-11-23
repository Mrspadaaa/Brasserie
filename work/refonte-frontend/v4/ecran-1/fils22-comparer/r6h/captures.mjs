// Captures de r6h à 390 px, gestes joués pour de vrai (toucher, appui long). Depuis la racine :
//   node work/refonte-frontend/v4/ecran-1/fils22-comparer/r6h/captures.mjs [suffixe-extra…]
// Écrit captures/r6h-390.png (page entière), r6h-premier-ecran.png (390 × 844), r6h-fiche-390.png
// (appui long sur Nelson Sauvin), r6h-toucher-390.png (Galaxy touché, puis les vraies valeurs ouvertes),
// r6h-absolu-390.png (lentille absolu), r6h-legende-390.png.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ici = path.dirname(fileURLToPath(import.meta.url));
const url = pathToFileURL(path.join(ici, 'etat.html')).href;
const out = (n) => path.join(ici, '../captures/r6h-' + n + '.png');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const neuve = async () => {
  const p = await browser.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(url, { waitUntil: 'networkidle0' }); await wait(400);
  return p;
};
let p = await neuve();
await p.screenshot({ path: out('premier-ecran') });
await p.screenshot({ path: out('390'), fullPage: true });
await p.close();
// Appui long sur Nelson Sauvin (650 ms).
p = await neuve();
const n = await p.$('[data-houblon="Nelson Sauvin"]');
const t = await n.touchStart(); await wait(650); await t.end(); await wait(500);
console.log('fiche ouverte : ' + (await p.evaluate(() => { const f = document.querySelector('[data-role="fiche"]'); return f ? f.getAttribute('aria-label') + ' · autres : ' + !!f.querySelector('[data-role="autres"]') : 'aucune'; })));
await p.screenshot({ path: out('fiche-390') });
await p.close();
// Toucher : Galaxy mis en avant, puis les vraies valeurs ouvertes d'un toucher.
p = await neuve();
await (await p.$('[data-houblon-btn="Galaxy"]')).tap(); await wait(300);
await (await p.$('[aria-controls="valeurs"]')).tap(); await wait(300);
await p.evaluate(() => document.querySelector('.radar-c').scrollIntoView({ block: 'start' }));
await wait(200);
await p.screenshot({ path: out('toucher-390'), fullPage: true });
await p.close();
// Absolu.
p = await neuve();
await (await p.$('[data-e="absolu"]')).tap(); await wait(300);
await p.screenshot({ path: out('absolu-390') });
await p.close();
// Légende.
p = await neuve();
await (await p.$('[data-role="legende-bouton"]')).tap(); await wait(300);
await p.screenshot({ path: out('legende-390') });
await p.close();
await browser.close();
console.log('captures écrites');
