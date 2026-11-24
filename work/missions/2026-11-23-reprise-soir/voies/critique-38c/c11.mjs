import { ouvrir, sleep, photo, log, boutons, toucher, ou } from './outil.mjs';
import { outils } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const { tap } = outils(page, cdp);
const t0 = await page.evaluate(() => { const b = [...document.querySelectorAll('[role=dialog] button')].find((x) => x.textContent.trim() === 'Apport'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
log('apport', t0); await toucher(cdp, t0.x, t0.y); await sleep(1500);
await photo(page, 'C11-00-forme', false);
const cr = await ou(page, 'Nom, facultatif', 'button'); log('crayon', cr);
if (cr) { await toucher(cdp, cr.x, cr.y); await sleep(600); await page.keyboard.type('ZZ TEST — apport', { delay: 30 }); await page.keyboard.press('Enter'); await sleep(600); }
const m = await page.$('input[aria-label="Montant en CHF"]'); const bb = await m.boundingBox(); await toucher(cdp, bb.x + bb.width / 2, bb.y + bb.height / 2); await sleep(300); await m.focus(); await page.keyboard.type('1', { delay: 60 }); await sleep(600);
await page.keyboard.press('Escape').catch(() => {}); await sleep(300);
await photo(page, 'C11-01-rempli', false);
log('boutons', (await boutons(page)).filter((b) => !/^(Bord|Finances|Calendrier|Brassins|Stocks|Clients)/.test(b)).slice(-20));
lacher();
