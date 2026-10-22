// a2 · froide · « Le bloc dans la cuve » : x3b réduit (« Ma cuve, jour après jour » ; « ma bière de base ->
// 1 dry hop »). On pose le bloc Idaho 7 dans la frise du brassin et de la cuve, on l'étire (ou on le pince à
// deux doigts) pour les jours de contact. Dessous, ma bière → + Idaho 7 en colonnes. Levure : étape 2.
export default {
  id: 'a2', nom: 'Le bloc dans la cuve', chaleur: 'froide', levure: 'etape',
  titre: 'Quand ajouter Idaho 7 ?',
  legende: ['Glisse le bloc rouge : brassage, levure active ou au repos.', 'Étire son bord, ou pince à deux doigts : les jours de contact.', 'Colonnes : contour, ta stout avant ; plein, avec Idaho 7 ; gris, la zone du style.', '~ simulé · ≈ interpolé · ? inconnu, hachuré.'],
  css: `
.a2-rep { display:flex; flex-wrap:wrap; align-items:center; gap:4px 8px; font-size:16px; }
.a2-rep b { font-weight:600; }
.a2-fl { display:inline-flex; align-items:center; gap:4px; color:#9840bc; font-weight:700; }
.a2-am.a2-h { color:var(--acc); font-weight:600; }
.a2-cuve { gap:2px; }
.a2-axe, .a2-lev { position:relative; height:18px; font-size:12px; color:var(--gris); }
.a2-axe span { position:absolute; top:1px; transform:translateX(-50%); white-space:nowrap; }
.a2-lev i { position:absolute; top:2px; height:14px; border-radius:2px; font-style:normal; font-size:12px; line-height:14px; padding-left:4px; overflow:hidden; white-space:nowrap; }
.a2-lev .a2-brass { background:#f1f2f5; color:var(--gris); }
.a2-lev .a2-act { background:#ece2f3; color:#6b2f86; }
.a2-lev .a2-rep0 { background:#f1f2f5; color:var(--gris); }
.a2-piste { position:relative; height:48px; touch-action:none; cursor:pointer; background:repeating-linear-gradient(90deg,transparent 0 calc(var(--j) - 1px),#eceef2 calc(var(--j) - 1px) var(--j)); background-position:var(--z) 0; border-bottom:1px solid var(--trait); }
.a2-zb { position:absolute; left:0; top:0; bottom:0; background:#f6f7f9; border-right:1px solid #c9cdd6; }
.a2-tk { position:absolute; bottom:0; width:1px; height:8px; background:#b9bec8; }
.a2-bloc { position:absolute; top:12px; height:26px; border-radius:4px; background:var(--i7); color:#fff; font:600 13px/26px var(--sans); padding-left:6px; white-space:nowrap; transition:left .18s cubic-bezier(.2,.8,.2,1), width .18s cubic-bezier(.2,.8,.2,1); }
.a2-bloc.a2-goutte { width:18px !important; height:18px; top:20px; margin-left:-9px; border-radius:50%; padding:0; }
.a2-bloc.a2-goutte .a2-bl { position:absolute; bottom:22px; left:50%; transform:translateX(-50%); color:#fff; background:var(--encre); border-radius:9px; padding:0 7px; line-height:18px; }
.a2-bloc.a2-goutte .a2-poi { display:none; }
.a2-poi { position:absolute; right:-7px; top:-4px; width:14px; height:34px; border-radius:4px; background:#fff; border:2px solid var(--i7); cursor:ew-resize; }
.a2-poi::after { content:""; position:absolute; left:4px; top:9px; width:2px; height:12px; border-left:1px solid var(--i7); border-right:1px solid var(--i7); }
.a2-cols { gap:6px; }
.a2-cols-t { display:flex; justify-content:space-between; font-size:12px; color:var(--gris); }
.a2-cols-t b { color:var(--encre); font-weight:600; }
.a2-gr { display:grid; grid-template-columns:repeat(12,1fr); gap:3px; }
.a2-c { display:flex; flex-direction:column; align-items:center; gap:3px; }
.a2-p { position:relative; width:100%; height:78px; background:#f6f7f9; border-radius:2px; overflow:hidden; }
.a2-p i { position:absolute; bottom:0; display:block; }
.a2-p .a2-z { left:0; right:0; height:var(--ws); background:#e2e5eb; }
body.abs .a2-p .a2-z { height:var(--wa); }
.a2-p .a2-av { left:3px; width:7px; height:var(--ws); border:1.5px solid #6b6b75; border-bottom:0; border-radius:2px 2px 0 0; }
.a2-p .a2-ap { right:3px; width:11px; height:var(--ws); border-radius:2px 2px 0 0; transition:height .18s cubic-bezier(.2,.8,.2,1); }
body.abs .a2-p .a2-av, body.abs .a2-p .a2-ap { height:var(--wa); }
.a2-p .a2-ap.a2-ip { opacity:.5; }
.a2-p .a2-ap.a2-hs { border-top:3px solid var(--acc); }
.a2-p .a2-hach { left:0; right:0; top:0; background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }
.a2-v { font-size:12px; font-family:var(--mono); letter-spacing:-.04em; }
`,
  corps: `
<p class="a2-rep" aria-live="polite"><b>Face à ta stout</b><span class="a2-fl"><svg class="s-pi" width="18" height="18" style="width:18px;height:18px" data-famille="floral" aria-label="Floral"><use href="#p-floral"/></svg><span id="a2-fl" class="num">~+22</span></span><span id="a2-am" class="a2-am">amertume tenue</span></p>
<section class="s-bloc a2-cuve" data-libre="moment" aria-label="Le brassin et la cuve">
  <div class="a2-axe" id="a2-axe" aria-hidden="true"></div>
  <div class="a2-lev" id="a2-lev" aria-hidden="true"></div>
  <div class="a2-piste" id="a2-piste" role="slider" tabindex="0" aria-label="Moment de l'ajout" aria-valuemin="0" aria-valuemax="23" aria-valuenow="16" aria-valuetext="actif · 3 j" data-sans-menu>
    <i class="a2-zb" id="a2-zb"></i>
    <div class="a2-bloc" id="a2-bloc" data-couleur="#e80030" data-serie="Idaho 7"><span class="a2-bl" id="a2-bl">Idaho 7 · 3 j</span><span class="a2-poi" role="slider" tabindex="0" aria-label="Jours de contact" aria-valuemin="1" aria-valuemax="7" aria-valuenow="3"></span></div>
  </div>
  <p class="s-src" id="a2-src"><span><b>mesuré</b> : 1 h ou 96 h de contact, même nez en bière jeune · Titus 2021, E10</span></p>
</section>
<section class="s-bloc a2-cols" aria-label="Ma bière, puis avec Idaho 7">
  <div class="a2-cols-t"><span><b>ma bière</b> → + Idaho 7</span><span>~ points, au style</span></div>
  <div class="a2-gr" id="a2-gr"></div>
</section>
<div class="s-bloc"><div id="a2-jauge"></div></div>`,
  script: function () {
    var S = window.S, D = S.D, N = S.N, J = [1, 2, 3, 5, 7], JMAX = 14;
    var piste = document.getElementById('a2-piste'), bloc = document.getElementById('a2-bloc'), poi = bloc.querySelector('.a2-poi');
    var W = function () { return piste.clientWidth; }, Z = function () { return Math.round(W() * 0.3); };
    var jx = function (d) { return Z() + (W() - Z()) * d / JMAX; };
    var kx = function (k) { return Z() * (0.06 + 0.88 * k / 13); };
    var ph = function (p) { return p.id.indexOf('dryActive') === 0 ? 'dryActive' : p.id.indexOf('dryPost') === 0 ? 'dryPost' : 'b'; };
    var jours = function (p) { return +(p.id.split('|')[1] || 0); };
    var i = S.depart(), L = 3;
    // L'axe et la levure.
    function fond() {
      piste.style.setProperty('--z', Z() + 'px'); piste.style.setProperty('--j', ((W() - Z()) / JMAX) + 'px');
      document.getElementById('a2-zb').style.width = Z() + 'px'; document.getElementById('a2-zb').innerHTML = [0,1,2,3,4,5,6,7,8,9,10,11,12,13].map(function (k) { return '<b class="a2-tk" style="left:' + kx(k) + 'px"></b>'; }).join('');
      document.getElementById('a2-axe').innerHTML = [[0, '60′'], [10, '10′'], [13, 'WP']].map(function (m) { return '<span style="left:' + Math.max(12, kx(m[0])) + 'px">' + m[1] + '</span>'; }).join('') + [1, 3, 7, 10, 14].map(function (d) { return '<span style="left:' + jx(d) + 'px">J' + d + '</span>'; }).join('');
      document.getElementById('a2-lev').innerHTML = '<i class="a2-brass" style="left:0;width:' + (Z() - 2) + 'px">brassage</i><i class="a2-act" style="left:' + jx(0) + 'px;width:' + (jx(6) - jx(0) - 2) + 'px">levure active</i><i class="a2-rep0" style="left:' + jx(6) + 'px;width:' + (jx(JMAX) - jx(6)) + 'px">au repos</i>';
    }
    var majJ = S.jauge(document.getElementById('a2-jauge'));
    // Les colonnes : ma bière → + Idaho 7.
    var gr = document.getElementById('a2-gr'), w = function (x, f, m) { return (m === 's' ? Math.min(100, x / S.B[f] / 2 * 100) : Math.min(100, x / 110 * 100)).toFixed(1) + '%'; };
    gr.innerHTML = S.ORDRE.map(function (f) {
      return '<div class="a2-c" data-f="' + f + '"><span class="a2-p"><i class="a2-z" data-role="zone" style="--ws:50%;--wa:' + (S.B[f] / 110 * 100).toFixed(1) + '%"></i><i class="a2-av" style="--ws:' + w(S.AV[f], f, 's') + ';--wa:' + w(S.AV[f], f, 'a') + '"></i><i class="a2-ap" style="background:' + S.BA[f] + '"></i><i class="a2-hach"></i></span>' + S.pi(f, 16) + '<span class="a2-v"></span></div>';
    }).join('');
    function cols(p) {
      gr.querySelectorAll('[data-f]').forEach(function (c) {
        var f = c.dataset.f, u = S.inc(p, f), ap = c.querySelector('.a2-ap'), v = c.querySelector('.a2-v');
        c.querySelector('.a2-hach').hidden = !u; ap.hidden = u; ap.classList.toggle('a2-ip', !!p.interp); ap.classList.toggle('a2-hs', S.hors(p, f));
        if (!u) { ap.style.setProperty('--ws', w(p.v[f], f, 's')); ap.style.setProperty('--wa', w(p.v[f], f, 'a')); }
        v.textContent = S.fmt(p, f).replace(/^[~≈]/, ''); v.style.color = u ? '#55555f' : (S.hors(p, f) ? '#c2410c' : S.T[f]);
      });
    }
    function poser(k) {
      i = k; var p = D[i], f = ph(p);
      if (f !== 'b') L = jours(p);
      piste.setAttribute('aria-valuenow', i); piste.setAttribute('aria-valuetext', p.lib); poi.setAttribute('aria-valuenow', L);
      if (f === 'b') { bloc.classList.add('a2-goutte'); bloc.style.left = kx(i) + 'px'; document.getElementById('a2-bl').textContent = p.court === 'wp' ? 'whirlpool' : p.court; }
      else { var d0 = f === 'dryActive' ? 1 : 7; bloc.classList.remove('a2-goutte'); bloc.style.left = jx(d0) + 'px'; bloc.style.width = (jx(d0 + L) - jx(d0)) + 'px'; document.getElementById('a2-bl').textContent = (jx(d0 + L) - jx(d0) > 92 ? 'Idaho 7 · ' : '') + L + ' j'; }
      document.getElementById('a2-src').hidden = f === 'b';
      cols(p); majJ(p);
      document.getElementById('a2-fl').textContent = S.fmt(p, 'floral');
      var b = S.ibu(p), am = document.getElementById('a2-am'); am.textContent = b.h ? b.t + ', trop amer' : 'amertume tenue'; am.classList.toggle('a2-h', b.h);
    }
    function versK(phase, l) { var best = J.reduce(function (a, b) { return Math.abs(b - l) < Math.abs(a - l) ? b : a; }); return S.idx(phase + '|' + best); }
    function placer(x) {
      if (x < Z()) { var bk = 0, bd = 1e9; for (var k = 0; k <= 13; k++) { var dd = Math.abs(kx(k) - x); if (dd < bd) { bd = dd; bk = k; } } if (bk !== i) poser(bk); return; }
      var d = (x - Z()) / (W() - Z()) * JMAX, k2 = versK(d < 6.5 ? 'dryActive' : 'dryPost', L); if (k2 !== i) poser(k2);
    }
    function etirer(x) { var f = ph(D[i]); if (f === 'b') return; var d0 = f === 'dryActive' ? 1 : 7, l = (x - Z()) / (W() - Z()) * JMAX - d0, k = versK(f, l); if (k !== i) poser(k); }
    var doigts = {}, mode = null, pince = null;
    piste.addEventListener('pointerdown', function (e) {
      piste.setPointerCapture(e.pointerId); doigts[e.pointerId] = e.clientX; var n = Object.keys(doigts).length;
      var x = e.clientX - piste.getBoundingClientRect().left;
      if (n === 2 && ph(D[i]) !== 'b') { var xs = Object.values(doigts); mode = 'pince'; pince = { d: Math.abs(xs[0] - xs[1]) || 1, L: L }; return; }
      mode = e.target === poi ? 'jours' : 'deplacer'; if (mode === 'deplacer') placer(x);
    });
    piste.addEventListener('pointermove', function (e) {
      if (!(e.pointerId in doigts)) return; doigts[e.pointerId] = e.clientX; var x = e.clientX - piste.getBoundingClientRect().left;
      if (mode === 'pince') { var xs = Object.values(doigts); if (xs.length < 2) return; var k = versK(ph(D[i]), pince.L * Math.abs(xs[0] - xs[1]) / pince.d); if (k !== i) poser(k); }
      else if (mode === 'jours') etirer(x); else if (mode === 'deplacer') placer(x);
    });
    var lacher = function (e) { delete doigts[e.pointerId]; if (!Object.keys(doigts).length) mode = null; };
    piste.addEventListener('pointerup', lacher); piste.addEventListener('pointercancel', lacher);
    piste.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') poser(Math.min(N, i + 1)); if (e.key === 'ArrowLeft') poser(Math.max(0, i - 1)); });
    fond(); poser(i); addEventListener('resize', function () { fond(); poser(i); });
  },
};
