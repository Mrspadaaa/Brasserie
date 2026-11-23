// Full production-sized catalogue, synthetic local recipes, no external requests.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const base=process.env.YEAST_QA_URL||'http://127.0.0.1:3014';
assert(/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base));
const out=resolve('.codex-remote-attachments/yeast-catalogue/qa');await mkdir(out,{recursive:true});
const catalogue=JSON.parse(await readFile('src/data/yeastCatalogueBootstrap.json','utf8'));
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--mute-audio']});
const reports=[];
async function click(page,text,selector='button') {
  const h=await page.waitForFunction((text,selector)=>[...document.querySelectorAll(selector)].find(e=>e.getClientRects().length&&!e.disabled&&e.textContent.includes(text)),{},text,selector);
  await h.asElement().evaluate(e=>e.scrollIntoView({block:'center'}));await h.asElement().click();await h.dispose();
}
const overflow=async page=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow');
try {
  for(const width of [320,390,1280]) {
    const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[];
    page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
    await page.setViewport({width,height:1050,isMobile:width<600,hasTouch:width<600});
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await page.setRequestInterception(true);
    page.on('request',r=>r.url().startsWith(base+'/')||/^(data|blob):/.test(r.url())?r.continue():r.abort());
    await page.evaluateOnNewDocument(()=>localStorage.setItem('laffinee_ui_state',JSON.stringify({app_active_tab:'production',production_subtab:'recipes'})));
    await page.goto(base+'/?dev-local',{waitUntil:'networkidle0'});
    await page.waitForFunction(async()=>(await import('/src/services/storage.ts')).StorageService.isReady());
    await page.waitForFunction(()=>!document.body.innerText.includes('Base initialisée avec'));
    await page.evaluate(async rows=>{const {StorageService}=await import('/src/services/storage.ts');await StorageService.importHopIndex(JSON.stringify({hopKnowledge:rows}));},catalogue);
    await click(page,'📜 Recettes');await click(page,'Importer / Créer');
    const name=`Catalogue témoin ${width}`;await page.locator('#wz-title').fill(name);
    await click(page,'Choisir les arômes de levure');
    await click(page,'Chercher dans toutes les levures','summary');
    const panel='[aria-label="Catalogue des levures"]';
    await page.waitForSelector(panel+' article');
    assert.equal(await page.$$eval(panel+' article',els=>els.length),12);
    const started=Date.now();await page.locator(panel+' input').fill('WLP300');
    await page.waitForFunction(selector=>document.querySelectorAll(selector+' article').length===1,{},panel);
    const searchMs=Date.now()-started;
    await click(page,'WLP300',panel+' article button');
    assert.equal(await page.$$eval(panel+' svg[role="img"]',els=>els.length),2);
    await overflow(page);await page.screenshot({path:resolve(out,`catalogue-${width}.png`)});
    await click(page,'Choisir cette culture');
    await click(page,'Récapitulatif');await click(page,'Enregistrer la recette');
    await page.waitForFunction(async name=>(await import('/src/services/storage.ts')).StorageService.getRecipes().some(r=>r.name===name),{},name);
    const saved=await page.evaluate(async name=>(await import('/src/services/storage.ts')).StorageService.getRecipes().find(r=>r.name===name),name);
    assert.equal(saved.yeast.hopIndexId,'white-labs-wlp300');assert.equal(saved.yeast.form,'liquide');assert.equal(saved.yeast.qty,0);
    await click(page,name);await click(page,'Caractéristiques actuelles de la levure','summary');
    const details=await page.waitForFunction(()=>[...document.querySelectorAll('details')].find(d=>d.open&&d.querySelector('summary')?.textContent.includes('Caractéristiques actuelles')));
    assert.equal(await details.evaluate(d=>d.querySelectorAll('input,select,textarea').length),0);
    assert((await details.evaluate(d=>d.innerText)).includes('20–22'));
    await details.evaluate(d=>d.scrollIntoView({block:'start'}));await overflow(page);
    await page.screenshot({path:resolve(out,`lecture-${width}.png`)});
    assert.deepEqual(errors,[]);reports.push({width,catalogue:catalogue.length,searchMs,savedYeast:saved.yeast.hopIndexId,readOnly:true,errors});
    console.log(`Catalogue ${catalogue.length} : recherche ${searchMs} ms, choix explicite, graphes et lecture seule vérifiés à ${width}px.`);
    await context.close();
  }
  await writeFile(resolve(out,'report.json'),JSON.stringify(reports,null,2));
}catch(error){const page=(await browser.pages()).at(-1);if(page){await page.screenshot({path:resolve(out,'failure.png'),fullPage:true});await writeFile(resolve(out,'failure.txt'),await page.evaluate(()=>document.body.innerText));}throw error;}
finally{await browser.close();}
