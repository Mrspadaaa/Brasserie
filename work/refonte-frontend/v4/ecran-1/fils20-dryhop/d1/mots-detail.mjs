// Aide d'auteur : la liste des textes comptés au premier écran (même règle que mots-premier-ecran.mjs),
// pour voir quoi retirer. Usage : node mots-detail.mjs <page.html>
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await page.goto(pathToFileURL(path.resolve(process.argv[2])).href, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 300));
const r = await page.evaluate(() => {
  const H = innerHeight, out = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), range = document.createRange();
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const t = n.textContent.trim(); if (!t) continue;
    const cs = getComputedStyle(n.parentElement);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
    range.selectNodeContents(n); const b = range.getBoundingClientRect();
    if (b.width === 0 || b.height === 0 || b.bottom <= 0 || b.top >= H) continue;
    out.push([Math.round(b.top), t.split(/\s+/).filter(Boolean).length, t]);
  }
  return out;
});
await browser.close();
let s = 0; for (const [y, k, t] of r) { s += k; console.log(String(y).padStart(4), k, t); }
console.log('TOTAL', s);
