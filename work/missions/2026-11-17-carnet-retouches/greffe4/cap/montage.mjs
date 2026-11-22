import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const R='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-17-carnet-retouches/';
const I=R+'maquettes/page2/img/';
const G={
 "a-creer":["h05-2","h01-2","g02-2","h03-2","h02-2"],
 "a2-creer":["h04-2","h06-2","base-E00-vide","i02-2","i06-2"],
 "b-ajouter":["h02-4a","h05-4b","h06-4a","h03-4b","h04-4a","base-E01b-carnet-cree"],
 "b2-ajouter":["h05-4a","h03-4a","h03-4c","h06-4b","h02-4b","h01-4"],
 "c-decor":["g05-1","i06-1","h05-3","i06-4","h01-6"],
};
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage();
for (const [k,l] of Object.entries(G)) {
  const html=`<body style="margin:0;display:flex;gap:8px;align-items:flex-start;background:#888">${l.map(n=>`<figure style="margin:0;width:390px"><figcaption style="font:bold 16px sans-serif;background:#000;color:#fff;padding:2px">${n}</figcaption><img src="file:///${I}${n}.webp" style="width:390px;display:block"></figure>`).join('')}</body>`;
  await p.setViewport({width:l.length*398,height:900});
  const fs=require('fs');fs.writeFileSync(R+'greffe4/cap/_m.html',html);await p.goto('file:///'+R+'greffe4/cap/_m.html',{waitUntil:'load'});
  const h=await p.evaluate(()=>[...document.images].map(i=>i.naturalWidth+'x'+i.naturalHeight).join(' '));
  console.log(k,h);
  await p.screenshot({path:R+'greffe4/cap/'+k+'.png',fullPage:true});
}
await nav.close();
