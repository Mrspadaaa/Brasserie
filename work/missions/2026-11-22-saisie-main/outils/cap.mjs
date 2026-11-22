import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const D='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-22-saisie-main/';
const url=pathToFileURL(D+'choix-saisie.html').href;
const only=process.argv[2]?process.argv[2].split(','):null;
const ETATS=['repos','a','b','c','ok','okb'];
fs.mkdirSync(D+'captures/planche',{recursive:true});
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
const vs=['v01','v02','v03','v04','v05','v06','v07','v08'].filter(v=>!only||only.includes(v));
for(const v of vs){
 for(const t of ['clair']){
  await p.setViewport({width:390,height:844,deviceScaleFactor:2});
  const EX={v01:['d'],v04:['d','vide'],v07:['e']};const ets=ETATS.concat(EX[v]||[]);
  for(const s of ets){await p.goto(url+`?v=${v}&s=${s}&t=${t}`,{waitUntil:'networkidle0'});await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:`${D}captures/${v}-${s}-${t}.png`});}
  await p.setViewport({width:1194,height:Math.ceil(ets.length/3)*852+8,deviceScaleFactor:1});
  await p.goto(url+`?v=${v}&duo=1&t=${t}`,{waitUntil:'networkidle0'});await p.evaluate(()=>document.fonts.ready);
  await p.screenshot({path:`${D}captures/planche/${v}-${t}.png`});
 }
}
// garde-fous : type=number, débordements horizontaux, actions coupées en bas, textes rognés
await p.setViewport({width:1400,height:900,deviceScaleFactor:1});
await p.goto(url,{waitUntil:'networkidle0'});await p.evaluate(()=>document.fonts.ready);
const r=await p.evaluate(()=>{const n=document.querySelectorAll('input[type=number]').length;const over=[],cut=[],rog=[];
 document.querySelectorAll('.sm-ph').forEach(ph=>{const pr=ph.getBoundingClientRect();const id=ph.dataset.v+'/'+ph.dataset.s;
  ph.querySelectorAll('*').forEach(el=>{const q=el.getBoundingClientRect();if(!q.width)return;
   if((q.right>pr.right+1||q.left<pr.left-1)&&getComputedStyle(el).position!=='absolute')over.push(id+':'+el.className+':'+Math.round(q.right-pr.right));
   if(el.matches('.sm-go,.sm-mm,.vk,.v03-go')&&q.bottom>pr.bottom+1)cut.push(id+':'+el.className+':'+Math.round(q.bottom-pr.bottom));
   if(el.matches('button,span,b')&&el.children.length===0&&el.scrollWidth>el.clientWidth+1&&el.clientWidth>0)rog.push(id+':'+el.className+':'+el.textContent.slice(0,20));});});
 return {n,phones:document.querySelectorAll('.sm-ph').length,over:over.slice(0,15),cut:cut.slice(0,15),rog:rog.slice(0,15)}});
console.log(JSON.stringify(r));console.log('ERR',errs.join(' | ')||'aucune');
await b.close();
