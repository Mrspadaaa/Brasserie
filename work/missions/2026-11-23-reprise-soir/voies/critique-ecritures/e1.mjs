import { ouvrir, sleep, photo, log, boutons, taper } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
await taper(page, cdp, 'Finances', 'nav button, nav a, button'); await sleep(2500);
await photo(page, 'E1-finances');
log('boutons', await boutons(page));
log('texte', (await page.evaluate(() => document.body.innerText)).slice(0, 2500));
lacher();
