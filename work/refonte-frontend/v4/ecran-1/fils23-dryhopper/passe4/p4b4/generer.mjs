// p4b4 · chaude · « Le duel contre ★ ». Sur a1 : les barres l5b se mettent face à face. À gauche, le moment sous le
// pouce ; à droite, la référence : ★ le meilleur pour sa demande (par défaut) ou, d'un toucher de lecture, le dry hop
// après fermentation de même durée (tout gardé : l'écart est alors ce que la chaleur ou le CO₂ emporte, en hachure
// orangée ou en pointillé bleu-gris). L'écart se lit au centre, sous le nom de la famille.
// Améliorations prises : 6 (un premier regard sans légende : deux colonnes, l'écart au centre, orangé quand on perd),
// 2 (le contour chaleur / CO₂ devient une colonne de référence, pas un filet), 4 (Pépins et Melon hachurés « ? »).
// Greffes : « contre ★ » de b4 ; « trop amer » de a8 ; « le CO₂ emporte ~−6 résineux » de d1/d2 ; « le meilleur » rappelé
// de g4 ; loupe, pastilles d'étape, jours et sauts d'a1. Classes préfixées p4b4- (L26).
import { rendre, OUTIL, CHEV } from '../p4b-commun/socle-p4b.mjs';

rendre({
  id: 'p4b4', nom: 'Le duel contre ★', chaleur: 'chaude', titre: 'Quand ajouter Idaho 7 ?',
  legende: [
    'À gauche : ta stout avec Idaho 7 au moment sous ton pouce. À droite : ★, le meilleur moment pour ta demande du 18.10 (plus floral, moins résineux, 50–70 IBU) ; ou, d\'un toucher, le dry hop après fermentation de même durée.',
    'Au centre, sous la famille : l\'écart ; orangé quand ce moment perd. Contre après : la hachure orangée est ce que la chaleur emporte, le pointillé bleu-gris ce que le CO₂ de fermentation emporte.',
    'Trait au milieu de chaque barre : la moitié du style. Hachuré « ? » : jamais décrit dans les fiches, pas zéro.',
    'Glisse le pouce sur le rail, de 60′ à après 7 j, par 5′ ; la loupe chiffre l\'écart des moments voisins. Pastilles : l\'écart de chaque étape contre ★.',
    'Mesuré : linalol avec Idaho 7 dès le levurage (McCabe 2023). ~ simulé · ≈ interpolé entre 60′, 10′ et whirlpool.',
  ],
  css: `
body.p4b4 { padding-bottom:var(--dock,128px); }
.p4b4 .s-ecran { min-height:calc(100svh - var(--dock,128px)); gap:5px; padding-bottom:6px; }
.p4b4-rep { display:flex; flex-wrap:wrap; align-items:center; gap:2px 8px; font-size:16px; }
.p4b4-face { font-weight:600; }
.p4b4-fl { display:inline-flex; align-items:center; gap:4px; color:#9840bc; font-weight:700; }
.p4b4-ref { margin-left:auto; }
.p4b4-ref button { height:26px; }
.p4b4-fig { flex:1; justify-content:flex-start; gap:0; padding:6px 8px; }
#p4b4-lignes { flex:1; display:flex; flex-direction:column; justify-content:space-between; }
.p4b4-g .p4b4-p, .p4b4-d .p4b4-p { display:block; }
.p4b4-tete { display:grid; grid-template-columns:1fr 104px 1fr; align-items:center; margin-bottom:4px; }
.p4b4-tete span { display:inline-flex; align-items:center; justify-content:center; gap:4px; height:24px; padding:0 9px; border-radius:12px; font:600 13px var(--sans); white-space:nowrap; }
.p4b4-tete .p4b4-g { background:var(--encre); color:#fff; justify-self:start; }
.p4b4-tete .p4b4-g .s-pt { border:1.5px solid #fff; }
.p4b4-tete .p4b4-d { background:#edf7f3; color:#2f6b5f; border:1px solid #b7d8cf; justify-self:end; }
.p4b4-tete .p4b4-d.p4b4-ap { background:#eef4fb; color:#3b5f8a; border-color:#b9cbe3; }
.p4b4-tete .p4b4-vs { text-align:center; font-size:12px; color:var(--gris); }
.p4b4-ba { display:grid; grid-template-columns:1fr 104px 1fr; align-items:center; gap:4px; min-height:26px; }
.p4b4-n { display:flex; flex-direction:column; align-items:center; line-height:1.05; }
.p4b4-n b { display:inline-flex; align-items:center; gap:3px; font-size:13px; font-weight:400; white-space:nowrap; }
.p4b4-n.p4b4-att b { font-weight:700; }
.p4b4-n small { font:600 11px var(--mono); color:var(--gris); }
.p4b4-n small.p4b4-moins { color:var(--acc); }
.p4b4-n small.p4b4-plus { color:#2f6b5f; }
.p4b4-p { position:relative; height:16px; background:#f1f2f5; border-radius:2px; overflow:hidden; }
.p4b4-p i { position:absolute; top:0; bottom:0; display:block; }
.p4b4-p .p4b4-b { top:3px; height:10px; border-radius:2px; transition:width .18s cubic-bezier(.2,.8,.2,1); }
.p4b4-g .p4b4-p .p4b4-b { right:0; border-radius:2px 0 0 2px; }
.p4b4-d .p4b4-p .p4b4-b { left:0; border-radius:0 2px 2px 0; opacity:.55; }
.p4b4-d .p4b4-p .p4b4-e { top:3px; height:10px; left:var(--l); width:var(--w); border-radius:0 2px 2px 0; }
.p4b4-d .p4b4-p .p4b4-e.p4b4-ch { background:repeating-linear-gradient(135deg,#c2410c 0 2px,#fde4d6 2px 5px); }
.p4b4-d .p4b4-p .p4b4-e.p4b4-co { background:radial-gradient(circle at 3px 3px,#3b5f8a 1.3px,transparent 1.6px) 0 0/6px 6px, #dfe8f4; }
.p4b4-ip .p4b4-g .p4b4-b { opacity:.5; }
.p4b4-p .p4b4-z { width:2px; background:#8a8f9c; }
.p4b4-g .p4b4-p .p4b4-z { right:var(--z); }
.p4b4-d .p4b4-p .p4b4-z { left:var(--z); }
.p4b4-p .p4b4-h { left:0; right:0; background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }
.p4b4-v { position:absolute; top:0; bottom:0; display:flex; align-items:center; font:600 12px var(--mono); padding:0 4px; }
.p4b4-g .p4b4-v { left:0; }
.p4b4-d .p4b4-v { right:0; color:var(--gris); }
.p4b4-ba .p4b4-g, .p4b4-ba .p4b4-d { position:relative; display:block; }
.p4b4-g .p4b4-v.p4b4-trop { color:var(--acc); }
.p4b4-am .p4b4-p .p4b4-b { background:#8a8f9c; }
.p4b4-am .p4b4-g .p4b4-p .p4b4-b.p4b4-trop { background:var(--acc); }
.p4b4-am .p4b4-p .p4b4-zone { background:#d9dce3; }
.p4b4-am .p4b4-p .p4b4-cru { background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); top:3px; height:10px; }
.p4b4-bas { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.p4b4-mes { display:flex; align-items:center; gap:5px; font-size:12px; color:var(--gris); min-width:0; }
.p4b4-mes b { color:var(--encre); font-weight:600; }
.p4b4-mes.p4b4-jamais { padding:1px 6px; border-radius:4px; background:#e2e5eb; }
.p4b4-lev a { display:inline-flex; align-items:center; gap:5px; height:30px; padding:0 12px; border-radius:15px; background:#fff; border:1px solid #c9cad2; font-size:13px; white-space:nowrap; }
.p4b4-lev a b { font-weight:700; }
.p4b4-dock { position:fixed; left:50%; bottom:0; transform:translateX(-50%); width:min(390px,100%); background:#fff; border-top:1px solid var(--trait); box-shadow:0 -12px 40px -16px rgba(22,22,26,.35); padding:6px 12px 8px; z-index:20; }
.p4b4-haut { display:grid; grid-template-columns:1fr 84px; gap:6px; align-items:stretch; }
.p4b4-et { display:grid; grid-template-columns:repeat(4,1fr); gap:3px; }
.p4b4-et button { position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2px 0 3px; border-radius:4px; background:#f1f2f5; font-size:12px; color:var(--gris); line-height:1.15; }
.p4b4-et button b { font:600 12px var(--mono); color:var(--gris); }
.p4b4-et button b.p4b4-moins { color:var(--acc); }
.p4b4-et button b.p4b4-star { color:#2f6b5f; }
.p4b4-et button[aria-current="true"] { background:var(--encre); color:#fff; }
.p4b4-et button[aria-current="true"] b { color:#fff; }
.p4b4-jr { display:grid; grid-template-columns:1fr 1fr; gap:3px; }
.p4b4-jr button { border-radius:4px; background:#f1f2f5; font:600 12px var(--sans); color:var(--encre); }
.p4b4-jr button.p4b4-sg { background:#f7f8fa; color:var(--gris); font-weight:400; border:1px dashed #c9cdd6; }
.p4b4-jr button[aria-pressed="true"] { background:var(--encre); color:#fff; font-weight:700; border:0; }
.p4b4-jr button[aria-disabled="true"] { opacity:.45; }
.p4b4-rail { margin-top:26px; }
`,
  corps: `
<div class="p4b4-rep" aria-live="polite"><span class="p4b4-face">Face à ta stout</span><span class="p4b4-fl"><svg class="s-pi" width="18" height="18" style="width:18px;height:18px" data-famille="floral" aria-label="Floral"><use href="#p-floral"/></svg><span id="p4b4-fl" class="num">~+22</span></span>
  <span class="s-seg p4b4-ref" data-lecture role="radiogroup" aria-label="lecture : la colonne de droite"><button type="button" role="radio" aria-checked="true" data-ref="best">contre ★</button><button type="button" role="radio" aria-checked="false" data-ref="apres">contre après</button></span></div>
<section class="s-bloc p4b4-fig" id="p4b4-fig" aria-label="Le moment sous le pouce face à la référence, famille par famille">
  <div class="p4b4-tete"><span class="p4b4-g"><i class="s-pt"></i><span id="p4b4-tg"></span></span><span class="p4b4-vs">face à</span><span class="p4b4-d" id="p4b4-td"></span></div>
  <div id="p4b4-lignes"></div>
</section>
<div class="p4b4-bas">
  <p class="p4b4-mes" id="p4b4-mes" data-acquis="valeurs"></p>
  <nav class="p4b4-lev" aria-label="Pont vers Levure" data-acquis="levure" data-forme="pont"><a href="${OUTIL}"><b>Levure</b><span id="p4b4-lev-t"></span>${CHEV}</a></nav>
</div>
<div class="p4b4-dock" id="p4b4-dock" data-libre="moment" data-acquis="frise">
  <div class="p4b4-haut">
    <div class="p4b4-et" id="p4b4-et"></div>
    <div class="p4b4-jr" id="p4b4-jr" role="group" aria-label="Jours de contact"></div>
  </div>
  <div class="p4b4-rail" id="p4b4-rail" data-acquis="geste"></div>
</div>`,
  script: function () {
    var S = window.S, P4 = window.P4, D = S.D, N = S.N, X = window.S_DATA;
    var ref = 'best';
    var abs = function () { return document.body.classList.contains('abs'); };
    var w = function (v, f) { return abs() ? Math.min(100, v / 110 * 100) : Math.min(100, v / S.B[f] / 2 * 100); };
    var apresDe = function (p) { return D[S.idx('dryPost|' + (P4.jours(p) || 2))]; };
    var reference = function (i) { return ref === 'best' ? D[P4.best] : apresDe(D[i]); };
    var cause = function (p) { var s = P4.seg(p); return s <= 1 ? 'ch' : s === 2 ? 'co' : 'ok'; };
    var ligne = function (f) {
      return '<div class="p4b4-ba" data-f="' + f + '"><span class="p4b4-g"><span class="p4b4-p"><i class="p4b4-h"></i><i class="p4b4-b" style="background:' + S.BA[f] + '"></i><i class="p4b4-z" data-role="zone"></i></span><span class="p4b4-v"></span></span>'
        + '<span class="p4b4-n' + ({ floral: 1, herbal: 1, earthy: 1 }[f] ? ' p4b4-att' : '') + '"><b>' + S.pi(f, 14) + S.NOM[f] + '</b><small></small></span>'
        + '<span class="p4b4-d"><span class="p4b4-p"><i class="p4b4-h"></i><i class="p4b4-b" style="background:' + S.BA[f] + '"></i><i class="p4b4-e" hidden></i><i class="p4b4-z" data-role="zone"></i></span><span class="p4b4-v"></span></span></div>';
    };
    var L = document.getElementById('p4b4-lignes');
    L.innerHTML = S.ORDRE.map(ligne).join('')
      + '<div class="p4b4-ba p4b4-am" data-amer><span class="p4b4-g"><span class="p4b4-p"><i class="p4b4-zone"></i><i class="p4b4-b"></i><i class="p4b4-cru" hidden></i></span><span class="p4b4-v"></span></span><span class="p4b4-n"><b>Amertume</b><small></small></span><span class="p4b4-d"><span class="p4b4-p"><i class="p4b4-zone"></i><i class="p4b4-b"></i><i class="p4b4-cru" hidden></i></span><span class="p4b4-v"></span></span></div>';
    var pc = function (n) { return (Math.min(170, n) - 60) / 110 * 100; };
    function cote(el, p, f, c) {
      var u = S.inc(p, f), b = el.querySelector('.p4b4-b'), z = el.querySelector('.p4b4-z'), v = el.querySelector('.p4b4-v');
      el.querySelector('.p4b4-h').hidden = !u; b.hidden = u; z.style.setProperty('--z', (abs() ? S.B[f] / 110 * 100 : 50) + '%');
      if (u) { v.textContent = '?'; v.style.color = '#55555f'; return; }
      b.style.width = w(p.v[f], f) + '%'; b.className = 'p4b4-b';
      v.textContent = S.fmt(p, f); v.style.color = c === 'g' ? (S.hors(p, f) ? '#c2410c' : S.T[f]) : '';
    }
    function duel(i) {
      var p = D[i], r = reference(i), c = cause(p), meme = r === p;
      L.querySelectorAll('[data-f]').forEach(function (row) {
        var f = row.dataset.f, g = row.querySelector('.p4b4-g'), d = row.querySelector('.p4b4-d'), sm = row.querySelector('.p4b4-n small');
        row.classList.toggle('p4b4-ip', !!p.interp);
        cote(g, p, f, 'g'); cote(d, r, f, 'd');
        var e = d.querySelector('.p4b4-e'); e.hidden = true;
        if (ref === 'apres' && !S.inc(p, f) && !S.inc(r, f) && r.v[f] - p.v[f] >= 0.5 && c !== 'ok') { e.hidden = false; e.className = 'p4b4-e p4b4-' + c; e.style.setProperty('--l', w(p.v[f], f) + '%'); e.style.setProperty('--w', (w(r.v[f], f) - w(p.v[f], f)) + '%'); }
        if (meme || S.inc(p, f) || S.inc(r, f)) { sm.textContent = meme ? '=' : '?'; sm.className = ''; return; }
        var dv = p.v[f] - r.v[f], mieux = f === 'resin' ? dv < -0.5 : dv > 0.5, pire = f === 'resin' ? dv > 0.5 : dv < -0.5;
        sm.textContent = Math.abs(dv) < 0.5 ? '=' : (p.interp ? '≈' : '~') + (dv > 0 ? '+' : '−') + Math.abs(Math.round(dv));
        sm.className = pire ? 'p4b4-moins' : mieux ? 'p4b4-plus' : '';
      });
      var am = L.querySelector('[data-amer]');
      [[am.querySelector('.p4b4-g'), p], [am.querySelector('.p4b4-d'), r]].forEach(function (x) {
        var bb = S.ibu(x[1]), b = x[0].querySelector('.p4b4-b'), v = x[0].querySelector('.p4b4-v');
        b.style.width = pc(bb.n) + '%'; b.classList.toggle('p4b4-trop', bb.h); b.style.opacity = bb.ip ? .55 : '';
        x[0].querySelector('.p4b4-cru').hidden = !bb.cru; v.textContent = bb.cru ? '60+?' : bb.t.replace(' IBU', ''); v.classList.toggle('p4b4-trop', bb.h && x[0].classList.contains('p4b4-g'));
      });
      var sm = am.querySelector('.p4b4-n small'), bp = S.ibu(p);
      sm.textContent = meme ? '=' : bp.h ? 'trop amer' : bp.cru ? '' : 'tenue'; sm.className = bp.h ? 'p4b4-moins' : '';
      document.getElementById('p4b4-tg').textContent = (i === P4.best ? '★ ' : '') + p.lib;
      var td = document.getElementById('p4b4-td'); td.className = 'p4b4-d' + (ref === 'apres' ? ' p4b4-ap' : ''); td.textContent = (ref === 'best' ? '★ ' : '') + r.lib;
    }
    // Zones d'amertume (gauche et droite) : la bande 50–70, à droite du 60 de ta stout.
    L.querySelectorAll('.p4b4-am .p4b4-zone').forEach(function (z, n) { z.style.width = pc(70) + '%'; z.style[n === 0 ? 'right' : 'left'] = '0'; });
    L.querySelectorAll('.p4b4-am .p4b4-cru').forEach(function (z, n) { z.style.width = '14%'; z.style[n === 0 ? 'right' : 'left'] = '0'; });
    // Les étapes : l'écart de floral contre ★ ; les jours de contact.
    var ET = [['b60', '60′–0′', 0], ['wp', 'WP', 1], ['dryActive|2', 'actif', 2], ['dryPost|2', 'après', 3]];
    var et = document.getElementById('p4b4-et'), q = D[P4.best];
    var ecart = function (p) { var d = Math.round(p.v.floral - q.v.floral); return (d > 0 ? '+' : d < 0 ? '−' : '') + Math.abs(d); };
    et.innerHTML = ET.map(function (e) {
      var p = D[S.idx(e[0])], t = S.idx(e[0]) === P4.best ? '<b class="p4b4-star">★</b>' : '<b' + (p.v.floral < q.v.floral - 0.5 ? ' class="p4b4-moins"' : '') + '>' + ecart(p) + (e[0] === 'b60' ? '…' + ecart(D[S.idx('b0')]) : '') + '</b>';
      return '<button type="button" data-etape="' + e[2] + '" data-saut="' + e[0] + '" aria-label="Moment : ' + e[1] + '"><span>' + e[1] + '</span>' + t + '</button>';
    }).join('');
    var JR = [1, 2, 3, 7], jr = document.getElementById('p4b4-jr');
    jr.innerHTML = JR.map(function (j) { return '<button type="button" data-jour="' + j + '" aria-pressed="false">' + j + ' j</button>'; }).join('');
    function majDock(p) {
      et.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-current', String(+b.dataset.etape === P4.seg(p))); });
      var s = P4.seg(p), dj = P4.jours(p);
      jr.querySelectorAll('button').forEach(function (b) {
        var j = +b.dataset.jour, on = s >= 2;
        b.setAttribute('aria-disabled', String(!on)); b.setAttribute('aria-pressed', String(on && j === dj));
        var qq = on ? D[S.idx(p.id.split('|')[0] + '|' + j)] : null, pr = on && j > 1 ? D[S.idx(p.id.split('|')[0] + '|' + JR[JR.indexOf(j) - 1])] : null;
        b.classList.toggle('p4b4-sg', !!(qq && pr && Math.abs(qq.v.floral - pr.v.floral) < 0.1));
      });
    }
    function mesure(p) { var m = document.getElementById('p4b4-mes'), r = P4.mesure(p); m.classList.toggle('p4b4-jamais', !r.ok); m.innerHTML = (r.ok && P4.seg(p) === 2 ? S.pi('floral', 14) : '') + '<span>' + r.html + '</span>'; }
    function levure(p) {
      var dd = X.POMONA[p.id] || null, f2 = null;
      if (dd) for (var f in dd) if (!f2 || Math.abs(dd[f]) > Math.abs(dd[f2])) f2 = f;
      document.getElementById('p4b4-lev-t').textContent = dd && Math.abs(dd[f2]) >= 0.5 ? 'Pomona ~+' + Math.round(dd[f2]) + ' ' + S.NOM[f2].toLowerCase() : 'rien ne change ici';
    }
    var R = P4.rail(document.getElementById('p4b4-rail'), {
      calcules: true,
      surPoser: function (i, p) { duel(i); majDock(p); mesure(p); levure(p); document.getElementById('p4b4-fl').textContent = S.fmt(p, 'floral'); },
      loupe: function (i) {
        var out = [], r = reference(i);
        for (var k = i - 2; k <= i + 2; k++) {
          if (k < 0 || k > N) continue; var p = D[k], dv = Math.round(p.v.floral - r.v.floral);
          out.push({ k: k, html: '<em>' + P4.court(p) + '</em><i><b style="width:' + Math.min(100, p.v.floral / 25 * 100).toFixed(0) + '%"></b></i><small' + (dv < 0 ? ' class="p4r-amer"' : dv > 0 ? ' class="p4r-ok"' : '') + '>' + (Math.abs(dv) < 1 ? '=' : (p.interp ? '≈' : '~') + (dv > 0 ? '+' : '−') + Math.abs(dv)) + '</small>' });
        }
        return out;
      },
    });
    document.querySelectorAll('[data-ref]').forEach(function (b) { b.addEventListener('click', function () { ref = b.dataset.ref; document.querySelectorAll('[data-ref]').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); }); R.rafraichir(); }); });
    et.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { var p = D[R.cur()]; if (P4.seg(p) === +b.dataset.etape) return; R.poser(S.idx(b.dataset.saut.indexOf('dry') === 0 && P4.jours(p) ? b.dataset.saut.split('|')[0] + '|' + P4.jours(p) : b.dataset.saut)); }); });
    jr.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { var p = D[R.cur()]; if (P4.seg(p) < 2) return; R.poser(S.idx(p.id.split('|')[0] + '|' + b.dataset.jour)); }); });
    S.surLecture(function () { duel(R.cur()); });
    var dk = document.getElementById('p4b4-dock'), haut = function () { document.body.style.setProperty('--dock', dk.offsetHeight + 'px'); };
    haut(); addEventListener('resize', haut);
    if (/ref=apres/.test(location.search)) document.querySelector('[data-ref="apres"]').click();
    window.P4ETAT = function () { var p = D[R.cur()]; return { m: p.lib, fl: S.fmt(p, 'floral'), am: L.querySelector('[data-amer] .p4b4-g .p4b4-v').textContent, ref: document.getElementById('p4b4-td').textContent, ecartFloral: L.querySelector('[data-f="floral"] small').textContent, lev: document.getElementById('p4b4-lev-t').textContent, mes: document.getElementById('p4b4-mes').textContent }; };
  },
});
