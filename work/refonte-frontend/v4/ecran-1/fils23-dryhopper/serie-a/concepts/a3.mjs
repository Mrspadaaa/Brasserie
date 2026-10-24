// a3 · tiède · « Tirer vers le bas » : la brasserie en colonne, de la chaudière à la cuve au repos. Le moût
// descend ; on descend la pastille Idaho 7 avec lui. Plus bas = plus tard. La chaudière porte, à gauche,
// la zone où l'amertume sort du style. À droite, la réponse suit la pastille.
export default {
  id: 'a3', nom: 'Tirer vers le bas', chaleur: 'tiède', levure: 'pont',
  titre: 'Quand ajouter Idaho 7 ?',
  legende: ['Tire la pastille vers le bas : plus bas, plus tard.', 'Trait orangé le long de la colonne : amertume hors du style.', 'Barre : ta stout avec Idaho 7 ; rond : ta stout avant.', '~ simulé · ≈ interpolé · ? inconnu, hachuré.'],
  css: `
.a3-g { display:grid; grid-template-columns:128px 1fr; gap:8px; align-items:start; }
.a3-col { position:relative; background:#fff; border-radius:8px; touch-action:none; cursor:grab; }
.a3-st { position:absolute; left:6px; right:4px; display:flex; align-items:center; gap:4px; font-size:12px; font-weight:600; color:var(--encre); }
.a3-st svg { color:var(--gris); }
.a3-axe { position:absolute; left:36px; width:2px; background:#c9cdd6; border-radius:2px; }
.a3-am { position:absolute; left:30px; width:3px; background:var(--acc); border-radius:2px; }
.a3-cr { position:absolute; left:32px; width:10px; height:1px; background:#9da3af; }
.a3-cl { position:absolute; left:46px; font-size:12px; color:var(--gris); transform:translateY(-50%); }
.a3-pa { position:absolute; left:37px; width:24px; height:24px; margin:-12px 0 0 -12px; border-radius:50%; background:var(--i7); border:3px solid #fff; box-shadow:0 0 0 1px var(--i7); transition:top .16s cubic-bezier(.2,.8,.2,1); }
.a3-pl { position:absolute; left:16px; top:50%; transform:translateY(-50%); white-space:nowrap; background:var(--encre); color:#fff; font:600 13px var(--sans); padding:2px 8px; border-radius:11px; }
.a3-r { display:flex; flex-direction:column; gap:6px; position:sticky; top:6px; }
.a3-lu { display:flex; flex-direction:column; gap:2px; background:#fff; border-radius:8px; padding:8px 10px; }
.a3-mom { font-size:13px; color:var(--gris); }
.a3-fl { display:flex; align-items:center; gap:6px; font-size:22px; font-weight:700; color:#9840bc; }
.a3-ibu { font-size:14px; font-weight:600; }
.a3-ibu.a3-h { color:var(--acc); }
.a3-r .s-bloc { padding:6px 8px; gap:3px; }
.a3-r .s-ba { grid-template-columns:80px 1fr 32px; gap:4px; min-height:17px; font-size:12px; }
`,
  corps: `
<div class="a3-g">
  <div class="a3-lib" data-libre="moment"><div class="a3-col" id="a3-col" role="slider" tabindex="0" aria-label="Moment de l'ajout" aria-valuemin="0" aria-valuemax="23" aria-valuenow="16" aria-valuetext="actif · 3 j" data-sans-menu></div></div>
  <div class="a3-r">
    <div class="a3-lu" aria-live="polite"><span class="a3-mom">Face à ta stout, <b id="a3-mom">actif · 3 j</b></span><span class="a3-fl"><svg class="s-pi" width="20" height="20" style="width:20px;height:20px" data-famille="floral" aria-label="Floral"><use href="#p-floral"/></svg><span id="a3-fl" class="num">~+22</span></span><span class="a3-ibu" id="a3-ibu">60 IBU, tenue</span></div>
    <section class="s-bloc" id="a3-barres" aria-label="Familles d'arômes au style"></section>
    <p class="s-src"><span><b>mesuré</b> : Idaho 7 en cuve dès la levure, linalol 38 µg/L · McCabe 2023, E03</span></p>
  </div>
</div>`,
  script: function () {
    var S = window.S, D = S.D, N = S.N, col = document.getElementById('a3-col');
    var I = {
      ch: '<path d="M4 9h16v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3Z"/><path d="M2 9h20M9 5c0-1 1-1 1-2M14 5c0-1 1-1 1-2"/>',
      wp: '<path d="M12 12a2 2 0 1 1 2-2 4 4 0 1 1-4-4 6 6 0 1 1-6 6"/>',
      fe: '<path d="M6 3h12v10l-6 8-6-8Z"/><path d="M9 8c1 1 2-1 3 0s2-1 3 0"/>',
      re: '<path d="M6 3h12v10l-6 8-6-8Z"/><path d="M9 10h6"/>'
    };
    var ic = function (k) { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[k] + '</svg>'; };
    // Une ordonnée par moment : chaque station a son titre, puis ses crans.
    var Y = [], y = 28, h = '';
    var stations = [['ch', 'ébullition', function (p) { return p.id.charAt(0) === 'b'; }, 19], ['wp', 'whirlpool', function (p) { return p.id === 'wp'; }, 24], ['fe', 'fermentation', function (p) { return p.id.indexOf('dryActive') === 0; }, 24], ['re', 'après', function (p) { return p.id.indexOf('dryPost') === 0; }, 24]];
    stations.forEach(function (s) {
      h += '<span class="a3-st" style="top:' + (y - 22) + 'px">' + ic(s[0]) + s[1] + '</span>';
      var deb = y;
      for (var k = 0; k <= N; k++) if (s[2](D[k])) { Y[k] = y + 6; y += s[3]; }
      h += '<i class="a3-axe" style="top:' + deb + 'px;height:' + (y - deb) + 'px"></i>';
      y += 30;
    });
    col.style.height = (y - 18) + 'px';
    var MARQ = { b60: '60′', b30: '30′', b10: '10′', b0: '0′', 'dryActive|1': '1 j', 'dryActive|3': '3 j', 'dryActive|7': '7 j', 'dryPost|1': '1 j', 'dryPost|3': '3 j', 'dryPost|7': '7 j' };
    for (var k = 0; k <= N; k++) { h += '<i class="a3-cr" style="top:' + Y[k] + 'px"></i>'; if (MARQ[D[k].id]) h += '<span class="a3-cl" style="top:' + Y[k] + 'px">' + MARQ[D[k].id] + '</span>'; }
    var deb = null; for (k = 0; k <= N + 1; k++) { var t = k <= N && S.ibu(D[k]).h; if (t && deb == null) deb = k; if (!t && deb != null) { h += '<i class="a3-am" style="top:' + (Y[deb] - 6) + 'px;height:' + (Y[k - 1] - Y[deb] + 12) + 'px"></i>'; deb = null; } }
    h += '<span class="a3-pa" id="a3-pa" data-couleur="#e80030" data-serie="Idaho 7"><span class="a3-pl" id="a3-pl">actif · 3 j</span></span>';
    col.innerHTML = h;
    var majB = S.barres(document.getElementById('a3-barres')), i = S.depart();
    function poser(k) {
      i = k; var p = D[i]; col.setAttribute('aria-valuenow', i); col.setAttribute('aria-valuetext', p.lib);
      document.getElementById('a3-pa').style.top = Y[i] + 'px'; document.getElementById('a3-pl').textContent = p.court === 'wp' ? 'WP' : p.court;
      document.getElementById('a3-mom').textContent = p.lib; document.getElementById('a3-fl').textContent = S.fmt(p, 'floral');
      var b = S.ibu(p), e = document.getElementById('a3-ibu'); e.textContent = b.t + ', ' + b.s; e.classList.toggle('a3-h', b.h);
      majB(p);
    }
    function depuis(ev) { var yy = ev.clientY - col.getBoundingClientRect().top, best = 0, bd = 1e9; for (var k = 0; k <= N; k++) { var d = Math.abs(Y[k] - yy); if (d < bd) { bd = d; best = k; } } if (best !== i) poser(best); }
    var tient = false;
    col.addEventListener('pointerdown', function (e) { col.setPointerCapture(e.pointerId); tient = true; depuis(e); });
    col.addEventListener('pointermove', function (e) { if (tient) depuis(e); });
    col.addEventListener('pointerup', function () { tient = false; });
    col.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); poser(Math.min(N, i + 1)); } if (e.key === 'ArrowUp') { e.preventDefault(); poser(Math.max(0, i - 1)); } });
    poser(i);
  },
};
