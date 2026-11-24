// HABITUELS avec 5 récurrentes ZZ en place (E43-3) ; rien enregistré
import { ouvrir, sleep, photo, log } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir(); const o = outils(page, cdp);
setTimeout(() => { lacher(); process.exit(2); }, 120000);
await o.fermerHaut(); await o.nav('Finances'); await o.tap('Actions rapides'); await sleep(800); await o.tap('Écriture, à la main'); await sleep(1300);
await photo(page, 'H1-habituels');
log('H1', (/HABITUELS\n([\s\S]{0,400})/.exec(await texte(page)) || [])[1]?.replace(/\n/g, ' ¦ '));
await o.fermerHaut(); lacher(); process.exit(0);
