import { ouvrir, sleep, photo, log, boutons, toucher, ou } from './outil.mjs';
import { outils, court } from './commun.mjs';
import { etat } from './lire.mjs';
const { page, cdp, lacher } = await ouvrir();
const { tap, duree } = outils(page, cdp);
const nav = async (n) => { const r = await ou(page, n, 'nav button, nav a'); await toucher(cdp, r.x, r.y); await sleep(3000); };
const txt = () => page.evaluate(() => document.body.innerText);
const zzOps = async (tag) => { await nav('Finances'); await tap('Opérations', '[role=tab],button'); await sleep(1800); const t = await txt(); log(tag, 'ZZ apport dans Opérations', (t.match(/ZZ TEST — apport[^\n]*(\n[^\n]*){0,2}/g) || []).map((s) => s.replace(/\n/g, ' ¦ '))); };
await zzOps('avant x');
// créer puis toucher la croix du haut pendant la carte de fin
await tap('Actions rapides'); await sleep(1000); await tap('Écriture, à la main'); await sleep(1500);
const t0 = await page.evaluate(() => { const b = [...document.querySelectorAll('[role=dialog] button')].find((x) => x.textContent.trim() === 'Apport'); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
await toucher(cdp, t0.x, t0.y); await sleep(1500);
const cr = await ou(page, 'Nom, facultatif', 'button'); await toucher(cdp, cr.x, cr.y); await sleep(600);
await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
await page.keyboard.type('ZZ TEST — apport croix', { delay: 30 }); await page.keyboard.press('Enter'); await sleep(600);
const m = await page.$('input[aria-label="Montant en CHF"]'); const bb = await m.boundingBox(); await toucher(cdp, bb.x + bb.width / 2, bb.y + bb.height / 2); await sleep(300); await m.focus(); await page.keyboard.type('1', { delay: 60 }); await sleep(800);
const ok = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => x.getBoundingClientRect().width > 0 && x.getBoundingClientRect().top > 700).find((x) => /^Reçu/.test(x.textContent.trim())); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
await toucher(cdp, ok.x, ok.y); await sleep(2500);
const croix = await page.evaluate(() => [...document.querySelectorAll('button')].filter((x) => { const r = x.getBoundingClientRect(); return r.width > 0 && r.top < 60 && r.left < 80; }).map((x) => { const r = x.getBoundingClientRect(); return { a: x.getAttribute('aria-label'), x: r.left + r.width / 2, y: r.top + r.height / 2, top: document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === x || x.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)) }; }));
log('croix', croix);
const c = croix.find((x) => x.a === 'Fermer') || croix[0];
await toucher(cdp, c.x, c.y); await sleep(1500);
await photo(page, 'C14-01-apres-croix', false);
log('après croix', (await txt()).slice(0, 250).replace(/\n/g, ' ¦ '));
for (let i = 0; i < 2; i++) { const f = await page.evaluate(() => { const b = [...document.querySelectorAll('button[aria-label="Fermer"]')].find((x) => x.getBoundingClientRect().width > 0); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); if (f) { await toucher(cdp, f.x, f.y); await sleep(900); } }
await zzOps('après croix');
await photo(page, 'C14-02-operations', false);
lacher();
