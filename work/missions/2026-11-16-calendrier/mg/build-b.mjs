// node mg/build-b.mjs : passe 2 des trois gardées (g2b, g3b, g4b). Les v0 (g1…g6) ne sont pas touchées.
// Cadre repris de la base r6b tel quel : rangée d'en-tête q5-t, + (44 px, place exacte de r6b), barre du bas 56 px dans les deux sens.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA = fs.readFileSync(path.join(HERE, 'data.json'), 'utf8');
const RUN = fs.readFileSync(path.join(HERE, 'runtime.js'), 'utf8');

const ICO = {
  bord: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M7.5 14h2M11 14h2M14.5 14h2M7.5 17.5h2M11 17.5h2"/>',
  beer: '<path d="M17 11h1a3 3 0 0 1 0 6h-1"/><path d="M9 12v6M13 12v6"/><path d="M14 7.5c-1 0-1.4.5-3 .5s-2-.5-3-.5-1.7.5-2.5.5a2.5 2.5 0 0 1 0-5c.8 0 1.6.5 2.5.5S9.4 2 11 2s2 1.5 3 1.5 1.7-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.8 0-1.5-.5-2.5-.5Z"/><path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8"/>',
  boxes: '<path d="M7 13 3 15v4l4 2 4-2v-4zM17 13l-4 2v4l4 2 4-2v-4zM12 3 8 5v4l4 2 4-2V5z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', bas: '<path d="m6 9 6 6 6-6"/>', ret: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  plein: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>', courbe: '<path d="M3 20h18"/><path d="M4 16l4-6 4 3 4-7 4 4"/>',
};
const ico = (n, st = '') => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"${st ? ` style="${st}"` : ''}>${ICO[n]}</svg>`;
const NAV = `<nav class="bot" aria-label="Barre du bas"><a>${ico('bord')}<span>Bord</span></a><a>${ico('wallet', 'color:#1f64a3')}<span>Finances</span></a><a class="on" aria-current="page">${ico('cal', 'color:#9a4f1e')}<span>Calendrier</span></a><a>${ico('beer', 'color:#9a4f1e')}<span>Brassins</span></a><a>${ico('boxes', 'color:#4c6b2a')}<i class="badge">24</i><span>Stocks</span></a><a>${ico('users')}<span>Clients</span></a></nav>
<button type="button" class="fab" aria-label="Ajouter">${ico('plus')}</button>`;
/* rangée d'en-tête de r6b, telle quelle (q5-t) */
const TETE = (per, pleinOn = false) => `<div class="q5-t"><button type="button" class="q5-n" aria-label="113 CHF à dépenser sans passer sous 0, au plus serré en S24 : détail"><b>113</b><span>CHF à dépenser ·</span><em>S24</em></button><span class="d"><button type="button" class="q-per" aria-label="Période : ${per}">${per}${ico('bas')}</button><button type="button" class="q-pil bad" aria-label="2 en retard">${ico('ret')}2</button><button type="button" class="q-pil nu${pleinOn ? ' on' : ''}" aria-pressed="${pleinOn}" aria-label="${pleinOn ? 'Revenir à la frise' : 'Plein écran'}">${ico('plein')}</button></span></div>`;
const SEL = `<div class="sel"><span class="seg" role="group" aria-label="Mode"><button type="button" aria-pressed="false">${ico('cal')}Frise</button><button type="button" aria-pressed="true">${ico('courbe')}Courbe</button></span></div>`;

export const CSSB = `*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#fff;--ink:#111;--mut:#666;--line:#ddd;--line2:#bfbfbf;--s1:#f5f5f5;--s2:#ebebeb;--fin:#1f64a3;--ok:#2f7d6b;--bad:#b3261e;--badbg:#fbeae8;--botOn:#efe8e1;--prod:#9a4f1e;--act:#111;--onact:#fff}
html,body{height:100%;overflow:hidden;background:var(--bg);color:var(--ink);font-family:"Source Sans 3","Segoe UI",system-ui,sans-serif;font-size:15px;-webkit-tap-highlight-color:transparent}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
.ico{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none}
.bot{position:fixed;left:0;right:0;bottom:0;height:56px;display:flex;background:var(--s1);border-top:1px solid var(--line);z-index:30}
.bot a{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:14px;position:relative;min-width:0}
.bot a.on{background:var(--botOn);font-weight:600;box-shadow:inset 0 3px 0 var(--prod)}
.badge{position:absolute;top:1px;left:calc(50% + 4px);background:#8a5a1c;color:#fff;font-size:14px;font-style:normal;font-weight:600;border-radius:999px;padding:0 5px;line-height:18px}
.fab{position:fixed;z-index:33;right:calc(12px + (100vw - 24px) / 6 - 22px);bottom:72px;width:44px;height:44px;border-radius:22px;background:var(--act);color:var(--onact);display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:700;font-size:14px;line-height:1;box-shadow:0 6px 18px rgba(0,0,0,.35),0 0 0 3px var(--bg)}
.fab .ico{width:20px;height:20px;stroke-width:2.4}
.q5-t{position:absolute;left:12px;right:12px;top:1px;z-index:3;height:28px;display:flex;align-items:center;gap:6px;white-space:nowrap}
.q5-n{display:flex;align-items:baseline;gap:4px;white-space:nowrap;height:28px;line-height:28px}
.q5-n b{font-size:24px;font-weight:800;color:var(--fin);font-variant-numeric:tabular-nums;letter-spacing:-.5px}
.q5-n span{font-size:14px;font-weight:500;color:var(--mut)}.q5-n em{font-style:normal;font-size:14px;font-weight:700;color:var(--fin)}
.q5-t .d{margin-left:auto;display:flex;gap:4px}
.q-per{height:26px;border-radius:13px;background:var(--ink);color:var(--bg);font-size:14px;font-weight:700;padding:0 3px 0 9px;display:inline-flex;align-items:center;white-space:nowrap}.q-per .ico{width:16px;height:16px}
.q-pil{height:26px;min-width:26px;border-radius:13px;display:inline-flex;align-items:center;justify-content:center;gap:2px;border:1.5px solid var(--line2);padding:0 6px;font-size:14px;font-weight:700;white-space:nowrap;background:var(--bg)}
.q-pil .ico{width:16px;height:16px}.q-pil.bad{border-color:var(--bad);color:var(--bad);background:var(--badbg)}.q-pil.nu{border-color:transparent;background:none;padding:0}
.q-pil.nu.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.sel{position:absolute;right:12px;top:32px;height:30px;z-index:3}
.seg{display:inline-flex;border:1.5px solid var(--ink);border-radius:15px;overflow:hidden;height:30px;background:#fff}
.seg button{height:100%;padding:0 10px;font-weight:700;font-size:14px;display:inline-flex;align-items:center;gap:5px;color:var(--ink);background:#fff}.seg button .ico{width:16px;height:16px}
.seg button[aria-pressed=true]{background:var(--ink);color:#fff}
#plot,#band{position:absolute;display:block;overflow:visible}
svg text{font-family:inherit;font-variant-numeric:tabular-nums}
.lab{font-size:14px;font-weight:600;paint-order:stroke;stroke:#fff;stroke-width:4px;stroke-linejoin:round}.lab .mt{font-weight:800}
.tk{font-size:14px;fill:#777}.mo{font-size:14px;fill:#555}
.leg{position:absolute;display:flex;flex-wrap:wrap;gap:4px 12px;align-content:flex-start}
.ch{display:inline-flex;align-items:center;gap:4px;font-size:14px;font-weight:600;color:var(--c);white-space:nowrap;height:20px}.ch i{width:12px;height:12px;border-radius:3px;background:var(--c);flex:none}.ch b{font-weight:800}
.ch.bl i{border-radius:50%}
.cle{display:inline-flex;align-items:center;gap:4px;font-size:14px;color:var(--mut);height:20px;white-space:nowrap}
.fin2{position:absolute;font-size:14px;color:var(--mut);line-height:20px;white-space:nowrap}.fin2 b{color:var(--ink);font-weight:700}
`;

/* commun aux trois pages : genre de la semaine, légende chiffrée, mesure des étiquettes */
const COMMUN = `
function byId(i){return document.getElementById(i)}
/* genre qui fait le plus bouger la caisse cette semaine, ventes courantes à part ; null : semaine sans autre mouvement */
function semG(r){var f=M.flux(r).filter(function(i){return i.n!=='Ventes de la semaine'});if(!f.length)return null;var t={};f.forEach(function(i){t[i.g]=(t[i.g]||0)+i.m});var b=null;for(var g in t)if(b==null||Math.abs(t[g])>Math.abs(t[b]))b=g;return b}
function genresSem(r){var s={};M.flux(r).forEach(function(i){if(i.n!=='Ventes de la semaine')s[i.g]=1});(D.act[r]||[]).forEach(function(g){s[g]=1});return M.ORDRE.filter(function(g){return s[g]})}
function legendeB(bx,r0,r1,o){o=o||{};var t=M.totaux(r0,r1),h='';
 M.ORDRE.forEach(function(g){var v=t[g];if(!v&&!(o.act&&g==='activites'))return;h+='<span class="ch" style="--c:'+M.GEN[g].c+'"><i></i>'+M.GEN[g].n+' <b>'+(v?M.sg(v):'0')+'</b></span>'});
 if(o.cle)h+='<span class="cle"><svg width="40" height="16"><circle cx="8" cy="8" r="5.5" fill="#666"/><circle cx="29" cy="8" r="4.8" fill="#fff" stroke="#666" stroke-width="2.4"/></svg>entrée · sortie</span>';
 if(o.bas)h+='<span class="ch bl" style="--c:#1f64a3"><i></i>à dépenser <b>113</b> en S24 →</span>';
 bx.innerHTML=h}
var _ms=null;function largeurB(nom,mt){if(!_ms){_ms=M.el('svg',{width:10,height:10,style:'position:absolute;left:-9999px;top:0'});document.body.appendChild(_ms)}
 var t=M.el('text',{class:'lab',x:0,y:20},_ms);if(nom){M.el('tspan',{},t).textContent=nom+(mt?' ':'')}if(mt)M.el('tspan',{class:'mt'},t).textContent=mt;var w=t.getBBox().width;_ms.removeChild(t);return Math.ceil(w)+2}
function grilleB(svg,S,pas,obst){var v0=Math.ceil(S.o.vmin/pas)*pas;for(var v=v0;v<=S.o.vmax+.1;v+=pas){M.el('line',{x1:S.o.x0,x2:S.o.x1,y1:S.Y(v),y2:S.Y(v),stroke:'#e4e4e4'},svg);var t=M.el('text',{class:'tk',x:S.o.x0-5,y:S.Y(v)+5,'text-anchor':'end'},svg);t.textContent=M.fmt(v);var tw=M.largeur(M.fmt(v),'tk')+4;obst.push({x:S.o.x0-5-tw,y:S.Y(v)-10,w:tw,h:18})}}
/* fenêtre de la frise : les 6 semaines que la frise montrait à l'écran */
function fenetre(band,B,a,b,h){M.el('rect',{x:B.X(a)-1.5,y:.5,width:B.X(b+1)-B.X(a)+3,height:h,rx:3,fill:'none',stroke:'#111','stroke-width':2},band)}
`;

function page(id, titre, body, fn) {
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${id} · mode graph · ${titre}</title><style>${CSSB}</style></head>
<body class="${id}">${body}${NAV}
<script>window.MG_DATA=${DATA};</script><script>${RUN}</script>
<script>(function(){var M=window.MG,D=M.D,W=innerWidth,H=innerHeight,land=W>H;if(land)document.body.classList.add('pay');
var U=H-56,FABTOP=U-16-44;window.__mg.U=U;window.__mg.fabTop=FABTOP;var Q=new URLSearchParams(location.search);
function box(e,x,y,w,h){e.style.left=x+'px';e.style.top=y+'px';if(w!=null)e.style.width=w+'px';if(h!=null)e.style.height=h+'px';if(e.tagName.toLowerCase()==='svg'){e.setAttribute('width',w);e.setAttribute('height',h);}}
${COMMUN}
(${fn.toString()})();
})();</script></body></html>`;
  fs.writeFileSync(path.join(HERE, id + '.html'), html);
}

/* ───────── g4b · couloirs : entrées nommées en haut, sorties en bas ; marches teintées ; bascule ⛶ (même picto dans les deux sens) */
page('g4b', 'couloirs, marches teintées', `${TETE('6 mois', true)}<svg id="plot"></svg><svg id="band"></svg><div class="leg" id="leg"></div>`, function () {
  var r0 = 1, r1 = 26, leg = byId('leg'), plot = byId('plot'), band = byId('band'), bandH = 36, obst = [];
  legendeB(leg, r0, r1, { cle: true, bas: true });
  if (!land) { box(leg, 10, 0, 282, null); var hL = leg.offsetHeight; leg.style.top = (U - 6 - hL) + 'px'; var bt = U - 6 - hL - 8 - bandH; box(band, 0, bt, W, bandH); box(plot, 0, 32, W, bt - 4 - 32); }
  else { leg.style.flexDirection = 'column'; box(leg, W - 196, 36, 190, null); var bt = U - 4 - bandH; box(band, 0, bt, W - 206, bandH); box(plot, 0, 32, W - 206, bt - 4 - 32); }
  var pw = +plot.getAttribute('width'), ph = +plot.getAttribute('height'), RH = 19, X0 = 40;
  var mvs = M.mvDans(r0, r1), ent = mvs.filter(function (m) { return m.m > 0; }), sor = mvs.filter(function (m) { return m.m < 0; });
  function dessine(nE, nS) {
    while (plot.firstChild) plot.removeChild(plot.firstChild); obst.length = 0;
    var laneE = nE * RH + 4, laneS = nS * RH + 4, nrow;
    M.el('rect', { x: 0, y: 0, width: pw, height: laneE, fill: '#2f7d6b', 'fill-opacity': .05 }, plot); M.el('rect', { x: 0, y: ph - laneS, width: pw, height: laneS, fill: '#b3261e', 'fill-opacity': .045 }, plot);
    var S = M.echelleH({ r0: r0, r1: r1, x0: X0, x1: pw - 6, y0: laneE + 10, y1: ph - laneS - 10, vmin: 3500, vmax: 6000 });
    grilleB(plot, S, 500, obst);
    var r, g, a, b, y;
    /* la marche teintée en entier : colonne pâle sous le palier de la semaine qui bouge, palier épais à sa couleur */
    for (r = r0; r <= r1; r++) { g = semG(r); if (!g) continue; y = S.Y(D.C[r]); M.el('rect', { x: S.X(r), y: y, width: S.wk, height: S.o.y1 - y, fill: M.GEN[g].c, 'fill-opacity': .14 }, plot); }
    var cm = {}; for (r = 2; r <= r1; r++) cm[r] = M.contremarche(plot, S, r, 3.5, obst);
    M.el('rect', { x: S.X(1) - 3.5, y: S.Y(4180), width: 3.5, height: S.Y(D.C[1]) - S.Y(4180), fill: M.GEN.brassins.c }, plot);
    for (r = r0; r <= r1; r++) { g = semG(r); a = S.X(r); b = S.X(r + 1); y = S.Y(D.C[r]); M.el('line', { x1: a, x2: b, y1: y, y2: y, stroke: g ? M.GEN[g].c : '#111', 'stroke-width': g ? 4.5 : 2 }, plot); obst.push({ x: a, y: y - 3, w: b - a, h: 6 }); }
    var cach = [], marq = [], G = M.el('g', { class: 'labs' }, plot);
    /* couloirs : plusieurs ordres et trois appuis (début, fin, milieu à l'ancre) essayés ; on garde le moins de cachées, puis les rangées les plus proches. Aucun trait ne traverse un nom. */
    function couloir(list, haut) {
      nrow = haut ? nE : nS;
      var prep = list.map(function (m) { var c = cm[m.r], nom = m.n, mt = M.sg(m.m), formes = [[largeurB(nom, mt), 1, null]], mots = nom.split(' ');
        if (mots.length > 1) { var cut = Math.ceil(mots.length / 2), l1 = mots.slice(0, cut).join(' '), l2 = mots.slice(cut).join(' '); formes.push([Math.max(largeurB(l1, ''), largeurB(l2, mt)), 2, [l1, l2]]); } else formes.push([Math.max(largeurB(nom, ''), largeurB('', mt)), 2, [nom, '']]);
        return { m: m, ax: c.x, ay: haut ? c.top : c.bot, nom: nom, mt: mt, formes: formes }; });
      function essai(ordre) { var boites = [], res = {}, cout = 0, perdu = [];
        ordre.forEach(function (i) { var o = prep[i], best = null;
          for (var k = 0; k < nrow; k++) for (var f = 0; f < o.formes.length; f++) { var w = o.formes[f][0], nr = o.formes[f][1]; if (k + nr > nrow) continue;
            [[o.ax - 4, 0], [o.ax - w + 4, 2], [o.ax - w / 2, 3]].forEach(function (xx) { var x = Math.max(2, Math.min(xx[0], pw - 2 - w)), libre = true;
              boites.forEach(function (bb) { if (bb.row >= k && bb.row < k + nr && x < bb.x + bb.w + 10 && bb.x < x + w + 10) libre = false; if (bb.row < k && o.ax >= bb.x - 3 && o.ax <= bb.x + bb.w + 3) libre = false; if (bb.row >= k + nr && bb.ax >= x - 3 && bb.ax <= x + w + 3) libre = false; });
              var sc = k * 10 + f * 6 + xx[1]; if (libre && (!best || sc < best.sc)) best = { x: x, w: w, k: k, nr: nr, f: o.formes[f], sc: sc }; }); }
          if (!best) { perdu.push(o.nom); return; }
          for (var j = best.k; j < best.k + best.nr; j++) boites.push({ row: j, x: best.x, w: best.w, ax: o.ax }); res[i] = best; cout += best.sc; });
        return { res: res, perdu: perdu, score: perdu.length * 1e4 + cout }; }
      var idx = prep.map(function (_, i) { return i; }), ordres = [idx.slice().sort(function (p, q) { return prep[q].m.r - prep[p].m.r; }), idx.slice().sort(function (p, q) { return prep[p].m.r - prep[q].m.r; }), idx.slice().sort(function (p, q) { return Math.abs(prep[q].m.m) - Math.abs(prep[p].m.m); })];
      var gr = 11; function al() { gr = (gr * 16807) % 2147483647; return gr / 2147483647; }
      for (var e = 0; e < 400; e++) { var o2 = idx.slice(); for (var j = o2.length - 1; j > 0; j--) { var z = Math.floor(al() * (j + 1)), t0 = o2[j]; o2[j] = o2[z]; o2[z] = t0; } ordres.push(o2); }
      /* recherche complète (profondeur d'abord, meilleur score) ; repli : le meilleur essai glouton */
      function cands(o, boites) { var out = [];
        for (var k = 0; k < nrow; k++) for (var f = 0; f < o.formes.length; f++) { var w = o.formes[f][0], nr = o.formes[f][1]; if (k + nr > nrow) continue;
          [[o.ax - 4, 0], [o.ax - w + 4, 2], [o.ax - w / 2, 3]].forEach(function (xx) { var x = Math.max(2, Math.min(xx[0], pw - 2 - w)), libre = true;
            boites.forEach(function (bb) { if (bb.row >= k && bb.row < k + nr && x < bb.x + bb.w + 10 && bb.x < x + w + 10) libre = false; if (bb.row < k && o.ax >= bb.x - 3 && o.ax <= bb.x + bb.w + 3) libre = false; if (bb.row >= k + nr && bb.ax >= x - 3 && bb.ax <= x + w + 3) libre = false; if (bb.row < k + nr && bb.row >= k && false) libre = false; });
            /* un nom plus proche ne doit pas couvrir l'ancre d'un nom déjà placé plus loin : vérifié ci-dessus dans les deux sens */
            if (libre) out.push({ x: x, w: w, k: k, nr: nr, f: o.formes[f], sc: k * 10 + f * 6 + xx[1] }); }); }
        return out.sort(function (p, q) { return p.sc - q.sc; }); }
      var ordreD = idx.slice().sort(function (p, q) { return prep[q].m.r - prep[p].m.r; }), meilleur = null, noeuds = 0;
      (function dfs(i, boites, res, cout) { if (noeuds++ > 300000) return; if (meilleur && cout >= meilleur.score) return;
        if (i === ordreD.length) { meilleur = { res: Object.assign({}, res), perdu: [], score: cout }; return; }
        var o = prep[ordreD[i]]; cands(o, boites).forEach(function (c) { var nb = boites.slice(); for (var j = c.k; j < c.k + c.nr; j++) nb.push({ row: j, x: c.x, w: c.w, ax: o.ax }); res[ordreD[i]] = c; dfs(i + 1, nb, res, cout + c.sc); delete res[ordreD[i]]; }); })(0, [], {}, 0);
      var top = meilleur; if (!top) { ordres.forEach(function (o) { var r = essai(o); if (!top || r.score < top.score) top = r; }); }
      cach = cach.concat(top.perdu);
      idx.forEach(function (i) { var best = top.res[i]; if (!best) return; var o = prep[i], m = o.m, ax = o.ax, ay = o.ay, nom = o.nom, mt = o.mt;
        /* rangée 0 = la plus proche de la courbe */
        var yTop = haut ? laneE - (best.k + best.nr) * RH : ph - laneS + 2 + best.k * RH, bx = { x: best.x, y: yTop, w: best.w, h: best.nr * RH - 1 };
        var ly = haut ? bx.y + bx.h : bx.y;
        M.el('line', { x1: ax, x2: ax, y1: haut ? ly : ay + 6, y2: haut ? ay - 6 : ly, stroke: M.GEN[m.g].c, 'stroke-width': 1.6, 'stroke-dasharray': '2 3', class: 'lien' }, G);
        var t = M.el('text', { class: 'lab', x: bx.x, y: bx.y + 14, fill: M.GEN[m.g].c }, G);
        if (best.nr === 1) { M.el('tspan', {}, t).textContent = nom + ' '; M.el('tspan', { class: 'mt' }, t).textContent = mt; }
        else { M.el('tspan', {}, t).textContent = best.f[2][0]; if (best.f[2][1]) { M.el('tspan', { x: bx.x, dy: RH }, t).textContent = best.f[2][1] + ' '; M.el('tspan', { class: 'mt' }, t).textContent = mt; } else M.el('tspan', { class: 'mt', x: bx.x, dy: RH }, t).textContent = mt; }
        marq.push({ x: ax, y: haut ? ay - 1 : ay + 1, c: M.GEN[m.g].c, plein: haut }); });
    }
    couloir(ent, true); couloir(sor, false);
    /* entrées pleines, sorties en anneau (greffe de g6) */
    marq.forEach(function (q) { M.el('circle', q.plein ? { cx: q.x, cy: q.y, r: 5.5, fill: q.c, stroke: '#fff', 'stroke-width': 1.5 } : { cx: q.x, cy: q.y, r: 4.8, fill: '#fff', stroke: q.c, 'stroke-width': 2.6 }, plot); });
    return { cach: cach, S: S, laneE: laneE, laneS: laneS };
  }
  var res, combos = [[2, 2], [3, 2], [2, 3], [3, 3], [4, 3], [3, 4], [4, 4]]; for (var ci = 0; ci < combos.length; ci++) { res = dessine(combos[ci][0], combos[ci][1]); if (!res.cach.length) break; }
  window.__mg.caches = res.cach; window.__mg.nrow = [(res.laneE - 4) / RH, (res.laneS - 4) / RH];
  var B = M.echelleH({ r0: r0, r1: r1, x0: X0, x1: pw - 6, y0: 0, y1: 1, vmin: 0, vmax: 1 });
  M.el('line', { x1: X0, x2: pw - 6, y1: 13.5, y2: 13.5, stroke: '#d6d6d6' }, band);
  for (var r = r0; r <= r1; r++) { var g = semG(r); if (g) M.el('rect', { x: B.X(r) + .5, y: 2, width: Math.max(1, B.wk - 1), height: 12, rx: 1.5, fill: M.GEN[g].c }, band); }
  fenetre(band, B, 1, 6, 15); M.moisAxe(band, B, 33, null);
  window.__mg.courbe = plot.getBoundingClientRect(); window.__mg.bande = band.getBoundingClientRect(); window.__mg.hon = M.honnete(r0, r1);
});

/* ───────── g2b · zones teintées par la semaine qui bouge ; bascule Frise | Courbe (greffe de g3) */
page('g2b', 'zones teintées', `${TETE('6 mois')}${SEL}<div class="fin2" id="fin"></div><div class="leg" id="leg"></div><svg id="plot"></svg><svg id="band"></svg><div class="fin2" id="bas"></div>`, function () {
  var r0 = 1, r1 = 26, leg = byId('leg'), plot = byId('plot'), band = byId('band'), fin = byId('fin'), bas = byId('bas'), bandH = 36, obst = [];
  legendeB(leg, r0, r1, {});
  fin.innerHTML = 'caisse <b>' + M.fmt(4180) + '</b> → <b>' + M.fmt(D.C[r1]) + '</b>';
  bas.innerHTML = '<span class="ch bl" style="--c:#1f64a3"><i></i>à dépenser <b>113</b> en S24 →</span>';
  if (!land) { box(fin, 12, 37, 170, null); box(leg, 12, 68, W - 24, null); var lt = 68 + leg.offsetHeight + 2, bt = FABTOP - 6 - bandH; box(band, 0, bt, W, bandH); box(plot, 0, lt, W, bt - 2 - lt); box(bas, 12, FABTOP + 12, 270, null); }
  else { leg.style.flexDirection = 'column'; box(leg, W - 196, 70, 190, null); box(fin, W - 196, 70 + leg.offsetHeight + 6, 190, null); box(bas, W - 196, 70 + leg.offsetHeight + 30, 190, null); var bt = U - 4 - bandH; box(band, 0, bt, W - 206, bandH); box(plot, 0, 32, W - 206, bt - 2 - 32); }
  var pw = +plot.getAttribute('width'), ph = +plot.getAttribute('height');
  var S = M.echelleH({ r0: r0, r1: r1, x0: 44, x1: pw - 8, y0: 12, y1: ph - 24, vmin: 3500, vmax: 6000 });
  grilleB(plot, S, 500, obst);
  /* une zone naît à chaque semaine qui bouge (nommée ou non) et porte la couleur de ce qui l'a fait bouger ; elle s'éteint (plus pâle) sur les semaines de ventes courantes */
  var cur = null, r, g;
  for (r = r0; r <= r1; r++) { g = semG(r); if (g) cur = g; if (!cur) continue; var y = S.Y(D.C[r]); M.el('rect', { x: S.X(r), y: y, width: S.wk + .4, height: S.o.y1 - y, fill: M.GEN[cur].c, 'fill-opacity': g ? .3 : .12 }, plot); }
  M.marches(plot, S, {}, obst);
  for (r = 2; r <= r1; r++) M.contremarche(plot, S, r, 3, obst);
  M.el('rect', { x: S.X(1) - 3, y: S.Y(4180), width: 3, height: S.Y(D.C[1]) - S.Y(4180), fill: M.GEN.brassins.c }, plot);
  M.moisAxe(plot, S, ph - 2, obst);
  var cadre = { x0: 2, x1: pw - 2, y0: 0, y1: ph - 20 };
  var it = M.mvDans(r0, r1).map(function (m) { var hi = S.Y(Math.max(D.C[m.r], D.C[m.r - 1])), lo = S.Y(Math.min(D.C[m.r], D.C[m.r - 1])); var o = { nom: m.n, mt: M.sg(m.m), c: M.GEN[m.g].c, ax: S.X(m.r), ay: m.m > 0 ? hi : lo, up: [S.X(m.r), hi], dn: [S.X(m.r), lo], grp: 'r' + m.r, mtv: m.m }; o.cands = M.cielH(o, obst, m.m > 0 ? [-1, 1] : [1, -1], cadre); return o; });
  M.placer(plot, it, obst, cadre, { lienMax: 150, essais: 1500 });
  var B = M.echelleH({ r0: r0, r1: r1, x0: 44, x1: pw - 8, y0: 0, y1: 1, vmin: 0, vmax: 1 });
  M.el('line', { x1: 44, x2: pw - 8, y1: 14.5, y2: 14.5, stroke: '#d6d6d6' }, band);
  for (r = r0; r <= r1; r++) { g = semG(r); if (g) M.el('rect', { x: B.X(r) + .5, y: 2, width: B.wk - 1, height: 13, rx: 2, fill: M.GEN[g].c }, band); if ((r - r0) % 4 === 0) { var t = M.el('text', { class: 'mo', x: B.X(r) + 1, y: 33 }, band); t.textContent = 'S' + M.sn(r); } }
  fenetre(band, B, 1, 6, 16);
  window.__mg.courbe = plot.getBoundingClientRect(); window.__mg.bande = band.getBoundingClientRect(); window.__mg.hon = M.honnete(r0, r1);
});

/* ───────── g3b · cascade, chaque pièce nommée ; en-tête r6b tel quel ; frise : le semestre empilé, fenêtre = ce que montre la courbe */
page('g3b', 'cascade', `<div id="tete"></div>${SEL}<div class="fin2" id="fin"></div><div class="leg" id="leg"></div><svg id="plot"></svg><svg id="band"></svg>`, function () {
  var P = +(Q.get('p') || 6), r0 = 1, r1 = P, rB = 26;
  byId('tete').outerHTML = window.__tete(P === 6 ? '6 sem.' : '6 mois');
  var leg = byId('leg'), plot = byId('plot'), band = byId('band'), fin = byId('fin'), bandH = 38, obst = [];
  legendeB(leg, r0, r1, { act: true });
  fin.innerHTML = 'caisse <b>' + M.fmt(4180) + '</b> → <b>' + M.fmt(D.C[r1]) + '</b>';
  if (!land) { box(fin, 12, 37, 190, null); box(leg, 12, 68, W - 24, null); var lt = 68 + leg.offsetHeight + 2, bt = FABTOP - 6 - bandH; box(band, 0, bt, W, bandH); box(plot, 0, lt, W, bt - 2 - lt); }
  else { leg.style.flexDirection = 'column'; box(leg, W - 196, 70, 190, null); box(fin, W - 196, 70 + leg.offsetHeight + 6, 190, null); fin.style.whiteSpace = 'normal'; var bt = U - 4 - bandH; box(band, 0, bt, W - 206, bandH); box(plot, 0, 32, W - 206, bt - 2 - 32); }
  var pw = +plot.getAttribute('width'), ph = +plot.getAttribute('height');
  /* axe serré sur les données : plus bas et plus haut de toutes les pièces, avec une marge pour les noms */
  var lo = 1e9, hi = -1e9, r, h;
  for (r = r0; r <= r1; r++) { h = r === 1 ? 4180 : D.C[r - 1]; lo = Math.min(lo, h); hi = Math.max(hi, h); M.flux(r).filter(function (i) { return i.m > 0; }).forEach(function (i) { h += i.m; hi = Math.max(hi, h); }); M.flux(r).filter(function (i) { return i.m < 0; }).forEach(function (i) { h += i.m; lo = Math.min(lo, h); }); }
  var vmin = Math.floor((lo - .05 * (hi - lo)) / 100) * 100, vmax = Math.ceil((hi + .07 * (hi - lo)) / 100) * 100;
  var S = M.echelleH({ r0: r0, r1: r1, x0: 44, x1: pw - 6, y0: 8, y1: ph - 28, vmin: vmin, vmax: vmax });
  grilleB(plot, S, P === 6 ? 500 : 1000, obst);
  M.el('path', { d: 'M38 ' + (S.o.y1 + 14) + 'l5 -4l5 4l5 -4', fill: 'none', stroke: '#777', 'stroke-width': 1.5 }, plot);
  var cadre = { x0: 2, x1: pw - 2, y0: 0, y1: ph - 18 }, it = [], nomme = {}; D.MV.forEach(function (m) { nomme[m.r + '|' + m.m] = m.n; });
  var loyer = false;
  function garde(i, r) { if (/^Loyer/.test(i.n)) { if (loyer) return null; loyer = true; return 'Loyer chaque mois'; } if (P === 6) return i.n; return nomme[r + '|' + i.m] || null; }
  for (r = r0; r <= r1; r++) {
    var lv = r === 1 ? 4180 : D.C[r - 1], x = S.X(r), wk = S.wk, bw = Math.max(4, wk * .3), xi = x + wk * .16, xo = xi + bw + 2; h = lv;
    M.flux(r).filter(function (i) { return i.m > 0; }).sort(function (a, b) { return (a.n === 'Ventes de la semaine' ? -1 : 0) - (b.n === 'Ventes de la semaine' ? -1 : 0) || b.m - a.m; }).forEach(function (i) { var y0 = S.Y(h), y1 = S.Y(h + i.m); M.el('rect', { x: xi, y: y1, width: bw, height: y0 - y1, fill: M.GEN[i.g].c, stroke: '#fff', 'stroke-width': .8 }, plot); obst.push({ x: xi - 1, y: y1, w: bw + 2, h: y0 - y1, grp: 'i' + r }); var nm = i.n !== 'Ventes de la semaine' && garde(i, r); if (nm) it.push({ nom: nm, mt: M.sg(i.m), c: M.GEN[i.g].c, ax: xi + bw / 2, ay: y1, up: [xi + bw / 2, y1], dn: [xi + bw / 2, S.Y(lv)], pref: -1, m: i.m, mtv: i.m, grp: 'i' + r }); h += i.m; });
    var top = h; M.el('line', { x1: x, x2: xo + bw, y1: S.Y(lv), y2: S.Y(lv), stroke: '#111', 'stroke-width': 1.2, 'stroke-dasharray': '2 2' }, plot);
    M.flux(r).filter(function (i) { return i.m < 0; }).sort(function (a, b) { return a.m - b.m; }).forEach(function (i) { var y0 = S.Y(h), y1 = S.Y(h + i.m); M.el('rect', { x: xo, y: y0, width: bw, height: y1 - y0, fill: M.GEN[i.g].c, stroke: '#fff', 'stroke-width': .8 }, plot); obst.push({ x: xo - 1, y: y0, w: bw + 2, h: y1 - y0, grp: 'o' + r }); var nm = garde(i, r); if (nm) it.push({ nom: nm, mt: M.sg(i.m), c: M.GEN[i.g].c, ax: xo + bw / 2, ay: y1, dn: [xo + bw / 2, y1], up: [xo + bw / 2, S.Y(lv)], pref: 1, m: i.m, mtv: i.m, grp: 'o' + r }); h += i.m; });
    if (top !== lv) M.el('line', { x1: xi, x2: xo + bw, y1: S.Y(top), y2: S.Y(top), stroke: '#111', 'stroke-width': 1, 'stroke-dasharray': '2 2' }, plot);
    var yc = S.Y(D.C[r]), xe = Math.min(S.X(r + 1) + wk * .16, S.o.x1); M.el('line', { x1: xo + bw, x2: xe, y1: yc, y2: yc, stroke: '#111', 'stroke-width': 2.4 }, plot); obst.push({ x: xo + bw, y: yc - 2, w: xe - xo - bw, h: 4 }); obst.push({ x: x, y: S.Y(top) - 1, w: wk, h: 2, grp: 'i' + r });
  }
  if (P === 6) { for (r = r0; r <= r1; r++) { var tt = M.el('text', { class: 'mo', 'text-anchor': 'middle', x: S.X(r) + S.wk / 2, y: ph - 2 }, plot); tt.textContent = 'S' + M.sn(r); obst.push({ x: S.X(r) + S.wk / 2 - 18, y: ph - 16, w: 36, h: 17 }); } }
  it.sort(function (a, b) { return Math.abs(b.m) - Math.abs(a.m); }); it.forEach(function (o) { o.cands = M.cielH(o, obst, o.pref < 0 ? [-1, 1] : [1, -1], cadre); });
  M.placer(plot, it, obst, cadre, { lienMax: P === 6 ? 300 : 300, essais: 1500, deuxLignes: true });
  /* frise : le semestre, chaque semaine empile ce qui s'y passe ; la fenêtre noire = les 6 semaines (en 6 sem. : ce que montre la courbe ; en 6 mois : la frise alignée sous la courbe, la fenêtre = l'écran de la frise) */
  var B = M.echelleH({ r0: 1, r1: rB, x0: 44, x1: pw - 6, y0: 0, y1: 1, vmin: 0, vmax: 1 });
  for (r = 1; r <= rB; r++) { var gs = genresSem(r), hh = 16 / Math.max(1, gs.length); gs.forEach(function (g, k) { M.el('rect', { x: B.X(r) + .4, y: 2 + k * hh, width: Math.max(1, B.wk - .8), height: Math.max(1, hh - .6), fill: M.GEN[g].c }, band); }); }
  fenetre(band, B, 1, 6, 19); M.moisAxe(band, B, 36, null);
  window.__mg.courbe = plot.getBoundingClientRect(); window.__mg.bande = band.getBoundingClientRect(); window.__mg.hon = M.honnete(r0, r1);
});
// la page g3b fabrique son en-tête selon la période : on y glisse la fonction
{
  const f = path.join(HERE, 'g3b.html'); let s = fs.readFileSync(f, 'utf8');
  const tete = `<script>window.__tete=function(p){return ${JSON.stringify(TETE('@@'))}.split('@@').join(p)};</script>`;
  s = s.split('<script>window.MG_DATA=').join(tete + '<script>window.MG_DATA='); fs.writeFileSync(f, s);
}
export { TETE, SEL };
console.log('PAGES OK g2b g3b g4b');
