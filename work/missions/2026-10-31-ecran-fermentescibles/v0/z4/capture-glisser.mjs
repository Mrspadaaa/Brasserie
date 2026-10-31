// z4 : le geste de la frise (repos, pendant, après) : Haferflocken glissé de l'empâtage à la fermentation, lâché vers J+3.
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ici = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(ici, '../../../../../package.json'));
const puppeteer = require('puppeteer-core');
const nav = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
try {
  const p = await nav.newPage();
  const erreurs = []; p.on('pageerror', (e) => erreurs.push(e.message));
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await p.goto(pathToFileURL(path.join(ici, 'etat.html')).href, { waitUntil: 'networkidle0' });
  const grip = await p.$('[data-role="lane"][data-mom="empâtage"] li:nth-child(3) [data-role="grip"]');
  const g = await grip.boundingBox();
  const regle = await (await p.$('[data-role="regle"]')).boundingBox();
  const x0 = g.x + g.width / 2, y0 = g.y + g.height / 2;
  const x1 = regle.x + regle.width * 3 / 14, y1 = regle.y - 20;
  await p.mouse.move(x0, y0); await p.mouse.down();
  await p.mouse.move((x0 + x1) / 2, (y0 + y1) / 2, { steps: 8 });
  await p.mouse.move(x1, y1, { steps: 8 });
  await new Promise((r) => setTimeout(r, 120));
  await p.screenshot({ path: path.join(ici, 'z4-glisser-pendant.png') });
  await p.mouse.up();
  await new Promise((r) => setTimeout(r, 150));
  await p.screenshot({ path: path.join(ici, 'z4-glisser-apres.png') });
  const jour = await p.evaluate(() => { const i = document.querySelector('[data-role="lane"][data-mom="fermentation"] [data-role="jour"]'); return i ? i.value : null; });
  const emp = await p.evaluate(() => document.querySelector('[data-role="t-emp"]').textContent);
  console.log(`z4 glisser : Haferflocken en fermentation, J+${jour} ; empâtage ${emp} ; erreurs ${erreurs.length}`);
} finally { await nav.close(); }
