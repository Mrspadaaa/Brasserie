import { ouvrir, sleep, photo, log, boutons, glisser } from './outil.mjs';
import { etat } from './lire.mjs';
import { outils, court, periode, ecrire } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const { pas, tap, instantane } = outils(page, cdp);
ecrire('avant.json', await instantane());
// menu durées
await tap('· période, liste, tri et filtre'); await sleep(800);
await photo(page, 'R1-00-menu-durees');
log('menu durées', await boutons(page, 'sem|mois|an|Tout|Jour|Semaine|Mois'));
await page.keyboard.press('Escape'); await sleep(600);
if (await page.evaluate(() => !!document.querySelector('[role=dialog]'))) await tap('Fermer', '[role=dialog] button');
// période menu
await tap('Période : '); await sleep(800);
await photo(page, 'R1-01-menu-periode');
log('menu période', await boutons(page, '.'));
await tap('Fermer', '[role=dialog] button'); await sleep(800);
// plage 4 ans
await periode(page, cdp, tap, '01.01.2024', '31.12.2027');
const e = await pas('R1-02-plage4ans', null, false); log('R1-02 complet', e);
lacher();
