// sba4 · tiède · le geste d'abord : rouler une molette de remplaçants ; Nugget reste fixe en face, la stout répond.
import { CROIX, lentille, aide } from '../sba1/socle.mjs';

export default {
  id: 'sba4', nom: 'La molette face à Nugget', chaleur: 'tiède',
  etats: [['geste', '?choix=beermaverick-idaho-7'], ['whirlpool', '?moment=wp']],
  css: `
.sba4-page { padding:6px 12px 150px; display:flex; flex-direction:column; gap:8px; }
.sba4-t { display:flex; align-items:center; gap:10px; }
.sba4-t h1 { font:700 19px/1.15 var(--sans); }
.sba4-duo { display:grid; grid-template-columns:104px 24px 1fr; align-items:center; }
.sba4-nug { background:#4b4b55; color:#fff; border-radius:8px; padding:8px; display:flex; flex-direction:column; gap:3px; font-size:13px; }
.sba4-nug b { font-size:17px; }
.sba4-nug .num { font-size:15px; font-weight:700; }
.sba4-nug .sba4-ep { color:#fff; font-size:12px; text-decoration:underline; text-decoration-color:#ff9a6b; text-underline-offset:3px; }
.sba4-fl { text-align:center; font-size:18px; color:var(--gris); }
.sba4-roue { position:relative; height:250px; overflow-y:scroll; scroll-snap-type:y mandatory; scrollbar-width:none; perspective:400px; touch-action:pan-y;
  mask-image:linear-gradient(rgba(0,0,0,.35), #000 22%, #000 78%, rgba(0,0,0,.35)); -webkit-mask-image:linear-gradient(rgba(0,0,0,.35), #000 22%, #000 78%, rgba(0,0,0,.35)); }
.sba4-roue::-webkit-scrollbar { display:none; }
.sba4-roue::before, .sba4-roue::after { content:""; display:block; height:100px; }
.sba4-cran { height:50px; scroll-snap-align:center; display:flex; align-items:center; gap:7px; padding:0 8px; font-size:15px; transform-origin:center; width:100%; text-align:left; }
.sba4-cran b { font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.sba4-cran .num { margin-left:auto; font-weight:700; }
.sba4-cran[aria-current="true"] b { font-size:19px; font-weight:800; }
.sba4-fen { position:absolute; left:128px; right:12px; top:calc(var(--y) + 100px); height:50px; border-top:2px solid var(--encre); border-bottom:2px solid var(--encre); pointer-events:none; }
.sba4-rep { border-top:1px solid var(--trait); padding-top:8px; display:flex; flex-direction:column; gap:7px; }
.sba4-rl { display:flex; flex-wrap:wrap; gap:4px 12px; align-items:center; font-size:13px; }
.sba4-rl .num { font-size:14px; }
.sba4-ibu { display:grid; grid-template-columns:auto 1fr; gap:3px 8px; font-size:13px; align-items:center; }
.sba4-ibu b { text-align:right; }
.sba4-ibu .sb-j { grid-column:1 / -1; }
.sba4-o { display:flex; align-items:center; gap:6px; position:relative; }
.sba4-o > span:first-child { font-size:12px; color:var(--gris); margin-right:auto; }
.sba4-gp { display:grid; grid-template-columns:auto 1fr; gap:4px 8px; font-size:12px; color:var(--gris); align-items:center; }
.sba4-gp span:nth-child(even) { display:flex; gap:3px; }
.sba4-foot { position:fixed; left:0; right:0; bottom:0; background:#fff; border-top:1px solid var(--trait); padding:8px 12px 12px; max-width:390px; margin:0 auto; }
`,
  corps: '<header class="sba4-t">' + CROIX + '<h1 data-role="titre">Lequel à la place de Nugget ?</h1></header>'
    + '<div class="sba4-duo" style="position:relative">'
    + '<div class="sba4-nug" data-role="contexte"><span data-contexte="houblon" data-fiche-de="beermaverick-nugget"><b data-houblon="beermaverick-nugget">Nugget</b></span><span class="num">46 g</span><span>α 13 % · mixte</span><span data-contexte="moment" id="sba4-mom">à 60′</span><span data-contexte="dose">même IBU</span><span data-contexte="base">Stout 16D</span><span class="sba4-ep">épuisé</span></div>'
    + '<span class="sba4-fl" aria-hidden="true">→</span>'
    + '<div class="sba4-roue" id="sba4-roue" data-libre="houblon" role="listbox" aria-label="Molette des remplaçants" tabindex="0"></div>'
    + '</div>'
    + '<section class="sba4-rep">'
    + '<p class="sba4-rl" id="sba4-rl"></p>'
    + '<div class="sba4-ibu"><span>amertume de ta stout</span><b class="num" id="sba4-ibu"></b><span class="sb-j" id="sba4-j"></span></div>'
    + '<div class="sba4-o"><span id="sba4-oh"></span>' + aide('sba4', ['Roule la molette : le remplaçant au centre prend la place de Nugget, à la dose du même IBU.', 'Rond noir : ta stout ; barre : avec lui (~ simulé, 2 g/L) ; hachures : non simulé, pas zéro. Gris : zone du style 16D.', 'Perd, gagne : ce que citent les fiches, pas une intensité.'], 'top:32px;left:0') + lentille('sba4') + '</div>'
    + '<div id="sba4-fam"></div><p class="sba4-gp" id="sba4-gp"></p>'
    + '</section><footer class="sba4-foot" id="sba4-pied"></footer>',
  script: function () {
    var S = window.S, H = S.H, roue = document.getElementById('sba4-roue');
    document.getElementById('sba4-mom').textContent = S.MOM[S.m];
    var l = S.cands.slice().sort(function (a, b) { return a.rangGeneral - b.rangGeneral || b.score - a.score; });
    roue.innerHTML = l.map(function (s, i) { return '<button type="button" class="sba4-cran" role="option" data-i="' + i + '" data-fiche-de="' + s.key + '">' + S.pt(s.key) + '<b data-houblon="' + s.key + '">' + H[s.key].name + '</b>' + S.stock(s) + '<span class="num">' + S.dose(s) + '</span></button>'; }).join('');
    var crans = roue.querySelectorAll('.sba4-cran'), tard = S.m !== 'b60';
    document.getElementById('sba4-oh').textContent = tard ? 'ce qu’il apporte ' + S.MOM[S.m] : 'à 60′ l’arôme part ; ce qui reste';
    var lire = S.barres(document.getElementById('sba4-fam'), S.ORDRE);
    var jg = S.jauge(document.getElementById('sba4-j')), maj = S.pied(document.getElementById('sba4-pied'));
    function courbe() {
      var c = roue.scrollTop + 125;
      crans.forEach(function (e) { var d = (e.offsetTop + 25 - c) / 50; e.style.transform = 'rotateX(' + (-d * 18).toFixed(1) + 'deg) scale(' + (1 - Math.min(0.12, Math.abs(d) * 0.05)).toFixed(3) + ')'; e.setAttribute('aria-current', String(Math.abs(d) < 0.5)); });
      return Math.max(0, Math.min(l.length - 1, Math.round((c - 125) / 50)));
    }
    S.surChoix(function (s) {
      if (!s) return;
      document.getElementById('sba4-rl').innerHTML = '<b style="font-size:16px" data-houblon="' + s.key + '">' + H[s.key].name + '</b>' + S.alphaHtml(s.key) + '<span class="num" style="color:#55555f">' + S.plage(s.key) + '</span>' + S.usageHtml(s.key) + S.stock(s, true) + '<span class="num">score ' + S.scoreTxt(s) + '</span>';
      document.getElementById('sba4-ibu').textContent = S.ibuTxt(s) + (S.dosePlage(s) ? ' · ' + S.dosePlage(s) : '');
      jg(s); lire(s); maj(s);
      document.getElementById('sba4-gp').innerHTML = '<span>perd' + (tard ? '' : ' (part au 60′)') + '</span><span>' + (S.gp(s, 'perd') || '—') + '</span><span>gagne</span><span>' + (S.gp(s, 'gagne') || '—') + '</span>';
    });
    var t = null, der = -1;
    roue.addEventListener('scroll', function () { var i = courbe(); if (i !== der) { der = i; S.choisir(l[i].key); } });
    roue.addEventListener('click', function (e) { var b = e.target.closest('.sba4-cran'); if (b) roue.scrollTo({ top: +b.dataset.i * 50, behavior: 'smooth' }); });
    roue.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); roue.scrollBy({ top: e.key === 'ArrowDown' ? 50 : -50, behavior: 'smooth' }); } });
    var dep = S.depart ? l.findIndex(function (s) { return s.key === S.depart; }) : l.findIndex(function (s) { return S.etat(s) === 'ok'; });
    if (dep < 0) dep = 0;
    roue.scrollTop = dep * 50; der = dep; courbe(); S.choisir(l[dep].key);
    var fen = document.createElement('i'); fen.className = 'sba4-fen'; fen.style.setProperty('--y', roue.offsetTop + 'px'); roue.parentNode.appendChild(fen);
  },
};
