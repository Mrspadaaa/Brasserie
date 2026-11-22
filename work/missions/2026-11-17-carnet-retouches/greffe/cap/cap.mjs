import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const D='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-17-carnet-retouches/maquettes/';
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
for (const v of ['01','02','04','09','10','11']) {
  const p = await nav.newPage();
  await p.setViewport({ width: 3200, height: 1000, deviceScaleFactor: 1 });
  await p.goto('file:///'+D+'v'+v+'.html',{waitUntil:'networkidle0'}).catch(()=>{});
  await new Promise(r=>setTimeout(r,600));
  const n = await p.evaluate(()=>{const all=[...document.querySelectorAll('.v1-sc,.v2-tel,.v4-tel,.v9-scr,.v10-tel,.v11-ecran')].filter(e=>e.getBoundingClientRect().width>300);
    const top=all.filter(e=>!all.some(a=>a!==e&&a.contains(e)));top.forEach((e,i)=>e.setAttribute('data-capn',i));
    return top.map(e=>((e.getAttribute('aria-label')||e.querySelector('h1,h2')?.innerText)||'').slice(0,60)+' h='+Math.round(e.getBoundingClientRect().height));});
  console.log('v'+v, JSON.stringify(n));
  for (let i=0;i<n.length;i++){ const e=await p.$(`[data-capn="${i}"]`); await e.screenshot({path:`cap/v${v}-${i+1}.png`}); }
  // annex text beyond screens
  const ann = await p.evaluate(()=>[...document.querySelectorAll('body > *')].filter(e=>!e.querySelector('[data-capn]')&&!e.hasAttribute('data-capn')&&e.tagName!=='STYLE'&&e.tagName!=='SCRIPT').map(e=>(e.innerText||'').slice(0,500)).join('\n'));
  console.log('  annexe:', ann.replace(/\n+/g,' | ').slice(0,700));
  await p.close();
}
await nav.close();
