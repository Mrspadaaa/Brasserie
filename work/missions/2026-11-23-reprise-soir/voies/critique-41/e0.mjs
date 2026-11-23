// Ouvre l'onglet, vérifie le paquet, note la période du Calendrier, relève les soldes, liste les sortes
import { ouvrir, sleep, photo, log, ou, toucher, APP } from './outil.mjs';
import { outils, texte } from './commun.mjs';
import fs from 'node:fs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
setTimeout(() => { log('E0 délai'); lacher(); process.exit(2); }, 170000);
if (!/brasserie-l-affinee/.test(page.url())) { await page.goto(APP, { waitUntil: 'networkidle2' }); await sleep(3000); }
let js = await page.evaluate(() => performance.getEntriesByType('resource').map((r) => r.name).filter((n) => /index-.*\.js/.test(n)));
if (!js.some((x) => /DwEuRObA/.test(x))) { await page.reload({ waitUntil: 'networkidle2' }); await sleep(3500); js = await page.evaluate(() => performance.getEntriesByType('resource').map((r) => r.name).filter((n) => /index-.*\.js/.test(n))); }
log('paquet', js);
await o.nav('Calendrier'); await sleep(1500);
const periode = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /période, liste/.test(x.getAttribute('aria-label') || '')); return { bouton: b && b.getAttribute('aria-label'), cadre: (document.querySelector('.ent-cadre') || {}).innerText, ls: Object.fromEntries(Object.keys(localStorage).filter((k) => /cal|period|fen|frise/i.test(k)).map((k) => [k, localStorage[k].slice(0, 300)])) }; });
log('E0 période', periode);
await photo(page, 'E0-calendrier');
const s = await o.soldes('E0');
await o.nav('Finances'); await photo(page, 'E0-finances');
const t = await texte(page); log('E0 finances', t.slice(0, 900).replace(/\n/g, ' ¦ '));
await o.tap('Actions rapides'); await sleep(900); await o.tap('Écriture, à la main'); await sleep(1300); await photo(page, 'E0-sortes');
const tt = await texte(page); log('E0 sortes', tt.replace(/\n/g, ' ¦ ').slice(0, 1400));
s.monMois = (/Mon mois\n([^\n]+)/.exec(tt) || [])[1];
log('E0 tuiles', await page.evaluate(() => [...document.querySelectorAll('[role=dialog] button')].filter((b) => b.getBoundingClientRect().width > 0).map((b) => (b.getAttribute('aria-label') || '') + '¦' + b.textContent.trim().slice(0, 50))));
fs.writeFileSync('avant.json', JSON.stringify({ periode, s, t: t.slice(0, 1500) }, null, 1));
lacher(); process.exit(0);
