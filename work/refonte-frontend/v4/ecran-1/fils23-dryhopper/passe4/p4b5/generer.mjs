// p4b5 · chaude · « Trois moments sous le pouce » (reprise après le REJET du critique, 24.10 : « barres des voisins
// illisibles, 7 px sous un rond de 12 px »). Sur a1 : la figure compare trois moments côte à côte, le moment sous le pouce
// au milieu, ouvert (barres l5b avec rond « avant » et chiffre), un voisin de chaque côté, en colonnes de 90 px au moins :
// barre de gain seule, sans rond, chiffrée. Les 12 familles sont alignées en lignes, l'œil lit d'un trait comment chacune
// monte ou tombe d'un cran à l'autre. En dry hop, les voisins sont des jours : la durée de contact se lit sans second
// geste. Aux bouts du rail, les deux voisins du même côté. L'amertume est chiffrée dans les trois colonnes. Toucher un
// voisin y va. La loupe d'a1 (cinq voisins par 5′, floral) est gardée sur le rail.
// Améliorations prises : 1 (une colonne interpolée a un en-tête en pointillé et « ≈ » ; une colonne calculée, un en-tête
// plein ; points calculés sur le rail), 5 (la durée de contact, ce sont les voisins), 6 (un premier regard sans légende :
// trois colonnes alignées, toutes chiffrées). Greffes : les cases comparées dont celle du doigt s'ouvre (e3) ; la mesure par
// colonne (c7 : ● mesuré, ○ jamais) ; « sans gain » (e2) ; pastilles d'étape, sauts, loupe et « contre ★ » d'a1 et b4.
// Classes préfixées p4b5- (L26).
import { rendre, OUTIL, CHEV } from '../p4b-commun/socle-p4b.mjs';

rendre({
  id: 'p4b5', nom: 'Trois moments sous le pouce', chaleur: 'chaude', titre: 'Quand ajouter Idaho 7 ?',
  legende: [
    'Trois colonnes : le moment sous ton pouce, ouvert, et un voisin de chaque côté, par 5′ dans l\'ébullition, par jour en dry hop. Aux bouts du rail, les deux voisins du même côté. Toucher un voisin y va.',
    'En-tête plein : calculé par le moteur ; pointillé et « ≈ » : interpolé entre 60′, 10′ et whirlpool. ● : un moment mesuré (linalol 38 µg/L dès le levurage, McCabe 2023) ; ○ : jamais mesuré.',
    'Barres : le gain des 12 familles au style, trait au milieu : la moitié du style ; rond : avant (colonne ouverte). Hachuré « ? » : jamais décrit dans les fiches, pas zéro. « = » : sans gain face au cran d\'avant.',
    'Amertume : orangée au-delà de 70 IBU ; à cru, « 60+? » hachuré (non modélisé). ★ : le meilleur pour ta demande du 18.10.',
    'Glisse le pouce sur le rail, de 60′ à après 7 j : les colonnes suivent, la loupe chiffre le floral des cinq moments voisins.',
  ],
  css: `
body.p4b5 { padding-bottom:var(--dock,96px); }
.p4b5 .s-ecran { min-height:calc(100svh - var(--dock,96px)); gap:5px; padding-bottom:6px; }
.p4b5-rep { display:flex; flex-wrap:wrap; align-items:center; gap:2px 8px; font-size:16px; }
.p4b5-face { font-weight:600; }
.p4b5-fl { display:inline-flex; align-items:center; gap:4px; color:#9840bc; font-weight:700; }
.p4b5-star { margin-left:auto; display:inline-flex; align-items:center; gap:4px; height:24px; padding:0 9px; border-radius:12px; background:#fff; border:1px solid #d5d8df; font-size:13px; color:var(--gris); }
.p4b5-star b { color:#2f6b5f; font-weight:600; }
.p4b5-star.p4b5-ici { background:#edf7f3; border-color:#b7d8cf; }
.p4b5-contre { flex-basis:100%; font-size:13px; color:var(--gris); }
.p4b5-contre b { color:var(--encre); }
.p4b5-contre .p4b5-moins { color:var(--acc); font-weight:600; }
.p4b5-fig { flex:1; gap:0; padding:6px 8px; display:flex; }
.p4b5-grille { flex:1; display:grid; grid-template-columns:70px 1fr 1.12fr 1fr; gap:3px 10px; align-items:center; align-content:space-between; }
.p4b5-col { display:flex; flex-direction:column; align-items:center; gap:2px; height:44px; justify-content:flex-end; }
.p4b5-col button { display:flex; flex-direction:column; align-items:center; width:100%; padding:2px 0 1px; border-radius:4px; border:1.5px solid #d5d8df; background:#fff; font:600 14px var(--mono); color:var(--gris); line-height:1.1; }
.p4b5-col button.p4b5-ip { border-style:dashed; }
.p4b5-col button small { font:400 12px var(--sans); }
.p4b5-col.p4b5-ici button { background:var(--encre); color:#fff; border-color:var(--encre); font-size:15px; }
.p4b5-col.p4b5-ici button small { color:#d9dce3; }
.p4b5-mes { font-size:12px; color:var(--gris); line-height:1; }
.p4b5-mes.p4b5-ok { color:var(--encre); }
.p4b5-n { display:flex; align-items:center; gap:3px; white-space:nowrap; font-size:12.5px; overflow:hidden; }
.p4b5-n.p4b5-att { font-weight:700; }
.p4b5-c { display:grid; grid-template-columns:1fr 34px; align-items:center; gap:2px; }
.p4b5-c.p4b5-ici { grid-template-columns:1fr 40px; }
.p4b5-p { position:relative; height:18px; background:#f1f2f5; border-radius:2px; overflow:hidden; }
.p4b5-ici .p4b5-p { height:20px; background:#eceef3; }
.p4b5-p i { position:absolute; top:0; bottom:0; left:0; display:block; }
.p4b5-p .p4b5-b { width:var(--w); top:3px; height:12px; border-radius:2px; }
.p4b5-ici .p4b5-p .p4b5-b { height:14px; }
.p4b5-p .p4b5-z { left:var(--z); width:2px; background:#9a9fab; }
.p4b5-p .p4b5-av { display:none; left:clamp(7px, var(--a), calc(100% - 7px)); width:14px; height:14px; top:3px; border-radius:50%; border:2px solid var(--encre); background:#fff; margin-left:-7px; }
.p4b5-ici .p4b5-p .p4b5-av { display:block; }
.p4b5-p .p4b5-h { right:0; background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }
.p4b5-ip .p4b5-p .p4b5-b { opacity:.5; }
.p4b5-v { text-align:right; font:600 12px var(--mono); white-space:nowrap; }
.p4b5-ici .p4b5-v { font-size:13px; }
.p4b5-v.p4b5-trop { color:var(--acc); }
.p4b5-v .p4b5-eg { color:var(--gris); font-weight:400; margin-right:2px; }
.p4b5-am .p4b5-p .p4b5-zone { left:0; width:var(--zw); background:#d9dce3; }
.p4b5-am .p4b5-p .p4b5-b { background:#8a8f9c; }
.p4b5-am .p4b5-p .p4b5-b.p4b5-trop { background:var(--acc); }
.p4b5-am .p4b5-p .p4b5-cru { left:0; width:12%; top:3px; height:12px; background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }
.p4b5-bas { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.p4b5-mesl { display:flex; align-items:center; gap:5px; font-size:12px; color:var(--gris); min-width:0; }
.p4b5-mesl b { color:var(--encre); font-weight:600; }
.p4b5-mesl.p4b5-jamais { padding:1px 6px; border-radius:4px; background:#e2e5eb; }
.p4b5-lev a { display:inline-flex; align-items:center; gap:5px; height:30px; padding:0 12px; border-radius:15px; background:#fff; border:1px solid #c9cad2; font-size:13px; white-space:nowrap; }
.p4b5-lev a b { font-weight:700; }
.p4b5-dock { position:fixed; left:50%; bottom:0; transform:translateX(-50%); width:min(390px,100%); background:#fff; border-top:1px solid var(--trait); box-shadow:0 -12px 40px -16px rgba(22,22,26,.35); padding:6px 12px 8px; z-index:20; }
.p4b5-et { display:grid; grid-template-columns:repeat(4,1fr); gap:3px; }
.p4b5-et button { position:relative; display:flex; align-items:center; justify-content:center; gap:4px; height:24px; border-radius:4px; background:#f1f2f5; font-size:12px; color:var(--gris); }
.p4b5-et button b { font:600 12px var(--mono); color:#9840bc; }
.p4b5-et button.p4b5-amer::after { content:""; position:absolute; left:0; right:0; bottom:0; height:3px; background:var(--acc); }
.p4b5-et button[aria-current="true"] { background:var(--encre); color:#fff; }
.p4b5-et button[aria-current="true"] b { color:#ead7f3; }
.p4b5-rail { margin-top:26px; }
`,
  corps: `
<div class="p4b5-rep" aria-live="polite"><span class="p4b5-face">Face à ta stout</span><span class="p4b5-fl"><svg class="s-pi" width="18" height="18" style="width:18px;height:18px" data-famille="floral" aria-label="Floral"><use href="#p-floral"/></svg><span id="p4b5-fl" class="num">~+22</span></span>
  <span class="p4b5-star" id="p4b5-star">★ <b id="p4b5-star-t"></b></span>
  <span class="p4b5-contre" id="p4b5-contre" hidden></span></div>
<section class="s-bloc p4b5-fig" aria-label="Trois moments : celui sous le pouce, ouvert, et ses voisins" data-libre="moment" data-acquis="frise">
  <div class="p4b5-grille" id="p4b5-grille"></div>
</section>
<div class="p4b5-bas">
  <p class="p4b5-mesl" id="p4b5-mesl" data-acquis="valeurs"></p>
  <nav class="p4b5-lev" aria-label="Pont vers Levure" data-acquis="levure" data-forme="pont"><a href="${OUTIL}"><b>Levure</b><span id="p4b5-lev-t"></span>${CHEV}</a></nav>
</div>
<div class="p4b5-dock" id="p4b5-dock" data-libre="moment">
  <div class="p4b5-et" id="p4b5-et"></div>
  <div class="p4b5-rail" id="p4b5-rail" data-acquis="geste"></div>
</div>`,
  script: function () {
    var S = window.S, P4 = window.P4, D = S.D, N = S.N, X = window.S_DATA, COLS = [0, 1, 2];
    var abs = function () { return document.body.classList.contains('abs'); };
    var w = function (v, f) { return abs() ? Math.min(100, v / 110 * 100) : Math.min(100, v / S.B[f] / 2 * 100); };
    var G = document.getElementById('p4b5-grille'), h = '';
    h += '<span></span>' + COLS.map(function (c) { return '<span class="p4b5-col" data-c="' + c + '"><button type="button" data-saut="" aria-label="Aller à ce moment"><span class="p4b5-t"></span><small></small></button><span class="p4b5-mes"></span></span>'; }).join('');
    var cell = function (f, c) {
      return '<span class="p4b5-c" data-f="' + f + '" data-c="' + c + '"><span class="p4b5-p"><i class="p4b5-z" data-role="zone" style="--z:50%"></i><i class="p4b5-b" style="background:' + S.BA[f] + '"></i><i class="p4b5-av" style="--a:' + w(S.AV[f], f).toFixed(1) + '%"></i><i class="p4b5-h"></i></span><span class="p4b5-v"></span></span>';
    };
    S.ORDRE.forEach(function (f) { h += '<span class="p4b5-n' + ({ floral: 1, herbal: 1, earthy: 1 }[f] ? ' p4b5-att' : '') + '">' + S.pi(f, 15) + '<span>' + S.NOM[f] + '</span></span>' + COLS.map(function (c) { return cell(f, c); }).join(''); });
    h += '<span class="p4b5-n">Amertume</span>' + COLS.map(function (c) { return '<span class="p4b5-c p4b5-am" data-am data-c="' + c + '"><span class="p4b5-p"><i class="p4b5-zone" style="--zw:' + (10 / 110 * 100).toFixed(1) + '%"></i><i class="p4b5-b"></i><i class="p4b5-cru" hidden></i></span><span class="p4b5-v"></span></span>'; }).join('');
    G.innerHTML = h;
    // Les trois moments : le voisin d'avant, ici, le voisin d'après ; aux bouts du rail, les deux voisins du même côté.
    var trio = function (i) { return i === 0 ? [0, 1, 2] : i === N ? [N - 2, N - 1, N] : [i - 1, i, i + 1]; };
    function colonnes(i) {
      var ks = trio(i);
      COLS.forEach(function (c) {
        var k = ks[c], p = D[k], ici = k === i, col = G.querySelector('.p4b5-col[data-c="' + c + '"]'), bt = col.querySelector('button');
        col.classList.toggle('p4b5-ici', ici);
        bt.classList.toggle('p4b5-ip', !!p.interp); bt.setAttribute('data-saut', p.id);
        bt.querySelector('.p4b5-t').textContent = P4.seg(p) >= 2 ? P4.jours(p) + ' j' : P4.court(p);
        bt.querySelector('small').textContent = P4.seg(p) === 2 ? 'actif' : P4.seg(p) === 3 ? 'après' : P4.seg(p) === 1 ? 'whirlpool' : (p.interp ? '≈' : '~');
        var m = col.querySelector('.p4b5-mes'), me = P4.mesure(p); m.textContent = me.ok ? '●' : '○'; m.className = 'p4b5-mes' + (me.ok ? ' p4b5-ok' : '');
        G.querySelectorAll('.p4b5-c[data-c="' + c + '"]').forEach(function (cl) {
          cl.classList.toggle('p4b5-ici', ici);
          var v = cl.querySelector('.p4b5-v'), b = cl.querySelector('.p4b5-b');
          if (cl.hasAttribute('data-am')) {
            var bb = S.ibu(p);
            b.style.width = (Math.min(170, bb.n) - 60) / 110 * 100 + '%'; b.classList.toggle('p4b5-trop', bb.h); b.style.opacity = bb.ip ? .55 : '';
            cl.querySelector('.p4b5-cru').hidden = !bb.cru; v.textContent = bb.cru ? '60+?' : bb.t.replace(' IBU', ''); v.classList.toggle('p4b5-trop', bb.h);
            return;
          }
          var f = cl.dataset.f, u = S.inc(p, f);
          cl.classList.toggle('p4b5-ip', !!p.interp); b.hidden = u; cl.querySelector('.p4b5-h').hidden = !u; cl.querySelector('.p4b5-z').style.setProperty('--z', (abs() ? S.B[f] / 110 * 100 : 50) + '%');
          if (!u) b.style.setProperty('--w', w(p.v[f], f) + '%');
          var pr = k > 0 ? D[k - 1] : null, sg = !u && P4.seg(p) >= 2 && pr && P4.seg(pr) === P4.seg(p) && Math.abs(p.v[f] - pr.v[f]) < 0.1;
          v.innerHTML = (sg ? '<span class="p4b5-eg">=</span>' : '') + S.fmt(p, f); v.style.color = u ? '#55555f' : (S.hors(p, f) ? '#c2410c' : S.T[f]);
        });
      });
    }
    var ET = [['b60', '60′–0′', 0], ['wp', 'WP', 1], ['dryActive|2', 'actif', 2], ['dryPost|2', 'après', 3]];
    var et = document.getElementById('p4b5-et');
    et.innerHTML = ET.map(function (e) { return '<button type="button" data-etape="' + e[2] + '" data-saut="' + e[0] + '" aria-label="Moment : ' + e[1] + '"' + (S.ibu(D[S.idx(e[0])]).h ? ' class="p4b5-amer"' : '') + '><span>' + e[1] + '</span><b>' + S.fmt(D[S.idx(e[0])], 'floral') + '</b></button>'; }).join('');
    function contre(i) {
      var c = document.getElementById('p4b5-contre'), st = document.getElementById('p4b5-star');
      document.getElementById('p4b5-star-t').textContent = D[P4.best].lib; st.classList.toggle('p4b5-ici', i === P4.best);
      if (i === P4.best) { c.hidden = true; return; }
      var p = D[i], q = D[P4.best], sg = p.interp ? '≈' : '~', df = Math.round(p.v.floral - q.v.floral), dr = Math.round(p.v.resin - q.v.resin);
      var fmt = function (n) { return sg + (n >= 0 ? '+' : '−') + Math.abs(n); };
      c.hidden = false; c.innerHTML = 'contre ★ : floral ' + fmt(df) + ' · résineux ' + fmt(dr) + (S.ibu(p).h ? ' · <span class="p4b5-moins">trop amer</span>' : '');
    }
    function mesure(p) { var m = document.getElementById('p4b5-mesl'), r = P4.mesure(p); m.classList.toggle('p4b5-jamais', !r.ok); m.innerHTML = (r.ok && P4.seg(p) === 2 ? S.pi('floral', 14) : '') + '<span>' + r.html + '</span>'; }
    function levure(p) {
      var dd = X.POMONA[p.id] || null, f2 = null;
      if (dd) for (var f in dd) if (!f2 || Math.abs(dd[f]) > Math.abs(dd[f2])) f2 = f;
      document.getElementById('p4b5-lev-t').textContent = dd && Math.abs(dd[f2]) >= 0.5 ? 'Pomona ~+' + Math.round(dd[f2]) + ' ' + S.NOM[f2].toLowerCase() : 'rien ne change ici';
    }
    var R = P4.rail(document.getElementById('p4b5-rail'), {
      calcules: true,
      surPoser: function (i, p) {
        colonnes(i); contre(i); mesure(p); levure(p);
        et.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-current', String(+b.dataset.etape === P4.seg(p))); });
        document.getElementById('p4b5-fl').textContent = S.fmt(p, 'floral');
      },
      loupe: function (i) {
        var out = [];
        for (var k = i - 2; k <= i + 2; k++) {
          if (k < 0 || k > N) continue; var p = D[k], pr = k > 0 ? D[k - 1] : null, sg = P4.seg(p) >= 2 && pr && P4.seg(pr) === P4.seg(p) && Math.abs(p.v.floral - pr.v.floral) < 0.1;
          out.push({ k: k, html: '<em>' + P4.court(p) + '</em><i><b style="width:' + Math.min(100, p.v.floral / 25 * 100).toFixed(0) + '%"></b></i><small' + (sg ? ' style="color:#55555f;font-weight:400"' : '') + '>' + (sg ? 'sans gain' : S.fmt(p, 'floral')) + '</small>' });
        }
        return out;
      },
    });
    G.querySelectorAll('.p4b5-col button').forEach(function (b) { b.addEventListener('click', function () { var id = b.getAttribute('data-saut'); if (id) R.poser(S.idx(id)); }); });
    et.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { var p = D[R.cur()]; if (P4.seg(p) === +b.dataset.etape) return; R.poser(S.idx(b.dataset.saut.indexOf('dry') === 0 && P4.jours(p) ? b.dataset.saut.split('|')[0] + '|' + P4.jours(p) : b.dataset.saut)); }); });
    S.surLecture(function () { colonnes(R.cur()); });
    var dk = document.getElementById('p4b5-dock'), haut = function () { document.body.style.setProperty('--dock', dk.offsetHeight + 'px'); };
    haut(); addEventListener('resize', haut);
    window.P4ETAT = function () { var p = D[R.cur()]; var cols = COLS.map(function (c) { return G.querySelector('.p4b5-col[data-c="' + c + '"] .p4b5-t').textContent; }); var larg = COLS.map(function (c) { return Math.round(G.querySelector('.p4b5-c[data-f="floral"][data-c="' + c + '"] .p4b5-p').getBoundingClientRect().width); }); return { m: p.lib, fl: S.fmt(p, 'floral'), am: G.querySelector('[data-am].p4b5-ici .p4b5-v').textContent, colonnes: cols.join(' | '), largeurBarres: larg.join(' | '), contre: document.getElementById('p4b5-contre').textContent, lev: document.getElementById('p4b5-lev-t').textContent, mes: document.getElementById('p4b5-mesl').textContent }; };
  },
});
