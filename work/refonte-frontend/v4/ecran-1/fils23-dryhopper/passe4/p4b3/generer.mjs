// p4b3 · chaude · « L'agenda du brassin ». Sur a1 : le rail devient le calendrier du brasseur : le jour du brassage
// (ébullition 60′ → 0′, whirlpool), puis J+1 à J+14. Sur les jours, la courbe de densité de la levure (active J+1 → J+5,
// puis finie). Le houblon est posé là où il entre (picto plein) ; la bande colorée dit combien de temps il reste dans
// la bière, et elle pâlit là où rien ne bouge plus (« sans gain »). Dans l'ébullition, le pouce place l'entrée et la
// bande court jusqu'à 0′ ; en dry hop, l'entrée est fixée par la fermentation (J+2 actif, J+7 après) et le pouce
// tire la bande : la durée de contact est la suite naturelle du moment, sans second geste.
// Améliorations prises : 3 (la courbe de levure sur la frise, actif / après lisible sans mot), 5 (la durée de contact
// absorbée par le geste du moment), 1 (crans interpolés en pointillé dans la bande de l'ébullition, points calculés pleins).
// Greffes : agenda de f5 ; houblon posé sur la courbe de g6 ; « sans gain » de e2 ; « le meilleur » rappelé de g4 ;
// barres, loupe et sauts d'a1. Classes préfixées p4b3- (L26).
import { rendre, OUTIL, CHEV } from '../p4b-commun/socle-p4b.mjs';

rendre({
  id: 'p4b3', nom: 'L\'agenda du brassin', chaleur: 'chaude', titre: 'Quand ajouter Idaho 7 ?',
  legende: [
    'L\'agenda : le jour du brassage (ébullition de 60′ à 0′ par 5′, whirlpool), puis les jours de fermentation J+1 à J+14.',
    'Courbe : la densité, donc l\'activité de la levure ; active de J+1 à J+5 environ (biotransformation possible, non quantifiée), à confirmer à ta densité.',
    'Picto plein : là où Idaho 7 entre. Bande : le temps où il reste dans la bière ; pâle : plus aucun gain. Glisse le pouce : dans l\'ébullition tu choisis l\'entrée, en dry hop tu tires la durée.',
    'Barres : les 12 familles au style ; rond : avant ; hachuré « ? » : jamais décrit, pas zéro. Contour : ce que la chaleur ou le CO₂ emporte face au dry hop après.',
    '★ : le meilleur pour ta demande du 18.10 (plus floral, moins résineux, 50–70 IBU). Mesuré : linalol dès le levurage (McCabe 2023).',
  ],
  css: `
body.p4b3 { padding-bottom:var(--dock,150px); }
.p4b3 .s-ecran { min-height:calc(100svh - var(--dock,150px)); gap:5px; padding-bottom:6px; }
.p4b3-rep { display:flex; flex-wrap:wrap; align-items:center; gap:2px 8px; font-size:16px; }
.p4b3-face { font-weight:600; }
.p4b3-fl { display:inline-flex; align-items:center; gap:4px; color:#9840bc; font-weight:700; }
.p4b3-quand { margin-left:auto; display:inline-flex; align-items:center; gap:5px; height:26px; padding:0 10px; border-radius:13px; background:var(--encre); color:#fff; font:600 13px var(--sans); }
.p4b3-quand.p4b3-best { background:#2f6b5f; }
.p4b3-quand .s-pt { border:1.5px solid #fff; }
.p4b3-contre { flex-basis:100%; font-size:13px; color:var(--gris); }
.p4b3-contre b { color:var(--encre); }
.p4b3-contre .p4b3-moins { color:var(--acc); font-weight:600; }
.p4b3-fig { flex:1; justify-content:space-between; gap:0; padding:6px 10px; }
.p4b3-ba { display:grid; grid-template-columns:92px 1fr 44px; align-items:center; gap:2px 6px; font-size:14px; padding:1px 0; }
.p4b3-n { display:flex; align-items:center; gap:4px; white-space:nowrap; grid-row:span 2; }
.p4b3-v { grid-row:span 2; }
.p4b3-rb { position:relative; height:11px; }
.p4b3-rb i { position:absolute; top:0; bottom:0; width:var(--cw); margin-left:calc(var(--cw) / -2); border-radius:2px; display:block; }
.p4b3-rb i.p4b3-hs { box-shadow:inset 0 -2px 0 var(--acc); }
.p4b3-rb i.p4b3-la { outline:1.5px solid var(--encre); outline-offset:0; z-index:1; }
.p4b3-n.p4b3-att { font-weight:700; }
.p4b3-v { text-align:right; font:600 13px var(--mono); white-space:nowrap; }
.p4b3-p { position:relative; height:16px; background:#f1f2f5; border-radius:2px; overflow:hidden; }
.p4b3-p i { position:absolute; top:0; bottom:0; left:0; display:block; }
.p4b3-p .p4b3-z { width:var(--ws); background:#d9dce3; }
.p4b3-p .p4b3-q { left:var(--qs); width:var(--qw); top:3px; height:12px; border:1.5px solid var(--c); border-left:0; border-radius:0 2px 2px 0; background:#fff; }
.p4b3-p .p4b3-b { width:var(--ws); top:3px; height:12px; border-radius:2px; transition:width .18s cubic-bezier(.2,.8,.2,1); }
.p4b3-ip .p4b3-p .p4b3-b { opacity:.5; }
.p4b3-p .p4b3-av { left:clamp(8px, var(--ws), calc(100% - 8px)); width:16px; height:16px; top:1px; border-radius:50%; border:2px solid var(--encre); background:#fff; margin-left:-7px; }
.p4b3-p .p4b3-h { right:0; background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }
body.abs .p4b3-p .p4b3-z, body.abs .p4b3-p .p4b3-b { width:var(--wa); }
body.abs .p4b3-p .p4b3-q { left:var(--qa); width:var(--qwa); }
body.abs .p4b3-p .p4b3-av { left:clamp(7px, var(--wa), calc(100% - 7px)); }
.p4b3-am .p4b3-p .p4b3-jz { left:29.4%; width:11.8%; background:#d9dce3; }
.p4b3-am .p4b3-p .p4b3-jb { left:0; width:35.3%; top:3px; height:12px; background:#8a8f9c; border-radius:2px; }
.p4b3-am .p4b3-p .p4b3-ja { left:35.3%; top:3px; height:12px; background:var(--encre); border-radius:2px; transition:width .18s; }
.p4b3-am .p4b3-p .p4b3-ja.p4b3-trop { background:var(--acc); }
.p4b3-am .p4b3-p .p4b3-ja.p4b3-ipb { opacity:.55; }
.p4b3-am .p4b3-p .p4b3-cru { left:35.3%; width:8%; top:3px; height:12px; background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px); }
.p4b3-am .p4b3-v.p4b3-trop { color:var(--acc); }
.p4b3-bas { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.p4b3-mes { display:flex; align-items:center; gap:5px; font-size:12px; color:var(--gris); min-width:0; }
.p4b3-mes b { color:var(--encre); font-weight:600; }
.p4b3-mes.p4b3-jamais { padding:1px 6px; border-radius:4px; background:#e2e5eb; }
.p4b3-lev a { display:inline-flex; align-items:center; gap:5px; height:30px; padding:0 12px; border-radius:15px; background:#fff; border:1px solid #c9cad2; font-size:13px; white-space:nowrap; }
.p4b3-lev a b { font-weight:700; }
.p4b3-dock { position:fixed; left:50%; bottom:0; transform:translateX(-50%); width:min(390px,100%); background:#fff; border-top:1px solid var(--trait); box-shadow:0 -12px 40px -16px rgba(22,22,26,.35); padding:6px 12px 8px; z-index:20; }
.p4b3-ag-t { position:relative; height:38px; font-size:12px; color:var(--gris); }
.p4b3-ag-t span { position:absolute; white-space:nowrap; }
.p4b3-ag-t .p4b3-on { top:1px; transform:translateX(-50%); color:var(--encre); font-weight:700; }
.p4b3-ag-t .p4b3-j { top:21px; transform:translateX(-50%); font:600 12px var(--mono); }
.p4b3-ag-t .p4b3-j.p4b3-g { transform:none; }
.p4b3-ag-t .p4b3-j.p4b3-d { transform:translateX(-100%); }
.p4b3-ag { position:relative; height:84px; }
.p4b3-ag svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; }
.p4b3-ag svg text { font-family:var(--sans); font-size:12px; fill:var(--gris); }
.p4b3-ag svg text.p4b3-j { font-family:var(--mono); font-weight:600; }
.p4b3-ag svg text.p4b3-on { fill:var(--encre); font-weight:700; }
.p4b3-ag svg .p4b3-dens { fill:none; stroke:#3b5f8a; stroke-width:1.6; stroke-dasharray:4 3; }
.p4b3-ag svg .p4b3-dens-f { fill:#dfe8f4; }
.p4b3-ag svg .p4b3-bande { fill:#bf86d6; opacity:.85; }
.p4b3-ag svg .p4b3-bande.p4b3-sg { opacity:.3; }
.p4b3-ag svg .p4b3-bande.p4b3-amer { fill:var(--acc); }
.p4b3-ag svg .p4b3-cell { fill:none; stroke:#e3e5eb; }
.p4b3-ag svg .p4b3-cell.p4b3-ici { fill:#f1f2f5; }
.p4b3-ag svg .p4b3-sauts rect { fill:transparent; cursor:pointer; }
.p4b3-ag .p4b3-hop { position:absolute; top:47px; width:22px; height:22px; margin-left:-11px; border-radius:50%; background:#fff; border:2px solid var(--encre); display:flex; align-items:center; justify-content:center; transition:left .18s; z-index:3; }
.p4b3-ag .p4b3-hop .s-pt { width:10px; height:10px; }
.p4b3 .p4r-pl { display:none; }
.p4b3-rail { margin-top:2px; }
.p4b3 .p4r-loupe { top:-132px; height:40px; }
.p4b3 .p4r-loupe > span { flex-direction:row; top:11px; gap:5px; }
.p4b3 .p4r-loupe > span i { display:none; }
`,
  corps: `
<div class="p4b3-rep" aria-live="polite"><span class="p4b3-face">Face à ta stout</span><span class="p4b3-fl"><svg class="s-pi" width="18" height="18" style="width:18px;height:18px" data-famille="floral" aria-label="Floral"><use href="#p-floral"/></svg><span id="p4b3-fl" class="num">~+22</span></span>
  <span class="p4b3-quand" id="p4b3-quand"><i class="s-pt"></i><span id="p4b3-quand-t"></span></span>
  <span class="p4b3-contre" id="p4b3-contre" hidden></span></div>
<section class="s-bloc p4b3-fig" id="p4b3-fig" aria-label="Familles d'arômes au style, à ce moment"></section>
<div class="p4b3-bas">
  <p class="p4b3-mes" id="p4b3-mes" data-acquis="valeurs"></p>
  <nav class="p4b3-lev" aria-label="Pont vers Levure" data-acquis="levure" data-forme="pont"><a href="${OUTIL}"><b>Levure</b><span id="p4b3-lev-t"></span>${CHEV}</a></nav>
</div>
<div class="p4b3-dock" id="p4b3-dock" data-libre="moment" data-acquis="frise">
  <div class="p4b3-ag-t" id="p4b3-ag-t" aria-hidden="true"></div>
  <div class="p4b3-ag" id="p4b3-ag"><svg viewBox="0 0 366 84" preserveAspectRatio="none" id="p4b3-svg"></svg><span class="p4b3-hop" id="p4b3-hop" aria-hidden="true"><i class="s-pt"></i></span></div>
  <div class="p4b3-rail" id="p4b3-rail" data-acquis="geste"></div>
</div>`,
  script: function () {
    var S = window.S, P4 = window.P4, D = S.D, N = S.N, X = window.S_DATA, W = 366;
    var abs = function () { return document.body.classList.contains('abs'); };
    var w = function (v, f, m) { return (m === 's' ? Math.min(100, v / S.B[f] / 2 * 100) : Math.min(100, v / 110 * 100)); };
    var refDe = function (p) { if (P4.seg(p) === 3) return null; return D[S.idx('dryPost|' + (P4.jours(p) || 2))]; };
    // La figure : 12 familles et l'amertume (a1), Pépins et Melon hachurés « ? ».
    var ligne = function (f) {
      return '<div class="p4b3-ba" data-f="' + f + '"><span class="p4b3-n' + ({ floral: 1, herbal: 1, earthy: 1 }[f] ? ' p4b3-att' : '') + '">' + S.pi(f) + '<span>' + S.NOM[f] + '</span></span>'
        + '<span class="p4b3-p' + (P4.avinc(f) ? ' p4r-avinc' : '') + '" style="--c:' + S.BA[f] + '"><i class="p4b3-z" data-role="zone" style="--ws:50%;--wa:' + (S.B[f] / 110 * 100).toFixed(1) + '%"></i><i class="p4b3-q"></i><i class="p4b3-b" style="background:' + S.BA[f] + '"></i>'
        + '<i class="p4b3-av" style="--ws:' + w(S.AV[f], f, 's').toFixed(1) + '%;--wa:' + w(S.AV[f], f, 'a').toFixed(1) + '%"></i><i class="p4b3-h"></i></span><span class="p4b3-v"></span><span class="p4b3-rb" aria-hidden="true">' + cases() + '</span></div>';
    };
    function cases() { var h = ''; for (var k = 0; k <= N; k++) h += '<i data-k="' + k + '" style="left:' + P4.x(k) + '%;--cw:' + P4.cw(k).toFixed(2) + '%"></i>'; return h; }
    var fig = document.getElementById('p4b3-fig');
    fig.innerHTML = S.ORDRE.map(ligne).join('')
      + '<div class="p4b3-ba p4b3-am" data-amer><span class="p4b3-n">Amertume</span><span class="p4b3-p"><i class="p4b3-jz"></i><i class="p4b3-jb"></i><i class="p4b3-ja"></i><i class="p4b3-cru" hidden></i></span><span class="p4b3-v" id="p4b3-amv"></span><span class="p4b3-rb" aria-hidden="true">' + cases() + '</span></div>';
    // Les rubans d'a1 : chaque famille (et l'amertume) à chaque moment du rail ; hachuré si inconnu, trait orangé hors du style.
    function rubans() {
      fig.querySelectorAll('[data-f]').forEach(function (r) {
        var f = r.dataset.f;
        r.querySelectorAll('.p4b3-rb i').forEach(function (c) {
          var p = D[+c.dataset.k], u = S.inc(p, f);
          if (u) { c.style.background = 'repeating-linear-gradient(135deg,#c9cdd6 0 2px,transparent 2px 6px)'; c.style.opacity = 1; return; }
          var t = Math.min(1, abs() ? p.v[f] / 110 : p.v[f] / S.B[f] / 2);
          c.style.background = S.BA[f]; c.style.opacity = (0.35 + 0.65 * t) * (p.interp ? 0.75 : 1); c.classList.toggle('p4b3-hs', S.hors(p, f));
        });
      });
      fig.querySelectorAll('[data-amer] .p4b3-rb i').forEach(function (c) { var b = S.ibu(D[+c.dataset.k]); c.style.background = b.h ? '#c2410c' : '#8a8f9c'; c.style.opacity = Math.max(0.15, Math.min(1, (b.n - 40) / 130)); });
    }
    function barres(i) {
      var p = D[i], r0 = refDe(p);
      fig.querySelectorAll('[data-f]').forEach(function (r) {
        var f = r.dataset.f, u = S.inc(p, f), b = r.querySelector('.p4b3-b'), q = r.querySelector('.p4b3-q'), v = r.querySelector('.p4b3-v');
        r.classList.toggle('p4b3-ip', !!p.interp); b.hidden = u; r.querySelector('.p4b3-p .p4b3-h').hidden = !u; q.hidden = true;
        if (!u) {
          b.style.setProperty('--ws', w(p.v[f], f, 's') + '%'); b.style.setProperty('--wa', w(p.v[f], f, 'a') + '%');
          if (r0 && !S.inc(r0, f) && r0.v[f] - p.v[f] >= 0.5) {
            var s0 = w(p.v[f], f, 's'), s1 = w(r0.v[f], f, 's'), a0 = w(p.v[f], f, 'a'), a1 = w(r0.v[f], f, 'a');
            if (s1 - s0 > 0.5) { q.hidden = false; q.style.setProperty('--qs', s0 + '%'); q.style.setProperty('--qw', (s1 - s0) + '%'); q.style.setProperty('--qa', a0 + '%'); q.style.setProperty('--qwa', (a1 - a0) + '%'); }
          }
        }
        v.textContent = P4.val(p, f); v.style.color = u ? '#55555f' : (S.hors(p, f) ? '#c2410c' : S.T[f]);
      });
      fig.querySelectorAll('.p4b3-rb i').forEach(function (c) { c.classList.toggle('p4b3-la', +c.dataset.k === i); });
      var bb = S.ibu(p), ja = fig.querySelector('.p4b3-ja'), av = document.getElementById('p4b3-amv');
      ja.style.width = (Math.min(170, bb.n) - 60) / 170 * 100 + '%'; ja.classList.toggle('p4b3-trop', bb.h); ja.classList.toggle('p4b3-ipb', !!bb.ip);
      fig.querySelector('.p4b3-cru').hidden = !bb.cru;
      av.textContent = bb.cru ? '60+?' : bb.t.replace(' IBU', ''); av.classList.toggle('p4b3-trop', bb.h);
    }
    // L'agenda : la même géométrie que le rail (0–44 % brassage, 44–52 % whirlpool, 52–76 % J+1…J+6, 76–100 % J+7…J+14).
    var svg = document.getElementById('p4b3-svg'), h = '', YJ = 0, YB0 = 52, YB1 = 64, YD0 = 74, YD1 = 10;
    var xj = function (j) { return (j <= 6 ? 52 + 24 * (j - 0.5) / 6 : 76 + 24 * (j - 6.5) / 8) / 100 * W; };
    var xpct = function (pc) { return pc / 100 * W; };
    // Cellules des jours et du brassage.
    h += '<rect class="p4b3-cell" data-s="0" x="0" y="' + YJ + '" width="' + xpct(44) + '" height="' + (YB1 - YJ + 8) + '" rx="3"/>';
    h += '<rect class="p4b3-cell" data-s="1" x="' + xpct(44) + '" y="' + YJ + '" width="' + xpct(8) + '" height="' + (YB1 - YJ + 8) + '" rx="3"/>';
    for (var j = 1; j <= 14; j++) { var x0 = j <= 6 ? xpct(52 + 24 * (j - 1) / 6) : xpct(76 + 24 * (j - 7) / 8), x1 = j <= 6 ? xpct(52 + 24 * j / 6) : xpct(76 + 24 * (j - 6) / 8); h += '<rect class="p4b3-cell" data-j="' + j + '" x="' + x0 + '" y="' + YJ + '" width="' + (x1 - x0) + '" height="' + (YB1 - YJ + 8) + '"/>'; }
    // Libellés en tête : brassage, WP, J+2, J+7, J+14 ; les minutes 60′ et 0′.
    document.getElementById('p4b3-ag-t').innerHTML = '<span class="p4b3-on" style="left:22%">brassage</span><span class="p4b3-on" style="left:48%">WP</span><span class="p4b3-on" style="left:64%">fermentation</span><span class="p4b3-on" style="left:88%">après</span>'
      + '<span class="p4b3-j p4b3-g" style="left:0">60′</span><span class="p4b3-j p4b3-d" style="left:44%">0′</span>' + [2, 5, 7, 14].map(function (j) { return '<span class="p4b3-j" style="left:' + (xj(j) / W * 100).toFixed(1) + '%">J+' + j + '</span>'; }).join('');
    // La densité : haute à J+0, chute J+1 → J+4, plateau dès J+5 (fin, à confirmer à la densité).
    var dens = 'M' + xpct(52) + ' ' + YD1 + ' C' + xj(1.2) + ' ' + YD1 + ' ' + xj(1.6) + ' ' + (YD0 - 4) + ' ' + xj(3.4) + ' ' + (YD0 - 6) + ' S' + xj(5) + ' ' + (YD0 - 1) + ' ' + xj(6) + ' ' + (YD0 - 1) + ' L' + W + ' ' + (YD0 - 1);
    h += '<path class="p4b3-dens-f" d="' + dens + ' L' + W + ' ' + (YB1 + 8) + ' L' + xpct(52) + ' ' + (YB1 + 8) + ' Z" opacity=".5"/><path class="p4b3-dens" d="' + dens + '"/>';
    h += '<text x="' + xj(2.8) + '" y="' + (YJ + 14) + '">levure active</text><text x="' + xj(7.2) + '" y="' + (YD0 - 5) + '">finie · forme type</text>';
    // Les crans de l'ébullition : pleins si calculés (60′, 10′, 0′ par la carte), pointillés sinon.
    for (var k = 0; k <= N; k++) if (P4.seg(D[k]) === 0) h += '<line x1="' + xpct(P4.x(k)) + '" x2="' + xpct(P4.x(k)) + '" y1="' + (YB0 - 4) + '" y2="' + (YB1 + 4) + '" stroke="' + (D[k].interp ? '#c9cdd6' : '#55555f') + '"' + (D[k].interp ? ' stroke-dasharray="2 2"' : '') + '/>';
    // La bande (où Idaho 7 reste dans la bière) et sa part « sans gain ».
    h += '<rect class="p4b3-bande" id="p4b3-bande" x="0" y="' + YB0 + '" width="0" height="' + (YB1 - YB0) + '" rx="2"/><rect class="p4b3-bande p4b3-sg" id="p4b3-sg" x="0" y="' + YB0 + '" width="0" height="' + (YB1 - YB0) + '" rx="2"/>';
    h += '<text class="p4b3-j" x="' + xpct(P4.x(P4.best)) + '" y="' + (YJ + 14) + '" text-anchor="middle" fill="#2f6b5f">★</text>';
    // Les sauts : toucher une étape de l'agenda.
    h += '<g class="p4b3-sauts"><rect data-saut="b60" x="0" y="0" width="' + xpct(44) + '" height="' + YB0 + '"/><rect data-saut="wp" x="' + xpct(44) + '" y="0" width="' + xpct(8) + '" height="' + YB0 + '"/><rect data-saut="dryActive|2" x="' + xpct(52) + '" y="0" width="' + xpct(24) + '" height="' + YB0 + '"/><rect data-saut="dryPost|2" x="' + xpct(76) + '" y="0" width="' + xpct(24) + '" height="' + YB0 + '"/></g>';
    svg.innerHTML = h;
    var hop = document.getElementById('p4b3-hop'), bande = document.getElementById('p4b3-bande'), sg = document.getElementById('p4b3-sg');
    function agenda(i) {
      var p = D[i], s = P4.seg(p), xin, xout, xsg = null;
      if (s === 0) { xin = P4.x(i); xout = 44; }
      else if (s === 1) { xin = 44 + 0.5; xout = 52 - 0.5; }
      else {
        var j0 = s === 2 ? 2 : 7, jj = P4.jours(p); xin = xj(j0) / W * 100; xout = xj(j0 + jj) / W * 100;
        if (jj > 2) xsg = xj(j0 + 2) / W * 100;
      }
      hop.style.left = xin + '%';
      var amer = S.ibu(p).h;
      bande.setAttribute('x', xpct(xin)); bande.setAttribute('width', Math.max(0, xpct((xsg || xout) - xin))); bande.classList.toggle('p4b3-amer', amer);
      sg.setAttribute('x', xpct(xsg || xout)); sg.setAttribute('width', xsg ? xpct(xout - xsg) : 0);
      svg.querySelectorAll('.p4b3-cell').forEach(function (c) { var on = c.dataset.s != null ? +c.dataset.s === s : (s >= 2 && +c.dataset.j >= (s === 2 ? 2 : 7) && +c.dataset.j < (s === 2 ? 2 : 7) + P4.jours(p)); c.classList.toggle('p4b3-ici', on); });
      var q = document.getElementById('p4b3-quand'); q.classList.toggle('p4b3-best', i === P4.best);
      document.getElementById('p4b3-quand-t').textContent = (i === P4.best ? '★ ' : '') + (s === 0 ? 'à ' + p.court + ' de la fin' : s === 1 ? 'au whirlpool' : (s === 2 ? 'J+2' : 'J+7') + ' · ' + P4.jours(p) + ' j');
    }
    function contre(i) {
      var c = document.getElementById('p4b3-contre'); if (i === P4.best) { c.hidden = true; return; }
      var p = D[i], q = D[P4.best], sgn = p.interp ? '≈' : '~', df = Math.round(p.v.floral - q.v.floral), dr = Math.round(p.v.resin - q.v.resin);
      var fmt = function (n) { return sgn + (n >= 0 ? '+' : '−') + Math.abs(n); };
      c.hidden = false; c.innerHTML = 'contre ★ <b>' + q.lib + '</b> : floral ' + fmt(df) + ' · résineux ' + fmt(dr) + (S.ibu(p).h ? ' · <span class="p4b3-moins">trop amer</span>' : '');
    }
    function mesure(p) { var m = document.getElementById('p4b3-mes'), r = P4.mesure(p); m.classList.toggle('p4b3-jamais', !r.ok); m.innerHTML = (r.ok && P4.seg(p) === 2 ? S.pi('floral', 14) : '') + '<span>' + r.html + '</span>'; }
    function levure(p) {
      var dd = X.POMONA[p.id] || null, f2 = null;
      if (dd) for (var f in dd) if (!f2 || Math.abs(dd[f]) > Math.abs(dd[f2])) f2 = f;
      document.getElementById('p4b3-lev-t').textContent = dd && Math.abs(dd[f2]) >= 0.5 ? 'Pomona ~+' + Math.round(dd[f2]) + ' ' + S.NOM[f2].toLowerCase() : 'rien ne change ici';
    }
    var R = P4.rail(document.getElementById('p4b3-rail'), {
      calcules: true,
      surPoser: function (i, p) { barres(i); agenda(i); contre(i); mesure(p); levure(p); document.getElementById('p4b3-fl').textContent = S.fmt(p, 'floral'); },
      loupe: function (i) {
        var out = [];
        for (var k = i - 2; k <= i + 2; k++) {
          if (k < 0 || k > N) continue; var p = D[k], s = P4.seg(p), lib = s === 0 ? p.court : s === 1 ? 'WP' : P4.jours(p) + ' j';
          var pr = k > 0 ? D[k - 1] : null, sgn = s >= 2 && pr && P4.seg(pr) === s && Math.abs(p.v.floral - pr.v.floral) < 0.1;
          out.push({ k: k, html: '<em>' + lib + '</em><i><b style="width:' + Math.min(100, p.v.floral / 25 * 100).toFixed(0) + '%"></b></i><small' + (sgn ? ' style="color:#55555f;font-weight:400"' : '') + '>' + (sgn ? 'sans gain' : S.fmt(p, 'floral')) + '</small>' });
        }
        return out;
      },
    });
    svg.querySelectorAll('[data-saut]').forEach(function (r) { r.addEventListener('click', function () { var p = D[R.cur()], id = r.getAttribute('data-saut'); R.poser(S.idx(id.indexOf('dry') === 0 && P4.jours(p) ? id.split('|')[0] + '|' + P4.jours(p) : id)); }); });
    S.surLecture(function () { barres(R.cur()); rubans(); });
    rubans();
    var dk = document.getElementById('p4b3-dock'), haut = function () { document.body.style.setProperty('--dock', dk.offsetHeight + 'px'); };
    haut(); addEventListener('resize', haut);
    window.P4ETAT = function () { var p = D[R.cur()]; return { m: p.lib, fl: S.fmt(p, 'floral'), am: document.getElementById('p4b3-amv').textContent, quand: document.getElementById('p4b3-quand-t').textContent, contre: document.getElementById('p4b3-contre').textContent, lev: document.getElementById('p4b3-lev-t').textContent, mes: document.getElementById('p4b3-mes').textContent }; };
  },
});
