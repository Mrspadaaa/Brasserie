import { ouvrir, sleep, photo, log, toucher, ou, glisser } from './outil.mjs';
import { etat } from './lire.mjs';
const { page, cdp, lacher } = await ouvrir();
const court = (e) => `${e.duree} | ${e.cadre.split(' | ')[0]} | axe ${e.axe} | auj ${e.auj.length} | rognes ${e.rognes.join(';') || 0}`;
const pas = async (nom, f, demi = true) => { if (f) await f(); await sleep(1300); await page.evaluate(() => scrollTo(0, 0)); await photo(page, nom, demi); const e = await etat(page); log(nom, court(e)); return e; };
const tap = async (t) => { const r = await ou(page, t, 'button,[role=button],[role=tab],[role=option],[role=menuitem]'); if (!r) { log('introuvable', t); return null; } await toucher(cdp, r.x, r.y); await sleep(700); return r; };
const duree = async (d) => { await tap('· période, liste, tri et filtre'); await tap(d); await page.keyboard.press('Escape'); };
const tirerFin = async (dx) => { const p = await ou(page, 'Poignée de fin', 'button,[role=button]'); await glisser(cdp, p.x, p.y, Math.max(5, Math.min(386, p.x + dx)), p.y, { tenir: 300 }); };
await pas('R3b-00', () => duree('6 sem.'));
await pas('R3b-01-S52', () => tap('S52,'));
let e;
for (const dx of [20, 20, 20, 20, 20, 20]) { e = await pas('R3b-02-' + dx, () => tirerFin(dx)); if (/3 sem/.test(e.duree)) { await photo(page, 'R3b-03-3sem'); break; } }
lacher();
