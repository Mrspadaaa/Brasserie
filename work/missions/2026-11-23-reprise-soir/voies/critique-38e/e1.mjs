import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
setTimeout(() => { log('E1 délai'); lacher(); process.exit(2); }, 100000);
const o = outils(page, cdp);
for (let i = 0; i < 3; i++) { const f = await ou(page, 'Fermer', 'button'); if (f && f.t < 60) { await toucher(cdp, f.x, f.y); await sleep(600); } }
await o.nav('Calendrier');
await o.tap('Actions rapides'); await sleep(900); await photo(page, 'E1-actions'); log('E1 actions', (await o.b()).slice(-10));
await o.tap('Écriture, à la main'); await sleep(1300); await photo(page, 'E1-sortes');
log('E1 sortes', await page.evaluate(() => [...document.querySelectorAll('[role=dialog] button')].filter((b) => b.getBoundingClientRect().width > 0).map((b) => (b.getAttribute('aria-label') || '') + '¦' + b.textContent.trim().slice(0, 50))));
lacher(); process.exit(0);
