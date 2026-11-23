// Série c · captures à 390 × 844 (×2) : premier écran, page entière, puis les états qui comptent
// (un autre remplaçant choisi, la fiche à l'appui long, la légende), dans captures/<id>-….png.
// Usage : node …/sbc1/commun/captures.mjs [sbc1 …]   (Chrome ; fichiers temporaires : aucun)
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import { RACINE } from './socle-sbc.mjs';
const OUT = path.join(RACINE, 'captures');
fs.mkdirSync(OUT, { recursive: true });
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['sbc1', 'sbc2', 'sbc3', 'sbc4', 'sbc5', 'sbc6', 'sbc7', 'sbc8'];
const ETATS = { sbc1: ['Nelson Sauvin'], sbc2: ['Magnat'], sbc3: ['Galaxy'], sbc4: ['Sabro'], sbc5: ['Altus'], sbc6: ['Galaxy'], sbc7: ['Magnat'], sbc8: ['Galaxy'] };
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const vue = async (url, f, full = false, avant) => {
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(url, { waitUntil: 'networkidle0' }); await wait(450);
  if (avant) await avant(p);
  await p.screenshot({ path: path.join(OUT, f), fullPage: full });
  await p.close();
};
for (const id of ids) {
  const url = pathToFileURL(path.join(RACINE, id, 'etat.html')).href;
  await vue(url, id + '-premier-ecran.png');
  await vue(url, id + '-page.png', true);
  for (const n of ETATS[id] || []) await vue(url, id + '-choix-' + n.toLowerCase().replace(/\s+/g, '-') + '.png', false, async (p) => {
    const el = await p.$('[data-choix="' + n + '"]'); if (el) { await el.tap(); await wait(350); }
  });
  await vue(url, id + '-fiche.png', false, async (p) => {
    const h = await p.$('[data-houblon]'); const t = await h.touchStart(); await wait(700); await t.end(); await wait(500);
  });
  if (fs.existsSync(path.join(RACINE, id, 'etat.html')) && fs.readFileSync(path.join(RACINE, id, 'etat.html'), 'utf8').includes('data-moment-wp')) await vue(url + '?moment=wp', id + '-whirlpool.png');
  console.log('captures ' + id);
}
await b.close();
