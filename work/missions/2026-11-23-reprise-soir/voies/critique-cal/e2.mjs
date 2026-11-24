import { ouvrir, sleep, photo, log, taper, boutons, toucher, ou } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
await taper(page, cdp, '6 sem. · période', 'button'); await sleep(900);
await photo(page, 'E2-menu-duree');
log('menu durée', await boutons(page));
await page.keyboard.press('Escape'); await sleep(600);
let r = await ou(page, 'Fermer', 'button'); if (await page.evaluate(() => !!document.querySelector('[role=dialog]'))) { if (r) await toucher(cdp, r.x, r.y); await sleep(600); }
await taper(page, cdp, 'Période : ', 'button'); await sleep(900);
await photo(page, 'E3-menu-periode');
log('menu période', await boutons(page));
lacher();
