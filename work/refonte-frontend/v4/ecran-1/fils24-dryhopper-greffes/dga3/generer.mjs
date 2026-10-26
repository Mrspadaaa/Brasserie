// dga3 · tiède · « Le tambour ». Base : l'écran Dryhopper de la maquette jouable, tel quel. Greffe : la frise de y1b
// retravaillée en tambour (le sélecteur d'heure d'un téléphone, couché) : le houblon reste au repère du milieu, c'est la
// frise du brassin qui défile sous le pouce. Chaque moment y a sa case lisible (minute ou jour de contact, le floral gagné
// en barre et en chiffre, lu sur le moteur de la maquette), la case du repère en grand ; les étapes en bande dessous, la
// levure au travail en bleu. La loupe est permanente. Régénérer : node generer.mjs. Classes dga3- (L26).
import { variante } from '../dga1/socle-dga.mjs';

variante({
  id: 'dga3', nom: 'Le tambour', chaleur: 'tiède', apres: '.pq-dry-jr',
  gabarit: `
<div class="dga3-tb" id="dga3-tb" data-greffe="frise-y1b" data-acquis="geste" data-booster="frise" data-libre="moment" role="slider" tabindex="0" data-pas="5" aria-valuemin="0" aria-valuemax="23" aria-label="Moment de l'ajout d'Idaho 7">
  <div class="dga3-piste" id="dga3-piste"></div>
  <div class="dga3-voile"></div><i class="dga3-cran"></i><span class="dga3-etq" id="dga3-etq"></span>
  <div class="dga3-repere" aria-hidden="true"><i class="dga3-pt"></i><b>Idaho 7</b></div>
</div>`,
  css: `
.dga3-tb { position:relative; height:88px; margin:4px -10px 0; overflow:hidden; touch-action:none; cursor:grab; outline:none; user-select:none; -webkit-user-select:none; background:#fff; }
.dga3-voile { position:absolute; inset:22px 0 0; z-index:1; pointer-events:none; background:linear-gradient(90deg,#fff 0,rgba(255,255,255,0) 18%,rgba(255,255,255,0) 82%,#fff 100%); }
.dga3-piste { position:absolute; left:0; top:24px; height:64px; display:flex; will-change:transform; z-index:0; }
.dga3-piste:not(.dga3-glisse) { transition:transform .16s cubic-bezier(.2,.8,.2,1); }
.dga3-c { position:relative; width:48px; flex:0 0 48px; display:flex; flex-direction:column; align-items:center; gap:3px; }
.dga3-c em { font:600 13px 'IBM Plex Mono', ui-monospace, monospace; font-style:normal; color:#55555f; height:22px; display:flex; align-items:flex-end; white-space:nowrap; }
.dga3-c i { display:block; width:34px; height:5px; background:#f1f2f5; border-radius:2px; position:relative; overflow:hidden; }
.dga3-c i b { position:absolute; left:0; top:0; bottom:0; background:#bf86d6; }
.dga3-c small { font:700 12px 'IBM Plex Mono', ui-monospace, monospace; color:#9840bc; }
.dga3-c.dga3-ip i b { opacity:.5; }
.dga3-c small.dga3-sgl { color:#55555f; font-weight:400; font-size:12px; font-family:'Source Sans 3', system-ui, sans-serif; }
.dga3-c.dga3-sgc i b { opacity:.35; }
.dga3-c.dga3-p1 em { font-size:16px; color:#16161a; }
.dga3-c.dga3-ici { background:#f7f8fa; border-radius:4px 4px 0 0; }
.dga3-c.dga3-ici em { font-size:22px; font-weight:700; color:#16161a; }
.dga3-c.dga3-ici small { font-size:14px; }
.dga3-c::after { content:""; position:absolute; left:0; right:0; bottom:0; height:16px; background:#e2e5eb; }
.dga3-c.dga3-s1::after { background:#d5d8df; }
.dga3-c.dga3-s2::after { background:#d6e0ee; }
.dga3-c.dga3-s3::after { background:#e9ebef; }
.dga3-c.dga3-deb::before { content:attr(data-etape); position:absolute; left:4px; bottom:0; height:16px; line-height:16px; z-index:1; font:600 12px 'Source Sans 3', system-ui, sans-serif; color:#55555f; white-space:nowrap; }
.dga3-c.dga3-s2.dga3-deb::before { color:#3b5f8a; }
.dga3-c.dga3-tait::before { visibility:hidden; }
.dga3-cran { position:absolute; left:50%; bottom:0; width:3px; height:16px; margin-left:-1.5px; background:#16161a; z-index:2; pointer-events:none; }
.dga3-etq { position:absolute; left:calc(50% + 6px); bottom:0; height:16px; line-height:16px; z-index:2; pointer-events:none; font:700 12px 'Source Sans 3', system-ui, sans-serif; color:#16161a; white-space:nowrap; }
.dga3-repere { position:absolute; left:50%; top:0; transform:translateX(-50%); display:inline-flex; align-items:center; gap:5px; height:22px; padding:0 9px; border-radius:11px; background:#16161a; color:#fff; font:700 13px 'Source Sans 3', system-ui, sans-serif; white-space:nowrap; z-index:2; pointer-events:none; }
.dga3-repere::after { content:""; position:absolute; left:50%; top:21px; margin-left:-5px; border:5px solid transparent; border-bottom:0; border-top-color:#16161a; }
.dga3-pt { width:9px; height:9px; border-radius:50%; background:#e80030; border:1.5px solid #fff; }
`,
  script: function (B) {
    var M = B.M, N = M.length - 1, CW = 48;
    document.querySelectorAll('[data-greffe] [role=slider], [data-greffe][role=slider]').forEach(function (e) { e.setAttribute('aria-valuemax', N); });
    var tb = document.getElementById('dga3-tb'), piste = document.getElementById('dga3-piste');
    var ETAPE = ['ébullition', 'WP', 'actif · levure', 'après'];
    piste.innerHTML = M.map(function (m, k) {
      var deb = k === 0 || M[k - 1].seg !== m.seg;
      return '<div class="dga3-c dga3-s' + m.seg + (deb ? ' dga3-deb' : '') + (m.interp ? ' dga3-ip' : '') + (m.sg ? ' dga3-sgc' : '') + '" data-k="' + k + '" data-etape="' + ETAPE[m.seg] + '"><em>' + m.court + '</em><i><b style="width:' + Math.min(100, (m.flv || 0) / 25 * 100).toFixed(0) + '%"></b></i>' + (m.sg ? '<small class="dga3-sgl">sans gain</small>' : '<small>' + m.fl + '</small>') + '</div>';
    }).join('');
    var cases = piste.querySelectorAll('.dga3-c');
    function base(i) { return tb.clientWidth / 2 - (i + 0.5) * CW; }
    function dessiner(i, dx) {
      piste.style.transform = 'translateX(' + (base(i) + (dx || 0)) + 'px)';
      var se = M[i].seg; document.getElementById('dga3-etq').textContent = ETAPE[se];
      cases.forEach(function (c) { var k = +c.dataset.k; c.classList.toggle('dga3-tait', M[k].seg === se); c.classList.toggle('dga3-ici', k === i); c.classList.toggle('dga3-p1', Math.abs(k - i) === 1); c.style.visibility = Math.abs(k - i) > 5 ? 'hidden' : ''; });
      tb.setAttribute('aria-valuenow', i); tb.setAttribute('aria-valuetext', M[i].lib);
    }
    B.quand(function (i) { if (!glisse) dessiner(i); });
    // Le geste : la frise suit le pouce au pixel ; le cran sous le repère se pose à chaque case franchie ; au lever, elle se cale.
    var glisse = false, x0 = 0, i0 = 0, bouge = false, vise = 0;
    tb.addEventListener('pointerdown', function (e) { tb.setPointerCapture(e.pointerId); glisse = true; bouge = false; x0 = e.clientX; i0 = vise = B.cur(); piste.classList.add('dga3-glisse'); });
    tb.addEventListener('pointermove', function (e) {
      if (!glisse) return; var dx = e.clientX - x0; if (Math.abs(dx) > 4) bouge = true;
      var i = Math.max(0, Math.min(N, Math.round(i0 - dx / CW)));
      if (i !== vise) { vise = i; B.aller(i); }
      dessiner(i, dx - (i0 - i) * CW);
    });
    function fin(e) {
      if (!glisse) return; glisse = false; piste.classList.remove('dga3-glisse');
      if (!bouge) { var c = document.elementFromPoint(e.clientX, e.clientY); c = c && c.closest ? c.closest('.dga3-c') : null; if (c) { vise = +c.dataset.k; B.aller(vise); } }
      dessiner(vise);
    }
    tb.addEventListener('pointerup', fin); tb.addEventListener('pointercancel', fin);
    tb.addEventListener('keydown', function (e) { var i = B.cur(); if (e.key === 'ArrowRight') { e.preventDefault(); B.aller(Math.min(N, i + 1)); } if (e.key === 'ArrowLeft') { e.preventDefault(); B.aller(Math.max(0, i - 1)); } });
    window.DGA_GESTE = function () { var r = tb.getBoundingClientRect(), y = r.top + 50; return [[r.left + 20, y], [r.left + 20 + 3.5 * CW, y], [r.left + 20 + 7.2 * CW, y]]; };
  },
});
