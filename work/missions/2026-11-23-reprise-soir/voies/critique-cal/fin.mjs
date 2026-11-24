import { ouvrir, sleep, photo, log, toucher, ou, boutons } from './outil.mjs';
import { etat } from './lire.mjs';
import { outils, court } from './commun.mjs';
import fs from 'node:fs';
const { page, cdp, lacher } = await ouvrir();
const { tap, duree, instantane } = outils(page, cdp);
const leaf = async (re) => page.evaluate((s) => { const e = [...document.querySelectorAll('button,[role=button]')].filter((x) => x.getBoundingClientRect().width > 0).find((x) => new RegExp(s).test(x.getAttribute('aria-label') || x.textContent)); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, a: (e.getAttribute('aria-label') || e.textContent).slice(0, 80) }; }, re);
await tap('Calendrier', 'nav button, nav a'); await sleep(2500);
await tap('· période, liste, tri et filtre'); await tap('Liste'); await page.keyboard.press('Escape'); await sleep(1200);
let z = await leaf('^ZZ TEST — barre'); log('ZZ', z);
if (z) {
  await sleep(500); z = await leaf('^ZZ TEST — barre'); await toucher(cdp, z.x, z.y); await sleep(1500);
  const p = await leaf('^(Plus d’actions|…|⋯)$') || await ou(page, 'Plus d’actions', 'button'); log('plus', p);
  if (p) { await toucher(cdp, p.x, p.y); await sleep(1000); await photo(page, 'F-00-menu', true); const opts = (await boutons(page, 'Suppr|Retir|Effac')).map((x) => x.split(' @')[0]); log('options', opts);
    const s = opts.find((t) => /Suppr/.test(t)); if (s) { await tap(s); await sleep(1000); const c = (await boutons(page, '^(Supprimer|Confirmer|Oui)')).map((x) => x.split(' @')[0]); log('confirm', c); if (c.length) { await tap(c[c.length - 1]); await sleep(2500); } } }
}
await photo(page, 'F-01-apres-suppr', true);
log('ZZ restants (liste)', await page.evaluate(() => (document.body.innerText.match(/ZZ TEST/g) || []).length));
await tap('· période, liste, tri et filtre'); await tap('Liste'); await page.keyboard.press('Escape'); await sleep(800);
await tap('Période : '); await tap('Ce mois', '[role=dialog] button'); await tap('Fermer', '[role=dialog] button');
await duree('3 mois'); await sleep(1500);
log('vue de comparaison', court(await etat(page)));
const av = JSON.parse(fs.readFileSync('avant.json', 'utf8')); const ap = await instantane();
log('vraies données : avant', av.length, 'après', ap.length, '| disparues', av.filter((x) => !ap.includes(x)), '| apparues', ap.filter((x) => !av.includes(x)));
await tap('Période : '); await tap('Tout', '[role=dialog] button'); await tap('Fermer', '[role=dialog] button');
await duree('6 sem.'); await sleep(1500); await page.evaluate(() => scrollTo(0, 0));
await photo(page, 'F-02-etat-final', false); log('état final', court(await etat(page)));
await tap('Bord', 'nav button, nav a'); await sleep(2500);
log('agenda', (await page.evaluate(() => { const t = document.body.innerText; const i = t.indexOf('Agenda'); return t.slice(i, i + 220); })).replace(/\n+/g, ' | '));
log('ZZ restants (Bord)', await page.evaluate(() => (document.body.innerText.match(/ZZ TEST/g) || []).length));
lacher();
