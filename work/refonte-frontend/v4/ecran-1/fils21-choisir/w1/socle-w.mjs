// Lot 21 · le socle de w1 à w5 (« la réponse d'abord »). Une seule source pour les cinq :
//   - la baseline l8g, reprise telle quelle là où elle tient : pictos au trait (ton texte, crayon léger),
//     α du lot puis des fiches, usage en mot, légende derrière « ? », lentille au style / absolu, la vraie
//     fiche à l'appui long (runtime de fils18-baseline/l8g/noyau.mjs, avec nos houblons) ;
//   - enrichie : colonnes de l5b avec la bande du simulé (moustache), le trait de ma bière avant, l'orangé
//     hors du style ; bande d'incertitude sur échelle logarithmique ; mots de confiance (mesuré, panel,
//     calculé, ~ simulé, inconnu, à vérifier) ; feuille de preuve à un toucher ; réglages qui redessinent.
import fs from 'node:fs';
import path from 'node:path';
import { symboles, JET, NOM, COURT, CSS_FAMILLES, CSS_FICHE, runtime } from '../../fils18-baseline/l8g/noyau.mjs';
import { CSS as HABILLAGE } from '../../fils18-baseline/l8g/habillage.mjs';
import { EXTRA as EXTRA_TRAIT, net } from '../../fils18-baseline/l8g/pictos-trait.mjs';
import * as D from './donnees-w.mjs';

export { D, JET, NOM, COURT };
export const { REPO, ORDRE, BANDE, CRAN, HOP, STUB } = D;
export const ACC = '#c2410c';
export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const fr = (x, d = 1) => { if (x == null || Number.isNaN(x)) return ''; const k = 10 ** d; return String(Math.round(x * k) / k).replace('.', ',').replace('-', '−'); };
export const frx = (x) => (x == null ? '?' : x >= 100 ? String(Math.round(x)) : x >= 10 ? fr(x, 0) : x >= 1 ? fr(x, 1) : x >= 0.1 ? fr(x, 2) : fr(x, 3));
export const rgba = (h, a) => 'rgba(' + [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',') + ',' + a + ')';
export const MOTS_F = { floral: 'floral', herbal: 'herbacé', earthy: 'terreux', citrus: 'agrumes', tropical: 'tropical', stoneFruit: 'fruits à noyau', pomeFruit: 'pépins', berries: 'petits fruits', melon: 'melon', resin: 'résineux', spice: 'épicé', green: 'végétal' };

// ---------- icônes : pictos au trait de l8g, actions lucide à 1,5 px rendu à chaque taille ----------
const V3 = fs.readFileSync(REPO + '/work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html', 'utf8');
const SYM = {};
for (const m of V3.matchAll(/<symbol id="p-([a-zA-Z]+)" viewBox="[^"]+"[^>]*>([\s\S]*?)<\/symbol>/g)) SYM[m[1]] = m[2];
const CRAYON = '<filter id="crayon" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="7"/><feDisplacementMap in="SourceGraphic" scale="0.8"/></filter>';
function lucide(nom) {
  const t = fs.readFileSync(REPO + '/node_modules/lucide-react/dist/esm/icons/' + nom + '.mjs', 'utf8').match(/const __iconNode = (\[[\s\S]*?\]);\nconst/)[1];
  return new Function('return ' + t)().map(([tag, a]) => '<' + tag + ' ' + Object.entries(a).filter(([k]) => k !== 'key').map(([k, v]) => k + '="' + v + '"').join(' ') + '/>').join('');
}
const PLUS = { timer: 'timer', huile: 'droplet', bio: 'sparkles', risque: 'triangle-alert', cumul: 'layers', panel: 'users', labo: 'flask-conical', calc: 'sigma', refus: 'octagon-x', ok: 'circle-check', aide2: 'message-circle-question-mark', chevh: 'chevron-up', chevb: 'chevron-down', retourner: 'undo-2', reglages: 'sliders-horizontal', cible: 'target', thermo: 'thermometer', sablier: 'hourglass', biere: 'beer', vent: 'wind', idee: 'lightbulb', melange: 'shuffle', main: 'hand', echelle: 'ruler', info: 'info' };
const TAILLES = [12, 14, 16, 18, 20];
const r3 = (x) => Math.round(x * 1000) / 1000;
const TON = Object.fromEntries(ORDRE.map((f) => [f, JET[f].texte]));
export const SYMB = symboles({ trait: 1.5, tailles: TAILLES })
  .replace(/<symbol id="p-([a-zA-Z]+)"[\s\S]*?<\/symbol>/g, (m, f) => `<symbol id="p-${f}" viewBox="0 0 24 24" fill="none" stroke="${TON[f]}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><g filter="url(#crayon)">${net(SYM[f])}</g></symbol>`)
  .replace('</svg>', TAILLES.map((z) => Object.entries(PLUS).map(([k, n]) => `<symbol id="i-${k}-${z}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${r3(1.5 * 24 / z)}" stroke-linecap="round" stroke-linejoin="round">${lucide(n)}</symbol>`).join('')).join('') + '<defs>' + CRAYON + '</defs></svg>');
export const ic = (k, z = 16, cls = 'ic') => `<svg class="${cls}" width="${z}" height="${z}" aria-hidden="true"><use href="#i-${k}-${z}"/></svg>`;
export const pic = (f, w = 16, attrs = '') => `<svg class="pi" width="${w}" height="${w}" data-famille="${f}" ${attrs} role="img" aria-label="${NOM[f]}"><use href="#p-${f}"/></svg>`;

// ---------- moments ----------
export const MOMENT = {
  b60: { t: '60′', ic: 'ebu', lg: 'à 60′ d’ébullition', court: '60′' }, b10: { t: '10′', ic: 'ebu', lg: 'à 10′ de la fin', court: '10′' },
  wp: { t: 'whirlpool', ic: 'whirl', lg: 'au whirlpool', court: 'WP' }, dryActive: { t: 'actif', ic: 'cuveA', lg: 'dry hop en fermentation active', court: 'actif' },
  dryPost: { t: 'après', ic: 'cuveP', lg: 'dry hop après fermentation', court: 'après' },
};
export const moment = (id, z = 14) => `<span class="w-mo" data-role="moment" data-moment="${id}" aria-label="Moment : ${MOMENT[id].lg}">${ic(MOMENT[id].ic, z)}<span>${MOMENT[id].t}</span></span>`;

// ---------- un houblon : nom (appui long : sa fiche), α du lot puis des fiches, usage en mot ----------
const USAGE_MOT = { amérisant: 'amérisant', aromatique: 'aromatique', double: 'mixte' };
export function alpha(nom, o = {}) {
  const A = HOP[nom].alpha, pl = A.fiches ? fr(A.fiches[0]) + '–' + fr(A.fiches[1]) + '%' : '';
  const lot = A.lot != null ? `<span class="al lot" data-role="alpha" data-source="lot" data-nature="mesure" aria-label="α du lot en stock : ${fr(A.lot)} %, ${esc(A.lotSource)}${A.horsFiches ? ' ; hors des plages de ses fiches (' + pl + ')' : ''}">${fr(A.lot)}%${A.horsFiches ? ic('diff', 12) : ''}</span>` : '';
  const fi = (A.lot == null || o.plage) && A.fiches ? `<span class="al fi" data-role="alpha" data-source="fiches" data-nature="mesure" aria-label="α des fiches : ${pl} (${esc(A.sources)})${nom === 'Citra' ? ', Citra en pellets' : ''}">${ic('livre', 12)}${pl}${o.pellets && nom === 'Citra' ? '<span class="pel">pellets</span>' : ''}</span>` : '';
  return `<span class="w-al">${lot}${fi}</span>`;
}
export function usage(nom) {
  const u = HOP[nom].usage;
  return `<span class="us us-mot${u.src === 'règle' ? ' deduit' : ''}" data-role="usage" data-usage="${u.v}" data-source="${u.src}" aria-label="Usage : ${USAGE_MOT[u.v]}${u.src === 'règle' ? ', déduit de l’α, à valider' : ', attesté par le fournisseur'}"><span class="us-m">${USAGE_MOT[u.v]}</span></span>`;
}
export function stock(nom, grammes) {
  const s = HOP[nom].stock, k = s >= grammes ? ['stock', 'en stock : ' + s + ' g'] : s > 0 ? ['manque', 'stock insuffisant : ' + s + ' g pour ' + grammes + ' g'] : ['achat', nom === 'Citra' && HOP.Citra.cryo ? 'à acheter en pellets ; en stock : Citra cryo ' + HOP.Citra.cryo.grammes + ' g' : 'à acheter'];
  return `<span class="w-stk" role="img" aria-label="${esc(k[1])}">${ic(k[0], 14)}</span>`;
}
export const nomH = (nom, cls = '') => `<span class="hn ${cls}" data-houblon="${esc(nom)}" data-couleur="${HOP[nom].couleur}" tabindex="0"><i class="w-pt" style="background:${HOP[nom].couleur}" aria-hidden="true"></i>${esc(nom)}</span>`;
export const hop = (nom, o = {}) => `<span class="w-hop">${nomH(nom)}${o.alpha === false ? '' : alpha(nom, o)}${o.usage === false ? '' : usage(nom)}${o.grammes ? stock(nom, o.grammes) : ''}</span>`;

// ---------- les colonnes de l5b, enrichies : zone du style, ~ après, trait avant, bande, orangé ----------
export const PX = 10, MAXC = 5, HA = 50;
// La même géométrie côté générateur et côté page (injectée par toString).
export function geo(f, v, B, C, PX, HA, MAXC) {
  const band = B[f], cr = C[f];
  const k = (x) => (x - band[0]) / cr;
  const S = (x) => Math.max(0, Math.min(MAXC, k(x))) * PX;
  const A = (x) => (Math.max(0, Math.min(100, x)) / 100) * HA;
  const un = (T, z) => { const h = T(v.centre); return { b: Math.min(h, z), xb: z, xh: Math.max(0, h - z), w0: T(v.bas), w1: T(v.haut), z }; };
  return { s: un(S, 3 * PX), a: un(A, (band[1] / 100) * HA), dep: k(v.centre) > MAXC, depH: k(v.haut) > MAXC, hors: v.centre > band[1], bord: v.centre <= band[1] && v.haut > band[1] };
}
export const deltaTxt = (d) => (d == null ? '?' : Math.abs(d) < 0.5 ? '' : (d > 0 ? '+' : '−') + Math.round(Math.abs(d)));
const vars = (g, av) => `--bS:${g.s.b}px;--xbS:${g.s.xb}px;--xhS:${g.s.xh}px;--w0S:${g.s.w0}px;--w1S:${g.s.w1}px;--zS:${g.s.z}px;--bA:${g.a.b}px;--xbA:${g.a.xb}px;--xhA:${g.a.xh}px;--w0A:${g.a.w0}px;--w1A:${g.a.w1}px;--zA:${g.a.z}px;--avS:${av.s.b + av.s.xh}px;--avA:${av.a.b + av.a.xh}px`;
export function colonne(f, apres, avant, o = {}) {
  const v = apres[f], a = avant[f];
  const g = geo(f, v, BANDE, CRAN, PX, HA, MAXC), ga = geo(f, a, BANDE, CRAN, PX, HA, MAXC);
  const d = v.inconnu && v.centre === a.centre ? null : v.crans - a.crans;
  const cls = [v.inconnu ? 'inc' : '', g.hors ? 'hors' : '', g.dep ? 'dep' : '', v.hautPartiel || g.depH ? 'hp' : '', o.cible === f ? 'cible' : ''].filter(Boolean).join(' ');
  return `<span class="w-col ${cls}" data-famille="${f}" style="--c:${JET[f].base};--t:${JET[f].texte};--z:${rgba(JET[f].base, 0.18)};${vars(g, ga)}" role="img" aria-label="${NOM[f]} : ${v.inconnu ? 'inconnu, pas zéro' : '~ ' + fr(v.crans) + ' crans du style (avant ' + fr(a.crans) + '), bande ' + fr(v.bas, 0) + '–' + fr(v.haut, 0) + ' sur 100'}${g.hors ? ', hors de ta 16D' : ''}">`
    + `<b class="w-dl" data-nature="simule">${v.inconnu ? '?' : deltaTxt(d)}</b>`
    + `<span class="w-z"><i class="w-zone" data-role="zone"></i><i class="w-w"></i><i class="w-b" data-nature="simule"></i><i class="w-x"></i><i class="w-av"></i><i class="w-i"></i></span>${pic(f, 16)}</span>`;
}
// Le profil en lignes (on s'écarte de la colonne de l5b, voir la NOTE) : chaque famille a son NOM écrit, une
// piste horizontale (0 à 5 crans du style ; absolu : 0 à 100), la zone de la 16D en pâle, le trait de ma bière
// avant, la barre ~ après, sa bande (pointillée quand la borne haute n'est pas publiée), l'orangé hors du style,
// et l'écart écrit avec son unité (« +2 crans »).
export const LW = 180, LPX = LW / MAXC;
export const deltaU = (d) => { const t = deltaTxt(d); return t === '?' ? '?' : t ? t + (Math.abs(Math.round(d)) >= 2 ? ' crans' : ' cran') : ''; };
export function ligne(f, apres, avant, o = {}) {
  const v = apres[f], a = avant[f];
  const g = geo(f, v, BANDE, CRAN, LPX, LW, MAXC), ga = geo(f, a, BANDE, CRAN, LPX, LW, MAXC);
  const d = v.inconnu && v.centre === a.centre ? null : v.crans - a.crans;
  const cls = [v.inconnu ? 'inc' : '', g.hors ? 'hors' : '', g.dep ? 'dep' : '', v.hautPartiel || g.depH ? 'hp' : '', o.cible === f ? 'cible' : '', a.centre > BANDE[f][1] ? 'deja' : ''].filter(Boolean).join(' ');
  return `<div class="w-col w-row ${cls}" data-famille="${f}" style="--c:${JET[f].base};--t:${JET[f].texte};--z:${rgba(JET[f].base, 0.2)};${vars(g, ga)}">`
    + `${pic(f, 16)}<span class="w-rn">${COURT[f]}</span><span class="w-z" role="img" aria-label="${NOM[f]} : ${v.inconnu ? 'inconnu, pas zéro' : '~ ' + fr(v.crans) + ' crans du style, avant ' + fr(a.crans)}${g.hors ? ', hors de ta 16D' : ''}"><i class="w-zone" data-role="zone"></i><i class="w-w"></i><i class="w-b" data-nature="simule"></i><i class="w-x"></i><i class="w-av"></i><i class="w-i"></i></span>`
    + `<b class="w-dl" data-nature="simule">${v.inconnu ? '? inconnu' : deltaU(d)}</b></div>`;
}
export const profilLignes = (apres, avant, o = {}) => `<div class="w-prof w-lignes${o.cls ? ' ' + o.cls : ''}" ${o.id ? 'id="' + o.id + '"' : ''} data-role="profil" data-px="${LPX}" data-ha="${LW}">${(o.familles || ORDRE).map((f) => ligne(f, apres, avant, o)).join('')}</div>`;
// Le bloc profil : 12 colonnes ; o.familles pour n'en montrer qu'une partie.
export const profil = (apres, avant, o = {}) => `<div class="w-prof${o.cls ? ' ' + o.cls : ''}" ${o.id ? 'id="' + o.id + '"' : ''} data-role="profil">${(o.familles || ORDRE).map((f) => colonne(f, apres, avant, o)).join('')}</div>`;
// Ce que ça change, en mots du brasseur : les familles qui bougent d'un cran ou plus.
export function change(apres, avant, n = 3) {
  const xs = ORDRE.map((f) => ({ f, d: apres[f].inconnu ? null : apres[f].crans - avant[f].crans })).filter((x) => x.d != null && Math.abs(x.d) >= 0.5).sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, n);
  return xs.map((x) => `<span class="w-ch${apres[x.f].centre > BANDE[x.f][1] ? ' hors' : ''}" data-famille="${x.f}">${pic(x.f, 14)}<b>${deltaTxt(x.d)}</b> ${MOTS_F[x.f]}</span>`).join('');
}
export function verdict(apres, avant = D.AVANT) {
  const hors = ORDRE.filter((f) => !apres[f].inconnu && apres[f].centre > BANDE[f][1] && avant[f].centre <= BANDE[f][1]);
  const bord = ORDRE.filter((f) => !apres[f].inconnu && apres[f].centre <= BANDE[f][1] && apres[f].centre > BANDE[f][1] * 0.66 && avant[f].centre <= BANDE[f][1]);
  return hors.length ? { k: 'hors', t: 'sort de ta 16D', f: hors } : bord.length ? { k: 'bord', t: 'au bord de ta 16D', f: bord } : { k: 'dans', t: 'reste dans ta 16D', f: [] };
}
export const verdictHtml = (apres, avant) => { const v = verdict(apres, avant); return `<span class="w-vd ${v.k}" data-nature="simule">${ic(v.k === 'hors' ? 'risque' : v.k === 'bord' ? 'cible' : 'ok', 16)}<span>~ ${v.t}</span>${v.f.slice(0, 2).map((f) => pic(f, 14)).join('')}</span>`; };

// ---------- mots de confiance ----------
export const MOT = {
  mesure: ['mesuré', 'labo'], panel: ['panel', 'panel'], calcule: ['calculé', 'calc'], simule: ['~ simulé', 'reglages'], inconnu: ['inconnu', ''], verifier: ['à vérifier', 'risque'], fiche: ['fiche', 'livre'], figure: ['lu sur figure', 'echelle'],
};
export const conf = (k, extra = '') => `<span class="w-cf ${k}">${MOT[k][1] ? ic(MOT[k][1], 12) : '<i class="w-hach" aria-hidden="true"></i>'}${MOT[k][0]}${extra}</span>`;
export const inconnu = (raison, txt = 'inconnu') => `<span class="w-inc" data-inconnu="${esc(raison)}" aria-label="inconnu : ${esc(raison)}"><i class="w-hach" aria-hidden="true"></i>${txt}</span>`;
// Une vraie valeur : data-nature="mesure", sa source dans l'élément.
export const V = (texte, source, cls = '') => `<span class="w-v mono ${cls}" data-nature="mesure" data-source="${esc(source)}">${texte}</span>`;

// ---------- la bande d'incertitude, sur une échelle logarithmique (×0,01 à ×10 000) ----------
export function bandeLog({ compose, familles = [], min, max, central, auMoins, source, qui = '', mot = 'calculé', W = 214, couleur }) {
  const L0 = -2, L1 = 4, x = (v) => ((Math.log10(Math.max(10 ** L0, Math.min(10 ** L1, v))) - L0) / (L1 - L0)) * W;
  const a = min != null ? x(min) : 0, b = max != null ? x(max) : W, c = central != null ? x(central) : null;
  const ouvert = max == null, txt = min != null && max != null ? '×' + frx(min) + '–' + frx(max).replace(/\s/g, '') : min != null ? '×' + frx(min) + ' au moins' : 'inconnu';
  const ticks = [-2, -1, 0, 1, 2, 3, 4].map((l) => `<i class="w-lt${l === 0 ? ' s' : ''}" style="left:${x(10 ** l)}px"></i>`).join('');
  const col = couleur || JET[familles[0] || 'floral'].base;
  return `<div class="w-lg" data-nature="mesure" data-source="${esc(source)}">`
    + `<div class="w-lg-t">${familles.map((f) => pic(f, 14)).join('')}<b>${esc(compose)}</b>${qui ? `<span class="w-lg-q">${qui}</span>` : ''}<span class="mono w-lg-v">${txt}</span>${conf(mot === 'calculé' ? 'calcule' : 'mesure')}</div>`
    + `<div class="w-lg-r" style="width:${W}px">${ticks}<i class="w-lb${ouvert ? ' ouvert' : ''}" data-role="incertitude" style="left:${a}px;width:${Math.max(3, b - a)}px;--c:${col}"></i>${c != null ? `<i class="w-lc" style="left:${c}px"></i>` : ''}`
    + `<span class="w-lx" style="left:${x(1)}px">seuil</span><span class="w-lx g" style="left:${x(0.01)}px">×0,01</span><span class="w-lx d" style="left:${W}px">×10 000</span></div></div>`;
}

// ---------- commandes ----------
export const lentille = () => '<span class="seg lentille" role="radiogroup" aria-label="Lecture"><button role="radio" type="button" data-e="style" aria-checked="true">Au style</button><button role="radio" type="button" data-e="absolu" aria-checked="false">Absolu</button></span>';
export const tete = (titre) => `<header class="w-tete"><button class="w-ret" type="button" aria-label="Retour">${ic('chev-l', 20)}</button><h1>${titre}</h1>${lentille()}<button type="button" class="leg-b" data-role="legende-bouton" aria-expanded="false" aria-label="Légende">?<i class="doigt" aria-hidden="true"></i></button></header>`;
// Un groupe de réglage (boutons radio) : data-role="reglage" sur chaque bouton, data-reglage sur le groupe.
export const seg = (reglage, label, items, actif, cls = '') => `<span class="w-seg ${cls}" role="radiogroup" aria-label="${esc(label)}" data-reglage="${reglage}">${items.map((x) => `<button type="button" role="radio" data-role="reglage" data-reglage="${reglage}" data-v="${esc(x.v)}" aria-checked="${x.v === actif}"${x.aria ? ' aria-label="' + esc(x.aria) + '"' : ''}>${x.h || esc(x.t)}</button>`).join('')}</span>`;
export const curseur = (reglage, label, { min, max, step = 1, value, liste }) => `<input class="w-cur" type="range" data-role="reglage" data-reglage="${reglage}" aria-label="${esc(label)}" min="${min}" max="${max}" step="${step}" value="${value}"${liste ? ` data-liste="${liste.join(',')}"` : ''}>`;
export const feuille = (id, titre, corps) => `<template data-d="${id}"><div class="w-f-t"><b>${titre}</b><button type="button" data-role="fermer-detail" aria-label="Fermer">${ic('x', 18)}</button></div><div class="w-f-c">${corps}</div></template>`;
export const pourquoi = (id, t = 'Pourquoi ?') => `<button type="button" class="w-pq" data-detail="${id}">${ic('aide2', 14)}<span>${t}</span></button>`;

// ---------- une preuve : une étude, une mesure ----------
export function preuve(m, o = {}) {
  if (!m) return '';
  const num = typeof m.valeur === 'number' || /^[ds,.-–/]+$/.test(String(m.valeur));
  const val = typeof m.valeur === 'number' ? fr(m.valeur, m.valeur < 1 ? 3 : 1) : esc(m.valeur);
  const quoi = m.compose || m.descripteur || '';
  return `<li class="w-pv" data-nature="mesure" data-source="${esc(m.etude + ' · ' + m.ref)}">${m.famille ? pic(m.famille, 14) : ic('panel', 14)}<span class="w-pv-q">${esc(o.quoi || quoi)}${o.qui !== false ? ' · ' + esc(o.qui || m.variete) : ''}</span>${num ? `<b class="mono">${val}${m.unite && !/qualitatif|présence|figure/.test(m.unite) ? ' ' + esc(m.unite) : ''}</b>` : '<b></b>'}${num ? '' : `<span class="w-pv-x">« ${val} »</span>`}`
    + `<span class="w-pv-s">${conf(o.mot || (m.descripteur ? 'panel' : 'mesure'))}${m.aVerifier ? conf('verifier') : ''}${m.figure ? conf('figure') : ''}<span class="w-ref">${esc(m.ref)}${m.niveau ? ' · ' + (m.niveau === 'P' ? 'publié' : 'congrès') : ''}</span></span>${o.note ? `<span class="w-pv-n">${o.note}</span>` : ''}</li>`;
}

// ---------- la légende, derrière « ? » ----------
export function legende(extra = '') {
  const ex = (cls, h, x = '') => `<span class="w-col w-ex ${cls}" data-famille="tropical" style="--c:${JET.tropical.base};--t:${JET.tropical.texte};--z:${rgba(JET.tropical.base, 0.18)};--bS:${h}px;--xbS:30px;--xhS:0px;--w0S:${Math.max(0, h - 8)}px;--w1S:${h + 10}px;--zS:30px;--avS:6px">${x}<span class="w-z"><i class="w-zone"></i><i class="w-w"></i><i class="w-b"></i><i class="w-x"></i><i class="w-av"></i><i class="w-i"></i></span></span>`;
  return `<div class="w-voile" data-role="legende-voile" hidden></div><section class="w-leg" id="legende" data-role="legende" role="dialog" aria-label="Légende" hidden>
    <div class="w-f-t"><b>Légende</b><button type="button" data-role="legende-fermer" aria-label="Fermer la légende">${ic('x', 18)}</button></div>
    <div class="w-leg-s"><h3>Les familles</h3><div class="w-leg-g">${ORDRE.map((f) => `<span class="w-leg-i">${pic(f, 18)}${COURT[f]}</span>`).join('')}</div></div>
    <div class="w-leg-s"><h3>Une colonne</h3><div class="w-leg-g l2">
      <span class="w-leg-i">${ex('', 22)}zone pâle : ce que ta 16D permet</span>
      <span class="w-leg-i">${ex('', 22)}barre : ~ après, simulé ; moustache : sa bande</span>
      <span class="w-leg-i">${ex('', 0)}trait noir : ta bière avant</span>
      <span class="w-leg-i">${ex('hors', 30).replace('--xhS:0px', '--xhS:12px')}orangé : hors de ta 16D</span>
      <span class="w-leg-i">${ex('inc', 0)}hachuré : inconnu, jamais zéro</span>
      <span class="w-leg-i"><b class="mono">+2</b>deux crans du style de plus</span></div></div>
    <div class="w-leg-s"><h3>Les mots</h3><div class="w-leg-g l2">
      <span class="w-leg-i">${conf('mesure')}en bière ou en labo, avec l’étude</span><span class="w-leg-i">${conf('panel')}dégusté par un jury</span>
      <span class="w-leg-i">${conf('calcule')}rapport au seuil, d’après les fiches</span><span class="w-leg-i">${conf('simule')}profil estimé, pas une mesure</span>
      <span class="w-leg-i">${conf('inconnu')}aucune donnée</span><span class="w-leg-i">${conf('verifier')}lecture douteuse</span></div></div>
    <div class="w-leg-s"><h3>Un houblon</h3><div class="w-leg-g l2">
      <span class="w-leg-i"><span class="al lot">17,2%${ic('diff', 12)}</span>α du lot en stock ; ≠ hors des fiches</span><span class="w-leg-i"><span class="al fi">${ic('livre', 12)}10–15%</span>α des fiches</span>
      <span class="w-leg-i"><span class="us us-mot"><span class="us-m">aromatique</span></span>usage ; pâle : déduit de l’α</span><span class="w-leg-i">${ic('main', 16)}appui long sur un nom : sa fiche</span></div></div>
    ${extra}
  </section>`;
}

// ---------- la fiche g1 de la baseline (l8g), pour nos houblons ----------
const uniq = (xs) => { const vu = new Set(); return xs.filter((w) => { const k = w.toLowerCase(); if (vu.has(k)) return false; vu.add(k); return true; }).map((w) => w.toLowerCase()); };
const NOMS_H = { myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène', farnesene: 'farnésène', linalool: 'linalol' };
function ficheDe(nom) {
  const h = HOP[nom], f = h.pack, comp = (f.huiles && f.huiles.composants) || {};
  const ps = (s) => ({ src: s.source, an: s.annee ?? null, min: s.min, max: s.max });
  return {
    nom, role: { v: h.usage.v, src: h.usage.src, txt: h.usage.txt.replace(/^[^:]+ : /, '') }, voie: null, stock: h.stock > 0 ? 'suffisant' : 'à acheter', ajout: null,
    alphaC1: { lot: h.alpha.lot, lotSource: h.alpha.lotSource, fiches: h.alpha.fiches, horsFiches: h.alpha.horsFiches },
    origine: f.origin || null, alpha: ((f.alpha && f.alpha.sources) || []).map(ps), lot: h.alpha.lot,
    beta: ((f.beta && f.beta.sources) || []).map(ps), huiles: ((f.huiles && f.huiles.totale && f.huiles.totale.sources) || []).map(ps),
    composants: Object.entries(NOMS_H).map(([k, n]) => (comp[k] ? { nom: n, min: comp[k].min, max: comp[k].max, src: comp[k].source } : { nom: n, raison: comp[k + 'Raison'] || null })),
    aromes: (f.aromes || []).filter((a) => a.sources > 0).map((a) => ({ f: a.family, n: a.sources, of: a.of, auteurs: a.authors || [], mots: uniq((a.mots || []).flatMap((m) => m.mots)), premier: a.sources === 1 && (a.premier || []).length > 0 })),
    of: ((f.aromes || [])[0] || {}).of || 0, sans: uniq((f.motsSansFamille || []).map((s) => s.mot)),
    styles: (f.usage || []).flatMap((u) => u.styles || []), stylesSrc: (f.usage || []).map((u) => u.source).filter(Boolean), stylesRaison: f.usageRaison || null,
    desc: (f.descripteurs && f.descripteurs.beerMaverick) || [], subs: [], subsRaison: nom === 'Citra' && h.cryo ? 'en stock : Citra cryo ' + h.cryo.grammes + ' g, α ' + String(h.cryo.alpha).replace('.', ',') + ' %' : 'non renseigné dans le pack',
  };
}
export const FICHES = Object.fromEntries(Object.keys(HOP).map((n) => [n, ficheDe(n)]));

// ---------- styles ----------
const FICHE_STRUCT = `
  .al { display: inline-flex; align-items: center; gap: 2px; font: 600 12px/1 var(--mono); color: var(--encre); white-space: nowrap; }
  .al.lot::before { content: 'α'; font: 400 12px var(--sans); color: var(--gris); margin-right: 1px; }
  .al.fi { font-weight: 400; color: var(--gris); }
  .al .ic { color: var(--gris); }
  .al .pel { font: 400 12px var(--sans); margin-left: 3px; }
  .us { display: inline-flex; align-items: center; background: none; border-radius: 0; padding: 0; }
  .us-mot { font-size: 12px; font-weight: 600; color: var(--encre); }
  .us-mot.deduit { font-weight: 400; color: var(--gris); }
  ${CSS_FICHE}
  .f-fiche { font-family: var(--sans); }
  .f-nom { font-size: 16px; font-weight: 700; } .f-aa { font: 600 16px var(--mono); } .f-grec { font-size: 14px; } .f-lot, .f-cpt, .f-lab-mots, .f-lab-sans, .f-lab-nd, .f-seule, .f-dem, .f-repli, .f-sec, .f-tag { font-size: 12px; }
  .f-lot, .f-rg-v { font-family: var(--mono); } .f-role { font-size: 12px; } .f-act { font-size: 14px; } .r-lab { font-size: 12px; font-family: var(--sans); }
  .f-note { flex-basis: 100%; order: 9; font-size: 12px; color: var(--fi-gris); }
  .f-alpha { display: inline-flex; align-items: baseline; gap: 8px; }
  .f-alpha .al { font-size: 16px; } .f-alpha .al.fi { font-size: 14px; } .f-alpha .al.lot::before { font-size: 14px; }
  .f-bande { gap: 2px; align-items: flex-end; }
  .f-col { width: 20px; display: inline-flex; flex-direction: column; align-items: center; gap: 2px; }
  .f-colz { position: relative; width: 13px; height: 22px; }
  .f-colz::after { content: ''; position: absolute; left: -2px; right: -2px; bottom: 0; height: 1px; background: var(--trait2); }
  .f-colb { position: absolute; left: 0; right: 0; bottom: 1px; height: var(--h); background: var(--b); border-radius: 2px 2px 0 0; }
  .f-col.ci .f-colb { background: var(--f); box-shadow: inset 0 0 0 1.5px var(--b); }
  .f-col .pi { width: 14px; height: 14px; }
  .f-lab { grid-template-columns: 16px 1fr; }
  .f-lab .pi { grid-row: span 2; align-self: start; margin-top: 1px; }
  .r-pi.inc { opacity: .5; }`;

export const CSS = `
  ${CSS_FAMILLES}
  ${HABILLAGE}
  ${EXTRA_TRAIT}
  ${FICHE_STRUCT}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  [hidden] { display: none !important; }
  html, body { background: #fff; color: var(--encre); }
  body { font: 400 14px/1.25 var(--sans); -webkit-tap-highlight-color: transparent; font-variant-numeric: tabular-nums; }
  button, a { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; text-decoration: none; }
  svg { display: block; flex: none; }
  :focus-visible { outline: 2px solid var(--encre); outline-offset: 2px; }
  .mono { font-family: var(--mono); font-weight: 500; letter-spacing: -.02em; }
  .ecran { max-width: 390px; margin: 0 auto; padding: 4px 16px 32px; display: flex; flex-direction: column; gap: 10px; overflow-x: hidden; }
  .w-tete { display: flex; align-items: center; gap: 6px; height: 36px; }
  .w-ret { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; flex: none; margin-left: -6px; }
  .w-tete h1 { font-size: 16px; font-weight: 700; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .seg { display: inline-flex; flex: none; }
  .seg button { height: 26px; padding: 0 9px; font-size: 12px; white-space: nowrap; display: inline-flex; align-items: center; }
  .leg-b { width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; flex: none; color: var(--gris); font-size: 14px; font-weight: 700; box-shadow: inset 0 0 0 1px var(--trait2); }
  .leg-b[aria-expanded="true"] { z-index: 32; background: #fff; color: var(--encre); box-shadow: 0 0 0 2px var(--encre); }
  .doigt { display: none; position: absolute; left: 50%; top: 50%; width: 38px; height: 38px; margin: -19px 0 0 -19px; border-radius: 50%; background: rgba(22,22,26,.13); box-shadow: 0 0 0 2px rgba(22,22,26,.28); pointer-events: none; }
  .leg-b[aria-expanded="true"] .doigt { display: block; }

  /* un houblon */
  .w-hop { display: inline-flex; align-items: center; gap: 5px; flex-wrap: wrap; white-space: nowrap; }
  .hn { display: inline-flex; align-items: center; gap: 4px; font-weight: 700; text-decoration: underline dotted #9a9aa6; text-underline-offset: 3px; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; border-radius: 2px; }
  .hn.appui, .appui .hn { background: linear-gradient(#e4e4ea, #e4e4ea) no-repeat left / 0 100%; animation: appui 500ms linear forwards; }
  .w-pt { width: 8px; height: 8px; border-radius: 50%; flex: none; display: inline-block; }
  .w-al { display: inline-flex; align-items: center; gap: 5px; }
  .w-stk { display: inline-flex; color: var(--gris); }
  .w-mo { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; font-weight: 600; white-space: nowrap; }

  /* les colonnes */
  .w-prof { display: grid; grid-template-columns: repeat(var(--n, 12), 1fr); align-items: end; padding: 2px 0 0; }
  .w-col { position: relative; display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 0; }
  .w-dl { font: 600 12px/14px var(--mono); height: 14px; color: var(--t); white-space: nowrap; }
  .w-col.hors .w-dl { color: var(--acc); }
  .w-z { position: relative; width: 14px; height: ${MAXC * PX + 4}px; }
  .w-z::after { content: ''; position: absolute; left: -5px; right: -5px; bottom: 0; height: 1px; background: var(--trait2); }
  .w-zone { position: absolute; left: -3px; right: -3px; bottom: 1px; height: var(--zS); background: var(--z); border-top: 1.5px solid var(--t); }
  .w-b { position: absolute; left: 0; right: 0; bottom: 1px; height: var(--bS); background: var(--c); border-radius: 2px 2px 0 0; z-index: 1; transition: height .25s; }
  .w-x { position: absolute; left: 0; right: 0; bottom: calc(1px + var(--xbS)); height: var(--xhS); background: var(--acc); border-radius: 2px 2px 0 0; z-index: 1; transition: height .25s; }
  .w-w { position: absolute; left: 50%; width: 1.5px; margin-left: -0.75px; bottom: calc(1px + var(--w0S)); height: calc(var(--w1S) - var(--w0S)); background: rgba(22,22,26,.5); z-index: 2; transition: all .25s; }
  .w-col.hp .w-w { background: repeating-linear-gradient(0deg, rgba(22,22,26,.6) 0 3px, transparent 3px 5px); }
  .w-w::before, .w-w::after { content: ''; position: absolute; left: -3.25px; width: 8px; height: 1.5px; background: rgba(22,22,26,.7); }
  .w-col.hp .w-w::before { display: none; }
  .w-w::before { top: 0; } .w-w::after { bottom: 0; }
  .w-av { position: absolute; left: -5px; right: -5px; bottom: calc(var(--avS) - 0.5px); height: 2px; background: var(--encre); z-index: 3; border-radius: 2px; }
  .w-col.dep .w-z::before { content: ''; position: absolute; left: 50%; top: -6px; margin-left: -4px; border: 4px solid transparent; border-bottom: 5px solid var(--acc); border-top: 0; }
  .w-i { display: none; }
  .w-col.inc .w-i { display: block; position: absolute; left: -2px; right: -2px; bottom: 1px; height: 24px; border-radius: 2px; background: repeating-linear-gradient(135deg, #fff 0 2px, #9aa0ab 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; z-index: 4; }
  body.abs .w-b { height: var(--bA); } body.abs .w-x { bottom: calc(1px + var(--xbA)); height: var(--xhA); } body.abs .w-zone { height: var(--zA); }
  body.abs .w-w { bottom: calc(1px + var(--w0A)); height: calc(var(--w1A) - var(--w0A)); } body.abs .w-av { bottom: calc(var(--avA) - 0.5px); }
  body.abs .w-col.dep .w-z::before { display: none; }
  .w-col.cible .pi { outline: 2px solid var(--t); outline-offset: 2px; border-radius: 2px; }
  .w-ex { flex-direction: row; } .w-ex .w-z { height: 34px; }
  .w-lignes { display: flex; flex-direction: column; gap: 3px; }
  .w-row { flex-direction: row; align-items: center; gap: 6px; height: 20px; }
  .w-rn { width: 66px; font-size: 12px; font-weight: 600; color: var(--t); white-space: nowrap; flex: none; }
  .w-row .w-z { width: ${LW}px; height: 14px; flex: none; }
  .w-row .w-z::after { left: 0; right: auto; top: -3px; bottom: -3px; width: 1px; height: auto; }
  .w-row .w-zone { left: 0; right: auto; top: 0; bottom: 0; height: auto; width: var(--zS); border-top: 0; border-right: 1.5px solid var(--t); }
  .w-row .w-b { left: 0; right: auto; top: 3px; bottom: auto; height: 8px; width: var(--bS); border-radius: 0 2px 2px 0; transition: width .25s; }
  .w-row .w-x { left: var(--xbS); right: auto; top: 3px; bottom: auto; height: 8px; width: var(--xhS); border-radius: 0 2px 2px 0; transition: width .25s, left .25s; }
  .w-row .w-w { left: var(--w0S); right: auto; top: 50%; bottom: auto; margin: -0.75px 0 0; height: 1.5px; width: calc(var(--w1S) - var(--w0S)); }
  .w-row.hp .w-w { background: repeating-linear-gradient(90deg, rgba(22,22,26,.38) 0 3px, transparent 3px 6px); }
  .w-row .w-w::before, .w-row .w-w::after { left: auto; top: -3.25px; width: 1.5px; height: 8px; }
  .w-row .w-w::before { right: 0; } .w-row .w-w::after { left: 0; }
  .w-row .w-av { left: calc(var(--avS) - 1px); right: auto; top: -3px; bottom: -3px; width: 2px; height: auto; }
  .w-row.dep .w-z::before { left: auto; right: -7px; top: 50%; margin: -4px 0 0; border: 4px solid transparent; border-left: 5px solid var(--acc); border-right: 0; }
  .w-row.inc .w-i { left: 0; right: auto; top: 1px; bottom: 1px; width: 36px; height: auto; }
  .w-row .w-dl { font-size: 12px; min-width: 52px; text-align: left; color: var(--t); }
  .w-row .w-dl:empty::before { content: '≈'; color: var(--gris); }
  body.abs .w-row .w-b { width: var(--bA); height: 8px; } body.abs .w-row .w-x { left: var(--xbA); width: var(--xhA); height: 8px; bottom: auto; }
  body.abs .w-row .w-zone { width: var(--zA); height: auto; } body.abs .w-row .w-w { left: var(--w0A); width: calc(var(--w1A) - var(--w0A)); height: 1.5px; bottom: auto; }
  body.abs .w-row .w-av { left: calc(var(--avA) - 1px); bottom: -3px; }
  .w-row.cible { background: color-mix(in srgb, var(--z) 60%, #fff); border-radius: 4px; }
  .w-row.cible .pi { outline: 0; }
  @media (prefers-reduced-motion: reduce) { .w-b, .w-x, .w-w { transition: none; } }

  /* ce que ça change, le verdict, la confiance */
  .w-chs { display: flex; flex-wrap: wrap; gap: 4px 10px; font-size: 14px; }
  .w-ch { display: inline-flex; align-items: center; gap: 3px; color: var(--t); font-weight: 600; white-space: nowrap; }
  .w-ch b { font: 600 14px var(--mono); }
  .w-ch.hors b { color: var(--acc); }
  .w-vd { display: inline-flex; align-items: center; gap: 5px; font-size: 14px; font-weight: 700; white-space: nowrap; }
  .w-vd.dans { color: #2f6b4f; } .w-vd.bord { color: var(--encre); } .w-vd.hors { color: var(--acc); }
  .w-cf { display: inline-flex; align-items: center; gap: 3px; height: 18px; padding: 0 6px 0 4px; border-radius: 999px; font-size: 12px; font-weight: 600; color: var(--gris); box-shadow: inset 0 0 0 1px var(--trait2); white-space: nowrap; background: #fff; }
  .w-cf.simule { color: var(--encre); box-shadow: inset 0 0 0 1px var(--encre); }
  .w-cf.verifier { color: var(--acc); box-shadow: inset 0 0 0 1px var(--acc); }
  .w-cf.inconnu { color: var(--gris); }
  .w-hach { width: 12px; height: 8px; border-radius: 2px; flex: none; display: inline-block; background: repeating-linear-gradient(135deg, #fff 0 2px, #8a909b 2px 3.5px); box-shadow: inset 0 0 0 1px #8a909b; }
  .w-inc { display: inline-flex; align-items: center; gap: 4px; color: var(--gris); font-size: 12px; white-space: nowrap; }
  .w-v { font-size: 12px; white-space: nowrap; }

  /* la bande logarithmique */
  .w-lg { display: flex; flex-direction: column; gap: 3px; padding: 4px 0 2px; }
  .w-lg-t { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; font-size: 12px; }
  .w-lg-t b { font-size: 14px; } .w-lg-q { color: var(--gris); } .w-lg-v { font-size: 12px; font-weight: 600; margin-left: auto; }
  .w-lg-r { position: relative; height: 30px; margin: 0 auto 0 6px; }
  .w-lg-r::before { content: ''; position: absolute; left: 0; right: 0; top: 7px; height: 1px; background: var(--trait2); }
  .w-lt { position: absolute; top: 3px; width: 1px; height: 9px; background: var(--trait2); }
  .w-lt.s { width: 2px; top: 0; height: 15px; background: var(--encre); }
  .w-lb { position: absolute; top: 3px; height: 9px; background: color-mix(in srgb, var(--c) 45%, #fff); box-shadow: inset 0 0 0 1.5px var(--c); border-radius: 2px; }
  .w-lb.ouvert { background: linear-gradient(90deg, color-mix(in srgb, var(--c) 45%, #fff) 60%, #fff); box-shadow: inset 1.5px 0 0 var(--c), inset 0 1.5px 0 var(--c), inset 0 -1.5px 0 var(--c); }
  .w-lc { position: absolute; top: 1px; width: 4px; height: 13px; margin-left: -2px; background: var(--encre); border-radius: 2px; }
  .w-lx { position: absolute; top: 16px; transform: translateX(-50%); font-size: 12px; color: var(--gris); white-space: nowrap; line-height: 14px; }
  .w-lx.g { transform: none; } .w-lx.d { transform: translateX(-100%); }

  /* réglages */
  .w-seg { display: inline-flex; background: #ececf1; border-radius: 999px; padding: 2px; gap: 2px; flex-wrap: nowrap; }
  .w-seg button { min-height: 30px; padding: 0 10px; border-radius: 999px; font-size: 14px; color: var(--gris); white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; gap: 4px; }
  .w-seg button[aria-checked="true"] { background: #fff; color: var(--encre); font-weight: 700; box-shadow: 0 1px 2px rgba(0,0,0,.14); }
  .w-cur { width: 100%; height: 32px; accent-color: var(--encre); }
  .w-pq { display: inline-flex; align-items: center; gap: 4px; min-height: 28px; padding: 0 10px 0 8px; border-radius: 999px; font-size: 14px; font-weight: 600; box-shadow: inset 0 0 0 1.5px var(--encre); white-space: nowrap; }

  /* preuves */
  .w-pvs { list-style: none; display: flex; flex-direction: column; gap: 8px; }
  .w-pv { display: grid; grid-template-columns: 16px 1fr auto; column-gap: 6px; row-gap: 2px; align-items: center; font-size: 14px; }
  .w-pv .pi, .w-pv > .ic { grid-row: span 2; align-self: start; margin-top: 2px; }
  .w-pv b { font-size: 14px; font-weight: 600; text-align: right; white-space: nowrap; }
  .w-pv-s { grid-column: 2 / -1; display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
  .w-pv-x { grid-column: 2 / -1; font-size: 14px; font-weight: 600; }
  .w-pv-n { grid-column: 2 / -1; font-size: 12px; color: var(--gris); }
  .w-ref { font-size: 12px; color: var(--gris); }

  /* feuille de preuve et légende */
  .w-voile { position: fixed; inset: 0; z-index: 30; background: rgba(22,22,26,.3); }
  .w-voile[hidden] { display: none; }
  .w-feuille, .w-leg { position: fixed; z-index: 31; left: 0; right: 0; bottom: 0; max-width: 390px; margin: 0 auto; max-height: 82vh; overflow-y: auto; padding: 4px 16px 18px; border-radius: 8px 8px 0 0; background: #fff; box-shadow: 0 -8px 28px rgba(0,0,0,.2); display: flex; flex-direction: column; gap: 10px; }
  .w-feuille:not(.ouverte), .w-leg[hidden] { display: none; }
  .w-f-t { display: flex; align-items: center; justify-content: space-between; min-height: 40px; font-size: 16px; position: sticky; top: -4px; background: #fff; z-index: 2; }
  .w-f-t button { width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: #ececf1; }
  .w-f-c { display: flex; flex-direction: column; gap: 12px; font-size: 14px; }
  .w-f-c h3 { font-size: 12px; font-weight: 700; color: var(--gris); display: flex; align-items: center; gap: 6px; }
  .w-leg { font-size: 12px; }
  .w-leg-s { display: flex; flex-direction: column; gap: 6px; } .w-leg-s + .w-leg-s { border-top: 1px solid var(--trait); padding-top: 8px; }
  .w-leg-s h3 { font-size: 12px; font-weight: 700; color: var(--gris); }
  .w-leg-g { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 8px; } .w-leg-g.l2 { grid-template-columns: 1fr 1fr; }
  .w-leg-i { display: flex; align-items: center; gap: 6px; min-height: 24px; }
  .w-trou { display: flex; align-items: flex-start; gap: 6px; font-size: 12px; color: var(--gris); }
  .w-sep { border-top: 1px solid var(--trait); }
`;

export const POLICES = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap">';

// ---------- le script commun de la page : légende, feuille de preuve, simulateur ----------
export const JS_COMMUN = `
const LB = document.querySelector('[data-role="legende-bouton"]'), LG = document.querySelector('[data-role="legende"]'), LV = document.querySelector('[data-role="legende-voile"]');
const legende = (on) => { if (!LG) return; LG.hidden = !on; LV.hidden = !on; LB.setAttribute('aria-expanded', String(on)); };
LB && LB.addEventListener('click', () => legende(LB.getAttribute('aria-expanded') !== 'true'));
document.querySelectorAll('[data-role="legende-fermer"]').forEach((b) => b.addEventListener('click', () => legende(false)));
LV && LV.addEventListener('click', () => legende(false));
if (/[?&]legende\\b/.test(location.search)) legende(true);
const FEUILLE = document.querySelector('.w-feuille'), FV = document.querySelector('[data-role="feuille-voile"]');
function ouvrirDetail(id) {
  const t = document.querySelector('template[data-d="' + id + '"]'); if (!t || !FEUILLE) return;
  FEUILLE.replaceChildren(t.content.cloneNode(true)); FEUILLE.classList.add('ouverte'); FV.hidden = false; FEUILLE.scrollTop = 0;
  const b = FEUILLE.querySelector('[data-role="fermer-detail"]'); if (b) { b.addEventListener('click', fermerDetail); b.focus({ preventScroll: true }); }
  document.dispatchEvent(new CustomEvent('detail', { detail: id }));
}
function fermerDetail() { if (!FEUILLE) return; FEUILLE.classList.remove('ouverte'); FEUILLE.replaceChildren(); FV.hidden = true; }
FV && FV.addEventListener('click', fermerDetail);
document.addEventListener('click', (e) => { const d = e.target.closest('[data-detail]'); if (d && !e.defaultPrevented) ouvrirDetail(d.dataset.detail); });
document.addEventListener('keydown', (e) => { if (e.key !== 'Escape') return; legende(false); fermerDetail(); });
const qd = new URLSearchParams(location.search).get('detail'); if (qd) ouvrirDetail(qd);
// Le simulateur : la géométrie des colonnes, la même que celle du générateur.
const geo = ${geo.toString()};
const PX = ${PX}, HA = ${HA}, MAXC = ${MAXC};
const deltaTxt = ${deltaTxt.toString()};
const deltaU = ${deltaU.toString()};
function majCol(col, v, a) {
  const R = col.closest('[data-px]'), px = R ? +R.dataset.px : PX, ha = R ? +R.dataset.ha : HA, rang = col.classList.contains('w-row');
  const f = col.dataset.famille, g = geo(f, v, SIM.B, SIM.C, px, ha, MAXC), ga = geo(f, a, SIM.B, SIM.C, px, ha, MAXC);
  const s = col.style;
  for (const [k, o] of [['S', g.s], ['A', g.a]]) { s.setProperty('--b' + k, o.b + 'px'); s.setProperty('--xb' + k, o.xb + 'px'); s.setProperty('--xh' + k, o.xh + 'px'); s.setProperty('--w0' + k, o.w0 + 'px'); s.setProperty('--w1' + k, o.w1 + 'px'); s.setProperty('--z' + k, o.z + 'px'); }
  s.setProperty('--avS', (ga.s.b + ga.s.xh) + 'px'); s.setProperty('--avA', (ga.a.b + ga.a.xh) + 'px');
  col.classList.toggle('inc', !!v.inconnu); col.classList.toggle('hors', g.hors); col.classList.toggle('dep', g.dep); col.classList.toggle('hp', !!(v.hautPartiel || g.depH));
  const d = v.inconnu && v.centre === a.centre ? null : v.crans - a.crans;
  col.querySelector('.w-dl').textContent = v.inconnu ? (rang ? '? inconnu' : '?') : rang ? deltaU(d) : deltaTxt(d);
  col.setAttribute('aria-label', SIM.NOM[f] + ' : ' + (v.inconnu ? 'inconnu, pas zéro' : '~ ' + String(v.crans).replace('.', ',') + ' crans du style (avant ' + String(a.crans).replace('.', ',') + ')') + (g.hors ? ', hors de ta 16D' : ''));
}
function majProfil(root, apres, avant) { root.querySelectorAll('.w-col[data-famille]').forEach((c) => majCol(c, apres[c.dataset.famille], avant[c.dataset.famille])); }
const MOTS_F = ${JSON.stringify(MOTS_F)};
function verdict(p, a) {
  const F = Object.keys(SIM.B); a = a || SIM.AV;
  const hors = F.filter((f) => !p[f].inconnu && p[f].centre > SIM.B[f][1] && a[f].centre <= SIM.B[f][1]);
  const bord = F.filter((f) => !p[f].inconnu && p[f].centre <= SIM.B[f][1] && p[f].centre > SIM.B[f][1] * 0.66 && a[f].centre <= SIM.B[f][1]);
  return hors.length ? { k: 'hors', t: 'sort de ta 16D', f: hors } : bord.length ? { k: 'bord', t: 'au bord de ta 16D', f: bord } : { k: 'dans', t: 'reste dans ta 16D', f: [] };
}
const PIC = (f, w) => '<svg class="pi" width="' + w + '" height="' + w + '" data-famille="' + f + '" role="img" aria-label="' + SIM.NOM[f] + '"><use href="#p-' + f + '"/></svg>';
const ICO = (k, z) => '<svg class="ic" width="' + z + '" height="' + z + '" aria-hidden="true"><use href="#i-' + k + '-' + z + '"/></svg>';
function verdictHtml(p, a) { const v = verdict(p, a); return '<span class="w-vd ' + v.k + '" data-nature="simule">' + ICO(v.k === 'hors' ? 'risque' : v.k === 'bord' ? 'cible' : 'ok', 16) + '<span>~ ' + v.t + '</span>' + v.f.slice(0, 2).map((f) => PIC(f, 14)).join('') + '</span>'; }
function changeHtml(p, a, n) {
  const F = Object.keys(SIM.B);
  return F.map((f) => ({ f, d: p[f].inconnu ? null : p[f].crans - a[f].crans })).filter((x) => x.d != null && Math.abs(x.d) >= 0.5).sort((x, y) => Math.abs(y.d) - Math.abs(x.d)).slice(0, n || 3)
    .map((x) => '<span class="w-ch' + (p[x.f].centre > SIM.B[x.f][1] ? ' hors' : '') + '" data-famille="' + x.f + '">' + PIC(x.f, 14) + '<b>' + deltaTxt(x.d) + '</b> ' + MOTS_F[x.f] + '</span>').join('') || '<span class="w-ch">~ rien qui bouge d’un cran</span>';
}
const cle = (h, m, d, j, l) => [h, m, d, j == null ? '' : j, l].join('|');
`;

// ---------- la page ----------
export function page({ titre, commentaire, corps, css = '', js = '', sim = {}, demande = [{ f: 'citrus', s: 1 }], feuilles = '', legendeExtra = '' }) {
  const SIM = { B: BANDE, C: CRAN, NOM, AV: D.AVANT, ...sim };
  const rt = runtime({ extra: '' })
    .replace(/const FD = [^\n]*;\nconst ROUE/, 'const FD = ' + JSON.stringify(FICHES) + ';\nconst ROUE')
    .replace(/DEMANDE = \[[^\]]*\]/, 'DEMANDE = ' + JSON.stringify(demande));
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre}</title>
<!-- ${commentaire} -->
${POLICES}
<style>${CSS}
${css}</style>
</head>
<body>
${SYMB}
<main class="ecran">${corps}
</main>
${legende(legendeExtra)}
<div class="w-voile" data-role="feuille-voile" hidden></div><div class="w-feuille" role="dialog" aria-label="Preuve"></div>
${feuilles}
<script>const SIM = ${JSON.stringify(SIM)};
${JS_COMMUN}
${js}</script>
<script>${rt}</script>
</body>
</html>
`;
}
// Profils compacts pour la page : 12 × [bas, centre, haut, crans, inconnu], dans l'ordre des familles.
export const compacter = (p) => ORDRE.map((f) => [p[f].bas, p[f].centre, p[f].haut, p[f].crans, p[f].inconnu ? 1 : 0, p[f].hautPartiel ? 1 : 0]);
export const JS_DEPLIER = `const ORD = ${JSON.stringify(ORDRE)};
const deplier = (a) => Object.fromEntries(ORD.map((f, i) => [f, { bas: a[i][0], centre: a[i][1], haut: a[i][2], crans: a[i][3], inconnu: !!a[i][4], hautPartiel: !!a[i][5] }]));`;
export const ecrire = (f, s) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); console.log('écrit ' + f.replace(REPO + '/', '') + ' (' + Math.round(s.length / 1024) + ' Ko)'); };
export const STUB_MOT = 'moteur profil-simule (' + D.BRUT.date + '), conventions à valider';
