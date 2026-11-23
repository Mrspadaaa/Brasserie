// Captures de r6i à 390 px : page entière, premier écran, fiche ouverte par un vrai appui long (toucher
// tenu 700 ms sur le nom), et l'acquis « chimie » ouvert d'un toucher.
// Usage : node work/refonte-frontend/v4/ecran-1/fils22-comparer/r6i/captures.mjs [suffixe]
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(ICI, '../../../../../../package.json'));
const puppeteer = require('puppeteer-core');
const CAP = path.join(ICI, '../captures');
const suf = process.argv[2] || '';
const url = pathToFileURL(path.join(ICI, 'etat.html')).href;
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const nouvelle = async (h = 844) => { const p = await browser.newPage(); await p.setViewport({ width: 390, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await p.goto(url, { waitUntil: 'networkidle0', timeout: 30000 }); await new Promise((r) => setTimeout(r, 400)); return p; };
let p = await nouvelle();
await p.screenshot({ path: path.join(CAP, 'r6i-premier-ecran' + suf + '.png') });
await p.screenshot({ path: path.join(CAP, 'r6i-390' + suf + '.png'), fullPage: true });
// Appui long sur le nom de Nelson Sauvin.
const b = await p.$eval('.cible [data-houblon]', (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
await p.touchscreen.touchStart(b.x, b.y);
await new Promise((r) => setTimeout(r, 750));
await p.touchscreen.touchEnd();
await new Promise((r) => setTimeout(r, 400));
const ouverte = await p.$eval('[data-role="fiche"]', (e) => e.getAttribute('aria-label')).catch(() => null);
console.log('fiche après appui long :', ouverte);
await p.screenshot({ path: path.join(CAP, 'r6i-fiche-390' + suf + '.png') });
await p.close();
// Un toucher : la chimie, et Galaxy mis en avant.
p = await nouvelle(1400);
await p.tap('.cand[data-voie="Galaxy"]');
await p.tap('[data-ouvre-acquis="chimie"]');
await new Promise((r) => setTimeout(r, 200));
await p.$eval('#p-chimie', (e) => e.scrollIntoView({ block: 'start' }));
await new Promise((r) => setTimeout(r, 200));
await p.screenshot({ path: path.join(CAP, 'r6i-toucher-390' + suf + '.png') });
await p.close();
await browser.close();
console.log('CAPTURES OK');
