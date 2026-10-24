// Captures de r6g à 390 px : page entière, premier écran, fiche (appui long sur Galaxy), un toucher (tiroir ouvert).
// Usage : node work/refonte-frontend/v4/ecran-1/fils22-comparer/r6g/captures.mjs [seulement…]
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(ICI, '../../../../../../package.json'));
const puppeteer = require('puppeteer-core');
const PAGE = pathToFileURL(path.join(ICI, 'etat.html')).href;
const OUT = (n) => path.join(ICI, '../captures', 'r6g-' + n + '.png');
const seul = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const ouvrir = async (q = '') => {
  const p = await browser.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(PAGE + q, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 300));
  return p;
};
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const jobs = {
  '390': async () => { const p = await ouvrir(); await p.screenshot({ path: OUT('390'), fullPage: true }); },
  'premier-ecran': async () => { const p = await ouvrir(); await p.screenshot({ path: OUT('premier-ecran') }); },
  'absolu-390': async () => { const p = await ouvrir('?abs'); await p.screenshot({ path: OUT('absolu-390') }); },
  'fiche-390': async () => {
    const p = await ouvrir();
    const el = await p.$('[data-houblon="Galaxy"]');
    const b = await el.boundingBox();
    const x = b.x + b.width / 2, y = b.y + b.height / 2;
    await p.touchscreen.touchStart(x, y); await pause(800); await p.touchscreen.touchEnd(); await pause(500);
    await p.screenshot({ path: OUT('fiche-390') });
  },
  'toucher-390': async () => {
    const p = await ouvrir();
    await p.tap('.ong[aria-controls="r6g-chimie"]'); await pause(300);
    await p.evaluate(() => document.querySelector('.onglets').scrollIntoView({ block: 'start' }));
    await pause(200);
    await p.screenshot({ path: OUT('toucher-390') });
  },
  'valeurs-390': async () => {
    const p = await ouvrir();
    await p.tap('.ong[aria-controls="r6g-valeurs"]'); await pause(300);
    await p.evaluate(() => document.querySelector('.onglets').scrollIntoView({ block: 'start' }));
    await pause(200);
    await p.screenshot({ path: OUT('valeurs-390') });
  },
  'osu-390': async () => {
    const p = await ouvrir();
    await p.tap('.ong[aria-controls="r6g-osu"]'); await pause(300);
    await p.evaluate(() => document.querySelector('.onglets').scrollIntoView({ block: 'start' }));
    await pause(200);
    await p.screenshot({ path: OUT('osu-390') });
  },
  'legende-390': async () => { const p = await ouvrir('?legende'); await p.screenshot({ path: OUT('legende-390') }); },
};
for (const [k, f] of Object.entries(jobs)) if (!seul.length || seul.includes(k)) { await f(); console.log('SHOT ' + OUT(k)); }
await browser.close();
