// dgb3 · tiède · « Trois épingles sur le rail » : la seconde moitié de w2 (« le plan tenu réglé en dessous ») portée
// dans le geste de l'écran. Les trois plans sont trois épingles S, F, O sur le rail ; le pouce tient un plan (sa
// lettre dans la bulle du pouce) et le règle en glissant, comme l'écran le fait déjà ; toucher une autre épingle (ou sa
// ligne) prend ce plan. Le bandeau des quatre chiffres reste celui du plan tenu ; dessous, les deux autres plans en
// deux lignes : leurs quatre chiffres, chacun sous son picto, lus sur le moteur.
import { assembler } from '../dgb1/socle-dgb.mjs';

assembler({
  id: 'dgb3', nom: 'Trois épingles sur le rail', chaleur: 'tiède',
  css: `
.dgb3-autres { display:flex; flex-direction:column; gap:2px; margin:2px 0 2px; font-family:"Source Sans 3",system-ui,sans-serif; color:#16161a; }
.dgb3-l { display:grid; grid-template-columns:98px repeat(4,1fr); gap:2px; align-items:center; height:32px; border-radius:4px; background:#fff; border:1px solid #e3e5eb; text-align:left; padding:0; width:100%; }
.dgb3-l > span { display:inline-flex; align-items:center; justify-content:center; gap:3px; font:700 13px "IBM Plex Mono",ui-monospace,monospace; white-space:nowrap; }
.dgb3-l > span.dgb3-qui { justify-content:flex-start; gap:4px; padding-left:3px; font:600 13px "Source Sans 3",sans-serif; }
.dgb3-l > span.dgb3-qui span { display:flex; flex-direction:column; line-height:1.05; }
.dgb3-l > span.dgb3-qui small { font:600 12px "IBM Plex Mono",ui-monospace,monospace; color:#55555f; white-space:nowrap; }
.dgb3-l > span.dgb3-trop { color:#c2410c; }
.dgb3-l > span small.dgb3-ib { font:600 12px "Source Sans 3",sans-serif; color:#55555f; }
.dgb3-pa { display:inline-grid; place-items:center; width:18px; height:18px; border-radius:50%; background:#fff; border:1.5px solid #16161a; color:#16161a; font:700 12px/1 "Source Sans 3",sans-serif; flex:none; font-style:normal; }
.pq-dry-rail .dgb3-pin { position:absolute; top:50%; margin:-9px 0 0 -9px; z-index:1; cursor:pointer; box-shadow:0 0 0 2px #fff; }
.pq-dry-rail .dgb3-pin[hidden] { display:none; }
.pq-dry-pl .dgb3-plt { display:inline-grid; place-items:center; width:16px; height:16px; margin-right:3px; border-radius:50%; background:#fff; color:#16161a; font:700 12px/1 "Source Sans 3",sans-serif; vertical-align:middle; }
.pq-dry-pl:has(.dgb3-plt) .pq-dry-pt { display:none; }
`,
  script: function (G) {
    var plans = G.PLANS.map(function (p) { return { l: p.l, n: p.n, k: p.k, d: p }; }), tenu = 1; // l'écran s'ouvre sur ★ = Franc
    var pins = plans.map(function (p, n) {
      var e = document.createElement('i'); e.className = 'dgb3-pa dgb3-pin'; e.textContent = p.l; e.setAttribute('role', 'button'); e.setAttribute('aria-label', 'Prendre le plan ' + p.n); e.setAttribute('data-greffe', 'trois-plans-w2');
      e.addEventListener('pointerdown', function (ev) { ev.stopPropagation(); ev.preventDefault(); prendre(n); });
      e.addEventListener('click', function (ev) { ev.stopPropagation(); });
      G.garder(e, function (el) { var r = G.rail(); if (r) r.appendChild(el); });
      return e;
    });
    var plt = document.createElement('b'); plt.className = 'dgb3-plt';
    G.garder(plt, function (el) { var pl = document.querySelector('.pq-dry-pl'); if (pl) pl.insertBefore(el, pl.firstChild); });
    var autres = G.el('<div data-greffe="trois-plans-w2"></div>');
    autres.className = 'dgb3-autres'; autres.setAttribute('data-greffe', 'trois-plans-w2'); autres.setAttribute('aria-label', 'Les deux autres plans');
    G.garder(autres, function (el) { var c = document.querySelector('.pq-dry-call'); if (c) c.parentNode.insertBefore(el, c.nextSibling); });
    autres.addEventListener('click', function (ev) { var b = ev.target.closest('[data-n]'); if (b) prendre(+b.dataset.n); });
    function prendre(n) { tenu = n; G.aller(plans[n].k); rendre(G.cur()); }
    function rendre(i) {
      if (plans[tenu].k !== i) { plans[tenu].k = i; plans[tenu].d = G.lire(); } // le plan tenu se règle au doigt
      plans.forEach(function (p, n) { pins[n].style.left = p.d.x + '%'; pins[n].hidden = n === tenu; });
      plt.textContent = plans[tenu].l;
      autres.innerHTML = plans.map(function (p, n) {
        if (n === tenu) return '';
        var c = p.d.call, v = function (x) { return '<span style="color:' + x.c + '">' + G.pi(x.f, 13) + x.t + '</span>'; };
        return '<button type="button" class="dgb3-l" data-n="' + n + '" aria-label="Prendre le plan ' + p.n + '"><span class="dgb3-qui"><i class="dgb3-pa">' + p.l + '</i><span>' + p.n + '<small>' + p.d.m.replace(' · ', ' ') + '</small></span></span>'
          + v(c.floral) + v(c.berries) + v(c.resin) + '<span class="' + (c.ibu.trop ? 'dgb3-trop' : '') + '"><small class="dgb3-ib">IBU</small>' + c.ibu.t + '</span></button>';
      }).join('');
    }
    G.suivre(rendre);
  },
});
console.log('dgb3 écrit');
