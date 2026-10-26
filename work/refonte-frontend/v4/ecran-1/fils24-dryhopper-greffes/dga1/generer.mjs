// dga1 · froide · « La frise sous le pouce ». Base : l'écran Dryhopper de la maquette jouable, tel quel. Greffe : la frise
// de y1b (en bas, sous le pouce : le houblon en jeton nommé, glissé sur le brassin), retravaillée : calée au pixel sous
// le graphique (le jeton tombe à l'aplomb du trait du doigt), les minutes et les jours écrits sous leurs crans, la loupe
// au-dessus de la frise pendant le geste. Les jours de contact sont des crans de la frise : la rangée « 1 j 2 j 3 j 7 j »
// s'y fond (5 j compris). Régénérer : node generer.mjs. Classes dga1- (L26).
import { variante } from './socle-dga.mjs';

variante({
  id: 'dga1', nom: 'La frise sous le pouce', chaleur: 'froide', apres: '.pq-dry-bars',
  gabarit: `
<div class="dga1-dock" id="dga1-dock" data-greffe="frise-y1b" data-acquis="geste" data-booster="frise" data-libre="moment">
  <div class="dga1-loupe" id="dga1-loupe" aria-hidden="true"></div>
  <div class="dga1-piste" id="dga1-piste" role="slider" tabindex="0" data-pas="5" aria-valuemin="0" aria-valuemax="23" aria-label="Moment de l'ajout d'Idaho 7">
    <div class="dga1-rail" id="dga1-rail"></div>
    <div class="dga1-nums" id="dga1-nums"></div>
    <i class="dga1-tige" id="dga1-tige"></i>
    <div class="dga1-jeton" id="dga1-jeton" data-serie="Idaho 7" data-couleur="#e80030"><i class="dga1-pt"></i><b>Idaho 7</b><span id="dga1-jt"></span></div>
  </div>
</div>`,
  css: `
.dga1-dock { position:relative; height:66px; margin:2px -8px 0; background:#fff; border-top:1px solid #d5d8df; border-bottom:1px solid #d5d8df; box-shadow:0 -10px 22px -18px rgba(22,22,26,.5); touch-action:none; user-select:none; -webkit-user-select:none; }
.dga1-piste { position:absolute; top:0; bottom:0; cursor:pointer; outline:none; }
.dga1-jeton { position:absolute; top:4px; height:26px; display:inline-flex; align-items:center; gap:6px; padding:0 11px; border-radius:13px; background:#16161a; color:#fff; font:700 14px 'Source Sans 3', system-ui, sans-serif; white-space:nowrap; box-shadow:0 0 0 3px #fff, 0 0 0 4px #16161a; transform:translateX(-50%); }
.dga1-jeton span { font:600 14px 'IBM Plex Mono', ui-monospace, monospace; }
.dga1-pt { width:10px; height:10px; border-radius:50%; background:#e80030; border:1.5px solid #fff; }
.dga1-tige { position:absolute; top:30px; width:2px; height:6px; margin-left:-1px; background:#16161a; }
.dga1-rail { position:absolute; left:0; right:0; top:34px; height:14px; }
.dga1-z { position:absolute; top:5px; height:4px; border-radius:2px; background:#c9cdd6; }
.dga1-z.dga1-z2 { background:#9fb3cc; }
.dga1-cr { position:absolute; top:2px; width:1px; height:10px; background:#8a8f9c; }
.dga1-cr.dga1-c { width:2px; margin-left:-1px; background:#16161a; }
.dga1-cr.dga1-on { top:-2px; height:18px; width:3px; margin-left:-1.5px; background:#16161a; }
.dga1-nums { position:absolute; left:0; right:0; top:48px; height:18px; }
.dga1-nums span { position:absolute; transform:translateX(-50%); font:600 13px 'IBM Plex Mono', ui-monospace, monospace; color:#55555f; white-space:nowrap; }
.dga1-nums span.dga1-z2 { color:#3b5f8a; }
.dga1-nums span.dga1-sg { color:#9aa0ab; font-weight:400; text-decoration:underline dashed 1px; text-underline-offset:3px; }
.dga1-nums span.dga1-on { color:#16161a; font-weight:700; }
.dga1-loupe span small.dga1-sgl { color:#55555f; font-weight:400; font-size:12px; }
.dga1-loupe { position:absolute; left:8px; right:8px; bottom:calc(100% + 6px); height:66px; display:none; background:#fff; border:1px solid #c9cad2; border-radius:8px; box-shadow:0 10px 26px -12px rgba(22,22,26,.45); overflow:hidden; z-index:30; }
.dga1-touche .dga1-loupe { display:block; }
.dga1-loupe span { position:absolute; top:6px; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; gap:3px; font:600 13px 'IBM Plex Mono', ui-monospace, monospace; color:#55555f; }
.dga1-loupe span em { font-style:normal; }
.dga1-loupe span.dga1-ici em { font-size:20px; color:#16161a; font-weight:700; }
.dga1-loupe span i { display:block; width:38px; height:6px; background:#f1f2f5; border-radius:2px; position:relative; overflow:hidden; }
.dga1-loupe span i b { position:absolute; left:0; top:0; bottom:0; background:#bf86d6; }
.dga1-loupe span small { font:700 13px 'IBM Plex Mono', ui-monospace, monospace; color:#9840bc; }
.dga1-loupe span.dga1-ip i b { opacity:.5; }
`,
  script: function (B) {
    var M = B.M, N = M.length - 1;
    document.querySelectorAll('[data-greffe] [role=slider], [data-greffe][role=slider]').forEach(function (e) { e.setAttribute('aria-valuemax', N); });
    var dock = document.getElementById('dga1-dock'), piste = document.getElementById('dga1-piste'), rail = document.getElementById('dga1-rail');
    var nums = document.getElementById('dga1-nums'), jeton = document.getElementById('dga1-jeton'), tige = document.getElementById('dga1-tige'), loupe = document.getElementById('dga1-loupe');
    // La frise : quatre zones, un cran par moment (épais quand le moteur l'a simulé), les minutes et les jours écrits.
    var h = '';
    [[0, 44], [44, 52], [52, 76], [76, 100]].forEach(function (s, n) { h += '<span class="dga1-z dga1-z' + n + '" style="left:' + (s[0] + 0.6) + '%;width:' + (s[1] - s[0] - 1.2) + '%"></span>'; });
    M.forEach(function (m, k) { h += '<i class="dga1-cr' + (m.interp ? '' : ' dga1-c') + '" data-k="' + k + '" style="left:' + B.x(k) + '%"></i>'; });
    rail.innerHTML = h;
    var ECRIT = { '60′': 1, '45′': 1, '30′': 1, '15′': 1, '0′': 1 }, n2 = '';
    M.forEach(function (m, k) {
      var t = ECRIT[m.lib] ? m.lib : m.seg === 1 ? 'WP' : m.seg >= 2 ? String(m.jours) : null;
      if (t) n2 += '<span data-k="' + k + '" class="' + (m.seg === 2 ? 'dga1-z2' : '') + (m.sg ? ' dga1-sg' : '') + '" style="left:' + B.x(k) + '%">' + t + '</span>';
    });
    nums.innerHTML = n2;
    // Calée au pixel sous le graphique de la maquette : le jeton tombe à l'aplomb du trait du doigt.
    function caler() { var r = document.querySelector('.pq-dry-svg').getBoundingClientRect(), d = dock.getBoundingClientRect(); piste.style.left = (r.left - d.left) + 'px'; piste.style.width = r.width + 'px'; }
    caler(); window.addEventListener('resize', caler);
    function nom(m) { return m.seg >= 2 ? (m.seg === 2 ? 'actif ' : 'après ') + m.jours + ' j' : m.court; }
    var a7 = B.idx('actif · 7 j'), p1 = B.idx('après · 1 j');
    function dessiner(i) {
      var m = M[i], x = B.x(i);
      document.getElementById('dga1-jt').textContent = nom(m);
      var w = piste.clientWidth, jw = jeton.offsetWidth, cx = x / 100 * w, g = -piste.offsetLeft + 6, dr = dock.clientWidth - piste.offsetLeft - 6;
      jeton.style.left = Math.max(g + jw / 2, Math.min(dr - jw / 2, cx)) + 'px'; tige.style.left = x + '%';
      rail.querySelectorAll('.dga1-cr').forEach(function (c) { c.classList.toggle('dga1-on', +c.dataset.k === i); });
      nums.querySelectorAll('span').forEach(function (s) { var k = +s.dataset.k; s.classList.toggle('dga1-on', k === i); s.style.visibility = (k === p1 && i !== p1) || (k === a7 && i === p1) ? 'hidden' : ''; });
      piste.setAttribute('aria-valuenow', i); piste.setAttribute('aria-valuetext', m.lib);
      if (dock.classList.contains('dga1-touche')) loupeDe(i);
    }
    function loupeDe(i) {
      var wl = loupe.clientWidth, o = '';
      for (var k = i - 2; k <= i + 2; k++) {
        if (k < 0 || k > N) continue; var m = M[k];
        o += '<span class="' + (k === i ? 'dga1-ici' : '') + (m.interp ? ' dga1-ip' : '') + '" style="left:' + (wl / 2 + (k - i) * 70) + 'px"><em>' + nom(m) + '</em><i><b style="width:' + Math.min(100, (m.flv || 0) / 25 * 100).toFixed(0) + '%"></b></i>' + (m.sg ? '<small class="dga1-sgl">sans gain</small>' : '<small>' + m.fl + '</small>') + '</span>';
      }
      loupe.innerHTML = o;
    }
    B.quand(function (i) { dessiner(i); });
    var vise = null;
    function depuis(e) { var r = piste.getBoundingClientRect(), pct = (e.clientX - r.left) / r.width * 100, bi = 0, bd = 1e9; for (var k = 0; k <= N; k++) { var d = Math.abs(B.x(k) - pct); if (d < bd) { bd = d; bi = k; } } if (bi !== vise) { vise = bi; B.aller(bi); } }
    dock.addEventListener('pointerdown', function (e) { dock.setPointerCapture(e.pointerId); dock.classList.add('dga1-touche'); vise = null; depuis(e); loupeDe(B.cur()); });
    dock.addEventListener('pointermove', function (e) { if (dock.classList.contains('dga1-touche')) depuis(e); });
    var fin = function () { dock.classList.remove('dga1-touche'); };
    dock.addEventListener('pointerup', fin); dock.addEventListener('pointercancel', fin);
    piste.addEventListener('keydown', function (e) { var i = B.cur(); if (e.key === 'ArrowRight') { e.preventDefault(); B.aller(Math.min(N, i + 1)); } if (e.key === 'ArrowLeft') { e.preventDefault(); B.aller(Math.max(0, i - 1)); } });
    window.DGA_GESTE = function () {
      var r = piste.getBoundingClientRect(), y = r.top + 42, x = function (k) { return r.left + r.width * B.x(k) / 100; };
      return [[x(B.cur()), y], [x(B.idx('whirlpool')), y], [x(B.idx('20′')), y]];
    };
  },
});
