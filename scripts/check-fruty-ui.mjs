// Browser plugin absent: use the repository's compiled App/Puppeteer workflow.
// All callable responses below come from isolated test adapters; no Gemini.
import {buildHopRecipeQa} from './build-hop-recipe-qa.mjs';
import {checkNuageScenarios} from './qa/nuage-scenarios.mjs';
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {tmpdir} from 'node:os';
const buildDir=resolve(tmpdir(),'laffinee-hop-qa-fruty-build'),out=resolve(tmpdir(),'laffinee-fruty-qa-evidence');
await mkdir(out,{recursive:true});if(process.env.FRUTY_QA_SKIP_BUILD!=='1')await buildHopRecipeQa(buildDir);
const server=createServer(async(req,res)=>{try{
 const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=resolve(buildDir,path==='/'?'tests/qa/hop-recipe/index.html':'.'+path);
 if(!file.startsWith(buildDir+sep)){res.writeHead(403);res.end();return;}
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png'})[extname(file)]||'application/octet-stream');res.end(await readFile(file));
}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--mute-audio']});
let active,stage='start';const reports=[];
const button=async(page,text,partial=false)=>{stage='button '+text;const h=await page.waitForFunction((text,partial)=>[...document.querySelectorAll('button')].find(e=>e.getClientRects().length&&!e.disabled&&(partial?e.textContent.includes(text):e.textContent.trim()===text)),{},text,partial);await h.asElement().evaluate(e=>e.scrollIntoView({block:'center'}));await h.asElement().click();await h.dispose();};
const details=async(page,text,open=true)=>{stage='details '+text;const h=await page.waitForFunction(text=>[...document.querySelectorAll('summary')].find(e=>e.getClientRects().length&&e.textContent.includes(text)),{},text);if(await h.evaluate(e=>e.parentElement.open)!==open){await h.asElement().evaluate(e=>e.scrollIntoView({block:'center'}));await h.asElement().click();}await h.dispose();};
const field=async(page,label)=>{const h=await page.waitForFunction(label=>[...document.querySelectorAll('label')].filter(e=>e.getClientRects().length).find(e=>[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim()===label)?.control,{},label);return h.asElement();};
const select=async(page,label,value)=>{stage='select '+label;const h=await field(page,label);await h.select(value);await h.dispose();};
const fill=async(page,label,value)=>{stage='fill '+label;const h=await field(page,label);await h.evaluate(e=>e.scrollIntoView({block:'center'}));await h.click();await page.keyboard.down('Control');await page.keyboard.press('KeyA');await page.keyboard.up('Control');await page.keyboard.press('Backspace');if(value)await h.type(value);assert.equal(await h.evaluate(e=>e.value),value,'Saisie '+label);await page.keyboard.press('Tab');await h.dispose();};
const capture=async(page,name,selector='[aria-label="Atelier des arômes de levure"]')=>{const e=await page.$(selector);if(e)await e.evaluate(e=>e.scrollIntoView({block:'start'}));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overflow '+name);await page.screenshot({path:resolve(out,name+'.png')});};
try{
 for(const width of process.env.FRUTY_QA_PROBE?[390]:[320,390,1280]){
  const context=await browser.createBrowserContext(),page=await context.newPage();active=page;page.setDefaultTimeout(10000);
  await page.setViewport({width,height:1000,isMobile:width<600,hasTouch:width<600});await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  const errors=[],remote=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{requests.push(r.url());if(/^https?:/.test(r.url())&&!r.url().startsWith(base+'/'))remote.push(r.url());});
  const cdp=await page.createCDPSession();await cdp.send('Network.enable');await cdp.send('Network.setBlockedURLs',{urlPatterns:[{urlPattern:base+'/*',block:false}],urls:['http://*','https://*']});
  await page.evaluateOnNewDocument(()=>localStorage.setItem('laffinee_ui_state',JSON.stringify({app_active_tab:'production',production_subtab:'recipes'})));
  await page.goto(base,{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__hopQa?.ready());
  await page.evaluate(()=>window.__hopQa.seedRecipe(window.__hopQa.nolo.fruty()));await page.reload({waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__hopQa?.ready());await page.evaluate(()=>window.__hopQa.nolo.mockOats());
  await button(page,'Recettes',true);await button(page,'Fruty',true);await page.waitForSelector('[aria-label="Modifier la recette"]');await page.click('[aria-label="Modifier la recette"]');
  await button(page,'Levure');await page.waitForSelector('[aria-label="Atelier des arômes de levure"]');
  assert.equal(await page.$$eval('[aria-label="Propositions NOLO"] button',es=>es.length),3);
  assert.match(await page.$eval('[aria-label="Atelier des arômes de levure"]',e=>e.innerText),/Potentiel PPG.*Flocons/);
  assert(!await page.evaluate(()=>document.body.innerText.includes('Banane · objectif')));
  await capture(page,'incomplet-'+width);
  // Opening the reserved button must open this draft, not an app-wide conversation.
  stage='companion';const shortcut=await page.waitForFunction(()=>[...document.querySelectorAll('[data-inline-companion]')].find(e=>e.getClientRects().length));await shortcut.asElement().click();await shortcut.dispose();
  await page.waitForFunction(()=>document.querySelector('[role="dialog"]')?.textContent.includes('Compagnon'));
  await page.waitForFunction(()=>window.__hopQa.nolo.inputs.some(c=>c.name==='getBrewerConversation'));
  const chat=await page.evaluate(()=>window.__hopQa.nolo.inputs.filter(c=>c.name==='getBrewerConversation').at(-1));assert.equal(chat.input.scope.kind,'draft');
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('[data-vaul-drawer][data-state="open"]'));
  await page.waitForFunction(()=>!document.querySelector('[data-vaul-overlay]')&&getComputedStyle(document.body).pointerEvents!=='none');
  assert(await page.$('[aria-label="Atelier des arômes de levure"]'));
  await button(page,'Compléter les données manquantes avec l’IA');await button(page,'Reprendre ces valeurs');
  await page.waitForFunction(()=>!document.querySelector('[aria-label="Atelier des arômes de levure"]').innerText.includes('Potentiel PPG à compléter'));
  const start=await page.evaluate(()=>({writes:window.__hopQa.metrics.writes,calls:window.__hopQa.calls.length})),requestStart=requests.length;
  await button(page,'Fermentis SafBrew LA-01',true);await page.waitForSelector('[aria-label="Proposition complète de fermentation"]');
  const expected=await page.evaluate(()=>window.__hopQa.nolo.proposals(window.__hopQa.nolo.fruty(true)).find(p=>p.id==='yeast-fermentis-safbrew-la-01').result.projection);
  const chart=await page.$eval('[aria-label="Projection de la proposition"]',e=>({min:+e.dataset.noloMin,max:+e.dataset.noloMax}));assert(Math.abs(chart.min-expected.min)<1e-9);assert(Math.abs(chart.max-expected.max)<1e-9);
  await capture(page,'proposition-'+width,'[aria-label="Proposition complète de fermentation"]');
  await button(page,'Appliquer cette proposition');await page.waitForFunction(()=>document.body.innerText.includes('Proposition appliquée au brouillon'));
  assert.equal(await page.evaluate(()=>window.__hopQa.metrics.writes),start.writes);assert.equal(await page.evaluate(()=>window.__hopQa.calls.length),start.calls);assert.equal(requests.length,requestStart);
  await capture(page,'applique-'+width);
  await button(page,'Récapitulatif',true);await button(page,'Enregistrer la recette');
  await page.waitForFunction(()=>window.__hopQa.storage.getRecipes().find(r=>r.id==='qa-fruty')?.yeast.hopIndexId==='yeast-fermentis-safbrew-la-01');
  const saved=await page.evaluate(()=>window.__hopQa.storage.getRecipes().find(r=>r.id==='qa-fruty'));assert(saved.yeast.qty>0);assert.deepEqual(saved.mash.steps.map(s=>s.tempC),[65,73]);assert(saved.nolo.planning.exactExtract);assert(saved.yeast.fermentationFacts);
  await page.reload({waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__hopQa?.ready());await button(page,'Recettes',true);await button(page,'Fruty',true);await capture(page,'lecture-'+width,'.recipe-reference');
  await details(page,'Objectif NOLO');const afterReload=await page.$eval('[aria-label="Projection au conditionnement"]',e=>+e.dataset.noloMax);assert(Math.abs(afterReload-expected.max)<1e-9);
  const perf=await page.evaluate(()=>{const r=window.__hopQa.nolo.fruty(true);r.hops=Array.from({length:20},()=>({...r.hops[0],weightG:10}));const times=[];for(let i=0;i<8;i++){const t=performance.now();window.__hopQa.nolo.proposals(r);times.push(performance.now()-t);}return {maxMs:Math.max(...times),medianMs:times.sort((a,b)=>a-b)[4]};});assert(perf.maxMs<500);
  await page.keyboard.press('Tab');assert(await page.evaluate(()=>document.activeElement!==document.body));
  // Independently recheck both saved pilots, all processes and the four graph modes.
  const pilots=await checkNuageScenarios({page,base,width,out,button,details,fill,select});
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);reports.push({width,chatScope:chat.input.scope.kind,projection:chart,performance:perf,pilots,simulationWrites:0,simulationRequests:0,errors});await context.close();
 }
 await writeFile(resolve(out,'report.json'),JSON.stringify({passed:true,reports},null,2));console.log(JSON.stringify({passed:true,out,reports},null,2));
}catch(e){if(active&&!active.isClosed()){await active.screenshot({path:resolve(out,'failure.png')});await writeFile(resolve(out,'failure.txt'),stage+'\n'+await active.evaluate(()=>document.body.innerText));}throw new Error(stage+': '+e.message,{cause:e});}
finally{await browser.close();await new Promise(r=>server.close(r));}
