import {createRequire} from 'module';
const require=createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer=require('puppeteer-core');const fs=require('fs');
const D='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-16-calendrier/as/cap/passe9/';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const G=[['p9a',260,['17-p-plus-vente-feuille','18-p-plus-vente-pose','20-p-plus-evenement-pose','22-p-plus-achat-pose','24-p-plus-renovation-pose','26-p-plus-activite-pose']],
 ['p9b',260,['m-p-feuille-vente','m-p-vente-pose','m-p-vente-defile','32-p-deux-ventes','16-p-plus-brassage-pose','54-p-retour-milieu']],
 ['p9c',420,['m-l-feuille-vente','47-l-fab-feuille','49-l-achat-feuille']],
 ['p9d',420,['44-l-apres-rotation','48-l-fab-pose','51-l-f2a']],
 ['p9e',560,['58-d-1280','m-l-vente-pose']],
 ['p9f',260,['06-p-f1a','07-p-f1a-apres-depart','09-p-f6b','10-p-livrer','13-p-fab-pose','56-p-cave']]];
const p=await b.newPage();
for(const [nm,W,imgs] of G){await p.setViewport({width:imgs.length*(W+6),height:2400});
fs.writeFileSync(D+'_m.html','<body style="margin:0;display:flex;gap:6px;align-items:flex-start;background:#888;font:12px sans-serif">'+imgs.map(i=>`<figure style="margin:0"><figcaption>${i}</figcaption><img src="${i}.png" style="width:${W}px"></figure>`).join('')+'</body>');
await p.goto('file:///'+D+'_m.html');await new Promise(r=>setTimeout(r,300));
const h=await p.evaluate(()=>Math.max(...[...document.images].map(i=>i.getBoundingClientRect().bottom)));
await p.screenshot({path:D+'_'+nm+'.png',clip:{x:0,y:0,width:imgs.length*(W+6),height:h}});}
fs.unlinkSync(D+'_m.html');await b.close();console.log('planches');
