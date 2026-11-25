// Captures 390 × 844 (dsf 2) des versions p4b, et mesures : mots visibles au premier écran d'Organisé (hors titre du carnet),
// hauteur de la première info utile sous la barre, lignes de carnets de la Liste. Usage : node cap.mjs p4b-1 [p4b-2 …]
// Chrome de débug (port 9222), onglet propre, page.close() puis browser.disconnect() ; jamais browser.close().
import puppeteer from '../../../../node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const ECRANS = ['liste', 'organise', 'organise-ligne', 'organise-aide', 'achat', 'decider', 'afaire', 'relecture', 'erreur', 'memo'];
const versions = process.argv.slice(2);
const sortieMes = path.join(ICI, 'cap', 'mesures.json');
const mesures = existsSync(sortieMes) ? JSON.parse(readFileSync(sortieMes, 'utf8')) : {};

const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
const page = await browser.newPage();
try {
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  for (const v of versions) {
    mesures[v] = {};
    for (const e of ECRANS) {
      const url = pathToFileURL(path.join(ICI, v + '.html')).href + '?e=' + e;
      await page.goto(url, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(ICI, 'cap', `${v}-${e}.png`) });
      const m = await page.evaluate(() => {
        const H = innerHeight;
        const vis = el => { for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const s = getComputedStyle(n); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; } return true; };
        const mots = [];
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let t; (t = w.nextNode());) {
          const el = t.parentElement;
          if (!el || el.closest('[data-titre],script,style') || !vis(el)) continue;
          const r = document.createRange(); r.selectNodeContents(t);
          const rs = [...r.getClientRects()].filter(b => b.width > 2 && b.height > 2 && b.bottom > 0 && b.top < H);
          if (!rs.length) continue;
          mots.push(...t.textContent.split(/\s+/).filter(x => /[\p{L}\p{N}]/u.test(x)));
        }
        for (const i of document.querySelectorAll('input')) { const b = i.getBoundingClientRect(); if (vis(i) && !i.value && b.top < H && b.bottom > 0) mots.push(...(i.placeholder || '').split(/\s+/).filter(x => /[\p{L}\p{N}]/u.test(x))); }
        const barre = document.querySelector('[data-barre]'), utile = document.querySelector('[data-utile]');
        const utileTop = barre && utile ? Math.round(utile.getBoundingClientRect().top - barre.getBoundingClientRect().bottom) : null;
        /* liste : lignes entières visibles au-dessus du premier élément fixe du bas */
        const fixes = [...document.querySelectorAll('body *')].filter(n => getComputedStyle(n).position === 'fixed' && n.getBoundingClientRect().top > H / 2);
        const bas = fixes.length ? Math.min(...fixes.map(n => n.getBoundingClientRect().top)) : H;
        const lignes = [...document.querySelectorAll('[data-carnet]')].map(n => n.getBoundingClientRect()).filter(b => b.top >= 0 && b.bottom <= bas + 0.5);
        const haut = barre ? barre.getBoundingClientRect().bottom : 0;
        const part = lignes.length ? lignes.reduce((s, b) => s + b.height, 0) / (bas - haut) : 0;
        const deborde = document.documentElement.scrollWidth > innerWidth + 1;
        return { mots: mots.length, texte: mots.join(' '), utileTop, lignes: lignes.length, partLignes: Math.round(part * 100), deborde };
      });
      mesures[v][e] = m;
      console.log(v, e, 'mots', m.mots, 'utile', m.utileTop, m.lignes ? `lignes ${m.lignes} (${m.partLignes} %)` : '', m.deborde ? 'DEBORDE' : '');
    }
  }
} finally {
  await page.close();
  browser.disconnect();
}
writeFileSync(sortieMes, JSON.stringify(mesures, null, 1));
