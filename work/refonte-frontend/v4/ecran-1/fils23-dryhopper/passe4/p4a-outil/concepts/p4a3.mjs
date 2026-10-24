// p4a3 · tiède · « le geste d'abord » : a1 debout. Le brassin devient une colonne sous le pouce droit, de 60′ en haut
// à « après 7 j » en bas ; le pouce y glisse à la verticale, d'une main. Chaque moment y porte sa barre de floral
// (le profil d'a1, couché), et la loupe s'ouvre à gauche du pouce, cinq moments chiffrés (floral et IBU).
// Améliorations du brief prises :
//   1. l'interpolé se dessine : crans calculés pleins et pointés ; crans interpolés en fantôme pointillé ;
//   5. la durée est la suite du moment : les jours sont les derniers crans de la colonne, sans second réglage ;
//      les jours sans gain sont pâles ;
//   6. la lecture sans légende : chaque étape porte son picto (flamme, tourbillon, bulles, cuve au repos) ;
//   4. l'avant inconnu (Noyau, Baies) hachuré de sa couleur, écart « ? ».
// Gardé d'a1 : « Face à ta stout », les barres l5b au style, l'amertume et sa bande, « contre ★ », la vraie valeur, le
// pont levure qui suit le moment, Pépins / Melon / Épicé repliés, la fiche à l'appui long. Classes « p4a3 » (L26).
import { ETAPE } from '../socle.mjs';

export default {
  id: 'p4a3', nom: 'a1 debout : la colonne du brassin sous le pouce', chaleur: 'tiède', levure: 'propre',
  titre: 'Quand ajouter Idaho 7 ?',
  legende: [
    'Glisse le pouce le long de la colonne, de 60′ (en haut) à après 7 j (en bas) ; la loupe chiffre les moments voisins.',
    'Colonne : le floral à chaque moment ; plein et pointé, calculé ; en pointillé, interpolé ; trait orangé : trop amer.',
    'Barre : ta stout avec Idaho 7 ; rond : avant ; hachuré de couleur : avant inconnu, écart « ? ».',
    '★ : le meilleur pour ta demande du 18.10. ~ simulé · ≈ interpolé · ? inconnu.',
  ],
  css: `
.p4a3 .s-ecran { gap:6px; }
.p4a3main { display:grid; grid-template-columns:1fr 118px; gap:8px; height:calc(100svh - 168px); min-height:560px; }
.p4a3g { display:flex; flex-direction:column; gap:6px; min-width:0; }
.p4a3rep { display:flex; align-items:baseline; flex-wrap:wrap; gap:2px 6px; font-size:15px; }
.p4a3rep b { font-weight:600; }
.p4a3rep-fl { display:inline-flex; align-items:center; gap:3px; color:#9840bc; font:700 16px var(--mono); }
.p4a3rep-c { flex-basis:100%; font-size:13px; color:var(--gris); line-height:1.3; }
.p4a3rep-c b { color:var(--encre); }
.p4a3rep-c .p4a3-trop { color:var(--acc); font-weight:600; }
.p4a3fig { flex:1; justify-content:space-between; padding:8px 8px; }
.p4a3fig .s-ba { grid-template-columns:84px 1fr 34px; font-size:14px; min-height:38px; }
.p4a3fig .s-jauge { font-size:13px; }
.p4a3fig .s-jauge .s-jv { font-size:12px; }
.p4a3fig .s-jp { height:14px; }
.p4a3fig .s-piste { height:20px; }
.p4a3fig .s-piste .s-rem { height:12px; top:4px; }
.p4a3fig .s-piste .s-av { width:16px; height:16px; top:2px; margin-left:-8px; }
.p4a3am { margin-top:2px; }
.p4a3repli { display:flex; align-items:center; gap:6px; height:22px; color:var(--gris); }
.p4a3repli svg.p4a3ch { transition:transform .15s; }
.p4a3repli[aria-expanded="true"] svg.p4a3ch { transform:rotate(90deg); }
.p4a3mes { font-size:12px; color:var(--gris); }
.p4a3mes b { color:var(--encre); font-weight:600; }
.p4a3mes.p4a3-jamais { align-self:flex-start; padding:1px 6px; border-radius:4px; background:#ececec; }
.p4a3lev a { display:flex; align-items:center; justify-content:space-between; gap:6px; height:36px; padding:0 12px; border-radius:18px; background:var(--encre); color:#fff; font-size:14px; }
.p4a3lev a b { font-weight:700; }
.p4a3lev a span { display:inline-flex; align-items:center; gap:3px; color:#d4d4d4; font-size:13px; }
.p4a3fr { position:relative; background:var(--plan); border:1px solid var(--trait); border-radius:8px; }
.p4a3col { position:absolute; left:6px; right:34px; top:8px; bottom:8px; }
.p4a3col i { position:absolute; right:0; height:var(--ch); margin-top:calc(var(--ch) / -2); border-radius:2px 0 0 2px; background:#bf86d6; }
.p4a3col i.p4a3-ip { background:transparent; border:1px dashed #bf86d6; border-right:0; }
.p4a3col i.p4a3-calc::before { content:""; position:absolute; left:-3px; top:50%; width:5px; height:5px; margin-top:-2.5px; border-radius:50%; background:#9840bc; }
.p4a3col i.p4a3-amer { box-shadow:inset -3px 0 0 var(--acc); }
.p4a3col i.p4a3-sg { opacity:.35; }
.p4a3col i.p4a3-ici { outline:2px solid var(--encre); outline-offset:1px; }
.p4a3col .p4a3et { position:absolute; left:0; display:flex; align-items:center; gap:2px; color:var(--gris); font-size:12px; }
.p4a3col .p4a3et.p4a3-on { color:var(--encre); font-weight:700; }
.p4a3col .p4a3sep { position:absolute; left:0; right:-28px; border-top:1px solid #dcdcdc; }
.p4a3rg { position:absolute; right:4px; top:8px; bottom:8px; width:24px; }
.p4a3rg .s-lp { right:30px; width:236px; height:372px; }
.p4a3rg .s-lp > span { height:58px; justify-content:space-between; }
.p4a3rg .s-lp em { min-width:44px; text-align:center; }
.p4a3rg .s-lp i.s-lp-b { flex:1; height:10px; }
.p4a3rg .s-lp small.p4a3-ibu { color:var(--gris); min-width:34px; text-align:right; }
.p4a3rg .s-lp small.p4a3-ibu.p4a3-trop { color:var(--acc); }
`,
  corps: `
<div class="p4a3main">
  <div class="p4a3g">
    <div class="p4a3rep" aria-live="polite"><b>Face à ta stout</b><span class="p4a3rep-fl"><svg class="s-pi" width="16" height="16" style="width:16px;height:16px" data-famille="floral" aria-label="Floral"><use href="#p-floral"/></svg><span id="p4a3rep-fl">~+22</span></span><span class="p4a3rep-c" id="p4a3rep-c"></span></div>
    <section class="s-bloc p4a3fig" aria-label="Familles d'arômes au style"><div id="p4a3ba"></div><div class="p4a3am" id="p4a3am"></div>
      <button type="button" class="p4a3repli" id="p4a3repli" aria-expanded="false" aria-controls="p4a3ba2" aria-label="Montrer Pépins, Melon, Épicé"></button><div id="p4a3ba2" hidden></div></section>
    <p class="p4a3mes" id="p4a3mes" data-acquis="valeurs"></p>
    <nav class="p4a3lev" aria-label="Pont vers Levure" data-acquis="levure" data-forme="pont"><a href="${ETAPE}"><b>Puis la levure</b><span id="p4a3lev-t"></span></a></nav>
  </div>
  <div class="p4a3fr" data-libre="moment" data-acquis="frise">
    <div class="p4a3col" id="p4a3col" aria-hidden="true"></div>
    <div class="p4a3rg" id="p4a3rg"></div>
  </div>
</div>`,
  script: function () {
    var S = window.S, D = S.D, N = S.N, X = window.S_DATA, seg = S.seg, x = S.x, best = S.best, jours = S.jours;
    var mp = function (id, s) { return '<svg class="s-mp" width="' + s + '" height="' + s + '" style="width:' + s + 'px;height:' + s + 'px" aria-hidden="true"><use href="#' + id + '"/></svg>'; };
    var maj = S.barres(document.getElementById('p4a3ba'), ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'berries', 'resin', 'green']);
    var maj2 = S.barres(document.getElementById('p4a3ba2'), ['pomeFruit', 'melon', 'spice']);
    var jau = S.jauge(document.getElementById('p4a3am'), true);
    var rp = document.getElementById('p4a3repli');
    rp.innerHTML = ['pomeFruit', 'melon', 'spice'].map(function (f) { return S.pi(f, 14); }).join('') + '<svg class="p4a3ch" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
    rp.addEventListener('click', function () { var o = rp.getAttribute('aria-expanded') !== 'true'; rp.setAttribute('aria-expanded', String(o)); document.getElementById('p4a3ba2').hidden = !o; });
    // La colonne : une barre de floral par moment, couchée vers la gauche depuis le rail.
    var col = document.getElementById('p4a3col'), h = '', PIC = ['m-feu', 'm-tourb', 'm-bulle', 'm-cuve'];
    var pas = function (k) { var g = 1e9; if (k > 0) g = Math.min(g, x(k) - x(k - 1)); if (k < N) g = Math.min(g, x(k + 1) - x(k)); return g; };
    for (var k = 0; k <= N; k++) {
      var p = D[k], pr = S.jours(p) > 1 ? D[k - 1] : null, sg = pr && seg(pr) === seg(p) && Math.abs(p.v.floral - pr.v.floral) < 0.1;
      h += '<i data-k="' + k + '" class="' + (p.interp ? 'p4a3-ip' : 'p4a3-calc') + (S.ibu(p).h ? ' p4a3-amer' : '') + (sg ? ' p4a3-sg' : '') + '" data-pas="' + pas(k).toFixed(3) + '" style="top:' + x(k) + '%;width:' + Math.max(8, p.v.floral / 25 * 100).toFixed(0) + '%"></i>';
    }
    S.SEG.forEach(function (z, n) { if (n) h += '<span class="p4a3sep" style="top:' + z[0] + '%"></span>'; h += '<span class="p4a3et" data-s="' + n + '" style="top:calc(' + z[0] + '% + 2px)">' + mp(PIC[n], 14) + '</span>'; });
    col.innerHTML = h;
    var hauteurs = function () { var H = col.clientHeight; col.querySelectorAll('i[data-pas]').forEach(function (c) { c.style.setProperty('--ch', Math.min(22, H * c.dataset.pas / 100 * 0.74).toFixed(1) + 'px'); }); };
    hauteurs(); addEventListener('resize', hauteurs);
    function mesure(p) {
      var m = document.getElementById('p4a3mes'), s = seg(p);
      m.classList.toggle('p4a3-jamais', s < 2);
      if (s === 2) m.innerHTML = '<b>mesuré</b> linalol <span data-nature="mesure" data-source="E03 McCabe 2023">38 µg/L</span> (McCabe 2023)';
      else if (s === 3) m.innerHTML = '<b>mesuré</b> 1 h ≈ <span data-nature="mesure" data-source="E10 Titus 2021">96 h</span> au nez (Titus 2021)';
      else m.textContent = 'jamais mesuré à ce moment';
    }
    function levure(p) {
      var dd = X.POMONA[p.id] || null, f2 = null;
      if (dd) for (var f in dd) if (!f2 || Math.abs(dd[f]) > Math.abs(dd[f2])) f2 = f;
      document.getElementById('p4a3lev-t').innerHTML = dd && Math.abs(dd[f2]) >= 0.5 ? 'Pomona ' + S.pi(f2, 14) + '~+' + Math.round(dd[f2]) + ' ›' : 'rien ici ›';
    }
    function contre(i) {
      var c = document.getElementById('p4a3rep-c'), p = D[i], q = D[best];
      if (i === best) { c.innerHTML = '★ <b>' + q.lib + '</b> · ' + S.ibu(p).t.replace(' IBU', '') + '+? IBU'; return; }
      var sg = p.interp ? '≈' : '~', fm = function (n) { n = Math.round(n); return sg + (n >= 0 ? '+' : '−') + Math.abs(n); };
      c.innerHTML = 'contre ★ <b>' + q.lib + '</b> : floral ' + fm(p.v.floral - q.v.floral) + ' · résineux ' + fm(p.v.resin - q.v.resin) + (S.ibu(p).h ? ' · <span class="p4a3-trop">trop amer</span>' : '');
    }
    var rail = S.rail({
      hote: document.getElementById('p4a3rg'), orient: 'v', pas: 72,
      cellule: function (p) { var b = S.ibu(p); return '<em>' + S.court(p) + '</em><i class="s-lp-b"><b style="width:' + Math.min(100, p.v.floral / 25 * 100).toFixed(0) + '%"></b></i><small>' + S.fmt(p, 'floral') + '</small><small class="p4a3-ibu' + (b.h ? ' p4a3-trop' : '') + '">' + (b.cru ? '60+?' : b.t.replace(' IBU', '')) + '</small>'; },
      loupe: function (i, lp) { var H = lp.parentNode.clientHeight, y = H * x(i) / 100; lp.style.top = Math.max(-60, Math.min(H - 260, y - 160)) + 'px'; },
      onPose: function (i) {
        var p = D[i]; maj(p); maj2(p); jau(p); mesure(p); levure(p); contre(i);
        document.getElementById('p4a3rep-fl').textContent = S.fmt(p, 'floral');
        col.querySelectorAll('i').forEach(function (c) { c.classList.toggle('p4a3-ici', +c.dataset.k === i); });
        col.querySelectorAll('.p4a3et').forEach(function (e) { e.classList.toggle('p4a3-on', +e.dataset.s === seg(p)); });
      },
    });
    S.surLecture(function () { var p = D[rail.cur()]; maj(p); maj2(p); });
    rail.poser(rail.depart);
    window.LIRE = function () { return { m: rail.el.getAttribute('aria-valuetext'), fl: document.getElementById('p4a3rep-fl').textContent, am: document.querySelector('#p4a3am .s-jv').textContent, noyau: document.querySelector('#p4a3ba [data-f=stoneFruit] .s-ba-v').textContent, lev: document.getElementById('p4a3lev-t').textContent, mes: document.getElementById('p4a3mes').textContent, mieux: document.getElementById('p4a3rep-c').textContent }; };
    if (/touche=1/.test(location.search)) rail.toucher();
  },
};
