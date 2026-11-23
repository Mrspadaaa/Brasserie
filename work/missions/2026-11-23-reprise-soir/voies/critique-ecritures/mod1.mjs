// Finances › Opérations : retrouver les ZZ, ouvrir « ZZ TEST — Achat », voir la fiche de modification
import { ouvrir, sleep, photo, log, ou, toucher, glisser } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
await o.nav('Finances'); await o.tap('Opérations', 'button,[role=tab]'); await sleep(1500);
const zz = () => page.evaluate(() => [...document.querySelectorAll('button,[role=button],li,a')].filter((e) => /ZZ TEST/.test(e.getAttribute('aria-label') || e.textContent) && e.getBoundingClientRect().width > 0 && e.childElementCount < 12).map((e) => { const r = e.getBoundingClientRect(); return (e.getAttribute('aria-label') || e.textContent).trim().replace(/\s+/g, ' ').slice(0, 140) + ' @' + Math.round(r.top); }));
await photo(page, 'M0-operations'); log('M0', await zz());
await glisser(cdp, 200, 690, 200, 260, { n: 14, pas: 25 }); await sleep(900); await photo(page, 'M0b-operations'); log('M0b', await zz());
const a = await ou(page, 'ZZ TEST — Achat ·', 'button,[role=button]', true) || await ou(page, 'ZZ TEST — Achat', 'button,[role=button]', true);
log('M1 cible', a); if (a) { await toucher(cdp, a.x, a.y); await sleep(1500); await photo(page, 'M1-ouvert'); log('M1 boutons', (await o.b()).slice(-25)); log('M1 texte', (await texte(page)).slice(-700).replace(/\n/g, ' ¦ ')); }
lacher();
