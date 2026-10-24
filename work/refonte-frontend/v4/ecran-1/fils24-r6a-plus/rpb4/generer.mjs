// rpb4 (chaude, forme libre) : « Tes deux vœux ». Ta demande (« trop résineuse, je la veux plus florale ») devient le
// plan de l'écran : floral gagné en travers, résineux gagné en hauteur. Chaque houblon y trace son chemin, du 60′ au dry
// hop après 3 j ; chaque point est un plan (un houblon, un moment). Toucher un point pose ce moment sur les colonnes de
// r6a, dessous. Le coin de ton vœu (plus floral, peu de résineux) est marqué ; ton Nugget en pointillé.
import { TETE, sprite, cssBase, LIB, donnees, RANGEES, INCONNUES, ecrire } from './commun.mjs';
const PX = 'rpb4';
const D = donnees();

const css = cssBase(PX) + `
.${PX}-ecran{max-width:430px;margin:0 auto;padding:6px 12px 24px}
.${PX}-tete{display:flex;align-items:center;gap:8px;height:34px}
.${PX}-x{width:32px;height:32px;border-radius:16px;display:grid;place-items:center;background:var(--fond);flex:none}
.${PX}-titre{font-size:18px;font-weight:700;flex:1;display:flex;align-items:center;gap:4px;white-space:nowrap}
.${PX}-titre .p{color:#9840bc} .${PX}-titre .r{color:var(--acc)}
.${PX}-aide{width:28px;height:28px;border-radius:14px;display:grid;place-items:center;border:1px solid var(--trait);color:var(--gris)}
.${PX}-ctx{font-size:12px;color:var(--gris);margin:0 0 2px 40px}
.${PX}-plan{position:relative;touch-action:manipulation}
.${PX}-plan svg.${PX}-sc{display:block;width:100%;height:auto;overflow:visible}
.${PX}-pt{cursor:pointer}
.${PX}-inset{position:absolute;left:40px;top:0;background:#fff;border-radius:50%}
.${PX}-simu{position:absolute;right:0;top:0;font-size:12px;border:1.5px solid var(--encre);border-radius:12px;padding:1px 7px;font-weight:600;background:#fff}
.${PX}-rep{display:flex;align-items:center;gap:6px;margin:2px 0 4px;font-size:14px}
.${PX}-rep b{font-weight:700}
.${PX}-rep .${PX}-mono{font-weight:600}
.${PX}-seg{display:flex;background:var(--fond);border-radius:14px;padding:2px;margin-left:auto}
.${PX}-seg button{font-size:12px;padding:3px 8px;border-radius:12px;color:var(--gris);white-space:nowrap}
.${PX}-seg button[aria-pressed="true"]{background:var(--encre);color:#fff;font-weight:600}
.${PX}-tab{display:grid;grid-template-columns:76px repeat(3,minmax(0,1fr));column-gap:6px}
.${PX}-th{padding:3px 4px;border-radius:8px;cursor:pointer;min-width:0;background:color-mix(in srgb,var(--hc) 9%,#fff)}
.${PX}-th[aria-pressed="true"]{outline:2px solid var(--hc);outline-offset:-2px}
.${PX}-th .n{font-size:14px;font-weight:700;color:var(--hc);white-space:nowrap;display:flex;align-items:baseline;gap:4px}
.${PX}-th .n small{font-size:12px;font-weight:400;color:var(--gris)}
.${PX}-th .m{font-size:12px;color:var(--encre);font-weight:600;line-height:1.25}
.${PX}-h16{display:block;font-size:12px;color:var(--encre);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.${PX}-h16 small{color:var(--gris);font-size:12px}
.${PX}-gl{font-size:12px;color:var(--gris);display:flex;flex-direction:column;justify-content:center;gap:2px}
.${PX}-gl span{display:flex;align-items:center;gap:4px}
.${PX}-trait{width:12px;height:2px;background:var(--encre);display:inline-block}
.${PX}-ptl{width:12px;height:0;border-top:2px dotted #6b6b75;display:inline-block}
.${PX}-rl{display:flex;align-items:center;gap:4px;font-size:13px;height:23px;color:var(--t);white-space:nowrap}
.${PX}-rl.vise{font-weight:700}
.${PX}-rc{display:flex;align-items:center;height:23px;padding:0 6px 0 2px}
.${PX}-rc>.${PX}-bar:not(.${PX}-inc){flex:1}
.${PX}-inc-l{font-size:12px;color:var(--gris);display:flex;align-items:center;gap:4px;grid-column:2/5}
.${PX}-pied{display:flex;gap:8px;margin-top:10px}
.${PX}-btn{font-size:13px;font-weight:600;border:1.5px solid var(--encre);border-radius:16px;padding:5px 12px}
.${PX}-btn.plein{background:var(--encre);color:#fff;margin-left:auto}.${PX}-btn.plein::after{content:'›';display:inline-block;margin-left:4px}
.${PX}-leg{display:none;position:fixed;inset:auto 8px 8px 8px;background:#fff;border:1px solid var(--trait);border-radius:12px;padding:10px 12px;box-shadow:0 8px 30px rgba(0,0,0,.18);font-size:13px;z-index:5}
.${PX}-leg.ouvert{display:block}
.${PX}-leg p{display:flex;gap:8px;align-items:center;margin:3px 0}
`;

const html = TETE('rpb4 · Tes deux vœux, sur les colonnes de r6a · r6a++') + `<style>${css}</style>
</head>
<body>
${sprite()}
<main class="${PX}-ecran" data-variante="rpb4">
  <header class="${PX}-tete">
    <button class="${PX}-x" type="button" aria-label="Fermer"><svg width="14" height="14" aria-hidden="true"><use href="#i-x-14"/></svg></button>
    <h1 class="${PX}-titre"><span class="p">plus</span><span id="${PX}-tp"></span><span style="font-weight:400;color:var(--gris)">,</span><span class="r">moins</span><span id="${PX}-tr"></span></h1>
    <button class="${PX}-aide" type="button" id="${PX}-aide" data-role="legende-bouton" aria-expanded="false" aria-label="Légende"><svg width="14" height="14" aria-hidden="true"><use href="#i-aide-14"/></svg></button>
  </header>
  <p class="${PX}-ctx" data-role="contexte"><b style="color:#781838">● Cascade</b> <b style="color:#e80030">● Idaho 7</b> <b style="color:#681878">● Galaxy</b> · 16D · 4 g/L · US-05</p>
  <section class="${PX}-plan" id="${PX}-plan" data-greffe="trois-plans-w2 etapes deux-voeux" aria-label="Chaque plan (houblon, moment) face à tes deux vœux"></section>
  <div class="${PX}-rep" id="${PX}-rep"></div>
  <section class="${PX}-tab" id="${PX}-tab" data-libre="houblon" aria-label="Trois colonnes côte à côte"></section>
  <div class="${PX}-pied"><button class="${PX}-btn" type="button">Vraies valeurs</button><button class="${PX}-btn plein" type="button" id="${PX}-placer"></button></div>
  <aside class="${PX}-leg" id="${PX}-leg" data-role="legende" role="dialog" aria-label="Légende">
    <p>Chaque point : un houblon posé à un moment (60′, 10′, WP, dry hop actif, après 3 j), 4 g/L. En travers : floral gagné ; en hauteur : résineux gagné, en crans de ta 16D.</p>
    <p>○ orangé : un arôme sort de ta 16D · <span class="${PX}-ptl"></span> ton Nugget</p>
    <p><span class="${PX}-trait"></span> ta stout · <span class="${PX}-bar ${PX}-inc" style="width:16px"></span> inconnu, pas zéro · ◇ hors des 12 familles</p>
  </aside>
</main>
<script>
(function () {
var PX = ${JSON.stringify(PX)};
var D = ${JSON.stringify(D)};
var RANGEES = ${JSON.stringify(RANGEES)}, INCONNUES = ${JSON.stringify(INCONNUES)};
${LIB}
var $ = function (id) { return document.getElementById(PX + '-' + id); };
var MS = D.MOMENTS.map(function (m) { return m.id; });
var etat = { m: 'apres', sel: 'idaho7', absolu: false };
function nomM(m) { return D.MOMENTS.filter(function (x) { return x.id === m; })[0].nom; }
var W = 366, H = 268, L = 30, R = 8, T = 8, B = 30, FX = 1.4, RY = 2.4;
function X(v) { return L + (W - L - R) * Math.max(0, v) / FX; }
function Y(v) { return T + (H - T - B) * (1 - Math.max(0, v) / RY); }
function plan() {
  var s = '';
  // Le coin du vœu : plus floral, peu de résineux.
  s += '<rect x="' + X(0.9) + '" y="' + Y(0.8) + '" width="' + (X(FX) - X(0.9)) + '" height="' + (Y(0) - Y(0.8)) + '" fill="#eef7f1" stroke="#2f6b4f" stroke-dasharray="3 3" rx="6"/>';
  s += '<text x="' + (X(FX) - 6) + '" y="' + (Y(0) - 8) + '" text-anchor="end" font-size="12" fill="#2f6b4f" font-weight="700">ton vœu</text>';
  for (var g = 0; g <= RY; g += 1) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(g) + '" y2="' + Y(g) + '" stroke="#ececf1"/><text x="' + (L - 4) + '" y="' + (Y(g) + 4) + '" text-anchor="end" font-size="12" fill="#5b5b66" font-family="IBM Plex Mono">+' + g + '</text>';
  for (var gx = 0.5; gx <= FX; gx += 0.5) s += '<line x1="' + X(gx) + '" x2="' + X(gx) + '" y1="' + T + '" y2="' + Y(0) + '" stroke="#ececf1"/><text x="' + X(gx) + '" y="' + (Y(0) + 14) + '" text-anchor="middle" font-size="12" fill="#5b5b66" font-family="IBM Plex Mono">+' + fr(gx, 1) + '</text>';
  s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(0) + '" y2="' + Y(0) + '" stroke="#9a9aa4"/><line x1="' + L + '" x2="' + L + '" y1="' + T + '" y2="' + Y(0) + '" stroke="#9a9aa4"/>';
  // Axes nommés par leur picto et une flèche.
  s += '<svg x="' + (W - R - 76) + '" y="' + (H - 15) + '" width="14" height="14" data-famille="floral" class="' + PX + '-pic" role="img" aria-label="Floral"><use href="#p-floral"/></svg><text x="' + (W - R - 58) + '" y="' + (H - 4) + '" font-size="12" fill="#9840bc" font-weight="700">floral →</text>';
  s += '<svg x="0" y="' + (T - 2) + '" width="14" height="14" data-famille="resin" class="' + PX + '-pic" role="img" aria-label="Résineux"><use href="#p-resin"/></svg><text x="2" y="' + (T + 24) + '" font-size="12" fill="#c2410c" font-weight="700">↑</text>';
  var tous = [D.ref].concat(D.ordre);
  tous.forEach(function (k) {
    var ref = k === D.ref, col = D.H[k].couleur, sel = k === etat.sel;
    var pts = MS.map(function (m) { var c = D.C[m][k].cel; return [X(c.floral.dc), Y(c.resin.dc)]; });
    s += '<polyline points="' + pts.map(function (p) { return p.join(','); }).join(' ') + '" fill="none" stroke="' + col + '" stroke-width="' + (ref ? 1.4 : sel ? 3 : 1.8) + '" stroke-dasharray="' + (ref ? '2 3' : '') + '" stroke-linejoin="round" opacity="' + (ref || sel ? 1 : 0.85) + '"/>';
    // Les points qui sortent de ta 16D d'abord, en anneau plus large : un point « dans » posé au même endroit reste visible.
    var ordre = [0, 1, 2, 3, 4].sort(function (a, b) { return (D.C[MS[b]][k].sorties.length ? 1 : 0) - (D.C[MS[a]][k].sorties.length ? 1 : 0); });
    ordre.forEach(function (i) {
      var p = pts[i];
      var m = MS[i], hors = !ref && D.C[m][k].sorties.length, on = sel && m === etat.m, r = on ? (hors ? 9 : 7) : ref ? 2.5 : hors ? 10 : 5;
      s += '<g class="' + PX + '-pt" data-k="' + k + '" data-m="' + m + '" role="button" aria-label="' + D.H[k].nom + ' ' + D.MOMENTS[i].long + ', floral ' + cran(D.C[m][k].cel.floral.dc) + ', résineux ' + cran(D.C[m][k].cel.resin.dc) + '">'
        + '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="14" fill="transparent"/>'
        + '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + r + '" fill="' + (hors ? '#fff' : col) + '" stroke="' + (hors ? '#c2410c' : on ? '#16161a' : '#fff') + '" stroke-width="' + (hors ? 2.4 : on ? 2.4 : 1.2) + '"/></g>';
    });
    if (sel && !ref) {
      // Les moments du houblon retenu ; deux points confondus partagent une étiquette (« 10′ · WP »).
      var vus = [];
      pts.forEach(function (p, i) {
        var deja = vus.filter(function (v) { return Math.abs(v.x - p[0]) < 6 && Math.abs(v.y - p[1]) < 6; })[0];
        if (deja) { deja.t += ' · ' + D.MOMENTS[i].nom; return; }
        vus.push({ x: p[0], y: p[1], t: D.MOMENTS[i].nom, i: i });
      });
      vus.forEach(function (v) { s += '<text x="' + (v.x + (v.i === 0 ? 10 : -11)) + '" y="' + (v.y - 10) + '" text-anchor="' + (v.i === 0 ? 'start' : 'end') + '" font-size="12" font-weight="700" fill="' + col + '" paint-order="stroke" stroke="#fff" stroke-width="3">' + v.t + '</text>'; });
    }
  });
  var inset = radar({ familles: ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'], w: 112, h: 112, r: 38, pic: 11, style: D.style, absolu: etat.absolu,
    series: D.ordre.map(function (k) { return { cel: D.C[etat.m][k].cel, couleur: D.H[k].couleur, sel: k === etat.sel }; }) });
  $('plan').innerHTML = '<svg class="' + PX + '-sc" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Floral gagné en travers, résineux gagné en hauteur">' + s + '</svg><div class="' + PX + '-inset" aria-label="Radar au moment choisi">' + inset + '</div><span class="' + PX + '-simu">~ simulé</span>';
}
function rep() {
  var k = etat.sel, c = D.C[etat.m][k];
  $('rep').innerHTML = '<span style="width:10px;height:10px;border-radius:5px;background:' + D.H[k].couleur + ';display:inline-block"></span><b>' + D.H[k].nom + ' ' + nomM(etat.m) + '</b>'
    + '<span data-famille="floral" style="color:#9840bc">' + pic('floral', 14) + '<span class="' + PX + '-mono">' + cran(c.cel.floral.dc) + '</span></span>'
    + '<span data-famille="resin" style="color:#c2410c">' + pic('resin', 14) + '<span class="' + PX + '-mono">' + cran(c.cel.resin.dc) + '</span></span>'
    + '<span class="' + PX + '-mono" style="color:var(--gris);font-size:12px">' + (c.ibu == null ? '? IBU' : '~' + c.ibu + ' IBU') + '</span>'
    + '<div class="' + PX + '-seg" role="group" aria-label="Échelle" data-booster="lentille"><button type="button" aria-pressed="' + !etat.absolu + '" data-lent="style" data-e="style">style</button><button type="button" aria-pressed="' + etat.absolu + '" data-lent="absolu" data-e="absolu">absolu</button></div>';
}
function tab() {
  var m = etat.m, h = '<div class="' + PX + '-gl"><span><span class="' + PX + '-trait"></span>ta stout</span><span><span class="' + PX + '-ptl"></span>Nugget</span></div>';
  D.ordre.forEach(function (k) {
    var H = D.H[k], C = D.C[m][k], mot = H.mots[0], plus = H.mots.length - 1;
    h += '<div class="' + PX + '-th" role="button" tabindex="0" data-houblon="' + k + '" data-h="' + k + '" style="--hc:' + H.couleur + '" aria-pressed="' + (k === etat.sel) + '">'
      + '<div class="n"><u style="text-decoration:underline dotted #9a9aa4;text-underline-offset:3px">' + H.nom + '</u></div>'
      + '<div class="m"><span data-role="alpha" data-source="lot">α <span class="' + PX + '-mono">' + fr(H.alpha.v, 1) + '</span> %</span>' + (H.alpha.hors ? '≠' : '') + ' <span style="font-weight:400;color:var(--gris)">' + H.role + '</span></div>'
      + (C.sorties.length ? '<div class="m" style="color:var(--acc)">~<svg width="12" height="12" aria-hidden="true"><use href="#i-risque-12"/></svg> hors ' + C.sorties.map(function (f) { return pic(f, 12); }).join('') + '</div>' : '<div class="m" style="color:var(--vert)">~<svg width="12" height="12" aria-hidden="true"><use href="#i-check-12"/></svg> dans</div>')
      + (mot ? '<span class="' + PX + '-h16" data-role="hors-16d" data-greffe="hors-16d" data-houblon="' + k + '" title="' + H.mots.map(function (x) { return x.mot; }).join(', ') + '"><b>' + (mot.hors ? '◇ ' : '') + mot.mot + '</b>' + (plus > 0 ? ' <small>+' + plus + '</small>' : '') + '</span>' : '')
      + '</div>';
  });
  RANGEES.forEach(function (f) {
    var vise = f === 'floral' || f === 'resin';
    h += '<div class="' + PX + '-rl' + (vise ? ' vise' : '') + '" data-famille="' + f + '">' + pic(f, 14) + '<span>' + NOMS[f] + '</span></div>';
    D.ordre.forEach(function (k) { h += '<div class="' + PX + '-rc" data-famille="' + f + '" style="' + (k === etat.sel ? 'background:#f4f4f7' : '') + '">' + barre(D.C[m][k].cel[f], D.C[m][D.ref].cel[f], etat.absolu) + '</div>'; });
  });
  h += '<div class="' + PX + '-rl" style="color:var(--gris)">' + INCONNUES.map(function (f) { return pic(f, 13); }).join('') + '</div><div class="' + PX + '-inc-l"><span class="' + PX + '-bar ' + PX + '-inc" style="width:24px"></span>inconnus, pas zéro</div>';
  $('tab').innerHTML = h;
}
function rendre() { plan(); rep(); tab(); $('placer').textContent = 'Placer ' + D.H[etat.sel].nom + ' ' + nomM(etat.m); }
$('tp').innerHTML = pic('floral', 18); $('tr').innerHTML = pic('resin', 18);
document.addEventListener('click', function (e) {
  var p = e.target.closest('[data-m]'); if (p) { if (p.dataset.k !== D.ref) etat.sel = p.dataset.k; etat.m = p.dataset.m; rendre(); return; }
  var l = e.target.closest('[data-lent]'); if (l) { etat.absolu = l.dataset.lent === 'absolu'; rendre(); return; }
  var t = e.target.closest('[data-h]'); if (t) { etat.sel = t.dataset.h; rendre(); return; }
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
ecrire('rpb4', html);
