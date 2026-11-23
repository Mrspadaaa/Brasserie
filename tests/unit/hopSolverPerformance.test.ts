import { beforeAll, describe, expect, it } from 'vitest';
import { performance } from 'node:perf_hooks';
import { build } from 'esbuild';
import { createHopSolverSearch, type HopSolverSearchOptions } from '../../src/domain/hopIndex/solver';
import { HOP_QUICK_LIMITS } from '../../src/domain/hopIndex/solverSelection';
import { runHopSolverSearch, type HopSearchUpdate } from '../../src/domain/hopIndex/solverSearch';
import { guidePredictionKnowledge, guideSolverPolicy, loadGuideVarieties } from '../../src/ui/hopIndex/guideData';
import catalogue from '../../src/data/yeastCatalogueBootstrap.json';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';
let options:HopSolverSearchOptions;
beforeAll(async()=>{
  const saved=catalogue as HopKnowledge[];
  options={data:{varieties:[...new Map((await loadGuideVarieties()).map(v=>[v.id,v])).values()],lots:[],knowledge:guidePredictionKnowledge(saved)},policy:guideSolverPolicy(saved)!,
    intent:{styleId:'free',avoid:[],chemistry:{},keepYeast:false,timings:['whirlpool','fermentation','postFermentation']},target:{citrus:{min:33,max:66}}};
});
describe('Catalogue complet du solver',()=>{
  it('borne la recherche ciblée et conserve les mêmes prédictions pour les pistes retenues',()=>{
    const quick=createHopSolverSearch(options),full=createHopSolverSearch({...options,mode:'exhaustive'});
    expect(full.total).toBeGreaterThan(1_000_000);
    expect(quick.coverage.fullTotal).toBe(full.total);
    expect(quick.total/full.total).toBeLessThan(.01);
    expect(quick.total).toBeLessThanOrEqual(HOP_QUICK_LIMITS.variants+20);
    const rows=quick.evaluateBatch(0,quick.total);
    const trialCount=options.data.knowledge.filter(k=>k.kind==='trial').length;
    const published=full.evaluateBatch(0,trialCount).filter(c=>c.trial).map(c=>c.trial!.id);
    expect(rows.filter(c=>c.trial).map(c=>c.trial!.id)).toEqual(published);
    for(const c of rows.slice(0,20))expect(full.evaluateProgram(c)).toEqual(c);
  });
  it('ne dépend pas de l’ordre des catalogues pour présélectionner',()=>{
    const a=createHopSolverSearch(options),b=createHopSolverSearch({...options,data:{...options.data,varieties:[...options.data.varieties].reverse()}});
    expect(a.evaluateBatch(0,a.total).map(c=>c.id)).toEqual(b.evaluateBatch(0,b.total).map(c=>c.id));
  });
  it('respecte une levure imposée même non étalonnée, et conserve les références de recette',()=>{
    const yeast=catalogue.find(k=>k.id==='fermentis-us05')!;
    const variety=options.data.varieties.at(-1)!;
    const custom={...yeast,id:'custom-no-model',name:'Souche personnelle'};
    const recipe={id:'speed',name:'Témoin',style:'Libre',volumeL:20,fermentables:[],hops:[{name:variety.name,hopVarietyId:variety.id,stage:'boil',timeMin:60,weightG:10}],yeast:{name:custom.name,hopIndexId:custom.id}} as any;
    const s=createHopSolverSearch({...options,data:{...options.data,knowledge:[...options.data.knowledge,custom as HopKnowledge]},recipe,intent:{...options.intent,keepYeast:true}});
    const rows=s.evaluateBatch(0,s.total);
    expect(rows.every(c=>c.triplets.every(t=>t.yeastId===custom.id))).toBe(true);
    expect(rows.some(c=>c.triplets.some(t=>t.varietyId===variety.id))).toBe(true);
    expect(rows.some(c=>c.predictions.some(p=>p.extrapolatedAxes?.length))).toBe(true);
  });
  it('publie avant la fin et termine le catalogue ciblé sans calculer tout le produit cartésien',async()=>{
    const start=performance.now(),updates:HopSearchUpdate[]=[];
    await runHopSolverSearch(options,u=>updates.push(u),()=>false);
    const end=updates.at(-1)!;
    expect(updates.some(u=>u.results.length&&!u.done)).toBe(true);
    expect(end.done).toBe(true);expect(end.examined).toBe(end.coverage.total);
    console.log(JSON.stringify({fullScenarios:end.coverage.fullTotal,evaluated:end.examined,firstResultsMs:updates.find(u=>u.results.length)!.elapsedMs,totalMs:performance.now()-start}));
  });
  it('n’importe aucun service réseau dans le worker de calcul',async()=>{
    const result=await build({entryPoints:['src/ui/hopIndex/hopSolver.worker.ts'],bundle:true,platform:'browser',format:'esm',metafile:true,write:false});
    expect(Object.keys(result.metafile!.inputs).filter(p=>p.includes('/services/')||p.includes('firebase'))).toEqual([]);
  });
});
