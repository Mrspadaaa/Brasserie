// dgb1 · froide · « Trois plans en bandeau » : les trois cartes de w2 (Sage, Franc, Osé), réduites à leur moment et
// aux quatre chiffres du bandeau de l'écran, posées au-dessus de la figure ; chaque plan marqué d'une pastille S, F, O
// sous l'axe, reliée par un pointillé à la courbe de floral. Toucher une carte pose le rail de l'écran sur son moment ;
// la carte du moment tenu est cerclée. Base : Dryhopper de la maquette jouable, gardé tel quel.
import { assembler } from './socle-dgb.mjs';

assembler({
  id: 'dgb1', nom: 'Trois plans en bandeau', chaleur: 'froide',
  css: `
.dgb1-plans { display:grid; grid-template-columns:repeat(3,1fr); gap:5px; margin:2px 0; }
.dgb1-pl { display:flex; flex-direction:column; align-items:stretch; gap:3px; padding:6px 7px; border-radius:8px; background:#fff; border:1.5px solid #d5d8df; text-align:left; min-height:44px; font-family:"Source Sans 3",system-ui,sans-serif; color:#16161a; }
.dgb1-pl[aria-pressed="true"] { border:2.5px solid #16161a; padding:5px 6px; box-shadow:0 6px 16px -10px rgba(22,22,26,.55); }
.dgb1-t { display:flex; align-items:center; gap:5px; font-weight:700; font-size:15px; }
.dgb1-lt { display:inline-grid; place-items:center; width:18px; height:18px; border-radius:50%; background:#16161a; color:#fff; font:700 12px/1 "Source Sans 3",sans-serif; flex:none; }
.dgb1-cr { margin-left:auto; display:inline-flex; gap:2px; }
.dgb1-cr i { width:4px; height:11px; border-radius:2px; background:#d5d8df; }
.dgb1-cr i.dgb1-on { background:#16161a; }
.dgb1-m { font:600 13px "IBM Plex Mono",ui-monospace,monospace; color:#55555f; white-space:nowrap; }
.dgb1-m b { color:#2f6b5f; }
.dgb1-v { display:grid; grid-template-columns:1fr 1fr; gap:1px 4px; }
.dgb1-v span { display:inline-flex; align-items:center; gap:2px; font:700 13px "IBM Plex Mono",ui-monospace,monospace; white-space:nowrap; }
.dgb1-v span small { font:600 12px "Source Sans 3",sans-serif; color:#55555f; margin-right:1px; }
.dgb1-v span.dgb1-trop { color:#c2410c; }
.pq-dry-fig svg .dgb1-g text.dgb1-lt-s { font:700 12px "Source Sans 3",sans-serif !important; fill:#fff !important; stroke:none !important; }
.dgb1-g .dgb1-guide { stroke:#16161a; stroke-width:1.2; stroke-dasharray:2 3; opacity:.55; }
`,
  script: function (G) {
    var boite = G.el('<div data-greffe="trois-plans-w2"></div>');
    boite.className = 'dgb1-plans'; boite.setAttribute('role', 'group'); boite.setAttribute('aria-label', 'Trois plans : Sage, Franc, Osé'); boite.setAttribute('data-greffe', 'trois-plans-w2'); boite.setAttribute('data-libre', 'moment');
    boite.innerHTML = G.PLANS.map(function (p) {
      var cr = '';
      for (var n = 1; n <= 3; n++) cr += '<i' + (n <= p.crans ? ' class="dgb1-on"' : '') + '></i>';
      var v = function (x) { return '<span style="color:' + x.c + '">' + G.pi(x.f, 13) + x.t + '</span>'; };
      return '<button type="button" class="dgb1-pl" data-k="' + p.k + '" aria-pressed="false" aria-label="Plan ' + p.n + ' : ' + p.m + '">'
        + '<span class="dgb1-t"><span class="dgb1-lt">' + p.l + '</span>' + p.n + '<span class="dgb1-cr" aria-hidden="true">' + cr + '</span></span>'
        + '<span class="dgb1-m">' + p.m + (p.l === 'F' ? ' <b>★</b>' : '') + '</span>'
        + '<span class="dgb1-v">' + v(p.call.floral) + v(p.call.berries) + v(p.call.resin) + '<span class="' + (p.call.ibu.trop ? 'dgb1-trop' : '') + '"><small>IBU</small>' + p.call.ibu.t + '</span></span></button>';
    }).join('');
    boite.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { G.aller(+b.dataset.k); }); });
    G.garder(boite, function (el) { var fig = document.querySelector('.pq-dry-fig'); if (fig) fig.parentNode.insertBefore(el, fig); });
    // Sur la figure : une pastille S, F, O sous l'axe, et un pointillé jusqu'à la courbe de floral (lus dans le dessin).
    var NS = 'http://www.w3.org/2000/svg', g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'dgb1-g'); g.setAttribute('data-greffe', 'trois-plans-w2');
    G.garder(g, function (el) {
      var svg = [].filter.call(document.querySelectorAll('.pq-dry-fig svg'), function (s) { return /^0 0 366 /.test(s.getAttribute('viewBox') || ''); })[0];
      if (!svg) return;
      var axe = [].filter.call(svg.querySelectorAll('line'), function (l) { return +l.getAttribute('x1') === 0 && +l.getAttribute('x2') >= 360 && l.getAttribute('y1') === l.getAttribute('y2'); }).map(function (l) { return +l.getAttribute('y1'); }).sort(function (a, b) { return b - a; })[0];
      var h = '';
      G.PLANS.forEach(function (p) {
        var x = p.x / 100 * 366, yf = null;
        svg.querySelectorAll('circle').forEach(function (c) { var f = (c.getAttribute('fill') || '').toLowerCase(); if (Math.abs(+c.getAttribute('cx') - x) < 1.5 && (f === '#9840bc' || f === 'rgb(152, 64, 188)')) yf = yf === null ? +c.getAttribute('cy') : Math.min(yf, +c.getAttribute('cy')); });
        if (yf !== null) h += '<line class="dgb1-guide" x1="' + x + '" x2="' + x + '" y1="' + (yf + 7) + '" y2="' + (axe + 4) + '"/>';
        h += '<circle cx="' + x + '" cy="' + (axe + 12) + '" r="8.5" fill="#16161a" stroke="#fff" stroke-width="1.5"/><text class="dgb1-lt-s" x="' + x + '" y="' + (axe + 16.2) + '" text-anchor="middle">' + p.l + '</text>';
      });
      el.innerHTML = h; svg.appendChild(el);
    });
    G.suivre(function (i) { boite.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.k === i)); }); });
  },
});
console.log('dgb1 écrit');
