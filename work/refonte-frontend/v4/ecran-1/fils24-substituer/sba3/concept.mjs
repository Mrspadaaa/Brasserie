// sba3 · tiède · le geste d'abord : glisser un jeton de houblon sur la ligne de recette. La fiche de brassage répond.
import { CROIX, lentille, aide } from '../sba1/socle.mjs';

export default {
  id: 'sba3', nom: 'Glisser sur la ligne de recette', chaleur: 'tiède',
  etats: [['geste', '?choix=beermaverick-galaxy'], ['whirlpool', '?moment=wp'], ['fiche', '?fiche=beermaverick-galaxy']],
  css: `
.sba3-page { padding:6px 12px 16px; display:flex; flex-direction:column; gap:10px; }
.sba3-t { display:flex; align-items:center; gap:10px; }
.sba3-t h1 { font:700 19px/1.15 var(--sans); }
.sba3-fiche { border:1px solid #c9cad2; border-radius:8px; padding:8px 10px 10px; display:flex; flex-direction:column; gap:7px; background:#fff; box-shadow:0 6px 18px -14px rgba(22,22,26,.5); }
.sba3-fh { display:flex; align-items:baseline; gap:8px; font-size:13px; color:#e9dccf; background:#2a1a12; margin:-8px -10px 0; padding:9px 10px; border-radius:8px 8px 0 0; }
.sba3-fh b { font-size:15px; color:#fff; }
.sba3-ligne { display:grid; grid-template-columns:60px 1fr; gap:6px; align-items:center; }
.sba3-moment { font:700 16px/1 var(--mono); text-align:center; background:var(--mur); border-radius:8px; height:52px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; }
.sba3-moment span { font:400 11px/1 var(--sans); color:var(--gris); }
.sba3-slot { height:52px; border:2px dashed #8b8d96; border-radius:8px; display:flex; align-items:center; gap:8px; padding:0 10px; font-size:14px; transition:background .15s, border-color .15s; }
.sba3-slot.sba3-sur { background:#eef6f2; border-color:#009E73; }
.sba3-slot.sba3-plein { border-style:solid; border-color:var(--encre); }
.sba3-slot b { font-size:16px; }
.sba3-slot .num { margin-left:auto; font-size:16px; font-weight:700; }
.sba3-barre { text-decoration:line-through; color:var(--gris); font-size:13px; display:flex; align-items:center; gap:6px; padding-left:66px; }
.sba3-rep { display:grid; grid-template-columns:auto 1fr; gap:3px 8px; align-items:center; font-size:13px; }
.sba3-rep .sb-j { grid-column:1 / -1; }
.sba3-rep b { text-align:right; }
.sba3-o { display:flex; align-items:center; gap:6px; position:relative; }
.sba3-o > span:first-child { font-size:12px; color:var(--gris); margin-right:auto; }
.sba3-gp { display:flex; gap:10px; font-size:12px; color:var(--gris); align-items:center; flex-wrap:wrap; }
.sba3-gp span { display:inline-flex; gap:2px; align-items:center; }
.sba3-plateau h2 { font:600 13px/1 var(--sans); color:var(--gris); margin:2px 0 6px; }
.sba3-jetons { display:flex; flex-wrap:wrap; gap:6px; }
.sba3-je { display:inline-flex; align-items:center; gap:6px; height:44px; padding:0 12px 0 8px; border-radius:22px; border:1px solid #c9cad2; background:#fff; font-size:14px; touch-action:none; user-select:none; }
.sba3-je b { font-weight:600; }
.sba3-je .num { font-size:12px; color:var(--gris); }
.sba3-je[aria-pressed="true"] { border:2px solid var(--encre); }
.sba3-je.sba3-vole { position:fixed; z-index:50; pointer-events:none; box-shadow:0 10px 26px -10px rgba(22,22,26,.55); }
`,
  corps: '<header class="sba3-t">' + CROIX + '<h1 data-role="titre">Lequel à la place de Nugget ?</h1></header>'
    + '<article class="sba3-fiche" data-role="contexte">'
    + '<p class="sba3-fh"><b data-contexte="base">Stout export 16D</b><span>20 L · DI 1,066 · 70 EBC</span><span data-contexte="dose">même IBU</span></p>'
    + '<div class="sba3-ligne"><div class="sba3-moment" data-contexte="moment" id="sba3-mom">60′<span>ébullition</span></div><div class="sba3-slot" id="sba3-slot" aria-live="polite"></div></div>'
    + '<p class="sba3-barre" data-contexte="houblon" data-fiche-de="beermaverick-nugget"><span data-houblon="beermaverick-nugget">Nugget</span> 46 g · α 13 % · épuisé</p>'
    + '<div class="sba3-rep"><span>amertume de ta stout</span><b class="num" id="sba3-ibu"></b><span class="sb-j" id="sba3-j"></span></div>'
    + '<div class="sba3-o"><span id="sba3-oh"></span>' + aide('sba3', ['Glisse un jeton sur la ligne pointillée, ou touche-le : la fiche se recalcule à la dose du même IBU.', 'Rond noir : ta stout ; barre : avec ce houblon (~ simulé, 2 g/L) ; hachures : non simulé, pas zéro. Gris : zone du style.', 'Perd, gagne : familles citées par les fiches, pas une intensité.'], 'top:32px;left:0') + lentille('sba3') + '</div>'
    + '<div id="sba3-fam"></div><p class="sba3-gp" id="sba3-gp"></p>'
    + '<div id="sba3-pied"></div>'
    + '</article>'
    + '<section class="sba3-plateau" data-libre="houblon"><h2>Dans ton stock</h2><div class="sba3-jetons" id="sba3-st"></div><h2 style="margin-top:10px">À acheter</h2><div class="sba3-jetons" id="sba3-ac"></div></section>',
  script: function () {
    var S = window.S, H = S.H, slot = document.getElementById('sba3-slot');
    document.getElementById('sba3-mom').innerHTML = S.m === 'b60' ? '60′<span>ébullition</span>' : S.m === 'wp' ? 'WP<span>whirlpool</span>' : 'J+3<span>à froid</span>';
    var tard = S.m !== 'b60';
    document.getElementById('sba3-oh').textContent = tard ? 'ce qu’il apporte ' + S.MOM[S.m] : 'à 60′ l’arôme part ; ce qui reste';
    function jeton(s) { return '<button type="button" class="sba3-je" data-k="' + s.key + '" aria-pressed="false" data-fiche-de="' + s.key + '">' + S.pt(s.key) + '<b data-houblon="' + s.key + '">' + H[s.key].name + '</b>' + S.stock(s) + '<span class="num">' + S.scoreTxt(s) + '</span></button>'; }
    document.getElementById('sba3-st').innerHTML = S.cands.filter(function (s) { return S.etat(s) !== 'achat'; }).map(jeton).join('');
    document.getElementById('sba3-ac').innerHTML = S.cands.filter(function (s) { return S.etat(s) === 'achat'; }).map(jeton).join('');
    var lire = S.barres(document.getElementById('sba3-fam'), S.ORDRE);
    var jg = S.jauge(document.getElementById('sba3-j')), maj = S.pied(document.getElementById('sba3-pied'));
    S.surChoix(function (s) {
      document.querySelectorAll('.sba3-je').forEach(function (b) { b.setAttribute('aria-pressed', String(!!s && b.dataset.k === s.key)); });
      slot.classList.toggle('sba3-plein', !!s);
      slot.innerHTML = s ? S.pt(s.key) + '<b data-houblon="' + s.key + '">' + H[s.key].name + '</b>' + S.alphaHtml(s.key) + S.usageHtml(s.key) + '<span class="num">' + S.dose(s) + '</span>' : '<span style="color:#55555f">glisse un houblon ici</span>';
      document.getElementById('sba3-ibu').textContent = S.ibuTxt(s) + (s ? ' · ' + S.stockMot(s) : '');
      jg(s); lire(s); maj(s);
      document.getElementById('sba3-gp').innerHTML = s ? '<span>perd ' + (S.gp(s, 'perd') || '—') + '</span><span>gagne ' + (S.gp(s, 'gagne') || '—') + '</span>' + (tard ? '' : '<span>(à 60′, ces arômes partent)</span>') : '';
    });
    // Glisser-déposer : le jeton suit le doigt ; lâché sur la ligne, il remplace Nugget. Un toucher suffit aussi.
    var vol = null;
    document.querySelectorAll('.sba3-je').forEach(function (b) {
      b.addEventListener('pointerdown', function (e) { vol = { b: b, x: e.clientX, y: e.clientY, g: null, id: e.pointerId }; });
    });
    addEventListener('pointermove', function (e) {
      if (!vol) return;
      if (!vol.g && Math.hypot(e.clientX - vol.x, e.clientY - vol.y) > 8) { vol.g = vol.b.cloneNode(true); vol.g.classList.add('sba3-vole'); document.body.appendChild(vol.g); }
      if (vol.g) { vol.g.style.left = (e.clientX - 50) + 'px'; vol.g.style.top = (e.clientY - 22) + 'px'; var r = slot.getBoundingClientRect(); slot.classList.toggle('sba3-sur', e.clientY > r.top - 20 && e.clientY < r.bottom + 20); }
    });
    addEventListener('pointerup', function (e) {
      if (!vol) return; var v = vol; vol = null; slot.classList.remove('sba3-sur');
      if (v.g) { v.g.remove(); var r = slot.getBoundingClientRect(); if (e.clientY > r.top - 20 && e.clientY < r.bottom + 20) S.choisir(v.b.dataset.k); }
      else S.choisir(v.b.dataset.k);
    });
    S.choisir(S.depart || null);
  },
};
