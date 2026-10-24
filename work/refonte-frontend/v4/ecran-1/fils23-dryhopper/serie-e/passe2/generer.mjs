// Série E, passe 2 : e5 « on gagne / on paie », avec les greffes et retouches du tri (tri/SYNTHESE.md).
// node generer.mjs → e5/etat.html. Socle : socle2.mjs (copie de ../socle.mjs, pictos de la planche standard,
// α du lot puis plage des fiches, départ au meilleur moment : actif · 2 j). La v0 (../e5) n'est pas touchée.
import fs from 'node:fs';
import path from 'node:path';
import { ICI, F, NOM, BA, pi, page, LIEN_ETAPE } from './socle2.mjs';

// Les 12 familles à un toucher (barres l5b de la carte), pour le moment touché.
const rows = F.map((f) => '<div class="e5-ba" data-f="' + f + '"><span class="e5-n">' + pi(f) + NOM[f] + '</span><span class="e5-p"><i class="e5-z" data-role="zone"></i><i class="e5-r" style="background:' + BA[f] + '"></i><i class="e5-av"></i></span><span class="e5-v"></span></div>').join('');

const css = `
.se-ecran{gap:7px;padding-bottom:10px}
.se-rep{min-height:1.3em}
.e5-am{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px;font-size:12px;background:#fff;border-radius:8px;padding:5px 10px}
.e5-jt{position:relative;height:10px;background:#f1f2f5;border-radius:2px}
.e5-jt i{position:absolute;top:0;bottom:0;display:block;border-radius:2px}
.e5-j16{background:#d9dce3}
.e5-jb{background:#6b6b75}
.e5-ja.trop{background:var(--acc)}
.e5-ja.cru{background:repeating-linear-gradient(135deg,#9a9aa3 0 2px,#f1f2f5 2px 5px)}
.e5-ib{font:600 12px var(--mono)}
.e5-ch{position:relative;background:#fff;border-radius:8px;padding:6px 8px 6px;display:flex;flex-direction:column;gap:3px}
.e5-hd{display:flex;align-items:center;gap:4px;font-size:12px;color:var(--gris);min-height:24px}
.e5-hd b{color:var(--encre);font-weight:600}
.e5-best{margin-left:auto;height:24px;padding:0 10px;border-radius:12px;border:1px solid #c9cad2;background:#fff;font-size:12px;font-weight:600;color:#6a2d86}
.e5-wrap{position:relative;height:300px}
.e5-g{position:absolute;left:0;top:0;bottom:0;width:79%}
.e5-pl{position:absolute;left:0;top:0;bottom:0;width:100%;touch-action:none;cursor:pointer}
.e5-jo{position:absolute;right:0;top:0;bottom:0;width:18%;touch-action:none;cursor:pointer;border-left:1px dashed #c9cad2}
.e5-jo.off{opacity:.45}
.e5-zh{position:absolute;left:0;right:0;top:0;height:170px;background:#f3e8f7;display:block}
.e5-ax{position:absolute;left:0;right:0;top:170px;height:2px;background:var(--encre);display:block}
.e5-cru{position:absolute;top:173px;height:10px;display:block;background:repeating-linear-gradient(135deg,#9a9aa3 0 2px,#fff 2px 5px);border-radius:2px}
.e5-c{position:absolute;top:0;bottom:0;display:block}
.e5-c .h{position:absolute;bottom:130px;left:1px;right:1px;background:#bf86d6;border-radius:2px 2px 0 0;display:block}
.e5-c .b{position:absolute;top:173px;left:1px;right:1px;display:block;border-radius:0 0 2px 2px}
.e5-c .b.ibu{background:#9a9aa3}
.e5-c .b.ibu.trop{background:var(--acc)}
.e5-c .b.res{background:#2f6b5f;top:185px}
.e5-c .b2{position:absolute;left:1px;right:1px;display:block;background:#6aa33a}
.e5-c.ip .h{opacity:.55}
.e5-c.on{background:#ececf1;border-radius:2px}
.e5-c.on .h{background:#9840bc}
.e5-c.sg .h{background:repeating-linear-gradient(135deg,#bf86d6 0 2px,#f3e8f7 2px 5px)}
.e5-tick{position:absolute;bottom:0;width:1px;height:4px;background:#9a9aa3;display:block}
.e5-tick.l{height:8px;background:var(--encre)}
.e5-tag{position:absolute;transform:translateX(-50%);font:600 12px var(--mono);white-space:nowrap;padding:0 4px;border-radius:4px;background:#fff;z-index:2}
.e5-lab{position:relative;height:15px;font-size:12px;color:var(--gris)}
.e5-lab span{position:absolute;transform:translateX(-50%);white-space:nowrap}
.e5-lab span.on{color:var(--encre);font-weight:600}
.e5-pied{display:flex;align-items:center;gap:4px;font-size:12px;color:var(--gris);flex-wrap:wrap}
.e5-pied b{color:var(--encre);font-weight:600}
.e5-sep::before{content:"·";margin:0 2px}
.e5-r1::before{content:" : ";color:var(--encre)}
.e5-r2::before{content:" · ";color:var(--encre)}
.e5-fl::after{content:" ›"}

.e5-pied i.sq{display:inline-block;width:10px;height:8px;background:var(--acc);border-radius:2px}
.e5-pied i.hz{display:inline-block;width:14px;height:8px;background:repeating-linear-gradient(135deg,#9a9aa3 0 2px,#fff 2px 5px);border-radius:2px}
.e5-co2{font-size:12px;color:#2f6b5f;min-height:15px}
.e5-loupe{position:absolute;left:0;right:0;top:-6px;height:112px;background:#fff;border:1px solid #c9cad2;border-radius:8px;display:none;z-index:5;overflow:hidden}
body.touche .e5-loupe{display:block}
.e5-lc{position:absolute;bottom:20px;width:44px;margin-left:-22px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:2px;height:84px}
.e5-lc i{display:block;width:30px;background:#bf86d6;border-radius:2px 2px 0 0}
.e5-lc.on i{background:#9840bc}
.e5-lc span{font:600 12px var(--mono);color:var(--gris)}
.e5-lc.on span{color:var(--encre)}
.e5-lb{position:absolute;bottom:2px;transform:translateX(-50%);font:600 13px var(--mono);color:var(--gris)}
.e5-lb.on{color:#fff;background:var(--encre);padding:0 6px;border-radius:4px}
.e5-mes{font-size:12px;color:var(--gris);display:flex;flex-wrap:wrap;gap:0 5px;align-items:center}
.e5-mes b{color:var(--encre);font:600 12px var(--mono)}
.e5-mes.jamais{background:repeating-linear-gradient(135deg,#e3e5eb 0 2px,transparent 2px 6px);border-radius:4px;padding:1px 4px}
.e5-jury{display:inline-flex;gap:2px}
.e5-jury i{width:8px;height:8px;border-radius:50%;border:1.5px solid #9840bc;display:block}
.e5-jury i.b{background:#6b6b75;border-color:#6b6b75}
.e5-jury i.p{background:#9840bc}
.e5-fin{display:flex;align-items:center;gap:6px}
.e5-lev{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border:1px dashed #9a9aa3;border-radius:15px;font-size:12px;background:#fff;color:var(--gris)}
.e5-lev b{font-weight:600;font-size:13px;color:var(--encre)}
.e5-fam{margin-left:auto;height:30px;padding:0 12px;border-radius:15px;border:1px solid #c9cad2;background:#fff;font-weight:600;font-size:13px}
.e5-bars{display:flex;flex-direction:column;gap:3px}
.e5-ba{display:grid;grid-template-columns:92px 1fr 42px;align-items:center;gap:6px;min-height:19px}
.e5-n{display:flex;align-items:center;gap:4px}
.e5-p{position:relative;height:12px;background:#f1f2f5;border-radius:2px;overflow:hidden}
.e5-p i{position:absolute;top:0;bottom:0;left:0;display:block}
.e5-z{background:#d9dce3}
.e5-r{top:3px!important;bottom:3px!important;border-radius:2px}
.e5-av{width:3px;background:var(--encre)}
.e5-p.hach{background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,#f1f2f5 2px 6px)}
.e5-v{text-align:right;font-family:var(--mono);font-size:12px}
`;

const corps = '<p class="se-rep" id="rep"></p>'
  + '<div class="e5-am"><span>amertume</span><span class="e5-jt"><i class="e5-j16" style="left:29.4%;width:11.8%"></i><i class="e5-jb" style="left:0;width:35.3%"></i><i class="e5-ja"></i></span><span class="e5-ib" id="e5-ib"></span></div>'
  + '<section class="e5-ch" data-libre="moment" data-acquis="frise">'
  + '<div class="e5-hd">' + pi('floral') + '<b>on gagne</b><button type="button" class="e5-best" id="e5-best">le meilleur : actif · 2 j</button></div>'
  + '<div class="e5-wrap"><div class="e5-loupe" aria-hidden="true"></div>'
  + '<div class="e5-g" data-acquis="geste" data-pas="5"><div class="e5-pl" role="slider" tabindex="0" aria-label="Moment de l\'ajout" aria-valuemin="0" aria-valuemax="23"><i class="e5-zh" data-role="zone"></i><i class="e5-ax"></i></div></div>'
  + '<div class="e5-jo" role="slider" tabindex="0" aria-label="Jours de contact" aria-valuemin="1" aria-valuemax="7"><i class="e5-zh" data-role="zone"></i><i class="e5-ax"></i></div></div>'
  + '<div class="e5-lab" id="e5-lab"></div>'
  + '<p class="e5-pied"><b>on paie</b> amertume <i class="sq"></i><span class="e5-sep"></span>' + pi('resin', 14) + pi('green', 14) + '<span class="e5-sep"></span><i class="hz"></i> IBU à cru?</p>'
  + '<p class="e5-co2" id="e5-co2"></p></section>'
  + '<div data-acquis="valeurs"><p class="e5-mes" id="e5-mes" data-nature="mesure"></p></div>'
  + '<div class="e5-fin"><a class="e5-lev" data-acquis="levure" data-forme="etape" href="' + LIEN_ETAPE + '"><b class="e5-fl">2 Levure</b><span id="e5-levt"></span></a>'
  + '<button type="button" class="e5-fam" aria-expanded="false" aria-controls="e5-panneau" id="e5-fb"><span class="e5-fl">12 familles</span></button></div>'
  + '<section class="se-bloc e5-bars" id="e5-panneau" hidden>' + rows + '</section>';

const js = String.raw`
var pl=document.querySelector('.e5-pl'),jo=document.querySelector('.e5-jo'),lp=document.querySelector('.e5-loupe'),zh=pl.querySelector('.e5-zh');
var JOURS=[1,2,3,5,7],jour=2,BEST=M.findIndex(function(p){return p.id==='dryActive|2';});
// 16 positions sur la frise : 13 minutes d'ébullition, le whirlpool, actif, après ; les jours au bout (x3b réduit).
var POS=[];for(var k=0;k<14;k++)POS.push(k);POS.push(SE.SEGS[2][0]);POS.push(SE.SEGS[3][0]);
var BO=[[0,68],[70,78],[80,89],[91,100]];
var X=POS.map(function(k,n){var p=M[k];if(p.seg===0)return {x:BO[0][0]+(BO[0][1]-BO[0][0])/13*n,w:(BO[0][1]-BO[0][0])/13};return {x:BO[p.seg][0],w:BO[p.seg][1]-BO[p.seg][0]};});
function posDe(i){var p=M[i];return p.seg<2?i:(p.seg===2?14:15);}
function idx(pos,j){var k=POS[pos];return k<14?k:k+JOURS.indexOf(j);}
POS.forEach(function(k,n){var e=document.createElement('i');e.className='e5-c'+(M[k].src==='interp'?' ip':'');e.style.left=X[n].x+'%';e.style.width=X[n].w+'%';e.dataset.n=n;e.innerHTML='<i class="h"></i><i class="b"></i><i class="b2"></i>';pl.appendChild(e);
  if(n<13){var t=document.createElement('i');t.className='e5-tick'+(M[k].min%30===0||M[k].min===10?' l':'');t.style.left=(X[n].x+X[n].w/2)+'%';pl.appendChild(t);}});
[14,15].forEach(function(n){var c=document.createElement('i');c.className='e5-cru';c.style.left=X[n].x+'%';c.style.width=X[n].w+'%';pl.appendChild(c);});
JOURS.forEach(function(j,n){var e=document.createElement('i');e.className='e5-c';e.style.left=(n*20)+'%';e.style.width='20%';e.dataset.j=j;e.innerHTML='<i class="h"></i><i class="b res"></i><i class="b2"></i>';jo.appendChild(e);});
var t1=document.createElement('span');t1.className='e5-tag';pl.appendChild(t1);var t2=document.createElement('span');t2.className='e5-tag';pl.appendChild(t2);
var lab=document.getElementById('e5-lab');
[['60′',0,0],['WP',13,1],['actif',14,2],['après',15,3]].forEach(function(a){var s=document.createElement('span');s.textContent=a[0];s.dataset.seg=a[2];if(a[0]!=='60′'&&a[0]!=='10′')s.setAttribute('data-etape','');s.style.left=(0.79*(X[a[1]].x+X[a[1]].w/2))+'%';lab.appendChild(s);});
var jl=document.createElement('span');jl.setAttribute('data-jours','');jl.style.left='91%';jl.style.display='flex';jl.style.gap='0';jl.style.transform='none';jl.style.left='82%';jl.style.width='18%';
JOURS.forEach(function(j){var d=document.createElement('span');d.setAttribute('data-jour','');d.style.position='static';d.style.transform='none';d.style.flex='1';d.style.textAlign='center';d.textContent=(j===1||j===7)?j+' j':'';d.style.textAlign=j===1?'left':j===7?'right':'center';d.dataset.j=j;jl.appendChild(d);});
lab.appendChild(jl);
function hG(v){return Math.max(1,Math.min(170,pc('floral',v)*3.4));}
function colonne(e,k){var q=M[k],h=e.querySelector('.h'),b=e.querySelector('.b'),b2=e.querySelector('.b2');h.style.height=hG(q.v.floral)+'px';
  if(q.ibu!=null){b.className='b ibu'+(trop(k)?' trop':'');b.style.height=Math.max(2,q.ibu/110*96)+'px';b2.style.height='0';}
  else{var r=Math.max(0,dl(k,'resin')),g=Math.max(0,dl(k,'green'));b.className='b res';b.style.height=Math.max(2,r*3.2)+'px';b2.style.top=(185+r*3.2)+'px';b2.style.height=(g*3.2)+'px';}}
var MES={
  boil:'<span class="se-m">mesuré</span> à l\'ébullition : <b>cuit, herbacé</b> au panel <span class="se-src">Sharp 2014</span>',
  wp:'<span class="se-m">jamais mesuré</span> au whirlpool pour Idaho 7',
  actif:'<span class="se-m">mesuré</span> Idaho 7 au levurage<span class="e5-sep"></span>linalol <b>38 µg/L</b> <span class="se-src">McCabe 2023,</span> à vérifier',
  apres:'<span class="se-m">mesuré</span> <span class="e5-jury" aria-label="jury : 8,1 sur 15, 3 sans houblon">'+(function(){var s='';for(var n=1;n<=15;n++)s+='<i class="'+(n<=3?'b':n<=8?'p':'')+'"></i>';return s;})()+'</span> <b>8,1</b>/15 contre <b>3</b> · Cascade <b>3,86 g/L</b> <span class="se-src">Lafontaine 2018</span>'};
var SRC={boil:'E07',wp:'',actif:'E03',apres:'E04'};
function poser(i){SE.i=i;var p=M[i];if(p.j)jour=p.j;var n=posDe(i);pl.setAttribute('aria-valuenow',i);pl.setAttribute('aria-valuetext',p.lib);
  jo.setAttribute('aria-valuenow',jour);jo.setAttribute('aria-valuetext',jour+' j de contact');jo.classList.toggle('off',!p.j);
  document.getElementById('rep').innerHTML=reponse(i);zh.style.height=jo.querySelector('.e5-zh').style.height=Math.min(170,zp('floral')*3.4)+'px';
  document.querySelectorAll('.e5-pl .e5-c').forEach(function(c){var m=+c.dataset.n,k=POS[m];if(k>=14)k=idx(m,jour);c.classList.toggle('on',m===n);colonne(c,k);});
  var seg=p.seg>=2?p.seg:2,base=SE.SEGS[seg][0];
  document.querySelectorAll('.e5-jo .e5-c').forEach(function(c){var j=+c.dataset.j,k=base+JOURS.indexOf(j);c.classList.toggle('on',!!p.j&&j===p.j);c.classList.toggle('sg',j>2);colonne(c,k);});
  lab.querySelectorAll('[data-seg]').forEach(function(s){s.classList.toggle('on',+s.dataset.seg===p.seg);});
  lab.querySelectorAll('[data-jour]').forEach(function(s){s.classList.toggle('on',!!p.j&&+s.dataset.j===p.j);s.textContent=(s.dataset.j==='1'||s.dataset.j==='7')?s.dataset.j+' j':'';});
  var c=X[n],cx=0.79*(c.x+c.w/2)/0.79;t1.style.left=Math.max(6,Math.min(94,cx))+'%';t1.style.bottom=(134+hG(p.v.floral))+'px';t1.style.color=T.floral;t1.textContent=tl(i)+sg(dl(i,'floral'));
  if(p.ibu!=null){t2.textContent=(trop(i)?'trop amer ':'≈ ')+ibuT(i)+' IBU';t2.style.color=trop(i)?'#c2410c':'#55555f';t2.style.top=(178+Math.max(2,p.ibu/110*96))+'px';}
  else{t2.textContent='';}
  t2.style.left=Math.max(22,Math.min(78,cx))+'%';t2.hidden=!t2.textContent;
  var co=document.getElementById('e5-co2');co.textContent=p.seg===2?'CO₂ et levure : ~'+sg(dl(i,'resin')-dl(i+5,'resin'))+' résineux':(p.seg===3?'résineux '+tl(i)+sg(dl(i,'resin'))+' · végétal '+tl(i)+sg(dl(i,'green')):'');
  var t=ibuT(i),ja=document.querySelector('.e5-ja');ja.className='e5-ja '+(t==null?'cru':t>70?'trop':'');ja.style.left='35.3%';ja.style.width=(t==null?4:Math.min(64.7,p.ibu/170*100))+'%';ja.style.background=t!=null&&t<=70?'#16161a':'';
  var ib=document.getElementById('e5-ib');ib.textContent=(t!=null&&t>70?'trop amer ':'')+'≈'+(t==null?60:t)+' IBU'+(t==null?' +?':'');ib.style.color=t!=null&&t>70?'#c2410c':'';
  var b=document.getElementById('e5-best');b.style.visibility=i===BEST?'hidden':'visible';
  var k2=p.seg===0?'boil':p.seg===1?'wp':p.seg===2?'actif':'apres',me=document.getElementById('e5-mes');me.innerHTML=MES[k2];me.className='e5-mes'+(k2==='wp'?' jamais':'');if(SRC[k2])me.setAttribute('data-source',SRC[k2]);else me.removeAttribute('data-source');
  var lt=document.getElementById('e5-levt');if(p.seg===2){var po=SE.POM[p.j].citrus-p.v.citrus;lt.textContent='Pomona agrumes ~'+sg(po);}else lt.textContent='rien ne change ici';lt.className=p.seg===2?'e5-lt':'';
  document.querySelectorAll('.e5-ba').forEach(function(r){var f=r.dataset.f,pi=r.querySelector('.e5-p'),v=r.querySelector('.e5-v');
    r.querySelector('.e5-z').style.width=zp(f)+'%';r.querySelector('.e5-av').style.left='calc('+pc(f,AV[f])+'% - 1px)';
    if(inc(f)){pi.classList.add('hach');r.querySelector('.e5-r').hidden=true;r.querySelector('.e5-av').hidden=true;v.textContent='?';v.style.color='#55555f';return;}
    r.querySelector('.e5-r').style.width=pc(f,p.v[f])+'%';var d=dl(i,f);v.textContent=Math.abs(d)>=0.5?tl(i)+sg(d):'';v.style.color=p.v[f]>B[f]?'#c2410c':T[f];});
  loupe(i);}
function loupe(i){var n=posDe(i);lp.innerHTML='';var w=lp.clientWidth||330,pas=58;
  for(var m=n-2;m<=n+2;m++){if(m<0||m>=POS.length)continue;var k=POS[m];if(k>=14)k=idx(m,jour);var d=document.createElement('div');d.className='e5-lc'+(m===n?' on':'');d.style.left=(w/2+(m-n)*pas)+'px';
    d.innerHTML='<span>'+tl(k)+sg(dl(k,'floral'))+'</span><i style="height:'+Math.max(2,Math.min(64,hG(M[k].v.floral)*0.8))+'px"></i>';lp.appendChild(d);
    var l=document.createElement('span');l.className='e5-lb'+(m===n?' on':'');l.textContent=M[k].seg===1?'WP':M[k].seg>=2?(M[k].seg===2?'actif':'après'):M[k].court;l.style.left=(w/2+(m-n)*pas)+'px';lp.appendChild(l);}}
function reponse(i){var d=dl(i,'floral'),s=tl(i),h='Face à ta stout<span class="e5-r1" style="color:'+T.floral+'">floral '+s+sg(d)+'</span>';
  if(trop(i))h+='<span class="e5-r2 se-al">trop amer</span>';var r=dl(i,'resin');if(r>=5)h+='<span class="e5-r2 se-al">résineux '+s+sg(r)+'</span>';return h;}
window.poser=poser;
var CX=X.map(function(c){return c.x+c.w/2;});
glisser(pl,function(e){var r=pl.getBoundingClientRect();return idx(proche(CX,(e.clientX-r.left)/r.width*100),jour);},poser);

glisser(jo,function(e){var r=jo.getBoundingClientRect(),j=JOURS[Math.max(0,Math.min(4,Math.floor((e.clientX-r.left)/r.width*5)))],p=M[SE.i];return (p.seg===3?SE.SEGS[3][0]:SE.SEGS[2][0])+JOURS.indexOf(j);},poser);
document.getElementById('e5-best').addEventListener('click',function(){poser(BEST);});
document.getElementById('e5-fb').addEventListener('click',function(){var pa=document.getElementById('e5-panneau'),b=document.getElementById('e5-fb');pa.hidden=!pa.hidden;b.setAttribute('aria-expanded',String(!pa.hidden));b.firstChild.className=pa.hidden?'e5-fl':'';});
`;

const legende = '<span>~ simulé ; ≈ interpolé (55′ à 15′, 5′ et 0′) ou estimé (IBU du whirlpool) ; hachuré : inconnu ou sans gain, jamais zéro</span>'
  + '<span>Au-dessus de l\'axe, le floral qu\'Idaho 7 apporte ; la bande rose est la place que laisse la 16D</span>'
  + '<span>Dessous, ce qu\'il coûte : amertume à l\'ébullition (orangé : trop amer), résineux et végétal en dry hop</span>'
  + '<span>Au bout, les jours de contact : au-delà de 2 j le simulé ne monte plus. Le CO₂ de l\'actif : convention du moteur, la moitié du myrcène</span>';

fs.mkdirSync(path.join(ICI, 'e5'), { recursive: true });
fs.writeFileSync(path.join(ICI, 'e5', 'etat.html'), page({ id: 'e5 passe 2', css, corps, legende, js }));
console.log('passe 2 : e5/etat.html écrit');
