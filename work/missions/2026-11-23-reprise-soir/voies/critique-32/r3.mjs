import { ouvrir, sleep, photo, log, boutons, toucher, ou, glisser } from './outil.mjs';
import { etat } from './lire.mjs';
import { outils, court, periode } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
page.on('framenavigated', (f) => { if (f === page.mainFrame()) log('NAVIGATION', f.url()); });
const { pas, tap, duree } = outils(page, cdp);
const per = async () => (await etat(page)).periode;
const aujEl = () => page.evaluate(() => { const e = [...document.querySelectorAll('*')].filter((x) => /auj\./.test(x.textContent) && x.childElementCount <= 1 && x.getBoundingClientRect().width > 0).pop(); if (!e) return null; const r = e.getBoundingClientRect(); const b = e.closest('button,[role=button]'); return { t: e.textContent.trim(), bouton: !!b, aria: b?.getAttribute('aria-label'), x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
// T29-11 : ‹ auj. depuis un cadre en décembre
await periode(page, cdp, tap, '14.12.2026', '27.12.2026');
await pas('R5-00-dec', null); log('période', await per());
let a = await aujEl(); log('auj', a);
if (a) { await pas('R5-01-touche-auj', () => toucher(cdp, a.x, a.y), false); log('période', await per()); }
// durée choisie depuis un cadre hors d'aujourd'hui : reste-t-elle sur le cadre ?
await periode(page, cdp, tap, '01.03.2027', '31.03.2027');
await pas('R5-02-mars', null); log('période', await per());
await pas('R5-03-mars-3mois', () => duree('3 mois'), false); log('période', await per());
// T29-9 / T29-10 : cadre de 31 mois puis 4 ans (prévu avec années ?)
await periode(page, cdp, tap, 'Tout');
await pas('R5-04-tout', null);
const p = await ou(page, 'Poignée de fin', 'button,[role=slider]');
await pas('R5-05-fin-droite', () => glisser(cdp, p.x, p.y, p.x + 160, p.y, { tenir: 150 }), false);
let q = await ou(page, 'Poignée de fin', 'button,[role=slider]');
await pas('R5-06-fin-droite2', () => glisser(cdp, q.x, q.y, q.x + 160, q.y, { tenir: 150 }), false);
q = await ou(page, 'Poignée de fin', 'button,[role=slider]');
await pas('R5-07-fin-droite3', () => glisser(cdp, q.x, q.y, q.x + 160, q.y, { tenir: 150 }), false);
log('pastilles', await page.evaluate(() => document.body.innerText.split('\n').filter((l) => /prévu|vide|pas confirmé|chose/.test(l)).slice(0, 20)));
// défilement de la bande (cadre glissé) au bord ? : glisser le cadre sur la courbe
const c = await page.evaluate(() => { const e = document.querySelector('.ent-cadre'); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
await pas('R5-08-cadre-glisse', () => glisser(cdp, c.x, c.y, c.x - 80, c.y, { tenir: 150 }), false);
await periode(page, cdp, tap, 'Tout');
await pas('R5-09-tout', () => duree('6 sem.'));
lacher();
