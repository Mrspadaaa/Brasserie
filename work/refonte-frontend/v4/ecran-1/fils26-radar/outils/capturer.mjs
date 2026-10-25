#!/usr/bin/env node
// Lot 26 (le radar seul) : capture chaque variante aux trois états, en 390 de large, facteur 2, recadrée sur le radar et sa légende.
// Usage : node capturer.mjs <id…>   (rd00 = le socle, socle/rd00/etat.html ; les autres : fils26-radar/<id>/etat.html)
// Écrit fils26-radar/captures/<id>.png (?etat=apres), <id>-60.png (?etat=60), <id>-nelson.png (?etat=nelson).
// Le cadre est l'élément [data-cadre] de la page (sinon <main>, sinon le corps) : y mettre le radar et sa légende, rien d'autre.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const LOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RACINE = path.resolve(LOT, '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ids = process.argv.slice(2);
if (!ids.length) { console.log('Usage : node capturer.mjs <id…>'); process.exit(2); }
const ETATS = [['apres', ''], ['60', '-60'], ['nelson', '-nelson']];
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(path.join(LOT, 'captures'), { recursive: true });
const navigateur = await puppeteer.launch({ executablePath: CHROME, headless: true });
let manques = 0;
for (const id of ids) {
  const page = path.join(LOT, id === 'rd00' ? 'socle/rd00' : id, 'etat.html');
  if (!fs.existsSync(page)) { console.log(`${id} : page absente (${path.relative(RACINE, page)})`); manques += 1; continue; }
  for (const [etat, suffixe] of ETATS) {
    const p = await navigateur.newPage();
    try {
      await p.setViewport({ width: 390, height: 1400, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      await p.goto(pathToFileURL(page).href + '?etat=' + etat, { waitUntil: 'networkidle0', timeout: 30000 });
      await attendre(400);
      const r = await p.evaluate(() => {
        const e = document.querySelector('[data-cadre]') ?? document.querySelector('main') ?? document.body;
        const b = e.getBoundingClientRect();
        return { x: b.left + scrollX, y: b.top + scrollY, w: b.width, h: b.height };
      });
      const marge = 8;
      const x = Math.max(0, r.x - marge), y = Math.max(0, r.y - marge);
      const sortie = path.join(LOT, 'captures', `${id}${suffixe}.png`);
      await p.screenshot({ path: sortie, clip: { x, y, width: Math.min(390 - x, r.w + 2 * marge), height: r.h + 2 * marge } });
      console.log(`${id}${suffixe}.png`);
    } finally { await p.close(); }
  }
}
await navigateur.close();
process.exit(manques ? 1 : 0);
