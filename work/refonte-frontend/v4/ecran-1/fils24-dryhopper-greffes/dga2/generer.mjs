// dga2 · tiède · « Le graphique est la frise ». Base : l'écran Dryhopper de la maquette jouable, tel quel. Greffe : la
// frise de y1b retravaillée en axe du graphique. Plus de rail à part : le pouce glisse sur le graphique lui-même (ou sur
// la frise), le jeton nommé d'Idaho 7 suit le trait du doigt sous l'axe ; dessous, les minutes et les jours de contact.
// Sous le doigt, la frise s'ouvre en œil de poisson (le dock d'Apple) : chaque moment voisin y a son étiquette, écartée et
// grossie ; c'est la loupe. Régénérer : node generer.mjs. Classes dga2- (L26).
import { variante } from '../dga1/socle-dga.mjs';

variante({
  id: 'dga2', nom: 'Le graphique est la frise', chaleur: 'tiède', apres: '.pq-dry-jr',
  gabarit: `
<div class="dga2-frise" id="dga2-frise" data-greffe="frise-y1b" data-acquis="geste" data-booster="frise" data-libre="moment" role="slider" tabindex="0" data-pas="5" aria-valuemin="0" aria-valuemax="23" aria-label="Moment de l'ajout d'Idaho 7">
  <div class="dga2-jeton" id="dga2-jeton" data-serie="Idaho 7" data-couleur="#e80030"><i class="dga2-pt"></i><b>Idaho 7</b><span id="dga2-jt"></span></div>
  <div class="dga2-nums" id="dga2-nums"></div>
</div>`,
  css: `
.dga2 .pq-dry-svg { touch-action:none; cursor:ew-resize; }
.dga2-frise { position:relative; height:58px; margin-top:4px; touch-action:none; cursor:ew-resize; outline:none; user-select:none; -webkit-user-select:none; }
.dga2-jeton { position:absolute; top:4px; height:26px; display:inline-flex; align-items:center; gap:5px; padding:0 10px; border-radius:13px; background:#16161a; color:#fff; font:700 14px 'Source Sans 3', system-ui, sans-serif; white-space:nowrap; transform:translateX(-50%); }
.dga2-jeton span { font:600 14px 'IBM Plex Mono', ui-monospace, monospace; }
.dga2-pt { width:10px; height:10px; border-radius:50%; background:#e80030; border:1.5px solid #fff; }
.dga2-jeton::before { content:""; position:absolute; left:var(--bec, 50%); top:-5px; margin-left:-5px; border:5px solid transparent; border-top:0; border-bottom-color:#16161a; }
.dga2-nums { position:absolute; left:0; right:0; top:36px; height:20px; }
.dga2-nums span { position:absolute; bottom:0; transform:translateX(-50%) scale(var(--g, 1)); transform-origin:50% 100%; font:600 13px 'IBM Plex Mono', ui-monospace, monospace; color:#55555f; white-space:nowrap; transition:transform .09s ease-out, left .09s ease-out, opacity .09s; }
.dga2-nums span.dga2-z2 { color:#3b5f8a; }
.dga2-nums span.dga2-sg { color:#9aa0ab; font-weight:400; text-decoration:underline dashed 1px; text-underline-offset:3px; }
.dga2-nums span.dga2-on { color:#16161a; font-weight:700; text-decoration:underline 2px; text-underline-offset:3px; }
`,
  script: function (B) {
    var M = B.M, N = M.length - 1;
    document.querySelectorAll('[data-greffe] [role=slider], [data-greffe][role=slider]').forEach(function (e) { e.setAttribute('aria-valuemax', N); });
    var frise = document.getElementById('dga2-frise'), svg = document.querySelector('.pq-dry-svg'), nums = document.getElementById('dga2-nums'), jeton = document.getElementById('dga2-jeton');
    // Au repos : les minutes par 15′, WP, puis les jours de contact (bleus quand la levure travaille).
    // Sous le doigt : œil de poisson ; chaque moment a son étiquette, écartée ×6 autour du doigt, grossie ; loin, elle s'efface.
    var REPOS = { '60′': 1, '45′': 1, '30′': 1, '15′': 1, '0′': 1, whirlpool: 1 }, h = '';
    M.forEach(function (m, k) { if (m.seg >= 2 && !(m.seg === 3 && m.jours === 1)) REPOS[m.lib] = 1; });
    M.forEach(function (m, k) { h += '<span data-k="' + k + '" class="' + (m.seg === 2 ? 'dga2-z2' : '') + (m.sg ? ' dga2-sg' : '') + '" style="left:' + B.x(k) + '%">' + (m.seg >= 2 ? String(m.jours) : m.court) + '</span>'; });
    nums.innerHTML = h;
    function nom(m) { return m.seg >= 2 ? (m.seg === 2 ? 'actif ' : 'après ') + m.jours + ' j' : m.court; }
    var touche = false, doigtX = null, F5 = 5;
    function grossir() {
      var r = frise.getBoundingClientRect(), W = r.width, xf = doigtX == null ? null : Math.max(0, Math.min(W, doigtX - r.left)), i = B.cur();
      nums.querySelectorAll('span').forEach(function (s) {
        var k = +s.dataset.k, x = B.x(k) / 100 * W;
        if (!touche || xf == null) { s.style.left = B.x(k) + '%'; s.style.setProperty('--g', 1); s.style.opacity = REPOS[M[k].lib] || k === i ? 1 : 0; return; }
        var d = x - xf, R = d < 0 ? Math.max(1, xf) : Math.max(1, W - xf), t = Math.min(1, Math.abs(d) / R);
        var F = R * (F5 + 1) * t / (F5 * t + 1), dF = (F5 + 1) / Math.pow(F5 * t + 1, 2), pas = dF * W * 0.034;
        s.style.left = (xf + (d < 0 ? -F : F)) + 'px';
        s.style.setProperty('--g', Math.max(0.8, Math.min(1.3, 0.75 + 0.12 * dF)).toFixed(2));
        s.style.opacity = pas >= 30 || k === i ? 1 : pas >= 22 ? 0.4 : 0;
      });
    }
    function dessiner(i) {
      var m = M[i], w = frise.clientWidth, jw = jeton.offsetWidth, x = B.x(i) / 100 * w, cx = Math.max(jw / 2 - 8, Math.min(w - jw / 2 + 8, x));
      document.getElementById('dga2-jt').textContent = nom(m);
      jeton.style.left = cx + 'px'; jeton.style.setProperty('--bec', (x - cx + jw / 2) + 'px');
      nums.querySelectorAll('span').forEach(function (s) { s.classList.toggle('dga2-on', +s.dataset.k === i); });
      frise.setAttribute('aria-valuenow', i); frise.setAttribute('aria-valuetext', m.lib);
      grossir();
    }
    B.quand(function (i) { dessiner(i); });
    function depuis(e) {
      var r = svg.getBoundingClientRect(), pct = (e.clientX - r.left) / r.width * 100, bi = 0, bd = 1e9;
      doigtX = e.clientX;
      for (var k = 0; k <= N; k++) { var d = Math.abs(B.x(k) - pct); if (d < bd) { bd = d; bi = k; } }
      if (bi !== B.cible) B.aller(bi);
      grossir();
    }
    [svg, frise].forEach(function (el) {
      el.addEventListener('pointerdown', function (e) { el.setPointerCapture(e.pointerId); touche = true; depuis(e); });
      el.addEventListener('pointermove', function (e) { if (touche) depuis(e); });
      var fin = function () { touche = false; doigtX = null; grossir(); };
      el.addEventListener('pointerup', fin); el.addEventListener('pointercancel', fin);
    });
    frise.addEventListener('keydown', function (e) { var i = B.cur(); if (e.key === 'ArrowRight') { e.preventDefault(); B.aller(Math.min(N, i + 1)); } if (e.key === 'ArrowLeft') { e.preventDefault(); B.aller(Math.max(0, i - 1)); } });
    window.DGA_GESTE = function () {
      var r = svg.getBoundingClientRect(), y = r.top + r.height * 0.55, x = function (k) { return r.left + r.width * B.x(k) / 100; };
      return [[x(B.cur()), y], [x(B.idx('whirlpool')), y], [x(B.idx('15′')), y]];
    };
  },
});
