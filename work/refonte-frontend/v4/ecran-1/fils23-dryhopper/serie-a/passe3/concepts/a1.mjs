// a1 · passe 3 · « Le rail sous le pouce », sans vide (froide). Base : la passe 2 (inchangée dans ../passe2).
// Le vide se remplit d'idées, pas de texte :
//   - un ruban par famille sous chaque barre : la famille à chacun des 24 moments, alignés sur le rail (greffe
//     des mini-rubans de d8 et du dock-profil de e1) ; la case du moment est cerclée ;
//   - l'amertume devient une ligne de la figure, avec son ruban d'IBU orangé là où c'est trop amer (table d'IBU
//     de b4, barre orangée) ;
//   - la loupe porte des mini-barres chiffrées (e5) ;
//   - la ligne du doigt rangée contre ★ (b4) quand on s'écarte du meilleur ;
//   - la courbe d'activité de la levure sur le dock-profil (f5, g6) ;
//   - les pastilles d'étape soulignées en orangé quand l'étape est trop amère ;
//   - le certificat du lot dans la fiche (d5, b4).
// Classes préfixées par composant (L26) : a1rep-, a1fig-, a1bas-, a1dock-, a1et-, a1jr-, a1prof-, a1rail-, a1loupe-.
import { OUTIL } from '../socle.mjs';

const CHEV = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';

export default {
  id: 'a1', nom: 'Le rail sous le pouce, passe 3', chaleur: 'froide', levure: 'propre',
  titre: 'Quand ajouter Idaho 7 ?',
  legende: [
    'Glisse le pouce sur le rail, de 60′ à après 7 j, par 5′ ; la loupe chiffre le floral des moments voisins.',
    'Sous chaque barre, son ruban : la famille à chaque moment du rail, cerclé là où tu es ; trait orangé : hors du style.',
    'Barre : ta stout avec Idaho 7 ; rond : avant ; contour : ce que la chaleur ou le CO₂ emporte, face au dry hop après fermentation.',
    '« par floral » et ★ : le meilleur moment pour ta demande du 18.10, plus floral, moins résineux, amertume 50–70 IBU.',
    'Trait fin sur les cases du dock : activité de la levure, fin vers J+5 (à confirmer à la densité). Jours pâles : sans gain.',
    'Mesuré : linalol avec Idaho 7 dès le levurage (McCabe 2023). ~ simulé · ≈ interpolé · ? inconnu, hachuré.',
  ],
  css: `
body.a1 { padding-bottom:var(--dock,128px); }
.a1 .s-ecran { min-height:calc(100svh - var(--dock,128px)); gap:5px; padding-bottom:6px; }
.a1rep { display:flex; flex-wrap:wrap; align-items:center; gap:2px 8px; font-size:16px; }
.a1rep-face { font-weight:600; }
.a1rep-fl { display:inline-flex; align-items:center; gap:4px; color:#9840bc; font-weight:700; }
.a1rep-par { margin-left:auto; display:inline-flex; align-items:center; gap:4px; height:24px; padding:0 9px; border-radius:12px; background:#fff; border:1px solid #d5d8df; font-size:13px; color:var(--gris); }
.a1rep-par b { color:#9840bc; font-weight:600; }
.a1rep-contre { flex-basis:100%; font-size:13px; color:var(--gris); }
.a1rep-contre b { color:var(--encre); }
.a1rep-contre .a1rep-moins { color:var(--acc); font-weight:600; }
.a1fig { flex:1; justify-content:space-between; gap:0; padding:6px 10px; }
.a1fig-ba { display:grid; grid-template-columns:92px 1fr 42px; align-items:center; gap:2px 6px; font-size:14px; padding:2px 0; }
.a1fig-n { display:flex; align-items:center; gap:4px; white-space:nowrap; grid-row:span 2; }
.a1fig-n.a1fig-att { font-weight:700; }
.a1fig-v { text-align:right; font-size:13px; font-family:var(--mono); grid-row:span 2; white-space:nowrap; }
.a1fig-p { position:relative; height:18px; background:#f1f2f5; border-radius:2px; overflow:hidden; }
.a1fig-p i { position:absolute; top:0; bottom:0; left:0; display:block; }
.a1fig-p .a1fig-pz { width:var(--ws); background:#d9dce3; }
.a1fig-p .a1fig-q { left:var(--qs); width:var(--qw); top:3px; height:12px; border:1.5px solid var(--c); border-left:0; border-radius:0 2px 2px 0; background:#fff; }
.a1fig-p .a1fig-b { width:var(--ws); top:3px; height:12px; border-radius:2px; transition:width .18s cubic-bezier(.2,.8,.2,1); }
.a1fig-ip .a1fig-p .a1fig-b { opacity:.5; }
.a1fig-p .a1fig-av { left:clamp(8px, var(--ws), calc(100% - 8px)); width:16px; height:16px; top:1px; border-radius:50%; border:2px solid var(--encre); background:#fff; margin-left:-7px; }
.a1fig-p .a1fig-h, .a1fig-rb .a1fig-h { right:0; background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }
body.abs .a1fig-p .a1fig-pz, body.abs .a1fig-p .a1fig-b { width:var(--wa); }
body.abs .a1fig-p .a1fig-q { left:var(--qa); width:var(--qwa); }
body.abs .a1fig-p .a1fig-av { left:clamp(7px, var(--wa), calc(100% - 7px)); }
.a1fig-rb { position:relative; height:15px; }
.a1fig-rb i { position:absolute; top:0; bottom:0; width:var(--cw); margin-left:calc(var(--cw) / -2); border-radius:2px; display:block; }
.a1fig-rb i.a1fig-hs { box-shadow:inset 0 -2px 0 var(--acc); }
.a1fig-rb i.a1fig-ici { outline:1.5px solid var(--encre); outline-offset:0; z-index:1; }
.a1fig-rb .a1fig-h { left:0; width:auto; margin:0; }
.a1fig-am .a1fig-p .a1fig-jz { left:29.4%; width:11.8%; background:#d9dce3; }
.a1fig-am .a1fig-p .a1fig-jb { left:0; width:35.3%; top:3px; height:12px; background:#8a8f9c; border-radius:2px; }
.a1fig-am .a1fig-p .a1fig-ja { left:35.3%; top:3px; height:12px; background:var(--encre); border-radius:2px; transition:width .18s; }
.a1fig-am .a1fig-p .a1fig-ja.a1fig-trop { background:var(--acc); }
.a1fig-am .a1fig-p .a1fig-ja.a1fig-ipb { opacity:.55; }
.a1fig-am .a1fig-p .a1fig-cru { left:35.3%; width:8%; top:3px; height:12px; background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }
.a1fig-am .a1fig-v.a1fig-trop { color:var(--acc); }
.a1fig-repli { display:flex; align-items:center; gap:6px; height:22px; color:var(--gris); align-self:flex-start; }
.a1fig-repli svg.a1fig-ch { transition:transform .15s; }
.a1fig-repli[aria-expanded="true"] svg.a1fig-ch { transform:rotate(90deg); }
.a1bas { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.a1bas-mes { display:flex; align-items:center; gap:5px; font-size:12px; color:var(--gris); min-width:0; }
.a1bas-mes b { color:var(--encre); font-weight:600; }
.a1bas-mes.a1bas-jamais { padding:1px 6px; border-radius:4px; background:#e2e5eb; }
.a1bas-lev a { display:inline-flex; align-items:center; gap:5px; height:30px; padding:0 12px; border-radius:15px; background:#fff; border:1px solid #c9cad2; font-size:13px; white-space:nowrap; }
.a1bas-lev a b { font-weight:700; }
.a1dock { position:fixed; left:50%; bottom:0; transform:translateX(-50%); width:min(390px,100%); background:#fff; border-top:1px solid var(--trait); box-shadow:0 -12px 40px -16px rgba(22,22,26,.35); padding:6px 12px 8px; z-index:20; }
.a1dock-haut { display:grid; grid-template-columns:1fr 84px; gap:6px; align-items:stretch; }
.a1et { display:grid; grid-template-columns:repeat(4,1fr); gap:3px; }
.a1et button { position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:1px 0 3px; border-radius:4px; background:#f1f2f5; font-size:12px; color:var(--gris); line-height:1.15; overflow:hidden; }
.a1et button b { font:600 12px var(--mono); color:#9840bc; }
.a1et button.a1et-amer::after { content:""; position:absolute; left:0; right:0; bottom:0; height:3px; background:var(--acc); }
.a1et button[aria-current="true"] { background:var(--encre); color:#fff; }
.a1et button[aria-current="true"] b { color:#ead7f3; }
.a1jr { display:grid; grid-template-columns:1fr 1fr; gap:3px; }
.a1jr button { border-radius:4px; background:#f1f2f5; font:600 12px var(--sans); color:var(--encre); }
.a1jr button.a1jr-sg { background:#f7f8fa; color:var(--gris); font-weight:400; border:1px dashed #c9cdd6; }
.a1jr button[aria-pressed="true"] { background:var(--encre); color:#fff; font-weight:700; border:0; }
.a1jr button[aria-disabled="true"] { opacity:.45; }
.a1rail-geste { position:relative; touch-action:none; margin-top:4px; }
.a1prof { position:relative; height:30px; }
.a1prof i { position:absolute; bottom:0; width:var(--cw); margin-left:calc(var(--cw) / -2); background:#f1f2f5; border-radius:2px 2px 0 0; height:100%; }
.a1prof i b { position:absolute; left:1px; right:1px; bottom:0; background:#bf86d6; border-radius:2px 2px 0 0; }
.a1prof i.a1prof-ip b { opacity:.5; }
.a1prof i.a1prof-amer { box-shadow:inset 0 -3px 0 var(--acc); }
.a1prof i.a1prof-ici { background:#e2e5eb; }
.a1prof svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; pointer-events:none; }
.a1rail { position:relative; height:24px; cursor:pointer; }
.a1rail-z { position:absolute; top:9px; height:6px; border-radius:2px; background:#c9cdd6; }
.a1rail-z.a1rail-z1, .a1rail-z.a1rail-z3 { background:#aeb4c1; }
.a1rail-cran { position:absolute; top:5px; width:1px; height:14px; background:var(--encre); }
.a1rail-pouce { position:absolute; top:2px; width:20px; height:20px; margin-left:-10px; border-radius:50%; background:var(--encre); border:3px solid #fff; box-shadow:0 0 0 1px var(--encre); }
.a1rail-pl { position:absolute; bottom:24px; left:50%; transform:translateX(-50%); white-space:nowrap; display:inline-flex; align-items:center; gap:5px; background:var(--encre); color:#fff; font:600 13px var(--sans); padding:1px 8px; border-radius:10px; pointer-events:none; }
.a1rail-pl .s-pt { border:1.5px solid #fff; }
.a1loupe { position:absolute; left:0; right:0; top:-62px; height:56px; display:none; background:#fff; border:1px solid #c9cad2; border-radius:8px; overflow:hidden; box-shadow:0 8px 24px -12px rgba(22,22,26,.4); }
.a1rail-geste.a1rail-touche .a1loupe { display:block; }
.a1rail-geste.a1rail-touche .a1rail-pl { visibility:hidden; }
.a1loupe span { position:absolute; top:4px; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; gap:2px; font:600 13px var(--mono); color:var(--gris); }
.a1loupe span em { font-style:normal; padding:0 5px; border-radius:4px; }
.a1loupe span.a1loupe-ici em { color:#fff; background:var(--encre); }
.a1loupe span i { display:block; width:34px; height:6px; background:#f1f2f5; border-radius:2px; position:relative; overflow:hidden; }
.a1loupe span i b { position:absolute; left:0; top:0; bottom:0; background:#bf86d6; border-radius:2px; }
.a1loupe span small { font:600 12px var(--mono); color:#9840bc; }
`,
  corps: `
<div class="a1rep" aria-live="polite"><span class="a1rep-face">Face à ta stout</span><span class="a1rep-fl"><svg class="s-pi" width="18" height="18" style="width:18px;height:18px" data-famille="floral" aria-label="Floral"><use href="#p-floral"/></svg><span id="a1rep-fl" class="num">~+22</span></span>
  <span class="a1rep-par" data-role="critere">par <svg class="s-pi" width="14" height="14" style="width:14px;height:14px" data-famille="floral" aria-label="Floral"><use href="#p-floral"/></svg><b>floral</b></span>
  <span class="a1rep-contre" id="a1rep-contre" hidden></span></div>
<section class="s-bloc a1fig" id="a1fig" aria-label="Familles d'arômes au style, et leur ruban le long du brassin"></section>
<div class="a1bas">
  <p class="a1bas-mes" id="a1bas-mes" data-acquis="valeurs"></p>
  <nav class="a1bas-lev" aria-label="Pont vers Levure" data-acquis="levure" data-forme="pont"><a href="${OUTIL}"><b>Levure</b><span id="a1bas-lev-t">Pomona ~+13 agrumes</span>${CHEV}</a></nav>
</div>
<div class="a1dock" id="a1dock" data-libre="moment" data-acquis="frise">
  <div class="a1dock-haut">
    <div class="a1et" id="a1et"></div>
    <div class="a1jr" id="a1jr" data-jours role="group" aria-label="Jours de contact"></div>
  </div>
  <div class="a1rail-geste" id="a1rail-geste" data-acquis="geste">
    <div class="a1loupe" aria-hidden="true"></div>
    <div class="a1prof" id="a1prof" aria-hidden="true"></div>
    <div class="a1rail" role="slider" tabindex="0" data-pas="5" aria-label="Moment de l'ajout" aria-valuemin="0" aria-valuemax="23" aria-valuenow="15" aria-valuetext="actif · 2 j">
      <span class="a1rail-z a1rail-z0" style="left:0;width:44%"></span><span class="a1rail-z a1rail-z1" style="left:44%;width:8%"></span><span class="a1rail-z a1rail-z2" style="left:52%;width:24%"></span><span class="a1rail-z a1rail-z3" style="left:76%;width:24%"></span>
      <span class="a1rail-pouce" data-couleur="#e80030" data-serie="Idaho 7"><span class="a1rail-pl"><i class="s-pt"></i><span id="a1rail-pl">2 j</span></span></span>
    </div>
  </div>
</div>`,
  script: function () {
    var S = window.S, D = S.D, N = S.N, X = window.S_DATA, SEG = [[0, 44], [44, 52], [52, 76], [76, 100]];
    var seg = function (p) { return p.id.charAt(0) === 'b' ? 0 : p.id === 'wp' ? 1 : p.id.indexOf('dryActive') === 0 ? 2 : 3; };
    var jours = function (p) { return +(p.id.split('|')[1] || 0); };
    var geste = document.getElementById('a1rail-geste'), rail = geste.querySelector('.a1rail'), loupe = geste.querySelector('.a1loupe');
    function x(i) { var s = seg(D[i]), idx = []; for (var k = 0; k <= N; k++) if (seg(D[k]) === s) idx.push(k); var n = idx.length, a = SEG[s][0], b = SEG[s][1]; return n === 1 ? (a + b) / 2 : a + (b - a) * (0.06 + 0.88 * idx.indexOf(i) / (n - 1)); }
    // Largeur d'une case : 85 % de l'écart au voisin le plus proche (aucun chevauchement entre deux étapes).
    var cw = function (k) { var g = 1e9; if (k > 0) g = Math.min(g, x(k) - x(k - 1)); if (k < N) g = Math.min(g, x(k + 1) - x(k)); return Math.min(4.2, g * 0.85).toFixed(2); };
    // Le meilleur pour sa demande : floral gagné moins résineux gagné, amertume dans 50–70 ; à 0,05 près, le plus tôt.
    var score = function (p) { return S.d(p, 'floral') - S.d(p, 'resin'); }, best = -1;
    for (var k = 0; k <= N; k++) { if (S.ibu(D[k]).n > 70) continue; if (best < 0 || score(D[k]) > score(D[best]) + 0.05) best = k; }
    // La figure : 9 familles, puis l'amertume, chacune avec son ruban le long du brassin ; Pépins, Melon, Épicé repliés.
    var VUES = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'berries', 'resin', 'green'], REPLI = ['pomeFruit', 'melon', 'spice'];
    var abs = function () { return document.body.classList.contains('abs'); };
    var w = function (v, f, m) { return (m === 's' ? Math.min(100, v / S.B[f] / 2 * 100) : Math.min(100, v / 110 * 100)); };
    var cases = function () { var h = ''; for (var k = 0; k <= N; k++) h += '<i data-k="' + k + '" style="left:' + x(k) + '%;--cw:' + cw(k) + '%"></i>'; return h; };
    var ligne = function (f, cache) {
      return '<div class="a1fig-ba" data-f="' + f + '"' + (cache ? ' data-repli hidden' : '') + '><span class="a1fig-n' + ({ floral: 1, herbal: 1, earthy: 1 }[f] ? ' a1fig-att' : '') + '">' + S.pi(f) + '<span>' + S.NOM[f] + '</span></span>'
        + '<span class="a1fig-p" style="--c:' + S.BA[f] + '"><i class="a1fig-pz" data-role="zone" style="--ws:50%;--wa:' + (S.B[f] / 110 * 100).toFixed(1) + '%"></i><i class="a1fig-q"></i><i class="a1fig-b" style="background:' + S.BA[f] + '"></i>'
        + '<i class="a1fig-av" style="--ws:' + w(S.AV[f], f, 's').toFixed(1) + '%;--wa:' + w(S.AV[f], f, 'a').toFixed(1) + '%"></i><i class="a1fig-h"></i></span><span class="a1fig-v"></span>'
        + '<span class="a1fig-rb" aria-hidden="true">' + cases() + '</span></div>';
    };
    var fig = document.getElementById('a1fig');
    fig.innerHTML = VUES.map(function (f) { return ligne(f); }).join('')
      + '<div class="a1fig-ba a1fig-am" data-amer><span class="a1fig-n">Amertume</span><span class="a1fig-p"><i class="a1fig-jz"></i><i class="a1fig-jb"></i><i class="a1fig-ja"></i><i class="a1fig-cru" hidden></i></span><span class="a1fig-v" id="a1fig-amv"></span><span class="a1fig-rb" aria-hidden="true">' + cases() + '</span></div>'
      + '<button type="button" class="a1fig-repli" id="a1fig-repli" aria-expanded="false" aria-controls="a1fig" aria-label="Montrer Pépins, Melon, Épicé">' + REPLI.map(function (f) { return S.pi(f, 14); }).join('') + '<svg class="a1fig-ch" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button>'
      + REPLI.map(function (f) { return ligne(f, true); }).join('');
    document.getElementById('a1fig-repli').addEventListener('click', function () { var o = this.getAttribute('aria-expanded') !== 'true'; this.setAttribute('aria-expanded', String(o)); fig.querySelectorAll('[data-repli]').forEach(function (r) { r.hidden = !o; }); });
    // Les rubans : chaque famille (et l'amertume) à chaque moment ; hachuré si inconnu, trait orangé hors du style.
    function rubans() {
      fig.querySelectorAll('[data-f]').forEach(function (r) {
        var f = r.dataset.f;
        r.querySelectorAll('.a1fig-rb i').forEach(function (c) {
          var p = D[+c.dataset.k], u = S.inc(p, f);
          if (u) { c.style.background = 'repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px)'; c.style.opacity = 1; return; }
          var t = Math.min(1, abs() ? p.v[f] / 110 : p.v[f] / S.B[f] / 2);
          c.style.background = S.BA[f]; c.style.opacity = (0.35 + 0.65 * t) * (p.interp ? 0.75 : 1); c.classList.toggle('a1fig-hs', S.hors(p, f));
        });
      });
      fig.querySelectorAll('[data-amer] .a1fig-rb i').forEach(function (c) { var b = S.ibu(D[+c.dataset.k]); c.style.background = b.h ? '#c2410c' : '#8a8f9c'; c.style.opacity = Math.max(0.15, Math.min(1, (b.n - 40) / 130)); });
    }
    // Ce que la chaleur ou le CO₂ emporte : l'écart avec le dry hop après fermentation, mêmes jours (en contour).
    var refDe = function (p) { if (seg(p) === 3) return null; return D[S.idx('dryPost|' + (jours(p) || 2))]; };
    function barres(i) {
      var p = D[i], r0 = refDe(p);
      fig.querySelectorAll('[data-f]').forEach(function (r) {
        var f = r.dataset.f, u = S.inc(p, f), b = r.querySelector('.a1fig-b'), q = r.querySelector('.a1fig-q'), v = r.querySelector('.a1fig-v');
        r.classList.toggle('a1fig-ip', !!p.interp); b.hidden = u; r.querySelector('.a1fig-p .a1fig-h').hidden = !u; q.hidden = true;
        if (!u) {
          b.style.setProperty('--ws', w(p.v[f], f, 's') + '%'); b.style.setProperty('--wa', w(p.v[f], f, 'a') + '%');
          if (r0 && !S.inc(r0, f) && r0.v[f] - p.v[f] >= 0.5) {
            var s0 = w(p.v[f], f, 's'), s1 = w(r0.v[f], f, 's'), a0 = w(p.v[f], f, 'a'), a1 = w(r0.v[f], f, 'a');
            if (s1 - s0 > 0.5) { q.hidden = false; q.style.setProperty('--qs', s0 + '%'); q.style.setProperty('--qw', (s1 - s0) + '%'); q.style.setProperty('--qa', a0 + '%'); q.style.setProperty('--qwa', (a1 - a0) + '%'); }
          }
        }
        v.textContent = S.fmt(p, f); v.style.color = u ? '#55555f' : (S.hors(p, f) ? '#c2410c' : S.T[f]);
      });
      fig.querySelectorAll('.a1fig-rb i').forEach(function (c) { c.classList.toggle('a1fig-ici', +c.dataset.k === i); });
      var bb = S.ibu(p), ja = fig.querySelector('.a1fig-ja'), av = document.getElementById('a1fig-amv');
      ja.style.width = (Math.min(170, bb.n) - 60) / 170 * 100 + '%'; ja.classList.toggle('a1fig-trop', bb.h); ja.classList.toggle('a1fig-ipb', !!bb.ip);
      fig.querySelector('.a1fig-cru').hidden = !bb.cru;
      av.textContent = bb.cru ? '60+?' : bb.t.replace(' IBU', ''); av.classList.toggle('a1fig-trop', bb.h);
    }
    // Les étapes (pastilles, soulignées en orangé si trop amères) et les jours de contact, en fin de frise.
    var ET = [['b60', '60′–0′', 0], ['wp', 'WP', 1], ['dryActive|2', 'actif', 2], ['dryPost|2', 'après', 3]];
    var et = document.getElementById('a1et');
    et.innerHTML = ET.map(function (e) { return '<button type="button" data-etape="' + e[2] + '" data-saut="' + e[0] + '" aria-label="Moment : ' + e[1] + '"' + (S.ibu(D[S.idx(e[0])]).h ? ' class="a1et-amer"' : '') + '><span>' + e[1] + '</span><b></b></button>'; }).join('');
    et.querySelectorAll('button').forEach(function (b, n) { b.querySelector('b').textContent = S.fmt(D[S.idx(ET[n][0])], 'floral'); b.addEventListener('click', function () { var p = D[cur()]; if (seg(p) === +b.dataset.etape) return; poser(S.idx(b.dataset.saut.indexOf('dry') === 0 && jours(p) ? b.dataset.saut.split('|')[0] + '|' + jours(p) : b.dataset.saut)); }); });
    var JR = [1, 2, 3, 7], jr = document.getElementById('a1jr');
    jr.innerHTML = JR.map(function (j) { return '<button type="button" data-jour="' + j + '" aria-pressed="false">' + j + ' j</button>'; }).join('');
    jr.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { var p = D[cur()]; if (seg(p) < 2) return; poser(S.idx(p.id.split('|')[0] + '|' + b.dataset.jour)); }); });
    // Le dock-profil : une case par moment (floral), trait orangé si trop amer ; la courbe d'activité de la levure.
    var prof = document.getElementById('a1prof'), h = '';
    for (k = 0; k <= N; k++) h += '<i class="' + (D[k].interp ? 'a1prof-ip' : '') + (S.ibu(D[k]).h ? ' a1prof-amer' : '') + '" style="left:' + x(k) + '%;--cw:' + cw(k) + '%"><b style="height:' + Math.max(6, D[k].v.floral / 25 * 100).toFixed(0) + '%"></b></i>';
    h += '<svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><path d="M52 29 C55 29 56 4 60 4 S70 6 73 22 S76 29 77 29 L100 29" fill="none" stroke="#16161a" stroke-width="1.4" stroke-opacity=".7" vector-effect="non-scaling-stroke"/></svg>';
    prof.innerHTML = h;
    var majPhase = function (p) { et.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-current', String(+b.dataset.etape === seg(p))); }); };
    function majJours(p) {
      var s = seg(p), dj = jours(p);
      jr.querySelectorAll('button').forEach(function (b) {
        var j = +b.dataset.jour, on = s >= 2;
        b.setAttribute('aria-disabled', String(!on)); b.setAttribute('aria-pressed', String(on && j === dj));
        var q = on ? D[S.idx(p.id.split('|')[0] + '|' + j)] : null, pr = on && j > 1 ? D[S.idx(p.id.split('|')[0] + '|' + JR[JR.indexOf(j) - 1])] : null;
        b.classList.toggle('a1jr-sg', !!(q && pr && Math.abs(q.v.floral - pr.v.floral) < 0.1));
      });
    }
    function cur() { return +rail.getAttribute('aria-valuenow'); }
    function graduations(i) {
      rail.querySelectorAll('.a1rail-cran').forEach(function (c) { c.remove(); }); loupe.innerHTML = '';
      prof.querySelectorAll('i').forEach(function (c, k) { c.classList.toggle('a1prof-ici', k === i); });
      if (!geste.classList.contains('a1rail-touche')) return;
      for (var k = 0; k <= N; k++) if (seg(D[k]) === seg(D[i])) { var c = document.createElement('i'); c.className = 'a1rail-cran'; c.style.left = x(k) + '%'; rail.insertBefore(c, rail.firstChild); }
      var wl = loupe.clientWidth;
      for (k = i - 2; k <= i + 2; k++) {
        if (k < 0 || k > N) continue; var p = D[k], s = document.createElement('span');
        s.innerHTML = '<em>' + (p.court === 'wp' ? 'WP' : p.court) + '</em><i><b style="width:' + Math.min(100, p.v.floral / 25 * 100).toFixed(0) + '%"></b></i><small>' + S.fmt(p, 'floral') + '</small>';
        if (k === i) s.className = 'a1loupe-ici'; s.style.left = (wl / 2 + (k - i) * 66) + 'px'; loupe.appendChild(s);
      }
    }
    var court = function (p) { return p.court === 'wp' ? 'WP' : p.id.indexOf('dry') === 0 ? p.lib.split(' · ')[1] : p.court; };
    function mesure(p) {
      var m = document.getElementById('a1bas-mes'), s = seg(p);
      m.classList.toggle('a1bas-jamais', s < 2);
      if (s === 2) m.innerHTML = S.pi('floral', 14) + '<span><b>mesuré</b> linalol <span data-nature="mesure" data-source="E03 McCabe 2023">38 µg/L</span> (McCabe 2023)</span>';
      else if (s === 3) m.innerHTML = '<span><b>mesuré</b> 1 h ≈ <span data-nature="mesure" data-source="E10 Titus 2021">96 h</span> au nez (Titus 2021)</span>';
      else m.innerHTML = '<span>jamais mesuré à ce moment</span>';
    }
    function levure(p) {
      var dd = X.POMONA[p.id] || null, f2 = null;
      if (dd) for (var f in dd) if (!f2 || Math.abs(dd[f]) > Math.abs(dd[f2])) f2 = f;
      document.getElementById('a1bas-lev-t').textContent = dd && Math.abs(dd[f2]) >= 0.5 ? 'Pomona ~+' + Math.round(dd[f2]) + ' ' + S.NOM[f2].toLowerCase() : 'rien ne change ici';
    }
    // La ligne du doigt rangée contre ★ : ce que le moment coûte face au meilleur.
    function contre(i) {
      var c = document.getElementById('a1rep-contre'); if (i === best) { c.hidden = true; return; }
      var p = D[i], q = D[best], sg = p.interp ? '≈' : '~', df = Math.round(p.v.floral - q.v.floral), dr = Math.round(p.v.resin - q.v.resin);
      var fmt = function (n) { return sg + (n >= 0 ? '+' : '−') + Math.abs(n); };
      c.hidden = false; c.innerHTML = 'contre ★ <b>' + q.lib + '</b> : floral ' + fmt(df) + ' · résineux ' + fmt(dr) + (S.ibu(p).h ? ' · <span class="a1rep-moins">trop amer</span>' : '');
    }
    function poser(i) {
      var p = D[i]; rail.setAttribute('aria-valuenow', i); rail.setAttribute('aria-valuetext', p.lib);
      var px = x(i); document.querySelector('.a1rail-pouce').style.left = px + '%';
      var pl = document.querySelector('.a1rail-pl'); pl.style.transform = px < 12 ? 'translateX(-14px)' : px > 88 ? 'translateX(calc(-100% + 14px))' : '';
      document.getElementById('a1rail-pl').textContent = court(p);
      barres(i); majPhase(p); majJours(p); mesure(p); levure(p); contre(i);
      document.getElementById('a1rep-fl').textContent = S.fmt(p, 'floral');
      graduations(i);
    }
    function depuis(e) { var r = rail.getBoundingClientRect(), pct = (e.clientX - r.left) / r.width * 100, bi = 0, bd = 1e9; for (var k = 0; k <= N; k++) { var d = Math.abs(x(k) - pct); if (d < bd) { bd = d; bi = k; } } if (bi !== cur()) poser(bi); }
    rail.addEventListener('pointerdown', function (e) { rail.setPointerCapture(e.pointerId); geste.classList.add('a1rail-touche'); depuis(e); graduations(cur()); });
    rail.addEventListener('pointermove', function (e) { if (geste.classList.contains('a1rail-touche')) depuis(e); });
    var fin = function () { geste.classList.remove('a1rail-touche'); graduations(cur()); };
    rail.addEventListener('pointerup', fin); rail.addEventListener('pointercancel', fin);
    rail.addEventListener('keydown', function (e) { var i = cur(); if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); poser(Math.min(N, i + 1)); } if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); poser(Math.max(0, i - 1)); } if (e.key === 'Home') poser(0); if (e.key === 'End') poser(N); });
    S.surLecture(function () { barres(cur()); rubans(); });
    var dk = document.getElementById('a1dock'), haut = function () { document.body.style.setProperty('--dock', dk.offsetHeight + 'px'); };
    haut(); addEventListener('resize', haut);
    rubans();
    var q = location.search.match(/moment=([^&]+)/);
    poser(q && S.idx(decodeURIComponent(q[1])) >= 0 ? S.idx(decodeURIComponent(q[1])) : best);
    if (/touche=1/.test(location.search)) { geste.classList.add('a1rail-touche'); graduations(cur()); }
  },
};
