// Planche du coup d'œil du brasseur : 3 fils de fer, état A et état B, avec un titre court.
// Usage : node work/refonte-frontend/v4/ecran-1/fils/outils-planche-brasseur.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const dir = path.resolve('work/refonte-frontend/v4/ecran-1/fils');
const caps = path.join(dir, 'captures');
const choix = [
  ['p10', '1 · Une bande commune', 'Toutes les familles sur la même bande du style : on voit d\'un coup qui en sort.'],
  ['p04', '2 · Des tuiles', 'Une tuile par famille sous un bandeau-réponse.'],
  ['p08', '3 · Un dialogue', 'Le style répond, tu demandes par puces, le moteur répond par ses voies.'],
];
const col = ([id, titre, ligne]) => '<section><h2>' + titre + '</h2><p>' + ligne + '</p><div class="row">'
  + '<figure><img src="' + pathToFileURL(path.join(caps, id + '-390.png')).href + '"><figcaption>À l\'ouverture</figcaption></figure>'
  + '<figure><img src="' + pathToFileURL(path.join(caps, id + '-b-390.png')).href + '"><figcaption>Après « + floral, − résineux »</figcaption></figure>'
  + '</div></section>';
const html = '<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#ece9e4;color:#1d1b19;font:18px system-ui,sans-serif;padding:24px}'
  + 'h1{font-size:28px;margin:0 0 4px}.sub{margin:0 0 20px;color:#555}.grid{display:flex;gap:28px}section{flex:1}h2{font-size:22px;margin:0}'
  + 'section p{margin:4px 0 10px;color:#444;min-height:48px}.row{display:flex;gap:8px}figure{margin:0}img{width:300px;display:block;border-radius:10px;box-shadow:0 1px 4px #0003}'
  + 'figcaption{font-size:14px;color:#555;padding-top:6px}</style>'
  + '<h1>Écran 1 : l\'arôme de ta recette, lu au style</h1><p class="sub">Fils de fer gris : structure seulement, pas de couleur ni de finition. Lequel garder ?</p>'
  + '<div class="grid">' + choix.map(col).join('') + '</div>';
const tmp = path.join(caps, '_brasseur.html');
fs.writeFileSync(tmp, html);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 2000, height: 900, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
const out = path.join(caps, 'planche-brasseur.png');
await page.screenshot({ path: out, fullPage: true });
await browser.close();
fs.unlinkSync(tmp);
console.log('PLANCHE BRASSEUR ' + out);
