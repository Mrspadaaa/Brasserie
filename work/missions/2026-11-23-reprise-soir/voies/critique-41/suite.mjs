import { ouvrir, sleep, photo, log, ou, toucher, APP } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
setTimeout(() => { log('X DÉLAI'); lacher(); process.exit(2); }, 560000);
const fermer = async () => { for (let i = 0; i < 4; i++) { const f = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => /^Fermer$/.test(x.getAttribute('aria-label') || x.textContent.trim()) && x.getBoundingClientRect().width > 0).pop(); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); if (!f) break; await toucher(cdp, f.x, f.y); await sleep(700); } };
const tapRe = async (re, sel = 'button') => { const r = await page.evaluate((re, s) => { const e = [...document.querySelectorAll(s)].filter((x) => x.getBoundingClientRect().width > 0 && x.getBoundingClientRect().top > 40).find((x) => new RegExp(re).test((x.getAttribute('aria-label') || '') + '¦' + x.textContent.trim())); if (!e) return null; e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, t: ((e.getAttribute('aria-label') || '') + '¦' + e.textContent.trim()).slice(0, 80) }; }, re, sel); if (!r) { log('X introuvable', re); return null; } await sleep(300); await toucher(cdp, r.x, r.y); await sleep(900); return r; };
const saisie = async () => { await fermer(); await o.nav('Finances'); await o.tap('Actions rapides'); await sleep(800); await o.tap('Écriture, à la main'); await sleep(1300); };
const ecrire = async (re, v) => { const hs = await page.$$('input,textarea'); for (const h of hs) { const ok = await h.evaluate((e, re) => e.getBoundingClientRect().width > 0 && new RegExp(re).test((e.getAttribute('aria-label') || '') + '¦' + (e.placeholder || '')), re); if (ok) { await h.evaluate((e) => e.scrollIntoView({ block: 'center' })); const b = await h.boundingBox(); await toucher(cdp, b.x + b.width / 2, b.y + b.height / 2); await sleep(300); await h.focus(); await page.keyboard.type(v, { delay: 50 }); await sleep(700); return true; } } log('X champ absent', re); return false; };
const vider = async () => { await page.keyboard.down('Control'); await page.keyboard.press('a'); await page.keyboard.up('Control'); await page.keyboard.press('Delete'); await sleep(700); };
const ls0 = await page.evaluate(() => localStorage.getItem('laffinee.calendrier.fenetre-locale')); log('X0 ls', ls0);
// 1. détail de l'Achat (date après Modifier au curseur)
await fermer(); await o.nav('Finances'); await o.tap('Opérations', 'button,[role=tab]'); await sleep(1300);
await tapRe('^ZZ TEST — Achat ·', 'button,[role=button]'); await sleep(1200); await photo(page, 'X1-achat-detail');
log('X1', (await texte(page)).split('ZZ TEST — Achat').pop().slice(0, 400).replace(/\n/g, ' ¦ '));
// 2. Remboursement : recherche d'une vraie pièce, puis ZZ Achat, enregistrer
await saisie(); await tapRe('^¦Remboursement'); await sleep(1000);
await ecrire('Chercher', 'Nettoyage'); await sleep(900); await photo(page, 'X2-remb-recherche'); log('X2', (await texte(page)).split('De quelle pièce ?').pop().slice(0, 500).replace(/\n/g, ' ¦ '));
await vider();
await tapRe('^¦ZZ TEST — Achat'); await sleep(1200); await photo(page, 'X3-remb-choisi'); log('X3', (await texte(page)).split('Saisir à la main').pop().slice(0, 600).replace(/\n/g, ' ¦ '));
await ecrire('Montant', '1'); await toucher(cdp, 195, 30); await sleep(500); await photo(page, 'X4-remb-montant');
const f = await page.evaluate(() => { const bs = [...document.querySelectorAll('button')].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.top > 760 && r.top < 800; }); const b = bs[bs.length - 1]; if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: b.textContent.trim(), d: b.disabled }; });
log('X4 bouton', f); if (f && !f.d && !/Mon mois/.test(f.t)) { await toucher(cdp, f.x, f.y); await sleep(1800); await photo(page, 'X5-remb-fin'); log('X5', (await texte(page)).slice(-500).replace(/\n/g, ' ¦ ')); }
// 3. Habituel
await saisie(); await tapRe('^¦ZZ TEST — Apport'); await sleep(1200); await photo(page, 'X6-habituel'); log('X6', (await texte(page)).split('Saisir à la main').pop().slice(0, 400).replace(/\n/g, ' ¦ '));
// 4. Mon mois touché (saisie Achat 0,30)
await saisie(); await tapRe('^¦Achat$'); await ecrire('Montant', '0,30'); await toucher(cdp, 195, 30); await sleep(400);
const mm = await tapRe('Mon mois'); log('X7 mon mois', mm); await sleep(900); await photo(page, 'X7-mon-mois'); log('X7', (await texte(page)).slice(-300).replace(/\n/g, ' ¦ '));
await fermer(); await page.keyboard.press('Escape'); await sleep(500); await fermer();
// 5. Période plus longue (E38-6), puis remise exacte
await o.nav('Calendrier'); await sleep(1500);
await tapRe('période, liste, tri et filtre'); await sleep(900); await photo(page, 'X8-menu'); log('X8 menu', (await o.b()).slice(0, 40));
const choix = await tapRe('^¦?(3 mois|6 mois|4 mois)$', 'button,[role=option],[role=radio]'); log('X8 choix', choix);
await fermer(); await page.keyboard.press('Escape'); await sleep(900);
log('X9', await page.evaluate(() => ({ cadre: (document.querySelector('.ent-cadre') || {}).innerText, zz: [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST — (Salaire|Loyer|Abonnement|Apport|Pour moi)|à dépenser/.test(x)) })));
await photo(page, 'X9-periode-longue');
await page.evaluate((v) => localStorage.setItem('laffinee.calendrier.fenetre-locale', v), ls0); await page.goto(APP, { waitUntil: 'networkidle2' }); await sleep(3500);
await o.nav('Calendrier'); await sleep(1500);
log('X10 remise', await page.evaluate(() => ({ ls: localStorage.getItem('laffinee.calendrier.fenetre-locale'), cadre: (document.querySelector('.ent-cadre') || {}).innerText, bouton: [...document.querySelectorAll('button')].map((b) => b.getAttribute('aria-label') || '').find((a) => /période, liste/.test(a)) })));
lacher(); process.exit(0);
