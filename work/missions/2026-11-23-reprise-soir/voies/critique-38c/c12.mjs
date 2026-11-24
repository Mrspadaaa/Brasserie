import { ouvrir, sleep, photo, log, boutons, toucher, ou } from './outil.mjs';
import { outils, court } from './commun.mjs';
import { etat } from './lire.mjs';
const { page, cdp, lacher } = await ouvrir();
const { tap, duree } = outils(page, cdp);
const nav = async (n) => { const r = await ou(page, n, 'nav button, nav a'); await toucher(cdp, r.x, r.y); await sleep(3000); };
const txt = () => page.evaluate(() => document.body.innerText);
await nav('Finances');
const avant = (await txt()).slice(0, 900).replace(/\n/g, ' ¦ ');
log('finances avant', avant);
await tap('Actions rapides'); await sleep(1000); await tap('Écriture, à la main'); await sleep(1500);
const t0 = await page.evaluate(() => { const b = [...document.querySelectorAll('[role=dialog] button')].find((x) => x.textContent.trim() === 'Apport'); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
await toucher(cdp, t0.x, t0.y); await sleep(1500);
const cr = await ou(page, 'Nom, facultatif', 'button'); await toucher(cdp, cr.x, cr.y); await sleep(600);
await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
await page.keyboard.type('ZZ TEST — apport', { delay: 30 }); await page.keyboard.press('Enter'); await sleep(600);
const m = await page.$('input[aria-label="Montant en CHF"]'); const bb = await m.boundingBox(); await toucher(cdp, bb.x + bb.width / 2, bb.y + bb.height / 2); await sleep(300); await m.focus(); await page.keyboard.type('1', { delay: 60 }); await sleep(800);
await photo(page, 'C12-01-rempli', false);
const ok = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => x.getBoundingClientRect().width > 0 && x.getBoundingClientRect().top > 700).find((x) => /^Reçu/.test(x.textContent.trim())); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: b.textContent.trim() }; });
log('bouton fin', ok); await toucher(cdp, ok.x, ok.y); await sleep(2500);
await photo(page, 'C12-02-fin', false);
log('fin', (await txt()).slice(0, 600).replace(/\n/g, ' ¦ '));
// fermer la carte de fin
for (let i = 0; i < 2; i++) { const f = await ou(page, 'Fermer', 'button'); if (f) { await toucher(cdp, f.x, f.y); await sleep(900); } }
await nav('Finances'); log('finances après', (await txt()).slice(0, 900).replace(/\n/g, ' ¦ ')); await photo(page, 'C12-03-finances', false);
await nav('Calendrier'); await page.evaluate(() => scrollTo(0, 0)); await duree('6 sem.'); await sleep(1000);
const a = await ou(page, 'Revenir à aujourd’hui', 'button'); if (a) { await toucher(cdp, a.x, a.y); await sleep(1200); }
const v = await ou(page, 'Masquer Ventes', 'button', true); await sleep(500); await page.evaluate(() => scrollBy(0, 150)); await sleep(500);
await photo(page, 'C12-04-calendrier', false);
log('cal ventes', await boutons(page, 'Ventes|apport|ZZ|poche|reçu|encaisser'));
log('cal texte', (await txt()).match(/Ventes[\s\S]{0,200}/)?.[0].replace(/\n/g, ' ¦ '));
lacher();
