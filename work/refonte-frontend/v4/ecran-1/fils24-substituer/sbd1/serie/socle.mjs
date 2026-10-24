// Série d (Substituer, lot D125, voie sb-d) : le socle commun des huit concepts « Lequel à la place de Nugget ? ».
// Approche : selon le moment. À 60′ on remplace une amertume, tardif un arôme ; la vue le montre.
// Ce socle ne porte que le vocabulaire de la baseline (pas un gabarit) : pictos au trait de la planche v3 (épicé :
// cannelle et clou croisés, p-spice), jetons des familles, α et rôle, usage en mot, stock en petit badge, lentille
// au style / absolu, légende derrière « ? », la croix pour sortir (D109), l'appui long → fiche courte g1.
// Chaque concept compose sa page lui-même, avec ses classes préfixées (sbdN-…) ; le socle préfixe les siennes sbd-.
//
// Données (lues, jamais modifiées ; générées par ../donnees/*.ts depuis le moteur v4) :
//   ../donnees/remplacants-nugget.json : substitutes('beermaverick-nugget', { moment, grams: 46, recipe: S1, style: 16D })
//     à chaque moment, plus les fiches (hopSheet) des houblons cités ;
//   ../donnees/profils-moments.json : simulerCas, stout S1 sans houblon + un seul ajout (Nugget 46 g ou le remplaçant
//     à sa dose), à 60′, 10′, whirlpool, dry hop actif et après (3 j).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ici = path.dirname(fileURLToPath(import.meta.url));
export const LOT = path.resolve(ici, '../..'); // fils24-substituer
const lire = (p) => JSON.parse(fs.readFileSync(path.join(ici, p), 'utf8'));
export const R = lire('../donnees/remplacants-nugget.json');
export const P = lire('../donnees/profils-moments.json');
export const JET = lire('../../../fils17-standard/jetons-familles.json');
const PLANCHE = fs.readFileSync(path.join(ici, '../../../fils17-standard/v3/planche.html'), 'utf8');
const SYM = [...PLANCHE.matchAll(/<symbol id="p-[a-zA-Z]+"[^]*?<\/symbol>/g)].map((m) => m[0]);
if (SYM.length !== 12 || !SYM.some((s) => s.startsWith('<symbol id="p-spice"') && s.includes('rotate(40 12 14)'))) throw new Error('planche v3 : symboles introuvables ou p-spice changé');
export const SYMBOLES = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${SYM.join('')}<pattern id="sbd-hach" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#b9b9c4" stroke-width="1.4"/></pattern></defs></svg>`;

export const COURT = { citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', floral: 'Floral', herbal: 'Herbacé', resin: 'Résineux', spice: 'Épicé', green: 'Végétal', earthy: 'Terreux' };
export const ROUE = ['citrus', 'tropical', 'melon', 'stoneFruit', 'pomeFruit', 'berries', 'floral', 'green', 'herbal', 'spice', 'earthy', 'resin'];
export const STYLE = R.style; // 16D : floral, herbacé, terreux attendues (bande 0–55), les autres neutres (0–30)
export const BANDE = Object.fromEntries(Object.entries(STYLE.families).map(([f, v]) => [f, v.band[1]]));
export const ATTENDUES = Object.keys(STYLE.families).filter((f) => STYLE.families[f].status === 'attendue');
export const IBU_STYLE = STYLE.ibu; // [50, 70]

// Une couleur par houblon, la même sur les huit pages (D83 S1) ; Nugget, l'original, en gris foncé (D39).
export const COUL = {
  Nugget: '#4a4a55', Magnat: '#1f6fb2', Yeoman: '#6d4c41', Altus: '#546e7a', Trident: '#0e7c86', Zenia: '#3949ab',
  'Nelson Sauvin': '#2f7d32', Galaxy: '#ad1457', 'Idaho 7': '#5e35b1', Sabro: '#827717', Target: '#283593',
  Cascade: '#558b2f', 'Citra cryo': '#00695c', "Falconer's Flight": '#c2185b', Sterling: '#4e342e', Talus: '#37474f', Helios: '#6a1b9a', Loral: '#004d40', 'Marco Polo': '#880e4f', Stirling: '#33691e', Centennial: '#1a237e', 'Pacific Crest': '#3e2723', 'Hallertau Blanc': '#01579b', Motueka: '#1b5e20',
};

export const fr = (x, d = 0) => (Math.round(x * 10 ** d) / 10 ** d).toFixed(d).replace('.', ',');
export const fr1 = (x) => (Number.isInteger(x) ? String(x) : fr(x, 1));
export const g0 = (x) => (x < 10 ? fr1(Math.round(x * 10) / 10) : fr(x, 0));
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- les houblons ----------
const HOPS = R.hops;
const parNom = Object.fromEntries(Object.values(HOPS).map((h) => [h.name, h]));
export const ROLE_MOT = { double: 'mixte', amérisant: 'amérisant', aromatique: 'aromatique' };
function alphaDe(h) {
  const a = h.fiche.alpha, src = a.sources || [];
  const lot = a.retenu && a.retenu.min === a.retenu.max && !/plage/.test(a.retenu.from);
  return { v: a.retenu ? a.retenu.value : null, lot, min: Math.min(...src.map((s) => s.min)), max: Math.max(...src.map((s) => s.max)), sources: src.map((s) => s.source + ' ' + s.annee).join(', '), from: a.retenu ? a.retenu.from : null };
}
function betaDe(h) { const s = (h.fiche.beta && h.fiche.beta.sources) || []; return s.length ? { min: Math.min(...s.map((x) => x.min)), max: Math.max(...s.map((x) => x.max)) } : null; }
function motsDe(h) { // part sans famille (même calcul que controle-sans-famille : mots sans famille / tous les mots)
  const fam = h.fiche.aromes.flatMap((a) => a.mots.flatMap((m) => m.mots)).length, sans = (h.fiche.motsSansFamille || []).length;
  const vus = [...new Set((h.fiche.motsSansFamille || []).map((m) => m.mot.toLowerCase()))].filter((m) => !/^(fruité|fruity|doux)$/.test(m));
  return { part: fam + sans ? sans / (fam + sans) : 0, sans: vus };
}
export function houblon(nom) {
  const h = parNom[nom]; if (!h) throw new Error('houblon absent des données : ' + nom);
  return { nom, key: h.key, couleur: COUL[nom] || null, role: ROLE_MOT[h.role.value] || h.role.value, alpha: alphaDe(h), beta: betaDe(h),
    niveaux: Object.fromEntries(h.fiche.aromes.map((a) => [a.family, a.level])), aromes: h.fiche.aromes, mots: motsDe(h),
    stockG: h.fiche.stock ? h.fiche.stock.grams : null, huiles: h.fiche.huiles.composants };
}
export const NUGGET = houblon('Nugget');

// ---------- les cas (le moment est fixé par la recette ; ?cas=wp ou ?cas=dry montre le même Nugget déplacé) ----------
const MOMENT_SIM = { b60: 'b60', b30: null, b15: null, b10: 'b10', wp: 'wp', dryActive: 'dryActive', dryPost: 'dryPost' };
export const CAS = { b60: { m: 'b60', court: '60′', titre: 'à 60′' }, wp: { m: 'wp', court: 'whirlpool', titre: 'en whirlpool' }, dry: { m: 'dryActive', court: 'dry hop', titre: 'en dry hop actif' } };
function profil(m, key) { const s = MOMENT_SIM[m] && P.moments[MOMENT_SIM[m]] && P.moments[MOMENT_SIM[m]][key]; if (!s || !s.apres) return null;
  return Object.fromEntries(ROUE.map((f) => { const v = s.apres[f]; return [f, { c: v.centre, b: v.bas, h: v.haut, inc: !!v.inconnu && v.haut === 0 }]; })); }
function ligne(s, m) {
  const h = houblon(s.name);
  return { ...h, rang: s.rank, score: s.score, palier: s.palier, comp: s.composantes, fiab: s.couverture.fiabilite, huilesVues: s.couverture.huiles,
    dose: { g: s.dose.grams, min: s.dose.min, max: s.dose.max, regle: s.dose.regle }, stock: s.stock, gagne: s.familles.gagne, perd: s.familles.perd,
    communes: s.familles.communes, cher: s.amertumeDeconseillee, raison: s.raison, prof: profil(m, s.key) };
}
export function cas(id) {
  const c = CAS[id], o = R.moments[c.m];
  const tous = [...o.top, ...o.stock];
  const vus = new Map(); for (const s of tous) if (!vus.has(s.name)) vus.set(s.name, ligne(s, c.m));
  return { id, ...c, label: o.label, contexte: o.contexte, poids: o.poids, ref: o.reference, comptes: o.comptes, candidats: o.candidats,
    top: o.top.map((s) => vus.get(s.name)), stock: o.stock.map((s) => vus.get(s.name)), par: (n) => vus.get(n),
    nugget: { ...NUGGET, prof: profil(c.m, NUGGET.key), dose: { g: 46, min: 46, max: 46 } } };
}
export const SIMULE = P.mention;

// ---------- briques ----------
export const pic = (f, t = 16, cls = 'sbd-pi') => `<svg class="${cls}" width="${t}" height="${t}" viewBox="0 0 24 24" data-famille="${f}" aria-label="${COURT[f]}"><use href="#p-${f}"/></svg>`;
export const usage = (h) => `<span class="sbd-us" data-role="usage" data-houblon-usage="${esc(h.nom)}">${h.role}</span>`;
const IC = { // icônes au trait, toutes à 1,6 px rendu (D83 S4) : viewBox 16, largeur 16
  achat: '<path d="M1.5 2.5h2l1.6 7.5h7.2l1.4-5.5H4.3"/><circle cx="6.2" cy="13" r="1"/><circle cx="11.6" cy="13" r="1"/>',
  stock: '<path d="M2.5 5.5 8 2.5l5.5 3v5L8 13.5l-5.5-3Z"/><path d="M2.5 5.5 8 8.5l5.5-3M8 8.5v5"/>',
  vide: '<path d="M2.5 5.5 8 2.5l5.5 3v5L8 13.5l-5.5-3Z"/><path d="M2 14 14 2"/>',
  croix: '<path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/>',
  coeur: '<path d="M8 13.5S2 10 2 6a3 3 0 0 1 6-1 3 3 0 0 1 6 1c0 4-6 7.5-6 7.5Z"/>',
  exclure: '<circle cx="8" cy="8" r="5.8"/><path d="M3.9 12.1l8.2-8.2"/>',
  fleche: '<path d="M2.5 8h10M9 4.5 12.5 8 9 11.5"/>',
  epingle: '<path d="M6 2.5h4M7 2.5v4L4.5 9h7L9 6.5v-4M8 9v4.5"/>',
};
export const ico = (n, label, cls = 'sbd-ic') => `<svg class="${cls}" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"${label ? ` role="img" aria-label="${esc(label)}"` : ' aria-hidden="true"'}>${IC[n]}</svg>`;
// Stock en petit badge (D23) : une icône, et le gramme seulement si utile ; jamais un bloc.
export function badgeStock(r, avecG = false) {
  const s = r.stock || { etat: r.stockG ? 'en stock' : 'à acheter' };
  if (s.etat === 'en stock') return `<span class="sbd-st${s.suffisant === false ? ' sbd-st-court' : ''}" data-role="stock">${ico('stock', s.suffisant === false ? 'en stock, pas assez' : 'en stock')}${avecG && s.libre != null ? `<small>${g0(s.libre)} g</small>` : ''}</span>`;
  if (s.etat === 'épuisé') return `<span class="sbd-st sbd-st-court" data-role="stock">${ico('vide', 'épuisé')}</span>`;
  return `<span class="sbd-st" data-role="stock">${ico('achat', 'à acheter')}</span>`;
}
export const alphaTxt = (h, plage = true) => h.alpha.lot ? `<span class="sbd-num" data-role="alpha">α ${fr1(+h.alpha.v.toFixed(2))} %${plage ? ` <span class="sbd-pl">${fr1(h.alpha.min)}–${fr1(h.alpha.max)}</span>` : ''}</span>` : `<span class="sbd-num" data-role="alpha">α ${fr1(h.alpha.min)}–${fr1(h.alpha.max)} %</span>`;
export const doseTxt = (r) => r.dose.min !== r.dose.max ? `${g0(r.dose.g)} g <span class="sbd-pl">${g0(r.dose.min)}–${g0(r.dose.max)}</span>` : `${g0(r.dose.g)} g`;
export const nomHop = (r, cls = '') => `<span class="sbd-hop ${cls}" data-houblon="${esc(r.nom)}"${r.couleur ? ` data-couleur="${r.couleur}"` : ''}>${r.couleur ? `<i class="sbd-pt" style="background:${r.couleur}"></i>` : ''}${esc(r.nom)}${r.mots && r.mots.part > 0.5 ? `<i class="sbd-aut" data-role="autres" data-part="${r.mots.part.toFixed(2)}" aria-label="autres : ${Math.round(r.mots.part * 100)} % de mots sans famille" style="width:${Math.round(14 + 20 * r.mots.part)}px"></i>` : ''}</span>`;
export const croix = (href = '../../../fils22-carte/comparer/etat.html') => `<a class="sbd-x" href="${href}" aria-label="Fermer">${ico('croix')}</a>`;
export const lentille = () => `<span class="sbd-seg" data-lecture role="radiogroup" aria-label="lecture au style ou absolu"><button type="button" role="radio" aria-checked="true" data-e="style">Au style</button><button type="button" role="radio" aria-checked="false" data-e="absolu">Absolu</button></span>`;
export const aide = (id, lignes) => `<button type="button" class="sbd-aide" data-role="legende-bouton" aria-expanded="false" aria-controls="${id}" aria-label="Légende">?</button><div class="sbd-leg" id="${id}" data-role="legende" hidden>${lignes.map((l) => `<p>${l}</p>`).join('')}</div>`;
export const LEG_FAM = `${ROUE.map((f) => pic(f, 14) + ' ' + COURT[f]).join(' · ')}`;
// Une barre l5b au style : la zone du style (gris) puis la valeur ; « ~ » simulé, hachuré si inconnu.
// --s : part de la piste au style (la bande haute du style tombe à 50 %) ; --a : part en absolu (0–100).
export function barre(f, v, cls = '') {
  const B = BANDE[f];
  if (!v || v.inc) return `<span class="sbd-bar sbd-bar-inc ${cls}" data-famille="${f}" aria-label="${COURT[f]} : inconnu"><i class="sbd-zone" data-role="zone" style="--zs:.5;--za:${(B / 100).toFixed(3)}"></i><b class="sbd-q">?</b></span>`;
  const s = (x) => Math.min(1, x / (2 * B)).toFixed(3), a = (x) => Math.min(1, x / 100).toFixed(3);
  return `<span class="sbd-bar ${cls}" data-famille="${f}" aria-label="${COURT[f]} ~${fr(v.c)}"><i class="sbd-zone" data-role="zone" style="--zs:.5;--za:${(B / 100).toFixed(3)}"></i><i class="sbd-haut" style="--s:${s(v.h)};--a:${a(v.h)};background:${JET[f].base}"></i><i class="sbd-val" style="--s:${s(v.c)};--a:${a(v.c)};background:${JET[f].base}"></i></span>`;
}

// ---------- la fiche courte g1 (appui long, survol long), commune ----------
export function fichesDe(noms) {
  const o = {};
  for (const n of noms) {
    const h = houblon(n);
    o[n] = { nom: n, couleur: h.couleur, usage: h.role, alpha: h.alpha, beta: h.beta, niv: h.niveaux,
      ar: h.aromes.filter((a) => a.level > 0).sort((a, b) => b.level - a.level).map((a) => ({ f: a.family, lv: a.level, n: a.sources, of: a.of, mots: a.mots.flatMap((m) => m.mots).slice(0, 2).join(', ') })),
      nd: h.aromes.filter((a) => a.level === 0).length, autres: +h.mots.part.toFixed(2), sans: h.mots.sans.slice(0, 3) };
  }
  return o;
}
export const FICHE_HTML = `<section class="sbd-fiche" role="dialog" aria-label="Fiche du houblon" data-role="fiche" hidden>
<header class="sbd-fh"><i class="sbd-pt" id="sbd-fpt"></i><h3 id="sbd-fnom"></h3><span class="sbd-us" id="sbd-fus"></span><button class="sbd-fx" type="button" data-role="fermer-fiche" aria-label="Fermer la fiche">${ico('croix')}</button></header>
<p class="sbd-fa" data-role="fiche-alpha" id="sbd-fa"></p>
<div class="sbd-fc"><div id="sbd-frad"></div><ul class="sbd-fl" id="sbd-fl"></ul></div>
<div class="sbd-fg" role="group" data-role="gout" aria-label="Mon goût"><button type="button" aria-pressed="false" aria-label="Aimer">${ico('coeur')}</button><button type="button" aria-pressed="false" aria-label="Exclure">${ico('exclure')}</button></div>
</section>`;

export const CSS = `
:root { --fond:#ffffff; --surf:#f3f3f6; --surf2:#ececf1; --encre:#16161a; --gris:#5b5b66; --trait:#e3e3e8; --acc:#c2410c; --sans:"Source Sans 3",system-ui,-apple-system,"Segoe UI",sans-serif; --mono:"IBM Plex Mono",ui-monospace,Consolas,monospace; }
[hidden] { display:none !important; }
* { box-sizing:border-box; margin:0; padding:0; }
html, body { background:var(--fond); }
body { color:var(--encre); font:400 14px/1.25 var(--sans); -webkit-tap-highlight-color:transparent; }
button { font:inherit; color:inherit; background:none; border:0; cursor:pointer; }
a { color:inherit; text-decoration:none; }
svg { display:block; flex:none; }
:focus-visible { outline:2px solid #1f6fb2; outline-offset:2px; }
.sbd-num { font-family:var(--mono); font-variant-numeric:tabular-nums; letter-spacing:-.02em; }
.sbd-pl { color:var(--gris); }
.sbd-pi { display:inline-block; vertical-align:-3px; }
.sbd-us { display:inline-block; font-size:12px; font-weight:600; line-height:16px; padding:0 6px; border-radius:8px; border:1px solid #a9a9b4; color:var(--gris); white-space:nowrap; }
.sbd-hop { display:inline-flex; align-items:center; gap:5px; font-weight:600; -webkit-user-select:none; user-select:none; -webkit-touch-callout:none; }
.sbd-aut { display:inline-block; height:6px; border-radius:2px; background:#8c8c96; margin-left:2px; flex:none; }
.sbd-pt { width:9px; height:9px; border-radius:50%; display:inline-block; flex:none; }
.sbd-st { display:inline-flex; align-items:center; gap:2px; color:var(--gris); }
.sbd-st small { font-size:12px; }
.sbd-st-court { color:#9a9aa6; }
.sbd-ctxp { display:flex; gap:4px; flex-wrap:wrap; }
.sbd-x { width:32px; height:32px; border-radius:50%; border:1px solid #c9c9d2; display:inline-flex; align-items:center; justify-content:center; flex:none; background:#fff; }
.sbd-seg { display:inline-flex; background:var(--surf2); border-radius:14px; padding:2px; flex:none; }
.sbd-seg button { height:24px; padding:0 9px; border-radius:12px; font-size:12px; color:var(--gris); }
.sbd-seg button[aria-checked="true"] { background:#fff; color:var(--encre); font-weight:600; box-shadow:0 1px 2px rgba(22,22,26,.12); }
.sbd-aide { width:24px; height:24px; border-radius:50%; border:1px solid #c9c9d2; background:#fff; font-weight:700; font-size:13px; color:var(--gris); flex:none; }
.sbd-leg { position:absolute; z-index:30; left:10px; right:10px; background:#fff; border:1px solid #c9c9d2; border-radius:8px; padding:8px 10px; font-size:13px; display:flex; flex-direction:column; gap:5px; box-shadow:0 8px 22px rgba(22,22,26,.16); }
.sbd-leg p { line-height:1.35; }
/* barre l5b : zone du style, plage simulée pâle, centre plein */
.sbd-bar { position:relative; display:block; height:8px; border-radius:2px; background:#f1f1f4; overflow:hidden; }
.sbd-bar i { position:absolute; left:0; top:0; bottom:0; }
.sbd-zone { width:calc(var(--zs) * 100%); background:#dedee5; }
.sbd-abs .sbd-zone { width:calc(var(--za) * 100%); }
.sbd-haut { width:calc(var(--s) * 100%); top:3px !important; bottom:3px !important; opacity:.4; }
.sbd-val { width:calc(var(--s) * 100%); min-width:2px; }
.sbd-abs .sbd-haut, .sbd-abs .sbd-val { width:calc(var(--a) * 100%); }
.sbd-bar-inc { background:repeating-linear-gradient(45deg,#f1f1f4 0 3px,#d6d6de 3px 4.5px); }
.sbd-q { position:absolute; right:3px; top:-3px; font-size:11px; line-height:14px; color:var(--gris); }
/* fiche g1 */
.sbd-fiche { position:fixed; left:8px; right:8px; bottom:8px; max-width:374px; margin:0 auto; z-index:40; background:#fff; border-radius:24px; border:1px solid #d6d6de; box-shadow:0 14px 40px rgba(22,22,26,.22); padding:12px 14px 12px; display:flex; flex-direction:column; gap:8px; }
.sbd-fh { display:flex; align-items:center; gap:8px; }
.sbd-fh h3 { font:600 17px/1.2 var(--sans); }
.sbd-fx { margin-left:auto; width:32px; height:32px; border-radius:50%; background:var(--surf); display:inline-flex; align-items:center; justify-content:center; }
.sbd-fa { font-size:14px; }
.sbd-fa small { color:var(--gris); font-size:12px; }
.sbd-fc { display:flex; gap:10px; align-items:flex-start; }
.sbd-fl { list-style:none; display:flex; flex-direction:column; gap:3px; font-size:13px; min-width:0; }
.sbd-fl li { display:flex; align-items:center; gap:4px; flex-wrap:wrap; }
.sbd-fl small { color:var(--gris); font-size:12px; }
.sbd-fau { display:inline-block; height:8px; border-radius:2px; background:#8c8c96; vertical-align:middle; }
.sbd-fg { display:flex; gap:8px; }
.sbd-fg button { width:36px; height:32px; border-radius:16px; border:1px solid #c9c9d2; display:inline-flex; align-items:center; justify-content:center; color:var(--gris); }
.sbd-fg button[aria-pressed="true"] { background:var(--encre); color:#fff; border-color:var(--encre); }
`;

// Le code client commun : cas par ?cas=, choix du remplaçant (le seul facteur libre), lentille, légende, fiche.
export const JS = `
var SBD = (function () {
  function $(s, r) { return (r || document).querySelector(s); } function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  var ROUE = ${JSON.stringify(ROUE)}, COURT = ${JSON.stringify(COURT)}, BASE = ${JSON.stringify(Object.fromEntries(ROUE.map((f) => [f, JET[f].base])))}, TXT = ${JSON.stringify(Object.fromEntries(ROUE.map((f) => [f, JET[f].texte])))};
  function fr(x, d) { d = d || 0; var k = Math.pow(10, d); return (Math.round(x * k) / k).toFixed(d).replace('.', ','); }
  function fr1(x) { return Math.round(x) === x ? String(x) : fr(x, 1); }
  function pic(f, t) { t = t || 14; return '<svg class="sbd-pi" width="' + t + '" height="' + t + '" viewBox="0 0 24 24" data-famille="' + f + '" aria-label="' + COURT[f] + '"><use href="#p-' + f + '"/></svg>'; }
  // le cas : la recette fixe le moment ; ?cas=wp ou ?cas=dry rend le même Nugget déplacé (gabarits pré-rendus)
  var q = location.search.match(/cas=([a-z0-9]+)/), cas = q ? q[1] : 'b60';
  $$('[data-vue]').forEach(function (v) { var t = document.getElementById(v.getAttribute('data-vue') + '-' + cas); if (t && cas !== 'b60') v.innerHTML = t.innerHTML; });
  document.documentElement.setAttribute('data-cas', cas);
  // choix du remplaçant : role=radio dans [data-libre="houblon"] ; [data-pour] montre ce qui suit le choix
  var surChoix = [];
  function choisir(n) {
    $$('[data-libre="houblon"] [data-choix]').forEach(function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-choix') === n)); });
    $$('[data-pour]').forEach(function (e) { e.hidden = e.getAttribute('data-pour') !== n; });
    surChoix.forEach(function (fn) { fn(n); });
  }
  var tenu = false;
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-libre="houblon"] [data-choix]');
    if (b) { if (tenu) { tenu = false; e.preventDefault(); return; } choisir(b.getAttribute('data-choix')); }
    var l = e.target.closest('[data-e]');
    if (l) { $$('[data-e]').forEach(function (z) { z.setAttribute('aria-checked', String(z === l)); }); document.body.classList.toggle('sbd-abs', l.getAttribute('data-e') === 'absolu'); }
    var a = e.target.closest('[data-role="legende-bouton"]');
    if (a) { var g = document.getElementById(a.getAttribute('aria-controls')); g.hidden = !g.hidden; a.setAttribute('aria-expanded', String(!g.hidden));
      if (!g.hidden) { var r = a.getBoundingClientRect(); g.style.top = (r.bottom + window.scrollY + 6) + 'px'; } }
    var x = e.target.closest('[data-role="fermer-fiche"]'); if (x) { e.stopPropagation(); fiche(null); }
    var gb = e.target.closest('[data-role="gout"] button');
    if (gb) { var on = gb.getAttribute('aria-pressed') !== 'true'; $$('[data-role="gout"] button').forEach(function (z) { z.setAttribute('aria-pressed', 'false'); }); gb.setAttribute('aria-pressed', String(on)); }
  });
  addEventListener('keydown', function (e) { if (e.key !== 'Escape') return; fiche(null);
    $$('[data-role=legende]').forEach(function (l) { l.hidden = true; }); $$('[data-role=legende-bouton]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); }); });
  // la fiche g1 : appui long au doigt, survol long à la souris ; le toucher court garde son action (choisir)
  var F = window.SBD_FICHES || {};
  function radar(h) {
    var r = 46, c = 58, n = ROUE.length, ang = function (i) { return -Math.PI / 2 + i * 2 * Math.PI / n; };
    var p = function (i, k) { return [c + k * r * Math.cos(ang(i)), c + k * r * Math.sin(ang(i))].map(function (x) { return x.toFixed(1); }).join(','); };
    var s = '<svg data-radar data-objet="fiche" viewBox="0 0 116 116" width="112" height="112" role="img" aria-label="Silhouette de ' + h.nom + ' selon ses fiches ; hachuré : non décrit">';
    [0.5, 1].forEach(function (k) { s += '<polygon points="' + ROUE.map(function (f, i) { return p(i, k); }).join(' ') + '" fill="none" stroke="#e1e1e7"/>'; });
    ROUE.forEach(function (f, i) { if (!h.niv[f]) s += '<path d="M' + c + ',' + c + 'L' + p(i - 0.5, 1) + 'L' + p(i + 0.5, 1) + 'Z" fill="url(#sbd-hach)"/>'; });
    s += '<polygon points="' + ROUE.map(function (f, i) { return p(i, Math.max(0.06, (h.niv[f] || 0) / 2)); }).join(' ') + '" fill="none" stroke="' + (h.couleur || '#4a4a55') + '" stroke-width="2" stroke-linejoin="round"/>';
    ROUE.forEach(function (f, i) { var xy = p(i, 1.14).split(',').map(Number); s += '<use href="#p-' + f + '" x="' + (xy[0] - 5).toFixed(1) + '" y="' + (xy[1] - 5).toFixed(1) + '" width="10" height="10"/>'; });
    return s + '</svg>';
  }
  function fiche(n) {
    var f = $('[data-role="fiche"]'); if (!f) return;
    if (!n || !F[n]) { f.hidden = true; return; }
    var h = F[n], a = h.alpha;
    $('#sbd-fnom').textContent = h.nom; $('#sbd-fus').textContent = h.usage; $('#sbd-fpt').style.background = h.couleur || '#8c8c96';
    $('#sbd-fa').innerHTML = '<span class="sbd-num">α ' + (a.v == null ? '?' : fr1(+a.v.toFixed(2))) + ' %</span> <small>' + (a.lot ? 'lot' : 'milieu des fiches') + '</small> · <span class="sbd-num">' + fr1(a.min) + '–' + fr1(a.max) + ' %</span> <small>' + a.sources + '</small>';
    $('#sbd-frad').innerHTML = radar(h);
    $('#sbd-fl').innerHTML = h.ar.map(function (x) { return '<li data-role="fiche-arome">' + pic(x.f) + '<b style="color:' + TXT[x.f] + '">' + COURT[x.f] + '</b> <small>' + x.n + '/' + x.of + ' fiche' + (x.of > 1 ? 's' : '') + '</small></li>'; }).join('')
      + (h.autres > 0.25 ? '<li data-houblon-autres><i class="sbd-fau" data-role="autres" data-part="' + h.autres + '" style="width:' + Math.round(10 + 50 * h.autres) + 'px" aria-label="autres mots sans famille"></i><small>autres ' + Math.round(h.autres * 100) + ' % : ' + h.sans.join(', ') + '</small></li>' : '')
      + '<li><small>' + h.nd + ' non décrites (inconnu, pas zéro)</small></li>';
    f.hidden = false;
  }
  document.addEventListener('contextmenu', function (e) { if (e.target.closest('[data-houblon]')) e.preventDefault(); });
  var t = null, hv = null, x0 = 0, y0 = 0;
  document.addEventListener('pointerdown', function (e) { var c = e.target.closest('[data-houblon]'); if (!c || e.pointerType === 'mouse') return; x0 = e.clientX; y0 = e.clientY; clearTimeout(t);
    t = setTimeout(function () { tenu = true; fiche(c.getAttribute('data-houblon')); setTimeout(function () { tenu = false; }, 700); }, 520); });
  document.addEventListener('pointermove', function (e) { if (t && Math.hypot(e.clientX - x0, e.clientY - y0) > 12) { clearTimeout(t); t = null; } });
  ['pointerup', 'pointercancel'].forEach(function (k) { document.addEventListener(k, function () { clearTimeout(t); t = null; }); });
  document.addEventListener('pointerover', function (e) { if (e.pointerType !== 'mouse') return; var c = e.target.closest('[data-houblon]'); clearTimeout(hv); if (c) hv = setTimeout(function () { fiche(c.getAttribute('data-houblon')); }, 700); });
  return { $: $, $$: $$, fr: fr, fr1: fr1, pic: pic, cas: cas, choisir: choisir, surChoix: function (fn) { surChoix.push(fn); } };
})();
`;

// Assemble une page : la vue rendue pour 60′ (le cas réel), les autres cas en gabarits pour ?cas=.
export function page({ id, titre, vue, css, js = '', fiches, autres = {}, apres = '' }) {
  const gabarits = Object.entries(autres).map(([c, html]) => `<template id="${id}-vue-${c}">${html}</template>`).join('\n');
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titre)} · Lequel à la place de Nugget ?</title>
<style>${CSS}
${css}</style></head>
<body>
${SYMBOLES}
<main class="${id}" data-vue="${id}-vue">
${vue}
</main>
${gabarits}
${apres}
${FICHE_HTML}
<script>window.SBD_FICHES = ${JSON.stringify(fichesDe(fiches))};</script>
<script>${JS}</script>
<script>(function () {
${js}
})();</script>
</body></html>`;
}
