import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer=require('puppeteer-core');
const D='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-16-calendrier/as/cap/recontrole2/';
const l1=process.argv[2].split(','),l2=process.argv[3].split(',');
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--allow-file-access-from-files']});
for(const [n,l,w] of [['planche-p',l1,195],['planche-l',l2,422]]){const p=await b.newPage();await p.setViewport({width:w*4+50,height:600});
 fs.writeFileSync(D+n+'.html','<body style="margin:4px;font:13px sans-serif;display:flex;flex-wrap:wrap;gap:6px">'+l.map(f=>`<figure style="margin:0;width:${w}px"><img src="${f}.png" style="width:${w}px;border:1px solid #888"><figcaption>${f}</figcaption></figure>`).join('')+'</body>');
 await p.goto('file:///'+D+n+'.html');await new Promise(r=>setTimeout(r,800));await p.screenshot({path:D+n+'.png',fullPage:true});fs.unlinkSync(D+n+'.html');}
await b.close();
