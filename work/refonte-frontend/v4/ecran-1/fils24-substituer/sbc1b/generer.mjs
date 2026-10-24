// sbc1b · génère etat.html, puis les captures (390 × 844, ×2) : 60′, whirlpool (toucher réel sur la puce de contexte),
// page entière, Nelson Sauvin touché à 60′ et au whirlpool, la fiche à l'appui long. Imprime le recompte du moteur.
// Usage : node work/refonte-frontend/v4/ecran-1/fils24-substituer/sbc1b/generer.mjs [--sans-captures]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import { rendre, recompte } from './concept.mjs';
const ICI = path.dirname(fileURLToPath(import.meta.url)), OUT = path.join(ICI, '..', 'captures');
fs.writeFileSync(path.join(ICI, 'etat.html'), rendre());
fs.writeFileSync(path.join(ICI, 'recompte.json'), JSON.stringify(recompte(), null, 1));
console.log('écrit sbc1b/etat.html et recompte.json');
if (process.argv.includes('--sans-captures')) process.exit(0);
const url = pathToFileURL(path.join(ICI, 'etat.html')).href;
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const vue = async (f, full, geste) => {
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(url, { waitUntil: 'networkidle0' }); await wait(450);
  if (geste) await geste(p);
  await p.screenshot({ path: path.join(OUT, f), fullPage: full }); await p.close();
};
const puce = async (p) => { await (await p.$('[data-bascule]')).tap(); await wait(400); };
const nelson = (k) => async (p) => { await (await p.$('[data-vue="' + k + '"] [data-choix="Nelson Sauvin"]')).tap(); await wait(350); };
await vue('sbc1b-60.png', false);
await vue('sbc1b-whirlpool.png', false, puce);
await vue('sbc1b-page.png', true);
await vue('sbc1b-whirlpool-page.png', true, puce);
await vue('sbc1b-60-nelson.png', false, nelson('b60'));
await vue('sbc1b-whirlpool-nelson.png', false, async (p) => { await puce(p); await nelson('wp')(p); });
await vue('sbc1b-fiche.png', false, async (p) => { const h = await p.$('[data-houblon]'); const t = await h.touchStart(); await wait(700); await t.end(); await wait(500); });
await b.close();
console.log('captures sbc1b');
