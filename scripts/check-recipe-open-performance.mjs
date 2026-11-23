// Local-only production QA. No production data, deployment or real AI calls.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';

const buildDir = resolve(process.env.HOP_QA_BUILD_DIR || resolve(tmpdir(), 'laffinee-hop-qa-recipe-open-before'));
const out = resolve(process.env.RECIPE_OPEN_OUTPUT || 'work/recipe-open-performance/evidence/before');
const sampleCount = Number(process.env.RECIPE_OPEN_SAMPLES || 10);
const cpuRate = Number(process.env.RECIPE_OPEN_CPU || 6);
const width = Number(process.env.RECIPE_OPEN_WIDTH || 390);
const profiling = process.env.RECIPE_OPEN_PROFILE === '1';
const detailedGestures = process.env.RECIPE_OPEN_DETAILS === '1';
const directOpening = process.env.RECIPE_OPEN_DIRECT === '1';
const directSeed = process.env.RECIPE_OPEN_DIRECT_SEED === '1';
await mkdir(out, { recursive: true });
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(buildDir, path === '/' ? 'tests/qa/hop-recipe/index.html' : `.${path}`);
    if (!file.startsWith(buildDir + sep)) { res.writeHead(403); res.end(); return; }
    const bytes = await readFile(file);
    res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' })[extname(file)] || 'application/octet-stream');
    res.end(bytes);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--mute-audio'] });
const errors = [], remote = [], records = [];
let browserVersion;
const percentile = (values, p) => {
  const sorted = [...values].sort((a,b)=>a-b);
  if(p===.5) return (sorted[Math.floor((sorted.length-1)/2)]+sorted[Math.floor(sorted.length/2)])/2;
  return sorted[Math.min(sorted.length-1,Math.ceil(p*sorted.length)-1)];
};
try {
  browserVersion = await browser.version();
  for (let iteration = 0; iteration < sampleCount; iteration++) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport({width,height:width===1280?900:844,isMobile:width<500,hasTouch:width<500});
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(['error','warn'].includes(m.type())) errors.push(m.text());});
    await page.setRequestInterception(true);
    page.on('request',request=>{
      if (/^https?:/.test(request.url()) && !request.url().startsWith(base+'/')) { remote.push(request.url()); request.abort(); }
      else request.continue();
    });
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('laffinee_ui_state',JSON.stringify({app_active_tab:'production',production_subtab:'recipes'}));
      window.__perf = {events:[],pointers:[],inputs:[],longTasks:[],commits:[],reactCommits:[],storage:[],reads:[]};
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {supportsFiber:true,inject:()=>1,onCommitFiberRoot:(_id,root)=>{
        const at=performance.now();window.__perf.commits.push(at);
        if(!(root.current.actualDuration>0)) return;
        const components=[];
        const visit=fiber=>{
          if(!fiber) return;
          if(typeof fiber.type==='function') {
            let childrenMs=0;for(let child=fiber.child;child;child=child.sibling) childrenMs+=child.actualDuration||0;
            components.push({name:fiber.type.displayName||fiber.type.name||'anonymous',actualMs:fiber.actualDuration||0,selfMs:Math.max(0,(fiber.actualDuration||0)-childrenMs)});
          }
          visit(fiber.child);visit(fiber.sibling);
        };
        visit(root.current);window.__perf.reactCommits.push({at,rootMs:root.current.actualDuration,components:components.sort((a,b)=>b.selfMs-a.selfMs).slice(0,40)});
      },onCommitFiberUnmount:()=>{},checkDCE:()=>{}};
      new PerformanceObserver(list=>list.getEntries().forEach(e=>window.__perf.longTasks.push({start:e.startTime,duration:e.duration}))).observe({type:'longtask',buffered:true});
      document.addEventListener('pointerdown',event=>{
        const el=event.target.closest('button,summary');
        if(el) window.__perf.pointers.push({at:event.timeStamp,label:el.getAttribute('aria-label')||el.textContent.trim()});
      },true);
      document.addEventListener('click',event=>{
        const el=event.target.closest('button,summary');
        if(el) {
          const label=el.getAttribute('aria-label')||el.textContent.trim(),pointer=window.__perf.pointers.at(-1);
          const usePointer=pointer?.label===label && event.timeStamp-pointer.at>=0 && event.timeStamp-pointer.at<30000;
          window.__perf.events.push({at:usePointer?pointer.at:event.timeStamp,startSource:usePointer?'pointerdown':'click',label});
        }
      },true);
      document.addEventListener('input',event=>{
        const start=performance.now(),value=event.target.value;
        requestAnimationFrame(()=>requestAnimationFrame(()=>window.__perf.inputs.push({at:start,duration:performance.now()-start,value,trusted:event.isTrusted})));
      },true);
      for(const method of ['getItem','setItem']) {
        const original=Storage.prototype[method];
        Storage.prototype[method]=function(...args){const start=performance.now();try{return original.apply(this,args);}finally{window.__perf.storage.push({method,key:args[0],at:start,duration:performance.now()-start});}};
      }
    });
    const cdp = await page.createCDPSession();
    await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpuRate});
    await page.goto(base,{waitUntil:'networkidle0'});
    await page.waitForFunction(()=>window.__hopQa?.ready());
    const fixture = await page.evaluate(seedDirectly => {
      const qa=window.__hopQa, storage=qa.storage;
      const seeded = [];
      for (let i=0;i<22;i++) {
        const recipe=qa.recipe(i===0?12:2);
        recipe.id=`qa-perf-${i}`;recipe.name=i===0?'Recette de mesure':`Contre-exemple ${i}`;
        recipe.volumeL=24;
        if(i===0) {
          recipe.fermentables=Array.from({length:5},(_,j)=>({...recipe.fermentables[0],name:`Grain de contrôle ${j+1}`,weightKg:1+j/10}));
          recipe.fermentation=[{kind:'primaire',name:'Primaire',tempC:19,days:7},{kind:'reposDiacetyle',name:'Repos',tempC:21,days:2},{kind:'garde',name:'Garde',tempC:3,days:5}];
          recipe.instructions='Consignes de brassage synthétiques.\n'.repeat(20);
        }
        if (seedDirectly) seeded.push(recipe); else storage.addRecipe(recipe);
      }
      if (seedDirectly) qa.seedRecipes(seeded);
      for(const key of ['getHopKnowledge','getRecipes','getBatches','getStock','getConfig']) {
        if(typeof storage[key]!=='function') continue;
        const original=storage[key];
        storage[key]=function(...args){const start=performance.now();const value=original.apply(this,args);window.__perf.reads.push({key,at:start,duration:performance.now()-start,rows:Array.isArray(value)?value.length:undefined});return value;};
      }
      return {recipes:storage.getRecipes().length,knowledge:storage.getHopKnowledge().length,recipe:storage.getRecipes().find(r=>r.id==='qa-perf-0')};
    }, directSeed);
    await page.waitForSelector('button[aria-label="Ouvrir la recette Recette de mesure"]',{visible:true});
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    if(iteration===0 && !directOpening) await page.screenshot({path:resolve(out,`list-${width}.png`)});
    const click = async selector => {
      await page.waitForSelector(selector);
      const matches=await page.$$(selector);
      let el;
      for(const match of matches) if(await match.evaluate(e=>e.getClientRects().length && getComputedStyle(e).visibility!=='hidden')) {el=match;break;}
      assert(el,`Visible control ${selector}`);
      await el.evaluate(e=>e.scrollIntoView({block:'center'}));
      await el.click();
    };
    const ready = async (kind, eventIndex) => page.evaluate(async (target,index)=>{
      const predicate=()=>target==='editor'
        ? document.querySelector('.recipe-wizard #wz-title')?.value==='Recette de mesure' && [...document.querySelectorAll('.recipe-wizard nav[aria-label="Étapes"] button')].filter(e=>e.getClientRects().length).length===7
        : target==='grain' ? document.querySelector('.recipe-reference details[data-recipe-section="Grain"]')?.open
        : target==='aroma' ? document.querySelector('.recipe-reference section[aria-label="Potentiel aromatique de la recette"]')?.textContent.includes('lecture seule')
        : target==='advanced' ? document.querySelector('.recipe-reference input[aria-label="Toutes les saveurs et la chimie"]')?.getClientRects().length
        : target==='details'
        ? document.querySelector('.catalog-card details[open] button[aria-label="Modifier la recette Recette de mesure"]')
        : document.querySelector('.recipe-reference')?.textContent.includes('Grain de contrôle 5') && document.querySelector('.recipe-reference button[aria-label="Modifier la recette"]');
      const waitingAt=performance.now();
      while(!predicate()) {
        if(performance.now()-waitingAt>15000) throw Error(`Timed out waiting for ${target}: ${document.body.innerText.slice(-6000)}`);
        await new Promise(r=>requestAnimationFrame(r));
      }
      const contentAt=performance.now();
      await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
      return {event:window.__perf.events[index],contentAt,usableAt:performance.now(),duration:performance.now()-window.__perf.events[index].at};
    },kind,eventIndex);
    const measure = async (label,selector,kind) => {
      const eventIndex=await page.evaluate(()=>window.__perf.events.length);
      await click(selector);
      const timing=await ready(kind,eventIndex);
      console.log(`${label}: ${timing.duration.toFixed(1)} ms`);
      return {label,...timing};
    };
    const phases=[];
    const details=await page.$('article[aria-label="Recette Recette de mesure, version 1"] summary');
    if(width<500) assert(details,'Details control exists on the mobile card');
    if(details && !directOpening) phases.push(await measure('details', 'article[aria-label="Recette Recette de mesure, version 1"] summary','details'));
    if(profiling && iteration===0) { await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:500});await cdp.send('Profiler.start'); }
    phases.push(await measure('open-cold','button[aria-label="Ouvrir la recette Recette de mesure"]','recipe'));
    if(iteration===0) await page.screenshot({path:resolve(out,`recipe-${width}.png`)});
    if(detailedGestures) {
      phases.push(await measure('first-grain','.recipe-reference details[data-recipe-section="Grain"] > summary','grain'));
      phases.push(await measure('first-aroma','.recipe-reference details[data-recipe-section="Potentiel aromatique"] > summary','aroma'));
      phases.push(await measure('first-advanced','.recipe-reference section[aria-label="Potentiel aromatique de la recette"] > details > summary','advanced'));
      if(iteration===0) await page.screenshot({path:resolve(out,`advanced-${width}.png`)});
    }
    phases.push(await measure('edit-cold','.recipe-reference button[aria-label="Modifier la recette"]','editor'));
    if(iteration===0) await page.screenshot({path:resolve(out,`editor-${width}.png`)});
    await click('.recipe-wizard #wz-title');
    await page.keyboard.press('End');await page.keyboard.type('!');
    await page.waitForFunction(()=>window.__perf.inputs.some(e=>e.value==='Recette de mesure!'));
    const firstInput=await page.evaluate(()=>({...window.__perf.inputs.find(e=>e.value==='Recette de mesure!'),focused:document.activeElement===document.querySelector('#wz-title')}));
    assert.equal(firstInput.value,'Recette de mesure!');assert(firstInput.focused);assert(firstInput.trusted);
    await page.keyboard.press('Backspace');
    await click('.recipe-wizard button[aria-label="Fermer"]');
    await page.waitForSelector('button[aria-label="Ouvrir la recette Recette de mesure"]',{visible:true});
    phases.push(await measure('open-warm','button[aria-label="Ouvrir la recette Recette de mesure"]','recipe'));
    phases.push(await measure('edit-warm','.recipe-reference button[aria-label="Modifier la recette"]','editor'));
    if(profiling && iteration===0) {
      const {profile}=await cdp.send('Profiler.stop');
      await writeFile(resolve(out,'interaction.cpuprofile'),JSON.stringify(profile));
      const self=new Map();
      for(let i=0;i<profile.samples.length;i++)self.set(profile.samples[i],(self.get(profile.samples[i])||0)+profile.timeDeltas[i]/1000);
      const top=profile.nodes.map(n=>({...n.callFrame,id:n.id,selfMs:self.get(n.id)||0})).sort((a,b)=>b.selfMs-a.selfMs).slice(0,30);
      await writeFile(resolve(out,'cpu-top.json'),JSON.stringify(top,null,2));
    }
    const perf=await page.evaluate(()=>({...window.__perf,resources:performance.getEntriesByType('resource').map(r=>({name:r.name,start:r.startTime,duration:r.duration,bytes:r.encodedBodySize}))}));
    records.push({iteration,phases,firstInput,fixture,perf});
    console.log(JSON.stringify({iteration,phases:phases.map(p=>({label:p.label,ms:Math.round(p.duration)})),firstInput:firstInput.duration}));
    await writeFile(resolve(out,'samples.json'),JSON.stringify(records,null,2));
    await context.close();
  }
  assert.equal(remote.length,0,`No external request: ${remote.join(', ')}`);
  assert.equal(errors.length,0,errors.join('\n'));
} catch(error) { await writeFile(resolve(out,'failure.json'),JSON.stringify({message:error.stack,errors,remote},null,2));throw error; }
finally { await browser.close(); await new Promise(r=>server.close(r)); }
const summary={environment:{browserVersion,width,cpuRate,buildDir,sampleCount,profiling,directOpening,cache:'Fresh context per iteration; first recipe visit then reopen in the same session. Reading preparation from the list is part of the implementation, not a precondition added by the harness. Local HTTP, external network blocked.',method:'Trusted pointerdown (click fallback); expected full content and controls then two rAF. CPU emulation, not physical Android.'},phases:{},errors,remote};
for(const label of ['details','open-cold','first-grain','first-aroma','first-advanced','edit-cold','open-warm','edit-warm']) {
  const values=records.flatMap(r=>r.phases.filter(p=>p.label===label).map(p=>p.duration));
  if(!values.length) continue;
  summary.phases[label]={n:values.length,medianMs:percentile(values,.5),...(values.length>=20?{p95Ms:percentile(values,.95)}:{}),minMs:Math.min(...values),maxMs:Math.max(...values)};
}
await writeFile(resolve(out,'summary.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify(summary,null,2));
