// rpb3 (tiède, forme « frise » de y1b, retravaillée à la manière de p4b2f) : en tête, la frise du temps — une courbe
// par houblon, du 60′ au dry hop après 3 j, ton Nugget en pointillé ; on glisse le curseur comme sur le rail de y1b,
// et les colonnes de r6a, dessous, passent à ce moment. Le radar est à un toucher (bascule barres / radar, D7).
import { TETE, sprite, cssBase, LIB, donnees, RANGEES, INCONNUES, ecrire } from './commun.mjs';
const PX = 'rpb3';
const D = donnees();

const css = cssBase(PX) + `
.${PX}-ecran{max-width:430px;margin:0 auto;padding:6px 12px 24px}
.${PX}-tete{display:flex;align-items:center;gap:8px;height:36px}
.${PX}-x{width:32px;height:32px;border-radius:16px;display:grid;place-items:center;background:var(--fond);flex:none}
.${PX}-titre{font-size:18px;font-weight:700;flex:1;white-space:nowrap}
.${PX}-aide{width:28px;height:28px;border-radius:14px;display:grid;place-items:center;border:1px solid var(--trait);color:var(--gris)}
.${PX}-ctx{font-size:12px;color:var(--gris);display:flex;gap:6px;align-items:center;margin-bottom:4px}
.${PX}-ctx .${PX}-mono{color:var(--encre)}
.${PX}-frise{position:relative;background:#fafafb;border:1px solid var(--trait);border-radius:8px;padding:6px 8px 4px;touch-action:none;user-select:none;-webkit-user-select:none}
.${PX}-fr-h{display:flex;align-items:center;gap:6px;margin-bottom:2px}
.${PX}-crit{display:flex;background:#fff;border:1px solid var(--trait);border-radius:14px;padding:2px}
.${PX}-crit button{font-size:12px;padding:3px 9px;border-radius:12px;display:flex;align-items:center;gap:3px;color:var(--gris);white-space:nowrap}
.${PX}-crit button[aria-pressed="true"]{background:var(--encre);color:#fff;font-weight:600}
.${PX}-simu{font-size:12px;border:1.5px solid var(--encre);border-radius:12px;padding:1px 7px;font-weight:600;margin-left:auto;white-space:nowrap}
.${PX}-svg{display:block;width:100%;height:auto;overflow:visible}
.${PX}-stops{display:grid;grid-template-columns:repeat(5,1fr);margin-top:-2px;margin-right:calc(92 / 346 * 100%);margin-left:calc(26 / 346 * 100% - 6px)}
.${PX}-stops button{font-size:13px;font-weight:600;height:28px;border-radius:14px;margin:0 2px;padding:0;border:1.5px solid #cfcfd6;background:#fff}
.${PX}-stops button[aria-pressed="true"]{background:var(--encre);border-color:var(--encre);color:#fff}
.${PX}-zones{display:grid;grid-template-columns:3fr 2fr;font-size:12px;color:var(--gris);text-align:center;margin-top:2px;margin-right:calc(92 / 346 * 100%);margin-left:calc(26 / 346 * 100%)}
.${PX}-barre-o{display:flex;align-items:center;gap:6px;margin:8px 0 2px}
.${PX}-barre-o h2{font-size:14px;font-weight:700;display:flex;gap:4px;align-items:center}
.${PX}-seg{display:flex;background:var(--fond);border-radius:14px;padding:2px;margin-left:auto}
.${PX}-seg button{font-size:12px;padding:3px 8px;border-radius:12px;color:var(--gris);display:flex;align-items:center;gap:3px;white-space:nowrap}
.${PX}-seg button[aria-pressed="true"]{background:var(--encre);color:#fff;font-weight:600}
.${PX}-tab{display:grid;grid-template-columns:76px repeat(3,minmax(0,1fr));column-gap:6px}
.${PX}-th{padding:3px 4px 4px;border-bottom:3px solid var(--hc);cursor:pointer;min-width:0}
.${PX}-th[aria-pressed="true"]{background:#f4f4f7;border-radius:4px 4px 0 0}
.${PX}-th .n{font-size:14px;font-weight:700;display:flex;align-items:center;gap:4px;white-space:nowrap}
.${PX}-th .n i{width:9px;height:9px;border-radius:5px;background:var(--hc);display:block;flex:none}
.${PX}-th .l{font-size:12px;color:var(--gris);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.${PX}-th .l b{color:var(--encre);font-weight:600}
.${PX}-th .f{display:flex;gap:2px;flex-wrap:wrap;align-items:center;margin-top:1px}
.${PX}-vd{font-size:12px;font-weight:600;display:inline-flex;align-items:center;gap:1px}
.${PX}-vd.dans{color:var(--vert)} .${PX}-vd.hors{color:var(--acc)}
.${PX}-h16{display:block;margin-top:2px;font-size:12px;font-weight:600;color:var(--encre);background:#efeff3;border-radius:4px;padding:0 5px;line-height:1.3}
.${PX}-h16 small{font-size:12px;color:var(--gris);font-weight:400}
.${PX}-gl{font-size:12px;color:var(--gris);display:flex;flex-direction:column;justify-content:flex-end;gap:2px;padding-bottom:4px}
.${PX}-gl span{display:flex;align-items:center;gap:4px}
.${PX}-trait{width:12px;height:2px;background:var(--encre);display:inline-block}
.${PX}-pt{width:12px;height:0;border-top:2px dotted #6b6b75;display:inline-block}
.${PX}-rl{display:flex;align-items:center;gap:4px;font-size:13px;height:24px;color:var(--t);white-space:nowrap}
.${PX}-rl.vise{font-weight:700}
.${PX}-rc{display:flex;align-items:center;height:24px;padding:0 6px 0 2px}
.${PX}-rc.sel{background:#f4f4f7}
.${PX}-rc>.${PX}-bar:not(.${PX}-inc){flex:1}
.${PX}-inc-l{font-size:12px;color:var(--gris);display:flex;align-items:center;gap:4px;grid-column:2/5}
.${PX}-radv{grid-column:1/5;display:flex;justify-content:center}
.${PX}-pied{display:flex;gap:8px;margin-top:10px}
.${PX}-btn{font-size:13px;font-weight:600;border:1.5px solid var(--encre);border-radius:16px;padding:5px 12px}
.${PX}-btn.plein{background:var(--encre);color:#fff;margin-left:auto}.${PX}-btn.plein::after{content:'›';display:inline-block;margin-left:4px}
.${PX}-leg{display:none;position:fixed;inset:auto 8px 8px 8px;background:#fff;border:1px solid var(--trait);border-radius:12px;padding:10px 12px;box-shadow:0 8px 30px rgba(0,0,0,.18);font-size:13px;z-index:5}
.${PX}-leg.ouvert{display:block}
.${PX}-leg p{display:flex;gap:8px;align-items:center;margin:3px 0}
`;

const html = TETE('rpb3 · La frise du floral, sur les colonnes de r6a · r6a++') + `<style>${css}</style>
</head>
<body>
${sprite()}
<main class="${PX}-ecran" data-variante="rpb3">
  <header class="${PX}-tete">
    <button class="${PX}-x" type="button" aria-label="Fermer"><svg width="14" height="14" aria-hidden="true"><use href="#i-x-14"/></svg></button>
    <h1 class="${PX}-titre">Lequel, et quand ?</h1>
    <button class="${PX}-aide" type="button" id="${PX}-aide" data-role="legende-bouton" aria-expanded="false" aria-label="Légende"><svg width="14" height="14" aria-hidden="true"><use href="#i-aide-14"/></svg></button>
  </header>
  <p class="${PX}-ctx" data-role="contexte">Ta stout 16D · 4 g/L chacun · US-05</p>
  <section class="${PX}-frise" id="${PX}-frise" data-greffe="frise-y1b etapes" aria-label="Frise : crans gagnés sur ta stout, du 60′ au dry hop">
    <div class="${PX}-fr-h">
      <div class="${PX}-crit" role="group" aria-label="Famille suivie" data-booster="critere" id="${PX}-crit"></div>
      <span class="${PX}-simu">~ simulé</span>
    </div>
    <div id="${PX}-graphe"></div>
    <div class="${PX}-stops" id="${PX}-stops" role="radiogroup" aria-label="Moment comparé" data-booster="moment"></div>
    <div class="${PX}-zones"><span>ébullition</span><span>dry hop, 3 j</span></div>
  </section>
  <div class="${PX}-barre-o">
    <h2 id="${PX}-moment"></h2>
    <div class="${PX}-seg" role="group" aria-label="Vue" data-booster="radar"><button type="button" aria-pressed="true" data-vue="barres"><svg width="14" height="14" aria-hidden="true"><use href="#i-barres-14"/></svg>barres</button><button type="button" aria-pressed="false" data-vue="radar"><svg width="14" height="14" aria-hidden="true"><use href="#i-radar-14"/></svg>radar</button></div>
    <div class="${PX}-seg" role="group" aria-label="Échelle" data-booster="lentille"><button type="button" aria-pressed="true" data-lent="style" data-e="style">style</button><button type="button" aria-pressed="false" data-lent="absolu" data-e="absolu">absolu</button></div>
  </div>
  <section class="${PX}-tab" id="${PX}-tab" data-libre="houblon" aria-label="Trois colonnes côte à côte"></section>
  <div class="${PX}-pied"><button class="${PX}-btn" type="button">Vraies valeurs</button><button class="${PX}-btn plein" type="button" id="${PX}-placer"></button></div>
  <aside class="${PX}-leg" id="${PX}-leg" data-role="legende" role="dialog" aria-label="Légende">
    <p>Frise : crans de ta 16D gagnés sur ta stout, houblon posé à ce moment, 4 g/L.</p>
    <p><span class="${PX}-pt"></span> ton Nugget, mêmes moments, même dose</p>
    <p><span class="${PX}-trait"></span> ta stout aujourd'hui · <span class="${PX}-bar ${PX}-inc" style="width:16px"></span> inconnu, pas zéro</p>
    <p><i style="width:16px;height:8px;background:#c2410c;display:inline-block"></i> au-dessus de ta 16D · ◇ mot hors des 12 familles</p>
  </aside>
</main>
<script>
(function () {
var PX = ${JSON.stringify(PX)};
var D = ${JSON.stringify(D)};
var RANGEES = ${JSON.stringify(RANGEES)}, INCONNUES = ${JSON.stringify(INCONNUES)};
${LIB}
var $ = function (id) { return document.getElementById(PX + '-' + id); };
var etat = { m: 'apres', f: 'floral', absolu: false, vue: 'barres', sel: null, manuel: false };
var MS = D.MOMENTS.map(function (m) { return m.id; });
function meneur(m) {
  var c = D.ordre.slice().sort(function (a, b) { return D.C[m][b].cel.floral.dc - D.C[m][a].cel.floral.dc; });
  return c.filter(function (k) { return !D.C[m][k].sorties.length; })[0] || c[0];
}
var W = 346, Hh = 168, L = 26, R = 92, T = 12, B = 12;
function X(i) { return L + (W - L - R) * (i + 0.5) / 5; }
function graphe() {
  var f = etat.f, tous = D.ordre.concat([D.ref]);
  var max = Math.max.apply(null, tous.map(function (k) { return Math.max.apply(null, MS.map(function (m) { return D.C[m][k].cel[f].dc || 0; })); }));
  max = Math.ceil(max * 2) / 2;
  var Y = function (v) { return T + (Hh - T - B) * (1 - v / max); };
  var s = '';
  // Bande dry hop (le froid) en fond, comme p4b2f.
  s += '<rect x="' + ((X(2) + X(3)) / 2) + '" y="' + T + '" width="' + (W - R - (X(2) + X(3)) / 2) + '" height="' + (Hh - T - B) + '" fill="#eef0f6"/>';
  for (var g = 0; g <= max + 1e-9; g += 0.5) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(g) + '" y2="' + Y(g) + '" stroke="#e2e2e8"/>' + (g % 1 === 0 ? '<text x="' + (L - 4) + '" y="' + (Y(g) + 4) + '" text-anchor="end" font-size="12" fill="#5b5b66" font-family="IBM Plex Mono">+' + g + '</text>' : '');
  var ci = MS.indexOf(etat.m);
  s += '<line x1="' + X(ci) + '" x2="' + X(ci) + '" y1="' + (T - 4) + '" y2="' + (Hh - B + 4) + '" stroke="#16161a" stroke-width="2"/>';
  tous.forEach(function (k) {
    var ref = k === D.ref, col = D.H[k].couleur, pts = MS.map(function (m, i) { return [X(i), Y(D.C[m][k].cel[f].dc || 0)]; });
    s += '<polyline points="' + pts.map(function (p) { return p.join(','); }).join(' ') + '" fill="none" stroke="' + col + '" stroke-width="' + (ref ? 1.6 : (k === etat.sel ? 3.2 : 2.2)) + '" stroke-dasharray="' + (ref ? '2 3' : '') + '" stroke-linejoin="round"/>';
    pts.forEach(function (p, i) {
      var hors = D.C[MS[i]][k].sorties.length && !ref;
      s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i === ci ? 4.5 : 2.6) + '" fill="' + (hors ? '#fff' : col) + '" stroke="' + (hors ? '#c2410c' : col) + '" stroke-width="' + (hors ? 2 : 1) + '"/>';
    });
  });
  // Étiquettes au curseur, triées pour ne pas se chevaucher.
  var lab = tous.map(function (k) { return { k: k, y: Y(D.C[etat.m][k].cel[f].dc || 0), v: D.C[etat.m][k].cel[f].dc }; }).sort(function (a, b) { return a.y - b.y; });
  for (var i = 1; i < lab.length; i++) if (lab[i].y - lab[i - 1].y < 13) lab[i].y = lab[i - 1].y + 13;
  // Les valeurs au curseur, dans la marge de droite, reliées à leur point.
  var x0 = W - R + 8;
  lab.forEach(function (q) {
    var col = q.k === D.ref ? '#5b5b66' : D.H[q.k].couleur, y0 = Y(D.C[etat.m][q.k].cel[f].dc || 0);
    s += '<path d="M' + (X(ci) + 5) + ',' + y0 + 'L' + (x0 - 3) + ',' + q.y + '" stroke="' + col + '" stroke-width="1" stroke-dasharray="1 2" fill="none"/>';
    s += '<text x="' + x0 + '" y="' + (q.y + 4) + '" font-size="12" font-weight="700" fill="' + col + '"><tspan font-family="IBM Plex Mono">' + cran(q.v) + '</tspan> ' + (q.k === D.ref ? 'Nugget' : D.H[q.k].nom) + '</text>';
  });
  $('graphe').innerHTML = '<svg class="' + PX + '-svg" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="Crans de ' + NOMS[f] + ' gagnés à chaque moment">' + s + '</svg>';
  var st = '';
  D.MOMENTS.forEach(function (m) { st += '<button type="button" role="radio" aria-pressed="' + (m.id === etat.m) + '" aria-checked="' + (m.id === etat.m) + '" data-m="' + m.id + '" aria-label="' + m.long + '">' + m.nom + '</button>'; });
  $('stops').innerHTML = st;
  $('crit').innerHTML = [['floral', 'plus'], ['resin', 'moins']].map(function (x) { return '<button type="button" data-f="' + x[0] + '" aria-pressed="' + (etat.f === x[0]) + '">' + pic(x[0], 13) + NOMS[x[0]].toLowerCase() + '</button>'; }).join('');
}
function tab() {
  var m = etat.m, sel = etat.sel, h = '';
  var mm = D.MOMENTS.filter(function (x) { return x.id === m; })[0];
  $('moment').innerHTML = 'Au ' + (m === 'b60' || m === 'b10' ? '' : '') + mm.long.replace('à ', '').replace('au ', '');
  if (etat.vue === 'radar') {
    h = '<div class="' + PX + '-radv">' + radar({ familles: ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'], w: 300, h: 290, r: 112, pic: 18, style: D.style, absolu: etat.absolu,
      series: D.ordre.map(function (k) { return { cel: D.C[m][k].cel, couleur: D.H[k].couleur, sel: k === sel }; }).concat([{ cel: D.C[m][D.ref].cel, couleur: '#6b6b75', ref: true }]) }) + '</div>';
    $('tab').innerHTML = h; return;
  }
  h += '<div class="' + PX + '-gl"><span><span class="' + PX + '-trait"></span>ta stout</span><span><span class="' + PX + '-pt"></span>Nugget</span></div>';
  D.ordre.forEach(function (k) {
    var H = D.H[k], C = D.C[m][k], a = H.alpha, mot = H.mots[0], plus = H.mots.length - 1;
    h += '<div class="' + PX + '-th" role="button" tabindex="0" data-houblon="' + k + '" data-h="' + k + '" style="--hc:' + H.couleur + '" aria-pressed="' + (sel === k) + '">'
      + '<div class="n"><i></i><u style="text-decoration:underline dotted #9a9aa4;text-underline-offset:3px">' + H.nom + '</u></div>'
      + '<div class="l"><span data-role="alpha" data-source="lot">α <b class="' + PX + '-mono">' + fr(a.v, 1) + '</b> %</span>' + (a.hors ? '≠' : '') + ' ' + H.role + '</div>'
      + '<div class="f">' + Object.keys(H.familles).slice(0, 5).map(function (f) { return pic(f, H.familles[f] === 'marqué' ? 14 : 12); }).join('')
      + (C.sorties.length ? '<span class="' + PX + '-vd hors">~<svg width="12" height="12" aria-hidden="true"><use href="#i-risque-12"/></svg></span>' : '<span class="' + PX + '-vd dans">~<svg width="12" height="12" aria-hidden="true"><use href="#i-check-12"/></svg></span>') + '</div>'
      + (mot ? '<span class="' + PX + '-h16" data-role="hors-16d" data-greffe="hors-16d" data-houblon="' + k + '" title="' + H.mots.map(function (x) { return x.mot; }).join(', ') + '">' + (mot.hors ? '◇ ' : '') + mot.mot + (plus > 0 ? ' <small>+' + plus + '</small>' : '') + '</span>' : '')
      + '</div>';
  });
  RANGEES.forEach(function (f) {
    var vise = f === 'floral' || f === 'resin';
    h += '<div class="' + PX + '-rl' + (vise ? ' vise' : '') + '" data-famille="' + f + '">' + pic(f, 14) + '<span>' + NOMS[f] + '</span></div>';
    D.ordre.forEach(function (k) { h += '<div class="' + PX + '-rc' + (sel === k ? ' sel' : '') + '" data-famille="' + f + '">' + barre(D.C[m][k].cel[f], D.C[m][D.ref].cel[f], etat.absolu) + '</div>'; });
  });
  h += '<div class="' + PX + '-rl" style="color:var(--gris)">' + INCONNUES.map(function (f) { return pic(f, 13); }).join('') + '</div><div class="' + PX + '-inc-l"><span class="' + PX + '-bar ' + PX + '-inc" style="width:24px"></span>inconnus, pas zéro</div>';
  $('tab').innerHTML = h;
}
function rendre() {
  if (!etat.manuel) etat.sel = meneur(etat.m);
  graphe(); tab();
  $('placer').textContent = 'Placer ' + D.H[etat.sel].nom + ' ' + D.MOMENTS.filter(function (x) { return x.id === etat.m; })[0].nom;
}
// Le geste de y1b : glisser le doigt sur la frise, le curseur saute d'un moment à l'autre.
var tire = false;
function auDoigt(e) { var r = $('graphe').getBoundingClientRect(); var x = (e.clientX - r.left) / r.width * W; var best = 0, d = 1e9; MS.forEach(function (m, i) { var q = Math.abs(X(i) - x); if (q < d) { d = q; best = i; } }); if (MS[best] !== etat.m) { etat.m = MS[best]; etat.manuel = false; rendre(); } }
$('graphe').addEventListener('pointerdown', function (e) { tire = true; auDoigt(e); });
window.addEventListener('pointermove', function (e) { if (tire) auDoigt(e); });
window.addEventListener('pointerup', function () { tire = false; });
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-m]'); if (b) { etat.m = b.dataset.m; etat.manuel = false; rendre(); return; }
  var c = e.target.closest('[data-f]'); if (c) { etat.f = c.dataset.f; graphe(); return; }
  var v = e.target.closest('[data-vue]'); if (v) { etat.vue = v.dataset.vue; document.querySelectorAll('[data-vue]').forEach(function (x) { x.setAttribute('aria-pressed', x === v); }); tab(); return; }
  var l = e.target.closest('[data-lent]'); if (l) { etat.absolu = l.dataset.lent === 'absolu'; document.querySelectorAll('[data-lent]').forEach(function (x) { x.setAttribute('aria-pressed', x === l); }); tab(); return; }
  var t = e.target.closest('[data-h]'); if (t) { etat.sel = t.dataset.h; etat.manuel = true; rendre(); return; }
  if (e.target.closest('#' + PX + '-aide')) { legende(!$('leg').classList.contains('ouvert')); return; }
  if (!e.target.closest('#' + PX + '-leg') && $('leg').classList.contains('ouvert')) legende(false);
});
function legende(o) { $('leg').classList.toggle('ouvert', o); $('aide').setAttribute('aria-expanded', String(o)); }
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') legende(false); });
fiche(D); rendre();
window[PX] = { etat: etat, rendre: rendre };
})();
</script>
</body>
</html>
`;
ecrire('rpb3', html);
