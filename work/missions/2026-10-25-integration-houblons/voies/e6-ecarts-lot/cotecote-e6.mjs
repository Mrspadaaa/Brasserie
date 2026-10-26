#!/usr/bin/env node
// e6 : pose la capture AVANT (e3, deeb4d23, ETATS OK 138/138) et APRÈS (HEAD, cette voie) côte à côte : paires/<id>.png.
// Usage : node cotecote-e6.mjs <id> [<id>…]   (ids sans extension)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ici = path.dirname(fileURLToPath(import.meta.url));
const avantDir = path.join(ici, '..', 'e3-etats-donnees', 'captures', 'apres-s1t1');
const apresDir = path.join(ici, 'captures');
const sortie = path.join(ici, 'paires');
fs.mkdirSync(sortie, { recursive: true });
const b64 = (f) => (fs.existsSync(f) ? 'data:image/png;base64,' + fs.readFileSync(f).toString('base64') : '');
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const id of process.argv.slice(2)) {
  const a = b64(path.join(avantDir, `${id}-construite.png`));
  const p = b64(path.join(apresDir, `${id}-construite.png`));
  const bloc = (titre, src) => `<div style="margin:0 6px"><div style="font:bold 14px sans-serif;text-align:center;padding:4px">${titre}</div>${src ? `<img src="${src}" style="display:block;border:1px solid #888;width:390px">` : '(absente)'}</div>`;
  const page = await nav.newPage();
  await page.setViewport({ width: 800, height: 900 });
  await page.setContent(`<body style="margin:0;background:#fff;display:flex;justify-content:center">${bloc('AVANT deeb4d23 · ' + id, a)}${bloc('APRÈS HEAD', p)}</body>`);
  await page.screenshot({ path: path.join(sortie, `${id}.png`), fullPage: true });
  await page.close();
}
await nav.close();
console.log(`PAIRES ${process.argv.length - 2}`);
