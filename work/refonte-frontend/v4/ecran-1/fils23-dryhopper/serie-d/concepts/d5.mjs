// d5 · chaude · « Les fioles » : ce qui reste d'Idaho 7 dans ta stout, composé par composé. Quatre fioles
// (linalol et géraniol pour le floral, myrcène pour le résineux, 4MMP pour le tropical) se vident en direct
// quand on glisse vers 60′ : la part retrouvée en bière, sur une échelle log (0,1 % à 100 %), avec sa
// plage sourcée. Sous chaque fiole, la vraie teneur du lot (CoA 2025). Levure : pont vers l'outil Levure
// (Pomona change le géraniol en citronellol).
import { PARTS, LOT, fr1 } from '../socle.mjs';

const C = [
  { k: 'linalol', nom: 'Linalol', f: 'floral', lot: LOT.composes.linalol },
  { k: 'geraniol', nom: 'Géraniol', f: 'floral', lot: LOT.composes.geraniol },
  { k: 'myrcene', nom: 'Myrcène', f: 'resin', lot: LOT.composes.myrcene },
  { k: '4MMP', nom: '4MMP', f: 'tropical', lot: null },
];
const P = Object.fromEntries(C.map((c) => [c.k, Object.fromEntries(Object.entries(PARTS[c.k]).map(([m, v]) => [m, { b: v.bas, c: v.centre, h: v.haut, s: v.sources.join(', ') }]))]));

export default {
  id: 'd5', titre: 'Les fioles', chaleur: 'chaude', levure: 'outil',
  legende: ['fiole : part du composé retrouvée dans ta stout', 'trait : plage publiée ; hachuré : bas non publié', 'échelle log : chaque trait vaut ×10', '~ centre en convention du moteur ; ≈ interpolé'],
  corps: `<section class="dx-bloc d5-bloc"><p class="d5-t"><span>reste dans ta stout</span><span class="d5-m" id="d5-m"></span></p><svg id="d5-svg" class="d5-svg" viewBox="0 0 350 290" width="350" height="290" role="img" aria-label="Part de chaque composé d'Idaho 7 retrouvée dans ta stout"></svg>
<div class="d5-noms"><span class="d5-n d5-lotl"><b>&nbsp;</b><span class="d5-lot">lot</span></span>${C.map((c) => `<span class="d5-n"><b>${c.nom}</b><span class="d5-lot" data-nature="mesure" data-source="${c.lot == null ? 'H11' : 'coa-id7-2573'}">${c.lot == null ? '? <small>non dosé</small>' : fr1(c.lot).replace('.', ',') + ' %'}</span></span>`).join('')}</div>
<p class="d5-res" id="d5-res" data-nature="simule"></p></section>`,
  css: `
.d5-bloc { display:flex; flex-direction:column; gap:4px; }
.d5-t { font-size:13px; color:var(--gris); display:flex; justify-content:space-between; }
.d5-m { color:var(--encre); font-weight:600; }
.d5-svg { width:100%; height:auto; }
.d5-noms { display:grid; grid-template-columns:44px repeat(4,1fr); font-size:13px; text-align:center; }
.d5-n { display:flex; flex-direction:column; align-items:center; gap:1px; }
.d5-lot { font-family:var(--mono); font-size:12px; color:var(--encre); }
.d5-lotl .d5-lot { font-family:var(--sans); color:var(--gris); }
.d5-lot small { font-family:var(--sans); color:var(--gris); }
.d5-res { display:flex; align-items:center; gap:5px; flex-wrap:wrap; font-size:14px; border-top:1px solid var(--trait); padding-top:6px; }
.d5-res b { font-weight:600; }
.d5-fb { display:grid; grid-template-columns:92px 1fr 40px; align-items:center; gap:6px; width:100%; font-size:13px; }
.d5-fb > span:first-child { display:flex; align-items:center; gap:4px; }
.d5-pi { position:relative; height:12px; background:#f1f2f5; border-radius:2px; overflow:hidden; }
.d5-pi i { position:absolute; top:0; bottom:0; left:0; display:block; }
.d5-pi .d5-fz { background:#d9dce3; }
.d5-pi .d5-ff { top:3px; bottom:3px; border-radius:2px; transition:width .25s; }
.d5-fv { text-align:right; font-family:var(--mono); }
`,
  js: `
(function () {
  var C = ${JSON.stringify(C.map(({ k, nom, f }) => ({ k, nom, f })))}, P = ${JSON.stringify(P)};
  var svg = DH.$('#d5-svg'), prev = null, X0 = 44, W = 76, top = 26, bas = 262;
  function y(pc) { return bas - (Math.log10(Math.max(pc, 0.1)) + 1) / 3 * (bas - top); }
  function lin(a, b, t) { return a == null || b == null ? null : a + (b - a) * t; }
  function parts(p, k) { var Q = P[k];
    if (p.seg === 0) { var t = (60 - p.min) / 50; return { b: lin(Q.b60.b, Q.b10.b, t), c: lin(Q.b60.c, Q.b10.c, t), h: lin(Q.b60.h, Q.b10.h, t), s: Q.b10.s }; }
    return [null, Q.wp, Q.dryActive, Q.dryPost][p.seg]; }
  function dessiner(p, cs) {
    var s = '<defs><pattern id="d5-h" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" stroke="#9a9aa6" stroke-width="1.4"/></pattern></defs>';
    [100, 10, 1, 0.1].forEach(function (v) { var yy = y(v); s += '<line x1="' + (X0 - 4) + '" y1="' + yy.toFixed(1) + '" x2="346" y2="' + yy.toFixed(1) + '" stroke="#eceef2"/><text x="' + (X0 - 8) + '" y="' + (yy + 4).toFixed(1) + '" text-anchor="end" font-size="12" fill="#55555f">' + String(v).replace('.', ',') + ' %</text>'; });
    C.forEach(function (c, i) {
      var q = parts(p, c.k), x = X0 + 6 + i * W, w = 44, cc = cs[i];
      s += '<rect x="' + x + '" y="' + (top - 6) + '" width="' + w + '" height="' + (bas - top + 12) + '" rx="8" fill="#fff" stroke="#3D342E" stroke-width="1.6"/>';
      s += '<rect x="' + (x + 3) + '" y="' + y(cc).toFixed(1) + '" width="' + (w - 6) + '" height="' + (bas + 3 - y(cc)).toFixed(1) + '" rx="4" fill="' + DH.BA[c.f] + '"/>';
      var yh = y(Math.min(q.h, 100)), yb = q.b == null ? bas : y(q.b), xr = x + w + 6;
      if (q.b == null) s += '<rect x="' + (xr - 3) + '" y="' + yh.toFixed(1) + '" width="6" height="' + (bas - yh).toFixed(1) + '" fill="url(#d5-h)"/>';
      s += '<line x1="' + xr + '" y1="' + yh.toFixed(1) + '" x2="' + xr + '" y2="' + yb.toFixed(1) + '" stroke="#16161a" stroke-width="1.6"/><line x1="' + (xr - 4) + '" y1="' + yh.toFixed(1) + '" x2="' + (xr + 4) + '" y2="' + yh.toFixed(1) + '" stroke="#16161a" stroke-width="1.6"/>' + (q.b == null ? '' : '<line x1="' + (xr - 4) + '" y1="' + yb.toFixed(1) + '" x2="' + (xr + 4) + '" y2="' + yb.toFixed(1) + '" stroke="#16161a" stroke-width="1.6"/>');
      var ty = Math.min(Math.max(top + 12, y(cc) - 8), bas - 30);
      s += '<text x="' + (x + w / 2) + '" y="' + ty.toFixed(1) + '" text-anchor="middle" font-family="IBM Plex Mono, Consolas, monospace" font-size="14" font-weight="600" fill="#16161a">~' + (cc < 1 ? String(Math.round(cc * 10) / 10).replace('.', ',') : Math.round(cc)) + '%</text>';
      s += '<svg x="' + (x + w / 2 - 9) + '" y="' + (bas - 24) + '" width="18" height="18" viewBox="0 0 24 24" data-famille="' + c.f + '" aria-label="' + DH.COURT[c.f] + '"><use href="#p-' + c.f + '"/></svg>';
    });
    svg.innerHTML = s;
  }
  DH.surChange(function (p) {
    var cs = C.map(function (c) { return parts(p, c.k).c; }), de = prev || cs; prev = cs;
    DH.tween(260, function (t) { dessiner(p, cs.map(function (v, i) { return Math.exp(Math.log(de[i]) + (Math.log(v) - Math.log(de[i])) * t); })); });
    DH.$('#d5-m').textContent = p.lib + (p.interp ? ' ≈' : '');
    var fs = ['floral', 'tropical', 'resin'];
    function pc(x) { return Math.max(0, Math.min(100, x * 100)).toFixed(1) + '%'; }
    DH.$('#d5-res').innerHTML = '<span class="dx-src">' + (p.perte === 'co2' ? 'le CO₂ emporte la moitié du myrcène ; dans ta stout :' : p.perte === 'chaleur' ? 'la vapeur emporte ; dans ta stout :' : 'dans ta stout :') + ' ' + (p.ibu == null ? 'IBU 60 + ?' : '≈ ' + p.ibu + ' IBU') + '</span>' + fs.map(function (f) { var d = p.c[f] - DH.AV[f];
      return '<span class="d5-fb"><span>' + DH.pic(f, 15) + DH.COURT[f] + '</span><span class="d5-pi"><i class="d5-fz" data-role="zone" style="width:' + pc(DH.Z(f)) + '"></i><i class="d5-ff" style="width:' + pc(DH.S(f, p.c[f])) + ';background:' + DH.BA[f] + '"></i></span><span class="d5-fv" style="color:' + (DH.hors(f, p.c[f]) ? '#c2410c' : DH.T[f]) + '">~' + DH.sg(d) + '</span></span>'; }).join('');
    var lv = DH.$('#dx-lev'); if (lv) lv.innerHTML = 'Levure › <small>Pomona : géraniol → citronellol ~50 %</small>';
  });
})();
`,
};
