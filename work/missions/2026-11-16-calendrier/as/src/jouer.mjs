import {createRequire} from 'module';
const require=createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer=require('puppeteer-core');
const R='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-16-calendrier/as/';
const seul=process.argv[2]||'';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const log=[];
async function page(f,w,h,theme){const p=await b.newPage();await p.setViewport({width:w,height:h,isMobile:true,hasTouch:true,deviceScaleFactor:2});
 p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));p.on('console',m=>{if(m.type()==='error')p.errs.push(m.text())});
 await p.goto('file:///'+R+f);if(theme)await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);await wait(300);p.cdp=await p.target().createCDPSession();return p;}
async function T(p,type,x,y){await p.cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1}]});}
async function drag(p,x,y,dx,dy,shot){await T(p,'touchStart',x,y);await wait(60);const n=14;for(let k=1;k<=n;k++){await T(p,'touchMove',x+dx*k/n,y+dy*k/n);await wait(25);}
 await wait(120);if(shot){p.pend=await p.evaluate(()=>({ici:(document.querySelector('.as-ici')||{}).textContent,leg:(document.querySelector('.as-zl')||{}).textContent,tete:(document.querySelector('.as-zoom .q5-n')||{}).textContent,cible:[...document.querySelectorAll('.as-cible')].length}));await cap(p,shot);}await T(p,'touchEnd');await wait(250);}
async function appui(p,x,y,shot,ms=700){await T(p,'touchStart',x,y);await wait(ms);if(shot)await cap(p,shot);await T(p,'touchEnd');await wait(250);}
async function tap(p,x,y){await T(p,'touchStart',x,y);await wait(60);await T(p,'touchEnd');await wait(300);}
async function cap(p,n){await p.screenshot({path:R+'cap/'+n+'.png'});log.push(n);}
async function rect(p,sel,vu){return p.evaluate((s,vu)=>{const e=document.querySelector(s);if(!e)return null;if(vu)e.scrollIntoView({block:'center',inline:'nearest'});const r=e.getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height,cx:r.left+r.width/2,cy:r.top+r.height/2}},sel,vu);}
async function txt(p,sel){return p.evaluate(s=>[...document.querySelectorAll(s)].map(e=>e.textContent.replace(/\s+/g,' ').trim()).join(' | '),sel);}
const out={};
async function jeu(nom,f,w,h,fn,theme){if(seul&&!nom.startsWith(seul))return;const p=await page(f,w,h,theme);try{out[nom]=await fn(p);}catch(e){out[nom]='ERREUR '+e.message;}out[nom+'.err']=p.errs;await p.close();}
for(const [f,w,h,s] of [['cal.html',390,844,'p'],['cal-paysage.html',844,390,'l']]){
 await jeu(s+'-repos',f,w,h,async p=>{await cap(p,s+'-repos');return 'ok';});
 await jeu(s+'-f1a',f,w,h,async p=>{const r=await rect(p,'.bar[data-chose="a-04"]',1);const x=Math.min(r.cx,w-30);
  await cap(p,s+'-f1a-avant');await drag(p,x,r.cy,-(r.w>0?(w>500?63:61):61),0,s+'-f1a-pendant');await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await wait(150);await cap(p,s+'-f1a-apres');
  return {pendant:p.pend,tete:await txt(p,'.q5-n'),toast:await txt(p,'.as-toast'),left:(await rect(p,'.bar[data-chose="a-04"]',1)).x};});
 await jeu(s+'-f2a',f,w,h,async p=>{const g=await rect(p,'.bar[data-chose="b-01"] .grip.g1',1);await cap(p,s+'-f2a-avant');
  await drag(p,g.cx,g.cy,w>500?63:61,0,s+'-f2a-pendant');await cap(p,s+'-f2a-apres');return {em:await txt(p,'.bar[data-chose="b-01"] .k12-jg em'),al:await txt(p,'.as-al'),tag:await txt(p,'.as-tag'),alH:await p.evaluate(()=>{const a=document.querySelector('.as-al');if(!a)return null;const b=[...a.querySelectorAll('.as-bt')].map(x=>Math.round(x.getBoundingClientRect().top));return {h:Math.round(a.getBoundingClientRect().height),tops:b};})};});
 await jeu(s+'-f4b',f,w,h,async p=>{const r=await rect(p,'.bar[data-chose="b-02"]',1);await cap(p,s+'-f4b-avant');await tap(p,Math.min(r.cx,w-30),r.cy);await cap(p,s+'-f4b-apres');return await txt(p,'.as-det');});
 await jeu(s+'-f5a',f,w,h,async p=>{const r=await rect(p,'.bar[data-chose="e-01"]',1);await cap(p,s+'-f5a-avant');await appui(p,r.cx,r.cy,null);await cap(p,s+'-f5a-apres');
  const menu=await txt(p,'.as-menu');const ret=await rect(p,'.as-menu [data-as="ret"]');if(ret)await tap(p,ret.cx,ret.cy);await cap(p,s+'-f5a-retirer');return {menu,toast:await txt(p,'.as-toast'),tete:await txt(p,'.q5-n')};});
 await jeu(s+'-f6b',f,w,h,async p=>{const r=await rect(p,'.bar[data-chose="b-01"]',1);await cap(p,s+'-f6b-avant');await drag(p,r.x+r.w*0.45,r.cy,w>500?63:61,0,s+'-f6b-pendant');await wait(500);await cap(p,s+'-f6b-apres');const fant=await p.evaluate(()=>document.querySelectorAll('.as-fant').length);
  const liv=await rect(p,'.as-al .as-pri');let apres2='';if(liv){await tap(p,liv.cx,liv.cy);apres2=await txt(p,'.as-toast');await cap(p,s+'-f6b-livrer');}
  return {em:await txt(p,'.bar[data-chose="b-01"] .k12-jg em'),apres2,pend:p.pend,fant};});
 await jeu(s+'-c1d',f,w,h,async p=>{const r=await rect(p,'.q-brosse i:last-child');await cap(p,s+'-c1d-avant');await drag(p,r.cx,r.cy,w-r.cx-4,0,s+'-c1d-pendant');await cap(p,s+'-c1d-apres');
  const res={per:await txt(p,'.q-per'),mois:await txt(p,'#fh .as-mois')};await p.evaluate(()=>window.scrollTo(0,400));await wait(200);await cap(p,s+'-c1d-apres-bas');return res;});
 await jeu(s+'-c2b',f,w,h,async p=>{const r=await rect(p,'[data-booster="mouvements"]');const sx=r.x+r.w*0.2,ex=r.x+r.w*(w>500?0.36:0.37);await cap(p,s+'-c2b-avant');
  await drag(p,sx,r.y+r.h*0.55,ex-sx,0,s+'-c2b-pendant');await cap(p,s+'-c2b-apres');return {tete:await txt(p,'.q5-n'),bulle:await txt(p,'.as-bulle')};});
 await jeu(s+'-c3a',f,w,h,async p=>{const r=await rect(p,'[data-booster="mouvements"]');await cap(p,s+'-c3a-avant');await appui(p,r.x+r.w*0.594,r.y+r.h*0.6,s+'-c3a-pendant');await cap(p,s+'-c3a-apres');return await txt(p,'.as-gk');});
 await jeu(s+'-f3',f,w,h,async p=>{const r=await rect(p,'.lane[data-voie="brassage"] .g2-c',1);await tap(p,r.cx,r.cy);await cap(p,s+'-f3-plus');return {ouv:await p.evaluate(()=>document.querySelector('.lane[data-voie="brassage"]').classList.contains('k14-ouv')),plus:await p.evaluate(()=>[...document.querySelectorAll('.as-gc,.as-menu,.as-toast')].length)};});
}
await jeu('p-cave-f4b','cal.html',390,844,async p=>{const r=await rect(p,'.bar[data-chose="b-02"]',1);await tap(p,Math.min(r.cx,360),r.cy);await cap(p,'p-cave-f4b');const m=await rect(p,'.bar[data-chose="e-01"]',1);await appui(p,m.cx,m.cy,null);await cap(p,'p-cave-f5a');return 'ok';},'cave');
await b.close();
console.log(JSON.stringify(out,null,1));
