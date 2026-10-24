// d4 · tiède · « Les aiguilles de ta demande » : la dégustation du 18.10 (« trop résineuse, je la veux plus
// floral ») devient trois cadrans dont l'aiguille suit le pouce : floral, résineux, amertume. Sur chaque
// cadran, la zone du style, ta stout avant (trait fin) et ce que le moment emporte (arc hachuré). Les autres
// familles en pastilles. Le meilleur moment pour ta demande est nommé. Levure : pont vers l'outil Levure.
export default {
  id: 'd4', titre: 'Les aiguilles de ta demande', chaleur: 'tiède', levure: 'outil',
  legende: ['aiguille : ta stout avec Idaho 7 ; trait fin : avant', 'arc gris : zone du style 16D ; hachuré : emporté', 'ta demande : ta dégustation du 18.10', '~ simulé ; ≈ interpolé ; ? inconnu, pas zéro'],
  corps: `<p class="d4-dem"><span>Ta demande</span> « plus floral, moins résineux »</p>
<section class="dx-bloc d4-bloc"><div class="d4-g" id="d4-floral"></div><div class="d4-g" id="d4-resin"></div><div class="d4-g" id="d4-ibu"></div><div class="d4-ch" id="d4-ch"></div></section>
<p class="d4-ver" id="d4-ver" data-nature="simule"></p>`,
  css: `
.d4-dem { font-size:14px; color:var(--encre); } .d4-dem span { color:var(--gris); font-size:13px; margin-right:4px; }
.d4-bloc { display:grid; grid-template-columns:1fr 1fr; gap:6px 8px; padding:8px; }
.d4-g { display:flex; flex-direction:column; align-items:center; }
.d4-g > svg { width:100%; height:auto; }
.d4-t { display:flex; align-items:center; gap:5px; font-size:14px; font-weight:600; align-self:flex-start; }
.d4-t small { font-weight:400; color:var(--gris); font-size:12px; }
.d4-v { font:600 20px var(--mono); }
.d4-d { font-size:13px; color:var(--gris); min-height:16px; }
.d4-l { display:flex; align-items:baseline; gap:6px; margin-top:-2px; }
.d4-ch { display:grid; grid-template-columns:1fr 1fr; gap:4px 6px; align-content:center; font-size:13px; }
.d4-ch span { display:flex; align-items:center; gap:4px; font-family:var(--mono); }
.d4-ver { font-size:14px; display:flex; align-items:center; gap:6px; min-height:20px; }
.d4-ver b { color:var(--hop); }
`,
  js: `
(function () {
  var prev = {};
  function arcPt(c, r, k) { var a = Math.PI * (1 - k); return [c[0] + r * Math.cos(a), c[1] - r * Math.sin(a)]; }
  function arc(c, r, k0, k1) { k0 = Math.max(0, Math.min(1, k0)); k1 = Math.max(0, Math.min(1, k1)); if (k1 - k0 < 0.002) return ''; var a = arcPt(c, r, k0), b = arcPt(c, r, k1); return 'M' + a[0].toFixed(1) + ',' + a[1].toFixed(1) + ' A' + r + ',' + r + ' 0 0 1 ' + b[0].toFixed(1) + ',' + b[1].toFixed(1); }
  function cadran(o) { // o : { k, z0, z1, av, em, coul, hors }
    var c = [90, 86], r = 66, s = '<svg viewBox="0 0 180 96" width="170" height="91"><defs><pattern id="d4-h' + o.id + '" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="' + o.coul + '" stroke-width="2"/></pattern></defs>';
    s += '<path d="' + arc(c, r, 0, 1) + '" fill="none" stroke="#f1f2f5" stroke-width="14"/>';
    s += '<path data-role="zone" d="' + arc(c, r, o.z0, o.z1) + '" fill="none" stroke="#d9dce3" stroke-width="14"/>';
    s += '<path d="' + arc(c, r, 0, o.k) + '" fill="none" stroke="' + o.coul + '" stroke-width="8"/>';
    if (o.em) s += '<path d="' + arc(c, r, o.k, o.k + o.em) + '" fill="none" stroke="url(#d4-h' + o.id + ')" stroke-width="8"/>';
    if (o.av != null) { var a1 = arcPt(c, r - 10, o.av), a2 = arcPt(c, r + 10, o.av); s += '<line x1="' + a1[0].toFixed(1) + '" y1="' + a1[1].toFixed(1) + '" x2="' + a2[0].toFixed(1) + '" y2="' + a2[1].toFixed(1) + '" stroke="#16161a" stroke-width="2"/>'; }
    var n = arcPt(c, r - 4, Math.min(o.k, 1)); s += '<line x1="90" y1="86" x2="' + n[0].toFixed(1) + '" y2="' + n[1].toFixed(1) + '" stroke="' + (o.hors ? '#c2410c' : '#16161a') + '" stroke-width="3" stroke-linecap="round"/><circle cx="90" cy="86" r="5" fill="#16161a"/>';
    return s + '</svg>';
  }
  function fam(id, f, txt, p, kk) {
    var v = p.c[f], d = v - DH.AV[f], el = DH.$('#' + id);
    el.innerHTML = '<span class="d4-t">' + DH.pic(f, 18) + '<span style="color:' + DH.T[f] + '">' + DH.COURT[f] + '</span><small>' + txt + '</small></span>' +
      cadran({ id: f, k: kk(v), z0: 0, z1: DH.Z(f), av: kk(DH.AV[f]), em: p.perte ? kk(v + p.emporte[f]) - kk(v) : 0, coul: DH.BA[f], hors: DH.hors(f, v) }) +
      '<span class="d4-l"><span class="d4-v' + (DH.hors(f, v) ? ' dx-hors' : '') + '">~' + DH.fr(v) + '</span><span class="d4-d">' + (Math.abs(d) < 0.5 ? '≈ avant' : DH.sg(d) + ' sur avant') + '</span></span>';
  }
  DH.surChange(function (p) {
    var de = prev.p || p; prev.p = p;
    DH.tween(240, function (t) {
      var q = { c: {}, emporte: p.emporte, perte: p.perte }; ['floral', 'resin'].forEach(function (f) { q.c[f] = de.c[f] + (p.c[f] - de.c[f]) * t; });
      fam('d4-floral', 'floral', 'plus', q, function (v) { return DH.S('floral', v); });
      fam('d4-resin', 'resin', 'moins', q, function (v) { return DH.S('resin', v); });
      var ib0 = de.ibu == null ? 60 : de.ibu, ib1 = p.ibu == null ? 60 : p.ibu, ib = ib0 + (ib1 - ib0) * t;
      DH.$('#d4-ibu').innerHTML = '<span class="d4-t">Amertume <small>' + (ib > 70 ? 'trop amer' : 'tenue') + '</small></span>' + cadran({ id: 'ibu', k: ib / 170, z0: 50 / 170, z1: 70 / 170, av: 60 / 170, em: 0, coul: '#5b3fa0', hors: ib > 70 }) +
        '<span class="d4-l"><span class="d4-v' + (ib > 70 ? ' dx-hors' : '') + '">≈' + Math.round(ib) + '</span><span class="d4-d">' + (p.ibu == null ? 'IBU + ? à cru' : 'IBU · 16D 50–70') + '</span></span>';
    });
    DH.$('#d4-ch').innerHTML = DH.ORDRE.filter(function (f) { return f !== 'floral' && f !== 'resin'; }).map(function (f) {
      if (p.inc.indexOf(f) >= 0) return '<span>' + DH.pic(f, 15) + '?</span>';
      var v = p.c[f], d = DH.AVI.indexOf(f) >= 0 ? v : v - DH.AV[f];
      return '<span style="color:' + (DH.hors(f, v) ? '#c2410c' : DH.T[f]) + '">' + DH.pic(f, 15) + (Math.abs(d) < 0.5 ? '≈' : '~' + (DH.AVI.indexOf(f) >= 0 ? DH.fr(v) : DH.sg(d))) + '</span>'; }).join('');
    var b = DH.M[DH.best], ici = DH.cur() === DH.best || (p.seg === b.seg && Math.abs(p.c.floral - b.c.floral) < 0.05 && Math.abs(p.c.resin - b.c.resin) < 0.05);
    DH.$('#d4-ver').innerHTML = ici ? '<b>Le meilleur moment pour ta demande</b> ~' : 'Meilleur pour ta demande : <b>' + b.lib + '</b> ~' + (p.interp ? ' · ici ≈ interpolé' : '');
  });
})();
`,
};
