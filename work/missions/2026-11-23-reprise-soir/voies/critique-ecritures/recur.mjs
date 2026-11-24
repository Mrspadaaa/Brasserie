// Récurrences restées au Calendrier après retrait : toucher la barre, voir comment la retirer
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
for (let i = 0; i < 2; i++) { const f = await ou(page, 'Fermer', 'button'); if (f) { await toucher(cdp, f.x, f.y); await sleep(600); } }
await o.nav('Calendrier'); await sleep(1200);
const v = await page.evaluate(() => { const e = [...document.querySelectorAll('[aria-label]')].find((x) => /^ZZ TEST — Salaire,/.test(x.getAttribute('aria-label')) && x.getBoundingClientRect().width > 0); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + Math.min(40, r.width / 2), y: r.top + r.height / 2 }; });
log('R cible', v); await toucher(cdp, v.x, v.y); await sleep(1300); await photo(page, 'R1-recur-touche', false); log('R1', (await o.b()).slice(-10));
const ov = await ou(page, 'Ouvrir', 'button'); if (ov) { await toucher(cdp, ov.x, ov.y); await sleep(1600); await photo(page, 'R2-recur-ouvrir', false); log('R2', (await o.b()).slice(-14)); log('R2 t', (await texte(page)).slice(-600).replace(/\n/g, ' ¦ ')); }
lacher();
