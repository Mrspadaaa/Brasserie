// sba5 · tiède · le geste d'abord : balayer une pile de cartes. À droite, je garde (il entre dans la recette) ; à gauche, le suivant.
import { CROIX, lentille, aide } from '../sba1/socle.mjs';

export default {
  id: 'sba5', nom: 'La pile qu’on balaie', chaleur: 'tiède',
  etats: [['geste', '?choix=beermaverick-sabro'], ['whirlpool', '?moment=wp'], ['legende', '?legende=1']],
  css: `
.sba5-page { overflow-x:clip; padding:6px 12px 16px; display:flex; flex-direction:column; gap:8px; }
.sba5-t { display:flex; align-items:center; gap:10px; }
.sba5-t div { display:flex; flex-direction:column; gap:2px; }
.sba5-t h1 { font:700 18px/1.15 var(--sans); }
.sba5-ctx { font-size:12px; color:var(--gris); display:flex; gap:6px; flex-wrap:wrap; }
.sba5-pile { position:relative; height:575px; touch-action:pan-y; user-select:none; }
.sba5-c { position:absolute; inset:0; background:#fff; border:1px solid #c9cad2; border-radius:8px; padding:0 0 10px; display:flex; flex-direction:column; gap:7px; overflow:hidden; transition:transform .25s cubic-bezier(.2,.8,.2,1), opacity .25s; }
.sba5-c.sba5-d1 { transform:translate(8px, 10px) rotate(2deg); }
.sba5-c.sba5-d2 { transform:translate(-8px, 18px) rotate(-2.5deg); }
.sba5-c.sba5-d1 > *, .sba5-c.sba5-d2 > * { visibility:hidden; }
.sba5-bande { height:26px; display:block; }
.sba5-in { padding:0 12px; display:flex; flex-direction:column; gap:7px; }
.sba5-nom { display:flex; align-items:baseline; gap:8px; flex-wrap:wrap; }
.sba5-nom b { font:800 26px/1 var(--sans); }
.sba5-id { display:flex; gap:4px 12px; flex-wrap:wrap; font-size:14px; align-items:center; }
.sba5-gros { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
.sba5-gros div { background:var(--mur); border-radius:8px; padding:6px 8px; }
.sba5-gros b { display:block; font:700 18px/1.1 var(--mono); }
.sba5-gros span { font-size:12px; color:var(--gris); }
.sba5-gros .sba5-h b { color:var(--acc); }
.sba5-o { display:flex; align-items:center; gap:6px; position:relative; }
.sba5-o > span:first-child { font-size:12px; color:var(--gris); margin-right:auto; }
.sba5-gp { display:flex; gap:12px; font-size:12px; color:var(--gris); flex-wrap:wrap; align-items:center; }
.sba5-gp span { display:inline-flex; gap:3px; align-items:center; }
.sba5-tampon { position:absolute; top:22px; font:800 20px/1 var(--sans); padding:6px 10px; border:3px solid; border-radius:8px; opacity:0; transform:rotate(-12deg); pointer-events:none; }
.sba5-tg { right:16px; color:#007a5e; } .sba5-te { left:16px; color:#55555f; transform:rotate(12deg); }
.sba5-comp { display:flex; flex-direction:column; gap:3px; font-size:12px; color:var(--gris); }
.sba5-k { display:grid; grid-template-columns:62px 1fr 28px; gap:6px; align-items:center; color:var(--encre); font-size:13px; }
.sba5-kt { position:relative; height:8px; background:#f1f2f5; border-radius:2px; overflow:hidden; display:block; }
.sba5-kt i { position:absolute; left:0; top:0; bottom:0; display:block; }
.sba5-kt .sba5-kh { right:0; background:repeating-linear-gradient(135deg,#8b8d96 0 2px,transparent 2px 5px); }
.sba5-k b { text-align:right; }
.sba5-kn { font-size:12px; }
.sba5-gestes { display:grid; grid-template-columns:1fr auto 1fr; gap:8px; align-items:center; }
.sba5-gestes button { height:44px; border-radius:22px; border:1px solid #c9cad2; font-weight:600; background:#fff; }
.sba5-gestes .sba5-gar { background:#007a5e; color:#fff; border-color:#007a5e; }
.sba5-gestes span { font-size:12px; color:var(--gris); }
.sba5-gardes { display:flex; gap:6px; flex-wrap:wrap; align-items:center; font-size:13px; min-height:28px; }
.sba5-gardes button { display:inline-flex; align-items:center; gap:5px; height:28px; padding:0 10px; border-radius:14px; background:var(--mur); }
.sba5-gardes button[aria-pressed="true"] { background:var(--encre); color:#fff; }
`,
  corps: '<header class="sba5-t">' + CROIX + '<div><h1 data-role="titre">Lequel à la place de Nugget ?</h1>'
    + '<p class="sba5-ctx" data-role="contexte"><span data-contexte="houblon" data-fiche-de="beermaverick-nugget"><span data-houblon="beermaverick-nugget">Nugget</span> 46 g, épuisé</span><span data-contexte="moment" id="sba5-mom">à 60′</span><span data-contexte="dose">même IBU</span><span data-contexte="base">Stout 16D</span></p></div></header>'
    + '<div class="sba5-pile" id="sba5-pile" data-libre="houblon"></div>'
    + '<div class="sba5-gestes"><button type="button" id="sba5-ec">‹ suivant</button><span id="sba5-n" class="num"></span><button type="button" class="sba5-gar" id="sba5-ga">garder ›</button></div>'
    + '<div class="sba5-gardes" id="sba5-gardes"><span style="color:#55555f">gardés :</span></div>'
    + '<div id="sba5-pied"></div>'
    + '<template id="sba5-outils"><div class="sba5-o"><span class="sba5-oh"></span>' + aide('sba5', ['Balaie la carte : à droite tu la gardes, elle passe dans la recette ; à gauche, la suivante.', 'Rond noir : ta stout ; barre : avec ce houblon (~ simulé, 2 g/L) ; hachures : non simulé, pas zéro. Gris : zone du style 16D.', 'Score en plage : une composante inconnue peut valoir de 0 à 100.'], 'top:32px;left:0') + lentille('sba5') + '</div></template>',
  script: function () {
    var S = window.S, H = S.H, pile = document.getElementById('sba5-pile');
    document.getElementById('sba5-mom').textContent = S.MOM[S.m];
    var l = S.cands.slice().sort(function (a, b) { return (S.etat(a) === 'ok' ? 0 : 1) - (S.etat(b) === 'ok' ? 0 : 1) || S.score(b)[0] - S.score(a)[0]; });
    var i = 0, gardes = [], tard = S.m !== 'b60', lire = null;
    var maj = S.pied(document.getElementById('sba5-pied'));
    var outils = document.getElementById('sba5-outils').content.firstElementChild;
    // Lentille et légende vivent sur la carte du dessus ; elles y sont déplacées, jamais recréées (écouteurs du socle).
    document.body.appendChild(outils); outils.hidden = true;
    outils.querySelectorAll('[data-e]').forEach(function (b) { b.addEventListener('click', function () { outils.querySelectorAll('[data-e]').forEach(function (y) { y.setAttribute('aria-checked', String(y.dataset.e === b.dataset.e)); }); document.body.classList.toggle('abs', b.dataset.e === 'absolu'); }); });
    outils.querySelector('[data-role=legende-bouton]').addEventListener('click', function (e) { e.stopPropagation(); var g = document.getElementById(this.getAttribute('aria-controls')); g.hidden = !g.hidden; this.setAttribute('aria-expanded', String(!g.hidden)); });
    function comp(s) {
      var c = s.comp, z = [['amertume', c.amertume], ['huiles', c.huiles]].concat(tard ? [['arôme', c.arome]] : []);
      return '<span>pourquoi ce score</span>' + z.map(function (x) { return '<span class="sba5-k"><span>' + x[0] + '</span><i class="sba5-kt">' + (x[1] == null ? '<i class="sba5-kh"></i>' : '<i style="width:' + x[1] + '%;background:' + S.C[s.key] + '"></i>') + '</i><b class="num">' + (x[1] == null ? '?' : x[1]) + '</b></span>'; }).join('') + (tard ? '' : '<span class="sba5-kn">à 60′ l’arôme ne compte presque pas (poids 0,2)</span>');
    }
    function carte(s, rang) {
      var r = S.ibu(s), h = r && (r[0] < 50 || r[1] > 70);
      return '<article class="sba5-c' + (rang ? ' sba5-d' + rang : '') + '" data-k="' + s.key + '" data-fiche-de="' + s.key + '" style="z-index:' + (10 - rang) + '"><i class="sba5-bande" style="background:' + S.C[s.key] + '"></i><div class="sba5-in">'
        + '<div class="sba5-nom"><b data-houblon="' + s.key + '">' + H[s.key].name + '</b>' + S.usageHtml(s.key) + S.stock(s, true) + '</div>'
        + '<p class="sba5-id">' + S.alphaHtml(s.key) + '<span class="num" style="color:#55555f">fiches ' + S.plage(s.key) + '</span><span>' + s.palier + '</span></p>'
        + '<div class="sba5-gros"><div><b>' + S.dose(s) + '</b><span>' + (S.dosePlage(s) || 'α du lot') + '</span></div><div class="' + (h ? 'sba5-h' : '') + '"><b>' + S.ibuTxt(s).split(' IBU').join('') + '</b><span>IBU, style 50–70</span></div><div><b>' + S.scoreTxt(s) + '</b><span>proche de Nugget</span></div></div>'
        + '<div class="sba5-comp">' + comp(s) + '</div><div class="sba5-place"></div><div class="sba5-fam"></div>'
        + '<p class="sba5-gp"><span>perd ' + (S.gp(s, 'perd') || '—') + '</span><span>gagne ' + (S.gp(s, 'gagne') || '—') + '</span>' + (tard ? '' : '<span>à 60′ l’arôme part</span>') + '</p>'
        + '</div><span class="sba5-tampon sba5-tg">GARDÉ</span><span class="sba5-tampon sba5-te">SUIVANT</span></article>';
    }
    function rendre() {
      var s = l[i % l.length];
      pile.innerHTML = [2, 1, 0].map(function (d) { return carte(l[(i + d) % l.length], d); }).join('');
      var top = pile.querySelector('.sba5-c:last-child');
      top.querySelector('.sba5-place').replaceWith(outils); outils.hidden = false;
      outils.querySelector('.sba5-oh').textContent = tard ? 'ce qu’il apporte ' + S.MOM[S.m] : 'à 60′ l’arôme part ; ce qui reste';
      lire = S.barres(top.querySelector('.sba5-fam'), S.ORDRE);
      lire(s);
      document.getElementById('sba5-n').textContent = (i % l.length + 1) + ' / ' + l.length;
      geste(top);
    }
    function gardesRendre() {
      var c = S.courant();
      document.getElementById('sba5-gardes').innerHTML = '<span style="color:#55555f">gardés :</span>' + (gardes.length ? gardes.map(function (k) { return '<button type="button" data-g="' + k + '" aria-pressed="' + (c && c.key === k) + '">' + S.pt(k, 8) + H[k].name + '</button>'; }).join('') : '<span style="color:#55555f">aucun, recette inchangée</span>');
    }
    document.getElementById('sba5-gardes').addEventListener('click', function (e) { var b = e.target.closest('[data-g]'); if (b) { S.choisir(b.dataset.g); gardesRendre(); } });
    S.surChoix(function (s) { maj(s); });
    function partir(dir) {
      var top = pile.querySelector('.sba5-c:last-child'), s = l[i % l.length];
      top.style.transform = 'translateX(' + (dir * 420) + 'px) rotate(' + (dir * 18) + 'deg)'; top.style.opacity = '0';
      if (dir > 0) { if (gardes.indexOf(s.key) < 0) gardes.push(s.key); S.choisir(s.key); gardesRendre(); }
      outils.hidden = true; document.body.appendChild(outils);
      setTimeout(function () { i++; rendre(); }, 220);
    }
    function geste(c) {
      var x0 = null, dx = 0;
      c.addEventListener('pointerdown', function (e) { x0 = e.clientX; dx = 0; c.style.transition = 'none'; });
      c.addEventListener('pointermove', function (e) { if (x0 == null) return; dx = e.clientX - x0; if (Math.abs(dx) < 6) return; c.style.transform = 'translateX(' + dx + 'px) rotate(' + (dx / 20) + 'deg)'; c.querySelector('.sba5-tg').style.opacity = Math.max(0, dx / 90); c.querySelector('.sba5-te').style.opacity = Math.max(0, -dx / 90); });
      function fin() { if (x0 == null) return; x0 = null; c.style.transition = ''; if (Math.abs(dx) > 90) partir(dx > 0 ? 1 : -1); else { c.style.transform = ''; c.querySelectorAll('.sba5-tampon').forEach(function (t) { t.style.opacity = 0; }); } }
      c.addEventListener('pointerup', fin); c.addEventListener('pointercancel', fin);
    }
    document.getElementById('sba5-ec').addEventListener('click', function () { partir(-1); });
    document.getElementById('sba5-ga').addEventListener('click', function () { partir(1); });
    if (S.depart) { var k = l.findIndex(function (s) { return s.key === S.depart; }); var g0 = l.filter(function (s) { return S.etat(s) === 'ok'; })[0]; if (g0 && g0.key !== S.depart) gardes.push(g0.key); gardes.push(S.depart); S.choisir(S.depart); i = k >= 0 ? k : 0; }
    rendre(); gardesRendre();
  },
};
