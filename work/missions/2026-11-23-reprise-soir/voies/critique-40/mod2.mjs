// Modifier pour de vrai : Achat (Finances) 3,50 → 4,50 ; Vente (Calendrier › Ouvrir) 4,80 → 3,80
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
setTimeout(() => { log('N DÉLAI'); lacher(); process.exit(2); }, 400000);
const fermer = async () => { for (let i = 0; i < 4; i++) { const f = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => /^Fermer$/.test(x.getAttribute('aria-label') || x.textContent.trim()) && x.getBoundingClientRect().width > 0).pop(); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); if (!f) break; await toucher(cdp, f.x, f.y); await sleep(700); } };
const zz = () => page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST — (Achat|Vente)|CHF à dépenser/.test(x)));
const champs = () => page.evaluate(() => [...document.querySelectorAll('input,textarea')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => `${e.type}|${e.getAttribute('aria-label') || ''}|${e.placeholder}|${e.value}`));
const montant = async (ancien, v) => { const p = await page.evaluate((a) => { const e = [...document.querySelectorAll('input,textarea')].find((i) => i.getBoundingClientRect().width > 0 && i.getAttribute('aria-label') === 'Montant (CHF)' && i.value === a); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, ancien); log('montant', ancien, p); if (!p) return false; await toucher(cdp, p.x, p.y); await sleep(300); await page.keyboard.down('Control'); await page.keyboard.press('a'); await page.keyboard.up('Control'); await page.keyboard.press('Backspace'); await page.keyboard.type(v, { delay: 70 }); await sleep(600); return true; };
const enregistrer = async () => { const b = await page.evaluate(() => { const e = [...document.querySelectorAll('button')].filter((x) => x.textContent.trim() === 'Enregistrer' && x.getBoundingClientRect().width > 0).pop(); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); log('enregistrer', b); if (b) { await toucher(cdp, b.x, b.y); await sleep(1800); } };
// 1. Achat depuis Finances
await fermer(); await o.nav('Finances'); await o.tap('Opérations', 'button,[role=tab]'); await sleep(1300);
const a = await ou(page, 'ZZ TEST — Achat ·', 'button,[role=button]', true); await toucher(cdp, a.x, a.y); await sleep(1300);
await o.tap('Modifier', 'button'); await sleep(1500); log('N1 champs', await champs());
if (await montant('3,50', '4,50')) { await photo(page, 'N1-achat-montant'); log('N1 après frappe', (await o.b()).slice(-14)); await enregistrer(); await photo(page, 'N2-achat-apres'); log('N2', (await o.b()).slice(-12), (await texte(page)).slice(-600).replace(/\n/g, ' ¦ ')); }
// choix éventuel « le paiement suit »
const suit = await ou(page, 'paiement suit', 'button,label,[role=radio]'); if (suit) { log('N2b choix', (await o.b()).slice(-10)); await photo(page, 'N2b-choix'); }
await fermer();
await o.nav('Finances'); await o.tap('Opérations', 'button,[role=tab]'); await sleep(1200);
log('N3 ops', await page.evaluate(() => [...document.querySelectorAll('[aria-label],button')].map((e) => e.getAttribute('aria-label') || e.textContent.trim()).filter((x) => /ZZ TEST — Achat/.test(x)).slice(0, 4)));
// 2. Vente depuis le Calendrier
await o.nav('Calendrier'); await sleep(1500);
const v = await page.evaluate(() => { const e = [...document.querySelectorAll('[aria-label]')].find((x) => /^ZZ TEST — Vente,/.test(x.getAttribute('aria-label')) && x.getBoundingClientRect().width > 0); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
await sleep(500); await toucher(cdp, v.x, v.y); await sleep(1200); await o.tap('Ouvrir', 'button'); await sleep(1500); await o.tap('Modifier', 'button'); await sleep(1500);
log('N4 champs', await champs());
if (await montant('4,80', '3,80')) { await photo(page, 'N4-vente-montant'); await enregistrer(); await photo(page, 'N5-vente-apres'); log('N5', (await texte(page)).slice(-500).replace(/\n/g, ' ¦ ')); }
await fermer();
await o.nav('Calendrier'); await sleep(1500); log('N6 cal', await zz()); await photo(page, 'N6-cal');
await o.nav('Finances'); await o.tap('Opérations', 'button,[role=tab]'); await sleep(1200); { const x = await ou(page, 'Effacer la recherche', 'button'); if (x) { await toucher(cdp, x.x, x.y); await sleep(900); } }
log('N7 ops', await page.evaluate(() => [...document.querySelectorAll('[aria-label],button')].map((e) => e.getAttribute('aria-label') || e.textContent.trim()).filter((x) => /ZZ TEST — (Achat|Vente) ·/.test(x)).slice(0, 4)));
lacher(); process.exit(0);
