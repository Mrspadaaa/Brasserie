// a4 · tiède · « Balayer, puis rouler » : deux gestes croisés. ← → on balaie les étapes du brassin, une
// carte par étape, les voisines visibles au bord ; ↑ ↓ on roule les minutes ou les jours dans la carte.
// Après la dernière étape, la carte suivante est la levure : l'étape 2 de Dryhopper.
import { ETAPE, I_SABLIER } from '../socle.mjs';

export default {
  id: 'a4', nom: 'Balayer, puis rouler', chaleur: 'tiède', levure: 'etape',
  titre: 'Quand ajouter Idaho 7 ?',
  legende: ['Balaie ← → : une carte par étape du brassin.', 'Roule ↑ ↓ le chiffre : minutes ou jours.', 'Barre : ta stout avec Idaho 7 ; rond : ta stout avant.', '~ simulé · ≈ interpolé · ? inconnu, hachuré.'],
  css: `
.a4-points { display:grid; grid-template-columns:repeat(4,1fr); gap:4px; }
.a4-points button { display:flex; flex-direction:column; align-items:center; gap:1px; padding:3px 0; border-radius:8px; font-size:12px; color:var(--gris); background:#fff; border:1px solid #d5d8df; }
.a4-points button b { font:600 13px var(--mono); color:#9840bc; }
.a4-points button[aria-checked="true"] { background:var(--encre); color:#fff; }
.a4-points button[aria-checked="true"] b { color:#e6d2f0; }
.a4-deck { display:flex; gap:8px; overflow-x:auto; scroll-snap-type:x mandatory; margin:0 -10px; padding:2px 38px 4px; scrollbar-width:none; overscroll-behavior-x:contain; }
.a4-deck::-webkit-scrollbar { display:none; }
.a4-carte { flex:0 0 294px; scroll-snap-align:center; background:#fff; border-radius:8px; padding:8px 10px; display:flex; flex-direction:column; gap:6px; opacity:.5; transition:opacity .2s; border:2px solid transparent; }
.a4-carte.a4-on { opacity:1; border-color:var(--encre); }
.a4-ct { display:flex; align-items:center; gap:6px; font-size:14px; font-weight:600; }
.a4-ct svg { color:var(--gris); }
.a4-ct .a4-n { margin-left:auto; font-size:12px; font-weight:400; color:var(--gris); }
.a4-mid { display:grid; grid-template-columns:96px 1fr; gap:8px; align-items:center; }
.a4-roue { display:flex; flex-direction:column; align-items:center; justify-content:center; height:84px; border-radius:8px; background:#f1f2f5; touch-action:none; cursor:ns-resize; user-select:none; position:relative; }
.a4-roue span { font-family:var(--mono); color:var(--gris); font-size:13px; line-height:20px; }
.a4-roue .a4-ici { font:700 22px/30px var(--mono); color:var(--encre); }
.a4-roue::before, .a4-roue::after { content:""; position:absolute; left:10px; right:10px; height:1px; background:#c9cdd6; }
.a4-roue::before { top:26px; } .a4-roue::after { bottom:26px; }
.a4-roue.a4-fixe { cursor:default; }
.a4-roue.a4-fixe::before, .a4-roue.a4-fixe::after { display:none; }
.a4-roue.a4-fixe .a4-ici { font:700 16px var(--sans); }
.a4-lu { display:flex; flex-direction:column; gap:2px; }
.a4-fl { display:flex; align-items:center; gap:5px; font:700 24px var(--mono); color:#9840bc; }
.a4-am { font-size:14px; font-weight:600; }
.a4-am.a4-h { color:var(--acc); }
.a4-b .s-ba { grid-template-columns:84px 1fr 34px; gap:4px; min-height:16px; font-size:12px; }
.a4-suite { justify-content:center; align-items:center; gap:10px; text-align:center; background:var(--encre); color:#fff; opacity:.75; }
.a4-suite.a4-on { opacity:1; }
.a4-suite b { font-size:20px; }
.a4-suite span { font-size:14px; }
`,
  corps: `
<div class="a4-lib" data-libre="moment">
  <div class="a4-points" role="radiogroup" aria-label="Moment, par étape" id="a4-points"></div>
  <div class="a4-deck" id="a4-deck"><a class="a4-carte a4-suite" href="${ETAPE}"><b>2 · Levure ›</b><span>Et avec quelle levure ?</span></a></div>
</div>
<p class="s-src" id="a4-src">${I_SABLIER}<span><b>mesuré</b> : l'essentiel passe en 2 j de contact · Schmidt 2019, E08</span></p>`,
  script: function () {
    var S = window.S, D = S.D, N = S.N;
    var I = {
      ch: '<path d="M4 9h16v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3Z"/><path d="M2 9h20M9 5c0-1 1-1 1-2M14 5c0-1 1-1 1-2"/>',
      wp: '<path d="M12 12a2 2 0 1 1 2-2 4 4 0 1 1-4-4 6 6 0 1 1-6 6"/>',
      fe: '<path d="M6 3h12v10l-6 8-6-8Z"/><path d="M9 8c1 1 2-1 3 0s2-1 3 0"/>',
      re: '<path d="M6 3h12v10l-6 8-6-8Z"/><path d="M9 10h6"/>'
    };
    var PH = [
      { k: 'ch', nom: 'Ébullition', court: '60′–0′', roue: 'Minutes d\'ébullition', t: function (p) { return p.id.charAt(0) === 'b'; } },
      { k: 'wp', nom: 'Whirlpool', court: 'whirlpool', t: function (p) { return p.id === 'wp'; } },
      { k: 'fe', nom: 'En fermentation', court: 'actif', roue: 'Jours de contact, levure active', t: function (p) { return p.id.indexOf('dryActive') === 0; } },
      { k: 're', nom: 'Après fermentation', court: 'après', roue: 'Jours de contact, après fermentation', t: function (p) { return p.id.indexOf('dryPost') === 0; } }
    ];
    PH.forEach(function (ph) { ph.idx = []; for (var k = 0; k <= N; k++) if (ph.t(D[k])) ph.idx.push(k); ph.sel = 0; });
    var i = S.depart(), phase = 0;
    PH.forEach(function (ph, n) { var j = ph.idx.indexOf(i); if (j >= 0) { ph.sel = j; phase = n; } else ph.sel = n === 0 ? 0 : n >= 2 ? 2 : 0; });
    var deck = document.getElementById('a4-deck'), suite = deck.querySelector('.a4-suite'), pts = document.getElementById('a4-points');
    var vu = function (p) { return p.court === 'wp' ? 'whirlpool' : p.id.indexOf('dry') === 0 ? p.court.slice(1) + ' j' : p.court; };
    PH.forEach(function (ph, n) {
      var a = document.createElement('article'); a.className = 'a4-carte'; a.dataset.ph = n;
      a.innerHTML = '<header class="a4-ct"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[ph.k] + '</svg>' + ph.nom + '<span class="a4-n">' + (n + 1) + ' / 4</span></header>'
        + '<div class="a4-mid">' + (ph.roue ? '<div class="a4-roue" role="slider" tabindex="0" aria-label="' + ph.roue + '" aria-valuemin="0" aria-valuemax="' + (ph.idx.length - 1) + '"><span class="a4-av"></span><span class="a4-ici"></span><span class="a4-ap"></span></div>' : '<div class="a4-roue a4-fixe"><span class="a4-ici">whirlpool</span></div>')
        + '<div class="a4-lu"><span class="a4-fl">' + S.pi('floral', 22) + '<span class="a4-flv"></span></span><span class="a4-am"></span></div></div>'
        + '<div class="a4-b" aria-label="Familles d\'arômes au style"></div>';
      deck.insertBefore(a, suite); ph.el = a; ph.maj = S.barres(a.querySelector('.a4-b'));
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-label', 'Moment : ' + ph.court); b.innerHTML = '<span>' + ph.court + '</span><b></b>';
      b.addEventListener('click', function () { centrer(n, true); }); pts.appendChild(b); ph.pt = b;
      var r = a.querySelector('.a4-roue[role=slider]');
      if (r) {
        var y0 = null, s0 = 0;
        r.addEventListener('pointerdown', function (e) { r.setPointerCapture(e.pointerId); y0 = e.clientY; s0 = ph.sel; e.stopPropagation(); });
        r.addEventListener('pointermove', function (e) { if (y0 == null) return; var s = Math.max(0, Math.min(ph.idx.length - 1, s0 + Math.round((y0 - e.clientY) / 24))); if (s !== ph.sel) { ph.sel = s; peindre(); } });
        r.addEventListener('pointerup', function (e) { if (y0 != null && Math.abs(e.clientY - y0) < 6) { var rr = r.getBoundingClientRect(); ph.sel = Math.max(0, Math.min(ph.idx.length - 1, ph.sel + (e.clientY < rr.top + rr.height / 2 ? -1 : 1))); peindre(); } y0 = null; });
        r.addEventListener('keydown', function (e) { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); ph.sel = Math.max(0, Math.min(ph.idx.length - 1, ph.sel + (e.key === 'ArrowDown' ? 1 : -1))); peindre(); } });
      }
    });
    function peindre() {
      PH.forEach(function (ph, n) {
        var p = D[ph.idx[ph.sel]], a = ph.el, r = a.querySelector('.a4-roue[role=slider]');
        if (r) { r.setAttribute('aria-valuenow', ph.sel); r.setAttribute('aria-valuetext', p.lib); var pv = ph.idx[ph.sel - 1], nx = ph.idx[ph.sel + 1]; a.querySelector('.a4-av').textContent = pv != null ? vu(D[pv]) : ' '; a.querySelector('.a4-ici').textContent = vu(p); a.querySelector('.a4-ap').textContent = nx != null ? vu(D[nx]) : ' '; }
        a.querySelector('.a4-flv').textContent = S.fmt(p, 'floral');
        var b = S.ibu(p), am = a.querySelector('.a4-am'); am.textContent = b.t + ', ' + b.s; am.classList.toggle('a4-h', b.h);
        ph.maj(p); ph.pt.querySelector('b').textContent = S.fmt(p, 'floral');
        a.classList.toggle('a4-on', n === phase); ph.pt.setAttribute('aria-checked', String(n === phase));
      });
      suite.classList.toggle('a4-on', phase === 4);
      document.getElementById('a4-src').hidden = phase < 2;
    }
    function centrer(n, doux) { var c = n < 4 ? PH[n].el : suite; deck.scrollTo({ left: c.offsetLeft - (deck.clientWidth - c.offsetWidth) / 2, behavior: doux ? 'smooth' : 'auto' }); if (n !== phase) { phase = n; peindre(); } }
    var tt = null;
    deck.addEventListener('scroll', function () { clearTimeout(tt); tt = setTimeout(function () { var m = deck.scrollLeft + deck.clientWidth / 2, best = 0, bd = 1e9, cs = PH.map(function (ph) { return ph.el; }).concat([suite]); cs.forEach(function (c, n) { var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - m); if (d < bd) { bd = d; best = n; } }); if (best !== phase) { phase = best; peindre(); } }, 60); });
    peindre(); centrer(phase, false);
  },
};
