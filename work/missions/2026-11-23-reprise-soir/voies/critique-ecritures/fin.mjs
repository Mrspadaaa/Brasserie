// Remettre la frise à 6 sem., relever les soldes après, vérifier qu'aucun ZZ ne reste au Calendrier ; comparer à avant.json
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils } from './commun.mjs';
import fs from 'node:fs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
await o.nav('Calendrier'); await sleep(1200);
const d = await page.evaluate(() => (([...document.querySelectorAll('button')].find((b) => /période, liste, tri et filtre/.test(b.getAttribute('aria-label') || '')) || {}).textContent || '').trim());
log('F duree', d);
if (!/^6 sem/.test(d)) { await o.tap('· période, liste, tri et filtre', 'button'); await sleep(800); await o.tap('6 sem.', 'button'); await sleep(800); const f = await ou(page, 'Fermer', 'button'); if (f) { await toucher(cdp, f.x, f.y); await sleep(700); } }
await photo(page, 'F-calendrier');
log('F zz cal', await page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST/.test(x))));
const s = await o.soldes('APRES');
const a = JSON.parse(fs.readFileSync('avant.json', 'utf8'));
for (const k of ['depenser', 'caisse', 'synthese']) log('F compare', k, a[k] === s[k] ? 'IDENTIQUE' : 'DIFFERENT', a[k], '→', s[k]);
log('F parametres', a.parametres.replace(/.*Solde et paramètres/, '').slice(0, 200) === s.parametres.replace(/.*Solde et paramètres/, '').slice(0, 200) ? 'IDENTIQUE' : 'DIFFERENT');
fs.writeFileSync('apres.json', JSON.stringify(s, null, 1));
await o.tap('Plus : saisie'); await sleep(900); log('F ecritures', (await o.b()).filter((x) => /écritures?/.test(x))); await o.tap('Retour'); await sleep(500);
lacher();
