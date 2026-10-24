// sba7 · chaude · forme libre : la balance des IBU. Nugget 46 g sur le plateau de gauche ; je pose un remplaçant à droite
// (toucher ou glisser son jeton) : le tas montre les grammes, le fléau reste à l'horizontale au même IBU. Sans α de lot,
// le fléau tremble entre deux positions : l'IBU de ta stout est une plage.
import { CROIX, lentille, aide } from '../sba1/socle.mjs';

export default {
  id: 'sba7', nom: 'La balance des IBU', chaleur: 'chaude',
  etats: [['geste', '?choix=beermaverick-magnat'], ['whirlpool', '?moment=wp']],
  css: `
.sba7-page { padding:6px 12px 150px; display:flex; flex-direction:column; gap:6px; }
.sba7-t { display:flex; align-items:center; gap:10px; }
.sba7-t h1 { font:700 19px/1.15 var(--sans); }
.sba7-bal { position:relative; background:#dcdfe5; border-radius:8px; }
.sba7-bal svg text { font-family:var(--sans); }
.sba7-ctx { display:flex; flex-wrap:wrap; gap:4px 10px; font-size:12px; color:var(--gris); justify-content:center; }
.sba7-lu { text-align:center; display:flex; flex-direction:column; gap:3px; align-items:center; }
.sba7-lu b { font:800 20px/1.1 var(--sans); }
.sba7-lu p { display:flex; gap:4px 12px; flex-wrap:wrap; justify-content:center; font-size:13px; align-items:center; }
.sba7-jet { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
.sba7-je { height:48px; border-radius:8px; border:1px solid #c9cad2; background:#fff; display:flex; flex-direction:column; align-items:flex-start; justify-content:center; padding:0 8px; gap:2px; font-size:13px; touch-action:none; user-select:none; text-align:left; }
.sba7-je span:first-child { display:flex; align-items:center; gap:5px; font-weight:600; white-space:nowrap; overflow:hidden; max-width:100%; }
.sba7-je .num { font-size:12px; color:var(--gris); display:flex; gap:4px; align-items:center; }
.sba7-je[aria-pressed="true"] { border:2px solid var(--encre); }
.sba7-vole { position:fixed; z-index:50; pointer-events:none; width:110px; box-shadow:0 10px 26px -10px rgba(22,22,26,.55); }
.sba7-o { display:flex; align-items:center; gap:6px; position:relative; }
.sba7-o > span:first-child { font-size:12px; color:var(--gris); margin-right:auto; }
.sba7-foot { position:fixed; left:0; right:0; bottom:0; background:#fff; border-top:1px solid var(--trait); padding:8px 12px 12px; max-width:390px; margin:0 auto; }
@keyframes sba7-tremble { 0%,100% { transform:rotate(var(--a)); } 50% { transform:rotate(calc(var(--a) * -1)); } }
.sba7-fleau { transform-origin:183px 40px; transform-box:view-box; transition:transform .8s ease-in-out; }
.sba7-pl { transition:transform .8s ease-in-out; }
.sba7-deux { display:grid; grid-template-columns:1fr 1fr; gap:2px 10px; }
.sba7-deux .sb-ba { grid-template-columns:76px 1fr 28px; gap:4px; font-size:12px; }
`,
  corps: '<header class="sba7-t">' + CROIX + '<h1 data-role="titre">Lequel à la place de Nugget ?</h1></header>'
    + '<p class="sba7-ctx" data-role="contexte"><span data-contexte="houblon" data-fiche-de="beermaverick-nugget">à gauche : <span data-houblon="beermaverick-nugget">Nugget</span> α 13 %, épuisé</span><span data-contexte="moment" id="sba7-mom">à 60′</span><span data-contexte="dose">même IBU</span><span data-contexte="base">Stout 16D</span></p>'
    + '<div class="sba7-bal" id="sba7-bal"></div>'
    + '<section class="sba7-lu" id="sba7-lu" aria-live="polite"></section>'
    + '<div class="sba7-jet" id="sba7-jet" data-libre="houblon"></div>'
    + '<div class="sba7-o"><span id="sba7-oh"></span>' + aide('sba7', ['Le fléau reste droit : même IBU. Il tremble quand l’α n’est pas celui d’un lot : l’IBU de ta stout devient une plage.', 'Le tas : les grammes qu’il faut. Plein : ton stock ; pointillé : ce qui manque ou s’achète.', 'Barres : ta stout (rond noir) et avec lui (~ simulé, 2 g/L) ; hachures : non simulé, pas zéro.'], 'bottom:32px;left:0') + lentille('sba7') + '</div>'
    + '<div id="sba7-fam" class="sba7-deux"></div>'
    + '<footer class="sba7-foot" id="sba7-pied"></footer>',
  script: function () {
    var S = window.S, H = S.H, bal = document.getElementById('sba7-bal');
    document.getElementById('sba7-mom').textContent = S.MOM[S.m];
    var l = S.cands.slice().sort(function (a, b) { return (S.etat(a) === 'achat' ? 1 : 0) - (S.etat(b) === 'achat' ? 1 : 0) || S.score(b)[0] - S.score(a)[0]; }).slice(0, 9);
    var gpp = 1.4; // px par gramme
    function tas(x, g, c, libre, id) {
      // un sachet par 10 g, empilés ; au-delà du stock, en pointillé
      var h = Math.max(6, g * gpp), hl = libre == null ? 0 : Math.min(h, libre * gpp);
      return '<g id="' + id + '"><rect x="' + (x - 34) + '" y="' + (150 - h) + '" width="68" height="' + (h - hl) + '" fill="#fff" stroke="' + c + '" stroke-width="2" stroke-dasharray="4 3"/>'
        + '<rect x="' + (x - 34) + '" y="' + (150 - hl) + '" width="68" height="' + hl + '" fill="' + c + '" opacity=".85"/></g>';
    }
    bal.innerHTML = '<svg width="366" height="250" viewBox="0 0 366 250" aria-hidden="true">'
      + '<path d="M183 48 L163 236 H203 Z" fill="#eceef2" stroke="#8b8d96" stroke-width="1.5"/><rect x="133" y="236" width="100" height="8" fill="#8b8d96"/>'
      + '<g class="sba7-fleau" id="sba7-fl"><line x1="52" y1="40" x2="314" y2="40" stroke="#16161a" stroke-width="5" stroke-linecap="round"/><circle cx="183" cy="40" r="7" fill="#16161a"/></g>'
      + '<g id="sba7-pg" class="sba7-pl"><line x1="62" y1="40" x2="62" y2="150" stroke="#8b8d96"/></g>'
      + '<g transform="translate(0,0)"><line x1="20" y1="152" x2="104" y2="152" stroke="#16161a" stroke-width="4" stroke-linecap="round"/><rect x="28" y="' + (150 - 46 * gpp) + '" width="68" height="' + (46 * gpp) + '" fill="#4b4b55"/><text x="62" y="' + (150 - 46 * gpp + 18) + '" text-anchor="middle" font-size="15" font-weight="700" fill="#fff">46 g</text></g><text x="62" y="178" text-anchor="middle" font-size="13" fill="#16161a">Nugget</text></g>'
      + '<g id="sba7-pd" class="sba7-pl"><line x1="304" y1="40" x2="304" y2="150" stroke="#8b8d96"/><line x1="262" y1="152" x2="346" y2="152" stroke="#16161a" stroke-width="4" stroke-linecap="round"/><g id="sba7-tas"></g><text id="sba7-dg" x="304" y="180" text-anchor="middle" font-size="15" font-weight="700" fill="#16161a"></text></g>'
      + '<text x="183" y="18" text-anchor="middle" font-size="13" fill="#55555f" id="sba7-ibu"></text>'
      + '</svg>';
    var fl = document.getElementById('sba7-fl'), pg = document.getElementById('sba7-pg'), pd = document.getElementById('sba7-pd'), tic = null;
    function poser(a) { var dy = 121 * Math.sin(a * Math.PI / 180); fl.style.transform = 'rotate(' + a + 'deg)'; pg.style.transform = 'translateY(' + (-dy).toFixed(1) + 'px)'; pd.style.transform = 'translateY(' + dy.toFixed(1) + 'px)'; }
    function trembler(A) { clearInterval(tic); tic = null; if (!A) { poser(0); return; } var sgn = 1; poser(A); tic = setInterval(function () { sgn = -sgn; poser(sgn * A); }, 850); }
    document.getElementById('sba7-jet').innerHTML = l.map(function (s) { return '<button type="button" class="sba7-je" data-k="' + s.key + '" aria-pressed="false" data-fiche-de="' + s.key + '"><span>' + S.pt(s.key, 8) + '<span data-houblon="' + s.key + '">' + H[s.key].name + '</span></span><span class="num">' + S.stock(s) + S.dose(s) + '</span></button>'; }).join('');
    var tard = S.m !== 'b60';
    document.getElementById('sba7-oh').textContent = tard ? 'ce qu’il apporte ' + S.MOM[S.m] : 'à 60′ l’arôme part ; ce qui reste';
    var lire = S.barres(document.getElementById('sba7-fam'), S.ORDRE);
    var maj = S.pied(document.getElementById('sba7-pied'));
    S.surChoix(function (s) {
      document.querySelectorAll('.sba7-je').forEach(function (b) { b.setAttribute('aria-pressed', String(!!s && b.dataset.k === s.key)); });
      if (!s) { document.getElementById('sba7-tas').innerHTML = ''; document.getElementById('sba7-dg').textContent = '?'; trembler(0); poser(-9); document.getElementById('sba7-lu').innerHTML = '<b>Pose un remplaçant à droite</b>'; lire(null); maj(null); return; }
      var libre = S.etat(s) === 'achat' ? 0 : s.stock.libre;
      document.getElementById('sba7-tas').innerHTML = tas(304, s.dose.g, S.C[s.key], libre, 'sba7-t1');
      var r = S.ibu(s), tr = r && r[0] !== r[1];
      document.getElementById('sba7-dg').textContent = S.dose(s);
      document.getElementById('sba7-dg').setAttribute('y', String(150 - Math.max(6, s.dose.g * gpp) - 6));
      trembler(tr ? Math.min(6, (r[1] - r[0]) / 4) : 0);
      document.getElementById('sba7-ibu').textContent = 'ta stout : ' + S.ibuTxt(s) + ' · style 50–70';
      document.getElementById('sba7-lu').innerHTML = '<b data-houblon="' + s.key + '">' + H[s.key].name + '</b><p>' + S.alphaHtml(s.key) + '<span class="num" style="color:#55555f">fiches ' + S.plage(s.key) + '</span>' + S.usageHtml(s.key) + S.stock(s, true) + '<span class="num">score ' + S.scoreTxt(s) + '</span></p>';
      lire(s); maj(s);
    });
    var vol = null;
    document.querySelectorAll('.sba7-je').forEach(function (b) { b.addEventListener('pointerdown', function (e) { vol = { b: b, x: e.clientX, y: e.clientY, g: null }; }); });
    addEventListener('pointermove', function (e) {
      if (!vol) return;
      if (!vol.g && Math.hypot(e.clientX - vol.x, e.clientY - vol.y) > 8) { vol.g = vol.b.cloneNode(true); vol.g.classList.add('sba7-vole'); document.body.appendChild(vol.g); }
      if (vol.g) { vol.g.style.left = (e.clientX - 55) + 'px'; vol.g.style.top = (e.clientY - 24) + 'px'; }
    });
    addEventListener('pointerup', function (e) {
      if (!vol) return; var v = vol; vol = null;
      if (v.g) { v.g.remove(); var r = bal.getBoundingClientRect(); if (e.clientY < r.bottom && e.clientY > r.top) S.choisir(v.b.dataset.k); } else S.choisir(v.b.dataset.k);
    });
    S.choisir(S.depart || null);
  },
};
