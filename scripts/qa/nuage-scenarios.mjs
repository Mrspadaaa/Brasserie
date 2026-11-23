import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {verifyGraph} from './verify-hop-graph.mjs';

/** Runs on the compiled real App. Optional private inputs are supplied only at runtime. */
export async function checkNuageScenarios({page,base,width,out,button,details,fill,select}) {
 const pilots=process.env.NOLO_QA_PILOTS?JSON.parse(await readFile(process.env.NOLO_QA_PILOTS,'utf8')).recipes:await page.evaluate(()=>window.__hopQa.nolo.pilots());
 const reports=[];
 for(const [i,pilot] of pilots.entries()) {
  await page.evaluate(r=>window.__hopQa.seedRecipe(r),pilot);
  await page.goto(base,{waitUntil:'networkidle0'});await page.waitForFunction(()=>window.__hopQa?.ready());
  await button(page,'Recettes',true);await button(page,pilot.name,true);
  assert.equal(await page.$$eval('[data-recipe-section][open]',es=>es.length),0);
  const expectedRo=pilot.waterPlan.mashWaterL*pilot.waterPlan.diRatioPct/100+pilot.waterPlan.spargeWaterL*(pilot.waterPlan.spargeDiRatioPct??pilot.waterPlan.diRatioPct)/100;
  const expectedLabel=expectedRo.toLocaleString('fr-FR',{maximumFractionDigits:1})+' L';
  assert.equal(await page.$eval('[data-water-volume="Osmosée"]',e=>e.textContent),expectedLabel);
  await page.screenshot({path:resolve(out,'pilote-'+i+'-compact-'+width+'.png')});
  await details(page,'Grain');await details(page,'Eau et sels');
  assert.equal(await page.$$eval('[data-recipe-section][open]',es=>es.length),2);
  assert.equal(await page.$$eval('[data-recipe-section="Eau et sels"] details[open]',es=>es.length),0);
  await page.$eval('[data-recipe-section="Eau et sels"] summary',e=>e.scrollIntoView({block:'start'}));
  await page.screenshot({path:resolve(out,'pilote-'+i+'-eau-'+width+'.png')});
  await details(page,'Grain',false);await details(page,'Eau et sels',false);
  await details(page,'Objectif NOLO');
  const raw=await page.evaluate(r=>window.__hopQa.nolo.raw(r),pilot);
  const graph=await page.$eval('[aria-label="Projection au conditionnement"]',e=>({min:Number(e.dataset.noloMin),max:Number(e.dataset.noloMax)}));
  assert(Math.abs(graph.min-raw.projection.min)<1e-10&&Math.abs(graph.max-raw.projection.max)<1e-10);
  assert.equal(raw.projectionStatus,'within');assert.equal(raw.measuredPackaged,false);
  await page.$eval('[aria-label="Objectif NOLO"]',e=>e.scrollIntoView({block:'start'}));
  await page.screenshot({path:resolve(out,'pilote-'+i+'-nolo-'+width+'.png')});
  const baseline=await page.evaluate(()=>({writes:window.__hopQa.metrics.writes,calls:window.__hopQa.calls.length}));
  const network=[];const listener=req=>{if(/^https?:/.test(req.url()))network.push(req.url());};page.on('request',listener);
  await button(page,'Simuler une variante NOLO');
  if(i===1){
   await select(page,'Procédé','secondRunnings');
   assert(await page.$eval('[aria-label="Objectif NOLO"]',e=>e.innerText.includes('densité du moût récupéré')));
   assert.equal(await page.$('[data-nolo-band]'),null);
   await page.$eval('[aria-label="Moût de seconde extraction"]',e=>e.scrollIntoView({block:'start'}));
   await page.screenshot({path:resolve(out,'seconde-extraction-manquante-'+width+'.png')});
   await fill(page,'Volume récupéré · L','24');await fill(page,'Densité récupérée · SG','1.010');
   assert(await page.$('[aria-label="Plafond physique · pas une prédiction"]'));
   assert(await page.$eval('[aria-label="Objectif NOLO"]',e=>e.innerText.includes('sucres accessibles')));
   await page.screenshot({path:resolve(out,'seconde-extraction-renseignee-'+width+'.png')});
   await select(page,'Procédé',pilot.nolo.process);
   assert(await page.$('[aria-label="Projection au conditionnement"]'));
  }
  if(i===0) {
   for(const process of ['restricted','restored','lowExtract','coldExtraction','coldContact','arrested','secondRunnings','dealcoholized']) {
    await select(page,'Procédé',process);
    const hasRemoval=await page.evaluate(()=>[...document.querySelectorAll('[aria-label="Objectif NOLO"] summary')].some(s=>s.textContent.includes('Hypothèses de désalcoolisation')));
    assert.equal(hasRemoval,process==='dealcoholized');
    if(process==='arrested'){
     await fill(page,'Densité d’arrêt envisagée minimum','1.046');await fill(page,'Densité d’arrêt envisagée maximum','1.047');
     assert(await page.$('[aria-label="Projection au conditionnement"]'));
    }
   }
  }
  await button(page,'Fermer la variante NOLO');
  await details(page,'Objectif NOLO',false);
  await details(page,'Potentiel aromatique');
  assert.deepEqual(network,[]);
  // Warm optional reference chunks before measuring calculations.
  await details(page,'Composition, thiols et phénols');await page.waitForNetworkIdle({idleTime:200});await details(page,'Composition, thiols et phénols',false);
  network.length=0;
  const controls=[];
  for(const stage of ['before','after']) {
   await page.select('[aria-label="Étape aromatique"]',stage);
   const context=stage==='after'?{stage:'packaged',transfer:{axes:{citrus:{min:.2,max:.7}},source:{title:'Hypothèses du pilote',author:'L’Affinée',year:2026,kind:'judgment',reference:'functions/reports/nolo-scenarios-2026.md'}}}:undefined;
   if(stage==='after') {
    await details(page,'Hypothèses sensorielles par famille');
    await fill(page,'Agrumes conservé minimum','20');await fill(page,'Agrumes conservé maximum','70');
    await details(page,'Hypothèses sensorielles par famille',false);
   }
   for(const [all,cumulative] of [[false,false],[true,false],[false,true],[true,true]]) {
    for(const [name,value] of [['Toutes les saveurs et la chimie',all],['Cumuler tous les ajouts',cumulative]]) {
     const h=await page.$('[aria-label="Simulation de mes ajouts"] input[aria-label="'+name+'"]');
     if(await h.evaluate(e=>e.checked)!==value){await h.evaluate(e=>e.scrollIntoView({block:'center'}));await h.click();}
    }
    const proof=await verifyGraph(page,pilot,cumulative,context);
    const informative=Object.values(proof.raw.overall.profile).filter(e=>e.range&&e.range.max-e.range.min<100).length;
    controls.push({stage,all,cumulative,informative});
   }
   await page.$eval('[aria-label="Simulation de mes ajouts"]',e=>e.scrollIntoView({block:'start'}));
   await page.screenshot({path:resolve(out,'pilote-'+i+'-'+stage+'-'+width+'.png')});
   if(stage==='after') {
    await details(page,'Hypothèses sensorielles par famille');
    await fill(page,'Agrumes conservé minimum','');
    const proof=await verifyGraph(page,pilot,true,{...context,transfer:{...context.transfer,axes:{}}});
    assert.equal(proof.raw.overall.profile.citrus.range,null);
    await page.screenshot({path:resolve(out,'pilote-'+i+'-hypotheses-'+width+'.png')});
   }
  }
  await page.keyboard.press('Tab');assert(await page.evaluate(()=>document.activeElement!==document.body));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(await page.evaluate(()=>({writes:window.__hopQa.metrics.writes,calls:window.__hopQa.calls.length})),baseline);
  assert.deepEqual(network,[]);page.off('request',listener);
  reports.push({pilot:i,roL:expectedRo,projection:raw.projection,controls,simulationWrites:0,simulationRequests:0});
 }
 return reports;
}
