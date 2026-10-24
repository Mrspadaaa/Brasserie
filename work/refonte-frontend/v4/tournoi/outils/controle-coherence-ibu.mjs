// D124 (24.10, leçon L13) : la cohérence des IBU d'une ligne de remplaçant. Le conseil rapide du 24.10 sur
// Substituer a recompté sbz7 : la ligne « IBU si 46 g » était calculée avec l'α MINIMAL de la fiche alors
// que la dose qui ramène à 60 IBU part de l'α du LOT : 7 lignes sur 12 fausses (Galaxy ~51 au lieu de
// ~79, donc 51 × 35 / 46 = 39 au lieu de 60). Ni le critique ni COMMUN ne l'ont vu.
//
// Règle (au rendu, 390 × 844, tactile) : pour chaque ligne de remplaçant qui affiche à la fois un IBU à la
// dose de la référence (46 g de Nugget) et une dose pour l'IBU cible (60) :
//   1. IBU46 × dose / 46 = cible ± 2 (l'IBU à grammes égaux et la dose « pour 60 » disent la même chose) ;
//      en plage (houblon sans lot, α variétal), le bas de l'IBU va avec le haut de la dose :
//      IBU46_min × dose_max / 46 et IBU46_max × dose_min / 46 sont chacun cible ± 2 ;
//   2. si la ligne affiche un α : IBU46 = cible × α / α de la référence, à ± 10 % (α de la référence lu
//      dans le contexte de la page, « Nugget α 13 % », sinon --alpha-ref=<n>, 13 par défaut). Une plage
//      d'α se compare bout à bout.
// Un IBU et une dose qui s'accordent entre eux mais pas avec l'α (ou l'inverse) sont attrapés : c'est le
// cas de sbz7, dont l'IBU est faux mais la dose juste.
//
// CONTRAT DE MARQUEURS (conseillé aux lots suivants) : sur l'élément de CHAQUE ligne de remplaçant,
//   data-ibu46="51"  ou "51-74" (plage) : l'IBU affiché à la dose de la référence, en nombre ;
//   data-dose="35"   ou "37-54"         : la dose affichée pour l'IBU cible, en grammes ;
//   data-alpha="17.2" ou "11-16"        : l'α affiché (facultatif), en %.
//   Virgule ou point décimal, tiret ou demi-cadratin acceptés. Nom de la ligne : data-houblon, sinon le
//   premier mot de son texte.
// SANS marqueurs : la ligne est lue par son texte. Ligne = élément visible [data-houblon], [data-remplacant],
//   [role=radio], li ou tr, le plus intérieur dont le texte contient les trois lectures ; IBU = « ~46 »,
//   « ~51–74 » ou « 46 IBU » (un nombre suivi de g ou de % n'est pas un IBU) ; dose = le PREMIER « N g »
//   ou « N–M g » de la ligne (le stock, qui vient après, n'est pas lu) ; α = « α 9,6 » ou « α 11–16 ».
//   Les éléments sous [data-role=contexte], [data-role=fiche] ou .z-orig (la référence elle-même) sont écartés.
// UNE PAGE SANS AUCUNE LIGNE LISIBLE ÉCHOUE (jamais « OK 0 ligne », L13).
//
// Usage : node controle-coherence-ibu.mjs <dossier> [ids…] [--page=etat.html] [--cible=60] [--dose=46]
//   [--alpha-ref=13] ; une ligne par ligne incohérente (« Galaxy : 51 × 35 / 46 = 39, attendu 60 ± 2 »),
//   puis « COHERENCE-IBU OK (n lignes) » (code 0) ou « COHERENCE-IBU ECHEC (k/n) » (code 1).
// Témoins : négatif sbz7 tel quel (fils24-substituer, α minimal : 6 lignes sur 12 relevées, Nelson Sauvin à 46 contre 44 reste dans les tolérances) et
// temoins/coherence-ibu-ko ; positif temoins/coherence-ibu-ok (trois lignes justes, dont une lue par le texte).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const pos = args.filter((a) => !a.startsWith('--'));
const dir = path.resolve(pos[0] || '.');
const only = pos.slice(1);
const opt = (nom, defaut) => { const a = args.find((x) => x.startsWith('--' + nom + '=')); return a ? a.slice(nom.length + 3).trim().replace(',', '.') : String(defaut); };
const pg = opt('page', 'etat.html');
const CIBLE = Number(opt('cible', 60));
const DOSE = Number(opt('dose', 46));
const ALPHA_REF_OPT = opt('alpha-ref', '');
if (!(CIBLE > 0) || !(DOSE > 0)) { console.error('COHERENCE-IBU : --cible et --dose doivent être des nombres positifs'); process.exit(2); }
const TOL_IBU = 2;
const TOL_ALPHA = 0.1;
const ids = (only.length ? only : fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, pg)))).sort();

const lire = ({ ALPHA_REF_OPT }) => {
  const vis = (e) => !!e && e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0;
  const N = '(\\d+(?:[.,]\\d+)?)';
  const RANGE = N + '(?:\\s*[–-]\\s*' + N + ')?';
  const num = (s) => Number(String(s).replace(',', '.'));
  const paire = (m, i = 1) => (m && m[i] ? [num(m[i]), m[i + 1] ? num(m[i + 1]) : num(m[i])] : null);
  const marque = (v) => {
    if (v == null || v === '') return null;
    const m = String(v).match(new RegExp('^\\s*' + RANGE + '\\s*$'));
    return paire(m);
  };
  const reIbu1 = new RegExp(RANGE + '\\s*IBU', 'u');
  const reIbu2 = new RegExp('~\\s*' + RANGE + '(?![\\d.,])(?!\\s*g(?![\\p{L}]))(?!\\s*%)', 'u');
  const reDose = new RegExp('(?<![\\d.,~])~?\\s*' + RANGE + '\\s*g(?![\\p{L}])', 'u');
  const reAlpha = new RegExp('α\\s*' + RANGE, 'u');
  const exclu = (e) => !!e.closest('[data-role="contexte"], [data-role="fiche"], .z-orig');
  const nomDe = (e) => e.getAttribute('data-houblon') || (e.innerText || '').trim().split(/\s|\n/)[0] || '?';
  const lignes = [];
  // 1. contrat de marqueurs
  const marques = [...document.querySelectorAll('[data-ibu46][data-dose]')].filter((e) => vis(e) && !exclu(e));
  for (const e of marques) {
    lignes.push({ nom: nomDe(e), ibu: marque(e.getAttribute('data-ibu46')), dose: marque(e.getAttribute('data-dose')), alpha: marque(e.getAttribute('data-alpha')), source: 'marqueurs', brut: [e.getAttribute('data-ibu46'), e.getAttribute('data-dose')] });
  }
  // 2. lecture par le texte, hors des éléments déjà lus par marqueurs
  const candidats = [...document.querySelectorAll('[data-houblon], [data-remplacant], [role="radio"], li, tr')].filter((e) => vis(e) && !exclu(e) && !e.matches('[data-ibu46][data-dose]') && !e.closest('[data-ibu46][data-dose]'));
  const lisible = (e) => { const t = e.innerText || ''; return reDose.test(t) && (reIbu1.test(t) || reIbu2.test(t)); };
  const bons = candidats.filter(lisible);
  const interieurs = bons.filter((e) => !bons.some((x) => x !== e && e.contains(x)));
  for (const e of interieurs) {
    const t = e.innerText;
    const mi = t.match(reIbu1) || t.match(reIbu2);
    lignes.push({ nom: nomDe(e), ibu: paire(mi), dose: paire(t.match(reDose)), alpha: paire(t.match(reAlpha)), source: 'texte' });
  }
  // α de la référence : option, sinon « α 13 % » du contexte, sinon 13
  let alphaRef = ALPHA_REF_OPT ? Number(ALPHA_REF_OPT) : NaN;
  if (!(alphaRef > 0)) {
    const ctx = document.querySelector('[data-role="contexte"], .z-orig');
    const m = ctx && (ctx.innerText || '').match(new RegExp('α\\s*' + N));
    alphaRef = m ? num(m[1]) : 13;
  }
  return { lignes, alphaRef };
};

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
let total = 0;
let fausses = 0;
const sortie = [];
const fmt = (n) => String(Math.round(n * 10) / 10).replace('.', ',');
for (const id of ids) {
  const file = path.join(dir, id, pg);
  if (!fs.existsSync(file)) { sortie.push(id + ' ' + pg + ' : page absente'); total += 1; fausses += 1; continue; }
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(file).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
  const { lignes, alphaRef } = await page.evaluate(lire, { ALPHA_REF_OPT });
  await page.close();
  if (!lignes.length) {
    sortie.push(id + ' ' + pg + ' : aucune ligne de remplaçant lisible (ni data-ibu46 + data-dose, ni « ~IBU » et « N g » dans le texte d\'une ligne)');
    total += 1; fausses += 1;
    continue;
  }
  for (const l of lignes) {
    total += 1;
    const f = [];
    if (!l.ibu || !l.dose) { f.push(l.nom + ' : ' + l.source + ' illisible (IBU ' + JSON.stringify(l.brut?.[0] ?? l.ibu) + ', dose ' + JSON.stringify(l.brut?.[1] ?? l.dose) + ')'); }
    else {
      const [i0, i1] = l.ibu;
      const [d0, d1] = l.dose;
      // le bas de l'IBU va avec le haut de la dose (moins d'α : plus de grammes)
      const bornes = [[i0, d1], [i1, d0]];
      const vus = new Set();
      for (const [i, d] of bornes) {
        const v = (i * d) / DOSE;
        if (Math.abs(v - CIBLE) > TOL_IBU + 1e-9 && !vus.has(fmt(v))) { vus.add(fmt(v)); f.push(l.nom + ' : ' + fmt(i) + ' × ' + fmt(d) + ' / ' + fmt(DOSE) + ' = ' + fmt(v) + ', attendu ' + fmt(CIBLE) + ' ± ' + TOL_IBU); }
      }
      if (l.alpha) {
        const [a0, a1] = l.alpha;
        const att = [(CIBLE * a0) / alphaRef, (CIBLE * a1) / alphaRef];
        [[i0, att[0], a0], [i1, att[1], a1]].forEach(([affiche, attendu, a], k) => {
          if (k === 1 && i1 === i0 && a1 === a0) return;
          const ecart = Math.abs(affiche - attendu) / attendu;
          if (ecart > TOL_ALPHA + 1e-9) f.push(l.nom + ' : α ' + fmt(a) + ' donne ~' + fmt(attendu) + ' IBU à ' + fmt(DOSE) + ' g (α de la référence ' + fmt(alphaRef) + ' pour ' + fmt(CIBLE) + '), la ligne affiche ' + fmt(affiche) + ' (écart ' + Math.round(100 * ecart) + ' %, tolérance ' + Math.round(100 * TOL_ALPHA) + ' %)');
        });
      }
    }
    if (f.length) { fausses += 1; for (const x of f) sortie.push((ids.length > 1 ? id + ' ' : '') + x); }
  }
}
await browser.close();
for (const x of sortie) console.log(x);
if (fausses) { console.log('COHERENCE-IBU ECHEC (' + fausses + '/' + total + ')'); process.exit(1); }
console.log('COHERENCE-IBU OK (' + total + ' lignes)');
