import { ouvrir, sleep, photo, log, toucher } from './outil.mjs';
import { etat } from './lire.mjs';
import { outils, court } from './commun.mjs';
import fs from 'node:fs';
const { page, cdp, lacher } = await ouvrir();
const { instantane, barre } = outils(page, cdp);
const pt = (x, y) => ({ x: Math.round(x), y: Math.round(y), id: 1, radiusX: 4, radiusY: 4, force: 1 });
const etiquettes = () => page.evaluate(() => [...document.querySelectorAll('body *')].filter((x) => x.childElementCount === 0 && x.textContent.trim() && /lâcher|→|\d+ ?j\b|S\d+ ·|· \d+ \w+\.?$/.test(x.textContent) && x.getBoundingClientRect().width > 0 && getComputedStyle(x).visibility !== 'hidden').map((x) => { const r = x.getBoundingClientRect(); return { t: x.textContent.trim().slice(0, 50), l: Math.round(r.left), r: Math.round(r.right), t0: Math.round(r.top), b: Math.round(r.bottom) }; }).filter((x) => x.t0 > 120 && x.t0 < 800));
const fantome = () => page.evaluate(() => [...document.querySelectorAll('[data-glisse],[data-fantome],[class*=fantome],[class*=glisse],[class*=ghost]')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => { const r = e.getBoundingClientRect(); return { c: e.className?.baseVal ?? e.className, l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom) }; }));
async function glisse(nom, dx, { tenir = 600, n = 12, garder = 0 } = {}) {
  await page.evaluate(() => [...document.querySelectorAll('button,[role=button]')].find((x) => (x.getAttribute('aria-label') || '').startsWith('ZZ TEST — barre'))?.scrollIntoView({ block: 'center' })); await sleep(500);
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
const { pas, tap, duree } = outils(page, cdp);
async function bordDroit(nom, tenirBord) {
  const b = await barre(); log(nom, 'avant', b.a, court(await etat(page)));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt(b.x, b.y)] }); await sleep(600);
  for (let i = 1; i <= 15; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [pt(b.x + (384 - b.x) * i / 15, b.y)] }); await sleep(30); }
  await sleep(500); await photo(page, nom + '-bord-0', true); log(nom, 'au bord', court(await etat(page)));
  await sleep(tenirBord); await photo(page, nom + '-bord-1', false); log(nom, 'tenu au bord', court(await etat(page)), JSON.stringify(await etiquettes()));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(1800);
  await photo(page, nom + '-apres', false); log(nom, 'après', (await barre())?.a, court(await etat(page)));
}
await tap('Calendrier', 'nav button, nav a, button'); await sleep(2500);
await pas('R8-00-6mois', () => duree('6 mois'));
log('barre', await barre());
await glisse('R8-a-6mois-gauche', -150);
const t0 = Date.now(); await tap('Annuler', 'button'); await sleep(1200); await photo(page, 'R8-b-annuler', false); log('Annuler touché après', Date.now() - t0, 'ms ; barre', (await barre())?.a);
await glisse('R8-c-6mois-gauche', -150);
// durée de vie du message
for (let s = 0; s < 12; s++) { const m = await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent.trim() === 'Annuler' && b.getBoundingClientRect().width > 0)); if (!m) { log('message disparu après ~', s, 's'); break; } await sleep(1000); }
await page.evaluate(() => [...document.querySelectorAll('button,[role=button]')].find((x) => (x.getAttribute('aria-label') || '').startsWith('ZZ TEST — barre'))?.scrollIntoView({ block: 'center' })); await sleep(500);
const b = await barre(); await toucher(cdp, b.x, b.y); await sleep(1500);
await photo(page, 'R8-d-feuille', false);
log('feuille', (await page.evaluate(() => (document.querySelector('[role=dialog]') || document.body).innerText)).replace(/\n+/g, ' | ').slice(0, 500));
lacher();
