import {createRequire} from 'module';
const require=createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer=require('puppeteer-core');const fs=require('fs');
const D='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-16-calendrier/as/cap/critique8/';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const all=fs.readdirSync(D).filter(f=>/^\d\d-.*\.png$/.test(f));
const groups=[];const P=all.filter(f=>/-p-/.test(f)),Lp=all.filter(f=>/-l-|-d-/.test(f));
for(let i=0;i<P.length;i+=6)groups.push(['pl-p-'+(i/6+1),300,P.slice(i,i+6)]);
for(let i=0;i<Lp.length;i+=2)groups.push(['pl-l-'+(i/2+1),760,Lp.slice(i,i+2)]);
const p=await b.newPage();
for(const [nm,W,imgs] of groups){await p.setViewport({width:imgs.length*(W+6),height:2000});
fs.writeFileSync(D+'_m.html','<body style="margin:0;display:flex;gap:6px;align-items:flex-start;background:#888;font:12px sans-serif">'+imgs.map(i=>`<figure style="margin:0"><figcaption>${i}</figcaption><img src="${i}" style="width:${W}px"></figure>`).join('')+'</body>');
await p.goto('file:///'+D+'_m.html');await new Promise(r=>setTimeout(r,300));
const h=await p.evaluate(()=>Math.max(...[...document.images].map(i=>i.getBoundingClientRect().bottom)));
await p.screenshot({path:D+'_'+nm+'.png',clip:{x:0,y:0,width:imgs.length*(W+6),height:h}});}
fs.unlinkSync(D+'_m.html');await b.close();console.log(groups.map(g=>g[0]+':'+g[2].join(',')).join('\n'));
