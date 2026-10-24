// Passe 2 de g1, « La courbe du compromis » (voie r7g2-passe2, lot 23, Dryhopper).
// Greffes du tri (tri/SYNTHESE.md) : dock sous le pouce avec loupe (a1/b1), mesure qui suit le moment et
// marques « mesuré » sur l'axe (c7, c2), « jamais mesuré » hachuré (c5), « sans gain » sur le plateau des
// jours (e2), « trop amer » dans la case (a8), les 12 barres l5b à un toucher (b1), « le meilleur » rappelé
// quand on s'en écarte (g4). Retouches : α du lot puis plage des fiches (D87), pictos sur les courbes et
// clé derrière le « ? » (D89), dock y1b sous le pouce (D63/D67), le doigt sur le graphe restant possible.
// Jours de contact au bout de la frise (x3b réduit) ; levure en pont (forme de g1).
// Socle de la série importé tel quel (../socle-g.mjs), sans le modifier ; classes de la passe : « p2- ».
// Usage : node generer.mjs [--captures]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { POS, AVANT, BANDE, ORDRE, COURT, JETONS, INCONNUS, MEILLEUR, IBU_16D, COUL_I7, H, VRAIES, symboles as SYMB0, CSS as CSS0, JS_COMMUN, fiche, pi, fr } from '../socle-g.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));

// « Épicé » : cannelle et clou croisés, choisi le 23.10 (SPEC § 0 ; f1 de fils22-picto-epice-3/serie-f,
// symbole p-spice de la planche standard, repris tel quel de fils22-comparer/r6n2/etat.html).
const SPICE = '<symbol id="p-spice" viewBox="0 0 24 24" fill="none" stroke="#7a4e3a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><g filter="url(#crayon)"><g transform="rotate(40 12 14)"><path vector-effect="non-scaling-stroke" d="M7.8 6V8M7.8 17.8V26M16.2 6V11.1M16.2 18.3V26"/><path vector-effect="non-scaling-stroke" d="M16.2 6A4.2 4.2 0 0 0 7.8 6 3 3 0 0 0 13.8 6 1.6 1.6 0 0 0 10.6 6"/></g><g transform="rotate(-40 12 14)"><circle vector-effect="non-scaling-stroke" cx="12" cy="4.6" r="1.7"/><path vector-effect="non-scaling-stroke" d="M8.4 4.4 10.4 9 12 7.6 13.6 9 15.6 4.4"/><path vector-effect="non-scaling-stroke" d="M10.6 9.4 12 21 13.4 9.4"/></g></g></symbol>';
const ancien = SYMB0.match(/<symbol id="p-spice"[^]*?<\/symbol>/)[0];
const symboles = SYMB0.split(ancien).join(SPICE);

// Les 14 étapes du dock : 60′ … 10′ (par 5′), whirlpool, actif, après ; les jours au bout de la frise.
const ETAPES = POS.slice(0, 12).map((p) => ({ lib: p.lib, seg: p.seg })).concat([{ lib: 'actif', seg: 'actif' }, { lib: 'après', seg: 'apres' }]);
const JOURS = [1, 2, 3, 5, 7];
const iMeil = MEILLEUR; // actif · 2 j
const SEGC = { ebu: '#8a5a2b', wp: '#b5481c', actif: '#2f6b5f', apres: '#3a5f8a' };

// Mesures par moment (comparatifs-dryhop.json ; lignes vérifiées, L14) : ce qui existe, et rien d'autre.
const mes = (k, valeur, quoi, qui) => { const x = VRAIES[k]; return { k, valeur, quoi, qui, src: k + ' ' + x.e.ref.split('.')[0].replace(/"/g, '') }; };
const MESURES = {
  ebu: mes('E07', '60′, 1,5 g/L', 'cuit, herbe à', 'Sharp 2014'),
  actif: mes('E03', '38 ± 13 µg/L', 'au pitch, linalol', 'McCabe 2023, à vérifier'),
  apres12: mes('E08', '2,5 g/L', 'tout passe en 2 j à', 'Schmidt 2019'),
  apres3: mes('E10', '1,43 g/L', '1 h = 96 h au nez à', 'Titus 2021'),
};

const alphaCtx = () => { const s = H.alpha.sources[0]; return `<span class="gs-num p2-alpha" data-role="alpha" data-source="lot">α ${fr(H.alpha.retenu.value, 1)} % <span class="p2-plage">${fr(s.min, 1)}–${fr(s.max, 1)}</span></span>`; };
const contexte = `<p class="gs-ctx" data-role="contexte"><span data-contexte="houblon"><b class="gs-h" data-houblon="Idaho 7" data-couleur="${COUL_I7}"><i class="gs-pt" style="background:${COUL_I7}"></i>Idaho 7</b> ${alphaCtx()} <span class="gs-usage" data-role="usage">mixte</span></span><span data-contexte="dose">4 g/L</span><span data-contexte="levure">US-05</span><span data-contexte="base">Stout 16D</span></p>`;
const legende = `<span>courbes : ce qu'Idaho 7 ajoute au nez de ta stout (${pi('floral', 14)} floral, ${pi('berries', 14)} baies, ${pi('resin', 14)} résineux)</span><span>barres : l'IBU de toute la stout ; bande grise : 16D 50–70 ; à cru, non modélisé (hachuré)</span><span>meilleur : le plus de floral, le moins de résineux ajouté, IBU dans la 16D</span><span>~ simulé · ≈ interpolé entre 60′ et 10′ (trait pâle) · trait vert sous l'axe : une mesure existe</span>`;

const barresHTML = ORDRE.map((f) => `<div class="gs-ba" data-f="${f}"><span class="gs-ba-n${['floral', 'herbal', 'earthy'].includes(f) ? ' gs-att' : ''}">${pi(f)}${COURT[f]}</span><span class="gs-piste"><i class="gs-zone" data-role="zone"></i>${INCONNUS.includes(f) ? '<i class="gs-hach"></i>' : `<i class="gs-rem" style="background:${JETONS[f].base}"></i><i class="gs-av"></i>`}</span><span class="gs-ba-v"></span></div>`).join('');

const W = 370, HN = 296, HB = 96, x0 = 8, x1 = W - 30;
const corps = `
<header class="gs-barre"><a class="gs-retour" aria-label="Retour" href="#">‹</a><h1 class="gs-titre">Quand ajouter Idaho 7 ?</h1></header>
${contexte}
<div class="gs-lent"><button type="button" class="gs-aide" data-role="legende-bouton" aria-expanded="false" aria-controls="p2-leg" aria-label="Lire la légende">?</button><div class="gs-leg" id="p2-leg" data-role="legende" hidden>${legende}</div><span class="gs-seg" data-lecture role="radiogroup" aria-label="lecture au style ou absolu"><button type="button" role="radio" aria-checked="true" data-e="style">Au style</button><button type="button" role="radio" aria-checked="false" data-e="absolu">Absolu</button></span></div>
<div class="p2-libre" data-libre="moment">
<section class="gs-bloc p2-graph">
  <p class="p2-rep"><b class="p2-mom"></b><span class="p2-txt"></span><button type="button" class="p2-meil" data-mom="${POS[iMeil].id}" hidden>meilleur : ${POS[iMeil].lib}</button></p>
  <div role="slider" tabindex="0" aria-label="Moment de l'ajout d'Idaho 7, sur le graphique" aria-valuemin="0" aria-valuemax="${POS.length - 1}" aria-valuenow="${iMeil}" aria-valuetext="${POS[iMeil].lib}" class="p2-zone">
  <svg width="${W}" height="${HN + HB + 30}" viewBox="0 0 ${W} ${HN + HB + 30}" aria-hidden="true">
    <defs><pattern id="p2-h" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#9a9aa6" stroke-width="1.5"/></pattern><pattern id="p2-hc" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#e1e3e9" stroke-width="2"/></pattern></defs>
    <g class="p2-fond"></g><g class="p2-nez" transform="translate(0,18)"></g><g class="p2-bouche" transform="translate(0,${HN + 26})"></g>
    <g><line class="p2-cl" y1="16" y2="${HN + HB + 26}" stroke="#16161a" stroke-width="2"/><circle class="p2-cr" r="7" fill="#fff" stroke="#16161a" stroke-width="2"/></g>
  </svg>
  </div>
  <button type="button" class="p2-ouvre" aria-expanded="false" aria-controls="p2-fam">12 familles</button>
  <div class="p2-fam" id="p2-fam" hidden>${barresHTML}</div>
</section>
<p class="p2-mes" data-acquis="valeurs"></p>
<nav class="gs-pont" aria-label="Pont vers Levure"><a class="gs-outil" data-acquis="levure" data-forme="pont" href="../../../../fils22-carte/levure-outil/etat.html"><span class="gs-lev" data-pont-lev></span><span class="gs-fl">Levure ›</span></a></nav>
<div class="p2-dock" data-acquis="frise">
  <div class="p2-loupe" aria-hidden="true"></div>
  <div class="p2-ligne">
    <div class="p2-rail-c" data-acquis="geste" data-pas="5"><div role="slider" tabindex="0" aria-label="Moment de l'ajout d'Idaho 7" aria-valuemin="0" aria-valuemax="${ETAPES.length - 1}" aria-valuenow="12" aria-valuetext="actif · 2 j" class="p2-rail">${['ebu', 'wp', 'actif', 'apres'].map((s) => `<span class="p2-s" data-s="${s}" style="background:${SEGC[s]}"></span>`).join('')}<span class="p2-pouce"><span class="p2-pl"></span></span></div>
      <div class="p2-et">${[['ebu', 'ébullition'], ['wp', 'WP'], ['actif', 'actif'], ['apres', 'après']].map(([s, t]) => `<span data-etape="${s}" data-s="${s}">${t}</span>`).join('')}</div></div>
    <div class="p2-jours" data-jours role="radiogroup" aria-label="Jours de contact">${JOURS.map((j) => `<button type="button" role="radio" aria-checked="${j === 2}" data-jour="${j}">${j} j</button>`).join('')}</div>
  </div>
</div>
</div>`;

const css = `
.gs-ecran { padding-bottom:76px; gap:6px; }
.p2-alpha .p2-plage { color:var(--gris); margin-left:2px; }
.p2-graph { gap:2px; padding:6px 0 6px; }
.p2-rep { padding:0 10px; font-size:14px; min-height:40px; display:flex; flex-wrap:wrap; align-items:center; gap:2px 6px; }
.p2-txt { display:inline-flex; flex-wrap:wrap; gap:2px 10px; }
.p2-mom { display:inline-block; background:var(--encre); color:#fff; border-radius:11px; padding:0 8px; font-weight:600; }
.p2-meil { height:24px; padding:0 10px; border-radius:12px; border:1px solid #0f6b4f; color:#0f6b4f; font-weight:600; font-size:13px; }
.p2-zone { touch-action:none; cursor:ew-resize; outline:none; }
.p2-zone.gs-touche .p2-cr { r:10; }
.p2-seg { font:600 12px var(--sans); fill:#55555f; }
.p2-ouvre { align-self:flex-start; margin:0 10px; height:26px; padding:0 12px; border-radius:13px; border:1px solid #c9cad2; font-size:13px; color:var(--encre); }
.p2-ouvre[aria-expanded="true"] { background:var(--encre); color:#fff; }
.p2-fam { display:flex; flex-direction:column; gap:3px; padding:6px 10px 0; }
${['.gs-ba { display:grid; grid-template-columns:92px 1fr 44px; align-items:center; gap:6px; font-size:13px; min-height:20px; }',
  '.gs-ba-n { display:flex; align-items:center; gap:4px; white-space:nowrap; }', '.gs-att { font-weight:700; }',
  '.gs-ba-v { text-align:right; font-family:var(--mono); font-size:12px; }',
  '.gs-piste { position:relative; height:12px; background:#f1f2f5; border-radius:2px; overflow:hidden; }',
  '.gs-piste i { position:absolute; top:0; bottom:0; left:0; display:block; }', '.gs-zone { background:#d9dce3; }',
  '.gs-rem { height:6px; top:3px !important; border-radius:2px; }',
  '.gs-av { width:10px; height:10px; top:1px !important; border-radius:50%; border:2px solid var(--encre); background:#fff; margin-left:-5px; }',
  '.gs-hach { right:0; background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }'].join('\n')}
.p2-mes { font-size:12px; line-height:1.3; min-height:32px; }
.p2-mes .p2-rien { display:inline-flex; align-items:center; gap:6px; color:var(--gris); }
.p2-mes .p2-rien::before { content:''; width:22px; height:12px; border-radius:2px; background:repeating-linear-gradient(135deg,#9a9aa6 0 2px,#fff 2px 6px); }
.p2-dock { position:fixed; left:0; right:0; bottom:0; background:#fff; border-top:1px solid #c9cad2; padding:10px 12px 6px; touch-action:none; z-index:10; }
.p2-ligne { display:flex; align-items:flex-start; gap:10px; max-width:370px; margin:0 auto; }
.p2-rail-c { flex:1; }
.p2-rail { position:relative; height:26px; display:flex; gap:3px; align-items:center; outline:none; cursor:pointer; }
.p2-s { height:6px; border-radius:2px; }
.p2-s[data-s=ebu] { flex:11; } .p2-s[data-s=wp] { flex:1.6; } .p2-s[data-s=actif] { flex:1.6; } .p2-s[data-s=apres] { flex:1.6; }
.p2-pouce { position:absolute; top:2px; width:22px; height:22px; margin-left:-11px; border-radius:50%; background:#fff; border:3px solid var(--encre); }
.p2-pl { position:absolute; bottom:27px; left:50%; transform:translateX(-50%); white-space:nowrap; background:var(--encre); color:#fff; font:600 13px var(--sans); padding:2px 8px; border-radius:11px; }
.p2-et { display:flex; gap:3px; font-size:12px; color:var(--gris); margin-top:2px; }
.p2-et span { text-align:center; white-space:nowrap; }
.p2-et [data-s=ebu] { flex:11; } .p2-et [data-s=wp], .p2-et [data-s=actif], .p2-et [data-s=apres] { flex:1.6; }
.p2-jours { display:flex; gap:2px; padding-top:1px; }
.p2-jours button { width:26px; height:24px; border-radius:4px; border:1px solid #c9cad2; font:12px var(--sans); color:var(--encre); padding:0; white-space:nowrap; }
.p2-jours button[aria-checked="true"] { background:var(--encre); color:#fff; border-color:var(--encre); }
.p2-jours.p2-off button { opacity:.4; }
.p2-jours button.p2-sans { background:repeating-linear-gradient(135deg,#e1e3e9 0 2px,#fff 2px 6px); }
.p2-jours button.p2-sans[aria-checked="true"] { background:var(--encre); }
.p2-loupe { position:absolute; left:8px; right:8px; bottom:100%; height:40px; display:none; background:#fff; border:1px solid #c9cad2; border-radius:8px; overflow:hidden; }
.p2-dock.gs-touche .p2-loupe { display:block; }
.p2-pl { display:none; }
.p2-loupe span { position:absolute; top:9px; transform:translateX(-50%); font:600 14px var(--mono); color:var(--gris); white-space:nowrap; }
.p2-loupe span.ici { color:#fff; background:var(--encre); padding:1px 6px; border-radius:4px; }`;

const js = `<script>
var ET = ${JSON.stringify(ETAPES)}, JOURS = ${JSON.stringify(JOURS)}, MES = ${JSON.stringify(MESURES)};
var W = ${W}, HN = ${HN}, HB = ${HB}, x0 = ${x0}, x1 = ${x1}, NS = 'http://www.w3.org/2000/svg';
var etat = { e: 12, j: 2 };
var q = location.search.match(/moment=([^&]+)/);
function idx(s) { if (s.e < 12) return s.e; var pre = s.e === 12 ? 'dryActive|' : 'dryPost|'; return D.findIndex(function (p) { return p.id === pre + s.j; }); }
function depuisPos(i) { var p = D[i]; if (p.seg === 'actif') return { e: 12, j: p.j }; if (p.seg === 'apres') return { e: 13, j: p.j }; return { e: i, j: etat.j }; }
if (q) { var k0 = D.findIndex(function (p) { return p.id === decodeURIComponent(q[1]); }); if (k0 >= 0) etat = depuisPos(k0); }
function X(i) { return x0 + (x1 - x0) * i / N; }
var FAM = [['floral', '#9840bc'], ['berries', '#9b3f74'], ['resin', '#2f6b5f']];
function el(t, a, txt) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); if (txt) e.textContent = txt; return e; }
function pic(f, x, y) { var s = el('svg', { x: x, y: y, width: 18, height: 18, viewBox: '0 0 24 24', 'data-famille': f, 'aria-label': COURT[f] }); s.appendChild(el('use', { href: '#p-' + f })); return s; }
var Yf;
function dessiner() {
  var fond = document.querySelector('.p2-fond'), nez = document.querySelector('.p2-nez'), bou = document.querySelector('.p2-bouche');
  fond.innerHTML = ''; nez.innerHTML = ''; bou.innerHTML = '';
  var demi = (x1 - x0) / N / 2;
  // lieux : en-têtes et séparations
  [['ébullition', 0, 10], ['WP', 11, 11], ['actif', 12, 16], ['après', 17, 21]].forEach(function (s) { fond.appendChild(el('text', { x: (X(s[1]) + X(s[2])) / 2, y: 12, 'text-anchor': 'middle', class: 'p2-seg' }, s[0])); });
  [11, 12, 17].forEach(function (i) { fond.appendChild(el('line', { x1: X(i) - demi, x2: X(i) - demi, y1: 18, y2: HN + HB + 24, stroke: '#e1e3e9' })); });
  // le plateau des jours : au-delà de 2 j, sans gain (la grille sature, cerveau/metier/dryhop-moment)
  [[14, 16], [19, 21]].forEach(function (b) { fond.appendChild(el('rect', { x: X(b[0]) - demi, y: 18, width: X(b[1]) - X(b[0]) + 2 * demi, height: HN - 50, fill: 'url(#p2-hc)' })); });
  [20].forEach(function (i) { fond.appendChild(el('text', { x: X(i), y: HN - 40, 'text-anchor': 'middle', class: 'p2-seg' }, 'sans gain')); });
  var max = 0; D.forEach(function (p) { FAM.forEach(function (f) { max = Math.max(max, lire(f[0], delta(p, f[0]))); }); });
  Yf = function (v) { return HN - 46 - (HN - 54) * v / max; };
  nez.appendChild(el('line', { x1: x0, x2: x1, y1: Yf(0), y2: Yf(0), stroke: '#c9cad2' }));
  FAM.forEach(function (f) {
    var pts = D.map(function (p, i) { return X(i).toFixed(1) + ',' + Yf(lire(f[0], delta(p, f[0]))).toFixed(1); });
    nez.appendChild(el('polyline', { points: pts.slice(0, 11).join(' '), fill: 'none', stroke: f[1], 'stroke-width': 2.5, opacity: .4 }));
    nez.appendChild(el('polyline', { points: pts.slice(10).join(' '), fill: 'none', stroke: f[1], 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
    [0, 10].forEach(function (i) { nez.appendChild(el('circle', { cx: X(i), cy: Yf(lire(f[0], delta(D[i], f[0]))), r: 2.5, fill: f[1] })); });
  });
  // pictos au bout des courbes, écartés s'ils se touchent
  var bouts = FAM.map(function (f) { return { f: f[0], y: Yf(lire(f[0], delta(D[N], f[0]))) - 9 }; }).sort(function (a, b) { return a.y - b.y; });
  for (var k = 1; k < bouts.length; k++) if (bouts[k].y - bouts[k - 1].y < 19) bouts[k].y = bouts[k - 1].y + 19;
  bouts.forEach(function (b) { nez.appendChild(pic(b.f, x1 + 6, b.y)); });
  // marques « mesuré » sous l'axe des lieux où une mesure existe (60′, actif, après)
  [[0, 0], [12, 16], [17, 21]].forEach(function (b) { nez.appendChild(el('rect', { x: X(b[0]) - demi + 2, y: Yf(0) + 4, width: X(b[1]) - X(b[0]) + 2 * demi - 4, height: 3, rx: 1, fill: '#0f6b4f' })); });
  // la bouche : IBU de toute la stout, bande 16D 50–70
  var IM = 170, YB = function (v) { return HB - HB * v / IM; };
  bou.appendChild(el('rect', { x: x0 - 4, width: x1 - x0 + 8, y: YB(${IBU_16D[1]}), height: YB(${IBU_16D[0]}) - YB(${IBU_16D[1]}), fill: '#d9dce3', 'data-role': 'zone' }));
  D.forEach(function (p, i) { var w = 2 * demi - 3;
    if (p.ibu == null) { bou.appendChild(el('rect', { x: X(i) - w / 2, y: YB(60), width: w, height: HB - YB(60), fill: '#7a7f8c' })); bou.appendChild(el('rect', { x: X(i) - w / 2, y: YB(84), width: w, height: YB(60) - YB(84), fill: 'url(#p2-h)' })); return; }
    bou.appendChild(el('rect', { x: X(i) - w / 2, y: YB(p.ibu), width: w, height: HB - YB(p.ibu), fill: p.ibu > ${IBU_16D[1]} ? '#c2410c' : '#7a7f8c' })); });
  bou.appendChild(el('text', { x: X(0) - 4, y: -4, class: 'p2-dans' }, 'trop amer'));
  bou.appendChild(el('text', { x: (X(12) + X(21)) / 2, y: YB(84) - 4, 'text-anchor': 'middle', class: 'p2-seg' }, 'à cru ?'));
  bou.appendChild(el('text', { x: X(MEILLEUR) + 5, y: -4, class: 'gs-meilleur', fill: '#0f6b4f' }, 'meilleur'));
}
// le dock
var rail = document.querySelector('.p2-rail'), dock = document.querySelector('.p2-dock'), loupe = document.querySelector('.p2-loupe'), zone = document.querySelector('.p2-zone');
function bornes(s) { var e = rail.querySelector('[data-s=' + s + ']'), r = rail.getBoundingClientRect(), b = e.getBoundingClientRect(); return [b.left - r.left, b.right - r.left]; }
function XR(e) { var s = ET[e].seg, b = bornes(s); if (s !== 'ebu') return (b[0] + b[1]) / 2; return b[0] + (b[1] - b[0]) * (0.04 + 0.92 * e / 10); }
function majLoupe() { loupe.innerHTML = ''; var w = loupe.clientWidth || 350; for (var k = etat.e - 2; k <= etat.e + 2; k++) { if (k < 0 || k >= ET.length) continue; var s = document.createElement('span'); s.textContent = ET[k].seg === 'wp' ? 'WP' : ET[k].lib; if (k === etat.e) s.className = 'ici'; s.style.left = (w / 2 + (k - etat.e) * 90) + 'px'; loupe.appendChild(s); } }
function mesure(p) { var m = p.seg === 'ebu' ? MES.ebu : p.seg === 'actif' ? MES.actif : p.seg === 'apres' ? (p.j <= 2 ? MES.apres12 : MES.apres3) : null;
  var c = document.querySelector('.p2-mes');
  if (!m) { c.innerHTML = '<span class="p2-rien">jamais mesuré au whirlpool</span>'; return; }
  c.innerHTML = '<span class="gs-mes">mesuré</span> ' + m.quoi + ' <span data-nature="mesure" data-source="' + m.src + '">' + m.valeur + '</span> <span class="gs-src">' + m.qui + '</span>'; }
window.pontLevure = function (p) { var el = document.querySelector('[data-pont-lev]');
  if (p.vPomona && p.seg === 'actif') el.innerHTML = 'Pomona, <em style="color:#856e0c">agrumes ~+' + Math.round(p.vPomona.citrus - p.v.citrus) + '</em>';
  else el.textContent = p.seg === 'apres' ? 'levure sans effet après' : 'levure sans effet ici'; };
function poser(s) { etat = s; var i = idx(s), p = D[i];
  rail.setAttribute('aria-valuenow', s.e); rail.setAttribute('aria-valuetext', p.lib);
  zone.setAttribute('aria-valuenow', i); zone.setAttribute('aria-valuetext', p.lib);
  rail.querySelector('.p2-pouce').style.left = XR(s.e) + 'px'; rail.querySelector('.p2-pl').textContent = p.lib;
  var j = document.querySelector('.p2-jours'); j.classList.toggle('p2-off', s.e < 12);
  j.querySelectorAll('button').forEach(function (b) { var n = +b.dataset.jour; b.setAttribute('aria-checked', String(s.e >= 12 && n === s.j)); b.classList.toggle('p2-sans', n > 2); });
  var x = X(i); document.querySelector('.p2-cl').setAttribute('x1', x); document.querySelector('.p2-cl').setAttribute('x2', x);
  var c = document.querySelector('.p2-cr'); c.setAttribute('cx', x); c.setAttribute('cy', 18 + Yf(lire('floral', delta(p, 'floral'))));
  document.querySelector('.p2-mom').textContent = p.lib.split(' · ').join(' ') + (i === MEILLEUR ? ', meilleur' : '');
  var m = p.interp ? '≈' : '~', trop = p.ibu > ${IBU_16D[1]};
  // séparateurs en CSS (gap), pas en texte : un « · » compte comme un mot au premier écran
  document.querySelector('.p2-txt').innerHTML = '<b style="color:#9840bc">floral ' + m + sg(delta(p, 'floral')) + '</b><span>résineux ' + m + sg(delta(p, 'resin')) + '</span><span style="color:' + (trop ? '#c2410c' : '#16161a') + '">' + (p.ibu == null ? 'IBU ~60+?' : 'IBU ~' + p.ibu + (trop ? ', trop amer' : '')) + '</span>';
  document.querySelector('.p2-meil').hidden = i === MEILLEUR;
  majBarres(p); mesure(p); majLoupe(); window.pontLevure(p); }
function majBarres(p) {
  document.querySelectorAll('.p2-fam .gs-ba[data-f]').forEach(function (r) {
    var f = r.dataset.f, v = r.querySelector('.gs-ba-v'), z = r.querySelector('.gs-zone'), rem = r.querySelector('.gs-rem'), av = r.querySelector('.gs-av');
    var ech = function (x) { return Math.max(0, Math.min(100, abs() ? x / 110 * 100 : x / B[f] / 2 * 100)); };
    z.style.width = (abs() ? B[f] / 110 * 100 : 50) + '%';
    if (INC.indexOf(f) >= 0) { v.textContent = '?'; v.style.color = '#55555f'; return; }
    rem.style.width = ech(p.v[f]) + '%'; av.style.left = 'clamp(5px,' + ech(AV[f]) + '%,calc(100% - 5px))';
    var d = delta(p, f); v.textContent = Math.abs(d) >= 0.5 ? (p.interp ? '≈' : '~') + sg(d) : ''; v.style.color = p.v[f] > B[f] ? '#c2410c' : TX[f]; }); }
window.redessiner = function () { dessiner(); poser(etat); };
function glisser(cible, versEtat, classe) {
  var actif = false;
  cible.addEventListener('pointerdown', function (e) { actif = true; try { cible.setPointerCapture(e.pointerId); } catch (_) {} cible.classList.add('gs-touche'); if (classe) classe.classList.add('gs-touche'); poser(versEtat(e)); e.preventDefault(); });
  cible.addEventListener('pointermove', function (e) { if (actif) { var s = versEtat(e); if (idx(s) !== idx(etat)) poser(s); } });
  var fin = function () { actif = false; cible.classList.remove('gs-touche'); if (classe) classe.classList.remove('gs-touche'); };
  cible.addEventListener('pointerup', fin); cible.addEventListener('pointercancel', fin);
}
glisser(rail, function (e) { var r = rail.getBoundingClientRect(), x = e.clientX - r.left, best = 0, bd = 1e9; for (var k = 0; k < ET.length; k++) { var d = Math.abs(XR(k) - x); if (d < bd) { bd = d; best = k; } } return { e: best, j: etat.j }; }, dock);
glisser(zone, function (e) { var r = zone.getBoundingClientRect(); return depuisPos(Math.max(0, Math.min(N, Math.round((e.clientX - r.left - x0) / (x1 - x0) * N)))); });
rail.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') poser({ e: Math.min(ET.length - 1, etat.e + 1), j: etat.j }); if (e.key === 'ArrowLeft') poser({ e: Math.max(0, etat.e - 1), j: etat.j }); });
zone.addEventListener('keydown', function (e) { var i = idx(etat); if (e.key === 'ArrowRight') poser(depuisPos(Math.min(N, i + 1))); if (e.key === 'ArrowLeft') poser(depuisPos(Math.max(0, i - 1))); });
document.querySelectorAll('.p2-jours button').forEach(function (b) { b.addEventListener('click', function () { poser({ e: etat.e < 12 ? 12 : etat.e, j: +b.dataset.jour }); }); });
document.querySelector('.p2-meil').addEventListener('click', function () { poser(depuisPos(MEILLEUR)); });
var ouvre = document.querySelector('.p2-ouvre'); ouvre.addEventListener('click', function () { var f = document.getElementById('p2-fam'); f.hidden = !f.hidden; ouvre.setAttribute('aria-expanded', String(!f.hidden)); });
dessiner(); poser(etat);
</script>`;

const page = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>g1 passe 2 · Quand ajouter Idaho 7 ?</title>
<style>${CSS0}${css}
.p2-dans { font:700 12px var(--sans); fill:#c2410c; }</style></head>
<body>
${symboles}
<main class="gs-ecran g1p2">
${corps}
</main>
${fiche()}
${JS_COMMUN}
<script>
var D = ${JSON.stringify(POS)}, AV = ${JSON.stringify(AVANT)}, B = ${JSON.stringify(BANDE)}, INC = ${JSON.stringify(INCONNUS)}, N = D.length - 1, MEILLEUR = ${MEILLEUR};
var TX = ${JSON.stringify(Object.fromEntries(Object.entries(JETONS).map(([k, v]) => [k, v.texte])))}, COURT = ${JSON.stringify(COURT)};
function abs() { return document.body.classList.contains('abs'); }
function lire(f, x) { return abs() ? x / 110 : x / B[f]; }
function delta(p, f) { return p.v[f] - AV[f]; }
function sg(x) { return (x >= 0 ? '+' : '−') + Math.abs(Math.round(x)); }
</script>
${js}
</body></html>
`;
fs.mkdirSync(path.join(ICI, 'g1'), { recursive: true });
fs.writeFileSync(path.join(ICI, 'g1', 'etat.html'), page);
console.log('écrit : passe2/g1/etat.html');

if (process.argv.includes('--captures')) {
  const puppeteer = (await import('puppeteer-core')).default;
  const cap = path.join(ICI, 'captures'), trav = path.join(cap, 'travail');
  fs.mkdirSync(trav, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
  const p = await browser.newPage();
  const err = [];
  p.on('pageerror', (e) => err.push(e.message));
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(pathToFileURL(path.join(ICI, 'g1', 'etat.html')).href, { waitUntil: 'networkidle0' });
  await attendre(300);
  await p.screenshot({ path: path.join(cap, 'g1-premier-ecran.png') });
  await p.screenshot({ path: path.join(cap, 'g1-390.png'), fullPage: true });
  // geste au doigt sur le dock : de l'actif vers 15′, doigt gardé (la loupe), puis relâché
  const b = await p.$eval('.p2-rail', (e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top + r.height / 2, w: r.width }; });
  const a = { x: b.x + b.w * 0.82, y: b.y }, z = { x: b.x + b.w * 0.55, y: b.y };
  await p.touchscreen.touchStart(a.x, a.y);
  for (let k = 1; k <= 12; k++) { await p.touchscreen.touchMove(a.x + (z.x - a.x) * k / 12, a.y); await attendre(30); }
  await attendre(150);
  await p.screenshot({ path: path.join(cap, 'g1-toucher-390.png') });
  const mesureLoupe = await p.evaluate(() => { const s = [...document.querySelectorAll('.p2-loupe span')].map((e) => e.getBoundingClientRect().left + e.getBoundingClientRect().width / 2); const pas = s.length > 1 ? s[1] - s[0] : 0; const r = document.querySelector('.p2-s[data-s=ebu]').getBoundingClientRect(); return { pasLoupe: Math.round(pas), pasRail: +(r.width * 0.92 / 10).toFixed(1) }; });
  await p.touchscreen.touchEnd();
  await attendre(200);
  console.log('geste → ' + (await p.$eval('.p2-rail', (e) => e.getAttribute('aria-valuetext'))) + ' · loupe ' + mesureLoupe.pasLoupe + ' px par cran contre ' + mesureLoupe.pasRail + ' sur le rail (×' + (mesureLoupe.pasLoupe / mesureLoupe.pasRail).toFixed(1) + ')');
  await p.screenshot({ path: path.join(trav, 'g1-apres-geste.png') });
  // 12 familles à un toucher, et l'après · 5 j (sans gain)
  await p.tap('.p2-ouvre'); await attendre(150);
  await p.tap('.p2-jours [data-jour="5"]'); await attendre(150);
  await p.screenshot({ path: path.join(trav, 'g1-familles.png'), fullPage: true });
  // whirlpool : « jamais mesuré »
  await p.goto(pathToFileURL(path.join(ICI, 'g1', 'etat.html')).href + '?moment=wp', { waitUntil: 'networkidle0' });
  await attendre(200);
  await p.screenshot({ path: path.join(trav, 'g1-wp.png') });
  console.log('erreurs de script : ' + (err.length ? err.join(' | ') : 0));
  await browser.close();
}
