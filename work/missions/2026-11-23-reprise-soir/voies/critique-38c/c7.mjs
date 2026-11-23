import { ouvrir, sleep, photo, log, boutons, toucher, ou, glisser } from './outil.mjs';
import { etat } from './lire.mjs';
import { outils, court } from './commun.mjs';
import fs from 'node:fs';
const { page, cdp, lacher } = await ouvrir();
const { tap, duree, instantane, barre } = outils(page, cdp);
fs.writeFileSync('avant.json', JSON.stringify(await instantane(), null, 1));
log('vraies avant', (await instantane()).length);
// 14 mois : An puis poignée de début −15
await page.evaluate(() => scrollTo(0, 0)); await duree('An'); await sleep(1000);
const p = await ou(page, 'Poignée de début'); await glisser(cdp, p.x, p.y, p.x - 15, p.y, { tenir: 80, n: 8 }); await sleep(1300);
await page.evaluate(() => scrollTo(0, 0)); await photo(page, 'C7-01-14mois', false); log('14', court(await etat(page)));
const p2 = await ou(page, 'Poignée de début'); await glisser(cdp, p2.x, p2.y, p2.x - 15, p2.y, { tenir: 80, n: 8 }); await sleep(1300);
await photo(page, 'C7-02-17mois', false); log('17', court(await etat(page)));
// barre ZZ
await duree('6 sem.'); await sleep(1200);
const auj = await ou(page, 'Revenir à aujourd’hui', 'button'); if (auj) { await toucher(cdp, auj.x, auj.y); await sleep(1200); }
await tap('Ajouter dans Travaux'); await sleep(1200); await photo(page, 'C7-03-feuille', true);
const nom = await page.evaluate(() => { const e = [...document.querySelectorAll('textarea,input')].filter((x) => x.getBoundingClientRect().width > 0).find((x) => !x.placeholder || /Quoi|titre|nom/i.test(x.placeholder + (x.getAttribute('aria-label') || ''))); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
await toucher(cdp, nom.x, nom.y); await sleep(300); await page.keyboard.type('ZZ TEST — barre'); await sleep(400);
const aj = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().width > 0).map((b) => b.textContent.trim()).find((t) => /^Ajouter en S\d+/.test(t)));
log('bouton', aj); await tap(aj, 'button'); await sleep(2500);
const P = (x, y) => ({ x: Math.round(x), y: Math.round(y), id: 1, radiusX: 4, radiusY: 4, force: 1 });
async function centre() { const b = await barre(); if (!b) return null; await page.evaluate((y) => scrollBy(0, y - 480), b.y); await sleep(500); return barre(); }
async function glisse(nom, versX, garder) {
  const b = await centre(); if (!b) { log(nom, 'barre introuvable'); return; }
  log(nom, 'avant', b.a, '|', court(await etat(page)));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [P(b.x, b.y)] }); await sleep(600);
  for (let i = 1; i <= 12; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [P(b.x + (versX - b.x) * i / 12, b.y)] }); await sleep(30); }
  await sleep(700); await photo(page, nom + '-debut', false); log(nom, 'début', court(await etat(page)), await barre());
  await sleep(garder); await photo(page, nom + '-pendant', false); log(nom, 'pendant', court(await etat(page)), await barre(), 'doigt', versX, b.y);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(1800);
  const b3 = await barre(); await photo(page, nom + '-apres', false);
  log(nom, 'après', b3?.a, b3 && [Math.round(b3.l), Math.round(b3.r), Math.round(b3.t)], '|', court(await etat(page)), 'toast', await page.evaluate(() => [...document.querySelectorAll('[role=status],[role=alert]')].map((e) => e.innerText.trim()).filter(Boolean)));
}
await glisse('C7-10-bord-droit', 385, 2000);
await duree('6 sem.'); await sleep(1000); { const a = await ou(page, 'Revenir à aujourd’hui', 'button'); if (a) { await toucher(cdp, a.x, a.y); await sleep(1200); } }
await glisse('C7-20-bord-gauche', 5, 2000);
lacher();
