// Où est le Remboursement ZZ TEST — Achat lié 0,50 ? Opérations › Filtres › écritures annulées
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir(); const o = outils(page, cdp);
setTimeout(() => { lacher(); process.exit(2); }, 150000);
await o.fermerHaut(); await o.nav('Finances'); await o.tap('Opérations', '[role=tab],button'); await sleep(1500);
await o.tap('Filtres', 'button'); await sleep(1000); await photo(page, 'W1-filtres', true);
log('W1', (await o.b()).filter((x) => /annul|Écritures|Tout|Statut/i.test(x)).slice(0, 15));
await o.tap('annulées', 'button,label,[role=radio],[role=option],[role=switch],[role=checkbox]'); await sleep(1200);
await o.fermerHaut(); await sleep(800);
await photo(page, 'W2-annulees');
log('W2', await page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST/.test(x))));
await o.tap('Filtres', 'button'); await sleep(900); await o.tap('annulées', 'button,label,[role=radio],[role=option],[role=switch],[role=checkbox]'); await sleep(900); await o.fermerHaut();
log('W3 remis', await page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST|annulées/.test(x))));
lacher(); process.exit(0);
