// d7 · chaude · « Le bouton du brassin » : un bouton rond, comme celui d'un four. On tourne le pouce sur
// la couronne (60′ → 10′, whirlpool, actif, après, jour par jour) ; au centre, la roue de ta stout : une
// barre par famille, en rayon, qui s'allonge ou fond en direct, face à l'anneau du style. Le moment et
// l'amertume au cœur. Levure : pont vers l'outil Levure.
export default {
  id: 'd7', titre: 'Le bouton du brassin', chaleur: 'chaude', levure: 'outil', avecDock: false,
  legende: ['tourne le pouce sur la couronne : le moment', 'rayon : une famille ; trait noir : ta stout avant', 'anneau gris : zone du style 16D ; pâle : emporté', '~ simulé ; ≈ interpolé ; encoche violette : ta demande'],
  corps: `<section class="dx-bloc d7-bloc" data-libre="moment"><svg id="d7-svg" class="d7-svg" viewBox="0 0 360 360" width="360" height="360" role="slider" tabindex="0" aria-label="Moment de l'ajout" aria-valuemin="0" aria-valuemax="21" aria-valuenow="0" aria-valuetext=""></svg></section>
<p class="d7-rep" id="d7-rep" data-nature="simule"></p>`,
  css: `
.d7-bloc { padding:2px; touch-action:none; }
.d7-svg { width:100%; height:auto; cursor:grab; }
.d7-rep { display:flex; align-items:center; gap:6px; flex-wrap:wrap; font-size:15px; font-weight:600; }
.d7-rep .dx-src { font-weight:400; }
`,
  js: `
(function () {
  var svg = DH.$('#d7-svg'), M = DH.M, N = M.length, c = 180, R = 156, prev = null, prevA = null;
  svg.setAttribute('aria-valuemax', N - 1);
  // la couronne : −135° à +135° (0° en haut), quatre secteurs comme le rail
  var SEG = [[-135, -10], [-10, 12], [12, 72], [72, 135]];
  function A(i) { var s = M[i].seg, idx = []; M.forEach(function (p, k) { if (p.seg === s) idx.push(k); }); var n = idx.length, a = SEG[s][0], b = SEG[s][1];
    return n === 1 ? (a + b) / 2 : a + (b - a) * (0.06 + 0.88 * idx.indexOf(i) / (n - 1)); }
  function pol(r, deg) { var t = (deg - 90) * Math.PI / 180; return [c + r * Math.cos(t), c + r * Math.sin(t)]; }
  function arc(r, a0, a1) { var p = pol(r, a0), q = pol(r, a1); return 'M' + p[0].toFixed(1) + ',' + p[1].toFixed(1) + ' A' + r + ',' + r + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + q[0].toFixed(1) + ',' + q[1].toFixed(1); }
  var COUL = ['#d9b8a0', '#c9cdd6', '#b9a9dc', '#9f8cc9'], r0 = 24, rmax = 96;
  function couronne() { var s = '';
    SEG.forEach(function (g, k) { s += '<path d="' + arc(R, g[0] + 0.8, g[1] - 0.8) + '" fill="none" stroke="' + COUL[k] + '" stroke-width="14"/>'; });
    M.forEach(function (p, i) { var a = pol(R - 10, A(i)), b = pol(R - 4, A(i)); s += '<line x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '" stroke="#9a9aa6"/>'; });
    var bb = [pol(R - 9, A(DH.best)), pol(R + 9, A(DH.best))]; s += '<line x1="' + bb[0][0].toFixed(1) + '" y1="' + bb[0][1].toFixed(1) + '" x2="' + bb[1][0].toFixed(1) + '" y2="' + bb[1][1].toFixed(1) + '" stroke="#5b3fa0" stroke-width="3"/>';
    [['60′', -135], ['10′', -14], ['WP', 1], ['actif', 42], ['après', 104]].forEach(function (l) { var q = pol(R + 2, l[1]); var q2 = pol(R - 25, l[1]); s += '<text x="' + q2[0].toFixed(1) + '" y="' + (q2[1] + 4).toFixed(1) + '" text-anchor="middle" font-size="12" fill="#55555f">' + l[0] + '</text>'; });
    return s; }
  var COUR = couronne();
  function rayon(f, i, v, e, p) { var a = i * 30, L = function (x) { return r0 + (rmax - r0) * Math.min(DH.S(f, x), 1.05); }, s = '';
    var z = pol(r0, a), z2 = pol(L(v), a);
    if (p.perte && e > 0.3) { var e2 = pol(L(v + e), a); s += '<line x1="' + z2[0].toFixed(1) + '" y1="' + z2[1].toFixed(1) + '" x2="' + e2[0].toFixed(1) + '" y2="' + e2[1].toFixed(1) + '" stroke="' + DH.BA[f] + '" stroke-opacity=".3" stroke-width="13"/>'; }
    if (p.inc.indexOf(f) >= 0) { var u = pol(rmax, a); s += '<line x1="' + z[0].toFixed(1) + '" y1="' + z[1].toFixed(1) + '" x2="' + u[0].toFixed(1) + '" y2="' + u[1].toFixed(1) + '" stroke="url(#d7-h)" stroke-width="13"/>'; }
    else s += '<line x1="' + z[0].toFixed(1) + '" y1="' + z[1].toFixed(1) + '" x2="' + z2[0].toFixed(1) + '" y2="' + z2[1].toFixed(1) + '" stroke="' + (DH.S(f, v) > 1 ? '#c2410c' : DH.BA[f]) + '" stroke-width="13"/>';
    if (DH.AVI.indexOf(f) < 0) { var m = L(DH.AV[f]), t1 = pol(m, a - 4), t2 = pol(m, a + 4); s += '<line x1="' + t1[0].toFixed(1) + '" y1="' + t1[1].toFixed(1) + '" x2="' + t2[0].toFixed(1) + '" y2="' + t2[1].toFixed(1) + '" stroke="#16161a" stroke-width="2"/>'; }
    var q = pol(rmax + 13, a); s += '<svg x="' + (q[0] - 9).toFixed(1) + '" y="' + (q[1] - 9).toFixed(1) + '" width="18" height="18" viewBox="0 0 24 24" data-famille="' + f + '" aria-label="' + DH.COURT[f] + '"><use href="#p-' + f + '"/></svg>';
    return s; }
  function dessiner(p, vs, ang) {
    var s = '<defs><pattern id="d7-h" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#c9cad2" stroke-width="1.5"/></pattern></defs>' + COUR;
    var zr = DH.abs() ? null : r0 + (rmax - r0) * 0.5;
    if (zr) s += '<circle data-role="zone" cx="' + c + '" cy="' + c + '" r="' + ((r0 + zr) / 2).toFixed(1) + '" fill="none" stroke="#e3e5eb" stroke-width="' + (zr - r0).toFixed(1) + '"/>';
    else DH.ROUE.forEach(function (f, i) { var zz = r0 + (rmax - r0) * DH.Z(f), a = pol(r0, i * 30), b = pol(zz, i * 30); s += '<line data-role="zone" x1="' + a[0].toFixed(1) + '" y1="' + a[1].toFixed(1) + '" x2="' + b[0].toFixed(1) + '" y2="' + b[1].toFixed(1) + '" stroke="#e3e5eb" stroke-width="19"/>'; });
    DH.ROUE.forEach(function (f, i) { s += rayon(f, i, vs[i], p.emporte[f], p); });
    var k = pol(R, ang); s += '<circle cx="' + k[0].toFixed(1) + '" cy="' + k[1].toFixed(1) + '" r="13" fill="#16161a" stroke="#fff" stroke-width="3"/>';
    svg.innerHTML = s;
  }
  DH.surChange(function (p, i) {
    svg.setAttribute('aria-valuenow', i); svg.setAttribute('aria-valuetext', p.lib);
    var vs = DH.ROUE.map(function (f) { return p.c[f]; }), de = prev || vs, a1 = A(i), a0 = prevA == null ? a1 : prevA; prev = vs; prevA = a1;
    DH.tween(240, function (t) { dessiner(p, vs.map(function (v, k) { return de[k] + (v - de[k]) * t; }), a0 + (a1 - a0) * t); });
    var df = p.c.floral - DH.AV.floral, dr = p.c.resin - DH.AV.resin;
    DH.$('#d7-rep').innerHTML = '<span>' + p.lib + (p.interp ? ' ≈' : '') + '</span>' + DH.pic('floral', 17) + '<span style="color:' + DH.T.floral + '">~' + DH.sg(df) + '</span>' + DH.pic('resin', 17) + '<span class="dx-hors">~' + DH.sg(dr) + '</span><span class="dx-src">' + (p.ibu == null ? 'IBU 60 + ? à cru' : (p.ibu > 70 ? '<span class="dx-hors">≈ ' + p.ibu + ' IBU trop amer</span>' : '≈ ' + p.ibu + ' IBU tenue')) + '</span>';
  });
  function depuis(e) { var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; var q = pt.matrixTransform(svg.getScreenCTM().inverse());
    var deg = Math.atan2(q.y - c, q.x - c) * 180 / Math.PI + 90; if (deg > 180) deg -= 360; deg = Math.max(-135, Math.min(135, deg));
    var k0 = 0, bd = 1e9; M.forEach(function (p, k) { var d = Math.abs(A(k) - deg); if (d < bd) { bd = d; k0 = k; } }); if (k0 !== DH.cur()) DH.poser(k0); }
  svg.addEventListener('pointerdown', function (e) { svg.setPointerCapture(e.pointerId); depuis(e); });
  svg.addEventListener('pointermove', function (e) { if (e.buttons || e.pointerType === 'touch') depuis(e); });
  svg.addEventListener('keydown', function (e) { var i = DH.cur(); if (e.key === 'ArrowRight' || e.key === 'ArrowUp') DH.poser(Math.min(N - 1, i + 1)); if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') DH.poser(Math.max(0, i - 1)); });
  window.__geste = function () { var r = svg.getBoundingClientRect(), k = r.width / 360, a = pol(R, A(DH.cur())), b = pol(R, A(4)); return { a: { x: r.left + a[0] * k, y: r.top + a[1] * k }, b: { x: r.left + b[0] * k, y: r.top + b[1] * k } }; };
})();
`,
};
