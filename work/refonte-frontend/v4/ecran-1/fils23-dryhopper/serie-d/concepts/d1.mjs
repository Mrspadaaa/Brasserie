// d1 · tiède · « Le radar respire » : le radar m4/h4 de la stout (acquis) se déforme en direct sous le
// pouce ; un trait pâle garde Idaho 7 « à froid », l'écart est ce que la chaleur ou le CO₂ emporte.
// Levure : pont vers l'outil Levure (« Levure › Pomona ~+13 agrumes »).
export default {
  id: 'd1', titre: 'Le radar respire', chaleur: 'tiède', levure: 'outil',
  legende: ['gris : ta stout avant ; violet : avec Idaho 7', 'violet pâle : Idaho 7 à froid, sans perte', 'zone grise : le style 16D ; hachuré : inconnu, pas zéro', '~ simulé ; ≈ interpolé ; trait violet du rail : ta demande'],
  corps: `<p class="d1-rep" id="d1-rep" data-nature="simule"></p>
<section class="dx-bloc d1-bloc"><svg id="d1-radar" class="d1-radar" viewBox="0 0 330 316" width="350" height="335" data-radar data-objet="biere" data-axes="citrus,tropical,melon,stoneFruit,pomeFruit,berries,floral,green,herbal,spice,earthy,resin" role="img" aria-label="Radar de ta stout avec Idaho 7, au style"></svg>
<p class="d1-perte" id="d1-perte"></p></section>
<div class="dx-bloc d1-ch" id="d1-ch" data-nature="simule"></div>`,
  css: `
.d1-rep { display:flex; align-items:center; gap:6px; flex-wrap:wrap; font-size:16px; font-weight:600; min-height:26px; }
.d1-rep .pi { width:18px; height:18px; }
.d1-rep .d1-ibu { margin-left:auto; font-size:13px; font-weight:400; color:var(--gris); }
.d1-rep .d1-ibu.dx-hors { color:var(--acc); }
.d1-bloc { padding:2px 4px 8px; display:flex; flex-direction:column; align-items:center; }
.d1-radar { width:100%; height:auto; touch-action:none; }
.d1-perte { font-size:13px; color:var(--gris); align-self:flex-start; padding-left:8px; min-height:18px; }
.d1-perte i { width:18px; height:8px; border-radius:2px; background:#c9bde6; display:inline-block; margin-right:5px; vertical-align:middle; }
.d1-perte b { color:var(--encre); }
.d1-ch { display:grid; grid-template-columns:repeat(5,1fr); gap:5px 4px; font-size:13px; }
.d1-ch span { display:flex; align-items:center; gap:3px; font-family:var(--mono); }
`,
  js: `
(function () {
  var svg = DH.$('#d1-radar'), n = 12, c = 165, cy = 158, r = 112, prev = null;
  function ang(i) { return -Math.PI / 2 + i * 2 * Math.PI / n; }
  function kk(f, v) { return Math.min((DH.abs() ? v / 55 : v / DH.B[f]) * 0.6, 1.09); }
  function xy(i, k) { return [c + k * r * Math.cos(ang(i)), cy + k * r * Math.sin(ang(i))]; }
  function pts(ks) { return ks.map(function (k, i) { return xy(i, k).map(function (z) { return z.toFixed(1); }).join(','); }); }
  function trace(ks, trous, stroke, w, extra) { // ligne brisée aux axes inconnus (jamais tracés à 0)
    var P = pts(ks), s = '', seg = [];
    for (var j = 0; j <= n; j++) { var i = j % n; if (trous.indexOf(DH.ROUE[i]) >= 0) { if (seg.length > 1) s += '<polyline points="' + seg.join(' ') + '" fill="none" stroke="' + stroke + '" stroke-width="' + w + '" stroke-linejoin="round" stroke-linecap="round"' + (extra || '') + '/>'; seg = []; } else seg.push(P[i]); }
    if (seg.length > 1) s += '<polyline points="' + seg.join(' ') + '" fill="none" stroke="' + stroke + '" stroke-width="' + w + '" stroke-linejoin="round" stroke-linecap="round"' + (extra || '') + '/>';
    return s;
  }
  function dessiner(p, hop, ref) {
    var s = '<defs><pattern id="d1-h" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#c9cad2" stroke-width="1.5"/></pattern></defs>';
    p.inc.forEach(function (f) { var i = DH.ROUE.indexOf(f), a = xy(i - 0.5, 1), b = xy(i + 0.5, 1); s += '<path d="M' + c + ',' + cy + 'L' + a[0].toFixed(1) + ',' + a[1].toFixed(1) + 'A' + r + ',' + r + ' 0 0 1 ' + b[0].toFixed(1) + ',' + b[1].toFixed(1) + 'Z" fill="url(#d1-h)"/>'; });
    [0.3, 0.6, 1].forEach(function (k) { s += '<polygon points="' + pts(DH.ROUE.map(function () { return k; })).join(' ') + '" fill="none" stroke="#e1e3e9"/>'; });
    DH.ROUE.forEach(function (f, i) { var e = xy(i, 1); s += '<line x1="' + c + '" y1="' + cy + '" x2="' + e[0].toFixed(1) + '" y2="' + e[1].toFixed(1) + '" stroke="#e1e3e9"/>'; });
    var zk = DH.ROUE.map(function (f) { return DH.abs() ? DH.B[f] / 55 * 0.6 : 0.6; });
    s += '<polygon data-role="zone" points="' + pts(zk).join(' ') + '" fill="#c9cdd6" fill-opacity=".5" stroke="#9a9aa6"/>';
    s += '<g data-serie="avant">' + trace(DH.ROUE.map(function (f) { return kk(f, DH.AV[f]); }), DH.AVI, '#7a7f8c', 1.6) + '</g>';
    if (ref) s += '<g data-serie="froid">' + trace(ref, p.inc, '#c9bde6', 6) + '</g>';
    s += '<g data-serie="Idaho 7" data-couleur="#5b3fa0">' + trace(hop, p.inc, '#5b3fa0', 2.6) + '</g>';
    hop.forEach(function (k, i) { if (p.inc.indexOf(DH.ROUE[i]) >= 0) return; var q = xy(i, Math.min(k, 1)); s += '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="3" fill="#5b3fa0"/>';
      if (k > 1) { var o = xy(i, 1.09); s += '<line x1="' + q[0].toFixed(1) + '" y1="' + q[1].toFixed(1) + '" x2="' + o[0].toFixed(1) + '" y2="' + o[1].toFixed(1) + '" stroke="#c2410c" stroke-width="2.6" stroke-linecap="round"/>'; } });
    DH.ROUE.forEach(function (f, i) { var q = xy(i, 1.22); s += '<svg x="' + (q[0] - 10).toFixed(1) + '" y="' + (q[1] - 10).toFixed(1) + '" width="20" height="20" viewBox="0 0 24 24" data-famille="' + f + '" aria-label="' + DH.COURT[f] + '"><use href="#p-' + f + '"/></svg>'; });
    svg.innerHTML = s;
  }
  DH.surChange(function (p) {
    var hop = DH.ROUE.map(function (f) { return kk(f, p.c[f]); });
    var ref = p.perte ? DH.ROUE.map(function (f) { return kk(f, p.c[f] + p.emporte[f]); }) : null;
    var de = prev || hop; prev = hop;
    DH.tween(220, function (t) { dessiner(p, hop.map(function (k, i) { return de[i] + (k - de[i]) * t; }), ref); });
    var df = p.c.floral - DH.AV.floral, dr = p.c.resin - DH.AV.resin;
    var ibu = p.ibu == null ? '<span class="d1-ibu">IBU 60 + ? à cru</span>' : '<span class="d1-ibu' + (p.ibu > 70 ? ' dx-hors' : '') + '">≈ ' + p.ibu + ' IBU' + (p.ibu > 70 ? ' trop amer' : ' tenue') + '</span>';
    DH.$('#d1-rep').innerHTML = DH.pic('floral', 18) + '<span style="color:' + DH.T.floral + '">Floral ~' + DH.sg(df) + '</span>' + DH.pic('resin', 18) + '<span class="dx-hors">Résineux ~' + DH.sg(dr) + '</span>' + ibu;
    DH.$('#d1-ch').innerHTML = DH.ORDRE.filter(function (f) { return f !== 'floral' && f !== 'resin'; }).map(function (f) {
      if (p.inc.indexOf(f) >= 0) return '<span>' + DH.pic(f, 15) + '?</span>';
      var v = p.c[f], d = DH.AVI.indexOf(f) >= 0 ? v : v - DH.AV[f];
      return '<span style="color:' + (DH.hors(f, v) ? '#c2410c' : DH.T[f]) + '">' + DH.pic(f, 15) + (Math.abs(d) < 0.5 ? '≈' : '~' + (DH.AVI.indexOf(f) >= 0 ? DH.fr(v) : DH.sg(d))) + '</span>'; }).join('');
    var em = DH.ROUE.filter(function (f) { return p.emporte[f] >= 0.5; }).sort(function (a, b) { return p.emporte[b] - p.emporte[a]; }).slice(0, 2);
    DH.$('#d1-perte').innerHTML = !p.perte ? 'après fermentation : rien d’emporté' + (p.interp ? '' : '')
      : '<i></i>' + (p.perte === 'co2' ? 'le CO₂ emporte ' : 'la chaleur emporte ') + em.map(function (f) { return '<b>~−' + DH.fr(p.emporte[f]) + '</b> ' + DH.COURT[f].toLowerCase(); }).join(', ') + (p.interp ? ' · ≈ interpolé' : '');
  });
})();
`,
};
