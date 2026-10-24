// Captures de la voie dh4b : node capturer.mjs [p4b1 …] [--vers=b20]
// Pour chaque variante : <id>-premier-ecran.png (repos), <id>-pendant.png (le doigt posé sur le rail et glissé
// jusqu'au moment --vers, loupe ouverte), <id>-apres.png (doigt levé), et <id>/geste.json (valeurs avant, pendant,
// après, lues par window.P4ETAT(), plus le pas de la loupe contre celui du rail : L12, ×3 au moins).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import { PASSE4 } from './socle-p4b.mjs';

const args = process.argv.slice(2);
const ids = args.filter((a) => !a.startsWith('--'));
const vers = (args.find((a) => a.startsWith('--vers=')) || '--vers=b20').slice(7);
const cap = path.join(PASSE4, 'captures');
fs.mkdirSync(cap, { recursive: true });
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const id of ids) {
  const pg = await b.newPage();
  await pg.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const erreurs = [];
  pg.on('pageerror', (x) => erreurs.push(String(x)));
  pg.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
  await pg.goto(pathToFileURL(path.join(PASSE4, id, 'etat.html')).href, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 350));
  const etat = () => pg.evaluate(() => window.P4ETAT());
  const g = { avant: await etat() };
  await pg.screenshot({ path: path.join(cap, id + '-premier-ecran.png') });
  const geo = await pg.evaluate((vers) => {
    const r = document.querySelector('.p4r').getBoundingClientRect(), S = window.S, P4 = window.P4;
    const i0 = +document.querySelector('.p4r').getAttribute('aria-valuenow'), i1 = S.idx(vers);
    return { x0: r.left + r.width * P4.x(i0) / 100, x1: r.left + r.width * P4.x(i1) / 100, y: r.top + r.height / 2, pasRail: r.width * (P4.x(1) - P4.x(0)) / 100 };
  }, vers);
  await pg.touchscreen.touchStart(geo.x0, geo.y);
  await new Promise((r) => setTimeout(r, 120));
  const pas = 6;
  for (let k = 1; k <= pas; k++) { await pg.touchscreen.touchMove(geo.x0 + (geo.x1 - geo.x0) * k / pas, geo.y); await new Promise((r) => setTimeout(r, 60)); }
  await new Promise((r) => setTimeout(r, 250));
  g.pendant = await etat();
  const loupe = await pg.evaluate(() => { const l = document.querySelector('.p4r-loupe'); const s = [...document.querySelectorAll('.p4r-loupe > span')]; const vis = !!l && getComputedStyle(l).display !== 'none'; if (!vis && window.P4LOUPE) return Object.assign({ visible: true, figure: true }, window.P4LOUPE()); return { visible: vis, voisins: s.length, pasLoupe: s.length > 1 ? Math.abs(parseFloat(s[1].style.left) - parseFloat(s[0].style.left)) : 0 }; });
  await pg.screenshot({ path: path.join(cap, id + '-pendant.png') });
  await pg.touchscreen.touchEnd();
  await new Promise((r) => setTimeout(r, 250));
  g.apres = await etat();
  await pg.screenshot({ path: path.join(cap, id + '-apres.png') });
  const haut = await pg.evaluate(() => document.documentElement.scrollHeight);
  const larg = await pg.evaluate(() => document.documentElement.scrollWidth);
  g.loupe = { ...loupe, pasRail: +geo.pasRail.toFixed(1), rapport: loupe.pasLoupe ? +(loupe.pasLoupe / geo.pasRail).toFixed(1) : null };
  g.page = { hauteur: haut, largeur: larg, ecrans: +(haut / 844).toFixed(2) };
  g.erreurs = erreurs;
  fs.writeFileSync(path.join(PASSE4, id, 'geste.json'), JSON.stringify(g, null, 1));
  console.log(id + ' · avant ' + g.avant.m + ' ' + g.avant.fl + ' · pendant ' + g.pendant.m + ' ' + g.pendant.fl + ' · loupe ' + (g.loupe.visible ? g.loupe.voisins + ' voisins ×' + g.loupe.rapport : 'ABSENTE') + ' · ' + g.page.ecrans + ' écran(s)' + (larg > 390 ? ' · DÉFILEMENT HORIZONTAL ' + larg : '') + (erreurs.length ? ' · ERREURS ' + erreurs.join(' | ') : ''));
  await pg.close();
}
await b.close();
