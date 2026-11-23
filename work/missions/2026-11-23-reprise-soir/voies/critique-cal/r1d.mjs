import { ouvrir, sleep, photo, log, toucher, ou, taper } from './outil.mjs';
import { etat } from './lire.mjs';
const { page, cdp, lacher } = await ouvrir();
const pas = async (nom, f, demi = true) => { if (f) await f(); await sleep(1300); await page.evaluate(() => scrollTo(0, 0)); await sleep(200); await photo(page, nom, demi); const e = await etat(page); delete e.brassinsListe; log(nom, e); return e; };
const tap = async (t, s = 'button,[role=button],[role=tab],[role=option],[role=menuitem]') => { const r = await ou(page, t, s); if (!r) { log('introuvable', t); return; } await toucher(cdp, r.x, r.y); await sleep(700); };
await pas('R1-09-suivante', () => tap('Période suivante'), false);
await pas('R1-10-precedente', () => tap('Période précédente'));
await pas('R1-11-precedente2', () => tap('Période précédente'), false);
await pas('R1-12-tout', async () => { await tap('Période : '); await sleep(500); await tap('Tout', '[role=dialog] button'); await sleep(400); await tap('Fermer', '[role=dialog] button'); }, false);
for (const d of ['2 sem.', '6 sem.', '3 mois', '6 mois', 'An']) {
  await pas('R1-13-duree-' + d.replace(/\W/g, ''), async () => { await tap('· période, liste, tri et filtre'); await tap(d); await page.keyboard.press('Escape'); }, d !== 'An' && d !== '3 mois');
}
for (const e of ['Jour', 'Mois', 'Semaine']) {
  await pas('R1-14-6sem-' + e, async () => { await tap('· période, liste, tri et filtre'); if (e === 'Jour') { await tap('6 sem.'); await tap('· période, liste, tri et filtre'); } await tap(e); await page.keyboard.press('Escape'); }, e === 'Semaine');
}
lacher();
