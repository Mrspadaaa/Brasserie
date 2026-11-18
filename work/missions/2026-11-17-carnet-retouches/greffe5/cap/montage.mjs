import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const fs=require('fs');
const R='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-17-carnet-retouches/';
const I=R+'greffe4/page/img/';
const G={
 "a1-creer":["v01-2","v02-2","base-E01a-idee-tapee","v05-3"],
 "a2-creer":["base-E01b-carnet-cree","v01-4","v02-3","v03-3"],
 "b1-ajouter":["base-E20g-carnet","v02-4","base-E06-note","base-E07a-puce-coller"],
 "b2-ajouter":["v01-6","v05-5","v06-5","base-E12-lien6"],
 "c-modifier":["v01-11","v01-12","v03-11","v01-13"],
 "d1-titre-suppr":["v02-14","v02-12","v01-16","v01-17"],
 "d2-suppr":["v02-17","v02-18","v04-18","v04-19"],
 "e-decor":["base-E17a-liste","base-E00-vide","v05-1","v05-4"],
};
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage();
for (const [k,l] of Object.entries(G)) {
  const html=`<body style="margin:0;display:flex;gap:8px;align-items:flex-start;background:#888">${l.map(n=>`<figure style="margin:0;width:390px"><figcaption style="font:bold 18px sans-serif;background:#000;color:#fff;padding:2px">${n}</figcaption><img src="file:///${I}${n}.webp" style="width:390px;display:block"></figure>`).join('')}</body>`;
  await p.setViewport({width:l.length*398,height:900});
  fs.writeFileSync(R+'greffe5/cap/_m.html',html);await p.goto('file:///'+R+'greffe5/cap/_m.html',{waitUntil:'load'});
  await p.screenshot({path:R+'greffe5/cap/'+k+'.png',fullPage:true});
  console.log(k);
}
await nav.close();
