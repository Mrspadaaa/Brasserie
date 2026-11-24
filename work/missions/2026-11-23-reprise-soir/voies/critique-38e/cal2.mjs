// Calendrier : reculer d'une période (S47 entière dans le cadre), puis la vue Liste ; chercher les sorties passées ZZ
import { ouvrir, sleep, photo, log, ou, toucher, glisser } from './outil.mjs';
import { outils } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
const zz = () => page.evaluate(() => [...document.querySelectorAll('*')].filter((e) => /ZZ TEST/.test(e.getAttribute('aria-label') || (e.childElementCount === 0 ? e.textContent : '')) && e.getBoundingClientRect().width > 0).map((e) => (e.getAttribute('aria-label') || e.textContent).trim().slice(0, 90)));
await o.nav('Calendrier');
// glisser la poignée de début vers la gauche pour inclure S46–S47
const p = await ou(page, 'Poignée de début', 'button');
log('L poignee', p);
if (p) { await glisser(cdp, p.x, p.y, p.x - 0, p.y, { n: 2 }); }
await o.tap('Période précédente', 'button'); await sleep(1500);
await photo(page, 'L1-precedente'); log('L1 cadre', await page.evaluate(() => (document.querySelector('.ent-cadre') || {}).innerText), await zz());
await o.tap('Période suivante', 'button'); await sleep(1200);
await o.tap('· période, liste, tri et filtre', 'button'); await sleep(800); await o.tap('Liste', 'button'); await sleep(1500);
await photo(page, 'L2-liste'); log('L2 liste', await zz());
for (let i = 3; i <= 5; i++) { await glisser(cdp, 200, 690, 200, 260, { n: 14, pas: 25 }); await sleep(900); await photo(page, 'L' + i + '-liste'); log('L' + i, await zz()); }
lacher();
