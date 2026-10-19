// Joue la page partagée en local (Chrome, fichiers autorisés) : puces, ouverture d'une page
// jouable, suivante, fermeture ; captures à 390 (clair, sombre) et 1280.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(path.resolve('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json'));
const puppeteer = require('puppeteer-core');

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const url = pathToFileURL(path.join(here, 'site', 'index.html')).href;
const out = (n) => path.join(here, 'shot-' + n + '.png');
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--allow-file-access-from-files'] });
const errs = [];
const page = await browser.newPage();
page.on('pageerror', (e) => errs.push(String(e.message)));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await page.goto(url, { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle0' });
const titre = await page.title();
const n0 = await page.$$eval('#grid figure', (f) => f.length);
const puces = await page.$$eval('#chips button', (b) => b.map((x) => x.textContent));
await page.screenshot({ path: out('tout-390') });
// Puce « Rail »
await (await page.$$('#chips button'))[puces.indexOf('Rail')].tap();
await new Promise((r) => setTimeout(r, 300));
const rail = await page.$$eval('#grid img', (i) => i.map((x) => x.alt));
// Ouvrir la première, puis suivante
await (await page.$('#grid figure button')).tap();
await new Promise((r) => setTimeout(r, 900));
const t1 = await page.$eval('#vt', (e) => e.textContent);
const frameText = await (await (await page.$('#frame')).contentFrame()).evaluate(() => document.body.innerText.slice(0, 40));
await page.screenshot({ path: out('viewer-390') });
await (await page.$('#next')).tap();
await new Promise((r) => setTimeout(r, 900));
const t2 = await page.$eval('#vt', (e) => e.textContent);
await (await page.$('#close')).tap();
const ferme = await page.$eval('#viewer', (e) => e.hidden);
await (await page.$$('#chips button'))[0].tap();
await new Promise((r) => setTimeout(r, 600));
const over = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
await page.screenshot({ path: out('sombre-390') });
await page.setViewport({ width: 1280, height: 900 });
await page.screenshot({ path: out('1280') });
await browser.close();
console.log(JSON.stringify({ titre, n0, puces, rail, t1, frameText, t2, ferme, debordement: over, errs }, null, 1));
