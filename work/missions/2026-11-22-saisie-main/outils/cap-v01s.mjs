// Captures de v01s (390 x 844 @2x, clair), 660 pour repos et loyer, planche, tableau, garde-fous.
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const D='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-22-saisie-main/';
const url=pathToFileURL(D+'choix-saisie.html').href;
const O=D+'captures/v01s/';fs.mkdirSync(O,{recursive:true});
const ETS=['repos','achat','vente','loyer','apport','abo','rpiece','rembt','hab','fin','prel','impot','apayer','ok','okb','okr'];
const only=process.argv[2]?process.argv[2].split(','):ETS;
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.setViewport({width:390,height:844,deviceScaleFactor:2});
for(const s of only){await p.goto(url+`?v=v01s&s=${s}&t=clair`,{waitUntil:'networkidle0'});await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:`${O}v01s-${s}.png`});}
await p.setViewport({width:390,height:660,deviceScaleFactor:2});
for(const s of ['repos','achat','loyer','abo','hab']){await p.goto(url+`?v=v01s&s=${s}&t=clair&h=660`,{waitUntil:'networkidle0'});await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:`${O}v01s-${s}-660.png`});}
await p.setViewport({width:1194,height:Math.ceil(ETS.length/3)*852+8,deviceScaleFactor:1});
await p.goto(url+`?v=v01s&duo=1&t=clair`,{waitUntil:'networkidle0'});await p.evaluate(()=>document.fonts.ready);
await p.screenshot({path:`${O}planche-v01s.png`});
await p.setViewport({width:1400,height:900,deviceScaleFactor:1});
await p.goto(url,{waitUntil:'networkidle0'});await p.evaluate(()=>document.fonts.ready);
const sec=await p.$('#v01s');const bb=await sec.boundingBox();
await p.screenshot({path:`${O}tableau.png`,clip:{x:0,y:bb.y,width:1400,height:Math.min(560,bb.height)}});
const r=await p.evaluate(()=>{const n=document.querySelectorAll('input[type=number]').length;const over=[],cut=[],rog=[];
 document.querySelectorAll('.sm-ph[data-v=v01s]').forEach(ph=>{const pr=ph.getBoundingClientRect();const id=ph.dataset.s;
  ph.querySelectorAll('*').forEach(el=>{const q=el.getBoundingClientRect();if(!q.width)return;
   if((q.right>pr.right+1||q.left<pr.left-1)&&getComputedStyle(el).position!=='absolute')over.push(id+':'+el.className+':'+Math.round(q.right-pr.right));
   if(el.matches('.sm-go,.sm-mm,.v1s-kb .ok')&&q.bottom>pr.bottom+1)cut.push(id+':'+el.className+':'+Math.round(q.bottom-pr.bottom));
   if(el.closest('.v1s-b')&&q.bottom>el.closest('.v1s-b').getBoundingClientRect().bottom+1&&el.children.length===0&&!el.closest('.sm-ok'))cut.push(id+':caché:'+el.className+':'+(el.textContent||'').slice(0,18));
   if(el.matches('button,span,b,input')&&el.children.length===0&&el.scrollWidth>el.clientWidth+1&&el.clientWidth>0)rog.push(id+':'+el.className+':'+(el.textContent||el.value).slice(0,20));});});
 return {n,phones:document.querySelectorAll('.sm-ph[data-v=v01s]').length,over:over.slice(0,15),cut:cut.slice(0,20),rog:rog.slice(0,15)}});
console.log(JSON.stringify(r));console.log('ERR',errs.join(' | ')||'aucune');
await b.close();
