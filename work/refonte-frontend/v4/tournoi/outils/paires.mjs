// Images de paires pour un jury par paires, dans les deux ordres (contre le biais de position).
// Usage : node work/refonte-frontend/v4/tournoi/outils/paires.mjs <dossier> pAA pBB pCC …
// Pour chaque paire {x, y} : deux images, x à gauche puis y à gauche. Chaque côté montre
// l'état A (<id>-390.png) et, s'il existe, l'état B (<id>-b-390.png).
// Sortie : <dossier>/captures/paires/paire-NN.png et cle.json (NN → {gauche, droite}).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

// Option --vues=index,b,biere,comparer-radar (lot 3) : les vues montrées de chaque côté,
// dans cet ordre (index = <id>-390.png, sinon <id>-<vue>-390.png). Par défaut : index, b.
const dir = path.resolve(process.argv[2]);
const ids = process.argv.slice(3).filter((a) => !a.startsWith('--'));
const vues = ((process.argv.find((a) => a.startsWith('--vues=')) || '').slice(7) || 'index,b').split(',');
const caps = path.join(dir, 'captures');
const out = path.join(caps, 'paires');
fs.mkdirSync(out, { recursive: true });
// Toutes les paires dans un ordre, puis toutes dans l'ordre inverse : les deux ordres
// d'une même paire ne se suivent jamais.
const forward = [];
for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) forward.push([ids[i], ids[j]]);
const pairs = [...forward, ...forward.map(([a, b]) => [b, a])];
const side = (id, label) => {
  const imgs = vues.map((v) => (v === 'index' ? id : id + '-' + v) + '-390.png').filter((f) => fs.existsSync(path.join(caps, f)));
  return '<section><h2>' + label + '</h2><div class="row">' + imgs.map((f) => '<img src="' + pathToFileURL(path.join(caps, f)).href + '">').join('') + '</div></section>';
};
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
const imgW = vues.length > 2 ? 300 : 390;
await page.setViewport({ width: Math.max(1640, 2 * vues.length * (imgW + 10) + 60), height: 900, deviceScaleFactor: 1 });
const key = {};
let n = 0;
for (const [g, d] of pairs) {
  n++;
  const nn = String(n).padStart(2, '0');
  key[nn] = { gauche: g, droite: d };
  const html = '<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#222;color:#fff;font:20px sans-serif;display:flex;gap:24px;padding:12px}'
    + 'section{flex:1}h2{margin:4px 0 8px;font-size:22px}.row{display:flex;gap:8px}img{width:' + imgW + 'px;display:block;border:1px solid #555}</style>'
    + side(g, 'Gauche') + side(d, 'Droite');
  const tmp = path.join(out, '_p.html');
  fs.writeFileSync(tmp, html);
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
  await page.screenshot({ path: path.join(out, 'paire-' + nn + '.png'), fullPage: true });
}
fs.unlinkSync(path.join(out, '_p.html'));
fs.writeFileSync(path.join(out, 'cle.json'), JSON.stringify(key, null, 2));
await browser.close();
console.log('PAIRES ' + n + ' images pour ' + ids.length + ' fils de fer');
