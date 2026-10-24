// dgb4 · chaude · « Trois verres » : les trois plans de w2 servis comme trois verres de ta stout, côte à côte, sous
// la figure de l'écran. De chaque verre monte son nez : trois volutes, floral, baies, résineux, aussi hautes que le
// gain du plan (même échelle que les courbes : 0 à +25), chiffre et picto au bout, en pointillé quand le moteur
// interpole (≈) ; l'IBU écrit sur la bière. On voit d'un coup d'œil quel verre sent le plus le floral et lequel monte
// en résineux. Toucher un verre pose le rail de l'écran sur son moment ; le verre du moment tenu est cerclé.
import { assembler } from '../dgb1/socle-dgb.mjs';

assembler({
  id: 'dgb4', nom: 'Trois verres', chaleur: 'chaude',
  css: `
.dgb4-verres { display:grid; grid-template-columns:repeat(3,1fr); gap:4px; padding:4px; margin:2px 0; background:#fff; border-radius:8px; font-family:"Source Sans 3",system-ui,sans-serif; color:#16161a; }
.dgb4-v { display:flex; flex-direction:column; align-items:center; gap:0; padding:2px 0 5px; border-radius:8px; border:1.5px solid transparent; background:#fff; }
.dgb4-v[aria-pressed="true"] { border:2.5px solid #16161a; background:#fbfbfc; }
.dgb4-v svg.dgb4-s { display:block; width:100%; height:auto; overflow:visible; }
.dgb4-v svg.dgb4-s text { font:700 12px "IBM Plex Mono",ui-monospace,monospace; }
.dgb4-v svg.dgb4-s .dgb4-ib { font:600 12px "Source Sans 3",sans-serif; fill:#e9dcc0; }
.dgb4-v svg.dgb4-s .dgb4-ibv { font:700 13px "IBM Plex Mono",monospace; fill:#fff4e2; }
.dgb4-v svg.dgb4-s .dgb4-ibv.dgb4-trop { fill:#ffa36e; }
.dgb4-nom { display:flex; align-items:center; gap:5px; font-weight:700; font-size:14px; white-space:nowrap; }
.dgb4-nom small { font:600 12px "IBM Plex Mono",monospace; color:#55555f; }
.dgb4-nom small b { color:#2f6b5f; }
.dgb4-lt { display:inline-grid; place-items:center; width:18px; height:18px; border-radius:50%; background:#16161a; color:#fff; font:700 12px/1 "Source Sans 3",sans-serif; }
`,
  script: function (G) {
    var GAIN = 25;
    var boite = G.el('<section data-greffe="trois-verres"></section>');
    boite.className = 'dgb4-verres'; boite.setAttribute('role', 'group'); boite.setAttribute('aria-label', 'Trois plans, trois verres'); boite.setAttribute('data-greffe', 'trois-verres'); boite.setAttribute('data-libre', 'moment');
    var FAM = [['floral', 46, 20], ['berries', 58, 58], ['resin', 70, 96]]; // famille, départ au bord du verre, arrivée
    var VERRE = 'M39,100 L77,100 L75.8,110 Q78.5,114 75.6,119 L72.5,160 L43.5,160 L40.4,119 Q37.5,114 40.2,110 Z';
    boite.innerHTML = G.PLANS.map(function (p) {
      var h = '';
      FAM.forEach(function (a) {
        var x = p.call[a[0]], b = p.bars[a[0]], g = b && b.g !== null ? Math.max(0, b.g) : 0, yt = 96 - Math.min(g, GAIN) / GAIN * 58;
        h += '<path d="M' + a[1] + ',100 C' + a[1] + ',74 ' + a[2] + ',' + (yt + 26) + ' ' + a[2] + ',' + yt + '" fill="none" stroke="' + (b.ba || x.c) + '" stroke-width="5.5" stroke-linecap="round"' + (/^≈/.test(x.t) ? ' stroke-dasharray="7 4"' : '') + '/>'
          + '<g transform="translate(' + (a[2] - 7) + ',' + (yt - 18) + ')">' + G.pi(a[0], 14) + '</g>'
          + '<text x="' + a[2] + '" y="' + (yt - 21) + '" text-anchor="middle" fill="' + x.c + '">' + x.t + '</text>';
      });
      h += '<path d="' + VERRE + '" fill="#2b1d16" stroke="#16161a" stroke-width="1.5" stroke-linejoin="round"/>'
        + '<path d="M39,100 L77,100 L76.1,108 L39.9,108 Z" fill="#efe3c8" stroke="#16161a" stroke-width="1.2" stroke-linejoin="round"/>'
        + '<text class="dgb4-ib" x="58" y="130" text-anchor="middle">IBU</text>'
        + '<text class="dgb4-ibv' + (p.call.ibu.trop ? ' dgb4-trop' : '') + '" x="58" y="148" text-anchor="middle">' + p.call.ibu.t + '</text>';
      return '<button type="button" class="dgb4-v" data-k="' + p.k + '" aria-pressed="false" aria-label="Plan ' + p.n + ' : ' + p.m + '">'
        + '<svg class="dgb4-s" viewBox="0 0 116 164" aria-hidden="true">' + h + '</svg>'
        + '<span class="dgb4-nom"><span class="dgb4-lt">' + p.l + '</span>' + p.n + '</span><span class="dgb4-nom"><small>' + p.m.replace(' · ', ' ') + (p.l === 'F' ? ' <b>★</b>' : '') + '</small></span></button>';
    }).join('');
    boite.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { G.aller(+b.dataset.k); }); });
    G.garder(boite, function (el) { var s = document.querySelector('.pq-dry-bars'); if (s) s.parentNode.insertBefore(el, s); });
    G.suivre(function (i) { boite.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.k === i)); }); });
  },
});
console.log('dgb4 écrit');
