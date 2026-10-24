// Captures de d8c à 390 px : node captures.mjs
// d8-390.png (page entière), d8-premier-ecran.png, d8-toucher-390.png (doigt posé et glissé sur le rail, loupe),
// d8-60-390.png, d8-barres-390.png (un segment touché), d8-absolu-390.png (lecture absolue),
// d8-fiche-390.png (appui long) ; preuve du geste dans captures/geste-d8.json ; largeur de page mesurée.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ici = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(ici, 'captures');
const url = pathToFileURL(path.join(ici, 'd8', 'etat.html')).href;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
const erreurs = [];
page.on('pageerror', (e) => erreurs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const aller = async (q = '') => { await page.goto(url + q, { waitUntil: 'networkidle0' }); await wait(450); };
const etat = () => page.evaluate(() => { const p = DH.M[DH.cur()]; return { moment: p.lib, floral: +(p.c.floral - DH.AV.floral).toFixed(1), resineux: +(p.c.resin - DH.AV.resin).toFixed(1), ibu: p.ibu, emporte: p.perte, largeur: document.documentElement.scrollWidth }; });

await aller();
await page.screenshot({ path: path.join(out, 'd8-premier-ecran.png') });
await page.screenshot({ path: path.join(out, 'd8-390.png'), fullPage: true });
const avant = await etat();
// le geste : doigt posé sur le pouce, glissé vers l'ébullition, gardé (loupe)
const r = await page.evaluate(() => { const b = document.querySelector('.d8-rail').getBoundingClientRect(); return { x: b.left, y: b.top + b.height / 2, w: b.width }; });
const a = { x: r.x + r.w * 0.775, y: r.y }, b = { x: r.x + r.w * 0.2, y: r.y };
await page.touchscreen.touchStart(a.x, a.y); await wait(120);
for (let k = 1; k <= 10; k++) { await page.touchscreen.touchMove(a.x + (b.x - a.x) * k / 10, a.y); await wait(40); }
await wait(350);
const pendant = await etat();
await page.screenshot({ path: path.join(out, 'd8-toucher-390.png') });
await page.touchscreen.touchEnd(); await wait(300);
const apres = await etat();
await aller('?moment=b60'); await page.screenshot({ path: path.join(out, 'd8-60-390.png') });
const a60 = await etat();
await aller(); await page.tap('#d8-ap .d8-s[data-f="floral"]'); await wait(400);
await page.screenshot({ path: path.join(out, 'd8-barres-390.png'), fullPage: true });
await aller(); await page.tap('[data-e="absolu"]'); await wait(400);
await page.screenshot({ path: path.join(out, 'd8-absolu-390.png') });
await aller(); { const h = await page.$('[data-houblon]'); const t = await h.touchStart(); await wait(700); await t.end(); await wait(400); }
await page.screenshot({ path: path.join(out, 'd8-fiche-390.png') });
fs.writeFileSync(path.join(out, 'geste-d8.json'), JSON.stringify({ geste: 'doigt posé sur le pouce (actif · 3 j), glissé vers l’ébullition, gardé, relâché', avant, pendant, apres, a60, erreurs }, null, 1));
console.log('geste : ' + avant.moment + ' → ' + pendant.moment + ' ; largeur ' + [avant, pendant, a60].map((e) => e.largeur).join('/') + ' ; ' + (erreurs.length ? 'ERREURS : ' + erreurs.join(' | ') : '0 erreur'));
await browser.close();
