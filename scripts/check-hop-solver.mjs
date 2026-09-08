// Synthetic recipes, local browser only. No Firebase or paid AI requests.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const base=process.env.HOP_WORKSHOP_QA_URL||'http://127.0.0.1:3012';
assert(/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base));
const out=resolve('.codex-remote-attachments/hop-index/solver');
await mkdir(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--mute-audio']});
const reports=[];
const click=async(page,label,contains=false)=>{
  const h=await page.waitForFunction((label,contains)=>[...document.querySelectorAll('button')].find(b=>b.getClientRects().length&&!b.disabled&&(contains?b.textContent.includes(label):b.textContent.trim()===label)),{},label,contains);
  await h.asElement().evaluate(b=>b.scrollIntoView({block:'center'}));await h.asElement().click();await h.dispose();
};
const choose=async(page,label,value)=>{
  const id=await page.evaluate(label=>[...document.querySelectorAll('label')].find(l=>l.textContent.trim()===label)?.htmlFor,label);
  assert(id,label);await page.select(`select[id="${id}"]`,value);
};
const overflow=async page=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow');
try{
  for(const width of [390,320,1280]){
    const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[];
    page.setDefaultTimeout(60000);
    await page.setViewport({width,height:1000,isMobile:width<600,hasTouch:width<600});
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    page.on('pageerror',e=>errors.push(e.message));await page.setRequestInterception(true);
    page.on('request',r=>r.url().startsWith(base+'/')||/^(data|blob):/.test(r.url())?r.continue():r.abort());
    await page.evaluateOnNewDocument(()=>localStorage.setItem('laffinee_ui_state',JSON.stringify({app_active_tab:'production',production_subtab:'recipes'})));
    await page.goto(base+'/?dev-local',{waitUntil:'networkidle0'});
    await page.waitForFunction(async()=>(await import('/src/services/storage.ts')).StorageService.isReady());
    await page.waitForFunction(()=>!document.body.innerText.includes('Base initialisée avec'));
    await click(page,'📜 Recettes',true);await click(page,'Importer / Créer',true);
    const name=`Solver témoin ${width}`;await page.locator('#wz-title').fill(name);
    await click(page,'Construire le goût de ma bière',true);
    await page.waitForSelector('[aria-label="Solver de houblonnage"]');
    await choose(page,'Point de départ par style','free');
    await click(page,'Agrumes');
    await overflow(page);
    await page.$eval('[aria-label="Solver de houblonnage"]',e=>e.scrollIntoView({block:'start'}));
    await page.screenshot({path:resolve(out,`intention-${width}.png`)});
    const before=await page.evaluate(async()=>(await import('/src/services/storage.ts')).StorageService.getHopKnowledge().length);
    const started=Date.now();
    await click(page,'Trouver mes combinaisons');
    await page.waitForSelector('[aria-label="Programme proposé par le solver"]');
    const elapsed=Date.now()-started;
    assert.equal(await page.evaluate(async()=>(await import('/src/services/storage.ts')).StorageService.getHopKnowledge().length),before);
    const fields=await page.$$eval('[aria-label="Programme proposé par le solver"] input',els=>els.map(e=>({label:e.getAttribute('aria-label'),value:e.value})));
    assert(fields.length>=3);assert(fields.every(f=>f.value!==''),'Prefilled dose/contact/time');
    assert(await page.$('[aria-label="Graphe de la prédiction expérimentale"]'));
    await overflow(page);
    await page.$eval('[aria-label="Programme proposé par le solver"]',e=>e.scrollIntoView({block:'start'}));
    await page.screenshot({path:resolve(out,`programme-${width}.png`)});
    await click(page,'Ajouter ce programme à ma recette');
    await page.waitForFunction(()=>document.body.innerText.includes('Programme appliqué.'));
    await click(page,'Récapitulatif');await click(page,'Enregistrer la recette');
    await page.waitForFunction(async name=>(await import('/src/services/storage.ts')).StorageService.getRecipes().some(r=>r.name===name),{},name);
    const saved=await page.evaluate(async name=>(await import('/src/services/storage.ts')).StorageService.getRecipes().find(r=>r.name===name),name);
    assert(saved.hops.length>0);assert(saved.hopSolverIntent);assert(saved.hops.every(h=>h.aromaContactHours!=null&&h.aromaTemperatureC!=null));
    await click(page,name,true);
    const panel=await page.waitForSelector('[aria-label="Potentiel aromatique de la recette"]');
    assert.equal(await panel.$$eval('input,textarea',els=>els.length),0);
    await panel.evaluate(e=>e.scrollIntoView({block:'start'}));await overflow(page);
    await page.screenshot({path:resolve(out,`lecture-${width}.png`)});
    assert.deepEqual(errors,[]);reports.push({width,elapsed,fields,hops:saved.hops.length,readonly:true,errors});
    console.log(`Solver vérifié à ${width}px, recherche ${elapsed} ms.`);
    await context.close();
  }
  await writeFile(resolve(out,'report.json'),JSON.stringify(reports,null,2));
}catch(error){
  const page=(await browser.pages()).at(-1);if(page){await page.screenshot({path:resolve(out,'failure.png'),fullPage:true});await writeFile(resolve(out,'failure.txt'),await page.evaluate(()=>document.body.innerText));}
  throw error;
}finally{await browser.close();}
