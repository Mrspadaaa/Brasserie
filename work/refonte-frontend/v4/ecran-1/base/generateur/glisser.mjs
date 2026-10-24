// La loupe du rail au doigt (base v4), animations actives comme sur le téléphone du brasseur :
// pour chaque cas, capture avant, pendant (doigt posé sur la graduation visée) et après le lâcher.
// Ébullition, whirlpool, fermentation sur index.html ; lignes réduites qui s'écartent sur cas-k3.html ;
// ébullition longue (le rail monte sur l'en-tête estompé) sur cas-ebu120.html.
// Usage : node glisser.mjs [page ligne graduation nom] ; captures base/captures/v4-geste-*.png
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const BASE = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/refonte-frontend/v4/ecran-1/base';
const DIR = process.env.DIR || path.join(BASE, 'consolide');
const OUT = process.env.OUT || path.join(BASE, 'captures');
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const CAS = process.argv[2] ? [process.argv.slice(2)] : [
  ['index', 0, 'b30', 'ebullition'], ['index', 0, 'wp75', 'whirlpool'], ['index', 0, 'f5', 'fermentation'],
  ['cas-k3', 0, 'b5', 'k3-ecart'], ['cas-ebu120', 0, 'b90', 'ebu120'],
];
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const [pg, n, cible, nom] of CAS) {
  const p = await b.newPage();
  const err = [];
  p.on('pageerror', (e) => err.push(String(e.message)));
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: process.env.REDUIT ? 'reduce' : 'no-preference' }]);
  await p.goto(pathToFileURL(path.join(DIR, pg + '.html')).href, { waitUntil: 'networkidle0' });
  await pause(300);
  const ligne = () => p.evaluate((k) => document.querySelectorAll('[data-role="ligne-houblon"]')[k].innerText.replace(/\s+/g, ' ').slice(0, 60), Number(n));
  const h = await p.evaluate((k) => { const e = document.querySelectorAll('[data-role="glisser-moment"]')[k].getBoundingClientRect(); return { x: e.left + e.width / 2, y: e.top + e.height / 2 }; }, Number(n));
  const avant = await ligne();
  await p.screenshot({ path: path.join(OUT, 'v4-geste-' + nom + '-1-avant.png') });
  const t = await p.touchscreen.touchStart(h.x, h.y);
  let y = h.y + 3;
  await t.move(h.x, y); await pause(220);
  // Le doigt va vers la graduation visée (relue à chaque pas : la loupe peut la déplacer) ; tant
  // qu'elle est cachée, vers l'étape nommée de son segment.
  const seg = /^wp/.test(cible) ? 'wp' : /^f/.test(cible) ? 'dryActive' : /^p/.test(cible) ? 'dryPost' : null;
  for (let i = 0; i < 300; i++) {
    const e = await p.evaluate((c, s) => {
      const g = document.querySelector('[data-etape="' + c + '"]'), r = g.getBoundingClientRect();
      if (Number(getComputedStyle(g).opacity) > 0.15) return { y: r.top + r.height / 2, vu: true };
      const n = s && document.querySelector('[data-etape="' + s + '"]').getBoundingClientRect();
      return { y: n ? n.top + n.height / 2 + 6 : null, vu: false };
    }, cible, seg);
    const d = (e.y ?? y + 6) - y;
    if (e.vu && Math.abs(d) < 1) break;
    y += Math.sign(d) * Math.min(6, Math.abs(d));
    await t.move(h.x, y); await pause(16);
  }
  await pause(250);
  const pendant = await p.evaluate(() => { const g = document.querySelector('[data-glisse]'); return g ? g.querySelector('[data-role="quand"]').textContent + ' · ' + g.querySelector('[data-role="type-ajout"]').textContent : 'rien de levé'; });
  await p.screenshot({ path: path.join(OUT, 'v4-geste-' + nom + '-2-pendant.png') });
  await t.end();
  await pause(500);
  await p.screenshot({ path: path.join(OUT, 'v4-geste-' + nom + '-3-apres.png') });
  console.log(nom.padEnd(13), '| avant :', avant, '| pendant :', pendant, '| après :', await ligne(), '| IBU', await p.$eval('#ibu', (e) => e.textContent), err.length ? '| ERREUR ' + err.join(' ; ') : '');
  await p.close();
}
await b.close();
