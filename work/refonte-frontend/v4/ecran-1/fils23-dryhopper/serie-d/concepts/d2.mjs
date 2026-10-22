// d2 · tiède · « Ce que le moment mange » : les barres l5b de la carte, à deux couches. Le plein est ce qui
// reste dans ta stout ; la queue hachurée, à la couleur de la famille, est ce que la chaleur ou le CO₂
// emporte. Glisser vers 60′ : le plein fond, la queue grandit. Jauge d'amertume de toute la stout (y1b).
// Levure : dernière étape de Dryhopper (« 1 Quand · 2 Levure », « Puis la levure › »).
export default {
  id: 'd2', titre: 'Ce que le moment mange', chaleur: 'tiède', levure: 'etape',
  legende: ['plein : ce qui reste dans ta stout avec Idaho 7', 'hachuré : ce que la chaleur ou le CO₂ emporte', 'rond : ta stout avant ; gris : zone du style 16D', '~ simulé ; ≈ interpolé ; ? inconnu, pas zéro'],
  corps: `<section class="dx-bloc d2-bloc"><p class="d2-cap" id="d2-cap"></p><div id="d2-rows"></div><p class="d2-inc" id="d2-inc"></p></section>
<section class="dx-bloc d2-ibu"><div class="d2-ibu-t"><span>amertume de ta stout</span><b class="num" id="d2-ibu-v"></b></div><div class="d2-jauge"><i class="d2-jz" data-role="zone"></i><i class="d2-jb"></i><i class="d2-jh" id="d2-jh"></i><i class="d2-jq" id="d2-jq"></i></div><div class="d2-ibu-l"><span>Nugget 60′ ≈ 60</span><span>16D 50–70</span></div></section>`,
  css: `
.d2-bloc { display:flex; flex-direction:column; gap:3px; }
.d2-cap { font-size:13px; color:var(--gris); display:flex; align-items:center; gap:6px; min-height:18px; margin-bottom:2px; }
.d2-cap i { width:22px; height:9px; border-radius:2px; background:repeating-linear-gradient(135deg,#8a8f99 0 2px,transparent 2px 5px); display:inline-block; box-shadow:inset 0 0 0 1px #8a8f99; }
.d2-cap b { color:var(--encre); }
.d2-r { display:grid; grid-template-columns:94px 1fr 48px; align-items:center; gap:6px; min-height:25px; font-size:14px; }
.d2-n { display:flex; align-items:center; gap:5px; }
.d2-n.att { font-weight:700; }
.d2-p { position:relative; height:16px; background:#f1f2f5; border-radius:2px; overflow:hidden; }
.d2-p i { position:absolute; top:0; bottom:0; left:0; display:block; }
.d2-z { background:#d9dce3; }
.d2-f { top:3px !important; bottom:3px !important; border-radius:2px; transition:width .22s cubic-bezier(.2,.8,.2,1); }
.d2-e { top:3px !important; bottom:3px !important; transition:left .22s cubic-bezier(.2,.8,.2,1), width .22s cubic-bezier(.2,.8,.2,1); }
.d2-a { width:10px; height:10px; top:3px !important; border-radius:50%; border:2px solid var(--encre); background:#fff; margin-left:-5px; transition:left .22s; }
.d2-v { text-align:right; font-family:var(--mono); font-size:13px; }
.d2-inc { font-size:12px; color:var(--gris); display:flex; align-items:center; gap:4px; margin-top:2px; }
.d2-ibu { display:flex; flex-direction:column; gap:4px; }
.d2-ibu-t { display:flex; justify-content:space-between; font-size:13px; color:var(--gris); }
.d2-ibu-t b { font-size:14px; color:var(--encre); }
.d2-jauge { position:relative; height:14px; background:#f1f2f5; border-radius:2px; overflow:hidden; }
.d2-jauge i { position:absolute; top:0; bottom:0; display:block; }
.d2-jz { left:${50 / 1.7}%; width:${20 / 1.7}%; background:#d9dce3; }
.d2-jb { left:0; width:${60 / 1.7}%; top:3px !important; bottom:3px !important; background:#55555f; border-radius:2px 0 0 2px; }
.d2-jh { left:${60 / 1.7}%; top:3px !important; bottom:3px !important; background:var(--hop); transition:width .22s; }
.d2-jq { left:${60 / 1.7}%; width:24px; top:3px !important; bottom:3px !important; background:repeating-linear-gradient(135deg,#9a9aa6 0 2px,transparent 2px 5px); }
.d2-ibu-l { display:flex; justify-content:space-between; font-size:12px; color:var(--gris); }
`,
  js: `
(function () {
  var fams = DH.ORDRE.filter(function (f) { return f !== 'pomeFruit' && f !== 'melon'; });
  DH.$('#d2-rows').innerHTML = fams.map(function (f) {
    return '<div class="d2-r" data-f="' + f + '"><span class="d2-n' + (['floral', 'herbal', 'earthy'].indexOf(f) >= 0 ? ' att' : '') + '">' + DH.pic(f, 17) + DH.COURT[f] + '</span><span class="d2-p"><i class="d2-z" data-role="zone"></i><i class="d2-f" style="background:' + DH.BA[f] + '"></i><i class="d2-e" style="background:repeating-linear-gradient(135deg,' + DH.BA[f] + ' 0 2px,transparent 2px 5px)"></i>' + (DH.AVI.indexOf(f) < 0 ? '<i class="d2-a"></i>' : '') + '</span><span class="d2-v"></span></div>';
  }).join('');
  DH.$('#d2-inc').innerHTML = DH.pic('pomeFruit', 14) + DH.pic('melon', 14) + 'Pépins, melon : ? non décrits';
  function pc(x) { return Math.max(0, Math.min(100, x * 100)).toFixed(1) + '%'; }
  DH.surChange(function (p) {
    DH.$$('#d2-rows .d2-r').forEach(function (r) {
      var f = r.dataset.f, v = p.c[f], e = p.emporte[f], fill = DH.$('.d2-f', r), em = DH.$('.d2-e', r), a = DH.$('.d2-a', r), val = DH.$('.d2-v', r);
      DH.$('.d2-z', r).style.width = pc(DH.Z(f));
      fill.style.width = pc(DH.S(f, v)); em.style.left = pc(DH.S(f, v)); em.style.width = pc(Math.min(DH.S(f, v + e), 1) - Math.min(DH.S(f, v), 1));
      if (a) a.style.left = 'clamp(5px,' + pc(DH.S(f, DH.AV[f])) + ',calc(100% - 5px))';
      var d = DH.AVI.indexOf(f) >= 0 ? v : v - DH.AV[f];
      val.textContent = Math.abs(d) < 0.5 ? '≈' : '~' + (DH.AVI.indexOf(f) >= 0 ? DH.fr(v) : DH.sg(d));
      val.style.color = DH.hors(f, v) ? '#c2410c' : DH.T[f];
    });
    var tot = DH.ROUE.reduce(function (s, f) { return s + p.emporte[f]; }, 0), top = DH.ROUE.slice().sort(function (a, b) { return p.emporte[b] - p.emporte[a]; })[0];
    DH.$('#d2-cap').innerHTML = !p.perte || tot < 0.5 ? 'après fermentation : rien d’emporté'
      : '<i></i>' + (p.perte === 'co2' ? 'le CO₂ emporte' : 'la chaleur emporte') + ' <b>~−' + DH.fr(p.emporte[top]) + '</b> ' + DH.COURT[top].toLowerCase() + (p.interp ? ' · ≈ interpolé' : '');
    var cru = p.ibu == null, ibu = cru ? 60 : p.ibu;
    DH.$('#d2-jh').style.width = ((ibu - 60) / 1.7).toFixed(1) + '%'; DH.$('#d2-jq').hidden = !cru;
    var v = DH.$('#d2-ibu-v'); v.textContent = cru ? '≈ 60 IBU + ? à cru' : '≈ ' + p.ibu + ' IBU' + (p.ibu > 70 ? ' · trop amer' : ' · tenue'); v.className = 'num' + (!cru && p.ibu > 70 ? ' dx-hors' : '');
  });
})();
`,
};
