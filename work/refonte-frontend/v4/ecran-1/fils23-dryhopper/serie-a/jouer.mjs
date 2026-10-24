// Joue le geste de chaque concept au doigt (écran tactile simulé, 390 px) et note avant / pendant / après
// dans geste-a.json ; capture l'état « pendant » quand il compte (captures/aN-geste-390.png).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ici = path.dirname(fileURLToPath(import.meta.url));
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const lire = (pg, sel) => pg.evaluate((s) => {
  const t = (q) => { const e = document.querySelector(q); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; };
  const sl = [...document.querySelectorAll('[data-libre] [role=slider], [data-libre][role=slider]')].find((e) => e.getAttribute('aria-valuetext'));
  return { moment: s.mom ? t(s.mom) : sl && sl.getAttribute('aria-valuetext'), floral: t(s.fl), amer: s.am ? t(s.am) : null };
}, sel);
const centre = (pg, q) => pg.$eval(q, (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; });
async function glisser(pg, de, a, pas = 12, pendant) {
  await pg.touchscreen.touchStart(de.x, de.y);
  for (let k = 1; k <= pas; k++) { await pg.touchscreen.touchMove(de.x + (a.x - de.x) * k / pas, de.y + (a.y - de.y) * k / pas); await attendre(16); }
  if (pendant) await pendant();
  await pg.touchscreen.touchEnd(); await attendre(250);
}
const G = {
  a1: { sel: { fl: '#a1-fl', am: '#a1-am' }, async jeu(pg, cap) { const r = await centre(pg, '.a1-rail'), p = await centre(pg, '.a1-pouce'); await glisser(pg, p, { x: r.l + r.w * 0.12, y: p.y }, 14, cap); } },
  a2: { sel: { fl: '#a2-fl', am: '#a2-am' }, async jeu(pg, cap) { const r = await centre(pg, '#a2-piste'), p = await centre(pg, '#a2-bloc'); await glisser(pg, { x: p.x - 10, y: p.y }, { x: r.l + r.w * 0.66, y: p.y }, 12); const q = await centre(pg, '.a2-poi'); await glisser(pg, q, { x: r.l + r.w * 0.97, y: q.y }, 10, cap); } },
  a3: { sel: { mom: '#a3-mom', fl: '#a3-fl', am: '#a3-ibu' }, async jeu(pg, cap) { const p = await centre(pg, '#a3-pa'), c = await centre(pg, '#a3-col'); await glisser(pg, p, { x: p.x, y: c.t + 60 }, 16, cap); } },
  a4: { sel: { mom: '.a4-on .a4-ct', fl: '.a4-on .a4-flv', am: '.a4-on .a4-am' }, async jeu(pg, cap) { const d = await centre(pg, '#a4-deck'); await glisser(pg, { x: d.l + 40, y: d.t + 300 }, { x: d.r - 20, y: d.t + 300 }, 10); await attendre(700); const r = await centre(pg, '.a4-on .a4-roue'); await glisser(pg, r, { x: r.x, y: r.y - 60 }, 8, cap); } },
  a5: { sel: { mom: '#a5-mom', fl: '#a5-fl', am: '#a5-am' }, async jeu(pg, cap) { const t = await centre(pg, '#a5-tenir'); await pg.touchscreen.touchStart(t.x, t.y); await attendre(1900); if (cap) await cap(); await pg.touchscreen.touchEnd(); await attendre(300); } },
  a6: { sel: { mom: '#a6-mom', fl: '#a6-flv', am: '#a6-amv' }, async jeu(pg, cap) { const pf = await centre(pg, '#a6-pf'), h = await centre(pg, '#a6-pf .a6-poi'); await glisser(pg, h, { x: pf.l + pf.w * 0.2, y: h.y }, 12, cap); } },
  a7: { sel: { mom: '#a7-mom', fl: '#a7-fl', am: '#a7-am' }, async jeu(pg, cap) { const s = await centre(pg, '#a7-svg'); await glisser(pg, { x: s.l + s.w * 0.62, y: s.t + 60 }, { x: s.l + s.w * 0.36, y: s.t + 80 }, 12, cap); } },
  a8: { sel: { fl: '#a8-fl', am: '#a8-am' }, async jeu(pg, cap) { const p = await centre(pg, '.a8-pa'), w = await centre(pg, '.a8-t[data-po="1"]'); await glisser(pg, p, w, 14, cap); } },
};
const sortie = {};
for (const [id, g] of Object.entries(G)) {
  const pg = await b.newPage();
  await pg.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const err = []; pg.on('pageerror', (e) => err.push(String(e)));
  await pg.goto(pathToFileURL(path.join(ici, id, 'etat.html')).href, { waitUntil: 'networkidle0' }); await attendre(300);
  const avant = await lire(pg, g.sel); let pendant = null;
  await g.jeu(pg, async () => { pendant = await lire(pg, g.sel); await pg.screenshot({ path: path.join(ici, 'captures', id + '-geste-390.png') }); });
  const apres = await lire(pg, g.sel);
  sortie[id] = { avant, pendant, apres, bouge: JSON.stringify(avant) !== JSON.stringify(apres), erreurs: err };
  console.log(id + ' · ' + (sortie[id].bouge ? 'BOUGE' : 'IMMOBILE') + ' · ' + JSON.stringify(avant) + ' → ' + JSON.stringify(apres) + (err.length ? ' · ERREURS ' + err.join(' | ') : ''));
  await pg.close();
}
await b.close();
fs.writeFileSync(path.join(ici, 'geste-a.json'), JSON.stringify(sortie, null, 1));
const immobiles = Object.keys(sortie).filter((k) => !sortie[k].bouge);
console.log(immobiles.length ? 'GESTES ECHEC ' + immobiles.join(', ') : 'GESTES OK 8/8');
