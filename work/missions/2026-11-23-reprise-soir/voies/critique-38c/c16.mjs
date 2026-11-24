import { ouvrir, sleep, photo, log, boutons, toucher, ou } from './outil.mjs';
import { outils, court, periode } from './commun.mjs';
import { etat } from './lire.mjs';
const { page, cdp, lacher } = await ouvrir();
const { tap, duree } = outils(page, cdp);
{ const r = await ou(page, 'Calendrier', 'nav button, nav a'); await toucher(cdp, r.x, r.y); await sleep(3000); }
await page.evaluate(() => scrollTo(0, 0)); await sleep(400);
const e = async (n, demi = true) => { await page.evaluate(() => scrollTo(0, 0)); await sleep(500); await photo(page, n, demi); const s = await etat(page); log(n, s.periode, '|', court(s)); };
await e('C16-00-depart');
await periode(page, cdp, tap, '14.12.2026', '27.12.2026'); await sleep(800);
await e('C16-01-periode-1412', false);
const a = await ou(page, 'Revenir à aujourd’hui', 'button'); if (a) { await toucher(cdp, a.x, a.y); await sleep(1300); }
await e('C16-02-auj', false);
await duree('Jour'); await sleep(1000); await e('C16-03-jour', false);
await periode(page, cdp, tap, 'Tout'); await sleep(800);
await duree('6 sem.'); await sleep(800);
const a2 = await ou(page, 'Revenir à aujourd’hui', 'button'); if (a2) { await toucher(cdp, a2.x, a2.y); await sleep(1300); }
await e('C16-04-retour', true);
lacher();
