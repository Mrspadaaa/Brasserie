// node mg/build.mjs : six « mode graph » g1…g6 (pages statiques, clair seul). Données : mg/data.json (node mg/data.mjs).
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
<button type="button" class="fab" aria-label="Ajouter en S47">${ico('plus')}<span>S47</span></button>`;
const per = (t) => `<button type="button" class="per" aria-label="Période : ${t}">${t}${ico('bas')}</button>`;
const RET = `<button type="button" class="pil bad" aria-label="2 en retard">${ico('ret')}2</button>`;
const TETE = (extra = '') => `<div class="tt"><b class="big">113</b><span class="u">CHF à dépenser · <b>S24</b></span></div>${extra}`;

const CSS = `*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#fff;--ink:#111;--mut:#666;--line:#ddd;--line2:#bfbfbf;--s1:#f5f5f5;--s2:#ebebeb;--fin:#1f64a3;--ok:#2f7d6b;--bad:#b3261e;--badbg:#fbeae8;--botOn:#efe8e1;--prod:#9a4f1e;--act:#111;--onact:#fff}
html,body{height:100%;overflow:hidden;background:var(--bg);color:var(--ink);font-family:"Source Sans 3","Segoe UI",system-ui,sans-serif;font-size:15px;-webkit-tap-highlight-color:transparent}
.ico{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none}
.bot{position:fixed;left:0;right:0;bottom:0;height:56px;display:flex;background:var(--s1);border-top:1px solid var(--line);z-index:30}
.bot a{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:14px;position:relative;min-width:0}
.bot a.on{background:var(--botOn);font-weight:600;box-shadow:inset 0 3px 0 var(--prod)}
.badge{position:absolute;top:1px;left:calc(50% + 4px);background:#8a5a1c;color:#fff;font-size:14px;font-style:normal;font-weight:600;border-radius:999px;padding:0 5px;line-height:18px}
.fab{position:fixed;right:14px;bottom:72px;z-index:33;width:56px;height:56px;border-radius:28px;border:0;background:var(--act);color:var(--onact);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:inherit;font-weight:700;font-size:14px;line-height:1;box-shadow:0 6px 18px rgba(0,0,0,.28)}
.fab .ico{width:24px;height:24px;stroke-width:2.6}
body.land .bot{height:44px}body.land .bot a{flex-direction:row;gap:6px}body.land .bot a .ico{width:18px;height:18px}body.land .bot a .badge{position:static;order:3;margin-left:-2px}
body.land .fab{bottom:56px;width:48px;height:48px}body.land .fab .ico{width:20px;height:20px}
.tt{display:flex;align-items:baseline;gap:6px;white-space:nowrap}.big{font-size:32px;line-height:1;color:var(--fin);font-weight:800;letter-spacing:-.5px}.u{font-size:16px;color:var(--mut)}.u b{color:var(--fin)}
.per{height:28px;border-radius:14px;border:0;background:var(--ink);color:#fff;font-family:inherit;font-weight:700;font-size:14px;padding:0 4px 0 10px;display:inline-flex;align-items:center;gap:2px;white-space:nowrap}.per .ico{width:16px;height:16px}
.pil{height:28px;min-width:28px;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;gap:3px;border:1.5px solid var(--line2);padding:0 7px;font-family:inherit;font-weight:700;font-size:14px;background:#fff;white-space:nowrap}
.pil .ico{width:16px;height:16px}.pil.bad{border-color:var(--bad);color:var(--bad);background:var(--badbg)}
.hd{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;justify-content:space-between;gap:6px;padding:0 10px;height:48px}
.hd .rt{display:flex;gap:6px;align-items:center}
#plot,#band{position:absolute;display:block;overflow:visible}
svg text{font-family:inherit;font-variant-numeric:tabular-nums}
.lab{font-size:14px;font-weight:600;paint-order:stroke;stroke:#fff;stroke-width:4px;stroke-linejoin:round}.lab .mt{font-weight:800}
.tk{font-size:14px;fill:#777}.mo{font-size:14px;fill:#555}
.leg{position:absolute;display:flex;flex-wrap:wrap;gap:4px 10px;align-content:flex-start}
.ch{display:inline-flex;align-items:center;gap:4px;font-size:14px;font-weight:600;color:var(--c);white-space:nowrap;height:20px}.ch i{width:12px;height:12px;border-radius:3px;background:var(--c);flex:none}.ch b{font-weight:800}
`;

function page(id, titre, css, body, script) {
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${id} · mode graph · ${titre}</title><style>${CSS}${css}</style></head>
<body class="${id}">${body}${NAV}
<script>window.MG_DATA=${DATA};</script><script>${RUN}</script>
<script>(function(){var M=window.MG,D=M.D,el=M.el;var W=innerWidth,H=innerHeight,land=W>H;if(land)document.body.classList.add('land');
var NAVH=land?44:56,U=H-NAVH,FABH=land?48:56,FABTOP=U-(land?12:16)-FABH;window.__mg.U=U;window.__mg.fabTop=FABTOP;
function box(e,x,y,w,h){e.style.left=x+'px';e.style.top=y+'px';if(w!=null)e.style.width=w+'px';if(h!=null)e.style.height=h+'px';if(e.tagName.toLowerCase()==='svg'){e.setAttribute('width',w);e.setAttribute('height',h);}}
${script}
})();</script></body></html>`;
  fs.writeFileSync(path.join(HERE, id + '.html'), html);
}

/* g1 · marches colorées, l'année entière ; bande : mini frise empilée ; bascule : la poignée */
page('g1', 'marches colorées', `.grip{position:absolute;height:22px;width:64px;display:flex;align-items:center;justify-content:center}.grip i{width:40px;height:5px;border-radius:3px;background:#9a9a9a}`,
  `<div class="hd">${TETE()}<div class="rt">${per('An')}${RET}</div></div><svg id="plot"></svg><div class="grip" id="grip" aria-label="Tirer vers le haut : revenir à la frise"><i></i></div><svg id="band"></svg><div class="leg" id="leg"></div>`,
  `var r0=1,r1=52,leg=document.getElementById('leg'),plot=document.getElementById('plot'),band=document.getElementById('band'),grip=document.getElementById('grip');
var bandH=38,obst=[];
if(!land){M.legende(leg,r0,r1);box(leg,10,0,W-10-90,null);var hL=leg.offsetHeight;leg.style.top=(U-6-hL)+'px';
 var bt=Math.min(U-6-hL-8-bandH,FABTOP-6-bandH);box(band,0,bt,W,bandH);box(grip,W/2-32,bt-22,64,22);box(plot,0,50,W,bt-22-50);}
else{M.legende(leg,r0,r1);box(leg,W-196,46,190,null);leg.style.flexDirection='column';
 var bt=U-4-bandH;box(band,0,bt,W-206,bandH);box(grip,(W-206)/2-32,bt-20,64,20);box(plot,0,44,W-206,bt-20-44);}
var pw=+plot.getAttribute('width'),ph=+plot.getAttribute('height');
var S=M.echelleH({r0:r0,r1:r1,x0:44,x1:pw-8,y0:12,y1:ph-26,vmin:0,vmax:8000});
M.grille(plot,S,2000,obst,true);
M.el('rect',{x:S.X(1),y:S.o.y0,width:S.wk,height:S.o.y1-S.o.y0,fill:'#eef3f9'},plot);
M.marches(plot,S,{libre:true},obst);
var cm={};for(var r=2;r<=r1;r++)cm[r]=M.contremarche(plot,S,r,3,obst);
var cadre={x0:2,x1:pw-2,y0:0,y1:ph};
var it=M.mvDans(r0,r1).sort(function(a,b){return Math.abs(b.m)-Math.abs(a.m)}).map(function(m){var c=cm[m.r],o={nom:m.n,mt:M.sg(m.m),c:M.GEN[m.g].c,ax:c.x,ay:m.m>0?c.top:c.bot,up:[c.x,c.top],dn:[c.x,c.bot],grp:'r'+m.r};o.cands=M.cielH(o,obst,m.m>0?[-1,1]:[1,-1],cadre);return o});
M.creux(plot,S,obst,cadre);M.placer(plot,it,obst,cadre,{lienMax:300,essais:1500,deuxLignes:land});
/* bande : par semaine, ce qui est au calendrier, empilé ; mois dessous */
var B=M.echelleH({r0:r0,r1:r1,x0:44,x1:pw-8,y0:0,y1:1,vmin:0,vmax:1});
for(r=r0;r<=r1;r++){var a=(D.act[r]||[]).slice().sort(function(p,q){return M.ORDRE.indexOf(p)-M.ORDRE.indexOf(q)});a.slice(0,4).forEach(function(g,k){M.el('rect',{x:B.X(r)+.5,y:1+k*5,width:Math.max(1,B.wk-1),height:4,rx:1,fill:M.GEN[g].c},band)})}
M.moisAxe(band,B,36,null);
window.__mg.courbe=plot.getBoundingClientRect();window.__mg.bande=band.getBoundingClientRect();window.__mg.hon=M.honnete(r0,r1);`);

/* g2 · zones teintées, 6 mois ; bande : une case par semaine ; bascule : pincer la frise */
page('g2', 'zones teintées', `.hd2{position:absolute;left:10px;right:10px;top:46px}.fin2{position:absolute;font-size:14px;color:var(--mut);line-height:20px}.fin2 b{color:var(--ink);font-weight:700}`,
  `<div class="hd">${TETE()}<div class="rt">${per('6 mois')}${RET}</div></div><div class="leg hd2" id="leg"></div><svg id="plot"></svg><svg id="band"></svg><div class="fin2" id="fin"></div>`,
  `var r0=1,r1=26,leg=document.getElementById('leg'),plot=document.getElementById('plot'),band=document.getElementById('band'),fin=document.getElementById('fin');
var bandH=34,obst=[];M.legende(leg,r0,r1,{sansTotal:true});
fin.innerHTML='caisse <b>'+M.fmt(D.C[r0])+'</b> en S'+M.sn(r0)+' → <b>'+M.fmt(D.C[r1])+'</b> en S'+M.sn(r1);
if(!land){box(leg,10,46,W-20,null);var lt=46+leg.offsetHeight+2;var bt=FABTOP-8-bandH;box(band,0,bt,W,bandH);box(plot,0,lt,W,bt-4-lt);box(fin,12,FABTOP+18,W-110,null);}
else{leg.style.flexDirection='column';box(leg,W-170,50,160,null);var bt=U-6-bandH;box(band,0,bt,W-180,bandH);box(plot,0,44,W-180,bt-4-44);box(fin,W-170,50+leg.offsetHeight+10,160,null);}
var pw=+plot.getAttribute('width'),ph=+plot.getAttribute('height');
var S=M.echelleH({r0:r0,r1:r1,x0:44,x1:pw-8,y0:10,y1:ph-22,vmin:0,vmax:6000});
M.grille(plot,S,1000,obst,true);
var bornes=[r0].concat(M.mvDans(r0+1,r1).map(function(m){return m.r})).concat([r1+1]);
var mv={};M.mvDans(r0,r1).forEach(function(m){mv[m.r]=m});
for(var i=0;i<bornes.length-1;i++){var a=bornes[i],b=bornes[i+1],g=mv[a]?mv[a].g:null,d='M'+S.X(a)+' '+S.Y(0);
 for(var r=a;r<b;r++)d+='L'+S.X(r)+' '+S.Y(D.C[r])+'L'+S.X(r+1)+' '+S.Y(D.C[r]);d+='L'+S.X(b)+' '+S.Y(0)+'Z';
 M.el('path',{d:d,fill:g?M.GEN[g].c:'#9a9a9a','fill-opacity':g?.2:.1},plot);
 if(g)M.el('rect',{x:S.X(a),y:S.Y(D.C[a])+2,width:S.X(b)-S.X(a),height:5,fill:M.GEN[g].c,opacity:.55},plot);}
M.marches(plot,S,{},obst);
for(r=r0+1;r<=r1;r++){var e=M.flux(r),lv=D.C[r-1],y0=S.Y(lv),y1=S.Y(D.C[r]),dg=mv[r]?mv[r].g:M.dominant(r);
 M.el('line',{x1:S.X(r),x2:S.X(r),y1:y0,y2:y1,stroke:dg?M.GEN[dg].c:'#111','stroke-width':mv[r]?5:2.2},plot);obst.push({x:S.X(r)-3,y:Math.min(y0,y1)-1,w:6,h:Math.abs(y1-y0)+2});}
M.moisAxe(plot,S,ph-2,obst);
var cadre={x0:2,x1:pw-2,y0:0,y1:ph-20};
var it=M.mvDans(r0,r1).sort(function(a,b){return Math.abs(b.m)-Math.abs(a.m)}).map(function(m){var nx=bornes[bornes.indexOf(m.r)+1]||r1+1;return{nom:m.n,mt:M.sg(m.m),c:M.GEN[m.g].c,ax:S.X(m.r)+4,ay:S.Y(Math.max(D.C[m.r],D.C[m.r-1]))-14,ay2:S.Y(Math.max(D.C[m.r],D.C[m.r-1]))-3,yb:S.Y(D.C[m.r])+6}}).map(function(o){o.ax=o.ax+6;o.ay=o.yb;o.dn=[o.ax,o.yb];o.up=[o.ax,o.ay2];o.cands=M.cielH(o,obst,[1,-1],cadre);return o});
M.placer(plot,it,obst,cadre,{lienMax:300,essais:1500});
var B=M.echelleH({r0:r0,r1:r1,x0:44,x1:pw-8,y0:0,y1:1,vmin:0,vmax:1});
for(r=r0;r<=r1;r++){var dg2=M.dominant(r,true);M.el('rect',{x:B.X(r)+.5,y:0,width:B.wk-1,height:14,rx:2,fill:dg2?M.GEN[dg2].c:'#e4e4e4',opacity:dg2&&!M.dominant(r)?.45:1},band);
 if((r-r0)%4===0){var t=M.el('text',{class:'mo',x:B.X(r)+1,y:31},band);t.textContent='S'+M.sn(r);}}
window.__mg.courbe=plot.getBoundingClientRect();window.__mg.bande=band.getBoundingClientRect();window.__mg.hon=M.honnete(r0,r1);`);

/* g3 · cascade, 3 mois, chaque pièce nommée ; bande : n° de semaine sur bande de couleur ; bascule : Frise | Courbe */
page('g3', 'cascade', `.seg{display:inline-flex;border:1.5px solid var(--ink);border-radius:15px;overflow:hidden;height:30px}.seg button{border:0;background:#fff;font-family:inherit;font-weight:700;font-size:14px;padding:0 9px;display:inline-flex;align-items:center;gap:4px;color:var(--ink)}.seg button .ico{width:16px;height:16px}.seg button[aria-pressed=true]{background:var(--ink);color:#fff}
.g3 .tt .u{display:none}.g3 .sub{position:absolute;left:12px;top:44px;font-size:14px;color:var(--mut)}.g3 .sub b{color:var(--fin)}`,
  `<div class="hd">${TETE()}<div class="rt">${per('6 sem.')}<span class="seg" role="group" aria-label="Mode"><button aria-pressed="false">${ico('cal')}Frise</button><button aria-pressed="true">${ico('courbe')}Courbe</button></span></div></div><div class="sub" id="sub">CHF à dépenser · <b>S24</b> · ${RET}</div><div class="leg" id="leg"></div><svg id="plot"></svg><svg id="band"></svg>`,
  `var r0=1,r1=6,leg=document.getElementById('leg'),plot=document.getElementById('plot'),band=document.getElementById('band'),sub=document.getElementById('sub');
var bandH=38,obst=[];M.legende(leg,r0,r1,{sansVide:true});
if(!land){box(sub,12,46,W-24,30);sub.style.display='flex';sub.style.alignItems='center';sub.style.gap='8px';box(leg,12,80,W-24,null);var lt=80+leg.offsetHeight+4;var bt=FABTOP-6-bandH;box(band,0,bt,W,bandH);box(plot,0,lt,W,bt-2-lt);}
else{sub.style.display='none';leg.style.flexDirection='column';box(leg,W-196,50,190,null);var bt=U-4-bandH;box(band,0,bt,W-206,bandH);box(plot,0,46,W-206,bt-2-46);}
var pw=+plot.getAttribute('width'),ph=+plot.getAttribute('height');
var S=M.echelleH({r0:r0,r1:r1,x0:44,x1:pw-6,y0:8,y1:ph-28,vmin:3000,vmax:6500});
M.grille(plot,S,500,obst,true);
/* axe coupé, dit en clair : les barres sont des écarts, à la même échelle */M.el('path',{d:'M38 '+(S.o.y1+14)+'l5 -4l5 4l5 -4',fill:'none',stroke:'#777','stroke-width':1.5},plot);
var cadre={x0:2,x1:pw-2,y0:0,y1:ph-18},it=[];
for(var r=r0;r<=r1;r++){var lv=r===1?4180:D.C[r-1],x=S.X(r),wk=S.wk,bw=Math.max(6,wk*.3),xi=x+wk*.16,xo=xi+bw+2,h=lv;
 M.flux(r).filter(function(i){return i.m>0}).sort(function(a,b){return (a.n==='Ventes de la semaine'?-1:0)-(b.n==='Ventes de la semaine'?-1:0)||b.m-a.m}).forEach(function(i){var y0=S.Y(h),y1=S.Y(h+i.m);M.el('rect',{x:xi,y:y1,width:bw,height:y0-y1,fill:M.GEN[i.g].c,stroke:'#fff','stroke-width':.8},plot);obst.push({x:xi-1,y:y1,w:bw+2,h:y0-y1,grp:'i'+r});if(i.n!=='Ventes de la semaine')it.push({nom:i.n,mt:M.sg(i.m),c:M.GEN[i.g].c,ax:xi+bw/2,ay:y1,up:[xi+bw/2,y1],dn:[xi+bw/2,S.Y(lv)],pref:-1,m:i.m,grp:'i'+r});h+=i.m;});
 var top=h;M.el('line',{x1:x,x2:xo+bw,y1:S.Y(lv),y2:S.Y(lv),stroke:'#111','stroke-width':1.2,'stroke-dasharray':'2 2'},plot);
 M.flux(r).filter(function(i){return i.m<0}).sort(function(a,b){return a.m-b.m}).forEach(function(i){var y0=S.Y(h),y1=S.Y(h+i.m);M.el('rect',{x:xo,y:y0,width:bw,height:y1-y0,fill:M.GEN[i.g].c,stroke:'#fff','stroke-width':.8},plot);obst.push({x:xo-1,y:y0,w:bw+2,h:y1-y0,grp:'o'+r});if(/^Loyer/.test(i.n)&&window.__lo3){h+=0}else it.push({nom:/^Loyer/.test(i.n)?(window.__lo3=1,'Loyer chaque mois'):i.n,mt:M.sg(i.m),c:M.GEN[i.g].c,ax:xo+bw/2,ay:y1,dn:[xo+bw/2,y1],up:[xo+bw/2,S.Y(lv)],pref:1,m:i.m,grp:'o'+r});h+=i.m;});
 if(top!==lv)M.el('line',{x1:xi,x2:xo+bw,y1:S.Y(top),y2:S.Y(top),stroke:'#111','stroke-width':1,'stroke-dasharray':'2 2'},plot);
 var yc=S.Y(D.C[r]);M.el('line',{x1:xo+bw,x2:S.X(r+1)+wk*.16,y1:yc,y2:yc,stroke:'#111','stroke-width':2.4},plot);obst.push({x:xo+bw,y:yc-2,w:S.X(r+1)+wk*.16-xo-bw,h:4});obst.push({x:x,y:S.Y(top)-1,w:wk,h:2,grp:'i'+r});}
M.moisAxe(plot,S,ph-2,obst);
it.sort(function(a,b){return Math.abs(b.m)-Math.abs(a.m)});it.forEach(function(o){o.cands=M.cielH(o,obst,o.pref<0?[-1]:[1,-1],cadre)});M.placer(plot,it,obst,cadre,{lienMax:520,essais:1200,deuxLignes:true});
var B=M.echelleH({r0:r0,r1:r1,x0:44,x1:pw-6,y0:0,y1:1,vmin:0,vmax:1});
for(r=r0;r<=r1;r++){var dg=M.dominant(r,true);M.el('rect',{x:B.X(r)+1,y:0,width:B.wk-2,height:10,rx:2,fill:dg?M.GEN[dg].c:'#e4e4e4'},band);var t=M.el('text',{class:'mo','text-anchor':'middle',x:B.X(r)+B.wk/2,y:28},band);t.textContent='S'+M.sn(r);}
window.__mg.courbe=plot.getBoundingClientRect();window.__mg.bande=band.getBoundingClientRect();window.__mg.hon=M.honnete(r0,r1);`);

/* g4 · couloirs : entrées nommées en haut, sorties en bas, l'année ; bande : barres et fenêtre de la frise ; bascule : le bouton plein écran */
page('g4', 'entrées en haut, sorties en bas', `.tog{height:30px;width:34px;justify-content:center;border-radius:15px;border:1.5px solid var(--ink);background:#fff;font-family:inherit;font-weight:700;font-size:14px;display:inline-flex;align-items:center;gap:4px;padding:0 9px}.tog .ico{width:16px;height:16px}`,
  `<div class="hd">${TETE()}<div class="rt">${per('6 mois')}${RET}<button class="tog" aria-label="Revenir à la frise">${ico('cal')}</button></div></div><svg id="plot"></svg><svg id="band"></svg><div class="leg" id="leg"></div>`,
  `var r0=1,r1=26,leg=document.getElementById('leg'),plot=document.getElementById('plot'),band=document.getElementById('band');
var bandH=32,obst=[];M.legende(leg,r0,r1);
if(!land){box(leg,10,0,W-96,null);var hL=leg.offsetHeight;leg.style.top=(U-6-hL)+'px';var bt=Math.min(U-6-hL-8-bandH,FABTOP-6-bandH);box(band,0,bt,W,bandH);box(plot,0,48,W,bt-4-48);}
else{leg.style.flexDirection='column';box(leg,W-196,50,190,null);var bt=U-4-bandH;box(band,0,bt,W-206,bandH);box(plot,0,44,W-206,bt-4-44);}
var pw=+plot.getAttribute('width'),ph=+plot.getAttribute('height');
var mvs=M.mvDans(r0,r1),ent=mvs.filter(function(m){return m.m>0}),sor=mvs.filter(function(m){return m.m<0});
var RH=19,nrow=land?3:4,laneE=nrow*RH+6,laneS=nrow*RH+6;
var S=M.echelleH({r0:r0,r1:r1,x0:40,x1:pw-6,y0:laneE+8,y1:ph-laneS-8,vmin:0,vmax:8000});
M.grille(plot,S,2000,obst,true);
var dA='M'+S.X(r0)+' '+S.Y(0);for(var r=r0;r<=r1;r++)dA+='L'+S.X(r)+' '+S.Y(D.C[r])+'L'+S.X(r+1)+' '+S.Y(D.C[r]);M.el('path',{d:dA+'L'+S.X(r1+1)+' '+S.Y(0)+'Z',fill:'#1f64a3','fill-opacity':.07},plot);
M.marches(plot,S,{},obst);var cm={};for(r=2;r<=r1;r++)cm[r]=M.contremarche(plot,S,r,3,obst);
/* couloirs en escalier : de droite à gauche, chaque étiquette commence à son trait ; une rangée plus loin si la place manque ; aucun trait ne traverse un texte */
var pris=[],g=M.el('g',{class:'labs'},plot);
function couloir(list,haut){var deb=[];for(var k=0;k<nrow;k++)deb.push(pw-2+8);var boites=[];
 list.slice().sort(function(a,b){return b.r-a.r}).forEach(function(m){var c=cm[m.r],ax=c.x,ay=haut?c.top:c.bot,nom=m.n,mt=M.sg(m.m),formes=[[M.largeur(nom+' '+mt,'lab'),1,null]];
  var mots=nom.split(' ');if(mots.length>1){var cut=Math.ceil(mots.length/2),l1=mots.slice(0,cut).join(' '),l2=mots.slice(cut).join(' ')+' '+mt;formes.push([Math.max(M.largeur(l1,'lab'),M.largeur(l2,'lab')),2,[l1,mots.slice(cut).join(' ')]]);}else formes.push([Math.max(M.largeur(nom,'lab'),M.largeur(mt,'lab')),2,[nom,'']]);
  var best=null;for(var k=0;k<nrow;k++)for(var f=0;f<formes.length;f++){var w=formes[f][0],nr=formes[f][1];if(k+nr>nrow)continue;var x=Math.max(2,Math.min(ax-4,pw-2-w)),libre=true;
   boites.forEach(function(bb){if(bb.row>=k&&bb.row<k+nr&&x<bb.x+bb.w+8&&bb.x<x+w+8)libre=false;if(bb.row<k&&ax>=bb.x-2&&ax<=bb.x+bb.w+2)libre=false;if(bb.row>=k+nr&&bb.ax>=x-2&&bb.ax<=x+w+2)libre=false;});
   if(libre){var cov=list.filter(function(o){return o.r<m.r&&cm[o.r].x>=x-2&&cm[o.r].x<=x+w+2}).length,sc=k*10+f*4+cov*(nrow-k)*12;if(!best||sc<best.sc)best={x:x,w:w,k:k,nr:nr,f:formes[f],sc:sc};}}
  var ok=best;if(!ok){window.__mg.caches.push(nom);return}
  for(var j=ok.k;j<ok.k+ok.nr;j++)boites.push({row:j,x:ok.x,w:ok.w,ax:ax});
  var yTop=haut?laneE-(ok.k+ok.nr)*RH:ph-laneS+4+ok.k*RH,b={x:ok.x,y:yTop,w:ok.w,h:ok.nr*RH-1};pris.push(b);
  var ly=haut?b.y+b.h:b.y;M.el('line',{x1:ax,x2:ax,y1:haut?ly:ay+3,y2:haut?ay-3:ly,stroke:M.GEN[m.g].c,'stroke-width':1.3,'stroke-dasharray':'1 2.5',class:'lien'},g);
  var t=M.el('text',{class:'lab',x:b.x,y:b.y+14,fill:M.GEN[m.g].c},g);
  if(ok.nr===1){M.el('tspan',{},t).textContent=nom+' ';M.el('tspan',{class:'mt'},t).textContent=mt;}
  else{M.el('tspan',{},t).textContent=ok.f[2][0];if(ok.f[2][1]){M.el('tspan',{x:b.x,dy:RH},t).textContent=ok.f[2][1]+' ';M.el('tspan',{class:'mt'},t).textContent=mt;}else M.el('tspan',{class:'mt',x:b.x,dy:RH},t).textContent=mt;}
 });}
couloir(ent,true);couloir(sor,false);window.__mg.labs=pris;


M.el('rect',{x:0,y:0,width:pw,height:laneE,fill:'#2f7d6b','fill-opacity':.05},plot);M.el('rect',{x:0,y:ph-laneS,width:pw,height:laneS,fill:'#b3261e','fill-opacity':.04},plot);
var B=M.echelleH({r0:r0,r1:r1,x0:40,x1:pw-6,y0:0,y1:1,vmin:0,vmax:1});
for(r=r0;r<=r1;r++){var dg=M.dominant(r,true);M.el('rect',{x:B.X(r)+.5,y:2,width:Math.max(1,B.wk-1),height:10,rx:1,fill:dg?M.GEN[dg].c:'#e4e4e4'},band);}
M.el('rect',{x:B.X(1)-1,y:0,width:B.X(7)-B.X(1)+2,height:14,rx:3,fill:'none',stroke:'#111','stroke-width':2},band);
M.moisAxe(band,B,30,null);
window.__mg.courbe=plot.getBoundingClientRect();window.__mg.bande=band.getBoundingClientRect();window.__mg.hon=M.honnete(r0,r1);`);

/* g5 · l'année à la verticale : le temps descend, les noms s'écrivent en ligne ; bande verticale ; bascule : pastille au pouce */
page('g5', 'année à la verticale', `.pouce{position:fixed;left:14px;z-index:33;height:44px;border-radius:22px;border:0;background:#fff;color:var(--ink);box-shadow:0 3px 12px rgba(0,0,0,.22),0 0 0 1.5px var(--ink) inset;font-family:inherit;font-weight:700;font-size:15px;display:inline-flex;align-items:center;gap:6px;padding:0 14px 0 12px}.pouce .ico{width:20px;height:20px;color:#9a4f1e}`,
  `<div class="hd">${TETE()}<div class="rt">${per('An')}${RET}</div></div><div class="leg" id="leg"></div><svg id="band"></svg><svg id="plot"></svg><button class="pouce" id="pouce" aria-label="Revenir à la frise">${ico('cal')}Frise</button>`,
  `var r0=1,r1=52,leg=document.getElementById('leg'),plot=document.getElementById('plot'),band=document.getElementById('band'),pouce=document.getElementById('pouce');
var bandW=40,obst=[];M.legende(leg,r0,r1);
if(!land){box(leg,10,46,W-20,null);var lt=46+leg.offsetHeight+4;var pb=FABTOP-8;box(band,0,lt+20,bandW,pb-lt-20);box(plot,bandW,lt,W-bandW,pb-lt);pouce.style.top=(FABTOP+6)+'px';}
else{leg.style.flexDirection='column';box(leg,W-196,46,190,null);box(band,0,64,bandW,U-64-6);box(plot,bandW,44,W-206-bandW,U-44-6);pouce.style.left=(W-196)+'px';pouce.style.top=(FABTOP+2)+'px';}
var pw=+plot.getAttribute('width'),ph=+plot.getAttribute('height');
var top=20,n=52,x0=10,x1=pw-10;function Yt(r){return top+(ph-top-4)*(r-r0)/n}function Xv(v){return x0+(x1-x0)*v/8000}var hw=(ph-top-4)/n;
for(var v=0;v<=8000;v+=2000){M.el('line',{x1:Xv(v),x2:Xv(v),y1:top,y2:ph-4,stroke:v?'#e4e4e4':'#bfbfbf'},plot);var t=M.el('text',{class:'tk',x:Xv(v),y:14,'text-anchor':v===0?'start':v===8000?'end':'middle'},plot);t.textContent=v?M.fmt(v):'0';}
M.el('rect',{x:x0,y:Yt(1),width:x1-x0,height:hw,fill:'#eef3f9'},plot);
var d='',dl='',r;for(r=r0;r<=r1;r++){var x=Xv(D.C[r]);d+=(r===r0?'M':'L')+x+' '+Yt(r)+'L'+x+' '+Yt(r+1);obst.push({x:x-2,y:Yt(r),w:4,h:hw});var xl=Xv(D.L[r]);dl+=(r===r0?'M':'L')+xl+' '+Yt(r)+'L'+xl+' '+Yt(r+1);obst.push({x:xl-1.5,y:Yt(r),w:3,h:hw,mou:1});if(r>r0)obst.push({x:Math.min(xl,Xv(D.L[r-1])),y:Yt(r)-1,w:Math.abs(xl-Xv(D.L[r-1])),h:2,mou:1});}
M.el('path',{d:dl,fill:'none',stroke:'#111','stroke-width':1.3,'stroke-dasharray':'3 3',opacity:.7},plot);M.el('path',{d:d,fill:'none',stroke:'#111','stroke-width':2.2},plot);
var ep=Math.min(3.5,hw*.45),cm={};
for(r=2;r<=r1;r++){var y=Yt(r),lv=D.C[r-1],h=lv;M.entrees(r).forEach(function(i){M.el('rect',{x:Xv(h),y:y-ep,width:Xv(h+i.m)-Xv(h),height:ep,fill:M.GEN[i.g].c},plot);h+=i.m});var hh=h;
 M.sorties(r).forEach(function(i){M.el('rect',{x:Xv(h+i.m),y:y,width:Xv(h)-Xv(h+i.m),height:ep,fill:M.GEN[i.g].c},plot);h+=i.m});
 cm[r]={a:Xv(Math.min(lv,h)),b:Xv(Math.max(lv,hh)),y:y};obst.push({x:cm[r].a-1,y:y-ep-1,w:cm[r].b-cm[r].a+2,h:2*ep+2,grp:'r'+r});}
var cadre={x0:2,x1:pw-2,y0:top,y1:ph};
var it=M.mvDans(r0,r1).sort(function(a,b){return Math.abs(b.m)-Math.abs(a.m)}).map(function(m){var c=cm[m.r];return{nom:m.n,mt:M.sg(m.m),c:M.GEN[m.g].c,ax:m.m>0?c.b:c.a,ay:c.y,rt:[c.b,c.y],lf:[c.a,c.y],grp:'r'+m.r,dir:m.m>0?1:-1}}).map(function(o){o.cands=M.cielV(o,obst,o.dir>0?[1,-1]:[-1,1],cadre);return o});
var px=Xv(D.L[D.pb.r]),py=Yt(D.pb.r)+hw/2;M.el('circle',{cx:px,cy:py,r:5,fill:'#1f64a3',stroke:'#fff','stroke-width':2},plot);obst.push({x:px-6,y:py-6,w:12,h:12});
var oc={nom:'à dépenser',mt:M.fmt(D.pb.v)+' · S'+M.sn(D.pb.r),c:'#1f64a3',ax:px,ay:py};oc.cands=M.cielV(oc,obst,[1,-1],cadre);it.push(oc);
M.placer(plot,it,obst,cadre,{lienMax:220,essais:1500});
/* bande verticale : mois en clair, une barre de couleur par semaine */
var bh=+band.getAttribute('height'),bt=Yt(1)-20+0,ofs=(+plot.style.top.replace('px',''))-(+band.style.top.replace('px',''));
for(r=r0;r<=r1;r++){var dg=M.dominant(r,true),yy=Yt(r)+ofs;M.el('rect',{x:bandW-7,y:yy+.5,width:7,height:Math.max(1,hw-1),rx:1,fill:dg?M.GEN[dg].c:'#e4e4e4'},band);}
D.mois.forEach(function(m){if(m.r<=r0||m.r>r1)return;var yy=Yt(m.r)+ofs;M.el('line',{x1:0,x2:bandW-10,y1:yy,y2:yy,stroke:'#bfbfbf'},band);var t=M.el('text',{class:'mo',x:3,y:yy+15},band);t.textContent=M.MO[m.k].replace('.','');});
window.__mg.courbe=plot.getBoundingClientRect();window.__mg.bande=band.getBoundingClientRect();window.__mg.bandeVerticale=true;window.__mg.hon=M.honnete(r0,r1);`);

/* g6 · bulles : chaque mouvement est une pastille dont l'aire suit le montant, 6 mois ; bande : sept couloirs de la frise ; bascule : double toucher */
page('g6', 'bulles', `.cle{display:inline-flex;align-items:center;gap:4px;font-size:14px;color:var(--mut);height:20px;white-space:nowrap}`,
  `<div class="hd">${TETE()}<div class="rt">${per('6 mois')}${RET}</div></div><svg id="plot"></svg><svg id="band"></svg><div class="leg" id="leg"></div>`,
  `var r0=1,r1=26,leg=document.getElementById('leg'),plot=document.getElementById('plot'),band=document.getElementById('band');
var bandH=35,obst=[];M.legende(leg,r0,r1,{sansVide:true});
leg.insertAdjacentHTML('beforeend','<span class="cle"><svg width="44" height="20"><circle cx="8" cy="10" r="7.6" fill="#888"/><circle cx="30" cy="10" r="7.6" fill="#fff" stroke="#888" stroke-width="3"/></svg>entrée · sortie</span>');
if(!land){box(leg,10,46,W-20,null);var lt=46+leg.offsetHeight+2;var bt=FABTOP-6-bandH;box(band,0,bt,W,bandH);box(plot,0,lt,W,bt-4-lt);}
else{leg.style.flexDirection='column';box(leg,W-196,46,190,null);var bt=U-4-bandH;box(band,0,bt,W-206,bandH);box(plot,0,44,W-206,bt-4-44);}
var pw=+plot.getAttribute('width'),ph=+plot.getAttribute('height');
var S=M.echelleH({r0:r0,r1:r1,x0:44,x1:pw-10,y0:14,y1:ph-22,vmin:0,vmax:7000});
M.grille(plot,S,1000,obst,true);M.marches(plot,S,{ep:1.6},obst);
function R(m){return 3+19*Math.sqrt(Math.abs(m)/2800)}
var bul=[];for(var r=r0+1;r<=r1;r++){var h=D.C[r-1],x=S.X(r);M.entrees(r).forEach(function(i){bul.push({x:x,y:S.Y(h+i.m/2),i:i,r:r});h+=i.m});M.sorties(r).forEach(function(i){bul.push({x:x,y:S.Y(h+i.m/2),i:i,r:r});h+=i.m});}
var b1=D.sem[1][0];bul.push({x:S.X(1)+3,y:S.Y(4180+b1.m/2),i:b1,r:1});
bul.sort(function(a,b){return Math.abs(b.i.m)-Math.abs(a.i.m)}).forEach(function(b){var rr=R(b.i.m),c=M.GEN[b.i.g].c;M.el('circle',{cx:b.x,cy:b.y,r:b.i.m>0?rr:rr-1.5,fill:b.i.m>0?c:'#fff','fill-opacity':b.i.m>0?.9:1,stroke:b.i.m>0?'#fff':c,'stroke-width':b.i.m>0?1:3},plot);obst.push({x:b.x-rr,y:b.y-rr,w:2*rr,h:2*rr,grp:'w'+b.r});});
M.moisAxe(plot,S,ph-2,obst);
var cadre={x0:2,x1:pw-2,y0:0,y1:ph-20},vu={};
var nomsMV={};D.MV.forEach(function(m){nomsMV[m.r+'|'+m.m]=m.n});var it=bul.filter(function(b){if(/^Loyer/.test(b.i.n)){if(vu.l)return false;vu.l=1;return true}return !!nomsMV[b.r+'|'+b.i.m]}).sort(function(a,b){return Math.abs(b.i.m)-Math.abs(a.i.m)}).map(function(b){var rr=R(b.i.m),nm=/^Loyer/.test(b.i.n)?'Loyer':nomsMV[b.r+'|'+b.i.m];var o={nom:nm,mt:M.sg(b.i.m),c:M.GEN[b.i.g].c,ax:b.x,ay:b.i.m>0?b.y-rr:b.y+rr,up:[b.x,b.y-rr],dn:[b.x,b.y+rr],grp:'w'+b.r};o.cands=M.cielH(o,obst,b.i.m>0?[-1,1]:[1,-1],cadre);return o});
M.placer(plot,it,obst,cadre,{lienMax:420,essais:1500,deuxLignes:true});
var B=M.echelleH({r0:r0,r1:r1,x0:44,x1:pw-10,y0:0,y1:1,vmin:0,vmax:1});
M.ORDRE.forEach(function(g,k){for(var r=r0;r<=r1;r++)if((D.act[r]||[]).indexOf(g)>=0||D.sem[r].some(function(i){return i.g===g&&i.n!=='Ventes de la semaine'&&!/^Loyer/.test(i.n)}))M.el('rect',{x:B.X(r),y:k*5,width:B.wk+.3,height:4,fill:M.GEN[g].c},band);});
window.__mg.courbe=plot.getBoundingClientRect();window.__mg.bande=band.getBoundingClientRect();window.__mg.hon=M.honnete(r0,r1);`);
console.log('PAGES OK g1…g6');
