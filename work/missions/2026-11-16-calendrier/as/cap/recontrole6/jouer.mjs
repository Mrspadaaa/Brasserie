// Recontrôle 6 (critique) : copie de cap/passe6/jouer.mjs ; rejoue au doigt les 11 problèmes de CRITIQUE5 (390 × 844 tactile, 844 × 390), captures et mesures dans cap/recontrole6/
import {createRequire} from 'module';
const require=createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer=require('puppeteer-core');const fs=require('fs');
const R='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-16-calendrier/as/';const C=R+'cap/recontrole6/';
const seul=process.argv[2]||'';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function page(f,w,h,theme){const p=await b.newPage();await p.setViewport({width:w,height:h,isMobile:true,hasTouch:true,deviceScaleFactor:2});
 p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));p.on('console',m=>{if(m.type()==='error')p.errs.push(m.text())});
 await p.goto('file:///'+R+f);if(theme)await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);await wait(300);p.cdp=await p.target().createCDPSession();return p;}
async function T(p,type,x,y){await p.cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1}]});}
async function drag(p,x,y,dx,dy){await T(p,'touchStart',x,y);await wait(60);const n=14;for(let k=1;k<=n;k++){await T(p,'touchMove',x+dx*k/n,y+dy*k/n);await wait(25);}await wait(120);await T(p,'touchEnd');await wait(300);}
async function tap(p,x,y){await T(p,'touchStart',x,y);await wait(60);await T(p,'touchEnd');await wait(300);}
async function cap(p,n){await p.screenshot({path:C+n+'.png'});}
async function rect(p,sel,vu){if(vu){await p.evaluate(s=>{const e=document.querySelector(s);if(e)e.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});},sel);await wait(150);}return p.evaluate((s,vu)=>{const e=typeof s==='string'?document.querySelector(s):null;if(!e)return null;const r=e.getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height,cx:r.left+r.width/2,cy:r.top+r.height/2,b:r.bottom,r:r.right}},sel,vu);}
async function tapSel(p,sel,vu=true){const r=await rect(p,sel,vu);if(!r)throw new Error('absent '+sel);await tap(p,r.cx,r.cy);return r;}
async function txt(p,sel){return p.evaluate(s=>[...document.querySelectorAll(s)].map(e=>e.textContent.replace(/\s+/g,' ').trim()).join(' | '),sel);}
async function calme(p){await p.evaluate(()=>{const t=document.querySelector('.as-toast');if(t)t.remove();});await wait(100);}
/* mesures : textes de la rangée chevauchés par la chose posée, le message sur la frise ou sur la barre d'onglets */
async function mesure(p,voie){return p.evaluate(v=>{const lane=document.querySelector('.lane[data-voie="'+v+'"]');const n=[...lane.querySelectorAll('.as-nouv')].pop();
 const pill=(lane.querySelector('.g2-rm')||{}).textContent||null;const toast=document.querySelector('.as-toast'),nav=document.querySelector('nav.bot');
 let chev=[];if(n){const rs=[n.getBoundingClientRect()];const lb=n.querySelector('.lbl');if(lb&&!lb.classList.contains('in'))rs.push(lb.getBoundingClientRect());
  lane.querySelectorAll('.bar,.lbl,.k17-p,.lt>*,.k18-ln').forEach(x=>{if(x===n||n.contains(x))return;const r=x.getBoundingClientRect();if(!r.width||!r.height)return;
   if(rs.some(q=>!(q.right<=r.left||q.left>=r.right||q.bottom<=r.top||q.top>=r.bottom)))chev.push((x.className+' '+x.textContent.trim()).slice(0,40));});}
 const tr=toast&&toast.getBoundingClientRect(),nr=nav&&nav.getBoundingClientRect();const tt=toast&&toast.querySelector('.as-tt');
 return {nouv:n?(n.className+' : '+n.textContent.replace(/\s+/g,' ').trim()):null,pill,tete:document.querySelector('.q5-n b').textContent,chev,
  toast:toast?toast.textContent.replace(/\s+/g,' ').trim():null,toastSurNav:tr&&nr?(tr.top>=nr.top-4):null,toastCoupe:tt?tt.scrollHeight>tt.clientHeight+1:null};},voie);}
const out={};
async function jeu(nom,f,w,h,fn,theme){if(seul&&!nom.startsWith(seul))return;const p=await page(f,w,h,theme);try{out[nom]=await fn(p);}catch(e){out[nom]='ERREUR '+e.message;}out[nom+'.err']=p.errs;await p.close();}
const NOMS={brassage:'Saison de printemps',vente:null,evenement:'Apéro des voisins',achat:'Houblon Citra 1 kg',renovation:'Peinture de la cave',activite:'Nettoyer les fûts',charge:'Facture Brouwland'};
for(const [f,w,h,s] of [['cal.html',390,844,'p'],['cal-paysage.html',844,390,'l']]){
 const CWp=w>500?63:61;
 await jeu(s+'-repos',f,w,h,async p=>{await cap(p,s+'-repos');return 'ok';});
 /* 1 et 7 : allonger la Blonde d'une semaine puis la décaler d'une semaine */
 await jeu(s+'-blonde',f,w,h,async p=>{const g=await rect(p,'.bar[data-chose="b-01"] .grip.g1',1);await drag(p,g.cx,g.cy,CWp,0);await cap(p,s+'-f2a-apres');
  const vu1=await p.evaluate(()=>{const r=document.querySelector('.bar[data-chose="b-01"]').getBoundingClientRect(),fh=document.getElementById('fh').getBoundingClientRect();return r.top>=fh.bottom-2&&r.bottom<=innerHeight;});
  await p.evaluate(()=>{const a=document.querySelector('.as-al .as-bt:not(.as-pri)');});
  const r=await rect(p,'.bar[data-chose="b-01"]',0);await drag(p,r.x+r.w*0.4,r.cy,CWp,0);await wait(500);await cap(p,s+'-f2a-f6b');
  return await p.evaluate(vu1=>{const b=document.querySelector('.bar[data-chose="b-01"]'),em=b.querySelector('.k12-jg em'),r=b.getBoundingClientRect(),er=em.getBoundingClientRect(),fh=document.getElementById('fh').getBoundingClientRect();
   return {em:em.textContent,emDedans:er.right<=Math.min(innerWidth,r.right)-2,al:(document.querySelector('.as-al')||{}).textContent,barreVueApresF2a:vu1,barreVue:r.top>=fh.bottom-2&&r.bottom<=innerHeight};},vu1);});
 /* 2, 5, 11 : le + volant, un brassin en S50 (recette, 28 j), puis le toucher */
 await jeu(s+'-fab',f,w,h,async p=>{const av=await mesure(p,'brassage');await tapSel(p,'#fab',false);await tapSel(p,'.as-ty[data-v="brassage"]');await tapSel(p,'.as-rc');
  await tapSel(p,'.as-fm input');await p.keyboard.type('420');await tapSel(p,'.as-se[data-i="3"]');await cap(p,s+'-fab-rempli');await tapSel(p,'.as-sh-ok');await wait(300);await cap(p,s+'-fab-pose');const ap=await mesure(p,'brassage');
  await calme(p);await tapSel(p,'.lane[data-voie="brassage"] .bar.as-nouv',true);await wait(200);await cap(p,s+'-fab-touche');const det=await txt(p,'.as-det');
  const lien=await p.evaluate(()=>{const n=document.querySelector('.bar.as-nouv').getBoundingClientRect(),c=document.querySelector('[data-k17-p="c:b-02"]');if(!c)return null;const r=c.getBoundingClientRect();return Math.round(Math.max(r.top-n.bottom,n.top-r.bottom));});
  return {av,ap,det,ecartChariot:lien};});
 /* 2, 3, 4, 10 : le + de chaque rangée, la pose, la pastille, le toucher, Annuler */
 for(const v of ['brassage','vente','evenement','achat','renovation','activite','charge']){
  await jeu(s+'-r-'+v,f,w,h,async p=>{const av=await mesure(p,v);await tapSel(p,'.lane[data-voie="'+v+'"] .g2-c');await wait(200);
   if(NOMS[v]){await tapSel(p,'.as-fn input');await p.keyboard.type(NOMS[v]);if(v!=='activite'){await tapSel(p,'.as-fm input');await p.keyboard.type('100');}}
   await cap(p,s+'-r-'+v+'-feuille');await tapSel(p,'.as-sh-ok');await wait(300);await cap(p,s+'-r-'+v+'-pose');const ap=await mesure(p,v);await calme(p);await cap(p,s+'-r-'+v+'-calme');
   const sel='.lane[data-voie="'+v+'"] .as-nouv';const r=await rect(p,sel,1);if(r)await tap(p,r.x+Math.min(r.w,40)/2,r.cy);await wait(200);await cap(p,s+'-r-'+v+'-touche');const det=await txt(p,'.as-det');
   const ret=await rect(p,'.as-det [data-as="ret"]');let apRet=null;if(ret){await tap(p,ret.cx,ret.cy);apRet=await mesure(p,v);}
   const und=await rect(p,'.as-toast button');let apUndo=null;if(und){await tap(p,und.cx,und.cy);apUndo=await mesure(p,v);}
   return {av,ap,det,apRet,apUndo};});}
 /* 9 : une semaine hors de la frise (S3) */
 await jeu(s+'-hors',f,w,h,async p=>{const av=await mesure(p,'achat');await tapSel(p,'.lane[data-voie="achat"] .g2-c');await tapSel(p,'.as-fn input');await p.keyboard.type('Malt de janvier');await tapSel(p,'.as-fm input');await p.keyboard.type('540');
  const nsem=await p.evaluate(()=>document.querySelectorAll('.as-se').length);await tapSel(p,'.as-se[data-i="8"]');await cap(p,s+'-hors-feuille');await tapSel(p,'.as-sh-ok');await wait(300);await cap(p,s+'-hors-pose');
  const ap=await mesure(p,'achat');await calme(p);const r=await rect(p,'.lane[data-voie="achat"] .as-nouv',1);if(r)await tap(p,r.cx,r.cy);await wait(200);await cap(p,s+'-hors-touche');return {nsem,av,ap,det:await txt(p,'.as-det')};});
 /* 6 et 8 : les messages des autres gestes (glisser Ranger la réserve, le loyer fixe) */
 await jeu(s+'-autre',f,w,h,async p=>{const res={};for(const [k,sel] of [['t','.bar[data-chose^="t-01"],.lane[data-voie="activite"] .bar'],['c','.lane[data-voie="charge"] .bar.fixe']]){
   await p.evaluate(()=>window.scrollTo(0,0));const r=await rect(p,sel,1);if(!r){res[k]='absent';continue;}await drag(p,Math.min(r.cx,w-40),r.cy,CWp,0);await wait(200);await cap(p,s+'-autre-'+k);
   res[k]=await p.evaluate(()=>{const t=document.querySelector('.as-toast');if(!t)return null;const tt=t.querySelector('.as-tt'),nr=document.querySelector('nav.bot').getBoundingClientRect(),tr=t.getBoundingClientRect();return {txt:t.textContent.trim(),coupe:tt.scrollHeight>tt.clientHeight+1||tt.scrollWidth>tt.clientWidth+1,surNav:tr.top>=nr.top-4,h:Math.round(tr.height)};});
   const u=await rect(p,'.as-toast button');if(u)await tap(p,u.cx,u.cy);}return res;});
}
await jeu('p-sombre-fab','cal.html',390,844,async p=>{await tapSel(p,'#fab',false);await tapSel(p,'.as-ty[data-v="brassage"]');await cap(p,'p-sombre-feuille');await tapSel(p,'.as-rc');await tapSel(p,'.as-sh-ok');await wait(300);await calme(p);
 await tapSel(p,'.lane[data-voie="brassage"] .bar.as-nouv',true);await wait(200);await cap(p,'p-sombre-touche');return 'ok';},'cave');
await b.close();
fs.writeFileSync(C+'_jeu.json',JSON.stringify(out,null,1));
const err=Object.entries(out).filter(([k,v])=>k.endsWith('.err')&&v.length);console.log('erreurs de page :',err.length?JSON.stringify(err):0);
console.log(JSON.stringify(out,null,0).slice(0,200));
