import {createRequire} from 'module';
const require=createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer=require('puppeteer-core');
const R='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-16-calendrier/as/';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));const out={};
async function page(f,w,h){const p=await b.newPage();await p.setViewport({width:w,height:h,isMobile:true,hasTouch:true,deviceScaleFactor:2});await p.goto('file:///'+R+f);await wait(300);p.cdp=await p.target().createCDPSession();return p;}
async function T(p,type,x,y){await p.cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1}]});}
async function drag(p,x,y,dx,dy){await T(p,'touchStart',x,y);await wait(60);for(let k=1;k<=14;k++){await T(p,'touchMove',x+dx*k/14,y+dy*k/14);await wait(25);}await wait(120);await T(p,'touchEnd');await wait(300);}
async function rect(p,sel){return p.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height,cx:r.left+r.width/2,cy:r.top+r.height/2}},sel);}
async function z(p,n,x,y,w,h){await p.screenshot({path:R+'cap/recontrole2/'+n+'.png',clip:{x,y,width:w,height:h,scale:1.5}});}
for(const [f,w,h,s] of [['cal.html',390,844,'p'],['cal-paysage.html',844,390,'l']]){
 // c1d année
 let p=await page(f,w,h);const r=await rect(p,'.q-brosse i:last-child');await drag(p,r.cx,r.cy,w-r.cx-4,0);
 await p.evaluate(()=>window.scrollTo(0,0));await wait(150);await z(p,'z-'+s+'-c1d-noms',0,200,w>500?400:390,120);
 out[s+'-loyer']=await p.evaluate(()=>{const els=[...document.querySelectorAll('*')].filter(e=>e.childElementCount===0&&/Loyer/.test(e.textContent));return els.map(e=>{e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();const cx=r.left+Math.min(r.width/2,40),cy=r.top+r.height/2;const top=document.elementFromPoint(cx,cy);const cs=getComputedStyle(e);return {txt:e.textContent.trim().slice(0,40),cls:e.className,parent:e.parentElement.className,r:[Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)],vis:cs.visibility,disp:cs.display,op:cs.opacity,top:top&&(top.className||top.tagName),topTxt:top&&top.textContent.trim().slice(0,30)}});});
 const lr=await p.evaluate(()=>{const e=[...document.querySelectorAll('*')].find(e=>e.childElementCount===0&&/Loyer/.test(e.textContent)&&e.getBoundingClientRect().width>0);if(!e)return null;e.scrollIntoView({block:'center'});const r=e.closest('.bar,[class*=bar]')||e;const q=r.getBoundingClientRect();return {x:q.left,y:q.top,w:q.width,h:q.height};});
 if(lr)await z(p,'z-'+s+'-c1d-loyer',0,Math.max(0,lr.y-60),w,Math.min(160,h-lr.y+60));
 await p.close();
 // c2b
 p=await page(f,w,h);const m=await rect(p,'[data-booster="mouvements"]');await p.evaluate(()=>window.scrollTo(0,0));await wait(100);const m2=await p.evaluate(()=>{const r=document.querySelector('[data-booster="mouvements"]').getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height}});
 const sx=m2.x+m2.w*0.2,ex=m2.x+m2.w*(w>500?0.36:0.37);await drag(p,sx,m2.y+m2.h*0.55,ex-sx,0);
 await z(p,'z-'+s+'-c2b-tete',w>500?400:100,40,w>500?450:290,110);
 out[s+'-c2b-boutons']=await p.evaluate(()=>[...document.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().top<60).map(b=>b.textContent.trim()+':'+getComputedStyle(b).visibility));
 await p.close();
 // f4b + volant
 p=await page(f,w,h);const r4=await rect(p,'.bar[data-chose="b-02"]');await T(p,'touchStart',Math.min(r4.cx,w-30),r4.cy);await wait(60);await T(p,'touchEnd');await wait(400);
 out[s+'-fab']=await p.evaluate(()=>{const f=[...document.querySelectorAll('button,a')].find(b=>{const r=b.getBoundingClientRect();return b.textContent.trim()==='+'&&r.width>40&&getComputedStyle(b).position==='fixed'});return f?f.getBoundingClientRect().toJSON():null;});
 await p.close();
}
await b.close();console.log(JSON.stringify(out,null,1));
