import { ouvrir, sleep, photo, log, boutons, toucher, ou } from './outil.mjs';
import { etat } from './lire.mjs';
import { outils, court, periode } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
page.on('framenavigated', (f) => { if (f === page.mainFrame()) log('NAVIGATION', f.url()); });
const { pas, tap, duree } = outils(page, cdp);
const echelle = async (e) => { await tap('· période, liste, tri et filtre'); await tap(e, '[role=dialog] button, button'); await page.keyboard.press('Escape'); await sleep(400); if (await page.evaluate(() => !!document.querySelector('[role=dialog]'))) await tap('Fermer', '[role=dialog] button'); };
const toast = () => page.evaluate(() => [...document.querySelectorAll('[role=status],[role=alert],.toast,[class*=toast]')].map((e) => e.innerText.trim()).filter(Boolean));
// R4 : chaque durée du menu
for (const d of ['2 sem.', '6 sem.', '3 mois', '6 mois', 'An']) { await pas('R4-' + d.replace(/[ .]/g, ''), () => duree(d), false); }
// R2 : toucher une semaine à 6 sem.
await pas('R2-00-6sem', () => duree('6 sem.'));
let s = await ou(page, 'S50, ', 'button'); log('S50', s?.aria);
await pas('R2-01-touche-S50', () => toucher(cdp, s.x, s.y), false); log('toast', await toast());
log('annuler', await boutons(page, 'Annuler'));
await pas('R2-02-annuler', () => tap('Annuler'), false);
// R2 : toucher un mois à l'An
await pas('R2-03-an', () => duree('An'));
const mois = await page.evaluate(() => [...document.querySelectorAll('[data-bande-colonnes] button, [data-bande-semaines] button, button')].filter((b) => b.getBoundingClientRect().top > 150 && b.getBoundingClientRect().top < 200 && b.getBoundingClientRect().width > 0).map((b) => { const r = b.getBoundingClientRect(); return { a: b.getAttribute('aria-label') || b.textContent.trim(), x: r.left + r.width / 2, y: r.top + r.height / 2 }; }));
log('bande An', mois.map((m) => m.a));
const m = mois.find((x) => /mars/i.test(x.a)) || mois[4];
await pas('R2-04-touche-' + (m?.a || '').slice(0, 10).replace(/[^\w]/g, ''), () => toucher(cdp, m.x, m.y), false); log('toast', await toast());
await pas('R2-05-annuler', () => tap('Annuler'), false);
// R3 : échelle Jour, passage d'année
await periode(page, cdp, tap, '21.12.2026', '03.01.2027');
await pas('R3-00-periode-fin-annee', null);
await pas('R3-01-jour', () => echelle('Jour'), false);
await pas('R3-02-semaine', () => echelle('Semaine'), false);
await pas('R3-03-mois', () => echelle('Mois'), false);
await periode(page, cdp, tap, 'Tout');
await pas('R3-04-tout', () => echelle('Semaine'));
lacher();
