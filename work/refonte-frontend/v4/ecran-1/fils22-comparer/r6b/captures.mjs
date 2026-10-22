// Captures de r6b à 390 px : page entière, premier écran, fiche à l'appui long (Galaxy), acquis ouverts d'un toucher.
// Usage : node captures.mjs [nom…]  →  ../captures/r6b-*.png
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
const ici = path.dirname(fileURLToPath(import.meta.url));
const url = pathToFileURL(path.join(ici, 'etat.html')).href;
const out = (n) => path.join(ici, '../captures/r6b-' + n + '.png');
const only = process.argv.slice(2);
const want = (n) => !only.length || only.includes(n);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const neuf = async (q = '') => { const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await p.goto(url + q, { waitUntil: 'networkidle0' }); await wait(300); return p; };
if (want('390')) { const p = await neuf(); await p.screenshot({ path: out('390'), fullPage: true }); await p.close(); }
if (want('premier-ecran')) { const p = await neuf(); await p.screenshot({ path: out('premier-ecran') }); await p.close(); }
if (want('abs')) { const p = await neuf('?abs'); await p.screenshot({ path: out('absolu-390') }); await p.close(); }
if (want('fiche')) {
  const p = await neuf();
  const h = await p.$('.rc [data-houblon="Galaxy"]');
  const bb = await h.boundingBox();
  await p.touchscreen.touchStart(bb.x + bb.width / 2, bb.y + bb.height / 2); await wait(700); await p.touchscreen.touchEnd(); await wait(500);
  await p.screenshot({ path: out('fiche-390') }); await p.close();
}
if (want('toucher')) {
  const p = await neuf();
  for (const s of ['[aria-controls="osu"]', '[aria-controls="valeurs"]']) { const e = await p.$(s); await e.tap(); await wait(250); }
  const y = await p.evaluate(() => document.querySelector('.ouvrir').getBoundingClientRect().top + scrollY - 8);
  await p.evaluate((y) => scrollTo(0, y), y); await wait(200);
  await p.screenshot({ path: out('toucher-390'), clip: { x: 0, y, width: 390, height: 844 }, captureBeyondViewport: true });
  await p.close();
}
await b.close();
console.log('captures r6b écrites');
