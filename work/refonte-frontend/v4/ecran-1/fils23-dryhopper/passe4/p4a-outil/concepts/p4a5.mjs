// p4a5 · tiède · « les vraies valeurs d'abord » : a1 sous ses preuves. En tête, ce qui a été mesuré à chaque étape du
// brassin (la table des preuves de c7), la colonne du moment allumée ; puis les barres l5b d'a1 avec, derrière
// chacune, la plage du moteur (bas–haut) en pâle, et la plage chiffrée à côté de l'écart. Au rail, les fioles disent
// où une étude a mesuré. Le certificat du lot est sous la table.
// Améliorations du brief prises :
//   1. l'arôme entre deux moments : la plage et l'écart sont interpolés entre deux crans calculés, et c'est dit
//      (« ≈ 60′–10′ » sous la table, bord pointillé de la plage) ;
//   4. l'inconnu n'est jamais zéro : avant inconnu (Noyau, Baies) hachuré, écart « ? » ; whirlpool « jamais mesuré »
//      hachuré ; l'amertume à cru « 60+? » ;
//   2. le contour « chaleur ou CO₂ » : sous la table, ce que l'étape perd en floral face au dry hop après (flamme, bulles).
// Greffes : la table des preuves (c7), « jamais mesuré » hachuré (c5), la mesure qui suit le doigt (c7, d1), le
// certificat du lot (d5), la plage pâle derrière la barre (x3b). Classes « p4a5 » (L26).
import { ETAPE } from '../socle.mjs';

const FIOLE = '<svg class="p4a5-fi" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 2.5h6M10 2.5v6.2L4.6 18.4A2 2 0 0 0 6.4 21.5h11.2a2 2 0 0 0 1.8-3.1L14 8.7V2.5"/><path d="M7 15h10"/></svg>';

export default {
  id: 'p4a5', nom: 'a1 sous ses preuves : mesuré, plage, simulé', chaleur: 'tiède', levure: 'propre',
  titre: 'Quand ajouter Idaho 7 ?',
  legende: [
    'En haut, ce qu\'une étude a mesuré à chaque étape (fiole) ; hachuré : jamais mesuré. La colonne de ton moment est allumée.',
    'Barre : ta stout avec Idaho 7 (simulé) ; pâle derrière : la plage du moteur, du bas au haut ; rond : avant ; hachuré de couleur : avant inconnu.',
    'Flamme, bulles : le floral que la chaleur ou le CO₂ emporte face au dry hop après fermentation. ≈ : interpolé entre deux crans calculés.',
  ],
  css: `
body.p4a5 { padding-bottom:var(--dock,74px); }
.p4a5 .s-ecran { gap:6px; min-height:calc(100svh - var(--dock,74px)); padding-bottom:8px; }
.p4a5pr { display:grid; grid-template-columns:repeat(4,1fr); gap:3px; }
.p4a5pr-c { display:flex; flex-direction:column; gap:3px; padding:5px 5px 6px; border-radius:8px; background:var(--plan); border:1px solid var(--trait); min-height:96px; font-size:12px; color:var(--gris); }
.p4a5pr-c.p4a5-on { background:#fff; border:2px solid var(--encre); padding:4px 4px 5px; }
.p4a5pr-t { display:flex; align-items:center; gap:3px; font:600 13px var(--sans); color:var(--encre); white-space:nowrap; }
.p4a5pr-m { flex:1; display:flex; flex-direction:column; gap:1px; color:var(--encre); }
.p4a5pr-m b { font:700 12px var(--mono); }
.p4a5pr-m small { font-size:11.5px; color:var(--gris); }
.p4a5pr-m .p4a5-fi { color:#0f6f8f; }
.p4a5pr-c.p4a5-jamais .p4a5pr-m { justify-content:center; align-items:center; border-radius:4px; background:repeating-linear-gradient(135deg,#d4d4d4 0 2px,transparent 2px 6px); color:var(--gris); }
.p4a5pr-em { display:flex; align-items:center; gap:2px; font:600 12px var(--mono); color:var(--gris); }
.p4a5lot { display:flex; flex-wrap:wrap; align-items:center; gap:2px 8px; font-size:12px; color:var(--gris); }
.p4a5lot b { color:var(--encre); font-weight:600; }
.p4a5lot .p4a5-ip { margin-left:auto; padding:0 5px; border:1px dashed #b4b4b4; border-radius:4px; font-style:italic; }
.p4a5rep { display:flex; align-items:center; gap:8px; font-size:15px; }
.p4a5rep b { font-weight:600; }
.p4a5rep .p4a5rep-fl { display:inline-flex; align-items:center; gap:3px; color:#9840bc; font:700 16px var(--mono); }
.p4a5rep .p4a5rep-c { margin-left:auto; font-size:12px; color:var(--gris); text-align:right; }
.p4a5rep .p4a5rep-c b { color:var(--encre); }
.p4a5fig { flex:1; justify-content:space-between; padding:6px 10px; gap:2px; }
.p4a5ba { display:grid; grid-template-columns:88px 1fr 70px; align-items:center; gap:6px; min-height:27px; font-size:14px; }
.p4a5ba-n { display:flex; align-items:center; gap:4px; white-space:nowrap; }
.p4a5ba-n.p4a5-att { font-weight:700; }
.p4a5ba-p { position:relative; height:20px; background:var(--piste); border-radius:2px; overflow:hidden; }
.p4a5ba-p i { position:absolute; display:block; top:0; bottom:0; }
.p4a5ba-p .p4a5-z { left:0; width:var(--zs); background:var(--zone); }
.p4a5ba-p .p4a5-pl { left:var(--ps); width:var(--pw); top:auto; bottom:0; height:4px; border-radius:2px; opacity:.75; }
.p4a5ba.p4a5-ipl .p4a5-pl { opacity:1; background:repeating-linear-gradient(90deg,var(--c) 0 4px,transparent 4px 7px) !important; }
.p4a5ba-p .p4a5-b { left:0; width:var(--bs); top:3px; bottom:7px; border-radius:2px; }
.p4a5ba-p .p4a5-av { left:clamp(7px, var(--as), calc(100% - 7px)); top:2px; width:16px; height:16px; margin-left:-8px; border-radius:50%; border:2px solid var(--encre); background:#fff; }
.p4a5ba-p .p4a5-h { left:0; right:0; background:repeating-linear-gradient(135deg,#c4c4c4 0 2px,transparent 2px 6px); }
body.abs .p4a5ba-p .p4a5-z { width:var(--za); } body.abs .p4a5ba-p .p4a5-pl { left:var(--pa); width:var(--pwa); }
body.abs .p4a5ba-p .p4a5-b { width:var(--ba); } body.abs .p4a5ba-p .p4a5-av { left:clamp(7px, var(--aa), calc(100% - 7px)); }
.p4a5ba-v { display:flex; flex-direction:column; align-items:flex-end; line-height:1.05; font-family:var(--mono); }
.p4a5ba-v b { font-size:13px; font-weight:600; }
.p4a5ba-v small { font-size:11px; color:var(--gris); }
.p4a5am .s-jauge { font-size:13px; }
.p4a5repli { display:flex; align-items:center; gap:6px; height:22px; color:var(--gris); }
.p4a5repli[aria-expanded="true"] svg.p4a5ch { transform:rotate(90deg); }
.p4a5dock { position:fixed; left:50%; bottom:0; transform:translateX(-50%); width:min(390px,100%); background:#fff; border-top:1px solid var(--trait); box-shadow:0 -12px 40px -16px rgba(22,22,22,.35); padding:4px 12px 8px; z-index:20; }
.p4a5dock-h { display:flex; justify-content:flex-end; margin-bottom:2px; }
.p4a5lev a { display:inline-flex; align-items:center; gap:5px; height:30px; padding:0 12px; border-radius:15px; background:var(--encre); color:#fff; font-size:13px; white-space:nowrap; }
.p4a5lev a b { font-weight:700; }
.p4a5lev a span { display:inline-flex; align-items:center; gap:3px; color:#d4d4d4; }
.p4a5rg .s-lp { left:0; right:0; top:-36px; height:52px; }
.p4a5pins { position:relative; height:16px; }
.p4a5pins span { position:absolute; top:0; transform:translateX(-50%); color:#0f6f8f; }
.p4a5pins span.p4a5-hach { top:5px; height:6px; transform:none; background:repeating-linear-gradient(135deg,#c4c4c4 0 2px,transparent 2px 5px); border-radius:2px; }
`,
  corps: `
<div class="p4a5pr" data-figure id="p4a5pr" data-acquis="valeurs"></div>
<p class="p4a5lot"><span><b>ton lot</b> <span data-nature="mesure" data-source="CoA ID7-2573">huile 2,5 mL/100 g · linalol 0,4 % · myrcène 45,4 %</span></span><span class="p4a5-ip" id="p4a5ip" hidden></span></p>
<div class="p4a5rep" aria-live="polite"><b>Face à ta stout</b><span class="p4a5rep-fl"><svg class="s-pi" width="16" height="16" style="width:16px;height:16px" data-famille="floral" aria-label="Floral"><use href="#p-floral"/></svg><span id="p4a5rep-fl"></span></span><span class="p4a5rep-c" id="p4a5rep-c"></span></div>
<section class="s-bloc p4a5fig" data-figure id="p4a5fig" aria-label="Familles d'arômes au style, avec la plage du moteur"></section>
<div class="p4a5dock" id="p4a5dock" data-libre="moment" data-acquis="frise">
  <div class="p4a5dock-h"><nav class="p4a5lev" aria-label="Pont vers Levure" data-acquis="levure" data-forme="pont"><a href="${ETAPE}"><b>Puis la levure</b><span id="p4a5lev-t"></span></a></nav></div>
  <div class="p4a5rg" id="p4a5rg"><div class="p4a5pins" id="p4a5pins" aria-hidden="true"></div></div>
</div>`,
  script: function () {
    var S = window.S, D = S.D, X = window.S_DATA, seg = S.seg, best = S.best, jours = S.jours;
    var mp = function (id, s) { return '<svg class="s-mp" width="' + s + '" height="' + s + '" style="width:' + s + 'px;height:' + s + 'px" aria-hidden="true"><use href="#' + id + '"/></svg>'; };
    var FI = '<svg class="p4a5-fi" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 2.5h6M10 2.5v6.2L4.6 18.4A2 2 0 0 0 6.4 21.5h11.2a2 2 0 0 0 1.8-3.1L14 8.7V2.5"/><path d="M7 15h10"/></svg>';
    // La table des preuves : ce qui a été publié à chaque étape (c7) ; le whirlpool n'a jamais été mesuré.
    var PR = [
      ['60′–0′', 'm-feu', '« cuit »', 'Sharp 2014', 'E07 Sharp 2014'],
      ['whirlpool', 'm-tourb', null],
      ['actif', 'm-bulle', 'linalol 38 µg/L', 'McCabe 2023', 'E03 McCabe 2023'],
      ['après', 'm-cuve', 'jury 3 → 8,1', 'Cascade, Lafontaine 2018', 'E04 Lafontaine 2018'],
    ];
    var pr = document.getElementById('p4a5pr');
    pr.innerHTML = PR.map(function (e, n) {
      return '<div class="p4a5pr-c' + (e[2] ? '' : ' p4a5-jamais') + '" data-s="' + n + '"><span class="p4a5pr-t">' + mp(e[1], 13) + e[0] + '</span><span class="p4a5pr-m">'
        + (e[2] ? FI + '<b data-nature="mesure" data-source="' + e[4] + '">' + e[2] + '</b><small>' + e[3] + '</small>' : 'jamais mesuré') + '</span><span class="p4a5pr-em" data-em></span></div>';
    }).join('');
    // Les barres : la plage du moteur en pâle derrière la barre l5b d'a1.
    var VUES = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'berries', 'resin', 'green'], REPLI = ['pomeFruit', 'melon', 'spice'];
    var w = function (v, f, m) { return Math.max(0, Math.min(100, m === 's' ? v / S.B[f] / 2 * 100 : v / 110 * 100)); };
    var ligne = function (f, cache) {
      var ai = S.avInc(f);
      return '<div class="p4a5ba" data-f="' + f + '"' + (cache ? ' data-repli hidden' : '') + ' style="--c:' + S.BA[f] + '"><span class="p4a5ba-n' + ({ floral: 1, herbal: 1, earthy: 1 }[f] ? ' p4a5-att' : '') + '">' + S.pi(f) + '<span>' + S.NOM[f] + '</span></span>'
        + '<span class="p4a5ba-p"><i class="p4a5-z" data-role="zone" style="--zs:50%;--za:' + (S.B[f] / 110 * 100).toFixed(1) + '%"></i><i class="p4a5-pl" style="background:' + S.BA[f] + '"></i><i class="p4a5-b' + (ai ? ' s-avinc' : '') + '" style="background:' + S.BA[f] + '"></i>'
        + (ai ? '' : '<i class="p4a5-av" style="--as:' + w(S.AV[f], f, 's').toFixed(1) + '%;--aa:' + w(S.AV[f], f, 'a').toFixed(1) + '%"></i>') + '<i class="p4a5-h"></i></span><span class="p4a5ba-v"><b></b><small></small></span></div>';
    };
    var fig = document.getElementById('p4a5fig');
    fig.innerHTML = VUES.map(function (f) { return ligne(f); }).join('') + '<div class="p4a5am" id="p4a5am"></div>'
      + '<button type="button" class="p4a5repli" id="p4a5repli" aria-expanded="false" aria-controls="p4a5fig" aria-label="Montrer Pépins, Melon, Épicé">' + REPLI.map(function (f) { return S.pi(f, 14); }).join('') + '<svg class="p4a5ch" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button>'
      + REPLI.map(function (f) { return ligne(f, true); }).join('');
    document.getElementById('p4a5repli').addEventListener('click', function () { var o = this.getAttribute('aria-expanded') !== 'true'; this.setAttribute('aria-expanded', String(o)); fig.querySelectorAll('[data-repli]').forEach(function (r) { r.hidden = !o; }); });
    var jau = S.jauge(document.getElementById('p4a5am'), true);
    var r1 = function (n) { return n >= 10 ? String(Math.round(n)) : String(Math.round(n * 10) / 10).split('.').join(','); };
    function barres(p) {
      fig.querySelectorAll('[data-f]').forEach(function (r) {
        var f = r.dataset.f, u = S.inc(p, f), iv = p.iv[f], b = r.querySelector('.p4a5-b'), pl = r.querySelector('.p4a5-pl'), v = r.querySelector('.p4a5ba-v b'), sm = r.querySelector('.p4a5ba-v small');
        r.classList.toggle('p4a5-ipl', !!p.interp); b.hidden = u; pl.hidden = u; r.querySelector('.p4a5-h').hidden = !u;
        if (!u) {
          b.style.setProperty('--bs', w(p.v[f], f, 's') + '%'); b.style.setProperty('--ba', w(p.v[f], f, 'a') + '%');
          pl.style.setProperty('--ps', w(iv[0], f, 's') + '%'); pl.style.setProperty('--pw', (w(iv[1], f, 's') - w(iv[0], f, 's')) + '%');
          pl.style.setProperty('--pa', w(iv[0], f, 'a') + '%'); pl.style.setProperty('--pwa', (w(iv[1], f, 'a') - w(iv[0], f, 'a')) + '%');
        }
        v.textContent = S.fmt(p, f); v.style.color = u ? '#555555' : (S.hors(p, f) ? '#c2410c' : S.T[f]);
        sm.textContent = u ? '' : r1(iv[0]) + '–' + r1(iv[1]);
      });
    }
    function preuves(p) {
      var s = seg(p), j = jours(p) || 2, ref = D[S.idx('dryPost|' + j)];
      pr.querySelectorAll('.p4a5pr-c').forEach(function (c, n) {
        c.classList.toggle('p4a5-on', n === s);
        var q = n === s ? p : D[S.idx(n === 0 ? 'b60' : n === 1 ? 'wp' : (n === 2 ? 'dryActive|' : 'dryPost|') + j)], perte = ref.v.floral - q.v.floral, em = c.querySelector('[data-em]');
        em.innerHTML = n === 3 || perte < 0.5 ? '' : mp(n === 2 ? 'm-bulle' : 'm-feu', 12) + '−' + Math.round(perte) + S.pi('floral', 12);
      });
      var ip = document.getElementById('p4a5ip'); ip.hidden = !p.entre; if (p.entre) ip.textContent = '≈ ' + p.entre[0] + '–' + p.entre[1];
    }
    function levure(p) {
      var dd = X.POMONA[p.id] || null, f2 = null;
      if (dd) for (var f in dd) if (!f2 || Math.abs(dd[f]) > Math.abs(dd[f2])) f2 = f;
      document.getElementById('p4a5lev-t').innerHTML = dd && Math.abs(dd[f2]) >= 0.5 ? 'Pomona ' + S.pi(f2, 13) + '~+' + Math.round(dd[f2]) + ' ›' : 'rien ici ›';
    }
    function contre(i) {
      var c = document.getElementById('p4a5rep-c'), p = D[i], q = D[best];
      if (i === best) { c.innerHTML = '★ le meilleur'; return; }
      var sg = p.interp ? '≈' : '~', n = Math.round(p.v.floral - q.v.floral);
      c.innerHTML = 'contre ★ <b>' + q.lib + '</b> : ' + sg + (n >= 0 ? '+' : '−') + Math.abs(n) + (S.ibu(p).h ? ' · trop amer' : '');
    }
    // Les fioles sur le rail : là où une étude a mesuré ; le whirlpool, hachuré.
    var pins = document.getElementById('p4a5pins');
    pins.innerHTML = '<span style="left:' + S.x(0) + '%">' + FI + '</span><span class="p4a5-hach" style="left:44%;width:8%"></span><span style="left:64%">' + FI + '</span><span style="left:88%">' + FI + '</span>';
    var rail = S.rail({
      hote: document.getElementById('p4a5rg'), orient: 'h', pas: 66,
      cellule: function (p) { return '<em>' + S.court(p) + '</em><i class="s-lp-b"><b style="width:' + Math.min(100, p.v.floral / 25 * 100).toFixed(0) + '%"></b></i><small>' + S.fmt(p, 'floral') + '</small>'; },
      onPose: function (i) { var p = D[i]; barres(p); jau(p); preuves(p); levure(p); contre(i); document.getElementById('p4a5rep-fl').textContent = S.fmt(p, 'floral'); },
    });
    S.surLecture(function () { barres(D[rail.cur()]); });
    var dk = document.getElementById('p4a5dock'), haut = function () { document.body.style.setProperty('--dock', dk.offsetHeight + 'px'); };
    haut(); addEventListener('resize', haut);
    rail.poser(rail.depart);
    window.LIRE = function () { return { m: rail.el.getAttribute('aria-valuetext'), fl: document.getElementById('p4a5rep-fl').textContent, plage: fig.querySelector('[data-f=floral] .p4a5ba-v small').textContent, am: document.querySelector('#p4a5am .s-jv').textContent, noyau: fig.querySelector('[data-f=stoneFruit] .p4a5ba-v b').textContent, ip: document.getElementById('p4a5ip').hidden ? '' : document.getElementById('p4a5ip').textContent, lev: document.getElementById('p4a5lev-t').textContent, mieux: document.getElementById('p4a5rep-c').textContent }; };
    if (/touche=1/.test(location.search)) rail.toucher();
  },
};
