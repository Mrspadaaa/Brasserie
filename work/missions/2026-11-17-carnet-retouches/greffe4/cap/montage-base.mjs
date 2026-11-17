import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const R='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-17-carnet-retouches/';
const I='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-16-carnet-decision/ra-p5f/cap/';
const G={"d-base":["E00-vide","E01a-idee-tapee","E01b-carnet-cree","E06-note","E07a-puce-coller"]};
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage();
for (const [k,l] of Object.entries(G)) {
  const html=`<body style="margin:0;display:flex;gap:8px;align-items:flex-start;background:#888">${l.map(n=>`<figure style="margin:0;width:390px"><figcaption style="font:bold 16px sans-serif;background:#000;color:#fff;padding:2px">${n}</figcaption><img src="file:///${I}${n}.png" style="width:390px;display:block"></figure>`).join('')}</body>`;
  await p.setViewport({width:l.length*398,height:900});
  const fs=require('fs');fs.writeFileSync(R+'greffe4/cap/_m.html',html);await p.goto('file:///'+R+'greffe4/cap/_m.html',{waitUntil:'load'});
  const h=await p.evaluate(()=>[...document.images].map(i=>i.naturalWidth+'x'+i.naturalHeight).join(' '));
  console.log(k,h);
  await p.screenshot({path:R+'greffe4/cap/'+k+'.png',fullPage:true});
}
await nav.close();
