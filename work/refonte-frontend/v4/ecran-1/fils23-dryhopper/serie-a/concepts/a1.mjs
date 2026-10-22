// a1 · froide · « Le rail sous le pouce » : y1b et l'écran de la carte, affinés. Le dock du brassin au bas
// de l'écran ; au-dessus du rail, un relief qui montre où le floral monte et où l'amertume sort du style,
// avant même de glisser.
import { I_SABLIER } from '../socle.mjs';

export default {
  id: 'a1', nom: 'Le rail sous le pouce', chaleur: 'froide', levure: 'pont',
  titre: 'Quand ajouter Idaho 7 ?',
  legende: ['Barre : ta stout avec Idaho 7 ; rond : ta stout avant.', 'Au-dessus du rail : violet, le floral à ce moment ; trait orangé, amertume hors du style.', '~ simulé · ≈ interpolé entre deux points calculés · ? inconnu, hachuré.', 'Glisse le pouce : la loupe grossit les moments voisins.'],
  css: `
body.a1 { padding-bottom:132px; }
.a1-rep { display:flex; flex-wrap:wrap; align-items:center; gap:4px 8px; font-size:16px; }
.a1-rep .a1-face { font-weight:600; }
.a1-fl { display:inline-flex; align-items:center; gap:4px; color:#9840bc; font-weight:700; }
.a1-am { font-weight:600; }
.a1-am.a1-h { color:var(--acc); }
.a1-res { font-size:12px; color:var(--gris); }
.a1-dock { position:fixed; left:50%; bottom:0; transform:translateX(-50%); width:min(390px,100%); background:#fff; border-top:1px solid var(--trait); box-shadow:0 -12px 40px -16px rgba(22,22,26,.35); padding:6px 18px 8px; z-index:20; touch-action:none; }
.a1-relief { position:relative; height:30px; }
.a1-relief i { position:absolute; bottom:4px; width:5px; margin-left:-2.5px; background:#bf86d6; border-radius:2px 2px 0 0; }
.a1-relief i.a1-ip { opacity:.5; }
.a1-relief b { position:absolute; bottom:0; height:3px; background:var(--acc); border-radius:2px; }
.a1-rail { position:relative; height:22px; cursor:pointer; }
.a1-z { position:absolute; top:8px; height:6px; border-radius:2px; background:#c9cdd6; }
.a1-z.a1-z1, .a1-z.a1-z3 { background:#aeb4c1; }
.a1-cran { position:absolute; top:4px; width:1px; height:14px; background:var(--encre); }
.a1-pouce { position:absolute; top:1px; width:20px; height:20px; margin-left:-10px; border-radius:50%; background:var(--encre); border:3px solid #fff; box-shadow:0 0 0 1px var(--encre); }
.a1-pl { position:absolute; bottom:26px; left:50%; transform:translateX(-50%); white-space:nowrap; display:inline-flex; align-items:center; gap:5px; background:var(--encre); color:#fff; font:600 13px var(--sans); padding:2px 9px; border-radius:11px; }
.a1-pl .s-pt { border:1.5px solid #fff; }
.a1-sauts { position:relative; height:28px; margin-top:2px; }
.a1-sauts button { position:absolute; top:0; transform:translateX(-50%); height:26px; padding:0 6px; font-size:13px; color:var(--gris); border-radius:13px; }
.a1-sauts button[aria-current="true"] { color:var(--encre); font-weight:700; }
.a1-loupe { position:absolute; left:8px; right:8px; top:-44px; height:38px; display:none; background:#fff; border:1px solid #c9cad2; border-radius:8px; overflow:hidden; box-shadow:0 8px 24px -12px rgba(22,22,26,.4); }
.a1-dock.a1-touche .a1-loupe { display:block; }
.a1-dock.a1-touche .a1-pl { visibility:hidden; }
.a1-loupe span { position:absolute; top:5px; transform:translateX(-50%); font:600 13px var(--mono); color:var(--gris); }
.a1-loupe span.a1-ici { color:#fff; background:var(--encre); padding:1px 6px; border-radius:4px; }
`,
  corps: `
<p class="a1-rep" aria-live="polite"><span class="a1-face">Face à ta stout</span><span class="a1-fl"><svg class="s-pi" width="18" height="18" style="width:18px;height:18px" data-famille="floral" aria-label="Floral"><use href="#p-floral"/></svg><span id="a1-fl" class="num">~+22</span></span><span id="a1-am" class="a1-am">amertume tenue</span></p>
<section class="s-bloc" id="a1-barres" aria-label="Familles d'arômes au style"></section>
<p class="a1-res">Résineux déjà hors du style : ta dégustation du 18.10.</p>
<div class="s-bloc"><div id="a1-jauge"></div><p class="s-src">${I_SABLIER}<span><b>mesuré</b> : l'essentiel passe en 2 j de contact · Schmidt 2019, E08</span></p></div>
<div class="a1-dock" data-libre="moment">
  <div class="a1-loupe" aria-hidden="true"></div>
  <div class="a1-relief" aria-hidden="true"></div>
  <div class="a1-rail" role="slider" tabindex="0" aria-label="Moment de l'ajout" aria-valuemin="0" aria-valuemax="23" aria-valuenow="16" aria-valuetext="actif · 3 j">
    <span class="a1-z a1-z0" style="left:0;width:44%"></span><span class="a1-z a1-z1" style="left:44%;width:8%"></span><span class="a1-z a1-z2" style="left:52%;width:24%"></span><span class="a1-z a1-z3" style="left:76%;width:24%"></span>
    <span class="a1-pouce"><span class="a1-pl"><i class="s-pt"></i><span id="a1-pl">actif · 3 j</span></span></span>
  </div>
  <div class="a1-sauts"><button type="button" data-saut="b60">60′</button><button type="button" data-saut="b10">10′</button><button type="button" data-saut="wp">whirlpool</button><button type="button" data-saut="dryActive|3">actif</button><button type="button" data-saut="dryPost|3">après</button></div>
</div>`,
  script: function () {
    var S = window.S, D = S.D, N = S.N, SEG = [[0, 44], [44, 52], [52, 76], [76, 100]];
    var seg = function (p) { return p.id.charAt(0) === 'b' ? 0 : p.id === 'wp' ? 1 : p.id.indexOf('dryActive') === 0 ? 2 : 3; };
    var dock = document.querySelector('.a1-dock'), rail = document.querySelector('.a1-rail'), loupe = document.querySelector('.a1-loupe');
    function x(i) { var s = seg(D[i]), idx = []; for (var k = 0; k <= N; k++) if (seg(D[k]) === s) idx.push(k); var n = idx.length, a = SEG[s][0], b = SEG[s][1]; return n === 1 ? (a + b) / 2 : a + (b - a) * (0.06 + 0.88 * idx.indexOf(i) / (n - 1)); }
    var majB = S.barres(document.getElementById('a1-barres')), majJ = S.jauge(document.getElementById('a1-jauge'));
    // Le relief : le floral à chaque moment (violet), l'amertume hors du style (trait orangé).
    var rel = document.querySelector('.a1-relief'), h = '';
    for (var k = 0; k <= N; k++) { var p = D[k]; h += '<i class="' + (p.interp ? 'a1-ip' : '') + '" style="left:' + x(k) + '%;height:' + Math.max(2, p.v.floral / 25 * 24).toFixed(1) + 'px"></i>'; }
    var deb = null; for (k = 0; k <= N + 1; k++) { var t = k <= N && S.ibu(D[k]).h; if (t && deb == null) deb = k; if (!t && deb != null) { h += '<b style="left:' + (x(deb) - 1) + '%;width:' + (x(k - 1) - x(deb) + 2) + '%"></b>'; deb = null; } }
    rel.innerHTML = h;
    function cur() { return +rail.getAttribute('aria-valuenow'); }
    function graduations(i) {
      rail.querySelectorAll('.a1-cran').forEach(function (c) { c.remove(); }); loupe.innerHTML = '';
      if (!dock.classList.contains('a1-touche')) return;
      for (var k = 0; k <= N; k++) if (seg(D[k]) === seg(D[i])) { var c = document.createElement('i'); c.className = 'a1-cran'; c.style.left = x(k) + '%'; rail.insertBefore(c, rail.firstChild); }
      var w = loupe.clientWidth;
      for (k = i - 2; k <= i + 2; k++) { if (k < 0 || k > N) continue; var s = document.createElement('span'); s.textContent = D[k].court; if (k === i) s.className = 'a1-ici'; s.style.left = (w / 2 + (k - i) * 64) + 'px'; loupe.appendChild(s); }
    }
    function poser(i) {
      var p = D[i]; rail.setAttribute('aria-valuenow', i); rail.setAttribute('aria-valuetext', p.lib);
      document.querySelector('.a1-pouce').style.left = x(i) + '%'; document.querySelector('.a1-pl').style.transform = x(i) < 12 ? 'translateX(-14px)' : x(i) > 88 ? 'translateX(calc(-100% + 14px))' : ''; document.getElementById('a1-pl').textContent = p.lib;
      majB(p); majJ(p);
      document.getElementById('a1-fl').textContent = S.fmt(p, 'floral');
      var b = S.ibu(p), am = document.getElementById('a1-am'); am.textContent = b.h ? b.t + ', trop amer' : 'amertume tenue'; am.classList.toggle('a1-h', b.h);
      document.querySelectorAll('[data-saut]').forEach(function (s) { s.setAttribute('aria-current', String(seg(D[S.idx(s.dataset.saut)]) === seg(p))); });
      graduations(i);
    }
    function depuis(e) { var r = rail.getBoundingClientRect(), pct = (e.clientX - r.left) / r.width * 100, best = 0, bd = 1e9; for (var k = 0; k <= N; k++) { var d = Math.abs(x(k) - pct); if (d < bd) { bd = d; best = k; } } if (best !== cur()) poser(best); }
    rail.addEventListener('pointerdown', function (e) { rail.setPointerCapture(e.pointerId); dock.classList.add('a1-touche'); depuis(e); graduations(cur()); });
    rail.addEventListener('pointermove', function (e) { if (e.buttons || e.pointerType === 'touch') { if (dock.classList.contains('a1-touche')) depuis(e); } });
    rail.addEventListener('pointerup', function () { dock.classList.remove('a1-touche'); graduations(cur()); });
    rail.addEventListener('keydown', function (e) { var i = cur(); if (e.key === 'ArrowRight') poser(Math.min(N, i + 1)); if (e.key === 'ArrowLeft') poser(Math.max(0, i - 1)); });
    document.querySelectorAll('[data-saut]').forEach(function (s) { var xs = x(S.idx(s.dataset.saut)); s.style.left = Math.min(92, Math.max(6, xs)) + '%'; s.addEventListener('click', function () { poser(S.idx(s.dataset.saut)); }); });
    poser(S.depart());
    if (/touche=1/.test(location.search)) { dock.classList.add('a1-touche'); graduations(cur()); }
  },
};
