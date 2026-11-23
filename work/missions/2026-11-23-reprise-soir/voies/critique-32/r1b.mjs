import { ouvrir, sleep, photo, log, boutons, toucher } from './outil.mjs';
import { etat } from './lire.mjs';
import { outils, court, periode, ecrire } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
page.on('framenavigated', (f) => { if (f === page.mainFrame()) log('NAVIGATION', f.url(), new Date().toISOString().slice(11, 19)); });
const { pas, tap, instantane } = outils(page, cdp);
log('url', page.url(), await page.evaluate(() => [...document.scripts].map((s) => s.src).filter((s) => /index-/.test(s))), court(await etat(page)));
if (!/Calendrier/.test(await page.evaluate(() => document.querySelector('nav [aria-current], nav .actif')?.textContent || ''))) { await tap('Calendrier', 'nav button, nav a'); await sleep(2500); }
ecrire('avant.json', await instantane()); log('avant', (await instantane()).length);
await tap('Période : '); await sleep(800);
await photo(page, 'R1-01-menu-periode');
log('menu période', await boutons(page, '.'));
await tap('Fermer', '[role=dialog] button'); await sleep(800);
await periode(page, cdp, tap, '01.01.2024', '31.12.2027');
const e = await pas('R1-02-plage4ans', null, false); log('R1-02 complet', e);
lacher();
