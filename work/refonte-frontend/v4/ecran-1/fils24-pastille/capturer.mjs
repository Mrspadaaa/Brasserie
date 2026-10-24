// Captures du jeu court de la pastille « ~ simulé » (voie jc-pastille) : <id>-repos.png (390 × 844, au repos),
// <id>-toucher.png (un toucher sur la pastille), <id>-suite.png (le pont « Vraies valeurs » touché, quand il existe).
// Mesure aussi la cible de la pastille et ce qui recouvre « Au style ».
// Usage : node capturer.mjs [psa psb psc]
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ici = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(ici, 'captures');
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['psa', 'psb', 'psc'];
const att = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const id of ids) {
  const page = await browser.newPage();
  const err = []; page.on('pageerror', (e) => err.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') err.push(m.text()); });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(ici, id, 'etat.html')).href, { waitUntil: 'networkidle0' }); await att(500);
  await page.screenshot({ path: path.join(out, id + '-repos.png') });
  const p = await page.evaluate(() => { const e = document.querySelector('[data-element~="r6a-simule"]'); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, exp: e.getAttribute('aria-expanded') }; });
  await page.touchscreen.tap(p.x, p.y); await att(450);
  await page.screenshot({ path: path.join(out, id + '-toucher.png') });
  const apres = await page.evaluate(() => { const e = document.querySelector('[data-element~="r6a-simule"]'); const ctl = document.getElementById(e.getAttribute('aria-controls') || '-'); return { exp: e.getAttribute('aria-expanded'), texte: ctl ? ctl.innerText.replace(/\s+/g, ' ').trim() : '' }; });
  let suite = 'pas de pont';
  const v = await page.evaluate(() => { const b = [...document.querySelectorAll('[data-role="pont-valeurs"]')].find((x) => x.checkVisibility()); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  if (v) {
    await page.touchscreen.tap(v.x, v.y); await att(450);
    await page.screenshot({ path: path.join(out, id + '-suite.png') });
    suite = await page.evaluate(() => { const d = [...document.querySelectorAll('[role="dialog"]')].filter((x) => x.checkVisibility()).map((x) => x.querySelector('h2')?.textContent); return 'feuille ouverte : ' + (d.join(', ') || 'aucune'); });
  }
  // Échap referme (au clavier) : rouvrir puis Échap.
  await page.goto(pathToFileURL(path.join(ici, id, 'etat.html')).href, { waitUntil: 'networkidle0' }); await att(400);
  await page.touchscreen.tap(p.x, p.y); await att(300); await page.keyboard.press('Escape'); await att(200);
  const echap = await page.evaluate(() => document.querySelector('[data-element~="r6a-simule"]').getAttribute('aria-expanded'));
  console.log(id, '· pastille', Math.round(p.w) + '×' + Math.round(p.h), 'repos', p.exp, '→ toucher', apres.exp, '· Échap', echap, '·', suite);
  console.log('   ', apres.texte.slice(0, 400));
  if (err.length) console.log('   ERREURS', err.join(' | '));
  await page.close();
}
await browser.close();
