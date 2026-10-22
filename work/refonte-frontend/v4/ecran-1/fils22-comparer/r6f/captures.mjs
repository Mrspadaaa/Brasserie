// Captures de r6f à 390 px : page entière, premier écran, fiche (appui long sur Galaxy), un toucher (chimie),
// et quelques états utiles. Usage : node captures.mjs [etat.html]  →  fils22-comparer/captures/r6f-*.png
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const ICI = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ICI, '../captures');
const url = (q = '') => pathToFileURL(path.join(ICI, 'etat.html')).href + q;
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
async function ouvrir(q = '', h = 844) {
  const p = await browser.newPage();
  p.on('console', (m) => { if (m.type() === 'error') console.log('console.error', m.text()); });
  p.on('pageerror', (e) => console.log('pageerror', e.message));
  await p.setViewport({ width: 390, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(url(q), { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 400));
  return p;
}
const shot = async (p, nom, full = false) => { await p.screenshot({ path: path.join(OUT, 'r6f-' + nom + '.png'), fullPage: full }); console.log('SHOT r6f-' + nom + '.png'); };
let p = await ouvrir();
await shot(p, '390', true);
await shot(p, 'premier-ecran');
await p.close();
// appui long sur Galaxy : la vraie fiche
p = await ouvrir();
const b = await p.$('.col[data-houblon="Galaxy"] .hn');
const r = await b.boundingBox();
const x = r.x + r.width / 2, y = r.y + r.height / 2;
await p.touchscreen.touchStart(x, y);
await new Promise((res) => setTimeout(res, 700));
await p.touchscreen.touchEnd();
await new Promise((res) => setTimeout(res, 400));
console.log('fiche ouverte :', await p.$eval('[data-role="fiche"]', (e) => e.getAttribute('aria-label')).catch(() => 'aucune'));
await shot(p, 'fiche-390');
await p.close();
// un toucher : la chimie, Galaxy mis en avant
p = await ouvrir('?focus=Galaxy&ouvre=chimie', 844);
await p.evaluate(() => document.querySelector('.rad').scrollIntoView());
await shot(p, 'toucher-390');
await p.close();
// états utiles : absolu, panel OSU, vraies valeurs
p = await ouvrir('?focus=Galaxy&abs');
await shot(p, 'absolu-390', true);
await p.close();
p = await ouvrir('?ouvre=osu');
await p.evaluate(() => document.querySelector('#sec-osu').scrollIntoView());
await shot(p, 'osu-390');
await p.close();
p = await ouvrir('?ouvre=valeurs');
await p.evaluate(() => document.querySelector('#sec-valeurs').scrollIntoView());
await shot(p, 'valeurs-390');
await p.close();
p = await ouvrir('?vue=barres');
await shot(p, 'barres-390', true);
await p.close();
await browser.close();
