import { ouvrir, sleep, photo, log, boutons, toucher, ou } from './outil.mjs';
import { etat } from './lire.mjs';
import { outils, court } from './commun.mjs';
import fs from 'node:fs';
const { page, cdp, lacher } = await ouvrir();
page.on('framenavigated', (f) => { if (f === page.mainFrame()) log('NAVIGATION', f.url()); });
const { pas, tap, duree, instantane, barre } = outils(page, cdp);
const P = (x, y) => ({ x: Math.round(x), y: Math.round(y), id: 1, radiusX: 4, radiusY: 4, force: 1 });
const auj = await ou(page, 'Revenir à aujourd’hui', 'button'); if (auj) { await toucher(cdp, auj.x, auj.y); await sleep(1200); }
await duree('6 sem.'); await sleep(1200);
const av = JSON.parse(fs.readFileSync('avant.json', 'utf8')); const ap0 = await instantane();
log('vraies avant ZZ', court(await etat(page)), 'diff', av.filter((x) => !ap0.includes(x)), ap0.filter((x) => !av.includes(x)));
await duree('3 mois'); await sleep(1000);
await tap('Ajouter dans Travaux'); await sleep(1200);
await photo(page, 'R6-00-feuille', true);
const nom = await page.evaluate(() => { const e = [...document.querySelectorAll('textarea,input')].filter((x) => x.getBoundingClientRect().width > 0).find((x) => !x.placeholder || /Quoi|titre|nom/i.test(x.placeholder + (x.getAttribute('aria-label') || ''))); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, ph: e.placeholder, a: e.getAttribute('aria-label') }; });
log('champ nom', nom);
await toucher(cdp, nom.x, nom.y); await sleep(300); await page.keyboard.type('ZZ TEST — barre'); await sleep(400);
const aj = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().width > 0).map((b) => b.textContent.trim()).find((t) => /^Ajouter en S\d+/.test(t)));
log('bouton', aj); await tap(aj, 'button'); await sleep(2500);
const etiq = () => page.evaluate(() => [...document.querySelectorAll('body *')].filter((x) => x.childElementCount === 0 && x.textContent.trim() && /lâcher|→|S\d+ ·|J\d+/.test(x.textContent) && x.getBoundingClientRect().width > 0 && getComputedStyle(x).visibility !== 'hidden' && getComputedStyle(x).opacity !== '0').map((x) => { const r = x.getBoundingClientRect(); return { t: x.textContent.trim().slice(0, 50), l: Math.round(r.left), r: Math.round(r.right), t0: Math.round(r.top), b: Math.round(r.bottom) }; }).filter((x) => x.t0 > 200 && x.t0 < 800 && /lâcher|ZZ|→/.test(x.t)));
async function centre() { const b = await barre(); if (!b) return null; await page.evaluate((y) => scrollBy(0, y - 480), b.y); await sleep(500); return barre(); }
async function glisse(nom, dx, { tenir = 600, garder = 0, versX } = {}) {
  const b = await centre(); if (!b) { log(nom, 'barre introuvable'); return; }
  log(nom, 'avant', b.a, '|', court(await etat(page)), 'x', Math.round(b.l), Math.round(b.r));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [P(b.x, b.y)] });
  await sleep(tenir); log(nom, 'tenu', court(await etat(page)));
  const x2 = versX ?? b.x + dx;
  for (let i = 1; i <= 12; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [P(b.x + (x2 - b.x) * i / 12, b.y)] }); await sleep(30); }
  await sleep(300 + garder);
  await photo(page, nom + '-pendant', false);
  log(nom, 'pendant', court(await etat(page))); log(nom, 'étiquettes', await etiq()); log(nom, 'barre pendant', await barre(), 'doigt', x2, b.y);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(1800);
  const b3 = await centre(); await photo(page, nom + '-apres', false);
  log(nom, 'après', b3?.a, '|', court(await etat(page)), 'toast', await page.evaluate(() => [...document.querySelectorAll('[role=status],[role=alert]')].map((e) => e.innerText.trim()).filter(Boolean)));
}
await glisse('R6-a-3mois-droite72', 72);
await duree('6 mois'); await sleep(1000);
await glisse('R6-b-6mois-gauche150', -150);
await duree('6 sem.'); await sleep(1000);
await glisse('R6-c-6sem-bord-droit', 0, { versX: 385, garder: 2500 });
lacher();
