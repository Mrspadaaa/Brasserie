// sba6 · chaude · forme libre : un plan α × ressemblance. Nugget est la croix au centre ; on promène un anneau,
// le remplaçant le plus proche s'allume. À gauche de Nugget, il en faut plus ; à droite, moins. Les intervalles se voient.
import { CROIX, lentille, aide } from '../sba1/socle.mjs';

export default {
  id: 'sba6', nom: 'Promener l’anneau sur le plan α × ressemblance', chaleur: 'chaude',
  etats: [['geste', '?choix=beermaverick-altus'], ['whirlpool', '?moment=wp'], ['fiche', '?fiche=beermaverick-altus']],
  css: `
.sba6-page { padding:6px 12px 150px; display:flex; flex-direction:column; gap:6px; }
.sba6-t { display:flex; align-items:center; gap:10px; }
.sba6-t h1 { font:700 19px/1.15 var(--sans); }
.sba6-ctx { display:flex; flex-wrap:wrap; gap:4px 10px; font-size:12px; color:var(--gris); }
.sba6-plan { position:relative; touch-action:none; user-select:none; background:#fbfbfc; border:1px solid var(--trait); border-radius:8px; }
.sba6-plan svg text { font-family:var(--sans); }
.sba6-lu { display:grid; grid-template-columns:1fr auto; gap:4px 8px; align-items:center; }
.sba6-lu b.sba6-n { font:800 22px/1 var(--sans); display:flex; align-items:center; gap:6px; }
.sba6-lu .sba6-d { font:700 22px/1 var(--mono); text-align:right; }
.sba6-lu p { grid-column:1 / -1; display:flex; flex-wrap:wrap; gap:4px 12px; font-size:13px; align-items:center; }
.sba6-o { display:flex; align-items:center; gap:6px; position:relative; }
.sba6-o > span:first-child { font-size:12px; color:var(--gris); margin-right:auto; }
.sba6-gp { display:flex; gap:12px; font-size:12px; color:var(--gris); flex-wrap:wrap; align-items:center; }
.sba6-gp span { display:inline-flex; gap:3px; align-items:center; }
.sba6-ib { display:flex; flex-direction:column; gap:3px; font-size:12px; color:var(--gris); }
.sba6-foot { position:fixed; left:0; right:0; bottom:0; background:#fff; border-top:1px solid var(--trait); padding:8px 12px 12px; max-width:390px; margin:0 auto; }
`,
  corps: '<header class="sba6-t">' + CROIX + '<h1 data-role="titre">Lequel à la place de Nugget ?</h1></header>'
    + '<p class="sba6-ctx" data-role="contexte"><span data-contexte="houblon" data-fiche-de="beermaverick-nugget">croix : <span data-houblon="beermaverick-nugget">Nugget</span> α 13 %, épuisé</span><span data-contexte="moment" id="sba6-mom">à 60′</span><span data-contexte="dose">même IBU</span><span data-contexte="base">Stout 16D</span></p>'
    + '<div class="sba6-plan" id="sba6-plan" data-libre="houblon" aria-label="Plan des remplaçants : α en largeur, ressemblance en hauteur"></div>'
    + '<section class="sba6-lu" aria-live="polite"><b class="sba6-n" id="sba6-n"></b><span class="sba6-d" id="sba6-d"></span><p id="sba6-p"></p></section>'
    + '<div class="sba6-o"><span id="sba6-oh"></span>' + aide('sba6', ['Largeur : α (point : celui du lot ; trait : la plage des fiches, sans lot). Hauteur : ressemblance à Nugget, en plage si une composante est inconnue.', 'Rond plein : dans ton stock ; rond vide : à acheter. Promène l’anneau : le plus proche s’allume.', 'Barres : ta stout (rond noir) et avec lui (~ simulé, 2 g/L) ; hachures : non simulé, pas zéro.'], 'top:32px;left:0') + lentille('sba6') + '</div>'
    + '<div id="sba6-fam"></div><p class="sba6-gp" id="sba6-gp"></p><div class="sba6-ib"><span>amertume de ta stout, style 50–70</span><span class="sb-j" id="sba6-j"></span></div>'
    + '<footer class="sba6-foot" id="sba6-pied"></footer>',
  script: function () {
    var S = window.S, H = S.H, plan = document.getElementById('sba6-plan');
    document.getElementById('sba6-mom').textContent = S.MOM[S.m];
    var W = 364, Ht = 300, g = { l: 30, r: 10, t: 14, b: 30 };
    var l = S.cands, aMin = 5, aMax = 26;
    var sc = l.map(function (s) { return S.score(s); }), yMin = Math.floor(Math.min.apply(null, sc.map(function (r) { return r[0]; })) / 5) * 5 - 5, yMax = 100;
    var X = function (a) { return g.l + (a - aMin) / (aMax - aMin) * (W - g.l - g.r); }, Y = function (v) { return g.t + (yMax - v) / (yMax - yMin) * (Ht - g.t - g.b); };
    var nug = H[S.NUG].alpha.v;
    var svg = '<svg width="' + W + '" height="' + Ht + '" viewBox="0 0 ' + W + ' ' + Ht + '"><defs><pattern id="sba6-h" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V5" stroke="#8b8d96" stroke-width="2"/></pattern></defs>'
      + '<rect x="' + g.l + '" y="' + Y(80) + '" width="' + (W - g.l - g.r) + '" height="' + (Y(yMin) - Y(80)) + '" fill="#f1f2f5"/>'
      + '<text x="' + (g.l + 4) + '" y="' + (Ht - g.b - 6) + '" font-size="12" fill="#55555f">sous 80 : moins proche</text>'
      + '<line x1="' + X(nug) + '" x2="' + X(nug) + '" y1="' + g.t + '" y2="' + (Ht - g.b) + '" stroke="#4b4b55" stroke-dasharray="3 3"/>'
      + '<text x="' + (X(nug) - 6) + '" y="' + (Ht - g.b + 26) + '" text-anchor="end" font-size="12" fill="#55555f">← il en faut plus</text><text x="' + (X(nug) + 6) + '" y="' + (Ht - g.b + 26) + '" font-size="12" fill="#55555f">il en faut moins →</text>';
    [10, 15, 20, 25].forEach(function (a) { svg += '<text x="' + X(a) + '" y="' + (Ht - g.b + 13) + '" text-anchor="middle" font-size="12" fill="#55555f">' + a + ' %</text>'; });
    [yMin + 5, 80, 90, 100].forEach(function (v) { svg += '<text x="' + (g.l - 4) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="12" fill="#55555f">' + v + '</text>'; });
    svg += '<g stroke="#4b4b55" stroke-width="2.5"><line x1="' + (X(nug) - 7) + '" x2="' + (X(nug) + 7) + '" y1="' + Y(100) + '" y2="' + Y(100) + '"/><line x1="' + X(nug) + '" x2="' + X(nug) + '" y1="' + (Y(100) - 7) + '" y2="' + (Y(100) + 7) + '"/></g>';
    var pos = [], boites = [[X(nug) - 9, Y(100) - 9, 18, 18]];
    l.forEach(function (s, i) {
      var h = H[s.key], a = h.alpha, r = sc[i], x = X(a.v), y = Y(r[0]), c = S.C[s.key], plein = S.etat(s) !== 'achat';
      var e = '<g data-i="' + i + '" class="sba6-pt" data-fiche-de="' + s.key + '">';
      if (!a.lot) e += '<line x1="' + X(a.min) + '" x2="' + X(a.max) + '" y1="' + y + '" y2="' + y + '" stroke="' + c + '" stroke-width="2" stroke-linecap="round" opacity=".7"/>';
      if (r[0] !== r[1]) e += '<rect x="' + (x - 3) + '" y="' + Y(r[1]) + '" width="6" height="' + (Y(r[0]) - Y(r[1])) + '" fill="url(#sba6-h)" stroke="' + c + '" stroke-width="1"/>';
      e += '<circle cx="' + x + '" cy="' + y + '" r="6" fill="' + (plein ? c : '#fff') + '" stroke="' + c + '" stroke-width="2"/>';
      var lw = h.name.length * 6.2 + 4, essais = [[9, -4], [9, 12], [-9 - lw, -4], [-9 - lw, 12], [9, -16], [-9 - lw, 22]], ok = null;
      for (var t = 0; t < essais.length && !ok; t++) { var bx = [x + essais[t][0], y + essais[t][1] - 10, lw, 13]; if (bx[0] > g.l && bx[0] + lw < W - 2 && !boites.some(function (o) { return bx[0] < o[0] + o[2] && o[0] < bx[0] + bx[2] && bx[1] < o[1] + o[3] && o[1] < bx[1] + bx[3]; })) ok = bx; }
      if (ok) { boites.push(ok); e += '<text x="' + (ok[0] + 2) + '" y="' + (ok[1] + 10) + '" font-size="12" fill="#16161a">' + h.name + '</text>'; }
      e += '</g>';
      svg += e; pos.push([x, y]);
    });
    svg += '<circle id="sba6-ann" r="20" fill="none" stroke="#16161a" stroke-width="2.5"/><circle id="sba6-ann2" r="24" fill="none" stroke="#fff" stroke-width="2" opacity=".9"/></svg>';
    plan.innerHTML = svg;
    var ann = document.getElementById('sba6-ann'), ann2 = document.getElementById('sba6-ann2'), tard = S.m !== 'b60';
    document.getElementById('sba6-oh').textContent = tard ? 'ce qu’il apporte ' + S.MOM[S.m] : 'à 60′ l’arôme part ; ce qui reste';
    var lire = S.barres(document.getElementById('sba6-fam'), S.ORDRE);
    var maj = S.pied(document.getElementById('sba6-pied')), jg = S.jauge(document.getElementById('sba6-j'));
    S.surChoix(function (s) {
      if (!s) return;
      var i = l.indexOf(s); ann.setAttribute('cx', pos[i][0]); ann.setAttribute('cy', pos[i][1]); ann2.setAttribute('cx', pos[i][0]); ann2.setAttribute('cy', pos[i][1]);
      plan.querySelectorAll('.sba6-pt').forEach(function (p) { p.style.opacity = +p.dataset.i === i ? 1 : 0.45; });
      document.getElementById('sba6-n').innerHTML = S.pt(s.key, 12) + '<span data-houblon="' + s.key + '">' + H[s.key].name + '</span>';
      document.getElementById('sba6-d').textContent = S.dose(s);
      document.getElementById('sba6-p').innerHTML = S.alphaHtml(s.key) + S.usageHtml(s.key) + '<span class="num">' + S.ibuTxt(s) + '</span><span class="num">score ' + S.scoreTxt(s) + '</span>' + S.stock(s, true) + (S.dosePlage(s) ? '<span class="num" style="color:#55555f">' + S.dosePlage(s) + '</span>' : '');
      document.getElementById('sba6-gp').innerHTML = '<span>perd ' + (S.gp(s, 'perd') || '—') + '</span><span>gagne ' + (S.gp(s, 'gagne') || '—') + '</span>' + (tard ? '' : '<span>à 60′ l’arôme part</span>');
      lire(s); maj(s); jg(s);
    });
    function proche(px, py) { var b = 0, bd = 1e9; pos.forEach(function (p, i) { var d = Math.hypot(p[0] - px, p[1] - py); if (d < bd) { bd = d; b = i; } }); return b; }
    var tire = false;
    function lieu(e) { var r = plan.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    plan.addEventListener('pointerdown', function (e) { tire = true; plan.setPointerCapture(e.pointerId); var p = lieu(e); S.choisir(l[proche(p[0], p[1])].key); });
    plan.addEventListener('pointermove', function (e) { if (!tire) return; var p = lieu(e); ann.setAttribute('cx', p[0]); ann.setAttribute('cy', p[1]); ann2.setAttribute('cx', p[0]); ann2.setAttribute('cy', p[1]); var i = proche(p[0], p[1]); if (l[i] !== S.courant()) { var a = [p[0], p[1]]; S.choisir(l[i].key); ann.setAttribute('cx', a[0]); ann.setAttribute('cy', a[1]); ann2.setAttribute('cx', a[0]); ann2.setAttribute('cy', a[1]); } });
    plan.addEventListener('pointerup', function () { if (!tire) return; tire = false; S.choisir(S.courant().key); });
    var dep = S.depart || (l.filter(function (s) { return S.etat(s) === 'ok'; })[0] || l[0]).key;
    S.choisir(dep);
  },
};
