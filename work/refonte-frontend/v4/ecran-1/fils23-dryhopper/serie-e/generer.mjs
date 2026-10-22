// Série E, la frise : huit concepts de Dryhopper (« Quand ajouter Idaho 7 ? »). node generer.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ICI, F, NOM, T, BA, FO, M, IDX, pi, page, etapes, pont, vrai } from './socle.mjs';

const ecrire = (id, html) => { fs.mkdirSync(path.join(ICI, id), { recursive: true }); fs.writeFileSync(path.join(ICI, id, 'etat.html'), html); };
const LEG_BASE = '<span>~ simulé ; ≈ interpolé ou estimé ; hachuré : inconnu, jamais zéro</span><span>Au style : la zone grise est la place que laisse la 16D</span>';

// ───────────────────────── e1 · froide · le dock à cases (y1b + l'écran de la carte) ─────────────────────────
{
  const rows = F.map((f) => '<div class="e1-ba" data-f="' + f + '"><span class="e1-n">' + pi(f) + NOM[f] + '</span><span class="e1-p"><i class="e1-z" data-role="zone"></i><i class="e1-r" style="background:' + BA[f] + '"></i><i class="e1-av"></i></span><span class="e1-v"></span></div>').join('');
  const css = `
.e1-bars{display:flex;flex-direction:column;gap:3px}
.e1-ba{display:grid;grid-template-columns:92px 1fr 42px;align-items:center;gap:6px;min-height:19px}
.e1-n{display:flex;align-items:center;gap:4px}
.e1-p{position:relative;height:12px;background:#f1f2f5;border-radius:2px;overflow:hidden}
.e1-p i{position:absolute;top:0;bottom:0;left:0;display:block}
.e1-z{background:#d9dce3}
.e1-r{top:3px!important;bottom:3px!important;border-radius:2px}
.e1-av{width:3px;background:var(--encre)}
.e1-p.hach{background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,#f1f2f5 2px 6px)}
.e1-v{text-align:right;font-family:var(--mono);font-size:12px}
.e1-am{display:grid;grid-template-columns:70px 1fr auto;align-items:center;gap:8px;font-size:12px}
.e1-jt{position:relative;height:10px;background:#f1f2f5;border-radius:2px}
.e1-jt i{position:absolute;top:0;bottom:0;display:block;border-radius:2px}
.e1-j16{background:#d9dce3}
.e1-jb{background:#6b6b75}
.e1-ja.trop{background:var(--acc)}
.e1-ja.cru{background:repeating-linear-gradient(135deg,#9a9aa3 0 2px,#f1f2f5 2px 5px)}
.e1-ja.ok{background:var(--encre)}
.e1-ib{font-weight:600}
.e1-dock{position:fixed;left:50%;transform:translateX(-50%);bottom:0;width:100%;max-width:390px;background:#fff;border-top:1px solid #c9cad2;padding:30px 16px 8px;z-index:20;touch-action:none}
.e1-rail{position:relative;height:60px;cursor:pointer}
.e1-c{position:absolute;bottom:0;height:60px;display:block;padding:0 1px}
.e1-c b{position:absolute;left:1px;right:1px;bottom:4px;display:block;background:#bf86d6;border-radius:2px 2px 0 0}
.e1-c.ip b{opacity:.55}
.e1-c u{position:absolute;left:1px;right:1px;bottom:0;height:3px;display:block;background:#c9cdd6}
.e1-c.trop u{background:var(--acc)}
.e1-c.on{background:#f3e8f7;border-radius:2px}
.e1-c.on b{background:#9840bc;opacity:1}
.e1-zl{position:absolute;left:0;right:0;height:1px;background:#9840bc;opacity:.35}
.e1-pouce{position:absolute;top:-24px;transform:translateX(-50%);background:var(--encre);color:#fff;font:600 13px var(--sans);padding:2px 8px;border-radius:11px;white-space:nowrap}
.e1-lab{position:relative;height:16px;margin-top:3px;font-size:12px;color:var(--gris)}
.e1-lab span{position:absolute;transform:translateX(-50%);white-space:nowrap}
.e1-loupe{position:absolute;left:10px;right:10px;top:-34px;height:30px;display:none;background:#fff;border:1px solid #c9cad2;border-radius:8px;overflow:hidden}
body.touche .e1-loupe{display:block}
body.touche .e1-pouce{visibility:hidden}
.e1-loupe span{position:absolute;top:5px;transform:translateX(-50%);font:600 13px var(--mono);color:var(--gris)}
.e1-loupe span.ici{color:#fff;background:var(--encre);padding:0 6px;border-radius:4px}
.se-ecran{padding-bottom:140px}
`;
  const corps = '<p class="se-rep" id="rep"></p>'
    + '<section class="se-bloc e1-bars">' + rows + '</section>'
    + '<div class="se-bloc e1-am"><span>amertume</span><span class="e1-jt"><i class="e1-j16" style="left:29.4%;width:11.8%"></i><i class="e1-jb" style="left:0;width:35.3%"></i><i class="e1-ja"></i></span><span class="e1-ib se-num" id="e1-ib"></span></div>'
    + vrai('E08')
    + '<div class="e1-dock" data-libre="moment"><div class="e1-loupe" aria-hidden="true"></div>'
    + '<div class="e1-rail" role="slider" tabindex="0" aria-label="Moment de l\'ajout" aria-valuemin="0" aria-valuemax="23"><span class="e1-pouce" id="e1-pouce"></span></div>'
    + '<div class="e1-lab"><span style="left:2%">60′</span><span style="left:24%">30′</span><span style="left:40%">10′</span><span style="left:52%">WP</span><span style="left:67%">actif</span><span style="left:89%">après</span></div></div>';
  const js = String.raw`
var BO=[[0,48],[48,56],[57,78],[79,100]],X=cases(BO),rail=document.querySelector('.e1-rail'),lp=document.querySelector('.e1-loupe');
X.forEach(function(c,k){var e=document.createElement('i');e.className='e1-c'+(M[k].src==='interp'?' ip':'');e.style.left=c.x+'%';e.style.width=c.w+'%';e.innerHTML='<b></b><u></u>';e.dataset.k=k;rail.insertBefore(e,rail.firstChild);});
var zl=document.createElement('i');zl.className='e1-zl';rail.appendChild(zl);
function poser(i){SE.i=i;var p=M[i];aria(rail,i);document.getElementById('rep').innerHTML=reponse(i);
  document.querySelectorAll('.e1-ba').forEach(function(r){var f=r.dataset.f,pi=r.querySelector('.e1-p'),v=r.querySelector('.e1-v');
    r.querySelector('.e1-z').style.width=zp(f)+'%';r.querySelector('.e1-av').style.left='calc('+pc(f,AV[f])+'% - 1px)';
    if(inc(f)){pi.classList.add('hach');r.querySelector('.e1-r').hidden=true;r.querySelector('.e1-av').hidden=true;v.textContent='?';v.style.color='#55555f';return;}
    r.querySelector('.e1-r').style.width=pc(f,p.v[f])+'%';var d=dl(i,f);v.textContent=Math.abs(d)>=0.5?tl(i)+sg(d):'';v.style.color=p.v[f]>B[f]?'#c2410c':T[f];});
  var t=ibuT(i),ja=document.querySelector('.e1-ja');ja.className='e1-ja '+(t==null?'cru':t>70?'trop':'ok');
  ja.style.left='35.3%';ja.style.width=(t==null?4:Math.min(64.7,p.ibu/170*100))+'%';
  var ib=document.getElementById('e1-ib');ib.textContent=amerTxt(i);ib.style.color=t!=null&&t>70?'#c2410c':'';
  document.querySelectorAll('.e1-c').forEach(function(c){var k=+c.dataset.k;c.classList.toggle('on',k===i);c.classList.toggle('trop',trop(k));c.querySelector('b').style.height=Math.max(2,pc('floral',M[k].v.floral)*1.1)+'px';});
  zl.style.bottom=(4+Math.min(55,zp('floral')*1.1))+'px';
  var pu=document.getElementById('e1-pouce');pu.textContent=p.lib;pu.style.left=Math.max(9,Math.min(91,X[i].x+X[i].w/2))+'%';
  lp.innerHTML='';var w=lp.clientWidth||340;for(var k=i-2;k<=i+2;k++){if(k<0||k>=M.length)continue;var s=document.createElement('span');s.textContent=M[k].court;if(k===i)s.className='ici';s.style.left=(w/2+(k-i)*64)+'px';lp.appendChild(s);}}
window.poser=poser;
glisser(rail,function(e){var r=rail.getBoundingClientRect();return proche(X.map(function(c){return c.x+c.w/2;}),(e.clientX-r.left)/r.width*100);},poser);
`;
  ecrire('e1', page({ id: 'e1', css, avant: etapes(), corps, legende: LEG_BASE + '<span>Le dock : chaque case est un moment, sa hauteur le floral ; trait orangé : trop amer</span>', js }));
}

// ───────────────────────── e2 · froide · x3b réduit : la cuve jour après jour ─────────────────────────
{
  const cols = F.map((f) => '<div class="e2-col" data-f="' + f + '"><span class="e2-tr"><i class="e2-z" data-role="zone"></i><i class="e2-av"></i><i class="e2-ap" style="background:' + BA[f] + '"></i></span>' + pi(f) + '<span class="e2-d"></span></div>').join('');
  const css = `
.e2-cuve{padding:8px 10px 6px}
.e2-lig{position:relative;height:20px;margin:2px 0}
.e2-lev{position:absolute;top:2px;bottom:2px;border-radius:4px;font-size:12px;display:flex;align-items:center;padding-left:6px;color:#4b2a63;white-space:nowrap;overflow:hidden}
.e2-lev.a{background:#ece0f3}
.e2-lev.r{background:#f1f2f5;color:var(--gris)}
.e2-bu{position:absolute;top:2px;bottom:2px;border-radius:4px;background:#f6eadf;font-size:12px;display:flex;align-items:center;padding-left:6px;color:#7a3a0c}
.e2-row{position:relative;height:34px;touch-action:none;cursor:pointer}
.e2-rowt{position:absolute;left:0;right:0;top:15px;height:4px;background:#e3e5eb;border-radius:2px}
.e2-blk{position:absolute;top:6px;height:22px;border-radius:4px;background:#9840bc;color:#fff;font:600 12px var(--sans);display:flex;align-items:center;padding-left:6px;white-space:nowrap;min-width:10px}
.e2-blk .e2-sg{position:absolute;top:0;bottom:0;right:0;border-radius:0 4px 4px 0;background:repeating-linear-gradient(135deg,#9840bc 0 2px,#f3e8f7 2px 6px)}
.e2-rw{position:relative}
.e2-poig{position:absolute;top:2px;width:22px;height:30px;margin-left:-11px;display:flex;align-items:center;justify-content:center;touch-action:none;cursor:ew-resize}
.e2-poig::before{content:"";width:6px;height:24px;border-radius:3px;background:var(--encre)}
.e2-ax{position:relative;height:16px;font-size:12px;color:var(--gris)}
.e2-ax span{position:absolute;transform:translateX(-50%);white-space:nowrap}
.e2-sg-l{font-size:12px;color:#6a2d86;margin-top:2px;min-height:15px}
.e2-cmp{display:flex;flex-direction:column;gap:6px}
.e2-ct{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600}
.e2-ct i{display:inline-block;width:14px;height:6px;border-radius:2px}
.e2-cols{display:grid;grid-template-columns:repeat(12,1fr);gap:4px}
.e2-col{display:flex;flex-direction:column;align-items:center;gap:3px}
.e2-tr{position:relative;width:14px;height:96px;background:#f1f2f5;border-radius:2px;overflow:hidden}
.e2-tr i{position:absolute;left:0;right:0;bottom:0;display:block}
.e2-z{background:#d9dce3}
.e2-av{left:0!important;right:auto!important;width:4px;background:#6b6b75}
.e2-ap{left:5px!important;border-radius:2px 2px 0 0}
.e2-tr.hach{background:repeating-linear-gradient(135deg,#c9cdd6 0 2px,#f1f2f5 2px 6px)}
.e2-d{font:12px var(--mono);writing-mode:vertical-rl;transform:rotate(180deg);min-height:28px}
`;
  const corps = '<p class="se-rep" id="rep"></p>'
    + '<section class="se-bloc e2-cuve" data-libre="moment">'
    + '<div class="e2-lig"><span class="e2-bu" style="left:0;width:21%">ébullition</span><span class="e2-lev a" style="left:28%;width:24%">levure active</span><span class="e2-lev r" style="left:52%;width:48%">levure au repos</span></div>'
    + '<div class="e2-rw"><div class="e2-row" role="slider" tabindex="0" aria-label="Moment de l\'ajout" aria-valuemin="0" aria-valuemax="23"><span class="e2-rowt"></span><span class="e2-blk" id="e2-blk"><span class="e2-bt"></span><i class="e2-sg"></i></span></div>'
    + '<div class="e2-poig" id="e2-poig" role="slider" tabindex="0" aria-label="Jours de contact" aria-valuemin="1" aria-valuemax="7"></div></div>'
    + '<div class="e2-ax"><span style="left:2%">60′</span><span style="left:11%">30′</span><span style="left:20%">0′</span><span style="left:25.5%">WP</span><span style="left:40%">J2</span><span style="left:52%">J4</span><span style="left:64%">J6</span><span style="left:76%">J8</span><span style="left:88%">J10</span></div>'
    + '<p class="e2-sg-l" id="e2-sgl"></p></section>'
    + '<section class="se-bloc e2-cmp"><p class="e2-ct">Ma bière <i style="background:#6b6b75"></i> → + Idaho 7 <i style="background:#bf86d6"></i></p><div class="e2-cols">' + cols + '</div></section>'
    + vrai('E10') + pont();
  const js = String.raw`
var row=document.querySelector('.e2-row'),blk=document.getElementById('e2-blk'),pg=document.getElementById('e2-poig'),cuve=document.querySelector('.e2-cuve');
var DX=function(d){return 28+d*6;},JOURS=[1,2,3,5,7],jour=3;
function debut(k){var p=M[k];if(p.seg===0)return 21*(60-p.min)/60;if(p.seg===1)return 25;return p.seg===2?DX(1):DX(5);}
var POS=[];for(var k=0;k<14;k++)POS.push(k);POS.push(SE.SEGS[2][0]);POS.push(SE.SEGS[3][0]);
function versIdx(pos,j){var k=POS[pos];if(k<14)return k;return k+JOURS.indexOf(j);}
function poser(i){SE.i=i;var p=M[i];if(p.j)jour=p.j;aria(row,i);document.getElementById('rep').innerHTML=reponse(i);
  var x=debut(i),w=p.j?p.j*6:2.6;blk.style.left=x+'%';blk.style.width=w+'%';blk.querySelector('.e2-bt').textContent=p.j?p.j+' j':'';
  var hz=blk.querySelector('.e2-sg');if(p.j&&p.j>2){hz.hidden=false;hz.style.width=((p.j-2)/p.j*100)+'%';}else hz.hidden=true;
  blk.style.background=trop(i)?'#c2410c':'';
  pg.hidden=!p.j;if(p.j){pg.style.left='calc('+(x+w)+'% * 1 + 0px)';pg.setAttribute('aria-valuenow',p.j);pg.setAttribute('aria-valuetext',p.j+' j de contact');}
  document.getElementById('e2-sgl').innerHTML=p.j?(p.j>2?'<b>'+p.lib+'</b> · '+(p.j-2)+' j sans gain ~':'<b>'+p.lib+'</b>'):'<b>'+p.lib+'</b> · '+(trop(i)?'<span class="se-al">'+amerTxt(i)+'</span>':amerTxt(i));
  document.querySelectorAll('.e2-col').forEach(function(c){var f=c.dataset.f,tr=c.querySelector('.e2-tr'),d=c.querySelector('.e2-d');
    c.querySelector('.e2-z').style.height=zp(f)+'%';
    if(inc(f)){tr.classList.add('hach');c.querySelector('.e2-av').hidden=true;c.querySelector('.e2-ap').hidden=true;d.textContent='?';d.style.color='#55555f';d.style.writingMode='horizontal-tb';d.style.transform='none';return;}
    c.querySelector('.e2-av').style.height=pc(f,AV[f])+'%';c.querySelector('.e2-ap').style.height=pc(f,p.v[f])+'%';
    var dd=dl(i,f);d.textContent=Math.abs(dd)>=0.5?tl(i)+sg(dd):'·';d.style.color=p.v[f]>B[f]?'#c2410c':T[f];});}
window.poser=poser;
var PX=POS.map(function(k){return debut(k)+0.5;});
glisser(row,function(e){var r=row.getBoundingClientRect();return versIdx(proche(PX,(e.clientX-r.left)/r.width*100),jour);},poser);
glisser(pg,function(e){var r=row.getBoundingClientRect(),v=(e.clientX-r.left)/r.width*100,p=M[SE.i];if(!p.j)return null;var j=JOURS[proche(JOURS.map(function(j){return debut(SE.i)+j*6;}),v)];return SE.i-JOURS.indexOf(p.j)+JOURS.indexOf(j);},poser);
`;
  ecrire('e2', page({ id: 'e2', css, corps, legende: LEG_BASE + '<span>Le bloc violet : Idaho 7 dans la cuve ; hachuré : jours sans gain (simulé)</span><span>Barre grise : ma bière ; violette : avec Idaho 7</span>', js }));
}

// ───────────────────────── e3 · tiède · quatre cases qui s'ouvrent ─────────────────────────
{
  const FS = ['floral', 'citrus', 'tropical', 'berries', 'resin', 'green'];
  const caseH = (s, nom, court) => '<div class="e3-case" data-s="' + s + '"><span class="e3-cn"><span class="e3-l">' + nom + '</span><span class="e3-lc">' + ['Ébu.', 'WP', 'actif', 'après'][s] + '</span><span class="e3-s">' + court + '</span></span><span class="e3-bars">'
    + FS.map((f) => '<span class="e3-b" data-f="' + f + '"><i class="e3-z" data-role="zone"></i><i class="e3-f" style="background:' + BA[f] + '"></i></span>').join('')
    + '</span><span class="e3-pic">' + FS.map((f) => pi(f, 12, 'e3-pi')).join('') + '</span><span class="e3-ibu se-num"></span><span class="e3-k"></span></div>';
  const css = `
.e3-fr{display:flex;gap:4px;align-items:stretch;height:208px;touch-action:none;cursor:pointer}
.e3-case{flex:1 1 0;min-width:0;background:#fff;border:1px solid #d9dce3;border-radius:8px;padding:6px 4px;display:flex;flex-direction:column;gap:4px;transition:flex-grow .18s ease-out}
.e3-case.on{flex-grow:2.6;border:2px solid var(--encre)}
.e3-cn{display:flex;flex-direction:column;align-items:center;line-height:1.1}
.e3-l{font-weight:600;font-size:13px;white-space:nowrap}
.e3-lc{display:none;font-weight:600;font-size:12px}
.e3-case:not(.on) .e3-l{display:none}
.e3-case:not(.on) .e3-lc{display:block}
.e3-s{font-size:12px;color:var(--gris);font-family:var(--mono)}
.e3-bars{flex:1;display:flex;gap:2px;align-items:stretch;justify-content:center}
.e3-b{position:relative;flex:1;max-width:16px;background:#f1f2f5;border-radius:2px;overflow:hidden}
.e3-b i{position:absolute;left:0;right:0;bottom:0;display:block}
.e3-z{background:#d9dce3}
.e3-f{border-radius:2px 2px 0 0}
.e3-pic{display:flex;gap:2px;justify-content:center}
.e3-case:not(.on) .e3-pic{display:none}
.e3-ibu{text-align:center;font-size:12px;border-radius:4px;padding:1px 0}
.e3-ibu.trop{color:#fff;background:var(--acc)}
.e3-k{text-align:center;font-size:12px;color:#6a2d86;font-weight:600;min-height:15px}
.e3-lev{flex:0 0 60px;border:1px dashed #9a9aa3;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:12px;text-align:center;padding:4px;color:var(--encre);background:#f7f7f9}
.e3-lev b{font-size:13px}
.e3-sub{position:relative;height:40px;background:#fff;border-radius:8px;touch-action:none;cursor:pointer;padding:0 14px}
.e3-st{position:absolute;left:14px;right:14px;top:12px;height:4px;background:#e3e5eb;border-radius:2px}
.e3-tk{position:absolute;top:22px;transform:translateX(-50%);font-size:12px;color:var(--gris);font-family:var(--mono)}
.e3-tk.on{color:#fff;background:var(--encre);border-radius:4px;padding:0 4px}
.e3-pt{position:absolute;top:6px;width:16px;height:16px;margin-left:-8px;border-radius:50%;background:var(--encre)}
`;
  const corps = '<p class="se-rep" id="rep"></p>'
    + '<div data-libre="moment" class="e3-lib"><div class="e3-fr" role="slider" tabindex="0" aria-label="Moment : l\'étape" aria-valuemin="0" aria-valuemax="3">'
    + caseH(0, 'Ébullition', '') + caseH(1, 'Whirlpool', 'WP') + caseH(2, 'Actif', '') + caseH(3, 'Après', '')
    + '<a class="e3-lev" href="../../../fils22-carte/levure-etape/etat.html"><b>2 Levure ›</b><span>Pomona</span><span>agrumes</span><span class="se-num">~+13</span></a></div>'
    + '<div class="e3-sub" role="slider" tabindex="0" aria-label="Moment : minute ou jour" aria-valuemin="0" aria-valuemax="23"><span class="e3-st"></span></div></div>'
    + vrai('E03');
  const js = String.raw`
var fr=document.querySelector('.e3-fr'),sub=document.querySelector('.e3-sub'),MEM={0:IDX0,1:13,2:SE.DEPART,3:SE.DEPART+5};
var FS=['floral','citrus','tropical','berries','resin','green'];
function poser(i){SE.i=i;var p=M[i];MEM[p.seg]=i;aria(sub,i);fr.setAttribute('aria-valuenow',p.seg);fr.setAttribute('aria-valuetext',p.lib);
  document.getElementById('rep').innerHTML=reponse(i);
  document.querySelectorAll('.e3-case').forEach(function(c){var s=+c.dataset.s,k=MEM[s],q=M[k];c.classList.toggle('on',s===p.seg);
    c.querySelector('.e3-s').textContent=q.seg===1?'':q.court;
    c.querySelectorAll('.e3-b').forEach(function(b){var f=b.dataset.f;b.querySelector('.e3-z').style.height=zp(f)+'%';var fi=b.querySelector('.e3-f');var h=pc(f,q.v[f]),z=zp(f);fi.style.height=h+'%';fi.style.background=h>z?'linear-gradient(to top,'+BA[f]+' 0 '+(z/h*100)+'%,#c2410c '+(z/h*100)+'% 100%)':BA[f];fi.style.opacity=q.src==='interp'?.6:1;});
    var t=ibuT(k),ib=c.querySelector('.e3-ibu');ib.textContent=t==null?'IBU ?':(t>70?'':'≈ ')+t+' IBU';ib.classList.toggle('trop',t!=null&&t>70);
    c.querySelector('.e3-k').textContent=s===p.seg?'floral '+tl(k)+sg(dl(k,'floral')):'';});
  var r=SE.SEGS[p.seg],n=r[1]-r[0];sub.querySelectorAll('.e3-tk,.e3-pt').forEach(function(x){x.remove();});
  for(var k=r[0];k<r[1];k++){var x=n===1?50:(k-r[0])/(n-1)*100,s=document.createElement('span');s.className='e3-tk'+(k===i?' on':'');s.textContent=M[k].court;
    if(p.seg===0&&(k-r[0])%2===1&&k!==i)s.textContent='';s.style.left='calc(14px + (100% - 28px) * '+x/100+')';sub.appendChild(s);
    if(k===i){var pt=document.createElement('i');pt.className='e3-pt';pt.style.left=s.style.left;sub.appendChild(pt);}}}
window.poser=poser;
glisser(fr,function(e){var cs=[].slice.call(document.querySelectorAll('.e3-case'));for(var s=0;s<cs.length;s++){var b=cs[s].getBoundingClientRect();if(e.clientX>=b.left-2&&e.clientX<=b.right+2)return MEM[s];}return null;},poser);
glisser(sub,function(e){var b=sub.getBoundingClientRect(),v=(e.clientX-b.left-14)/(b.width-28),r=SE.SEGS[M[SE.i].seg],n=r[1]-r[0];return r[0]+Math.max(0,Math.min(n-1,Math.round(v*(n-1))));},poser);
`.split('IDX0').join(String(IDX.b10));
  ecrire('e3', page({ id: 'e3', css, corps, legende: LEG_BASE + '<span>Chaque case est une étape du brassin ; touche-la pour l\'ouvrir, puis règle la minute ou le jour dessous</span>', js }));
}

// ───────────────────────── e4 · tiède · la frise debout, le spectre du brassin ─────────────────────────
{
  const FS = ['floral', 'citrus', 'tropical', 'stoneFruit', 'berries', 'resin', 'green'];
  const sep = { 0: 'ébullition', 13: '', 14: 'fermentation active', 19: 'après fermentation' };
  let rows = '';
  M.forEach((p, k) => {
    if (sep[k]) rows += '<div class="e4-sep">' + sep[k] + '</div>';
    rows += '<div class="e4-r' + (p.src === 'interp' ? ' ip' : '') + '" data-k="' + k + '"><span class="e4-lb">' + (p.seg === 1 ? 'WP' : p.court) + '</span>'
      + FS.map((f) => '<span class="e4-c" data-f="' + f + '"><i class="e4-z" data-role="zone"></i><i class="e4-f" style="background:' + BA[f] + '"></i></span>').join('')
      + '<span class="e4-i se-num"></span></div>';
  });
  const css = `
.e4-g{background:#fff;border-radius:8px;padding:4px 6px 6px;touch-action:none;cursor:pointer;position:relative}
.e4-h,.e4-r{display:grid;grid-template-columns:34px repeat(7,1fr) 38px;gap:3px;align-items:center}
.e4-h{height:20px;justify-items:center}
.e4-h span:last-child{font-size:12px;color:var(--gris)}
.e4-r{height:17px;border-radius:4px}
.e4-r.on{background:var(--encre)}
.e4-r.on .e4-lb,.e4-r.on .e4-i{color:#fff}
.e4-lb{font:12px var(--mono);color:var(--gris);text-align:right;padding-right:2px}
.e4-c{position:relative;height:9px;background:#f1f2f5;border-radius:2px;overflow:hidden}
.e4-c i{position:absolute;top:0;bottom:0;left:0;display:block}
.e4-z{background:#d9dce3}
.e4-r.ip .e4-f{opacity:.55}
.e4-r.on .e4-c{height:11px}
.e4-i{font-size:12px;text-align:right;padding-right:2px}
.e4-i.trop{color:var(--acc);font-weight:600}
.e4-r.on .e4-i.trop{color:#ffb38a}
.e4-sep{font-size:12px;color:#6a2d86;font-weight:600;height:15px;padding-left:38px;margin-top:2px}
`;
  const corps = '<p class="se-rep" id="rep"></p>'
    + '<div data-libre="moment"><div class="e4-g" role="slider" tabindex="0" aria-label="Moment de l\'ajout" aria-valuemin="0" aria-valuemax="23" aria-orientation="vertical">'
    + '<div class="e4-h"><span></span>' + FS.map((f) => pi(f)).join('') + '<span>IBU</span></div>' + rows + '</div></div>'
    + vrai('E05') + pont();
  const js = String.raw`
var g=document.querySelector('.e4-g'),R=[].slice.call(document.querySelectorAll('.e4-r'));
function poser(i){SE.i=i;aria(g,i);document.getElementById('rep').innerHTML=reponse(i);
  R.forEach(function(r){var k=+r.dataset.k,q=M[k];r.classList.toggle('on',k===i);
    r.querySelectorAll('.e4-c').forEach(function(c){var f=c.dataset.f;c.querySelector('.e4-z').style.width=zp(f)+'%';var fi=c.querySelector('.e4-f');var h=pc(f,q.v[f]),z=zp(f);fi.style.width=h+'%';fi.style.background=h>z?'linear-gradient(to right,'+BA[f]+' 0 '+(z/h*100)+'%,#c2410c '+(z/h*100)+'% 100%)':BA[f];});
    var t=ibuT(k),e=r.querySelector('.e4-i');e.textContent=t==null?'?':t;e.classList.toggle('trop',t!=null&&t>70);});}
window.poser=poser;
glisser(g,function(e){for(var n=0;n<R.length;n++){var b=R[n].getBoundingClientRect();if(e.clientY<b.bottom+1)return +R[n].dataset.k;}return M.length-1;},poser);
`;
  ecrire('e4', page({ id: 'e4', css, corps, legende: LEG_BASE + '<span>Une ligne par moment, du haut (60′) au bas (7 j après) ; barres orangées : hors du style. Fais glisser le doigt de haut en bas</span>', js }));
}

// ───────────────────────── e5 · tiède · ce qu'on gagne, ce qu'on paie ─────────────────────────
{
  const css = `
.e5-ch{background:#fff;border-radius:8px;padding:8px 8px 6px;display:flex;flex-direction:column;gap:2px}
.e5-lg{display:flex;align-items:center;gap:4px;font-size:12px;color:var(--gris)}
.e5-lg b{color:var(--encre);font-weight:600}
.e5-pl{position:relative;height:200px;touch-action:none;cursor:pointer}
.e5-zh{position:absolute;bottom:80px;left:0;right:0;background:#f3e8f7;display:block}
.e5-ax{position:absolute;left:0;right:0;bottom:79px;height:2px;background:var(--encre)}
.e5-c{position:absolute;bottom:0;height:200px;display:block}
.e5-c .h{position:absolute;bottom:81px;left:1px;right:1px;background:#bf86d6;border-radius:2px 2px 0 0;display:block}
.e5-c .b{position:absolute;top:121px;left:1px;right:1px;display:block;border-radius:0 0 2px 2px}
.e5-c .b.ibu{background:#9a9aa3}
.e5-c .b.ibu.trop{background:var(--acc)}
.e5-c .b.res{background:#2f6b5f}
.e5-c .b2{position:absolute;left:1px;right:1px;display:block;background:#6aa33a}
.e5-c .b.cru{background:repeating-linear-gradient(135deg,#9a9aa3 0 2px,#fff 2px 5px)}
.e5-c.ip .h{opacity:.55}
.e5-c.on{background:#ececf1;border-radius:2px}
.e5-c.on .h{background:#9840bc}
.e5-tag{position:absolute;transform:translateX(-50%);font:600 12px var(--mono);white-space:nowrap;padding:0 4px;border-radius:4px;background:#fff}
.e5-lab{position:relative;height:16px;font-size:12px;color:var(--gris)}
.e5-lab span{position:absolute;transform:translateX(-50%);white-space:nowrap}
.e5-fin{display:flex;justify-content:flex-end;align-items:center;gap:6px}
.e5-lev{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border:1px dashed #9a9aa3;border-radius:15px;font-size:13px;background:#fff}
.e5-lev b{font-weight:600}
`;
  const corps = '<p class="se-rep" id="rep"></p>'
    + '<section class="e5-ch" data-libre="moment">'
    + '<p class="e5-lg">' + pi('floral') + '<b>on gagne</b> du floral</p>'
    + '<div class="e5-pl" role="slider" tabindex="0" aria-label="Moment de l\'ajout" aria-valuemin="0" aria-valuemax="23"><i class="e5-zh" data-role="zone"></i><i class="e5-ax"></i></div>'
    + '<p class="e5-lg"><b>on paie</b> amertume <i style="display:inline-block;width:10px;height:8px;background:#c2410c;border-radius:2px"></i> · ' + pi('resin') + ' résineux · ' + pi('green') + ' végétal</p>'
    + '<div class="e5-lab"><span style="left:3%">60′</span><span style="left:20%">30′</span><span style="left:34%">10′</span><span style="left:48%">WP</span><span style="left:64%">actif</span><span style="left:88%">après</span></div></section>'
    + '<div class="e5-fin"><a class="e5-lev" href="../../../fils22-carte/levure-etape/etat.html">puis <b>2 Levure ›</b></a></div>'
    + vrai('E04');
  const js = String.raw`
var BO=[[0,44],[45,52],[53,76],[77,100]],X=cases(BO),pl=document.querySelector('.e5-pl'),zh=document.querySelector('.e5-zh');
X.forEach(function(c,k){var e=document.createElement('i');e.className='e5-c'+(M[k].src==='interp'?' ip':'');e.style.left=c.x+'%';e.style.width=c.w+'%';e.dataset.k=k;e.innerHTML='<i class="h"></i><i class="b"></i><i class="b2"></i>';pl.appendChild(e);});
var t1=document.createElement('span');t1.className='e5-tag';pl.appendChild(t1);var t2=document.createElement('span');t2.className='e5-tag';pl.appendChild(t2);
function haut(k){return Math.max(1,Math.min(118,pc('floral',M[k].v.floral)*2.36));}
function poser(i){SE.i=i;aria(pl,i);document.getElementById('rep').innerHTML=reponse(i);zh.style.height=Math.min(118,zp('floral')*2.36)+'px';
  document.querySelectorAll('.e5-c').forEach(function(c){var k=+c.dataset.k,q=M[k],h=c.querySelector('.h'),b=c.querySelector('.b'),b2=c.querySelector('.b2');c.classList.toggle('on',k===i);
    h.style.height=haut(k)+'px';
    if(q.ibu!=null){b.className='b ibu'+(trop(k)?' trop':'');b.style.height=Math.max(2,q.ibu/110*70)+'px';b2.style.height='0';}
    else{var r=Math.max(0,dl(k,'resin')),gr=Math.max(0,dl(k,'green'));b.className='b res';b.style.height=Math.max(2,r*2.2)+'px';b2.style.top=(121+r*2.2)+'px';b2.style.height=(gr*2.2)+'px';}});
  var c=X[i],cx=c.x+c.w/2;t1.style.left=Math.max(8,Math.min(92,cx))+'%';t1.style.bottom=(84+haut(i))+'px';t1.style.color=T.floral;t1.textContent=tl(i)+sg(dl(i,'floral'));
  var q=M[i];t2.style.left=Math.max(10,Math.min(90,cx))+'%';t2.style.bottom='4px';
  if(q.ibu!=null){t2.textContent=(trop(i)?'':'≈ ')+ibuT(i)+' IBU';t2.style.color=trop(i)?'#c2410c':'#55555f';}else{t2.textContent='résineux '+tl(i)+sg(dl(i,'resin'));t2.style.color='#c2410c';}}
window.poser=poser;
glisser(pl,function(e){var r=pl.getBoundingClientRect();return proche(X.map(function(c){return c.x+c.w/2;}),(e.clientX-r.left)/r.width*100);},poser);
`;
  ecrire('e5', page({ id: 'e5', css, corps, legende: LEG_BASE + '<span>Au-dessus de l\'axe ce qu\'Idaho 7 apporte en floral ; dessous ce qu\'il coûte : amertume à l\'ébullition, résineux et végétal en dry hop</span>', js }));
}

// ───────────────────────── e6 · tiède · la frise de radars ─────────────────────────
{
  const MINI = ['b60', 'b10', 'wp', 'dryActive|3', 'dryPost|3'];
  const css = `
.e6-gr{background:#fff;border-radius:8px;padding:6px;display:flex;justify-content:center;position:relative}
.e6-mi{display:grid;grid-template-columns:repeat(5,1fr);gap:4px}
.e6-m{background:#fff;border:1px solid #d9dce3;border-radius:8px;padding:4px 2px;display:flex;flex-direction:column;align-items:center;gap:2px}
.e6-m.on{border:2px solid var(--encre)}
.e6-m b{font-size:12px}
.e6-m span{font:12px var(--mono);color:var(--gris)}
.e6-m span.trop{color:var(--acc);font-weight:600}
.e6-rl{position:relative;height:46px;background:#fff;border-radius:8px;touch-action:none;cursor:pointer}
.e6-tr{position:absolute;left:14px;right:14px;top:14px;height:4px;border-radius:2px;background:#e3e5eb}
.e6-tk{position:absolute;top:10px;width:1px;height:12px;background:#9a9aa3}
.e6-pt{position:absolute;top:7px;width:18px;height:18px;margin-left:-9px;border-radius:50%;background:var(--encre)}
.e6-lb{position:absolute;top:27px;transform:translateX(-50%);font-size:12px;color:var(--gris);white-space:nowrap}
.e6-lb.on{color:var(--encre);font-weight:600}
`;
  const corps = '<p class="se-rep" id="rep"></p>'
    + '<div class="e6-gr"><svg id="e6-big" width="250" height="232" viewBox="-125 -116 250 232" data-radar data-axes="floral,herbal,earthy,citrus,tropical,stoneFruit,pomeFruit,berries,melon,resin,spice,green" aria-label="Radar de ma stout avec Idaho 7"></svg></div>'
    + '<div data-libre="moment" style="display:flex;flex-direction:column;gap:6px"><div class="e6-mi">' + MINI.map((id) => '<div class="e6-m" data-id="' + id + '"><svg width="58" height="58" viewBox="-29 -29 58 58"></svg><b></b><span></span></div>').join('') + '</div>'
    + '<div class="e6-rl" role="slider" tabindex="0" aria-label="Moment de l\'ajout" aria-valuemin="0" aria-valuemax="23"><span class="e6-tr"></span></div></div>'
    + vrai('E01') + pont();
  const js = String.raw`
var BO=[[0,46],[48,54],[56,77],[79,100]],X=cases(BO),rl=document.querySelector('.e6-rl'),NS='http://www.w3.org/2000/svg';
var MINI=[].slice.call(document.querySelectorAll('.e6-m'));
function el(n,a){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);return e;}
function pt(k,r){var a=2*Math.PI*k/F.length;return [r*Math.sin(a),-r*Math.cos(a)];}
function poly(vals,R){return F.map(function(f,k){var p=pt(k,Math.max(0.04,Math.min(1,vals(f)))*R);return p[0].toFixed(1)+','+p[1].toFixed(1);}).join(' ');}
function radar(svg,i,R,grand){svg.innerHTML='';
  svg.appendChild(el('polygon',{points:poly(function(f){return zp(f)/100;},R),fill:'#eceef2',stroke:'none','data-role':'zone'}));
  [0.5,1].forEach(function(s){svg.appendChild(el('circle',{r:R*s,fill:'none',stroke:'#d9dce3'}));});
  F.forEach(function(f,k){var p=pt(k,R);svg.appendChild(el('line',{x1:0,y1:0,x2:p[0],y2:p[1],stroke:'#e3e5eb'}));});
  if(grand)svg.appendChild(el('polygon',{points:poly(function(f){return pc(f,AV[f])/100;},R),fill:'none',stroke:'#6b6b75','stroke-width':1.5}));
  svg.appendChild(el('polygon',{points:poly(function(f){return inc(f)?0:pc(f,M[i].v[f])/100;},R),fill:'rgba(191,134,214,.28)',stroke:'#9840bc','stroke-width':grand?2:1.5}));
  if(grand)F.forEach(function(f,k){var p=pt(k,R+14),u=el('use',{href:'#p-'+f,x:p[0]-8,y:p[1]-8,width:16,height:16});var g=el('svg',{x:p[0]-8,y:p[1]-8,width:16,height:16,'data-famille':f,'aria-label':SE.NOM[f],style:'stroke:'+T[f]});g.appendChild(el('use',{href:'#p-'+f}));svg.appendChild(g);
    if(inc(f)){var q=pt(k,R*0.5);var t=el('text',{x:q[0],y:q[1]+4,'text-anchor':'middle','font-size':12,fill:'#55555f'});t.textContent='?';svg.appendChild(t);}});}
X.forEach(function(c,k){var t=document.createElement('i');t.className='e6-tk';t.style.left='calc(14px + (100% - 28px) * '+(c.x+c.w/2)/100+')';rl.appendChild(t);});
var pu=document.createElement('i');pu.className='e6-pt';rl.appendChild(pu);
var LB=[[0,'60′'],[6,'30′'],[10,'10′'],[13,'WP'],[16,'actif'],[21,'après']].map(function(a){var s=document.createElement('span');s.className='e6-lb';s.textContent=a[1];s.dataset.k=a[0];s.style.left='calc(14px + (100% - 28px) * '+(X[a[0]].x+X[a[0]].w/2)/100+')';rl.appendChild(s);return s;});
function poser(i){SE.i=i;aria(rl,i);document.getElementById('rep').innerHTML=reponse(i);radar(document.getElementById('e6-big'),i,88,true);
  var cur=M[i].seg===0?(M[i].min>=35?0:1):M[i].seg+1;
  MINI.forEach(function(m,n){var k=M.findIndex(function(p){return p.id===m.dataset.id;});if(n===cur)k=i;m.classList.toggle('on',n===cur);radar(m.querySelector('svg'),k,26,false);
    m.querySelector('b').textContent=M[k].seg===1?'WP':M[k].seg===2?'actif':M[k].seg===3?'après':M[k].lib;var t=ibuT(k),s=m.querySelector('span');s.textContent=t==null?'à cru ?':t+' IBU';s.classList.toggle('trop',t!=null&&t>70);});
  pu.style.left='calc(14px + (100% - 28px) * '+(X[i].x+X[i].w/2)/100+')';LB.forEach(function(s){s.classList.toggle('on',M[+s.dataset.k].seg===M[i].seg);});}
window.poser=poser;
glisser(rl,function(e){var r=rl.getBoundingClientRect();return proche(X.map(function(c){return c.x+c.w/2;}),(e.clientX-r.left-14)/(r.width-28)*100);},poser);
`;
  ecrire('e6', page({ id: 'e6', css, corps, legende: LEG_BASE + '<span>Radar : gris, ma stout ; violet, avec Idaho 7 à ce moment. En bas, la frise des radars</span>', js }));
}

// ───────────────────────── e7 · chaude · le cadran du brassin ─────────────────────────
{
  const css = `
.e7-d{position:relative;background:#fff;border-radius:8px;display:flex;justify-content:center;padding:4px 0;touch-action:none;cursor:pointer}
.e7-ce{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:2px;text-align:center;pointer-events:none;width:150px}
.e7-mo{font-weight:600;font-size:16px}
.e7-fl{display:flex;align-items:center;gap:4px;font:600 16px var(--mono);color:#9840bc}
.e7-l2{font-size:12px}
.e7-x{display:flex;align-items:center;gap:3px;font:12px var(--mono)}
.e7-x svg+span{margin-right:6px}
.e7-lev{position:absolute;font-size:12px;font-weight:600;padding:2px 8px;border:1px dashed #9a9aa3;border-radius:11px;background:#fff;white-space:nowrap}
`;
  const corps = '<p class="se-rep" id="rep"></p>'
    + '<div data-libre="moment"><div class="e7-d" role="slider" tabindex="0" aria-label="Moment de l\'ajout" aria-valuemin="0" aria-valuemax="23"><svg id="e7-s" width="340" height="340" viewBox="-170 -170 340 340"></svg>'
    + '<div class="e7-ce"><span class="e7-mo" id="e7-mo"></span><span class="e7-fl">' + pi('floral', 18) + '<span id="e7-fl"></span></span><span class="e7-l2" id="e7-a"></span><span class="e7-x">' + pi('citrus', 14) + '<span id="e7-ci" style="color:#856e0c"></span>' + pi('berries', 14) + '<span id="e7-be" style="color:#9b3f74"></span></span><span class="e7-l2 se-al" id="e7-r"></span></div>'
    + '<a class="e7-lev" id="e7-lev" href="../../../fils22-carte/levure-etape/etat.html">2 Levure ›</a></div></div>'
    + vrai('E07');
  const js = String.raw`
var d=document.querySelector('.e7-d'),s=document.getElementById('e7-s'),NS='http://www.w3.org/2000/svg';
var A0=-150,SPAN=[[0,124],[128,146],[150,226],[230,306]];
var ANG=M.map(function(p,k){var r=SE.SEGS[p.seg],n=r[1]-r[0],a=SPAN[p.seg][0],b=SPAN[p.seg][1],w=(b-a)/n;return {a:A0+a+w*(k-r[0]),w:w};});
function el(n,a){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);return e;}
function P(a,r){var t=(a-90)*Math.PI/180;return [r*Math.cos(t),r*Math.sin(t)];}
function arc(a1,a2,r1,r2){var p1=P(a1,r2),p2=P(a2,r2),p3=P(a2,r1),p4=P(a1,r1),l=(a2-a1)>180?1:0;return 'M'+p1+' A'+r2+' '+r2+' 0 '+l+' 1 '+p2+' L'+p3+' A'+r1+' '+r1+' 0 '+l+' 0 '+p4+' Z';}
var R0=96,RL=50,G=el('g',{}),Z=el('circle',{r:R0+RL/2,fill:'none',stroke:'#c9cdd6','stroke-width':1,'data-role':'zone'}),K=el('circle',{r:9,fill:'#16161a'});s.appendChild(Z);s.appendChild(G);s.appendChild(K);
[[0,'60′'],[6,'30′'],[10,'10′'],[13,'WP'],[16,'actif'],[21,'après']].forEach(function(a){var c=ANG[a[0]],p=P(c.a+c.w/2,R0+RL+14),t=el('text',{x:p[0],y:p[1]+4,'text-anchor':'middle','font-size':12,fill:'#55555f'});t.textContent=a[1];s.appendChild(t);});
var lp=P(A0+318,R0+RL+8),lev=document.getElementById('e7-lev');lev.style.left='calc(50% + '+(lp[0]-30)+'px)';lev.style.top='calc(50% + '+(lp[1]-10)+'px)';
function poser(i){SE.i=i;aria(d,i);document.getElementById('rep').innerHTML=reponse(i);G.innerHTML='';Z.setAttribute('r',R0+RL*zp('floral')/100);
  ANG.forEach(function(c,k){var q=M[k],h=Math.max(2,RL*pc('floral',q.v.floral)/100);
    G.appendChild(el('path',{d:arc(c.a+0.6,c.a+c.w-0.6,R0,R0+h),fill:k===i?'#9840bc':'#bf86d6',opacity:q.src==='interp'&&k!==i?.55:1}));
    var t=ibuT(k);G.appendChild(el('path',{d:arc(c.a+0.6,c.a+c.w-0.6,84,91),fill:t==null?'#e3e5eb':t>70?'#c2410c':'#9a9aa3'}));});
  var c=ANG[i],p=P(c.a+c.w/2,R0-24);K.setAttribute('cx',p[0]);K.setAttribute('cy',p[1]);
  document.getElementById('e7-mo').textContent=M[i].lib;document.getElementById('e7-fl').textContent=tl(i)+sg(dl(i,'floral'));
  var a=document.getElementById('e7-a');a.textContent=amerTxt(i);a.className='e7-l2'+(trop(i)?' se-al':'');
  document.getElementById('e7-ci').textContent=tl(i)+sg(dl(i,'citrus'));document.getElementById('e7-be').textContent=tl(i)+sg(dl(i,'berries'));var r=dl(i,'resin');document.getElementById('e7-r').textContent=r>=5?'résineux '+tl(i)+sg(r):'';}
window.poser=poser;
glisser(d,function(e){var b=s.getBoundingClientRect(),x=e.clientX-b.left-b.width/2,y=e.clientY-b.top-b.height/2;var a=Math.atan2(x,-y)*180/Math.PI;var best=0,bd=1e9;
  ANG.forEach(function(c,k){var m=c.a+c.w/2,dd=Math.abs(((a-m+540)%360)-180);if(dd<bd){bd=dd;best=k;}});return best;},poser);
`;
  ecrire('e7', page({ id: 'e7', css, corps, legende: LEG_BASE + '<span>Le cadran : le brassin fait le tour, de 60′ à 7 j après. Rayons violets : le floral ; anneau intérieur : l\'amertume (orangé, trop amer)</span>', js }));
}

// ───────────────────────── e8 · chaude · le goût compté en pictos ─────────────────────────
{
  const FS = ['floral', 'citrus', 'tropical', 'berries', 'resin', 'green'];
  const COLS = [['b', 'ébu.'], ['wp', 'WP'], ['a', 'actif'], ['p', 'après']];
  const css = `
.e8-mx{background:#fff;border-radius:8px;padding:6px 6px 4px;touch-action:none;cursor:pointer}
.e8-r{display:grid;grid-template-columns:22px repeat(4,1fr);gap:3px;align-items:center;min-height:30px}
.e8-r+.e8-r{border-top:1px solid #f1f2f5}
.e8-h{min-height:34px;align-items:end}
.e8-hd{text-align:center;font-size:12px;color:var(--gris);border-radius:4px;padding:2px 0;line-height:1.15}
.e8-hd b{display:block;font:600 12px var(--mono);color:var(--encre)}
.e8-hd.on{background:var(--encre);color:#fff}
.e8-hd.on b{color:#fff}
.e8-c{position:relative;height:26px;border-radius:4px;display:flex;align-items:center;gap:1px;padding:0 3px;flex-wrap:wrap;align-content:center}
.e8-c .e8-z{position:absolute;left:0;top:2px;bottom:2px;background:#f1f2f5;border-radius:4px;display:block}
.e8-c svg{position:relative}
.e8-c.on{outline:2px solid var(--encre);outline-offset:-1px}
.e8-c.hs{box-shadow:none;border:1px solid var(--acc)}
.e8-am{font:600 12px var(--mono);text-align:center}
.e8-am.trop{color:var(--acc)}
.e8-sub{position:relative;height:38px;background:#fff;border-radius:8px;touch-action:none;cursor:pointer}
.e8-st{position:absolute;left:14px;right:14px;top:12px;height:4px;background:#e3e5eb;border-radius:2px}
.e8-tk{position:absolute;top:21px;transform:translateX(-50%);font:12px var(--mono);color:var(--gris)}
.e8-pt{position:absolute;top:5px;width:18px;height:18px;margin-left:-9px;border-radius:50%;background:var(--encre)}
`;
  const corps = '<p class="se-rep" id="rep"></p>'
    + '<div data-libre="moment" style="display:flex;flex-direction:column;gap:6px"><div class="e8-mx" role="slider" tabindex="0" aria-label="Moment : l\'étape" aria-valuemin="0" aria-valuemax="3">'
    + '<div class="e8-r e8-h"><span></span>' + COLS.map((c, n) => '<span class="e8-hd" data-s="' + n + '">' + c[1] + '<b></b></span>').join('') + '</div>'
    + FS.map((f) => '<div class="e8-r" data-f="' + f + '">' + pi(f) + COLS.map((c, n) => '<span class="e8-c" data-s="' + n + '"><i class="e8-z" data-role="zone"></i></span>').join('') + '</div>').join('')
    + '<div class="e8-r"><span class="se-t">IBU</span>' + COLS.map((c, n) => '<span class="e8-am" data-s="' + n + '"></span>').join('') + '</div></div>'
    + '<div class="e8-sub" role="slider" tabindex="0" aria-label="Moment : minute ou jour" aria-valuemin="0" aria-valuemax="23"><span class="e8-st"></span></div></div>'
    + vrai('E10') + pont();
  const js = String.raw`
var mx=document.querySelector('.e8-mx'),sub=document.querySelector('.e8-sub'),MEM={0:IDX0,1:13,2:SE.DEPART,3:SE.DEPART+5};
function n5(k,f){return abs()?Math.round(M[k].v[f]/10):Math.round(Math.max(0,dl(k,f))/5);}
function place(f){return abs()?B[f]/10:Math.max(0,(B[f]-AV[f])/5);}
function poser(i){SE.i=i;var p=M[i];MEM[p.seg]=i;aria(sub,i);mx.setAttribute('aria-valuenow',p.seg);mx.setAttribute('aria-valuetext',p.lib);
  document.getElementById('rep').innerHTML=reponse(i);
  document.querySelectorAll('.e8-hd').forEach(function(h){var s=+h.dataset.s,k=MEM[s];h.classList.toggle('on',s===p.seg);h.querySelector('b').textContent=M[k].seg===1?'':M[k].court;});
  document.querySelectorAll('.e8-r[data-f]').forEach(function(r){var f=r.dataset.f;r.querySelectorAll('.e8-c').forEach(function(c){var s=+c.dataset.s,k=MEM[s],n=Math.min(10,n5(k,f));
    c.classList.toggle('on',s===p.seg);c.classList.toggle('hs',M[k].v[f]>B[f]);
    c.querySelectorAll('svg').forEach(function(x){x.remove();});c.querySelector('.e8-z').style.width=Math.min(100,place(f)/5*100)+'%';
    for(var m=0;m<n;m++)c.insertAdjacentHTML('beforeend','<svg width="12" height="12" data-famille="'+f+'" style="stroke:'+T[f]+'" aria-label="'+SE.NOM[f]+'"'+(M[k].src==='interp'?' opacity=".55"':'')+'><use href="#p-'+f+'"/></svg>');});});
  document.querySelectorAll('.e8-am').forEach(function(a){var k=MEM[+a.dataset.s],t=ibuT(k);a.textContent=t==null?'?':(t>70?'':'≈')+t;a.classList.toggle('trop',t!=null&&t>70);});
  var r=SE.SEGS[p.seg],n=r[1]-r[0];sub.querySelectorAll('.e8-tk,.e8-pt').forEach(function(x){x.remove();});
  for(var k=r[0];k<r[1];k++){var x=n===1?50:(k-r[0])/(n-1)*100,L='calc(14px + (100% - 28px) * '+x/100+')';
    if(!(p.seg===0&&(k-r[0])%3!==0&&k!==r[1]-1)){var s=document.createElement('span');s.className='e8-tk';s.textContent=M[k].seg===1?'WP':M[k].court;s.style.left=L;sub.appendChild(s);}
    if(k===i){var pt=document.createElement('i');pt.className='e8-pt';pt.style.left=L;sub.appendChild(pt);}}}
window.poser=poser;
glisser(mx,function(e){var hs=[].slice.call(document.querySelectorAll('.e8-hd'));for(var s=0;s<hs.length;s++){var b=hs[s].getBoundingClientRect();if(e.clientX>=b.left-2&&e.clientX<=b.right+2)return MEM[s];}return null;},poser);
glisser(sub,function(e){var b=sub.getBoundingClientRect(),v=(e.clientX-b.left-14)/(b.width-28),r=SE.SEGS[M[SE.i].seg],n=r[1]-r[0];return r[0]+Math.max(0,Math.min(n-1,Math.round(v*(n-1))));},poser);
`.split('IDX0').join(String(IDX.b10));
  ecrire('e8', page({ id: 'e8', css, corps, legende: LEG_BASE + '<span>Un picto = 5 points gagnés au style (10 en absolu) ; fond gris : la place que laisse la 16D ; cadre orangé : hors du style</span>', js }));
}
console.log('série E : e1 à e8 écrits');
