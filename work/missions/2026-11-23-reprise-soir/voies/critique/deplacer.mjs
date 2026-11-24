import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
const r = await ou(page, 'Déplacer', 'button'); log('Déplacer', r);
await toucher(cdp, r.x, r.y); await sleep(1500); await photo(page, 'D-deplacer');
const tx = (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | '); log('après Déplacer', tx.slice(tx.indexOf('ZZ TEST'), tx.indexOf('ZZ TEST') + 700));
log('boutons', await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().width > 0).map((b) => (b.getAttribute('aria-label') || b.textContent.trim()).slice(0, 35)).slice(14, 60)));
lacher();
