// node jouer.mjs <code> <tuile> <k> <json options>  — joue une sorte d'écriture, captures à chaque geste
// options : nom, montant, aPayer, sens ('in'|'out'), dx (glisser du curseur, px), compte, cat, tiers (bool), revient, duree, mois (bool : ouvrir Mon mois), enregistrer
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils, texte } from './commun.mjs';
const [code, tuile, kk, optJ] = process.argv.slice(2); const k = +kk; const opt = JSON.parse(optJ || '{}');
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
setTimeout(() => { log(code, 'DÉLAI'); lacher(); process.exit(2); }, 280000);
const N = (s) => `${code}-${s}`;
const etat = () => page.evaluate(() => {
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const bs = [...document.querySelectorAll('button')].filter(vis).filter((b) => b.getBoundingClientRect().top > 40);
  const g = (re) => { const b = bs.find((x) => re.test((x.getAttribute('aria-label') || '') + ' ' + x.textContent)); return b ? ((b.getAttribute('aria-label') || '') + ' ¦ ' + b.textContent.trim()).slice(0, 90) : '-'; };
  const fin = bs.filter((b) => b.getBoundingClientRect().top > 760).pop();
  const nom = bs.find((b) => /^Nom/.test(b.getAttribute('aria-label') || ''));
  const s = [...document.querySelectorAll('[role=slider]')].find(vis);
  return { titre: nom ? nom.textContent.trim().slice(0, 50) : '-', date: g(/^Date :/), curseur: s ? s.getAttribute('aria-valuetext') : '-', mois: g(/Mon mois/), fin: fin ? fin.textContent.trim() : '-', compte: g(/Moyen de paiement|Compte|d’ici|d'ici/), statut: [g(/Payé aujourd|Reçu aujourd|^ ¦ Payé$|^ ¦ Reçu$/), g(/À payer|À recevoir/)].join(' / '), montant: (document.querySelector('input[aria-label="Montant en CHF"]') || {}).value };
});
const pas = async (nom, demi = true) => { await sleep(700); await photo(page, N(nom), demi); const e = await etat(); log(N(nom), e); return e; };
const saisir = async (sel, val) => { const el = await page.$(sel); if (!el) { log(N('CHAMP ABSENT'), sel); return false; } const b = await el.boundingBox(); if (!b) { log(N('CHAMP CACHE'), sel); return false; } await toucher(cdp, b.x + b.width / 2, b.y + b.height / 2); await sleep(300); await el.focus(); await page.keyboard.type(val, { delay: 60 }); await sleep(500); return true; };
const filtre = (l) => l.filter((x) => !/(Synthèse|Opérations|Prévisions|Annuel|Période|Rechercher|tableau de bord|Nettoyage \d|Brassage \d|Autres frais|Matériel 5|Pourquoi|Revoir|Solde et|Confirmer les|Vérifier les|Date à corriger|paiements historiques|^Bord|^Finances|^Calendrier|^Brassins|^Stocks|^Clients|^sept|^oct|^nov|^tout|Autre période|Plus : )/.test(x));
const fermerSous = async () => { const f = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].filter((x) => /^Fermer$/.test(x.getAttribute('aria-label') || '') && x.getBoundingClientRect().top > 60 && x.getBoundingClientRect().width > 0).pop(); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); if (f) { await toucher(cdp, f.x, f.y); await sleep(600); } return !!f; };
// ouvrir la feuille (fermer ce qui traîne)
for (let i = 0; i < 3; i++) { const f = await ou(page, 'Fermer', 'button'); if (f && f.t < 40) { await toucher(cdp, f.x, f.y); await sleep(600); } }
await o.nav('Finances');
await o.tap('Actions rapides'); await sleep(800); await o.tap('Écriture, à la main'); await sleep(1200);
const r = await page.evaluate((s, k) => { const els = [...document.querySelectorAll('button')].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.top > 60 && b.closest('[role=dialog]') && (b.textContent || '').trim().startsWith(s); }); const e = els[k]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, tuile, k);
await toucher(cdp, r.x, r.y); await sleep(1200);
await pas('00-forme', false);
log(N('boutons'), filtre(await o.b()));
// 1 titre
const crayon = await ou(page, 'Nom, facultatif', 'button');
if (crayon) { await toucher(cdp, crayon.x, crayon.y); await sleep(600); await page.keyboard.type(`ZZ TEST — ${opt.nom || tuile}`, { delay: 30 }); await page.keyboard.press('Enter'); await pas('01-titre'); } else log(N('PAS DE CRAYON'));
// 2 montant
await saisir('input[aria-label="Montant en CHF"]', String(opt.montant || 3)); await pas('02-montant', false);
// 3 statut
if (opt.aPayer) { await o.tap(opt.sens === 'in' ? 'À recevoir' : 'À payer', 'button'); await pas('03-a-payer', false); }
// 4 date : pastille puis curseur, glisser lent
await o.tap('Date :', 'button'); await sleep(800);
const sl = await page.evaluate(() => { const s = [...document.querySelectorAll('[role=slider]')].find((e) => e.getBoundingClientRect().width > 0); if (!s) return null; const r = s.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; });
await pas('04-date-ouverte');
if (sl) {
  const dx = opt.dx ?? -40;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sl.x, y: sl.y, id: 1 }] }); await sleep(150);
  for (let i = 1; i <= 30; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: Math.round(sl.x + (i * dx) / 30), y: sl.y, id: 1 }] }); await sleep(40); }
  await sleep(300); await pas('05-curseur-pendant', false);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(900);
  await pas('06-curseur-lache', false);
} else log(N('PAS DE CURSEUR'));
// 5 compte
const cpt = await ou(page, 'Compte de paiement', 'button');
if (cpt) { await toucher(cdp, cpt.x, cpt.y); await sleep(800); await pas('08-compte-ouvert', false); log(N('comptes'), filtre(await o.b()).slice(-12)); if (opt.compte) await o.tap(opt.compte); else await fermerSous(); await pas('09-compte'); }
// 6 catégorie
if (opt.cat) { await o.tap(opt.cat, 'button'); await pas('10-categorie'); }
// 7 tiers (+ autre) : ouvert puis abandonné
if (opt.tiers !== false) { const autre = await ou(page, 'autre', 'button'); if (autre && autre.t > 200 && autre.t < 340) { await toucher(cdp, autre.x, autre.y); await sleep(800); await pas('11-tiers-ouvert', false); log(N('tiers'), filtre(await o.b()).slice(-8)); if (!(await fermerSous())) { await toucher(cdp, 195, 30); await sleep(500); } await pas('12-tiers-ferme'); } }
// 8 revient
if (opt.revient) { await o.tap(opt.revient, 'button'); await pas('13-revient', false); if (opt.duree) { await o.tap(opt.duree, 'button'); await pas('14-duree', false); } }
// 9 TVA, référence / note / justificatif
for (const f of ['TVA, référence', 'Note']) { const x = await ou(page, f, 'button,summary,[role=button]'); if (x) { await toucher(cdp, x.x, x.y); await sleep(600); } }
await pas('15-depliee', false);
log(N('champs'), await page.evaluate(() => [...document.querySelectorAll('input,textarea,[role=checkbox],[role=switch]')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => `${e.type || e.getAttribute('role')} «${e.getAttribute('aria-label') || e.placeholder || ''}» ${e.checked ?? ''}`)));
log(N('boutons-depliee'), filtre(await o.b()));
if (!(await saisir('input[aria-label="Référence"]', 'ZZ-REF'))) await saisir('input[aria-label="Période, référence"]', 'ZZ-REF');
await saisir('input[aria-label="Note"]', 'ZZ note');
if (opt.case) await o.tap(opt.case, 'button,label,[role=checkbox]');
await toucher(cdp, 195, 30); await sleep(400);
await pas('16-avant-enregistrer', false);
await page.evaluate(() => { for (const e of document.querySelectorAll('*')) if (e.scrollHeight > e.clientHeight + 20 && getComputedStyle(e).overflowY !== 'visible') e.scrollTop = 9999; });
await pas('17-bas', false);
if (opt.mois) { await o.tap('Mon mois', 'button'); await sleep(900); await pas('17b-mon-mois', false); await fermerSous(); }
if (opt.enregistrer !== false) {
  const fin = await page.evaluate(() => { const bs = [...document.querySelectorAll('button')].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.top > 760 && r.top < 800; }); const b = bs[bs.length - 1]; if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: b.textContent.trim(), dis: b.disabled }; });
  log(N('enregistrer'), fin);
  if (fin && !/Clients|Mon mois/.test(fin.t)) { await toucher(cdp, fin.x, fin.y); await sleep(1800); await pas('18-fin', false); log(N('fin-boutons'), filtre(await o.b()).slice(-10)); log(N('fin-texte'), (await texte(page)).slice(-400).replace(/\n/g, ' ¦ ')); }
  else log(N('PAS ENREGISTRE'));
}
{ const f = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Fermer' && x.getBoundingClientRect().top > 700); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); if (f) { await toucher(cdp, f.x, f.y); await sleep(900); } }
lacher(); process.exit(0);
