import { ouvrir, sleep, photo, log, toucher, ou } from './outil.mjs';
import { etat } from './lire.mjs';
import { outils, court, periode } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
page.on('framenavigated', (f) => { if (f === page.mainFrame()) log('NAVIGATION', f.url()); });
const { pas, tap, duree, barre } = outils(page, cdp);
const P = (x, y) => ({ x: Math.round(x), y: Math.round(y), id: 1, radiusX: 4, radiusY: 4, force: 1 });
const etiq = () => page.evaluate(() => [...document.querySelectorAll('body *')].filter((x) => x.childElementCount === 0 && /lâcher/.test(x.textContent) && x.getBoundingClientRect().width > 0).map((x) => { const r = x.getBoundingClientRect(); return { t: x.textContent.trim().slice(0, 50), l: Math.round(r.left), r: Math.round(r.right), t0: Math.round(r.top), b: Math.round(r.bottom) }; }));
async function centre() { const b = await barre(); if (!b) return null; await page.evaluate((y) => scrollBy(0, y - 480), b.y); await sleep(500); return barre(); }
async function glisse(nom, { versX, tenir = 600, garder = 0, photosPendant = [] }) {
  const b = await centre(); if (!b) { log(nom, 'barre introuvable', court(await etat(page))); return; }
  log(nom, 'avant', b.a, '|', court(await etat(page)), 'x', Math.round(b.l), Math.round(b.r));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [P(b.x, b.y)] });
  await sleep(tenir); log(nom, 'tenu', court(await etat(page)));
  for (let i = 1; i <= 12; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [P(b.x + (versX - b.x) * i / 12, b.y)] }); await sleep(30); }
  await sleep(300);
  await photo(page, nom + '-pendant', false); log(nom, 'pendant', court(await etat(page)), JSON.stringify(await etiq()), JSON.stringify(await barre()));
  for (const t of photosPendant) { await sleep(t); await photo(page, nom + '-pendant-' + t, true); log(nom, 'pendant+' + t, court(await etat(page)), JSON.stringify(await etiq()), JSON.stringify(await barre())); }
  await sleep(garder);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(1800);
  const b3 = await centre(); await photo(page, nom + '-apres', false);
  log(nom, 'après', b3?.a, '|', court(await etat(page)), 'toast', await page.evaluate(() => [...document.querySelectorAll('[role=status],[role=alert]')].map((e) => e.innerText.trim()).filter(Boolean)));
}
await periode(page, cdp, tap, '27.07.2026', '06.09.2026');
await pas('R7-00-aout', null); log('barre', await barre());
// T29-6 : tenir au bord droit 2,5 s à 6 sem.
await glisse('R7-a-6sem-bord-droit', { versX: 386, photosPendant: [1000, 1200] });
// T29-3 réaliste : 6 mois, barre amenée à droite puis 150 px à gauche, doigt sur l'écran
await duree('6 mois'); await sleep(1200);
let b = await barre(); log('6 mois barre', b, court(await etat(page)));
if (b && b.x < 200) await glisse('R7-b-6mois-droite', { versX: b.x + 120 });
b = await barre(); if (b) await glisse('R7-c-6mois-gauche150', { versX: Math.max(20, b.x - 150) });
// CALP-5 à 6 sem. sur la barre
await duree('6 sem.'); await sleep(1200);
b = await barre(); log('6 sem', b, court(await etat(page)));
if (b) await glisse('R7-d-6sem-droite60', { versX: Math.min(360, b.x + 60) });
lacher();
