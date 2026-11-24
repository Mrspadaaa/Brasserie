import { ouvrir, sleep, photo, log, toucher, ou, glisser } from './outil.mjs';
import { etat } from './lire.mjs';
const { page, cdp, lacher } = await ouvrir();
const court = (e) => `${e.duree} | ${e.cadre.split(' | ')[0]} | axe ${e.axe} | auj ${e.auj.length} | rognes ${e.rognes.join(';') || 0}`;
const pas = async (nom, f, demi = true) => { if (f) await f(); await sleep(1300); await page.evaluate(() => scrollTo(0, 0)); await photo(page, nom, demi); const e = await etat(page); log(nom, court(e)); return e; };
const tap = async (t, s = 'button,[role=button],[role=tab],[role=option],[role=menuitem]') => { const r = await ou(page, t, s); if (!r) { log('introuvable', t); return null; } await toucher(cdp, r.x, r.y); await sleep(700); return r; };
const duree = async (d) => { await tap('· période, liste, tri et filtre'); await tap(d); await page.keyboard.press('Escape'); };
const tirerFin = async (dx) => { const p = (await ou(page, 'Poignée de fin', 'button,[role=button]')) || (await ou(page, 'Revenir à la fenêtre d’avant', 'button,[role=button]')); await glisser(cdp, p.x, p.y, Math.max(5, Math.min(386, p.x + dx)), p.y, { tenir: 300 }); };
await pas('R3-05-An', () => duree('An'));
e = await pas('R3-06-etire', () => tirerFin(60));
for (let k = 0; k < 8 && !/3 ans|36 mois/.test(e.duree); k++) { const n = parseInt(e.duree) || 12; const dx = /mois/.test(e.duree) ? (n < 36 ? 25 : -15) : 40; e = await pas('R3-07-' + k, () => tirerFin(dx)); }
await photo(page, 'R3-08-3ans');
await pas('R3-09-plus', () => tirerFin(60), false);
lacher();
