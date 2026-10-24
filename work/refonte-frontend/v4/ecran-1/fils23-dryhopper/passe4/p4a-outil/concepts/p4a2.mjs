// p4a2 · froide · a1 tel quel (ses boutons de jours compris), avec trois améliorations du brief de la passe 4 :
//   1. l'arôme entre deux moments : le moteur ne simule l'arôme qu'à 60′, 10′, au whirlpool et à froid ; entre deux,
//      c'est interpolé, et ça se dessine : sur le profil du dock, les crans calculés sont pleins et pointés, les crans
//      interpolés sont des fantômes en pointillé sur la droite qui relie deux crans calculés ; la ligne du doigt dit
//      « ≈ entre 60′ et 10′ » ;
//   2. le contour « chaleur ou CO₂ » : le contour blanc d'a1 (ce que le moment perd face au dry hop après fermentation)
//      porte au bout son picto, la flamme à chaud, les bulles en fermentation active ;
//   3. la courbe de levure : sur l'actif, une colline pleine (la levure travaille, fin vers J+5), hachurée là où la
//      biotransformation est possible mais non chiffrée, la levure en picto à son sommet ;
//   et 4, obligatoire : Noyau et Baies (avant inconnu) hachurés de leur couleur, écart « ? ».
// Rien d'autre ne change d'a1 (passe 3). Classes préfixées « p4a2 » (L26).
const CHEV = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
import { ETAPE, mp, PICTO_ETAPE } from '../socle.mjs';

export default {
  id: 'p4a2', nom: 'a1, froide : interpolé dessiné, chaleur ou CO₂, levure', chaleur: 'froide', levure: 'propre',
  titre: 'Quand ajouter Idaho 7 ?',
  legende: [
    'Glisse le pouce sur le rail, de 60′ à après 7 j, par 5′ ; la loupe chiffre le floral des moments voisins.',
    'Sous chaque barre, son ruban : la famille à chaque moment du rail, cerclé là où tu es ; trait orangé : hors du style.',
    'Barre : ta stout avec Idaho 7 ; rond : avant ; contour : ce que la chaleur ou le CO₂ emporte. Hachuré de couleur : avant inconnu, écart « ? ».',
    'Profil du dock : plein et pointé, calculé ; fantôme en pointillé, interpolé entre deux crans calculés. Flamme : la chaleur emporte ; bulles : le CO₂ emporte.',
    'Colline sur l\'actif : la levure travaille, fin vers J+5 (à confirmer à la densité) ; hachuré : biotransformation possible, non chiffrée. Jours pâles : sans gain. ★ : le meilleur pour ta demande du 18.10.',
    'Mesuré : linalol avec Idaho 7 dès le levurage (McCabe 2023). ~ simulé · ≈ interpolé · ? inconnu.',
  ],
  css: `
body.p4a2 { padding-bottom:var(--dock,118px); }
.p4a2 .s-ecran { min-height:calc(100svh - var(--dock,118px)); gap:5px; padding-bottom:6px; }
.p4a2rep { display:flex; flex-wrap:wrap; align-items:center; gap:2px 8px; font-size:16px; }
.p4a2rep-face { font-weight:600; }
.p4a2rep-fl { display:inline-flex; align-items:center; gap:4px; color:#9840bc; font-weight:700; }
.p4a2rep-par { margin-left:auto; display:inline-flex; align-items:center; gap:4px; height:24px; padding:0 9px; border-radius:12px; background:#fff; border:1px solid #d4d4d4; font-size:13px; color:var(--gris); }
.p4a2rep-par b { color:#9840bc; font-weight:600; }
.p4a2rep-contre { flex-basis:100%; font-size:13px; color:var(--gris); }
.p4a2rep-contre b { color:var(--encre); }
.p4a2rep-contre .p4a2rep-moins { color:var(--acc); font-weight:600; }
.p4a2fig { position:relative; flex:1; justify-content:space-between; gap:0; padding:6px 10px; }
.p4a2fig-ba { display:grid; grid-template-columns:88px 1fr 50px; align-items:center; gap:2px 6px; font-size:14px; padding:2px 0; }
.p4a2fig-n { display:flex; align-items:center; gap:4px; white-space:nowrap; grid-row:span 2; }
.p4a2fig-n.p4a2fig-att { font-weight:700; }
.p4a2fig-v { text-align:right; font-size:13px; font-family:var(--mono); grid-row:span 2; white-space:nowrap; }
.p4a2fig-p { position:relative; height:18px; background:var(--piste); border-radius:2px; overflow:hidden; }
.p4a2fig-p i { position:absolute; top:0; bottom:0; left:0; display:block; }
.p4a2fig-p .p4a2fig-pz { width:var(--ws); background:var(--zone); }
.p4a2fig-p .p4a2fig-q { left:var(--qs); width:var(--qw); top:3px; height:12px; border:1.5px solid var(--c); border-left:0; border-radius:0 2px 2px 0; background:#fff; }
.p4a2fig-p .p4a2fig-b { width:var(--ws); top:3px; height:12px; border-radius:2px; transition:width .18s cubic-bezier(.2,.8,.2,1); }
.p4a2fig-ip .p4a2fig-p .p4a2fig-b { opacity:.5; }
.p4a2fig-p .p4a2fig-av { left:clamp(8px, var(--ws), calc(100% - 8px)); width:16px; height:16px; top:1px; border-radius:50%; border:2px solid var(--encre); background:#fff; margin-left:-7px; }
.p4a2fig-p .p4a2fig-h { right:0; background:repeating-linear-gradient(135deg,#c4c4c4 0 2px,transparent 2px 6px); }
body.abs .p4a2fig-p .p4a2fig-pz, body.abs .p4a2fig-p .p4a2fig-b { width:var(--wa); }
body.abs .p4a2fig-p .p4a2fig-q { left:var(--qa); width:var(--qwa); }
body.abs .p4a2fig-p .p4a2fig-av { left:clamp(7px, var(--wa), calc(100% - 7px)); }
.p4a2fig-rb { position:relative; height:15px; }
.p4a2fig-rb i { position:absolute; top:0; bottom:0; width:var(--cw); margin-left:calc(var(--cw) / -2); border-radius:2px; display:block; }
.p4a2fig-rb i.p4a2fig-hs { box-shadow:inset 0 -2px 0 var(--acc); }
.p4a2fig-rb i.p4a2fig-ici { outline:1.5px solid var(--encre); outline-offset:0; z-index:1; }
.p4a2fig-am .p4a2fig-p .p4a2fig-jz { left:29.4%; width:11.8%; background:var(--zone); }
.p4a2fig-am .p4a2fig-p .p4a2fig-jb { left:0; width:35.3%; top:3px; height:12px; background:#8c8c8c; border-radius:2px; }
.p4a2fig-am .p4a2fig-p .p4a2fig-ja { left:35.3%; top:3px; height:12px; background:var(--encre); border-radius:2px; transition:width .18s; }
.p4a2fig-am .p4a2fig-p .p4a2fig-ja.p4a2fig-trop { background:var(--acc); }
.p4a2fig-am .p4a2fig-p .p4a2fig-ja.p4a2fig-ipb { opacity:.55; }
.p4a2fig-am .p4a2fig-p .p4a2fig-cru { left:35.3%; width:8%; top:3px; height:12px; background:repeating-linear-gradient(135deg,#c4c4c4 0 2px,transparent 2px 6px); }
.p4a2fig-am .p4a2fig-v.p4a2fig-trop { color:var(--acc); }
.p4a2fig-repli { display:flex; align-items:center; gap:6px; height:22px; color:var(--gris); align-self:flex-start; }
.p4a2fig-repli svg.p4a2fig-ch { transition:transform .15s; }
.p4a2fig-repli[aria-expanded="true"] svg.p4a2fig-ch { transform:rotate(90deg); }
.p4a2fil { position:absolute; width:2px; margin-left:-1px; background:var(--encre); border-radius:1px; pointer-events:none; z-index:0; transition:left .12s; }
.p4a2fig-p, .p4a2fig-rb { z-index:1; }
.p4a2fig-rb i.p4a2fig-ici { outline-width:2px; }
.p4a2fil::after { content:""; position:absolute; left:-4px; bottom:-5px; width:10px; height:10px; border-radius:50%; background:var(--encre); }
.p4a2bas { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.p4a2bas-mes { display:flex; align-items:center; gap:5px; font-size:12px; color:var(--gris); min-width:0; }
.p4a2bas-mes b { color:var(--encre); font-weight:600; }
.p4a2bas-mes.p4a2bas-jamais { padding:1px 6px; border-radius:4px; background:#ececec; }
.p4a2bas-lev a { display:inline-flex; align-items:center; gap:5px; height:32px; padding:0 12px; border-radius:16px; background:var(--encre); color:#fff; font-size:13px; white-space:nowrap; }
.p4a2bas-lev a b { font-weight:700; }
.p4a2bas-lev a span { color:#d4d4d4; display:inline-flex; align-items:center; gap:3px; }
.p4a2dock { position:fixed; left:50%; bottom:0; transform:translateX(-50%); width:min(390px,100%); background:#fff; border-top:1px solid var(--trait); box-shadow:0 -12px 40px -16px rgba(22,22,22,.35); padding:6px 12px 8px; z-index:20; }
.p4a2dock-haut { display:grid; grid-template-columns:1fr 84px; gap:6px; align-items:stretch; }
.p4a2et { display:grid; grid-template-columns:repeat(4,1fr); gap:3px; }
.p4a2jr { display:grid; grid-template-columns:1fr 1fr; gap:3px; }
.p4a2jr button { border-radius:4px; background:var(--piste); font:600 12px var(--sans); color:var(--encre); }
.p4a2jr button.p4a2jr-sg { background:#f7f7f7; color:var(--gris); font-weight:400; border:1px dashed #c4c4c4; }
.p4a2jr button[aria-pressed="true"] { background:var(--encre); color:#fff; font-weight:700; border:0; }
.p4a2jr button[aria-disabled="true"] { opacity:.45; }
.p4a2fig-p .p4a2fig-qp { left:calc(var(--qe) + 1px); top:2px; width:14px; height:14px; background:none; }
body.abs .p4a2fig-p .p4a2fig-qp { left:calc(var(--qea) + 1px); }
.p4a2rep-ip { white-space:nowrap; margin-left:6px; padding:0 5px; border-radius:4px; border:1px dashed #b4b4b4; font-style:italic; }
.p4a2prof .p4a2prof-lev { z-index:0; }
.p4a2prof i { z-index:1; }
.p4a2prof i.p4a2prof-calc b::after { content:""; position:absolute; left:50%; top:-3px; width:5px; height:5px; margin-left:-2.5px; border-radius:50%; background:#9840bc; }
.p4a2prof i.p4a2prof-ip { background:transparent; }
.p4a2prof i.p4a2prof-ip b { background:transparent !important; border:1px dashed #bf86d6; border-bottom:0; opacity:1 !important; }
.p4a2prof .p4a2prof-ipl { z-index:2; }
.p4a2lev { position:relative; height:12px; margin-top:2px; }
.p4a2lev svg { position:absolute; inset:0; width:100%; height:100%; }
.p4a2lev-yst { position:absolute; left:calc(52% - 15px); top:0; color:#555555; }
.p4a2et button { position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2px 0 4px; border-radius:4px; background:var(--piste); font-size:12px; color:var(--gris); line-height:1.15; overflow:hidden; }
.p4a2et button span { display:inline-flex; align-items:center; gap:3px; }
.p4a2et button b { font:600 12px var(--mono); color:#9840bc; }
.p4a2et button.p4a2et-amer::after { content:""; position:absolute; left:0; right:0; bottom:0; height:3px; background:var(--acc); }
.p4a2et button[aria-current="true"] { background:var(--encre); color:#fff; }
.p4a2et button[aria-current="true"] b { color:#ead7f3; }
.p4a2geste { margin-top:4px; }
.p4a2geste .s-lp { left:0; right:0; top:var(--lp-top,-46px); height:52px; }
.p4a2prof { position:relative; height:30px; }
.p4a2prof i { position:absolute; bottom:0; width:var(--cw); margin-left:calc(var(--cw) / -2); background:var(--piste); border-radius:2px 2px 0 0; height:100%; }
.p4a2prof i b { position:absolute; left:1px; right:1px; bottom:0; background:#bf86d6; border-radius:2px 2px 0 0; }
.p4a2prof i.p4a2prof-ip b { opacity:.5; }
.p4a2prof i.p4a2prof-amer { box-shadow:inset 0 -3px 0 var(--acc); }
.p4a2prof i.p4a2prof-ici { background:#d4d4d4; }
.p4a2prof i.p4a2prof-sg { background:transparent; border:1px dashed #b4b4b4; border-bottom:0; }
.p4a2prof i.p4a2prof-sg b { opacity:.35; }
.p4a2prof svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; pointer-events:none; }
.p4a2prof i.p4a2prof-sg { display:none; }
`,
  corps: `
<div class="p4a2rep" aria-live="polite"><span class="p4a2rep-face">Face à ta stout</span><span class="p4a2rep-fl"><svg class="s-pi" width="18" height="18" style="width:18px;height:18px" data-famille="floral" aria-label="Floral"><use href="#p-floral"/></svg><span id="p4a2rep-fl" class="num">~+22</span></span>
  <span class="p4a2rep-par" data-role="critere">par <svg class="s-pi" width="14" height="14" style="width:14px;height:14px" data-famille="floral" aria-label="Floral"><use href="#p-floral"/></svg><b>floral</b></span>
  <span class="p4a2rep-contre" id="p4a2rep-contre" hidden></span></div>
<section class="s-bloc p4a2fig" data-figure id="p4a2fig" aria-label="Familles d'arômes au style, et leur ruban le long du brassin"></section>
<div class="p4a2bas">
  <p class="p4a2bas-mes" id="p4a2bas-mes" data-acquis="valeurs"></p>
  <nav class="p4a2bas-lev" aria-label="Pont vers Levure" data-acquis="levure" data-forme="pont"><a href="${ETAPE}"><b>Puis la levure</b><span id="p4a2bas-lev-t">Pomona ~+13</span>${CHEV}</a></nav>
</div>
<div class="p4a2dock" id="p4a2dock" data-libre="moment" data-acquis="frise">
  <div class="p4a2dock-haut"><div class="p4a2et" id="p4a2et"></div><div class="p4a2jr" id="p4a2jr" data-jours role="group" aria-label="Jours de contact"></div></div>
  <div class="p4a2geste" id="p4a2geste"><div class="p4a2prof" id="p4a2prof" aria-hidden="true"></div><div class="p4a2lev" id="p4a2lev" aria-hidden="true"></div></div>
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
      return '<div class="p4a2fig-ba" data-f="' + f + '"' + (cache ? ' data-repli hidden' : '') + (ai ? ' data-avant="inconnu"' : '') + '><span class="p4a2fig-n' + ({ floral: 1, herbal: 1, earthy: 1 }[f] ? ' p4a2fig-att' : '') + '">' + S.pi(f) + '<span>' + S.NOM[f] + '</span></span>'
        + '<span class="p4a2fig-p" style="--c:' + S.BA[f] + '"><i class="p4a2fig-pz" data-role="zone" style="--ws:50%;--wa:' + (S.B[f] / 110 * 100).toFixed(1) + '%"></i><i class="p4a2fig-q"></i><i class="p4a2fig-qp"></i><i class="p4a2fig-b' + (ai ? ' s-avinc' : '') + '" style="background:' + S.BA[f] + '"></i>'
        + (ai ? '' : '<i class="p4a2fig-av" style="--ws:' + w(S.AV[f], f, 's').toFixed(1) + '%;--wa:' + w(S.AV[f], f, 'a').toFixed(1) + '%"></i>') + '<i class="p4a2fig-h"></i></span><span class="p4a2fig-v"></span>'
        + '<span class="p4a2fig-rb" aria-hidden="true">' + cases() + '</span></div>';
    };
    var fig = document.getElementById('p4a2fig');
    fig.innerHTML = VUES.map(function (f) { return ligne(f); }).join('')
      + '<div class="p4a2fig-ba p4a2fig-am" data-amer><span class="p4a2fig-n">Amertume</span><span class="p4a2fig-p"><i class="p4a2fig-jz"></i><i class="p4a2fig-jb"></i><i class="p4a2fig-ja"></i><i class="p4a2fig-cru" hidden></i></span><span class="p4a2fig-v" id="p4a2fig-amv"></span><span class="p4a2fig-rb" aria-hidden="true">' + cases() + '</span></div>'
      + '<button type="button" class="p4a2fig-repli" id="p4a2fig-repli" aria-expanded="false" aria-controls="p4a2fig" aria-label="Montrer Pépins, Melon, Épicé">' + REPLI.map(function (f) { return S.pi(f, 14); }).join('') + '<svg class="p4a2fig-ch" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button>'
      + REPLI.map(function (f) { return ligne(f, true); }).join('');
    document.getElementById('p4a2fig-repli').addEventListener('click', function () { var o = this.getAttribute('aria-expanded') !== 'true'; this.setAttribute('aria-expanded', String(o)); fig.querySelectorAll('[data-repli]').forEach(function (r) { r.hidden = !o; }); fil(); });
    function rubans() {
      fig.querySelectorAll('[data-f]').forEach(function (r) {
        var f = r.dataset.f;
        r.querySelectorAll('.p4a2fig-rb i').forEach(function (c) {
          var p = D[+c.dataset.k], u = S.inc(p, f);
          if (u) { c.style.background = 'repeating-linear-gradient(135deg,#c4c4c4 0 2px,transparent 2px 6px)'; c.style.opacity = 1; return; }
          var t = Math.min(1, abs() ? p.v[f] / 110 : p.v[f] / S.B[f] / 2);
          c.style.background = S.BA[f]; c.style.opacity = (0.35 + 0.65 * t) * (p.interp ? 0.75 : 1); c.classList.toggle('p4a2fig-hs', S.hors(p, f));
        });
      });
      fig.querySelectorAll('[data-amer] .p4a2fig-rb i').forEach(function (c) { var b = S.ibu(D[+c.dataset.k]); c.style.background = b.h ? '#c2410c' : '#8c8c8c'; c.style.opacity = Math.max(0.15, Math.min(1, (b.n - 40) / 130)); });
    }
    // Le fil : du ruban de Floral à celui de l'amertume, à la colonne du moment ; il descend vers le pouce.
    function fil() { return;
      var l = document.getElementById('p4a2fil'), rb = [].filter.call(fig.querySelectorAll('.p4a2fig-rb'), function (e) { return e.offsetParent; });
      if (!rb.length) return; var f0 = fig.getBoundingClientRect(), a = rb[0].getBoundingClientRect(), z = rb[rb.length - 1].getBoundingClientRect(), i = rail ? rail.cur() : best;
      l.style.left = (a.left - f0.left + a.width * x(i) / 100) + 'px'; l.style.top = (a.top - f0.top - 2) + 'px'; l.style.height = (z.bottom - a.top + 4) + 'px';
    }
    var refDe = function (p) { if (seg(p) === 3) return null; return D[S.idx('dryPost|' + (jours(p) || 2))]; };
    function barres(i) {
      var p = D[i], r0 = refDe(p);
      fig.querySelectorAll('[data-f]').forEach(function (r) {
        var f = r.dataset.f, u = S.inc(p, f), b = r.querySelector('.p4a2fig-b'), q = r.querySelector('.p4a2fig-q'), v = r.querySelector('.p4a2fig-v');
        r.classList.toggle('p4a2fig-ip', !!p.interp); b.hidden = u; r.querySelector('.p4a2fig-p .p4a2fig-h').hidden = !u; q.hidden = true; var qp = r.querySelector('.p4a2fig-qp'); qp.hidden = true;
        if (!u) {
          b.style.setProperty('--ws', w(p.v[f], f, 's') + '%'); b.style.setProperty('--wa', w(p.v[f], f, 'a') + '%');
          if (r0 && !S.inc(r0, f) && r0.v[f] - p.v[f] >= 0.5) {
            var s0 = w(p.v[f], f, 's'), s1 = w(r0.v[f], f, 's'), a0 = w(p.v[f], f, 'a'), a9 = w(r0.v[f], f, 'a');
            if (s1 - s0 > 0.5) { qp.hidden = false; qp.innerHTML = mp(seg(p) === 2 ? 'm-bulle' : 'm-feu', 14); qp.style.setProperty('--qe', s1 + '%'); qp.style.setProperty('--qea', a9 + '%'); qp.style.color = S.T[f]; q.hidden = false; q.style.setProperty('--qs', s0 + '%'); q.style.setProperty('--qw', (s1 - s0) + '%'); q.style.setProperty('--qa', a0 + '%'); q.style.setProperty('--qwa', (a9 - a0) + '%'); }
          }
        }
        v.textContent = S.fmt(p, f); v.style.color = u ? '#555555' : (S.hors(p, f) ? '#c2410c' : S.T[f]);
      });
      fig.querySelectorAll('.p4a2fig-rb i').forEach(function (c) { c.classList.toggle('p4a2fig-ici', +c.dataset.k === i); });
      var bb = S.ibu(p), ja = fig.querySelector('.p4a2fig-ja'), av = document.getElementById('p4a2fig-amv');
      ja.style.width = (Math.min(170, bb.n) - 60) / 170 * 100 + '%'; ja.classList.toggle('p4a2fig-trop', bb.h); ja.classList.toggle('p4a2fig-ipb', !!bb.ip);
      fig.querySelector('.p4a2fig-cru').hidden = !bb.cru;
      av.textContent = bb.cru ? '60+?' : bb.t.replace(' IBU', ''); av.classList.toggle('p4a2fig-trop', bb.h);
    }
    // Les étapes : picto, nom en entier, floral ; soulignées en orangé si trop amères. Un toucher saute à l'étape.
    var ET = [['b60', '60′–0′', 0], ['wp', 'WP', 1], ['dryActive|2', 'actif', 2], ['dryPost|2', 'après', 3]];
    var et = document.getElementById('p4a2et');
    et.innerHTML = ET.map(function (e) { return '<button type="button" data-etape="' + e[2] + '" data-saut="' + e[0] + '" aria-label="Moment : ' + e[1] + '"' + (S.ibu(D[S.idx(e[0])]).h ? ' class="p4a2et-amer"' : '') + '><span>' + e[1] + '</span><b></b></button>'; }).join('');
    et.querySelectorAll('button').forEach(function (b, n) { b.querySelector('b').textContent = S.fmt(D[S.idx(ET[n][0])], 'floral'); b.addEventListener('click', function () { var p = D[rail.cur()]; if (seg(p) === +b.dataset.etape) return; rail.poser(S.idx(b.dataset.saut.indexOf('dry') === 0 && jours(p) ? b.dataset.saut.split('|')[0] + '|' + jours(p) : b.dataset.saut)); }); });
    // Le profil du dock : une case par moment (floral), orangé si trop amer ; un jour sans gain est pâle, en pointillé.
    var prof = document.getElementById('p4a2prof'), h = '', hy = function (p) { return Math.max(6, p.v.floral / 25 * 100); };
    // La colline de la levure (fermentation active, fin vers J+5), sous le profil, avec le hachuré de la biotransformation.
    for (var k = 0; k <= N; k++) {
      var p = D[k];
      h += '<i class="' + (p.interp ? 'p4a2prof-ip' : 'p4a2prof-calc') + (S.ibu(p).h ? ' p4a2prof-amer' : '') + '" style="left:' + x(k) + '%;--cw:' + cw(k) + '%"><b style="height:' + hy(p).toFixed(0) + '%"></b></i>';
    }
    // La droite d'interpolation, d'un cran calculé au suivant (60′ → 10′ → whirlpool), en pointillé.
    var calc = []; for (k = 0; k <= 13; k++) if (D[k].calc) calc.push(k);
    var ligneIp = ''; for (var n = 0; n + 1 < calc.length; n++) { var a = calc[n], b = calc[n + 1]; if (b - a < 2) continue; ligneIp += 'M' + x(a).toFixed(2) + ' ' + (30 - hy(D[a]) * 0.3).toFixed(2) + ' L' + x(b).toFixed(2) + ' ' + (30 - hy(D[b]) * 0.3).toFixed(2) + ' '; }
    h += '<svg class="p4a2prof-ipl" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><path d="' + ligneIp + '" fill="none" stroke="#9840bc" stroke-width="1.5" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/></svg>';
    prof.innerHTML = h;
    document.getElementById('p4a2lev').innerHTML = '<span class="p4a2lev-yst">' + mp('m-levure', 12) + '</span><svg viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="p4a2-hach" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1.3" height="3" fill="#ffffff"/></pattern></defs>'
      + '<path d="M52 12 C55 12 56 0.5 60.5 0.5 S70 1.5 73 9 S76 12 77 12 Z" fill="#8c8c8c"/><path d="M55.6 12 C56.6 5 58 1.4 60.5 1.4 S66 2.5 68 12 Z" fill="url(#p4a2-hach)"/>'
      + '<path d="M77 11.4 L100 11.4" stroke="#8c8c8c" stroke-width="1.4" vector-effect="non-scaling-stroke"/></svg>';
    function mesure(p) {
      var m = document.getElementById('p4a2bas-mes'), s = seg(p);
      m.classList.toggle('p4a2bas-jamais', s < 2);
      if (s === 2) m.innerHTML = S.pi('floral', 14) + '<span><b>mesuré</b> linalol <span data-nature="mesure" data-source="E03 McCabe 2023">38 µg/L</span> (McCabe 2023)</span>';
      else if (s === 3) m.innerHTML = '<span><b>mesuré</b> 1 h ≈ <span data-nature="mesure" data-source="E10 Titus 2021">96 h</span> au nez (Titus 2021)</span>';
      else m.innerHTML = '<span>jamais mesuré à ce moment</span>';
    }
    function levure(p) {
      var dd = X.POMONA[p.id] || null, f2 = null;
      if (dd) for (var f in dd) if (!f2 || Math.abs(dd[f]) > Math.abs(dd[f2])) f2 = f;
      document.getElementById('p4a2bas-lev-t').innerHTML = dd && Math.abs(dd[f2]) >= 0.5 ? 'Pomona ' + S.pi(f2, 14) + '~+' + Math.round(dd[f2]) : 'rien ici';
    }
    function contre(i) {
      var c = document.getElementById('p4a2rep-contre'); if (i === best) { c.hidden = true; return; }
      var p = D[i], q = D[best], sg = p.interp ? '≈' : '~', df = Math.round(p.v.floral - q.v.floral), dr = Math.round(p.v.resin - q.v.resin);
      var fm = function (n) { return sg + (n >= 0 ? '+' : '−') + Math.abs(n); };
      c.hidden = false; c.innerHTML = 'contre ★ <b>' + q.lib + '</b> : floral ' + fm(df) + ' · résineux ' + fm(dr) + (S.ibu(p).h ? ' · <span class="p4a2rep-moins">trop amer</span>' : '') + (p.entre ? '<span class="p4a2rep-ip">≈ ' + p.entre[0] + '–' + p.entre[1] + '</span>' : '');
    }
    var JR = [1, 2, 3, 7], jr = document.getElementById('p4a2jr');
    jr.innerHTML = JR.map(function (j) { return '<button type="button" data-jour="' + j + '" aria-pressed="false">' + j + ' j</button>'; }).join('');
    jr.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { var p = D[rail.cur()]; if (seg(p) < 2) return; rail.poser(S.idx(p.id.split('|')[0] + '|' + b.dataset.jour)); }); });
    function majJours(p) {
      var s0 = seg(p), dj = jours(p);
      jr.querySelectorAll('button').forEach(function (b) {
        var j = +b.dataset.jour, on = s0 >= 2;
        b.setAttribute('aria-disabled', String(!on)); b.setAttribute('aria-pressed', String(on && j === dj));
        var q = on ? D[S.idx(p.id.split('|')[0] + '|' + j)] : null, pr = on && j > 1 ? D[S.idx(p.id.split('|')[0] + '|' + JR[JR.indexOf(j) - 1])] : null;
        b.classList.toggle('p4a2jr-sg', !!(q && pr && Math.abs(q.v.floral - pr.v.floral) < 0.1));
      });
    }
    var rail = null;
    rail = S.rail({
      hote: document.getElementById('p4a2geste'), orient: 'h', pas: 66,
      cellule: function (p) { return '<em>' + S.court(p) + '</em><i class="s-lp-b"><b style="width:' + Math.min(100, p.v.floral / 25 * 100).toFixed(0) + '%"></b></i><small>' + S.fmt(p, 'floral') + '</small>'; },
      onPose: function (i) {
        var p = D[i]; barres(i); mesure(p); levure(p); contre(i); majJours(p);
        et.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-current', String(+b.dataset.etape === seg(p))); });
        prof.querySelectorAll('i').forEach(function (c, k) { c.classList.toggle('p4a2prof-ici', k === i); });
        document.getElementById('p4a2rep-fl').textContent = S.fmt(p, 'floral'); fil();
      },
    });
    S.surLecture(function () { barres(rail.cur()); rubans(); });
    var dk = document.getElementById('p4a2dock'), haut = function () { document.body.style.setProperty('--dock', dk.offsetHeight + 'px'); fil(); };
    haut(); addEventListener('resize', haut);
    rubans(); rail.poser(rail.depart);
    window.LIRE = function () { return { m: rail.el.getAttribute('aria-valuetext'), fl: document.getElementById('p4a2rep-fl').textContent, am: document.getElementById('p4a2fig-amv').textContent, noyau: fig.querySelector('[data-f=stoneFruit] .p4a2fig-v').textContent, lev: document.getElementById('p4a2bas-lev-t').textContent, mes: document.getElementById('p4a2bas-mes').textContent, mieux: document.getElementById('p4a2rep-contre').hidden ? '' : document.getElementById('p4a2rep-contre').textContent }; };
    if (/touche=1/.test(location.search)) rail.toucher();
  },
};
