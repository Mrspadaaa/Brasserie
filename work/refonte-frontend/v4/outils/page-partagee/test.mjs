// Joue la page Artifact en local (Chrome, fichiers autorisés) : modes, puces, ouverture
// d'une page jouable, suivante, fermeture ; captures à 390 (clair, sombre) et 1280.
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
const n0 = await page.$$eval('#grid figure', (f) => f.length);
await page.screenshot({ path: out('vue-390') });
// Puce « Ma bière · radar »
const chips = await page.$$('#chips button');
await chips[2].tap();
await new Promise((r) => setTimeout(r, 300));
const alt = await page.$$eval('#grid img', (i) => i.map((x) => x.alt));
await page.screenshot({ path: out('radar-390') });
// Mode par variante
await (await page.$('.seg button[data-mode="variante"]')).tap();
await new Promise((r) => setTimeout(r, 300));
const n1 = await page.$$eval('#grid figure', (f) => f.length);
await page.screenshot({ path: out('variante-390'), fullPage: true });
// Ouvrir la première vue, puis suivante
await (await page.$('#grid figure button')).tap();
await new Promise((r) => setTimeout(r, 900));
const t1 = await page.$eval('#vt', (e) => e.textContent);
const frameText = await (await (await page.$('#frame')).contentFrame()).evaluate(() => document.body.innerText.slice(0, 60));
await page.screenshot({ path: out('viewer-390') });
await (await page.$('#next')).tap();
await new Promise((r) => setTimeout(r, 900));
const t2 = await page.$eval('#vt', (e) => e.textContent);
await (await page.$('#close')).tap();
const hidden = await page.$eval('#viewer', (e) => e.hidden);
const over = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
await page.screenshot({ path: out('sombre-390'), fullPage: true });
await page.setViewport({ width: 1280, height: 900 });
await page.screenshot({ path: out('1280'), fullPage: true });
await browser.close();
console.log(JSON.stringify({ n0, radarAlts: alt, n1, t1, frameText, t2, hidden, debordement: over, errs }, null, 1));
