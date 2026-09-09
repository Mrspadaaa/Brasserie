// Browser plugin unavailable: reuse the repository's compiled App + Puppeteer QA.
// Test adapters live outside src and the deployed build; no login bypass in production.
import { buildHopRecipeQa } from './build-hop-recipe-qa.mjs';
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
const buildDir=resolve(tmpdir(),'laffinee-hop-qa-yeast-build'),out=resolve(tmpdir(),'laffinee-yeast-qa-evidence');
await mkdir(out,{recursive:true});if(process.env.YEAST_QA_SKIP_BUILD!=='1')await buildHopRecipeQa(buildDir);
const server=createServer(async(req,res)=>{try{
 const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=resolve(buildDir,path==='/'?'tests/qa/hop-recipe/index.html':'.'+path);
 if(!file.startsWith(buildDir+sep)){res.writeHead(403);res.end();return;}
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png'})[extname(file)]||'application/octet-stream');res.end(await readFile(file));
}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--mute-audio']});
let active;const reports=[];
const button=async(page,text,partial=false)=>{const h=await page.waitForFunction((text,partial)=>[...document.querySelectorAll('button')].find(e=>e.getClientRects().length&&!e.disabled&&(partial?e.textContent.includes(text):e.textContent.trim()===text)),{},text,partial);await h.asElement().evaluate(e=>e.scrollIntoView({block:'center'}));await h.asElement().click();await h.dispose();};
const details=async(page,text,open=true)=>{const h=await page.waitForFunction(text=>[...document.querySelectorAll('summary')].find(e=>e.getClientRects().length&&e.textContent.includes(text)),{},text);if(await h.evaluate(e=>e.parentElement.open)!==open){await h.asElement().evaluate(e=>e.scrollIntoView({block:'center'}));await h.asElement().click();}await h.dispose();};
const field=async(page,label)=>{const h=await page.waitForFunction(label=>[...document.querySelectorAll('label')].find(e=>e.getClientRects().length&&e.textContent.trim()===label)?.control,{},label);return h.asElement();};
const select=async(page,label,value)=>{const h=await field(page,label);await h.select(value);await h.dispose();};
const fill=async(page,label,value)=>{const h=await field(page,label);await h.evaluate(e=>e.scrollIntoView({block:'center'}));await h.click({clickCount:3});await page.keyboard.press('Backspace');if(value)await h.type(value);await page.keyboard.press('Tab');await h.dispose();};
const capture=async(page,name,selector='[aria-label="Atelier des arômes de levure"]')=>{
 const e=await page.$(selector);if(e)await e.evaluate(e=>e.scrollIntoView({block:'start'}));
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow: '+name);
 await page.screenshot({path:resolve(out,name+'.png')});
};
const graph=async(page)=>{
 const errors=await page.evaluate(()=>{const failures=[];
  for(const figure of document.querySelectorAll('[aria-label="Calendrier des températures de fermentation"]')){
   if(!figure.getClientRects().length)continue;const min=+figure.dataset.tempMin,max=+figure.dataset.tempMax,total=+figure.dataset.totalDays;
   const width=figure.querySelector('svg').viewBox.baseVal.width;
   for(const g of figure.querySelectorAll('[data-step]')){
    const line=g.querySelector('[data-setpoint]'),y=166-(+g.dataset.temp-min)/(max-min)*146;
    if(Math.abs(+line.getAttribute('y1')-y)>1e-6)failures.push('Temperature ordinate mismatch');
    for(const [edge,name] of [['1','start'],['2','end']])if(Math.abs(+line.getAttribute('x'+edge)-(42+ +g.dataset[name]/total*(width-60)))>1e-6)failures.push('Day abscissa mismatch');
   }
  }return failures;
 });assert.deepEqual(errors,[]);
};
try{
 for(const width of process.env.YEAST_QA_PROBE?[390]:[320,390,1280]){
  const ctx=await browser.createBrowserContext(),page=await ctx.newPage();active=page;page.setDefaultTimeout(12000);
  await page.setViewport({width,height:1000,isMobile:width<600,hasTouch:width<600});await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  const errors=[],remote=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['warn','error'].includes(m.type()))errors.push(m.text());});
  page.on('request',r=>{requests.push(r.url());if(/^https?:/.test(r.url())&&!r.url().startsWith(base+'/'))remote.push(r.url());});
  const cdp=await page.createCDPSession();await cdp.send('Network.enable');await cdp.send('Network.setBlockedURLs',{urlPatterns:[{urlPattern:base+'/*',block:false}],urls:['http://*','https://*']});
  await page.evaluateOnNewDocument(()=>{if(!localStorage.getItem('laffinee_ui_state'))localStorage.setItem('laffinee_ui_state',JSON.stringify({app_active_tab:'production',production_subtab:'recipes'}));});
  await page.goto(base,{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__hopQa?.ready());
  await button(page,'📜 Recettes',true);await button(page,'+ Recette',true);await page.locator('#wz-title').fill('QA levure '+width);await button(page,'Levure');
  await page.waitForSelector('[aria-label="Atelier des arômes de levure"]');
  // Creation opens the chooser for an empty recipe. Changing six objectives is local.
  await button(page,'Choisir pour un arôme');
  const start={requests:requests.length,...await page.evaluate(()=>({writes:window.__hopQa.metrics.writes,calls:window.__hopQa.calls.length}))};
  for(const goal of ['banana','balanced','clean','fruit','phenolic','thiols']){
   await select(page,'Objectif de fermentation',goal);await graph(page);
   const plan=await page.$eval('[aria-label="Programme de levure proposé"]',e=>e.innerText);
   assert(!plan.includes('NaN')&&!plan.includes('Infinity'));await capture(page,`objectif-${goal}-${width}`);
  }
  assert.equal(requests.length,start.requests);assert.equal(await page.evaluate(()=>window.__hopQa.metrics.writes),start.writes);assert.equal(await page.evaluate(()=>window.__hopQa.calls.length),start.calls);
  await select(page,'Objectif de fermentation','banana');await details(page,'Ajuster l’ensemencement');
  await fill(page,'Température du palier 1 (°C)','30');
  assert(await page.$eval('[aria-label="Programme de levure proposé"]',e=>[...e.querySelectorAll('button')].find(b=>b.textContent.includes('Appliquer cette levure')).disabled));
  await fill(page,'Température du palier 1 (°C)','20');await fill(page,'Durée du palier 1 (jours)','');
  assert.equal(await page.$('[aria-label="Calendrier des températures de fermentation"]'),null);
  await fill(page,'Durée du palier 1 (jours)','7');await graph(page);await capture(page,`reglages-${width}`);
  await details(page,'Ajuster l’ensemencement',false);await details(page,'Conseils pour développer');
  assert.match(await page.$eval('[aria-label="Leviers de fermentation pour cet objectif"]',e=>e.innerText),/confiance (moyenne|élevée)/);
  await capture(page,`leviers-${width}`,'[aria-label="Leviers de fermentation pour cet objectif"]');await details(page,'Conseils pour développer',false);
  await details(page,'Chimie des arômes et sous-produits');await capture(page,`chimie-${width}`,'[aria-label="Atelier des arômes de levure"] details[open]');await details(page,'Chimie des arômes et sous-produits',false);
  await details(page,'Calcul expérimental des phénols');await button(page,'Reproduire le point de validation publié');
  const lab=await page.evaluate(()=>{
   const s=window.__hopQa.yeast.science().phenolStudy,v=s.validation,raw=window.__hopQa.yeast.phenols(s,{...v,yeastId:s.yeastId,protocolMatched:true,wortPlato:s.wortPlato,pitchMillionCellsMl:s.pitchMillionCellsMl});
   const proof=[];for(const [id,key] of [['4VG','vg'],['4VP','vp']]){
    const row=document.querySelector('[data-compound="'+id+'"]'),r=raw[key].range,track=row.querySelector('[data-scale-min]'),span=track.querySelector('span'),a=+track.dataset.scaleMin,b=+track.dataset.scaleMax;
    proof.push({id,range:r,label:row.innerText,left:parseFloat(span.style.left),width:parseFloat(span.style.width),expectedLeft:100*(r.min-a)/(b-a),expectedWidth:100*(r.max-r.min)/(b-a)});
   }return proof;
  });
  await writeFile(resolve(out,"lab-debug.json"),JSON.stringify(lab,null,2));
  for(const p of lab){assert(Math.abs(p.left-p.expectedLeft)<1e-4);assert(Math.abs(p.width-p.expectedWidth)<1e-4);assert.match(p.label,/mg\/L.*confiance faible/);}
  await capture(page,`phenols-${width}`,'[aria-label="Laboratoire expérimental DM303"]');await details(page,'Calcul expérimental des phénols',false);
  // A missing reference import can fail, then be retried without applying stale values.
  await select(page,'Objectif de fermentation','phenolic');await page.evaluate(()=>window.__hopQa.failNext());await button(page,'Appliquer cette levure et ces paliers');
  await page.waitForFunction(()=>[...document.querySelectorAll('[role="alert"]')].some(e=>e.textContent.includes('persistance refusée')));await capture(page,`persistance-refusee-${width}`);
  await button(page,'Appliquer cette levure et ces paliers');await page.waitForFunction(()=>document.body.innerText.includes('Levure et paliers appliqués'));
  await select(page,'Objectif de fermentation','banana');await button(page,'Appliquer cette levure et ces paliers');
  await page.waitForFunction(()=>document.body.innerText.includes('Levure et paliers appliqués'));await button(page,'Récapitulatif',true);await button(page,'Enregistrer la recette');
  await page.waitForFunction(name=>window.__hopQa.storage.getRecipes().some(r=>r.name===name),{},'QA levure '+width);
  const saved=await page.evaluate(name=>window.__hopQa.storage.getRecipes().find(r=>r.name===name),'QA levure '+width);assert(saved.yeast.hopIndexId);assert(saved.yeastGuide);
  await page.reload({waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__hopQa?.ready());await button(page,'📜 Recettes',true);await button(page,'QA levure '+width,true);
  await page.waitForSelector('[aria-label="Conduite de levure de la recette"]');assert.equal(await page.$$eval('[aria-label="Conduite de levure de la recette"] input, [aria-label="Conduite de levure de la recette"] select',e=>e.length),0);
  await graph(page);await capture(page,`lecture-${width}`,'[aria-label="Conduite de levure de la recette"]');
  const before=await page.evaluate(()=>({rows:JSON.stringify(window.__hopQa.storage.getRecipes()),writes:window.__hopQa.metrics.writes,calls:window.__hopQa.calls.length}));const beforeRequests=requests.length;
  await button(page,'Simuler une variante de levure');await details(page,'Tester mes températures');await fill(page,'Température du scénario 1 (°C)','24');await graph(page);await capture(page,`variante-${width}`);
  await button(page,'Choisir pour un arôme');await select(page,'Objectif de fermentation','clean');await button(page,'Appliquer cette levure et ces paliers');await page.waitForFunction(()=>document.body.innerText.includes('Variante locale mise à jour'));
  await button(page,'Analyser ma levure');await button(page,'Fermer la variante de levure');
  assert.deepEqual(await page.evaluate(()=>({rows:JSON.stringify(window.__hopQa.storage.getRecipes()),writes:window.__hopQa.metrics.writes,calls:window.__hopQa.calls.length})),before);assert.equal(requests.length,beforeRequests);
  // The user's actual Diamond recipe: no guide required for agreed manufacturer facts.
  await page.evaluate(()=>window.__hopQa.seedRecipe(window.__hopQa.recipe()));await page.reload({waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__hopQa?.ready());
  await button(page,'📜 Recettes',true);await button(page,'Test houb',true);await page.waitForSelector('[aria-label="Résultat de ma fermentation"]');
  const actual=await page.$eval('[aria-label="Résultat de ma fermentation"]',e=>e.innerText);
  assert.match(actual,/Diamond/);assert.match(actual,/10–15 °C/);assert.match(actual,/1,007–1,011 SG/);assert.match(actual,/19 °C, hors de la fenêtre/);
  await capture(page,`diamond-${width}`,'[aria-label="Résultat de ma fermentation"]');
  await button(page,'Simuler une variante de levure');await details(page,'Tester mes températures');
  const updateStart=performance.now();await fill(page,'Température du scénario 1 (°C)','12');await graph(page);const updateMs=performance.now()-updateStart;assert(updateMs<500);
  await fill(page,'Température du scénario 2 (°C)','');await graph(page);
  assert.equal(await page.$('[aria-label="Résultat de ma fermentation"] [data-step="1"]'),null);
  await capture(page,`partiel-${width}`);
  await fill(page,'Durée du scénario 2 (j)','');
  assert.equal(await page.$$eval('[aria-label="Résultat de ma fermentation"] [data-setpoint]',e=>e.length),1);
  await button(page,'Fermer la variante de levure');
  const perf=await page.evaluate(()=>{const qa=window.__hopQa,r=qa.recipe();r.fermentation=Array.from({length:20},(_,i)=>({kind:'primaire',name:'Palier '+i,tempC:12,days:1}));const timings=[];for(let i=0;i<30;i++){const t=performance.now();qa.yeast.raw(r);timings.push(performance.now()-t);}return {maxMs:Math.max(...timings),medianMs:timings.sort((a,b)=>a-b)[15]};});assert(perf.maxMs<500);
  // Keyboard focus remains visible in a real rendered panel.
  await page.keyboard.press('Tab');assert(await page.evaluate(()=>document.activeElement!==document.body));
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);reports.push({width,objectives:6,lab,performance:{...perf,renderedUpdateMs:updateMs},errors,remoteRequests:remote.length,simulationWrites:0,simulationRequests:0,readonlyVariantWrites:0});
  await ctx.close();
 }
 await writeFile(resolve(out,'report.json'),JSON.stringify({passed:true,reports},null,2));console.log(JSON.stringify({passed:true,out,reports:reports.map(({lab,...r})=>r)},null,2));
}catch(e){if(active&&!active.isClosed()){await active.screenshot({path:resolve(out,'failure.png')});await writeFile(resolve(out,'failure.txt'),await active.evaluate(()=>document.body.innerText));}throw e;}
finally{await browser.close();await new Promise(r=>server.close(r));}
