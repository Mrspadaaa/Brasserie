// p4a4 · tiède · « la réponse d'abord » : a1 retourné. En tête, la réponse (★ actif · 2 j) et ses trois chiffres ;
// dessous, les quatre étapes du brassin côte à côte, chacune avec ce qu'elle donne (floral, résineux), ce qu'elle coûte
// (l'amertume, orangée si trop amère) et ce que la chaleur ou le CO₂ lui emporte (flamme ou bulles, chiffré face au
// dry hop après fermentation). Le doigt affine ensuite au rail d'a1, par 5′, avec sa loupe ; les barres l5b suivent.
// Améliorations du brief prises :
//   2. le contour « chaleur ou CO₂ » devient une ligne de chaque étape : flamme ou bulles, et le floral emporté ;
//   6. la lecture sans légende : la réponse est écrite par ses chiffres ; pictos d'étape, pas de « WP » ;
//   5. la durée est la suite du moment (les jours sont les crans du rail) ;
//   4. l'avant inconnu (Noyau, Baies) hachuré, écart « ? ».
// Greffes : les quatre pastilles d'étape (a4), « trop amer » dans la case (a8), le meilleur rappelé quand on s'en
// écarte (g4, b4), la case du doigt qui s'ouvre (e3). Classes « p4a4 » (L26).
import { ETAPE } from '../socle.mjs';

export default {
  id: 'p4a4', nom: 'a1 retourné : la réponse, puis les quatre étapes', chaleur: 'tiède', levure: 'propre',
  titre: 'Quand ajouter Idaho 7 ?',
  legende: [
    '★ : le meilleur pour ta demande du 18.10 : plus floral, moins résineux, amertume 50–70 IBU.',
    'Chaque étape : floral et résineux gagnés, amertume (orangé : trop amer), et ce que la chaleur (flamme) ou le CO₂ (bulles) emporte face au dry hop après fermentation.',
    'Touche une étape, puis glisse le pouce sur le rail par 5′ ; la loupe chiffre les moments voisins.',
    'Hachuré de couleur : avant inconnu, écart « ? ». ~ simulé · ≈ interpolé.',
  ],
  css: `
body.p4a4 { padding-bottom:var(--dock,96px); }
.p4a4 .s-ecran { gap:7px; }
.p4a4rep { display:grid; grid-template-columns:auto 1fr; align-items:center; gap:2px 10px; padding:8px 12px; border-radius:8px; background:var(--encre); color:#fff; }
.p4a4rep-et { grid-row:span 2; display:flex; align-items:center; gap:6px; font:700 20px var(--sans); white-space:nowrap; }
.p4a4rep-et .p4a4rep-st { color:#f5c542; }
.p4a4rep-ch { display:flex; gap:5px; justify-content:flex-end; font:700 14px var(--mono); }
.p4a4rep-ch > span { display:inline-flex; align-items:center; gap:3px; white-space:nowrap; padding:1px 6px; border-radius:999px; background:#fff; }
.p4a4rep-ch .p4a4-fl { color:#9840bc; } .p4a4rep-ch .p4a4-rs { color:#c2410c; } .p4a4rep-ch .p4a4-ib { color:var(--encre); }
.p4a4rep-ch .s-pi { color:currentColor; }
.p4a4rep-c { font-size:13px; color:#d4d4d4; text-align:right; min-height:16px; }
.p4a4rep-c b { color:#fff; }
.p4a4rep-c .p4a4-trop { color:#ffb38a; font-weight:600; }
.p4a4po { display:grid; grid-template-columns:repeat(4,1fr); gap:4px; }
.p4a4po button { position:relative; display:flex; flex-direction:column; align-items:stretch; gap:3px; padding:6px 5px 7px; border-radius:8px; background:var(--plan); border:1px solid var(--trait); text-align:left; font-size:12px; }
.p4a4po button[aria-current="true"] { border:2px solid var(--encre); padding:5px 4px 6px; background:#fff; }
.p4a4po-t { display:flex; align-items:center; gap:4px; font:600 13px var(--sans); color:var(--encre); white-space:nowrap; }
.p4a4po-st { position:absolute; top:4px; right:5px; color:#7a5a00; font-size:14px; }
.p4a4po-l { display:grid; grid-template-columns:14px 1fr; align-items:center; gap:3px; font:600 12px var(--mono); }
.p4a4po-l i { grid-column:1 / -1; display:block; height:5px; border-radius:2px; background:var(--piste); position:relative; overflow:hidden; }
.p4a4po-l i b { position:absolute; left:0; top:0; bottom:0; border-radius:2px; }
.p4a4po-ib { margin-top:2px; padding:2px 4px; border-radius:4px; background:#e4e4e4; font:600 12px var(--mono); text-align:center; color:var(--encre); }
.p4a4po-ib.p4a4-trop { background:var(--acc); color:#fff; }
.p4a4po-em { display:flex; align-items:center; justify-content:center; gap:2px; min-height:16px; font:600 12px var(--mono); color:var(--gris); }
.p4a4po-em.p4a4-rien { visibility:hidden; }
.p4a4fig { padding:6px 10px; gap:3px; }
.p4a4fig .s-ba { grid-template-columns:92px 1fr 40px; min-height:31px; font-size:14px; }
.p4a4fig { flex:1; justify-content:space-between; }
.p4a4 .s-ecran { min-height:calc(100svh - var(--dock,96px)); padding-bottom:8px; }
.p4a4fig .s-piste { height:16px; }
.p4a4fig .s-piste .s-rem { height:10px; top:3px; }
.p4a4fig .s-piste .s-av { width:14px; height:14px; top:1px; margin-left:-7px; }
.p4a4repli { display:flex; align-items:center; gap:6px; height:22px; color:var(--gris); }
.p4a4repli[aria-expanded="true"] svg.p4a4ch { transform:rotate(90deg); }
.p4a4dock { position:fixed; left:50%; bottom:0; transform:translateX(-50%); width:min(390px,100%); background:#fff; border-top:1px solid var(--trait); box-shadow:0 -12px 40px -16px rgba(22,22,22,.35); padding:6px 12px 8px; z-index:20; display:flex; flex-direction:column; gap:4px; }
.p4a4dock-h { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.p4a4mes { font-size:12px; color:var(--gris); min-width:0; }
.p4a4mes b { color:var(--encre); font-weight:600; }
.p4a4lev a { display:inline-flex; align-items:center; gap:5px; height:30px; padding:0 12px; border-radius:15px; background:var(--encre); color:#fff; font-size:13px; white-space:nowrap; }
.p4a4lev a b { font-weight:700; }
.p4a4lev a span { display:inline-flex; align-items:center; gap:3px; color:#d4d4d4; }
.p4a4rg { margin-top:2px; }
.p4a4rg .s-lp { left:0; right:0; top:-62px; height:56px; }
.p4a4prof { position:relative; height:34px; }
.p4a4prof i { position:absolute; bottom:0; width:var(--cw); margin-left:calc(var(--cw) / -2); background:var(--piste); border-radius:2px 2px 0 0; height:100%; }
.p4a4prof i b { position:absolute; left:1px; right:1px; bottom:0; background:#bf86d6; border-radius:2px 2px 0 0; }
.p4a4prof i.p4a4-ip b { opacity:.5; }
.p4a4prof i.p4a4-amer { box-shadow:inset 0 -3px 0 var(--acc); }
.p4a4prof i.p4a4-ici { background:#d4d4d4; }
`,
  corps: `
<section class="p4a4rep" aria-live="polite"><span class="p4a4rep-et"><span class="p4a4rep-st" id="p4a4rep-st">★</span><span id="p4a4rep-m">actif · 2 j</span></span>
  <span class="p4a4rep-ch"><span class="p4a4-fl"><svg class="s-pi" width="16" height="16" style="width:16px;height:16px" data-famille="floral" aria-label="Floral"><use href="#p-floral"/></svg><span id="p4a4rep-fl"></span></span><span class="p4a4-rs"><svg class="s-pi" width="16" height="16" style="width:16px;height:16px" data-famille="resin" aria-label="Résineux"><use href="#p-resin"/></svg><span id="p4a4rep-rs"></span></span><span class="p4a4-ib" id="p4a4rep-ib"></span></span>
  <span class="p4a4rep-c" id="p4a4rep-c"></span></section>
<div data-libre="moment" data-acquis="frise">
  <div class="p4a4po" id="p4a4po"></div>
  <section class="s-bloc p4a4fig" aria-label="Familles d'arômes au style, au moment choisi"><div id="p4a4ba"></div><div id="p4a4am"></div>
    <button type="button" class="p4a4repli" id="p4a4repli" aria-expanded="false" aria-controls="p4a4ba2" aria-label="Montrer Pépins, Melon, Épicé"></button><div id="p4a4ba2" hidden></div></section>
  <div class="p4a4dock" id="p4a4dock">
    <div class="p4a4dock-h"><p class="p4a4mes" id="p4a4mes" data-acquis="valeurs"></p><nav class="p4a4lev" aria-label="Pont vers Levure" data-acquis="levure" data-forme="pont"><a href="${ETAPE}"><b>Puis la levure</b><span id="p4a4lev-t"></span></a></nav></div>
    <div class="p4a4rg" id="p4a4rg"><div class="p4a4prof" id="p4a4prof" aria-hidden="true"></div></div>
  </div>
</div>`,
  script: function () {
    var S = window.S, D = S.D, X = window.S_DATA, seg = S.seg, best = S.best, jours = S.jours;
    var mp = function (id, s) { return '<svg class="s-mp" width="' + s + '" height="' + s + '" style="width:' + s + 'px;height:' + s + 'px" aria-hidden="true"><use href="#' + id + '"/></svg>'; };
    var maj = S.barres(document.getElementById('p4a4ba'), ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'berries', 'resin', 'green']);
    var maj2 = S.barres(document.getElementById('p4a4ba2'), ['pomeFruit', 'melon', 'spice']);
    var jau = S.jauge(document.getElementById('p4a4am'), true);
    var rp = document.getElementById('p4a4repli');
    rp.innerHTML = ['pomeFruit', 'melon', 'spice'].map(function (f) { return S.pi(f, 14); }).join('') + '<svg class="p4a4ch" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
    rp.addEventListener('click', function () { var o = rp.getAttribute('aria-expanded') !== 'true'; rp.setAttribute('aria-expanded', String(o)); document.getElementById('p4a4ba2').hidden = !o; });
    var ibuT = function (p) { var b = S.ibu(p); return b.cru ? '60+?' : b.t.replace(' IBU', ''); };
    // Les quatre étapes : un moment représentatif (60′, whirlpool, actif et après au jour courant, 2 j au départ).
    var ET = [['b60', '60′–0′', 'm-feu'], ['wp', 'whirlpool', 'm-tourb'], ['dryActive', 'actif', 'm-bulle'], ['dryPost', 'après', 'm-cuve']];
    var po = document.getElementById('p4a4po');
    po.innerHTML = ET.map(function (e, n) { return '<button type="button" data-etape="' + n + '" aria-label="Moment : ' + e[1] + '"><span class="p4a4po-t">' + mp(e[2], 14) + e[1] + '</span><span class="p4a4po-st" hidden>★</span><span class="p4a4po-l">' + S.pi('floral', 13) + '<span class="p4a4-v" data-f="floral"></span><i><b data-f="floral" style="background:#bf86d6"></b></i></span><span class="p4a4po-l">' + S.pi('resin', 13) + '<span class="p4a4-v" data-f="resin"></span><i><b data-f="resin" style="background:#2f6b5f"></b></i></span><span class="p4a4po-ib"></span><span class="p4a4po-em"></span></button>'; }).join('');
    var repDe = function (n, j) { return S.idx(n < 2 ? ET[n][0] : ET[n][0] + '|' + (j || 2)); };
    function postes(i) {
      var p = D[i], j = jours(p) || 2;
      po.querySelectorAll('button').forEach(function (b, n) {
        var q = D[seg(p) === n ? i : repDe(n, j)], ref = D[S.idx('dryPost|' + j)];
        b.setAttribute('aria-current', String(seg(p) === n)); b.querySelector('.p4a4po-st').hidden = repDe(n, 2) !== best;
        ['floral', 'resin'].forEach(function (f) { b.querySelector('.p4a4-v[data-f=' + f + ']').textContent = S.fmt(q, f); b.querySelector('b[data-f=' + f + ']').style.width = Math.min(100, S.d(q, f) / 25 * 100).toFixed(0) + '%'; });
        b.querySelector('.p4a4-v[data-f=floral]').style.color = '#9840bc'; b.querySelector('.p4a4-v[data-f=resin]').style.color = S.hors(q, 'resin') ? '#c2410c' : '#2f6b5f';
        var ib = b.querySelector('.p4a4po-ib'), bb = S.ibu(q); ib.textContent = ibuT(q) + (bb.h ? ' trop' : ''); ib.classList.toggle('p4a4-trop', bb.h);
        var em = b.querySelector('.p4a4po-em'), perte = ref.v.floral - q.v.floral;
        em.classList.toggle('p4a4-rien', n === 3 || perte < 0.5);
        em.innerHTML = n === 3 ? '' : mp(n === 2 ? 'm-bulle' : 'm-feu', 13) + '−' + Math.round(perte) + S.pi('floral', 12);
      });
    }
    function mesure(p) {
      var m = document.getElementById('p4a4mes'), s = seg(p);
      if (s === 2) m.innerHTML = '<b>mesuré</b> linalol <span data-nature="mesure" data-source="E03 McCabe 2023">38 µg/L</span> (McCabe 2023)';
      else if (s === 3) m.innerHTML = '<b>mesuré</b> 1 h ≈ <span data-nature="mesure" data-source="E10 Titus 2021">96 h</span> au nez (Titus 2021)';
      else m.textContent = 'jamais mesuré à ce moment';
    }
    function levure(p) {
      var dd = X.POMONA[p.id] || null, f2 = null;
      if (dd) for (var f in dd) if (!f2 || Math.abs(dd[f]) > Math.abs(dd[f2])) f2 = f;
      document.getElementById('p4a4lev-t').innerHTML = dd && Math.abs(dd[f2]) >= 0.5 ? 'Pomona ' + S.pi(f2, 13) + '~+' + Math.round(dd[f2]) + ' ›' : 'rien ici ›';
    }
    function reponse(i) {
      var p = D[i], q = D[best], c = document.getElementById('p4a4rep-c');
      document.getElementById('p4a4rep-m').textContent = p.lib; document.getElementById('p4a4rep-st').style.visibility = i === best ? 'visible' : 'hidden';
      document.getElementById('p4a4rep-fl').textContent = S.fmt(p, 'floral'); document.getElementById('p4a4rep-rs').textContent = S.fmt(p, 'resin');
      document.getElementById('p4a4rep-ib').textContent = ibuT(p) + ' IBU';
      if (i === best) { c.textContent = ''; return; }
      var sg = p.interp ? '≈' : '~', fm = function (n) { n = Math.round(n); return sg + (n >= 0 ? '+' : '−') + Math.abs(n); };
      c.innerHTML = 'contre ★ <b>' + q.lib + '</b> : floral ' + fm(p.v.floral - q.v.floral) + (S.ibu(p).h ? ' · <span class="p4a4-trop">trop amer</span>' : '');
    }
    var prof = document.getElementById('p4a4prof'), h = '';
    for (var k = 0; k <= S.N; k++) h += '<i class="' + (D[k].interp ? 'p4a4-ip' : '') + (S.ibu(D[k]).h ? ' p4a4-amer' : '') + '" style="left:' + S.x(k) + '%;--cw:' + S.cw(k) + '%"><b style="height:' + Math.max(6, D[k].v.floral / 25 * 100).toFixed(0) + '%"></b></i>';
    prof.innerHTML = h;
    var rail = S.rail({
      hote: document.getElementById('p4a4rg'), orient: 'h', pas: 66,
      cellule: function (p) { return '<em>' + S.court(p) + '</em><i class="s-lp-b"><b style="width:' + Math.min(100, p.v.floral / 25 * 100).toFixed(0) + '%"></b></i><small>' + S.fmt(p, 'floral') + '</small>'; },
      onPose: function (i) { var p = D[i]; maj(p); maj2(p); jau(p); postes(i); mesure(p); levure(p); reponse(i); prof.querySelectorAll('i').forEach(function (c, k) { c.classList.toggle('p4a4-ici', k === i); }); },
    });
    po.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { var n = +b.dataset.etape, p = D[rail.cur()]; if (seg(p) !== n) rail.poser(repDe(n, jours(p))); }); });
    S.surLecture(function () { var p = D[rail.cur()]; maj(p); maj2(p); });
    var dk = document.getElementById('p4a4dock'), haut = function () { document.body.style.setProperty('--dock', dk.offsetHeight + 'px'); };
    haut(); addEventListener('resize', haut);
    rail.poser(rail.depart);
    window.LIRE = function () { return { m: rail.el.getAttribute('aria-valuetext'), fl: document.getElementById('p4a4rep-fl').textContent, am: document.getElementById('p4a4rep-ib').textContent, noyau: document.querySelector('#p4a4ba [data-f=stoneFruit] .s-ba-v').textContent, emporte: [].map.call(document.querySelectorAll('.p4a4po-em'), function (e) { return e.textContent; }).join(' | '), lev: document.getElementById('p4a4lev-t').textContent, mes: document.getElementById('p4a4mes').textContent, mieux: document.getElementById('p4a4rep-c').textContent }; };
    if (/touche=1/.test(location.search)) rail.toucher();
  },
};
