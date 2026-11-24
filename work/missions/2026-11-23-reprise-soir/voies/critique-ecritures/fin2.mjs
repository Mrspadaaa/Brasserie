import { ouvrir, sleep, photo, log } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, fermer } = await ouvrir();
const o = outils(page, cdp);
await o.nav('Finances'); await o.tap('Synthèse', 'button,[role=tab]'); await sleep(1500);
const t = await texte(page);
log('F2', { caisse: (/En caisse\n([^\n]+)\n([^\n]+)/.exec(t) || []).slice(1).join(' | '), synthese: (/Entré\n([^\n]+)\nDépensé\n([^\n]+)/.exec(t) || []).slice(1).join(' / ') });
await photo(page, 'F2-synthese');
await o.tap('Solde et paramètres financiers'); await sleep(1500);
log('F2 solde', ((await texte(page)).match(/Solde de départ[\s\S]{0,80}/) || [''])[0].replace(/\n/g, ' ¦ '));
await photo(page, 'F2-solde-parametres');
for (let i = 0; i < 2; i++) { await page.keyboard.press('Escape'); await sleep(400); }
await fermer();
