// Captures à 390 px (premier écran) et états du geste : node captures.mjs [d1 …]
// Écrit captures/<id>-390.png (repos), <id>-60-390.png (moment 60′), <id>-toucher-390.png (doigt posé,
// loupe ouverte), <id>-fiche-390.png (appui long).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import { ici } from './socle.mjs';

const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8'];
const out = path.join(ici, 'captures');
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (const id of ids) {
  const f = path.join(ici, id, 'etat.html');
  if (!fs.existsSync(f)) continue;
  const url = pathToFileURL(f).href;
  const page = await browser.newPage();
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(url, { waitUntil: 'networkidle0' }); await wait(500);
  await page.screenshot({ path: path.join(out, id + '-390.png') });
  await page.goto(url + '?moment=b60', { waitUntil: 'networkidle0' }); await wait(500);
  await page.screenshot({ path: path.join(out, id + '-60-390.png') });
  await page.goto(url + '?moment=wp', { waitUntil: 'networkidle0' }); await wait(500);
  await page.screenshot({ path: path.join(out, id + '-wp-390.png') });
  // doigt posé sur le moteur du geste, glissé, gardé
  await page.goto(url, { waitUntil: 'networkidle0' }); await wait(400);
  const g = await page.evaluate(() => { const r = document.querySelector('[data-libre="moment"] [role="slider"]').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  const avant = await page.evaluate(() => { const p = DH.M[DH.cur()]; return { moment: p.lib, floral: +(p.c.floral - DH.AV.floral).toFixed(1), resineux: +(p.c.resin - DH.AV.resin).toFixed(1), ibu: p.ibu }; });
  const gg = await page.evaluate(() => window.__geste ? window.__geste() : null);
  const a = gg ? gg.a : { x: g.x + g.w * 0.66, y: g.y + g.h / 2 }, b = gg ? gg.b : { x: g.x + g.w * 0.25, y: g.y + g.h / 2 };
  await page.touchscreen.touchStart(a.x, a.y); await wait(120);
  for (let k = 1; k <= 8; k++) { await page.touchscreen.touchMove(a.x + (b.x - a.x) * k / 8, a.y + (b.y - a.y) * k / 8); await wait(40); }
  await wait(300);
  const pendant = await page.evaluate(() => document.querySelector('[role="slider"]').getAttribute('aria-valuetext'));
  const etat = () => page.evaluate(() => { const p = DH.M[DH.cur()]; return { moment: p.lib, floral: +(p.c.floral - DH.AV.floral).toFixed(1), resineux: +(p.c.resin - DH.AV.resin).toFixed(1), ibu: p.ibu, emporte: p.perte, simule: true }; });
  const geste = { pendant: await etat() };
  await page.screenshot({ path: path.join(out, id + '-toucher-390.png') });
  await page.touchscreen.touchEnd(); await wait(300);
  geste.apres = await etat(); geste.avant = avant;
  fs.writeFileSync(path.join(out, 'geste-' + id + '.json'), JSON.stringify({ id, geste: 'doigt posé sur le moment, glissé vers l’ébullition, relâché', avant: geste.avant, pendant: geste.pendant, apres: geste.apres, erreurs }, null, 1));
  // fiche
  await page.goto(url, { waitUntil: 'networkidle0' }); await wait(300);
  const h = await page.$('[data-houblon]'); const t = await h.touchStart(); await wait(700); await t.end(); await wait(400);
  await page.screenshot({ path: path.join(out, id + '-fiche-390.png') });
  // page entière
  await page.goto(url, { waitUntil: 'networkidle0' }); await wait(400);
  await page.screenshot({ path: path.join(out, id + '-page.png'), fullPage: true });
  console.log(id + ' · geste → ' + pendant + (erreurs.length ? ' · ERREURS : ' + erreurs.join(' | ') : ' · 0 erreur'));
  await page.close();
}
await browser.close();
