import { ouvrir, sleep, photo, log } from './outil.mjs';
import { etat } from './lire.mjs';
import { outils, court } from './commun.mjs';
import fs from 'node:fs';
const { page, cdp, lacher } = await ouvrir();
const { instantane, barre } = outils(page, cdp);
const pt = (x, y) => ({ x: Math.round(x), y: Math.round(y), id: 1, radiusX: 4, radiusY: 4, force: 1 });
const etiquettes = () => page.evaluate(() => [...document.querySelectorAll('body *')].filter((x) => x.childElementCount === 0 && x.textContent.trim() && /lâcher|→|\d+ ?j\b|S\d+ ·|· \d+ \w+\.?$/.test(x.textContent) && x.getBoundingClientRect().width > 0 && getComputedStyle(x).visibility !== 'hidden').map((x) => { const r = x.getBoundingClientRect(); return { t: x.textContent.trim().slice(0, 50), l: Math.round(r.left), r: Math.round(r.right), t0: Math.round(r.top), b: Math.round(r.bottom) }; }).filter((x) => x.t0 > 120 && x.t0 < 800));
const fantome = () => page.evaluate(() => [...document.querySelectorAll('[data-glisse],[data-fantome],[class*=fantome],[class*=glisse],[class*=ghost]')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => { const r = e.getBoundingClientRect(); return { c: e.className?.baseVal ?? e.className, l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom) }; }));
async function glisse(nom, dx, { tenir = 600, n = 12, garder = 0 } = {}) {
  const b = await barre(); const e0 = await etat(page);
  log(nom, 'avant', b.a, '|', court(e0));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt(b.x, b.y)] });
  await sleep(tenir);
  const e1 = await etat(page); log(nom, 'tenu', court(e1));
  for (let i = 1; i <= n; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [pt(b.x + dx * i / n, b.y)] }); await sleep(30); }
  await sleep(300 + garder);
  await photo(page, nom + '-pendant', false);
  const e2 = await etat(page); log(nom, 'pendant', court(e2));
  log(nom, 'étiquettes', await etiquettes()); log(nom, 'fantôme', await fantome()); log(nom, 'barre pendant', await barre());
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(1800);
  await photo(page, nom + '-apres', false);
  const e3 = await etat(page); log(nom, 'après', (await barre())?.a, '|', court(e3));
}
await glisse('R5-a-droite72', 72);
await glisse('R5-b-gauche72', -72);
const av = JSON.parse(fs.readFileSync('avant.json', 'utf8')); const ap = await instantane();
log('vraies données : avant', av.length, 'après', ap.length, 'différences', av.filter((x) => !ap.includes(x)), ap.filter((x) => !av.includes(x)));
lacher();
