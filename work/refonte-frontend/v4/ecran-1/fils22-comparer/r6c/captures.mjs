// r6c · captures à 390 px : page entière, premier écran, fiche (appui long), toucher (vraies valeurs ouvertes),
// et deux états de travail (absolu, Nelson Sauvin ajouté). Usage : node captures.mjs [nom…]
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ICI, '../captures');
const URL = pathToFileURL(path.join(ICI, 'etat.html')).href;
const seul = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
async function page(h = 844) {
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(URL, { waitUntil: 'networkidle0' });
  await attendre(300);
  return p;
}
const vues = {
  '390': async () => { const p = await page(); const h = await p.evaluate(() => document.documentElement.scrollHeight); await p.setViewport({ width: 390, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await attendre(300); return p; },
  'premier-ecran': async () => page(),
  'fiche-390': async () => { const p = await page(); const el = await p.$('.nm[data-houblon="Galaxy"]'); const bx = await el.boundingBox(); const t = await p.touchscreen.touchStart(bx.x + 10, bx.y + 6); await attendre(650); await t.end(); await attendre(400); return p; },
  'toucher-390': async () => { const p = await page(); await p.tap('.preuves'); await attendre(300); await p.evaluate(() => document.querySelector('.preuves').scrollIntoView({ block: 'start' })); await attendre(200); return p; },
  'absolu-390': async () => { const p = await page(); await p.tap('[data-e="absolu"]'); await attendre(300); return p; },
  'nelson-390': async () => { const p = await page(); await p.tap('[data-ajout="Nelson Sauvin"]'); await attendre(400); return p; },
  'legende-390': async () => { const p = await page(); await p.tap('[data-role="legende-bouton"]'); await attendre(300); return p; },
};
for (const [nom, f] of Object.entries(vues)) {
  if (seul.length && !seul.includes(nom)) continue;
  const p = await f();
  const fichier = path.join(OUT, 'r6c-' + nom + '.png');
  await p.screenshot({ path: fichier });
  console.log('capture ' + path.basename(fichier));
  await p.close();
}
await b.close();
