import { ouvrir, sleep, photo, log, toucher, ou, boutons } from './outil.mjs';
import { outils } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const { tap } = outils(page, cdp);
const leaf = async (re) => page.evaluate((s) => { const e = [...document.querySelectorAll('button,[role=button]')].filter((x) => x.getBoundingClientRect().width > 0).find((x) => new RegExp(s).test(x.getAttribute('aria-label') || x.textContent)); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, a: (e.getAttribute('aria-label') || e.textContent).slice(0, 80) }; }, re);
await tap('Calendrier', 'nav button, nav a'); await sleep(2500);
let z = null;
for (let k = 0; k < 3 && !z; k++) { await tap('· période, liste, tri et filtre'); const m = (await boutons(page, '^(Liste|Frise|Sans date)')).map((x) => x.split(' @')[0]); log('menu', m); await tap(m.find((t) => /^Liste|^Frise/.test(t)) || 'Liste'); await page.keyboard.press('Escape'); await sleep(1500); z = await leaf('^ZZ TEST — barre'); }
log('ZZ', z);
await sleep(500); z = await leaf('^ZZ TEST — barre'); await toucher(cdp, z.x, z.y); await sleep(1500);
await photo(page, 'F-03-carte', true);
const p = await leaf('^(Plus d’actions|…|⋯|Plus)$'); log('plus', p, (await boutons(page, 'Plus|…|⋯|Modifier|Lier')).map((x) => x.split(' @')[0]));
lacher();
