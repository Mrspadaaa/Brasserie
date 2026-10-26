// rpb2 (tiède, forme « Trois plans » de w2) : chaque colonne de r6a devient un plan — un houblon ET son moment.
// La tête de colonne est une carte de w2 avec sa petite frise (60′ · 10′ · WP | actif · après) ; au départ, le moteur
// pose chaque houblon à son meilleur moment pour le floral sans sortir de ta 16D. En haut, la piste commune de w2
// (un rond lettré par plan) répond « lequel, et quand ».
import { TETE, sprite, cssBase, LIB, donnees, RANGEES, INCONNUES, ecrire } from './commun.mjs';
const PX = 'rpb2';
const D = donnees();

const css = cssBase(PX) + `
.${PX}-ecran{max-width:430px;margin:0 auto;padding:6px 10px 24px}
.${PX}-tete{display:flex;align-items:center;gap:8px;height:36px}
.${PX}-x{width:32px;height:32px;border-radius:16px;display:grid;place-items:center;background:var(--fond);flex:none}
.${PX}-titre{font-size:18px;font-weight:700;flex:1;white-space:nowrap}
.${PX}-aide{width:28px;height:28px;border-radius:14px;display:grid;place-items:center;border:1px solid var(--trait);color:var(--gris)}
.${PX}-dem{font-size:13px;display:flex;align-items:center;gap:4px;color:var(--gris);margin:0 0 4px}
.${PX}-dem b{color:var(--encre);font-weight:600;display:inline-flex;align-items:center;gap:2px}
.${PX}-haut{display:grid;grid-template-columns:190px 1fr;gap:4px;align-items:center}
.${PX}-pistes{display:flex;flex-direction:column;gap:10px}
.${PX}-pi-t{font-size:12px;display:flex;align-items:center;gap:4px;color:var(--t);font-weight:600;margin-bottom:3px}
.${PX}-pi-t .${PX}-mono{margin-left:auto;color:var(--gris);font-weight:400}
.${PX}-piste{position:relative;height:24px;background:#f1f1f4;border-radius:12px}
.${PX}-piste .${PX}-z{position:absolute;left:0;top:0;bottom:0;background:var(--f);border-radius:12px 0 0 12px;border-right:1.5px solid var(--t)}
.${PX}-piste .${PX}-st{position:absolute;top:2px;bottom:2px;width:2px;background:var(--encre);margin-left:-1px}
.${PX}-rond{position:absolute;top:2px;width:20px;height:20px;margin-left:-10px;border-radius:10px;color:#fff;font-size:12px;font-weight:700;display:grid;place-items:center;border:1.5px solid #fff}
.${PX}-rond.sel{box-shadow:0 0 0 2px var(--encre)}
.${PX}-lent{display:flex;gap:6px;align-items:center;justify-content:space-between;margin-top:2px}
.${PX}-seg{display:flex;background:var(--fond);border-radius:14px;padding:2px}
.${PX}-seg button{font-size:12px;padding:3px 8px;border-radius:12px;color:var(--gris);white-space:nowrap}
.${PX}-seg button[aria-pressed="true"]{background:var(--encre);color:#fff;font-weight:600}
.${PX}-simu{font-size:12px;border:1.5px solid var(--encre);border-radius:12px;padding:1px 7px;font-weight:600;white-space:nowrap}
.${PX}-tab{display:grid;grid-template-columns:70px repeat(3,minmax(0,1fr));column-gap:5px;margin-top:6px}
.${PX}-gau{font-size:12px;display:flex;flex-direction:column;justify-content:flex-end;gap:4px;padding-bottom:6px;color:var(--gris)}
.${PX}-gau .${PX}-l{display:flex;align-items:center;gap:4px}
.${PX}-trait{width:12px;height:2px;background:var(--encre);display:inline-block}
.${PX}-pt{width:12px;height:0;border-top:2px dotted #6b6b75;display:inline-block}
.${PX}-carte{border:1.5px solid var(--trait);border-radius:8px;padding:0 5px 5px;position:relative;overflow:hidden;cursor:pointer;min-width:0;background:#fff}
.${PX}-carte::before{content:"";display:block;height:5px;margin:0 -5px 4px;background:var(--hc)}
.${PX}-carte[aria-pressed="true"]{border:2px solid var(--encre)}
.${PX}-c-nom{display:flex;align-items:center;gap:3px;font-size:14px;font-weight:700;white-space:nowrap}
.${PX}-c-nom .${PX}-let{width:16px;height:16px;border-radius:8px;color:#fff;font-size:12px;display:grid;place-items:center;flex:none;background:var(--hc)}
.${PX}-c-li{font-size:12px;color:var(--gris);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.${PX}-c-li b{color:var(--encre);font-weight:600}
.${PX}-mf{position:relative;height:20px;margin:3px 0 0;display:grid;grid-template-columns:repeat(3,1fr) 4px repeat(2,1fr)}
.${PX}-c-m{font-size:13px;font-weight:700;white-space:nowrap}
.${PX}-c-m .${PX}-mono{font-weight:400;font-size:12px;color:var(--gris)}
.${PX}-mf::before{content:"";position:absolute;left:6px;right:6px;top:8px;height:2px;background:#cfcfd6}
.${PX}-mf button{position:relative;height:20px;display:flex;flex-direction:column;align-items:center;gap:1px}
.${PX}-mf button i{width:8px;height:8px;border-radius:4px;background:#fff;border:1.5px solid #9a9aa4;margin-top:4px;display:block}
.${PX}-mf button span{display:none}
.${PX}-mf button[aria-checked="true"] i{width:12px;height:12px;border-radius:6px;margin-top:2px;background:var(--hc);border-color:var(--hc)}
.${PX}-mf button[aria-checked="true"] span{visibility:visible}
.${PX}-mf .${PX}-sep{width:2px;height:14px;background:#9a9aa4;margin-top:2px;justify-self:center}
.${PX}-gain{display:flex;align-items:center;gap:2px;font-size:13px;font-family:var(--mono);font-weight:600;color:var(--t);white-space:nowrap}
.${PX}-vd{font-size:12px;font-weight:600;display:flex;align-items:center;gap:2px;white-space:nowrap}
.${PX}-vd.dans{color:var(--vert)} .${PX}-vd.hors{color:var(--acc)}
.${PX}-h16{display:inline-block;margin-top:3px;font-size:12px;font-weight:600;border:1.5px solid var(--encre);border-radius:4px;padding:0 5px;line-height:1.3;max-width:100%}
.${PX}-h16 small{font-size:12px;color:var(--gris);font-weight:400}
.${PX}-rl{display:flex;align-items:center;gap:4px;font-size:13px;height:25px;color:var(--t);white-space:nowrap}
.${PX}-rl.vise{font-weight:700}
.${PX}-rc{display:flex;align-items:center;height:25px;padding:0 6px 0 2px}
.${PX}-rc.sel{background:#f4f4f7}
.${PX}-rc>.${PX}-bar:not(.${PX}-inc){flex:1}
.${PX}-rgap{grid-column:1/5;height:6px}
.${PX}-inc-l{font-size:12px;color:var(--gris);display:flex;align-items:center;gap:4px;grid-column:2/5}
.${PX}-pied{display:flex;gap:8px;margin-top:10px}
.${PX}-btn{font-size:13px;font-weight:600;border:1.5px solid var(--encre);border-radius:16px;padding:5px 12px}
.${PX}-btn.plein{background:var(--encre);color:#fff;margin-left:auto}.${PX}-btn.plein::after{content:'›';display:inline-block;margin-left:4px}
.${PX}-leg{display:none;position:fixed;inset:auto 8px 8px 8px;background:#fff;border:1px solid var(--trait);border-radius:12px;padding:10px 12px;box-shadow:0 8px 30px rgba(0,0,0,.18);font-size:13px;z-index:5}
.${PX}-leg.ouvert{display:block}
.${PX}-leg p{display:flex;gap:8px;align-items:center;margin:3px 0}
`;

const html = TETE('rpb2 · Trois plans, sur les colonnes de r6a · r6a++') + `<style>${css}</style>
</head>
<body>
${sprite()}
<main class="${PX}-ecran" data-variante="rpb2">
  <header class="${PX}-tete">
    <button class="${PX}-x" type="button" aria-label="Fermer"><svg width="14" height="14" aria-hidden="true"><use href="#i-x-14"/></svg></button>
    <h1 class="${PX}-titre">Trois plans pour ma stout</h1>
    <button class="${PX}-aide" type="button" id="${PX}-aide" data-role="legende-bouton" aria-expanded="false" aria-label="Légende"><svg width="14" height="14" aria-hidden="true"><use href="#i-aide-14"/></svg></button>
  </header>
  <p class="${PX}-dem" data-role="contexte">Ta 16D, <b data-famille="floral"><span id="${PX}-dpf"></span>plus</b>, <b data-famille="resin"><span id="${PX}-dpr"></span>moins</b><span style="margin-left:auto">4 g/L, US-05</span></p>
  <section class="${PX}-haut">
    <div id="${PX}-rad"></div>
    <div>
      <div class="${PX}-pistes" id="${PX}-pistes" data-greffe="trois-plans-w2" aria-label="Piste commune des trois plans"></div>
      <div class="${PX}-lent" style="margin-top:10px"><span class="${PX}-simu">~ simulé</span>
        <div class="${PX}-seg" role="group" aria-label="Échelle" data-booster="lentille"><button type="button" aria-pressed="true" data-lent="style" data-e="style">Au style</button><button type="button" aria-pressed="false" data-lent="absolu" data-e="absolu">Absolu</button></div></div>
    </div>
  </section>
  <section class="${PX}-tab" id="${PX}-tab" data-libre="houblon moment" aria-label="Trois plans côte à côte"></section>
  <div class="${PX}-pied"><button class="${PX}-btn" type="button">Vraies valeurs</button><button class="${PX}-btn plein" type="button" id="${PX}-placer"></button></div>
  <aside class="${PX}-leg" id="${PX}-leg" data-role="legende" role="dialog" aria-label="Légende">
    <p>Chaque colonne : un houblon et son moment. Au départ, son meilleur moment pour le floral sans sortir de ta 16D.</p>
    <p><span class="${PX}-trait"></span> ta stout · <span class="${PX}-pt"></span> ton Nugget, au même moment</p>
    <p><i style="width:16px;height:8px;background:#c2410c;display:inline-block"></i> au-dessus de ta 16D · <span class="${PX}-bar ${PX}-inc" style="width:16px"></span> inconnu, pas zéro</p>
    <p>◇ mot de ses fiches hors des 12 familles</p>
  </aside>
</main>
<script>
(function () {
var PX = ${JSON.stringify(PX)};
var D = ${JSON.stringify(D)};
var RANGEES = ${JSON.stringify(RANGEES)}, INCONNUES = ${JSON.stringify(INCONNUES)};
${LIB}
var $ = function (id) { return document.getElementById(PX + '-' + id); };
var LET = { cascade: 'C', idaho7: 'I', galaxy: 'G' };
// Le plan de départ de chaque houblon : son moment au plus de floral sans sortir de ta 16D.
function meilleur(k) {
  var ms = D.MOMENTS.map(function (m) { return m.id; }).filter(function (m) { return !D.C[m][k].sorties.length; });
  return ms.sort(function (a, b) { return D.C[b][k].cel.floral.dc - D.C[a][k].cel.floral.dc; })[0];
}
var etat = { plan: {}, absolu: false, sel: null };
D.ordre.forEach(function (k) { etat.plan[k] = meilleur(k); });
function nomM(m) { return D.MOMENTS.filter(function (x) { return x.id === m; })[0].nom; }
function etoile() { return D.ordre.slice().sort(function (a, b) { return D.C[etat.plan[b]][b].cel.floral.dc - D.C[etat.plan[a]][a].cel.floral.dc; })[0]; }
function pistes() {
  var h = '';
  [['floral', 'plus'], ['resin', 'moins']].forEach(function (x) {
    var f = x[0], S0 = D.style[f], S = etat.absolu ? 125 : S0.d, p = function (v) { return Math.max(3, Math.min(97, 100 * v / S)); };
    var c0 = D.C.apres.cascade.cel[f];
    h += '<div><div class="' + PX + '-pi-t" data-famille="' + f + '">' + pic(f, 14) + NOMS[f] + ' ' + (f === 'floral' ? '↑' : '↓') + '</div><div class="' + PX + '-piste">'
      + '<i class="' + PX + '-z" data-famille="' + f + '" data-role="zone" style="width:' + p(S0.bh) + '%"></i><i class="' + PX + '-st" style="left:' + p(c0.a) + '%"></i>';
    // Ronds qui se chevauchent : écartés de 9 % au moins, vers la gauche depuis le bord (la valeur exacte est sur la carte).
    var pos = D.ordre.map(function (k) { return { k: k, x: p(D.C[etat.plan[k]][k].cel[f].c) }; }).sort(function (a, b) { return b.x - a.x; });
    for (var i = 1; i < pos.length; i++) if (pos[i - 1].x - pos[i].x < 9) pos[i].x = pos[i - 1].x - 9;
    pos.forEach(function (q) { var k = q.k; h += '<span class="' + PX + '-rond' + (etat.sel === k ? ' sel' : '') + '" style="left:' + q.x + '%;background:' + D.H[k].couleur + '" aria-label="' + D.H[k].nom + ' ' + nomM(etat.plan[k]) + ' ' + cran(D.C[etat.plan[k]][k].cel[f].dc) + '">' + LET[k] + '</span>'; });
    h += '</div></div>';
  });
  $('pistes').innerHTML = h;
}
function tab() {
  var h = '<div class="' + PX + '-gau"><span class="' + PX + '-l"><span class="' + PX + '-trait"></span>ta stout</span><span class="' + PX + '-l"><span class="' + PX + '-pt"></span>Nugget</span></div>';
  D.ordre.forEach(function (k) {
    var H = D.H[k], m = etat.plan[k], C = D.C[m][k], sort = C.sorties, a = H.alpha;
    var mf = '';
    D.MOMENTS.forEach(function (x, i) { if (i === 3) mf += '<span class="' + PX + '-sep" aria-hidden="true"></span>'; mf += '<button type="button" role="radio" aria-checked="' + (x.id === m) + '" data-k="' + k + '" data-m="' + x.id + '" aria-label="' + H.nom + ' ' + x.long + '"><i></i><span>' + x.nom + '</span></button>'; });
    var mot = H.mots[0], plus = H.mots.length - 1;
    h += '<div class="' + PX + '-carte" role="button" tabindex="0" data-houblon="' + k + '" data-h="' + k + '" style="--hc:' + H.couleur + '" aria-pressed="' + (etat.sel === k) + '">'
      + '<div class="' + PX + '-c-nom"><span class="' + PX + '-let" aria-hidden="true">' + LET[k] + '</span><u style="text-decoration:underline dotted #9a9aa4;text-underline-offset:3px">' + H.nom + '</u>' + (k === etoile() ? '<span aria-label="le plus floral">★</span>' : '') + '</div>'
      + '<div class="' + PX + '-c-li"><span data-role="alpha" data-source="lot">α <b class="' + PX + '-mono">' + fr(a.v, 1) + '</b> %</span>' + (a.hors ? '≠' : '') + ' ' + H.role + '</div>'
      + '<div class="' + PX + '-mf" role="radiogroup" aria-label="Moment de ' + H.nom + '" data-booster="moment" data-greffe="frise-y1b">' + mf + '</div>'
      + '<div class="' + PX + '-c-m">' + nomM(m) + ' <span class="' + PX + '-mono">' + (C.ibu == null ? '? IBU' : '~' + C.ibu + ' IBU') + '</span></div>'
      + '<div class="' + PX + '-gain" data-famille="floral">' + pic('floral', 13) + cran(C.cel.floral.dc) + '</div>'
      + '<div class="' + PX + '-gain" data-famille="resin" style="color:var(--acc)">' + pic('resin', 13) + cran(C.cel.resin.dc) + '</div>'
      + (sort.length ? '<div class="' + PX + '-vd hors">~<svg width="12" height="12" aria-hidden="true"><use href="#i-risque-12"/></svg>hors ' + sort.map(function (f) { return pic(f, 12); }).join('') + '</div>'
        : '<div class="' + PX + '-vd dans">~<svg width="12" height="12" aria-hidden="true"><use href="#i-check-12"/></svg>dans</div>')
      + (mot ? '<span class="' + PX + '-h16" data-role="hors-16d" data-greffe="hors-16d" data-houblon="' + k + '" title="' + H.mots.map(function (x) { return x.mot; }).join(', ') + '">' + (mot.hors ? '◇ ' : '') + mot.mot + (plus > 0 ? ' <small>+' + plus + '</small>' : '') + '</span>' : '')
      + '</div>';
  });
  h += '<span class="' + PX + '-rgap"></span>';
  RANGEES.forEach(function (f) {
    var vise = f === 'floral' || f === 'resin';
    h += '<div class="' + PX + '-rl' + (vise ? ' vise' : '') + '" data-famille="' + f + '">' + pic(f, 14) + '<span>' + NOMS[f] + '</span></div>';
    D.ordre.forEach(function (k) { var m = etat.plan[k]; h += '<div class="' + PX + '-rc' + (etat.sel === k ? ' sel' : '') + '" data-famille="' + f + '">' + barre(D.C[m][k].cel[f], D.C[m][D.ref].cel[f], etat.absolu) + '</div>'; });
  });
  h += '<div class="' + PX + '-rl" style="color:var(--gris)">' + INCONNUES.map(function (f) { return pic(f, 13); }).join('') + '</div><div class="' + PX + '-inc-l"><span class="' + PX + '-bar ' + PX + '-inc" style="width:24px"></span>inconnus, pas zéro</div>';
  $('tab').innerHTML = h;
}
function rad() {
  $('rad').innerHTML = radar({ familles: ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'resin', 'spice', 'green'], w: 190, h: 190, r: 70, pic: 15, style: D.style, absolu: etat.absolu,
    series: D.ordre.map(function (k) { return { cel: D.C[etat.plan[k]][k].cel, couleur: D.H[k].couleur, sel: k === etat.sel }; }) });
}
function rendre() {
  if (!etat.manuel) etat.sel = etoile();
  pistes(); tab(); rad();
  $('placer').textContent = 'Placer ' + D.H[etat.sel].nom + ' ' + nomM(etat.plan[etat.sel]);
}
$('dpf').innerHTML = pic('floral', 13); $('dpr').innerHTML = pic('resin', 13);
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-m]'); if (b) { etat.plan[b.dataset.k] = b.dataset.m; etat.sel = b.dataset.k; etat.manuel = true; rendre(); return; }
  var l = e.target.closest('[data-lent]'); if (l) { etat.absolu = l.dataset.lent === 'absolu'; document.querySelectorAll('[data-lent]').forEach(function (x) { x.setAttribute('aria-pressed', x === l); }); rendre(); return; }
  var c = e.target.closest('[data-h]'); if (c) { etat.sel = c.dataset.h; etat.manuel = true; rendre(); return; }
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
ecrire('rpb2', html);
