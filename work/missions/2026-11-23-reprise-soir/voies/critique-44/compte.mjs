// Compte de paiement : ouvrir, lister, choisir un autre compte ; rien enregistré
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
setTimeout(() => { log('C DÉLAI'); lacher(); process.exit(2); }, 150000);
for (let i = 0; i < 4; i++) { const f = await ou(page, 'Fermer', 'button'); if (f && f.t < 40) { await toucher(cdp, f.x, f.y); await sleep(700); } else break; }
await o.nav('Finances'); await o.tap('Actions rapides'); await sleep(800); await o.tap('Écriture, à la main'); await sleep(1200);
await o.tap('Achat', 'button'); await sleep(1000);
const c = await ou(page, 'Compte de paiement', 'button'); log('H6 compte', c);
await toucher(cdp, c.x, c.y); await sleep(1000); await photo(page, 'H6-compte-ouvert');
log('H6 options', await page.evaluate(() => [...document.querySelectorAll('button,[role=option],[role=menuitem],[role=radio],li')].filter((x) => { const r = x.getBoundingClientRect(); return r.width > 0 && r.top > 100; }).map((x) => (x.getAttribute('aria-label') || '') + '¦' + x.textContent.trim().slice(0, 40) + ' @' + Math.round(x.getBoundingClientRect().top)).slice(-16)));
const e = await page.evaluate(() => { const x = [...document.querySelectorAll('button,[role=option],[role=menuitem],[role=radio]')].filter((x) => x.getBoundingClientRect().width > 0 && /^(Espèces|Caisse|TWINT)/.test(x.textContent.trim())).pop(); if (!x) return null; const r = x.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: x.textContent.trim() }; });
log('H6 choix', e); if (e) { await toucher(cdp, e.x, e.y); await sleep(900); }
await photo(page, 'H6-compte-choisi'); log('H6 après', await o.b('Compte|Banque|Espèces|TWINT|Caisse'));
await o.tap('Fermer', 'button'); await sleep(800);
lacher(); process.exit(0);
