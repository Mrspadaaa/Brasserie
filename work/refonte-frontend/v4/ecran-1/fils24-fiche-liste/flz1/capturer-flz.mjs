// Captures de la série z : <id>-premier-ecran.png (390 × 844), <id>-page.png (page entière), et les états qui comptent.
// Usage : node capturer-flz.mjs <racine> [ids…]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const puppeteer = createRequire(path.join(path.resolve(process.argv[2]), 'package.json'))('puppeteer-core');

const RACINE = path.resolve(process.argv[2]);
const LOT = path.join(RACINE, 'work/refonte-frontend/v4/ecran-1/fils24-fiche-liste');
const OUT = path.join(LOT, 'captures'); fs.mkdirSync(OUT, { recursive: true });
const ids = process.argv.slice(3).length ? process.argv.slice(3) : ['flz1', 'flz2', 'flz3', 'flz4', 'flz5', 'flz6', 'flz7', 'flz8'];
const ETATS = {
  flz3: [['range', () => ranger('groseille à maquereau', 'berries')]],
  flz6: [['tropicaux', () => viser('tropical')]],
};
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (const id of ids) {
  const url = pathToFileURL(path.join(LOT, id, 'etat.html')).href;
  const page = await browser.newPage();
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(String(e.message || e)));
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await wait(300);
  const m = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, scrollH: document.documentElement.scrollHeight }));
  await page.screenshot({ path: path.join(OUT, id + '-premier-ecran.png') });
  await page.screenshot({ path: path.join(OUT, id + '-page.png'), fullPage: true });
  for (const [nom, fn] of ETATS[id] || []) { await page.evaluate(fn); await wait(250); await page.screenshot({ path: path.join(OUT, id + '-' + nom + '.png') }); }
  if (id === 'flz4') {
    await page.goto(url, { waitUntil: 'networkidle0' }); await wait(300);
    const h = (await page.$$('[data-houblon]'))[1]; const t = await h.touchStart(); await wait(700); await t.end(); await wait(300);
    await page.screenshot({ path: path.join(OUT, id + '-fiche-courte.png') });
  }
  console.log(id, '· largeur', m.scrollW, '· hauteur', m.scrollH, erreurs.length ? '· ERREURS ' + erreurs.join(' | ') : '· sans erreur');
  await page.close();
}
await browser.close();
