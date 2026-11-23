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
const buildDir=resolve(tmpdir(),'laffinee-hop-qa-water-hops-build'),out=resolve(tmpdir(),'laffinee-water-hops-qa-evidence');
await mkdir(out,{recursive:true});if(process.env.WATER_HOPS_SKIP_BUILD!=='1')await buildHopRecipeQa(buildDir);
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
const painted=page=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
async function waterBounds(page) {
 await painted(page);
 return page.evaluate(()=>{
  const c=document.querySelector('[data-water-controls]'), rect=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height,width:r.width};};
  const main=c.closest('main'), nodes=[...c.querySelectorAll('button:not(:disabled),input:not(:disabled)')];
  const obscured=nodes.filter(n=>{const r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return !hit || !(n.contains(hit) || (n.matches('input[type=range]') && n.parentElement.contains(hit)));}).map(n=>n.getAttribute('aria-label')||n.textContent.trim());
  return {controls:rect(c),main:rect(main),radar:rect(c.querySelector('svg[role="img"]')),slider:rect(c.querySelector('.water-ratio-compact')),acids:rect(c.querySelector('[data-water-acids]')),salts:c.querySelectorAll('.water-salt-grid>li').length,obscured,overflow:document.documentElement.scrollWidth>innerWidth};
 });
}
try{
 for(const [width,height] of process.env.WATER_HOPS_PROBE?[[390,740]]:[[320,700],[390,700],[320,740],[390,740],[390,844],[1280,900]]){
  const context=await browser.createBrowserContext(),page=await context.newPage();active=page;page.setDefaultTimeout(10000);
  await page.setViewport({width,height,isMobile:width<600,hasTouch:width<600});await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  const errors=[],remote=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{requests.push(r.url());if(/^https?:/.test(r.url())&&!r.url().startsWith(base+'/'))remote.push(r.url());});
  const cdp=await page.createCDPSession();await cdp.send('Network.enable');await cdp.send('Network.setBlockedURLs',{urlPatterns:[{urlPattern:base+'/*',block:false}],urls:['http://*','https://*']});
  await page.evaluateOnNewDocument(()=>localStorage.setItem('laffinee_ui_state',JSON.stringify({app_active_tab:'production',production_subtab:'recipes'})));
  await page.goto(base,{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__hopQa?.ready());
  await page.evaluate(()=>window.__hopQa.seedRecipe(window.__hopQa.nolo.fruty()));await page.reload({waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__hopQa?.ready());await page.evaluate(()=>{window.__hopQa.nolo.mockOats();window.__hopQa.nolo.mockHop();});
  await button(page,'Recettes',true);await button(page,'Fruty',true);await page.click('[aria-label="Modifier la recette"]');await button(page,'Eau et sels');if(width<600)await button(page,'2. Sels',true);
  stage='water initial';const measurements=[await waterBounds(page)];
  await page.screenshot({path:resolve(out,`water-${width}-${height}-initial.png`)});
  const assertWater=r=>{assert.equal(r.salts,9);assert(!r.overflow);if(width<600){assert(r.radar.height>=159,'readable radar');assert(r.controls.top>=r.main.top-1&&r.controls.bottom<=r.main.bottom+1,JSON.stringify(r));assert.deepEqual(r.obscured,[]);}};
  assertWater(measurements[0]);
  const before=await page.$eval('[data-water-controls] svg[role="img"]',e=>e.getAttribute('aria-label'));
  await page.click('[aria-label="Ajouter 0.5 g de Gypse"]');await painted(page);const after=await page.$eval('[data-water-controls] svg[role="img"]',e=>e.getAttribute('aria-label'));assert.notEqual(after,before);
  measurements.push(await waterBounds(page));assertWater(measurements.at(-1));
  await page.click('[aria-label="Ajouter 0.5 mL — rinçage"]');measurements.push(await waterBounds(page));assertWater(measurements.at(-1));
  await page.focus('input[name="ratio_slider_range"]');await page.keyboard.press('ArrowRight');await painted(page);measurements.push(await waterBounds(page));assertWater(measurements.at(-1));
  await page.click('[aria-label="Proposer les doses"]');await painted(page);measurements.push(await waterBounds(page));assertWater(measurements.at(-1));
  await page.screenshot({path:resolve(out,`water-${width}-${height}-changed.png`)});
  await button(page,'Houblons');await page.waitForSelector('[aria-label="Amertume des houblons"]');
  assert.equal(await page.$eval('[data-hot-ibu]',e=>e.dataset.hotIbu),'0','DH-only does not require unknown OG for its zero HOT contribution');
  // The explicit IA action uses test adapters. Dry hops participate and alpha remains editable.
  await button(page,'Compléter les données manquantes avec l’IA');await button(page,'Reprendre ces valeurs');
  await page.waitForFunction(()=>document.querySelector('[aria-label="Alpha de Ariana en pourcent"]')?.value==='12');
  assert.equal(await page.$eval('[data-hot-ibu]',e=>e.dataset.hotIbu),'0');
  const warm={requests:requests.length,...await page.evaluate(()=>({writes:window.__hopQa.metrics.writes,calls:window.__hopQa.calls.length}))};
  const checkbox=await page.$('[aria-label="Amertume des houblons"] input[type="checkbox"]');await checkbox.click();await page.waitForSelector('[data-dry-bitterness-min]');
  const raw=await page.evaluate(()=>{const q=window.__hopQa;return q.bitterness.cold({grams:144,volumeL:24,hotIbu:{min:0,max:0}},q.bitterness.science());});
  const graph=await page.$eval('[data-dry-bitterness-min]',e=>({min:+e.dataset.dryBitternessMin,max:+e.dataset.dryBitternessMax}));assert.deepEqual(graph,raw.finalEquivalent);
  assert(graph.min>0&&graph.max<30,'useful conditional band, not 0–100');
  await capture(page,`dryhop-${width}-${height}`,'[aria-label="Amertume des houblons"]');
  await details(page,'Hypothèses à cru et source');const input=await page.$('[aria-label="Humulinones maximales supposées en pourcent"]');await input.click();await page.keyboard.down('Control');await page.keyboard.press('KeyA');await page.keyboard.up('Control');await page.keyboard.type('0,5');await page.keyboard.press('Tab');
  assert(await page.$eval('[data-dry-bitterness-max]',e=>+e.dataset.dryBitternessMax)>graph.max);await details(page,'Hypothèses à cru et source',false);
  assert.equal(requests.length,warm.requests);assert.deepEqual(await page.evaluate(()=>({writes:window.__hopQa.metrics.writes,calls:window.__hopQa.calls.length})),{writes:warm.writes,calls:warm.calls});
  // Real catalogue autocomplete in dry-hop mode, and consistent default day/timing fields.
  await button(page,'Houblonnage à cru');const picker=await page.$('input[aria-label="Ajouter un houblon en houblonnage à cru"]');await picker.click();await picker.type('Cascade');
  const option=await page.waitForFunction(()=>[...document.querySelectorAll('[role="option"]')].find(e=>e.getClientRects().length&&e.textContent.includes('Cascade')&&e.textContent.includes('Hopsteiner')));await option.asElement().click();await option.dispose();
  await page.waitForSelector('[aria-label="Jour en cuve pour Cascade"]');assert.equal(await page.$eval('[aria-label="Jour en cuve pour Cascade"]',e=>e.value),'3');assert(await page.$('[aria-label="Alpha de Cascade en pourcent"]'));
  await button(page,'Récapitulatif',true);await button(page,'Enregistrer la recette');await page.waitForFunction(()=>window.__hopQa.storage.getRecipes().find(r=>r.id==='qa-fruty').hops.length===2);
  const saved=await page.evaluate(()=>window.__hopQa.storage.getRecipes().find(r=>r.id==='qa-fruty'));assert.equal(saved.hops[0].alpha,12);assert.equal(saved.hops[1].stage,'dryHop');assert.equal(saved.hops[1].dayOffset,3);
  await page.reload({waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__hopQa?.ready());await button(page,'Recettes',true);await button(page,'Fruty',true);await details(page,'Houblons');await page.click('[aria-label="Amertume des houblons"] input[type="checkbox"]');await page.waitForSelector('[data-dry-bitterness-min]');
  await capture(page,`read-only-${width}-${height}`,'[aria-label="Amertume des houblons"]');
  const performance=await page.evaluate(()=>{const q=window.__hopQa,hop={name:'Cascade',weightG:7.2,alpha:6,stage:'dryHop'},hops=Array.from({length:20},()=>({...hop}));const times=[];for(let i=0;i<30;i++){const start=window.performance.now(),hot=q.bitterness.hot(hops,24,1.05,60);q.bitterness.cold({grams:hops.reduce((sum,h)=>sum+h.weightG,0),volumeL:24,hotIbu:{min:hot.total,max:hot.total}},q.bitterness.science());times.push(window.performance.now()-start);}return {maxMs:Math.max(...times),medianMs:times.sort((a,b)=>a-b)[15]};});assert(performance.maxMs<500);
  assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);reports.push({width,height,measurements,graph,performance,simulationRequests:0,simulationWrites:0});await context.close();
 }
 await writeFile(resolve(out,'report.json'),JSON.stringify({passed:true,reports},null,2));console.log(JSON.stringify({passed:true,out,reports},null,2));
}catch(e){if(active&&!active.isClosed()){await active.screenshot({path:resolve(out,'failure.png')});await writeFile(resolve(out,'failure.txt'),stage+'\n'+await active.evaluate(()=>document.body.innerText));}throw new Error(stage+': '+e.message,{cause:e});}
finally{await browser.close();await new Promise(r=>server.close(r));}
