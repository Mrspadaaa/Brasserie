// Critique 7 : pub/calendrier.html au doigt, une seule session (390 × 844 tactile), puis on tourne (844 × 390) sans recharger, puis on revient.
import {createRequire} from 'module';
const require=createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer=require('puppeteer-core');const fs=require('fs');
const R='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-16-calendrier/as/';const C=R+'cap/critique7/';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const out={log:[]};const L=(k,v)=>{out[k]=v;};
const p=await b.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));p.on('console',m=>{if(m.type()==='error')p.errs.push(m.text())});
const VP={width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2};const VL={width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:2,isLandscape:true};
await p.setViewport(VP);await p.goto('file:///'+R+'pub/calendrier.html');await wait(900);
const cdp=await p.target().createCDPSession();
const FR=v=>p.frames().find(f=>f.url().endsWith(v+'.html'));
const F=()=>FR(p.viewport().width>p.viewport().height?'paysage':'portrait');
async function T(type,x,y){await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1}]});}
async function drag(x,y,dx,dy){await T('touchStart',x,y);await wait(60);for(let k=1;k<=14;k++){await T('touchMove',x+dx*k/14,y+dy*k/14);await wait(25);}await wait(120);await T('touchEnd');await wait(350);}
async function tap(x,y){await T('touchStart',x,y);await wait(60);await T('touchEnd');await wait(320);}
async function appui(x,y,ms=700){await T('touchStart',x,y);await wait(ms);await T('touchEnd');await wait(300);}
let n=0;async function cap(nom){n++;await p.screenshot({path:C+String(n).padStart(2,'0')+'-'+nom+'.png'});}
async function rect(sel,vu=true){const f=F();if(vu){await f.evaluate(s=>{const e=document.querySelector(s);if(e)e.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});},sel);await wait(150);}
 return f.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height,cx:r.left+r.width/2,cy:r.top+r.height/2};},sel);}
async function tapSel(sel,vu=true){const r=await rect(sel,vu);if(!r)throw new Error('absent '+sel);await tap(Math.min(r.cx,p.viewport().width-20),r.cy);return r;}
async function marque(s,t){return F().evaluate((s,t)=>{const b=[...document.querySelectorAll(s)].find(x=>x.textContent.includes(t));if(b){b.setAttribute('data-z7','1');return true;}return false;},s,t);}
async function tapTxt(s,t){if(!await marque(s,t))throw new Error('pas de bouton '+t);await tapSel('[data-z7="1"]');await F().evaluate(()=>document.querySelectorAll('[data-z7]').forEach(e=>e.removeAttribute('data-z7')));}
const txt=sel=>F().evaluate(s=>[...document.querySelectorAll(s)].map(e=>e.textContent.replace(/\s+/g,' ').trim()).join(' | '),sel);
const etat=fr=>fr.evaluate(()=>({tete:((document.querySelector('.q5-n')||{}).textContent||'').replace(/\s+/g,' ').trim(),nouv:[...document.querySelectorAll('.as-nouv')].map(e=>e.textContent.replace(/\s+/g,' ').trim().slice(0,40)),
 pills:Object.fromEntries([...document.querySelectorAll('.lane[data-voie]')].map(l=>[l.dataset.voie,(l.querySelector('.g2-rm')||{}).textContent])),
 blonde:(document.querySelector('.bar[data-chose="b-01"] .k12-jg')||{}).textContent,pins:[...document.querySelectorAll('.lane[data-voie="vente"] .k17-p')].filter(e=>e.getClientRects().length).map(e=>e.textContent.trim()),
 toast:((document.querySelector('.as-toast')||{}).textContent||'').replace(/\s+/g,' ').trim()||null,per:(document.querySelector('.q-per')||{}).textContent,scrollY:Math.round(scrollY)}));
async function pas(nom,fn){try{const r=await fn();out.log.push([nom,r===undefined?'ok':r]);}catch(e){out.log.push([nom,'ERREUR '+e.message]);await cap('ERR-'+nom);}}
const top0=()=>F().evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
const CW=()=>p.viewport().width>500?63:61;

/* ---------- PORTRAIT ---------- */
await cap('p-repos');L('p0',await etat(FR('portrait')));
await pas('p-f4b porter',async()=>{const r=await rect('.bar[data-chose="b-02"]');await tap(Math.min(r.cx,360),r.cy);await cap('p-f4b');return await txt('.as-det');});
await pas('p-f5a appui',async()=>{const r=await rect('.bar[data-chose="e-01"]');await appui(r.cx,r.cy);await cap('p-f5a-menu');const m=await txt('.as-menu');const ret=await rect('.as-menu [data-as="ret"]',false);if(ret){await tap(ret.cx,ret.cy);await cap('p-f5a-retire');}
 const u=await rect('.as-toast button',false);if(u){await tap(u.cx,u.cy);await cap('p-f5a-annule');}return {m,apres:await txt('.q5-n')};});
await pas('p-f1a',async()=>{const r=await rect('.bar[data-chose="a-04"]');await drag(Math.min(r.cx,360),r.cy,-CW(),0);await cap('p-f1a');return await txt('.as-toast');});
await pas('p-blonde',async()=>{const g=await rect('.bar[data-chose="b-01"] .grip.g1');await drag(g.cx,g.cy,CW(),0);await cap('p-f2a');const r=await rect('.bar[data-chose="b-01"]',false);await drag(r.x+r.w*0.4,r.cy,CW(),0);await wait(400);await cap('p-f6b');
 const al=await txt('.as-al');await tapTxt('.as-al button','Livrer');await wait(400);await cap('p-livrer');return {al,toast:await txt('.as-toast')};});
await pas('p-fab-brassin',async()=>{await top0();await tapSel('#fab',false);await tapSel('.as-ty[data-v="brassage"]');await cap('p-fab-type');await tapSel('.as-rc');await tapSel('.as-fm input');await p.keyboard.type('420');await tapSel('.as-se[data-i="3"]');await cap('p-fab-feuille');
 await tapSel('.as-sh-ok');await wait(400);await cap('p-fab-pose');const t=await txt('.as-toast');await tapSel('.lane[data-voie="brassage"] .bar.as-nouv');await wait(250);await cap('p-fab-touche');return {t,det:await txt('.as-det')};});
const NOMS={brassage:['Saison de printemps','300'],vente:[null,null],evenement:['Apéro des voisins','100'],achat:['Houblon Citra 1 kg','100'],renovation:['Peinture de la cave','150'],activite:['Nettoyer les fûts',null],charge:['Facture Brouwland','100']};
for(const v of Object.keys(NOMS))await pas('p-plus-'+v,async()=>{await tapSel('.lane[data-voie="'+v+'"] .g2-c');await wait(250);const [nm,mt]=NOMS[v];if(nm){await tapSel('.as-fn input');await p.keyboard.type(nm);}if(mt){await tapSel('.as-fm input');await p.keyboard.type(mt);}
 await cap('p-plus-'+v+'-feuille');const sheet=await txt('.as-sh');await tapSel('.as-sh-ok');await wait(450);await cap('p-plus-'+v+'-pose');return {sheet:sheet.slice(0,220),toast:await txt('.as-toast'),pill:(await etat(F())).pills[v]};});
await pas('p-deuxieme-vente',async()=>{await tapSel('.lane[data-voie="vente"] .g2-c');await F().evaluate(()=>{for(const q of ['.as-fn input','.as-fm input']){const i=document.querySelector(q);if(i){i.value='';i.dispatchEvent(new Event('input',{bubbles:true}));}}});
 await tapSel('.as-fn input');await p.keyboard.type('Bar du Lac');await tapSel('.as-fm input');await p.keyboard.type('200');await tapSel('.as-se[data-i="2"]');await tapSel('.as-sh-ok');await wait(450);await rect('.lane[data-voie="vente"]');await cap('p-deux-ventes');return await txt('.as-toast');});
await pas('p-modifier-achat',async()=>{await tapSel('.lane[data-voie="achat"] .as-nouv');await wait(200);await cap('p-achat-touche');await tapTxt('.as-det button','Modifier');await wait(300);await tapSel('.as-se[data-i="4"]');await cap('p-modifier-feuille');await tapSel('.as-sh-ok');await wait(450);await cap('p-modifie');return await txt('.as-toast');});
await pas('p-retirer-activite',async()=>{await tapSel('.lane[data-voie="activite"] .as-nouv');await wait(200);await cap('p-activite-touche');await tapSel('.as-det [data-as="ret"]',false);await wait(300);await cap('p-retire');const t=await txt('.as-toast');const u=await rect('.as-toast button',false);if(u){await tap(u.cx,u.cy);await wait(300);await cap('p-retire-annule');}return t;});
await wait(7500);
for(const [k,y] of [['haut',0],['milieu',420],['bas',2000]]){await F().evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),y);await wait(200);await cap('p-cumul-'+k);}
await pas('p-c2b',async()=>{await top0();const r=await rect('[data-booster="mouvements"]',false);await drag(r.x+r.w*0.2,r.y+r.h*0.55,r.w*0.17,0);await cap('p-c2b');return await txt('.as-bulle');});
await pas('p-c3a',async()=>{const r=await rect('[data-booster="mouvements"]',false);await T('touchStart',r.x+r.w*0.594,r.y+r.h*0.6);await wait(700);await cap('p-c3a-pendant');await T('touchEnd');await wait(300);return await txt('.as-gk');});
L('pAvantRotation',await etat(FR('portrait')));L('lAvantRotation',await etat(FR('paysage')));

/* ---------- ON TOURNE ---------- */
await p.setViewport(VL);await wait(900);await cap('l-apres-rotation');
L('rotation1',{vue:await p.evaluate(()=>document.documentElement.dataset.vue),l:await etat(FR('paysage'))});
for(const [k,y] of [['milieu',300],['bas',2000]]){await F().evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),y);await wait(200);await cap('l-rot-'+k);}
await pas('l-fab-brassin',async()=>{await top0();await tapSel('#fab',false);await tapSel('.as-ty[data-v="brassage"]');await tapSel('.as-rc');await tapSel('.as-fm input');await p.keyboard.type('380');await tapSel('.as-se[data-i="5"]');await cap('l-fab-feuille');await tapSel('.as-sh-ok');await wait(450);await cap('l-fab-pose');return await txt('.as-toast');});
await pas('l-plus-achat',async()=>{await tapSel('.lane[data-voie="achat"] .g2-c');await tapSel('.as-fn input');await p.keyboard.type('Malt pils 25 kg');await tapSel('.as-fm input');await p.keyboard.type('60');await cap('l-achat-feuille');await tapSel('.as-sh-ok');await wait(450);await cap('l-achat-pose');return await txt('.as-toast');});
await pas('l-blonde',async()=>{const g=await rect('.bar[data-chose="b-01"] .grip.g1');await drag(g.cx,g.cy,CW(),0);await cap('l-f2a');return await txt('.as-al');});
await pas('l-c1d',async()=>{await top0();const r=await rect('.q-brosse i:last-child',false);await drag(r.cx,r.cy,p.viewport().width-r.cx-4,0);await cap('l-c1d');return await txt('.q-per');});
L('lAvantRetour',await etat(FR('paysage')));

/* ---------- ON REVIENT ---------- */
await p.setViewport(VP);await wait(900);await cap('p-apres-retour');L('pApresRetour',await etat(FR('portrait')));
for(const v of ['portrait','paysage'])await FR(v).evaluate(()=>document.documentElement.setAttribute('data-theme','cave'));await wait(200);await cap('p-cave');
await p.setViewport(VL);await wait(800);await cap('l-cave');
await p.setViewport({width:1280,height:800});await wait(800);await cap('d-1280');
L('dims',await p.evaluate(()=>[...document.querySelectorAll('iframe')].map(f=>[f.id,f.className,Math.round(f.getBoundingClientRect().width),Math.round(f.getBoundingClientRect().height)])));
L('errs',p.errs);await b.close();fs.writeFileSync(C+'_jeu.json',JSON.stringify(out,null,1));console.log('fini, erreurs :',p.errs.length,'captures :',n);
