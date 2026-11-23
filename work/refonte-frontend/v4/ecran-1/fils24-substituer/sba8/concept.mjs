// sba8 · chaude · forme libre : une main de cartes en éventail, sous le pouce. Le pouce glisse sur l'éventail,
// la carte dessous se lève ; en haut, le ticket de la recette se réécrit à chaque carte levée.
import { CROIX, lentille, aide } from '../sba1/socle.mjs';

export default {
  id: 'sba8', nom: 'L’éventail sous le pouce', chaleur: 'chaude',
  etats: [['geste', '?choix=beermaverick-yeoman'], ['whirlpool', '?moment=wp'], ['fiche', '?fiche=beermaverick-galaxy']],
  css: `
.sba8-page { padding:6px 12px 0; display:flex; flex-direction:column; gap:8px; min-height:844px; }
.sba8-t { display:flex; align-items:center; gap:10px; }
.sba8-t h1 { font:700 19px/1.15 var(--sans); }
.sba8-ticket { border-radius:8px; background:var(--mur); padding:10px 12px; display:flex; flex-direction:column; gap:6px; position:relative; }
.sba8-ticket::before, .sba8-ticket::after { content:""; position:absolute; top:50%; width:14px; height:14px; border-radius:50%; background:#fff; margin-top:-7px; }
.sba8-ticket::before { left:-7px; } .sba8-ticket::after { right:-7px; }
.sba8-av { display:flex; align-items:center; gap:6px; font-size:14px; color:var(--gris); text-decoration:line-through; text-decoration-color:#8b8d96; }
.sba8-ap { display:flex; align-items:baseline; gap:8px; flex-wrap:wrap; }
.sba8-ap b.sba8-g { font:800 32px/1 var(--mono); }
.sba8-ap b.sba8-n { font:800 24px/1 var(--sans); }
.sba8-ctx { display:flex; gap:4px 10px; flex-wrap:wrap; font-size:12px; color:var(--gris); }
.sba8-ctx [data-contexte] { color:var(--encre); }
.sba8-id { display:flex; gap:4px 12px; flex-wrap:wrap; font-size:13px; align-items:center; }
.sba8-ibu { display:grid; grid-template-columns:auto 1fr; gap:3px 8px; font-size:13px; align-items:center; }
.sba8-ibu b { text-align:right; }
.sba8-ibu .sb-j { grid-column:1 / -1; background:#fff; }
.sba8-o { display:flex; align-items:center; gap:6px; position:relative; }
.sba8-o > span:first-child { font-size:12px; color:var(--gris); margin-right:auto; }
.sba8-main { position:relative; height:280px; margin:0 -12px; background:#24242a; touch-action:none; user-select:none; overflow:hidden; }
.sba8-c { position:absolute; left:50%; bottom:-120px; width:88px; height:200px; margin-left:-44px; border-radius:8px; background:#fff; border:1px solid #c9cad2; transform-origin:50% 420px;
  box-shadow:0 4px 14px -8px rgba(22,22,26,.45); transition:transform .15s cubic-bezier(.2,.8,.2,1); padding:8px 6px; display:flex; flex-direction:column; gap:4px; font-size:12px; }
.sba8-c i.sba8-b { height:24px; border-radius:2px; display:block; }
.sba8-c b { font-size:14px; line-height:1.1; }
.sba8-c .num { font-size:13px; font-weight:700; }
.sba8-c[aria-current="true"] { border:2px solid var(--encre); }
.sba8-sm { color:var(--gris); }
.sba8-sm.sba8-peu { color:var(--acc); }
.sba8-glisse { position:absolute; left:0; right:0; top:10px; text-align:center; font-size:12px; color:#e3e5eb; pointer-events:none; }
.sba8-pied { padding:8px 0 12px; }
.sba8-deux { display:grid; grid-template-columns:1fr 1fr; gap:2px 10px; }
.sba8-deux .sb-ba { grid-template-columns:76px 1fr 28px; gap:4px; font-size:12px; }
`,
  corps: '<header class="sba8-t">' + CROIX + '<h1 data-role="titre">Lequel à la place de Nugget ?</h1></header>'
    + '<section class="sba8-ticket" aria-live="polite">'
    + '<p class="sba8-ctx" data-role="contexte"><span data-contexte="moment" id="sba8-mom">à 60′</span><span data-contexte="dose">même IBU</span><span data-contexte="base">Stout export 16D</span></p>'
    + '<p class="sba8-av" data-contexte="houblon" data-fiche-de="beermaverick-nugget"><span class="num">46 g</span><span data-houblon="beermaverick-nugget">Nugget</span><span>α 13 % · épuisé</span></p>'
    + '<p class="sba8-ap" id="sba8-ap"></p><p class="sba8-id" id="sba8-id"></p>'
    + '<div class="sba8-ibu"><span>amertume de ta stout</span><b class="num" id="sba8-ibu"></b><span class="sb-j" id="sba8-j"></span></div>'
    + '<div class="sba8-o"><span id="sba8-oh"></span>' + aide('sba8', ['Glisse le pouce sur l’éventail : la carte dessous se lève et prend la place de Nugget dans la recette.', 'Cartes rangées par ressemblance à Nugget ; un score en plage a une composante inconnue (de 0 à 100).', 'Rond noir : ta stout ; barre : avec lui (~ simulé, 2 g/L) ; hachures : non simulé, pas zéro.'], 'top:32px;left:0') + lentille('sba8') + '</div>'
    + '<div id="sba8-fam" class="sba8-deux"></div>'
    + '</section>'
    + '<div class="sba8-main" id="sba8-main" data-libre="houblon" role="listbox" aria-label="Éventail des remplaçants" tabindex="0"><p class="sba8-glisse">← glisse le pouce →</p></div>'
    + '<div class="sba8-pied" id="sba8-pied"></div>',
  script: function () {
    var S = window.S, H = S.H, main = document.getElementById('sba8-main');
    document.getElementById('sba8-mom').textContent = S.MOM[S.m];
    var l = S.cands.slice().sort(function (a, b) { return S.score(b)[0] - S.score(a)[0] || S.score(b)[1] - S.score(a)[1]; });
    var n = l.length, pas = 8.5, a0 = -pas * (n - 1) / 2;
    main.insertAdjacentHTML('afterbegin', l.map(function (s, i) {
      return '<div class="sba8-c" role="option" data-i="' + i + '" data-fiche-de="' + s.key + '" style="z-index:' + i + '"><i class="sba8-b" style="background:' + S.C[s.key] + '"></i><b data-houblon="' + s.key + '">' + H[s.key].name + '</b><span class="num">' + S.scoreTxt(s) + '</span><span class="sba8-sm' + (S.etat(s) === 'peu' ? ' sba8-peu' : '') + '">' + S.stockMot(s) + '</span></div>';
    }).join(''));
    var cs = main.querySelectorAll('.sba8-c'), tard = S.m !== 'b60';
    document.getElementById('sba8-oh').textContent = tard ? 'ce qu’il apporte ' + S.MOM[S.m] : 'à 60′ l’arôme part ; ce qui reste';
    var lire = S.barres(document.getElementById('sba8-fam'), S.ORDRE);
    var jg = S.jauge(document.getElementById('sba8-j')), maj = S.pied(document.getElementById('sba8-pied'));
    function lever(k) {
      cs.forEach(function (c, j) { var a = a0 + j * pas, up = j === k; c.style.transform = 'rotate(' + a + 'deg) translateY(' + (up ? -58 : 0) + 'px)'; c.style.zIndex = up ? 99 : j; c.setAttribute('aria-current', String(up)); });
    }
    S.surChoix(function (s) {
      if (!s) { lever(-1); document.getElementById('sba8-ap').innerHTML = '<b class="sba8-n">recette inchangée</b>'; document.getElementById('sba8-id').innerHTML = ''; document.getElementById('sba8-ibu').textContent = S.ibuTxt(null); jg(null); lire(null); maj(null); return; }
      lever(l.indexOf(s));
      document.getElementById('sba8-ap').innerHTML = '<b class="sba8-g">' + S.dose(s) + '</b>' + S.pt(s.key, 12) + '<b class="sba8-n" data-houblon="' + s.key + '">' + H[s.key].name + '</b>';
      document.getElementById('sba8-id').innerHTML = S.alphaHtml(s.key) + '<span class="num" style="color:#55555f">fiches ' + S.plage(s.key) + '</span>' + S.usageHtml(s.key) + S.stock(s, true) + (S.dosePlage(s) ? '<span class="num" style="color:#55555f">' + S.dosePlage(s) + '</span>' : '');
      document.getElementById('sba8-ibu').textContent = S.ibuTxt(s);
      jg(s); lire(s); maj(s);
    });
    function sous(x) { var r = main.getBoundingClientRect(), t = (x - r.left) / r.width; return Math.max(0, Math.min(n - 1, Math.round(t * (n - 1)))); }
    var tire = false;
    main.addEventListener('pointerdown', function (e) { tire = true; main.setPointerCapture(e.pointerId); S.choisir(l[sous(e.clientX)].key); });
    main.addEventListener('pointermove', function (e) { if (tire) { var i = sous(e.clientX); if (l[i] !== S.courant()) S.choisir(l[i].key); } });
    main.addEventListener('pointerup', function () { tire = false; });
    main.addEventListener('keydown', function (e) { var c = S.courant(), i = c ? l.indexOf(c) : 0; if (e.key === 'ArrowRight') S.choisir(l[Math.min(n - 1, i + 1)].key); if (e.key === 'ArrowLeft') S.choisir(l[Math.max(0, i - 1)].key); });
    var dep = S.depart || (l.filter(function (s) { return S.etat(s) === 'ok'; })[0] || l[0]).key;
    S.choisir(dep);
  },
};
