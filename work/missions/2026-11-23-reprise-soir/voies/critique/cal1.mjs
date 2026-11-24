import { ouvrir, sleep, photo, log, taper } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
await taper(page, cdp, 'Ajouter dans Travaux', 'button'); await sleep(1500);
await photo(page, 'C1-ajout');
log('champs', await page.evaluate(() => [...document.querySelectorAll('textarea,input')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => e.type + ':' + (e.placeholder || e.getAttribute('aria-label')))));
const tx = (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | '); log(tx.slice(-700));
lacher();
