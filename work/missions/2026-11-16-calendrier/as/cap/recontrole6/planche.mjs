import {createRequire} from 'module';import fs from 'fs';
const require=createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer=require('puppeteer-core');
const D='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-16-calendrier/as/cap/recontrole6/';
const all=fs.readdirSync(D).filter(f=>f.endsWith('.png')&&!f.startsWith('_')).map(f=>f.slice(0,-4)).sort();
const P=all.filter(f=>f.startsWith('p-')),L=all.filter(f=>f.startsWith('l-'));
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--allow-file-access-from-files']});
async function pl(n,l,w){const p=await b.newPage();await p.setViewport({width:w*(w>500?2:5)+40,height:400});
 fs.writeFileSync(D+n+'.html','<body style="margin:4px;font:13px sans-serif;display:flex;flex-wrap:wrap;gap:6px">'+l.map(f=>`<figure style="margin:0;width:${w}px"><img src="${f}.png" style="width:${w}px;border:1px solid #888"><figcaption>${f}</figcaption></figure>`).join('')+'</body>');
 await p.goto('file:///'+D+n+'.html');await new Promise(r=>setTimeout(r,800));await p.screenshot({path:D+n+'.png',fullPage:true});fs.unlinkSync(D+n+'.html');console.log(n,l.join(','));}
for(let i=0;i<P.length;i+=5)await pl('_pl-p-'+String(i/5).padStart(2,'0'),P.slice(i,i+5),300);
for(let i=0;i<L.length;i+=4)await pl('_pl-l-'+String(i/4).padStart(2,'0'),L.slice(i,i+4),760);
await b.close();
