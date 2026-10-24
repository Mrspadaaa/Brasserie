// Captures de fld8b : -nelson, -nugget, -cascade (premier écran 390 × 844), -page (Nelson, page entière), -fiche (appui long).
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
const ici = path.dirname(fileURLToPath(import.meta.url)), out = path.join(ici, '..', 'captures');
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const aller = async (f) => { await p.goto(pathToFileURL(path.join(ici, f)).href, { waitUntil: 'networkidle0' }); await new Promise((r) => setTimeout(r, 250)); };
await aller('etat.html'); await p.screenshot({ path: path.join(out, 'fld8b-nelson.png') }); await p.screenshot({ path: path.join(out, 'fld8b-page.png'), fullPage: true });
const n = await p.$('[data-appui]'), bb = await n.boundingBox();
await p.touchscreen.touchStart(bb.x + 10, bb.y + bb.height / 2); await new Promise((r) => setTimeout(r, 650)); await p.touchscreen.touchEnd(); await new Promise((r) => setTimeout(r, 300));
await p.screenshot({ path: path.join(out, 'fld8b-fiche.png') });
for (const [f, c] of [['h-nugget.html', 'nugget'], ['h-cascade.html', 'cascade'], ['h-motueka.html', 'motueka']]) { await aller(f); await p.screenshot({ path: path.join(out, 'fld8b-' + c + '.png') }); }
await b.close(); console.log('fld8b capturé');
