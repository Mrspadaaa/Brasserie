// Captures de la série B : premier écran (b<n>-390.png), un geste joué au doigt (glissé jusqu'à 10′ puis
// relâché : b<n>-10-390.png), la fiche ouverte par appui long (travail/b<n>-fiche.png), et la mesure du geste
// dans geste-b.json (valeurs avant / pendant / après, loupe sous le doigt contre le pas du rail).
// Usage : node captures.mjs [b1 b2 …]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ici = path.dirname(fileURLToPath(import.meta.url));
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8'];
const out = path.join(ici, 'captures');
fs.mkdirSync(path.join(out, 'travail'), { recursive: true });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const geste = {};
for (const id of ids) {
  const url = pathToFileURL(path.join(ici, id, 'etat.html')).href;
  const page = await browser.newPage();
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(url, { waitUntil: 'networkidle0' });
  await attendre(300);
  await page.screenshot({ path: path.join(out, id + '-390.png') });
  const lire = () => page.evaluate(() => ({ moment: document.querySelector('.rail').getAttribute('aria-valuetext'), ecart: (document.querySelector('#ecart') || {}).innerText || '' }));
  const avant = await lire();
  // le geste : poser le doigt sur le rail, glisser jusqu'à 10′, mesurer la loupe, relâcher
  const r = await page.evaluate(() => { const b = document.querySelector('.rail').getBoundingClientRect(); return { l: b.left, w: b.width, y: b.top + b.height / 2 }; });
  const cible = await page.evaluate(() => { const i = DATA.D.findIndex((p) => p.id === 'b10'); return x(i); });
  const depart = await page.evaluate(() => x(DATA.BEST));
  const cdp = await page.target().createCDPSession();
  const pt = (pct) => ({ x: r.l + r.w * pct / 100, y: r.y });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt(depart)] });
  for (let k = 1; k <= 12; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [pt(depart + (cible - depart) * k / 12)] }); await attendre(20); }
  await attendre(150);
  const pendant = await page.evaluate(() => { const l = [...document.querySelectorAll('.loupe span')]; const ici = document.querySelector('.loupe span.ici'); const pas = l.length > 1 ? Math.abs(l[1].getBoundingClientRect().left - l[0].getBoundingClientRect().left) : null; const crans = [...document.querySelectorAll('.rail .cran')].map((c) => c.getBoundingClientRect().left).sort((a, b) => a - b); const pr = crans.length > 1 ? crans[1] - crans[0] : null; return { loupe: ici ? ici.textContent : null, pasLoupe: pas, pasRail: pr && Math.round(pr * 10) / 10, rapport: pas && pr ? Math.round(pas / pr * 10) / 10 : null }; });
  await page.screenshot({ path: path.join(out, 'travail', id + '-pendant.png') });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await attendre(200);
  const apres = await lire();
  await page.screenshot({ path: path.join(out, id + '-10-390.png') });
  // la fiche par appui long
  await page.goto(url, { waitUntil: 'networkidle0' });
  const h = await page.evaluate(() => { const b = document.querySelector('[data-houblon]').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
  await cdp.detach().catch(() => {});
  const cdp2 = await page.target().createCDPSession();
  await cdp2.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [h] });
  await attendre(800);
  await cdp2.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await attendre(150);
  const ficheOuverte = await page.evaluate(() => { const f = document.querySelector('[data-role="fiche"]'); return !!f && !f.hidden; });
  await page.screenshot({ path: path.join(out, 'travail', id + '-fiche.png') });
  // au repos, absolu
  await page.goto(url + '?absolu', { waitUntil: 'networkidle0' });
  await attendre(200);
  await page.screenshot({ path: path.join(out, 'travail', id + '-absolu.png') });
  geste[id] = { avant, pendant, apres, ficheOuverte, erreurs };
  console.log(id, '·', avant.moment, '→', apres.moment, '· loupe', pendant.loupe, 'pas', pendant.pasLoupe, 'contre', pendant.pasRail, '(×' + pendant.rapport + ')', '· fiche', ficheOuverte, erreurs.length ? '· ERREURS ' + erreurs.join(' | ') : '');
  await page.close();
}
fs.writeFileSync(path.join(out, 'travail', 'geste-b.json'), JSON.stringify(geste, null, 1));
await browser.close();
