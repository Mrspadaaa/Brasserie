// Après suppression : Prévisions, Calendrier (6 sem. aligné), soldes Finances
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
import fs from 'node:fs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
setTimeout(() => { log('F DÉLAI'); lacher(); process.exit(2); }, 200000);
await o.nav('Finances'); await o.tap('Prévisions', 'button,[role=tab]'); await sleep(1500);
await photo(page, 'F1-previsions');
log('F1 prévisions ZZ', await page.evaluate(() => [...document.querySelectorAll('*')].filter((e) => e.childElementCount === 0 && /ZZ TEST/.test(e.textContent)).map((e) => e.textContent.trim().slice(0, 80))));
await o.nav('Calendrier'); await sleep(1200);
const per = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /période, liste/.test(x.getAttribute('aria-label') || '')); return b && b.getAttribute('aria-label'); });
log('F2 période', per);
const auj = await ou(page, 'auj.', 'button'); if (auj) { await toucher(cdp, auj.x, auj.y); await sleep(1200); }
log('F2 cadre', await page.evaluate(() => (document.querySelector('.ent-cadre') || {}).innerText));
log('F2 cal', await page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST|CHF à dépenser/.test(x))));
await photo(page, 'F2-cal');
const s = await o.soldes('F3');
fs.writeFileSync('apres.json', JSON.stringify(s, null, 1));
lacher(); process.exit(0);
