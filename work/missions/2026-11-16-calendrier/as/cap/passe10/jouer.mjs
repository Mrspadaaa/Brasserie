import {createRequire} from 'module';
const require=createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer=require('puppeteer-core');
const R='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-16-calendrier/as/';
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));const out={};
async function page(f,w,h,theme){const p=await b.newPage();await p.setViewport({width:w,height:h,isMobile:true,hasTouch:true,deviceScaleFactor:2,isLandscape:w>h});
 p.errs=[];p.on('pageerror',e=>p.errs.push(e.message));p.on('console',m=>{if(m.type()==='error')p.errs.push(m.text())});
 await p.goto('file:///'+R+f);if(theme)await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);await wait(400);p.cdp=await p.target().createCDPSession();return p;}
async function tap(p,sel){const r=await p.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const b=e.getBoundingClientRect();return {x:b.left+b.width/2,y:b.top+b.height/2};},sel);if(!r)return false;
 await p.cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x,y:r.y,id:1}]});await wait(60);await p.cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait(450);return true;}
const cap=(p,n)=>p.screenshot({path:R+'cap/passe10/'+n+'.png'});
const mes=p=>p.evaluate(()=>{const q=s=>document.querySelector(s),r=e=>{if(!e)return null;const b=e.getBoundingClientRect();return [Math.round(b.left),Math.round(b.top),Math.round(b.right),Math.round(b.bottom)];};
 const pa=q('.as-pa'),nav=q('nav.bot');return {fab:r(q('#fab')),fabTxt:q('#fab').textContent.trim(),aria:[q('#fab').getAttribute('aria-label'),q('#fab').getAttribute('aria-expanded')],nav:r(nav),pile:r(pa),
  lignes:pa?[...pa.querySelectorAll('button')].map(b=>{const x=b.getBoundingClientRect();return b.textContent.replace(/\s+/g,' ').trim()+' ['+Math.round(x.height)+'px'+(x.top<0||x.bottom>innerHeight?' HORS':'')+']';}):[],
  debord:pa?pa.scrollHeight-pa.clientHeight:null,focus:document.activeElement&&document.activeElement.textContent.trim().slice(0,30),
  feuille:q('.as-sh')?[...q('.as-sh').querySelectorAll('[aria-pressed=true]')].map(x=>x.textContent.trim()).join(' / ')+' | '+(q('.as-sh-ok')||{}).textContent:null,toast:(q('.as-toast')||{}).textContent||null,cases:document.querySelectorAll('.k14-ouv').length};});
for(const [th,suf] of [[null,'clair'],['cave','sombre']]){
 const p=await page('cal.html',390,844,th);await cap(p,'p-'+suf+'-ferme');out['p-'+suf+'-ferme']=await mes(p);
 await tap(p,'#fab');await cap(p,'p-'+suf+'-ouvert');out['p-'+suf+'-ouvert']=await mes(p);
 await tap(p,'.as-pa [data-v="evenement"]');await cap(p,'p-'+suf+'-fete');out['p-'+suf+'-fete']=await mes(p);
 await tap(p,'.as-sh-x');await tap(p,'#fab');await tap(p,'.as-pa [data-pa="Entrer une facture"]');await cap(p,'p-'+suf+'-facture');out['p-'+suf+'-facture']=await mes(p);
 await tap(p,'#fab');await p.cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:18,y:300,id:1}]});await wait(60);await p.cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait(450);out['p-'+suf+'-voile']=await mes(p);
 await tap(p,'#fab');await tap(p,'#fab');out['p-'+suf+'-refait']=await mes(p);
 await tap(p,'#fab');await tap(p,'.as-pa [data-v="brassage"]');await cap(p,'p-'+suf+'-brassin');out['p-'+suf+'-brassin']=await mes(p);
 out['p-'+suf+'.err']=p.errs;await p.close();}
for(const [th,suf] of [[null,'clair'],['cave','sombre']]){
 const p=await page('cal-paysage.html',844,390,th);await tap(p,'#fab');await cap(p,'l-'+suf+'-ouvert');out['l-'+suf+'-ouvert']=await mes(p);
 await tap(p,'.as-pa [data-v="charge"]');await cap(p,'l-'+suf+'-papier');out['l-'+suf+'-papier']=await mes(p);out['l-'+suf+'.err']=p.errs;await p.close();}
await b.close();(await import('fs')).writeFileSync(R+'cap/passe10/_jeu.json',JSON.stringify(out,null,1));console.log(JSON.stringify(out));
