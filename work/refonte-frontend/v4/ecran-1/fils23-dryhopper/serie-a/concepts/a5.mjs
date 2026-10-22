// a5 · tiède · « Tenir, puis lâcher » : le brassin est une horloge. On tient la pastille Idaho 7, le temps
// coule de 60′ à la cuve au repos ; on lâche quand on veut l'ajouter. Plus tard = tenir plus longtemps.
// L'anneau s'épaissit là où le floral monte ; un arc orangé intérieur marque l'amertume hors du style.
// ‹ › affinent d'un cran. Levure : étape 2.
import { I_SABLIER } from '../socle.mjs';

export default {
  id: 'a5', nom: 'Tenir, puis lâcher', chaleur: 'tiède', levure: 'etape',
  titre: 'Quand ajouter Idaho 7 ?',
  legende: ['Tiens la pastille : le brassin avance de 60′ à la cuve au repos ; lâche pour ajouter.', 'Anneau violet, plus épais : plus de floral ; arc orangé : amertume hors du style.', '‹ › : un cran plus tôt ou plus tard.', '~ simulé · ≈ interpolé · ? inconnu, hachuré.'],
  css: `
.a5-haut { flex-direction:row; align-items:center; gap:6px; padding:6px 8px; }
.a5-cad { position:relative; width:188px; height:188px; flex:none; touch-action:none; }
.a5-cad svg text { font:12px var(--sans); fill:var(--gris); }
.a5-tenir { position:absolute; left:50%; top:50%; width:78px; height:78px; margin:-39px 0 0 -39px; border-radius:50%; background:var(--i7); color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0; user-select:none; -webkit-user-select:none; -webkit-touch-callout:none; touch-action:none; transition:transform .12s; }
.a5-tenir b { font-size:14px; }
.a5-tenir span { font-size:12px; }
.a5-tenir.a5-tient { transform:scale(.93); }
.a5-lu { display:flex; flex-direction:column; gap:4px; min-width:0; }
.a5-mom { font:700 18px var(--sans); }
.a5-fl { display:flex; align-items:center; gap:5px; font:700 24px var(--mono); color:#9840bc; }
.a5-am { font-size:14px; font-weight:600; }
.a5-am.a5-h { color:var(--acc); }
.a5-pas { display:flex; gap:6px; margin-top:4px; }
.a5-pas button { width:40px; height:32px; border-radius:16px; border:1px solid #c9cad2; background:#fff; font:700 18px var(--sans); }
`,
  corps: `
<section class="s-bloc a5-haut" data-libre="moment" aria-label="L'horloge du brassin">
  <div class="a5-cad" id="a5-cad"><svg id="a5-svg" width="188" height="188" viewBox="0 0 188 188" aria-hidden="true"></svg>
    <button type="button" class="a5-tenir" id="a5-tenir" aria-label="Moment : tenir pour avancer, lâcher pour ajouter" data-sans-menu data-couleur="#e80030" data-serie="Idaho 7"><b>tenir</b><span>Idaho 7</span></button></div>
  <div class="a5-lu" aria-live="polite"><span class="a5-mom" id="a5-mom">actif · 3 j</span><span class="a5-fl">${'<svg class="s-pi" width="22" height="22" style="width:22px;height:22px" data-famille="floral" aria-label="Floral"><use href="#p-floral"/></svg>'}<span id="a5-fl">~+22</span></span><span class="a5-am" id="a5-am">60 IBU, tenue</span>
    <span class="a5-pas"><button type="button" id="a5-moins" aria-label="Moment plus tôt">‹</button><button type="button" id="a5-plus" aria-label="Moment plus tard">›</button></span></div>
</section>
<section class="s-bloc" id="a5-barres" aria-label="Familles d'arômes au style"></section>
<p class="s-src" id="a5-src">${I_SABLIER}<span><b>mesuré</b> en cuve : le floral monte 24 h, le résineux retombe après 6 h · Wolfe 2012, E05</span></p>`,
  script: function () {
    var S = window.S, D = S.D, N = S.N, svg = document.getElementById('a5-svg'), C = 94, R = 62;
    var seg = function (p) { return p.id.charAt(0) === 'b' ? 0 : p.id === 'wp' ? 1 : p.id.indexOf('dryActive') === 0 ? 2 : 3; };
    var PL = [[8, 150], [160, 176], [188, 266], [278, 352]];
    var ang = [], k, idx;
    for (var s = 0; s < 4; s++) { idx = []; for (k = 0; k <= N; k++) if (seg(D[k]) === s) idx.push(k); idx.forEach(function (kk, j) { ang[kk] = idx.length === 1 ? (PL[s][0] + PL[s][1]) / 2 : PL[s][0] + (PL[s][1] - PL[s][0]) * j / (idx.length - 1); }); }
    var pt = function (a, r) { var t = (a - 90) * Math.PI / 180; return [C + r * Math.cos(t), C + r * Math.sin(t)]; };
    var arc = function (a0, a1, r) { var p0 = pt(a0, r), p1 = pt(a1, r); return 'M' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + 'A' + r + ' ' + r + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1); };
    var h = '<circle cx="' + C + '" cy="' + C + '" r="' + R + '" fill="none" stroke="#eceef2" stroke-width="2"/>';
    for (k = 0; k <= N; k++) {
      var a0 = k === 0 ? ang[0] - 3 : (seg(D[k - 1]) === seg(D[k]) ? (ang[k - 1] + ang[k]) / 2 : ang[k] - 4), a1 = k === N ? ang[N] + 3 : (seg(D[k + 1]) === seg(D[k]) ? (ang[k] + ang[k + 1]) / 2 : ang[k] + 4);
      h += '<path d="' + arc(a0 + 0.6, a1 - 0.6, R) + '" fill="none" stroke="#bf86d6" stroke-opacity="' + (D[k].interp ? 0.5 : 1) + '" stroke-width="' + (2 + D[k].v.floral / 25 * 13).toFixed(1) + '"/>';
    }
    var deb = null; for (k = 0; k <= N + 1; k++) { var t = k <= N && S.ibu(D[k]).h; if (t && deb == null) deb = k; if (!t && deb != null) { h += '<path d="' + arc(ang[deb] - 3, ang[k - 1] + 3, R - 13) + '" fill="none" stroke="#c2410c" stroke-width="3" stroke-linecap="round"/>'; deb = null; } }
    [['60′', ang[0]], ['10′', ang[S.idx('b10')]], ['WP', ang[S.idx('wp')]], ['actif', (PL[2][0] + PL[2][1]) / 2], ['après', (PL[3][0] + PL[3][1]) / 2]].forEach(function (l) { var a = l[1], p = pt(a, R + 21); h += '<text x="' + p[0].toFixed(1) + '" y="' + (p[1] + 4).toFixed(1) + '" text-anchor="middle">' + l[0] + '</text>'; });
    h += '<g id="a5-aig"><circle r="8" fill="#16161a" stroke="#fff" stroke-width="3"/></g>';
    svg.innerHTML = h;
    var majB = S.barres(document.getElementById('a5-barres')), i = S.depart(), tim = null, btn = document.getElementById('a5-tenir');
    function poser(n) {
      i = Math.max(0, Math.min(N, n)); var p = D[i], q = pt(ang[i], R);
      document.getElementById('a5-aig').setAttribute('transform', 'translate(' + q[0].toFixed(1) + ' ' + q[1].toFixed(1) + ')');
      document.getElementById('a5-mom').textContent = p.lib; document.getElementById('a5-fl').textContent = S.fmt(p, 'floral');
      var b = S.ibu(p), am = document.getElementById('a5-am'); am.textContent = b.t + ', ' + b.s; am.classList.toggle('a5-h', b.h);
      document.getElementById('a5-src').hidden = seg(p) < 2; majB(p);
    }
    function lacher() { if (tim) { clearInterval(tim); tim = null; } btn.classList.remove('a5-tient'); }
    btn.addEventListener('pointerdown', function (e) { e.preventDefault(); btn.setPointerCapture(e.pointerId); btn.classList.add('a5-tient'); poser(0); tim = setInterval(function () { if (i >= N) { lacher(); return; } poser(i + 1); }, 150); });
    btn.addEventListener('pointerup', lacher); btn.addEventListener('pointercancel', lacher);
    btn.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') poser(i + 1); if (e.key === 'ArrowLeft') poser(i - 1); });
    document.getElementById('a5-moins').addEventListener('click', function () { poser(i - 1); });
    document.getElementById('a5-plus').addEventListener('click', function () { poser(i + 1); });
    poser(i);
  },
};
