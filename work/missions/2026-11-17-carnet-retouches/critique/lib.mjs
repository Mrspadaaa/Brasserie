import path from 'node:path'; import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
export const proto='file:///C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-16-carnet-decision/ra-p5f/proto.html';
export const pause=ms=>new Promise(r=>setTimeout(r,ms));
export async function open(q){
 const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
 const p = await nav.newPage();
 await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
 await p.goto(proto+q,{waitUntil:'load'}); await pause(700);
 let T=0;
 const api={nav,p,T:()=>T,
  snap:async n=>{await pause(200);await p.screenshot({path:'cap/'+n+'.png'});},
  txt:()=>p.evaluate(()=>document.body.innerText),
  ui:()=>p.evaluate(()=>[...document.querySelectorAll('button,[data-act],input,textarea,a')].filter(n=>{const r=n.getBoundingClientRect();return r.width>0&&r.bottom>0&&r.top<innerHeight}).map(n=>(n.dataset.act||n.id||n.tagName)+':'+(n.innerText||n.placeholder||n.getAttribute('aria-label')||'').slice(0,40).replace(/\n/g,' ')).join('\n')),
  tap:async(sel,re)=>{const ok=await p.evaluate((sel,src)=>{document.querySelectorAll('[data-pick]').forEach(n=>n.removeAttribute('data-pick'));const re=src?new RegExp(src):null;const el=[...document.querySelectorAll(sel)].find(n=>{const r=n.getBoundingClientRect();return r.width>0&&r.height>0&&(!re||re.test(n.innerText||n.textContent))});if(!el)return false;el.setAttribute('data-pick','1');return true},sel,re?re.source:'');if(!ok)throw new Error('absent '+sel);const e=await p.$('[data-pick="1"]');const dock=await e.evaluate(n=>!!n.closest('#ra-dock'));if(!dock)await e.evaluate(n=>n.scrollIntoView({block:'center'}));await e.tap();T++;await pause(300);},
  type:async(sel,t,enter=true)=>{const e=await p.$(sel);const a=await e.evaluate(n=>n===document.activeElement);if(!a){await e.tap();T++;await pause(150)}await p.keyboard.type(t);if(enter){await p.keyboard.press('Enter');await pause(400)}},
 };
 return api;
}
