import { ouvrir, sleep, photo, log, boutons, toucher, ou } from './outil.mjs';
import { outils, court } from './commun.mjs';
import { etat } from './lire.mjs';
const { page, cdp, lacher } = await ouvrir();
const { tap, duree, barre } = outils(page, cdp);
const f = await page.evaluate(() => { const b = [...document.querySelectorAll('button[aria-label="Fermer"]')].filter((x) => x.getBoundingClientRect().width > 0).pop(); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
if (f) { await toucher(cdp, f.x, f.y); await sleep(1000); }
const nav = async (n) => { const r = await ou(page, n, 'nav button, nav a'); await toucher(cdp, r.x, r.y); await sleep(3000); };
await nav('Calendrier'); await page.evaluate(() => scrollTo(0, 0));
await duree('6 mois'); await sleep(1000);
const a = await ou(page, 'Revenir à aujourd’hui', 'button'); if (a) { await toucher(cdp, a.x, a.y); await sleep(1200); }
let b = await barre(); log('barre', b, court(await etat(page)));
if (b) { await page.evaluate((y) => scrollBy(0, y - 450), b.y); await sleep(500); b = await barre(); await toucher(cdp, b.x, b.y); await sleep(1400);
  await photo(page, 'Z4-00-fiche', true); log('fiche', (await boutons(page)).filter((x) => /Plus|Suppr|Retir|Ouvrir|Fermer/.test(x)));
  const p = await ou(page, 'Plus d’actions', 'button'); if (p) { await toucher(cdp, p.x, p.y); await sleep(900); }
  const s = (await boutons(page, 'Suppr|Retir')).map((x) => x.split(' @')[0]); log('suppr', s);
  if (s.length) { await tap(s[0]); await sleep(1200); const c = (await boutons(page, '^(Supprimer|Confirmer|Oui|Retirer)')).map((x) => x.split(' @')[0]); log('confirm', c); if (c.length) { await tap(c[c.length - 1]); await sleep(2500); } } }
log('ZZ restants', await page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST — (barre|apport)/.test(x))));
await duree('6 sem.'); await sleep(1000);
const a2 = await ou(page, 'Revenir à aujourd’hui', 'button'); if (a2) { await toucher(cdp, a2.x, a2.y); await sleep(1200); }
await page.evaluate(() => scrollTo(0, 0)); await photo(page, 'Z4-01-final', true);
lacher();
