// Modifier « ZZ TEST — Achat » depuis Finances (3,50 → 4,50), puis « ZZ TEST — Vente » depuis le Calendrier (4,80 → 3,80)
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
const fermer = async () => { for (let i = 0; i < 3; i++) { const f = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => /^Fermer$/.test(x.getAttribute('aria-label') || x.textContent.trim()) && x.getBoundingClientRect().width > 0).pop(); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); if (!f) break; await toucher(cdp, f.x, f.y); await sleep(700); } };
const montant = async (v) => { const el = (await page.$('input[aria-label="Montant en CHF"]')) || (await page.evaluateHandle(() => [...document.querySelectorAll('input')].find((i) => i.getBoundingClientRect().width > 0 && /^[0-9]+,[0-9][0-9]$/.test(i.value)))).asElement(); if (!el) { log('MONTANT ABSENT'); return; } const b = await el.boundingBox(); await toucher(cdp, b.x + b.width / 2, b.y + b.height / 2); await sleep(300); await el.focus(); await page.keyboard.down('Control'); await page.keyboard.press('a'); await page.keyboard.up('Control'); await page.keyboard.press('Backspace'); await page.keyboard.type(v, { delay: 60 }); await sleep(600); };
const finBtn = () => page.evaluate(() => { const bs = [...document.querySelectorAll('button')].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.top > 760 && r.top < 800; }); const b = bs[bs.length - 1]; if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: b.textContent.trim() }; });
await fermer();
// 1. depuis Finances
await o.nav('Finances'); await o.tap('Opérations', 'button,[role=tab]'); await sleep(1200); { const x = await ou(page, 'Effacer la recherche', 'button'); log('filtre', !!x); if (x) { await toucher(cdp, x.x, x.y); await sleep(900); } }
let a = await ou(page, 'ZZ TEST — Achat · Nettoyage', 'button,[role=button]', true); await toucher(cdp, a.x, a.y); await sleep(1300);
await o.tap('Modifier', 'button'); await sleep(1500); await photo(page, 'M2-modifier-ouvert'); log('M2 boutons', (await o.b()).filter((x) => !/@\d+,(80[0-9]) /.test(x)).slice(-22));
await montant('4,50'); await photo(page, 'M2-modifier-montant'); const f1 = await finBtn(); log('M2 fin', f1);
if (f1) { await toucher(cdp, f1.x, f1.y); await sleep(1800); await photo(page, 'M2-modifier-fin'); log('M2 apres', (await texte(page)).slice(-500).replace(/\n/g, ' ¦ ')); }
await fermer(); await sleep(800);
await o.nav('Finances'); await o.tap('Opérations', 'button,[role=tab]'); await sleep(1200); { const x = await ou(page, 'Effacer la recherche', 'button'); log('filtre', !!x); if (x) { await toucher(cdp, x.x, x.y); await sleep(900); } }
log('M2 liste', await page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST — Achat ·/.test(x))));
// 2. depuis le Calendrier
await o.nav('Calendrier'); await sleep(1200);
const v = await page.evaluate(() => { const e = [...document.querySelectorAll('[aria-label]')].find((x) => /^ZZ TEST — Vente,/.test(x.getAttribute('aria-label')) && x.getBoundingClientRect().width > 0); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, a: e.getAttribute('aria-label') }; });
log('M3 cible', v);
if (v) {
  await toucher(cdp, v.x, v.y); await sleep(1500); await photo(page, 'M3-cal-touche'); log('M3 boutons', (await o.b()).slice(-14));
  const ov = await ou(page, 'Ouvrir', 'button'); if (ov) { await toucher(cdp, ov.x, ov.y); await sleep(1500); await photo(page, 'M3-cal-ouvrir'); log('M3 ouvrir', (await o.b()).slice(-16)); } const m = await ou(page, 'Modifier', 'button'); if (m) { await toucher(cdp, m.x, m.y); await sleep(1500); await photo(page, 'M3-cal-modifier'); await montant('3,80'); await photo(page, 'M3-cal-montant'); const f2 = await finBtn(); log('M3 fin', f2); if (f2) { await toucher(cdp, f2.x, f2.y); await sleep(1800); await photo(page, 'M3-cal-fin'); } await fermer(); }
  else log('M3 pas de Modifier');
  await sleep(1200); await photo(page, 'M3-cal-apres'); log('M3 apres', await page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST — Vente|CHF à dépenser/.test(x))));
}
lacher();
