// Modifier : Achat depuis Finances (3,50 → 4,50) ; Vente depuis le Calendrier › Ouvrir (4,80 → 3,80). Champs = textarea.
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
setTimeout(() => { log('M3 DÉLAI'); lacher(); process.exit(2); }, 300000);
const fermer = async () => { for (let i = 0; i < 4; i++) { const f = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => /^Fermer$/.test(x.getAttribute('aria-label') || x.textContent.trim()) && x.getBoundingClientRect().width > 0).pop(); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); if (!f) break; await toucher(cdp, f.x, f.y); await sleep(700); } };
const champ = async (ph, v) => { const p = await page.evaluate((ph) => { const e = [...document.querySelectorAll('textarea,input')].find((x) => (x.placeholder || x.getAttribute('aria-label')) === ph && x.getBoundingClientRect().width > 0); if (!e) return null; e.focus(); e.select(); return true; }, ph); if (!p) { log('champ absent', ph); return; } await page.keyboard.type(v, { delay: 70 }); await sleep(400); };
const zz = () => page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST — (Achat|Vente)|CHF à dépenser/.test(x)));
// 1. Achat depuis Finances
await fermer();
await o.nav('Finances'); await o.tap('Opérations', 'button,[role=tab]'); await sleep(1300);
const a = await ou(page, 'ZZ TEST — Achat ·', 'button,[role=button]', true); await toucher(cdp, a.x, a.y); await sleep(1300);
await o.tap('Modifier', 'button'); await sleep(1500);
await champ('Montant (CHF)', '4,50'); await photo(page, 'N1-achat-montant');
await o.tap('Enregistrer', 'button'); await sleep(2000); await photo(page, 'N2-achat-enregistre');
log('N2 texte', (await texte(page)).slice(0, 700).replace(/\n/g, ' ¦ '));
await fermer();
await o.nav('Finances'); await o.tap('Opérations', 'button,[role=tab]'); await sleep(1300);
log('N3 ops', await zz()); await photo(page, 'N3-ops', true);
// 2. Vente depuis le Calendrier
await o.nav('Calendrier'); await sleep(1500);
const v = await page.evaluate(() => { const e = [...document.querySelectorAll('[aria-label]')].find((x) => /^ZZ TEST — Vente,/.test(x.getAttribute('aria-label')) && x.getBoundingClientRect().width > 0); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
await sleep(500); await toucher(cdp, v.x, v.y); await sleep(1300); await photo(page, 'N4-cal-vente-touchee');
await o.tap('Ouvrir', 'button'); await sleep(1600); await photo(page, 'N5-vente-ouverte');
await o.tap('Modifier', 'button'); await sleep(1500); await photo(page, 'N6-vente-modifier');
await champ('Montant (CHF)', '3,80');
await o.tap('Enregistrer', 'button'); await sleep(2000); await photo(page, 'N7-vente-enregistree');
log('N7 texte', (await texte(page)).slice(0, 700).replace(/\n/g, ' ¦ '));
await fermer();
await o.nav('Calendrier'); await sleep(1500); log('N8 cal', await zz()); await photo(page, 'N8-cal');
await o.nav('Finances'); await o.tap('Opérations', 'button,[role=tab]'); await sleep(1300);
log('N9 recherche', await page.evaluate(() => [...document.querySelectorAll('input')].filter((i) => i.getBoundingClientRect().width > 0 && i.type !== 'checkbox').map((i) => (i.getAttribute('aria-label') || i.placeholder) + '=' + i.value)));
log('N9 ops', await zz());
lacher(); process.exit(0);
