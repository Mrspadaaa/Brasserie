// Les trois cas du brasseur, pendant le geste (animations actives) : p01, bulle façon iOS.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const F = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/refonte-frontend/v4/ecran-1/base';
const ID = process.argv[2] || 'p01';
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
// [page, préparation (moment d'un autre houblon), houblon tenu, graduation visée, nom]
const CAS = [
  ['cas-k3', ['Motueka', 'b40'], 'Nugget', 'b15', 'nugget-15-motueka-40'],
  ['index', null, 'Nugget', 'b35', 'nugget-35'],
  ['cas-k3', ['Nugget', 'b35'], 'Motueka', 'b35', 'motueka-35-nugget-35'],
  ['index', null, 'Nugget', 'b10', 'nugget-10'],
  ['index', null, 'Nugget', 'b55', 'nugget-55'],
  // D67 (19.10, au téléphone) : Nugget glissé de 60′ jusqu'au whirlpool.
  ['index', null, 'Nugget', 'wp75', 'nugget-wp75'],
];
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const [pg, prep, tenu, cible, nom] of CAS) {
  const p = await b.newPage();
  const err = [];
  p.on('pageerror', (e) => err.push(String(e.message)));
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  await p.goto(pathToFileURL(path.join(F, ID, pg + '.html')).href, { waitUntil: 'networkidle0' });
  await pause(300);
  if (prep) { await p.evaluate(([n, v]) => { const l = ETAT.lignes.find((x) => x.nom === n); appliquer(l, v); rendre(true); }, prep); await pause(500); }
  const h = await p.evaluate((n) => { const l = [...document.querySelectorAll('[data-role="ligne-houblon"]')].find((x) => x.querySelector('.nom').textContent === n); const e = l.querySelector('[data-role="glisser-moment"]').getBoundingClientRect(); return { x: e.left + e.width / 2, y: e.top + e.height / 2 }; }, tenu);
  const t = await p.touchscreen.touchStart(h.x, h.y);
  let y = h.y + 3;
  await t.move(h.x, y); await pause(220);
  for (let i = 0; i < 300; i++) {
    const e = await p.evaluate((c) => { const g = document.querySelector('[data-etape="' + c + '"]'); const r = g.getBoundingClientRect(); return { y: r.top + r.height / 2, vu: Number(getComputedStyle(g).opacity) > 0.15 }; }, cible);
    const d = e.y - y;
    if (e.vu && Math.abs(d) < 1) break;
    y += Math.sign(d) * Math.min(6, Math.abs(d));
    await t.move(h.x, y); await pause(16);
  }
  await pause(300);
  const lu = await p.evaluate(() => { const g = document.querySelector('[data-glisse]'); const bu = document.querySelector('[data-role="loupe"]'); return (g ? g.innerText.replace(/\s+/g, ' ') : 'rien') + ' | bulle : ' + (bu ? bu.innerText.replace(/\s+/g, ' ') : 'aucune'); });
  await p.screenshot({ path: path.join(F, 'captures', ID + '-' + nom + '-pendant.png') });
  await t.end();
  await pause(500);
  console.log(nom, '|', lu, err.length ? '| ERREUR ' + err.join(' ; ') : '');
  await p.close();
}
await b.close();
