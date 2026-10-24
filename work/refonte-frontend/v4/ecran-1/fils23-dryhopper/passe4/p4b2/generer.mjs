// p4b2 · chaude · « Le brassin en courbes ». Sur a1 : la figure devient trois courbes de gain (floral, baies, résineux)
// le long des 24 moments, avec l'amertume en colonnes dessous et le rail aligné juste sous l'axe : le doigt traverse
// les courbes, les valeurs se lisent au croisement. Les barres l5b d'a1 restent, compactes, sous la figure.
// Améliorations prises : 1 (les points calculés par le moteur sont pleins, les crans interpolés en pointillé et plus
// pâles : l'interpolation se voit), 3 (la courbe d'activité de la levure sous l'axe, dans l'actif : biotransformation
// possible, non quantifiée ; après, elle dort), 4 (Pépins et Melon hachurés « ? »).
// Greffes : courbes de g1 ; courbe de levure de f5 et g6 ; marques « mesuré » sur l'axe de c7 ; « 1 j sans gain » de e2 ;
// loupe et sauts d'a1. Classes préfixées p4b2- (L26).
import { rendre, OUTIL, CHEV } from '../p4b-commun/socle-p4b.mjs';

rendre({
  id: 'p4b2', nom: 'Le brassin en courbes', chaleur: 'chaude', titre: 'Quand ajouter Idaho 7 ?',
  legende: [
    'Courbes : ce qu\'Idaho 7 ajoute à ta stout en floral, baies et résineux à chaque moment du brassin. Point plein : calculé par le moteur ; pointillé : interpolé entre 60′, 10′ et whirlpool.',
    'Colonnes grises : l\'amertume, orangée au-delà de 70 IBU ; hachurée à cru (non modélisé). Bande 50–70 : ton style.',
    'Sous l\'axe, dans l\'actif : la levure travaille (biotransformation possible, non quantifiée) ; fin vers J+5, à confirmer à la densité.',
    'Glisse le pouce sur le rail, par 5′ : le trait traverse les courbes ; la loupe chiffre les moments voisins. ● sur l\'axe : un moment mesuré.',
    'Barres : les 12 familles au style, rond : avant ; hachuré « ? » : jamais décrit, pas zéro. ★ : le meilleur pour ta demande du 18.10.',
  ],
  css: `
.p4b2 .s-ecran { gap:5px; }
.p4b2-rep { display:flex; flex-wrap:wrap; align-items:center; gap:2px 8px; font-size:16px; }
.p4b2-face { font-weight:600; }
.p4b2-fl { display:inline-flex; align-items:center; gap:4px; color:#9840bc; font-weight:700; }
.p4b2-star { margin-left:auto; display:inline-flex; align-items:center; gap:4px; height:24px; padding:0 9px; border-radius:12px; background:#fff; border:1px solid #d5d8df; font-size:13px; color:var(--gris); }
.p4b2-star b { color:#2f6b5f; font-weight:600; }
.p4b2-star.p4b2-ici { background:#edf7f3; border-color:#b7d8cf; }
.p4b2-contre { flex-basis:100%; font-size:13px; color:var(--gris); }
.p4b2-contre b { color:var(--encre); }
.p4b2-contre .p4b2-moins { color:var(--acc); font-weight:600; }
.p4b2-fig { padding:6px 12px 4px; gap:0; }
.p4b2-seg { display:grid; grid-template-columns:44fr 8fr 24fr 24fr; gap:2px; }
.p4b2-seg button { height:22px; border-radius:4px; background:#f1f2f5; font-size:12px; color:var(--gris); white-space:nowrap; overflow:hidden; }
.p4b2-seg button.p4b2-amer { box-shadow:inset 0 -3px 0 var(--acc); }
.p4b2-seg button[aria-current="true"] { background:var(--encre); color:#fff; font-weight:600; }
.p4b2-svg { display:block; width:100%; height:auto; overflow:visible; }
.p4b2-svg text { font-family:var(--mono); font-size:11px; font-weight:600; paint-order:stroke; stroke:#fff; stroke-width:3px; stroke-linejoin:round; }
.p4b2-svg .p4b2-lb { font-family:var(--sans); font-weight:400; fill:var(--gris); }
.p4b2-svg .p4b2-ip { stroke-dasharray:3 3; opacity:.55; }
.p4b2-svg .p4b2-ibu { fill:#9a9fab; }
.p4b2-svg .p4b2-ibu.p4b2-trop { fill:var(--acc); }
.p4b2-svg .p4b2-ibu.p4b2-ipb { opacity:.55; }
.p4b2-svg .p4b2-lev { fill:url(#p4b2-hachb); stroke:#3b5f8a; stroke-width:1.2; stroke-dasharray:3 2; }
.p4b2-rail { margin-top:16px; }
.p4b2 .p4r-geste { display:flex; flex-direction:column; }
.p4b2 .p4r-loupe { position:relative; top:auto; left:auto; right:auto; order:2; margin-top:6px; }
.p4b2-jr { display:grid; grid-template-columns:repeat(4,1fr); gap:3px; margin-top:4px; }
.p4b2-jr button { height:22px; border-radius:4px; background:#f1f2f5; font:600 12px var(--sans); color:var(--encre); }
.p4b2-jr button.p4b2-sg { background:#f7f8fa; color:var(--gris); font-weight:400; border:1px dashed #c9cdd6; }
.p4b2-jr button[aria-pressed="true"] { background:var(--encre); color:#fff; font-weight:700; border:0; }
.p4b2-jr button[aria-disabled="true"] { opacity:.45; }
.p4b2-ba { display:grid; grid-template-columns:92px 1fr 44px; align-items:center; gap:6px; font-size:14px; min-height:22px; }
.p4b2-n { display:flex; align-items:center; gap:4px; white-space:nowrap; }
.p4b2-n.p4b2-att { font-weight:700; }
.p4b2-v { text-align:right; font:600 12px var(--mono); }
.p4b2-p { position:relative; height:16px; background:#f1f2f5; border-radius:2px; overflow:hidden; }
.p4b2-p i { position:absolute; top:0; bottom:0; left:0; display:block; }
.p4b2-p .p4b2-z { width:var(--ws); background:#d9dce3; }
.p4b2-p .p4b2-b { width:var(--ws); top:3px; height:10px; border-radius:2px; transition:width .18s cubic-bezier(.2,.8,.2,1); }
.p4b2-ipr .p4b2-p .p4b2-b { opacity:.5; }
.p4b2-p .p4b2-av { left:clamp(7px, var(--ws), calc(100% - 7px)); width:14px; height:14px; top:1px; border-radius:50%; border:2px solid var(--encre); background:#fff; margin-left:-6px; }
.p4b2-p .p4b2-h { right:0; background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }
body.abs .p4b2-p .p4b2-z, body.abs .p4b2-p .p4b2-b { width:var(--wa); }
body.abs .p4b2-p .p4b2-av { left:clamp(6px, var(--wa), calc(100% - 6px)); }
.p4b2-bars { display:grid; grid-template-columns:1fr; gap:1px; padding:6px 10px; }
.p4b2-bas { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.p4b2-mes { display:flex; align-items:center; gap:5px; font-size:12px; color:var(--gris); min-width:0; }
.p4b2-mes b { color:var(--encre); font-weight:600; }
.p4b2-mes.p4b2-jamais { padding:1px 6px; border-radius:4px; background:#e2e5eb; }
.p4b2-lev a { display:inline-flex; align-items:center; gap:5px; height:30px; padding:0 12px; border-radius:15px; background:#fff; border:1px solid #c9cad2; font-size:13px; white-space:nowrap; }
.p4b2-lev a b { font-weight:700; }
`,
  corps: `
<div class="p4b2-rep" aria-live="polite"><span class="p4b2-face">Face à ta stout</span><span class="p4b2-fl"><svg class="s-pi" width="18" height="18" style="width:18px;height:18px" data-famille="floral" aria-label="Floral"><use href="#p-floral"/></svg><span id="p4b2-fl" class="num">~+22</span></span>
  <span class="p4b2-star" id="p4b2-star">★ <b id="p4b2-star-t"></b></span>
  <span class="p4b2-contre" id="p4b2-contre" hidden></span></div>
<section class="s-bloc p4b2-fig" data-libre="moment" data-acquis="frise" aria-label="Le brassin : gains en courbes, amertume en colonnes, rail du moment">
  <div class="p4b2-seg" id="p4b2-seg"></div>
  <svg class="p4b2-svg" id="p4b2-svg" viewBox="0 0 366 248" aria-hidden="true"></svg>
  <div class="p4b2-rail" id="p4b2-rail" data-acquis="geste"></div>
  <div class="p4b2-jr" id="p4b2-jr" role="group" aria-label="Jours de contact"></div>
</section>
<section class="s-bloc p4b2-bars" id="p4b2-bars" aria-label="Les 12 familles d'arômes au style, à ce moment"></section>
<div class="p4b2-bas">
  <p class="p4b2-mes" id="p4b2-mes" data-acquis="valeurs"></p>
  <nav class="p4b2-lev" aria-label="Pont vers Levure" data-acquis="levure" data-forme="pont"><a href="${OUTIL}"><b>Levure</b><span id="p4b2-lev-t"></span>${CHEV}</a></nav>
</div>`,
  script: function () {
    var S = window.S, P4 = window.P4, D = S.D, N = S.N, X = window.S_DATA;
    var W = 366, H = 248, TOP = 14, YC = 150, YI0 = 168, YI1 = 212, YAX = 222;
    var px = function (k) { return P4.x(k) / 100 * W; };
    var GAIN = 26, yc = function (g) { return YC - Math.max(0, g) / GAIN * (YC - TOP); };
    var COURBES = ['resin', 'berries', 'floral'];
    var svg = document.getElementById('p4b2-svg'), h = '';
    // Les zones et la bande 50–70 IBU.
    P4.SEG.forEach(function (s, n) { if (n % 2 === 1) h += '<rect x="' + (s[0] / 100 * W) + '" y="' + TOP + '" width="' + ((s[1] - s[0]) / 100 * W) + '" height="' + (YAX - TOP) + '" fill="#f1f2f5"/>'; });
    var yi = function (n) { return YI1 - Math.min(170, n) / 170 * (YI1 - YI0); };
    h += '<rect x="0" y="' + yi(70) + '" width="' + W + '" height="' + (yi(50) - yi(70)) + '" fill="#d9dce3"/>';
    h += '<line x1="0" x2="' + W + '" y1="' + YC + '" y2="' + YC + '" stroke="#c9cdd6"/>';
    // La levure : sous l'axe, une bosse d'activité sur l'actif (J+2 → J+5), qui retombe avant l'après.
    var xa = P4.SEG[2][0] / 100 * W, xb = P4.SEG[2][1] / 100 * W, xc = P4.SEG[3][0] / 100 * W;
    h += '<path class="p4b2-lev" d="M' + (xa - 6) + ' ' + YAX + ' C' + (xa + 6) + ' ' + YAX + ' ' + (xa + 8) + ' ' + (YAX - 11) + ' ' + (xa + 22) + ' ' + (YAX - 11) + ' S' + (xb - 14) + ' ' + (YAX - 5) + ' ' + (xb - 2) + ' ' + (YAX - 2) + ' L' + xc + ' ' + YAX + ' Z"/>';
    h += '<text class="p4b2-lb" x="' + (xa + 2) + '" y="' + (YAX + 12) + '">levure active</text><text class="p4b2-lb" x="' + (xa + 2) + '" y="' + (YAX + 24) + '">possible, non chiffrée</text><text class="p4b2-lb" x="' + W + '" y="' + (YAX + 12) + '" text-anchor="end">levure finie</text>';
    // L'amertume en colonnes : orangée au-delà de 70, hachurée à cru.
    h += '<defs><pattern id="p4b2-hachb" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2" height="6" fill="#3b5f8a" opacity=".45"/></pattern><pattern id="p4b2-hach" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2" height="6" fill="#c9cdd6"/></pattern></defs>';
    for (var k = 0; k <= N; k++) {
      var p = D[k], b = S.ibu(p), cw = P4.cw(k) / 100 * W;
      if (b.cru) h += '<rect x="' + (px(k) - cw / 2) + '" y="' + yi(60) + '" width="' + cw + '" height="' + (YI1 - yi(60)) + '" fill="#9a9fab"/><rect x="' + (px(k) - cw / 2) + '" y="' + yi(75) + '" width="' + cw + '" height="' + (yi(60) - yi(75)) + '" fill="url(#p4b2-hach)"/>';
      else h += '<rect class="p4b2-ibu' + (b.h ? ' p4b2-trop' : '') + (b.ip ? ' p4b2-ipb' : '') + '" x="' + (px(k) - cw / 2) + '" y="' + yi(b.n) + '" width="' + cw + '" height="' + (YI1 - yi(b.n)) + '"/>';
    }
    h += '<text class="p4b2-lb" x="2" y="' + (yi(60) - 2) + '">IBU</text>';
    // Les courbes de gain : segments pleins entre points calculés, pointillés et pâles quand interpolés.
    COURBES.forEach(function (f) {
      var pts = []; for (var k = 0; k <= N; k++) pts.push([px(k), yc(S.d(D[k], f)), D[k].interp]);
      for (var k = 1; k <= N; k++) h += '<line x1="' + pts[k - 1][0] + '" y1="' + pts[k - 1][1] + '" x2="' + pts[k][0] + '" y2="' + pts[k][1] + '" stroke="' + S.T[f] + '" stroke-width="' + (f === 'floral' ? 3 : 2.2) + '" stroke-linecap="round"' + (pts[k][2] || pts[k - 1][2] ? ' class="p4b2-ip"' : '') + '/>';
      for (var k = 0; k <= N; k++) if (!pts[k][2]) h += '<circle cx="' + pts[k][0] + '" cy="' + pts[k][1] + '" r="3" fill="' + S.T[f] + '"/>';
    });
    (function () { var ls = COURBES.map(function (f) { return { f: f, y: yc(S.d(D[N], f)) }; }).sort(function (a, b) { return a.y - b.y; }); for (var n = 1; n < ls.length; n++) if (ls[n].y - ls[n - 1].y < 13) ls[n].y = ls[n - 1].y + 13; ls.forEach(function (l) { h += '<text data-nom="' + l.f + '" x="' + (W - 2) + '" y="' + (l.y - 6) + '" text-anchor="end" fill="' + S.T[l.f] + '">' + S.NOM[l.f].toLowerCase() + '</text>'; }); })();
    // L'axe, les moments mesurés (● plein), ★.
    for (k = 0; k <= N; k++) { var m = P4.mesure(D[k]); if (m.ok && (k === S.idx('dryActive|2') || k === S.idx('dryPost|2'))) h += '<circle cx="' + px(k) + '" cy="' + (YAX - 1) + '" r="3" fill="var(--encre)"/><text class="p4b2-lb" x="' + (px(k) + 6) + '" y="' + (YAX - 4) + '">' + m.court + '</text>'; }
    h += '<text x="' + px(P4.best) + '" y="' + (TOP - 3) + '" text-anchor="middle" fill="#2f6b5f">★</text>';
    // Le trait du doigt et les valeurs au croisement.
    h += '<g id="p4b2-doigt"><line id="p4b2-dl" x1="0" x2="0" y1="' + TOP + '" y2="' + YAX + '" stroke="var(--encre)" stroke-width="2"/>'
      + COURBES.map(function (f) { return '<circle data-c="' + f + '" r="6" fill="#fff" stroke="' + S.T[f] + '" stroke-width="2.4"/><text data-t="' + f + '" fill="' + S.T[f] + '"></text>'; }).join('')
      + '<text id="p4b2-di" class="p4b2-ib"></text></g>';
    svg.innerHTML = h;
    // Les noms des courbes : à la fin des courbes, sauf quand le doigt y est (alors au début) : boîtes disjointes des valeurs.
    function noms(x) {
      var fin = x < W - 110, k = fin ? N : 0;
      var ls = COURBES.map(function (f) { return { f: f, y: yc(S.d(D[k], f)) }; }).sort(function (a, b) { return a.y - b.y; });
      for (var n = 1; n < ls.length; n++) if (ls[n].y - ls[n - 1].y < 13) ls[n].y = ls[n - 1].y + 13;
      ls.forEach(function (l) { var t = svg.querySelector('[data-nom="' + l.f + '"]'); t.setAttribute('x', fin ? W - 2 : 2); t.setAttribute('text-anchor', fin ? 'end' : 'start'); t.setAttribute('y', fin ? l.y - 6 : l.y - 6); });
    }
    function doigt(i) {
      var p = D[i], x = px(i), droite = x < W - 70; noms(x);
      document.getElementById('p4b2-dl').setAttribute('x1', x); document.getElementById('p4b2-dl').setAttribute('x2', x);
      var ls = COURBES.map(function (f) { return { f: f, y: yc(S.d(p, f)), ty: yc(S.d(p, f)) }; }).sort(function (a, b) { return a.y - b.y; });
      for (var n = 1; n < ls.length; n++) if (ls[n].ty - ls[n - 1].ty < 13) ls[n].ty = ls[n - 1].ty + 13;
      ls.forEach(function (l) {
        var c = svg.querySelector('[data-c="' + l.f + '"]'), t = svg.querySelector('[data-t="' + l.f + '"]');
        c.setAttribute('cx', x); c.setAttribute('cy', l.y); t.setAttribute('x', droite ? x + 9 : x - 9); t.setAttribute('y', l.ty + 4); t.setAttribute('text-anchor', droite ? 'start' : 'end'); t.textContent = S.fmt(p, l.f);
      });
      var b = S.ibu(p), di = document.getElementById('p4b2-di');
      di.setAttribute('x', droite ? x + 9 : x - 9); di.setAttribute('y', yi(Math.min(170, b.n)) - 3); di.setAttribute('text-anchor', droite ? 'start' : 'end'); di.setAttribute('fill', b.h ? '#c2410c' : '#55555f');
      di.textContent = b.cru ? '60+?' : b.t.replace(' IBU', '');
    }
    // Les quatre étapes en tête de figure : des sauts.
    var ET = [['b60', 'ébullition', 0], ['wp', 'WP', 1], ['dryActive|2', 'actif', 2], ['dryPost|2', 'après', 3]];
    var seg = document.getElementById('p4b2-seg');
    seg.innerHTML = ET.map(function (e) { return '<button type="button" data-etape="' + e[2] + '" data-saut="' + e[0] + '" aria-label="Moment : ' + e[1] + '"' + (S.ibu(D[S.idx(e[0])]).h ? ' class="p4b2-amer"' : '') + '>' + e[1] + '</button>'; }).join('');
    var JR = [1, 2, 3, 7], jr = document.getElementById('p4b2-jr');
    jr.innerHTML = JR.map(function (j) { return '<button type="button" data-jour="' + j + '" aria-pressed="false">' + j + ' j</button>'; }).join('');
    function majJours(p) {
      var s = P4.seg(p), dj = P4.jours(p);
      jr.querySelectorAll('button').forEach(function (b) {
        var j = +b.dataset.jour, on = s >= 2;
        b.setAttribute('aria-disabled', String(!on)); b.setAttribute('aria-pressed', String(on && j === dj));
        var q = on ? D[S.idx(p.id.split('|')[0] + '|' + j)] : null, pr = on && j > 1 ? D[S.idx(p.id.split('|')[0] + '|' + JR[JR.indexOf(j) - 1])] : null;
        b.classList.toggle('p4b2-sg', !!(q && pr && Math.abs(q.v.floral - pr.v.floral) < 0.1));
      });
    }
    // Les 12 barres l5b.
    var abs = function () { return document.body.classList.contains('abs'); };
    var w = function (v, f, m) { return (m === 's' ? Math.min(100, v / S.B[f] / 2 * 100) : Math.min(100, v / 110 * 100)); };
    var bars = document.getElementById('p4b2-bars');
    bars.innerHTML = S.ORDRE.map(function (f) {
      return '<div class="p4b2-ba" data-f="' + f + '"><span class="p4b2-n' + ({ floral: 1, herbal: 1, earthy: 1 }[f] ? ' p4b2-att' : '') + '">' + S.pi(f) + '<span>' + S.NOM[f] + '</span></span>'
        + '<span class="p4b2-p' + (P4.avinc(f) ? ' p4r-avinc' : '') + '"><i class="p4b2-z" data-role="zone" style="--ws:50%;--wa:' + (S.B[f] / 110 * 100).toFixed(1) + '%"></i><i class="p4b2-b" style="background:' + S.BA[f] + '"></i><i class="p4b2-av" style="--ws:' + w(S.AV[f], f, 's').toFixed(1) + '%;--wa:' + w(S.AV[f], f, 'a').toFixed(1) + '%"></i><i class="p4b2-h"></i></span><span class="p4b2-v"></span></div>';
    }).join('');
    function barres(i) {
      var p = D[i];
      bars.querySelectorAll('[data-f]').forEach(function (r) {
        var f = r.dataset.f, u = S.inc(p, f), b = r.querySelector('.p4b2-b'), v = r.querySelector('.p4b2-v');
        r.classList.toggle('p4b2-ipr', !!p.interp); b.hidden = u; r.querySelector('.p4b2-h').hidden = !u;
        if (!u) { b.style.setProperty('--ws', w(p.v[f], f, 's') + '%'); b.style.setProperty('--wa', w(p.v[f], f, 'a') + '%'); }
        v.textContent = P4.val(p, f); v.style.color = u ? '#55555f' : (S.hors(p, f) ? '#c2410c' : S.T[f]);
      });
    }
    function contre(i) {
      var c = document.getElementById('p4b2-contre'), st = document.getElementById('p4b2-star');
      document.getElementById('p4b2-star-t').textContent = D[P4.best].lib; st.classList.toggle('p4b2-ici', i === P4.best);
      if (i === P4.best) { c.hidden = true; return; }
      var p = D[i], q = D[P4.best], sg = p.interp ? '≈' : '~', df = Math.round(p.v.floral - q.v.floral), dr = Math.round(p.v.resin - q.v.resin);
      var fmt = function (n) { return sg + (n >= 0 ? '+' : '−') + Math.abs(n); };
      c.hidden = false; c.innerHTML = 'contre ★ : floral ' + fmt(df) + ' · résineux ' + fmt(dr) + (S.ibu(p).h ? ' · <span class="p4b2-moins">trop amer</span>' : '');
    }
    function mesure(p) { var m = document.getElementById('p4b2-mes'), r = P4.mesure(p); m.classList.toggle('p4b2-jamais', !r.ok); m.innerHTML = (r.ok && P4.seg(p) === 2 ? S.pi('floral', 14) : '') + '<span>' + r.html + '</span>'; }
    function levure(p) {
      var dd = X.POMONA[p.id] || null, f2 = null;
      if (dd) for (var f in dd) if (!f2 || Math.abs(dd[f]) > Math.abs(dd[f2])) f2 = f;
      document.getElementById('p4b2-lev-t').textContent = dd && Math.abs(dd[f2]) >= 0.5 ? 'Pomona ~+' + Math.round(dd[f2]) + ' ' + S.NOM[f2].toLowerCase() : 'rien ne change ici';
    }
    var R = P4.rail(document.getElementById('p4b2-rail'), {
      calcules: true,
      surPoser: function (i, p) {
        doigt(i); barres(i); contre(i); mesure(p); levure(p); majJours(p);
        seg.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-current', String(+b.dataset.etape === P4.seg(p))); });
        document.getElementById('p4b2-fl').textContent = S.fmt(p, 'floral');
      },
      loupe: function (i) {
        var out = [];
        for (var k = i - 2; k <= i + 2; k++) {
          if (k < 0 || k > N) continue; var p = D[k], pr = k > 0 ? D[k - 1] : null, sg = P4.seg(p) >= 2 && pr && P4.seg(pr) === P4.seg(p) && Math.abs(p.v.floral - pr.v.floral) < 0.1;
          out.push({ k: k, html: '<em>' + P4.court(p) + '</em><i><b style="width:' + Math.min(100, p.v.floral / 25 * 100).toFixed(0) + '%"></b></i><small' + (sg ? ' style="color:#55555f;font-weight:400"' : '') + '>' + (sg ? 'sans gain' : S.fmt(p, 'floral')) + '</small>' });
        }
        return out;
      },
    });
    jr.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { var p = D[R.cur()]; if (P4.seg(p) < 2) return; R.poser(S.idx(p.id.split('|')[0] + '|' + b.dataset.jour)); }); });
    seg.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { var p = D[R.cur()]; if (P4.seg(p) === +b.dataset.etape) return; R.poser(S.idx(b.dataset.saut.indexOf('dry') === 0 && P4.jours(p) ? b.dataset.saut.split('|')[0] + '|' + P4.jours(p) : b.dataset.saut)); }); });
    S.surLecture(function () { barres(R.cur()); });
    window.P4ETAT = function () { var p = D[R.cur()]; return { m: p.lib, fl: S.fmt(p, 'floral'), am: document.getElementById('p4b2-di').textContent, contre: document.getElementById('p4b2-contre').textContent, lev: document.getElementById('p4b2-lev-t').textContent, mes: document.getElementById('p4b2-mes').textContent }; };
  },
});
