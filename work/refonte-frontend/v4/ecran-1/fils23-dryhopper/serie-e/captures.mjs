// Captures et geste joué au doigt, série E. node captures.mjs [e1 e2 …]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ici = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(ici, 'captures');
fs.mkdirSync(out, { recursive: true });
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8'];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const etat = (page) => page.evaluate(() => ({ moment: SE.M[SE.i].lib, reponse: document.getElementById('rep').innerText }));
for (const id of ids) {
  const page = await browser.newPage();
  const erreurs = [];
  page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
  page.on('pageerror', (e) => erreurs.push(String(e)));
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(ici, id, 'etat.html')).href, { waitUntil: 'networkidle0' });
  await wait(300);
  await page.screenshot({ path: path.join(out, id + '-390.png') });
  const geste = { id, avant: await etat(page) };
  // Geste : on pose le doigt sur le premier curseur du groupe libre, à 15 % de sa largeur (ébullition), on glisse
  // jusqu'à 35 %, on lève ; puis l'état « 10′ » et l'état « après ».
  const b = await page.evaluate(() => { const s = document.querySelector('[data-libre] [role=slider], [data-libre][role=slider]'); const r = s.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, v: s.getAttribute('aria-orientation') === 'vertical' }; });
  const p0 = b.v ? [b.x + b.w / 2, b.y + b.h * 0.08] : [b.x + b.w * 0.15, b.y + b.h / 2];
  const p1 = b.v ? [b.x + b.w / 2, b.y + b.h * 0.3] : [b.x + b.w * 0.35, b.y + b.h / 2];
  await page.touchscreen.touchStart(p0[0], p0[1]); await wait(60);
  geste.pose = await etat(page);
  for (let n = 1; n <= 6; n++) { await page.touchscreen.touchMove(p0[0] + (p1[0] - p0[0]) * n / 6, p0[1] + (p1[1] - p0[1]) * n / 6); await wait(30); }
  geste.pendant = await etat(page);
  await page.screenshot({ path: path.join(out, id + '-pendant-390.png') });
  await page.touchscreen.touchEnd(); await wait(200);
  geste.apres = await etat(page);
  await page.evaluate(() => window.poser(SE.M.findIndex((p) => p.id === 'b10')));
  await wait(150);
  geste.a10 = await etat(page);
  await page.screenshot({ path: path.join(out, id + '-10-390.png') });
  await page.evaluate(() => window.poser(SE.M.findIndex((p) => p.id === 'dryPost|5')));
  await wait(150);
  geste.post5 = await etat(page);
  await page.screenshot({ path: path.join(out, id + '-apres-390.png') });
  if (id === 'e1') {
    await page.goto(pathToFileURL(path.join(ici, id, 'etat.html')).href, { waitUntil: 'networkidle0' }); await wait(200);
    const h = await page.$('[data-houblon]'); const t = await h.touchStart(); await wait(650); await t.end(); await wait(300);
    await page.screenshot({ path: path.join(out, id + '-fiche-390.png') });
    await page.goto(pathToFileURL(path.join(ici, id, 'etat.html')).href, { waitUntil: 'networkidle0' }); await wait(200);
    await page.click('[data-role=legende-bouton]'); await wait(150);
    await page.screenshot({ path: path.join(out, id + '-legende-390.png') });
  }
  geste.erreurs = erreurs;
  fs.writeFileSync(path.join(out, 'geste-' + id + '.json'), JSON.stringify(geste, null, 1));
  console.log(id, '|', geste.avant.moment, '→', geste.pendant.moment, '→', geste.apres.moment, '| erreurs', erreurs.length, erreurs.slice(0, 2).join(' / '));
  await page.close();
}
await browser.close();
