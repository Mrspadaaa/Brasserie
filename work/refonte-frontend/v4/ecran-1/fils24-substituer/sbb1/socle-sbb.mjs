// Socle de la série b (Substituer, lot D125, « la réponse d'abord »). Vocabulaire de la baseline, pas un gabarit :
// pictos de famille au trait (planche fils17-standard/v3, épicé = cannelle et clou croisés, symbole p-spice), couleurs
// des familles (jetons-familles.json), α du lot et plage des fiches, usage en mot, stock en petit badge, lentille au
// style / absolu (au style par défaut), barres l5b face à la zone du style, croix pour sortir (D109), légende derrière
// un « ? » (D89), fiche g1 courte à l'appui long (D25), thème blanc de ses maquettes (D106). Aucun bouton Annuler (D120).
// Toutes les classes et l'état client sont préfixés par l'id du concept (L26) : socle(id) rend les siennes.
// Assemblage par gabarits et concaténation, jamais par remplacement de chaîne.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const racine = path.resolve(ici, '../../../../../..');
const lire = (p) => fs.readFileSync(path.join(racine, p), 'utf8');
export const M = JSON.parse(fs.readFileSync(path.join(ici, 'donnees-sbb.json'), 'utf8'));
export const JET = JSON.parse(lire('work/refonte-frontend/v4/ecran-1/fils17-standard/jetons-familles.json'));
const PLANCHE = lire('work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html');

export const FAM = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'];
export const NOMF = { floral: 'Floral', herbal: 'Herbacé', earthy: 'Terreux', citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', resin: 'Résineux', spice: 'Épicé', green: 'Végétal' };
export const T = (f) => JET[f].texte, BA = (f) => JET[f].base, FO = (f) => JET[f].fond;
// La stout 16D : familles attendues, puis celle hors du style dans ma bière (résineux, dégusté « marqué » le 18.10).
export const BIERE_FAM = ['floral', 'herbal', 'earthy', 'resin'];
export const ORANGE = '#c2410c';

// ---------- symboles ----------
const sym = (id) => { const i = PLANCHE.indexOf('<symbol id="' + id + '"'); if (i < 0) throw new Error('symbole ' + id); return PLANCHE.slice(i, PLANCHE.indexOf('</symbol>', i) + 9); };
const SYMS = [...FAM.map((f) => 'p-' + f), 'i-x', 'i-chev-r', 'i-check', 'j-stock', 'j-achat', 'j-manque'];
export const SYMBOLES = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' + SYMS.map(sym).join('') +
  '<pattern id="sbb-hach" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v5" stroke="#bdbdbd" stroke-width="1.6"/></pattern></defs></svg>';

// ---------- format ----------
export const fr = (x, d = 0) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(d).replace('.', ',');
export const sg = (x, d = 0) => (x >= 0 ? '+' : '−') + fr(Math.abs(x), d);
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
export const g = (x) => fr(x, Number.isInteger(x) ? 0 : 1) + ' g';

// ---------- les houblons du cas (moteur du parcours, 60′) ----------
export const COUL = { nugget: '#0072b2', 'nelson-sauvin': '#0b6e63', galaxy: '#681878', 'idaho-7': '#e80030', sabro: '#1f5fa8', magnat: '#a01f5a', altus: '#6b5200', trident: '#00607a', yeoman: '#5a3d8a' };
const court = (cle) => cle.replace(/^beermaverick-/, '');
const cites = (h) => FAM.filter((f) => h.familles[f].niveau !== 'non décrit').sort((a, b) => (h.familles[b].niveau === 'marqué') - (h.familles[a].niveau === 'marqué'));
const motsSF = (h) => { const vus = new Set(); return h.motsSansFamille.filter((m) => /[éèàçâêîôûù]|^[a-z]/.test(m) && !vus.has(m.toLowerCase()) && vus.add(m.toLowerCase())); };
const vm = (cle) => {
  const h = M.houblons[cle], k = court(cle);
  return { k, cle, nom: h.nom, coul: COUL[k] || '#3d3d47', alpha: h.alpha, role: h.role.mot, roleSrc: h.role.source, familles: h.familles, cites: cites(h), sansF: h.partSansFamille, motsSF: motsSF(h), mots: h.mots, beta: h.cat.beta, betaHs: h.cat.hs && h.cat.hs.beta, stockLibre: h.stock, cat: h.cat };
};
const B60 = M.b60;
export const NUG = { ...vm('beermaverick-nugget'), grams: B60.grams, ibu: B60.ibuAjout.valeur, ibuTotal: B60.ibu.valeur, profil: B60.profil };
export const CANDS = B60.enStock.map((s, i) => ({
  ...vm(s.cle), ordre: i + 1, score: s.score, palier: s.palier, comp: s.composantes, dose: s.dose, stock: s.stock,
  gagne: s.familles.gagne, perd: s.familles.perd, apres: s.apres, ibu: s.apres.ibu.valeur, raison: s.raison,
  reste: s.stock.libre != null ? Math.round((s.stock.libre - s.dose.grams) * 10) / 10 : null,
  fiab: (B60.general.find((x) => x.cle === s.cle) || {}).fiab || (s.composantes.huiles == null ? 'partielle' : 'bonne'),
}));
export const C = Object.fromEntries(CANDS.map((c) => [c.k, c]));
export const WP = M.wp, DRY = M.dry;
// La réponse : le premier du moteur, « en stock d'abord » (stock suffisant, puis le score).
export const REP = CANDS[0];

// ---------- briques ----------
export const ico = (id, label) => { const s = id.startsWith('j-') ? 14 : 16; return `<svg class="§-ic" width="${s}" height="${s}" viewBox="0 0 24 24" ${label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"'}><use href="#${id}"/></svg>`; };
export const pic = (f, s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" data-famille="${f}" aria-label="${NOMF[f]}"><use href="#p-${f}"/></svg>`;
export const icoCoeur = '<svg class="§-ic" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 13.5S2 10 2 6a3 3 0 0 1 6-1 3 3 0 0 1 6 1c0 4-6 7.5-6 7.5z"/></svg>';
export const icoBan = '<svg class="§-ic" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/><path d="M4.2 11.8l7.6-7.6"/></svg>';
export function alphaTxt(h) {
  if (!h.alpha) return '<span class="§-num">α ?</span>';
  const p = h.alpha.plage;
  return `<span class="§-num" data-role="alpha">α ${fr(h.alpha.valeur, 1)} %</span>` + (p ? `<span class="§-num §-gr">${h.alpha.horsFiches ? '≠ ' : ''}${fr(p[0], 1)}–${fr(p[1], 1)}</span>` : '');
}
export const usage = (h) => `<span class="§-us" data-role="usage">${h.role || '?'}</span>`;
export function stock(h, P) {
  if (h.k === 'nugget') return `<span class="§-stk" role="img" aria-label="Nugget épuisé : 0 g">${ico('j-manque')}<span>0 g</span></span>`;
  const s = h.stock;
  if (!s || s.etat === 'à acheter') return `<span class="§-stk" role="img" aria-label="à acheter, pas au stock">${ico('j-achat')}</span>`;
  return `<span class="§-stk${s.suffisant === false ? ' §-court' : ''}" role="img" aria-label="en stock : ${fr(s.libre)} g${s.suffisant === false ? ', il en faut ' + fr(h.dose.grams) : ''}">${ico(s.suffisant === false ? 'j-manque' : 'j-stock')}<span>${fr(s.libre)} g</span></span>`;
}
export const pastille = (h, s = 10) => `<i class="§-pt" data-serie="${esc(h.nom)}" data-couleur="${h.coul}" style="background:${h.coul};width:${s}px;height:${s}px" aria-hidden="true"></i>`;
export const pictos = (fs_, s = 16) => fs_.map((f) => pic(f, s)).join('');
// La part « autres » (mots hors des 12 familles, L14) : une forme grise, pas une ligne en petit.
export const autres = (h, w = 40) => h.sansF != null && h.sansF >= 0.25 ? `<span class="§-aut" data-role="autres"><i style="width:${w}px"></i><span>autres ${fr(h.sansF * 100)} %</span></span>` : '';

// Barre l5b au style : la zone de la 16D sur la moitié gauche ; absolu (0–110) à un toucher. Rond : ma bière avec Nugget.
const posS = (x, b1) => Math.max(0, Math.min(100, (x / b1) * 50));
const posA = (x) => Math.max(0, Math.min(100, (x / 110) * 100));
export function barre(f, apres, avant, { cls = '' } = {}) {
  const x = apres[f], a = avant ? avant[f] : null;
  if (!x.v) return `<span class="§-br inc ${cls}" data-inconnu="" aria-label="${NOMF[f]} : inconnu"><b>?</b></span>`;
  const b1 = x.bande ? x.bande[1] : 30, b0 = x.bande ? x.bande[0] : 0;
  const hors = x.hors === 'au-dessus';
  const st = (v) => posS(v, b1).toFixed(1) + '%';
  return `<span class="§-br ${cls}" data-v="${x.v.centre}" data-lo="${x.v.bas}" data-hi="${x.v.haut}" data-b0="${b0}" data-b1="${b1}"${a && a.v ? ` data-av="${a.v.centre}"` : ''}>` +
    `<i class="§-z" data-role="zone" style="left:0;width:50%"></i><i class="§-r" style="left:${st(x.v.bas)};width:calc(${st(x.v.haut)} - ${st(x.v.bas)})"></i>` +
    `<i class="§-f" style="width:${st(x.v.centre)};background:${hors ? ORANGE : BA(f)}"></i>` +
    (a && a.v ? `<i class="§-a" style="left:${st(a.v.centre)}"></i>` : '') + '</span>';
}
export const delta = (f, apres, avant) => { const x = apres[f].v, a = avant[f].v; if (!x || !a) return '<span class="§-num §-gr">?</span>'; const d = x.centre - a.centre; return `<span class="§-num §-dl">~${Math.abs(d) < 0.5 ? '0' : sg(d)}</span>`; };

// ---------- la fiche (appui long) : fiche g1 courte ----------
function radarFiche(P, h) {
  const r = 46, c = 60, lv = (f) => ({ 'non décrit': 0, cité: 1, marqué: 2 })[h.familles[f].niveau];
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / 12, pf = (i, k) => [c + k * r * Math.cos(ang(i)), c + k * r * Math.sin(ang(i))];
  let s = `<svg class="§-fr" data-radar data-objet="fiche" viewBox="0 0 120 120" width="116" height="116" role="img" aria-label="Silhouette de ${esc(h.nom)} selon ses fiches ; hachuré : non décrit">`;
  for (const k of [0.5, 1]) s += `<polygon fill="none" stroke="#e0e0e0" stroke-width="1" points="${FAM.map((f, i) => pf(i, k).map((x) => x.toFixed(1)).join(',')).join(' ')}"/>`;
  FAM.forEach((f, i) => { if (!lv(f)) { const a = pf(i - 0.5, 1), b = pf(i + 0.5, 1); s += `<path fill="url(#sbb-hach)" d="M${c},${c}L${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}Z"/>`; } });
  s += `<polygon fill="${h.coul}" fill-opacity=".16" stroke="${h.coul}" stroke-width="1.5" points="${FAM.map((f, i) => pf(i, Math.max(0.07, lv(f) / 2)).map((x) => x.toFixed(1)).join(',')).join(' ')}"/>`;
  FAM.forEach((f, i) => { const [x, y] = pf(i, 1.17); s += `<use href="#p-${f}" x="${(x - 6).toFixed(1)}" y="${(y - 6).toFixed(1)}" width="12" height="12"/>`; });
  return s + '</svg>';
}
export function fiche(P, h) {
  const fam = h.cites.slice(0, 4);
  const beta = h.beta ? `β ${fr(h.beta[0], 1)}–${fr(h.beta[1], 1)} %` : 'β ?';
  return `<template data-fiche-pour="${esc(h.nom)}">
<header>${pastille(h, 10)}<h3>${esc(h.nom)}</h3>${usage(h)}${h.k === 'nugget' || h.stock ? stock(h, P) : ''}<button type="button" class="§-fx" data-role="fermer-fiche" aria-label="Fermer la fiche">${ico('i-x')}</button></header>
<p class="§-fa" data-role="fiche-alpha">${alphaTxt(h)} <span class="§-gr">${h.alpha && h.alpha.source === 'fiche de stock' ? 'lot' : h.alpha && /article/.test(h.alpha.source) ? 'article' : 'fiches'}</span> · <span class="§-num">${beta}</span></p>
<div class="§-fc">${radarFiche(P, h)}<ul>${fam.map((f) => `<li data-role="fiche-arome">${pic(f, 14)}<b style="color:${T(f)}">${NOMF[f]}</b><span class="§-num §-gr">${h.familles[f].fiches}/${h.familles[f].sur}</span><span>${esc((h.mots[f] || []).filter((m) => m.toLowerCase() !== NOMF[f].toLowerCase() && m.toLowerCase() !== 'fruits tropicaux').slice(0, 2).join(', '))}</span></li>`).join('')}</ul></div>
${h.sansF != null && h.sansF >= 0.25 ? `<p class="§-fo">${autres(h, 36)}<span>${esc(h.motsSF.slice(0, 3).join(', '))}</span></p>` : ''}
<div class="§-fg" role="group" data-role="gout" aria-label="Mon goût pour ${esc(h.nom)}"><button type="button" aria-pressed="false" aria-label="Aimer ${esc(h.nom)}">${icoCoeur}</button><button type="button" aria-pressed="false" aria-label="Exclure ${esc(h.nom)}">${icoBan}</button></div>
</template>`;
}

// ---------- légende et lentille ----------
export const legendeBouton = (P) => `<button type="button" class="§-aide" data-role="legende-bouton" aria-expanded="false" aria-controls="§-leg" aria-label="Lire la légende">?</button>`;
export const legende = (P, lignes) => `<div class="§-leg" id="§-leg" data-role="legende" role="dialog" aria-label="Légende" hidden><ul>${lignes.map((l) => `<li>${l}</li>`).join('')}</ul></div>`;
export const LEG_COMMUNE = [
  '<b>~</b> simulé par le moteur, pas une mesure ; hachuré ou « ? » : inconnu, jamais zéro.',
  'Barres : ma bière ; zone grise jusqu’au trait : ce que la 16D admet (au style, à mi-piste) ; rond : avec Nugget ; trait fin dessous : la plage simulée ; orangé : hors du style.',
  'Dose à IBU égal (α du lot) ; proximité 0–100 du moteur, à 60′ : amertume 0,6, huiles 0,2, arôme 0,2.',
];
export const lentille = (P) => `<span class="§-seg" data-lecture role="radiogroup" aria-label="Lecture au style ou absolue"><button type="button" role="radio" aria-checked="true" data-e="style">Au style</button><button type="button" role="radio" aria-checked="false" data-e="absolu">Absolu</button></span>`;
export const croix = (P) => `<button type="button" class="§-x" aria-label="Fermer : revenir à Ma bière">${ico('i-x')}</button>`;

// ---------- CSS du socle (préfixé) ----------
export const cssSocle = (P) => `
:root { --acc:${ORANGE}; }
[hidden] { display:none !important; }
* { box-sizing:border-box; margin:0; padding:0; }
html, body { background:#fff; }
body { color:#111; font:400 14px/1.3 "Source Sans 3","Segoe UI",system-ui,sans-serif; -webkit-tap-highlight-color:transparent; }
button { font:inherit; color:inherit; background:none; border:0; cursor:pointer; text-align:inherit; }
svg { display:block; flex:none; }
.§-num { font-family:"IBM Plex Mono",ui-monospace,Consolas,monospace; font-variant-numeric:tabular-nums; letter-spacing:-.02em; word-spacing:-.3em; }
.§-gr { color:#666; }
.§-ic { color:#444; }
.§-pt { display:inline-block; border-radius:50%; flex:none; }
.§-us { font-size:12px; line-height:16px; border:1px solid #9e9e9e; border-radius:999px; padding:0 6px; color:#111; white-space:nowrap; }
.§-stk { display:inline-flex; align-items:center; gap:2px; font-size:12px; color:#555; white-space:nowrap; }
.§-stk.§-court span { color:${ORANGE}; }
.§-aut { display:inline-flex; align-items:center; gap:4px; font-size:12px; color:#555; white-space:nowrap; }
.§-aut i { display:inline-block; height:7px; border-radius:999px; background:#9e9e9e; }
.§-br { position:relative; display:block; height:10px; border-radius:999px; background:#f0f0f0; }
.§-br i { position:absolute; top:0; bottom:0; display:block; }
.§-br .§-z { background:#e2e2e2; border-radius:999px 0 0 999px; border-right:2px solid #9e9e9e; }
.§-br .§-r { top:auto !important; bottom:-4px !important; height:2px; background:#bdbdbd; border-radius:999px; }
.§-br .§-f { left:0; top:2px !important; bottom:2px !important; border-radius:999px; min-width:5px; }
.§-br .§-a { top:50%; width:8px; height:8px; margin:-4px 0 0 -4px; border-radius:50%; background:transparent; border:2px solid #111; }
.§-br.§-inc { background:repeating-linear-gradient(45deg,#e6e6e6 0 3px,#fff 3px 6px); }
.§-br.§-inc b { position:absolute; right:4px; top:-4px; font-size:12px; color:#555; background:#fff; line-height:14px; padding:0 2px; }
.§-dl { font-size:12px; color:#555; white-space:nowrap; }
.§-x { width:36px; height:36px; border-radius:50%; border:1px solid #d9d9d9; display:inline-flex; align-items:center; justify-content:center; flex:none; background:#fff; }
.§-x .§-ic { color:#111; }
.§-aide { width:28px; height:28px; border-radius:50%; border:1px solid #c9c9c9; background:#fff; font-weight:700; color:#555; flex:none; text-align:center; }
.§-seg { display:inline-flex; border:1px solid #d9d9d9; border-radius:999px; padding:2px; background:#fff; flex:none; }
.§-seg button { height:28px; padding:0 11px; border-radius:999px; font-size:13px; color:#555; }
.§-seg button[aria-checked="true"] { background:#111; color:#fff; font-weight:600; }
.§-leg { position:absolute; z-index:30; left:10px; right:10px; background:#fff; border:1px solid #c9c9c9; border-radius:8px; padding:10px 12px; font-size:13px; box-shadow:0 6px 24px rgba(0,0,0,.12); }
.§-leg ul { list-style:none; display:flex; flex-direction:column; gap:6px; }
.§-fiche { position:fixed; z-index:40; left:0; right:0; bottom:0; max-width:390px; margin:0 auto; background:#fff; border-top:1px solid #d9d9d9; border-radius:8px 8px 0 0; padding:12px 14px 16px; box-shadow:0 -8px 30px rgba(0,0,0,.14); display:flex; flex-direction:column; gap:8px; }
.§-fiche header { display:flex; align-items:center; gap:6px; }
.§-fiche h3 { font-size:17px; font-weight:700; }
.§-fx { margin-left:auto; width:32px; height:32px; border-radius:50%; border:1px solid #d9d9d9; display:inline-flex; align-items:center; justify-content:center; }
.§-fa { display:flex; gap:6px; align-items:baseline; flex-wrap:wrap; font-size:13px; }
.§-fc { display:flex; gap:10px; align-items:center; }
.§-fc ul { list-style:none; display:flex; flex-direction:column; gap:5px; font-size:13px; }
.§-fc li { display:flex; align-items:center; gap:5px; flex-wrap:wrap; }
.§-fo { display:flex; gap:8px; align-items:center; font-size:13px; color:#555; }
.§-fg { display:flex; gap:8px; }
.§-fg button { width:36px; height:32px; border-radius:999px; border:1px solid #d9d9d9; display:inline-flex; align-items:center; justify-content:center; }
.§-fg button[aria-pressed="true"] { background:#111; }
.§-fg button[aria-pressed="true"] .§-ic { color:#fff; }
[data-houblon] { -webkit-user-select:none; user-select:none; -webkit-touch-callout:none; }
.§-pied { position:sticky; bottom:0; z-index:10; background:#fff; border-top:1px solid #e0e0e0; padding:8px 12px 10px; display:flex; align-items:center; gap:10px; }
.§-pied p { flex:1; font-size:13px; line-height:1.25; color:#333; }
.§-pied p b { color:#111; }
.§-go { height:44px; padding:0 18px; border-radius:999px; background:#111; color:#fff; font-weight:600; font-size:15px; display:inline-flex; align-items:center; gap:4px; flex:none; }
.§-go .§-ic { color:#fff; }
`;

// ---------- code client (fonction immédiate, état préfixé) ----------
export const clientSocle = (P) => `(function(){
var Q=function(s,r){return (r||document).querySelector(s)}, QQ=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
var ABS=false;
function pS(x,b1){return Math.max(0,Math.min(100,x/b1*50));} function pA(x){return Math.max(0,Math.min(100,x/110*100));}
function bars(){ QQ('.§-br[data-v]').forEach(function(b){ var v=+b.dataset.v, lo=+b.dataset.lo, hi=+b.dataset.hi, b0=+b.dataset.b0, b1=+b.dataset.b1;
  var p=ABS?pA:function(x){return pS(x,b1);}; var z=Q('.§-z',b), r=Q('.§-r',b), f=Q('.§-f',b), a=Q('.§-a',b);
  if(ABS){ z.style.left=pA(b0)+'%'; z.style.width=(pA(b1)-pA(b0))+'%'; } else { z.style.left='0%'; z.style.width='50%'; }
  r.style.left=p(lo)+'%'; r.style.width=(p(hi)-p(lo))+'%'; f.style.width=p(v)+'%'; if(a) a.style.left=p(+b.dataset.av)+'%'; }); }
QQ('[data-e]').forEach(function(b){ b.addEventListener('click',function(){ QQ('[data-e]').forEach(function(z){ z.setAttribute('aria-checked', String(z.dataset.e===b.dataset.e)); }); ABS=b.dataset.e==='absolu'; document.body.classList.toggle('§-abs',ABS); bars(); }); });
var lb=Q('[data-role="legende-bouton"]'), lg=Q('[data-role="legende"]');
function legende(o){ if(!lg) return; lg.hidden=!o; lb.setAttribute('aria-expanded',String(o)); if(o){ var r=lb.getBoundingClientRect(); lg.style.top=(r.bottom+window.scrollY+6)+'px'; } }
if(lb) lb.addEventListener('click',function(e){ e.stopPropagation(); legende(lg.hidden); });
var FI=Q('[data-role="fiche"]');
function fiche(n){ var t=QQ('template[data-fiche-pour]').filter(function(x){return x.dataset.fichePour===n;})[0]; if(!t||!FI) return; FI.innerHTML=t.innerHTML; FI.setAttribute('aria-label','Fiche de '+n); FI.dataset.pour=n; FI.hidden=false;
  QQ('[data-role="fermer-fiche"]',FI).forEach(function(b){ b.addEventListener('click',function(e){ e.stopPropagation(); fermer(); }); });
  QQ('[data-role="gout"] button',FI).forEach(function(b){ b.addEventListener('click',function(e){ e.stopPropagation(); var on=b.getAttribute('aria-pressed')!=='true'; QQ('button',b.parentNode).forEach(function(z){ z.setAttribute('aria-pressed','false'); }); b.setAttribute('aria-pressed',String(on)); }); }); }
function fermer(){ if(FI) FI.hidden=true; }


document.addEventListener('keydown',function(e){ if(e.key==='Escape'){ legende(false); fermer(); } });
QQ('[data-houblon]').forEach(function(c){ var n=c.getAttribute('data-houblon'), t=null, x0=0, y0=0, hv=null;
  c.addEventListener('contextmenu',function(e){ e.preventDefault(); });
  c.addEventListener('pointerdown',function(e){ if(e.pointerType==='mouse') return; x0=e.clientX; y0=e.clientY; clearTimeout(t); t=setTimeout(function(){ fiche(n); },550); });
  c.addEventListener('pointermove',function(e){ if(t && Math.hypot(e.clientX-x0,e.clientY-y0)>12){ clearTimeout(t); t=null; } });
  ['pointerup','pointercancel'].forEach(function(k){ c.addEventListener(k,function(){ clearTimeout(t); t=null; }); });
  c.addEventListener('pointerenter',function(e){ if(e.pointerType!=='mouse') return; clearTimeout(hv); hv=setTimeout(function(){ fiche(n); },800); });
  c.addEventListener('pointerleave',function(e){ if(e.pointerType==='mouse') clearTimeout(hv); }); });
// Le facteur libre : le remplaçant. Un toucher sur un candidat montre sa réponse (blocs [data-pour-cand]).
function choisir(k){ QQ('[data-cand]').forEach(function(b){ var on=b.dataset.cand===k; if(b.getAttribute('role')==='radio') b.setAttribute('aria-checked',String(on)); else b.setAttribute('aria-pressed',String(on)); b.classList.toggle('on',on); });
  QQ('[data-pour-cand]').forEach(function(x){ x.hidden = x.dataset.pourCand!==k; }); document.body.dataset.cand=k; if(window['${P}Choix']) window['${P}Choix'](k); bars(); }
QQ('[data-cand]').forEach(function(b){ b.addEventListener('click',function(){ choisir(b.dataset.cand); }); });
var q=location.search.match(/cand=([^&]+)/); if(q) choisir(decodeURIComponent(q[1]));
if(/fiche=/.test(location.search)) fiche(decodeURIComponent(location.search.match(/fiche=([^&]+)/)[1]));
if(/legende/.test(location.search)) legende(true);
if(/absolu/.test(location.search)) Q('[data-e="absolu"]').click();
})();`;

// ---------- la page ----------
export function page(P, { titre, corps, css, client = '', fiches = [], legendeLignes = LEG_COMMUNE }) {
  // Le jeton « §- » devient le préfixe du concept (split/join, jamais String.replace : L26).
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titre)}</title>
<style>${cssSocle(P)}${css}</style></head>
<body class="${P}">
${SYMBOLES}
${corps}
${legende(P, legendeLignes)}
<section class="§-fiche" role="dialog" aria-label="Fiche" data-role="fiche" hidden></section>
${fiches.map((h) => fiche(P, h)).join('\n')}
<script>${clientSocle(P)}</script>
${client ? `<script>(function(){${client}})();</script>` : ''}
</body></html>
`;
  return html.split('§-').join(P + '-');
}
