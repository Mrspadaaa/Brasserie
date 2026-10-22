// Captures de r6a à 390 px : page entière, premier écran, fiche (appui long), toucher (chimie et vraies valeurs), absolu.
// Usage : node work/refonte-frontend/v4/ecran-1/fils22-comparer/r6a/captures.mjs
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(ICI, '../../../../../../package.json'));
const puppeteer = require('puppeteer-core');
const URL = pathToFileURL(path.join(ICI, 'etat.html')).href, CAP = path.join(ICI, '../captures');
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const ouvrir = async (q = '', h = 844) => { const p = await b.newPage(); await p.setViewport({ width: 390, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await p.goto(URL + q, { waitUntil: 'networkidle0' }); await attendre(400); return p; };
let p = await ouvrir();
await p.screenshot({ path: path.join(CAP, 'r6a-premier-ecran.png') });
await p.screenshot({ path: path.join(CAP, 'r6a-390.png'), fullPage: true });
// appui long sur Cascade
const h = await p.$('[data-houblon="Cascade"]');
const t = await h.touchStart(); await attendre(700); await t.end(); await attendre(500);
await p.screenshot({ path: path.join(CAP, 'r6a-fiche-390.png') });
await p.close();
// un toucher : chimie et vraies valeurs
p = await ouvrir();
await (await p.$('.tch')).tap(); await attendre(400);
await p.evaluate(() => document.querySelector('.tch').scrollIntoView({ block: 'start' }));
await attendre(200);
await p.screenshot({ path: path.join(CAP, 'r6a-toucher-390.png') });
await p.close();
// absolu, Galaxy mis en avant
p = await ouvrir('?sel=Galaxy');
await (await p.$('[data-e="absolu"]')).tap(); await attendre(400);
await p.screenshot({ path: path.join(CAP, 'r6a-absolu-galaxy-390.png') });
await p.close();
p = await ouvrir('?legende');
await p.screenshot({ path: path.join(CAP, 'r6a-legende-390.png') });
await b.close();
console.log('CAPTURES r6a OK');
