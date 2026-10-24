// d6 · chaude · « La trajectoire » : chaque moment est un point de ta stout sur deux axes de brasseur,
// l'amertume (IBU) et le floral (ta demande). Tôt, c'est amer et pauvre ; tard, c'est floral et à cru.
// Le pouce glisse le long de la courbe elle-même (le geste est la représentation) : l'ébullition par 5′ à
// droite, le whirlpool, puis le dry hop actif et après, jour par jour, dans le couloir « à cru » où l'IBU
// est inconnu (hachuré). Sous la courbe, toute la stout au moment choisi. Levure : dernière étape.
export default {
  id: 'd6', titre: 'La trajectoire', chaleur: 'chaude', levure: 'etape', avecDock: false,
  legende: ['un point par moment : amertume à droite, floral en haut', 'glisse le doigt le long de la courbe', 'bande grise : 16D 50–70 IBU ; couloir hachuré : à cru, IBU ?', '~ simulé ; ≈ interpolé ; anneau violet : ta demande'],
  corps: `<section class="dx-bloc d6-bloc" data-libre="moment"><svg id="d6-svg" class="d6-svg" viewBox="0 0 360 350" width="360" height="350" role="slider" tabindex="0" aria-label="Moment de l'ajout" aria-valuemin="0" aria-valuemax="21" aria-valuenow="0" aria-valuetext=""></svg></section>
<div class="dx-bloc d6-ch" id="d6-ch" data-nature="simule"></div>`,
  css: `
.d6-bloc { padding:4px; touch-action:none; }
.d6-svg { width:100%; height:auto; cursor:pointer; }
.d6-ch { display:grid; grid-template-columns:repeat(5,1fr); gap:5px 4px; font-size:13px; }
.d6-ch span { display:flex; align-items:center; gap:3px; font-family:var(--mono); }
.d6-ch .d6-big span { font-family:var(--sans); }
.d6-ch .d6-big { grid-column:span 5; font-family:var(--sans); font-size:15px; font-weight:600; gap:6px; }
`,
  js: `
(function () {
  var svg = DH.$('#d6-svg'), M = DH.M, N = M.length, prevXY = null;
  var ordreCru = []; M.forEach(function (p, i) { if (p.seg >= 2) ordreCru.push(i); });
  function X(i) { var p = M[i]; if (p.ibu != null) return 168 + (p.ibu - 50) / 120 * 178;
    var k = ordreCru.indexOf(i); var pos = (ordreCru.length - 1 - k); return 22 + pos * 13.6; }
  function Y(v) { return 290 - Math.min(v, 30) / 30 * 250; }
  var lieux = M.map(function (p, i) { return [X(i), Y(p.c.floral)]; });
  svg.setAttribute('aria-valuemax', N - 1);
  function fond() {
    var s = '<defs><pattern id="d6-h" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#e3e5eb" stroke-width="2"/></pattern></defs>';
    s += '<rect x="14" y="30" width="140" height="262" fill="url(#d6-h)"/>';
    s += '<rect data-role="zone" x="164" y="30" width="' + (20 / 120 * 178).toFixed(1) + '" height="262" fill="#e3e5eb"/>';
    s += '<line x1="160" y1="292" x2="350" y2="292" stroke="#9a9aa6"/><line x1="14" y1="292" x2="154" y2="292" stroke="#9a9aa6"/>';
    [60, 100, 140].forEach(function (v) { var x = 168 + (v - 50) / 120 * 178; s += '<line x1="' + x + '" y1="292" x2="' + x + '" y2="297" stroke="#9a9aa6"/><text x="' + x + '" y="310" text-anchor="middle" font-size="12" fill="#55555f">' + v + '</text>'; });
    s += '<text x="350" y="330" text-anchor="end" font-size="13" fill="#55555f">amertume, IBU</text>';
    s += '<text x="84" y="310" text-anchor="middle" font-size="12" fill="#55555f">après · actif</text><text x="84" y="330" text-anchor="middle" font-size="13" fill="#55555f">à cru, IBU ?</text>';
    var ya = Y(DH.AV.floral); s += '<line x1="14" y1="' + ya.toFixed(1) + '" x2="350" y2="' + ya.toFixed(1) + '" stroke="#16161a" stroke-width="1.2"/><text x="18" y="' + (ya - 6).toFixed(1) + '" font-size="12" fill="#55555f">ta stout avant</text>';
    s += '<svg x="16" y="6" width="18" height="18" viewBox="0 0 24 24" data-famille="floral" aria-label="Floral"><use href="#p-floral"/></svg><text x="38" y="20" font-size="13" font-weight="600" fill="#9840bc">Floral</text>';
    s += '<polyline points="' + lieux.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' ') + '" fill="none" stroke="#b9a9dc" stroke-width="2.5" stroke-linejoin="round"/>';
    lieux.forEach(function (q, i) { var p = M[i]; s += '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="' + (p.interp ? 2.5 : 3.5) + '" fill="' + (p.interp ? '#fff' : '#5b3fa0') + '" stroke="#5b3fa0" stroke-width="1.4"/>'; });
    var b = lieux[DH.best]; s += '<circle cx="' + b[0].toFixed(1) + '" cy="' + b[1].toFixed(1) + '" r="11" fill="none" stroke="#5b3fa0" stroke-width="2"/>';
    return s;
  }
  var FOND = fond();
  function dessiner(i, q) {
    var p = M[i], s = FOND, lbl = p.lib + (p.interp ? ' ≈' : '') + (p.ibu != null ? ' · ' + p.ibu + ' IBU' : '');
    s += '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="9" fill="#16161a" stroke="#fff" stroke-width="2"/>';
    var w = lbl.length * 6.6 + 14, lx = Math.max(4, Math.min(356 - w, q[0] - w / 2)), ly = q[1] - 34 < 28 ? q[1] + 16 : q[1] - 34;
    s += '<rect x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" width="' + w.toFixed(1) + '" height="20" rx="10" fill="#16161a"/><text x="' + (lx + w / 2).toFixed(1) + '" y="' + (ly + 14.5).toFixed(1) + '" text-anchor="middle" font-size="13" font-weight="600" fill="#fff">' + lbl + '</text>';
    svg.innerHTML = s;
  }
  DH.surChange(function (p, i) {
    svg.setAttribute('aria-valuenow', i); svg.setAttribute('aria-valuetext', p.lib);
    var to = lieux[i], de = prevXY || to; prevXY = to;
    DH.tween(200, function (t) { dessiner(i, [de[0] + (to[0] - de[0]) * t, de[1] + (to[1] - de[1]) * t]); });
    var big = ['floral', 'resin'].map(function (f) { var d = p.c[f] - DH.AV[f]; return DH.pic(f, 17) + '<span style="color:' + (DH.hors(f, p.c[f]) ? '#c2410c' : DH.T[f]) + '">' + DH.COURT[f] + ' ~' + DH.sg(d) + '</span>'; }).join(' ');
    DH.$('#d6-ch').innerHTML = '<span class="d6-big">' + big + '</span>' + DH.ORDRE.filter(function (f) { return f !== 'floral' && f !== 'resin'; }).map(function (f) {
      if (p.inc.indexOf(f) >= 0) return '<span>' + DH.pic(f, 15) + '?</span>';
      var v = p.c[f], d = DH.AVI.indexOf(f) >= 0 ? v : v - DH.AV[f];
      return '<span style="color:' + (DH.hors(f, v) ? '#c2410c' : DH.T[f]) + '">' + DH.pic(f, 15) + (Math.abs(d) < 0.5 ? '≈' : '~' + (DH.AVI.indexOf(f) >= 0 ? DH.fr(v) : DH.sg(d))) + '</span>'; }).join('');
  });
  function depuis(e) { var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; var q = pt.matrixTransform(svg.getScreenCTM().inverse()), k0 = 0, bd = 1e9;
    lieux.forEach(function (l, k) { var d = Math.abs(l[0] - q.x) + 0.15 * Math.abs(l[1] - q.y); if (d < bd) { bd = d; k0 = k; } }); if (k0 !== DH.cur()) DH.poser(k0); }
  svg.addEventListener('pointerdown', function (e) { svg.setPointerCapture(e.pointerId); depuis(e); });
  svg.addEventListener('pointermove', function (e) { if (e.buttons || e.pointerType === 'touch') depuis(e); });
  svg.addEventListener('keydown', function (e) { var i = DH.cur(); if (e.key === 'ArrowLeft') DH.poser(Math.min(N - 1, i + 1)); if (e.key === 'ArrowRight') DH.poser(Math.max(0, i - 1)); });
  window.__geste = function () { var r = svg.getBoundingClientRect(), k = r.width / 360; return { a: { x: r.left + lieux[DH.cur()][0] * k, y: r.top + lieux[DH.cur()][1] * k }, b: { x: r.left + lieux[5][0] * k, y: r.top + lieux[5][1] * k } }; };
})();
`,
};
