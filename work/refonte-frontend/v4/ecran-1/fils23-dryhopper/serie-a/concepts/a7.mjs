// a7 · tiède · « Le doigt sur la courbe » : la représentation est la commande. Les courbes des familles
// suivent le moment de l'ajout, de 60′ à la cuve au repos ; dessous, l'amertume de la stout et sa bande du
// style. Le doigt balaie le graphe, le curseur se pose sur un moment ; la lecture et les barres suivent.
import { I_SABLIER } from '../socle.mjs';

export default {
  id: 'a7', nom: 'Le doigt sur la courbe', chaleur: 'tiède', levure: 'pont',
  titre: 'Quand ajouter Idaho 7 ?',
  legende: ['Balaie le graphe du doigt : le curseur se pose sur un moment.', 'Courbes : chaque famille avec Idaho 7 ; gris : la zone du style. Plus pâle : ≈ interpolé.', 'Dessous : l\'amertume de ta stout, bande 50–70 IBU du style.', '~ simulé · ≈ interpolé · ? inconnu.'],
  css: `
.a7-lu { display:flex; flex-wrap:wrap; align-items:center; gap:4px 10px; }
.a7-lu b { font:700 18px var(--sans); }
.a7-fl { display:inline-flex; align-items:center; gap:4px; font:700 18px var(--mono); color:#9840bc; }
.a7-am { font-size:14px; font-weight:600; }
.a7-am.a7-h { color:var(--acc); }
.a7-g { padding:6px 4px; }
.a7-g svg { width:100%; height:auto; touch-action:none; cursor:crosshair; }
.a7-g text { font:12px var(--sans); fill:#55555f; }
.a7-g .s-ba { display:none; }
.a7-cles { display:flex; flex-wrap:wrap; gap:2px 10px; padding:0 6px; font-size:12px; }
.a7-cles span { display:inline-flex; align-items:center; gap:3px; }
#a7-barres .s-ba { min-height:16px; font-size:12px; grid-template-columns:84px 1fr 34px; }
`,
  corps: `
<div class="a7-lu" aria-live="polite"><b id="a7-mom">actif · 3 j</b><span class="a7-fl">${'<svg class="s-pi" width="18" height="18" style="width:18px;height:18px" data-famille="floral" aria-label="Floral"><use href="#p-floral"/></svg>'}<span id="a7-fl">~+22</span></span><span class="a7-am" id="a7-am">60 IBU, tenue</span></div>
<section class="s-bloc a7-g" data-libre="moment" aria-label="Le graphe du moment">
  <svg id="a7-svg" viewBox="0 0 352 236" role="slider" tabindex="0" aria-label="Moment de l'ajout" aria-valuemin="0" aria-valuemax="23" data-sans-menu></svg>
  <div class="a7-cles" id="a7-cles"></div>
</section>
<section class="s-bloc" id="a7-barres" aria-label="Familles d'arômes au style"></section>
<p class="s-src">${I_SABLIER}<span><b>mesuré</b> : l'essentiel passe en 2 j de contact · Schmidt 2019, E08</span></p>`,
  script: function () {
    var S = window.S, D = S.D, N = S.N, B = S.B, svg = document.getElementById('a7-svg');
    var L = 26, Rr = 346, T0 = 8, H = 132, IY = 178, IH = 46;
    var SEG = [[0, 44], [44, 52], [52, 76], [76, 100]], seg = function (p) { return p.id.charAt(0) === 'b' ? 0 : p.id === 'wp' ? 1 : p.id.indexOf('dryActive') === 0 ? 2 : 3; };
    var X = []; for (var s = 0; s < 4; s++) { var idx = []; for (var k = 0; k <= N; k++) if (seg(D[k]) === s) idx.push(k); idx.forEach(function (kk, j) { var pc = idx.length === 1 ? (SEG[s][0] + SEG[s][1]) / 2 : SEG[s][0] + (SEG[s][1] - SEG[s][0]) * (0.06 + 0.88 * j / (idx.length - 1)); X[kk] = L + (Rr - L) * pc / 100; }); }
    var FAMS = ['floral', 'tropical', 'berries', 'citrus', 'resin'], i = S.depart();
    var yv = function (v, f) { var r = document.body.classList.contains('abs') ? v / 110 : v / B[f] / 2; return T0 + H - Math.min(1, r) * H; };
    var yi = function (n) { return IY + IH - Math.min(170, n) / 170 * IH; };
    document.getElementById('a7-cles').innerHTML = FAMS.map(function (f) { return '<span style="color:' + S.T[f] + '">' + S.pi(f, 14) + S.NOM[f] + '</span>'; }).join('');
    function dessiner() {
      var abs = document.body.classList.contains('abs'), zy = abs ? null : yv(B.floral, 'floral'), h = '';
      // zone du style (au style, toutes les familles ont leur haut de zone à mi-hauteur)
      if (!abs) h += '<rect data-role="zone" x="' + L + '" y="' + (T0 + H / 2) + '" width="' + (Rr - L) + '" height="' + (H / 2) + '" fill="#eceef2"/><text x="' + (L - 4) + '" y="' + (T0 + H / 2 + 4) + '" text-anchor="end">16D</text>';
      else h += '<rect data-role="zone" x="' + L + '" y="' + yv(30, 'citrus') + '" width="' + (Rr - L) + '" height="' + (T0 + H - yv(30, 'citrus')) + '" fill="#eceef2"/>';
      h += '<line x1="' + L + '" x2="' + Rr + '" y1="' + (T0 + H) + '" y2="' + (T0 + H) + '" stroke="#c9cdd6"/>';
      [[0, 'ébullition', 22], [1, 'WP', 48], [2, 'actif', 64], [3, 'après', 88]].forEach(function (l) { h += '<text x="' + (L + (Rr - L) * l[2] / 100) + '" y="' + (T0 + H + 16) + '" text-anchor="middle">' + l[1] + '</text>'; });
      [44, 52, 76].forEach(function (pc) { var x = L + (Rr - L) * pc / 100; h += '<line x1="' + x + '" x2="' + x + '" y1="' + T0 + '" y2="' + (IY + IH) + '" stroke="#e3e5eb"/>'; });
      var kwp = S.idx('wp');
      FAMS.forEach(function (f) {
        var pale = '', plein = '', pts = '';
        for (var k = 0; k <= N; k++) { var pt = X[k].toFixed(1) + ' ' + yv(D[k].v[f], f).toFixed(1); if (k <= kwp) pale += (pale ? 'L' : 'M') + pt; if (k >= kwp) plein += (plein ? 'L' : 'M') + pt; if (!D[k].interp && k < kwp) pts += '<circle cx="' + X[k].toFixed(1) + '" cy="' + yv(D[k].v[f], f).toFixed(1) + '" r="2.5" fill="' + S.BA[f] + '"/>'; }
        h += '<path d="' + pale + '" fill="none" stroke="' + S.BA[f] + '" stroke-opacity=".4" stroke-width="2" stroke-linejoin="round"/><path d="' + plein + '" fill="none" stroke="' + S.BA[f] + '" stroke-width="2.5" stroke-linejoin="round"/>' + pts;
      });
      // l'amertume
      h += '<rect x="' + L + '" y="' + yi(70) + '" width="' + (Rr - L) + '" height="' + (yi(50) - yi(70)) + '" fill="#eceef2"/><text x="' + (L - 4) + '" y="' + (yi(60) + 4) + '" text-anchor="end">IBU</text>';
      var pa = ''; for (k = 0; k <= N; k++) pa += (pa ? 'L' : 'M') + X[k].toFixed(1) + ' ' + yi(S.ibu(D[k]).n).toFixed(1);
      h += '<path d="' + pa + '" fill="none" stroke="#16161a" stroke-width="2" stroke-linejoin="round"/>';
      for (k = 0; k <= N; k++) if (S.ibu(D[k]).h) h += '<circle cx="' + X[k].toFixed(1) + '" cy="' + yi(S.ibu(D[k]).n).toFixed(1) + '" r="2.5" fill="#c2410c"/>';
      h += '<g id="a7-cur"></g>';
      svg.innerHTML = h; curseur();
    }
    var majB = S.barres(document.getElementById('a7-barres'));
    function curseur() {
      var p = D[i], x = X[i].toFixed(1), g = '<line x1="' + x + '" x2="' + x + '" y1="' + (T0 - 4) + '" y2="' + (IY + IH + 4) + '" stroke="#16161a" stroke-width="1.5"/>';
      FAMS.forEach(function (f) { g += '<circle cx="' + x + '" cy="' + yv(p.v[f], f).toFixed(1) + '" r="4.5" fill="#fff" stroke="' + S.BA[f] + '" stroke-width="2.5"/>'; });
      g += '<circle cx="' + x + '" cy="' + yi(S.ibu(p).n).toFixed(1) + '" r="4" fill="#fff" stroke="#16161a" stroke-width="2"/>';
      g += '<circle cx="' + x + '" cy="' + (T0 - 2) + '" r="5" fill="#e80030" data-couleur="#e80030" data-serie="Idaho 7"/>';
      document.getElementById('a7-cur').innerHTML = g;
    }
    function poser(n) {
      i = n; var p = D[i]; svg.setAttribute('aria-valuenow', i); svg.setAttribute('aria-valuetext', p.lib);
      document.getElementById('a7-mom').textContent = p.lib; document.getElementById('a7-fl').textContent = S.fmt(p, 'floral');
      var b = S.ibu(p), am = document.getElementById('a7-am'); am.textContent = b.t + ', ' + b.s; am.classList.toggle('a7-h', b.h);
      curseur(); majB(p);
    }
    function depuis(e) { var r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 352, best = 0, bd = 1e9; for (var k = 0; k <= N; k++) { var d = Math.abs(X[k] - x); if (d < bd) { bd = d; best = k; } } if (best !== i) poser(best); }
    var on = false;
    svg.addEventListener('pointerdown', function (e) { svg.setPointerCapture(e.pointerId); on = true; depuis(e); });
    svg.addEventListener('pointermove', function (e) { if (on) depuis(e); });
    svg.addEventListener('pointerup', function () { on = false; });
    svg.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') poser(Math.min(N, i + 1)); if (e.key === 'ArrowLeft') poser(Math.max(0, i - 1)); });
    S.surLecture(dessiner);
    dessiner(); poser(i);
  },
};
