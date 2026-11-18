// node planche.mjs : planches de contrôle (repos, geste, cave) dans le dossier temporaire donné
import path from 'node:path';import url from 'node:url';import fs from 'node:fs';import { createRequire } from 'node:module';
const require=createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer=require('puppeteer-core');const D=path.dirname(url.fileURLToPath(import.meta.url));const OUT=process.argv[2];const ids=process.argv.slice(3);
const nav=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new'});const p=await nav.newPage();
await p.setViewport({width:1600,height:844,deviceScaleFactor:1});
for(const id of ids){const L=(id==='C'?['C-repos','C-geste']:[id+'-repos',id+'-geste',id+'-repos-cave',id+'-geste-cave']).map(n=>'file:///'+path.join(D,'cap',n+'.png').split(path.sep).join('/'));
fs.writeFileSync(path.join(OUT,'p.html'),'<body style="margin:0;display:flex;gap:6px;background:#888">'+L.map(s=>'<img src="'+s+'" style="width:390px">').join('')+'</body>');
await p.goto('file:///'+path.join(OUT,'p.html').split(path.sep).join('/'));await new Promise(r=>setTimeout(r,300));await p.screenshot({path:path.join(OUT,id+'.png')});}
await nav.close();console.log('PLANCHES OK');
