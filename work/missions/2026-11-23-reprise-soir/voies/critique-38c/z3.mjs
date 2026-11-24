import { ouvrir, sleep, photo, log, boutons, toucher, ou } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
const k = await ou(page, 'Confirmer le retrait', 'button'); log('k', k);
if (k) { await toucher(cdp, k.x, k.y); await sleep(2500); }
await photo(page, 'Z3-00-apres', true);
log('reste ZZ apport', await page.evaluate(() => (document.body.innerText.match(/ZZ TEST — apport[^\n]*/g) || [])));
lacher();
