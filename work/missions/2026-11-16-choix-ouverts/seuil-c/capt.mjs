// node capt.mjs [ids…] : captures 390x844 DPR 2 tactile, clair et cave, repos et geste, dans cap/ ; contrôles police, coupures, chevauchements, +.
import path from 'node:path';import url from 'node:url';import { createRequire } from 'node:module';
const require=createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer=require('puppeteer-core');
const D=path.dirname(url.fileURLToPath(import.meta.url));
const ids=process.argv.slice(2).length?process.argv.slice(2):['C','c1','c2','c3','c4','c5','c6'];
const nav=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new'});
const p=await nav.newPage();const err=[];p.on('pageerror',e=>err.push(String(e)));
await p.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2});
const fu=f=>'file:///'+f.split(path.sep).join('/');
for(const id of ids){
  const f=id==='C'?path.resolve(D,'../seuil/v3/proto.html'):path.join(D,id,'proto.html');
  const jobs=id==='C'?[['repos','',`C-repos.png`],['geste','',`C-geste.png`]]:[];
  if(id!=='C')for(const e of ['repos','geste'])for(const t of ['','cave'])jobs.push([e,t,`${id}-${e}${t?'-cave':''}.png`]);
  for(const [e,t,nom] of jobs){
    await p.goto(fu(f)+`?etat=${e}${t?'&theme='+t:''}`,{waitUntil:'load'});await p.evaluate(()=>document.fonts.ready);await new Promise(r=>setTimeout(r,500));
    await p.screenshot({path:path.join(D,'cap',nom)});
    if(id==='C')continue;
    const pb=await p.evaluate(()=>{const out=[];const T=[];let m=99,mw='';
      for(const el of document.querySelectorAll('body *')){if(!(el instanceof HTMLElement||el instanceof SVGElement))continue;const own=[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());if(!own)continue;
        const r=el.getBoundingClientRect(),s=getComputedStyle(el);if(!r.width||s.visibility==='hidden'||el.closest('[hidden]'))continue;
        if(r.bottom<0||r.top>844)continue;
        const z=parseFloat(s.fontSize);if(z<m){m=z;mw=el.textContent.trim().slice(0,24)}
        if(el instanceof HTMLElement&&el.scrollWidth>el.clientWidth+1&&s.overflow!=='visible'&&el.clientWidth>0)out.push('coupé : '+el.textContent.trim().slice(0,30));
        if(r.right>391||r.left<-1)out.push('déborde : '+el.textContent.trim().slice(0,30));
        const cx=r.left+r.width/2,cy=r.top+r.height/2;const top=document.elementFromPoint(Math.min(389,Math.max(0,cx)),Math.min(843,Math.max(0,cy)));
        if(top&&(top===el||el.contains(top)||top.contains(el)||top.closest('svg')===el.closest('svg')&&el.closest('svg')))T.push([el,r]);}
      for(let i=0;i<T.length;i++)for(let j=i+1;j<T.length;j++){const [a,ra]=T[i],[b,rb]=T[j];if(a.contains(b)||b.contains(a))continue;
        const ix=Math.min(ra.right,rb.right)-Math.max(ra.left,rb.left),iy=Math.min(ra.bottom,rb.bottom)-Math.max(ra.top,rb.top);
        if(ix>2&&iy>2){// chevauchement réel de texte : comparer les boîtes de texte
          const tb=e=>{const g=document.createRange();g.selectNodeContents(e);return g.getBoundingClientRect()};const qa=tb(a),qb=tb(b);
          const jx=Math.min(qa.right,qb.right)-Math.max(qa.left,qb.left),jy=Math.min(qa.bottom,qb.bottom)-Math.max(qa.top,qb.top);
          if(jx>2&&jy>2)out.push('chevauche : «'+a.textContent.trim().slice(0,18)+'» / «'+b.textContent.trim().slice(0,18)+'»')}}
      const fab=document.querySelector('.k-fab').getBoundingClientRect(),bar=document.querySelector('.k-bar').getBoundingClientRect(),nv=document.querySelector('.k-nav').getBoundingClientRect();
      const gap=nv.top-fab.bottom;if(gap<4||gap>24)out.push('+ à '+gap+' px des onglets');
      if(fab.top<bar.top||fab.bottom>bar.bottom)out.push('+ hors de la barre opaque');
      const cta=document.querySelector('.k-cta').getBoundingClientRect();if(cta.right>fab.left)out.push('+ couvre Commander');
      const tabs=[...document.querySelectorAll('.k-nav a')].map(a=>a.textContent.replace(/\d+/g,'').trim()).join(',');if(tabs!=='Bord,Finances,Calendrier,Brassins,Stocks,Clients')out.push('onglets : '+tabs);
      if(m<14)out.push('police '+m+' px ('+mw+')');
      return [...new Set(out)].concat(['pastille='+document.querySelector('#k-pas').textContent]);});
    const pas=pb.pop();console.log(nom+' '+pas+(pb.length?' PROBLÈMES '+pb.join(' | '):' ok'));if(pb.length)err.push(nom);
  }}
await nav.close();console.log(err.length?'ERREURS '+err.join(', '):'CAPTURES OK');
