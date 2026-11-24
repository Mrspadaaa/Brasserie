import { ouvrir, sleep, photo, log, taper } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
await taper(page, cdp, 'Annuler'); await sleep(1200);
await photo(page, '06-zz');
log('champs', await page.evaluate(() => [...document.querySelectorAll('textarea,input')].map((e) => e.placeholder)));
lacher();
