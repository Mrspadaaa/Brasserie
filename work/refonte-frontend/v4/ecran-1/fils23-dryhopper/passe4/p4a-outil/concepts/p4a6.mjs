// p4a6 · tiède · « x3b réduit en fin de frise » : a1 en chaîne. L'écran se lit de gauche à droite comme la cuve qui
// avance : Ma bière (le niveau avant, par famille) → + Idaho 7 au moment du pouce (les barres l5b d'a1 et l'écart)
// → la levure (ce que Pomona changerait à ce moment, le pont). Au bout de la frise, la chaîne réduite de x3b :
// « Ma bière → + Idaho 7 → + 2ᵉ ? → Levure ». Sous le rail, la courbe de la levure.
// Améliorations du brief prises :
//   7. x3b réduit en fin de frise (« ma bière → +1 → +2 dry hops ») et la levure comme suite de la chaîne (a2b : « voir
//      ce que la levure change ») ;
//   3. la courbe de levure : la fermentation active en colline sous le rail (fin vers J+5), hachurée là où la
//      biotransformation est possible, non chiffrée ; la colonne Levure s'allume quand elle travaille ;
//   4. l'inconnu n'est jamais zéro : Ma bière « ? » hachuré pour Noyau et Baies, et leur écart « ? ».
// Greffes : la chaîne en légende (b2, c8), le texte du pont qui suit le moment (g1, g4), « 1 j sans gain » (e2) sur
// la courbe. Classes « p4a6 » (L26).
import { ETAPE } from '../socle.mjs';

export default {
  id: 'p4a6', nom: 'a1 en chaîne : ma bière → Idaho 7 → levure', chaleur: 'tiède', levure: 'propre',
  titre: 'Quand ajouter Idaho 7 ?',
  legende: [
    'De gauche à droite : ta stout avant, puis avec Idaho 7 au moment du pouce (barre et écart), puis ce que Pomona y changerait.',
    'Glisse le pouce sur le rail, par 5′ ; la loupe chiffre le floral des moments voisins. ★ : le meilleur pour ta demande du 18.10.',
    'Colline sous le rail : la levure travaille (fin vers J+5, à confirmer à la densité) ; hachuré : biotransformation possible, non chiffrée.',
    '? et hachuré : inconnu, jamais zéro. ~ simulé · ≈ interpolé.',
  ],
  css: `
body.p4a6 { padding-bottom:var(--dock,118px); }
.p4a6 .s-ecran { gap:6px; min-height:calc(100svh - var(--dock,118px)); padding-bottom:8px; }
.p4a6ch { display:grid; grid-template-columns:82px 40px 1fr 50px; align-items:end; gap:0 9px; font-size:13px; }
.p4a6ch-a, .p4a6ch-b, .p4a6ch-c { display:flex; flex-direction:column; gap:1px; padding:5px 4px; border-radius:8px 8px 0 0; }
.p4a6ch-a { grid-column:2; background:#ececec; text-align:center; font-weight:600; line-height:1.1; }
.p4a6ch-b { grid-column:3; background:var(--encre); color:#fff; flex-direction:row; align-items:center; gap:6px; }
.p4a6ch-bt { display:flex; flex-direction:column; line-height:1.1; }
.p4a6ch-bt small { font-size:12px; color:#d4d4d4; }
.p4a6ch-b b { font:700 16px var(--sans); white-space:nowrap; }
.p4a6ch-b .p4a6-fl { margin-left:auto; display:inline-flex; align-items:center; gap:3px; padding:1px 7px; border-radius:999px; background:#fff; font:700 15px var(--mono); color:#9840bc; }
.p4a6ch-c { grid-column:4; padding:0; }
.p4a6ch-c a { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; min-height:40px; padding:3px 2px; border-radius:8px 8px 0 0; background:#e4e4e4; color:var(--encre); font-weight:700; line-height:1.1; text-align:center; }
.p4a6ch-c a small { font:400 12px var(--sans); color:var(--gris); }
.p4a6ch-c.p4a6-trav a { background:repeating-linear-gradient(135deg,#d4d4d4 0 2px,#ececec 2px 6px); }
.p4a6ct { flex-basis:100%; font-size:13px; color:var(--gris); min-height:16px; }
.p4a6ct b { color:var(--encre); }
.p4a6ct .p4a6-trop { color:var(--acc); font-weight:600; }
.p4a6tab { flex:1; display:flex; flex-direction:column; justify-content:space-between; padding:4px 0 6px; border-radius:8px; background:var(--plan); border:1px solid var(--trait); }
.p4a6l { display:grid; grid-template-columns:82px 40px 1fr 50px; align-items:center; gap:4px 9px; min-height:34px; padding:0 4px 0 8px; font-size:14px; }
.p4a6l-n { display:flex; align-items:center; gap:4px; white-space:nowrap; }
.p4a6l-n.p4a6-att { font-weight:700; }
.p4a6l-a { display:flex; align-items:center; justify-content:center; height:22px; border-radius:4px; background:#fff; border:1px solid var(--trait); font:600 12px var(--mono); color:var(--gris); }
.p4a6l-a.p4a6-inc { background:repeating-linear-gradient(135deg,#d4d4d4 0 2px,#fff 2px 6px); color:var(--encre); }
.p4a6l-b { display:block; position:relative; }
.p4a6l-b .s-ba { grid-template-columns:1fr 50px; gap:4px; }
.p4a6l-b::before { content:"›"; position:absolute; left:-8px; top:50%; transform:translateY(-52%); color:#6e6e6e; font-weight:700; }
.p4a6l-b .s-piste { height:16px; }
.p4a6l-b .s-piste .s-rem { height:10px; top:3px; }
.p4a6l-b .s-piste .s-av { width:14px; height:14px; top:1px; margin-left:-7px; }
.p4a6l-v { text-align:right; font:600 13px var(--mono); }
.p4a6l-c { display:flex; align-items:center; justify-content:center; gap:2px; height:22px; border-radius:11px; font:600 12px var(--mono); position:relative; }
.p4a6l-c::before { content:"›"; position:absolute; left:-9px; color:#6e6e6e; font-weight:700; }
.p4a6l-c.p4a6-on { background:#fff; border:1px solid var(--trait); }
.p4a6l-c.p4a6-off { color:#6e6e6e; }
#p4a6am { padding:2px 8px 0 8px; }
.p4a6am .s-jauge { font-size:13px; }
.p4a6repli { display:flex; align-items:center; gap:6px; height:22px; padding:0 8px; color:var(--gris); }
.p4a6repli[aria-expanded="true"] svg.p4a6chv { transform:rotate(90deg); }
.p4a6dock { position:fixed; left:50%; bottom:0; transform:translateX(-50%); width:min(390px,100%); background:#fff; border-top:1px solid var(--trait); box-shadow:0 -12px 40px -16px rgba(22,22,22,.35); padding:6px 12px 8px; z-index:20; }
.p4a6x3 { display:flex; align-items:center; gap:3px; font-size:12px; white-space:nowrap; overflow:hidden; }
.p4a6x3 span { display:inline-flex; align-items:center; gap:2px; padding:1px 5px; border-radius:10px; background:#ececec; }
.p4a6x3 span.p4a6-ici { background:var(--encre); color:#fff; font-weight:600; }
.p4a6x3 span.p4a6-ghost { background:repeating-linear-gradient(135deg,#d4d4d4 0 2px,#fff 2px 6px); color:var(--gris); }
.p4a6x3 i { font-style:normal; color:#6e6e6e; }
.p4a6x3 b.num { font-weight:600; }
.p4a6et { display:grid; grid-template-columns:repeat(4,1fr); gap:3px; margin-top:4px; }
.p4a6et button { position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2px 0 4px; border-radius:4px; background:var(--piste); font-size:12px; color:var(--gris); line-height:1.15; overflow:hidden; }
.p4a6et button b { font:600 12px var(--mono); color:#9840bc; }
.p4a6et button.p4a6et-amer::after { content:""; position:absolute; left:0; right:0; bottom:0; height:3px; background:var(--acc); }
.p4a6et button[aria-current="true"] { background:var(--encre); color:#fff; }
.p4a6et button[aria-current="true"] b { color:#ead7f3; }
.p4a6rg { margin-top:26px; }
.p4a6rg .s-lp { left:0; right:0; top:-60px; height:56px; }
.p4a6lev { position:relative; height:22px; margin-top:2px; }
.p4a6lev svg { position:absolute; inset:0; width:100%; height:100%; }
.p4a6lev-y { position:absolute; left:calc(52% - 16px); top:4px; color:var(--gris); }
.p4a6lev-j { position:absolute; top:5px; font:600 11px var(--mono); color:var(--gris); transform:translateX(-50%); }
`,
  corps: `
<div class="p4a6ch" data-figure aria-live="polite">
  <span class="p4a6ch-a">Ma bière</span>
  <span class="p4a6ch-b"><span class="p4a6ch-bt"><small>+ Idaho 7</small><b id="p4a6m">actif · 2 j</b></span><span class="p4a6-fl"><svg class="s-pi" width="15" height="15" style="width:15px;height:15px" data-famille="floral" aria-label="Floral"><use href="#p-floral"/></svg><span id="p4a6fl"></span></span></span>
  <nav class="p4a6ch-c" id="p4a6chc" aria-label="Pont vers Levure" data-acquis="levure" data-forme="pont"><a href="${ETAPE}">Puis la levure ›<small>Pomona</small></a></nav>
</div>
<p class="p4a6ct" id="p4a6ct"></p>
<section class="p4a6tab" data-figure id="p4a6tab" aria-label="Ma bière, puis avec Idaho 7, puis ce que la levure changerait"></section>
<div class="p4a6dock" id="p4a6dock" data-libre="moment" data-acquis="frise">
  <p class="p4a6x3" id="p4a6x3" aria-label="La chaîne de ta cuve"></p>
  <div class="p4a6et" id="p4a6et"></div>
  <div class="p4a6rg" id="p4a6rg"></div>
  <div class="p4a6lev" id="p4a6lev" aria-hidden="true"></div>
</div>`,
  script: function () {
    var S = window.S, D = S.D, X = window.S_DATA, seg = S.seg, best = S.best;
    var mp = function (id, s) { return '<svg class="s-mp" width="' + s + '" height="' + s + '" style="width:' + s + 'px;height:' + s + 'px" aria-hidden="true"><use href="#' + id + '"/></svg>'; };
    var VUES = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'berries', 'resin', 'green'], REPLI = ['pomeFruit', 'melon', 'spice'];
    var r1 = function (n) { return n >= 10 ? String(Math.round(n)) : String(Math.round(n * 10) / 10).split('.').join(','); };
    var tab = document.getElementById('p4a6tab');
    var ligne = function (f, cache) {
      var ai = S.avInc(f);
      return '<div class="p4a6l" data-l="' + f + '"' + (cache ? ' data-repli hidden' : '') + '><span class="p4a6l-n' + ({ floral: 1, herbal: 1, earthy: 1 }[f] ? ' p4a6-att' : '') + '">' + S.pi(f) + '<span>' + S.NOM[f] + '</span></span>'
        + '<span class="p4a6l-a' + (ai ? ' p4a6-inc' : '') + '">' + (ai ? '?' : r1(S.AV[f])) + '</span><span class="p4a6l-b" data-b="' + f + '"></span><span class="p4a6l-c" data-c="' + f + '"></span></div>';
    };
    tab.innerHTML = VUES.map(function (f) { return ligne(f); }).join('') + '<div class="p4a6am" id="p4a6am"></div>'
      + '<button type="button" class="p4a6repli" id="p4a6repli" aria-expanded="false" aria-controls="p4a6tab" aria-label="Montrer Pépins, Melon, Épicé">' + REPLI.map(function (f) { return S.pi(f, 14); }).join('') + '<svg class="p4a6chv" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button>'
      + REPLI.map(function (f) { return ligne(f, true); }).join('');
    document.getElementById('p4a6repli').addEventListener('click', function () { var o = this.getAttribute('aria-expanded') !== 'true'; this.setAttribute('aria-expanded', String(o)); tab.querySelectorAll('[data-repli]').forEach(function (r) { r.hidden = !o; }); });
    // La colonne du milieu : les barres l5b du socle (une par famille), posées dans la chaîne.
    var majs = VUES.concat(REPLI).map(function (f) {
      var hote = tab.querySelector('[data-b=' + f + ']'), m = S.barres(hote, [f]);
      hote.querySelector('.s-ba-n').hidden = true; hote.querySelector('.s-ba-v').classList.add('p4a6l-v');
      return m;
    });
    var jau = S.jauge(document.getElementById('p4a6am'), true);
    function levure(p) {
      var dd = X.POMONA[p.id] || null, trav = seg(p) === 2;
      document.getElementById('p4a6chc').classList.toggle('p4a6-trav', trav);
      VUES.concat(REPLI).forEach(function (f) {
        var c = tab.querySelector('[data-c=' + f + ']'), v = dd ? dd[f] : 0;
        if (dd && Math.abs(v) >= 0.5) { c.className = 'p4a6l-c p4a6-on'; c.style.color = S.T[f]; c.textContent = '~' + (v > 0 ? '+' : '−') + Math.abs(Math.round(v)); }
        else { c.className = 'p4a6l-c p4a6-off'; c.style.color = ''; c.textContent = '·'; }
      });
    }
    function contre(i) {
      var c = document.getElementById('p4a6ct'), p = D[i], q = D[best];
      if (i === best) { c.innerHTML = '★ le meilleur pour ta demande · <b>' + S.ibu(p).t.replace(' IBU', '') + '+? IBU</b>'; return; }
      var sg = p.interp ? '≈' : '~', fm = function (n) { n = Math.round(n); return sg + (n >= 0 ? '+' : '−') + Math.abs(n); };
      c.innerHTML = 'contre ★ <b>' + q.lib + '</b> : floral ' + fm(p.v.floral - q.v.floral) + ' · résineux ' + fm(p.v.resin - q.v.resin) + (S.ibu(p).h ? ' · <span class="p4a6-trop">trop amer</span>' : '');
    }
    // La chaîne réduite de x3b, au bout de la frise.
    function chaine(p) {
      document.getElementById('p4a6x3').innerHTML = '<span>Ma bière ' + S.pi('floral', 12) + '<b class="num">~' + r1(S.AV.floral) + '</b></span><i>→</i><span class="p4a6-ici">+ Idaho 7 ' + S.pi('floral', 12) + '<b class="num">' + (p.interp ? '≈' : '~') + Math.round(p.v.floral) + '</b></span><i>→</i><span>' + mp('m-levure', 12) + 'levure</span>';
    }
    // La courbe de la levure sous le rail : fermentation active (fin vers J+5), biotransformation hachurée ; 1 j sans gain.
    document.getElementById('p4a6lev').innerHTML = '<span class="p4a6lev-y">' + mp('m-levure', 13) + '</span><svg viewBox="0 0 100 22" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="p4a6-h" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1.3" height="3" fill="#fff"/></pattern></defs>'
      + '<path d="M52 21 C55 21 56 1 60.5 1 S70 2 73 14 S76 21 77 21 Z" fill="#8c8c8c"/><path d="M55.6 21 C56.6 10 58 2.4 60.5 2.4 S66 4 68 21 Z" fill="url(#p4a6-h)"/><path d="M77 20.4 L100 20.4" stroke="#8c8c8c" stroke-width="1.4" vector-effect="non-scaling-stroke"/></svg>';
    // Les étapes d'a1, sur le rail : un toucher saute à l'étape (au même jour en dry hop) ; orangé si trop amère.
    var ET = [['b60', '60′–0′', 0], ['wp', 'WP', 1], ['dryActive|2', 'actif', 2], ['dryPost|2', 'après', 3]], et = document.getElementById('p4a6et');
    et.innerHTML = ET.map(function (e) { return '<button type="button" data-etape="' + e[2] + '" data-saut="' + e[0] + '" aria-label="Moment : ' + e[1] + '"' + (S.ibu(D[S.idx(e[0])]).h ? ' class="p4a6et-amer"' : '') + '><span>' + e[1] + '</span><b>' + S.fmt(D[S.idx(e[0])], 'floral') + '</b></button>'; }).join('');
    et.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { var p = D[rail.cur()]; if (seg(p) === +b.dataset.etape) return; rail.poser(S.idx(b.dataset.saut.indexOf('dry') === 0 && S.jours(p) ? b.dataset.saut.split('|')[0] + '|' + S.jours(p) : b.dataset.saut)); }); });
    var rail = S.rail({
      hote: document.getElementById('p4a6rg'), orient: 'h', pas: 66,
      cellule: function (p) { return '<em>' + S.court(p) + '</em><i class="s-lp-b"><b style="width:' + Math.min(100, p.v.floral / 25 * 100).toFixed(0) + '%"></b></i><small>' + S.fmt(p, 'floral') + '</small>'; },
      onPose: function (i) {
        var p = D[i]; majs.forEach(function (m) { m(p); }); jau(p); levure(p); contre(i); chaine(p); et.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-current', String(+b.dataset.etape === seg(p))); });
        document.getElementById('p4a6m').textContent = p.lib; document.getElementById('p4a6fl').textContent = S.fmt(p, 'floral');
      },
    });
    S.surLecture(function () { var p = D[rail.cur()]; majs.forEach(function (m) { m(p); }); });
    var dk = document.getElementById('p4a6dock'), haut = function () { document.body.style.setProperty('--dock', dk.offsetHeight + 'px'); };
    haut(); addEventListener('resize', haut);
    rail.poser(rail.depart);
    window.LIRE = function () { return { m: rail.el.getAttribute('aria-valuetext'), fl: document.getElementById('p4a6fl').textContent, am: document.querySelector('#p4a6am .s-jv').textContent, noyau: tab.querySelector('[data-b=stoneFruit] .s-ba-v').textContent, avantNoyau: tab.querySelector('[data-l=stoneFruit] .p4a6l-a').textContent, pomonaAgrumes: tab.querySelector('[data-c=citrus]').textContent, chaine: document.getElementById('p4a6x3').textContent, mieux: document.getElementById('p4a6ct').textContent }; };
    if (/touche=1/.test(location.search)) rail.toucher();
  },
};
