// d8 · chaude · « Le ruban de ta stout » : ta stout est un ruban de couleurs, une longueur par famille (son
// intensité au style). En haut, ta stout avant : presque toute résineuse. Dessous, avec Idaho 7 au moment
// choisi : le ruban s'allonge et se colore en direct, et ce que le moment emporte traîne en gris hachuré au
// bout. Sous chaque segment, le trait du style : vert d'eau dedans, orangé au-delà. Quatre petits rubans
// (60′, whirlpool, actif, après) disent d'un coup d'œil où la couleur arrive. Levure : dernière étape.
export default {
  id: 'd8', titre: 'Le ruban de ta stout', chaleur: 'chaude', levure: 'etape',
  legende: ['ruban : une longueur par famille, au style', 'hachuré gris au bout : ce que le moment emporte', 'trait sous le ruban : dans le style (gris), au-delà (orangé)', '~ simulé ; ≈ interpolé ; Pépins et Melon : inconnus'],
  corps: `<section class="dx-bloc d8-bloc"><p class="d8-l">ta stout avant</p><div class="d8-rub" id="d8-av"></div>
<p class="d8-l">avec Idaho 7 · <b id="d8-m"></b></p><div class="d8-rub d8-grand" id="d8-ap"></div><p class="d8-perte" id="d8-perte"></p></section>
<section class="dx-bloc d8-mini" id="d8-mini"></section>`,
  css: `
.d8-bloc { display:flex; flex-direction:column; gap:4px; }
.d8-l { font-size:13px; color:var(--gris); margin-top:4px; } .d8-l b { color:var(--encre); }
.d8-rub { position:relative; height:30px; display:flex; overflow:hidden; }
.d8-grand { height:52px; }
.d8-s { position:relative; height:100%; flex:none; display:flex; align-items:center; justify-content:center; overflow:hidden; transition:width .24s cubic-bezier(.2,.8,.2,1); }
.d8-s:first-child { border-radius:4px 0 0 4px; }
.d8-s .pi { width:16px; height:16px; }
.d8-s .d8-pc { background:#fff; border-radius:4px; padding:1px; display:flex; }
.d8-s .d8-pc.d8-pn { background:none; }
.d8-s i.d8-z { position:absolute; left:0; bottom:0; height:4px; background:#9a9aa6; }
.d8-s i.d8-o { position:absolute; bottom:0; height:4px; background:#c2410c; }
.d8-e { height:100%; flex:none; background:repeating-linear-gradient(135deg,#9a9aa6 0 2px,transparent 2px 6px); border-radius:0 4px 4px 0; transition:width .24s; }
.d8-v { display:flex; height:16px; font:600 12px var(--mono); }
.d8-v span { flex:none; overflow:hidden; text-align:center; white-space:nowrap; transition:width .24s; }
.d8-perte { font-size:13px; color:var(--gris); min-height:18px; display:flex; align-items:center; gap:4px; flex-wrap:wrap; } .d8-perte b { color:var(--encre); }
.d8-mini { display:grid; grid-template-columns:52px 1fr; gap:6px 8px; align-items:center; font-size:13px; }
.d8-mini .d8-rub { height:14px; }
.d8-mini .d8-ici { font-weight:700; color:var(--encre); }
.d8-mini span { color:var(--gris); }
`,
  js: `
(function () {
  var fams = DH.ORDRE.filter(function (f) { return f !== 'pomeFruit' && f !== 'melon'; });
  function u(f, v) { return DH.abs() ? v / 55 : v / DH.B[f]; } // unités : une bande du style (au style), 55 points (absolu)
  var maxU = { s: 0, a: 0 }; [false, true].forEach(function (ab) { DH.M.forEach(function (p) { var t = fams.reduce(function (s, f) { var v = p.c[f] + p.emporte[f]; return s + (ab ? v / 55 : v / DH.B[f]); }, 0); if (ab) maxU.a = Math.max(maxU.a, t); else maxU.s = Math.max(maxU.s, t); }); });
  var PX = function () { var w = DH.$('#d8-av').clientWidth - 6; return w / (DH.abs() ? maxU.a : maxU.s); };
  function ruban(vals, opts) { opts = opts || {}; var s = '', px = PX() * (opts.k || 1);
    fams.forEach(function (f, i) { var w = u(f, vals[i]) * px; if (w < 0.5) return; var zw = Math.min(1, DH.abs() ? DH.B[f] / 55 / u(f, vals[i]) : 1 / u(f, vals[i])) * w;
      s += '<span class="d8-s" data-f="' + f + '" style="width:' + w.toFixed(1) + 'px;background:' + DH.BA[f] + '">' + (opts.pic && w >= 22 ? '<span class="d8-pc">' + DH.pic(f, 16) + '</span>' : '') +
        (opts.zone ? '<i class="d8-z" data-role="zone" style="width:' + zw.toFixed(1) + 'px"></i>' + (zw < w - 0.5 ? '<i class="d8-o" style="left:' + zw.toFixed(1) + 'px;width:' + (w - zw).toFixed(1) + 'px"></i>' : '') : '') + '</span>'; });
    if (opts.emporte) s += '<span class="d8-e" style="width:' + (opts.emporte * px).toFixed(1) + 'px"></span>';
    return s; }
  var MINI = [['60′', 0], ['WP', 11], ['actif', 14], ['après', 19]];
  DH.surChange(function (p, i) {
    var av = fams.map(function (f) { return DH.AV[f]; }), ap = fams.map(function (f) { return p.c[f]; });
    DH.$('#d8-av').innerHTML = ruban(av, { pic: true, zone: true });
    var em = p.perte ? fams.reduce(function (s, f) { return s + u(f, p.c[f] + p.emporte[f]) - u(f, p.c[f]); }, 0) : 0;
    DH.$('#d8-ap').innerHTML = ruban(ap, { pic: true, zone: true, emporte: em });
    DH.$('#d8-m').textContent = p.lib + (p.interp ? ' ≈' : '') + (p.ibu == null ? ' · IBU 60 + ? à cru' : ' · ≈ ' + p.ibu + ' IBU' + (p.ibu > 70 ? ' trop amer' : ''));
    var top = fams.slice().sort(function (a, b) { return p.emporte[b] - p.emporte[a]; })[0], df = p.c.floral - DH.AV.floral;
    DH.$('#d8-perte').innerHTML = DH.pic('floral', 14) + ' <span style="color:' + DH.T.floral + '">floral ~' + DH.sg(df) + '</span> · ' + (!p.perte || p.emporte[top] < 0.5 ? 'rien d’emporté' : (p.perte === 'co2' ? 'le CO₂ emporte ' : 'la chaleur emporte ') + '<b>~−' + DH.fr(p.emporte[top]) + '</b> ' + DH.COURT[top].toLowerCase());
    var seg = p.seg === 1 ? 1 : p.seg === 0 ? 0 : p.seg === 2 ? 2 : 3;
    DH.$('#d8-mini').innerHTML = MINI.map(function (m, k) { var q = DH.M[m[1]]; return '<span class="' + (k === seg ? 'd8-ici' : '') + '">' + m[0] + '</span><div class="d8-rub">' + ruban(fams.map(function (f) { return q.c[f]; }), { k: 0.78 }) + '</div>'; }).join('');
  });
})();
`,
};
