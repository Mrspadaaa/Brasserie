// Lot 21 · s3b · copie du socle de s1–s3 (laissé intact), retouchée pour la seconde passe : lecture H de
// Lafontaine 2018 « vérifiée (K) », bande sans capuchons (une seule marque de borne partielle), stock en icône,
// réserves du moteur sans « à vérifier ». Ancienne tête :
// Lot 21 · socle commun de s1, s2 et s3 (profil aromatique simulé, simulateurs). Côté serveur :
//   - les données : le vrai fichier du moteur profil-simule (fils21-choisir/donnees/profils-simules.json)
//     s'il existe, sinon le stub de s1 (marqué "stub": true) ; elles sont normalisées puis injectées dans la
//     page (SIMDATA) pour le moteur du navigateur (sim-runtime.js) ;
//   - la baseline (plancher, pas plafond) : pictos au trait de l5e (le même <symbol>), « au style » par
//     défaut, α du lot puis plage des fiches, usage en mot, légende derrière « ? », vraie fiche à l'appui
//     long, au langage de la page (D25, D87 à D93) ;
//   - l'enrichissement : familles avec leur nom (jamais un picto seul), bandes d'incertitude sans rognure,
//     rapports au seuil en bande logarithmique (L3), biotransformation, mots de confiance.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as T from '../../fils18-baseline/l5e/tuiles-l5e.mjs';

export const { K } = T;
const { J, NOM, COURT, ORDRE, ico, esc, SYM, DB, MOMENT } = K;
export { J, NOM, COURT, ORDRE, ico, esc, MOMENT };
export const ICI = path.dirname(fileURLToPath(import.meta.url));
export const D21 = path.dirname(ICI);
export const rgba = T.rgba;
export const picto = T.picto;

// ---------- les données ----------
const VRAI = path.join(D21, 'donnees', 'profils-simules.json');
const STUB = path.join(ICI, 'profils-simules.stub.json');
export function charger() {
  const f = fs.existsSync(VRAI) ? VRAI : STUB;
  const P = JSON.parse(fs.readFileSync(f, 'utf8'));
  return { P, stub: !!P.stub, fichier: path.relative(D21, f).replace(/\\/g, '/') };
}
// Les données injectées dans la page : compactes (un tableau [bas, centre, haut] par famille, dans l'ordre).
// Le format du moteur profil-simule (profils-simules-v1) : chaque famille en { bas, centre, haut, crans,
// largeur, source, hautPartiel } (objet) ou [bas, centre, haut, crans, largeur, hautPartiel] (tableau).
export const LEV = { 'fermentis-us05': 'US-05', 'lalbrew-pomona': 'Pomona', 'lalbrew-verdant-ipa': 'Verdant', 'lalbrew-diamond': 'Diamond' };
const LEV_ID = Object.fromEntries(Object.entries(LEV).map(([k, v]) => [v, k]));
export { LEV_ID };
const COR = JSON.parse(fs.readFileSync(K.REPO + '/prototypes/houblons-v4/data/correspondance-familles.json', 'utf8'));
// Une famille : [bas, centre, haut, partiel (1 : borne haute partielle), inconnu (1 : rien de simulé)].
const t5 = (v) => {
  if (!v) return [0, 0, 0, 0, 1];
  if (Array.isArray(v)) return [v[0], v[1], v[2], v[5] ? 1 : 0, v[2] === 0 && v[1] === 0 ? 1 : 0];
  return [v.bas, v.centre, v.haut, v.hautPartiel && (v.hautPartiel === true || v.hautPartiel.length) ? 1 : 0, v.inconnu || (v.haut === 0 && v.centre === 0) ? 1 : 0];
};
// Les houblons montrés : ceux du brasseur ; leurs vraies valeurs viennent du cas où ils sont seuls.
export const HB_PAGE = ['Citra', 'Galaxy', 'Idaho 7', 'Cascade'];
const CAS_SEUL = { Citra: 'K2-citra', Galaxy: 'K2-galaxy', 'Idaho 7': 'K2-idaho-7', Cascade: 'K1-cascade-dryPost' };
export function simdata(P) {
  const F = ORDRE;
  const pf = P.echelle.parFamille;
  const ech = Object.fromEntries(F.map((f) => [f, { lo: pf[f].bande[0], hi: pf[f].bande[1], cran: pf[f].cran, courbe: pf[f].courbe }]));
  const A = COR.courbes.ancre;
  const courbe = Object.fromEntries(F.map((f) => { const Kc = COR.courbes[{ agrumes: 'agrumes', intensite: 'intensite', herbace: 'herbace' }[pf[f].courbe]].K; return [f, { K: Kc, c: A.points * (A.doseGL + Kc) / A.doseGL }]; }));
  const tri = (p) => F.map((f) => t5(p[f]));
  const G = {}, GC = {}, GD = {};
  let maxCr = 4, maxP = 60;
  const voir = (pr) => pr.forEach((t, i) => { maxCr = Math.max(maxCr, (t[2] - ech[F[i]].lo) / ech[F[i]].cran, (t[1] - ech[F[i]].lo) / ech[F[i]].cran); maxP = Math.max(maxP, t[2], t[1]); });
  const HBs = [...new Set(P.grille.map((e) => e.nom))].filter((h) => HB_PAGE.includes(h));
  for (const e of P.grille) {
    if (!HB_PAGE.includes(e.nom)) continue;
    const k = [e.nom, e.moment, e.dose_gL, e.jours == null ? '' : e.jours, LEV[e.levure] || e.levure].join('|');
    G[k] = tri(e.apres); GC[k] = e.confiance; GD[k] = e.drapeaux; voir(G[k]);
  }
  const PA = {};
  for (const e of P.grillePaires || []) { if (!e.noms.every((n) => HB_PAGE.includes(n))) continue; const k = [[...e.noms].sort().join('+'), e.moment, e.doses_gL.join('+'), e.jours, LEV[e.levure] || e.levure].join('|'); PA[k] = tri(e.apres); voir(PA[k]); }
  const avant = tri(P.biere.avant); voir(avant);
  const degust = F.map((f) => (P.biere.avant[f] && P.biere.avant[f].source === 'dégustation' ? 1 : 0));
  const mesures = Object.fromEntries(HB_PAGE.map((h) => { const c = P.cas.find((x) => x.id === CAS_SEUL[h]); return [h, c ? c.mesures.filter((m) => m.houblon === h || (h === 'Citra' && /^Citra cryo/.test(m.houblon || ''))) : []]; }));
  const txt = (x) => (typeof x === 'string' && P.textes && P.textes[x] ? P.textes[x] : x);
  const cas = P.cas.filter((c) => ['K1', 'K2', 'K3', 'K4', 'K5'].includes(c.groupe)).map((c) => ({ id: c.id, groupe: c.groupe, titre: c.titre,
    ajouts: c.ajouts.map((a) => ({ houblon: a.nom, moment: a.moment, dose_gL: a.dose_gL, jourDebut: a.jourDebut, jours: a.jours })), levure: LEV[c.levure] || c.levure,
    apres: tri(c.apres), confiance: c.confiance.niveau, drapeaux: [...new Set(c.drapeaux.map((d) => d.id))] }));
  const DR = {};
  for (const c of P.cas) for (const d of c.drapeaux) if (!DR[d.id]) DR[d.id] = { titre: txt(d.titre), statut: txt(d.statut), sources: d.sources };
  return {
    stub: false, F, ech, courbe, maxCr: Math.ceil(maxCr), maxP: Math.ceil(maxP / 10) * 10, avant, degust,
    axes: { houblon: HBs, moment: ['b60', 'b10', 'wp', 'dryActive', 'dryPost'], dose_gL: [...new Set(P.grille.map((e) => e.dose_gL))].sort((x, y) => x - y), jours: [...new Set(P.grille.map((e) => e.jours).filter((j) => j != null))].sort((x, y) => x - y), levure: ['US-05', 'Pomona', 'Verdant', 'Diamond'], levureGrille: [...new Set(P.grille.map((e) => LEV[e.levure]))] },
    grille: G, gconf: GC, gdrap: GD, paires: PA, mesures, cas, drapeaux: DR,
    couleurs: COUL, court: Object.fromEntries(F.map((f) => [f, COURT[f]])), nom: Object.fromEntries(F.map((f) => [f, NOM[f]])),
    base: Object.fromEntries(F.map((f) => [f, J[f].base])), texte: Object.fromEntries(F.map((f) => [f, J[f].texte])),
    mention: txt(P.mention), statutEchelle: P.echelle.statut,
  };
}

// ---------- les houblons : couleur (celle du lot 20, une par houblon), fiche de la base ----------
export const COUL = { Citra: '#184078', Galaxy: '#681878', 'Idaho 7': '#e80030', Cascade: '#781838', Nugget: '#2b68da' };
// La fiche de la base pour chaque nom de la page. Citra : le cas parle des pellets ; la base n'a que la fiche
// « Citra cryo », dont les plages d'α et d'arôme sont celles du Citra en pellets (Beer Maverick).
const BASE_DE = { Citra: 'Citra cryo', Galaxy: 'Galaxy', 'Idaho 7': 'Idaho 7', Cascade: 'Cascade', Nugget: 'Nugget' };
export const HOUBLONS = Object.keys(BASE_DE);
const fr = (x) => String(x).replace('.', ',');
const pct = (x) => fr(x) + '%';
const plage = (a, b) => (a === b ? pct(a) : fr(a) + '–' + pct(b));
const LIVRE = ico('i-livre', 12), DIFF = ico('i-diff', 12, 'class="dif"');
export { LIVRE };

// L'α au langage de la baseline (D87) : le lot en stock d'abord ; sans lot, la plage des fiches après le petit
// livre. Une vraie valeur : data-nature="mesure", data-source.
export function alpha(nom, o = {}) {
  const F = K.fiche(BASE_DE[nom]);
  const lot = nom === 'Citra' ? null : F.lot;
  const srcs = F.alpha;
  const pl = srcs.length ? plage(Math.min(...srcs.map((s) => s.min)), Math.max(...srcs.map((s) => s.max))) : '';
  const hors = lot != null && srcs.length && srcs.every((s) => lot < s.min || lot > s.max);
  const dh = o.sansHoublon ? '' : ` data-houblon="${esc(nom)}"`;
  if (lot != null) return `<span class="al lot" data-role="alpha" data-source="lot" data-nature="mesure"${dh} role="img" aria-label="α du lot en stock de ${esc(nom)} : ${fr(lot)} %${hors ? ', hors des plages de ses fiches (' + pl + ')' : pl ? ', ses fiches : ' + pl : ''}">${pct(lot)}${hors ? DIFF : ''}</span>`;
  return `<span class="al af" data-role="alpha" data-source="fiches" data-nature="mesure"${dh} role="img" aria-label="α de ses fiches${nom === 'Citra' ? ' (Citra en pellets ; mon stock est du cryo à 24,8 %)' : ''} : ${pl}">${LIVRE}${pl}</span>`;
}
// L'usage en mot (D90), comme l5e : pleine si un fournisseur l'atteste, en contour si déduite de l'α.
export function usage(nom) {
  const F = K.fiche(BASE_DE[nom]);
  return T.usage({ houblon: nom, role: F.role ? F.role.v : 'inconnu', roleSource: F.role ? F.role.src : '' });
}
export const huileFiche = (nom) => K.fiche(BASE_DE[nom]).huiles;
export function stock(nom) {
  const lot = nom === 'Citra' ? null : K.fiche(BASE_DE[nom]).lot;
  const k = lot != null ? 'suffisant' : 'à acheter';
  return `<span class="stk" role="img" aria-label="${K.STOCK_MOT[k]}${nom === 'Citra' ? ' (en stock : Citra cryo)' : ''}">${ico(K.STOCK_ICO[k], 14)}</span>`;
}

// ---------- la fiche, au langage de la page (D93, D25) : copie adaptée de l5e ----------
const HCF = 24;
function barresFiche(F) {
  const par = Object.fromEntries(F.aromes.map((x) => [x.f, x]));
  const of = (F.aromes[0] || {}).of || 0;
  const col = (f, k) => {
    const x = par[f], n = x ? x.n : 0, sep = k === DB.attendues.length ? ' sep' : '';
    if (!n) return `<span class="mb fi-mb nd${sep}" data-famille="${f}" role="img" aria-label="${NOM[f]} : non décrit par ses fiches"><span class="mb-z"><i class="mb-i"></i></span>${picto(f, 14)}</span>`;
    const h = Math.max(5, n / of * HCF);
    return `<span class="mb fi-mb ${n >= 2 ? 'mq' : 'ci'}${sep}" data-famille="${f}" role="img" aria-label="${NOM[f]} : ${of === 1 ? 'cité par sa seule fiche' : n + ' fiches sur ' + of}" style="--c:${J[f].base};--cf:${rgba(J[f].base, 0.4)};--hc:${HCF}px"><span class="mb-z"><i class="mb-b" style="--s:${h.toFixed(1)}px;--a:${h.toFixed(1)}px"></i></span>${picto(f, 14)}</span>`;
  };
  const seule = of === 1 ? (F.aromes.find((x) => x.n) || { auteurs: [] }).auteurs[0] : null;
  return `<div class="fi-bars"><span class="fi-bars-c" aria-label="Les familles citées par les fiches">${DB.ordre.map(col).join('')}</span>${seule ? `<span class="fi-seule">1 seule fiche : ${esc(seule)}</span>` : ''}</div>`;
}
function lignesFiche(F) {
  const par = Object.fromEntries(F.aromes.map((x) => [x.f, x]));
  return DB.ordre.filter((f) => par[f] && par[f].n > 0).map((f) => {
    const x = par[f], cpt = x.of === 1 ? '' : x.n + '/' + x.of;
    const mots = [...new Set((x.mots || []).flatMap((m) => m.mots).map((w) => w.toLowerCase()))];
    return `<div class="fi-lab" data-explique="${f}">${picto(f, 16)}<span class="fi-lab-t"><span class="fi-lab-n" style="--t:${J[f].texte}">${COURT[f]}</span>${cpt ? ` <span class="fi-cpt nb">${cpt}</span>` : ''}${mots.length ? `${cpt ? ' <span class="fi-sep" aria-hidden="true">·</span>' : ''} <span class="fi-mots">${esc(mots.join(', '))}</span>` : ''}</span></div>`;
  }).join('');
}
function alphaFiche(F, nom) {
  const srcs = [...F.alpha].sort((a, b) => (a.an || 0) - (b.an || 0));
  const lotV = nom === 'Citra' ? null : F.lot;
  const hors = lotV != null && srcs.length && srcs.every((s) => lotV < s.min || lotV > s.max);
  const lot = lotV != null ? `<span class="al lot" data-role="alpha" data-source="lot" data-nature="mesure" role="img" aria-label="α du lot en stock : ${fr(lotV)} %${hors ? ' ; hors des plages de ses fiches' : ''}">${pct(lotV)}${hors ? DIFF : ''}</span>` : '';
  const fi = srcs.length ? `<span class="al af" data-role="alpha" data-source="fiches" data-nature="mesure" role="img" aria-label="α de ses fiches : ${srcs.map((s) => plage(s.min, s.max).replace('%', ' %') + ' (' + s.src + (s.an ? ' ' + s.an : '') + ')').join(', ')}">${LIVRE}${srcs.map((s) => plage(s.min, s.max)).join(' · ')}${nom === 'Citra' ? '<span class="pel">pellets</span>' : ''}</span>` : '';
  return `<span class="fi-alpha" data-role="fiche-alpha">${lot}${fi}</span>`;
}
const FICHES = {};
for (const nom of HOUBLONS) {
  const P = K.ficheParts(BASE_DE[nom], { roue: { W: 330, id: nom.replace(/\W+/g, ''), gris: '#55555f', grille: '#e3e5eb' }, regFond: '#e9ecf2', regFort: '#16161a', regPale: '#aeb3be', regLot: '#16161a', regLotT: '#fff' });
  const F = P.F;
  const note = nom === 'Citra' ? '<p class="fi-note">Fiche de Citra en pellets ; mon stock est du cryo (α 24,8 %).</p>' : P.note;
  FICHES[nom] = `<div class="fi-voile" data-k="voile" aria-hidden="true"></div>
  <section class="fi" data-role="fiche" role="dialog" tabindex="-1" aria-label="Fiche de ${esc(nom)}">
    <div class="fi-poignee" aria-hidden="true"></div>
    <header class="fi-t"><h2>${esc(nom)}</h2>${usage(nom).replace(/ data-houblon="[^"]*"/, '')}<button class="fi-x" data-role="fermer-fiche" data-k="fermer" aria-label="Fermer la fiche de ${esc(nom)}">${ico('i-x', 16)}</button></header>
    <div class="w fi-duo">${alphaFiche(F, nom)}${P.reglette}${note}</div>
    <div class="w w-ar" data-role="fiche-arome">${barresFiche(F)}${lignesFiche(F)}${P.sans}${P.nd}<div class="fi-r">${P.roue}</div></div>
    <div class="fi-act"><span class="fi-g" role="group" data-role="gout" aria-label="Mon goût pour ${esc(nom)}"><button data-k="aimer" aria-pressed="false" aria-label="Aimer ${esc(nom)}">${ico('i-heart', 16)}</button><button data-k="exclure" aria-pressed="false" aria-label="Exclure ${esc(nom)}">${ico('i-ban', 16)}</button></span><button class="fi-b" data-k="comparer" aria-label="Comparer ${esc(nom)} à d'autres houblons">Comparer</button></div>
    <div class="fi-replis" role="group" aria-label="Détail de la fiche">${P.sections.map(([id, t]) => `<button data-k="repli" data-sec="${id}" aria-expanded="false">${t}${ico('i-chev-d', 14)}</button>`).join('')}</div>
    ${P.sections.map(([id, t, corps]) => `<div class="w fi-sec" data-sec-corps="${id}" hidden aria-label="${t}">${corps}</div>`).join('')}
  </section>`;
}
export const FICHE_JS = `
const FICHES = ${JSON.stringify(FICHES)};
function rendFiche(nom, mode) {
  RACINE.className = 'mode-' + mode;
  RACINE.innerHTML = mode === 'bulle' ? FICHES[nom].replace(/<div class="fi-voile"[^>]*><\\/div>/, '') : FICHES[nom];
}
${K.GESTE_JS}
// « Voir la fiche » visible (I, piège 12 : l'appui long seul est un geste invisible) : un toucher l'ouvre.
document.addEventListener('click', (e) => { const b = e.target.closest('[data-fiche]'); if (!b || !FICHES[b.dataset.fiche]) return; e.preventDefault(); ouvrirFiche(b.dataset.fiche, { source: b, mode: innerWidth >= 700 ? 'bulle' : 'feuille', epingle: true }); });
`;

// ---------- vraies valeurs : formats ----------
export const sig = (x) => { if (x == null) return '?'; const a = Math.abs(x); const d = a >= 10 ? 0 : a >= 1 ? 1 : Math.max(1, -Math.floor(Math.log10(a)) + 1); return fr(Math.round(x * 10 ** d) / 10 ** d); };
export const NOM_COMP = { '4MMP': '4MMP', linalol: 'linalol', geraniol: 'géraniol', myrcene: 'myrcène', '3MH': '3MH' };

// ---------- vraies valeurs d'un houblon : α, huile, rapports au seuil (bande log), mesures en bière ----------
const LOG0 = -2, LOG1 = 4, LW = 168; // ×0,01 à ×10 000 : un cran de bande = ×10 (28 px)
const lx = (v) => Math.max(0, Math.min(LW, (Math.log10(v) - LOG0) / (LOG1 - LOG0) * LW));
const srcTxt = (s) => (Array.isArray(s) ? s.join(' ') : String(s || ''));
const famC = (fs) => (fs && fs[0] ? fs[0] : 'floral');
export function bandeLog(m, o = {}) {
  const f = famC(m.familles), st = `--c:${J[f].base};--cf:${rgba(J[f].base, 0.35)}`;
  const pis = `<span class="pis">${(m.familles || []).map((x) => picto(x, 14)).join('')}</span>`;
  const nomC = `<span class="rv-k">${NOM_COMP[m.compose] || m.compose}</span>`;
  if (!m.plage || (m.plage[0] == null && m.plage[1] == null)) {
    return `<div class="rv-c" data-nature="mesure" data-source="${esc(srcTxt(m.source))}">${pis}${nomC}<span class="lg inc" aria-hidden="true"></span><span class="mot m-inc" data-inconnu aria-label="rapport au seuil inconnu : ${esc(m.inconnu || '')}">inconnu</span></div>`;
  }
  const [a, b] = m.plage, x0 = a == null ? 0 : lx(a), x1 = b == null ? LW : lx(b);
  const cls = a == null ? ' ouvert-g' : b == null ? ' ouvert-d' : '';
  const txt = a == null ? '≤ ×' + sig(b) : b == null ? '≥ ×' + sig(a) : '×' + sig(a) + '–' + sig(b);
  const lu = a == null ? 'borne basse inconnue, au plus ×' + sig(b) : b == null ? 'au moins ×' + sig(a) + ', borne haute inconnue' : 'de ×' + sig(a) + ' à ×' + sig(b);
  const lecture = (b != null && b < 1) ? 'sous le seuil' : (a != null && a > 1) ? 'au-dessus du seuil' : 'autour du seuil';
  return `<div class="rv-c" data-nature="mesure" data-source="${esc(srcTxt(m.source))}">${pis}${nomC}<span class="lg" data-role="incertitude" style="${st}" role="img" aria-label="${NOM_COMP[m.compose] || m.compose}, rapport au seuil ${lu} : ${lecture}"><i class="lg-b${cls}" style="left:${x0.toFixed(1)}px;width:${Math.max(4, x1 - x0).toFixed(1)}px"></i>${m.central ? `<i class="lg-c" style="left:${lx(m.central).toFixed(1)}px"></i>` : ''}<i class="lg-1" style="left:${lx(1).toFixed(1)}px"></i>${o.seuil ? `<span class="lg-t" style="left:${(lx(1) + 4).toFixed(1)}px">seuil</span>` : ''}</span><span class="rv-v">${txt}</span></div>`;
}
export function huile(m) {
  if (!m || !m.plage) return '';
  const pl = Array.isArray(m.plage) ? { min: m.plage[0], max: m.plage[1] } : m.plage;
  return `<span class="hu-v" data-nature="mesure" data-source="${esc(srcTxt(m.source))}" aria-label="huile totale ${fr(pl.min)} à ${fr(pl.max)} mL pour 100 g">huile <b class="nb">${fr(pl.min)}–${fr(pl.max)}</b> <span class="u">mL/100 g</span></span>`;
}
export function biere(m) {
  const pis = (m.familles || []).map((x) => picto(x, 14)).join('');
  const v = m.plage[0] === m.plage[1] ? fr(m.plage[0]) : fr(m.plage[0]) + '–' + fr(m.plage[1]);
  return `<div class="rv-c mb-biere" data-nature="mesure" data-source="${esc(srcTxt(m.source))}"><span class="pis">${pis}</span><span class="mot m-mes">mesuré</span><span class="rv-k">${NOM_COMP[m.compose] || m.compose}</span><span class="rv-v">${v} ${m.unite}</span><span class="src">${esc((m.texte || '').split(':')[0])}</span></div>`;
}
// Les réserves de la note du moteur (donnees/PROFIL-SIMULE.md), au plus près du houblon.
const RESERVE = {
  Citra: 'le linalol simulé est 2 à 5 fois au-dessus des mesures publiées (E06, E01)',
  'Idaho 7': 'thiols connus en somme seulement : le simulé sort sans doute trop bas',
  Galaxy: '4MMP sans borne haute publiée : le haut peut être plus haut',
};
// Le bloc « vraies valeurs » d'un houblon (une voie : un houblon, son α, sa fiche) ; o.court : sans les rapports.
const COMP_F = { '4MMP': ['tropical', 'berries'], linalol: ['floral', 'citrus'], geraniol: ['floral'], myrcene: ['green', 'resin'], '3MH': ['citrus', 'tropical'] };
// Une mesure « compose » du moteur → une bande de rapport au seuil (vraie valeur calculée des sources).
export const rapportDe = (m) => ({ compose: m.compose, familles: COMP_F[m.compose] || [], source: m.source, inconnu: m.rapport && m.rapport.inconnu,
  plage: m.rapport && m.rapport.plage ? [m.rapport.plage.min, m.rapport.plage.max] : null, central: m.rapport && m.rapport.plage ? m.rapport.plage.central : null });
// Le bloc « vraies valeurs » d'un houblon (une voie : un houblon, son α, sa fiche) ; o.court : sans les rapports.
export function vraies(h, mesures, o = {}) {
  const ms = mesures || [];
  const hu = ms.find((m) => m.type === 'huile');
  const rps = ms.filter((m) => m.type === 'compose' && (o.composes || ['4MMP', 'linalol']).includes(m.compose)).map(rapportDe);
  const dose = ms.find((m) => m.type === 'dose'), jours = ms.find((m) => m.type === 'jours');
  return `<div class="vv" data-voie="${o.n || 1}" data-role="ligne-houblon" data-vraies="${esc(h)}">
      <div class="vv-h"><i class="pt" style="background:${COUL[h]}" data-houblon-compare="${esc(h)}" data-couleur="${COUL[h]}" aria-hidden="true"></i><b class="nm" data-houblon="${esc(h)}">${esc(h)}</b>${usage(h).replace(/ data-houblon="[^"]*"/, '')}${alpha(h, { sansHoublon: true })}${huile(hu)}<button class="vf" data-fiche="${esc(h)}" aria-label="Voir la fiche de ${esc(h)}">fiche${ico('i-chev-r', 12)}</button></div>
      ${RESERVE[h] ? `<p class="vv-res"><span class="mot">réserve du moteur</span>${RESERVE[h]}</p>` : ''}
      ${o.court ? '' : `<div class="rv">${rps.map((m, k) => bandeLog(m, { seuil: k === 0 })).join('')}</div>${dose ? `<p class="vv-ref">rapport au seuil, calculé des sources à <span class="nb">${fr(dose.valeur)}</span> g/L après fermentation, <span class="nb">${jours ? jours.valeur : 3}</span> j</p>` : ''}`}
    </div>`;
}

// ---------- ce qui est MESURÉ en bière (comparatifs-dryhop.json, 10 études) ; les trous montrés ----------
const CMP_F = path.join(D21, 'donnees', 'comparatifs-dryhop.json');
export const CMP = fs.existsSync(CMP_F) ? JSON.parse(fs.readFileSync(CMP_F, 'utf8')) : null;
const E = (id) => (CMP ? CMP.etudes.find((x) => x.id === id) : null);
const auteur = (e) => e.ref.split(',')[0].split(' ')[0] + ' ' + ((e.ref.match(/(19|20)\d\d/) || [''])[0]);
const nb = (v) => String(v).replace('.', ',');
// Des barres horizontales à la même échelle (µg/L), une par bière ; la bière du houblon en noir.
function barresMesure(e, compose, lignes, o = {}) {
  const ms = lignes.map(([v, lib]) => ({ m: e.mesures.find((x) => x.variete === v && x.compose === compose), lib, v })).filter((x) => x.m && typeof x.m.valeur === 'number');
  const max = o.max || Math.max(...ms.map((x) => x.m.valeur)) * 1.08, W = 150;
  const fam = ms[0].m.famille;
  return `<div class="me" data-nature="mesure" data-source="${e.id}" data-niveau="${e.niveau}">
      <div class="me-t">${picto(fam, 14)}<span class="rv-k">${NOM_COMP[compose.replace('è', 'e').replace('é', 'e')] || compose}</span><span class="mot m-mes">mesuré</span><span class="src">${esc(auteur(e))} [${e.id}]${o.note ? ' · ' + o.note : ''}</span></div>
      ${ms.map((x) => `<div class="me-l${x.v === o.moi ? ' moi' : ''}"><span class="me-n">${esc(x.lib)}</span><span class="me-p"><i style="width:${(x.m.valeur / max * W).toFixed(1)}px"></i></span><span class="me-v nb">${nb(x.m.valeur)}</span></div>`).join('')}
      <div class="me-u">${esc(x0unite(ms))}${o.averifier ? ' · <span class="mot m-av">à vérifier</span>' : ''}</div>
    </div>`;
}
const x0unite = (ms) => ms[0].m.unite;
const trou = (txt, src) => `<div class="me trou" data-nature="mesure" data-source="${src}"><span class="mot m-inc" data-inconnu>inconnu</span><span>${txt}</span></div>`;
// Cascade, panel 0–15 selon la dose (E04, Lafontaine 2018) : la saturation, mesurée.
export function courbeDose(o = {}) {
  const e = E('E04'); if (!e) return '';
  const W = 196, H = 72, xd = (d) => 8 + d / 16 * (W - 48), yv = (v) => H - 6 - v / 15 * (H - 12);
  const ser = [['citrus, échelle 0-15', 'citrus'], ['herbal/tea, échelle 0-15', 'herbal']].map(([k, f]) => ({ f, pts: e.mesures.filter((m) => m.descripteur === k).map((m) => [m.dose_gL, m.valeur]) }));
  const dot = o.dose != null ? `<line x1="${xd(o.dose).toFixed(1)}" y1="2" x2="${xd(o.dose).toFixed(1)}" y2="${H - 4}" stroke="#16161a" stroke-width="1.5" stroke-dasharray="2 2" data-curseur/>` : '';
  const svg = `<svg class="cd" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Cascade, panel 0 à 15 après 24 h : agrumes ${ser[0].pts.map((p) => nb(p[1]) + ' à ' + nb(p[0]) + ' g/L').join(', ')} ; herbacé ${ser[1].pts.map((p) => nb(p[1])).join(', ')}">
      <line x1="6" y1="${H - 6}" x2="${W - 6}" y2="${H - 6}" stroke="#c9cad2" stroke-width="1"/>
      ${ser.map((s) => `<polyline fill="none" stroke="${J[s.f].base}" stroke-width="1.5" points="${s.pts.map((p) => xd(p[0]).toFixed(1) + ',' + yv(p[1]).toFixed(1)).join(' ')}"/>${s.pts.map((p) => `<circle cx="${xd(p[0]).toFixed(1)}" cy="${yv(p[1]).toFixed(1)}" r="2.6" fill="#fff" stroke="${J[s.f].texte}" stroke-width="1.5"/>`).join('')}`).join('')}
      ${ser.map((s) => { const z = s.pts[s.pts.length - 1]; return `<text x="${(xd(z[0]) + 4).toFixed(1)}" y="${(yv(z[1]) + 4).toFixed(1)}" font-size="12" fill="${J[s.f].texte}">${nb(z[1])}</text>`; }).join('')}${dot}</svg>`;
  return `<div class="me" data-nature="mesure" data-source="E04" data-niveau="P">
      <div class="me-t">${picto('citrus', 14)}${picto('herbal', 14)}<span class="rv-k">Cascade selon la dose</span><span class="mot m-mes">mesuré</span><span class="src">${esc(auteur(e))} [E04], panel 0–15, 24 h</span></div>
      <div class="cd-l">${svg}<span class="cd-x">${[0, 2, 4, 8, 16].map((d) => `<span class="nb" style="left:${xd(d).toFixed(1)}px">${d}</span>`).join('')}<span class="u" style="left:${(W - 14)}px">g/L</span></span></div>
      <p class="me-u">les agrumes plafonnent dès <span class="nb">8</span> g/L, l’herbacé monte encore ; linalol extrait : <span class="nb">23</span> % puis <span class="nb">7</span> % · <span class="mot m-mes">vérifié (K)</span></p>
    </div>`;
}
export function etudes(h) {
  if (!CMP) return '';
  if (h === 'Citra') return barresMesure(E('E06'), 'linalol', [['Citra', 'Citra'], ['Centennial', 'Centennial'], ['Nelson Sauvin', 'Nelson Sauvin'], ['témoin (sans houblon)', 'sans houblon']], { moi: 'Citra', note: 'dose inconnue' })
    + trou('Citra contre Cascade, même bière, même dose : aucune étude lue', 'E09 J');
  if (h === 'Cascade') return courbeDose() + `<div class="me" data-nature="mesure" data-source="E10" data-niveau="P"><div class="me-t"><span class="mot m-mes">mesuré</span><span>1 h ou 96 h de contact : même arôme perçu, bière jeune, <span class="nb">1,43</span> g/L</span><span class="src">${esc(auteur(E('E10')))} [E10]</span></div></div>`;
  if (h === 'Idaho 7') return barresMesure(E('E03'), 'linalol', [['Sultana', 'Sultana'], ['Idaho-7', 'Idaho 7'], ['Azacca', 'Azacca']], { moi: 'Idaho-7', note: 'au pitch, pas un dry hop', averifier: true })
    + trou('Idaho 7 en dry hop : aucune mesure en bière', 'J');
  if (h === 'Galaxy') return trou('Galaxy : aucune mesure en bière trouvée dans les 10 études', 'J') + `<div class="me" data-nature="mesure" data-source="E09" data-niveau="S"><div class="me-t"><span class="mot">figure</span><span>placé à <span class="nb">4</span> g/L parmi 12 variétés, en figure seulement</span><span class="src">Sharp 2018 [E09]</span></div></div>`;
  return '';
}
export const DUREE_MESUREE = () => (CMP ? `<span class="rep-m" data-nature="mesure" data-source="E08 H73">l’essentiel passe en <span class="nb">2</span> j</span>` : '');

// ---------- la biotransformation : sens ou drapeau, avec la source ; jamais un chiffre inventé ----------
const BIO_L = {
  'US-05': { t: 'biotransformation', mot: 'inconnu', src: 'H50-us05 H44', pis: [] },
  Verdant: { t: 'thiols libérés (β-lyase qualitative)', mot: 'sens', src: 'H49 H50-verdant', pis: ['tropical', 'berries'] },
  Pomona: { t: 'géraniol → citronellol, « medium »', mot: 'sens', src: 'H50-pomona H51', pis: ['floral', 'citrus'], fleche: true },
  Diamond: { t: 'le plus de thiols mesurés, le fruité perçu le plus faible', mot: 'sens', src: 'H50-diamond samia2026', pis: ['tropical', 'berries'] },
};
// phase : 'actif' (houblon présent pendant la fermentation), 'apres' (dry hop après), 'aucun'.
export function bioHTML(levure, phase) {
  const L = BIO_L[levure];
  const pis = L.pis.length ? (L.fleche ? `${picto(L.pis[0], 14)}${ico('i-arrow-r', 12)}${picto(L.pis[1], 14)}` : L.pis.map((f) => picto(f, 14)).join('')) : '';
  const cl = (m) => (m === 'inconnu' ? 'm-inc' : '');
  if (phase === 'apres') return `<div class="bio-l" data-role="biotransformation"><span class="bio-i">${ico('j-levure', 14)}<b>${esc(levure)}</b></span><span class="bio-i" data-nature="mesure" data-source="H41 H93">après fermentation : levure au repos, rien de compté</span></div>`;
  if (phase === 'chaud') return `<div class="bio-l" data-role="biotransformation"><span class="bio-i">${ico('j-levure', 14)}<b>${esc(levure)}</b></span><span class="bio-i" data-nature="mesure" data-source="H41 H93">${pis}à chaud : non comptée par le moteur</span></div>`;
  if (phase === 'aucun') return `<div class="bio-l" data-role="biotransformation"><span class="bio-i">${ico('j-levure', 14)}<b>${esc(levure)}</b></span><span class="bio-i" data-nature="mesure" data-source="H13">à 60′, presque rien ne reste à transformer</span></div>`;
  return `<div class="bio-l" data-role="biotransformation"><span class="bio-i">${ico('j-levure', 14)}<b>${esc(levure)}</b></span><span class="bio-i" data-nature="mesure" data-source="${L.src}">${pis}${esc(L.t)} <span class="mot ${cl(L.mot)}">${L.mot}</span></span>${phase === 'actif' ? '<span class="bio-i" data-nature="mesure" data-source="H68">hop creep</span>' : ''}</div>`;
}
export const LEVURES = Object.keys(BIO_L);

// ---------- la page : en-tête, outils, légende ----------
export const barre = (titre) => `
  <header class="barre">
    <a class="retour" href="#" aria-label="Retour">${ico('i-chev-l', 16)}</a>
    <h1 class="titre">${titre}</h1>
    <button class="leg-b" data-role="legende-bouton" aria-expanded="false" aria-controls="legende" aria-label="Légende des familles, des barres et des valeurs">${ico('i-aide', 18)}</button>
  </header>`;
export const lentille = () => `<div class="seg lentille" role="radiogroup" aria-label="Lecture des familles"><button role="radio" data-e="style" aria-checked="true">Au style</button><button role="radio" data-e="absolu" aria-checked="false">Absolu</button></div>`;
const li = (c, m) => `<span class="leg-i"><span class="leg-c">${c}</span><span>${m}</span></span>`;
export function legende(extra = '') {
  return `
  <div class="leg-v" data-role="legende-voile" hidden></div>
  <section class="legende" id="legende" data-role="legende" role="dialog" aria-label="Légende" hidden>
    <i class="leg-bec" aria-hidden="true"></i>
    <div class="leg-in">
    <div class="leg-t"><span>Légende</span><button class="leg-x" data-role="legende-fermer" aria-label="Fermer la légende">${ico('i-x', 16)}</button></div>
    <div class="leg-s"><h3>Familles</h3><div class="leg-g">${ORDRE.map((f) => li(picto(f, 18), COURT[f])).join('')}</div></div>
    <div class="leg-s"><h3>Profil estimé, en crans du style 16D</h3><div class="leg-g l2">
      ${li('<i class="lx-z"></i>', 'zone du style (BJCP 2021)')}${li('<i class="lx-b"></i>', 'estimé : le centre')}
      ${li('<i class="lx-w"></i>', 'bande : de bas à haut, jamais rognée')}${li('<i class="lx-x"></i>', 'orangé : hors du style')}
      ${li('<i class="lx-g"></i>', 'contour : la référence')}${li('<span class="cb-lex">+2</span>', 'deux crans de plus')}
    </div></div>
    <div class="leg-s"><h3>Vraies valeurs</h3><div class="leg-g l2">
      ${li('<span class="al lot">8,1%</span>', 'α du lot en stock')}${li(`<span class="al af">${LIVRE}10–15%</span>`, 'sans lot : α de ses fiches')}
      ${li('<i class="lx-lg"></i>', 'rapport au seuil, échelle ×10 par cran ; trait : le seuil')}${li('<span class="mot m-mes">mesuré</span>', 'en bière, dans une étude')}
    </div></div>
    <div class="leg-s"><h3>Mots de confiance</h3><div class="leg-g l2">
      ${li('<span class="mot m-mes">mesuré</span>', 'lot, fiche ou bière')}${li('<span class="mot m-est">~ estimé</span>', 'calcul de l’outil')}
      ${li('<span class="mot m-inc">inconnu</span>', 'pas de donnée, jamais zéro')}${li('<span class="mot">sens</span>', 'une direction, sans chiffre')}
    </div></div>
    ${extra}
    <div class="leg-s"><h3>Gestes</h3><div class="leg-g l2">
      ${li('<span class="leg-doigt" aria-hidden="true"></span>', 'appui long sur un houblon : sa fiche')}${li('<span class="us">arôme</span>', 'usage du houblon')}
    </div></div>
    </div>
  </section>`;
}

// ---------- la feuille de style commune (en plus de celle de l5e) ----------
export const CSS = T.CSS + `
  [hidden] { display: none !important; }
  .titre { flex: 1; font-size: 16px; font-weight: 700; display: flex; align-items: baseline; gap: 6px; white-space: nowrap; overflow: hidden; }
  .titre small { font-size: 13px; font-weight: 600; color: var(--gris); }
  .carte { background: #fff; border-radius: 8px; box-shadow: var(--ombre); padding: 7px 10px 8px; display: flex; flex-direction: column; gap: 5px; }
  .mot { display: inline-flex; align-items: center; height: 18px; padding: 0 7px; border-radius: 9px; font-size: 12px; font-weight: 600; white-space: nowrap; background: #ececf1; color: var(--encre); }
  .mot.m-est { background: #fff; box-shadow: inset 0 0 0 1px #8a909b; }
  .mot.m-mes { background: #16161a; color: #fff; }
  .mot.m-inc { background: repeating-linear-gradient(135deg, #fff 0 3px, #e3e5eb 3px 5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .conf { display: inline-flex; align-items: center; gap: 2px; }
  .conf i { width: 6px; height: 6px; border-radius: 50%; box-shadow: inset 0 0 0 1px #55555f; }
  .conf i.on { background: #55555f; }

  /* Les rangées de familles : le nom toujours écrit, la piste en crans du style, la zone du style en pâle. */
  .lns { display: flex; flex-direction: column; gap: 1px; }
  .lf { display: grid; grid-template-columns: 86px 1fr 62px; align-items: center; column-gap: 6px; min-height: 17px; }
  .lf-n { display: inline-flex; align-items: center; gap: 4px; min-width: 0; }
  .lf-t { font-size: 12px; font-weight: 600; color: var(--t); white-space: nowrap; }
  .lf-p { position: relative; height: 14px; }
  .lf-p::before { content: ''; position: absolute; left: 0; right: 0; top: 6px; height: 2px; border-radius: 1px; background: #eef0f4; }
  .lf-z { position: absolute; left: 0; top: 0; bottom: 0; width: var(--zs); background: var(--z); border-right: 1.5px solid var(--t); }
  body.abs .lf-z { width: var(--za); }
  .lf-d { font: 500 12px var(--sans); text-align: right; white-space: nowrap; color: var(--encre); font-variant-numeric: tabular-nums; }
  .lf-d.hst { color: var(--acc); font-weight: 600; }
  .lf i { position: absolute; display: block; }
  .lf i[hidden] { display: none; }
  .lf-b .lf-x { top: 0; bottom: 0; }
  .lf-d.pos { color: var(--gris); }
  /* La bande d'incertitude : de bas à haut, sans rognure (« que ça se voie, pas que ce soit effacé »). */
  .lf-w { top: 5px; height: 4px; border-radius: 2px; background: var(--cf); box-shadow: inset 0 0 0 1px var(--c); }

  .lf-x { background: var(--acc); }
  .pret .lf i { transition: left .22s cubic-bezier(.2,.8,.2,1), width .22s cubic-bezier(.2,.8,.2,1); }
  .pret .lf-d { transition: color .2s; }
  .lf-d.flash { animation: flash .9s ease-out; }
  @keyframes flash { 0% { background: #fff1b8; } 100% { background: transparent; } }

  /* Le rapport au seuil d'un composé, en bande logarithmique (L3) : ×0,01 à ×10 000, le seuil en trait. */
  .rv { display: grid; grid-template-columns: auto 1fr; align-items: center; column-gap: 8px; row-gap: 3px; }
  .rv-c { display: flex; align-items: center; gap: 6px; min-height: 20px; }
  .rv-c .pis { display: inline-flex; gap: 1px; }
  .rv-k { font-size: 12px; font-weight: 600; min-width: 46px; }
  .lg { position: relative; display: inline-block; width: 168px; height: 14px; flex: none; }
  .lg::before { content: ''; position: absolute; left: 0; right: 0; top: 6px; height: 2px; background: #e3e5eb; border-radius: 1px; }
  .lg-b { position: absolute; top: 3px; height: 8px; border-radius: 4px; background: var(--cf, rgba(85,85,95,.35)); box-shadow: inset 0 0 0 1.5px var(--c, #55555f); }
  .lg-b.ouvert-d { border-radius: 4px 0 0 4px; -webkit-mask-image: linear-gradient(90deg, #000 70%, transparent); mask-image: linear-gradient(90deg, #000 70%, transparent); }
  .lg-b.ouvert-g { border-radius: 0 4px 4px 0; -webkit-mask-image: linear-gradient(270deg, #000 70%, transparent); mask-image: linear-gradient(270deg, #000 70%, transparent); }
  .lg-1 { position: absolute; top: 0; bottom: 0; width: 1.5px; background: var(--encre); }
  .lg-c { position: absolute; top: 4px; width: 6px; height: 6px; margin-left: -3px; border-radius: 50%; background: var(--encre); }
  .lg-t { position: absolute; top: -1px; font-size: 12px; color: var(--gris); }
  .rv-v { font: 500 12px var(--mono); white-space: nowrap; }
  .rv-v.inc { font-family: var(--sans); color: var(--gris); }

  /* La biotransformation : ce que la levure fait du houblon, en sens ou en drapeau, jamais en chiffre inventé. */
  .bio-l { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; font-size: 12px; }
  .bio-i { display: inline-flex; align-items: center; gap: 3px; }
  .bio-i .src { font-size: 12px; }
  .leg-i .lx-z, .leg-i .lx-b, .leg-i .lx-w, .leg-i .lx-x, .leg-i .lx-g, .leg-i .lx-lg { display: inline-block; width: 22px; height: 8px; border-radius: 2px; }
  .lx-z { background: ${rgba(J.tropical.base, 0.16)}; border-right: 1.5px solid ${J.tropical.texte}; }
  .lx-b { background: ${J.tropical.base}; }
  .lx-w { height: 4px !important; background: ${rgba(J.tropical.base, 0.4)}; box-shadow: inset 0 0 0 1px ${J.tropical.base}; }
  .lx-x { background: #c2410c; }
  .lx-g { background: #fff; box-shadow: inset 0 0 0 1.5px ${J.tropical.base}; }
  .lx-lg { background: linear-gradient(90deg, transparent 45%, #16161a 45% 52%, transparent 52%), rgba(85,85,95,.3); }
  .vf { display: inline-flex; align-items: center; gap: 1px; height: 22px; padding: 0 4px 0 8px; border-radius: 11px; background: #ececf1; font-size: 12px; font-weight: 600; color: var(--encre); white-space: nowrap; }
`;

// ---------- la page ----------
export const page = ({ titre, commentaire, css = '', corps, js = '', data }) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre}</title>
<!-- ${commentaire} -->
${T.POLICES}
<style>${CSS}${css}</style>
</head>
<body>
${T.SPRITE}
<main class="ecran">${corps}
</main>
<div id="fiche-racine"></div>
<script>
const SIMDATA = ${JSON.stringify(data)};
${fs.readFileSync(path.join(ICI, 'sim-runtime.js'), 'utf8')}
${T.LEGENDE_JS}${FICHE_JS}
${js}
</script>
</body>
</html>
`;
export const ecrire = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); console.log('écrit ' + path.relative(D21, f) + ' (' + Math.round(s.length / 1024) + ' Ko)'); };

// Le squelette d'une rangée de famille (le moteur du navigateur y pose les barres) ; o.series : les marques.
export function rangee(f, o = {}) {
  const series = o.series || ['g', 'w', 'b'];
  const el = series.map((s) => (/^b/.test(s) ? `<i class="lf-${s}" data-s="${s}" data-nature="simule"><i class="lf-x"></i></i>` : `<i class="lf-${s.replace(/\d/, '')}${/\d/.test(s) ? ' lf-' + s : ''}" data-s="${s}"></i>`)).join('');
  return `<div class="lf" data-lane="${f}" data-famille="${f}" role="img" aria-label="${NOM[f]}" style="--c:${J[f].base};--cf:${rgba(J[f].base, 0.4)};--t:${J[f].texte};--z:${rgba(J[f].base, 0.16)}">
        <span class="lf-n">${picto(f, 16)}<span class="lf-t">${COURT[f]}</span></span>
        <span class="lf-p"><i class="lf-z" data-role="zone"></i><i class="lf-inc" hidden></i>${el}</span>
        <span class="lf-d" data-nature="simule"></span>
      </div>`;
}
