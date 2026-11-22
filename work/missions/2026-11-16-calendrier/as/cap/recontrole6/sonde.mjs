// Sonde du critique : gestes non couverts par jouer.mjs (Ouvrir, Modifier, deux ventes, Livrer, Porter)
import {createRequire} from 'module';
const require=createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer=require('puppeteer-core');const fs=require('fs');
const R='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-16-calendrier/as/';const C=R+'cap/recontrole6/';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function page(f,w,h){const p=await b.newPage();await p.setViewport({width:w,height:h,isMobile:true,hasTouch:true,deviceScaleFactor:2});
 p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));await p.goto('file:///'+R+f);await wait(300);p.cdp=await p.target().createCDPSession();return p;}
async function T(p,type,x,y){await p.cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1}]});}
async function drag(p,x,y,dx){await T(p,'touchStart',x,y);await wait(60);for(let k=1;k<=14;k++){await T(p,'touchMove',x+dx*k/14,y);await wait(25);}await wait(120);await T(p,'touchEnd');await wait(400);}
async function tap(p,x,y){await T(p,'touchStart',x,y);await wait(60);await T(p,'touchEnd');await wait(350);}
async function rect(p,sel,vu=true){if(vu){await p.evaluate(s=>{const e=document.querySelector(s);if(e)e.scrollIntoView({block:'center',behavior:'instant'});},sel);await wait(150);}
 return p.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.left,cx:r.left+r.width/2,cy:r.top+r.height/2,w:r.width}},sel);}
async function tapSel(p,sel,vu=true){const r=await rect(p,sel,vu);if(!r)throw new Error('absent '+sel);await tap(p,r.cx,r.cy);return r;}
async function tapTxt(p,sel,t){const ok=await p.evaluate((s,t)=>{const e=[...document.querySelectorAll(s)].find(x=>x.textContent.includes(t));if(!e)return false;e.setAttribute('data-sonde','1');return true;},sel,t);if(!ok)throw new Error('absent '+t);await tapSel(p,'[data-sonde="1"]');await p.evaluate(()=>document.querySelectorAll('[data-sonde]').forEach(e=>e.removeAttribute('data-sonde')));}
const txt=(p,s)=>p.evaluate(s=>[...document.querySelectorAll(s)].map(e=>e.textContent.replace(/\s+/g,' ').trim()).join(' | '),s);
const calme=p=>p.evaluate(()=>{const t=document.querySelector('.as-toast');if(t)t.remove();});
const out={};
for(const [f,w,h,s] of [['cal.html',390,844,'p'],['cal-paysage.html',844,390,'l']]){
 const p=await page(f,w,h);const o=out[s]={};const CW=w>500?63:61;
 const etape=async(n,fn)=>{try{o[n]=await fn();}catch(e){o[n]='ERREUR '+e.message;}};
 await etape('ouvrir',async()=>{await tapSel(p,'#fab',false);await tapSel(p,'.as-ty[data-v="brassage"]');await tapSel(p,'.as-rc');await tapSel(p,'.as-fm input');await p.keyboard.type('420');await tapSel(p,'.as-se[data-i="3"]');await tapSel(p,'.as-sh-ok');await wait(300);await calme(p);
  await tapSel(p,'.lane[data-voie="brassage"] .bar.as-nouv');const av=await txt(p,'body > *:not(script)').then(t=>t.length);await tapTxt(p,'.as-det button, .as-det a','Ouvrir');await wait(500);
  await p.screenshot({path:C+s+'-z-ouvrir.png'});return {url:p.url().split('/').pop(),det:await txt(p,'.as-det'),toast:await txt(p,'.as-toast'),dialogs:await txt(p,'[role=dialog], .sheet.open, .as-fiche, .k-sheet.open')};});
 await etape('modifier',async()=>{await p.goto('file:///'+R+f);await wait(300);
  await tapSel(p,'.lane[data-voie="achat"] .g2-c');await tapSel(p,'.as-fn input');await p.keyboard.type('Houblon Citra 1 kg');await tapSel(p,'.as-fm input');await p.keyboard.type('100');await tapSel(p,'.as-sh-ok');await wait(300);await calme(p);
  const x0=await p.evaluate(()=>Math.round(document.querySelector('.lane[data-voie="achat"] .as-nouv').getBoundingClientRect().left));
  await tapSel(p,'.lane[data-voie="achat"] .as-nouv');await tapTxt(p,'.as-det button','Modifier');await wait(300);
  const feuille={nom:await p.evaluate(()=>(document.querySelector('.as-fn input')||{}).value),chf:await p.evaluate(()=>(document.querySelector('.as-fm input')||{}).value),ok:await txt(p,'.as-sh-ok')};
  await tapSel(p,'.as-se[data-i="4"]');await p.screenshot({path:C+s+'-z-modifier.png'});const okTxt=await txt(p,'.as-sh-ok');await tapSel(p,'.as-sh-ok');await wait(300);
  const r={feuille,okTxt,n:await p.evaluate(()=>document.querySelectorAll('.lane[data-voie="achat"] .as-nouv').length),x0,x:await p.evaluate(()=>Math.round(document.querySelector('.lane[data-voie="achat"] .as-nouv').getBoundingClientRect().left)),toast:await txt(p,'.as-toast'),tete:await txt(p,'.q5-n b')};
  await p.screenshot({path:C+s+'-z-modifie.png'});return r;});
 await etape('deuxVentes',async()=>{await p.goto('file:///'+R+f);await wait(300);
  await tapSel(p,'.lane[data-voie="vente"] .g2-c');await p.evaluate(()=>{for(const s of ['.as-fn input','.as-fm input']){const i=document.querySelector(s);if(i){i.value='';i.dispatchEvent(new Event('input',{bubbles:true}));}}});
  await tapSel(p,'.as-fn input');await p.keyboard.type('Bar du Lac');await tapSel(p,'.as-fm input');await p.keyboard.type('200');await tapSel(p,'.as-se[data-i="2"]');const ok=await txt(p,'.as-sh-ok');await tapSel(p,'.as-sh-ok');await wait(300);await calme(p);
  await rect(p,'.lane[data-voie="vente"]');await p.screenshot({path:C+s+'-z-deuxventes.png'});
  return {ok,pastilles:await p.evaluate(()=>[...document.querySelectorAll('.lane[data-voie="vente"] .k17-p')].map(e=>{const r=e.getBoundingClientRect();return e.textContent.trim()+' ['+Math.round(r.left)+'-'+Math.round(r.right)+' y'+Math.round(r.top)+']'}))};});
 await etape('livrer',async()=>{await p.goto('file:///'+R+f);await wait(300);
  const g=await rect(p,'.bar[data-chose="b-01"] .grip.g1');await drag(p,g.cx,g.cy,CW);const r=await rect(p,'.bar[data-chose="b-01"]',false);await drag(p,r.x+r.w*0.4,r.cy,CW);await wait(300);
  await tapTxt(p,'.as-al button','Livrer');await wait(400);await p.screenshot({path:C+s+'-z-livrer.png'});
  return {toast:await txt(p,'.as-toast'),al:await txt(p,'.as-al'),reperes:await p.evaluate(()=>[...document.querySelectorAll('.lane[data-voie="vente"] .k17-p')].map(e=>e.textContent.trim()+'@'+Math.round(e.getBoundingClientRect().left)).join(' '))};});
 await etape('porter',async()=>{await p.goto('file:///'+R+f);await wait(300);await tapSel(p,'.bar[data-chose="b-02"]');await wait(300);await p.screenshot({path:C+s+'-z-porter.png'});return (await txt(p,'.as-det, [class*="det"]')).slice(0,200);});
 o.errs=p.errs;await p.close();}
await b.close();fs.writeFileSync(C+'_sonde.json',JSON.stringify(out,null,1));console.log(JSON.stringify(out,null,1));
