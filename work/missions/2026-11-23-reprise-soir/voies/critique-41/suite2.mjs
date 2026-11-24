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

// R. Remboursement : vraies pièces payées cherchées par nom et montant
await saisie(); await tapRe('^¦Remboursement'); await sleep(1000);
for (const q of ['masque', '23', 'Extincteur', 'Brau']) { await ecrire('Chercher', q); await sleep(900); log('XR ' + q, (await texte(page)).split('De quelle pièce ?').pop().slice(0, 260).replace(/n/g, ' ¦ ')); await vider(); }
await photo(page, 'XR-remb-liste'); await fermer(); await page.keyboard.press('Escape'); await sleep(600); await fermer();
// P. période : menu en haut de page
await o.nav('Calendrier'); await sleep(1500); await page.evaluate(() => { window.scrollTo(0, 0); for (const e of document.querySelectorAll('*')) if (e.scrollTop > 0) e.scrollTop = 0; }); await sleep(600);
const mb = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /période, liste/.test(x.getAttribute('aria-label') || '')); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); await toucher(cdp, mb.x, mb.y); await sleep(1000);
await photo(page, 'XP-menu'); log('XP menu', (await o.b()).filter((x) => /sem|mois|an|jour|trim/i.test(x)).slice(0, 30));
const c = await page.evaluate(() => { const e = [...document.querySelectorAll('button,[role=option],[role=radio]')].filter((x) => x.getBoundingClientRect().width > 0).find((x) => /^(3 mois|6 mois|4 mois|1 an|12 mois|Trimestre)$/.test(x.textContent.trim())); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: e.textContent.trim() }; });
log('XP choix', c); if (c) { await toucher(cdp, c.x, c.y); await sleep(1200); } await fermer(); await page.keyboard.press('Escape'); await sleep(900);
let l = await page.evaluate(() => ({ cadre: (document.querySelector('.ent-cadre') || {}).innerText, zz: [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST — (Salaire|Loyer|Abonnement|Apport|Pour moi)|à dépenser/.test(x)) }));
log('XP lu', l);
if (!c || l.cadre === '23 nov. 2026 – 3 janv. 2027') { await page.evaluate(() => localStorage.setItem('laffinee.calendrier.fenetre-locale', JSON.stringify({ app: JSON.stringify({ genre: 'tout' }), locale: { genre: 'dates', du: '2026-11-23', au: '2027-04-30' } }))); await page.goto(APP, { waitUntil: 'networkidle2' }); await sleep(3500); await o.nav('Calendrier'); await sleep(1800); l = await page.evaluate(() => ({ cadre: (document.querySelector('.ent-cadre') || {}).innerText, zz: [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((x) => /ZZ TEST — (Salaire|Loyer|Abonnement|Apport|Pour moi)|à dépenser/.test(x)) })); log('XP ls lu', l); }
await photo(page, 'XP-periode-longue');
await page.evaluate((v) => localStorage.setItem('laffinee.calendrier.fenetre-locale', v), ls0); await page.goto(APP, { waitUntil: 'networkidle2' }); await sleep(3500);
await o.nav('Calendrier'); await sleep(1500);
log('XP remise', await page.evaluate(() => ({ ls: localStorage.getItem('laffinee.calendrier.fenetre-locale'), cadre: (document.querySelector('.ent-cadre') || {}).innerText, bouton: [...document.querySelectorAll('button')].map((b) => b.getAttribute('aria-label') || '').find((a) => /période, liste/.test(a)) })));
lacher(); process.exit(0);
