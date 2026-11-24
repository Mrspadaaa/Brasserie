import { ouvrir, sleep, photo, log, toucher, ou, boutons } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
await ou(page, 'Masquer Ventes', 'button', true); await sleep(700);
await photo(page, 'C19-01-ventes-19mois', false);
log('ventes', await boutons(page, 'Ventes|pport|poche|encaisser|reçu'));
log('texte', ((await page.evaluate(() => document.body.innerText)).match(/Ventes\n[\s\S]{0,260}/) || [''])[0].replace(/\n/g, ' ¦ '));
lacher();
