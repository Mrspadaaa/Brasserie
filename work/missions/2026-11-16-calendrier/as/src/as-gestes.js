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
/* le message suit le geste dans la frise : au bout de la rangée de la chose touchée, comme l'alerte ; il ne couvre ni la frise ni la barre d'onglets (passe 7) */
var TO=null,TT=0,DERN=null;
function toast(html,undo,anc){fermeToast();finAlerte();var t=el('div','as-toast');t.setAttribute('role','status');t.appendChild(el('span','as-tt',html));
 if(undo){var b=el('button','',IC.annul+'Annuler');b.type='button';b.addEventListener('click',function(e){e.stopPropagation();undo();fermeToast();});t.appendChild(b);}
 if(anc===undefined)anc=DERN;B.appendChild(t);
 /* passe 8 : par-dessus la frise (fixe) ; il part dès qu’on ouvre autre chose (détail, menu, feuille), sans réserver de hauteur : rien ne bouge quand il vient ni quand il part. Près de la chose touchée
    là où il ne cache aucun texte, sinon en bas, au-dessus des onglets ; jamais sur les onglets ni sous le + volant */
 var f=D.getElementById('fab'),fr=f&&f.getClientRects().length?f.getBoundingClientRect():null;
 var nv=D.querySelector('nav.bot'),bb=(nv&&nv.getClientRects().length&&nv.getBoundingClientRect().height?nv.getBoundingClientRect().top:innerHeight)-8;
 t.style.maxWidth=Math.round(Math.min(560,innerWidth-16,fr?fr.left-16:innerWidth))+'px';
 var w=t.offsetWidth,h=t.offsetHeight,hv=Math.max(hautVu(),FH.getBoundingClientRect().bottom+6),cs=[],vu=anc&&anc.getBoundingClientRect&&anc.getClientRects().length&&FB.contains(anc);
 var obs=rects('.lbl,.lt>*,.k17-p,.as-hors,.as-al,.as-det,.k12-jg em',FB,1).concat(rects('.bar',FB,.25),rects('.g2-c',FB,200));
 if(fr)obs.push({l:fr.left-6,t:fr.top-6,r:fr.right+6,b:fr.bottom+6,p:50});
 if(vu){var r=anc.getBoundingClientRect(),lane=anc.closest('.lane'),lr=lane?lane.getBoundingClientRect():r;obs.push({l:r.left-4,t:r.top-4,r:r.right+4,b:r.bottom+4,p:400});
  cs.push({x:r.left,y:r.bottom+6},{x:8,y:r.bottom+6},{x:r.right-w,y:r.bottom+6},{x:r.left,y:r.top-6-h},{x:8,y:r.top-6-h},{x:8,y:lr.bottom-h-4});
  /* passe 9 : plus de places essayées le long de la rangée (en largeur surtout), pour n'en cacher aucun nom */
  [r.right+8,r.left-w-8,(innerWidth-w)/2,(fr?fr.left:innerWidth)-w-12].forEach(function(x){[r.top+(r.height-h)/2,r.bottom+6,r.top-6-h].forEach(function(y){cs.push({x:x,y:y});});});}
 /* passe 9 : sinon en bas au-dessus des onglets, ou en haut sous la bande des semaines ; jamais sur la chose annoncée ni sur un + (CRITIQUE8 n° 1) */
 cs.push({x:8,y:bb-h},{x:8,y:hv});
 var pz=poser(w,h,cs,obs,hv,bb+1);if(!pz)pz={x:8,y:bb-h};t.style.left=Math.round(pz.x)+'px';t.style.top=Math.round(pz.y)+'px';
 TO=t;TY=FB.getBoundingClientRect().top;clearTimeout(TT);TT=setTimeout(function fin(){if(G||H){TT=setTimeout(fin,800);return;}fermeToast();},7000);}
/* il part dès que la frise défile (24 px) : il ne reste jamais posé sur une rangée qui passe dessous */
var TY=0;D.addEventListener('scroll',function(){if(TO&&Math.abs(FB.getBoundingClientRect().top-TY)>24)fermeToast();},{capture:true,passive:true});
function fermeToast(){if(TO){var t=TO;TO=null;clearTimeout(TT);t.remove();}}
/* ---------- barres : données ---------- */
function montant(bar){var v=bar.querySelector('.lbl .v');if(!v)return 0;var t=v.textContent;if(/mois|\bj\b/.test(t))return 0;var n=parseInt(t.replace(/[^\d]/g,''),10)||0;return /^[−-]/.test(t.trim())?-n:n;}
function nom(bar){var l=bar.querySelector('.lbl');return l?l.firstChild.nodeValue.trim():'';}
function L(bar){return parseFloat(bar.style.left);}
function Wd(bar){return parseFloat(bar.style.width);}
function ix(left){return Math.round(left/CW);}
function duree(bar){if(bar.dataset.asDu)return +bar.dataset.asDu;return bar.classList.contains('cutr')?28:Math.round(Wd(bar)/CW*7);}
/* la promesse de La Cigogne (3 fûts le 15 déc. = jour 29 depuis le 16 nov.) portée par la Blonde */
var PROM=[];(function(){var p=FB.querySelector('[data-k17-p^="k-fut"]'),bl=FB.querySelector('.bar[data-chose="b-01"]');if(p&&bl)PROM.push({pin:p,bar:bl,txt:'3 fûts promis à La Cigogne',n:3,date:29,qui:'La Cigogne'});})();
var PIN0=PROM.map(function(p){return {l:p.pin.style.left,lab:p.pin.getAttribute('aria-label'),date:p.date};});
/* Livrer : la livraison se pose au jour j (dans la vue : la pastille bouge ; au-delà : un renvoi au bord de Ventes) ; sert aussi à Annuler et à l'état commun */
function livrerA(pr,j){var pin=pr.pin,o=PIN0[PROM.indexOf(pr)],lane=pin.closest('.lane'),wk=Math.floor(j/7);
 if(pr.rv){if(DET&&DET.bar===pr.rv)fermeDet();pr.rv.remove();pr.rv=null;}pin.hidden=false;
 if(j===o.date){pin.style.left=o.l;pin.setAttribute('aria-label',o.lab);}
 else{pin.style.left=(wk*CW+CW/2+(parseFloat(o.l)%CW-CW/2))+'px';pin.setAttribute('aria-label',pr.n+' fûts à '+pr.qui+', '+dt(j));}
 pr.date=j;if(wk>=NC){pin.hidden=true;renvoiLiv(pr,pin,wk,j,pr.bar);}retasse(lane);return pr.rv;}
function pret(bar){var du=+bar.dataset.asDu||0;return du?Math.round(L(bar)/CW*7)+du:Math.round((L(bar)+Wd(bar))/CW*7);}
/* la barre dit la vraie date « prête » après un geste ; si elle ne tient pas dans l'écran, la durée seule (la date est dans le message) */
function majEm(b){var em=b.querySelector('.k12-jg em'),lb=b.querySelector('.lbl'),pr=lb&&lb.querySelector('.as-pr');if(pr)pr.remove();if(!em||!b.dataset.asDu)return false;em.textContent='J0 / '+duree(b)+' · prête '+dt(pret(b));
 var r=em.getBoundingClientRect(),lim=Math.min(innerWidth,FB.getBoundingClientRect().right,b.getBoundingClientRect().right)-6;if(r.right>lim){em.textContent='J0 / '+duree(b);
  /* passe 9 : au bord de la vue, la date passe dans l'étiquette (« Blonde d’automne −380 · prête 18 janv. ») (CRITIQUE8 n° 6) */
  if(lb){lb.appendChild(el('span','as-pr',' · prête '+dt(pret(b))));return true;}}return false;}
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
 var bar=e.target.closest('.bar');if(!bar||!FB.contains(bar)||e.button>0)return;DERN=bar;
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
 b.parentNode.insertBefore(g.fant,b.parentNode.firstChild);b.classList.add('as-glisse','drag');g.a=montant(b);g.ia=ix(g.l0);g.k=0;zoom(CUR.L,CUR.L,null,g.ia,b);}
function suitGlisse(g,dx){var k=Math.round(dx/CW);k=Math.max(-g.ia,Math.min(NC-1-g.ia,k));
 var px=Math.max(-g.l0,Math.min((NC-1)*CW-g.l0,dx));g.bar.style.transform='translateX('+px+'px)';
 g.k=k;var S=deplace(CUR,g.a,g.ia,g.ia+k);zoom(CUR.L,S.L,premier(CUR.L,S.L),g.ia+k,g.bar);}
function lacheGlisse(g,annule){var b=g.bar;b.style.transform='';b.classList.remove('as-glisse','drag');zoomOff();
 if(annule||!g.k){g.fant.remove();return;}var avant={L:CUR.L.slice(),C:CUR.C.slice()},l0=g.l0,em=b.querySelector('.k12-jg em'),em0=em&&em.textContent;
 placer(b,l0+g.k*CW);majEm(b);var S=deplace(CUR,g.a,g.ia,g.ia+g.k);setCur(S.L,S.C);
 function defaire(){placer(b,l0);if(em)em.textContent=em0;setCur(avant.L,avant.C);finAlerte();}
 var pr=conflit(b);
 /* la piste des étapes garde toute la barre (comme f2-a) : les dates vont dans l'alerte, pas sur la barre */
 if(pr){
  alerte(pr,b,'<b>'+pr.n+' fûts promis le '+dt(pr.date)+'</b> · prête le '+dt(pret(b)),'Annuler',defaire,
   pr.qui+' · la '+nom(b).replace(/ d’automne$/,'')+' brassée dès le '+dt(Math.round(L(b)/CW*7))+'<br>Caisse : S'+wnum(premier(avant.L,S.L))+' <b>'+nf(avant.L[premier(avant.L,S.L)])+'</b> → <b>'+nf(S.L[premier(avant.L,S.L)])+'</b>, la suite inchangée');
  if(AL)AL.fant=g.fant;else g.fant.remove();return;}
 g.fant.remove();var i=premier(avant.L,S.L);
 toast(i==null?'<b>'+nom(b)+'</b> : S'+wnum(g.ia)+' → S'+wnum(g.ia+g.k):'S'+wnum(i)+' : '+nf(avant.L[i])+' → <b>'+nf(S.L[i])+'</b>',defaire);}
function placer(b,left){var d=left-L(b);b.style.left=left+'px';
 var ln=FB.querySelector('.k18-ln[data-k18-lien="'+b.dataset.chose+'"]');
 if(ln){if(ln.dataset.asW==null)ln.dataset.asW=ln.style.width;var w=left+10-parseFloat(ln.style.left);if(w>4){ln.style.width=w+'px';ln.hidden=false;}else ln.hidden=true;}}
/* f2a : tirer la fin ; jours actifs en points */
function debutFin(g){var b=g.bar;g.du0=b.dataset.asDu;g.em=b.querySelector('.k12-jg em');g.em0=g.em&&g.em.textContent;g.d0=duree(b);b.classList.add('as-glisse','drag','as-ext');points(b,false);g.dpx=CW/7;}
function suitFin(g,dx){var n=Math.round(dx/g.dpx);n=Math.max(3-g.d0,Math.min(Math.round(((NC*CW)-g.l0-g.w0)/g.dpx),n));g.n=n;
 g.bar.style.width=(g.w0+n*g.dpx)+'px';g.bar.dataset.asDu=g.d0+n;var c=conflit(g.bar);points(g.bar,!!c);
 if(g.em)g.em.textContent='J0 / '+(g.d0+n)+' · prête '+dt(pret(g.bar));}
function lacheFin(g,annule){var b=g.bar;b.classList.remove('as-glisse','drag');
 function defaire(){b.style.width=g.w0+'px';if(g.du0)b.dataset.asDu=g.du0;else delete b.dataset.asDu;if(g.em)g.em.textContent=g.em0;b.classList.remove('as-ext');var p=b.querySelector('.as-pts');if(p)p.remove();finAlerte();}
 if(annule||!g.n){defaire();return;}
 majEm(b);var pr=conflit(b);
 if(pr){alerte(pr,b,'<b>'+pr.n+' fûts promis le '+dt(pr.date)+'</b> · prête le '+dt(pret(b)),'Annuler',defaire,pr.qui+' · la '+nom(b).replace(/ d’automne$/,'')+' tirée à '+duree(b)+' j');return;}
 toast('<b>'+nom(b)+'</b> : '+(g.d0+g.n)+' j, prête le '+dt(pret(b)),defaire);}
/* passe 9 : les points vivent dans la piste (en % de sa largeur) : même place à toute largeur, jamais sous « J0 / … » (CRITIQUE8 n° 3) */
function points(b,rouge){var p=b.querySelector('.as-pts'),jg=b.querySelector('.k12-jg'),tk=jg&&jg.querySelector('.tr');if(!p)p=el('span','as-pts');
 if(tk){tk.classList.add('as-tk');tk.appendChild(p);}else (jg||b).appendChild(p);
 var tr=[].map.call(b.querySelectorAll('.k12-jg .tr i'),function(i){return parseFloat(/left:calc\(([\d.]+)%/.exec(i.getAttribute('style'))[1]);});
 if(!tr.length)tr=[0,50];var h='';tr.forEach(function(x){h+='<b style="left:'+x+'%"></b>';});h+='<b class="'+(rouge?'as-fin':'')+'" style="left:100%"></b>';p.innerHTML=h;}
/* f6b / f2a : une promesse prévient */
var AL=null;
function alerte(pr,b,txt,lib,defaire,pied){finAlerte();fermeToast();var lane=pr.pin.closest('.lane');
 var a=el('div','as-al');a.setAttribute('role','alert');var p=el('p','as-al-t','<span>'+txt+'</span>');a.appendChild(p);
 if(pied){var dd=el('small','as-al-d',pied);dd.id='as-al-d';dd.hidden=true;p.appendChild(el('i','as-al-ch',IC.fl));p.setAttribute('role','button');p.tabIndex=0;p.setAttribute('aria-expanded','false');p.setAttribute('aria-controls','as-al-d');
  var bascule=function(e){e.stopPropagation();dd.hidden=!dd.hidden;p.setAttribute('aria-expanded',String(!dd.hidden));};p.addEventListener('click',bascule);p.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();bascule(e);}});}var bt=el('div','as-bts');
 var b1=el('button','as-bt as-pri','Livrer le '+dt(pret(b)+1));b1.type='button';
 var b2=el('button','as-bt',lib);b2.type='button';bt.appendChild(b1);bt.appendChild(b2);a.appendChild(bt);
 if(pied)a.insertBefore(dd,bt);
 /* en paysage, l'alerte se pose au bout de la rangée de la barre bougée : barre et message ensemble à l'écran */
 if(innerWidth>innerHeight){var bl=b.closest('.lane');bl.appendChild(a);a.style.marginBottom=(10+piedSuivant(bl))+'px';}else lane.appendChild(a);
 /* la pastille de date seulement si elle ne touche rien (texte, repère, bord) */
 var tag=el('span','as-tag',dt(pr.date));var pd=pr.pin.parentNode;tag.style.left=(parseFloat(pr.pin.style.left)+24)+'px';pd.appendChild(tag);pr.pin.classList.add('as-pin-al');
 var tr=tag.getBoundingClientRect(),gene=tr.right>innerWidth-4||tr.left<0||rects('.k17-p,.lbl,.bar,.as-tag',lane,1,[tag,pr.pin]).concat(rects('.k17-p',pd,1,[tag])).some(function(o){return !(o.r<tr.left-3||o.l>tr.right+3||o.b<tr.top-3||o.t>tr.bottom+3);});if(gene)tag.style.display='none';
 AL={a:a,tag:tag,pin:pr.pin};
 b1.addEventListener('click',function(e){e.stopPropagation();var j=pret(b)+1,d0=pr.date,wk=Math.floor(j/7);finAlerte();var rv=livrerA(pr,j);
  toast('<b>'+pr.qui+'</b> : '+dt(j)+(rv?' · S'+wnum(wk)+', hors vue':''),function(){livrerA(pr,d0);},rv||pr.pin);});
 b2.addEventListener('click',function(e){e.stopPropagation();defaire();});
 setTimeout(function(){var r=a.getBoundingClientRect(),need=r.bottom-innerHeight+90;if(need<=0)return;var br=b.getBoundingClientRect(),mx=br.top-hautVu();
  W.scrollBy({top:Math.max(0,Math.min(need,mx)),behavior:'smooth'});},30);}
/* une livraison posée hors des semaines affichées : un renvoi au bord droit de Ventes (comme « Malt de janvier −540 S2 › »), qui ouvre son détail */
function renvoiLiv(pr,pin,wk,j,b){var lane=pin.closest('.lane'),c=el('div','as-hors as-liv');c.setAttribute('role','button');c.tabIndex=0;c.style.setProperty('--c','var(--e-vente)');
 c.innerHTML='<span>Livraison '+pr.qui+' ·</span><em>S'+wnum(wk)+'</em>'+IC.fl;c.setAttribute('aria-label',pr.n+' fûts à '+pr.qui+', '+dt(j)+', S'+wnum(wk)+', hors des semaines affichées');
 placeDans(c,null,lane,true);c.addEventListener('click',function(e){e.stopPropagation();detLiv(c,pr,wk,j,b);});
 c.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();detLiv(c,pr,wk,j,b);}});pr.rv=c;return c;}
function detLiv(c,pr,wk,j,b){fermeToast();var deja=DET&&DET.bar===c;fermeDet();if(deja)return;var lane=c.closest('.lane'),d=el('div','as-det as-detn');d.style.setProperty('--c','var(--e-vente)');
 d.innerHTML='<h3>'+pr.n+' fûts · '+pr.qui+'</h3><button type="button" class="as-x" aria-label="Fermer">'+IC.x+'</button>'+
  '<div class="as-et"><div><span>Ventes</span><b>S'+wnum(wk)+'</b></div><div><span>Livraison</span><b>'+JOURS[jour(j).getDay()]+' '+dt(j)+'</b></div><div><span>'+nom(b).replace(/ d’automne$/,'')+' prête</span><b>'+dt(pret(b))+'</b></div></div>';
 var anc=c.closest('.lr')||c.parentNode;anc.parentNode.insertBefore(d,anc.nextSibling);lane.classList.add('as-det-on');c.classList.add('as-sel');DET={bar:c,d:d,lane:lane};
 var br=c.getBoundingClientRect(),dr=d.getBoundingClientRect(),v0=Math.max(br.left,dr.left+14),v1=Math.min(br.right,dr.right-14);
 d.style.setProperty('--ax',Math.round((v0+v1)/2-dr.left)+'px');d.style.setProperty('--lh',Math.max(0,Math.round(dr.top-br.bottom))+'px');
 d.addEventListener('click',function(e){e.stopPropagation();if(e.target.closest('.as-x'))fermeDet();});dedans(d,br);}
function finAlerte(){if(AL){if(AL.fant)AL.fant.remove();AL.a.remove();AL.tag.remove();AL.pin.classList.remove('as-pin-al');AL=null;}}
/* f4b : toucher un brassin, son détail sous la barre */
var DET=null;
function dureeB(b){if(b.dataset.asDu)return +b.dataset.asDu;var em=b.querySelector('.k12-jg em'),m=em&&/\/\s*(\d+)/.exec(em.textContent);if(m)return +m[1];
 var n=nom(b),s2=wnum(ix(L(b))),r=null;(AN.brassage||[]).forEach(function(it){if(!r&&it[0]===n&&it[2]===s2)r=it[3]*7;});return r||duree(b);}
function ico(id){return '<svg class="ico"><use href="#'+id+'"></use></svg>';}
function touche(b){DERN=b;fermeToast();var on=b.classList.contains('as-nouv')?objDe(b):null;if(on&&on.v!=='brassage'){detN(on);return;}if(!b.classList.contains('k-brassage'))return;sup();var deja=DET&&DET.bar===b;fermeDet();if(deja)return;
 var lane=b.closest('.lane'),d0=Math.round(L(b)/CW*7),du=dureeB(b),am=montant(b);
 var co=FB.querySelector('[data-k17-p="c:'+b.dataset.chose+'"]'),cs=null,av=null;
 if(co){var m=/:\s*(.+),\s*avant\s+(.+?)\.?$/.exec(co.getAttribute('aria-label'));if(m){cs=m[1];av=m[2].replace(/\.$/,'')+'.';}}
 var pr=null;PROM.forEach(function(p){if(p.bar===b)pr=p;});
 var d=el('div','as-det');d.style.setProperty('--c',b.style.getPropertyValue('--c'));
 d.innerHTML='<h3>'+nom(b)+(am?'<span>'+nf(am)+'</span>':'')+'</h3><button type="button" class="as-x" aria-label="Fermer">'+IC.x+'</button>'+
  '<div class="as-et"><div><span>'+ico('i-k17hop')+'Brassage</span><b>'+JOURS[jour(d0).getDay()]+' '+dt(d0)+'</b></div><div><span>'+ico('i-cuve')+'En cuve</span><b>'+dt(d0+1)+' → '+dt(d0+du-7)+'</b></div><div><span>'+ico('i-k18fut')+'Prête</span><b>'+dt(d0+du)+'</b></div></div>'+
  (on?'<p class="as-co as-nc">'+IC.cart+'<span>Stock : <em>à vérifier</em> en ouvrant le brassin</span></p>':cs?'<p class="as-co">'+IC.cart+'<span>'+cs+' : <em>manquent au stock</em>, à acheter avant le '+av+'</span></p>':'<p class="as-co as-okc">'+IC.cart+'<span><em>Tout est en stock.</em></span></p>')+
  (pr?'<p class="as-co">'+IC.fl+'<span>'+pr.txt+' le '+dt(pr.date)+'</span></p>':'')+
  '<div class="as-bts"><button type="button" class="as-bt as-pri" data-as="ouvrir">'+(on?'Ouvrir':'Ouvrir le brassin')+IC.fl+'</button>'+(cs&&!on?'<button type="button" class="as-bt" data-as="cmd">'+IC.cart+'Commander</button>':'')+(on?'<button type="button" class="as-bt" data-as="mod">Modifier</button><button type="button" class="as-bt" data-as="ret">'+IC.poub+'Retirer</button>':'')+'</div>';
 var lr=b.closest('.lr');lr.parentNode.insertBefore(d,lr.nextSibling);lane.classList.add('as-det-on');b.classList.add('as-sel');DET={bar:b,d:d,lane:lane};
 var br=b.getBoundingClientRect(),dr=d.getBoundingClientRect(),v0=Math.max(br.left,dr.left+14),v1=Math.min(br.right,dr.right-14);
 d.style.setProperty('--ax',Math.round((v0+v1)/2-dr.left)+'px');d.style.setProperty('--lh',Math.max(0,Math.round(dr.top-br.bottom))+'px');
 dedans(d,br);
 d.addEventListener('click',function(e){e.stopPropagation();var t=e.target.closest('button');if(!t)return;
  if(t.classList.contains('as-x'))fermeDet();else if(t.dataset.as==='ouvrir'){fermeDet();toast('Ouvre la fiche <b>'+nom(b)+'</b> (Brassins)',undefined,b);}else if(t.dataset.as==='cmd'){fermeDet();toast('Commande prête : <b>'+cs+'</b>',undefined,b);}else if(t.dataset.as==='mod')ouvreAjout(on.v,on);else if(t.dataset.as==='ret')retirerN(on);});}
function fermeDet(){if(DET){DET.d.remove();DET.lane.classList.remove('as-det-on');DET.bar.classList.remove('as-sel');DET=null;}}
/* f5a : appui long, un menu sous la barre ; chaque action dit ce qu'elle change */
var MN=null;
/* durée en jours des fêtes (f5-b : Marché de Noël, 2 j) */
var JEV={'Marché de Noël':2,'Marché de printemps':2,'Fête de village':1,'Mariage':1,'Festival':3,'Dégustation à la brasserie':1};
function ouvreMenu(b){DERN=b;fermeToast();fermeMenu();fermeDet();var lane=b.closest('.lane'),ln=lane.dataset.nom,am=montant(b),ia=ix(L(b)),fixe=b.classList.contains('fixe');
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
  else if(a==='dup'&&b.classList.contains('as-nouv')&&objDe(b)){var o1=objDe(b),o2=Object.assign({},o1,{id:++NN,i:o1.i+1,el:null,pin0:null,Ph:null,P:null,an:null}),a2=CUR.L[o2.i];fermeMenu();pose(o2);
   toast(o2.am?'S'+wnum(o2.i)+' : '+nf(a2)+' → <b>'+nf(CUR.L[o2.i])+'</b>':'<b>'+o2.nom+'</b> dupliqué en S'+wnum(o2.i),function(){oter(o2);},o2.el);}
  else if(a==='dup'){var av={L:CUR.L.slice(),C:CUR.C.slice()},c=copie(b,b.dataset.chose.replace(/(-d\d+)+$/,'')+'-d'+(++NN),L(b)+CW);setCur(plus(CUR.L,am,ia+1,NW),plus(CUR.C,am,ia+1,NW));solde(lane,am,ia+1);fermeMenu();
   toast(am?'S'+wnum(ia+1)+' : '+nf(av.L[ia+1])+' → <b>'+nf(CUR.L[ia+1])+'</b>':'<b>'+nom(b)+'</b> dupliquée en S'+wnum(ia+1),function(){c.remove();setCur(av.L,av.C);solde(lane,-am,ia+1);});}
  else if(a==='lier'){lier(m,b);}
  else if(a==='ret'&&b.classList.contains('as-nouv')&&objDe(b)){fermeMenu();retirerN(objDe(b));}
  else if(a==='ret'){var av2={L:CUR.L.slice(),C:CUR.C.slice()};b.classList.add('as-ret');setCur(plus(CUR.L,-am,ia,NW),plus(CUR.C,-am,ia,NW));solde(lane,-am,ia);fermeMenu();
   toast(am?'S'+wnum(ia)+' : '+nf(av2.L[ia])+' → <b>'+nf(CUR.L[ia])+'</b>':'<b>'+nom(b)+'</b> retirée',function(){b.classList.remove('as-ret');setCur(av2.L,av2.C);solde(lane,am,ia);});}});}
/* une copie d'une barre de la base, posée sous les autres barres de sa ligne */
function copie(b,id,left){var c=b.cloneNode(true);c.dataset.chose=id;c.classList.remove('as-appui','as-sel','as-ret','as-glisse','drag');[].forEach.call(c.querySelectorAll('.as-marq'),function(x){x.remove();});
 c.style.transform='';c.style.left=left+'px';if(left+Wd(b)>NC*CW){c.style.width=(NC*CW-left)+'px';c.classList.add('cutr');}
 var lr=b.closest('.lr'),top=0;[].forEach.call(lr.querySelectorAll('.bar'),function(x){top=Math.max(top,parseFloat(x.style.top)+34);});c.style.top=top+'px';lr.style.height=(Math.max(parseFloat(lr.style.height)||0,top+34))+'px';
 lr.appendChild(c);return c;}
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
 if(DET&&!DET.d.contains(e.target)&&!e.target.closest('.bar,.as-nouv,.as-hors'))fermeDet();
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
 if(w>PLEIN*.8){BR.style.width=PLEIN+'px';versAn();}else{BR.style.width=W0+'px';if(FEN){FEN.innerHTML=FEN0;FEN.style.display='';}if(ANON)quitteAn();else toast('Tire jusqu’au bout : l’année',null,HD);}}
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
/* passe 9 : une étiquette (à gauche ou à droite de sa barre) qui touche une autre barre passe de l'autre côté, sinon dans sa barre ; elle revient à sa place quand la voie est libre (CRITIQUE8 n° 5) */
function degageLbl(){var fr=FB.getBoundingClientRect(),xd=Math.min(fr.right,innerWidth);
 [].forEach.call(FB.querySelectorAll('.bar .lbl'),function(l){var b=l.closest('.bar');if(b.classList.contains('as-glisse')||b.classList.contains('as-ret')||!b.getClientRects().length)return;
  if(l.dataset.asC0==null){if(!l.classList.contains('le')&&!l.classList.contains('ri'))return;l.dataset.asC0=l.classList.contains('le')?'le':'ri';}
  var autres=[].filter.call(b.parentNode.querySelectorAll('.bar'),function(x){return x!==b&&!x.classList.contains('as-ret')&&x.getClientRects().length;}).map(function(x){return x.getBoundingClientRect();});
  function va(c){l.classList.remove('le','ri','in','as-fd');l.classList.add(c);var r=l.getBoundingClientRect();if(r.left<fr.left+2||r.right>xd-2)return false;if(c==='in')return l.scrollWidth<=l.clientWidth+1;
   return !autres.some(function(o){return !(r.right<=o.left+1||r.left>=o.right-1||r.bottom<=o.top+1||r.top>=o.bottom-1);});}
  var c0=l.dataset.asC0,ess=[c0,c0==='le'?'ri':'le'];if(b.classList.contains('k-brassage'))ess.push('in');
  for(var k=0;k<ess.length;k++)if(va(ess[k]))return;va(c0);});}
var MOF=null,MOR=0;function suitFab(){if(MOR)return;MOR=requestAnimationFrame(function(){MOR=0;MOF.disconnect();degageLbl();degageFab();MOF.observe(FB,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});});}
/* ---------- + : la feuille d'ajout (CAL-PLUS-MORT, 17.11). Le + volant ouvre tout ; le + du carré ouvre déjà sur sa rangée.
   Plus aucune case « + » en pointillé (refus R2) : l'ouverture de rangée de la base est neutralisée. ---------- */
var TYP=[['brassage','Brassin','Brassins',-1,'IPA de printemps'],['vente','Vente','Ventes',1,'Auberge du Lac, 2 fûts'],['evenement','Fête','Fêtes',1,'Marché de Noël'],
 ['achat','Achat','Achats',-1,'Malt Pilsner 25 kg'],['renovation','Travaux','Travaux',-1,'Peinture de la cave'],['activite','Activité','Activités',0,'Ranger la réserve'],['charge','Papier','Papiers',-1,'Facture Brouwland']];
function typ(v){for(var k=0;k<TYP.length;k++)if(TYP[k][0]===v)return TYP[k];return null;}
/* la vente probable de la rangée Ventes (repère pointillé) : « Café du Pont, 1 fût, +130, 10 déc. » */
function proposition(v){if(v!=='vente')return null;var p=FB.querySelector('.lane[data-voie="vente"] [data-k17-p^="k-cdp"]');if(!p||p.hidden||p.classList.contains('as-nouv'))return null;
 var a=(p.getAttribute('aria-label')||'').split(',').map(function(x){return x.trim();});var mt=parseInt((a[2]||'').replace(/[^\d]/g,''),10)||0;
 return {pin:p,nom:a[0],det:a[1],v:mt,quand:a[3],i:Math.max(0,Math.min(NC-1,Math.floor(parseFloat(p.style.left)/CW)))};}
function semFab(){var t=(D.getElementById('fabl')||{}).textContent||'',m=/S(\d+)/.exec(t);return m?Math.max(0,Math.min(NC-1,widx(+m[1]))):0;}
var SH=null,NN=0,NV=[];
/* la feuille propose 13 semaines (comme le paysage) : en portrait, les semaines hors de la frise se posent aussi */
var NSEM=Math.max(NC,13),DUREES=[21,28,35,42];
function recettes(){var r=[];[].forEach.call(FB.querySelectorAll('.bar.k-brassage:not(.as-nouv)'),function(b){var n=nom(b);if(n&&r.indexOf(n)<0)r.push(n);});
 (AN.brassage||[]).forEach(function(it){if(r.indexOf(it[0])<0)r.push(it[0]);});return r.slice(0,6);}
function objDe(x){for(var k=0;k<NV.length;k++)if(NV[k].el===x)return NV[k];return null;}
function ouvreAjout(v,o0){fermeToast();fermeAjout();fermeMenu();fermeDet();var sc=el('div','as-scrim'),f=el('div','as-sh');f.setAttribute('role','dialog');f.setAttribute('aria-modal','true');f.setAttribute('aria-labelledby','as-sh-ti');
 var h='<div class="as-sh-h"><b id="as-sh-ti">'+(o0?'Modifier':'Ajouter')+'</b><span class="as-sh-ou"></span><button type="button" class="as-sh-x" aria-label="Fermer">'+IC.x+'</button></div><div class="as-sh-ty" role="group" aria-label="Quoi">';
 TYP.forEach(function(t){h+='<button type="button" class="as-ty" data-v="'+t[0]+'" aria-pressed="false" style="--c:var(--e-'+t[0]+')"><i></i>'+t[1]+'</button>';});
 h+='</div><div class="as-sh-c"><button type="button" class="as-prop" aria-pressed="false"></button><div class="as-sh-rc" role="group" aria-label="Recettes">';
 recettes().forEach(function(n){h+='<button type="button" class="as-rc" aria-pressed="false">'+n+'</button>';});
 h+='</div><div class="as-sh-f"><label class="as-fn"><span>Nom</span><input type="text" autocomplete="off" enterkeyhint="done"></label>'+
  '<label class="as-fm"><span>CHF</span><span class="as-fmr"><button type="button" class="as-sgn" aria-label="Signe">+</button><input type="text" inputmode="decimal" autocomplete="off" enterkeyhint="done"></span></label></div>'+
  '<div class="as-sh-cu" role="group" aria-label="En cuve"><span>En cuve</span>';
 DUREES.forEach(function(d){h+='<button type="button" class="as-cu" data-du="'+d+'" aria-pressed="false">'+d+' j</button>';});
 h+='<em></em></div><div class="as-sh-s as-sh-sd" role="group" aria-label="Semaine">';
 for(var k=0;k<NSEM;k++){var d=jour(k*7);h+='<button type="button" class="as-se'+(k>=NC?' as-se-h':'')+'" data-i="'+k+'" aria-pressed="false"><b>S'+wnum(k)+'</b><small>'+d.getDate()+' '+MOIS[d.getMonth()]+'</small></button>';}
 h+='</div><button type="button" class="as-sh-ok" disabled>Ajouter</button></div>';
 f.innerHTML=h;B.appendChild(sc);B.appendChild(f);B.classList.add('as-sh-on');
 var S={f:f,sc:sc,v:null,i:o0?o0.i:semFab(),prop:null,du:28,o0:o0||null,sg:1},nm=f.querySelector('.as-fn input'),mt=f.querySelector('.as-fm input'),pb=f.querySelector('.as-prop'),ok=f.querySelector('.as-sh-ok'),sgb=f.querySelector('.as-sgn');SH=S;
 function maj(){var t=typ(S.v),br=S.v==='brassage';f.classList.toggle('as-sh-choisi',!!t);
  [].forEach.call(f.querySelectorAll('.as-ty'),function(b){b.setAttribute('aria-pressed',String(b.dataset.v===S.v));});
  [].forEach.call(f.querySelectorAll('.as-se'),function(b){b.setAttribute('aria-pressed',String(+b.dataset.i===S.i));});
  f.querySelector('.as-sh-ou').textContent=t?'dans '+t[2]:'';if(!t){ok.disabled=true;return;}
  f.querySelector('.as-fm').hidden=t[3]===0;nm.placeholder='ex. '+t[4];mt.placeholder='0';
  sgb.textContent=S.sg<0?'−':'+';sgb.classList.toggle('as-moins',S.sg<0);sgb.setAttribute('aria-label',S.sg<0?'Dépense (toucher : rentrée)':'Rentrée (toucher : dépense)');
  f.querySelector('.as-fn span').textContent=br?'Recette':'Nom';f.querySelector('.as-sh-rc').hidden=!br;f.querySelector('.as-sh-cu').hidden=!br;
  [].forEach.call(f.querySelectorAll('.as-rc'),function(b){b.setAttribute('aria-pressed',String(b.textContent===nm.value.trim()));});
  [].forEach.call(f.querySelectorAll('.as-cu'),function(b){b.setAttribute('aria-pressed',String(+b.dataset.du===S.du));});
  f.querySelector('.as-sh-cu em').textContent='prête le '+dt(S.i*7+S.du);
  var P=proposition(S.v);pb.hidden=!P;
  if(P){pb.innerHTML='<i>'+IC.annul+'</i><span><b>'+P.nom+'</b> '+P.det+' · '+P.quand+'</span><em class="p">'+sg(P.v)+'</em>';pb.setAttribute('aria-pressed',String(S.prop===P.nom));pb.setAttribute('aria-label','Vente probable : '+P.nom+', '+P.det+', '+sg(P.v)+', '+P.quand);}
  ok.disabled=!nm.value.trim();ok.textContent=(o0?'Enregistrer':'Ajouter')+' en S'+wnum(S.i)+(S.i>=NC?' (hors vue)':'');
  var al=f.querySelector('.as-sh-al'),nb=nbDe(mt.value);if(S.conf!=null&&S.conf!==nb)S.conf=null;
  if(S.conf==null){if(al)al.remove();}else{var ref=grosse(S.v);if(!al){al=el('p','as-sh-al');al.setAttribute('role','alert');ok.parentNode.insertBefore(al,ok);}
   al.innerHTML='<b>'+nf(nb)+' CHF</b> : plus de 10 fois la plus grosse somme de '+t[2]+' ('+nf(ref)+'). Le bon montant ?';ok.textContent='Oui, '+nf(nb)+' CHF en S'+wnum(S.i);}}
 function tenter(){var n=nm.value.trim(),t=typ(S.v);if(!t||!n)return;var nb=nbDe(mt.value),ref=grosse(S.v);
  if(t[3]!==0&&ref&&nb>10*ref&&S.conf!==nb){S.conf=nb;maj();return;}valider(S,n,mt.value);}
 [nm,mt].forEach(function(x){x.addEventListener('focus',function(){if(x.value)setTimeout(function(){x.select();},0);});});
 function remplir(P){S.prop=P.nom;nm.value=P.nom;mt.value=nf(Math.abs(P.v));S.sg=P.v<0?-1:1;S.i=P.i;}
 function choisir(v){if(S.v===v)return;S.v=v;S.prop=null;S.sg=typ(v)[3]<0?-1:1;nm.value='';mt.value='';S.conf=null;maj();}
 f.addEventListener('click',function(e){e.stopPropagation();var t=e.target.closest('button');if(!t)return;
  if(t===sgb){e.preventDefault();S.sg=-S.sg;mt.value=mt.value.replace(/^\s*[−+-]\s*/,'');maj();}
  else if(t.classList.contains('as-sh-x'))fermeAjout();
  else if(t.classList.contains('as-ty'))choisir(t.dataset.v);
  else if(t.classList.contains('as-se')){S.i=+t.dataset.i;maj();}
  else if(t.classList.contains('as-rc')){nm.value=t.textContent;maj();}
  else if(t.classList.contains('as-cu')){S.du=+t.dataset.du;maj();}
  else if(t===pb){var P=proposition(S.v);if(P){remplir(P);maj();}}
  else if(t===ok&&!ok.disabled)tenter();});
 nm.addEventListener('input',function(){if(S.prop&&nm.value.trim()!==S.prop)S.prop=null;maj();});
 mt.addEventListener('input',function(){var m=/^\s*([−+-])\s*/.exec(mt.value);if(m){S.sg=m[1]==='+'?1:-1;mt.value=mt.value.slice(m[0].length);}maj();});
 f.addEventListener('keydown',function(e){if(e.key==='Escape')fermeAjout();else if(e.key==='Enter'&&e.target.tagName==='INPUT'&&!ok.disabled)tenter();});
 sc.addEventListener('click',function(e){e.stopPropagation();fermeAjout();});
 if(o0){choisir(o0.v);nm.value=o0.nom;mt.value=o0.am?nf(Math.abs(o0.am)):'';S.sg=o0.am<0?-1:1;S.i=o0.i;S.du=o0.du||28;S.prop=o0.P?o0.P.nom:null;maj();}else if(v)choisir(v);else maj();
 var se=f.querySelector('.as-se[aria-pressed=true]'),sst=f.querySelector('.as-sh-s');if(se&&sst)sst.scrollLeft=Math.max(0,se.offsetLeft-(sst.clientWidth-se.offsetWidth)/2);
 requestAnimationFrame(function(){f.classList.add('as-sh-in');});}
function nbDe(x){return parseInt(String(x).replace(/[^\d]/g,''),10)||0;}
/* la plus grosse somme connue de la rangée (l'année, ses barres, la vente probable) ; à défaut, de tout le calendrier */
function grosse(v){var m=0,tout=0;Object.keys(AN).forEach(function(k){AN[k].forEach(function(it){if(typeof it[1]!=='number')return;var a=Math.abs(it[1]);tout=Math.max(tout,a);if(k===v)m=Math.max(m,a);});});
 var ln=FB.querySelector('.lane[data-voie="'+v+'"]');if(ln)[].forEach.call(ln.querySelectorAll('.bar'),function(b){m=Math.max(m,Math.abs(montant(b)));});
 var P=proposition(v);if(P)m=Math.max(m,Math.abs(P.v));return m||tout;}
function fermeAjout(){if(SH){SH.f.remove();SH.sc.remove();B.classList.remove('as-sh-on');SH=null;}}
/* la pastille de la rangée (solde confirmé de la vue) suit chaque ajout, retrait ou copie dans la vue */
var SOL=[],APPL=false;
function valSolde(m){var t=m.textContent.trim();return (parseInt(t.replace(/[^\d]/g,''),10)||0)*(/^[−-]/.test(t)?-1:1);}
[].forEach.call(FB.querySelectorAll('.lane .g2-r'),function(r){var m=r.querySelector('.g2-rm');if(m&&r.dataset.asV0==null){r.dataset.asV0=valSolde(m);r.dataset.asW0=parseFloat(r.style.getPropertyValue('--w'))||0;}});
function solde(lane,d,i){if(!d||!lane)return;if(!APPL)SOL.push([lane.dataset.voie,d,i]);if(i<0||i>=NC)return;var r=lane.querySelector('.g2-r'),m=r&&r.querySelector('.g2-rm');if(!m)return;
 afficheSolde(r,valSolde(m)+d);r.classList.remove('as-flash');void r.offsetWidth;r.classList.add('as-flash');}
function afficheSolde(r,nv){var m=r.querySelector('.g2-rm'),v0=+r.dataset.asV0,w0=+r.dataset.asW0;m.textContent=sg(nv);
 if(v0)r.style.setProperty('--w',Math.round(Math.max(4,Math.min(100,w0*Math.abs(nv)/Math.abs(v0))))+'%');
 var al=r.getAttribute('aria-label');if(al)r.setAttribute('aria-label',al.replace(/solde\s+[−+-]?[\d\s  ]+/,'solde '+sg(nv)+' '));}
/* poser sans rien toucher : la barre et son nom évitent barres, noms, repères, liens et le titre de la rangée (8 px) */
function obsLane(lane,c){var nx=lane.nextElementSibling,ex=nx&&nx.classList.contains('lane')?[].slice.call(nx.querySelectorAll(':scope>.lt>*')):[];
 return [].slice.call(lane.querySelectorAll('.bar,.lbl,.k17-p,.k18-ln,.lt>*,.as-hors')).concat(ex).filter(function(x){return !(c&&(x===c||c.contains(x)));})
 .map(function(x){return x.getBoundingClientRect();}).filter(function(r){return r.width>0&&r.height>0;});}
function chevauche(rs,obs,m){return rs.some(function(q){return obs.some(function(r){return !(q.right+m<=r.left||q.left>=r.right+m||q.bottom+m<=r.top||q.top>=r.bottom+m);});});}
function placeDans(c,lb,lane,droite){var lr=lane.querySelector('.lr:not(.as-lr2)'),fr=FB.getBoundingClientRect(),cls=lb?(c.classList.contains('k-brassage')?['in','le','ri']:['le','ri']):[''];
 function essai(){var rs=[c.getBoundingClientRect()];if(lb){var q=lb.getBoundingClientRect();if(q.left<fr.left+2||q.right>Math.min(fr.right,innerWidth)-2)return false;
   if(lb.classList.contains('in')){if(lb.scrollWidth>lb.clientWidth+1)return false;}else rs.push(q);}return !chevauche(rs,obsLane(lane,c),8);}
 function tente(ct,tops){ct.appendChild(c);if(droite)c.style.left=Math.max(0,NC*CW-c.offsetWidth-2)+'px';
  for(var k=0;k<tops.length;k++){c.style.top=tops[k]+'px';for(var s=0;s<cls.length;s++){if(lb)lb.className='lbl '+cls[s];if(essai())return true;}}return false;}
 lr.appendChild(c);var h=c.offsetHeight||34,ts=[];
 [].forEach.call(lr.querySelectorAll('.bar:not(.as-nouv)'),function(b){var t=parseFloat(b.style.top);if(ts.indexOf(t)<0&&t+h<=lr.offsetHeight)ts.push(t);});ts.sort(function(a,b){return a-b;});
 if(tente(lr,ts))return;
 /* sinon une ligne neuve sous les repères de la rangée : les liens de la base (commande, promesse) restent attachés */
 var x=lane.querySelector('.as-lr2');if(!x){x=el('div','lr as-lr2');x.style.setProperty('height','0px','important');var ap=lane.querySelector('.k18-pd')||lr;ap.parentNode.insertBefore(x,ap.nextSibling);}
 var tops=[];for(var k=0;k<8;k++)tops.push(8+k*(h+12));
 if(!tente(x,tops)){c.style.top=tops[0]+'px';if(lb)lb.className='lbl '+cls[0];}
 x.style.setProperty('height',(Math.max(parseFloat(x.style.height)||0,parseFloat(c.style.top)+h+6+piedSuivant(lane)))+'px','important');}
/* le titre de la rangée suivante remonte parfois dans celle-ci (Fêtes : −26 px) : la ligne neuve lui laisse sa place */
function piedSuivant(lane){var nx=lane.nextElementSibling,t=nx&&nx.classList.contains('lane')&&nx.querySelector(':scope>.lt');if(!t)return 0;var m=parseFloat(getComputedStyle(t).marginTop)||0;return m<0?-m:0;}
function retasse(lane){var x=lane&&lane.querySelector('.as-lr2');if(!x)return;var hm=0;[].forEach.call(x.children,function(c){hm=Math.max(hm,parseFloat(c.style.top)+c.offsetHeight+6);});if(!hm)x.remove();else x.style.setProperty('height',(hm+piedSuivant(lane))+'px','important');}
/* une barre comme celles de la base : un brassin a sa recette, son brassage, sa garde et son conditionnement sur la durée choisie */
function barre(o){var t=o.v,c=el('div','bar k-'+t),lb=el('span','lbl le'),w;lb.appendChild(D.createTextNode(o.nom+' '));
 var vv=el('span','v');vv.textContent=o.am?sg(o.am):(t==='activite'?(o.j||1)+' j':'');if(vv.textContent)lb.appendChild(vv);
 if(t==='brassage'){var dpx=CW/7,full=o.du*dpx-3,lim=(NC-o.i)*CW-3;w=Math.min(full,lim);if(full>lim)c.classList.add('cutr');
  /* passe 8 : comme la Blonde, la jauge des étapes (brassage, garde, conditionnement) et « J0 / 28 · prête 4 janv. » sur la barre */
  var p1=700/o.du,p3=700/o.du,p2=100-p1-p3,f2=function(x){return x.toFixed(2);};c.classList.add('dj');
  c.innerHTML='<span class="k12-jg" data-avance="0/'+o.du+'"><span class="tr k18-tr"><i class="pr" style="left:calc(0.00% + 1px);width:calc('+f2(p1)+'% - 2px)"></i><i class="ga" style="left:calc('+f2(p1)+'% + 1px);width:calc('+f2(p2)+'% - 2px)"></i><i class="co" style="left:calc('+f2(p1+p2)+'% + 1px);width:calc('+f2(p3)+'% - 2px)"></i></span><em>J0 / '+o.du+'</em></span>';
  c.appendChild(lb);c.dataset.asDu=o.du;}
 else{w=CW-3;c.classList.add('etroit');c.appendChild(lb);}
 c.appendChild(el('span','grip g0'));c.appendChild(el('span','grip g1'));
 c.dataset.chose='n-'+o.id;c.dataset.type=t;c.style.cssText='left:'+(o.i*CW)+'px;width:'+w+'px;top:2px;--c:var(--e-'+t+')';return {c:c,lb:lb};}
/* une vente ponctuelle est une pastille, comme les livraisons de la rangée ; la vente probable choisie devient pleine à sa place */
function court(n){n=String(n).split(',')[0].trim();return n.length>14?n.slice(0,13).trim()+'…':n;}
function pinH(o,nm){return '<span class="k18-r"><svg class="ico"><use href="#i-k17bout"></use></svg></span><span class="k18-n">'+(nm?'<span class="as-pn">'+court(o.nom)+'</span> ':'')+(o.am?sg(o.am):'')+'</span>';}
function pastilleV(o){var P=o.P;
 if(P&&P.i===o.i){var p=P.pin;o.pin0={h:p.innerHTML,c:p.className,l:p.getAttribute('aria-label')};p.classList.remove('prev');p.innerHTML=pinH(o);p.setAttribute('aria-label',o.nom+', '+P.det+', '+sg(o.am)+', '+P.quand);return p;}
 if(P){P.pin.hidden=true;o.Ph=P.pin;}
 var pd=o.lane.querySelector('.k18-pd');if(!pd){pd=el('div','k18-pd num');var lr=o.lane.querySelector('.lr');lr.parentNode.insertBefore(pd,lr.nextSibling);}
 var b=el('button','k17-p');b.type='button';b.innerHTML=pinH(o,1);b.style.left=(o.i*CW+CW/2)+'px';b.setAttribute('aria-label',o.nom+', '+sg(o.am)+', S'+wnum(o.i));pd.appendChild(b);placePin(b,pd,o.lane);return b;}
/* deux ventes la même semaine : la pastille neuve ne se pose jamais sur une autre (ni sur un nom, un lien, une barre) ; sinon une ligne dessous, dans sa semaine */
var HPIN=50;
function placePin(b,pd,lane){if(pd.dataset.asH0==null)pd.dataset.asH0=pd.offsetHeight;
 for(var k=0;k<6;k++){b.style.top=(1+k*HPIN)+'px';hautPd(pd);if(!chevauche([b.getBoundingClientRect()],obsLane(lane,b),3))return;}b.style.top='1px';hautPd(pd);}
/* une ligne de pastilles en plus laisse aussi sa place au titre de la rangée suivante (il remonte de 26 px) */
function hautPd(pd){if(pd.dataset.asH0==null)return;var h0=+pd.dataset.asH0,hm=h0,ln=pd.closest('.lane');[].forEach.call(pd.querySelectorAll('.k17-p'),function(x){if(!x.hidden&&x.style.top)hm=Math.max(hm,parseFloat(x.style.top)+HPIN);});if(hm>h0&&ln)hm+=piedSuivant(ln)+8;pd.style.setProperty('height',hm+'px','important');}
/* hors des semaines affichées : un renvoi au bord droit de la rangée (nom, montant, semaine) */
function hors(o){var c=el('div','as-hors');c.setAttribute('role','button');c.tabIndex=0;c.style.setProperty('--c','var(--e-'+o.v+')');
 c.innerHTML='<span>'+o.nom+'</span>'+(o.am?'<b>'+sg(o.am)+'</b>':'')+'<em>S'+wnum(o.i)+'</em>'+IC.fl;
 c.setAttribute('aria-label',o.nom+(o.am?', '+sg(o.am):'')+', S'+wnum(o.i)+', hors des semaines affichées');placeDans(c,null,o.lane,true);return c;}
function pose(o){var lane=FB.querySelector('.lane[data-voie="'+o.v+'"]');o.lane=lane;if(lane.classList.contains('k15-off'))lane.querySelector('.lt').click();
 if(o.i>=NC)o.el=hors(o);else if(o.v==='vente')o.el=pastilleV(o);else{var x=barre(o);o.el=x.c;placeDans(x.c,x.lb,lane);if(o.v==='brassage'&&majEm(x.c))placeDans(x.c,x.lb,lane);}
 o.el.classList.add('as-nouv');o.el.dataset.asN=o.id;
 if(o.am){setCur(plus(CUR.L,o.am,o.i,NW),plus(CUR.C,o.am,o.i,NW));solde(lane,o.am,o.i);}
 o.an=[o.nom,o.am||((o.j||1)+' j'),wnum(o.i),o.du?Math.ceil(o.du/7):1];(AN[o.v]=AN[o.v]||[]).push(o.an);NV.push(o);
 o.el.classList.add('as-neuf');setTimeout(function(){if(o.el)o.el.classList.remove('as-neuf');},1800);}
function oter(o){if(DET&&DET.bar===o.el)fermeDet();var pdo=o.el&&o.el.closest?o.el.closest('.k18-pd'):null;if(o.pin0){o.el.innerHTML=o.pin0.h;o.el.className=o.pin0.c;o.el.setAttribute('aria-label',o.pin0.l);delete o.el.dataset.asN;o.pin0=null;}else o.el.remove();
 if(o.Ph){o.Ph.hidden=false;o.Ph=null;}
 if(o.am){setCur(plus(CUR.L,-o.am,o.i,NW),plus(CUR.C,-o.am,o.i,NW));solde(o.lane,-o.am,o.i);}
 var a=AN[o.v],k=a?a.indexOf(o.an):-1;if(k>=0)a.splice(k,1);k=NV.indexOf(o);if(k>=0)NV.splice(k,1);retasse(o.lane);if(pdo)hautPd(pdo);}
/* la chose posée reste visible : entre la bande des semaines et la barre d'onglets */
/* le bas de la bande des semaines une fois collée en haut : ce qui passe dessous n'est plus visible */
function hautVu(){var cs=getComputedStyle(FH);return (cs.position==='sticky'||cs.position==='fixed'?(parseFloat(cs.top)||0):Math.max(0,FH.getBoundingClientRect().top))+FH.offsetHeight+8;}
function voir(x){var r=x.getBoundingClientRect(),hb=Math.max(hautVu(),FH.getBoundingClientRect().bottom+8),nv=D.querySelector('nav.bot'),bb=(nv&&nv.getClientRects().length?nv.getBoundingClientRect().top:innerHeight)-12;
 if(r.top<hb||r.bottom>bb)W.scrollBy({top:r.top-(hb+Math.max(0,(bb-hb-r.height)/2)),behavior:'instant'});}
function valider(S,n,mtxt){var t=typ(S.v);if(!t||!n)return;var nb=parseInt(String(mtxt).replace(/[^\d]/g,''),10)||0,sgn=/^\s*[−-]/.test(mtxt)?-1:/^\s*\+/.test(mtxt)?1:(S.sg||t[3]),am=t[3]===0?0:sgn*nb;
 var P=S.prop?proposition(S.v):null,o0=S.o0;if(o0&&o0.P&&S.prop===o0.P.nom)P=o0.P;fermeAjout();
 var o={id:++NN,v:S.v,nom:n,am:am,i:S.i,du:S.v==='brassage'?S.du:0,j:S.v==='activite'?1:0,P:P,quand:P&&P.i===S.i?P.quand:null},avL=CUR.L.slice();
 if(o0)oter(o0);pose(o);voir(o.el);
 var ic=premier(avL,CUR.L),cs=ic!=null?'S'+wnum(ic)+' : '+nf(avL[ic])+' → <b>'+nf(CUR.L[ic])+'</b>':'',msg;
 if(o.v==='brassage')msg='Prête le <b>'+dt(o.i*7+o.du)+'</b>'+(cs?' · '+cs:'');
 else msg=cs||('<b>'+n+'</b> en S'+wnum(o.i));
 if(o.i>=NC)msg='Hors vue, en S'+wnum(o.i)+(cs?' · '+cs:'');
 if(o0)msg=o0.i!==o.i?'<b>'+n+'</b> : S'+wnum(o0.i)+' → S'+wnum(o.i):(cs||'<b>'+n+'</b> modifié');
 toast(msg,function(){oter(o);if(o0)pose(o0);},o.el);}
function retirerN(o){fermeDet();var av=CUR.L[o.i];oter(o);toast('Retiré : <b>'+o.nom+'</b>'+(o.am?' · S'+wnum(o.i)+' : '+nf(av)+' → <b>'+nf(CUR.L[o.i])+'</b>':''),function(){pose(o);},o.lane);}
/* toucher une chose ajoutée : son détail sous elle, Modifier ou Retirer */
function detN(o){if(!o)return;DERN=o.el;fermeToast();sup();var deja=DET&&DET.bar===o.el;fermeDet();if(deja)return;var t=typ(o.v),lane=o.lane;
 var d=el('div','as-det as-detn');d.style.setProperty('--c','var(--e-'+o.v+')');
 var q=o.quand||(JOURS[jour(o.i*7).getDay()]+' '+dt(o.i*7));
 d.innerHTML='<h3>'+o.nom+(o.am?'<span>'+sg(o.am)+'</span>':'')+'</h3><button type="button" class="as-x" aria-label="Fermer">'+IC.x+'</button>'+
  '<div class="as-et"><div><span>'+t[2]+'</span><b>S'+wnum(o.i)+'</b></div><div><span>'+(o.v==='vente'?'Livraison':o.v==='activite'?'Dès le':'Le')+'</span><b>'+q+'</b></div>'+
  (o.v==='activite'?'<div><span>Durée</span><b>'+(o.j||1)+' j</b></div>':'<div><span>Libre S'+wnum(o.i)+'</span><b>'+nf(CUR.L[o.i])+'</b></div>')+'</div>'+
  '<div class="as-bts"><button type="button" class="as-bt as-pri" data-as="mod">Modifier</button><button type="button" class="as-bt" data-as="ret">'+IC.poub+'Retirer</button></div>';
 var anc=o.el.closest('.lr,.k18-pd')||o.el.parentNode;anc.parentNode.insertBefore(d,anc.nextSibling);lane.classList.add('as-det-on');o.el.classList.add('as-sel');DET={bar:o.el,d:d,lane:lane};
 var br=o.el.getBoundingClientRect(),dr=d.getBoundingClientRect(),v0=Math.max(br.left,dr.left+14),v1=Math.min(br.right,dr.right-14);
 d.style.setProperty('--ax',Math.round((v0+v1)/2-dr.left)+'px');d.style.setProperty('--lh',Math.max(0,Math.round(dr.top-br.bottom))+'px');
 d.addEventListener('click',function(e){e.stopPropagation();var b=e.target.closest('button');if(!b)return;
  if(b.classList.contains('as-x'))fermeDet();else if(b.dataset.as==='mod')ouvreAjout(o.v,o);else if(b.dataset.as==='ret')retirerN(o);});
 dedans(d,br);}
/* un détail ouvert se lit en entier (au-dessus de la barre d'onglets) sans que la chose touchée sorte par le haut */
function dedans(d,br){var r=d.getBoundingClientRect(),nv=D.querySelector('nav.bot'),bb=(nv&&nv.getClientRects().length?nv.getBoundingClientRect().top:innerHeight)-8;
 if(r.bottom>bb){var mx=br.top-hautVu();W.scrollBy({top:Math.max(0,Math.min(r.bottom-bb,mx)),behavior:'instant'});}}
D.addEventListener('click',function(e){if(e.defaultPrevented||!e.target.closest)return;var n0=e.target.closest('#fb .as-nouv:not(.bar)');if(n0){e.stopPropagation();e.preventDefault();detN(objDe(n0));return;}
 var c=e.target.closest('#fb .lane .g2-c');
 if(c){e.stopPropagation();e.preventDefault();var lane=c.closest('.lane');if(ANON)quitteAn();lane.classList.remove('k14-ouv');c.setAttribute('aria-expanded','false');ouvreAjout(lane.dataset.voie);return;}
 if(e.target.closest('#fab')){e.stopPropagation();ouvreAjout(null);}},true);
/* ---------- passe 8 : un seul état pour les deux sens du téléphone (CRITIQUE7 n° 1) ----------
   Chaque vue écrit ses données à chaque changement (sessionStorage commun, et au cadre parent qui les passe à l'autre vue) ;
   elle relit le dernier état quand elle le reçoit, quand elle change de taille (on tourne) ou redevient visible. Les données, pas le dessin :
   la courbe, les choses posées, les barres de la base (semaine, durée, retrait, copies, marques), la livraison promise, les écarts des pastilles,
   les rangées masquées. Chaque vue redessine à sa largeur (6 ou 13 semaines). */
var VUE=D.documentElement.dataset.vue||(NC>6?'paysage':'portrait'),CLE='as-cal-etat',ID=Math.random().toString(36).slice(2),VER=0,DERJ='',SVT=0;
var BASE={},EM0={};
[].forEach.call(FB.querySelectorAll('.bar[data-chose]'),function(b){BASE[b.dataset.chose]={l0:L(b),w0:Wd(b),d0:duree(b)};var em=b.querySelector('.k12-jg em');if(em)EM0[b.dataset.chose]=em.textContent;});
function srcDe(c){return c.replace(/(-d\d+)+$/,'');}
function marquesDe(b){return ['epi','eto','lien'].filter(function(k){return !!(b&&b.querySelector&&b.querySelector('.as-marq[data-k="'+k+'"]'));}).join(',');}
function poseMarques(b,m){if(!b||!b.classList)return;var a=(m||'').split(',');
 var e1=a.indexOf('epi')>=0,e2=a.indexOf('eto')>=0,e3=a.indexOf('lien')>=0;
 b.classList.toggle('as-epi',e1);marque(b,'epi',e1,IC.pin);b.classList.toggle('as-eto',e2);marque(b,'eto',e2,IC.star);if(b.dataset.chose)etoile(b,e2);marque(b,'lien',e3,IC.lien);}
function etatVue(){var bars=[];
 [].forEach.call(FB.querySelectorAll('.bar[data-chose]:not(.as-nouv)'),function(b){var c=b.dataset.chose,s=BASE[c]?null:srcDe(c),B0=BASE[s||c];if(!B0)return;
  bars.push({c:c,s:s,k:Math.round((L(b)-B0.l0)/CW),du:b.dataset.asDu?+b.dataset.asDu:null,r:b.classList.contains('as-ret')?1:0,m:marquesDe(b)});});
 return {L:CUR.L,C:CUR.C,bars:bars,nv:NV.map(function(o){return {id:o.id,v:o.v,nom:o.nom,am:o.am,i:o.i,du:o.du||0,j:o.j||0,P:o.P?o.P.nom:null,q:o.quand||null,m:marquesDe(o.el)};}),
  prom:PROM.map(function(p){return p.date;}),sol:SOL,nn:NN,
  off:[].filter.call(FB.querySelectorAll('.lane.k15-off'),function(l){return !!l.dataset.voie;}).map(function(l){return l.dataset.voie;})};}
function lireStock(){try{var t=sessionStorage.getItem(CLE);return t?JSON.parse(t):null;}catch(_){return null;}}
function noter(){if(APPL)return;clearTimeout(SVT);SVT=setTimeout(enregistrer,120);}
function enregistrer(){if(APPL)return;if(G||H||SH){SVT=setTimeout(enregistrer,300);return;}
 var E=etatVue(),js=JSON.stringify(E);if(js===DERJ)return;DERJ=js;var st=lireStock();VER=Math.max(VER,st&&st.ver||0)+1;E.ver=VER;E.id=ID;E.vue=VUE;
 try{sessionStorage.setItem(CLE,JSON.stringify(E));}catch(_){}
 if(W.parent&&W.parent!==W)try{W.parent.postMessage({asCal:'etat',etat:E},'*');}catch(_){}}
function recevoir(E){if(!E||!E.L||E.id===ID||!(E.ver>VER))return;if(G||H||SH){setTimeout(function(){recevoir(E);},400);return;}VER=E.ver;appliquer(E);}
function appliquer(E){APPL=true;try{
 fermeToast();finAlerte();fermeDet();fermeMenu();zoomOff();finLecture();SUP=0;NN=Math.max(NN,E.nn||0);
 /* les choses posées : on retire celles qui ont changé, on pose les nouvelles */
 var cle=function(x){return [x.id,x.v,x.nom,x.am,x.i,x.du||0,x.j||0,x.P||''].join('|');},veut={};E.nv.forEach(function(x){veut[cle(x)]=1;});
 NV.slice().reverse().forEach(function(o){if(!veut[cle({id:o.id,v:o.v,nom:o.nom,am:o.am,i:o.i,du:o.du,j:o.j,P:o.P?o.P.nom:null})])oter(o);});
 var ont={};NV.forEach(function(o){ont[o.id]=o;});
 E.nv.forEach(function(x){if(ont[x.id])return;var P=null;if(x.P){var pp=proposition(x.v);if(pp&&pp.nom===x.P)P=pp;}
  var o={id:x.id,v:x.v,nom:x.nom,am:x.am,i:x.i,du:x.du,j:x.j,P:P,quand:x.q};pose(o);if(o.el)o.el.classList.remove('as-neuf');});
 /* les barres de la base et leurs copies */
 var vu={};E.bars.forEach(function(x){vu[x.c]=x;});
 [].forEach.call(FB.querySelectorAll('.bar[data-chose]:not(.as-nouv)'),function(b){if(!BASE[b.dataset.chose]&&!vu[b.dataset.chose]){etoile(b,false);b.remove();}});
 E.bars.forEach(function(x){var b=FB.querySelector('.bar[data-chose="'+x.c+'"]'),B0=BASE[x.s||x.c];if(!B0)return;
  if(!b&&x.s){var sb=FB.querySelector('.bar[data-chose="'+x.s+'"]');if(!sb)return;b=copie(sb,x.c,B0.l0+x.k*CW);}if(!b)return;
  var cible=B0.l0+x.k*CW;if(Math.abs(L(b)-cible)>.5)placer(b,cible);
  if(!x.s&&!x.k){var ln=FB.querySelector('.k18-ln[data-k18-lien="'+x.c+'"]');if(ln&&ln.dataset.asW!=null){ln.style.width=ln.dataset.asW;ln.hidden=false;}}
  if(!x.s){var w=x.du?B0.w0+(x.du-B0.d0)*CW/7:B0.w0;if(Math.abs(Wd(b)-w)>.5)b.style.width=w+'px';}
  else if(x.du&&!b.classList.contains('cutr'))b.style.width=(B0.w0+(x.du-B0.d0)*CW/7)+'px';
  var em=b.querySelector('.k12-jg em');
  if(x.du){b.dataset.asDu=x.du;b.classList.add('as-ext');points(b,!!conflit(b));majEm(b);}
  else{delete b.dataset.asDu;b.classList.remove('as-ext');var pt=b.querySelector('.as-pts');if(pt)pt.remove();if(em&&EM0[x.s||x.c]!=null)em.textContent=EM0[x.s||x.c];}
  b.classList.toggle('as-ret',!!x.r);});
 /* la livraison promise */
 (E.prom||[]).forEach(function(d,k){if(PROM[k]&&PROM[k].date!==d)livrerA(PROM[k],d);});
 /* la courbe, la tête et les pastilles des rangées (chaque vue ne compte que ses semaines) */
 SOL=(E.sol||[]).slice();setCur(E.L.slice(),E.C.slice());
 [].forEach.call(FB.querySelectorAll('.lane'),function(l){var r=l.querySelector('.g2-r');if(!r||r.dataset.asV0==null||!r.querySelector('.g2-rm'))return;var v=+r.dataset.asV0;
  SOL.forEach(function(s){if(s[0]===l.dataset.voie&&s[2]>=0&&s[2]<NC)v+=s[1];});if(valSolde(r.querySelector('.g2-rm'))!==v)afficheSolde(r,v);});
 /* les marques (l'étoile se pose sur la courbe à jour) */
 E.bars.forEach(function(x){poseMarques(FB.querySelector('.bar[data-chose="'+x.c+'"]'),x.m);});
 E.nv.forEach(function(x){NV.forEach(function(o){if(o.id===x.id&&o.el&&o.el.classList.contains('bar'))poseMarques(o.el,x.m);});});
 /* les rangées masquées */
 [].forEach.call(FB.querySelectorAll('.lane[data-voie]'),function(l){var o=(E.off||[]).indexOf(l.dataset.voie)>=0;if(o===l.classList.contains('k15-off'))return;
  var b=o?l.querySelector('[data-g2-masque]'):l.querySelector('.lt');if(b){SUP=0;b.click();}});
 }catch(err){if(W.console)console.error('état commun',err);}
 DERJ=JSON.stringify(etatVue());MOE.takeRecords();clearTimeout(SVT);APPL=false;}
var MOE=new MutationObserver(noter);MOE.observe(FB,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden','data-as-du']});
var setCur0=setCur;setCur=function(Lx,Cx){setCur0(Lx,Cx);noter();};
W.addEventListener('message',function(e){var d=e.data;if(d&&d.asCal==='etat')recevoir(d.etat);});
W.addEventListener('storage',function(e){if(e.key===CLE&&e.newValue)try{recevoir(JSON.parse(e.newValue));}catch(_){}});
function relire(){recevoir(lireStock());}
W.addEventListener('resize',relire);W.addEventListener('pageshow',relire);W.addEventListener('focus',relire);D.addEventListener('visibilitychange',function(){if(!D.hidden)relire();});
/* le fond du cadre parent suit le thème de la vue (marges en 1280) */
function fond(){if(W.parent&&W.parent!==W)try{W.parent.postMessage({asCal:'fond',c:getComputedStyle(B).backgroundColor},'*');}catch(_){}}
new MutationObserver(fond).observe(D.documentElement,{attributes:true,attributeFilter:['data-theme','class']});fond();
DERJ=JSON.stringify(etatVue());relire();
MOF=new MutationObserver(suitFab);MOF.observe(FB,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});W.addEventListener('resize',suitFab);degageFab();
})();
