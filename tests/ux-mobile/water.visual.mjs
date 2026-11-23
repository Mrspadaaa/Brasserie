// Focused dosing regression in the real App: one draft, exclusions and save/reopen.
// Local fixtures only; external requests are blocked. No AI call or deployment.
// The Browser plugin is not available here; reuse the repository's isolated QA build and Puppeteer.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
import puppeteer from 'puppeteer-core';
import { buildHopRecipeQa } from '../../scripts/build-hop-recipe-qa.mjs';

const buildDir = resolve(tmpdir(), 'laffinee-hop-qa-water-dosing');
const evidenceDir = resolve(process.env.UX_POC_EVIDENCE_DIR ?? resolve(tmpdir(), 'laffinee-water-dosing-evidence'));
if (!process.argv.includes('--reuse-build')) await buildHopRecipeQa(buildDir);
await mkdir(evidenceDir, { recursive: true });
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(buildDir, pathname === '/' ? 'tests/qa/hop-recipe/index.html' : `.${pathname}`);
    if (!file.startsWith(`${buildDir}${sep}`)) { response.writeHead(403); response.end(); return; }
    response.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' })[extname(file)] ?? 'application/octet-stream');
    response.end(await readFile(file));
  } catch { response.writeHead(404); response.end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--mute-audio'] });
const checks = [];
const clickButton = async (page, label, contains = false) => {
  const found = await page.waitForFunction((label, contains) => [...document.querySelectorAll('button')]
    .find(button => button.getClientRects().length && !button.disabled && (contains ? button.textContent.trim().includes(label) : button.textContent.trim() === label)), {}, label, contains);
  await found.asElement().evaluate(element => element.scrollIntoView({ block: 'center' }));
  await found.asElement().click();
  await found.dispose();
};
const clickStep = async (page, label) => {
  const found = await page.waitForFunction(label => [...document.querySelectorAll('nav[aria-label="Étapes"] button')]
    .find(button => button.getClientRects().length && button.getAttribute('aria-label') === label), {}, label);
  await found.asElement().click();
  await found.dispose();
};
const settle = page => page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
const navigate = async (page, tab) => {
  await page.evaluate(tab => window.__hopQa.storage.setUiState('app_active_tab', tab), tab);
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__hopQa?.ready());
};
const openEditRecipe = async (page, name) => {
  await navigate(page, 'production');
  await clickButton(page, 'Recettes', true);
  const selector = `[aria-label="Modifier la recette ${name}"]`;
  await page.waitForSelector(selector);
  const edit = await page.$(selector);
  const summary = await edit.evaluateHandle(button => {
    const parent = button.closest('details');
    return parent && !parent.open ? parent.querySelector('summary') : null;
  });
  if (summary.asElement()) await summary.asElement().click();
  await page.$eval(selector, button => button.scrollIntoView({ block: 'center' }));
  await page.locator(selector).click();
  await page.waitForSelector('.recipe-wizard', { timeout: 12000 }).catch(async () => {
    const body = await page.evaluate(() => document.body.innerText.slice(0, 2200));
    await page.screenshot({ path: resolve(evidenceDir, `debug-open-${name.replaceAll(' ', '-')}.png`) });
    throw Error(`L’éditeur de ${name} ne s’ouvre pas : ${body}`);
  });
};

try {
 for (const width of [390,1280]) {
  const context=await browser.createBrowserContext(), page=await context.newPage();
  const errors=[],remote=[],failed=[];
  page.on("requestfailed",request=>failed.push({url:request.url(),reason:request.failure()?.errorText}));
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
  await page.setRequestInterception(true);
  page.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith(origin+'/')){remote.push(request.url());request.abort();}else request.continue();});
  await page.setViewport({width,height:width===390?844:900,isMobile:width<600,hasTouch:width<600});
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await page.goto(origin,{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__hopQa?.ready());
  await page.evaluate(()=>window.__hopQa.seedMobilePoc());
  const readSaved=()=>page.evaluate(()=>structuredClone(window.__hopQa.storage.getRecipes().find(r=>r.id==='qa-poc-water')));
  const original=await readSaved();
  await openEditRecipe(page,'Eau de contrôle');await clickStep(page,'Eau et sels');
  if(width<600)await clickButton(page,'2. Sels',true);
  const doser='[aria-label="Proposer les doses"]', saltSwitch='#water-salt-gypse [role="switch"]', doseSelector='#water-salt-gypse :is(input,textarea)';
  await page.waitForSelector(doser,{visible:true});
  assert.equal(await page.$eval(doser,e=>e.disabled),false,'Doser disponible sur analyse complète');
  await page.click(doser);await settle(page);
  const doses=await page.$$eval('[data-salt-dose] :is(input,textarea)',nodes=>nodes.map(n=>Number(n.value.replace(',','.'))));
  assert(doses.some(v=>v>0),'Doser produit des pesées');
  assert.equal(await page.$eval(saltSwitch,e=>e.getAttribute('aria-checked')),'true');
  await page.click(saltSwitch);await page.click(doser);await settle(page);
  assert.equal(await page.$eval(saltSwitch,e=>e.getAttribute('aria-checked')),'false','Exclusion conservée au recalcul');
  assert.equal(await page.$eval(doseSelector,e=>Number(e.value.replace(',','.'))),0);
  await clickStep(page,'Levure');await clickStep(page,'Eau et sels');
  if(width<600)await clickButton(page,'2. Sels',true);
  assert.equal(await page.$eval(saltSwitch,e=>e.getAttribute('aria-checked')),'false','Exclusion conservée après navigation');
  assert.deepEqual(await readSaved(),original,'Le brouillon ne réécrit pas la recette avant Enregistrer');
  await clickStep(page,'Récapitulatif');await clickButton(page,'Enregistrer la recette');
  await page.waitForSelector('[aria-label="Ouvrir la recette Eau de contrôle"]',{visible:true});
  const excluded=await readSaved();assert(excluded.waterPlan.disabled.includes('gypse'));assert.equal((excluded.waterPlan.mash?.gypse??0)+(excluded.waterPlan.sparge?.gypse??0),0);
  await openEditRecipe(page,'Eau de contrôle');await clickStep(page,'Eau et sels');if(width<600)await clickButton(page,'2. Sels',true);
  assert.equal(await page.$eval(saltSwitch,e=>e.getAttribute('aria-checked')),'false');
  await page.setOfflineMode(true);await page.click(saltSwitch);
  const add='[aria-label="Ajouter 0,5 g de Gypse"]';await page.click(add);await page.click(add);await settle(page);
  assert.equal(await page.$eval(doseSelector,e=>Number(e.value.replace(',','.'))),1);
  assert.equal(await page.evaluate(()=>[...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='Appliquer au brouillon')),false,'Pas de second état local à appliquer');
  await page.evaluate(()=>{const main=document.querySelector('.recipe-wizard > main');if(main)main.scrollTop=0;});await settle(page);
  const controls=await page.evaluate(()=>Object.fromEntries(['.water-radar-panel','.water-ratio-compact','.water-salt-grid','[data-water-acids]'].map(selector=>{const r=document.querySelector(selector).getBoundingClientRect();return[selector,{top:r.top,bottom:r.bottom,left:r.left,right:r.right,visible:r.width>0&&r.height>0}]})));
  console.log(JSON.stringify({width,controls}));if(width>=600) await page.$eval('[data-water-controls]',e=>e.scrollIntoView({block:'start'}));
  await settle(page);await page.screenshot({path:resolve(evidenceDir,'dosing-'+width+'.png')});
  if(width>=600){await page.$eval('.water-salt-grid',e=>e.scrollIntoView({block:'center'}));await settle(page);await page.screenshot({path:resolve(evidenceDir,'dosing-controls-'+width+'.png')});}
  const radarVisual=await page.evaluate(()=>{
    const panel=document.querySelector('.water-radar-panel');
    const visible=e=>!!e&&e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0;
    return {diameterPx:Math.max(...[...panel.querySelectorAll('svg[role="img"] circle')].map(e=>e.getBoundingClientRect().width)),
      selectorVisible:visible(panel.querySelector('[data-ion-comparison="selector"]')),
      captionVisible:visible(panel.querySelector('.water-radar-caption'))};
  });
  console.log(JSON.stringify({width,radarVisual}));
  if(width===390){
    assert.equal(radarVisual.selectorVisible,false,'Pas de rectangle superposé au radar mobile');
    assert.equal(radarVisual.captionVisible,false,'Pas de légende répétée sous le radar mobile');
    assert(radarVisual.diameterPx>=180,'Le tracé du radar occupe la place libérée sur mobile');
  }
  assert(Object.values(controls).every(r=>r.visible&&(width!==390 || r.top>=0&&r.bottom<=844)&&r.left>=0&&r.right<=width),'Commandes lisibles ; radar/slider/sels/acides coexistent sur mobile');
  await page.setOfflineMode(false);await clickStep(page,'Récapitulatif');await clickButton(page,'Enregistrer la recette');await page.waitForSelector('[aria-label="Ouvrir la recette Eau de contrôle"]',{visible:true});
  const saved=await readSaved();assert(!saved.waterPlan.disabled.includes('gypse'));assert.equal((saved.waterPlan.mash?.gypse??0)+(saved.waterPlan.sparge?.gypse??0),1);for (const [key,value] of Object.entries(original.yeast)) assert.deepEqual(saved.yeast[key],value, "Champ Levure initial conservé : "+key);
  const yeastAddedFields=Object.keys(saved.yeast).filter(key=>!(key in original.yeast));
  await page.setOfflineMode(false);await openEditRecipe(page,'Eau de contrôle');await clickStep(page,'Eau et sels');if(width<600)await clickButton(page,'2. Sels',true);
  assert.equal(await page.$eval(doseSelector,e=>Number(e.value.replace(',','.'))),1);
  console.log(JSON.stringify({width,errors,failed}));assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
  checks.push({width,url:page.url(),title:await page.title(),dosing:true,exclusionPersisted:true,reenableAndManualDosePersisted:true,offline:true,controls,radarVisual,yeastAddedFields,errors,remote});
  await context.close();console.log('PASS water dosing '+width);
 }
 await writeFile(resolve(evidenceDir,'report.json'),JSON.stringify({checks},null,2));
} finally {await browser.close();await new Promise(done=>server.close(done));}
