// Gestes fins : titre par défaut et curseur, liste des comptes, Mon mois, changer, échéance, Remboursement, habituel, Annuler / Saisir un autre
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
setTimeout(() => { log('G DÉLAI'); lacher(); process.exit(2); }, 480000);
const vis = (sel, re) => page.evaluate((s, r) => { const e = [...document.querySelectorAll(s)].filter((x) => { const b = x.getBoundingClientRect(); return b.width > 0 && b.top > 40; }).find((x) => new RegExp(r).test((x.getAttribute('aria-label') || '') + '¦' + x.textContent.trim())); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, t: ((e.getAttribute('aria-label') || '') + '¦' + e.textContent.trim()).slice(0, 80) }; }, sel, re);
const tapRe = async (re, sel = 'button') => { const r = await vis(sel, re); if (!r) { log('G INTROUVABLE', re); return null; } await toucher(cdp, r.x, r.y); await sleep(800); return r; };
const etat = () => page.evaluate(() => { const bs = [...document.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().width > 0); const g = (re) => { const b = bs.find((x) => re.test((x.getAttribute('aria-label') || '') + '¦' + x.textContent)); return b ? ((b.getAttribute('aria-label') || '') + '¦' + b.textContent.trim()).slice(0, 70) : '-'; }; const s = [...document.querySelectorAll('[role=slider]')].find((e) => e.getBoundingClientRect().width > 0); return { titre: g(/^Nom/), date: g(/^Date :/), curseur: s ? s.getAttribute('aria-valuetext') : '-', statut: g(/^¦?(Payé|Reçu)/), fin: bs.filter((b) => b.getBoundingClientRect().top > 780).map((b) => b.textContent.trim()).join(' | ') }; });
const fermerTout = async () => { for (let i = 0; i < 4; i++) { const f = await ou(page, 'Fermer', 'button'); if (f && f.t < 60) { await toucher(cdp, f.x, f.y); await sleep(700); } else break; } };
const ouvrirSorte = async (tuile, k = 0) => { await fermerTout(); await o.nav('Finances'); await o.tap('Actions rapides'); await sleep(800); await o.tap('Écriture, à la main'); await sleep(1200); if (!tuile) return; const r = await page.evaluate((s, k) => { const e = [...document.querySelectorAll('[role=dialog] button')].filter((b) => b.getBoundingClientRect().width > 0 && b.textContent.trim().startsWith(s))[k]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, tuile, k); await toucher(cdp, r.x, r.y); await sleep(1100); };
const montant = async (v) => { const el = await page.$('input[aria-label="Montant en CHF"]'); const b = await el.boundingBox(); await toucher(cdp, b.x + b.width / 2, b.y + b.height / 2); await sleep(300); await el.focus(); await page.keyboard.type(v, { delay: 60 }); await sleep(500); };
const curseur = async (dx, nom) => { await tapRe('^Date :'); const sl = await page.evaluate(() => { const s = [...document.querySelectorAll('[role=slider]')].find((e) => e.getBoundingClientRect().width > 0); const r = s.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sl.x, y: sl.y, id: 1 }] }); await sleep(150); for (let i = 1; i <= 30; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: Math.round(sl.x + (i * dx) / 30), y: sl.y, id: 1 }] }); await sleep(40); } await sleep(300); await photo(page, nom + '-pendant'); log(nom, 'pendant', await etat()); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(900); await photo(page, nom + '-lache', true); log(nom, 'lâché', await etat()); };
// G1 : titre par défaut suit-il le curseur ? Achat puis Autre entrée
await ouvrirSorte('Achat'); log('G1 achat forme', await etat()); await montant('0,40'); await curseur(-60, 'G1-achat');
await ouvrirSorte('Autre', 1); log('G1b autre entrée', await etat()); await curseur(-90, 'G1b-autre');
// G2 : liste des comptes (Autre entrée)
const c = await tapRe('^Compte de paiement'); await sleep(600); await photo(page, 'G2-comptes'); log('G2 comptes', (await o.b()).slice(-12));
const e = await tapRe('Espèces', 'button,[role=option],[role=radio],li'); await sleep(600); await photo(page, 'G2b-compte-choisi', true); log('G2b', await vis('button', '^Compte de paiement'));
// G3 : Mon mois touché
const mm = await vis('button,[role=button],div', '^¦?Mon mois'); log('G3 mon mois', mm);
await toucher(cdp, 80, 830); await sleep(1200); await photo(page, 'G3-mon-mois'); log('G3 après toucher', (await texte(page)).slice(-500).replace(/\n/g, ' ¦ '));
await fermerTout();
// G4 : changer de sorte en gardant le montant
await ouvrirSorte('Vente'); await montant('0,70'); await tapRe('^¦?changer$'); await sleep(900); await photo(page, 'G4-changer'); await tapRe('^¦?Achat$'); await sleep(900); await photo(page, 'G4b-apres-changer', true); log('G4 après changer', await etat(), await page.evaluate(() => (document.querySelector('input[aria-label="Montant en CHF"]') || {}).value));
// G5 : échéance (Vente à recevoir)
await ouvrirSorte('Vente'); await montant('0,80'); await tapRe('^¦?À recevoir$'); await sleep(600); const ech = await tapRe("d.ici le|^Échéance"); await sleep(800); await photo(page, 'G5-echeance'); log('G5', ech, (await o.b()).slice(-14));
// G6 : Remboursement et habituel
await ouvrirSorte('Remboursement'); await photo(page, 'G6-remboursement'); log('G6', (await texte(page)).slice(-700).replace(/\n/g, ' ¦ '));
await ouvrirSorte('De ma poche'); await photo(page, 'G6b-habituel', true); log('G6b', await etat());
await fermerTout();
lacher(); process.exit(0);
