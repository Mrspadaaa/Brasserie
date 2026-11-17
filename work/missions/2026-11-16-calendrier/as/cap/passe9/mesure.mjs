import {createRequire} from 'module';
const require=createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer=require('puppeteer-core');const fs=require('fs');
const R='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-16-calendrier/as/';const C=R+'cap/passe9/';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});const wait=ms=>new Promise(r=>setTimeout(r,ms));
const out={};
for(const [nm,vp] of [['l',{width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:2,isLandscape:true}],['p',{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2}]]){
 const p=await b.newPage();await p.setViewport(vp);await p.goto('file:///'+R+'pub/calendrier.html');await wait(900);
 const cdp=await p.target().createCDPSession();const F=p.frames().find(f=>f.url().endsWith((nm==='l'?'paysage':'portrait')+'.html'));
 const T=async(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1}]});
 const tap=async(x,y)=>{await T('touchStart',x,y);await wait(60);await T('touchEnd');await wait(350);};
 const R1=s=>F.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height,cx:r.left+r.width/2,cy:r.top+r.height/2};},s);
 // + Ventes sans défiler (visible en haut ?)
 await F.evaluate(()=>{document.querySelector('.lane[data-voie="vente"]').scrollIntoView({block:'center'});});await wait(200);
 let r=await R1('.lane[data-voie="vente"] .g2-c');await tap(r.cx,r.cy);await wait(300);
 out[nm+'-sheet']=await F.evaluate(()=>{const s=document.querySelector('.as-sh');if(!s)return null;const all=[s,...s.querySelectorAll('*')];return {vw:innerWidth,sh:s.getBoundingClientRect().width,over:all.filter(e=>e.scrollWidth>e.clientWidth+2&&getComputedStyle(e).overflowX!=='visible').map(e=>[e.className,e.clientWidth,e.scrollWidth,e.scrollLeft]).slice(0,6),docW:document.documentElement.scrollWidth};});
 // focus nom then montant au doigt (sans scrollIntoView du jeu)
 r=await R1('.as-fn input');if(r){await tap(r.cx,r.cy);await p.keyboard.type('Bar du Lac');}
 r=await R1('.as-fm input');if(r){await tap(r.cx,r.cy);await p.keyboard.type('200');}
 await wait(300);out[nm+'-apresSaisie']=await F.evaluate(()=>{const s=document.querySelector('.as-sh');return [...s.querySelectorAll('*')].filter(e=>e.scrollLeft>0).map(e=>[e.className,e.scrollLeft]);});
 await p.screenshot({path:C+'m-'+nm+'-feuille-vente.png'});
 const se=await F.evaluate(()=>{const e=document.querySelector('.as-se[data-i="2"]');e.scrollIntoView({block:'nearest',inline:'nearest'});return true;});
 r=await R1('.as-se[data-i="2"]');await tap(r.cx,r.cy);r=await R1('.as-sh-ok');await tap(Math.min(r.cx,vp.width-30),r.cy);await wait(400);
 out[nm+'-pose']=await F.evaluate(()=>{const t=document.querySelector('.as-toast');const tr=t&&t.getBoundingClientRect();const n=[...document.querySelectorAll('.as-nouv')].map(e=>{const r=e.getBoundingClientRect();return {t:e.textContent.trim().slice(0,30),x:Math.round(r.left),y:Math.round(r.top),r:Math.round(r.right),b:Math.round(r.bottom)}});return {toast:tr&&{x:Math.round(tr.left),y:Math.round(tr.top),r:Math.round(tr.right),b:Math.round(tr.bottom),txt:t.textContent},n};});
 await p.screenshot({path:C+'m-'+nm+'-vente-pose.png'});
 // défiler de 150 px pendant le message : que couvre-t-il ?
 await F.evaluate(()=>window.scrollBy(0,150));await wait(250);
 out[nm+'-defile']=await F.evaluate(()=>{const t=document.querySelector('.as-toast');if(!t)return 'parti';const tr=t.getBoundingClientRect();const hit=[...document.querySelectorAll('.g2-c,.bar,.k17-p,.lane > *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>tr.left&&r.left<tr.right&&r.bottom>tr.top&&r.top<tr.bottom&&!t.contains(e);}).map(e=>e.className+':'+e.textContent.trim().slice(0,20));return hit.slice(0,8);});
 await p.screenshot({path:C+'m-'+nm+'-vente-defile.png'});await p.close();}
await b.close();fs.writeFileSync(C+'_mesure.json',JSON.stringify(out,null,1));console.log(JSON.stringify(out,null,0).slice(0,2500));
