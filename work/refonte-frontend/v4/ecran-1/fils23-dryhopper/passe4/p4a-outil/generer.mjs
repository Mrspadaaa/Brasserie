// Passe 4 de Dryhopper, voie dh4a : node generer.mjs [p4a1 …] [--captures]
// Une page autonome par variante (../<id>/etat.html). Avec --captures : premier écran, pendant le geste (doigt posé,
// glissé jusqu'à 20′), après le geste (doigt levé), à 390 × 844, dans ../captures/<id>-*.png, et ../<id>/geste.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { page } from './socle.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const passe = path.resolve(ici, '..');
const args = process.argv.slice(2);
const voulus = args.filter((a) => !a.startsWith('--'));
const ids = (voulus.length ? voulus : fs.readdirSync(path.join(ici, 'concepts')).map((f) => f.replace('.mjs', ''))).sort();
for (const id of ids) {
  const c = (await import(pathToFileURL(path.join(ici, 'concepts', id + '.mjs')).href)).default;
  fs.mkdirSync(path.join(passe, id), { recursive: true });
  fs.writeFileSync(path.join(passe, id, 'etat.html'), page(c));
  console.log(id + ' · ' + c.chaleur + ' · ' + c.nom);
}
if (args.includes('--captures')) {
  const puppeteer = (await import('puppeteer-core')).default;
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const att = (ms) => new Promise((r) => setTimeout(r, ms));
  for (const id of ids) {
    const pg = await b.newPage();
    const erreurs = [];
    pg.on('pageerror', (x) => erreurs.push(String(x)));
    pg.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
    await pg.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await pg.goto(pathToFileURL(path.join(passe, id, 'etat.html')).href, { waitUntil: 'networkidle0' });
    await att(350);
    const cap = (n) => path.join(passe, 'captures', id + '-' + n + '.png');
    await pg.screenshot({ path: cap('premier-ecran') });
    const lire = () => pg.evaluate(() => (window.LIRE ? window.LIRE() : {}));
    const avant = await lire();
    // Le geste : du moment de départ (★) jusqu'à 20′, doigt posé, en 14 pas.
    const g = await pg.evaluate(() => {
      const r = document.querySelector('.s-rl').getBoundingClientRect(), pc = document.querySelector('.s-rl-pc').getBoundingClientRect();
      const v = document.querySelector('.s-rg').classList.contains('s-rg-v'), k = window.S.idx('b20'), t = window.S.x(k) / 100;
      return v ? { v, x0: r.left + r.width / 2, y0: pc.top + pc.height / 2, x1: r.left + r.width / 2, y1: r.top + r.height * t } : { v, x0: pc.left + pc.width / 2, y0: r.top + r.height / 2, x1: r.left + r.width * t, y1: r.top + r.height / 2 };
    });
    await pg.touchscreen.touchStart(g.x0, g.y0);
    for (let k = 1; k <= 14; k++) { await pg.touchscreen.touchMove(g.x0 + (g.x1 - g.x0) * k / 14, g.y0 + (g.y1 - g.y0) * k / 14); await att(16); }
    await att(120);
    const pendant = await lire();
    const loupe = await pg.evaluate(() => {
      const v = document.querySelector('.s-rg').classList.contains('s-rg-v'), s = [...document.querySelectorAll('.s-lp > span')];
      const pos = (e) => { const q = e.getBoundingClientRect(); return v ? q.top + q.height / 2 : q.left + q.width / 2; };
      const c = [...document.querySelectorAll('.s-rl-cran')].map(pos).sort((a, b) => a - b);
      const pl = s.length > 1 ? Math.abs(pos(s[1]) - pos(s[0])) : null, pr = c.length > 1 ? +(c[1] - c[0]).toFixed(1) : null;
      return { voisins: s.length, pasLoupe: pl && +pl.toFixed(1), pasRail: pr, rapport: pl && pr ? +(pl / pr).toFixed(1) : null };
    });
    await pg.screenshot({ path: cap('pendant') });
    await pg.touchscreen.touchEnd(); await att(300);
    const apres = await lire();
    await pg.screenshot({ path: cap('apres') });
    const larg = await pg.evaluate(() => document.documentElement.scrollWidth);
    const geste = { avant, pendant, apres, loupe, largeur: larg, erreurs };
    fs.writeFileSync(path.join(passe, id, 'geste.json'), JSON.stringify(geste, null, 1) + '\n');
    console.log('captures ' + id + ' · loupe ×' + loupe.rapport + ' (' + loupe.voisins + ' voisins)' + (larg > 390 ? ' · DÉFILEMENT ' + larg : '') + (erreurs.length ? ' · ERREURS ' + erreurs.join(' | ') : ''));
    if (args.includes('--fiche')) {
      await pg.goto(pathToFileURL(path.join(passe, id, 'etat.html')).href + '?fiche=1', { waitUntil: 'networkidle0' }); await att(300);
      await pg.screenshot({ path: cap('fiche') });
    }
    await pg.close();
  }
  await b.close();
}
