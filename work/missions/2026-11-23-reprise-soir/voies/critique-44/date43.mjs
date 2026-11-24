// E41-5 : Modifier › date d'un achat payé (ZZ TEST — Achat 4,50 payé 19.11) au curseur, montant inchangé ; puis Opérations, fiche (paiements), Calendrier
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
page.on('console', (m) => { if (/error|warn/.test(m.type())) log('CONSOLE', m.type(), m.text().slice(0, 240)); });
page.on('pageerror', (e) => log('PAGEERROR', String(e).slice(0, 240)));
setTimeout(() => { log('D DÉLAI'); lacher(); process.exit(2); }, 300000);
const fermer = async () => { for (let i = 0; i < 4; i++) { const f = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => /^Fermer$/.test(x.getAttribute('aria-label') || x.textContent.trim()) && x.getBoundingClientRect().width > 0).pop(); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); if (!f) break; await toucher(cdp, f.x, f.y); await sleep(700); } };
const zz = () => page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST — Achat|CHF à dépenser/.test(x)));
const ops = async () => { await fermer(); await o.nav('Finances'); await o.tap('Opérations', 'button,[role=tab]'); await sleep(1300); const x = await ou(page, 'Effacer la recherche', 'button'); if (x) { await toucher(cdp, x.x, x.y); await sleep(900); } };
const ouvrirAchat = async () => { const r = await page.evaluate(() => { const e = [...document.querySelectorAll('button,[role=button]')].find((x) => /^ZZ TEST — Achat/.test(x.getAttribute('aria-label') || '') && x.getBoundingClientRect().width > 0); if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, a: e.getAttribute('aria-label') }; }); log('D op', r); if (r) { await sleep(300); await toucher(cdp, r.x, r.y); await sleep(1400); } return r; };
await ops(); await ouvrirAchat(); await o.tap('Modifier', 'button'); await sleep(1500);
const d = await page.evaluate(() => { const e = [...document.querySelectorAll('button')].find((b) => b.getBoundingClientRect().width > 0 && /^\d\d\.\d\d$/.test(b.textContent.trim())); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, a: e.getAttribute('aria-label'), t: e.textContent.trim() }; });
log('D pastille', d);
await toucher(cdp, d.x, d.y); await sleep(900); await photo(page, 'D1-date-ouverte');
const sl = await page.evaluate(() => { const s = [...document.querySelectorAll('[role=slider]')].find((e) => e.getBoundingClientRect().width > 0); if (!s) return null; const r = s.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), v: s.getAttribute('aria-valuetext') }; });
log('D curseur', sl);
if (sl) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sl.x, y: sl.y, id: 1 }] }); await sleep(150);
  for (let i = 1; i <= 20; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: sl.x - i * 2, y: sl.y, id: 1 }] }); await sleep(40); }
  await sleep(300); await photo(page, 'D2-curseur-pendant');
  log('D pendant', await page.evaluate(() => [...document.querySelectorAll('button,[role=slider]')].filter((b) => b.getBoundingClientRect().width > 0).map((b) => b.getAttribute('aria-valuetext') || b.textContent.trim()).filter((x) => /^\d\d\.\d\d$|nov\.|Payé/.test(x)).slice(0, 6)));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(900);
}
await page.evaluate(() => document.activeElement && document.activeElement.blur()); await sleep(300);
await photo(page, 'D3-avant-enr');
log('D3 texte', (await texte(page)).split('ZZ TEST — Achat').slice(1).join('|').slice(0, 700).replace(/\n/g, ' ¦ '));
const f = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => x.getBoundingClientRect().width > 0 && x.textContent.trim() === 'Enregistrer').pop(); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
if (f) { await toucher(cdp, f.x, f.y); await sleep(2200); }
await photo(page, 'D4-apres');
await ops(); log('D5 ops', await zz()); await photo(page, 'D5-ops', true);
await ouvrirAchat(); await photo(page, 'D6-detail');
log('D6 détail', await page.evaluate(() => { const d = [...document.querySelectorAll('[role=dialog]')].pop(); return d ? d.innerText.slice(0, 900).replace(/\n/g, ' ¦ ') : ''; }));
await fermer(); await o.nav('Calendrier'); await sleep(1500); log('D7 cal', await zz());
lacher(); process.exit(0);
