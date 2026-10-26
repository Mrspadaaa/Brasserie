// rpb1 (froide) : r6a telle quelle, plus « choisir quand comparer » — la frise de y1b retravaillée en sélecteur
// de moment au-dessus des colonnes ; chaque arrêt annonce qui mène le floral à ce moment.
import { TETE, sprite, cssBase, LIB, donnees, RANGEES, INCONNUES, ecrire } from './commun.mjs';
const PX = 'rpb1';
const D = donnees();

const css = cssBase(PX) + `
.${PX}-ecran{max-width:430px;margin:0 auto;padding:6px 12px 24px}
.${PX}-tete{display:flex;align-items:flex-start;gap:6px;padding:2px 0 4px}
.${PX}-x{width:32px;height:32px;border-radius:16px;display:grid;place-items:center;background:var(--fond);flex:none}
.${PX}-titre{font-size:18px;font-weight:700;line-height:1.15;flex:1;padding-top:3px}
.${PX}-aide{width:32px;height:32px;border-radius:16px;display:grid;place-items:center;border:1px solid var(--trait);flex:none;color:var(--gris)}
.${PX}-ctx{display:flex;gap:4px;align-items:center;font-size:12px;color:var(--gris);margin:2px 0 0}.${PX}-ctx .${PX}-seg{margin-left:auto}
.${PX}-ctx b{font-weight:600;background:var(--fond);border-radius:10px;padding:2px 8px;color:var(--encre)}
.${PX}-haut{position:relative;display:flex;justify-content:center}
.${PX}-lent{position:absolute;left:0;top:6px}
.${PX}-seg{display:flex;background:var(--fond);border-radius:14px;padding:2px}
.${PX}-seg button{white-space:nowrap;font-size:12px;padding:4px 9px;border-radius:12px;color:var(--gris)}
.${PX}-seg button[aria-pressed="true"]{background:var(--encre);color:#fff;font-weight:600}
.${PX}-simu{font-size:12px;border:1.5px solid var(--encre);border-radius:12px;padding:1px 8px;font-weight:600}
/* La frise du quand (greffe frise-y1b + etapes) */
.${PX}-frise{position:relative;margin:2px 0 6px;padding:0 2px}
.${PX}-fr-lig{display:grid;grid-template-columns:44px repeat(3,1fr) 10px repeat(2,1fr);align-items:end;gap:0}
.${PX}-fr-et{font-size:12px;color:var(--gris);align-self:center;line-height:1.1}
.${PX}-mene{display:flex;flex-direction:column;align-items:center;gap:1px;font-size:12px;padding-bottom:3px}
.${PX}-mene i{width:8px;height:8px;border-radius:4px;display:block}
.${PX}-rail{position:relative;height:30px;display:grid;grid-template-columns:44px repeat(3,1fr) 10px repeat(2,1fr);align-items:center}
.${PX}-rail::before{content:"";position:absolute;left:44px;right:0;top:50%;height:2px;background:#cfcfd6;border-radius:1px}
.${PX}-sep{width:2px;height:22px;background:#9a9aa4;justify-self:center;position:relative}
.${PX}-arr{position:relative;justify-self:center;font-size:14px;font-weight:600;min-width:46px;height:28px;border-radius:14px;background:#fff;border:1.5px solid #cfcfd6}
.${PX}-arr[aria-pressed="true"]{background:var(--encre);border-color:var(--encre);color:#fff}
.${PX}-fr-zone{display:grid;grid-template-columns:44px 3fr 10px 2fr;font-size:12px;color:var(--gris);margin-top:1px}
.${PX}-fr-zone span:nth-child(2),.${PX}-fr-zone span:nth-child(4){text-align:center}
/* Le tableau r6a */
.${PX}-tab{display:grid;grid-template-columns:78px repeat(3,1fr);column-gap:6px;margin-top:4px}
.${PX}-gau{font-size:13px;display:flex;flex-direction:column;gap:3px;padding-top:6px}
.${PX}-gau .${PX}-l{display:flex;align-items:center;gap:4px}
.${PX}-trait{width:14px;height:2px;background:var(--encre);display:inline-block}
.${PX}-pt{width:14px;height:0;border-top:2px dotted #6b6b75;display:inline-block}
.${PX}-col{border-radius:8px 8px 0 0;padding:5px 5px 4px;border-top:4px solid var(--hc);min-width:0;cursor:pointer;position:relative}
.${PX}-col[aria-pressed="true"]{background:#f6f6f8;box-shadow:inset 0 0 0 2px var(--hc)}
.${PX}-nom{font-size:14px;font-weight:700;display:flex;align-items:center;gap:3px;white-space:nowrap}
.${PX}-nom u{text-decoration:underline dotted #9a9aa4;text-underline-offset:3px}
.${PX}-li{font-size:12px;color:var(--gris);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.${PX}-li b{color:var(--encre);font-weight:600}
.${PX}-fams{display:flex;gap:2px;flex-wrap:wrap;margin:2px 0}
.${PX}-vd{font-size:12px;font-weight:600;display:flex;align-items:center;gap:2px}
.${PX}-vd.dans{color:var(--vert)} .${PX}-vd.hors{color:var(--acc)}
.${PX}-h16{display:inline-block;margin-top:3px;font-size:12px;font-weight:600;background:var(--encre);color:#fff;border-radius:4px;padding:1px 6px;max-width:100%;line-height:1.15}
.${PX}-h16 small{font-size:12px;opacity:.75;font-weight:400}
.${PX}-mom{font-size:12px;margin-top:3px;font-weight:600;white-space:nowrap}
.${PX}-mom .${PX}-mono{font-weight:500}
.${PX}-rg{display:contents}
.${PX}-rl{display:flex;align-items:center;gap:4px;font-size:13px;height:22px;color:var(--t);white-space:nowrap}
.${PX}-rl.vise{font-weight:700}
.${PX}-rc{display:flex;flex-direction:column;justify-content:center;min-height:22px;padding:0 6px 0 1px}
.${PX}-rc.sel{background:#f6f6f8;box-shadow:inset 2px 0 0 var(--hc),inset -2px 0 0 var(--hc)}
.${PX}-cr{font-size:12px;font-family:var(--mono);line-height:1;margin-top:2px}
.${PX}-cr.pos{color:var(--t)} .${PX}-cr.neg{color:var(--acc)}
.${PX}-inc-l{font-size:12px;color:var(--gris);display:flex;align-items:center;gap:4px;grid-column:2/5}
.${PX}-pied{display:flex;gap:8px;margin-top:12px;align-items:center}
.${PX}-btn{font-size:13px;font-weight:600;border:1.5px solid var(--encre);border-radius:16px;padding:5px 12px;display:inline-flex;gap:4px;align-items:center}
.${PX}-btn.plein{background:var(--encre);color:#fff;margin-left:auto}.${PX}-btn.plein::after{content:'›';display:inline-block;margin-left:4px}
.${PX}-vv{margin-top:10px;font-size:13px;display:none}
.${PX}-vv.ouvert{display:grid;grid-template-columns:78px repeat(3,1fr);gap:4px 6px}
.${PX}-leg{display:none;position:fixed;inset:auto 8px 8px 8px;background:#fff;border:1px solid var(--trait);border-radius:12px;padding:10px 12px;box-shadow:0 8px 30px rgba(0,0,0,.18);font-size:13px;z-index:5}
.${PX}-leg.ouvert{display:block}
.${PX}-leg p{display:flex;gap:8px;align-items:center;margin:3px 0}
`;

const html = TETE('rpb1 · Comparer, au moment choisi · r6a++') + `<style>${css}</style>
</head>
<body>
${sprite()}
<main class="${PX}-ecran" data-variante="rpb1">
  <header class="${PX}-tete">
    <button class="${PX}-x" type="button" aria-label="Fermer">${'<svg width="14" height="14" aria-hidden="true"><use href="#i-x-14"/></svg>'}</button>
    <h1 class="${PX}-titre">Cascade, Idaho 7 ou Galaxy pour ma stout ?</h1>
    <button class="${PX}-aide" type="button" aria-label="Légende" id="${PX}-aide" data-role="legende-bouton" aria-expanded="false"><svg width="14" height="14" aria-hidden="true"><use href="#i-aide-14"/></svg></button>
  </header>
  <div class="${PX}-ctx" data-role="contexte"><b>16D</b><b>4 g/L</b><b>US-05</b><div class="${PX}-seg" role="group" aria-label="Échelle" data-booster="lentille"><button type="button" aria-pressed="true" data-lent="style" data-e="style">Au style</button><button type="button" aria-pressed="false" data-lent="absolu" data-e="absolu">Absolu</button></div></div>
  <section class="${PX}-haut">
    <div class="${PX}-rad" id="${PX}-rad"></div>
    <div class="${PX}-lent">

      <span class="${PX}-simu">~ simulé</span>
    </div>
  </section>
  <section class="${PX}-frise" data-greffe="frise-y1b etapes" aria-label="Comparer à quel moment">
    <div class="${PX}-fr-lig" id="${PX}-menes"></div>
    <div class="${PX}-rail" id="${PX}-rail" role="radiogroup" aria-label="Moment comparé" data-booster="moment"></div>
    <div class="${PX}-fr-zone"><span></span><span>ébullition</span><span></span><span>dry hop 3 j</span></div>
  </section>
  <section class="${PX}-tab" id="${PX}-tab" data-libre="houblon" aria-label="Trois colonnes côte à côte"></section>
  <div class="${PX}-pied">
    <button class="${PX}-btn" type="button" id="${PX}-vvb">Vraies valeurs <svg width="12" height="12" aria-hidden="true"><use href="#i-chevb-12"/></svg></button>
    <button class="${PX}-btn plein" type="button" id="${PX}-placer">Placer Idaho 7 ›</button>
  </div>
  <section class="${PX}-vv" id="${PX}-vv" data-acquis="vraies-valeurs chimie"></section>
  <aside class="${PX}-leg" id="${PX}-leg" data-role="legende" role="dialog" aria-label="Légende">
    <p><span class="${PX}-trait"></span> ta stout aujourd'hui</p>
    <p><span class="${PX}-pt"></span> ton Nugget, au même moment, même dose</p>
    <p><i style="width:18px;height:8px;background:#c2410c;display:inline-block"></i> au-dessus de ta 16D</p>
    <p><span class="${PX}-bar ${PX}-inc" style="width:18px"></span> inconnu, pas zéro</p>
    <p>● au-dessus d'un moment : qui mène le floral, sans sortir de ta 16D</p>
    <p>◇ mot de ses fiches hors des 12 familles</p>
  </aside>
</main>
<script>
(function () {
var PX = ${JSON.stringify(PX)};
var D = ${JSON.stringify(D)};
var RANGEES = ${JSON.stringify(RANGEES)}, INCONNUES = ${JSON.stringify(INCONNUES)};
${LIB}
var etat = { m: 'apres', absolu: false, sel: null, manuel: false };
var $ = function (id) { return document.getElementById(PX + '-' + id); };
// ★ d'un moment : le plus floral qui reste dans ta 16D (règle de r6a), sinon le plus floral.
function meneur(m) {
  var c = D.ordre.slice().sort(function (a, b) { return D.C[m][b].cel.floral.dc - D.C[m][a].cel.floral.dc; });
  var dans = c.filter(function (k) { return !D.C[m][k].sorties.length; });
  return dans[0] || c[0];
}
function frise() {
  var h = '<span class="' + PX + '-fr-et">' + pic('floral', 13) + '</span>', r = '<span class="' + PX + '-fr-et"></span>';
  D.MOMENTS.forEach(function (m, i) {
    if (i === 3) { h += '<span></span>'; r += '<span class="' + PX + '-sep" aria-hidden="true"></span>'; }
    var k = meneur(m.id), H = D.H[k];
    h += '<span class="' + PX + '-mene" title="' + H.nom + '"><i style="background:' + H.couleur + '"></i><span class="' + PX + '-mono">' + cran(D.C[m.id][k].cel.floral.dc) + '</span></span>';
    r += '<button type="button" role="radio" class="' + PX + '-arr" aria-pressed="' + (etat.m === m.id) + '" aria-checked="' + (etat.m === m.id) + '" data-m="' + m.id + '" aria-label="' + m.long + ', mène : ' + H.nom + '">' + m.nom + '</button>';
  });
  $('menes').innerHTML = h; $('rail').innerHTML = r;
}
function tab() {
  var m = etat.m, sel = etat.sel, h = '';
  h += '<div class="' + PX + '-gau"><span class="' + PX + '-l" style="font-weight:700;font-size:14px"><span class="' + PX + '-trait"></span>Ta stout</span>'
    + '<span class="' + PX + '-l">' + pic('resin', 14) + 'trop</span><span class="' + PX + '-l">' + pic('floral', 14) + 'plus</span>'
    + '<span class="' + PX + '-l" style="color:var(--gris);margin-top:8px"><span class="' + PX + '-pt"></span>Nugget</span></div>';
  D.ordre.forEach(function (k) {
    var H = D.H[k], C = D.C[m][k], sort = C.sorties;
    var fams = Object.keys(H.familles).map(function (f) { return pic(f, H.familles[f] === 'marqué' ? 15 : 12); }).join('');
    var a = H.alpha, al = a ? '<span data-role="alpha" data-source="lot">α <b class="' + PX + '-mono">' + fr(a.v, 1) + ' %</b></span>' + (a.hors ? ' ≠' : '') : 'α ?';
    var mot = H.mots[0], plus = H.mots.length - 1;
    var ibu = C.ibu == null ? '<span class="' + PX + '-mono">? IBU</span>' : '<span class="' + PX + '-mono">~' + C.ibu + ' IBU</span>';
    h += '<div class="' + PX + '-col" role="button" tabindex="0" style="--hc:' + H.couleur + '" aria-pressed="' + (sel === k) + '" data-h="' + k + '" data-houblon="' + k + '">'
      + '<div class="' + PX + '-nom"><u>' + H.nom + '</u>' + (H.stock ? '<svg width="12" height="12" aria-label="au stock" role="img" style="color:var(--gris2)"><use href="#i-stock-12"/></svg>' : '') + '</div>'
      + '<div class="' + PX + '-li">' + al + '</div><div class="' + PX + '-li">' + H.role + '</div>'
      + '<div class="' + PX + '-fams">' + fams + '</div>'
      + (sort.length ? '<div class="' + PX + '-vd hors">~' + '<svg width="12" height="12" aria-hidden="true"><use href="#i-risque-12"/></svg>hors ' + sort.map(function (f) { return pic(f, 12); }).join('') + '</div>'
        : '<div class="' + PX + '-vd dans">~<svg width="12" height="12" aria-hidden="true"><use href="#i-check-12"/></svg></div>')
      + (mot ? '<span class="' + PX + '-h16" data-role="hors-16d" data-greffe="hors-16d" data-houblon="' + k + '" title="' + H.mots.map(function (x) { return x.mot; }).join(', ') + '">' + (mot.hors ? '◇ ' : '') + mot.mot + (plus > 0 ? ' <small>+' + plus + '</small>' : '') + '</span>' : '')
      + '<div class="' + PX + '-mom">' + ibu + '</div>'
      + '</div>';
  });
  RANGEES.forEach(function (f) {
    var vise = f === 'floral' || f === 'resin';
    h += '<div class="' + PX + '-rl' + (vise ? ' vise' : '') + '" data-famille="' + f + '">' + pic(f, 14) + '<span>' + NOMS[f] + '</span>' + (f === 'floral' ? '<span aria-hidden="true">↑</span>' : f === 'resin' ? '<span aria-hidden="true">↓</span>' : '') + '</div>';
    D.ordre.forEach(function (k) {
      var c = D.C[m][k].cel[f], ref = D.C[m][D.ref].cel[f];
      var cr = vise && !c.inc ? '<span class="' + PX + '-cr ' + (f === 'resin' ? 'neg' : 'pos') + '">' + cran(c.dc) + '</span>' : '';
      h += '<div class="' + PX + '-rc' + (sel === k ? ' sel' : '') + '" style="--hc:' + D.H[k].couleur + '" data-famille="' + f + '">' + barre(c, ref, etat.absolu) + cr + '</div>';
    });
  });
  h += '<div class="' + PX + '-rl" style="color:var(--gris)">' + INCONNUES.map(function (f) { return pic(f, 13); }).join('') + '</div><div class="' + PX + '-inc-l"><span class="' + PX + '-bar ' + PX + '-inc" style="width:26px"></span>inconnus, pas zéro</div>';
  $('tab').innerHTML = h;
  var r = radar({ familles: ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'].slice(0), w: 236, h: 214, r: 82, pic: 16, style: D.style, absolu: etat.absolu,
    series: D.ordre.map(function (k) { return { cel: D.C[m][k].cel, couleur: D.H[k].couleur, sel: k === sel }; }) });
  $('rad').innerHTML = r;
  $('placer').textContent = 'Placer ' + D.H[sel].nom + ' ' + D.MOMENTS.filter(function (x) { return x.id === m; })[0].nom;
}
function vv() {
  var h = '<span></span>' + D.ordre.map(function (k) { return '<b style="color:' + D.H[k].couleur + '">' + D.H[k].nom + '</b>'; }).join('');
  h += '<span>α fiches</span>' + D.ordre.map(function (k) { var p = D.H[k].alpha.plage; return '<span class="' + PX + '-mono">' + fr(p[0], 1) + '–' + fr(p[1], 1) + ' %</span>'; }).join('');
  h += '<span>huile mL/100 g</span>' + D.ordre.map(function (k) { var p = D.H[k].huile; return '<span class="' + PX + '-mono">' + (p ? fr(p[0], 1) + '–' + fr(p[1], 1) : '?') + '</span>'; }).join('');
  h += '<span>IBU 60′ · 10′</span>' + D.ordre.map(function (k) { return '<span class="' + PX + '-mono">' + D.C.b60[k].ibu + ' · ' + D.C.b10[k].ibu + '</span>'; }).join('');
  $('vv').innerHTML = h;
}
function rendre() { if (!etat.manuel) etat.sel = meneur(etat.m); frise(); tab(); }
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-m]'); if (b) { etat.m = b.dataset.m; etat.manuel = false; rendre(); return; }
  var l = e.target.closest('[data-lent]'); if (l) { etat.absolu = l.dataset.lent === 'absolu'; document.querySelectorAll('[data-lent]').forEach(function (x) { x.setAttribute('aria-pressed', x === l); }); tab(); return; }
  var c = e.target.closest('[data-h]'); if (c) { etat.sel = c.dataset.h; etat.manuel = true; tab(); return; }
  if (e.target.closest('#' + PX + '-aide')) { legende(!$('leg').classList.contains('ouvert')); return; }
  if (e.target.closest('#' + PX + '-vvb')) { $('vv').classList.toggle('ouvert'); return; }
  if (!e.target.closest('#' + PX + '-leg') && $('leg').classList.contains('ouvert')) legende(false);
});
function legende(o) { $('leg').classList.toggle('ouvert', o); $('aide').setAttribute('aria-expanded', String(o)); }
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') legende(false); });
vv(); fiche(D); rendre();
window[PX] = { etat: etat, rendre: rendre };
})();
</script>
</body>
</html>
`;
ecrire('rpb1', html);
