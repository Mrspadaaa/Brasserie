import { ouvrir, sleep, photo, log, boutons, toucher, ou, glisser } from './outil.mjs';
import { etat } from './lire.mjs';
import { court, outils } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const { tap } = outils(page, cdp);
// œil : cacher Fêtes puis Achats (vue seulement)
for (const r of ['Fêtes', 'Achats']) {
  const b = await ou(page, 'Masquer ' + r, 'button', true); await sleep(500);
  const b2 = await ou(page, 'Masquer ' + r, 'button'); await toucher(cdp, b2.x, b2.y); await sleep(1200);
  await page.evaluate((r) => { const e = [...document.querySelectorAll('button')].find((x) => (x.getAttribute('aria-label') || '').includes(r) && /Afficher|Montrer|Masquer/.test(x.getAttribute('aria-label') || '')); e?.scrollIntoView({ block: 'center' }); }, r); await sleep(600);
  await photo(page, 'C6-cache-' + r, false);
  log('après masquer', r, await boutons(page, r));
}
// rétablir
for (const r of ['Fêtes', 'Achats']) { const b = await page.evaluate((r) => { const e = [...document.querySelectorAll('button')].find((x) => { const a = x.getAttribute('aria-label') || ''; return a.includes(r) && /^(Afficher|Montrer|Réafficher)/.test(a); }); if (!e) return null; e.scrollIntoView({ block: 'center' }); const q = e.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2, a: e.getAttribute('aria-label') }; }, r); log('rétablir', r, b); if (b) { await toucher(cdp, b.x, b.y); await sleep(1000); } }
log('rangées', await boutons(page, '^(Masquer|Afficher|Montrer)'));
lacher();
