// Passe 2 de la série A : node generer.mjs [--captures]. Captures : a1-390.png (page entière), a1-premier-ecran.png, a1-toucher-390.png.
// Une page autonome par concept (aN/etat.html), captures à 390 px dans captures/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { page } from './socle.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const voulus = args.filter((a) => !a.startsWith('--'));
const ids = (voulus.length ? voulus : fs.readdirSync(path.join(ici, 'concepts')).map((f) => f.replace('.mjs', ''))).sort();
for (const id of ids) {
  const c = (await import(pathToFileURL(path.join(ici, 'concepts', id + '.mjs')).href)).default;
  fs.mkdirSync(path.join(ici, id), { recursive: true });
  fs.writeFileSync(path.join(ici, id, 'etat.html'), page(c));
  console.log(id + ' · ' + c.chaleur + ' · ' + c.nom + ' · levure ' + c.levure);
}
if (args.includes('--captures')) {
  const puppeteer = (await import('puppeteer-core')).default;
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const cap = path.join(ici, 'captures');
  const ETATS = { '': '', '-60': '?moment=b60', '-wp': '?moment=wp', '-fiche': '?fiche=1', '-legende': '?legende=1', '-apres': '?moment=dryPost%7C2' };
  const voulusEtats = (args.find((a) => a.startsWith('--etats=')) || '--etats=,-60').slice(8).split(',');
  for (const id of ids) {
    for (const e of voulusEtats) {
      const pg = await b.newPage();
      await pg.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      const erreurs = [];
      pg.on('pageerror', (x) => erreurs.push(String(x)));
      pg.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
      await pg.goto(pathToFileURL(path.join(ici, id, 'etat.html')).href + ETATS[e], { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, 350));
      await pg.screenshot({ path: path.join(cap, id + e + '-390.png') });
      const larg = await pg.evaluate(() => document.documentElement.scrollWidth);
      console.log('capture ' + id + e + '-390.png' + (larg > 390 ? ' · DÉFILEMENT HORIZONTAL ' + larg : '') + (erreurs.length ? ' · ERREURS ' + erreurs.join(' | ') : ''));
      await pg.close();
    }
  }
  await b.close();
}
