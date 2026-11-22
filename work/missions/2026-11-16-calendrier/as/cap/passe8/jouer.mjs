// Passe 8 : une seule session au doigt sur pub/calendrier.html (une adresse, deux vues), sans recharger : gestes en hauteur, on tourne,
// gestes en largeur, on revient, puis 1280 × 800 et la cave. Captures et mesures dans cap/passe8/.
import {createRequire} from 'module';
const require=createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer=require('puppeteer-core');const fs=require('fs');
const R='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-16-calendrier/as/';const C=R+'cap/passe8/';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const ecran=(w,h,mob=true)=>({width:w,height:h,isMobile:mob,hasTouch:mob,deviceScaleFactor:2,isLandscape:w>h});
const p=await b.newPage();await p.setViewport(ecran(390,844));const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await p.goto('file:///'+R+'pub/calendrier.html');await wait(900);const cdp=await p.target().createCDPSession();
async function vue(){const s=await p.evaluate(()=>{const e=document.querySelector('iframe.on');const r=e.getBoundingClientRect();return {src:e.src,x:r.left,y:r.top};});return {f:p.frames().find(f=>f.url()===s.src),x:s.x,y:s.y};}
async function T(type,x,y){await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1}]});}
async function drag(x,y,dx){await T('touchStart',x,y);await wait(60);for(let k=1;k<=14;k++){await T('touchMove',x+dx*k/14,y);await wait(25);}await wait(120);await T('touchEnd');await wait(500);}
async function tap(x,y){await T('touchStart',x,y);await wait(60);await T('touchEnd');await wait(350);}
async function rect(sel,centre=true){const v=await vue();const r=await v.f.evaluate((s,c)=>{const e=document.querySelector(s);if(!e)return null;if(c)e.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});const q=e.getBoundingClientRect();return {x:q.left,y:q.top,w:q.width,h:q.height};},sel,centre);
 if(!r)throw new Error('absent '+sel);await wait(120);const v2=await v.f.evaluate(s=>{const q=document.querySelector(s).getBoundingClientRect();return {x:q.left,y:q.top,w:q.width,h:q.height};},sel);return {x:v.x+v2.x,y:v.y+v2.y,w:v2.w,h:v2.h,cx:v.x+v2.x+v2.w/2,cy:v.y+v2.y+v2.h/2};}
async function tapSel(sel,centre=true){const r=await rect(sel,centre);await tap(r.cx,r.cy);return r;}
async function marque(js){const v=await vue();return v.f.evaluate(js);}
async function ecrire(sel,t){const v=await vue();await v.f.evaluate((s,t)=>{const e=document.querySelector(s);e.focus();e.value=t;e.dispatchEvent(new Event('input',{bubbles:true}));e.blur();},sel,t);await wait(100);}
async function cap(n){await p.screenshot({path:C+n+'.png'});}
async function etat(){const v=await vue();return v.f.evaluate(()=>{const t=s=>[...document.querySelectorAll(s)].map(e=>e.textContent.replace(/\s+/g,' ').trim()).filter(Boolean);
 const toast=document.querySelector('.as-toast'),nav=document.querySelector('nav.bot'),tr=toast&&toast.getBoundingClientRect(),nr=nav&&nav.getClientRects().length?nav.getBoundingClientRect():null;
 return {vue:document.documentElement.dataset.vue,W:innerWidth,tete:t('.q5-n b')[0],pastilles:Object.fromEntries([...document.querySelectorAll('.lane')].map(l=>[l.dataset.voie,(l.querySelector('.g2-rm')||{}).textContent||null])),
  blonde:Math.round(parseFloat(document.querySelector('.bar[data-chose="b-01"]').style.left)/parseFloat(document.querySelector('#fb .col').style.width)),
  nouv:t('#fb .as-nouv'),hors:t('#fb .as-hors'),toast:toast?toast.textContent.replace(/\s+/g,' ').trim():null,toastPos:tr?[Math.round(tr.left),Math.round(tr.top),Math.round(tr.width),Math.round(tr.height)]:null,
  toastSurNav:tr&&nr?tr.bottom>nr.top+1:false,rangees:[...document.querySelectorAll('#fb .lane>.lt')].map(e=>Math.round(e.getBoundingClientRect().top+scrollY))};});}
const out={};const note=async n=>{out[n]=await etat();};
async function ajouter(voie,nom,mt,i,moins,du){await tapSel('.lane[data-voie="'+voie+'"] .g2-c');await wait(300);await ecrire('.as-fn input',nom);if(mt!=null)await ecrire('.as-fm input',mt);
 if(moins)await tapSel('.as-sgn',false);if(du)await tapSel('.as-cu[data-du="'+du+'"]',false);await tapSel('.as-se[data-i="'+i+'"]');return tapSel('.as-sh-ok',false);}
try{
 // ---------- en hauteur ----------
 await cap('01-p-repos');await note('01-p-repos');
 await marque(()=>{window.scrollTo(0,0);});let r=await rect('.bar[data-chose="a-04"]');const r0=(await etat()).rangees;
 await drag(Math.min(r.x+r.w*.5,360),r.cy,-61);await note('02-p-f1a');out['02-p-f1a'].rangeesAvant=r0;await cap('02-p-f1a-message');
 await wait(7600);await note('02-p-f1a-parti');await cap('02b-p-f1a-parti');
 r=await rect('.bar[data-chose="b-01"]');await drag(r.x+r.w*.45,r.cy,183);await cap('03-p-f6b-alerte');
 await marque(()=>{const b=[...document.querySelectorAll('.as-al button')].find(x=>x.textContent.includes('Livrer'));if(b)b.setAttribute('data-z','1');});await tapSel('[data-z="1"]',false);
 await marque(()=>{const e=document.querySelector('.as-hors.as-liv');if(e)e.scrollIntoView({block:'center',behavior:'instant'});});await wait(200);await note('03-p-livrer');await cap('03-p-livrer-renvoi');
 // brassin par le + volant
 await tapSel('#fab',false);await wait(300);await tapSel('.as-ty[data-v="brassage"]',false);await tapSel('.as-rc',false);await tapSel('.as-se[data-i="3"]');await tapSel('.as-sh-ok',false);await wait(300);
 await note('04-p-brassin');await cap('04-p-brassin');
 // une fête qui coûte
 await tapSel('.lane[data-voie="evenement"] .g2-c');await wait(300);await ecrire('.as-fn input','Stand au marché');await ecrire('.as-fm input','150');await tapSel('.as-sgn',false);await tapSel('.as-se[data-i="2"]');await cap('05a-p-feuille-moins');
 await tapSel('.as-sh-ok',false);await wait(300);await note('05-p-fete-moins');await cap('05-p-fete-moins');
 // deux ventes en S49
 await ajouter('vente','Bar du Lac','200',2);await wait(300);await ajouter('vente','Épicerie Rolle','150',2);await wait(300);
 await marque(()=>{const e=[...document.querySelectorAll('.lane[data-voie="vente"] .k17-p.as-nouv')].pop();if(e)e.scrollIntoView({block:'center',behavior:'instant'});});await wait(200);await note('06-p-deux-ventes');await cap('06-p-deux-ventes');
 // Modifier la fête : S49 → S51
 await marque(()=>{const e=[...document.querySelectorAll('.lane[data-voie="evenement"] .as-nouv')].pop();e.setAttribute('data-z','2');});await tapSel('[data-z="2"]');await cap('07a-p-fete-detail');
 await tapSel('.as-det [data-as="mod"]',false);await wait(300);await tapSel('.as-se[data-i="4"]');await tapSel('.as-sh-ok',false);await wait(300);await note('07-p-modifier');await cap('07-p-modifier');
 const avant=await etat();
 // ---------- on tourne ----------
 await p.setViewport(ecran(844,390));await wait(1000);await marque(()=>window.scrollTo(0,0));await wait(200);await note('08-l-apres-rotation');await cap('08-l-apres-rotation');
 await marque(()=>{const e=document.querySelector('.lane[data-voie="vente"]');e.scrollIntoView({block:'start',behavior:'instant'});});await wait(200);await cap('08b-l-ventes');
 await ajouter('achat','Malt Vienne 25 kg','90',5);await wait(300);await note('09-l-achat');await cap('09-l-achat');
 r=await rect('.bar[data-chose="b-01"]');await drag(Math.max(r.x+20,Math.min(r.x+r.w*.45,800)),r.cy,-63);await note('09b-l-blonde');await cap('09b-l-blonde-ramenee');
 // ---------- on revient ----------
 await p.setViewport(ecran(390,844));await wait(1000);await marque(()=>window.scrollTo(0,0));await wait(200);await note('10-p-retour');await cap('10-p-retour');
 await marque(()=>{const e=document.querySelector('.lane[data-voie="achat"]');e.scrollIntoView({block:'center',behavior:'instant'});});await wait(200);await cap('10b-p-retour-achats');
 // ---------- 1280 × 800 ----------
 await p.setViewport(ecran(1280,800,false));await wait(1000);await note('11-d-1280');await cap('11-d-1280');
 // ---------- la cave ----------
 const cave=async()=>{for(const f of p.frames())await f.evaluate(()=>document.documentElement.setAttribute('data-theme','cave')).catch(()=>{});await wait(400);};
 await p.setViewport(ecran(390,844));await wait(900);await cave();await cap('12-p-cave');await p.setViewport(ecran(844,390));await wait(900);await cave();await cap('13-l-cave');await p.setViewport(ecran(1280,800,false));await wait(900);await cave();await cap('14-d-1280-cave');
 out.avantRotation=avant;
}catch(e){out.erreur=e.message;}
out.erreurs=errs;fs.writeFileSync(C+'_jeu.json',JSON.stringify(out,null,1));console.log(JSON.stringify({erreur:out.erreur||null,erreurs:errs.length}));await b.close();
