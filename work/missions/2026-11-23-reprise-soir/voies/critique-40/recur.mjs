// Récurrentes : avancer la période (2 pas), lire chaque occurrence ZZ, revenir exactement au cadre de départ
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
setTimeout(() => { log('R DÉLAI'); lacher(); process.exit(2); }, 240000);
const lire = () => page.evaluate(() => ({ cadre: (document.querySelector('.ent-cadre') || {}).innerText, dep: [...document.querySelectorAll('button')].map((b) => b.getAttribute('aria-label') || '').find((a) => /à dépenser/.test(a)), zz: [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST/.test(x)) }));
await o.nav('Calendrier'); await sleep(1500);
const depart = await lire(); log('R0', depart);
for (let i = 1; i <= 3; i++) { await o.tap('Période suivante', 'button'); await sleep(1600); const l = await lire(); log('R+' + i, l); await photo(page, 'R' + i + '-suivante', i !== 2); }
for (let i = 1; i <= 3; i++) { await o.tap('Période précédente', 'button'); await sleep(1400); }
let fin = await lire(); log('R retour', fin.cadre, fin.dep);
if (fin.cadre !== depart.cadre) { const a = await ou(page, 'auj.', 'button'); if (a) { await toucher(cdp, a.x, a.y); await sleep(1300); } fin = await lire(); log('R après auj.', fin.cadre); }
lacher(); process.exit(0);
