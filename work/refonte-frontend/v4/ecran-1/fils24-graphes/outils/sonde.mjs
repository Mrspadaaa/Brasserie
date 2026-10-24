import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';
const R='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/prototypes/houblons-v4/maquettes/';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
for (const u of process.argv.slice(2)) {
  const p=await b.newPage(); await p.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
  await p.goto(pathToFileURL(R+u).href,{waitUntil:'networkidle0'}); await new Promise(r=>setTimeout(r,800));
  const out=await p.evaluate(()=>{const L=[];for(const e of document.querySelectorAll('[data-role],[data-radar],svg[data-objet],[data-e],[data-graph],[data-lecture]')){const r=e.getBoundingClientRect();if(r.height<4)continue;const at=[...e.attributes].filter(a=>a.name.startsWith('data-')).map(a=>a.name+'='+a.value.slice(0,20)).join(' ');L.push(e.tagName.toLowerCase()+' '+at+' @'+Math.round(r.top)+'+'+Math.round(r.height)+' w'+Math.round(r.width)+' «'+(e.innerText||'').replace(/\s+/g,' ').slice(0,40)+'»');}return L;});
  console.log('#### '+u+' ('+out.length+')'); console.log(out.slice(0,90).join('\n'));
  await p.close();
}
await b.close();
