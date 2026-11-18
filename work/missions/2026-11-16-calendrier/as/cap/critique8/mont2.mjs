import {createRequire} from 'module';
const require=createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer=require('puppeteer-core');const fs=require('fs');
const D='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-16-calendrier/as/cap/critique8/';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const all=[];
const groups=[['pl-m-p',300,['m-p-feuille-vente.png','m-p-vente-pose.png','m-p-vente-defile.png']],['pl-m-l',560,['m-l-feuille-vente.png','m-l-vente-pose.png','m-l-vente-defile.png']]];const p=await b.newPage();
for(const [nm,W,imgs] of groups){await p.setViewport({width:imgs.length*(W+6),height:2000});
fs.writeFileSync(D+'_m.html','<body style="margin:0;display:flex;gap:6px;align-items:flex-start;background:#888;font:12px sans-serif">'+imgs.map(i=>`<figure style="margin:0"><figcaption>${i}</figcaption><img src="${i}" style="width:${W}px"></figure>`).join('')+'</body>');
await p.goto('file:///'+D+'_m.html');await new Promise(r=>setTimeout(r,300));
const h=await p.evaluate(()=>Math.max(...[...document.images].map(i=>i.getBoundingClientRect().bottom)));
await p.screenshot({path:D+'_'+nm+'.png',clip:{x:0,y:0,width:imgs.length*(W+6),height:h}});}
fs.unlinkSync(D+'_m.html');await b.close();console.log(groups.map(g=>g[0]+':'+g[2].join(',')).join('\n'));
