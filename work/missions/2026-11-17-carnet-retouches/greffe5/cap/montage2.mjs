import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const fs=require('fs');
const R='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-17-carnet-retouches/';
const I=R+'greffe4/page/img/', M=R+'maquettes/page2/img/', F=R+'greffe5/ref/';
const G={
 "f-lien":[I+"v01-8.webp",I+"v01-9.webp",I+"v02-6.webp",I+"v05-7.webp",I+"v06-6.webp"],
 "g-photo":[I+"v01-7.webp",I+"v02-7.webp",I+"v02-8.webp",I+"v05-8.webp",I+"v03-5.webp"],
 "h-ref":[F+"note-sol-local.jpg",F+"note-prochain-brassage.jpg",F+"note-ajoute-prevision.jpg",M+"i06-1.webp",M+"i06-4.webp",M+"h01-6.webp"],
};
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage();
for (const [k,l] of Object.entries(G)) {
  const html=`<body style="margin:0;display:flex;gap:8px;align-items:flex-start;background:#888">${l.map(n=>`<figure style="margin:0;width:390px"><figcaption style="font:bold 18px sans-serif;background:#000;color:#fff;padding:2px">${n.split('/').pop()}</figcaption><img src="file:///${n}" style="width:390px;display:block"></figure>`).join('')}</body>`;
  await p.setViewport({width:l.length*398,height:900});
  fs.writeFileSync(R+'greffe5/cap/_m.html',html);await p.goto('file:///'+R+'greffe5/cap/_m.html',{waitUntil:'load'});
  await p.screenshot({path:R+'greffe5/cap/'+k+'.png',fullPage:true});
  console.log(k);
}
await nav.close();
