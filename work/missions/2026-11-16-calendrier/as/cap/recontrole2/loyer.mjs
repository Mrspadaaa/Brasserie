import {createRequire} from 'module';
const require=createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer=require('puppeteer-core');
const R='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-16-calendrier/as/';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));const out={};
async function T(p,type,x,y){await p.cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1}]});}
for(const [f,w,h,s] of [['cal.html',390,844,'p'],['cal-paysage.html',844,390,'l']]){
 const p=await b.newPage();await p.setViewport({width:w,height:h,isMobile:true,hasTouch:true,deviceScaleFactor:2});await p.goto('file:///'+R+f);await wait(300);p.cdp=await p.target().createCDPSession();
 const r=await p.evaluate(()=>{const e=document.querySelector('.q-brosse i:last-child');const q=e.getBoundingClientRect();return {cx:q.left+q.width/2,cy:q.top+q.height/2}});
 await T(p,'touchStart',r.cx,r.cy);await wait(60);for(let k=1;k<=14;k++){await T(p,'touchMove',r.cx+(w-r.cx-4)*k/14,r.cy);await wait(25);}await wait(120);await T(p,'touchEnd');await wait(400);
 out[s]=await p.evaluate(()=>{const tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const res=[];let n;while(n=tw.nextNode()){if(/Loyer/.test(n.data)&&!n.parentElement.closest('script,style')){const e=n.parentElement;e.scrollIntoView({block:'center'});const q=e.getBoundingClientRect();const top=q.width?document.elementFromPoint(q.left+Math.min(20,q.width/2),q.top+q.height/2):null;const cs=getComputedStyle(e);res.push({t:n.data.trim(),cls:e.className,par:e.parentElement.className,r:[q.left,q.top,q.width,q.height].map(Math.round),vis:cs.visibility,op:cs.opacity,z:cs.zIndex,top:top?(top.className+' / '+top.textContent.trim().slice(0,25)):null});}}return res;});
 const vis=out[s].find(x=>x.r[2]>0);
 if(vis){await p.screenshot({path:R+'cap/recontrole2/'+s+'-c1d-papiers.png'});}
 await p.close();}
await b.close();console.log(JSON.stringify(out,null,1));
