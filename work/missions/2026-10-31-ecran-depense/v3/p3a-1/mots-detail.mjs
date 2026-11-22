#!/usr/bin/env node
// Aide de conception (p3a) : liste les mots visibles au premier écran (390 × 844), bloc par bloc, pour savoir où couper.
// Ne remplace pas mots-premier-ecran.mjs (le compte qui fait foi). Usage : node .../p3a-1/mots-detail.mjs <id> [etat]
import path from 'node:path';
import { createRequire } from 'node:module';
const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const id = process.argv[2] || 'p3a-1';
const etat = process.argv[3] || '';
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage();
await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await p.goto('file:///' + path.join(import.meta.dirname, '..', id, 'etat.html').replace(/\\/g, '/') + (etat ? '?etat=' + etat : ''));
await new Promise((r) => setTimeout(r, 600));
const lignes = await p.evaluate(() => {
  const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n; while ((n = w.nextNode())) {
    const t = n.textContent.trim(); if (!t) continue;
    const r = document.createRange(); r.selectNodeContents(n); const b = r.getBoundingClientRect();
    if (b.width < 2 || b.bottom <= 0 || b.top >= innerHeight) continue;
    const cs = getComputedStyle(n.parentElement); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    out.push([Math.round(b.top), t.split(/\s+/).length, t]);
  }
  return out;
});
let tot = 0; for (const [y, k, t] of lignes) { tot += k; console.log(String(y).padStart(4), String(k).padStart(2), t.slice(0, 60)); }
console.log('TOTAL', tot);
await nav.close();
