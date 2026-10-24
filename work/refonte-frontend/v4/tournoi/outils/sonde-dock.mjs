// Sonde du Dock de la base : pour Nugget tenu à 55′…5′ (index) et Motueka à 35′ (cas-k3), l'écart
// D61 (place sur la descente − place attendue), la tranche de 5′ sous le doigt, la médiane au loin,
// et les minutes écrites. Usage : node sonde-dock.mjs [dossier-pages]
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const DIR = process.argv[2] || 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/refonte-frontend/v4/ecran-1/base/consolide';
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const lignes = [];
for (const [pg, tenu, prep] of [['index', 'Nugget', null], ['cas-k3', 'Motueka', ['Nugget', 'b35']]]) {
  for (const t of pg === 'index' ? [55, 45, 35, 25, 15, 10, 5] : [50, 35, 20, 10]) {
    const p = await b.newPage();
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
    await p.goto(pathToFileURL(path.join(DIR, pg + '.html')).href, { waitUntil: 'networkidle0' });
    await pause(250);
    if (prep) { await p.evaluate(([n, v]) => { const l = ETAT.lignes.find((x) => x.nom === n); appliquer(l, v); rendre(true); }, prep); await pause(400); }
    const h = await p.evaluate((n) => { const l = [...document.querySelectorAll('[data-role="ligne-houblon"]')].find((x) => x.querySelector('.nom').textContent === n); const e = l.querySelector('[data-role="glisser-moment"]').getBoundingClientRect(); return { x: e.left + e.width / 2, y: e.top + e.height / 2 }; }, tenu);
    const tc = await p.touchscreen.touchStart(h.x, h.y);
    let y = h.y + 3; await tc.move(h.x, y); await pause(220);
    const cible = 'b' + t;
    for (let i = 0; i < 300; i++) {
      const e = await p.evaluate((c) => { const g = document.querySelector('[data-etape="' + c + '"]'); const r = g.getBoundingClientRect(); return { y: r.top + r.height / 2, vu: Number(getComputedStyle(g).opacity) > 0.15 }; }, cible);
      const d = e.y - y; if (e.vu && Math.abs(d) < 1) break;
      y += Math.sign(d) * Math.min(6, Math.abs(d)); await tc.move(h.x, y); await pause(16);
    }
    await pause(250);
    const m = await p.evaluate((t) => {
      const yc = (e) => { const r = e.getBoundingClientRect(); return r.top + r.height / 2; };
      const g = (v) => document.querySelector('[data-etape="b' + v + '"]');
      const y60 = yc(g(60)), y0 = yc(g(0));
      const ys = []; for (let v = 60; v >= 0; v -= 5) ys.push(yc(g(v)));
      const pas = ys.slice(1).map((y, i) => y - ys[i]);
      const k = (60 - t) / 5;
      const pres = Math.max(pas[k - 1] ?? 0, pas[k] ?? 0);
      const loin = [...pas].sort((a, b) => a - b)[Math.floor(pas.length / 2)];
      const ecrits = [...document.querySelectorAll('.grad.ecrit')].map((e) => e.dataset.etape.slice(1) + '′');
      const tenu = document.querySelector('[data-glisse] [data-role="glisser-moment"]') || document.querySelector('.leve [data-role="glisser-moment"]');
      const f = tenu ? (yc(tenu) - y60) / (y0 - y60) : null;
      return { L: Math.round(y0 - y60), pres: Math.round(pres), loin: Math.round(loin), d61: f === null ? null : Math.round(100 * (f - (60 - t) / 60)), ecrits: ecrits.join(' ') };
    }, t);
    lignes.push(`${pg.padEnd(7)} ${tenu.padEnd(8)} ${String(t).padStart(2)}′ | descente ${m.L} px | 5′ sous le doigt ${m.pres} px, au loin ${m.loin} | D61 ${m.d61} % | écrit : ${m.ecrits}`);
    await tc.end(); await p.close();
  }
}
await b.close();
console.log(lignes.join('\n'));
