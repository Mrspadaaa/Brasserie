// r6m : les captures du lot 22 (390 px, ×2), et l'appui long réel pour la fiche.
// Usage : node captures.mjs   →  ../captures/r6m-390.png, r6m-premier-ecran.png, r6m-fiche-390.png,
//         r6m-toucher-390.png, r6m-absolu-390.png
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const ici = path.dirname(fileURLToPath(import.meta.url));
const url = pathToFileURL(path.join(ici, 'etat.html')).href;
const out = (n) => path.join(ici, '..', 'captures', 'r6m-' + n + '.png');
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const neuve = async (q = '') => { const p = await browser.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await p.goto(url + q, { waitUntil: 'load' }); await attendre(500); return p; };
let p = await neuve();
await p.screenshot({ path: out('premier-ecran') });
await p.screenshot({ path: out('390'), fullPage: true });
await p.close();
p = await neuve('?abs');
await p.screenshot({ path: out('absolu-390'), fullPage: true });
await p.close();
// L'acquis « vraies valeurs », ouvert d'un toucher.
p = await neuve();
const b = await p.$('.vv-b');
await b.evaluate((e) => e.scrollIntoView({ block: 'start' }));
await attendre(200);
await b.tap();
await attendre(400);
await b.evaluate((e) => e.scrollIntoView({ block: 'start' }));
await attendre(200);
await p.screenshot({ path: out('toucher-390') });
await p.close();
// La fiche : appui long réel (700 ms) sur le nom de Galaxy.
p = await neuve();
const g = await p.$('.hk[data-hk="Galaxy"] .hn');
const bx = await g.boundingBox();
await p.touchscreen.touchStart(bx.x + bx.width / 2, bx.y + bx.height / 2);
await attendre(750);
await p.touchscreen.touchEnd();
await attendre(500);
await p.screenshot({ path: out('fiche-390') });
const f = await p.$('[data-role="fiche"]');
if (f) { await f.screenshot({ path: out('fiche-pleine') }).catch(() => {}); }
await p.close();
await browser.close();
console.log('SHOTS r6m');
