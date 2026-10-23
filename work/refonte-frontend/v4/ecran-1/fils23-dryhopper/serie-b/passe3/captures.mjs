// Captures de b4, passe 3 : page entière (b4-390.png), premier écran (b4-premier-ecran.png), après un geste au
// doigt sur le rail jusqu'à 35′ (b4-toucher-390.png) ; dans travail/ : pendant le geste (loupe), la fiche, la
// légende, 3 j touché, et geste-b4.json (états avant / pendant / après, loupe contre pas du rail, erreurs).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ici = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(ici, 'captures'), tr = path.join(out, 'travail');
fs.mkdirSync(tr, { recursive: true });
const url = pathToFileURL(path.join(ici, 'b4', 'etat.html')).href;
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const att = (ms) => new Promise((r) => setTimeout(r, ms));
const page = await browser.newPage();
const erreurs = [];
page.on('pageerror', (e) => erreurs.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(url, { waitUntil: 'networkidle0' });
await att(300);
await page.screenshot({ path: path.join(out, 'b4-premier-ecran.png') });
await page.screenshot({ path: path.join(out, 'b4-390.png'), fullPage: true });
const lire = () => page.evaluate(() => ({ moment: document.querySelector('.dk-rail').getAttribute('aria-valuetext'), ecart: document.querySelector('#ecart').innerText, pont: document.querySelector('#pd-po').innerText, lignes: [...document.querySelectorAll('.pd-r')].map((r) => r.innerText.replace(/\s+/g, ' ')) }));
const avant = await lire();
const r = await page.evaluate(() => { const b = document.querySelector('.dk-rail').getBoundingClientRect(); return { l: b.left, w: b.width, y: b.top + b.height / 2 }; });
const pct = await page.evaluate(() => ({ de: x(cur), a: x(R.indexOf('b35')) }));
const cdp = await page.target().createCDPSession();
const pt = (p) => ({ x: r.l + r.w * p / 100, y: r.y });
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt(pct.de)] });
for (let k = 1; k <= 14; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [pt(pct.de + (pct.a - pct.de) * k / 14)] }); await att(20); }
await att(150);
const pendant = await page.evaluate(() => { const l = [...document.querySelectorAll('.dk-loupe span')]; const ici = document.querySelector('.dk-loupe span.dk-ici'); const pas = l.length > 1 ? Math.abs(l[1].getBoundingClientRect().left - l[0].getBoundingClientRect().left) : null; const c = [...document.querySelectorAll('.dk-rail .dk-cran')].map((e) => e.getBoundingClientRect().left).sort((a, b) => a - b); const pr = c.length > 1 ? c[1] - c[0] : null; return { loupe: ici && ici.querySelector("b").textContent, pasLoupe: pas, pasRail: pr && Math.round(pr * 10) / 10, rapport: pas && pr ? Math.round(pas / pr * 10) / 10 : null }; });
await page.screenshot({ path: path.join(tr, 'b4-pendant.png') });
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await att(200);
const apres = await lire();
await page.screenshot({ path: path.join(out, 'b4-toucher-390.png') });
// 3 j touché (sans gain), à partir de la réponse
await page.goto(url, { waitUntil: 'networkidle0' });
await page.tap('[data-jour="3"]'); await att(150);
const trois = await lire();
await page.screenshot({ path: path.join(tr, 'b4-3j.png') });
// la fiche par appui long
await page.goto(url, { waitUntil: 'networkidle0' });
const h = await page.evaluate(() => { const b = document.querySelector('[data-houblon]').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
const cdp2 = await page.target().createCDPSession();
await cdp2.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [h] }); await att(800);
await cdp2.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await att(150);
const fiche = await page.evaluate(() => !document.querySelector('[data-role="fiche"]').hidden);
await page.screenshot({ path: path.join(tr, 'b4-fiche.png') });
await page.goto(url + '?legende', { waitUntil: 'networkidle0' }); await att(150);
await page.screenshot({ path: path.join(tr, 'b4-legende.png') });
await page.goto(url + '?absolu', { waitUntil: 'networkidle0' }); await att(150);
await page.screenshot({ path: path.join(tr, 'b4-absolu.png') });
const g = { avant, pendant, apres, trois, fiche, erreurs };
fs.writeFileSync(path.join(tr, 'geste-b4.json'), JSON.stringify(g, null, 1));
console.log(JSON.stringify({ avant: avant.moment, pendant, apres: apres.moment, ecart: apres.ecart, pont: apres.pont, trois: trois.moment + ' / ' + trois.pont, fiche, erreurs }, null, 1));
await browser.close();
