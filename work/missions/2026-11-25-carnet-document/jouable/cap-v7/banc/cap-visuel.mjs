// Captures de visuel/v7.html retouché (390 × 844, DPR 2), dans cap-v7/visuel/ ; Chrome 9222, son onglet.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const puppeteer = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json')('puppeteer-core');
const M = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-25-carnet-document/';
const OUT = M + 'jouable/cap-v7/visuel/'; fs.mkdirSync(OUT, { recursive: true });
const V = 'file:///' + M + 'visuel/v7.html';
const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
const page = await browser.newPage(); const err = [], res = {};
page.on('pageerror', e => err.push(e.message)); page.on('console', m => { if (m.type() === 'error') err.push(m.text()); });
const att = ms => new Promise(r => setTimeout(r, ms));
const mots = () => page.evaluate(() => { const H = innerHeight, w = []; const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = tw.nextNode())) { const el = n.parentElement; if (!n.textContent.trim() || el.closest('h1,script,style')) continue; const r = document.createRange(); r.selectNodeContents(n);
    if (![...r.getClientRects()].some(x => x.width > 0 && x.bottom > 0 && x.top < H)) continue; w.push(...n.textContent.split(/\s+/).filter(x => /[\p{L}\p{N}]/u.test(x))); }
  const i = document.querySelector('input'); if (i && !i.value) w.push(...i.placeholder.split(/\s+/).filter(x => /[\p{L}\p{N}]/u.test(x)));
  return { n: w.length, mots: w.join(' '), debord: document.documentElement.scrollWidth > innerWidth + 1 }; });
try {
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  const go = async (q) => { await page.goto(V + '?' + q, { waitUntil: 'load' }); await att(250); };
  const cap = async (nom) => { res[nom] = await mots(); await page.screenshot({ path: OUT + nom + '.png' }); };
  for (const c of ['assurance', 'bar', 'bouteilles', 'cave', 'chaudiere', 'citra', 'co2', 'ecoulement', 'fete', 'levure', 'pilsner', 'sureau']) { await go('cas=' + c); await cap('v7-' + c); }
  await go('cas=bouteilles'); await page.click('[data-prendre]'); await att(150); await cap('v7-bouteilles-prendre');
  await page.click('[data-commande]'); await att(150); await cap('v7-bouteilles-commande');
  for (const c of ['assurance', 'bouteilles', 'cave', 'chaudiere', 'citra', 'co2']) { await go('cas=' + c + '&ia=0'); await cap('v7-sansia-' + c); }
} finally { fs.writeFileSync(OUT + 'mesures.json', JSON.stringify({ res, err }, null, 1)); await page.close(); browser.disconnect(); }
console.log('erreurs', err.length, err.slice(0, 3)); for (const k in res) console.log(k, res[k].n, res[k].debord ? 'DEBORD' : '');
