import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const R='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-17-carnet-retouches/';
const I=R+'maquettes/page2/img/';
const G={
 '1-liste':['v09-1','v10-1','v12-1','v11-1','base-E17a-liste'],
 '2-ajouter':['v08-2','v05-2','v06-1','v10-2','v11-4'],
 '3-carnet':['v11-3','v03-1','v04-1','v08-3','v12-2'],
 '4-ajouter-a':['base-E01b-carnet-cree','v06-4','v07-1','v07-2','v08-5'],
 '5-articles':['base-E12b-articles','v01-1','v09-2'],
 '6-article':['v01-2','v02-2','base-E15-dispo'],
 '7-comparer':['v01-3','base-E14a-oxygene','v03-4'],
 '8-choisi':['v03-6','v12-3','v03-7','v09-3','v10-4'],
 '9-avenir':['v10-5','v02-6','v08-8'],
};
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage();
for (const [k,l] of Object.entries(G)) {
  const html=`<body style="margin:0;display:flex;gap:8px;align-items:flex-start;background:#888">${l.map(n=>`<figure style="margin:0;width:390px"><figcaption style="font:bold 16px sans-serif;background:#000;color:#fff;padding:2px">${n}</figcaption><img src="file:///${I}${n}.webp" style="width:390px;display:block"></figure>`).join('')}</body>`;
  await p.setViewport({width:l.length*398,height:900});
  const fs=require('fs');fs.writeFileSync(R+'greffe2/cap/_m.html',html);await p.goto('file:///'+R+'greffe2/cap/_m.html',{waitUntil:'load'});
  const h=await p.evaluate(()=>[...document.images].map(i=>i.naturalWidth+'x'+i.naturalHeight).join(' '));
  console.log(k,h);
  await p.screenshot({path:R+'greffe2/cap/'+k+'.png',fullPage:true});
}
await nav.close();
