import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const R='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-17-carnet-retouches/';
const I=R+'maquettes/page2/img/';
const G={
 "1-liste":["g05-1","h06-1","h04-1","g04-1","h01-1","v11-1"],
 "0-vide":["base-E00-vide"],
 "2-ajouter":["h05-2","h01-2","g02-2","h02-2","h03-2"],
 "3-carnet":["h05-3","h04-3b","h01-3","h04-3a","v04-1","v08-3","v12-2"],
 "4a-ajouter-a":["h03-4b","base-E01b-carnet-cree","h02-4a","h05-4b","h06-4a","h04-4a"],
 "4b-ajouter-a":["v06-4","v07-1","v07-2","v08-5"],
 "5-articles":["h06-5","h05-5","g02-7","h01-5","h03-5"],
 "6-article":["h01-6","g05-7","g04-7","v01-2","g01-7"],
 "7a-comparer":["g01-8","v03-4","g05-8","h04-7","h06-7"],
 "7b-comparer":["h02-7","h03-7"],
 "8a-choisi":["g05-11","h06-8","v03-7","v09-3","g05-9"],
 "8b-choisi":["g05-10","v10-4","h03-8","h05-8","g06-10"],
 "9-avenir":["h05-9","h03-9","h06-9","v02-6"],
};
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage();
for (const [k,l] of Object.entries(G)) {
  const html=`<body style="margin:0;display:flex;gap:8px;align-items:flex-start;background:#888">${l.map(n=>`<figure style="margin:0;width:390px"><figcaption style="font:bold 16px sans-serif;background:#000;color:#fff;padding:2px">${n}</figcaption><img src="file:///${I}${n}.webp" style="width:390px;display:block"></figure>`).join('')}</body>`;
  await p.setViewport({width:l.length*398,height:900});
  const fs=require('fs');fs.writeFileSync(R+'greffe3/cap/_m.html',html);await p.goto('file:///'+R+'greffe3/cap/_m.html',{waitUntil:'load'});
  const h=await p.evaluate(()=>[...document.images].map(i=>i.naturalWidth+'x'+i.naturalHeight).join(' '));
  console.log(k,h);
  await p.screenshot({path:R+'greffe3/cap/'+k+'.png',fullPage:true});
}
await nav.close();
