// Mesure rapide (pas le contrôle officiel) : remplissage, mots, écrans, erreurs, capture à 390.
// Usage : node vite.mjs [p02|p03] [page…]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const DIR = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/refonte-frontend/v4/ecran-1/base';
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), 'shots');
fs.mkdirSync(OUT, { recursive: true });
const ids = ['consolide'];
const pages = process.argv.slice(2).length ? process.argv.slice(2) : ['index', 'biere', 'biere-absolu', 'biere-radar', 'etat-b', 'suggestions-radar', 'comparer', 'comparer-radar', 'cas-k2', 'cas-k3'];
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const id of ids) for (const pg of pages) {
  const page = await browser.newPage();
  const err = [];
  page.on('pageerror', (e) => err.push(String(e.message)));
  page.on('console', (m) => { if (m.type() === 'error') err.push(m.text()); });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(DIR, id, pg + '.html')).href, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 400));
  const m = await page.evaluate(() => {
    const H = innerHeight, W = innerWidth, rows = new Uint8Array(H);
    for (const el of document.querySelectorAll('body *')) { const r = el.getBoundingClientRect(); if (!r.height || r.top >= H || r.bottom <= 0) continue; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue; const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()); const media = /^(svg|img|canvas|input|button)$/i.test(el.tagName); const mark = (cs.backgroundImage !== 'none' || !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor)) && r.width * r.height < 0.15 * W * H; if (!own && !media && !mark) continue; for (let y = Math.max(0, Math.floor(r.top)); y < Math.min(H, Math.ceil(r.bottom)); y++) rows[y] = 1; }
    let c = 0; for (const v of rows) c += v;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let words = 0; const range = document.createRange();
    for (let n = walker.nextNode(); n; n = walker.nextNode()) { const t = n.textContent.trim(); if (!t) continue; const cs = getComputedStyle(n.parentElement); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue; range.selectNodeContents(n); const r = range.getBoundingClientRect(); if (!r.width || !r.height || r.bottom <= 0 || r.top >= H) continue; words += t.split(/\s+/).length; }
    const sizes = new Set(); for (const el of document.querySelectorAll('body *')) { if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue; const r = el.getBoundingClientRect(); if (!r.height || r.top >= H || r.bottom <= 0) continue; const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue; sizes.add(Math.round(parseFloat(cs.fontSize))); }
    return { fill: +(c / H).toFixed(2), words, screens: +(document.documentElement.scrollHeight / H).toFixed(2), over: document.documentElement.scrollWidth > W, tailles: [...sizes].join('/'), fuite: (document.body.innerText.match(/\b(null|undefined|NaN)\b/g) || []).length };
  });
  await page.screenshot({ path: path.join(OUT, id + '-' + pg + '.png'), fullPage: true });
  console.log(id, pg.padEnd(18), 'fill', m.fill, 'mots', m.words, 'écrans', m.screens, m.over ? 'DÉBORDE' : '', 'tailles', m.tailles, m.fuite ? 'FUITE' : '', err.length ? 'ERR ' + err.join(' | ') : '');
  await page.close();
}
await browser.close();
