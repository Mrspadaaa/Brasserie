// dgb2 · tiède · « Les trois plans sur les 12 familles » : la manière de comparer de w2 (sa rangée S · F · O par
// famille, « pas trop mal dans la manière de comparé ») glissée sous chaque barre l5b de l'écran. La barre reste le
// moment du doigt, intacte ; dessous, une fine règle des gains (0 à +25, la même que l'axe des courbes, repères +10
// et +20) porte trois pastilles S, F, O : ce que chaque plan ajoute dans cette famille, lu sur le moteur. Deux plans
// trop proches pour deux pastilles se fondent en « FO » ; la pastille du plan tenu est pleine. Une famille que rien ne
// décrit garde son « ? » seul. Trois puces au-dessus de la figure disent les plans et posent le rail.
import { assembler } from '../dgb1/socle-dgb.mjs';

assembler({
  id: 'dgb2', nom: 'Les trois plans sur les 12 familles', chaleur: 'tiède',
  css: `
.dgb2-cle { display:grid; grid-template-columns:repeat(3,1fr); gap:4px; margin:2px 0; font-family:"Source Sans 3",system-ui,sans-serif; color:#16161a; }
.dgb2-cle button { display:flex; align-items:center; gap:6px; min-height:40px; padding:3px 8px; border-radius:8px; background:#fff; border:1.5px solid #d5d8df; text-align:left; }
.dgb2-cle button[aria-pressed="true"] { border:2.5px solid #16161a; padding:2px 7px; }
.dgb2-cle span.dgb2-txt { display:flex; flex-direction:column; line-height:1.1; min-width:0; }
.dgb2-cle b { font-weight:700; font-size:14px; }
.dgb2-cle small { font:600 12px "IBM Plex Mono",ui-monospace,monospace; color:#55555f; white-space:nowrap; }
.dgb2-cle small i { font-style:normal; color:#2f6b5f; }
.dgb2-pa { display:inline-grid; place-items:center; height:18px; min-width:18px; padding:0 4px; border-radius:9px; background:#fff; border:1.5px solid #16161a; color:#16161a; font:700 12px/1 "Source Sans 3",sans-serif; flex:none; font-style:normal; }
.dgb2-pa.dgb2-tenu { background:#16161a; color:#fff; }
.pq-dry-ba:has(> .dgb2-gain) { grid-template-rows:auto auto; row-gap:1px; padding:1px 0; }
.pq-dry-ba:has(> .dgb2-gain) > .pq-dry-n, .pq-dry-ba:has(> .dgb2-gain) > .pq-dry-v { grid-row:1 / span 2; }
.pq-dry-ba:has(> .dgb2-gain) > .pq-dry-p { grid-column:2; grid-row:1; }
.dgb2-gain { grid-column:2; grid-row:2; position:relative; height:17px; display:block; }
.dgb2-gain::before { content:""; position:absolute; left:0; right:0; top:8px; height:1px; background:#c9cdd6; }
.dgb2-gain .dgb2-rep { position:absolute; top:4px; width:1px; height:9px; background:#c9cdd6; }
.dgb2-gain .dgb2-pa { position:absolute; top:0; height:17px; min-width:17px; transform:translateX(-50%); }
`,
  script: function (G) {
    var GAIN = 26;
    var cle = G.el('<div data-greffe="trois-plans-w2"></div>');
    cle.className = 'dgb2-cle'; cle.setAttribute('role', 'group'); cle.setAttribute('aria-label', 'Trois plans : Sage, Franc, Osé'); cle.setAttribute('data-greffe', 'trois-plans-w2'); cle.setAttribute('data-libre', 'moment');
    cle.innerHTML = G.PLANS.map(function (p) {
      return '<button type="button" data-k="' + p.k + '" aria-pressed="false" aria-label="Plan ' + p.n + ' : ' + p.m + '"><span class="dgb2-pa">' + p.l + '</span><span class="dgb2-txt"><b>' + p.n + '</b><small>' + p.m.replace(' · ', ' ') + (p.l === 'F' ? ' <i>★</i>' : '') + '</small></span></button>';
    }).join('');
    cle.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { G.aller(+b.dataset.k); }); });
    G.garder(cle, function (el) { var s = document.querySelector('.pq-dry-fig'); if (s) s.parentNode.insertBefore(el, s); });
    // La règle des gains d'une famille : x = gain / 26 (l'échelle des courbes) ; regroupe à moins de 9 % (une pastille).
    function regle(f) {
      var pts = G.PLANS.map(function (p) { var b = p.bars[f]; return { l: p.l, k: p.k, g: b && b.g !== null ? Math.max(0, b.g) : null }; });
      if (pts.some(function (q) { return q.g === null || isNaN(q.g); })) return null; // jamais décrit : le « ? » reste seul
      pts.sort(function (a, b) { return a.g - b.g; });
      var grp = [];
      pts.forEach(function (q) { var g = grp[grp.length - 1]; if (g && (q.g - g.g1) / GAIN * 100 < 9) { g.p.push(q); g.g1 = q.g; } else grp.push({ p: [q], g0: q.g, g1: q.g }); });
      var x = function (g) { return Math.max(3.5, Math.min(96.5, g / GAIN * 100)); };
      var e = document.createElement('span');
      e.className = 'dgb2-gain'; e.setAttribute('data-greffe', 'trois-plans-w2'); e.setAttribute('aria-label', 'Gain de chaque plan');
      e.innerHTML = '<i class="dgb2-rep" style="left:' + x(10) + '%"></i><i class="dgb2-rep" style="left:' + x(20) + '%"></i>'
        + grp.map(function (g) {
          var l = g.p.map(function (q) { return q.l; }).sort(function (a, b) { return 'SFO'.indexOf(a) - 'SFO'.indexOf(b); }).join('');
          return '<i class="dgb2-pa" data-ks="' + g.p.map(function (q) { return q.k; }).join(',') + '" style="left:' + x((g.g0 + g.g1) / 2).toFixed(1) + '%">' + l + '</i>';
        }).join('');
      return e;
    }
    var regles = [];
    document.querySelectorAll('.pq-dry-ba').forEach(function (r) {
      var f = r.dataset.ligne, e = regle(f);
      if (!e) return;
      regles.push(e);
      G.garder(e, function (el) { var row = document.querySelector('.pq-dry-ba[data-ligne="' + f + '"]'); if (row) { row.appendChild(el); } });
    });
    G.suivre(function (i) {
      cle.querySelectorAll('button').forEach(function (b) { var on = +b.dataset.k === i; b.setAttribute('aria-pressed', String(on)); b.querySelector('.dgb2-pa').classList.toggle('dgb2-tenu', on); });
      regles.forEach(function (e) { e.querySelectorAll('.dgb2-pa').forEach(function (p) { p.classList.toggle('dgb2-tenu', p.dataset.ks.split(',').indexOf(String(i)) >= 0); }); });
    });
  },
});
console.log('dgb2 écrit');
