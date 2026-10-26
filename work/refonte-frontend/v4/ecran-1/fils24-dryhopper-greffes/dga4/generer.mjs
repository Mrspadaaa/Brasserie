// dga4 · chaude · « Le calendrier de la cuve ». Base : l'écran Dryhopper de la maquette jouable, tel quel. Greffe libre :
// la frise de y1b refaite en temps du brassin. À gauche, le jour du brassage, zoomé (ébullition par 5′, whirlpool) ; à
// droite, les jours de la cuve, J1 à J12, avec la levure au travail. À froid, Idaho 7 n'est plus un point mais une barre :
// où elle commence (pendant la fermentation ≈J2, ou après ≈J5), combien de jours elle dure (on tire son bout), et le jour
// où on le retire. ≈J2 et ≈J5 : la bosse de levure de p4b2f (« fin vers J+5, à confirmer à la densité »), écrits « ≈ ».
// Régénérer : node generer.mjs. Classes dga4- (L26).
import { variante } from '../dga1/socle-dga.mjs';
import { FLAMME as FLAMME0, BULLES as BULLES0 } from '../../fils23-dryhopper/passe4/p4b-commun/socle-p4b.mjs';

// Les deux signes au trait de la base (1,3 px rendus à 14 px, S4) : 2,23 au lieu de 2,57 dans leur viewBox de 24.
const FLAMME = (s) => FLAMME0(s).split('stroke-width="2.57"').join('stroke-width="2.23"');
const BULLES = (s) => BULLES0(s).split('stroke-width="2.57"').join('stroke-width="2.23"');

variante({
  id: 'dga4', nom: 'Le calendrier de la cuve', chaleur: 'chaude', apres: '.pq-dry-jr',
  gabarit: `
<div class="dga4-cal" id="dga4-cal" data-greffe="calendrier-cuve" data-acquis="geste" data-booster="frise" data-libre="moment" role="slider" tabindex="0" data-pas="5" aria-valuemin="0" aria-valuemax="23" aria-label="Moment et jours de contact d'Idaho 7">
  <div class="dga4-j0" aria-hidden="true"><span class="dga4-feu">${FLAMME(14)}<span>J0 · brassage</span></span></div>
  <svg class="dga4-lev" id="dga4-lev" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true"></svg>
  <span class="dga4-co" id="dga4-co">${BULLES(14)}<span>levure</span></span>
  <div class="dga4-axe" id="dga4-axe"></div>
  <div class="dga4-hb" id="dga4-hb" data-serie="Idaho 7" data-couleur="#e80030"><b id="dga4-hbt"></b><i class="dga4-poi" aria-hidden="true"></i></div>
  <span class="dga4-fin" id="dga4-fin"></span>
</div>`,
  css: `
.dga4-cal { position:relative; height:84px; margin-top:4px; touch-action:none; cursor:pointer; outline:none; user-select:none; -webkit-user-select:none; }
.dga4-j0 { position:absolute; left:0; width:35%; top:20px; height:32px; border-radius:8px; background:#fff4ee; border:1px solid #f3c9b2; }
.dga4-feu { position:absolute; left:6px; top:7px; display:inline-flex; align-items:center; gap:4px; color:#c2410c; font:600 12px 'Source Sans 3', system-ui, sans-serif; }
.dga4-j0::after { content:""; position:absolute; left:80%; top:0; bottom:0; border-left:1px dashed #f3c9b2; }
.dga4-lev { position:absolute; left:37%; width:63%; top:2px; height:48px; overflow:visible; }
.dga4-co { position:absolute; top:0; display:inline-flex; align-items:center; gap:3px; color:#3b5f8a; font:600 12px 'Source Sans 3', system-ui, sans-serif; white-space:nowrap; }
.dga4-axe { position:absolute; left:0; right:0; top:54px; height:30px; }
.dga4-axe i { position:absolute; top:0; width:1px; height:6px; background:#8a8f9c; }
.dga4-axe i.dga4-gr { height:9px; width:2px; margin-left:-1px; background:#16161a; }
.dga4-axe span { position:absolute; top:10px; transform:translateX(-50%); font:600 12px 'IBM Plex Mono', ui-monospace, monospace; color:#55555f; white-space:nowrap; }
.dga4-axe span.dga4-on { color:#16161a; font-weight:700; }
.dga4-axe::before { content:""; position:absolute; left:37%; right:0; top:0; height:2px; background:#c9cdd6; }
.dga4-hb { position:absolute; top:24px; height:22px; min-width:22px; border-radius:11px; background:#e80030; color:#fff; display:flex; align-items:center; padding:0 14px 0 9px; font:700 13px 'Source Sans 3', system-ui, sans-serif; white-space:nowrap; box-shadow:0 0 0 2px #fff; z-index:2; }
.dga4-hb.dga4-chaud { padding:0 9px; background:#16161a; transform:translateX(-50%); }
.dga4-hb.dga4-chaud::after { content:""; position:absolute; left:var(--bec, 50%); bottom:-6px; margin-left:-5px; border:5px solid transparent; border-bottom:0; border-top-color:#16161a; }
.dga4-poi { position:absolute; right:-6px; top:-4px; width:12px; height:30px; border-radius:4px; background:#fff; box-shadow:0 0 0 2px #e80030, 0 2px 6px rgba(22,22,26,.25); }
.dga4-poi::after { content:""; position:absolute; left:3px; top:9px; width:6px; height:2px; background:#8a8f9c; box-shadow:0 5px 0 #8a8f9c, 0 10px 0 #8a8f9c; }
.dga4-hb.dga4-chaud .dga4-poi { display:none; }
.dga4-hb.dga4-court b { position:absolute; left:calc(100% + 10px); padding:0 3px; border-radius:2px; background:#fff; color:#b0002a; }
.dga4-fin { position:absolute; top:62px; transform:translateX(-50%); padding:0 3px; background:#fff; font:700 13px 'IBM Plex Mono', ui-monospace, monospace; color:#b0002a; white-space:nowrap; z-index:2; }
.dga4-fin:empty { display:none; }
.dga4-hb.dga4-sg::before { content:"sans gain"; position:absolute; right:14px; top:-17px; font:600 12px 'Source Sans 3', system-ui, sans-serif; color:#55555f; white-space:nowrap; }
.dga4-hb.dga4-sg::after { content:""; position:absolute; left:var(--pu); right:6px; bottom:-8px; height:5px; border-radius:2px; background:repeating-linear-gradient(135deg,#8a8f9c 0 2px,transparent 2px 5px); }
`,
  script: function (B) {
    var M = B.M, N = M.length - 1;
    document.querySelectorAll('[data-greffe] [role=slider], [data-greffe][role=slider]').forEach(function (e) { e.setAttribute('aria-valuemax', N); });
    var cal = document.getElementById('dga4-cal'), axe = document.getElementById('dga4-axe'), hb = document.getElementById('dga4-hb'), fin = document.getElementById('dga4-fin');
    var JOURS = [], DEBUT = { 2: 2, 3: 5 }; // ≈J2 pendant la fermentation, ≈J5 après (bosse de levure de p4b2f)
    M.forEach(function (m) { if (m.seg === 2) JOURS.push(m.jours); });
    var MAX = parseInt(M[0].lib, 10) || 60; // la durée d'ébullition de la recette (60′ ici ; 120′ ou 45′ suivent)
    // Géométrie : le jour du brassage zoomé sur 0–35 % (ébullition 0–28, whirlpool 28–35) ; les jours J0 → J12 sur 37–100 %.
    function xm(k) { var m = M[k]; return m.seg === 1 ? 31.5 : 2.5 + (MAX - parseInt(m.lib, 10)) / MAX * 23; }
    function xj(d) { return 37 + d / 12 * 62; }
    var h = '';
    M.forEach(function (m, k) {
      if (m.seg > 1) return;
      var ecrit = m.seg === 1 || m.lib === MAX + '′' || m.lib === '0′' || m.lib === Math.round(MAX / 2) + '′';
      h += '<i class="' + (ecrit ? 'dga4-gr' : '') + '" style="left:' + xm(k) + '%"></i>' + (ecrit ? '<span data-k="' + k + '" style="left:' + xm(k) + '%">' + m.court + '</span>' : '');
    });
    var ECR = { 2: 'J2', 5: 'J5', 8: '8', 10: '10', 12: '12' };
    for (var d = 1; d <= 12; d++) h += '<i class="' + (ECR[d] ? 'dga4-gr' : '') + '" style="left:' + xj(d) + '%"></i>' + (ECR[d] ? '<span data-j="' + d + '" style="left:' + xj(d) + '%">' + ECR[d] + '</span>' : '');
    axe.innerHTML = h;
    // La cuve : la levure au travail, bosse hachurée ≈J1 → ≈J5, non chiffrée (comme sous le graphique de la maquette).
    var u = function (d) { return d / 12 * 100; };
    document.getElementById('dga4-lev').innerHTML = '<defs><pattern id="dga4-hach" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1" height="3" fill="#3b5f8a" opacity=".35"/></pattern></defs>'
      + '<path d="M' + u(0.6) + ' 20 C' + u(1.4) + ' 20 ' + u(1.6) + ' 4 ' + u(2.6) + ' 4 S' + u(4.2) + ' 10 ' + u(5) + ' 19 L' + u(5.4) + ' 20 Z" fill="url(#dga4-hach)" stroke="#3b5f8a" stroke-width="1" stroke-dasharray="2 1.5" vector-effect="non-scaling-stroke"/>';
    document.getElementById('dga4-co').style.left = xj(0.2) + '%';
    function dessiner(i) {
      var m = M[i], s = m.seg;
      hb.classList.toggle('dga4-chaud', s < 2);
      if (s < 2) {
        document.getElementById('dga4-hbt').textContent = 'Idaho 7 · ' + m.court;
        hb.classList.remove('dga4-court'); hb.classList.remove('dga4-sg'); hb.style.width = 'auto'; hb.style.top = '-2px';
        var W = cal.clientWidth, jw = hb.offsetWidth, xb = xm(i) / 100 * W, cx = Math.max(jw / 2, Math.min(W * 0.355 - jw / 2, xb));
        hb.style.left = cx + 'px'; hb.style.setProperty('--bec', (xb - cx + jw / 2) + 'px');
        fin.textContent = '';
      } else {
        var a = DEBUT[s], j = m.jours, w = xj(a + j) - xj(a), utile = 0;
        // Les jours qui gagnent encore (plein), puis ceux « sans gain » (hachurés), marques de la maquette.
        M.forEach(function (q) { if (q.seg === s && q.jours <= j && !q.sg) utile = Math.max(utile, q.jours); });
        var pu = Math.max(0, Math.min(100, utile / j * 100));
        hb.style.setProperty('--pu', pu + '%');
        hb.classList.toggle('dga4-sg', pu < 100); hb.dataset.sansGain = String(j - utile);
        hb.style.left = xj(a) + '%'; hb.style.width = w + '%'; hb.style.top = '24px';
        document.getElementById('dga4-hbt').textContent = 'Idaho 7 · ' + j + ' j';
        hb.classList.toggle('dga4-court', j < 3);
        fin.textContent = '≈J' + (a + j); fin.style.left = xj(a + j) + '%';
      }
      var bout = s >= 2 ? DEBUT[s] + m.jours : null;
      axe.querySelectorAll('span').forEach(function (e) { e.classList.toggle('dga4-on', +e.dataset.k === i || (s >= 2 && +e.dataset.j === DEBUT[s])); e.style.visibility = bout != null && e.dataset.j && Math.abs(+e.dataset.j - bout) < 1.6 && +e.dataset.j !== DEBUT[s] ? 'hidden' : ''; });
      cal.setAttribute('aria-valuenow', i); cal.setAttribute('aria-valuetext', m.lib);
    }
    B.quand(function (i) { dessiner(i); });
    // Le geste : sur le bout de la barre, on tire les jours ; ailleurs, on pose le moment (le brassage par 5′, ou la cuve).
    var mode = null, vise = null;
    function pct(e) { var r = cal.getBoundingClientRect(); return (e.clientX - r.left) / r.width * 100; }
    function proche(L, v) { var b = L[0]; L.forEach(function (x) { if (Math.abs(x - v) < Math.abs(b - v)) b = x; }); return b; }
    function poser(e) {
      var x = pct(e), i = vise == null ? B.cur() : vise, m = M[i], s = m.seg, k;
      if (mode === 'tirer' && s >= 2) k = B.idx((s === 2 ? 'actif' : 'après') + ' · ' + proche(JOURS, (x - 37) / 62 * 12 - DEBUT[s]) + ' j');
      else if (x < 35.5) { var bd = 1e9; M.forEach(function (q, n) { if (q.seg < 2 && Math.abs(xm(n) - x) < bd) { bd = Math.abs(xm(n) - x); k = n; } }); }
      else { var jour = (x - 37) / 62 * 12; k = B.idx((jour < 3.6 ? 'actif' : 'après') + ' · ' + (s >= 2 ? m.jours : 3) + ' j'); }
      if (k >= 0 && k !== vise) { vise = k; B.aller(k); dessiner(k); }
    }
    cal.addEventListener('pointerdown', function (e) {
      cal.setPointerCapture(e.pointerId); vise = B.cur();
      var r = hb.getBoundingClientRect(); mode = !hb.classList.contains('dga4-chaud') && Math.abs(e.clientX - r.right) < 24 ? 'tirer' : 'poser';
      poser(e);
    });
    cal.addEventListener('pointermove', function (e) { if (mode) poser(e); });
    var lever = function () { mode = null; vise = null; };
    cal.addEventListener('pointerup', lever); cal.addEventListener('pointercancel', lever);
    cal.addEventListener('keydown', function (e) { var i = B.cur(); if (e.key === 'ArrowRight') { e.preventDefault(); B.aller(Math.min(N, i + 1)); } if (e.key === 'ArrowLeft') { e.preventDefault(); B.aller(Math.max(0, i - 1)); } });
    // Le geste capturé : tirer le bout de la barre (actif 2 j) jusqu'à 7 jours.
    window.DGA_GESTE = function () { var r = hb.getBoundingClientRect(), c = cal.getBoundingClientRect(), y = r.top + r.height / 2; return [[r.right - 4, y], [c.left + c.width * (xj(6) / 100), y], [c.left + c.width * (xj(9) / 100), y]]; };
  },
});
