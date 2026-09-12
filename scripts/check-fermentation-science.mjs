// Synthetic local data only. No production writes and no AI requests.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const base=process.env.FERMENTATION_QA_URL||'http://127.0.0.1:3015';
assert(/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base));
const out=resolve('.codex-remote-attachments/fermentation-science/qa');await mkdir(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--mute-audio']});
const reports=[];
const researchMarkdown=await readFile('functions/reports/fermentation-2026.md','utf8');
const button=async(page,text)=>{let h;try{h=await page.waitForFunction(text=>[...document.querySelectorAll('button')].find(b=>b.getClientRects().length&&!b.disabled&&b.textContent.includes(text)),{timeout:15000},text);}catch(error){await page.screenshot({path:resolve(out,'failure.png')});await writeFile(resolve(out,'failure.txt'),await page.evaluate(()=>document.body.innerText));throw Error('Bouton introuvable : '+text,{cause:error});}await h.asElement().evaluate(el=>el.scrollIntoView({block:'center'}));await h.asElement().click();await h.dispose();};
const details=async(page,text)=>{const h=await page.waitForFunction(text=>[...document.querySelectorAll('summary')].find(s=>s.getClientRects().length&&s.textContent===text),{},text);await h.asElement().evaluate(el=>el.scrollIntoView({block:'center'}));await h.asElement().click();await h.dispose();};
const field=async(page,text)=>{const id=await page.evaluate(text=>[...document.querySelectorAll('label')].find(l=>l.textContent.trim()===text)?.htmlFor,text);assert(id,text);return '[id="'+id+'"]';};
const fill=async(page,label,value)=>{await page.locator(await field(page,label)).fill(value);await page.keyboard.press('Tab');};
const overflow=async page=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow');
try{
 for(const width of [390,320,1280]){
  const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[];page.setDefaultTimeout(60000);
  await page.setViewport({width,height:1000,isMobile:width<600,hasTouch:width<600});
  page.on('pageerror',e=>errors.push(e.message));await page.setRequestInterception(true);
  let reportRequests=0,reportAllowed=false;
  page.on('request',r=>{
   // UI-only fixture; real server authorization is tested separately, never bypassed in application code.
   if(new URL(r.url()).pathname==='/src/services/fermentationResearch.ts')return r.respond({status:200,contentType:'application/javascript',body:'export async function loadFermentationResearch(){const r=await fetch("/__qa/fermentation-report");const v=await r.json();if(!r.ok)throw {code:"functions/unauthenticated"};return v.data.markdown;}'});
   if(r.url()===base+'/__qa/fermentation-report'){
    reportRequests++;
    return r.respond({status:reportAllowed?200:401,contentType:'application/json',body:JSON.stringify(reportAllowed?{data:{markdown:researchMarkdown}}:{error:{status:'UNAUTHENTICATED',message:'Connexion requise.'}})});
   }
   return r.url().startsWith(base+'/')||/^(data|blob):/.test(r.url())?r.continue():r.abort();
  });
  await page.evaluateOnNewDocument(()=>localStorage.setItem('laffinee_ui_state',JSON.stringify({app_active_tab:'production',production_subtab:'recipes'})));
  await page.goto(base+'/?dev-local',{waitUntil:'networkidle0'});
  await page.waitForFunction(async()=>(await import('/src/services/storage.ts')).StorageService.isReady());
  await page.waitForFunction(()=>!document.body.innerText.includes('Base initialisée avec'));
  await button(page,'📜 Recettes');await button(page,'+ Recette');await page.locator('#wz-title').fill('Fermentation recherche '+width);
  const before=await page.evaluate(async()=>(await import('/src/services/storage.ts')).StorageService.getHopKnowledge().length);
  await button(page,'Choisir les arômes de levure');
  await fill(page,'Arôme ou style recherché','pêche');await button(page,'Fruits et esters');await button(page,'LalBrew Pomona');
  await overflow(page);
  assert(await page.$eval('[aria-label="Programme de levure proposé"]',el=>el.innerText.includes('Pêche')));
  await page.$eval('[aria-label="Programme de levure proposé"]',el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:resolve(out,'fruit-'+width+'.png')});
  await fill(page,'Arôme ou style recherché','lager');await button(page,'Profil net et discret');await button(page,'SafLager');
  await details(page,'Calculer les repères de densité et de repos');
  await fill(page,'DI utilisée pour ce calcul (SG)','1.050');await fill(page,'Densité actuelle pour situer la progression (SG)','1.022');
  await page.waitForFunction(()=>document.body.innerText.includes('1,019–1,024 SG'));
  await overflow(page);await page.screenshot({path:resolve(out,'repos-'+width+'.png')});
  await details(page,'Calcul expérimental des phénols · étude DM303');
  await page.locator('[aria-label="Laboratoire expérimental DM303"] input[type="checkbox"]').click();
  await page.waitForFunction(()=>document.body.innerText.includes('2,16–2,51 mg/L'));
  await page.$eval('[aria-label="Laboratoire expérimental DM303"]',el=>el.scrollIntoView({block:'start'}));
  await overflow(page);await page.screenshot({path:resolve(out,'laboratoire-'+width+'.png')});
  await fill(page,'Blé (%)','40');await fill(page,'Ébullition (min)','70');await fill(page,'Fermentation (°C)','16');
  await page.waitForFunction(()=>document.body.innerText.includes('Hors de l’enveloppe'));
  assert.equal(await page.evaluate(async()=>(await import('/src/services/storage.ts')).StorageService.getHopKnowledge().length),before);
  assert.equal(reportRequests,0);
  await button(page,'Lire la synthèse de recherche sur la fermentation');
  await page.waitForFunction(()=>document.body.innerText.includes('Connecte-toi avec le compte autorisé'),{timeout:12000}).catch(async error=>{await writeFile(resolve(out,'research-access-failure.txt'),await page.evaluate(()=>document.body.innerText));await page.screenshot({path:resolve(out,'research-access-failure.png')});console.log('Report requests: '+reportRequests);throw error;});
  reportAllowed=true;
  await button(page,'Réessayer');
  await page.waitForSelector('article[aria-label="Synthèse de recherche sur la fermentation"] h1');await overflow(page);
  assert(reportRequests>=2);
  assert(await page.$$eval('article[aria-label="Synthèse de recherche sur la fermentation"] a[href^="https://"]',els=>els.length)>=20);
  await page.screenshot({path:resolve(out,'rapport-ouverture-'+width+'.png')});
  await page.evaluate(()=>[...document.querySelectorAll('article[aria-label="Synthèse de recherche sur la fermentation"] h2')].find(h=>h.textContent.includes('Phénols')).scrollIntoView({block:'start'}));
  await page.screenshot({path:resolve(out,'rapport-phenols-'+width+'.png')});
  await page.$eval('article[aria-label="Synthèse de recherche sur la fermentation"] p:last-child',el=>el.scrollIntoView({block:'end'}));await page.screenshot({path:resolve(out,'rapport-fin-'+width+'.png')});
  await page.goto(base+'/research/fermentation-2026.html',{waitUntil:'networkidle0'});
  assert(!await page.evaluate(()=>document.body.innerText.includes('La souche, le moût et la conduite forment un ensemble.')));
  assert.deepEqual(errors,[]);reports.push({width,autocomplete:true,lagerRange:true,localModel:true,outOfDomain:true,noWrites:true,reportLinks:true,reportAuth:true,errors});
  console.log('Science vérifiée à '+width+'px : suggestions, repos, laboratoire, domaine, lecture sans écrit, rapport.');
  await context.close();
 }
 await writeFile(resolve(out,'report.json'),JSON.stringify(reports,null,2));
}finally{await browser.close();}
