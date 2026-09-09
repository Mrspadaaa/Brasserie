import { verifyGraph } from './qa/verify-hop-graph.mjs';
// Browser plugin absent: compiled real App, existing isolated Puppeteer adapters.
import { buildHopRecipeQa } from './build-hop-recipe-qa.mjs';
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile,mkdir,writeFile } from 'node:fs/promises';
import { resolve,extname,sep } from 'node:path';
import { tmpdir } from 'node:os';
const buildDir=resolve(tmpdir(),'laffinee-hop-qa-nolo-build'),out=resolve(tmpdir(),'laffinee-nolo-qa-evidence');
await mkdir(out,{recursive:true});if(process.env.NOLO_QA_SKIP_BUILD!=='1')await buildHopRecipeQa(buildDir);
const server=createServer(async(req,res)=>{try{
 const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=resolve(buildDir,path==='/'?'tests/qa/hop-recipe/index.html':'.'+path);
 if(!file.startsWith(buildDir+sep)){res.writeHead(403);res.end();return;}
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png'})[extname(file)]||'application/octet-stream');res.end(await readFile(file));
}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--mute-audio']});
let active;const reports=[];
const button=async(page,text,partial=false)=>{const h=await page.waitForFunction((text,partial)=>[...document.querySelectorAll('button')].find(e=>e.getClientRects().length&&!e.disabled&&(partial?e.textContent.includes(text):e.textContent.trim()===text)),{},text,partial);await h.asElement().evaluate(e=>e.scrollIntoView({block:'center'}));await h.asElement().click();await h.dispose();};
const details=async(page,text,open=true)=>{const h=await page.waitForFunction(text=>[...document.querySelectorAll('summary')].find(e=>e.getClientRects().length&&e.textContent.includes(text)),{},text);if(await h.evaluate(e=>e.parentElement.open)!==open){await h.asElement().evaluate(e=>e.scrollIntoView({block:'center'}));await h.asElement().click();}await h.dispose();};
const field=async(page,label)=>{const h=await page.waitForFunction(label=>[...document.querySelectorAll('label')].filter(e=>e.getClientRects().length).find(e=>[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim()===label)?.control,{},label);return h.asElement();};
const select=async(page,label,value)=>{const h=await field(page,label);await h.select(value);await h.dispose();};
const fill=async(page,label,value)=>{const h=await field(page,label);await h.evaluate(e=>e.scrollIntoView({block:'center'}));await h.click({clickCount:3});await page.keyboard.press('Backspace');if(value)await h.type(value);await page.keyboard.press('Tab');await h.dispose();};
const capture=async(page,name,selector='[aria-label="Objectif NOLO"]')=>{
 const e=await page.$(selector);if(e)await e.evaluate(e=>e.scrollIntoView({block:'start'}));
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow: '+name);
 await page.screenshot({path:resolve(out,name+'.png')});
};
try{
 for(const width of process.env.NOLO_QA_PROBE?[390]:[320,390,1280]){
  const ctx=await browser.createBrowserContext(),page=await ctx.newPage();active=page;page.setDefaultTimeout(12000);
  await page.setViewport({width,height:1000,isMobile:width<600,hasTouch:width<600});await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  const errors=[],remote=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['warn','error'].includes(m.type()))errors.push(m.text());});
  page.on('request',r=>{requests.push(r.url());if(/^https?:/.test(r.url())&&!r.url().startsWith(base+'/'))remote.push(r.url());});
  const cdp=await page.createCDPSession();await cdp.send('Network.enable');await cdp.send('Network.setBlockedURLs',{urlPatterns:[{urlPattern:base+'/*',block:false}],urls:['http://*','https://*']});
  await page.evaluateOnNewDocument(()=>{if(!localStorage.getItem('laffinee_ui_state'))localStorage.setItem('laffinee_ui_state',JSON.stringify({app_active_tab:'production',production_subtab:'recipes'}));});
  await page.goto(base,{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__hopQa?.ready());
  await button(page,'📜 Recettes',true);await button(page,'+ Recette',true);await page.locator('#wz-title').fill('QA NOLO création '+width);
  const toggle=await page.$('[aria-label="Objectif NOLO"] input[type=checkbox]');await toggle.click();
  await page.waitForSelector('[data-nolo-status="indeterminate"]');
  assert.equal(await page.$$eval('[aria-label="Objectif NOLO"] details[open]',es=>es.length),0);
  assert.equal(await page.$('[data-nolo-band]'),null);
  await capture(page,'creation-'+width);
  await details(page,'Affiner le pilote');await details(page,'Préparer le pilote');await button(page,'Choisir Fermentis SafBrew LA-01 et sa conduite');
  await details(page,'Préparer le pilote',false);
  await details(page,'Moût, ajouts');await fill(page,'Extrait du moût minimum','6');await fill(page,'Extrait du moût maximum','6');
  await details(page,'Analyse des sucres');
  for(const [s,value] of [['Glucose','2'],['Fructose','0'],['Saccharose','0']]){await fill(page,s+' minimum',value);await fill(page,s+' maximum',value);}
  const complete=await page.waitForFunction(()=>[...document.querySelectorAll('label')].find(e=>e.textContent.includes('Profil complet :'))?.querySelector('input'));await complete.asElement().click();
  await page.waitForSelector('[data-nolo-status="within"]');
  await details(page,'Analyse des sucres',false);await details(page,'Moût, ajouts',false);
  await capture(page,'plafond-physique-'+width);
  await button(page,'Levure');await page.waitForSelector('[aria-label="Objectif NOLO"]');await capture(page,'levure-'+width);
  await button(page,'Récapitulatif');await button(page,'Enregistrer la recette');
  await page.waitForFunction(name=>window.__hopQa.storage.getRecipes().some(r=>r.name===name),{},'QA NOLO création '+width);
  const stored=await page.evaluate(name=>window.__hopQa.storage.getRecipes().find(r=>r.name===name), 'QA NOLO création '+width);
  assert.equal(stored.nolo.enabled,true);assert.equal(stored.fgTarget,null);assert(stored.nolo.scienceSnapshot);
  await page.reload({waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__hopQa?.ready());await button(page,'📜 Recettes',true);await button(page,'QA NOLO création '+width,true);
  await page.waitForSelector('[aria-label="Objectif NOLO"]');
  assert.equal(await page.$$eval('[aria-label="Objectif NOLO"] input, [aria-label="Objectif NOLO"] select',e=>e.length),0);
  await capture(page,'lecture-'+width);
  const before=await page.evaluate(()=>({writes:window.__hopQa.metrics.writes,calls:window.__hopQa.calls.length,rows:JSON.stringify(window.__hopQa.storage.getRecipes())}));
  const req=requests.length;
  await button(page,'Simuler une variante NOLO');await details(page,'Affiner le pilote');
  const start=performance.now();await select(page,'Procédé','restored');await page.waitForSelector('[data-nolo-status="within"]');const updateMs=performance.now()-start;
  await details(page,'Moût, ajouts');await details(page,'Analyses rattachées');
  await fill(page,'Méthode / référence du laboratoire','Analyse QA, marge connue');
  await fill(page,'Alcool analysé minimum','0.38');await fill(page,'Alcool analysé maximum','0.42');
  await button(page,'Conserver cette analyse dans la recette');await details(page,'Analyses rattachées',false);await details(page,'Moût, ajouts',false);
  await page.waitForFunction(()=>document.querySelector('[aria-label="Alcool au conditionnement"]').innerText.includes('confiance moyenne'));
  await capture(page,'analyse-'+width);
  await details(page,'Vigilances');await capture(page,'vigilances-'+width);await details(page,'Vigilances',false);
  await details(page,'Comparer les procédés');await details(page,'Fermentation complète + désalcoolisation');await capture(page,'comparaison-'+width);await details(page,'Comparer les procédés',false);
  await button(page,'Fermer la variante NOLO');
  assert.deepEqual(await page.evaluate(()=>({writes:window.__hopQa.metrics.writes,calls:window.__hopQa.calls.length,rows:JSON.stringify(window.__hopQa.storage.getRecipes())})),before);
  assert.deepEqual(requests.slice(req).filter(u=>/^https?:/.test(u)),[]);
  const perf=await page.evaluate(()=>{const q=window.__hopQa,r=q.nolo.recipe(20),times=[];for(let i=0;i<30;i++){const start=performance.now();q.nolo.raw(r);times.push(performance.now()-start);}return {maxMs:Math.max(...times),medianMs:times.sort((a,b)=>a-b)[15]};});assert(perf.maxMs<500);assert(updateMs<500);
  const back=await page.waitForFunction(()=>[...document.querySelectorAll('button')].find(b=>b.getClientRects().length&&['Retour','Fermer','Revenir'].includes(b.getAttribute('aria-label'))));await back.asElement().click();await back.dispose();
  const twenty=await page.evaluate(()=>{const qa=window.__hopQa,r=qa.nolo.recipe(20);qa.partialCoa();r.hops[0].hopLotId='qa-partial-coa';qa.seedRecipe(r);return r;});
  await button(page,'QA hefeweisse NOLO',true);await page.waitForSelector('[aria-label="Simulation de mes ajouts"]');
  // Finish loading the optional technical reference before measuring local simulation I/O.
  await details(page,'Composition, thiols et phénols');await page.waitForNetworkIdle({idleTime:300});await details(page,'Composition, thiols et phénols',false);
  const beforeHops=await page.evaluate(()=>({writes:window.__hopQa.metrics.writes,calls:window.__hopQa.calls.length})),hopRequests=requests.length,controls=[];
  for(const [all,cumulative] of [[false,false],[true,false],[false,true],[true,true]]){
    const t=performance.now();
    for(const [name,value] of [['Toutes les saveurs et la chimie',all],['Cumuler tous les ajouts',cumulative]]){
      const h=await page.$('[aria-label="Simulation de mes ajouts"] input[aria-label="'+name+'"]');if(await h.evaluate(e=>e.checked)!==value){await h.evaluate(e=>e.scrollIntoView({block:'center'}));await h.click();}
    }
    const proof=await verifyGraph(page,twenty,cumulative);assert(Object.values(proof.raw.overall.profile).every(v=>v.range===null));
    controls.push({all,cumulative,elapsedMs:performance.now()-t,chemistryRows:Object.keys(proof.raw.chemistry.introduced).length});
    await capture(page,'houblons-'+Number(all)+Number(cumulative)+'-'+width,'[aria-label="Simulation de mes ajouts"]');
  }
  await capture(page,'chimie-'+width,'[aria-label="Chimie des ajouts simulés"]');
  await details(page,'Composition, thiols et phénols');await capture(page,'coa-'+width,'[aria-label="Composition analytique"]');await details(page,'Composition, thiols et phénols',false);
  await button(page,'Explorer une variante');await page.waitForFunction(()=>document.body.innerText.includes('NOLO : intensités non étalonnées'));
  assert.deepEqual(await page.evaluate(()=>({writes:window.__hopQa.metrics.writes,calls:window.__hopQa.calls.length})),beforeHops);
  assert.deepEqual(requests.slice(hopRequests).filter(u=>/^https?:/.test(u)),[]);
  await page.keyboard.press('Tab');assert(await page.evaluate(()=>document.activeElement!==document.body));
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);reports.push({width,updateMs,perf,controls,errors,remoteRequests:0,simulationRequests:0,simulationWrites:0});
  await ctx.close();
 }
 await writeFile(resolve(out,'ui-report.json'),JSON.stringify({passed:true,reports},null,2));console.log(JSON.stringify({passed:true,out,reports},null,2));
}catch(e){if(active&&!active.isClosed()){await active.screenshot({path:resolve(out,'failure.png')});await writeFile(resolve(out,'failure.txt'),await active.evaluate(()=>document.body.innerText));}throw e;}
finally{await browser.close();await new Promise(r=>server.close(r));}
