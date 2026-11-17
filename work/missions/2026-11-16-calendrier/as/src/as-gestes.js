(function(){
'use strict';
var D=document,B=D.body,W=window;
var FB=D.getElementById('fb'),FR=D.getElementById('frise'),FH=D.getElementById('fh');
var SV=D.querySelector('[data-booster="mouvements"]');
var HD=SV.closest('header');
var BR=D.querySelector('.q-brosse');
var QN=D.querySelector('.q5-n');
var QP=D.querySelector('.q-per');
var FEN=SV.querySelector('.v8-fen')||[].filter.call(SV.querySelectorAll('text'),function(t){return t.firstChild&&t.firstChild.nodeType===3&&/^S\d+\s*–\s*S\d+$/.test(t.firstChild.nodeValue.trim());})[0]||null;
var NS='http://www.w3.org/2000/svg';
var MOIS=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
var MOISL=['J','F','M','A','M','J','J','A','S','O','N','D'];
var MOISP=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
var JOURS=['dim.','lun.','mar.','mer.','jeu.','ven.','sam.'];
var IC={
 x:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
 annul:'<svg viewBox="0 0 24 24"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
 pin:'<svg viewBox="0 0 24 24"><path d="M12 17v5M9 3h6l-1 6 3 3v2H7v-2l3-3z"/></svg>',
 star:'<svg viewBox="0 0 24 24"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/></svg>',
 filtre:'<svg viewBox="0 0 24 24"><path d="M3 4h18l-7 8.5V19l-4 2v-8.5z"/></svg>',
 dup:'<svg viewBox="0 0 24 24"><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>',
 lien:'<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
 poub:'<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/></svg>',
 cart:'<svg viewBox="0 0 24 24"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 7H6"/></svg>',
 fl:'<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>'
};
/* ---------- semaines et nombres ---------- */
var COLS=[].map.call(FB.querySelectorAll('.col'),function(c){return {n:+c.dataset.col,l:parseFloat(c.style.left),w:parseFloat(c.style.width)};});
var CW=COLS[0].w,NC=COLS.length,N0=COLS[0].n;
function wnum(i){var n=N0+i;return n>53?n-53:n;}
function widx(n){return n>=N0?n-N0:n+53-N0;}
function jour(d){return new Date(2026,10,16+d);}
function dt(d){var x=jour(d);return x.getDate()+' '+MOIS[x.getMonth()];}
function nf(v){var s=String(Math.abs(Math.round(v))).replace(/\B(?=(\d{3})+(?!\d))/g,' ');return (v<0?'−':'')+s;}
function sg(v){return (v>0?'+':'')+nf(v);}
function cl(v){return v<0?'n':'p';}
function el(t,c,h){var e=D.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;}
function sv(t,a){var e=D.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);return e;}
/* poser une étiquette (bulle, « lâcher ici ») là où elle cache le moins de texte : chaque place candidate est notée par la surface de texte couverte */
function rects(sel,root,p,sauf){var r=[];[].forEach.call((root||D).querySelectorAll(sel),function(e){if(sauf&&sauf.some(function(x){return x&&(x===e||x.contains(e));}))return;var b=e.getBoundingClientRect();if(b.width<1||b.height<1||b.bottom<0||b.top>innerHeight)return;var cs=getComputedStyle(e);if(cs.visibility==='hidden'||cs.display==='none')return;r.push({l:b.left,t:b.top,r:b.right,b:b.bottom,p:p||1});});return r;}
function poser(w,h,cands,obs,ymin,ymax){var best=null;cands.forEach(function(c,k){var x=Math.max(6,Math.min(innerWidth-6-w,c.x)),y=c.y;if(y<(ymin||2)||y+h>(ymax||innerHeight-2))return;var sc=k*.5+Math.abs(x-c.x)*2;
 obs.forEach(function(o){var ix=Math.min(x+w,o.r)-Math.max(x,o.l),iy=Math.min(y+h,o.b)-Math.max(y,o.t);if(ix>0&&iy>0)sc+=ix*iy*o.p;});if(!best||sc<best.s)best={x:x,y:y,s:sc};});return best;}
/* ---------- la courbe : séries lues dans la base ---------- */
var pFin,pMut,pArea,pHatch;
[].forEach.call(SV.querySelectorAll('path'),function(p){var st=p.getAttribute('stroke'),f=p.getAttribute('fill');
 if(st==='var(--fin)'&&f==='none')pFin=p;else if(st==='var(--mut)'&&f==='none')pMut=p;else if(f==='var(--area)')pArea=p;else if(p.classList.contains('ob-f'))pHatch=p;});
function pts(d){return d.replace(/^M/,'').split('L').map(function(s){var q=s.trim().split(/\s+/);return [+q[0],+q[1]];});}
var Y0=parseFloat(SV.querySelector('line.ob').getAttribute('y1'));
var PF=pts(pFin.getAttribute('d')),PM=pts(pMut.getAttribute('d'));
var NW=PF.length/2,X0=[],X1=[],LIB=[],CAI=[];
var K=(Y0-PF[0][1])/4032;
for(var i=0;i<NW;i++){X0[i]=PF[2*i][0];X1[i]=PF[2*i+1][0];LIB[i]=Math.round((Y0-PF[2*i][1])/K);CAI[i]=Math.round((Y0-PM[2*i][1])/K);}
/* une seule série pour les deux sens du téléphone (relue une fois dans le tracé portrait) : mêmes montants en portrait et en paysage */
if(NW===52){LIB=[4032,4147,4131,5120,5063,5549,5491,5030,4766,4890,4774,4494,4980,5038,5096,4955,4626,4288,3801,2911,2226,1913,2515,2202,1492,1146,1270,1006,346,305,115,148,1913,1946,1979,1781,1814,2548,2573,5054,5087,4560,4650,4510,4354,5063,4576,4700,4815,4832,4444,4461];
 CAI=[4032,4147,4131,5120,5063,5731,5846,5030,4766,4890,4774,4494,5038,5153,5277,5376,5500,5615,5739,4560,4304,4420,5450,5574,4213,4139,4642,4766,1682,1806,1393,1517,3372,3496,3611,3504,3628,4444,4568,7132,7256,5021,5137,5261,4898,5632,4576,4700,4815,4939,4659,4461];}
[4032,4152,4132,5120,5064,5550].forEach(function(v,i){if(i<5)CAI[i]=v;LIB[i]=v;});
var CREUX0=parseInt(QN.querySelector('b').textContent.replace(/\D/g,''),10)||113;
(function(){var m=0;for(var i=1;i<NW;i++)if(LIB[i]<LIB[m])m=i;LIB[m]=CREUX0;})();
for(i=0;i<NW;i++)if(CAI[i]<LIB[i])CAI[i]=LIB[i];
var CUR={L:LIB.slice(),C:CAI.slice()},ORIG=LIB.slice();
var STEP=(X1[NW-1]-X0[0])/NW;
function yv(v){return (Y0-v*K).toFixed(1);}
/* les noms posés sur la courbe suivent la courbe quand elle change (marque, trait, nom) ; un nom n'est jamais barré par le tracé */
var ANN=[];(function(){var tx=[].slice.call(SV.querySelectorAll('text.tn')),cons=[].filter.call(SV.querySelectorAll('line[stroke-dasharray]'),function(x){return !x.classList.contains('q-mk');});
 [].forEach.call(SV.querySelectorAll('line.q-mk'),function(m){var x=+m.getAttribute('x1'),nm=(m.textContent||'').trim().split(' ')[0],i=Math.max(1,Math.min(NW-1,Math.round((x-X0[0])/STEP)));
  var g={i:i,m:m,c:[],t:null};cons.forEach(function(c){if(Math.abs(+c.getAttribute('x1')-x)<.6)g.c.push({e:c,y1:+c.getAttribute('y1'),y2:+c.getAttribute('y2')});});
  tx.forEach(function(t){if(!g.t&&nm&&t.textContent.trim().indexOf(nm)===0)g.t=t;});
  if(g.t){var bb=g.t.getBBox();g.bb={x:bb.x,y:bb.y,w:bb.width,h:bb.height};}
  var my=[+m.getAttribute('y1'),+m.getAttribute('y2')];g.my0=Math.min(my[0],my[1]);g.my1=Math.max(my[0],my[1]);
  g.c.forEach(function(c){var d1=Math.min(Math.abs(c.y1-g.my0),Math.abs(c.y1-g.my1)),d2=Math.min(Math.abs(c.y2-g.my0),Math.abs(c.y2-g.my1));c.mk=d1<=d2?1:2;});ANN.push(g);});})();
function coupe(L,C,bb,dy){var y0=bb.y+dy-2,y1=bb.y+dy+bb.h+2,ok=false;[L,C].forEach(function(S){for(var i=0;i<NW;i++){if(X1[i]<bb.x||X0[i]>bb.x+bb.w)continue;var y=+yv(S[i]);if(y>=y0&&y<=y1)ok=true;
  if(i&&X0[i]>=bb.x&&X0[i]<=bb.x+bb.w){var a=+yv(S[i-1]);if(Math.min(a,y)<=y1&&Math.max(a,y)>=y0)ok=true;}}});return ok;}
var TXT=[].map.call(SV.querySelectorAll('text'),function(t){var b=t.getBBox();return {t:t,x:b.x,y:b.y,w:b.width,h:b.height,dy:0};}).filter(function(o){return o.w>0&&!o.t.classList.contains('v8-fen');});
function heurte(g,ty){var y0=g.bb.y+ty,y1=y0+g.bb.h;return TXT.some(function(o){if(o.t===g.t)return false;var oy=o.y+o.dy;return !(g.bb.x+g.bb.w<o.x-2||g.bb.x>o.x+o.w+2||y1<oy+1||y0>oy+o.h-1);});}
var YMIN=(function(){var r=SV.getBoundingClientRect(),q=HD.querySelector('.q5-t').getBoundingClientRect();return Math.max(2,(q.bottom-r.top)*SV.viewBox.baseVal.height/r.height+1);})();
function annot(L,C){var vh=SV.viewBox.baseVal.height;ANN.forEach(function(g){var dy=(+yv(L[g.i]))-(+yv(ORIG[g.i]));g.m.setAttribute('transform',dy?'translate(0 '+dy.toFixed(1)+')':'');
  var ty=0;if(g.t&&g.bb){var dans=function(t){return g.bb.y+t>=YMIN&&g.bb.y+t+g.bb.h<=vh-1;},bon=function(t){return dans(t)&&g.bb.y+t+g.bb.h<=vh-1&&!coupe(L,C,g.bb,t)&&!heurte(g,t);};
   if(!bon(0)){var c=[Math.round(dy)];for(var k=3;k<=60;k+=3){c.push(Math.round(dy)-k,Math.round(dy)+k,-k,k);}var f=c.filter(bon);if(!f.length)f=c.filter(function(t){return dans(t)&&!heurte(g,t);});ty=f.length?f[0]:0;}
   g.t.setAttribute('transform',ty?'translate(0 '+ty+')':'');
   if(!g.kr){g.kr=sv('rect',{x:(g.bb.x-3).toFixed(1),y:(g.bb.y-1).toFixed(1),width:(g.bb.w+6).toFixed(1),height:(g.bb.h+2).toFixed(1),rx:4,fill:'var(--halo)',opacity:'.94'});g.t.parentNode.insertBefore(g.kr,g.t);}
   g.kr.setAttribute('transform',g.t.getAttribute('transform')||'');g.kr.style.display=coupe(L,C,g.bb,ty)?'':'none';TXT.forEach(function(o){if(o.t===g.t)o.dy=ty;});}
  g.c.forEach(function(c){c.e.setAttribute('y1',(c.y1+(c.mk===1?dy:ty)).toFixed(1));c.e.setAttribute('y2',(c.y2+(c.mk===2?dy:ty)).toFixed(1));});});}
function stepD(v,x0,x1,y){var d='';for(var i=0;i<v.length;i++){var yy=y(v[i]);d+=(i?'L':'M')+x0[i].toFixed(1)+' '+yy+'L'+x1[i].toFixed(1)+' '+yy;}return d;}
function revD(v,x0,x1,y){var d='';for(var i=v.length-1;i>=0;i--){var yy=y(v[i]);d+='L'+x1[i].toFixed(1)+' '+yy+'L'+x0[i].toFixed(1)+' '+yy;}return d;}
function draw(L,C){pFin.setAttribute('d',stepD(L,X0,X1,yv));pMut.setAttribute('d',stepD(C,X0,X1,yv));
 pArea.setAttribute('d',stepD(L,X0,X1,yv)+'L'+X1[NW-1]+' '+Y0+'L'+X0[0]+' '+Y0+'Z');
 if(pHatch)pHatch.setAttribute('d',stepD(C,X0,X1,yv)+revD(L,X0,X1,yv)+'Z');annot(L,C);}
function mv(L,i){return L[i]-(i?L[i-1]:4180);}
function creux(L){var m=0;for(var i=1;i<NW;i++)if(L[i]<L[m])m=i;return m;}
var HEAD0=QN.innerHTML,QS0=(QN.querySelector('span')||{}).textContent||'CHF à dépenser ·';
/* la tête : un montant long ou négatif garde la place des boutons (« CHF · » au lieu de « CHF à dépenser · »), en rouge sous 0 */
function tete(q,Lx,m){var b=q.querySelector('b'),e=q.querySelector('em'),s=q.querySelector('span'),t=nf(Lx[m]);b.textContent=t;b.classList.toggle('as-neg',Lx[m]<0);
 if(s)s.textContent=t.length>3?'CHF ·':QS0;if(e)e.textContent='S'+wnum(m);}
function majTete(){var m=creux(CUR.L);
 var c=SV.querySelector('circle[r="5.5"]');if(c){c.setAttribute('cx',((X0[m]+X1[m])/2).toFixed(1));c.setAttribute('cy',yv(CUR.L[m]));}
 var b=QN.querySelector('b'),e=QN.querySelector('em');if(b&&!B.classList.contains('as-lit')){tete(QN,CUR.L,m);}
 HEAD0=QN.innerHTML;
 [].forEach.call(FH.querySelectorAll('.rb-c'),function(c){var k=widx(+c.dataset.libreSem),m2=c.querySelector('.m');if(!m2||k>=NW)return;var v=mv(CUR.L,k);
  var t=m2.firstChild;if(t&&t.nodeType===3)t.nodeValue=sg(v);m2.classList.toggle('p',v>=0);m2.classList.toggle('n',v<0);});}
function setCur(L,C){CUR={L:L,C:C};draw(L,C);majTete();}
function plus(L,a,from,to){var r=L.slice();for(var i=from;i<Math.min(to,NW);i++)r[i]+=a;return r;}
function deplace(S,a,ia,ib){if(!a||ia===ib)return {L:S.L.slice(),C:S.C.slice()};
 if(ib<ia)return {L:plus(S.L,a,ib,ia),C:plus(S.C,a,ib,ia)};return {L:plus(S.L,-a,ia,ib),C:plus(S.C,-a,ia,ib)};}
/* ---------- l'année : chaque chose, en exemple (cohérente avec les noms de la courbe) ---------- */
var AN={
 brassage:[['Blonde d’automne',-148,47,4],['Porter d’hiver',-176,51,5],['IPA houblon à cru',-232,4,4],['IPA de printemps',-412,12,4],['Bière d’été',-430,20,4],['Blanche d’été',-380,28,4],['Blonde d’automne',-150,40,4]],
 evenement:[['Marché de Noël',1180,50,1],['Dégustation à la brasserie',420,6,1],['Marché de printemps',910,17,1],['Fête de village',2140,26,1],['Mariage',1100,31,1],['Festival',2450,33,1]],
 vente:[['Noël privés',640,50,3],['Coffrets Saint-Valentin',380,6,2]],
 achat:[['Commande groupée de malt',-540,52,1],['Malt de printemps',-540,13,1],['Hotte',-900,13,1],['Six fûts inox',-1080,18,1],['Embouteilleuse',-2800,22,1],['Frigo',-1800,35,1]],
 renovation:[['Sols : colle et joints',-320,24,1]],
 activite:[['Ranger la réserve','3 j',48,5],['Inventaire du stock','1 j',1,1],['Photos et site web','2 j',3,3]],
 charge:[['Loyer du local','−400 / mois',47,52],['Assurance annuelle',-380,2,1]]
};
function semaine(i){var L=CUR.L,C=CUR.C,v=mv(L,i),r=[],s=0;
 Object.keys(AN).forEach(function(k){AN[k].forEach(function(it){if(typeof it[1]==='number'&&widx(it[2])===i){r.push({nom:it[0],a:it[1],c:'var(--e-'+k+')'});s+=it[1];}});});
 for(var d=0;d<7;d++)if(jour(i*7+d).getDate()===1){r.push({nom:'Loyer '+(/^[aeiou]/.test(MOISP[jour(i*7+d).getMonth()])?'d’':'de ')+MOISP[jour(i*7+d).getMonth()],a:-400,c:'var(--e-charge)'});s-=400;}
 var g=(C[i]-L[i])-(i?C[i-1]-L[i-1]:0);if(g>0){r.push({nom:'Mis de côté pour le frigo',a:-g,c:'var(--fin)'});s-=g;}
 var reste=v-s;if(Math.abs(reste)>=1)r.push({nom:reste>0?'Ventes de la semaine':'Petits frais',a:reste,c:reste>0?'var(--e-vente)':'var(--e-charge)'});
 r.sort(function(a,b){return Math.abs(b.a)-Math.abs(a.a);});return {v:v,r:r};}
/* ---------- état commun ---------- */
var SUP=0;
D.addEventListener('click',function(e){if(SUP&&Date.now()-SUP<350){e.stopPropagation();e.preventDefault();SUP=0;}},true);
function sup(){SUP=Date.now();}
[SV,FB].forEach(function(n){n.addEventListener('contextmenu',function(e){e.preventDefault();});});
BR.addEventListener('contextmenu',function(e){e.preventDefault();});
/* toast : une ligne, avant le + */
var TO=null,TT=0;
function toast(html,undo){fermeToast();var t=el('div','as-toast');t.setAttribute('role','status');t.appendChild(el('span','as-tt',html));
 if(undo){var b=el('button','',IC.annul+'Annuler');b.type='button';b.addEventListener('click',function(e){e.stopPropagation();undo();fermeToast();});t.appendChild(b);}
 B.appendChild(t);var f=D.getElementById('fab').getBoundingClientRect();
 t.style.bottom=(innerHeight-f.bottom+(f.height-48)/2)+'px';t.style.maxWidth=(f.left-16)+'px';TO=t;clearTimeout(TT);TT=setTimeout(fermeToast,7000);}
function fermeToast(){if(TO){TO.remove();TO=null;}}
/* ---------- barres : données ---------- */
function montant(bar){var v=bar.querySelector('.lbl .v');if(!v)return 0;var t=v.textContent;if(/mois|\bj\b/.test(t))return 0;var n=parseInt(t.replace(/[^\d]/g,''),10)||0;return /^[−-]/.test(t.trim())?-n:n;}
function nom(bar){var l=bar.querySelector('.lbl');return l?l.firstChild.nodeValue.trim():'';}
function L(bar){return parseFloat(bar.style.left);}
function Wd(bar){return parseFloat(bar.style.width);}
function ix(left){return Math.round(left/CW);}
function duree(bar){return bar.classList.contains('cutr')?28:Math.round(Wd(bar)/CW*7);}
/* la promesse de La Cigogne (3 fûts le 15 déc. = jour 29 depuis le 16 nov.) portée par la Blonde */
var PROM=[];(function(){var p=FB.querySelector('[data-k17-p^="k-fut"]'),bl=FB.querySelector('.bar[data-chose="b-01"]');if(p&&bl)PROM.push({pin:p,bar:bl,txt:'3 fûts promis à La Cigogne',date:29,qui:'La Cigogne'});})();
function pret(bar){return Math.round((L(bar)+Wd(bar))/CW*7);}
function conflit(bar){for(var k=0;k<PROM.length;k++)if(PROM[k].bar===bar&&pret(bar)>PROM[k].date)return PROM[k];return null;}
/* ---------- pendant un glisser : la tête reste, la courbe se zoome sur les colonnes de la frise, la colonne d'arrivée s'éclaire ---------- */
var ZO=null,ICI=null,ZC=null;
function zoomOn(){var hh=HD.offsetHeight,hr=HD.getBoundingClientRect(),q0=HD.querySelector('.q5-t'),qt=q0.getBoundingClientRect();ZO=el('div','as-zoom');ZO.style.height=hh+'px';
 var t=el('div',HD.className+' as-zt');t.style.marginTop=Math.max(0,qt.top-hr.top)+'px';var q=q0.cloneNode(true);q.setAttribute('aria-hidden','true');[].forEach.call(q.querySelectorAll('input,button'),function(x){x.tabIndex=-1;});t.appendChild(q);ZO.appendChild(t);
 ZO.appendChild(el('div','as-zs'));ZO.appendChild(el('div','as-zl'));B.appendChild(ZO);
 FH.dataset.asTop=FH.style.top;FH.style.top=hh+'px';ICI=el('div','as-ici');B.appendChild(ICI);}
function zoom(Lb,La,ich,drop,bar){if(!ZO)zoomOn();
 var q=ZO.querySelector('.q5-n');if(q)tete(q,La,creux(La));
 var zs=ZO.querySelector('.as-zs'),w=innerWidth,h=zs.offsetHeight||80,fl=FB.getBoundingClientRect().left,n=NC,a=[],b=[],lo=1e9,hi=-1e9,i,v;
 for(i=0;i<n;i++){a[i]=fl+COLS[i].l;b[i]=a[i]+COLS[i].w;lo=Math.min(lo,Lb[i],La[i]);hi=Math.max(hi,Lb[i],La[i]);}
 var st=[100,200,250,500,1000,2000,2500,5000].filter(function(x){return (hi-lo)/x<=2.2;})[0]||5000;lo=Math.floor(lo/st)*st-st*.35;hi=Math.ceil(hi/st)*st+st*.15;
 var top=6,bot=h-4;function y(u){return (bot-(u-lo)/(hi-lo)*(bot-top)).toFixed(1);}
 var s='<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">';
 if(drop!=null)s+='<rect x="'+a[drop]+'" y="0" width="'+(b[drop]-a[drop])+'" height="'+h+'" fill="var(--ok)" opacity=".13"/>';
 for(i=1;i<n;i++)s+='<line x1="'+a[i]+'" x2="'+a[i]+'" y1="0" y2="'+h+'" stroke="var(--line)"/>';
 for(v=Math.ceil(lo/st)*st;v<=hi;v+=st)s+='<line x1="'+a[0]+'" x2="'+b[n-1]+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="var(--line2)" stroke-dasharray="2 3"/>';
 for(i=0;i<n;i++)if(La[i]!==Lb[i]){var y1=+y(Lb[i]),y2=+y(La[i]);s+='<rect x="'+a[i]+'" y="'+Math.min(y1,y2)+'" width="'+(b[i]-a[i])+'" height="'+Math.abs(y2-y1)+'" fill="'+(La[i]<Lb[i]?'var(--bad)':'var(--ok)')+'" opacity=".22"/>';}
 s+='<path d="'+stepD(La.slice(0,n),a,b,y)+'L'+b[n-1]+' '+h+'L'+a[0]+' '+h+'Z" fill="var(--area)"/>';
 s+='<path d="'+stepD(Lb.slice(0,n),a,b,y)+'" fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="5 4" opacity=".8"/>';
 s+='<path d="'+stepD(La.slice(0,n),a,b,y)+'" fill="none" stroke="var(--fin)" stroke-width="3.5"/>';
 for(v=Math.ceil(lo/st)*st;v<=hi;v+=st)if(+y(v)-3>=15)s+='<text class="as-zax" x="'+(ich===0?b[n-1]-3:a[0]+3)+'" y="'+(+y(v)-3)+'"'+(ich===0?' text-anchor="end"':'')+'>'+nf(v)+'</text>';
 if(ich!=null){var d=La[ich]-Lb[ich],ya=+y(La[ich]),yb=+y(Lb[ich]),ty=d<0?Math.max(ya,yb)+18:Math.min(ya,yb)-6;ty=Math.max(15,Math.min(h-3,ty));
  s+='<text class="as-zd '+cl(d)+'" x="'+((a[ich]+b[ich])/2)+'" y="'+ty+'" text-anchor="middle">'+sg(d)+'</text>';}
 zs.innerHTML=s+'</svg>';
 ZO.querySelector('.as-zl').innerHTML='<span><i class="as-zav"></i>avant</span><span><i class="as-zap"></i>si tu lâches'+(drop!=null?' en S'+wnum(drop):'')+(ich!=null?' : '+(ich!==drop?'S'+wnum(ich)+' ':'')+nf(Lb[ich])+' → <b>'+nf(La[ich])+'</b>':'')+'</span>';
 if(ZC)ZC.forEach(function(x){x.classList.remove('as-cible');});ZC=[];
 if(drop!=null){var c=FB.querySelectorAll('.col')[drop],f=FH.querySelector('.rb-c[data-libre-sem="'+wnum(drop)+'"]');if(c)ZC.push(c);if(f)ZC.push(f);ZC.forEach(function(x){x.classList.add('as-cible');});
  ICI.textContent='S'+wnum(drop)+' · '+dt(drop*7)+' · lâcher ici';var br=bar.getBoundingClientRect(),cx=(a[drop]+b[drop])/2,iw=ICI.offsetWidth;ICI.style.left=Math.max(6,Math.min(innerWidth-6-iw,cx-iw/2))+'px';
  /* « lâcher ici » près du doigt, sans cacher un nom de la frise ; faute de place, dans la courbe zoomée au-dessus de la colonne d'arrivée (hors du tracé) */
  var ih=ICI.offsetHeight,zr=zs.getBoundingClientRect(),obs=rects('.lbl,.lt>*,.k17-p,.as-tag,.k18-ln',FB,1,[bar,FB.querySelector('.as-fant')]).concat(rects('.bar',FB,.4,[bar]),rects('.rb-c',FH,1),rects('.as-zl>*,.as-zt>*',ZO,1),rects('text',zs,1)),cs=[];
  for(i=0;i<n;i++){[Lb[i],La[i]].forEach(function(u){var yy=zr.top+(+y(u));obs.push({l:a[i],r:b[i],t:yy-4,b:yy+4,p:2});});if(i){var y1=zr.top+(+y(La[i-1])),y2=zr.top+(+y(La[i]));obs.push({l:a[i]-2,r:a[i]+2,t:Math.min(y1,y2),b:Math.max(y1,y2),p:2});}}
  [0,-1,1,-2,2].forEach(function(o){var x=cx-iw/2+o*iw*.35;cs.push({x:x,y:br.bottom+8},{x:x,y:br.top-8-ih});});[16,30].forEach(function(d){cs.push({x:cx-iw/2,y:br.bottom+d},{x:cx-iw/2,y:br.top-d-ih});});
  [0,-.4,.4].forEach(function(o){[zr.top+4,zr.top+(zr.height-ih)/2,zr.bottom-ih-4].forEach(function(yy){cs.push({x:cx-iw/2+o*iw,y:yy});});});
  var pz=poser(iw,ih,cs,obs,zr.top,innerHeight-64);if(!pz)pz={x:cx-iw/2,y:br.bottom+8};ICI.style.left=pz.x+'px';ICI.style.top=pz.y+'px';
  /* posée dans la courbe zoomée : l'écart (« +148 ») passe de l'autre côté du tracé s'il était dessous */
  var zd=zs.querySelector('.as-zd');if(zd&&ich!=null){var hit=function(){var q=zd.getBoundingClientRect();return !(q.right<pz.x||q.left>pz.x+iw||q.bottom<pz.y||q.top>pz.y+ih);};
   if(hit()){var y0d=zd.getAttribute('y'),dd2=La[ich]-Lb[ich],ya2=+y(La[ich]),yb2=+y(Lb[ich]);zd.setAttribute('y',Math.max(15,Math.min(h-3,dd2<0?Math.min(ya2,yb2)-6:Math.max(ya2,yb2)+18)));if(hit())zd.setAttribute('y',y0d);}}}}
function zoomOff(){if(ZO){ZO.remove();ZO=null;FH.style.top=FH.dataset.asTop||'';}if(ICI){ICI.remove();ICI=null;}if(ZC){ZC.forEach(function(x){x.classList.remove('as-cible');});ZC=null;}}
function premier(Lb,La){for(var i=0;i<NW;i++)if(Lb[i]!==La[i])return i;return null;}
/* ---------- geste sur une barre : glisser, tirer la fin, appui long, toucher ---------- */
var G=null;
FB.addEventListener('pointerdown',function(e){
 if(FR.classList.contains('as-an'))return;
 var bar=e.target.closest('.bar');if(!bar||!FB.contains(bar)||e.button>0)return;
 fermeMenu();var grip=e.target.closest('.grip.g1');
 G={bar:bar,id:e.pointerId,x:e.clientX,y:e.clientY,l0:L(bar),w0:Wd(bar),mode:grip?'fin':null,t:Date.now(),d:0};
 if(grip){e.stopPropagation();try{bar.setPointerCapture(e.pointerId);}catch(_){}debutFin(G);return;}
 G.lp=setTimeout(function(){if(G&&!G.mode){G.mode='appui';bar.classList.add('as-appui');sup();ouvreMenu(bar);}},480);
});
W.addEventListener('pointermove',function(e){if(!G||e.pointerId!==G.id)return;var dx=e.clientX-G.x,dy=e.clientY-G.y;
 if(!G.mode){if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){clearTimeout(G.lp);G=null;return;}
  if(Math.abs(dx)>8){clearTimeout(G.lp);if(G.bar.classList.contains('fixe')){toast('Charge fixe : elle se règle dans Finances');G=null;return;}
   G.mode='glisse';try{G.bar.setPointerCapture(e.pointerId);}catch(_){}debutGlisse(G);}}
 if(G&&G.mode==='glisse'){e.preventDefault();suitGlisse(G,dx);}
 else if(G&&G.mode==='fin'){e.preventDefault();suitFin(G,dx);}
},{passive:false});
function finGeste(e){if(!G||e.pointerId!==G.id)return;clearTimeout(G.lp);var g=G;G=null;
 if(g.mode==='glisse'){sup();lacheGlisse(g,e.type==='pointercancel');}
 else if(g.mode==='fin'){sup();lacheFin(g,e.type==='pointercancel');}
 else if(g.mode==='appui'){g.bar.classList.remove('as-appui');sup();}
 else if(e.type==='pointerup'&&Date.now()-g.t<480){touche(g.bar);}}
W.addEventListener('pointerup',finGeste);W.addEventListener('pointercancel',finGeste);

/* f1a / f6b : déplacer en direct, même longueur ; le fantôme reste à l'ancienne place tant qu'une promesse attend */
function debutGlisse(g){var b=g.bar;g.fant=el('div','as-fant');g.fant.style.cssText='left:'+g.l0+'px;width:'+g.w0+'px;top:'+b.style.top+';--c:'+b.style.getPropertyValue('--c');
 b.parentNode.insertBefore(g.fant,b);b.classList.add('as-glisse','drag');g.a=montant(b);g.ia=ix(g.l0);g.k=0;zoom(CUR.L,CUR.L,null,g.ia,b);}
function suitGlisse(g,dx){var k=Math.round(dx/CW);k=Math.max(-g.ia,Math.min(NC-1-g.ia,k));
 var px=Math.max(-g.l0,Math.min((NC-1)*CW-g.l0,dx));g.bar.style.transform='translateX('+px+'px)';
 g.k=k;var S=deplace(CUR,g.a,g.ia,g.ia+k);zoom(CUR.L,S.L,premier(CUR.L,S.L),g.ia+k,g.bar);}
function lacheGlisse(g,annule){var b=g.bar;b.style.transform='';b.classList.remove('as-glisse','drag');zoomOff();
 if(annule||!g.k){g.fant.remove();return;}var avant={L:CUR.L.slice(),C:CUR.C.slice()},l0=g.l0,em=b.querySelector('.k12-jg em'),em0=em&&em.textContent;
 placer(b,l0+g.k*CW);var S=deplace(CUR,g.a,g.ia,g.ia+g.k);setCur(S.L,S.C);
 function defaire(){placer(b,l0);if(em)em.textContent=em0;setCur(avant.L,avant.C);finAlerte();}
 var pr=conflit(b);
 /* la piste des étapes garde toute la barre (comme f2-a) : les dates vont dans l'alerte, pas sur la barre */
 if(pr){
  alerte(pr,b,'<b>'+pr.txt+' le '+dt(pr.date)+'</b> La '+nom(b).replace(/ d’automne$/,'')+', brassée dès le '+dt(Math.round(L(b)/CW*7))+', sera prête le '+dt(pret(b)),'Annuler le décalage',defaire,
   'Caisse : S'+wnum(premier(avant.L,S.L))+' <b>'+nf(avant.L[premier(avant.L,S.L)])+'</b> → <b>'+nf(S.L[premier(avant.L,S.L)])+'</b>, la suite inchangée');
  if(AL)AL.fant=g.fant;else g.fant.remove();return;}
 g.fant.remove();var i=premier(avant.L,S.L);
 toast(i==null?'<b>'+nom(b)+'</b> : S'+wnum(g.ia)+' → S'+wnum(g.ia+g.k):'S'+wnum(i)+' : '+nf(avant.L[i])+' → <b>'+nf(S.L[i])+'</b>',defaire);}
function placer(b,left){var d=left-L(b);b.style.left=left+'px';
 var ln=FB.querySelector('.k18-ln[data-k18-lien="'+b.dataset.chose+'"]');
 if(ln){if(ln.dataset.asW==null)ln.dataset.asW=ln.style.width;var w=left+10-parseFloat(ln.style.left);if(w>4){ln.style.width=w+'px';ln.hidden=false;}else ln.hidden=true;}}
/* f2a : tirer la fin ; jours actifs en points */
function debutFin(g){var b=g.bar;g.em=b.querySelector('.k12-jg em');g.em0=g.em&&g.em.textContent;g.d0=duree(b);b.classList.add('as-glisse','drag','as-ext');points(b,false);g.dpx=CW/7;}
function suitFin(g,dx){var n=Math.round(dx/g.dpx);n=Math.max(3-g.d0,Math.min(Math.round(((NC*CW)-g.l0-g.w0)/g.dpx),n));g.n=n;
 g.bar.style.width=(g.w0+n*g.dpx)+'px';var c=conflit(g.bar);points(g.bar,!!c);
 if(g.em)g.em.textContent='J0 / '+(g.d0+n)+' · prête '+dt(pret(g.bar));}
function lacheFin(g,annule){var b=g.bar;b.classList.remove('as-glisse','drag');
 function defaire(){b.style.width=g.w0+'px';if(g.em)g.em.textContent=g.em0;b.classList.remove('as-ext');var p=b.querySelector('.as-pts');if(p)p.remove();finAlerte();}
 if(annule||!g.n){defaire();return;}
 var pr=conflit(b);
 if(pr){alerte(pr,b,'<b>'+pr.txt+' le '+dt(pr.date)+'</b> Mise en fût de la '+nom(b).replace(/ d’automne$/,'')+' le '+dt(pret(b)),'Annuler',defaire);return;}
 toast('<b>'+nom(b)+'</b> : '+(g.d0+g.n)+' j, prête le '+dt(pret(b)),defaire);}
function points(b,rouge){var p=b.querySelector('.as-pts'),jg=b.querySelector('.k12-jg'),tk=jg&&jg.querySelector('.tr');if(!p){p=el('span','as-pts');(jg||b).appendChild(p);}
 if(tk){p.style.left=tk.offsetLeft+'px';p.style.right='auto';p.style.width=tk.offsetWidth+'px';p.style.top=(tk.offsetTop+tk.offsetHeight/2-4.5)+'px';p.style.bottom='auto';}
 var tr=[].map.call(b.querySelectorAll('.k12-jg .tr i'),function(i){return parseFloat(/left:calc\(([\d.]+)%/.exec(i.getAttribute('style'))[1]);});
 if(!tr.length)tr=[0,50];var h='';tr.forEach(function(x){h+='<b style="left:'+x+'%"></b>';});h+='<b class="'+(rouge?'as-fin':'')+'" style="left:100%"></b>';p.innerHTML=h;}
/* f6b / f2a : une promesse prévient */
var AL=null;
function alerte(pr,b,txt,lib,defaire,pied){finAlerte();var lane=pr.pin.closest('.lane');
 var a=el('div','as-al','<p>'+txt+'</p>');a.setAttribute('role','alert');var bt=el('div','as-bts');
 var b1=el('button','as-bt as-pri','Livrer le '+dt(pret(b)+1));b1.type='button';
 var b2=el('button','as-bt',lib);b2.type='button';bt.appendChild(b1);bt.appendChild(b2);a.appendChild(bt);
 if(pied)a.appendChild(el('small','',pied));lane.appendChild(a);
 var tag=el('span','as-tag',dt(pr.date));var pd=pr.pin.parentNode;tag.style.left=(parseFloat(pr.pin.style.left)+24)+'px';pd.appendChild(tag);pr.pin.classList.add('as-pin-al');
 AL={a:a,tag:tag,pin:pr.pin};
 b1.addEventListener('click',function(e){e.stopPropagation();var j=pret(b)+1,pin=pr.pin,l0=pin.style.left,lab=pin.getAttribute('aria-label'),d0=pr.date;
  pin.style.left=(Math.floor(j/7)*CW+CW/2+(parseFloat(l0)%CW-CW/2))+'px';pin.setAttribute('aria-label','3 fûts à '+pr.qui+', '+dt(j));pr.date=j;finAlerte();
  toast('<b>'+pr.qui+'</b> : '+dt(j),function(){pin.style.left=l0;pin.setAttribute('aria-label',lab);pr.date=d0;});});
 b2.addEventListener('click',function(e){e.stopPropagation();defaire();});
 setTimeout(function(){var r=a.getBoundingClientRect();if(r.bottom>innerHeight-70)W.scrollBy({top:r.bottom-innerHeight+90,behavior:'smooth'});},30);}
function finAlerte(){if(AL){if(AL.fant)AL.fant.remove();AL.a.remove();AL.tag.remove();AL.pin.classList.remove('as-pin-al');AL=null;}}
/* f4b : toucher un brassin, son détail sous la barre */
var DET=null;
function dureeB(b){var em=b.querySelector('.k12-jg em'),m=em&&/\/\s*(\d+)/.exec(em.textContent);if(m)return +m[1];
 var n=nom(b),s2=wnum(ix(L(b))),r=null;(AN.brassage||[]).forEach(function(it){if(!r&&it[0]===n&&it[2]===s2)r=it[3]*7;});return r||duree(b);}
function ico(id){return '<svg class="ico"><use href="#'+id+'"></use></svg>';}
function touche(b){if(!b.classList.contains('k-brassage'))return;sup();var deja=DET&&DET.bar===b;fermeDet();if(deja)return;
 var lane=b.closest('.lane'),d0=Math.round(L(b)/CW*7),du=dureeB(b),am=montant(b);
 var co=FB.querySelector('[data-k17-p="c:'+b.dataset.chose+'"]'),cs=null,av=null;
 if(co){var m=/:\s*(.+),\s*avant\s+(.+?)\.?$/.exec(co.getAttribute('aria-label'));if(m){cs=m[1];av=m[2].replace(/\.$/,'')+'.';}}
 var pr=null;PROM.forEach(function(p){if(p.bar===b)pr=p;});
 var d=el('div','as-det');d.style.setProperty('--c',b.style.getPropertyValue('--c'));
 d.innerHTML='<h3>'+nom(b)+'<span>'+nf(am)+'</span></h3><button type="button" class="as-x" aria-label="Fermer">'+IC.x+'</button>'+
  '<div class="as-et"><div><span>'+ico('i-k17hop')+'Brassage</span><b>'+JOURS[jour(d0).getDay()]+' '+dt(d0)+'</b></div><div><span>'+ico('i-cuve')+'En cuve</span><b>'+dt(d0+1)+' → '+dt(d0+du-7)+'</b></div><div><span>'+ico('i-k18fut')+'Prête</span><b>'+dt(d0+du)+'</b></div></div>'+
  (cs?'<p class="as-co">'+IC.cart+'<span>'+cs+' : <em>manquent au stock</em>, à acheter avant le '+av+'</span></p>':'<p class="as-co as-okc">'+IC.cart+'<span><em>Tout est en stock.</em></span></p>')+
  (pr?'<p class="as-co">'+IC.fl+'<span>'+pr.txt+' le '+dt(pr.date)+'</span></p>':'')+
  '<div class="as-bts"><button type="button" class="as-bt as-pri" data-as="ouvrir">Ouvrir le brassin'+IC.fl+'</button>'+(cs?'<button type="button" class="as-bt" data-as="cmd">'+IC.cart+'Commander</button>':'')+'</div>';
 var lr=b.closest('.lr');lr.parentNode.insertBefore(d,lr.nextSibling);lane.classList.add('as-det-on');b.classList.add('as-sel');DET={bar:b,d:d,lane:lane};
 var br=b.getBoundingClientRect(),dr=d.getBoundingClientRect(),v0=Math.max(br.left,dr.left+14),v1=Math.min(br.right,dr.right-14);
 d.style.setProperty('--ax',Math.round((v0+v1)/2-dr.left)+'px');d.style.setProperty('--lh',Math.max(0,Math.round(dr.top-br.bottom))+'px');
 d.addEventListener('click',function(e){e.stopPropagation();var t=e.target.closest('button');if(!t)return;
  if(t.classList.contains('as-x'))fermeDet();else if(t.dataset.as==='ouvrir')toast('Ouvre la fiche <b>'+nom(b)+'</b> (Brassins)');else if(t.dataset.as==='cmd')toast('Commande prête : <b>'+cs+'</b>');});}
function fermeDet(){if(DET){DET.d.remove();DET.lane.classList.remove('as-det-on');DET.bar.classList.remove('as-sel');DET=null;}}
/* f5a : appui long, un menu sous la barre ; chaque action dit ce qu'elle change */
var MN=null;
/* durée en jours des fêtes (f5-b : Marché de Noël, 2 j) */
var JEV={'Marché de Noël':2,'Marché de printemps':2,'Fête de village':1,'Mariage':1,'Festival':3,'Dégustation à la brasserie':1};
function ouvreMenu(b){fermeMenu();fermeDet();var lane=b.closest('.lane'),ln=lane.dataset.nom,am=montant(b),ia=ix(L(b)),fixe=b.classList.contains('fixe');
 var autres=[].filter.call(FB.querySelectorAll('.lane'),function(x){return x!==lane&&!x.classList.contains('k15-off');}).length;
 var jo=/(\d+)\s*j\b/.exec((b.querySelector('.lbl .v')||{}).textContent||'');
 var m=el('div','as-menu');m.setAttribute('role','menu');var h='<div class="as-m3">'+
  '<button type="button" data-as="epi" aria-pressed="'+b.classList.contains('as-epi')+'" aria-label="Épingler : reste visible si la rangée est masquée">'+IC.pin+'Épingler</button>'+
  '<button type="button" data-as="eto" aria-pressed="'+b.classList.contains('as-eto')+'" aria-label="Étoile : marquée sur la courbe">'+IC.star+'Étoile</button>'+
  '<button type="button" data-as="seul" aria-label="'+ln+' seules : '+autres+' rangées masquées">'+IC.filtre+ln+' seules</button></div>';
 /* comme f5-b : le montant et la durée de la chose dupliquée (« +1 180 · 2 j ») */
 var jd=JEV[nom(b)]||(jo?+jo[1]:0);
 if(!fixe&&ia+1<NC){
  h+='<button type="button" class="as-ml" data-as="dup">'+IC.dup+'<span>Dupliquer en S'+wnum(ia+1)+'</span><em class="'+cl(am)+'">'+(am?sg(am)+(jd?' · '+jd+' j':''):(jd?'+'+jd+' j de présence':''))+'</em></button>';}
 h+='<button type="button" class="as-ml" data-as="lier">'+IC.lien+'<span>Lier à un brassin, un client</span></button>';
 if(!fixe){var Lr=plus(CUR.L,-am,ia,NW);h+='<button type="button" class="as-ml as-ret" data-as="ret">'+IC.poub+'<span>Retirer</span><em>'+(am?'S'+wnum(ia)+' : '+nf(CUR.L[ia])+' → '+nf(Lr[ia]):(jo?'−'+jo[1]+' j de présence':''))+'</em></button>';}
 else h+='<p class="as-mn">Charge fixe : son montant se règle dans Finances.</p>';
 m.innerHTML=h;B.appendChild(m);var w=innerWidth>innerHeight?440:Math.min(300,innerWidth-96);m.style.width=w+'px';var mh=m.offsetHeight,r=b.getBoundingClientRect(),lim=innerHeight-64;
 /* toujours sous la barre : la page remonte si la place manque ; le menu laisse les carrés + et les noms des rangées visibles */
 if(r.bottom+10+mh>lim){W.scrollBy({top:r.bottom+10+mh-lim,behavior:'instant'});r=b.getBoundingClientRect();}
 var cx=Math.max(r.left,0)+Math.min(r.width,innerWidth-Math.max(r.left,0))/2,lft=Math.max(innerWidth>innerHeight?128:88,Math.min(innerWidth-8-w,cx-w/2));m.style.left=lft+'px';m.style.setProperty('--ax',Math.max(18,Math.min(w-18,cx-lft))+'px');
 var fhb=FH.getBoundingClientRect().bottom;if(r.top<fhb+4){W.scrollBy({top:r.top-fhb-4,behavior:'instant'});r=b.getBoundingClientRect();}
 if(r.bottom+10+mh>lim){m.style.maxHeight=Math.max(150,lim-r.bottom-10)+'px';m.style.overflowY='auto';mh=m.offsetHeight;}
 var bas=r.bottom+10+mh<=lim+1;m.classList.add(bas?'as-bas':'as-haut');m.style.top=(bas?r.bottom+10:Math.max(8,r.top-10-mh))+'px';
 MN={m:m,b:b};
 m.addEventListener('click',function(e){e.stopPropagation();var t=e.target.closest('button');if(!t)return;var a=t.dataset.as;
  if(a==='epi'){var on=b.classList.toggle('as-epi');marque(b,'epi',on,IC.pin);fermeMenu();toast(on?'<b>'+nom(b)+'</b> épinglée : reste visible si tu masques '+ln:'Épingle retirée',function(){b.classList.toggle('as-epi');marque(b,'epi',!on,IC.pin);});}
  else if(a==='eto'){var o=b.classList.toggle('as-eto');marque(b,'eto',o,IC.star);etoile(b,o);fermeMenu();toast(o?'Étoile : <b>'+nom(b)+'</b> marquée sur la courbe':'Étoile retirée',function(){b.classList.toggle('as-eto');marque(b,'eto',!o,IC.star);etoile(b,!o);});}
  else if(a==='seul'){var mq=[];[].forEach.call(FB.querySelectorAll('.lane'),function(x){if(x!==lane&&!x.classList.contains('k15-off')){var eye=x.querySelector('[data-g2-masque]');if(eye){eye.click();mq.push(x);}}});
   fermeMenu();toast('<b>'+ln+'</b> seules · '+mq.length+' rangées masquées',function(){mq.forEach(function(x){x.querySelector('.lt').click();});});}
  else if(a==='dup'){var c=b.cloneNode(true);c.dataset.chose=b.dataset.chose+'-d';c.classList.remove('as-appui','as-sel');[].forEach.call(c.querySelectorAll('.as-marq'),function(x){x.remove();});
   var av={L:CUR.L.slice(),C:CUR.C.slice()};c.style.left=(L(b)+CW)+'px';if(L(b)+CW+Wd(b)>NC*CW){c.style.width=(NC*CW-L(b)-CW)+'px';c.classList.add('cutr');}
   var lr=b.closest('.lr'),top=0;[].forEach.call(lr.querySelectorAll('.bar'),function(x){top=Math.max(top,parseFloat(x.style.top)+34);});c.style.top=top+'px';lr.style.height=(Math.max(parseFloat(lr.style.height)||0,top+34))+'px';
   lr.appendChild(c);setCur(plus(CUR.L,am,ia+1,NW),plus(CUR.C,am,ia+1,NW));fermeMenu();
   toast(am?'S'+wnum(ia+1)+' : '+nf(av.L[ia+1])+' → <b>'+nf(CUR.L[ia+1])+'</b>':'<b>'+nom(b)+'</b> dupliquée en S'+wnum(ia+1),function(){c.remove();setCur(av.L,av.C);});}
  else if(a==='lier'){lier(m,b);}
  else if(a==='ret'){var av2={L:CUR.L.slice(),C:CUR.C.slice()};b.classList.add('as-ret');setCur(plus(CUR.L,-am,ia,NW),plus(CUR.C,-am,ia,NW));fermeMenu();
   toast(am?'S'+wnum(ia)+' : '+nf(av2.L[ia])+' → <b>'+nf(CUR.L[ia])+'</b>':'<b>'+nom(b)+'</b> retirée',function(){b.classList.remove('as-ret');setCur(av2.L,av2.C);});}});}
function lier(m,b){var l=[].map.call(FB.querySelectorAll('.bar.k-brassage'),function(x){return nom(x);}).filter(function(n){return n!==nom(b);});
 var c=['Auberge du Lac','Café du Pont','La Cigogne'],h='<p class="as-mn">Lier <b>'+nom(b)+'</b> à :</p>';
 l.concat(c).forEach(function(n,k){h+='<button type="button" class="as-ml" data-as-l="'+n+'">'+(k<l.length?IC.lien:IC.lien)+'<span>'+n+'</span><em>'+(k<l.length?'brassin':'client')+'</em></button>';});
 m.innerHTML=h;m.onclick=null;m.addEventListener('click',function(e){var t=e.target.closest('[data-as-l]');if(!t)return;e.stopPropagation();var n=t.dataset.asL;marque(b,'lien',true,IC.lien);fermeMenu();
  toast('<b>'+nom(b)+'</b> liée à '+n,function(){marque(b,'lien',false);});},true);}
function marque(b,k,on,ic){var x=b.querySelector('.as-marq[data-k="'+k+'"]');if(on&&!x){x=el('span','as-marq',ic);x.dataset.k=k;b.appendChild(x);}else if(!on&&x)x.remove();}
function etoile(b,on){var id='as-et-'+b.dataset.chose,x=SV.querySelector('#'+id);if(!on){if(x)x.remove();return;}
 var i=ix(L(b)),cx=(X0[i]+X1[i])/2;x=sv('text',{id:id,x:cx.toFixed(1),y:(+yv(CUR.L[i])-8).toFixed(1),'text-anchor':'middle','font-size':'16',fill:'var(--att)'});x.textContent='★';SV.appendChild(x);}
function fermeMenu(){if(MN){MN.m.remove();MN.b.classList.remove('as-appui');MN=null;}}
D.addEventListener('pointerdown',function(e){if(MN&&!MN.m.contains(e.target)&&!MN.b.contains(e.target)){fermeMenu();sup();}
 if(DET&&!DET.d.contains(e.target)&&!e.target.closest('.bar'))fermeDet();
 if(B.classList.contains('as-lit')&&!HD.contains(e.target))finLecture();},true);

/* ---------- la courbe : glisser = lire (c2b), appui long = en grand (c3a), poignée = l'année (c1d) ---------- */
var H=null;
function wAt(cx){var r=SV.getBoundingClientRect(),x=(cx-r.left)*(SV.viewBox.baseVal.width/r.width);return Math.max(0,Math.min(NW-1,Math.floor((x-X0[0])/STEP)));}
HD.addEventListener('pointerdown',function(e){if(e.button>0)return;var t=e.target;
 if(t.closest('.q5-t'))return;
 var poi=t.closest('.q-brosse i');
 if(poi&&poi===BR.lastElementChild){e.stopPropagation();H={id:e.pointerId,x:e.clientX,mode:'poignee',w0:parseFloat(BR.style.width)};try{BR.setPointerCapture(e.pointerId);}catch(_){}return;}
 if(!SV.contains(t)&&!BR.contains(t))return;
 H={id:e.pointerId,x:e.clientX,y:e.clientY,mode:null,t:Date.now()};
 H.lp=setTimeout(function(){if(H&&!H.mode){H.mode='grand';sup();grand(wAt(H.x));}},480);});
W.addEventListener('pointermove',function(e){if(!H||e.pointerId!==H.id)return;var dx=e.clientX-H.x,dy=e.clientY-(H.y||0);
 if(H.mode==='poignee'){e.preventDefault();poignee(H.w0+dx*(SV.viewBox.baseVal.width/SV.getBoundingClientRect().width),false);return;}
 if(!H.mode){if(Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){clearTimeout(H.lp);H=null;return;}
  if(Math.abs(dx)>6){clearTimeout(H.lp);H.mode='lit';try{SV.setPointerCapture(e.pointerId);}catch(_){}}}
 if(H.mode==='lit'){e.preventDefault();lecture(wAt(e.clientX));}
 else if(H.mode==='grand'){e.preventDefault();gcSem(gcX(e.clientX));}},{passive:false});
function finH(e){if(!H||e.pointerId!==H.id)return;clearTimeout(H.lp);var h=H;H=null;
 if(h.mode==='poignee'){sup();poignee(parseFloat(BR.style.width),true);}else if(h.mode)sup();}
W.addEventListener('pointerup',finH);W.addEventListener('pointercancel',finH);
/* c2b : la tête lit la semaine sous le doigt */
var CU=null,BU=null;
function lecture(i){B.classList.add('as-lit');var s=semaine(i),v=CUR.L[i];
 /* la tête lit la semaine sans chasser ses boutons (comme c3-a) : la forme la plus longue qui tient */
 var dd=HD.querySelector('.q5-t .d'),mvh='<i class="as-hmv '+cl(s.v)+'">'+sg(s.v)+'</i>',fo=['<b>'+nf(v)+'</b><span>CHF ·</span><em>S'+wnum(i)+' · '+dt(i*7)+'</em>'+mvh,'<b>'+nf(v)+'</b><em>S'+wnum(i)+' · '+dt(i*7)+'</em>'+mvh,'<b>'+nf(v)+'</b><em>S'+wnum(i)+'</em>'+mvh];
 for(var f=0;f<fo.length;f++){QN.innerHTML=fo[f];var lc=QN.lastElementChild.getBoundingClientRect(),dr=dd?dd.getBoundingClientRect():null;if(!dr||(lc.right<=dr.left-4&&dr.top<QN.getBoundingClientRect().bottom))break;}
 /* le curseur passe sous les noms de la courbe (leur halo le coupe) : aucun nom barré */
 if(!CU){CU=sv('g',{'class':'as-cur'});var t1=SV.querySelector('text');if(t1)t1.parentNode.insertBefore(CU,t1);else SV.appendChild(CU);}
 var cx=((X0[i]+X1[i])/2).toFixed(1),cy=yv(v),gap=[],sg2='',y0=30;
 /* le trait s'interrompt au passage d'un nom (aucun nom barré) */
 [].forEach.call(SV.querySelectorAll('text'),function(t){if(t.style.display==='none'||t.closest('.as-cur'))return;var b=t.getBBox(),m=/translate\(\s*[-\d.]+[ ,]+([-\d.]+)/.exec(t.getAttribute('transform')||''),ty=m?+m[1]:0;if(b.width&&+cx>=b.x-3&&+cx<=b.x+b.width+3)gap.push([b.y+ty-2,b.y+ty+b.height+2]);});
 gap.sort(function(p,q){return p[0]-q[0];}).forEach(function(g){if(g[0]>y0)sg2+='M'+cx+' '+y0.toFixed(1)+'V'+g[0].toFixed(1);y0=Math.max(y0,g[1]);});if(y0<Y0)sg2+='M'+cx+' '+y0.toFixed(1)+'V'+Y0;
 CU.innerHTML='<path d="'+sg2+'" stroke="var(--ink)" stroke-width="1.5" fill="none"/><circle cx="'+cx+'" cy="'+cy+'" r="12" fill="none" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="3 3"/><circle cx="'+cx+'" cy="'+cy+'" r="5.5" fill="var(--ink)" stroke="var(--halo)" stroke-width="2"/>';
 /* comme c2-b : le détail de la semaine lue s'ouvre sous la bande semaine et pousse la frise ; il ne couvre ni la courbe ni ses noms */
 if(!BU){BU=el('div','as-lu');BU.setAttribute('role','status');FH.parentNode.insertBefore(BU,FH.nextSibling);}
 var n3=s.r.slice(0,3),reste=s.r.length-n3.length,h='<div class="as-lt"><b>S'+wnum(i)+' · '+jour(i*7).getDate()+' → '+dt(i*7+6)+'</b><span>la semaine <b class="'+cl(s.v)+'">'+sg(s.v)+'</b></span></div><div class="as-li">';
 n3.forEach(function(it){h+='<span style="--c:'+it.c+'"><i></i>'+it.nom+' <b class="'+cl(it.a)+'">'+sg(it.a)+'</b></span>';});
 if(reste>0)h+='<span class="as-lr">+'+reste+' autre'+(reste>1?'s':'')+'</span>';
 BU.innerHTML=h+(n3.length?'':'<span class="as-lr">rien cette semaine</span>')+'</div>';}
function finLecture(){B.classList.remove('as-lit');QN.innerHTML=HEAD0;if(CU){CU.remove();CU=null;}if(BU){BU.remove();BU=null;}}
/* c3a : la courbe prend la place de la frise */
var GC=null;
function gcX(cx){if(!GC)return 0;var r=GC.svg.getBoundingClientRect();return Math.max(0,Math.min(NW-1,Math.floor((cx-r.left-GC.xl)/GC.cw)));}
function grand(i){finLecture();if(GC){gcSem(i);return;}B.classList.add('as-gr');var cote=innerWidth>innerHeight;
 var g=el('section','as-gc'+(cote?' as-cote':''));g.setAttribute('aria-label','La courbe en grand');
 g.innerHTML='<div class="as-gh"><div>Libre, sur l’année<span>caisse en gris</span></div><button type="button" class="as-x" aria-label="Revenir à la frise">'+IC.x+'</button></div><div class="as-gw"></div>';
 /* la grande courbe prend la place de la petite (une seule courbe à l'écran) ; la frise s'efface dessous */
 var hr=HD.getBoundingClientRect(),qt=HD.querySelector('.q5-t').getBoundingClientRect();HD.dataset.asH=HD.style.height;HD.dataset.asP=HD.style.paddingTop;HD.style.height='auto';HD.style.paddingTop=Math.max(0,Math.round(qt.bottom-hr.top+2))+'px';
 SV.style.display='none';BR.style.display='none';SV.parentNode.insertBefore(g,SV.nextSibling);g.style.marginTop='0px';
 var w=g.clientWidth,sw=cote?Math.round(w*.62):w,sh=cote?Math.max(170,innerHeight-150):250;
 var hi=0;for(var k=0;k<NW;k++)hi=Math.max(hi,CUR.C[k]);hi=Math.ceil(hi/1500)*1500;var xl=48,xr=sw-6,top=14,bot=sh-24,cw=(xr-xl)/NW;
 function y(v){return (bot-v/hi*(bot-top)).toFixed(1);}var a=[],b=[];for(k=0;k<NW;k++){a[k]=xl+k*cw;b[k]=xl+(k+1)*cw;}
 var s='<svg class="as-gs" width="'+sw+'" height="'+sh+'" viewBox="0 0 '+sw+' '+sh+'"><defs><pattern id="as-gh" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="2.4" height="6" fill="var(--fin)" opacity=".5"/></pattern></defs>';
 for(var v=0;v<=hi;v+=1500)s+='<line x1="'+xl+'" x2="'+xr+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="var(--line)"/><text x="'+(xl-6)+'" y="'+(+y(v)+5)+'" text-anchor="end">'+nf(v)+'</text>';
 var mo=-1,cnt=0;for(k=0;k<NW;k++){var mm=jour(k*7).getMonth();if(mm!==mo){mo=mm;if(k&&(cote||cnt%2===1)&&a[k]+3+MOIS[mm].length*8<=sw)s+='<line x1="'+a[k]+'" x2="'+a[k]+'" y1="'+(bot)+'" y2="'+(bot+5)+'" stroke="var(--line2)"/><text x="'+(a[k]+3)+'" y="'+(sh-5)+'">'+MOIS[mm]+'</text>';cnt++;}}
 s+='<path d="'+stepD(CUR.L,a,b,y)+'L'+b[NW-1]+' '+bot+'L'+a[0]+' '+bot+'Z" fill="var(--area)"/><path d="'+stepD(CUR.C,a,b,y)+revD(CUR.L,a,b,y)+'Z" fill="url(#as-gh)"/>';
 s+='<path d="'+stepD(CUR.C,a,b,y)+'" fill="none" stroke="var(--mut)" stroke-width="1.5"/><path d="'+stepD(CUR.L,a,b,y)+'" fill="none" stroke="var(--fin)" stroke-width="2.5"/><g class="as-gcur"></g></svg>';
 var gw=g.querySelector('.as-gw');gw.innerHTML=s+'<div class="as-gk" role="status"></div>';
 GC={g:g,a:a,b:b,y:y,top:top,bot:bot,svg:gw.querySelector('svg'),k:gw.querySelector('.as-gk'),xl:xl,cw:cw};
 g.querySelector('.as-x').addEventListener('click',function(e){e.stopPropagation();finGrand();});
 var gs=GC.svg,gid=null;
 gs.addEventListener('pointerdown',function(e){gid=e.pointerId;try{gs.setPointerCapture(gid);}catch(_){}gcSem(gcX(e.clientX));});
 gs.addEventListener('pointermove',function(e){if(e.pointerId===gid)gcSem(gcX(e.clientX));});
 gs.addEventListener('pointerup',function(){gid=null;});
 gcSem(i);W.scrollTo({top:0,behavior:'instant'});}
function gcSem(i){if(!GC)return;var cx=((GC.a[i]+GC.b[i])/2).toFixed(1),v=CUR.L[i],s=semaine(i);
 GC.svg.querySelector('.as-gcur').innerHTML='<line x1="'+cx+'" x2="'+cx+'" y1="'+GC.top+'" y2="'+GC.bot+'" stroke="var(--ink)" stroke-width="1.5"/><circle cx="'+cx+'" cy="'+GC.y(v)+'" r="6" fill="var(--fin)" stroke="var(--halo)" stroke-width="2"/><text x="'+cx+'" y="'+(GC.top+2)+'" text-anchor="middle" style="fill:var(--ink);font-weight:700">S'+wnum(i)+'</text>';
 var h='<div class="as-gt"><b>S'+wnum(i)+' · '+jour(i*7).getDate()+' → '+dt(i*7+6)+'</b><span>libre <b>'+nf(v)+'</b></span></div>';
 s.r.slice(0,4).forEach(function(it){h+='<div class="as-gr" style="--c:'+it.c+'"><span><i></i>'+it.nom+'</span><b class="'+cl(it.a)+'">'+sg(it.a)+'</b></div>';});
 if(s.r.length>4)h+='<div class="as-gr"><span><i></i>+'+(s.r.length-4)+' autres</span><b></b></div>';
 h+='<div class="as-gr as-gtot"><span>la semaine</span><b class="'+cl(s.v)+'">'+sg(s.v)+'</b></div>';GC.k.innerHTML=h;}
function finGrand(){if(GC){GC.g.remove();GC=null;}SV.style.display='';BR.style.display='';HD.style.height=HD.dataset.asH||'';HD.style.paddingTop=HD.dataset.asP||'';B.classList.remove('as-gr');}
/* c1d : tirer la poignée jusqu'au bout : l'année */
var PLEIN=X1[NW-1]-X0[0],W0=parseFloat(BR.style.width),FEN0=FEN&&FEN.innerHTML,PER0=QP.innerHTML,ANON=false;
function poignee(w,lache){w=Math.max(W0,Math.min(PLEIN,w));BR.style.width=w+'px';var n=Math.round(w/STEP);
 if(FEN){var ts=FEN.querySelector('tspan');if(ts)ts.textContent='S'+wnum(n-1);else FEN.firstChild.nodeValue='S'+N0+' – S'+wnum(n-1);FEN.style.display=w>PLEIN*.6?'none':'';}
 if(!lache)return;
 if(w>PLEIN*.8){BR.style.width=PLEIN+'px';versAn();}else{BR.style.width=W0+'px';if(FEN){FEN.innerHTML=FEN0;FEN.style.display='';}if(ANON)quitteAn();else toast('Tire jusqu’au bout : l’année');}}
function versAn(){if(ANON)return;ANON=true;fermeDet();fermeMenu();finAlerte();FR.classList.add('as-an');FH.classList.add('as-an');if(FEN)FEN.style.display='none';
 QP.innerHTML=PER0.replace(/[^<>]*?(?=<svg|$)/,'An');QP.setAttribute('aria-label','Période : l’année (6 sem., 3 mois, 6 mois)');
 if(!FH.querySelector('.as-mois'))FH.appendChild(mois());FH.querySelector('.as-mois').hidden=false;
 [].forEach.call(FB.querySelectorAll('.lane'),function(l){if(!l.querySelector('.as-anl')){var x=anLane(l);l.insertBefore(x,l.querySelector('.lt').nextSibling);ranger(x);}});
 if(!FB.querySelector('.as-ang'))grille();}
function quitteAn(){if(!ANON)return;ANON=false;FR.classList.remove('as-an');FH.classList.remove('as-an');BR.style.width=W0+'px';if(FEN){FEN.innerHTML=FEN0;FEN.style.display='';}QP.innerHTML=PER0;QP.setAttribute('aria-label','Période : 6 semaines (3 mois, 6 mois, An)');}
QP.addEventListener('click',function(e){if(ANON){e.stopPropagation();quitteAn();}});
FB.addEventListener('click',function(e){if(ANON&&e.target.closest('.g2-c'))quitteAn();},true);
function moisDe(){var r=[],mo=-1;for(var k=0;k<NW;k++){var d=jour(k*7+3),m=d.getMonth();if(m!==mo){mo=m;r.push({m:m,k:[]});}r[r.length-1].k.push(k);}return r.slice(0,12);}
function mois(){var M=moisDe(),mx=0,cr=0;M.forEach(function(o,j){o.v=Math.min.apply(null,o.k.map(function(k){return CUR.L[k];}));mx=Math.max(mx,o.v);if(o.v<M[cr].v||j===0)cr=o.v<M[cr].v?j:cr;});
 M.forEach(function(o,j){if(o.v<M[cr].v)cr=j;});
 var d=el('div','as-mois');d.setAttribute('role','img');d.setAttribute('aria-label','L’année en 12 mois ; le creux : '+MOIS[M[cr].m]+', '+nf(M[cr].v));
 M.forEach(function(o,j){var c=el('div','as-mc'+(j===cr?' as-creux':''),'<span class="as-ml1">'+MOISL[o.m]+'</span>'+(j===cr?'<span class="as-mv">'+nf(o.v)+'</span>':'')+'<i style="height:'+(j===cr?6:Math.max(4,Math.round(o.v/mx*30)))+'px"></i>');
  c.title=MOIS[o.m]+' : au plus bas '+nf(o.v);d.appendChild(c);});return d;}
function grille(){var tot=NC*CW,sw=tot/NW,mo=-1;for(var k=0;k<NW;k++){var m=jour(k*7+3).getMonth();if(m!==mo){mo=m;if(k){var g=el('i','as-ang');g.style.left=(k*sw)+'px';FB.appendChild(g);}}}
 var n=el('i','as-ang as-now');n.style.left='0px';n.style.width=sw+'px';FB.appendChild(n);}
/* l'année : chaque chose en barre fine à sa semaine, son nom et son montant à côté ; plusieurs par ligne tant qu'ils ne se touchent pas */
function anLane(l){var v=l.dataset.voie,it=AN[v]||[],tot=NC*CW,sw=tot/NW,box=el('div','as-anl');
 it.forEach(function(o){var k=widx(o[2]),x=k*sw,du=Math.min(o[3],NW-k),r=el('div','as-ir'),b=el('i','as-ib');
  var am=typeof o[1]==='number'?nf(o[1]).replace(/^(?=\d)/,'+'):o[1],lb=el('span','as-il',o[0]+'<em>'+am+'</em>');
  if(du*sw>tot*.8){b.className='as-ib as-plein';b.style.left='0px';b.style.width=tot+'px';lb.className='as-il as-in';lb.style.left='8px';r.dataset.plein='1';}
  else{b.style.left=x+'px';if(du>1){var q=el('i','as-iq');q.style.left=x+'px';q.style.width=Math.max(7,du*sw)+'px';r.appendChild(q);}}
  r.appendChild(b);r.appendChild(lb);r.dataset.x=x;box.appendChild(r);});
 return box;}
function bandeFab(box){var f=D.querySelector('.fab');if(!f||!f.getClientRects().length)return [1e9,1e9];var fr=f.getBoundingClientRect(),bl=box.getBoundingClientRect().left;return [fr.left-8-bl,fr.right+8-bl];}
/* l'année : chaque chose garde son nom ; une ligne de plus plutôt qu'un montant seul ; aucune étiquette sous le + volant (bande fixe à droite) */
function ranger(box){var tot=NC*CW,rows=[],RH=30,BF=bandeFab(box);
 function libre(row,x0,x1){return x0>=0&&x1<=tot+6&&row.every(function(z){return x1+10<z[0]||x0>z[1]+10;});}
 function horsBande(t0,t1){return t1<=BF[0]||t0>=BF[1];}
 [].forEach.call(box.children,function(r){var lb=r.querySelector('.as-il'),x=+r.dataset.x;
  if(r.dataset.plein){rows.push([[0,tot]]);r.style.top=((rows.length-1)*RH)+'px';return;}
  var q=r.querySelector('.as-iq'),w=Math.max(7,q?parseFloat(q.style.width):7),em=lb.querySelector('em'),full=lb.innerHTML,nm=lb.firstChild.nodeValue.trim();
  var lw=(lb.offsetWidth||lb.textContent.length*8)+18;lb.innerHTML=em.outerHTML;var sw2=(lb.offsetWidth||em.textContent.length*8)+4;lb.textContent=nm;var nw=(lb.offsetWidth||nm.length*8);lb.innerHTML=full;var dw=Math.max(nw,sw2-4)+24;
  /* forme : nom et montant (tiret de liaison), sinon montant seul (sans tiret) ; à gauche, l'étiquette recule devant la bande du + et le tiret s'allonge */
  function forme(pw,c,lache){var o=[],t0=x+w+3+(c?0:18),t1=x+w+3+pw;if(lache||horsBande(t0,t1))o.push({c:c,d:1,e:0,x0:x,x1:t1});
   var e=0,l1=x-3-(c?0:18);if(!lache&&!horsBande(l1-pw+(c?0:18),l1))e=c?-1:l1-BF[0];if(e>=0&&x-3-pw-e>=0)o.push({c:c,d:0,e:e,x0:x-3-pw-e,x1:x+w});return o;}
  var F=forme(lw,0),F2=forme(dw,0).map(function(o){o.l2=1;return o;}),FL=forme(lw,0,1),C=forme(sw2,1),pick=null;
  function dans(opts,neuve){for(var o=0;o<opts.length;o++){if(neuve){if(libre([],opts[o].x0,opts[o].x1))return {o:opts[o],k:rows.length};}else for(var k=0;k<rows.length;k++)if(libre(rows[k],opts[o].x0,opts[o].x1))return {o:opts[o],k:k};}return null;}
  /* le nom d'abord, hors du + : sur une ligne, sinon le montant sous le nom ; en dernier recours sous le +, puis le montant seul */
  pick=dans(F,0)||dans(F,1)||dans(F2,0)||dans(F2,1)||dans(FL,0)||dans(FL,1)||dans(C,0)||dans(C,1);
  if(!pick){var all=[{c:0,d:1,e:0,x0:x,x1:x+w+3+lw},{c:0,d:0,e:0,x0:x-3-lw,x1:x+w}],deb=function(p){return Math.max(0,-p.x0)+Math.max(0,p.x1-tot);};pick={o:all.sort(function(a,b){return deb(a)-deb(b);})[0],k:rows.length};}
  if(pick.k===rows.length)rows.push([]);
  rows[pick.k].push([pick.o.x0,pick.o.x1]);r.style.top=(pick.k*RH)+'px';
  if(pick.o.c){lb.innerHTML=em.outerHTML;lb.title=nm;lb.setAttribute('aria-label',nm+' '+em.textContent);lb.classList.add('as-court');}
  if(pick.o.e>0)lb.style.setProperty('--as-fd',pick.o.e+'px');if(pick.o.l2)lb.classList.add('as-2l');
  if(pick.o.d){lb.classList.add('as-d');lb.style.left=(x+w+3)+'px';}else{lb.classList.add('as-g');lb.style.left=Math.max(0,pick.o.x0)+'px';}});
 box.style.height=(rows.length*RH+2)+'px';}
/* 6 sem. / 3 mois : l'étiquette posée à gauche d'une barre recule devant le + volant (bande fixe à droite), son tiret s'allonge jusqu'à la barre */
function degageFab(){var f=D.querySelector('.fab');if(!f||!f.getClientRects().length)return;var fr=f.getBoundingClientRect(),g=fr.left-8,dr=fr.right+8;
 var obs=[].map.call(FB.querySelectorAll('.bar,.lt>*'),function(e){return e.getBoundingClientRect();});
 [].forEach.call(FB.querySelectorAll('.bar .lbl.le'),function(l){l.classList.remove('as-fd');l.style.removeProperty('--as-fd');
  var r=l.getBoundingClientRect();if(!r.width||r.right<=g||r.left>=dr)return;var d=Math.ceil(r.right-g),n0=r.left-d;if(n0<14)return;
  var bar=l.closest('.bar').getBoundingClientRect();
  if(obs.some(function(o){return o.width&&o.bottom>r.top+6&&o.top<r.bottom-6&&o.right>n0&&o.left<r.right&&!(o.left===bar.left&&o.top===bar.top);}))return;
  l.style.setProperty('--as-fd',d+'px');l.classList.add('as-fd');});}
var MOF=null,MOR=0;function suitFab(){if(MOR)return;MOR=requestAnimationFrame(function(){MOR=0;MOF.disconnect();degageFab();MOF.observe(FB,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});});}
MOF=new MutationObserver(suitFab);MOF.observe(FB,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});W.addEventListener('resize',suitFab);degageFab();
})();
