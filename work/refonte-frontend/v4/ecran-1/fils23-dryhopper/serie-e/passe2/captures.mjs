// Captures et geste au doigt, e5 passe 2. node captures.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ici = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(ici, 'captures');
const url = pathToFileURL(path.join(ici, 'e5', 'etat.html')).href;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
const erreurs = [];
page.on('pageerror', (e) => erreurs.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(url, { waitUntil: 'networkidle0' }); await wait(300);
const etat = () => page.evaluate(() => ({ moment: SE.M[SE.i].lib, reponse: document.getElementById('rep').innerText, ibu: document.getElementById('e5-ib').innerText, co2: document.getElementById('e5-co2').innerText, mesure: document.getElementById('e5-mes').innerText, levure: document.getElementById('e5-levt').innerText }));
await page.screenshot({ path: path.join(out, 'e5-premier-ecran.png') });
await page.screenshot({ path: path.join(out, 'e5-390.png'), fullPage: true });
const g = { avant: await etat() };
const b = await page.evaluate(() => { const r = document.querySelector('.e5-pl').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
const y = b.y + b.h * 0.4;
await page.touchscreen.touchStart(b.x + b.w * 0.92, y); await wait(60);
for (let n = 1; n <= 10; n++) { await page.touchscreen.touchMove(b.x + b.w * (0.92 - 0.8 * n / 10), y); await wait(30); }
g.pendant = await etat();
await page.screenshot({ path: path.join(out, 'e5-toucher-390.png') });
await page.touchscreen.touchEnd(); await wait(200);
g.apres = await etat();
await page.screenshot({ path: path.join(out, 'e5-leve-390.png') });
// les jours au bout de la frise
const j = await page.evaluate(() => { const r = document.querySelector('.e5-jo').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
await page.touchscreen.touchStart(j.x + j.w * 0.95, j.y + j.h * 0.4); await page.touchscreen.touchEnd(); await wait(200);
g.jours = await etat();
await page.evaluate(() => window.poser(SE.M.findIndex((p) => p.id === 'dryPost|3'))); await wait(150);
g.apresFermentation = await etat();
await page.screenshot({ path: path.join(out, 'e5-apres-390.png') });
await page.click('#e5-fb'); await wait(150);
await page.screenshot({ path: path.join(out, 'e5-familles-390.png'), fullPage: true });
g.erreurs = erreurs;
fs.writeFileSync(path.join(out, 'geste-e5.json'), JSON.stringify(g, null, 1));
console.log(JSON.stringify(g, null, 1));
await browser.close();
