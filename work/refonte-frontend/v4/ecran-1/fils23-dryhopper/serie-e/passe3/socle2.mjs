// Série E (la frise), lot 23 Dryhopper : socle commun aux huit concepts.
// Données lues dans fils21-choisir/donnees/profils-simules.json (non modifiées) ; pictos repris de
// l'écran Dryhopper de la carte (fils22-carte/dryhopper/etat.html). Classes du socle préfixées « se- »,
// celles de chaque concept par son id (L26). Le code client est assemblé par concaténation, jamais par
// String.replace (L26).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ICI = path.dirname(fileURLToPath(import.meta.url));
const ECRAN1 = path.resolve(ICI, '../../..');
const P = JSON.parse(fs.readFileSync(path.join(ECRAN1, 'fils21-choisir/donnees/profils-simules.json'), 'utf8'));
const CARTE = fs.readFileSync(path.join(ECRAN1, 'fils22-carte/dryhopper/etat.html'), 'utf8');
// Pictos : la planche standard (fils17-standard/v3), dont « épicé » cannelle et clou croisés, choisi le 23.10.
const PLANCHE = fs.readFileSync(path.join(ECRAN1, 'fils17-standard/v3/planche.html'), 'utf8');
const SYM = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'].map((f) => { const a = PLANCHE.indexOf('<symbol id="p-' + f + '"'); return PLANCHE.slice(a, PLANCHE.indexOf('</symbol>', a) + 9); });
export const SYMBOLES = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' + SYM.join('') + '</defs></svg>';
void CARTE;
const PACK = JSON.parse(fs.readFileSync(path.resolve(ECRAN1, '../../../../prototypes/houblons-v4/data/pack-fiches.json'), 'utf8'));
const IDAHO = PACK.fichesHoublons.find((h) => h.name === 'Idaho 7');

export const F = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'];
export const NOM = { floral: 'Floral', herbal: 'Herbacé', earthy: 'Terreux', citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', resin: 'Résineux', spice: 'Épicé', green: 'Végétal' };
export const T = { citrus: '#856e0c', tropical: '#9b5d0d', melon: '#357a5b', stoneFruit: '#b5481c', pomeFruit: '#667623', berries: '#9b3f74', floral: '#9840bc', green: '#4f7a2b', herbal: '#377853', spice: '#7a4e3a', earthy: '#75694d', resin: '#2f6b5f' };
export const BA = { citrus: '#d9b414', tropical: '#ee9b2f', melon: '#6fc09b', stoneFruit: '#e88d68', pomeFruit: '#a3bd38', berries: '#9b3f74', floral: '#bf86d6', green: '#6aa33a', herbal: '#3f8a5f', spice: '#7a4e3a', earthy: '#9a8a66', resin: '#2f6b5f' };
export const FO = { citrus: '#fcf8e3', tropical: '#fdf1e3', melon: '#eaf6f0', stoneFruit: '#fbebe4', pomeFruit: '#f5f8e7', berries: '#f6e9f1', floral: '#f3e8f7', green: '#eff7e8', herbal: '#eaf5ef', spice: '#f5eeea', earthy: '#f3f1ed', resin: '#eaf6f3' };
const B = Object.fromEntries(F.map((f) => [f, P.style.zone[f].bande[1]]));
const AV = Object.fromEntries(F.map((f) => [f, +P.biere.avant[f].centre.toFixed(2)]));

// La grille : Idaho 7, 4 g/L, dans la stout 16D.
const G = P.grille.filter((e) => e.nom === 'Idaho 7' && e.dose_gL === 4);
const cas = (lev, m, j) => G.find((e) => e.levure === lev && e.moment === m && (e.jours ?? null) === j);
const centres = (e) => Object.fromEntries(F.map((f) => [f, +e.apres[f][1].toFixed(2)]));
const INC = F.filter((f) => cas('fermentis-us05', 'b60', null).apres[f][2] === 0); // haut 0 : non décrit, inconnu
const us = (m, j = null) => centres(cas('fermentis-us05', m, j));
const mix = (a, b, w) => Object.fromEntries(F.map((f) => [f, +(a[f] + (b[f] - a[f]) * w).toFixed(2)]));

// IBU de Tinseth (DI 1,066 de la stout S1 ; α du lot 12,7 % ; 4 g/L). Le whirlpool reprend l'estimation de
// l'écran de la carte (≈ +15). À cru : non modélisé (null).
const tinseth = (t) => Math.round(1.65 * Math.pow(0.000125, 0.066) * (1 - Math.exp(-0.04 * t)) / 4.15 * 0.127 * 4000);
const b60 = us('b60'), b10 = us('b10'), wp = us('wp');
export const M = [];
for (let m = 60; m >= 0; m -= 5) {
  let v, src = 'grille';
  if (m === 60) v = b60; else if (m === 10) v = b10;
  else if (m > 10) { v = mix(b60, b10, (60 - m) / 50); src = 'interp'; }
  else { v = mix(b10, wp, m === 5 ? 1 / 3 : 2 / 3); src = 'interp'; }
  M.push({ id: 'b' + m, lib: m + '′', court: m + '′', seg: 0, min: m, v, src, ibu: tinseth(m) });
}
M.push({ id: 'wp', lib: 'whirlpool', court: 'WP', seg: 1, v: wp, src: 'grille', ibu: 15, ibuSrc: 'estimé' });
for (const [seg, mo, nom] of [[2, 'dryActive', 'actif'], [3, 'dryPost', 'après']]) for (const j of [1, 2, 3, 5, 7]) {
  M.push({ id: mo + '|' + j, lib: nom + ' · ' + j + ' j', court: 'J' + j, seg, j, v: us(mo, j), src: 'grille', ibu: null });
}
export const SEGS = [[0, 13], [13, 14], [14, 19], [19, 24]];
export const DEPART = M.findIndex((p) => p.id === 'dryActive|2');
export const IDX = Object.fromEntries(M.map((p, k) => [p.id, k]));
const POM = Object.fromEntries([1, 2, 3, 5, 7].map((j) => [j, centres(cas('lalbrew-pomona', 'dryActive', j))]));

export const DONNEES = { F, NOM, T, BA, FO, B, AV, INC, M, SEGS, POM, IBU0: 60, DEPART };

export const pi = (f, s = 16, cl = 'se-pi') => '<svg class="' + cl + '" width="' + s + '" height="' + s + '" data-famille="' + f + '" style="stroke:' + T[f] + '" aria-label="' + NOM[f] + '"><use href="#p-' + f + '"/></svg>';
export const fr = (x, d = 1) => x.toFixed(d).replace('.', ',');

// Liens hors de la série : la carte des outils (fils22-carte), depuis serie-e/eN/etat.html.
export const LIEN_ETAPE = '../../../../fils22-carte/levure-etape/etat.html';
export const LIEN_OUTIL = '../../../../fils22-carte/levure-outil/etat.html';
export const etapes = () => '<nav class="se-etapes" aria-label="Étapes de Dryhopper"><span class="on">1 Quand</span><a href="' + LIEN_ETAPE + '">2 Levure ›</a></nav>';
export const pont = (cl = '') => '<nav class="se-pont ' + cl + '" aria-label="Vers l\'outil Levure"><a href="' + LIEN_OUTIL + '">Que change ma levure ? ›</a></nav>';

// Vraies valeurs (comparatifs-dryhop.json, lues sur la ligne de la bonne variété).
export const VRAI = {
  E08: '<span class="se-m">mesuré</span> l\'essentiel passe en <b>2 j</b> <span>Eureka!, 2,5 g/L</span> <span class="se-src">Schmidt 2019</span>',
  E10: '<span class="se-m">mesuré</span> <b>1 h</b> ou <b>96 h</b> : même arôme au panel <span>Cascade, 1,43 g/L</span> <span class="se-src">Titus 2021</span>',
  E03: '<span class="se-m">mesuré</span> Idaho 7 dès le levurage : linalol <b>38 ± 13 µg/L</b> <span>lecture à vérifier</span> <span class="se-src">McCabe 2023</span>',
  E05: '<span class="se-m">mesuré</span> <b>43 %</b> du linalol extrait en <b>6 h</b> <span>Cascade</span> <span class="se-src">Wolfe 2012</span>',
  E04: '<span class="se-m">mesuré</span> intensité <b>8,1</b> sur 15 contre <b>3</b> sans houblon <span>Cascade, 3,86 g/L, 24 h</span> <span class="se-src">Lafontaine 2018</span>',
  E01: '<span class="se-m">mesuré</span> en dry hop, linalol <b>72–178 µg/L</b>, seuil <b>8</b> <span>5 houblons</span> <span class="se-src">Kankolongo Cibaka 2017</span>',
  E07: '<span class="se-m">mesuré</span> à l\'ébullition : <b>cuit, herbacé</b> au panel <span>1,5 g/L</span> <span class="se-src">Sharp 2014</span>',
};
export const vrai = (k, cl = '') => '<p class="se-vrai ' + cl + '" data-nature="mesure" data-source="' + k + '">' + VRAI[k] + '</p>';

function radarFiche() {
  const n = F.length, c = 60, R = 46;
  const lv = Object.fromEntries(IDAHO.aromes.map((a) => [a.family, a.level]));
  const pt = (k, r) => [c + r * Math.sin((2 * Math.PI * k) / n), c - r * Math.cos((2 * Math.PI * k) / n)];
  let s = '<svg class="se-frad" width="120" height="120" viewBox="0 0 120 120" data-radar data-objet="fiche" data-axes="' + F.join(',') + '" aria-label="Silhouette d\'Idaho 7">';
  s += '<circle cx="60" cy="60" r="' + R + '" fill="none" stroke="#d9dce3"/><circle cx="60" cy="60" r="' + R / 2 + '" fill="none" stroke="#e3e5eb"/>';
  F.forEach((f, k) => { const [x, y] = pt(k, R); s += '<line x1="60" y1="60" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="#e3e5eb"/>'; });
  s += '<polygon points="' + F.map((f, k) => pt(k, ((lv[f] || 0) / 2) * R + 3).map((v) => v.toFixed(1)).join(',')).join(' ') + '" fill="#f6e9f1" stroke="#9b3f74" stroke-width="1.5"/>';
  s += '</svg>';
  return s;
}

const fiche = () => '<section class="se-fiche" id="se-fiche" data-role="fiche" role="dialog" aria-modal="true" aria-label="Fiche d\'Idaho 7" hidden>'
  + '<div class="se-fh"><b>Idaho 7</b><span class="se-fo">États-Unis · <span data-role="usage">mixte</span></span><button type="button" class="se-ff" data-role="fermer-fiche">Fermer</button></div>'
  + '<div class="se-fc">' + radarFiche() + '<div class="se-ft">'
  + '<p data-role="fiche-alpha"><span class="se-num">α 9,5–14,9 %</span> · lot <span class="se-num">12,7 %</span></p>'
  + '<p class="se-num">huile 1–2 mL/100 g</p>'
  + '<p data-role="fiche-arome">' + pi('berries', 14) + ' <b>cassis</b> marqué</p>'
  + '<p data-role="fiche-arome" class="se-fa">' + ['citrus', 'tropical', 'stoneFruit', 'floral', 'herbal', 'resin', 'earthy'].map((f) => pi(f, 14)).join('') + ' cités</p>'
  + '<p class="se-src" data-role="fiche-arome">1 fiche : Beer Maverick 2023</p>'
  + '<button type="button" class="se-gout" data-role="gout">Goûter dans ma stout ›</button>'
  + '</div></div></section>';

const CSS = `
:root{--encre:#16161a;--gris:#55555f;--trait:#e3e5eb;--mur:#eef0f4;--acc:#c2410c;--sans:"Source Sans 3",system-ui,-apple-system,"Segoe UI",sans-serif;--mono:"IBM Plex Mono",ui-monospace,Consolas,monospace}
[hidden]{display:none!important}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:var(--mur)}
body{color:var(--encre);font:400 13px/1.25 var(--sans);-webkit-tap-highlight-color:transparent}
::selection{background:#f3e8f7}
:focus-visible{outline:2px solid var(--encre);outline-offset:2px}
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
a{color:inherit;text-decoration:none}
svg{display:block;flex:none}
.se-ecran{max-width:390px;margin:0 auto;padding:4px 10px 16px;display:flex;flex-direction:column;gap:8px}
.se-barre{display:flex;align-items:center;gap:8px;min-height:36px}
.se-retour::before{content:"‹"}
.se-retour{width:28px;height:28px;border-radius:50%;background:#fff;border:1px solid var(--trait);display:inline-flex;align-items:center;justify-content:center;font:600 16px/1 var(--sans);flex:none}
h1.se-titre{font:600 16px/1.2 var(--sans)}
.se-ctx{display:flex;flex-wrap:wrap;align-items:center;gap:4px;font-size:13px}
.se-fixe{font-size:12px;color:var(--gris)}
.se-ctx [data-contexte]{display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 8px;border-radius:11px;background:#e2e5eb}
.se-h{font-weight:600;-webkit-touch-callout:none;user-select:none;cursor:default}
.se-num{font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:12px}
.se-pl{color:var(--gris)}
.se-stk{display:inline-block;width:12px;height:12px;border:2px solid var(--encre);border-radius:2px;padding:2px;background:var(--encre);background-clip:content-box;flex:none}
.se-lent{display:flex;align-items:center;gap:6px;position:relative}
.se-aide{width:26px;height:26px;border-radius:50%;border:1px solid #c9cad2;background:#fff;font-weight:700;color:var(--gris);margin-right:auto;flex:none}
.se-leg{position:absolute;top:32px;left:0;z-index:30;background:#fff;border:1px solid #c9cad2;border-radius:8px;padding:8px 10px;font-size:13px;display:flex;flex-direction:column;gap:4px;width:290px}
.se-seg{display:inline-flex;background:#e2e5eb;border-radius:14px;padding:2px}
.se-seg button{height:24px;padding:0 10px;border-radius:12px;font-size:13px;color:var(--gris)}
.se-seg button[aria-checked="true"]{background:#fff;color:var(--encre);font-weight:600}
.se-pi{width:16px;height:16px}
.se-rep{font:600 16px/1.3 var(--sans)}
.se-al{color:var(--acc)}
.se-bloc{background:#fff;border-radius:8px;padding:8px 10px}
.se-vrai{font-size:12px;color:var(--gris);display:flex;flex-wrap:wrap;gap:0 5px;align-items:baseline}
.se-vrai b{color:var(--encre);font-family:var(--mono);font-weight:600;font-size:12px}
.se-m{font-weight:600;color:#1d5f8a}
.se-src{color:var(--encre)}
.se-etapes{display:flex;gap:6px;align-items:center}
.se-etapes span,.se-etapes a{height:24px;padding:0 10px;border-radius:12px;display:inline-flex;align-items:center;font-size:13px;font-weight:600}
.se-etapes .on{background:var(--encre);color:#fff}
.se-etapes a{background:#fff;border:1px solid #c9cad2}
.se-pont{display:flex;justify-content:flex-end}
.se-pont a{height:30px;padding:0 14px;border-radius:15px;background:#fff;border:1px solid #c9cad2;font-weight:600;font-size:13px;display:inline-flex;align-items:center}
.se-fiche{position:fixed;left:50%;transform:translateX(-50%);bottom:0;width:100%;max-width:390px;background:#fff;border:1px solid #c9cad2;border-radius:8px 8px 0 0;padding:10px 12px 14px;z-index:60;display:flex;flex-direction:column;gap:6px}
.se-fh{display:flex;align-items:baseline;gap:8px;font-size:16px}
.se-fo{font-size:13px;color:var(--gris);margin-right:auto}
.se-ff{height:26px;padding:0 10px;border-radius:13px;border:1px solid #c9cad2;font-size:13px}
.se-fc{display:flex;gap:10px;align-items:center}
.se-ft{display:flex;flex-direction:column;gap:4px;font-size:13px}
.se-ft p{display:flex;align-items:center;gap:3px;flex-wrap:wrap}
.se-fa svg{margin-right:1px}
.se-gout{align-self:flex-start;height:28px;padding:0 12px;border-radius:14px;background:var(--encre);color:#fff;font-weight:600;font-size:13px}
.se-t{font-size:12px;color:var(--gris)}
`;

const JS = String.raw`
var F=SE.F,M=SE.M,AV=SE.AV,B=SE.B,T=SE.T,BA=SE.BA;
function abs(){return document.body.classList.contains('abs');}
function pc(f,v){return Math.max(0,Math.min(100,abs()?v/110*100:v/B[f]/2*100));}
function zp(f){return abs()?B[f]/110*100:50;}
function dl(i,f){return M[i].v[f]-AV[f];}
function sg(x){var r=Math.round(x);return (r>=0?'+':'−')+Math.abs(r);}
function tl(i){return M[i].src==='interp'?'≈':'~';}
function inc(f){return SE.INC.indexOf(f)>=0;}
function ibuT(i){return M[i].ibu==null?null:SE.IBU0+M[i].ibu;}
function trop(i){var t=ibuT(i);return t!=null&&t>70;}
function amerTxt(i){var t=ibuT(i);if(t==null)return '≈ 60 IBU, à cru ?';return (t>70?'trop amer ≈ ':'≈ ')+t+' IBU'+(t>70?'':' tenue');}
function reponse(i){var d=dl(i,'floral'),t=ibuT(i),s=tl(i);
  var h='Face à ta stout : <span style="color:'+T.floral+'">floral '+s+sg(d)+'</span>';
  h+=(t!=null&&t>70)?' · <span class="se-al">trop amer</span>':' · amertume ≈ tenue';
  var r=dl(i,'resin');if(r>=5)h+=' · <span class="se-al">résineux '+s+sg(r)+'</span>';return h;}
function cases(bornes){return M.map(function(p,k){var r=SE.SEGS[p.seg],n=r[1]-r[0],a=bornes[p.seg][0],b=bornes[p.seg][1],w=(b-a)/n;return {x:a+w*(k-r[0]),w:w};});}
function proche(xs,v){var best=0,bd=1e9;for(var k=0;k<xs.length;k++){var d=Math.abs(xs[k]-v);if(d<bd){bd=d;best=k;}}return best;}
function glisser(el,versIndex,poser){var on=false;
  el.addEventListener('pointerdown',function(e){try{el.setPointerCapture(e.pointerId);}catch(x){}on=true;el.classList.add('touche');document.body.classList.add('touche');var k=versIndex(e);if(k!=null)poser(k);});
  el.addEventListener('pointermove',function(e){if(!on)return;var k=versIndex(e);if(k!=null)poser(k);});
  function fin(){on=false;el.classList.remove('touche');document.body.classList.remove('touche');if(window.lacher)window.lacher();}
  el.addEventListener('pointerup',fin);el.addEventListener('pointercancel',fin);
  el.addEventListener('keydown',function(e){var i=SE.i;if(e.key==='ArrowRight'||e.key==='ArrowDown'){poser(Math.min(M.length-1,i+1));e.preventDefault();}if(e.key==='ArrowLeft'||e.key==='ArrowUp'){poser(Math.max(0,i-1));e.preventDefault();}});}
function aria(el,i){el.setAttribute('aria-valuenow',i);el.setAttribute('aria-valuetext',M[i].lib);}
document.querySelectorAll('[data-e]').forEach(function(x){x.addEventListener('click',function(){
  document.querySelectorAll('[data-e]').forEach(function(y){y.setAttribute('aria-checked',String(y===x));});
  document.body.classList.toggle('abs',x.dataset.e==='absolu');if(window.poser)window.poser(SE.i);});});
var fi=document.getElementById('se-fiche');
function ouvrir(){fi.hidden=false;}function fermer(){fi.hidden=true;}
document.querySelectorAll('[data-houblon]').forEach(function(h){var t=null;
  h.addEventListener('pointerdown',function(e){if(e.pointerType==='mouse')return;clearTimeout(t);t=setTimeout(ouvrir,500);});
  ['pointerup','pointercancel'].forEach(function(ev){h.addEventListener(ev,function(){clearTimeout(t);});});
  h.addEventListener('pointerenter',function(e){if(e.pointerType!=='mouse')return;clearTimeout(t);t=setTimeout(ouvrir,600);});
  h.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse')clearTimeout(t);});
  h.addEventListener('contextmenu',function(e){e.preventDefault();});});
document.querySelectorAll('[data-role=fermer-fiche],[data-role=gout]').forEach(function(b){b.addEventListener('click',fermer);});
document.querySelectorAll('[data-role=legende-bouton]').forEach(function(b){b.addEventListener('click',function(){
  var l=document.getElementById(b.getAttribute('aria-controls'));l.hidden=!l.hidden;b.setAttribute('aria-expanded',String(!l.hidden));});});
addEventListener('keydown',function(e){if(e.key!=='Escape')return;fermer();document.querySelectorAll('[data-role=legende]').forEach(function(l){l.hidden=true;});
  document.querySelectorAll('[data-role=legende-bouton]').forEach(function(b){b.setAttribute('aria-expanded','false');});});
`;

// Page complète d'un concept. corps : HTML après la rangée de lecture ; avant : HTML entre le contexte et la
// rangée de lecture ; legende : texte de la légende (8 mots au moins) ; js : code client du concept, qui définit
// window.poser(i) et l'appelle au départ.
export function page({ id, css, avant = '', corps, legende, js, bodyClass = '' }) {
  return '<!doctype html>\n<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n'
    + '<title>Dryhopper · ' + id + '</title>\n<style>' + CSS + css + '</style></head>\n<body class="' + bodyClass + '">\n' + SYMBOLES + '\n<main class="se-ecran">\n'
    + '<header class="se-barre"><a class="se-retour" aria-label="Retour" href="../../../../fils22-carte/carte/etat.html"></a><h1 class="se-titre">Quand ajouter Idaho 7 ?</h1></header>\n'
    + '<p class="se-ctx" data-role="contexte"><span class="se-fixe">fixé</span><span data-contexte="houblon"><span class="se-h" data-houblon="Idaho 7">Idaho 7</span> <span class="se-num" data-role="alpha" data-source="lot" data-houblon-alpha="Idaho 7">α 12,7 % <span class="se-pl">9,5–14,9</span></span> <span data-role="usage">mixte</span><i class="se-stk" aria-label="en stock"></i></span><span data-contexte="dose">4 g/L</span><span data-contexte="levure">US-05</span><span data-contexte="base">Stout 16D</span></p>\n'
    + avant
    + '<div class="se-lent"><button type="button" class="se-aide" data-role="legende-bouton" aria-expanded="false" aria-controls="se-leg" aria-label="Lire la légende">?</button><div class="se-leg" id="se-leg" data-role="legende" hidden>' + legende + '</div>'
    + '<span class="se-seg" data-lecture role="radiogroup" aria-label="lecture au style ou absolu"><button type="button" role="radio" aria-checked="true" data-e="style">Au style</button><button type="button" role="radio" aria-checked="false" data-e="absolu">Absolu</button></span></div>\n'
    + corps + '\n</main>\n' + fiche() + '\n'
    + '<script>var SE=' + JSON.stringify(DONNEES) + ';SE.i=SE.DEPART;</script>\n<script>' + JSS(js) + '</script>\n</body></html>\n';
}
const JSS = (js) => JS + '\n' + js + '\nvar q=location.search.match(/moment=([^&]+)/);window.poser(q?Math.max(0,M.findIndex(function(p){return p.id===decodeURIComponent(q[1]);})):SE.DEPART);\n';
