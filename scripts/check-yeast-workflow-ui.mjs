// Real React application, isolated Firebase/auth/AI adapters. No live account or API calls.
// Browser plugin is unavailable in this workspace; use the repository's existing Puppeteer runtime.
import assert from 'node:assert/strict';
import { buildHopRecipeQa } from './build-hop-recipe-qa.mjs';
import puppeteer from 'puppeteer-core';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';

const dir = resolve(tmpdir(), 'laffinee-hop-qa-yeast-front-flow');
const out = resolve(tmpdir(), 'laffinee-yeast-front-flow-evidence');
if (!process.argv.includes('--reuse-build')) await buildHopRecipeQa(dir);
await mkdir(out, { recursive: true });
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(dir, path === '/' ? 'tests/qa/hop-recipe/index.html' : '.' + path);
    if (!file.startsWith(dir + sep)) { res.writeHead(403); res.end(); return; }
    res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' })[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--mute-audio'] });
const reports = [], errors = [];
const byLabel = label => `[aria-label=${JSON.stringify(label)}]`;
async function clickText(page, text, contains = false, tag = 'button') {
  const handle = await page.waitForFunction((text, contains, tag) => [...document.querySelectorAll(tag)].find(e => e.getClientRects().length && (contains ? e.textContent.trim().includes(text) : e.textContent.trim() === text)), {}, text, contains, tag);
  await handle.asElement().click();
}
async function step(page, label) {
  const handle = await page.waitForFunction(label => [...document.querySelectorAll('nav[aria-label="Étapes"] button')].find(e => e.getClientRects().length && e.getAttribute('aria-label') === label), {}, label);
  await handle.asElement().click();
}
async function fill(page, label, value) {
  const field = await page.waitForSelector(byLabel(label), { visible: true });
  await field.click({ clickCount: 3 }); await page.keyboard.press('Backspace');
  if (value) await field.type(value); await page.keyboard.press('Tab');
}
async function capture(page, name, selector = '[aria-label="Choix et simulation de levure"]') {
  const el = await page.$(selector);
  if (el) await el.evaluate(e => e.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: resolve(out, name + '.png') });
  const state = await page.evaluate(() => ({
    width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth,
    text: document.body.innerText, fixed: [...document.querySelectorAll('.recipe-wizard header,.recipe-wizard footer')].filter(e => e.getClientRects().length).map(e => ({ tag: e.tagName, height: e.getBoundingClientRect().height })),
    escaping: [...document.querySelectorAll('.yeast-workbench *')].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden').filter(e => { const r = e.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1; }).map(e => ({ tag: e.tagName, text: e.textContent.slice(0, 90) })).slice(0, 10),
  }));
  assert(!state.overflow, `Page overflow: ${name}`); assert.equal(state.escaping.length, 0, `Yeast control overflow: ${name} ${JSON.stringify(state.escaping)}`);
  assert(!/NaN|Infinity/.test(state.text)); reports.push({ name, ...state });
}
async function openEdit(page, name) {
  const selector = byLabel(`Modifier la recette ${name}`);
  await page.waitForSelector(selector);
  const field = await page.$(selector);
  const summary = await field.evaluateHandle(e => { const detail = e.closest('details'); return detail && !detail.open ? detail.querySelector('summary') : null; });
  if (summary.asElement()) await summary.asElement().asLocator().click();
  try { await page.locator(selector).click(); await page.waitForSelector('#wz-title'); }
  catch(error) { await page.screenshot({path:resolve(out,'debug-open.png')}); console.log('OPEN FAILED',await page.$eval('body',e=>e.innerText)); throw error; }
}
async function seed(page, name, kind) {
  return page.evaluate((name, kind) => {
    const r = window.__hopQa.recipe();
    Object.assign(r, { id: `qa-yeast-${kind}`, name, style: kind === 'hazy' ? 'NEIPA' : kind === 'unknown' ? 'Projet personnel' : 'Hefeweizen', styleRef: undefined, nolo: undefined, yeastGuide: undefined, yeastDesign: undefined,
      volumeL: 20, ogTarget: 1.05, ibuTarget: 12, batchRef: undefined,
      yeast: kind === 'hazy' ? { name: 'LalBrew Verdant IPA', hopIndexId: 'lalbrew-verdant-ipa', form: 'sèche', qty: 12, unit: 'g', pitchTempC: 20 }
        : { name: 'Wyeast 3068 Weihenstephan Weizen', hopIndexId: 'wyeast-3068', form: 'liquide', qty: 100, unit: 'mL', pitchTempC: 20 },
      fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 20, days: 10 }, { kind: 'garde', name: 'Garde', tempC: 4, days: 7 }],
      mash: { ...r.mash, steps: [{ name: 'Saccharification', tempC: 66, durationMin: 60 }] },
      hops: kind === 'hazy' ? [{ name: 'Citra', weightG: 60, alpha: 12, stage: 'dryHop', dayOffset: 3, aromaTiming: 'fermentation', aromaContactHours: 48, aromaTemperatureC: 20 },
        { name: 'Mosaic', weightG: 40, alpha: 12, stage: 'dryHop', dayOffset: 8 }]
        : [{ name: 'Hallertau', weightG: 20, alpha: 4, stage: 'boil', timeMin: 60 }],
    });
    if (kind === 'unknown') { r.fermentables = []; r.ogTarget = null; r.fermentation = []; r.mash.steps = []; }
    window.__hopQa.seedRecipe(r); return r;
  }, name, kind);
}

try {
 for(const width of process.argv.includes('--375-only') ? [375] : [375,320,430,1280]) {
  const context=await browser.createBrowserContext(),page=await context.newPage();
  await context.overridePermissions(base,['clipboard-read','clipboard-sanitized-write']);
  page.on('pageerror',e=>errors.push({width,message:e.message}));
  await page.setViewport({width,height:900,isMobile:width<600,hasTouch:width<600});
  await page.setRequestInterception(true);page.on('request',r=>/^https?:/.test(r.url())&&!r.url().startsWith(base+'/')?r.abort():r.continue());
  await page.evaluateOnNewDocument(()=>{if(!localStorage.getItem('laffinee_ui_state'))localStorage.setItem('laffinee_ui_state',JSON.stringify({app_active_tab:'production',production_subtab:'recipes'}));});
  await page.goto(base);await page.waitForFunction(()=>window.__hopQa?.ready());
  const name='QA levure échanges '+width;
  await seed(page,name,'wheat');
  await page.evaluate(name=>{const r=window.__hopQa.storage.getRecipes().find(r=>r.name===name);window.__hopQa.seedRecipe({...r,hops:[...r.hops,{name:'Mandarina Bavaria',stage:'dryHop',weightG:20,alpha:0,dayOffset:3,aromaTiming:'fermentation',aromaContactHours:48,aromaTemperatureC:18}]});},name);
  await openEdit(page,name);await step(page,'Levure');
  await clickText(page,'Girofle · épices');await clickText(page,'Préparer un essai girofle');
  await clickText(page,'Pression précoce',true,'summary');await fill(page,'Contre-pression du scénario en bar','0');
  await clickText(page,'Appliquer le scénario');
  await page.waitForFunction(()=>document.body.innerText.includes('Scénario repris dans la recette.'));
  await step(page,'Récapitulatif');await page.bringToFront();await clickText(page,'Copier la recette en texte');
  await page.waitForFunction(()=>document.body.innerText.includes('Recette copiée'));
  const copied=await page.evaluate(()=>navigator.clipboard.readText());
  assert(copied.startsWith('L’AFFINÉE — RECETTE v1'));assert(copied.includes('wyeast-3068'));assert(copied.includes('Girofle'));assert(copied.includes('Contact aromatique (h) : 48'));
  if(width===375) {
   const downloadDir=resolve(out,'download-'+Date.now());await mkdir(downloadDir,{recursive:true});
   const cdp=await page.target().createCDPSession();await cdp.send('Page.setDownloadBehavior',{behavior:'allow',downloadPath:downloadDir});
   await clickText(page,'Texte complet et fichier .txt',false,'summary');await clickText(page,'Télécharger .txt');
   let downloaded;for(let i=0;i<40&&!downloaded;i++){downloaded=await readFile(resolve(downloadDir,'recette-laffinee.txt'),'utf8').catch(()=>null);if(!downloaded)await new Promise(r=>setTimeout(r,100));}
   assert.equal(downloaded?.replace(/\r\n/g,'\n'),copied.replace(/\r\n/g,'\n'));reports.push({download:resolve(downloadDir,'recette-laffinee.txt'),matchesNativeClipboard:true,comparison:'Windows clipboard line endings normalized'});
   await clickText(page,'Texte complet et fichier .txt',false,'summary');
  }
  await capture(page,'after-copy-'+width,'[aria-label="Récapitulatif de la recette"]');
  await clickText(page,'Enregistrer la recette');
  await page.waitForFunction(n=>window.__hopQa.storage.getRecipes().some(r=>r.name===n&&r.yeastDesign),{},name);
  const original=await page.evaluate(n=>window.__hopQa.storage.getRecipes().find(r=>r.name===n&&r.yeastDesign),name);
  await page.evaluate(original=>window.__hopQa.seedRecipe({...original,id:'QA-IMPORT-TARGET',name:'Cible import',yeastDesign:undefined,yeast:{name:'Autre souche',form:'sèche',qty:99,unit:'sachet'}}),original);
  await page.reload();await page.waitForFunction(()=>window.__hopQa?.ready());
  await openEdit(page,'Cible import');await clickText(page,'Coller une recette trouvée');
  await page.locator(byLabel('Texte de la recette')).fill(copied);await clickText(page,'Lire la recette');
  await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(e=>e.getClientRects().length&&e.textContent.trim()==='Reprendre'));
  await capture(page,'after-import-preview-'+width,'[aria-label="Texte de la recette"]');
  await clickText(page,'Reprendre');await step(page,'Récapitulatif');await clickText(page,'Enregistrer la recette');
  await page.waitForFunction(()=>window.__hopQa.storage.getRecipes().find(r=>r.id==='QA-IMPORT-TARGET')?.yeastDesign?.goal==='clove');
  const restored=await page.evaluate(()=>window.__hopQa.storage.getRecipes().find(r=>r.id==='QA-IMPORT-TARGET'));
  assert.deepEqual(restored.yeastDesign,original.yeastDesign);assert.deepEqual(restored.yeast,original.yeast);
  assert.deepEqual(restored.hops,original.hops);assert.deepEqual(restored.fermentation,original.fermentation);assert.deepEqual(restored.mash.steps,original.mash.steps);
  await page.evaluate(restored=>{
   const steps=[{id:'mash-0',label:'Repos férulique',durationMin:15,tempC:44},{id:'ensemencement',label:'Ensemencement',durationMin:0,tempC:20}];
   window.__hopQa.storage.addBatch({...restored,id:'B-YEAST',name:'Brassin levure figé',status:'planifie',brewDate:'12.09.2026',stockAccountingVersion:1,gravityLog:[],recipeSnapshot:{...restored,capturedAt:'2026-09-12'},brewDay:{steps,currentIndex:0,readings:[]}});
   window.__hopQa.seedRecipe({...restored,style:'Lager modifiée au catalogue',yeast:{name:'Autre levure au catalogue',form:'sèche',qty:99,unit:'g'}});
   const ui=JSON.parse(localStorage.getItem('laffinee_ui_state'));ui.production_subtab='batches';localStorage.setItem('laffinee_ui_state',JSON.stringify(ui));
  },restored);
  await page.reload();await page.waitForFunction(()=>window.__hopQa?.ready());
  await page.locator('[aria-label="Jour de brassage · B-YEAST"]').click();
  await page.waitForSelector('[aria-label="Conduite de levure du brassin"]');
  const guide=byLabel('Conduite de levure du brassin');
  assert.match(await page.$eval(guide,e=>e.textContent),/44 °C pendant 15 min/);
  assert(!(await page.$eval(guide,e=>e.textContent)).includes('Lager'));
  await capture(page,'after-brew-mash-'+width,guide);
  await clickText(page,'Refroidir',true);
  await page.waitForSelector('[aria-label="Relever température"]');
  assert.match(await page.$eval(guide,e=>e.textContent),/0 bar rel/);
  await capture(page,'after-brew-pitch-'+width,guide);
  await page.locator('[aria-label="Relever température"]').click();
  await page.waitForSelector('#brew-reading',{visible:true});
  await page.locator('#brew-reading').fill('200');
  assert(await page.$$eval('[aria-label="Mesures de cette étape"] button',rows=>rows.find(e=>e.textContent.trim()==='Noter').disabled));
  await page.locator('#brew-reading').fill('20');await clickText(page,'Noter');
  await page.waitForFunction(()=>window.__hopQa.storage.getBatches().find(b=>b.id==='B-YEAST').brewDay.readings.some(r=>r.kind==='temperature'&&r.stepId==='ensemencement'&&r.value===20));
  await capture(page,'after-brew-measure-'+width,'[aria-label="Mesures de cette étape"]');
  await page.keyboard.press('Escape');
  await page.waitForSelector('[aria-label="Relevés du moût refroidi"]');
  assert.match(await page.$eval('[aria-label="Relevés du moût refroidi"]',e=>e.textContent),/20 °C/);
  const finalBatch=await page.evaluate(()=>window.__hopQa.storage.getBatches().find(b=>b.id==='B-YEAST'));
  assert.equal(finalBatch.recipeSnapshot.yeast.hopIndexId,'wyeast-3068');assert.equal(finalBatch.brewDay.steps.find(s=>s.id==='ensemencement').doneAt,undefined);
  assert.equal(finalBatch.brewDay.finishedAt,undefined);
  await clickText(page,'Programme, ajouts à cru et sources',false,'summary');
  await capture(page,'after-brew-hops-'+width,guide+' details');
  assert.match(await page.$eval(guide+' table',e=>e.textContent),/Mandarina Bavaria/);assert.match(await page.$eval(guide+' table',e=>e.textContent),/48 h · 18 °C/);
  if(width===375||width===1280) {
   await page.evaluate(restored=>{
    const yeast={name:'LalBrew Verdant IPA',hopIndexId:'lalbrew-verdant-ipa',form:'sèche',qty:12,unit:'g',pitchTempC:20};
    const r={...restored,id:'QA-FORM',name:'QA levain à confirmer',style:'NEIPA',yeast:{...yeast,form:'levain',qty:125,unit:'mL'},
     yeastDesign:{...restored.yeastDesign,yeastId:yeast.hopIndexId,styleId:'hazy-ipa',goal:'hops',applied:{...restored.yeastDesign.applied,yeast,style:'NEIPA'}}};
    window.__hopQa.seedRecipe(r);
    window.__hopQa.storage.addBatch({...r,id:'B-FORM',name:'Brassin levain',status:'planifie',brewDate:'12.09.2026',stockAccountingVersion:1,gravityLog:[],recipeSnapshot:{...r,capturedAt:'2026-09-12'},brewDay:{steps:[{id:'ensemencement',label:'Ensemencement',durationMin:0,tempC:20}],currentIndex:0,readings:[{kind:'volume',value:10,unit:'L',at:1,stepId:'ensemencement'}]}});
    const ui=JSON.parse(localStorage.getItem('laffinee_ui_state'));ui.production_subtab='recipes';localStorage.setItem('laffinee_ui_state',JSON.stringify(ui));
   },restored);
   await page.reload();await page.waitForFunction(()=>window.__hopQa?.ready());
   await page.locator('[aria-label="Ouvrir la recette QA levain à confirmer"]').click();
   const summarySelector=byLabel('Conduite de levure de la recette');
   await page.waitForSelector(summarySelector);
   const section=await page.$(summarySelector),toggle=await section.evaluateHandle(e=>{const d=e.closest('details');return d&&!d.open?d.querySelector('summary'):null;});
   if(toggle.asElement())await toggle.asElement().click();
   assert.match(await page.$eval(summarySelector,e=>e.textContent),/Forme prévue : levain ; référence : sèche/);
   assert(!(await page.$eval(summarySelector,e=>e.textContent)).includes('Conversion des g/hL'));
   await capture(page,'after-form-overview-'+width,summarySelector);
   await page.evaluate(()=>{const ui=JSON.parse(localStorage.getItem('laffinee_ui_state'));ui.production_subtab='batches';localStorage.setItem('laffinee_ui_state',JSON.stringify(ui));});
   await page.reload();await page.waitForFunction(()=>window.__hopQa?.ready());
   await page.locator('[aria-label="Jour de brassage · B-FORM"]').click();await page.waitForSelector(guide);
   assert.match(await page.$eval(guide,e=>e.textContent),/Forme prévue : levain ; référence : sèche/);
   assert(!(await page.$eval(guide,e=>e.textContent)).includes('Repère fabricant pour'));
   await capture(page,'after-form-brew-'+width,guide);
  }
  const calls=await page.evaluate(()=>window.__hopQa.calls);
  assert.deepEqual(calls.filter(n=>!['getBrewerActivity','getBrewerConversation'].includes(n)),[]);
  reports.push({width,completed:'actual clipboard, local import, saved overview, frozen batch, mash, pitching, invalid/corrected measurement, actual dry-hop contacts',calls});
  console.log('YEAST TRANSFER BREW passed',width);await context.close();
 }
 assert.deepEqual(errors,[]);await writeFile(resolve(out,process.argv.includes('--375-only')?'transfer-brew-label.json':'transfer-brew.json'),JSON.stringify({reports,errors},null,2));
} catch(error) {
 for(const [i,page] of (await browser.pages()).entries())if(page.url().startsWith(base)){await page.screenshot({path:resolve(out,'journey-failure-'+i+'.png')});await writeFile(resolve(out,'journey-failure-'+i+'.txt'),String(error)+'\n'+await page.$eval('body',e=>e.innerText));}
 console.log('PAGE ERRORS',JSON.stringify(errors));throw error;
} finally {await browser.close();server.close();}
