// a1 · passe 2 · « Le rail sous le pouce » (froide). Base : a1 v0 (y1b et l'écran de la carte affinés).
// Greffes du tri (SYNTHESE.md) : dock-profil de e1 (le relief devient les cases du dock), quatre pastilles
// d'étape de a4, contour de ce que la chaleur ou le CO₂ emporte (d2, en contour : le hachuré reste l'inconnu),
// « le meilleur : actif · 2 j » quand on s'en écarte (g4), « 1 j sans gain » sur les jours (e2), pont levure
// qui suit le moment (g1, g4), « jamais mesuré à ce moment » (c5). Retouches : plus de vide (D4, D55),
// pastille « par floral » de y1b en lecture seule (D104), Pépins, Melon, Épicé repliés (≤ 80 mots).
import { ETAPE, OUTIL } from '../socle.mjs';

const CHEV = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';

export default {
  id: 'a1', nom: 'Le rail sous le pouce, passe 2', chaleur: 'froide', levure: 'propre',
  titre: 'Quand ajouter Idaho 7 ?',
  legende: [
    'Glisse le pouce sur le rail, de 60′ à après 7 j, par 5′ ; la loupe grossit les moments voisins.',
    'Cases du dock : le floral à ce moment ; trait orangé : amertume hors du style 16D (50–70 IBU).',
    'Barre : ta stout avec Idaho 7 ; rond : avant ; contour : ce que la chaleur ou le CO₂ emporte, face au dry hop après fermentation.',
    '« par floral » : le meilleur moment pour ta demande du 18.10, plus floral, moins résineux, amertume dans le style.',
    'Jours hachurés : sans gain sur le jour d\'avant. Résineux : déjà hors du style, ta dégustation.',
    '~ simulé · ≈ interpolé entre 60′, 10′ et whirlpool · ? inconnu, hachuré.',
  ],
  css: `
body.a1 { padding-bottom:var(--dock,128px); }
.a1 .s-ecran { min-height:calc(100svh - var(--dock,128px)); gap:6px; }
.a1-rep { display:flex; flex-wrap:wrap; align-items:center; gap:2px 8px; font-size:16px; }
.a1-face { font-weight:600; }
.a1-fl { display:inline-flex; align-items:center; gap:4px; color:#9840bc; font-weight:700; }
.a1-par { margin-left:auto; display:inline-flex; align-items:center; gap:4px; height:24px; padding:0 9px; border-radius:12px; background:#fff; border:1px solid #d5d8df; font-size:13px; color:var(--gris); }
.a1-par b { color:#9840bc; font-weight:600; }
.a1-mieux { flex-basis:100%; font-size:13px; color:var(--gris); }
.a1-mieux b { color:var(--encre); }
.a1-fig { flex:1; justify-content:space-evenly; gap:2px; }
.a1-ba { display:grid; grid-template-columns:96px 1fr 42px; align-items:center; gap:6px; font-size:14px; min-height:22px; }
.a1-ba-n { display:flex; align-items:center; gap:4px; white-space:nowrap; }
.a1-ba-n.a1-att { font-weight:700; }
.a1-ba-v { text-align:right; font-size:13px; font-family:var(--mono); }
.a1-p { position:relative; height:16px; background:#f1f2f5; border-radius:2px; overflow:hidden; }
.a1-p i { position:absolute; top:0; bottom:0; left:0; display:block; }
.a1-p .a1-pz { width:var(--ws); background:#d9dce3; }
.a1-p .a1-q { left:var(--qs); width:var(--qw); top:3px; height:10px; border:1.5px solid var(--c); border-left:0; border-radius:0 2px 2px 0; background:#fff; }
.a1-p .a1-b { width:var(--ws); top:3px; height:10px; border-radius:2px; transition:width .18s cubic-bezier(.2,.8,.2,1); }
.a1-ip .a1-p .a1-b { opacity:.5; }
.a1-p .a1-av { left:clamp(7px, var(--ws), calc(100% - 7px)); width:14px; height:14px; top:1px; border-radius:50%; border:2px solid var(--encre); background:#fff; margin-left:-6px; }
.a1-p .a1-h { right:0; background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }
body.abs .a1-p .a1-pz, body.abs .a1-p .a1-b { width:var(--wa); }
body.abs .a1-p .a1-q { left:var(--qa); width:var(--qwa); }
body.abs .a1-p .a1-av { left:clamp(6px, var(--wa), calc(100% - 6px)); }
.a1-repli { display:flex; align-items:center; gap:6px; height:24px; padding:0 2px; color:var(--gris); font-size:13px; align-self:flex-start; }
.a1-repli svg.a1-ch { transition:transform .15s; }
.a1-repli[aria-expanded="true"] svg.a1-ch { transform:rotate(90deg); }
.a1-am { display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:8px; font-size:13px; }
.a1-am b { font-weight:600; }
.a1-am b.a1-hs { color:var(--acc); }
.a1-jp { position:relative; height:10px; background:#f1f2f5; border-radius:2px; }
.a1-jp i { position:absolute; top:0; bottom:0; display:block; border-radius:2px; }
.a1-jp .a1-jz { background:#d9dce3; }
.a1-jp .a1-jb { background:#8a8f9c; }
.a1-jp .a1-ja { background:var(--encre); transition:width .18s; }
.a1-jp .a1-ja.a1-hs { background:var(--acc); }
.a1-jp .a1-ja.a1-ip { opacity:.55; }
.a1-jp .a1-cru { background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }
.a1-bas { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.a1-mes { display:flex; align-items:center; gap:5px; font-size:12px; color:var(--gris); min-width:0; }
.a1-mes b { color:var(--encre); font-weight:600; }
.a1-mes.a1-jamais { padding:1px 6px; border-radius:4px; background:repeating-linear-gradient(135deg,#eceef2 0 2px,transparent 2px 6px); }
.a1-lev a { display:inline-flex; align-items:center; gap:5px; height:30px; padding:0 12px; border-radius:15px; background:#fff; border:1px solid #c9cad2; font-size:13px; white-space:nowrap; }
.a1-lev a b { font-weight:700; }
.a1-dock { position:fixed; left:50%; bottom:0; transform:translateX(-50%); width:min(390px,100%); background:#fff; border-top:1px solid var(--trait); box-shadow:0 -12px 40px -16px rgba(22,22,26,.35); padding:6px 12px 8px; z-index:20; }
.a1-haut { display:grid; grid-template-columns:1fr 84px; gap:6px; align-items:stretch; }
.a1-et { display:grid; grid-template-columns:repeat(4,1fr); gap:3px; }
.a1-et button { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:1px 0; border-radius:4px; background:#f1f2f5; font-size:12px; color:var(--gris); line-height:1.15; }
.a1-et button b { font:600 12px var(--mono); color:#9840bc; }
.a1-et button[aria-current="true"] { background:var(--encre); color:#fff; }
.a1-et button[aria-current="true"] b { color:#ead7f3; }
.a1-jr { display:grid; grid-template-columns:1fr 1fr; gap:3px; }
.a1-jr button { border-radius:4px; background:#f1f2f5; font:600 12px var(--sans); color:var(--encre); }
.a1-jr button.a1-sg { background:repeating-linear-gradient(135deg,#e3e5eb 0 2px,#f6f7f9 2px 6px); color:var(--gris); font-weight:400; }
.a1-jr button[aria-pressed="true"] { background:var(--encre); color:#fff; font-weight:700; }
.a1-jr button[aria-disabled="true"] { opacity:.45; }
.a1-geste { position:relative; touch-action:none; margin-top:4px; }
.a1-prof { position:relative; height:30px; }
.a1-prof i { position:absolute; bottom:0; width:var(--cw); margin-left:calc(var(--cw) / -2); background:#f1f2f5; border-radius:2px 2px 0 0; height:100%; }
.a1-prof i b { position:absolute; left:1px; right:1px; bottom:0; background:#bf86d6; border-radius:2px 2px 0 0; }
.a1-prof i.a1-ip b { opacity:.5; }
.a1-prof i.a1-amer { box-shadow:inset 0 -3px 0 var(--acc); }
.a1-prof i.a1-ici { background:#e6e8ee; }
.a1-rail { position:relative; height:24px; cursor:pointer; }
.a1-z { position:absolute; top:9px; height:6px; border-radius:2px; background:#c9cdd6; }
.a1-z.a1-z1, .a1-z.a1-z3 { background:#aeb4c1; }
.a1-cran { position:absolute; top:5px; width:1px; height:14px; background:var(--encre); }
.a1-pouce { position:absolute; top:2px; width:20px; height:20px; margin-left:-10px; border-radius:50%; background:var(--encre); border:3px solid #fff; box-shadow:0 0 0 1px var(--encre); }
.a1-pl { position:absolute; bottom:24px; left:50%; transform:translateX(-50%); white-space:nowrap; display:inline-flex; align-items:center; gap:5px; background:var(--encre); color:#fff; font:600 13px var(--sans); padding:1px 8px; border-radius:10px; pointer-events:none; }
.a1-pl .s-pt { border:1.5px solid #fff; }
.a1-loupe { position:absolute; left:0; right:0; top:-44px; height:38px; display:none; background:#fff; border:1px solid #c9cad2; border-radius:8px; overflow:hidden; box-shadow:0 8px 24px -12px rgba(22,22,26,.4); }
.a1-geste.a1-touche .a1-loupe { display:block; }
.a1-geste.a1-touche .a1-pl { visibility:hidden; }
.a1-loupe span { position:absolute; top:5px; transform:translateX(-50%); font:600 13px var(--mono); color:var(--gris); }
.a1-loupe span.a1-l-ici { color:#fff; background:var(--encre); padding:1px 6px; border-radius:4px; }
`,
  corps: `
<div class="a1-rep" aria-live="polite"><span class="a1-face">Face à ta stout</span><span class="a1-fl"><svg class="s-pi" width="18" height="18" style="width:18px;height:18px" data-famille="floral" aria-label="Floral"><use href="#p-floral"/></svg><span id="a1-fl" class="num">~+22</span></span>
  <span class="a1-par" data-role="critere">par <svg class="s-pi" width="14" height="14" style="width:14px;height:14px" data-famille="floral" aria-label="Floral"><use href="#p-floral"/></svg><b>floral</b></span>
  <span class="a1-mieux" id="a1-mieux" hidden>le meilleur : <b id="a1-mieux-m">actif · 2 j</b></span></div>
<section class="s-bloc a1-fig" id="a1-fig" aria-label="Familles d'arômes au style"></section>
<div class="s-bloc"><div class="a1-am"><span>amertume</span><span class="a1-jp" aria-hidden="true"><i class="a1-jz" style="left:29.4%;width:11.8%"></i><i class="a1-jb" style="left:0;width:35.3%"></i><i class="a1-ja" style="left:35.3%"></i><i class="a1-cru" hidden></i></span><b id="a1-amv">60 IBU tenue</b></div></div>
<div class="a1-bas">
  <p class="a1-mes" id="a1-mes" data-acquis="valeurs"></p>
  <nav class="a1-lev" aria-label="Pont vers Levure" data-acquis="levure" data-forme="pont"><a id="a1-lev" href="${OUTIL}"><b>Levure</b><span id="a1-lev-t">Pomona ~+13 agrumes</span>${CHEV}</a></nav>
</div>
<div class="a1-dock" id="a1-dock" data-libre="moment" data-acquis="frise">
  <div class="a1-haut">
    <div class="a1-et" id="a1-et"></div>
    <div class="a1-jr" id="a1-jr" data-jours role="group" aria-label="Jours de contact"></div>
  </div>
  <div class="a1-geste" id="a1-geste" data-acquis="geste">
    <div class="a1-loupe" aria-hidden="true"></div>
    <div class="a1-prof" id="a1-prof" aria-hidden="true"></div>
    <div class="a1-rail" role="slider" tabindex="0" data-pas="5" aria-label="Moment de l'ajout" aria-valuemin="0" aria-valuemax="23" aria-valuenow="15" aria-valuetext="actif · 2 j">
      <span class="a1-z a1-z0" style="left:0;width:44%"></span><span class="a1-z a1-z1" style="left:44%;width:8%"></span><span class="a1-z a1-z2" style="left:52%;width:24%"></span><span class="a1-z a1-z3" style="left:76%;width:24%"></span>
      <span class="a1-pouce" data-couleur="#e80030" data-serie="Idaho 7"><span class="a1-pl"><i class="s-pt"></i><span id="a1-pl">2 j</span></span></span>
    </div>
  </div>
</div>`,
  script: function () {
    var S = window.S, D = S.D, N = S.N, X = window.S_DATA, SEG = [[0, 44], [44, 52], [52, 76], [76, 100]];
    var seg = function (p) { return p.id.charAt(0) === 'b' ? 0 : p.id === 'wp' ? 1 : p.id.indexOf('dryActive') === 0 ? 2 : 3; };
    var jours = function (p) { return +(p.id.split('|')[1] || 0); };
    var geste = document.getElementById('a1-geste'), rail = geste.querySelector('.a1-rail'), loupe = geste.querySelector('.a1-loupe');
    function x(i) { var s = seg(D[i]), idx = []; for (var k = 0; k <= N; k++) if (seg(D[k]) === s) idx.push(k); var n = idx.length, a = SEG[s][0], b = SEG[s][1]; return n === 1 ? (a + b) / 2 : a + (b - a) * (0.06 + 0.88 * idx.indexOf(i) / (n - 1)); }
    // Le meilleur pour sa demande (« trop résineuse, je la veux plus florale ») : floral gagné moins résineux
    // gagné, amertume dans la bande 50–70 du style ; à 0,05 près, le plus tôt et le plus court.
    var score = function (p) { return S.d(p, 'floral') - S.d(p, 'resin'); }, best = -1;
    for (var k = 0; k <= N; k++) { if (S.ibu(D[k]).n > 70) continue; if (best < 0 || score(D[k]) > score(D[best]) + 0.05) best = k; }
    // Les barres : 9 familles au repos, Pépins, Melon, Épicé repliés (inconnues ou faibles).
    var VUES = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'berries', 'resin', 'green'], REPLI = ['pomeFruit', 'melon', 'spice'];
    var w = function (v, f, m) { return (m === 's' ? Math.min(100, v / S.B[f] / 2 * 100) : Math.min(100, v / 110 * 100)); };
    var ligne = function (f, cache) {
      return '<div class="a1-ba" data-f="' + f + '"' + (cache ? ' data-repli hidden' : '') + '><span class="a1-ba-n' + ({ floral: 1, herbal: 1, earthy: 1 }[f] ? ' a1-att' : '') + '">' + S.pi(f) + '<span>' + S.NOM[f] + '</span></span>'
        + '<span class="a1-p" style="--c:' + S.BA[f] + '"><i class="a1-pz" data-role="zone" style="--ws:50%;--wa:' + (S.B[f] / 110 * 100).toFixed(1) + '%"></i><i class="a1-q"></i><i class="a1-b" style="background:' + S.BA[f] + '"></i>'
        + '<i class="a1-av" style="--ws:' + w(S.AV[f], f, 's').toFixed(1) + '%;--wa:' + w(S.AV[f], f, 'a').toFixed(1) + '%"></i><i class="a1-h"></i></span><span class="a1-ba-v"></span></div>';
    };
    var fig = document.getElementById('a1-fig');
    fig.innerHTML = VUES.map(function (f) { return ligne(f); }).join('')
      + '<button type="button" class="a1-repli" id="a1-repli" aria-expanded="false" aria-controls="a1-fig" aria-label="Montrer Pépins, Melon, Épicé">' + REPLI.map(function (f) { return S.pi(f, 14); }).join('') + '<svg class="a1-ch" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button>'
      + REPLI.map(function (f) { return ligne(f, true); }).join('');
    document.getElementById('a1-repli').addEventListener('click', function () { var o = this.getAttribute('aria-expanded') !== 'true'; this.setAttribute('aria-expanded', String(o)); fig.querySelectorAll('[data-repli]').forEach(function (r) { r.hidden = !o; }); });
    // Ce que la chaleur ou le CO₂ emporte : l'écart avec le dry hop après fermentation, mêmes jours.
    var refDe = function (p) { if (seg(p) === 3) return null; return D[S.idx('dryPost|' + (jours(p) || 2))]; };
    function barres(p) {
      var r0 = refDe(p);
      fig.querySelectorAll('[data-f]').forEach(function (r) {
        var f = r.dataset.f, u = S.inc(p, f), b = r.querySelector('.a1-b'), q = r.querySelector('.a1-q'), v = r.querySelector('.a1-ba-v');
        r.classList.toggle('a1-ip', !!p.interp); b.hidden = u; r.querySelector('.a1-h').hidden = !u; q.hidden = true;
        if (!u) {
          b.style.setProperty('--ws', w(p.v[f], f, 's') + '%'); b.style.setProperty('--wa', w(p.v[f], f, 'a') + '%');
          if (r0 && !S.inc(r0, f) && r0.v[f] - p.v[f] >= 0.5) {
            var s0 = w(p.v[f], f, 's'), s1 = w(r0.v[f], f, 's'), a0 = w(p.v[f], f, 'a'), a1 = w(r0.v[f], f, 'a');
            if (s1 - s0 > 0.5) { q.hidden = false; q.style.setProperty('--qs', s0 + '%'); q.style.setProperty('--qw', (s1 - s0) + '%'); q.style.setProperty('--qa', a0 + '%'); q.style.setProperty('--qwa', (a1 - a0) + '%'); }
          }
        }
        v.textContent = S.fmt(p, f); v.style.color = u ? '#55555f' : (S.hors(p, f) ? '#c2410c' : S.T[f]);
      });
    }
    // Les étapes (pastilles de a4, sauts) et les jours de contact (x3b réduit, en fin de frise).
    var ET = [['b60', '60′–0′', 0], ['wp', 'WP', 1], ['dryActive|2', 'actif', 2], ['dryPost|2', 'après', 3]];
    var et = document.getElementById('a1-et');
    et.innerHTML = ET.map(function (e) { return '<button type="button" data-etape="' + e[2] + '" data-saut="' + e[0] + '" aria-label="Moment : ' + e[1] + '"><span>' + e[1] + '</span><b></b></button>'; }).join('');
    et.querySelectorAll('button').forEach(function (b, n) { b.querySelector('b').textContent = S.fmt(D[S.idx(ET[n][0])], 'floral'); b.addEventListener('click', function () { var p = D[cur()]; if (seg(p) === +b.dataset.etape) return; poser(S.idx(b.dataset.saut.indexOf('dry') === 0 && jours(p) ? b.dataset.saut.split('|')[0] + '|' + jours(p) : b.dataset.saut)); }); });
    var JR = [1, 2, 3, 7], jr = document.getElementById('a1-jr');
    jr.innerHTML = JR.map(function (j) { return '<button type="button" data-jour="' + j + '" aria-pressed="false">' + j + ' j</button>'; }).join('');
    jr.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { var p = D[cur()]; if (seg(p) < 2) return; poser(S.idx(p.id.split('|')[0] + '|' + b.dataset.jour)); }); });
    // Le dock-profil : une case par moment, sa hauteur de floral, trait orangé si trop amer.
    var prof = document.getElementById('a1-prof'), h = '';
    for (k = 0; k <= N; k++) h += '<i class="' + (D[k].interp ? 'a1-ip' : '') + (S.ibu(D[k]).h ? ' a1-amer' : '') + '" style="left:' + x(k) + '%;--cw:' + (seg(D[k]) === 0 ? 2.9 : 4.2) + '%"><b style="height:' + Math.max(6, D[k].v.floral / 25 * 100).toFixed(0) + '%"></b></i>';
    prof.innerHTML = h;
    var majPhase = function (p) { et.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-current', String(+b.dataset.etape === seg(p))); }); };
    function majJours(p) {
      var s = seg(p), dj = jours(p);
      jr.querySelectorAll('button').forEach(function (b) {
        var j = +b.dataset.jour, on = s >= 2;
        b.setAttribute('aria-disabled', String(!on)); b.setAttribute('aria-pressed', String(on && j === dj));
        var q = on ? D[S.idx(p.id.split('|')[0] + '|' + j)] : null, pr = on && j > 1 ? D[S.idx(p.id.split('|')[0] + '|' + JR[JR.indexOf(j) - 1])] : null;
        b.classList.toggle('a1-sg', !!(q && pr && Math.abs(q.v.floral - pr.v.floral) < 0.1));
      });
    }
    function cur() { return +rail.getAttribute('aria-valuenow'); }
    function graduations(i) {
      rail.querySelectorAll('.a1-cran').forEach(function (c) { c.remove(); }); loupe.innerHTML = '';
      prof.querySelectorAll('i').forEach(function (c, k) { c.classList.toggle('a1-ici', k === i); });
      if (!geste.classList.contains('a1-touche')) return;
      for (var k = 0; k <= N; k++) if (seg(D[k]) === seg(D[i])) { var c = document.createElement('i'); c.className = 'a1-cran'; c.style.left = x(k) + '%'; rail.insertBefore(c, rail.firstChild); }
      var wl = loupe.clientWidth;
      for (k = i - 2; k <= i + 2; k++) { if (k < 0 || k > N) continue; var s = document.createElement('span'); s.textContent = D[k].court === 'wp' ? 'WP' : D[k].court; if (k === i) s.className = 'a1-l-ici'; s.style.left = (wl / 2 + (k - i) * 64) + 'px'; loupe.appendChild(s); }
    }
    var court = function (p) { return p.court === 'wp' ? 'WP' : p.id.indexOf('dry') === 0 ? p.lib.split(' · ')[1] : p.court; };
    function mesure(p) {
      var m = document.getElementById('a1-mes'), s = seg(p);
      m.classList.toggle('a1-jamais', s < 2);
      if (s === 2) m.innerHTML = S.pi('floral', 14) + '<span><b>mesuré</b> linalol <span data-nature="mesure" data-source="E03 McCabe 2023">38 µg/L</span> (McCabe 2023)</span>';
      else if (s === 3) m.innerHTML = '<span><b>mesuré</b> 1 h ≈ <span data-nature="mesure" data-source="E10 Titus 2021">96 h</span> au nez (Titus 2021)</span>';
      else m.innerHTML = '<span>jamais mesuré à ce moment</span>';
    }
    function levure(p) {
      var dd = X.POMONA[p.id] || null, best2 = null;
      if (dd) for (var f in dd) if (!best2 || Math.abs(dd[f]) > Math.abs(dd[best2])) best2 = f;
      document.getElementById('a1-lev-t').textContent = dd && Math.abs(dd[best2]) >= 0.5 ? 'Pomona ~+' + Math.round(dd[best2]) + ' ' + S.NOM[best2].toLowerCase() : 'rien ne change ici';
    }
    function poser(i) {
      var p = D[i], b = S.ibu(p); rail.setAttribute('aria-valuenow', i); rail.setAttribute('aria-valuetext', p.lib);
      var px = x(i); document.querySelector('.a1-pouce').style.left = px + '%';
      var pl = document.querySelector('.a1-pl'); pl.style.transform = px < 12 ? 'translateX(-14px)' : px > 88 ? 'translateX(calc(-100% + 14px))' : '';
      document.getElementById('a1-pl').textContent = court(p);
      barres(p); majPhase(p); majJours(p); mesure(p); levure(p);
      document.getElementById('a1-fl').textContent = S.fmt(p, 'floral');
      var av = document.getElementById('a1-amv'); av.textContent = b.cru ? '60 IBU tenue' : b.t.replace(' IBU', '') + ' IBU ' + b.s; av.classList.toggle('a1-hs', b.h);
      var ja = document.querySelector('.a1-ja'); ja.style.width = (Math.min(170, b.n) - 60) / 170 * 100 + '%'; ja.classList.toggle('a1-hs', b.h); ja.classList.toggle('a1-ip', !!b.ip);
      var cru = document.querySelector('.a1-cru'); cru.hidden = !b.cru; cru.style.left = '35.3%'; cru.style.width = '8%';
      var mx = document.getElementById('a1-mieux'); mx.hidden = i === best; document.getElementById('a1-mieux-m').textContent = D[best].lib;
      graduations(i);
    }
    function depuis(e) { var r = rail.getBoundingClientRect(), pct = (e.clientX - r.left) / r.width * 100, bi = 0, bd = 1e9; for (var k = 0; k <= N; k++) { var d = Math.abs(x(k) - pct); if (d < bd) { bd = d; bi = k; } } if (bi !== cur()) poser(bi); }
    rail.addEventListener('pointerdown', function (e) { rail.setPointerCapture(e.pointerId); geste.classList.add('a1-touche'); depuis(e); graduations(cur()); });
    rail.addEventListener('pointermove', function (e) { if (geste.classList.contains('a1-touche')) depuis(e); });
    var fin = function () { geste.classList.remove('a1-touche'); graduations(cur()); };
    rail.addEventListener('pointerup', fin); rail.addEventListener('pointercancel', fin);
    rail.addEventListener('keydown', function (e) { var i = cur(); if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); poser(Math.min(N, i + 1)); } if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); poser(Math.max(0, i - 1)); } if (e.key === 'Home') poser(0); if (e.key === 'End') poser(N); });
    S.surLecture(function () { barres(D[cur()]); });
    var dk = document.getElementById('a1-dock'), haut = function () { document.body.style.setProperty('--dock', dk.offsetHeight + 'px'); };
    haut(); addEventListener('resize', haut);
    var q = location.search.match(/moment=([^&]+)/);
    poser(q && S.idx(decodeURIComponent(q[1])) >= 0 ? S.idx(decodeURIComponent(q[1])) : best);
    if (/touche=1/.test(location.search)) { geste.classList.add('a1-touche'); graduations(cur()); }
  },
};
