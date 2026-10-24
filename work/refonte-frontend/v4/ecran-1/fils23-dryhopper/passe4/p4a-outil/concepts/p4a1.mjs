// p4a1 · froide · a1 tel quel, avec trois améliorations du brief de la passe 4 :
//   4. l'inconnu n'est jamais zéro : Noyau et Baies (ma bière avant non décrite) n'ont plus de rond « avant » ni de
//      barre pleine ; la barre est hachurée de leur couleur (le niveau avec Idaho 7), l'écart est « ? » ;
//   5. la durée de contact devient la suite du moment : plus de boutons de jours ; les jours sont les crans du rail
//      dans le dry hop, et ceux qui ne gagnent plus rien sont pâles et en pointillé sur le profil ;
//   6. la lecture sans légende : un fil vertical relie le pouce aux rubans (la colonne cerclée, c'est « là où tu es ») ;
//      les étapes portent leur picto (flamme, tourbillon, bulles, cuve au repos) et leur nom en entier.
// Rien d'autre ne change d'a1 (passe 3). Classes préfixées « p4a1 » (L26).
const CHEV = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
import { ETAPE, mp, PICTO_ETAPE } from '../socle.mjs';

export default {
  id: 'p4a1', nom: 'a1, froide : inconnu, jours au rail, lecture', chaleur: 'froide', levure: 'propre',
  titre: 'Quand ajouter Idaho 7 ?',
  legende: [
    'Glisse le pouce sur le rail, de 60′ à après 7 j, par 5′ ; la loupe chiffre le floral des moments voisins.',
    'Sous chaque barre, son ruban : la famille à chaque moment du rail ; le fil noir passe là où est ton pouce.',
    'Barre : ta stout avec Idaho 7 ; rond : avant ; contour : ce que la chaleur ou le CO₂ emporte. Hachuré de couleur : avant inconnu, écart « ? ».',
    'Jours pâles en pointillé : plus de gain. ★ : le meilleur pour ta demande du 18.10.',
    'Mesuré : linalol avec Idaho 7 dès le levurage (McCabe 2023). ~ simulé · ≈ interpolé · ? inconnu.',
  ],
  css: `
body.p4a1 { padding-bottom:var(--dock,118px); }
.p4a1 .s-ecran { min-height:calc(100svh - var(--dock,118px)); gap:5px; padding-bottom:6px; }
.p4a1rep { display:flex; flex-wrap:wrap; align-items:center; gap:2px 8px; font-size:16px; }
.p4a1rep-face { font-weight:600; }
.p4a1rep-fl { display:inline-flex; align-items:center; gap:4px; color:#9840bc; font-weight:700; }
.p4a1rep-par { margin-left:auto; display:inline-flex; align-items:center; gap:4px; height:24px; padding:0 9px; border-radius:12px; background:#fff; border:1px solid #d4d4d4; font-size:13px; color:var(--gris); }
.p4a1rep-par b { color:#9840bc; font-weight:600; }
.p4a1rep-contre { flex-basis:100%; font-size:13px; color:var(--gris); }
.p4a1rep-contre b { color:var(--encre); }
.p4a1rep-contre .p4a1rep-moins { color:var(--acc); font-weight:600; }
.p4a1fig { position:relative; flex:1; justify-content:space-between; gap:0; padding:6px 10px; }
.p4a1fig-ba { display:grid; grid-template-columns:88px 1fr 50px; align-items:center; gap:2px 6px; font-size:14px; padding:2px 0; }
.p4a1fig-n { display:flex; align-items:center; gap:4px; white-space:nowrap; grid-row:span 2; }
.p4a1fig-n.p4a1fig-att { font-weight:700; }
.p4a1fig-v { text-align:right; font-size:13px; font-family:var(--mono); grid-row:span 2; white-space:nowrap; }
.p4a1fig-p { position:relative; height:18px; background:var(--piste); border-radius:2px; overflow:hidden; }
.p4a1fig-p i { position:absolute; top:0; bottom:0; left:0; display:block; }
.p4a1fig-p .p4a1fig-pz { width:var(--ws); background:var(--zone); }
.p4a1fig-p .p4a1fig-q { left:var(--qs); width:var(--qw); top:3px; height:12px; border:1.5px solid var(--c); border-left:0; border-radius:0 2px 2px 0; background:#fff; }
.p4a1fig-p .p4a1fig-b { width:var(--ws); top:3px; height:12px; border-radius:2px; transition:width .18s cubic-bezier(.2,.8,.2,1); }
.p4a1fig-ip .p4a1fig-p .p4a1fig-b { opacity:.5; }
.p4a1fig-p .p4a1fig-av { left:clamp(8px, var(--ws), calc(100% - 8px)); width:16px; height:16px; top:1px; border-radius:50%; border:2px solid var(--encre); background:#fff; margin-left:-7px; }
.p4a1fig-p .p4a1fig-h { right:0; background:repeating-linear-gradient(135deg,#c4c4c4 0 2px,transparent 2px 6px); }
body.abs .p4a1fig-p .p4a1fig-pz, body.abs .p4a1fig-p .p4a1fig-b { width:var(--wa); }
body.abs .p4a1fig-p .p4a1fig-q { left:var(--qa); width:var(--qwa); }
body.abs .p4a1fig-p .p4a1fig-av { left:clamp(7px, var(--wa), calc(100% - 7px)); }
.p4a1fig-rb { position:relative; height:15px; }
.p4a1fig-rb i { position:absolute; top:0; bottom:0; width:var(--cw); margin-left:calc(var(--cw) / -2); border-radius:2px; display:block; }
.p4a1fig-rb i.p4a1fig-hs { box-shadow:inset 0 -2px 0 var(--acc); }
.p4a1fig-rb i.p4a1fig-ici { outline:1.5px solid var(--encre); outline-offset:0; z-index:1; }
.p4a1fig-am .p4a1fig-p .p4a1fig-jz { left:29.4%; width:11.8%; background:var(--zone); }
.p4a1fig-am .p4a1fig-p .p4a1fig-jb { left:0; width:35.3%; top:3px; height:12px; background:#8c8c8c; border-radius:2px; }
.p4a1fig-am .p4a1fig-p .p4a1fig-ja { left:35.3%; top:3px; height:12px; background:var(--encre); border-radius:2px; transition:width .18s; }
.p4a1fig-am .p4a1fig-p .p4a1fig-ja.p4a1fig-trop { background:var(--acc); }
.p4a1fig-am .p4a1fig-p .p4a1fig-ja.p4a1fig-ipb { opacity:.55; }
.p4a1fig-am .p4a1fig-p .p4a1fig-cru { left:35.3%; width:8%; top:3px; height:12px; background:repeating-linear-gradient(135deg,#c4c4c4 0 2px,transparent 2px 6px); }
.p4a1fig-am .p4a1fig-v.p4a1fig-trop { color:var(--acc); }
.p4a1fig-repli { display:flex; align-items:center; gap:6px; height:22px; color:var(--gris); align-self:flex-start; }
.p4a1fig-repli svg.p4a1fig-ch { transition:transform .15s; }
.p4a1fig-repli[aria-expanded="true"] svg.p4a1fig-ch { transform:rotate(90deg); }
.p4a1fil { position:absolute; width:2px; margin-left:-1px; background:var(--encre); border-radius:1px; pointer-events:none; z-index:0; transition:left .12s; }
.p4a1fig-p, .p4a1fig-rb { z-index:1; }
.p4a1fig-rb i.p4a1fig-ici { outline-width:2px; }
.p4a1fil::after { content:""; position:absolute; left:-4px; bottom:-5px; width:10px; height:10px; border-radius:50%; background:var(--encre); }
.p4a1bas { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.p4a1bas-mes { display:flex; align-items:center; gap:5px; font-size:12px; color:var(--gris); min-width:0; }
.p4a1bas-mes b { color:var(--encre); font-weight:600; }
.p4a1bas-mes.p4a1bas-jamais { padding:1px 6px; border-radius:4px; background:#ececec; }
.p4a1bas-lev a { display:inline-flex; align-items:center; gap:5px; height:32px; padding:0 12px; border-radius:16px; background:var(--encre); color:#fff; font-size:13px; white-space:nowrap; }
.p4a1bas-lev a b { font-weight:700; }
.p4a1bas-lev a span { color:#d4d4d4; display:inline-flex; align-items:center; gap:3px; }
.p4a1dock { position:fixed; left:50%; bottom:0; transform:translateX(-50%); width:min(390px,100%); background:#fff; border-top:1px solid var(--trait); box-shadow:0 -12px 40px -16px rgba(22,22,22,.35); padding:6px 12px 8px; z-index:20; }
.p4a1et { display:grid; grid-template-columns:repeat(4,1fr); gap:3px; }
.p4a1et button { position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2px 0 4px; border-radius:4px; background:var(--piste); font-size:12px; color:var(--gris); line-height:1.15; overflow:hidden; }
.p4a1et button span { display:inline-flex; align-items:center; gap:3px; }
.p4a1et button b { font:600 12px var(--mono); color:#9840bc; }
.p4a1et button.p4a1et-amer::after { content:""; position:absolute; left:0; right:0; bottom:0; height:3px; background:var(--acc); }
.p4a1et button[aria-current="true"] { background:var(--encre); color:#fff; }
.p4a1et button[aria-current="true"] b { color:#ead7f3; }
.p4a1geste { margin-top:4px; }
.p4a1geste .s-lp { left:0; right:0; top:-62px; height:56px; }
.p4a1prof { position:relative; height:30px; }
.p4a1prof i { position:absolute; bottom:0; width:var(--cw); margin-left:calc(var(--cw) / -2); background:var(--piste); border-radius:2px 2px 0 0; height:100%; }
.p4a1prof i b { position:absolute; left:1px; right:1px; bottom:0; background:#bf86d6; border-radius:2px 2px 0 0; }
.p4a1prof i.p4a1prof-ip b { opacity:.5; }
.p4a1prof i.p4a1prof-amer { box-shadow:inset 0 -3px 0 var(--acc); }
.p4a1prof i.p4a1prof-ici { background:#d4d4d4; }
.p4a1prof i.p4a1prof-sg { background:transparent; border:1px dashed #b4b4b4; border-bottom:0; }
.p4a1prof i.p4a1prof-sg b { opacity:.35; }
.p4a1prof svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; pointer-events:none; }
`,
  corps: `
<div class="p4a1rep" aria-live="polite"><span class="p4a1rep-face">Face à ta stout</span><span class="p4a1rep-fl"><svg class="s-pi" width="18" height="18" style="width:18px;height:18px" data-famille="floral" aria-label="Floral"><use href="#p-floral"/></svg><span id="p4a1rep-fl" class="num">~+22</span></span>
  <span class="p4a1rep-par" data-role="critere">par <svg class="s-pi" width="14" height="14" style="width:14px;height:14px" data-famille="floral" aria-label="Floral"><use href="#p-floral"/></svg><b>floral</b></span>
  <span class="p4a1rep-contre" id="p4a1rep-contre" hidden></span></div>
<section class="s-bloc p4a1fig" data-figure id="p4a1fig" aria-label="Familles d'arômes au style, et leur ruban le long du brassin"></section>
<div class="p4a1bas">
  <p class="p4a1bas-mes" id="p4a1bas-mes" data-acquis="valeurs"></p>
  <nav class="p4a1bas-lev" aria-label="Pont vers Levure" data-acquis="levure" data-forme="pont"><a href="${ETAPE}"><b>Puis la levure</b><span id="p4a1bas-lev-t">Pomona ~+13</span>${CHEV}</a></nav>
</div>
<div class="p4a1dock" id="p4a1dock" data-libre="moment" data-acquis="frise">
  <div class="p4a1et" id="p4a1et"></div>
  <div class="p4a1geste" id="p4a1geste"><div class="p4a1prof" id="p4a1prof" aria-hidden="true"></div></div>
</div>`,
  script: function () {
    var S = window.S, D = S.D, N = S.N, X = window.S_DATA, seg = S.seg, x = S.x, cw = S.cw, best = S.best, jours = S.jours;
    var PIC = ['m-feu', 'm-tourb', 'm-bulle', 'm-cuve'];
    var mp = function (id, s) { return '<svg class="s-mp" width="' + s + '" height="' + s + '" style="width:' + s + 'px;height:' + s + 'px" aria-hidden="true"><use href="#' + id + '"/></svg>'; };
    var VUES = ['floral', 'herbal', 'earthy', 'citrus', 'tropical', 'stoneFruit', 'berries', 'resin', 'green'], REPLI = ['pomeFruit', 'melon', 'spice'];
    var abs = function () { return document.body.classList.contains('abs'); };
    var w = function (v, f, m) { return (m === 's' ? Math.min(100, v / S.B[f] / 2 * 100) : Math.min(100, v / 110 * 100)); };
    var cases = function () { var h = ''; for (var k = 0; k <= N; k++) h += '<i data-k="' + k + '" style="left:' + x(k) + '%;--cw:' + cw(k) + '%"></i>'; return h; };
    var ligne = function (f, cache) {
      var ai = S.avInc(f);
      return '<div class="p4a1fig-ba" data-f="' + f + '"' + (cache ? ' data-repli hidden' : '') + (ai ? ' data-avant="inconnu"' : '') + '><span class="p4a1fig-n' + ({ floral: 1, herbal: 1, earthy: 1 }[f] ? ' p4a1fig-att' : '') + '">' + S.pi(f) + '<span>' + S.NOM[f] + '</span></span>'
        + '<span class="p4a1fig-p" style="--c:' + S.BA[f] + '"><i class="p4a1fig-pz" data-role="zone" style="--ws:50%;--wa:' + (S.B[f] / 110 * 100).toFixed(1) + '%"></i><i class="p4a1fig-q"></i><i class="p4a1fig-b' + (ai ? ' s-avinc' : '') + '" style="background:' + S.BA[f] + '"></i>'
        + (ai ? '' : '<i class="p4a1fig-av" style="--ws:' + w(S.AV[f], f, 's').toFixed(1) + '%;--wa:' + w(S.AV[f], f, 'a').toFixed(1) + '%"></i>') + '<i class="p4a1fig-h"></i></span><span class="p4a1fig-v"></span>'
        + '<span class="p4a1fig-rb" aria-hidden="true">' + cases() + '</span></div>';
    };
    var fig = document.getElementById('p4a1fig');
    fig.innerHTML = VUES.map(function (f) { return ligne(f); }).join('')
      + '<div class="p4a1fig-ba p4a1fig-am" data-amer><span class="p4a1fig-n">Amertume</span><span class="p4a1fig-p"><i class="p4a1fig-jz"></i><i class="p4a1fig-jb"></i><i class="p4a1fig-ja"></i><i class="p4a1fig-cru" hidden></i></span><span class="p4a1fig-v" id="p4a1fig-amv"></span><span class="p4a1fig-rb" aria-hidden="true">' + cases() + '</span></div>'
      + '<button type="button" class="p4a1fig-repli" id="p4a1fig-repli" aria-expanded="false" aria-controls="p4a1fig" aria-label="Montrer Pépins, Melon, Épicé">' + REPLI.map(function (f) { return S.pi(f, 14); }).join('') + '<svg class="p4a1fig-ch" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button>'
      + REPLI.map(function (f) { return ligne(f, true); }).join('') + '<i class="p4a1fil" id="p4a1fil" aria-hidden="true"></i>';
    document.getElementById('p4a1fig-repli').addEventListener('click', function () { var o = this.getAttribute('aria-expanded') !== 'true'; this.setAttribute('aria-expanded', String(o)); fig.querySelectorAll('[data-repli]').forEach(function (r) { r.hidden = !o; }); fil(); });
    function rubans() {
      fig.querySelectorAll('[data-f]').forEach(function (r) {
        var f = r.dataset.f;
        r.querySelectorAll('.p4a1fig-rb i').forEach(function (c) {
          var p = D[+c.dataset.k], u = S.inc(p, f);
          if (u) { c.style.background = 'repeating-linear-gradient(135deg,#c4c4c4 0 2px,transparent 2px 6px)'; c.style.opacity = 1; return; }
          var t = Math.min(1, abs() ? p.v[f] / 110 : p.v[f] / S.B[f] / 2);
          c.style.background = S.BA[f]; c.style.opacity = (0.35 + 0.65 * t) * (p.interp ? 0.75 : 1); c.classList.toggle('p4a1fig-hs', S.hors(p, f));
        });
      });
      fig.querySelectorAll('[data-amer] .p4a1fig-rb i').forEach(function (c) { var b = S.ibu(D[+c.dataset.k]); c.style.background = b.h ? '#c2410c' : '#8c8c8c'; c.style.opacity = Math.max(0.15, Math.min(1, (b.n - 40) / 130)); });
    }
    // Le fil : du ruban de Floral à celui de l'amertume, à la colonne du moment ; il descend vers le pouce.
    function fil() {
      var l = document.getElementById('p4a1fil'), rb = [].filter.call(fig.querySelectorAll('.p4a1fig-rb'), function (e) { return e.offsetParent; });
      if (!rb.length) return; var f0 = fig.getBoundingClientRect(), a = rb[0].getBoundingClientRect(), z = rb[rb.length - 1].getBoundingClientRect(), i = rail ? rail.cur() : best;
      l.style.left = (a.left - f0.left + a.width * x(i) / 100) + 'px'; l.style.top = (a.top - f0.top - 2) + 'px'; l.style.height = (z.bottom - a.top + 4) + 'px';
    }
    var refDe = function (p) { if (seg(p) === 3) return null; return D[S.idx('dryPost|' + (jours(p) || 2))]; };
    function barres(i) {
      var p = D[i], r0 = refDe(p);
      fig.querySelectorAll('[data-f]').forEach(function (r) {
        var f = r.dataset.f, u = S.inc(p, f), b = r.querySelector('.p4a1fig-b'), q = r.querySelector('.p4a1fig-q'), v = r.querySelector('.p4a1fig-v');
        r.classList.toggle('p4a1fig-ip', !!p.interp); b.hidden = u; r.querySelector('.p4a1fig-p .p4a1fig-h').hidden = !u; q.hidden = true;
        if (!u) {
          b.style.setProperty('--ws', w(p.v[f], f, 's') + '%'); b.style.setProperty('--wa', w(p.v[f], f, 'a') + '%');
          if (r0 && !S.inc(r0, f) && r0.v[f] - p.v[f] >= 0.5) {
            var s0 = w(p.v[f], f, 's'), s1 = w(r0.v[f], f, 's'), a0 = w(p.v[f], f, 'a'), a9 = w(r0.v[f], f, 'a');
            if (s1 - s0 > 0.5) { q.hidden = false; q.style.setProperty('--qs', s0 + '%'); q.style.setProperty('--qw', (s1 - s0) + '%'); q.style.setProperty('--qa', a0 + '%'); q.style.setProperty('--qwa', (a9 - a0) + '%'); }
          }
        }
        v.textContent = S.fmt(p, f); v.style.color = u ? '#555555' : (S.hors(p, f) ? '#c2410c' : S.T[f]);
      });
      fig.querySelectorAll('.p4a1fig-rb i').forEach(function (c) { c.classList.toggle('p4a1fig-ici', +c.dataset.k === i); });
      var bb = S.ibu(p), ja = fig.querySelector('.p4a1fig-ja'), av = document.getElementById('p4a1fig-amv');
      ja.style.width = (Math.min(170, bb.n) - 60) / 170 * 100 + '%'; ja.classList.toggle('p4a1fig-trop', bb.h); ja.classList.toggle('p4a1fig-ipb', !!bb.ip);
      fig.querySelector('.p4a1fig-cru').hidden = !bb.cru;
      av.textContent = bb.cru ? '60+?' : bb.t.replace(' IBU', ''); av.classList.toggle('p4a1fig-trop', bb.h);
    }
    // Les étapes : picto, nom en entier, floral ; soulignées en orangé si trop amères. Un toucher saute à l'étape.
    var ET = [['b60', '60′–0′', 0], ['wp', 'whirlpool', 1], ['dryActive|2', 'actif', 2], ['dryPost|2', 'après', 3]];
    var et = document.getElementById('p4a1et');
    et.innerHTML = ET.map(function (e) { return '<button type="button" data-etape="' + e[2] + '" data-saut="' + e[0] + '" aria-label="Moment : ' + e[1] + '"' + (S.ibu(D[S.idx(e[0])]).h ? ' class="p4a1et-amer"' : '') + '><span>' + mp(PIC[e[2]], 12) + e[1] + '</span><b></b></button>'; }).join('');
    et.querySelectorAll('button').forEach(function (b, n) { b.querySelector('b').textContent = S.fmt(D[S.idx(ET[n][0])], 'floral'); b.addEventListener('click', function () { var p = D[rail.cur()]; if (seg(p) === +b.dataset.etape) return; rail.poser(S.idx(b.dataset.saut.indexOf('dry') === 0 && jours(p) ? b.dataset.saut.split('|')[0] + '|' + jours(p) : b.dataset.saut)); }); });
    // Le profil du dock : une case par moment (floral), orangé si trop amer ; un jour sans gain est pâle, en pointillé.
    var prof = document.getElementById('p4a1prof'), h = '';
    for (var k = 0; k <= N; k++) {
      var p = D[k], pr = jours(p) > 1 ? D[k - 1] : null, sg = pr && seg(pr) === seg(p) && Math.abs(p.v.floral - pr.v.floral) < 0.1;
      h += '<i class="' + (p.interp ? 'p4a1prof-ip' : '') + (S.ibu(p).h ? ' p4a1prof-amer' : '') + (sg ? ' p4a1prof-sg' : '') + '" style="left:' + x(k) + '%;--cw:' + cw(k) + '%"><b style="height:' + Math.max(6, p.v.floral / 25 * 100).toFixed(0) + '%"></b></i>';
    }
    h += '<svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><path d="M52 29 C55 29 56 4 60 4 S70 6 73 22 S76 29 77 29 L100 29" fill="none" stroke="#161616" stroke-width="1.4" stroke-opacity=".7" vector-effect="non-scaling-stroke"/></svg>';
    prof.innerHTML = h;
    function mesure(p) {
      var m = document.getElementById('p4a1bas-mes'), s = seg(p);
      m.classList.toggle('p4a1bas-jamais', s < 2);
      if (s === 2) m.innerHTML = S.pi('floral', 14) + '<span><b>mesuré</b> linalol <span data-nature="mesure" data-source="E03 McCabe 2023">38 µg/L</span> (McCabe 2023)</span>';
      else if (s === 3) m.innerHTML = '<span><b>mesuré</b> 1 h ≈ <span data-nature="mesure" data-source="E10 Titus 2021">96 h</span> au nez (Titus 2021)</span>';
      else m.innerHTML = '<span>jamais mesuré à ce moment</span>';
    }
    function levure(p) {
      var dd = X.POMONA[p.id] || null, f2 = null;
      if (dd) for (var f in dd) if (!f2 || Math.abs(dd[f]) > Math.abs(dd[f2])) f2 = f;
      document.getElementById('p4a1bas-lev-t').innerHTML = dd && Math.abs(dd[f2]) >= 0.5 ? 'Pomona ' + S.pi(f2, 14) + '~+' + Math.round(dd[f2]) : 'rien ici';
    }
    function contre(i) {
      var c = document.getElementById('p4a1rep-contre'); if (i === best) { c.hidden = true; return; }
      var p = D[i], q = D[best], sg = p.interp ? '≈' : '~', df = Math.round(p.v.floral - q.v.floral), dr = Math.round(p.v.resin - q.v.resin);
      var fm = function (n) { return sg + (n >= 0 ? '+' : '−') + Math.abs(n); };
      c.hidden = false; c.innerHTML = 'contre ★ <b>' + q.lib + '</b> : floral ' + fm(df) + ' · résineux ' + fm(dr) + (S.ibu(p).h ? ' · <span class="p4a1rep-moins">trop amer</span>' : '');
    }
    var rail = null;
    rail = S.rail({
      hote: document.getElementById('p4a1geste'), orient: 'h', pas: 66,
      cellule: function (p) { return '<em>' + S.court(p) + '</em><i class="s-lp-b"><b style="width:' + Math.min(100, p.v.floral / 25 * 100).toFixed(0) + '%"></b></i><small>' + S.fmt(p, 'floral') + '</small>'; },
      onPose: function (i) {
        var p = D[i]; barres(i); mesure(p); levure(p); contre(i);
        et.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-current', String(+b.dataset.etape === seg(p))); });
        prof.querySelectorAll('i').forEach(function (c, k) { c.classList.toggle('p4a1prof-ici', k === i); });
        document.getElementById('p4a1rep-fl').textContent = S.fmt(p, 'floral'); fil();
      },
    });
    S.surLecture(function () { barres(rail.cur()); rubans(); });
    var dk = document.getElementById('p4a1dock'), haut = function () { document.body.style.setProperty('--dock', dk.offsetHeight + 'px'); fil(); };
    haut(); addEventListener('resize', haut);
    rubans(); rail.poser(rail.depart);
    window.LIRE = function () { return { m: rail.el.getAttribute('aria-valuetext'), fl: document.getElementById('p4a1rep-fl').textContent, am: document.getElementById('p4a1fig-amv').textContent, noyau: fig.querySelector('[data-f=stoneFruit] .p4a1fig-v').textContent, lev: document.getElementById('p4a1bas-lev-t').textContent, mes: document.getElementById('p4a1bas-mes').textContent, mieux: document.getElementById('p4a1rep-contre').hidden ? '' : document.getElementById('p4a1rep-contre').textContent }; };
    if (/touche=1/.test(location.search)) rail.toucher();
  },
};
