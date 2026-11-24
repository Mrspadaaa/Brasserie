// Ouvre l'onglet, vérifie le paquet, relève les soldes, liste les sortes d'écriture
import { ouvrir, sleep, photo, log, ou, toucher, APP } from './outil.mjs';
import { outils, texte } from './commun.mjs';
import fs from 'node:fs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
setTimeout(() => { log('E0 délai'); lacher(); process.exit(2); }, 160000);
const js = await page.evaluate(() => performance.getEntriesByType('resource').map((r) => r.name).filter((n) => /index-.*\.js/.test(n)));
log('paquet', js);
const s = await o.soldes('E0');
// Mon mois, comptes : Finances texte
await o.nav('Finances'); await photo(page, 'E0-finances'); 
const t = await texte(page); log('E0 finances', t.slice(0, 900).replace(/\n/g, ' ¦ '));
await o.nav('Calendrier'); await sleep(1500); await photo(page, 'E0-calendrier');
log('E0 cal', await page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST|CHF à dépenser/.test(x))));
// menu +
await o.plus(); await photo(page, 'E0-plus', true); log('E0 plus', (await o.b()).slice(-14));
await o.tap('Écriture', 'button'); await sleep(1300); await photo(page, 'E0-sortes');
log('E0 sortes', (await texte(page)).replace(/\n/g, ' ¦ ').slice(0, 1200));
fs.writeFileSync('avant.json', JSON.stringify({ s, t: t.slice(0, 1500) }, null, 1));
lacher(); process.exit(0);
