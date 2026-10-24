// p4b1 · chaude · « Gardé · emporté ». Sur a1 : les barres l5b restent, mais chaque barre montre deux choses : ce que le
// moment GARDE (plein, couleur de la famille) et ce que la chaleur (flamme, hachure orangée) ou le CO₂ de fermentation
// (bulles, pointillé bleu-gris) EMPORTE, jusqu'à ce qu'aurait donné le dry hop après fermentation de même durée.
// Améliorations prises : 2 (le contour chaleur / CO₂ devient la figure), 4 (Pépins et Melon visibles, hachurés « ? »,
// jamais zéro), 6 (lecture sans légende : la flamme et les bulles disent la cause ; une rangée par ligne).
// Greffes : queue hachurée de d2 ; « le CO₂ emporte ~−6 résineux » de d1 ; « la vapeur emporte… » de f6 en pastilles ;
// loupe et sauts d'a1. Classes préfixées p4b1- (L26).
import { rendre, OUTIL, CHEV, FLAMME, BULLES } from '../p4b-commun/socle-p4b.mjs';

rendre({
  id: 'p4b1', nom: 'Gardé · emporté', chaleur: 'chaude', titre: 'Quand ajouter Idaho 7 ?',
  legende: [
    'Glisse le pouce sur le rail, de 60′ à après 7 j, par 5′ ; la loupe chiffre les moments voisins.',
    'Barre pleine : ce que ta stout garde d\'Idaho 7 à ce moment. Queue : ce que la chaleur (flamme, orangé) ou le CO₂ de fermentation (bulles, pointillé) emporte, face au dry hop après fermentation de même durée.',
    'Rond : ta stout avant. Zone grise : la moitié du style. Hachuré « ? » : jamais décrit dans les fiches, pas zéro.',
    'Pastilles : ce que chaque étape emporte de floral. ★ : le meilleur pour ta demande du 18.10 (plus floral, moins résineux, 50–70 IBU).',
    'Mesuré : linalol avec Idaho 7 dès le levurage (McCabe 2023). ~ simulé · ≈ interpolé entre 60′, 10′ et whirlpool.',
  ],
  css: `
body.p4b1 { padding-bottom:var(--dock,150px); }
.p4b1 .s-ecran { min-height:calc(100svh - var(--dock,150px)); gap:5px; padding-bottom:6px; }
.p4b1-rep { display:flex; flex-wrap:wrap; align-items:center; gap:4px 8px; font-size:16px; }
.p4b1-face { font-weight:600; }
.p4b1-fl { display:inline-flex; align-items:center; gap:4px; color:#9840bc; font-weight:700; }
.p4b1-emp { margin-left:auto; display:inline-flex; align-items:center; gap:5px; height:26px; padding:0 9px; border-radius:13px; font:600 13px var(--sans); background:#fff; border:1px solid #d5d8df; color:var(--gris); }
.p4b1-emp.p4b1-ch { color:var(--acc); border-color:#f2b89a; background:#fff4ee; }
.p4b1-emp.p4b1-co { color:#3b5f8a; border-color:#b9cbe3; background:#eef4fb; }
.p4b1-emp.p4b1-ok { color:#2f6b5f; border-color:#b7d8cf; background:#edf7f3; }
.p4b1-emp b { font-family:var(--mono); font-weight:600; }
.p4b1-fig { flex:1; justify-content:space-between; gap:0; padding:6px 10px; }
.p4b1-ba { display:grid; grid-template-columns:92px 1fr 48px; align-items:center; gap:6px; font-size:14px; min-height:25px; }
.p4b1-n { display:flex; align-items:center; gap:4px; white-space:nowrap; }
.p4b1-n.p4b1-att { font-weight:700; }
.p4b1-v { text-align:right; font:600 13px var(--mono); white-space:nowrap; line-height:1.05; }
.p4b1-v small { display:block; font:500 11px var(--mono); color:var(--gris); }
.p4b1-v small.p4b1-ch { color:var(--acc); }
.p4b1-v small.p4b1-co { color:#3b5f8a; }
.p4b1-p { position:relative; height:18px; background:#f1f2f5; border-radius:2px; overflow:hidden; }
.p4b1-p i { position:absolute; top:0; bottom:0; left:0; display:block; }
.p4b1-p .p4b1-z { width:var(--ws); background:#d9dce3; }
.p4b1-p .p4b1-b { width:var(--ws); top:3px; height:12px; border-radius:2px 0 0 2px; transition:width .18s cubic-bezier(.2,.8,.2,1); }
.p4b1-ip .p4b1-p .p4b1-b { opacity:.5; }
.p4b1-p .p4b1-q { left:var(--qs); width:var(--qw); top:3px; height:12px; border-radius:0 2px 2px 0; transition:left .18s, width .18s; }
.p4b1-p .p4b1-q.p4b1-ch { background:repeating-linear-gradient(135deg,#c2410c 0 2px,#fde4d6 2px 5px); }
.p4b1-p .p4b1-q.p4b1-co { background:radial-gradient(circle at 3px 3px,#3b5f8a 1.3px,transparent 1.6px) 0 0/6px 6px, #dfe8f4; }
.p4b1-p .p4b1-av { left:clamp(8px, var(--ws), calc(100% - 8px)); width:16px; height:16px; top:1px; border-radius:50%; border:2px solid var(--encre); background:#fff; margin-left:-7px; z-index:1; }
.p4b1-p .p4b1-h { right:0; background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }
body.abs .p4b1-p .p4b1-z, body.abs .p4b1-p .p4b1-b { width:var(--wa); }
body.abs .p4b1-p .p4b1-q { left:var(--qa); width:var(--qwa); }
body.abs .p4b1-p .p4b1-av { left:clamp(7px, var(--wa), calc(100% - 7px)); }
.p4b1-am .p4b1-p .p4b1-jz { left:29.4%; width:11.8%; background:#d9dce3; }
.p4b1-am .p4b1-p .p4b1-jb { left:0; width:35.3%; top:3px; height:12px; background:#8a8f9c; border-radius:2px; }
.p4b1-am .p4b1-p .p4b1-ja { left:35.3%; top:3px; height:12px; background:var(--encre); border-radius:2px; transition:width .18s; }
.p4b1-am .p4b1-p .p4b1-ja.p4b1-trop { background:var(--acc); }
.p4b1-am .p4b1-p .p4b1-ja.p4b1-ipb { opacity:.55; }
.p4b1-am .p4b1-p .p4b1-cru { left:35.3%; width:8%; top:3px; height:12px; background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }
.p4b1-am .p4b1-v.p4b1-trop { color:var(--acc); }
.p4b1-bas { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.p4b1-mes { display:flex; align-items:center; gap:5px; font-size:12px; color:var(--gris); min-width:0; }
.p4b1-mes b { color:var(--encre); font-weight:600; }
.p4b1-mes.p4b1-jamais { padding:1px 6px; border-radius:4px; background:#e2e5eb; }
.p4b1-lev a { display:inline-flex; align-items:center; gap:5px; height:30px; padding:0 12px; border-radius:15px; background:#fff; border:1px solid #c9cad2; font-size:13px; white-space:nowrap; }
.p4b1-lev a b { font-weight:700; }
.p4b1-dock { position:fixed; left:50%; bottom:0; transform:translateX(-50%); width:min(390px,100%); background:#fff; border-top:1px solid var(--trait); box-shadow:0 -12px 40px -16px rgba(22,22,26,.35); padding:6px 12px 8px; z-index:20; }
.p4b1-haut { display:grid; grid-template-columns:1fr 84px; gap:6px; align-items:stretch; }
.p4b1-et { display:grid; grid-template-columns:repeat(4,1fr); gap:3px; }
.p4b1-et button { position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2px 0 3px; border-radius:4px; background:#f1f2f5; font-size:12px; color:var(--gris); line-height:1.15; }
.p4b1-et button b { display:inline-flex; align-items:center; gap:2px; font:600 12px var(--mono); color:var(--gris); }
.p4b1-et button b.p4b1-ch { color:var(--acc); }
.p4b1-et button b.p4b1-co { color:#3b5f8a; }
.p4b1-et button b.p4b1-ok { color:#2f6b5f; }
.p4b1-et button[aria-current="true"] { background:var(--encre); color:#fff; }
.p4b1-et button[aria-current="true"] b { color:#fff; }
.p4b1-jr { display:grid; grid-template-columns:1fr 1fr; gap:3px; }
.p4b1-jr button { border-radius:4px; background:#f1f2f5; font:600 12px var(--sans); color:var(--encre); }
.p4b1-jr button.p4b1-sg { background:#f7f8fa; color:var(--gris); font-weight:400; border:1px dashed #c9cdd6; }
.p4b1-jr button[aria-pressed="true"] { background:var(--encre); color:#fff; font-weight:700; border:0; }
.p4b1-jr button[aria-disabled="true"] { opacity:.45; }
.p4b1-strip { position:relative; height:28px; margin-top:5px; }
.p4b1-strip i { position:absolute; bottom:0; width:var(--cw); margin-left:calc(var(--cw) / -2); border-radius:2px 2px 0 0; background:#f1f2f5; height:100%; }
.p4b1-strip i b { position:absolute; left:1px; right:1px; bottom:0; border-radius:2px 2px 0 0; background:#bf86d6; }
.p4b1-strip i u { position:absolute; left:1px; right:1px; bottom:var(--g); height:var(--e); }
.p4b1-strip i u.p4b1-ch { background:repeating-linear-gradient(135deg,#c2410c 0 1.5px,#fde4d6 1.5px 4px); }
.p4b1-strip i u.p4b1-co { background:radial-gradient(circle at 2px 2px,#3b5f8a 1px,transparent 1.3px) 0 0/4px 4px, #dfe8f4; }
.p4b1-strip i.p4b1-ip b { opacity:.5; }
.p4b1-strip i.p4b1-ici { background:#e2e5eb; }
.p4b1-strip .p4b1-star { position:absolute; top:-2px; font-size:11px; color:#2f6b5f; transform:translateX(-50%); font-weight:700; }
`,
  corps: `
<div class="p4b1-rep" aria-live="polite"><span class="p4b1-face">Face à ta stout</span><span class="p4b1-fl"><svg class="s-pi" width="18" height="18" style="width:18px;height:18px" data-famille="floral" aria-label="Floral"><use href="#p-floral"/></svg><span id="p4b1-fl" class="num">~+22</span></span>
  <span class="p4b1-emp" id="p4b1-emp"></span></div>
<section class="s-bloc p4b1-fig" id="p4b1-fig" aria-label="Ce que ta stout garde et ce que la chaleur ou le CO₂ emporte, famille par famille"></section>
<div class="p4b1-bas">
  <p class="p4b1-mes" id="p4b1-mes" data-acquis="valeurs"></p>
  <nav class="p4b1-lev" aria-label="Pont vers Levure" data-acquis="levure" data-forme="pont"><a href="${OUTIL}"><b>Levure</b><span id="p4b1-lev-t"></span>${CHEV}</a></nav>
</div>
<div class="p4b1-dock" id="p4b1-dock" data-libre="moment" data-acquis="frise">
  <div class="p4b1-haut">
    <div class="p4b1-et" id="p4b1-et"></div>
    <div class="p4b1-jr" id="p4b1-jr" role="group" aria-label="Jours de contact"></div>
  </div>
  <div class="p4b1-strip" id="p4b1-strip" aria-hidden="true"></div>
  <div id="p4b1-rail" data-acquis="geste"></div>
</div>`,
  script: function () {
    var S = window.S, P4 = window.P4, D = S.D, N = S.N, X = window.S_DATA;
    var FL = window.P4SVG.FLAMME, BU = window.P4SVG.BULLES, FL11 = window.P4SVG.FLAMME11, BU11 = window.P4SVG.BULLES11;
    var abs = function () { return document.body.classList.contains('abs'); };
    var w = function (v, f) { return abs() ? Math.min(100, v / 110 * 100) : Math.min(100, v / S.B[f] / 2 * 100); };
    // La référence « tout gardé » : le dry hop après fermentation, mêmes jours (2 j pour l'ébullition et le whirlpool).
    var refDe = function (p) { if (P4.seg(p) === 3) return null; return D[S.idx('dryPost|' + (P4.jours(p) || 2))]; };
    var cause = function (p) { var s = P4.seg(p); return s <= 1 ? 'ch' : s === 2 ? 'co' : 'ok'; };
    var perte = function (p, f) { var r = refDe(p); if (!r || S.inc(p, f) || S.inc(r, f)) return 0; return Math.max(0, r.v[f] - p.v[f]); };
    var ligne = function (f) {
      return '<div class="p4b1-ba" data-f="' + f + '"><span class="p4b1-n' + ({ floral: 1, herbal: 1, earthy: 1 }[f] ? ' p4b1-att' : '') + '">' + S.pi(f) + '<span>' + S.NOM[f] + '</span></span>'
        + '<span class="p4b1-p"><i class="p4b1-z" data-role="zone" style="--ws:50%;--wa:' + (S.B[f] / 110 * 100).toFixed(1) + '%"></i><i class="p4b1-b" style="background:' + S.BA[f] + '"></i><i class="p4b1-q"></i>'
        + '<i class="p4b1-av" style="--ws:' + w(S.AV[f], f).toFixed(1) + '%;--wa:' + Math.min(100, S.AV[f] / 110 * 100).toFixed(1) + '%"></i><i class="p4b1-h"></i></span><span class="p4b1-v"></span></div>';
    };
    var fig = document.getElementById('p4b1-fig');
    fig.innerHTML = S.ORDRE.map(ligne).join('')
      + '<div class="p4b1-ba p4b1-am" data-amer><span class="p4b1-n">Amertume</span><span class="p4b1-p"><i class="p4b1-jz"></i><i class="p4b1-jb"></i><i class="p4b1-ja"></i><i class="p4b1-cru" hidden></i></span><span class="p4b1-v" id="p4b1-amv"></span></div>';
    function barres(i) {
      var p = D[i], c = cause(p);
      fig.querySelectorAll('[data-f]').forEach(function (r) {
        var f = r.dataset.f, u = S.inc(p, f), b = r.querySelector('.p4b1-b'), q = r.querySelector('.p4b1-q'), v = r.querySelector('.p4b1-v');
        r.classList.toggle('p4b1-ip', !!p.interp); b.hidden = u; r.querySelector('.p4b1-h').hidden = !u; q.hidden = true;
        if (u) { v.innerHTML = '?'; v.style.color = '#55555f'; return; }
        var s0 = Math.min(100, p.v[f] / S.B[f] / 2 * 100), a0 = Math.min(100, p.v[f] / 110 * 100);
        b.style.setProperty('--ws', s0 + '%'); b.style.setProperty('--wa', a0 + '%');
        var pe = perte(p, f), r0 = refDe(p);
        if (pe >= 0.5) {
          var s1 = Math.min(100, r0.v[f] / S.B[f] / 2 * 100), a1 = Math.min(100, r0.v[f] / 110 * 100);
          q.hidden = false; q.className = 'p4b1-q p4b1-' + c;
          q.style.setProperty('--qs', s0 + '%'); q.style.setProperty('--qw', (s1 - s0) + '%'); q.style.setProperty('--qa', a0 + '%'); q.style.setProperty('--qwa', (a1 - a0) + '%');
        }
        v.innerHTML = S.fmt(p, f) + (pe >= 0.5 ? '<small class="p4b1-' + c + '">' + (p.interp ? '≈' : '~') + '−' + Math.round(pe) + '</small>' : '');
        v.style.color = S.hors(p, f) ? '#c2410c' : S.T[f];
      });
      var bb = S.ibu(p), ja = fig.querySelector('.p4b1-ja'), av = document.getElementById('p4b1-amv');
      ja.style.width = (Math.min(170, bb.n) - 60) / 170 * 100 + '%'; ja.classList.toggle('p4b1-trop', bb.h); ja.classList.toggle('p4b1-ipb', !!bb.ip);
      fig.querySelector('.p4b1-cru').hidden = !bb.cru;
      av.textContent = bb.cru ? '60+?' : bb.t.replace(' IBU', ''); av.classList.toggle('p4b1-trop', bb.h);
    }
    // La pastille « emporté » de la ligne de réponse : la cause et les deux pertes les plus lourdes.
    function emporte(p) {
      var e = document.getElementById('p4b1-emp'), c = cause(p), sg = p.interp ? '≈' : '~';
      if (c === 'ok') { e.className = 'p4b1-emp p4b1-ok'; e.innerHTML = 'tout reste'; return; }
      var pf = perte(p, 'floral'), pr = perte(p, 'resin');
      e.className = 'p4b1-emp p4b1-' + c;
      e.innerHTML = (c === 'ch' ? FL : BU) + '<b>' + sg + '−' + Math.round(pf) + '</b><span style="color:' + S.T.floral + ';display:inline-flex">' + S.pi('floral', 13) + '</span>' + (pr >= 0.5 ? '<b>' + sg + '−' + Math.round(pr) + '</b><span style="color:' + S.T.resin + ';display:inline-flex">' + S.pi('resin', 13) + '</span>' : '');
    }
    // Les étapes : ce que chacune emporte de floral (f6), ★ sur la meilleure ; les jours de contact en fin de frise.
    var ET = [['b60', '60′–0′', 0], ['wp', 'WP', 1], ['dryActive|2', 'actif', 2], ['dryPost|2', 'après', 3]];
    var et = document.getElementById('p4b1-et');
    et.innerHTML = ET.map(function (e) {
      var p = D[S.idx(e[0])], c = cause(p), pf = perte(p, 'floral'), pf2 = e[0] === 'b60' ? perte(D[S.idx('b0')], 'floral') : null;
      var t = c === 'ok' ? '<b class="p4b1-ok">★ 0</b>' : '<b class="p4b1-' + c + '">' + (c === 'ch' ? FL11 : BU11) + '−' + Math.round(pf) + (pf2 != null ? '…' + Math.round(pf2) : '') + '</b>';
      return '<button type="button" data-etape="' + e[2] + '" data-saut="' + e[0] + '" aria-label="Moment : ' + e[1] + '"><span>' + e[1] + '</span>' + t + '</button>';
    }).join('');
    var JR = [1, 2, 3, 7], jr = document.getElementById('p4b1-jr');
    jr.innerHTML = JR.map(function (j) { return '<button type="button" data-jour="' + j + '" aria-pressed="false">' + j + ' j</button>'; }).join('');
    function majDock(p) {
      et.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-current', String(+b.dataset.etape === P4.seg(p))); });
      var s = P4.seg(p), dj = P4.jours(p);
      jr.querySelectorAll('button').forEach(function (b) {
        var j = +b.dataset.jour, on = s >= 2;
        b.setAttribute('aria-disabled', String(!on)); b.setAttribute('aria-pressed', String(on && j === dj));
        var q = on ? D[S.idx(p.id.split('|')[0] + '|' + j)] : null, pr = on && j > 1 ? D[S.idx(p.id.split('|')[0] + '|' + JR[JR.indexOf(j) - 1])] : null;
        b.classList.toggle('p4b1-sg', !!(q && pr && Math.abs(q.v.floral - pr.v.floral) < 0.1));
      });
    }
    // La bande au-dessus du rail : à chaque moment, le floral gardé (plein) et l'emporté (queue hachurée ou pointillée).
    var strip = document.getElementById('p4b1-strip'), h = '', M = 26;
    for (var k = 0; k <= N; k++) {
      var p = D[k], g = p.v.floral / M * 100, e = perte(p, 'floral') / M * 100, c = cause(p);
      h += '<i class="' + (p.interp ? 'p4b1-ip' : '') + '" data-k="' + k + '" style="left:' + P4.x(k) + '%;--cw:' + P4.cw(k).toFixed(2) + '%"><b style="height:' + g.toFixed(0) + '%"></b>' + (e > 2 ? '<u class="p4b1-' + c + '" style="--g:' + g.toFixed(0) + '%;--e:' + e.toFixed(0) + '%"></u>' : '') + '</i>';
    }
    h += '<span class="p4b1-star" style="left:' + P4.x(P4.best) + '%">★</span>';
    strip.innerHTML = h;
    function mesure(p) { var m = document.getElementById('p4b1-mes'), r = P4.mesure(p); m.classList.toggle('p4b1-jamais', !r.ok); m.innerHTML = (r.ok && P4.seg(p) === 2 ? S.pi('floral', 14) : '') + '<span>' + r.html + '</span>'; }
    function levure(p) {
      var dd = X.POMONA[p.id] || null, f2 = null;
      if (dd) for (var f in dd) if (!f2 || Math.abs(dd[f]) > Math.abs(dd[f2])) f2 = f;
      document.getElementById('p4b1-lev-t').textContent = dd && Math.abs(dd[f2]) >= 0.5 ? 'Pomona ~+' + Math.round(dd[f2]) + ' ' + S.NOM[f2].toLowerCase() : 'rien ne change ici';
    }
    var R = P4.rail(document.getElementById('p4b1-rail'), {
      calcules: true,
      surPoser: function (i, p) {
        barres(i); emporte(p); majDock(p); mesure(p); levure(p);
        strip.querySelectorAll('i').forEach(function (c) { c.classList.toggle('p4b1-ici', +c.dataset.k === i); });
        document.getElementById('p4b1-fl').textContent = S.fmt(p, 'floral');
      },
      loupe: function (i) {
        var out = [];
        for (var k = i - 2; k <= i + 2; k++) {
          if (k < 0 || k > N) continue; var p = D[k], pe = perte(p, 'floral'), c = cause(p);
          out.push({ k: k, html: '<em>' + P4.court(p) + '</em><i><b style="width:' + Math.min(100, p.v.floral / 25 * 100).toFixed(0) + '%"></b></i><small' + (pe >= 0.5 ? ' class="p4r-' + (c === 'ch' ? 'amer' : 'co') + '"' : '') + '>' + (pe >= 0.5 ? (p.interp ? '≈' : '~') + '−' + Math.round(pe) : S.fmt(p, 'floral')) + '</small>' });
        }
        return out;
      },
    });
    et.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { var p = D[R.cur()]; if (P4.seg(p) === +b.dataset.etape) return; R.poser(S.idx(b.dataset.saut.indexOf('dry') === 0 && P4.jours(p) ? b.dataset.saut.split('|')[0] + '|' + P4.jours(p) : b.dataset.saut)); }); });
    jr.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { var p = D[R.cur()]; if (P4.seg(p) < 2) return; R.poser(S.idx(p.id.split('|')[0] + '|' + b.dataset.jour)); }); });
    S.surLecture(function () { barres(R.cur()); });
    var dk = document.getElementById('p4b1-dock'), haut = function () { document.body.style.setProperty('--dock', dk.offsetHeight + 'px'); };
    haut(); addEventListener('resize', haut);
    window.P4ETAT = function () { var p = D[R.cur()]; return { m: p.lib, fl: S.fmt(p, 'floral'), am: document.getElementById('p4b1-amv').textContent, emporte: document.getElementById('p4b1-emp').textContent.trim(), lev: document.getElementById('p4b1-lev-t').textContent, mes: document.getElementById('p4b1-mes').textContent }; };
  },
});
