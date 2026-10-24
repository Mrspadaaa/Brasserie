// sba1 · froide · u4 affinée : le classement qu'on touche. Toucher une ligne l'ouvre en place, et la recette répond.
import { CROIX, lentille, aide } from './socle.mjs';

export default {
  id: 'sba1', nom: 'La liste qu’on touche (u4 affinée)', chaleur: 'froide',
  etats: [['geste', '?choix=beermaverick-magnat'], ['whirlpool', '?moment=wp'], ['fiche', '?fiche=beermaverick-nelson-sauvin']],
  css: `
.sba1-page { padding:6px 12px 150px; display:flex; flex-direction:column; gap:8px; }
.sba1-t { display:flex; align-items:center; gap:10px; }
.sba1-t h1 { font:700 19px/1.15 var(--sans); }
.sba1-ctx { display:flex; flex-wrap:wrap; gap:4px; align-items:center; font-size:13px; }
.sba1-ctx > span { display:inline-flex; align-items:center; gap:4px; height:26px; padding:0 9px; border-radius:13px; background:var(--mur); }
.sba1-ctx .sba1-f { background:none; padding:0 2px; color:var(--gris); font-size:12px; }
.sba1-rep { border-left:4px solid var(--encre); padding:2px 0 2px 10px; }
.sba1-rep b { font:700 17px/1.2 var(--sans); display:block; }
.sba1-rep span { color:var(--gris); font-size:13px; }
.sba1-axe { display:grid; grid-template-columns:118px 1fr; font-size:12px; color:var(--gris); }
.sba1-axe div { position:relative; height:14px; }
.sba1-axe i { position:absolute; font-style:normal; transform:translateX(-50%); }
.sba1-l { display:flex; flex-direction:column; }
.sba1-r { display:grid; grid-template-columns:118px 1fr; align-items:center; min-height:32px; border-radius:8px; text-align:left; width:100%; }
.sba1-r[aria-pressed="true"] { background:var(--mur); }
.sba1-n { display:flex; align-items:center; gap:5px; font-size:14px; white-space:nowrap; overflow:hidden; padding-left:4px; }
.sba1-n b { font-weight:600; overflow:hidden; text-overflow:ellipsis; }
.sba1-tr { position:relative; height:24px; margin-right:46px; background:linear-gradient(90deg,transparent calc(30% - 1px),#c9cad2 calc(30% - 1px) 30%,transparent 30% 60%,#dcdfe5 60%); border-radius:2px; }
.sba1-tr i { position:absolute; top:7px; height:10px; border-radius:5px; }
.sba1-tr .sba1-h { background:repeating-linear-gradient(135deg,#6b6d76 0 2px,#fff 2px 5px); border:1px solid #6b6d76; }
.sba1-tr .sba1-v { position:absolute; right:-46px; top:2px; font-size:13px; font-weight:700; width:44px; white-space:nowrap; text-align:right; }
.sba1-o { background:var(--mur); border-radius:0 0 8px 8px; margin-top:-4px; padding:6px 8px 8px; display:flex; flex-direction:column; gap:6px; }
.sba1-o-l { display:flex; flex-wrap:wrap; gap:4px 12px; font-size:13px; align-items:center; }
.sba1-o-l b { font-size:15px; }
.sba1-o-j { display:grid; grid-template-columns:auto 1fr; gap:3px 8px; align-items:center; font-size:13px; }
.sba1-o-j .sb-j { grid-column:1 / -1; background:#fff; }
.sba1-o-h { display:flex; align-items:center; gap:6px; position:relative; }
.sba1-o-h > span:first-child { font-size:12px; color:var(--gris); margin-right:auto; }
.sba1-fam .sb-piste { background:#fff; }
.sba1-foot { position:fixed; left:0; right:0; bottom:0; background:#fff; border-top:1px solid var(--trait); padding:8px 12px 12px; max-width:390px; margin:0 auto; }
`,
  corps: '<header class="sba1-t">' + CROIX + '<h1 data-role="titre">Lequel à la place de Nugget ?</h1></header>'
    + '<p class="sba1-ctx" data-role="contexte"><span class="sba1-f">fixé</span><span data-contexte="houblon" data-fiche-de="beermaverick-nugget"><i class="sb-pt" style="background:#4b4b55" data-couleur="#4b4b55" data-serie="Nugget"></i><span data-houblon="beermaverick-nugget">Nugget</span> <span class="num">α 13 %</span><span class="sb-stk sb-manque"><span>épuisé</span></span></span>'
    + '<span data-contexte="moment" id="sba1-mom">à 60′</span><span data-contexte="dose">même IBU</span><span data-contexte="base">Stout 16D</span></p>'
    + '<p class="sba1-rep" id="sba1-rep"></p>'
    + '<div class="sba1-axe" aria-hidden="true"><span></span><div><i style="left:0">50</i><i style="left:30%">65</i><i style="left:60%">80</i><i style="left:calc(100% - 46px)">100</i></div></div>'
    + '<div class="sba1-l" id="sba1-l" data-libre="houblon" role="group" aria-label="Remplaçants classés"></div>'
    + '<footer class="sba1-foot" id="sba1-pied"></footer>'
    + '<div class="sba1-o-h" id="sba1-outils" hidden><span id="sba1-oh-t"></span>' + aide('sba1', ['Point : score sûr. Hachures : une composante inconnue, qui peut valoir de 0 à 100 ; rangé par le pire cas.', 'Rond noir : ta stout aujourd’hui ; barre : avec ce remplaçant (~ simulé, 2 g/L). Gris : la zone du style 16D.', 'Hachures dans une barre : ce houblon n’est pas simulé, ce n’est pas zéro.'], 'top:30px;right:0') + lentille('sba1') + '</div>',
  script: function () {
    var S = window.S, H = S.H, L = document.getElementById('sba1-l');
    document.getElementById('sba1-mom').textContent = S.MOM[S.m];
    // Rangés par le pire cas (u4) : la composante inconnue peut valoir 0.
    var l = S.cands.slice().sort(function (a, b) { return S.score(b)[0] - S.score(a)[0] || S.score(b)[1] - S.score(a)[1]; });
    var x = function (v) { return Math.max(0, (v - 50) / 50 * 100); };
    var depart = S.depart || (l.filter(function (s) { return S.etat(s) === 'ok'; })[0] || l[0]).key;
    function ligne(s) {
      var r = S.score(s), seg = r[0] === r[1] ? '<i style="left:calc(' + x(r[0]) + '% - 5px);width:10px;background:' + S.C[s.key] + '"></i>'
        : '<i class="sba1-h" style="left:' + x(r[0]) + '%;width:' + (x(r[1]) - x(r[0])) + '%"></i><i style="left:calc(' + x(r[1]) + '% - 5px);width:10px;background:' + S.C[s.key] + '"></i>';
      return '<button type="button" class="sba1-r" data-k="' + s.key + '" aria-pressed="false" data-fiche-de="' + s.key + '"><span class="sba1-n">' + S.stock(s) + '<b data-houblon="' + s.key + '">' + H[s.key].name + '</b></span>'
        + '<span class="sba1-tr">' + seg + '<span class="sba1-v num">' + S.scoreTxt(s) + '</span></span></button><div class="sba1-o" data-o="' + s.key + '" hidden></div>';
    }
    L.innerHTML = l.map(ligne).join('');
    var sure = l.filter(function (s) { var r = S.score(s); return r[0] === r[1]; }).slice(0, 2).map(function (s) { return H[s.key].name; });
    var st = l.filter(function (s) { return S.etat(s) === 'ok'; }).map(function (s) { return H[s.key].name; });
    document.getElementById('sba1-rep').innerHTML = '<b>' + sure.join(' et ') + ', sans inconnue.</b><span>Dans ton stock, assez : ' + (st.join(', ') || 'aucun') + '.</span>';
    var maj = S.pied(document.getElementById('sba1-pied')), lire = null, jg = null;
    function ouvrir(s) {
      L.querySelectorAll('.sba1-r').forEach(function (b) { b.setAttribute('aria-pressed', String(!!s && b.dataset.k === s.key)); });
      var ou0 = document.getElementById('sba1-outils'); if (ou0) { ou0.hidden = true; document.querySelector('.sba1-page').appendChild(ou0); }
    L.querySelectorAll('.sba1-o').forEach(function (o) { o.hidden = true; o.innerHTML = ''; });
      if (!s) return;
      var o = L.querySelector('[data-o="' + s.key + '"]'); o.hidden = false;
      var tard = S.m !== 'b60';
      o.innerHTML = '<div class="sba1-o-l"><b class="num">' + S.dose(s) + '</b>' + S.alphaHtml(s.key) + '<span class="num">' + S.plage(s.key) + '</span>' + S.usageHtml(s.key) + S.stock(s, true) + '</div>'
        + '<div class="sba1-o-j"><span>amertume de ta stout</span><b class="num" id="sba1-ibu">' + S.ibuTxt(s) + '</b><span class="sb-j" id="sba1-j"></span></div>'
        + '<div id="sba1-ici"></div>'
        + '<div class="sba1-fam" id="sba1-fam"></div>';
      lire = S.barres(o.querySelector('#sba1-fam'), S.ORDRE);
      lire(s); S.jauge(o.querySelector('#sba1-j'))(s);
      var ou = document.getElementById('sba1-outils'); ou.hidden = false; o.querySelector('#sba1-ici').replaceWith(ou); document.getElementById('sba1-oh-t').textContent = tard ? 'ce qu’il apporte ' + S.MOM[S.m] : 'à 60′, l’arôme part : ce qui reste';
    }
    S.surChoix(function (s) { ouvrir(s); maj(s); });
    L.addEventListener('click', function (e) { var b = e.target.closest('.sba1-r'); if (!b) return; S.choisir(b.getAttribute('aria-pressed') === 'true' ? null : b.dataset.k); });
    S.choisir(depart);
    if (/legende=1/.test(location.search)) setTimeout(function () { var b = document.querySelector('[data-role=legende-bouton]'); if (b) b.click(); }, 80);
  },
};
