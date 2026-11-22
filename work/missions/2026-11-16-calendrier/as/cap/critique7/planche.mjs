import {createRequire} from 'module';
const require=createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer=require('puppeteer-core');const fs=require('fs');
const C='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-16-calendrier/as/cap/critique7/';
const all=fs.readdirSync(C).filter(f=>/^\d\d-.*\.png$/.test(f)).sort();
const P=all.filter(f=>/^\d\d-(p-|ERR-p)/.test(f)),Lp=all.filter(f=>!P.includes(f));
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});const pg=await b.newPage();
async function sheet(name,files,w,cols){await pg.setViewport({width:w*cols,height:100});const H='<body style="margin:0;font:12px sans-serif;display:grid;grid-template-columns:repeat('+cols+','+w+'px)">'+files.map(f=>'<div><div style="background:#000;color:#ff0">'+f+'</div><img style="width:'+w+'px;display:block" src="'+f+'"></div>').join('')+'</body>';fs.writeFileSync(C+'_pl.html',H);
 await pg.goto('file:///'+C+'_pl.html').catch(()=>0);0&&('<body style="margin:0;font:12px sans-serif;display:grid;grid-template-columns:repeat('+cols+','+w+'px)">'+files.map(f=>'<div><div style="background:#000;color:#ff0">'+f+'</div><img style="width:'+w+'px;display:block" src="file:///'+C+f+'"></div>').join('')+'</body>');
 (r=>setTimeout(r,500));await new Promise(r=>setTimeout(r,500));await pg.screenshot({path:C+name,fullPage:true});}
let i=0;for(let k=0;k<P.length;k+=4)await sheet('_pl-p-'+(i++)+'.png',P.slice(k,k+4),390,4);
i=0;for(let k=0;k<Lp.length;k+=2)await sheet('_pl-l-'+(i++)+'.png',Lp.slice(k,k+2),844,1);
await b.close();console.log(P.length,Lp.length);
