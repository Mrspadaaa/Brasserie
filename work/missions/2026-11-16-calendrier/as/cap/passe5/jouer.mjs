// Passe 5 (17.11) : les gestes touchés (f6-b, f1-a, f2-a) et les + (volant, carré Ventes, carré Activités), au doigt, portrait et paysage.
import {createRequire} from 'module';
const require=createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer=require('puppeteer-core');const fs=require('fs');
const R='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-16-calendrier/as/';
const seul=process.argv[2]||'';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function page(f,w,h,theme){const p=await b.newPage();await p.setViewport({width:w,height:h,isMobile:true,hasTouch:true,deviceScaleFactor:2});
 p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));p.on('console',m=>{if(m.type()==='error')p.errs.push(m.text())});
 await p.goto('file:///'+R+f);if(theme)await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);await wait(300);p.cdp=await p.target().createCDPSession();return p;}
async function T(p,type,x,y){await p.cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1}]});}
async function drag(p,x,y,dx,shot){await T(p,'touchStart',x,y);await wait(60);for(let k=1;k<=14;k++){await T(p,'touchMove',x+dx*k/14,y);await wait(25);}
 await wait(150);if(shot)await cap(p,shot);await T(p,'touchEnd');await wait(900);}
async function tap(p,x,y){await T(p,'touchStart',x,y);await wait(60);await T(p,'touchEnd');await wait(350);}
async function cap(p,n){await p.screenshot({path:R+'cap/passe5/'+n+'.png'});}
async function rect(p,sel,vu){return p.evaluate((s,vu)=>{const e=document.querySelector(s);if(!e)return null;if(vu)e.scrollIntoView({block:'center',inline:'nearest'});const r=e.getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height,cx:r.left+r.width/2,cy:r.top+r.height/2}},sel,vu);}
async function touche(p,sel,vu){await wait(120);const r=await rect(p,sel,vu);if(!r)throw new Error('introuvable '+sel);await tap(p,r.cx,r.cy);}
async function txt(p,sel){return p.evaluate(s=>[...document.querySelectorAll(s)].filter(e=>e.getClientRects().length).map(e=>e.textContent.replace(/\s+/g,' ').trim()).join(' | '),sel);}
const out={};
async function jeu(nom,f,w,h,fn,theme){if(seul&&!nom.includes(seul))return;const p=await page(f,w,h,theme);try{out[nom]=await fn(p);}catch(e){out[nom]='ERREUR '+e.message;}out[nom+'.err']=p.errs;await p.close();}
for(const [f,w,h,s] of [['cal.html',390,844,'p'],['cal-paysage.html',844,390,'l']]){
 const col=w>500?63:61;
 // f6-b : la Blonde décalée de trois semaines, promesse en conflit
 await jeu(s+'-f6b',f,w,h,async p=>{const r=await rect(p,'.bar[data-chose="b-01"]',1);await cap(p,s+'-f6b-avant');await drag(p,r.x+r.w*0.45,r.cy,3*col,s+'-f6b-pendant');await cap(p,s+'-f6b-apres');
  const al=await txt(p,'.as-al'),tag=await p.evaluate(()=>{const t=document.querySelector('.as-tag');return t?getComputedStyle(t).display:'aucune';});
  await touche(p,'.as-al .as-al-t');await cap(p,s+'-f6b-detail');const det=await txt(p,'.as-al-d');
  await touche(p,'.as-al .as-al-t');await touche(p,'.as-al .as-pri');await cap(p,s+'-f6b-livrer');
  return {al,tag,det,livrer:await txt(p,'.as-toast'),msg:await p.evaluate(()=>document.querySelectorAll('.as-al,.as-toast').length)};});
 // f1-a puis f6-b : un seul message à la fois
 await jeu(s+'-f1a',f,w,h,async p=>{const r=await rect(p,'.bar[data-chose="a-04"]',1);await cap(p,s+'-f1a-avant');await drag(p,Math.min(r.cx,w-30),r.cy,-col,s+'-f1a-pendant');await cap(p,s+'-f1a-apres');
  const t1=await txt(p,'.as-toast');const r2=await rect(p,'.bar[data-chose="b-01"]',1);await drag(p,r2.x+r2.w*0.45,r2.cy,3*col,null);await cap(p,s+'-f1a-puis-f6b');
  return {t1,apres:await p.evaluate(()=>[...document.querySelectorAll('.as-al,.as-toast')].map(e=>e.className))};});
 // f2-a : tirer la fin de la Blonde
 await jeu(s+'-f2a',f,w,h,async p=>{const g=await rect(p,'.bar[data-chose="b-01"] .grip.g1',1);await cap(p,s+'-f2a-avant');await drag(p,g.cx,g.cy,col,null);await cap(p,s+'-f2a-apres');
  return {al:await txt(p,'.as-al'),toast:await txt(p,'.as-toast')};});
 // + volant : Achat, nom, montant, semaine S49, Ajouter
 await jeu(s+'-plus',f,w,h,async p=>{await cap(p,s+'-plus-avant');await touche(p,'#fab');await cap(p,s+'-plus-feuille');
  await touche(p,'.as-ty[data-v="achat"]');await touche(p,'.as-fn input');await p.keyboard.type('Houblon Citra 1 kg');await touche(p,'.as-fm input');await p.keyboard.type('62');
  await p.evaluate(()=>document.activeElement.blur());await touche(p,'.as-se[data-i="2"]');await cap(p,s+'-plus-rempli');const ok=await txt(p,'.as-sh-ok');
  await touche(p,'.as-sh-ok');await wait(300);await cap(p,s+'-plus-pose');
  const pose=await p.evaluate(()=>{const n=[...document.querySelectorAll('#fb .lane[data-voie="achat"] .bar.as-nouv')].map(b=>({t:b.textContent.trim(),l:b.style.left,top:b.style.top,lbl:b.querySelector('.lbl').className}));return n;});
  await wait(1900);await cap(p,s+'-plus-pose-calme');return {ok,pose,toast:await txt(p,'.as-toast'),tete:await txt(p,'.q5-n')};});
 // + du carré Ventes : la vente probable proposée, Ajouter la pose
 await jeu(s+'-ventes',f,w,h,async p=>{await touche(p,'.lane[data-voie="vente"] .g2-c',1);await cap(p,s+'-ventes-feuille');const ok=await txt(p,'.as-sh-ok');
  await touche(p,'.as-sh-ok');await wait(300);await cap(p,s+'-ventes-pose');
  return {ok,pose:await txt(p,'#fb .lane[data-voie="vente"] .bar.as-nouv'),pin:await p.evaluate(()=>document.querySelector('[data-k17-p^="k-cdp"]').hidden),toast:await txt(p,'.as-toast')};});
 // + du carré Activités : sans montant
 await jeu(s+'-activites',f,w,h,async p=>{await touche(p,'.lane[data-voie="activite"] .g2-c',1);await touche(p,'.as-fn input');await p.keyboard.type('Nettoyer les fûts');
  await p.evaluate(()=>document.activeElement.blur());await touche(p,'.as-se[data-i="1"]');await cap(p,s+'-activites-rempli');await touche(p,'.as-sh-ok');await wait(300);await cap(p,s+'-activites-pose');
  return {pose:await txt(p,'#fb .lane[data-voie="activite"] .bar.as-nouv'),toast:await txt(p,'.as-toast')};});
}
// thème sombre : la feuille et l'alerte
await jeu('p-sombre-feuille','cal.html',390,844,async p=>{await touche(p,'.lane[data-voie="vente"] .g2-c',1);await cap(p,'p-sombre-feuille');return 'ok';},'cave');
await jeu('p-sombre-f6b','cal.html',390,844,async p=>{const r=await rect(p,'.bar[data-chose="b-01"]',1);await drag(p,r.x+r.w*0.45,r.cy,183,null);await cap(p,'p-sombre-f6b');return 'ok';},'cave');
fs.writeFileSync(R+'cap/passe5/_jeu.json',JSON.stringify(out,null,1));console.log(JSON.stringify(out,null,1));await b.close();
