// d3 · tiède · « Le nez du verre » : un verre de ta stout (EBC stout) ; au-dessus de la mousse, chaque
// famille monte en un filet à sa couleur, haut comme son intensité au style. Glisser le moment : les filets
// montent ou tombent ; ce que la chaleur ou le CO₂ emporte reste en filet pâle, les bulles ou la vapeur le
// montrent. L'amertume est écrite dans la bière. Levure : dernière étape de Dryhopper.
export default {
  id: 'd3', titre: 'Le nez du verre', chaleur: 'tiède', levure: 'etape',
  legende: ['filet : une famille d’arômes, haute comme son intensité', 'filet pâle : ce que la chaleur ou le CO₂ emporte', 'colonne grise : zone du style 16D ; trait noir : ta stout avant', '~ simulé ; ≈ interpolé ; Pépins et Melon : inconnus'],
  corps: `<section class="dx-bloc d3-bloc"><div class="d3-scene"><svg id="d3-verre" class="d3-verre" viewBox="0 0 350 440" width="350" height="440" role="img" aria-label="Le nez de ta stout avec Idaho 7"></svg><div class="d3-biere" id="d3-biere"></div></div><p class="d3-perte" id="d3-perte"></p></section>`,
  css: `
.d3-bloc { padding:4px 6px 8px; }
.d3-scene { position:relative; }
.d3-verre { width:100%; height:auto; }
.d3-biere { position:absolute; left:50%; top:69%; transform:translateX(-50%); background:#3B1F14; color:#F5F0EA; border-radius:4px; padding:2px 6px; display:flex; flex-direction:column; align-items:center; gap:3px; text-align:center; white-space:nowrap; }
.d3-biere b { font:600 15px var(--sans); }
.d3-biere .num { font-size:17px; font-weight:600; }
.d3-biere small { font-size:13px; color:#D8CEC5; }
.d3-perte { font-size:13px; color:var(--gris); min-height:18px; padding-left:4px; }
.d3-perte b { color:var(--encre); }
`,
  js: `
(function () {
  var svg = DH.$('#d3-verre'), fams = DH.ORDRE.filter(function (f) { return f !== 'pomeFruit' && f !== 'melon'; }), prev = null;
  var rim = 262, H = 200, x0 = 70, pas = 23.3, ns = 'http://www.w3.org/2000/svg';
  function cx(i) { return x0 + i * pas; }
  function ondule(x, y1, y2, a) { var d = 'M' + x + ',' + y1, n = Math.max(1, Math.round((y1 - y2) / 14)), h = (y1 - y2) / n;
    for (var k = 0; k < n; k++) { var s = k % 2 ? -a : a; d += ' Q' + (x + s).toFixed(1) + ',' + (y1 - h * k - h / 2).toFixed(1) + ' ' + x + ',' + (y1 - h * (k + 1)).toFixed(1); } return d; }
  function hauteur(f, v) { return H * Math.min(DH.S(f, v), 1.04); }
  function dessiner(p, hs) {
    var s = '';
    // le verre (nonic), la stout, la mousse
    s += '<path d="M58,272 L72,430 Q73,436 80,436 L270,436 Q277,436 278,430 L292,272 Z" fill="#3B1F14"/>';
    s += '<path d="M54,262 Q56,250 70,250 L280,250 Q294,250 296,262 L292,276 L58,276 Z" fill="#E9DCC8"/>';
    s += '<path d="M54,250 L72,430 Q73,436 80,436 L270,436 Q277,436 278,430 L296,250" fill="none" stroke="#3D342E" stroke-width="2" stroke-linejoin="round"/>';
    if (p.perte === 'co2') for (var b = 0; b < 14; b++) { var bx = 90 + (b * 53) % 170, by = 300 + (b * 37) % 120; s += '<circle cx="' + bx + '" cy="' + by + '" r="' + (2 + b % 3) + '" fill="none" stroke="#E9DCC8" stroke-width="1.4" opacity=".75"/>'; }
    // la zone du style, colonne par colonne
    fams.forEach(function (f, i) { var z = H * DH.Z(f); s += '<rect data-role="zone" x="' + (cx(i) - 7) + '" y="' + (rim - z).toFixed(1) + '" width="14" height="' + z.toFixed(1) + '" rx="2" fill="#e3e5eb"/>'; });
    fams.forEach(function (f, i) {
      var x = cx(i), h = hs[i], e = hauteur(f, p.c[f] + p.emporte[f]);
      if (p.perte && e - h > 1) s += '<path d="' + ondule(x, rim - h, rim - e, 3) + '" fill="none" stroke="' + DH.BA[f] + '" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>';
      if (h > 1) s += '<path d="' + ondule(x, rim, rim - h, 3) + '" fill="none" stroke="' + DH.BA[f] + '" stroke-width="3.2" stroke-linecap="round"/>';
      if (DH.AVI.indexOf(f) < 0) { var a = rim - hauteur(f, DH.AV[f]); s += '<line x1="' + (x - 6) + '" y1="' + a.toFixed(1) + '" x2="' + (x + 6) + '" y2="' + a.toFixed(1) + '" stroke="#16161a" stroke-width="2"/>'; }
      if (DH.hors(f, p.c[f]) && DH.S(f, p.c[f]) > 1) s += '<circle cx="' + x + '" cy="' + (rim - h).toFixed(1) + '" r="4" fill="#c2410c"/>';
      var ty = Math.min(rim - Math.max(h, e) - 22, rim - 30);
      s += '<svg x="' + (x - 9) + '" y="' + ty.toFixed(1) + '" width="18" height="18" viewBox="0 0 24 24" data-famille="' + f + '" aria-label="' + DH.COURT[f] + '"><use href="#p-' + f + '"/></svg>';
    });
    // vapeur à l'ébullition
    if (p.perte === 'chaleur') s += '<path d="M300,150 q10,-14 24,-6 q14,-6 18,8 q10,4 2,14 l-44,0 q-10,-8 0,-16 Z" fill="none" stroke="#9a9aa6" stroke-width="1.6" stroke-linejoin="round"/>';
    svg.innerHTML = s;
    // le moment et l'amertume, écrits dans la bière
    DH.$('#d3-biere').innerHTML = '<b>' + p.lib + (p.interp ? ' ≈' : '') + '</b><span class="num">' + (p.ibu == null ? '≈ 60 IBU + ?' : '≈ ' + p.ibu + ' IBU') + '</span><small>' + (p.ibu == null ? 'à cru · 16D 50–70' : p.ibu > 70 ? 'trop amer · 16D 50–70' : 'tenue · 16D 50–70') + '</small>';
  }
  DH.surChange(function (p) {
    var hs = fams.map(function (f) { return hauteur(f, p.c[f]); }), de = prev || hs; prev = hs;
    DH.tween(240, function (t) { dessiner(p, hs.map(function (h, i) { return de[i] + (h - de[i]) * t; })); });
    var top = fams.slice().sort(function (a, b) { return p.emporte[b] - p.emporte[a]; })[0];
    var df = p.c.floral - DH.AV.floral;
    DH.$('#d3-perte').innerHTML = '<span style="color:' + DH.T.floral + '">Floral ~' + DH.sg(df) + '</span> · ' + (!p.perte || p.emporte[top] < 0.5 ? 'rien d’emporté' : (p.perte === 'co2' ? 'le CO₂ emporte ' : 'la vapeur emporte ') + '<b>~−' + DH.fr(p.emporte[top]) + '</b> ' + DH.COURT[top].toLowerCase());
  });
})();
`,
};
