import { ouvrir, sleep, photo, log, toucher, ou, glisser } from './outil.mjs';
import { etat } from './lire.mjs';
const { page, cdp, lacher } = await ouvrir();
const court = (e) => `${e.duree} | ${e.cadre.split(' | ')[0]} | axe ${e.axe} | auj ${e.auj.length} | rognes ${e.rognes.join(';') || 0}`;
const pas = async (nom, f, demi = true) => { if (f) await f(); await sleep(1300); await page.evaluate(() => scrollTo(0, 0)); await photo(page, nom, demi); const e = await etat(page); log(nom, court(e)); return e; };
const tap = async (t) => { const r = await ou(page, t, 'button,[role=button],[role=tab],[role=option],[role=menuitem]'); if (!r) { log('introuvable', t); return null; } await toucher(cdp, r.x, r.y); await sleep(700); return r; };
const duree = async (d) => { await tap('· période, liste, tri et filtre'); await tap(d); await page.keyboard.press('Escape'); };
const tirerFin = async (dx) => { const p = await ou(page, 'Poignée de fin', 'button,[role=button]'); await glisser(cdp, p.x, p.y, Math.max(5, Math.min(386, p.x + dx)), p.y, { tenir: 300 }); };
let e;
await pas('R3c-00', () => duree('6 sem.'));
await pas('R3c-01-S53', () => tap('S53,'));
e = await pas('R3c-02-etire', () => tirerFin(50), false);
await pas('R3c-03-An', () => duree('An'));
const fin2 = async (dx) => { const p = (await ou(page, 'Poignée de fin', 'button,[role=button]')) || (await ou(page, 'Revenir à la fenêtre d’avant', 'button,[role=button]')); await glisser(cdp, p.x, p.y, Math.max(5, Math.min(386, p.x + dx)), p.y, { tenir: 300 }); };
e = await pas('R3c-04', () => fin2(60));
for (let k = 0; k < 8 && !/^(3 ans|36 mois)$/.test(e.duree); k++) { const n = parseInt(e.duree) || 12; const dx = /mois/.test(e.duree) ? (n < 36 ? Math.max(8, (36 - n) * 3) : -8) : 40; e = await pas('R3c-05-' + k, () => fin2(dx)); }
await photo(page, 'R3c-06-3ans');
for (let k = 0; k < 6 && !/^(4 ans|48 mois)$/.test(e.duree); k++) { const n = parseInt(e.duree) || 36; const dx = /mois/.test(e.duree) ? (n < 48 ? Math.max(8, (48 - n) * 3) : -8) : (/^3 ans/.test(e.duree) ? 30 : -8); e = await pas('R3c-07-' + k, () => fin2(dx)); }
await photo(page, 'R3c-08-4ans');
lacher();
