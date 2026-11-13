// @ts-nocheck
/* eslint-disable */
// Mise en page mesurée du mur du stock : les scripts de la maquette sy/fA, repris tels quels (généré par extraire.mjs).
// Ils mesurent le DOM (espacement ≥ 14 px, titres courts ou pliés, socle sous les marques, ligne de rappel).
// `document` est remplacé par la racine du mur ; `window` par un objet local ; les écouteurs de fenêtre sont retirés au démontage.
export function installerMiseEnPage(racine: HTMLElement): { arreter: () => void; repose: () => void } {
  const ecouteurs: Array<[string, EventListener]> = [];
  const timers: number[] = [];
  const W: Record<string, any> = {};
  const doc = { querySelectorAll: (s: string) => racine.querySelectorAll(s), querySelector: (s: string) => racine.querySelector(s), fonts: (document as any).fonts };
  const addEventListener = (t: string, f: EventListener) => { ecouteurs.push([t, f]); window.addEventListener(t, f); };
  const setTimeout = (f: () => void, ms: number) => { const id = window.setTimeout(f, ms); timers.push(id); return id; };
  (function (document, window, addEventListener, setTimeout) {
(function(){var clr=window.svClr=function(){[].forEach.call(document.querySelectorAll('.l1e-g'),function(g){g.style.marginLeft='';});};
var esp=window.svEsp=function(){[].forEach.call(document.querySelectorAll('.l1e-pl'),function(pl){var gs=[].slice.call(pl.querySelectorAll('.l1e-g'));if(gs.length<2)return;
var hop=!!pl.closest('[data-f=f1]'),M=14;pl.removeAttribute('data-esp');
var over=function(){return (function(v){return v&&getComputedStyle(v).position!=='absolute'?v:gs[gs.length-1];})(pl.querySelector('.sx-vd')).getBoundingClientRect().right>pl.getBoundingClientRect().right+0.5;};
var pose=function(){gs.forEach(function(g){g.style.marginLeft='';});var ok=false;for(var k=0;k<5&&!ok;k++){ok=true;for(var i=1;i<gs.length;i++){var a=gs[i-1].querySelector('.l1e-t'),b=gs[i].querySelector('.l1e-t');if(!a||!b)continue;var d=b.getBoundingClientRect().left-a.getBoundingClientRect().right;if(d<M-0.5){ok=false;gs[i].style.marginLeft=((parseFloat(gs[i].style.marginLeft)||0)+M-d).toFixed(1)+'px';}}}return over()||!ok;};
if(!pose())return;
if(hop){pl.style.setProperty('--hg','1px');if(!pose())return;for(var hw=9;hw>=8;hw--){pl.style.setProperty('--hw',hw+'px');if(!pose())return;}}
var cg=parseFloat(getComputedStyle(pl).columnGap)||8;for(var g=Math.min(cg,7);g>=4;g--){pl.style.gap=g+'px';if(!pose())return;}
for(M=12;M>=6;M-=2)if(!pose())return;pl.setAttribute('data-esp','serre');});};})();
  })(doc, W, addEventListener, setTimeout);
  (function (document, window, addEventListener, setTimeout) {
(function(){function bw(g){var b=g.querySelectorAll('.l1e-b');if(!b.length)return 0;return b[b.length-1].getBoundingClientRect().right-b[0].getBoundingClientRect().left;}
function ex(g){return g.querySelector('.l1e-w').getBoundingClientRect().width-bw(g);}
function fit(){[].forEach.call(document.querySelectorAll('.l1e-pl'),function(pl){var gs=[].slice.call(pl.querySelectorAll('.l1e-g'));
gs.forEach(function(g){var w=g.querySelector('.l1e-w');w.textContent=w.dataset.long;w.classList.remove('l1e-wr');});pl.style.gap='';gs.forEach(function(g){g.querySelector('.l1e-t').classList.remove('l1e-tw');});
var over=function(){var R=pl.getBoundingClientRect(),l=(function(v){return v&&getComputedStyle(v).position!=='absolute'?v:gs[gs.length-1];})(pl.querySelector('.sx-vd')).getBoundingClientRect();return l.right>R.right+0.5;};
for(var m=0;m<12&&over();m++){var t=gs.map(function(g){return g.querySelector('.l1e-t');}).filter(function(t){return t.querySelector('.l1e-tl')&&!t.classList.contains('l1e-tw');}).sort(function(a,b){return b.getBoundingClientRect().width-a.getBoundingClientRect().width;})[0];if(!t)break;t.classList.add('l1e-tw');}
for(var n=0;n<12&&over();n++){var c=gs.filter(function(g){var w=g.querySelector('.l1e-w');return w.dataset.court&&w.textContent!==w.dataset.court;}).sort(function(a,b){return ex(b)-ex(a);})[0];if(!c)break;c.querySelector('.l1e-w').textContent=c.querySelector('.l1e-w').dataset.court;}
for(n=0;n<12&&over();n++){var d=gs.filter(function(g){var w=g.querySelector('.l1e-w');return !w.classList.contains('l1e-wr')&&/ /.test(w.textContent)&&ex(g)>0;}).sort(function(a,b){return ex(b)-ex(a);})[0];if(!d)break;d.querySelector('.l1e-w').classList.add('l1e-wr');}
for(var gp=7;gp>=3&&over();gp--)pl.style.gap=gp+'px';
gs.forEach(function(g){var w=g.querySelector('.l1e-w');w.style.marginBottom='';if(!w.classList.contains('l1e-wr'))return;var gb=g.querySelector('.l1e-gb'),r=pl.closest('.l1e-r'),hc=parseFloat(getComputedStyle(r).getPropertyValue('--hc'))||0,mx=hc;[].forEach.call(gb.children,function(b){mx=Math.max(mx,b.getBoundingClientRect().height);});var free=gb.getBoundingClientRect().height-mx-3,extra=w.getBoundingClientRect().height-14;if(extra>0&&free>=extra){w.style.marginBottom=(-extra)+'px';w.style.position='relative';w.style.zIndex='1';}});});}
function fit2(){window.svClr();fit();window.svEsp();}window.sxFit2=function(){fit2();if(window.sxWr)window.sxWr();};window.sxFit2();if(document.fonts)document.fonts.ready.then(fit2);})();
  })(doc, W, addEventListener, setTimeout);
  (function (document, window, addEventListener, setTimeout) {
(function(){
// un libellé plié (« Kölsch / & Alt ») : sa 2e ligne, calée à droite, descend dans la planche si aucune marque n'est dessous (sinon la rangée grandit, comme x1)
window.sxWr=function(){[].forEach.call(document.querySelectorAll('.l1e-w.l1e-wr'),function(w){if(w.style.marginBottom)return;var g=w.closest('.l1e-g'),gb=g.querySelector('.l1e-gb'),pl=g.closest('.l1e-pl');w.style.textAlign='right';w.style.minWidth='';
function l2(){var rg=document.createRange();rg.selectNodeContents(w);var rs=rg.getClientRects();return rs.length<2?null:rs[rs.length-1];}
function mx(L){var m=0,d=0;[].forEach.call(gb.children,function(b){var r=b.getBoundingClientRect();if(r.right>L.left-4&&r.left<L.right){m=Math.max(m,r.height);d=Math.max(d,r.right+4-L.left);}});return [m,d];}
var L=l2();if(!L){w.style.textAlign='';return;}var extra=w.getBoundingClientRect().height-14,H=gb.getBoundingClientRect().height,M=mx(L);
if(extra>0&&H-M[0]-3<extra&&M[1]>0&&M[1]<=6){w.style.minWidth=(w.getBoundingClientRect().width+M[1])+'px';L=l2();M=mx(L);if(pl.lastElementChild.getBoundingClientRect().right>pl.getBoundingClientRect().right+0.5)M=[H,0];}
if(extra>0&&H-M[0]-3>=extra){w.style.marginBottom=(-extra)+'px';w.style.position='relative';w.style.zIndex='1';}else{w.style.textAlign='';w.style.minWidth='';}});};function ov(a,b){return a.left<b.right-0.5&&b.left<a.right-0.5&&a.top<b.bottom-0.5&&b.top<a.bottom-0.5;}
var K=['sx-vda','sx-vdb','sx-vdh','sx-vdn'];
function set(pl,c){var v=pl.querySelector('.sx-vd');K.forEach(function(k){v.classList.remove(k);pl.classList.remove(k+'-pl');});if(c){v.classList.add(c);pl.classList.add(c+'-pl');}}
function bad(pl){var v=pl.querySelector('.sx-vd'),R=v.getBoundingClientRect(),P=pl.getBoundingClientRect();if(R.right>P.right+0.5)return true;
return [].some.call(pl.querySelectorAll('[data-art],.l1e-w,.l1e-t,.l1e-b'),function(e){return !v.contains(e)&&ov(R,e.getBoundingClientRect());});}
function nwr(pl){return pl.querySelectorAll('.l1e-wr').length;}
// sy (ST-18, « Stouts » sur la ligne) : la pastille dans le flux ne plie aucun titre de plus ; on resserre d'abord l'écart des colonnes (7 → 4 px), comme svEsp
function ovr(pl){var v=pl.querySelector('.sx-vd');return v.getBoundingClientRect().right>pl.getBoundingClientRect().right+0.5;}
function unwr(pl,f){var ws=[].slice.call(pl.querySelectorAll('.l1e-wr'));if(!ws.length)return;for(var gp=7;gp>=4;gp--){ws.forEach(function(w){w.classList.remove('l1e-wr');['marginBottom','position','zIndex','textAlign','minWidth'].forEach(function(k){w.style[k]='';});});
pl.style.gap=gp+'px';if(window.svEsp)window.svEsp();if(!ovr(pl)&&!bad(pl)){pl.setAttribute('data-unwr','1');return;}}f();}
function vt(pl){var gs=pl.querySelectorAll('.l1e-g'),w=gs.length&&gs[gs.length-1].querySelector('.l1e-w');pl.style.setProperty('--vt',(w?w.getBoundingClientRect().bottom-pl.getBoundingClientRect().top+2:0)+'px');}
function re(){var f=window.sxFit2||function(){};var pls=[].slice.call(document.querySelectorAll('.l1e-pl')).filter(function(pl){return pl.querySelector('.sx-vd');});
pls.forEach(function(pl){pl.style.gap='';pl.removeAttribute('data-unwr');set(pl,'sx-vdn');});f();var n0=pls.map(nwr);
pls.forEach(function(pl,i){var T=['sx-vda','','sx-vdb','sx-vdh'];for(var j=0;j<T.length;j++){set(pl,T[j]);f();if(T[j]==='sx-vdb')vt(pl);if(T[j]===''&&n0[i]===0&&nwr(pl)>0)unwr(pl,f);if(T[j]==='sx-vdh')break;
if(T[j]===''?(nwr(pl)<=n0[i]&&!bad(pl)):!bad(pl))break;}pl.setAttribute('data-vides',T[j]||'flux');});
// la rangée suivante refait fit() pour tout le mur : on repose le desserrage des rangées déjà réglées
pls.forEach(function(pl){if(pl.getAttribute('data-unwr'))unwr(pl,function(){});});
// sy : deux titres de houblons voisins à 7 px au moins (« Pale Lager ») ; on essaie l'écart 7 px, svEsp amincit d'abord les marques (--hg, --hw)
pls.forEach(function(pl){var g=parseFloat(pl.style.gap);if(!(g<7)||!pl.closest('[data-f=f1]'))return;var o=[pl.style.gap,pl.style.getPropertyValue('--hw'),pl.style.getPropertyValue('--hg')];
pl.style.gap='7px';if(window.svEsp)window.svEsp();if(parseFloat(pl.style.gap)<7||ovr(pl)||bad(pl)){pl.style.gap=o[0];pl.style.setProperty('--hw',o[1]);pl.style.setProperty('--hg',o[2]);if(window.svEsp)window.svEsp();}});if(window.sxWr)window.sxWr();}
re();if(document.fonts)document.fonts.ready.then(function(){setTimeout(re,0);});})();
  })(doc, W, addEventListener, setTimeout);
  (function (document, window, addEventListener, setTimeout) {
(function(){var f=window.sySo=function(){[].forEach.call(document.querySelectorAll('.l1e-gb>.sy-so'),function(s){var gb=s.parentNode,G=gb.getBoundingClientRect();
var ms=[].filter.call(gb.children,function(c){return c!==s&&c.getBoundingClientRect().width>0&&getComputedStyle(c).position!=='absolute';});if(!ms.length)return;
var a=1e9,b=-1e9;ms.forEach(function(m){var r=m.getBoundingClientRect();a=Math.min(a,r.left);b=Math.max(b,r.right);});
s.style.left=(a-G.left-gb.clientLeft).toFixed(2)+'px';s.style.width=(b-a).toFixed(2)+'px';s.style.right='auto';
var c={};try{c=JSON.parse(s.dataset.c||'{}');}catch(e){}var st=[];[].forEach.call(gb.querySelectorAll('[data-art]'),function(m){var k=m.getAttribute('data-art');if(!c[k])return;var r=m.getBoundingClientRect();st.push(c[k]+' '+(((r.left+r.right)/2-a)/Math.max(1,b-a)*100).toFixed(1)+'%');});
if(st.length>1)s.style.background='linear-gradient(90deg,'+st.join(',')+')';else if(st.length===1)s.style.background=st[0].split(' ')[0];s.style.transform=ms.length===1?'translateY(1px)':'';});};
f();if(document.fonts)document.fonts.ready.then(function(){setTimeout(f,30);});addEventListener('load',function(){setTimeout(f,30);});addEventListener('resize',f);})();
  })(doc, W, addEventListener, setTimeout);
  (function (document, window, addEventListener, setTimeout) {
(function(){var R=function(e){return e.getBoundingClientRect();};
var f=window.syTit=function(){[].forEach.call(document.querySelectorAll('.l1e-r[data-f=f1] .l1e-pl'),function(pl){
var gs=[].filter.call(pl.children,function(g){return g.classList.contains('l1e-g');});if(gs.length<2)return;
var mur=pl.closest('.l1e-mur'),lim=(mur?R(mur).right:R(pl).right)-8,vd=pl.querySelector('.sx-vd'),o=[pl.style.gap,gs.map(function(g){return g.style.marginLeft;})];
var flux=function(){return vd&&getComputedStyle(vd).position!=='absolute';};
var pose=function(gp,W,T){pl.style.gap=gp+'px';gs.forEach(function(g){g.style.marginLeft='';});
for(var k=0;k<8;k++){var ch=0;for(var i=1;i<gs.length;i++){var a=gs[i-1],b=gs[i],aw=a.querySelector('.l1e-w'),bw=b.querySelector('.l1e-w'),at=a.querySelector('.l1e-t'),bt=b.querySelector('.l1e-t'),m=0;
if(aw&&bw)m=Math.max(m,W-(R(bw).left-R(aw).right));if(at&&bt)m=Math.max(m,T-(R(bt).left-R(at).right));if(m>0.05){b.style.marginLeft=((parseFloat(b.style.marginLeft)||0)+m+0.1).toFixed(1)+'px';ch=1;}}if(!ch)break;}
var y0=R(gs[0]).top,fin=flux()?vd:gs[gs.length-1];
return R(fin).right<=lim-0.3&&gs.every(function(g){return Math.abs(R(g).top-y0)<1;})&&(!flux()||Math.abs(R(vd).top-y0)<4);};
var o2=[pl.style.getPropertyValue('--hg'),pl.style.getPropertyValue('--hw')],MK=[['',''],['1px',''],['1px','9px'],['1px','8px']],T=[14,12,10];for(var q=0;q<MK.length;q++){pl.style.setProperty('--hg',MK[q][0]);pl.style.setProperty('--hw',MK[q][1]);for(var t=0;t<T.length;t++)for(var gp=7;gp>=4;gp--)if(pose(gp,14,T[t])){pl.setAttribute('data-sy-tit','14/'+T[t]+'/'+gp+(q?'/m'+q:''));return;}}
pl.style.setProperty('--hg',o2[0]);pl.style.setProperty('--hw',o2[1]);pl.style.gap=o[0];gs.forEach(function(g,i){g.style.marginLeft=o[1][i];});pl.setAttribute('data-sy-tit','non');});if(window.sySo)window.sySo();};
f();if(document.fonts)document.fonts.ready.then(function(){setTimeout(f,10);});})();
  })(doc, W, addEventListener, setTimeout);
  (function (document, window, addEventListener, setTimeout) {
(function(){var f=window.swRep=function(){[].forEach.call(document.querySelectorAll('.l1e-r[data-f=f0] .l1e-pl'),function(pl){var gs=pl.querySelectorAll('.sw-r2 .l1e-gb'),l=pl.querySelector('.sw-rln');if(!gs.length||!l)return;var P=pl.getBoundingClientRect();if(!P.width)return;var a=gs[0].getBoundingClientRect(),b=gs[gs.length-1].getBoundingClientRect(),hc=parseFloat(getComputedStyle(pl).getPropertyValue('--hc'))||11;
l.style.left=(a.left-P.left-3).toFixed(1)+'px';l.style.width=(b.right-a.left+6).toFixed(1)+'px';l.style.top=(a.bottom-2-hc-P.top).toFixed(1)+'px';});};
f();if(document.fonts)document.fonts.ready.then(f);addEventListener('load',f);addEventListener('resize',f);})();
  })(doc, W, addEventListener, setTimeout);
  return { arreter: () => { ecouteurs.forEach(([t, f]) => window.removeEventListener(t, f)); timers.forEach((id) => window.clearTimeout(id)); }, repose: () => { if (W.swRep) W.swRep(); if (W.sySo) W.sySo(); } };
}
