// Lot 21 · série z (auteur créatif) · socle commun des cinq maquettes z1 à z5.
// Ce que ce socle fournit, et d'où ça vient :
//   - les VRAIES valeurs, relues des fichiers du dépôt avec leur source : α du lot et des fiches
//     (base/consolide via donnees-l5-l6), huile totale et rapports au seuil du moteur « pouvoir »
//     (fils19-choix/donnees), mesures en bière (fils19 verifications.json et
//     fils21-choisir/donnees/comparatifs-dryhop.json, 10 études), bandes du style 16D (style-bands.json) ;
//   - le SIMULÉ : le vrai profil simulé du moteur profil-simule (fils21-choisir/donnees/profils-simules.json,
//     note PROFIL-SIMULE.md), compacté par moteur-z.mjs ; tout ce qui en vient porte data-nature="simule"
//     et un signe « ~ » ; un agencement hors de la grille est dit « non simulé », jamais inventé ;
//   - les pictos au trait des 12 familles (fils17-standard v3), les tons de jetons-familles.json ;
//   - la fiche (appui long 500 ms, survol 750 ms), la légende derrière « ? », la lentille au style / absolu.
// Il n'écrit rien : chaque générateur zN écrit sa page.
import fs from 'node:fs';
import path from 'node:path';
import * as K from '../../fils18-baseline/l5/donnees-l5-l6.mjs';
import { DATA, DATA_JS, MOTEUR_JS } from './moteur-z.mjs';
import { UI_JS } from './ui-z.mjs';

export const REPO = K.REPO, E1 = K.E1, D21 = E1 + '/fils21-choisir';
export const JET = K.J, ORDRE = K.ORDRE, NOM = K.NOM, COURT = K.COURT;
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
export const r1 = (x) => Math.round(x * 10) / 10;
export const fr = (x) => String(r1(x)).replace('.', ',').replace('-', '−');
export const plage = (a, b) => (a === b ? fr(a) : fr(a) + '–' + fr(b));
const r3 = (x) => Math.round(x * 1000) / 1000;

// ---------- les icônes (une seule épaisseur rendue : 1,5 px) ----------
const SYM = { ...K.SYM };
SYM['i-livre'] = '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>';
SYM['i-aide'] = '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>';
SYM['i-fleche-d'] = '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>';
SYM['i-rejouer'] = '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>';
SYM['i-sachet'] = '<path d="M7 3h10l2 6H5z"/><path d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9"/>';
SYM['i-verre'] = '<path d="M6 3h12l-1.5 15.5a2 2 0 0 1-2 1.5h-5a2 2 0 0 1-2-1.5z"/><path d="M8 21h8"/>';
SYM['i-pion'] = '<path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>';
SYM['i-x'] = SYM['i-x'] || '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>';
export const ico = (id, size = 16, attrs = '') => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${r3(36 / size)}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${attrs ? ' ' + attrs : ''}>${SYM[id] || ''}</svg>`;
const net = (inner) => inner.replace(/<(path|circle|ellipse|line|rect|polyline|polygon)\b/g, '<$1 vector-effect="non-scaling-stroke"');
// Les 12 pictos de famille en <symbol>, au trait, ton texte de la famille, sans halo ni filtre (D88).
export const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">${ORDRE.map((f) => `<symbol id="p-${f}" viewBox="0 0 24 24" fill="none" stroke="${JET[f].texte}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${net(SYM['p-' + f])}</symbol>`).join('')}</svg>`;
export const picto = (f, z = 16, cls = '') => `<svg class="pi${cls ? ' ' + cls : ''}" width="${z}" height="${z}" data-famille="${f}" role="img" aria-label="${NOM[f]}"><use href="#p-${f}"/></svg>`;
export const CSS_FAMILLES = ORDRE.map((f) => `[data-famille="${f}"]{--b:${JET[f].base};--t:${JET[f].texte};--f:${JET[f].fond}}`).join('\n');

// ---------- les houblons de la série : fiche, lot, couleur ----------
export const HOUBLONS = ['Citra', 'Cascade', 'Galaxy', 'Idaho 7'];
export const FICHE_DE = { Citra: 'Citra cryo', Cascade: 'Cascade', Galaxy: 'Galaxy', 'Idaho 7': 'Idaho 7', Nugget: 'Nugget' };
export const COUL = { Citra: '#3b4fd8', Cascade: '#b0225c', Galaxy: '#0b7a8f', 'Idaho 7': '#6d4c9e', Nugget: '#4b4b55' };
export const USAGE = { Citra: 'aromatique', Cascade: 'aromatique', Galaxy: 'mixte', 'Idaho 7': 'mixte', Nugget: 'mixte' };
export const USAGE_SRC = { Citra: 'fournisseur : Crosby Hops', Cascade: 'fournisseur : Crosby Hops', Galaxy: 'déduit de l’α (règle du prototype)', 'Idaho 7': 'déduit de l’α (règle du prototype)', Nugget: 'déduit de l’α (règle du prototype)' };

// ---------- les vraies valeurs, par houblon ----------
const lireCas = (n) => JSON.parse(fs.readFileSync(E1 + '/fils19-choix/donnees/' + n + '.json', 'utf8'));
const CAS = { Citra: lireCas('cas-citra'), Cascade: lireCas('cas-cascade'), Galaxy: lireCas('cas-galaxy'), 'Idaho 7': lireCas('cas-idaho7') };
const VER = lireCas('verifications');
export const COMPAR = JSON.parse(fs.readFileSync(D21 + '/donnees/comparatifs-dryhop.json', 'utf8'));
export const SB = JSON.parse(fs.readFileSync(REPO + '/prototypes/houblons-v4/data/style-bands.json', 'utf8'));
export const STYLE = SB.styles['16D'];
const srcCourt = (cas, k) => { const s = cas.sources[k]; if (!s) return k; const t = s.titre.split(',')[0].replace(/\s*\(.*$/, '').trim(); return (t.length > 26 ? t.slice(0, 26) + '…' : t) + (s.annee ? ' ' + s.annee : ''); };
const srcs = (cas, arr) => { const l = [...new Set((arr || []).map((k) => srcCourt(cas, k)))]; return l.slice(0, 3).join(' ; ') + (l.length > 3 ? ' ; +' + (l.length - 3) : ''); };
export const FAM_COMP = { '4MMP': ['tropical', 'berries'], linalol: ['floral', 'citrus'], geraniol: ['floral', 'citrus'], myrcene: ['resin', 'green'], '3MH': ['citrus', 'tropical'], humulene: ['herbal', 'spice'] };
export const NOM_COMP = { '4MMP': '4MMP', linalol: 'linalol', geraniol: 'géraniol', myrcene: 'myrcène', '3MH': '3MH', humulene: 'humulène' };

export const REEL = {};
for (const h of HOUBLONS) {
  const F = K.fiche(FICHE_DE[h]);
  const cas = CAS[h], a = cas.pouvoir.ajouts.find((x) => x.nom === h);
  const alphaFiches = F.alpha.map((s) => ({ plage: [s.min, s.max], src: s.src + (s.an ? ' ' + s.an : '') }));
  const ratios = {};
  for (const k of ['4MMP', 'linalol', 'geraniol', 'myrcene']) {
    const x = a.composes[k];
    if (!x || !x.rapport || !x.rapport.plage) { ratios[k] = { inconnu: (x && x.rapport && x.rapport.inconnu) ? 'non calculé' : 'non relevé', src: '' }; continue; }
    const p = x.rapport.plage;
    ratios[k] = { min: p.min, max: p.max, central: p.central, src: srcs(cas, x.rapport.sources || x.charge.sources), dose: a.doseGL, moment: 'dry hop après, 3 j' };
  }
  REEL[h] = {
    nom: h, fiche: FICHE_DE[h], lot: F.lot, cryo: /cryo$/i.test(FICHE_DE[h]), alphaFiches, huile: a.huile && a.huile.plage ? { plage: [a.huile.plage.min, a.huile.plage.max], unite: a.huile.unite, src: srcs(cas, a.huile.sources) } : null,
    ratios, biere: VER.verifications.filter((v) => v.houblon === h).map((v) => ({ compose: v.compose, texte: v.texte, plage: [v.mesure.min, v.mesure.max], unite: v.unite, src: srcs(cas, v.sources) })),
    familles: F.aromes.filter((x) => x.n > 0).map((x) => ({ f: x.f, n: x.n, of: x.of, mots: [...new Set((x.mots || []).flatMap((m) => m.mots).map((w) => w.toLowerCase()))] })),
    usage: USAGE[h], usageSrc: USAGE_SRC[h], etudes: etudesDe(h),
  };
}
// Les comparatifs publiés (fils21-choisir/donnees/comparatifs-dryhop.json) : ce qui parle d'un houblon.
function etudesDe(h) {
  const cle = h === 'Idaho 7' ? /idaho/i : new RegExp('^' + h + '\\b', 'i');
  const out = [];
  for (const e of COMPAR.etudes) {
    const ms = (e.mesures || []).filter((m) => cle.test(m.variete || ''));
    if (!ms.length && !e.varietes.some((v) => cle.test(v))) continue;
    out.push({ id: e.id, niveau: e.niveau, ref: e.ref.split('.')[0].replace(/,.*$/, '') + ' ' + (e.ref.match(/\b(19|20)\d\d\b/) || [''])[0], conditions: e.conditions, mesures: ms.map((m) => ({ ...m, aVerifier: /v[ée]rifier/i.test((m.note || '') + ' ' + (m.lecture || '')), figure: /figure|diapositive/i.test(m.lecture || '') })) });
  }
  return out;
}
export const TROUS = [
  'aucune étude lue ne mesure Citra contre Cascade en bière à dose égale',
  'aucune comparaison chiffrée pour Galaxy',
  'une seule étude pour Idaho 7 (co-fermentation, S-04)',
  'aucune mesure qui croise variété, levure et dry hop',
];
// Une mesure publiée, lue dans comparatifs-dryhop.json par étude, variété et composé ou descripteur.
export function mesure(id, variete, quoi) {
  const e = COMPAR.etudes.find((x) => x.id === id); if (!e) return null;
  const m = (e.mesures || []).find((x) => (x.variete || '').toLowerCase().startsWith(variete.toLowerCase()) && ((x.compose || '') + (x.descripteur || '')).toLowerCase().includes(quoi.toLowerCase()));
  if (!m) return null;
  const v = typeof m.valeur === 'number' ? fr(m.valeur) : String(m.valeur);
  return { v, n: m.valeur, unite: m.unite, src: e.ref.split(',')[0] + ' ' + (e.ref.match(/\b(19|20)\d\d\b/) || [''])[0] + ' (' + id + ', ' + e.niveau + ')', niveau: e.niveau, figure: /figure|diapositive/i.test(m.lecture || ''), verifier: /v[ée]rifier/i.test((m.note || '') + ' ' + (m.lecture || '')), dose: m.dose_gL };
}
// Les faits en bière par houblon, tirés du JSON (jamais recopiés à la main) ; les trous sont dits.
const serie = (id, v, quoi, doses) => doses.map((d) => { const e = COMPAR.etudes.find((x) => x.id === id); const m = (e.mesures || []).find((x) => x.dose_gL === d && (x.descripteur || '').toLowerCase().includes(quoi)); return m ? fr(m.valeur) : '?'; });
export const FAITS = {
  Citra: (() => { const l = mesure('E06', 'Citra', 'linalol'), my = mesure('E06', 'Citra', 'myrcène'); return [
    l && { t: 'linalol en bière ' + l.v + ' ' + l.unite + ' (dry hop, dose non indiquée)', src: l.src, figure: l.figure, verifier: l.verifier, fam: 'floral' },
    my && { t: 'myrcène ' + my.v + ' ' + my.unite, src: my.src, figure: my.figure, verifier: my.verifier, fam: 'resin' },
    { trou: 'aucune étude lue ne mesure Citra contre Cascade en bière à dose égale' },
  ].filter(Boolean); })(),
  Cascade: (() => { const oh = serie('E04', 'Cascade', 'ohai', [0, 2, 3.86, 8, 16]), ci = serie('E04', 'Cascade', 'citrus', [0, 2, 3.86, 8, 16]), he = serie('E04', 'Cascade', 'herbal', [0, 2, 3.86, 8, 16]); const l2 = mesure('E04', 'Cascade', 'linalol, part'); const t = mesure('E10', 'Cascade', 'temps de contact'); const e4 = COMPAR.etudes.find((x) => x.id === 'E04'); return [
    { t: 'arôme houblonné global ' + oh.join(' → ') + ' /15 à 0 ; 2 ; 3,86 ; 8 ; 16 g/L, 24 h', src: 'Lafontaine 2018 (E04, P)', fam: null, serie: { doses: [0, 2, 3.86, 8, 16], ohai: oh, citrus: ci, herbal: he } },
    { t: 'agrumes ' + ci.join(' → ') + ' ; herbacé ' + he.join(' → ') + ' : l’herbacé monte, les agrumes plafonnent', src: 'Lafontaine 2018 (E04, P)', fam: 'citrus' },
    l2 && { t: 'linalol extrait : ' + l2.v + ' % à 2 g/L, ' + (mesure('E04', 'Cascade', 'linalol, part') ? (e4.mesures.find((x) => x.dose_gL === 16 && /linalol/.test(x.compose || '')) || {}).valeur : '?') + ' % à 16 g/L (saturation mesurée)', src: l2.src, fam: 'floral' },
    t && { t: '1,43 g/L : 1 h et 96 h de contact indistinguables (bière jeune)', src: t.src, fam: null },
    ...REEL.Cascade.biere.slice(0, 1).map((b) => ({ t: b.texte, src: b.src, fam: FAM_COMP[b.compose] ? FAM_COMP[b.compose][0] : null })),
  ].filter(Boolean); })(),
  Galaxy: [{ trou: 'aucune comparaison chiffrée publiée pour Galaxy (une ACP sans chiffres : Sharp 2018, E09)' }],
  'Idaho 7': (() => { const l = mesure('E03', 'Idaho', 'linalol'), my = mesure('E03', 'Idaho', 'myrcène'); return [
    l && { t: 'linalol ' + fr(l.n * 1000) + ' µg/L, myrcène ' + (my ? fr(my.n * 1000) : '?') + ' µg/L (co-fermentation 14 j, S-04)', src: l.src, figure: l.figure, verifier: l.verifier || (my && my.verifier), fam: 'floral' },
    { t: 'tropical, ananas, mangue cochés par le panel (CATA, non entraîné)', src: 'McCabe 2023 (E03, P)', fam: 'tropical' },
    { trou: 'une seule étude pour Idaho 7, et pas en dry hop strict' },
  ].filter(Boolean); })(),
};
export const faitsHTML = (h, n = 3) => FAITS[h].slice(0, n).map((x) => x.trou ? `<p class="trou">trou : ${esc(x.trou)}</p>` : `<p class="fait" data-nature="mesure" data-source="${esc(x.src)}">${x.fam ? picto(x.fam, 14) : ''}<span>${esc(x.t)} <small class="gris">${esc(x.src)}</small>${x.figure ? ' <small class="gris">lu sur une figure</small>' : ''}${x.verifier ? ' <span class="verif">à vérifier</span>' : ''}</span></p>`).join('');
export const NUGGET = (() => { const F = K.fiche('Nugget'); return { lot: F.lot, alphaFiches: F.alpha.map((s) => ({ plage: [s.min, s.max], src: s.src + (s.an ? ' ' + s.an : '') })) }; })();

// ---------- le balisage de l'α (D87) : le lot d'abord, puis les fiches avec le livre ----------
export function alphaHTML(h, o = {}) {
  const R = h === 'Nugget' ? { lot: NUGGET.lot, alphaFiches: NUGGET.alphaFiches, cryo: false } : REEL[h];
  const lot = R.lot != null ? `<span class="al lot" data-role="alpha" data-nature="mesure" data-source="lot" aria-label="α du lot en stock${R.cryo ? ' (Citra cryo)' : ''} : ${fr(R.lot)} %">${fr(R.lot)}${o.sansPct ? '' : ' %'}</span>` : '';
  const fi = R.alphaFiches.length ? `<span class="al af" data-role="alpha" data-nature="mesure" data-source="fiches" aria-label="α des fiches${R.cryo ? ' du Citra en pellets' : ''} : ${R.alphaFiches.map((s) => plage(...s.plage) + ' % (' + s.src + ')').join(', ')}">${ico('i-livre', 11)}${R.alphaFiches.map((s) => plage(...s.plage)).join(' · ')}${o.sansPct ? '' : ' %'}${R.cryo ? '<i class="pel">pellets</i>' : ''}</span>` : '';
  return `<span class="alpha" data-houblon-alpha="${esc(h)}"><i class="grec">α</i>${lot}${o.court ? '' : fi}</span>`;
}
export const huileHTML = (h) => { const R = REEL[h]; return R.huile ? `<span class="mes" data-nature="mesure" data-source="${esc(R.huile.src)}" aria-label="huile totale ${plage(...R.huile.plage)} ${R.huile.unite} (${esc(R.huile.src)})">huile <b class="nb">${plage(...R.huile.plage)}</b> mL/100 g</span>` : '<span class="mes gris">huile non renseignée</span>'; };

// ---------- la bande logarithmique d'un rapport au seuil (D94 L3 : une plage ×100 se voit) ----------
// Échelle de ×0,001 à ×10 000 ; le seuil (×1) en trait ; la plage en bande, le repère central en point.
export function bandeLog(r, o = {}) {
  const W = o.W || 160, H = 18, L = 0.001, Hh = 10000, x = (v) => r3(Math.max(0, Math.min(1, (Math.log10(v) - Math.log10(L)) / (Math.log10(Hh) - Math.log10(L)))) * W);
  const ton = o.ton || '#5b5b66';
  if (r.inconnu) return `<span class="blog inconnu" data-role="incertitude" style="width:${W}px" aria-label="rapport au seuil ${r.inconnu}">${r.inconnu}</span>`;
  const a = r.min == null ? null : x(r.min), b = r.max == null ? null : x(r.max);
  const x0 = a == null ? 0 : a, x1 = b == null ? W : b;
  const txt = (r.min == null ? '?' : '×' + fr(r.min)) + '–' + (r.max == null ? '?' : '×' + fr(r.max));
  const lab = `rapport au seuil : de ${r.min == null ? 'borne basse inconnue' : '×' + fr(r.min)} à ${r.max == null ? 'borne haute inconnue' : '×' + fr(r.max)}${r.central != null ? ', repère central ×' + fr(r.central) : ''}`;
  return `<svg class="blog" data-role="incertitude" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${lab}"><line x1="0" y1="9" x2="${W}" y2="9" stroke="#dcdce3" stroke-width="1"/><line x1="${x(1)}" y1="2" x2="${x(1)}" y2="16" stroke="#16161a" stroke-width="1.5"/><rect x="${x0}" y="5" width="${Math.max(2, x1 - x0)}" height="8" rx="2" fill="${ton}"${a == null || b == null ? ' fill-opacity="0.55"' : ''}/>${a == null ? `<text x="${x0 + 2}" y="16" font-size="9" fill="#16161a">?</text>` : ''}${b == null ? `<text x="${W - 7}" y="16" font-size="9" fill="#16161a">?</text>` : ''}${r.central != null ? `<circle cx="${x(r.central)}" cy="9" r="3" fill="#fff" stroke="#16161a" stroke-width="1.5"/>` : ''}</svg><span class="blog-t nb">${txt}</span>`;
}
// Une ligne « composé → famille » avec sa bande et sa source (L2 : le picto de la famille dans la ligne).
export function ligneRapport(h, k, o = {}) {
  const r = REEL[h].ratios[k], fams = FAM_COMP[k];
  return `<div class="rap" data-nature="mesure" data-source="${esc(r.src || 'moteur pouvoir, fils19')}" aria-label="${esc(NOM_COMP[k])} de ${esc(h)}, ${r.dose || 4} g/L, ${r.moment || 'dry hop'}">${fams.map((f) => picto(f, 14)).join('')}<span class="rap-n">${NOM_COMP[k]}</span>${bandeLog(r, { W: o.W || 150, ton: o.ton || JET[fams[0]].base })}</div>`;
}

// ---------- la simulation : le VRAI profil simulé (profils-simules.json), via moteur-z.mjs ; l'affichage via ui-z.mjs ----------
export const COMMUN_JS = DATA_JS + MOTEUR_JS + UI_JS;
export const { MOTEUR, UI } = new Function(COMMUN_JS + ';return { MOTEUR: MOTEUR, UI: UI };')();
export { DATA };

// ---------- la fiche (D25, D93) : le langage de la page, 100 mots au plus ----------
export function ficheHTML(h) {
  const nomF = FICHE_DE[h], F = K.fiche(nomF), R = h === 'Nugget' ? null : REEL[h];
  const P = K.ficheParts(nomF, { roue: { W: 300, id: h.replace(/\W+/g, ''), gris: '#5b5b66', grille: '#e3e5eb' } });
  const roue = P.roue.replace(/<g transform="[^"]*" data-demande="[^"]*"[\s\S]*?<\/g>/g, '');
  const fams = F.aromes.filter((x) => x.n > 0);
  const of = (F.aromes[0] || {}).of || 1;
  const lignes = fams.map((x) => { const mots = [...new Set((x.mots || []).flatMap((m) => m.mots).map((w) => w.toLowerCase()))].slice(0, 3); return `<div class="fi-l" data-famille="${x.f}">${picto(x.f, 16)}<b>${COURT[x.f]}</b><span class="fi-c">${of === 1 ? '1 fiche' : x.n + '/' + x.of}</span>${mots.length ? `<span class="fi-m">${esc(mots.join(', '))}</span>` : ''}</div>`; }).join('');
  const huile = F.huiles.length ? `<span class="mes" data-nature="mesure" data-source="${esc(F.huiles.map((s) => s.src + (s.an ? ' ' + s.an : '')).join(' ; '))}">huile <b class="nb">${F.huiles.map((s) => plage(s.min, s.max)).join(' · ')}</b> mL/100 g</span>` : '';
  const biere = R && R.biere.length ? `<p class="fi-b" data-nature="mesure" data-source="${esc(R.biere[0].src)}">en bière : ${esc(R.biere[0].texte)} <small>(${esc(R.biere[0].src)})</small></p>` : '';
  return `<div class="fi-voile" data-k="voile" aria-hidden="true"></div>
<section class="fi" data-role="fiche" role="dialog" tabindex="-1" aria-label="Fiche de ${esc(h)}">
  <div class="fi-poignee" aria-hidden="true"></div>
  <header class="fi-t"><h2>${esc(h)}</h2><span class="us${/déduit/.test(USAGE_SRC[h]) ? ' deduit' : ''}" data-role="usage" data-source="${esc(USAGE_SRC[h])}">${USAGE[h]}</span><button class="fi-x" data-role="fermer-fiche" data-k="fermer" aria-label="Fermer la fiche">${ico('i-x', 16)}</button></header>
  <div class="fi-a" data-role="fiche-alpha">${alphaHTML(h)}${R && R.cryo ? '<small class="gris">stock : cryo ; fiches : pellets</small>' : ''}${huile}</div>
  <div class="fi-ar" data-role="fiche-arome">${lignes}${of === 1 ? `<small class="gris">1 seule fiche : ${esc(fams[0] ? F.aromes[0].auteurs[0] || '' : '')}</small>` : ''}</div>
  ${biere}
  <div class="fi-r">${roue}</div>
  <div class="fi-act"><span class="fi-g" role="group" data-role="gout" aria-label="Mon goût pour ${esc(h)}"><button data-k="aimer" aria-pressed="false" aria-label="Aimer ${esc(h)}">${ico('i-heart', 16)}</button><button data-k="exclure" aria-pressed="false" aria-label="Exclure ${esc(h)}">${ico('i-ban', 16)}</button></span></div>
</section>`;
}
export const FICHES = Object.fromEntries([...HOUBLONS, 'Nugget'].map((h) => [h, ficheHTML(h)]));
export const FICHE_JS = `
const FICHES = ${JSON.stringify(FICHES)};
function rendFiche(nom, mode) { RACINE.className = 'mode-' + mode; RACINE.innerHTML = mode === 'bulle' ? FICHES[nom].replace(/<div class="fi-voile"[^>]*><\\/div>/, '') : FICHES[nom]; }
${K.GESTE_JS}`;

// ---------- la légende derrière « ? » (D89) ----------
export function legendeHTML(lignes, o = {}) {
  return `<button class="leg-b" data-role="legende-bouton" aria-expanded="false" aria-controls="legende" aria-label="Légende">?</button>
<div class="leg-voile" data-role="legende-voile" hidden></div>
<section class="legende" id="legende" data-role="legende" role="dialog" aria-label="Légende" hidden>
  <header><b>Légende</b><button class="leg-x" data-role="legende-fermer" aria-label="Fermer la légende">${ico('i-x', 16)}</button></header>
  <div class="leg-fam">${ORDRE.map((f) => `<span data-famille="${f}">${picto(f, 16)}${COURT[f]}</span>`).join('')}</div>
  ${lignes.map((l) => `<p>${l}</p>`).join('')}
  <p><b>~</b> simulé par le moteur profil-simule : forme des fiches, force dose × huile × moment × jours, saturation partagée ; le centre est une convention, à valider. <b>Trait fin</b> : le haut de la plage simulée, jamais rogné ; ▲ : plus haut que l’échelle. Certaines bornes hautes ne sont pas publiées : le vrai haut peut être plus haut encore. <b>Hachures</b> : rien de simulé, pas une preuve d’absence. <b>Vraies valeurs</b> : α, huile, mesures en bière, chacune avec sa source.</p>
  ${o.extra || ''}
</section>`;
}
export const LEGENDE_JS = `
(function () {
  const b = document.querySelector('[data-role="legende-bouton"]'), l = document.querySelector('[data-role="legende"]'), v = document.querySelector('[data-role="legende-voile"]');
  function regler(on) { l.hidden = !on; v.hidden = !on; b.setAttribute('aria-expanded', String(on)); if (on) { const x = l.querySelector('[data-role="legende-fermer"]'); if (x) x.focus({ preventScroll: true }); } }
  b.addEventListener('click', () => regler(l.hidden));
  v.addEventListener('click', () => regler(false));
  l.querySelector('[data-role="legende-fermer"]').addEventListener('click', () => regler(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !l.hidden) regler(false); });
})();`;

// ---------- la lentille au style / absolu (D75) ----------
export const LENTILLE = `<div class="seg lentille" role="radiogroup" aria-label="Lecture des familles"><button role="radio" data-e="style" aria-checked="true">Au style</button><button role="radio" data-e="absolu" aria-checked="false">Absolu</button></div>`;
export const LENTILLE_JS = `
document.querySelectorAll('.lentille [data-e]').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.lentille [data-e]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  document.body.classList.toggle('abs', b.dataset.e === 'absolu');
}));
if (/[?&]abs\\b/.test(location.search)) document.querySelector('.lentille [data-e="absolu"]').click();`;

// ---------- la feuille de style commune ----------
export const POLICES = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap">';
export const CSS = `
  :root { --encre: #16161a; --gris: #5b5b66; --trait: #dcdce3; --trait2: #c4c4cc; --piste: #ececf1; --acc: #c2410c; --acc-f: #fdf0ea;
    --sans: 'Source Sans 3', -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif; --mono: 'IBM Plex Mono', ui-monospace, Consolas, monospace; }
  ${CSS_FAMILLES}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  [hidden] { display: none !important; }
  html, body { background: #fff; color: var(--encre); }
  body { font: 400 14px/1.25 var(--sans); -webkit-tap-highlight-color: transparent; font-variant-numeric: tabular-nums; }
  button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; touch-action: manipulation; }
  svg { display: block; flex: none; }
  :focus-visible { outline: 2px solid var(--encre); outline-offset: 2px; }
  .ecran { width: 100%; max-width: 390px; margin: 0 auto; padding: 6px 16px 40px; display: flex; flex-direction: column; gap: 10px; overflow-x: hidden; }
  .barre { display: flex; align-items: center; gap: 8px; min-height: 32px; }
  h1 { font-size: 16px; font-weight: 700; }
  h2 { font-size: 14px; font-weight: 700; }
  .nb { font-family: var(--mono); font-weight: 500; letter-spacing: -.02em; }
  .gris { color: var(--gris); } .p { font-size: 12px; }
  .seg { display: inline-flex; background: var(--piste); border-radius: 16px; padding: 2px; flex: none; }
  .seg button { height: 28px; padding: 0 10px; border-radius: 14px; font-size: 13px; color: var(--gris); white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; }
  .seg button[aria-checked="true"], .seg button[aria-pressed="true"] { background: #fff; color: var(--encre); font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,.12); }
  .lentille button { height: 24px; padding: 0 8px; border-radius: 12px; font-size: 12px; } .lentille { border-radius: 14px; }
  .lentille button[aria-checked="true"] { background: var(--encre); color: #fff; }
  .leg-b { width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: var(--gris); font-weight: 700; font-size: 15px; flex: none; }
  .leg-b[aria-expanded="true"] { color: var(--encre); }
  .leg-voile { position: fixed; inset: 0; background: rgba(22,22,26,.3); z-index: 30; }
  .legende { position: fixed; left: 0; right: 0; bottom: 0; z-index: 31; max-width: 390px; margin: 0 auto; max-height: 86vh; overflow-y: auto; background: #fff; border-radius: 8px 8px 0 0; box-shadow: 0 -8px 28px rgba(0,0,0,.2); padding: 10px 16px 18px; display: flex; flex-direction: column; gap: 8px; font-size: 13px; }
  .legende header { display: flex; align-items: center; justify-content: space-between; }
  .leg-x { width: 28px; height: 28px; border-radius: 50%; background: var(--piste); display: inline-flex; align-items: center; justify-content: center; }
  .leg-fam { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px 8px; }
  .leg-fam span { display: inline-flex; align-items: center; gap: 5px; color: var(--t); font-weight: 600; font-size: 12px; }
  .legende b { font-weight: 600; }
  /* α, huile, mesures */
  .alpha { display: inline-flex; align-items: baseline; gap: 5px; white-space: nowrap; }
  .grec { font-style: normal; color: var(--gris); font-size: 12px; }
  .al { font: 500 13px var(--mono); } .al.lot { font-weight: 600; } .al.af { color: var(--gris); font-size: 11px; display: inline-flex; align-items: center; gap: 2px; }
  .pel { font: 400 11px var(--sans); color: var(--gris); font-style: normal; margin-left: 3px; }
  .mes { font-size: 12px; color: var(--gris); } .mes b { color: var(--encre); font-weight: 500; }
  .us { font-size: 12px; color: var(--encre); } .us.deduit { color: var(--gris); }
  /* la simulation : le bloc, le mot, les barres */
  .sim { display: flex; flex-direction: column; gap: 6px; }
  .sim-t { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12px; color: var(--gris); }
  .sim-t b { color: var(--encre); font-weight: 600; }
  .tilde { font-family: var(--mono); font-weight: 600; color: var(--encre); }
  .bars { display: flex; justify-content: space-between; align-items: flex-end; gap: 2px; }
  .col { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; min-width: 0; }
  .col-n { font-size: 9px; color: var(--t); font-weight: 600; }
  .pile { position: relative; width: 100%; height: 46px; }
  .zone { position: absolute; left: 2px; right: 2px; bottom: 0; height: var(--zs); background: var(--f); box-shadow: inset 0 1.5px 0 var(--b); }
  body.abs .zone { height: var(--za); }
  .bar { position: absolute; left: 7px; right: 7px; bottom: 0; height: var(--hs); background: var(--b); border-radius: 2px 2px 0 0; min-height: 2px; transition: height .25s; }
  body.abs .bar { height: var(--ha); }
  .sur { position: absolute; left: 7px; right: 7px; bottom: var(--zs); height: calc(var(--hs) - var(--zs)); background: var(--acc); border-radius: 2px 2px 0 0; transition: height .25s; }
  body.abs .sur { bottom: var(--za); height: calc(var(--ha) - var(--za)); }
  .wh { position: absolute; left: 50%; bottom: 0; width: 0; height: var(--ws); border-left: 1px solid var(--t); }
  body.abs .wh { height: var(--wa); }
  .bar.inconnu { height: 8px; background: repeating-linear-gradient(135deg, #fff 0 2px, #b8bec8 2px 4px); box-shadow: inset 0 0 0 1px #8a909b; }
  .socle { position: absolute; left: 7px; right: 7px; bottom: 0; height: 4px; background: repeating-linear-gradient(135deg, #fff 0 2px, #8a909b 2px 4px); }
  .col.deb .pile::after { content: ''; position: absolute; top: -2px; left: 50%; margin-left: -4px; border: 4px solid transparent; border-bottom: 5px solid var(--acc); border-top: 0; }
  .col.debh:not(.deb) .pile::after { content: ''; position: absolute; top: -2px; left: 50%; margin-left: -3px; border: 3px solid transparent; border-bottom: 4px solid var(--t); border-top: 0; }
  .conf { font-size: 11px; color: var(--gris); padding: 1px 6px; border-radius: 8px; background: var(--piste); white-space: nowrap; }
  .conf-faible { color: var(--acc); }
  .ibu { font-size: 13px; font-weight: 600; } .ibu small { font-weight: 400; color: var(--gris); font-size: 11px; }
  .non-sim { font-size: 12px; color: var(--gris); padding: 6px 8px; border-radius: 8px; background: repeating-linear-gradient(135deg, #fff 0 4px, var(--piste) 4px 8px); }
  .lgs { display: flex; flex-direction: column; gap: 3px; }
  .lg { display: flex; align-items: center; gap: 6px; height: 18px; }
  .lg-n { width: 64px; font-size: 12px; font-weight: 600; color: var(--t); }
  .lg-p { position: relative; height: 12px; flex: none; }
  .lg-p .zone { left: 0; right: auto; top: 0; bottom: 0; height: auto; width: var(--zs); box-shadow: inset -1.5px 0 0 var(--b); }
  body.abs .lg-p .zone { width: var(--za); }
  .lg-p .bar { left: 0; right: auto; top: 2px; bottom: 2px; height: auto; width: var(--hs); border-radius: 0 2px 2px 0; min-height: 0; transition: width .25s; }
  body.abs .lg-p .bar { width: var(--ha); }
  .lg-p .sur { left: var(--zs); right: auto; top: 2px; bottom: 2px; height: auto; width: calc(var(--hs) - var(--zs)); border-radius: 0 2px 2px 0; }
  body.abs .lg-p .sur { left: var(--za); width: calc(var(--ha) - var(--za)); }
  .lg-p .wh { left: 0; top: 50%; bottom: auto; height: 0; width: var(--ws); border-left: 0; border-top: 1px solid var(--t); }
  body.abs .lg-p .wh { width: var(--wa); }
  .lg-p .bar.inconnu { width: 14px; height: auto; }
  .lg-v { width: 34px; text-align: right; font-size: 12px; }
  .lg.hors .lg-v { color: var(--acc); font-weight: 600; }
  /* la bande logarithmique */
  .rap { display: flex; align-items: center; gap: 5px; min-height: 22px; }
  .rap-n { font-size: 12px; width: 52px; color: var(--encre); }
  .blog-t { font-size: 11px; color: var(--gris); margin-left: 4px; white-space: nowrap; }
  .blog.inconnu { display: inline-block; font-size: 11px; color: var(--gris); border-bottom: 1px dashed var(--trait2); }
  /* les drapeaux de sens */
  .dps { list-style: none; display: flex; flex-direction: column; gap: 5px; }
  .dp { display: flex; flex-direction: column; font-size: 12px; padding-left: 10px; border-left: 2px solid var(--trait2); }
  .dp b { font-weight: 600; } .dp span { color: var(--gris); } .dp small { color: var(--gris); font-size: 11px; }
  .bio { display: inline-block; font-size: 12px; color: var(--encre); padding: 3px 8px; border-radius: 8px; background: var(--piste); line-height: 1.5; } .bio .pi, .dp .pi { display: inline-block; vertical-align: -2px; margin-right: 2px; }
  .bio i { color: var(--gris); font-style: normal; }
  .hors-t { color: var(--acc); font-weight: 600; }
  .trou { font-size: 12px; color: var(--gris); border-left: 2px dashed var(--trait2); padding-left: 8px; }
  .fait { display: flex; align-items: flex-start; gap: 6px; font-size: 12px; } .fait .pi { margin-top: 2px; } .fait small { font-size: 11px; }
  .reel { display: flex; flex-direction: column; gap: 6px; padding: 8px 10px; border-radius: 8px; background: #fff; box-shadow: inset 0 0 0 1px var(--trait); }
  .reel-h { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; } .reel-h b { font-size: 14px; }
  .verif { font-size: 11px; color: var(--acc); font-weight: 600; }
  /* la fiche */
  #fiche-racine { position: relative; z-index: 40; }
  .fi-voile { position: fixed; inset: 0; background: rgba(22,22,26,.32); }
  .fi { position: fixed; left: 0; right: 0; bottom: 0; max-height: 88vh; overflow-y: auto; overscroll-behavior: contain; background: #fff; border-radius: 8px 8px 0 0; box-shadow: 0 -10px 30px -16px rgba(22,22,26,.6); padding: 4px 14px 14px; display: flex; flex-direction: column; gap: 8px; max-width: 390px; margin: 0 auto; }
  .mode-bulle .fi { left: auto; right: 16px; bottom: auto; top: 16px; width: 360px; max-height: calc(100vh - 32px); border-radius: 8px; margin: 0; box-shadow: 0 10px 30px -12px rgba(22,22,26,.5); }
  .fi-poignee { width: 32px; height: 4px; border-radius: 2px; background: #b9bcc6; align-self: center; flex: none; margin: 2px 0; }
  .mode-bulle .fi-poignee { display: none; }
  .fi-t { display: flex; align-items: center; gap: 8px; min-height: 30px; }
  .fi-t h2 { font-size: 16px; font-weight: 700; }
  .fi-x { margin-left: auto; width: 28px; height: 28px; border-radius: 50%; background: var(--piste); display: inline-flex; align-items: center; justify-content: center; }
  .fi-a { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; }
  .fi-ar { display: flex; flex-direction: column; gap: 4px; }
  .fi-l { display: flex; align-items: center; gap: 6px; font-size: 13px; } .fi-l b { color: var(--t); font-weight: 600; } .fi-c { color: var(--gris); font-size: 12px; } .fi-m { color: var(--encre); font-size: 12px; }
  .fi-b { font-size: 12px; } .fi-b small { color: var(--gris); }
  .fi-r { display: flex; justify-content: center; } .fi-roue text { font-family: var(--sans); }
  .fi-act { display: flex; align-items: center; gap: 6px; }
  .fi-g { display: inline-flex; gap: 2px; background: var(--piste); border-radius: 15px; padding: 2px; }
  .fi-g button { width: 26px; height: 26px; border-radius: 13px; display: inline-flex; align-items: center; justify-content: center; color: var(--gris); }
  .fi-g button[aria-pressed="true"] { background: var(--encre); color: #fff; }
  .appui { background: var(--piste); border-radius: 8px; }
  /* curseurs */
  input[type=range] { -webkit-appearance: none; appearance: none; width: 100%; height: 28px; background: transparent; }
  input[type=range]::-webkit-slider-runnable-track { height: 4px; background: var(--trait2); border-radius: 2px; }
  input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 24px; height: 24px; border-radius: 50%; background: var(--encre); margin-top: -10px; box-shadow: 0 0 0 3px #fff; }
  .cur { display: flex; align-items: center; gap: 8px; }
  .cur label { font-size: 12px; color: var(--gris); width: 44px; } .cur output { font: 600 13px var(--mono); width: 54px; text-align: right; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 10px; border-radius: 16px; background: #fff; box-shadow: inset 0 0 0 1.5px var(--trait2); font-size: 13px; font-weight: 600; }
  .chip[aria-pressed="true"] { box-shadow: inset 0 0 0 2px var(--h, var(--encre)); background: var(--piste); }
  .chip .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--h); }
`;

export const page = ({ titre, commentaire, css = '', corps, js = '' }) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titre)}</title>
<!-- ${commentaire} -->
${POLICES}
<style>${CSS}${css}</style>
</head>
<body>
${SPRITE}
<main class="ecran">${corps}
</main>
<div id="fiche-racine"></div>
<script>${COMMUN_JS}${FICHE_JS}${LEGENDE_JS}${LENTILLE_JS}${js}</script>
</body>
</html>
`;
export const ecrire = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); console.log('écrit ' + f.replace(E1 + '/', '') + ' (' + Math.round(s.length / 1024) + ' Ko)'); };
export const DONNEES_NOTE = 'Simulé : fils21-choisir/donnees/profils-simules.json (moteur profil-simule, note PROFIL-SIMULE.md), grille, paires et cas K3/K4 via z1/moteur-z.mjs. Vraies valeurs : base/consolide (α, huile, familles), fils19-choix/donnees (rapports au seuil, mesures en bière), fils21-choisir/donnees/comparatifs-dryhop.json (10 études).';
