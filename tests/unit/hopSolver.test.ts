import { describe, expect, it } from 'vitest';
import { applyHopSolverCandidate, checkHopExclusions, compareHopSolverCandidates, createHopSolverSearch, initialHopSolverIntent, inspectHopSolverRecipe, prefillHopScenario, retainHopSolverCandidate, type HopSolverCandidate } from '../../src/domain/hopIndex/solver';
import { currentGuideRevision, guideAxes, guidePredictionKnowledge, guideSolverPolicy } from '../../src/ui/hopIndex/guideData';
import type { HopTriplet, HopKnowledge } from '../../functions/src/hopPredictionSchema';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import type { Recipe } from '../../src/types';
import trialPack from '../../src/data/hopTrialBootstrap.json';
import legacy from '../../src/data/hopExtrapolationLegacyBootstrap.json';
import current from '../../src/data/hopExtrapolationBootstrap.json';

const knowledge=guidePredictionKnowledge([]),policy=guideSolverPolicy([])!;
const data={varieties:trialPack.hopVarieties as HopVariety[],lots:[],knowledge};
const recipe:Recipe={id:'solver',name:'Pale',style:'Pale Ale',volumeL:20,ogTarget:1.05,fgTarget:1.01,abvTarget:5,totalGristKg:5,fermentables:[],hops:[],steps:[],notes:[],yeast:{name:'Fermentis Levure Safale US-05',form:'sèche',qty:1,unit:'sachet'},fermentation:[{tempC:18,days:10}]};
const intent={...initialHopSolverIntent(recipe,policy),timings:['postFermentation' as const]};
const triplet:HopTriplet={varietyId:data.varieties[0].id,yeastId:'fermentis-us05',timing:'postFermentation',doseGL:4,temperatureC:null,contactHours:null,matrixId:null};
const search=(patch:any={})=>createHopSolverSearch({data,policy,intent,target:{},recipe,...patch});

describe('Solver de formulation',()=>{
  it('parcourt le même domaine par lots et conserve les meilleures combinaisons distinctes',()=>{
    const s=search({intent:{...intent,keepYeast:false,timings:['fermentation','postFermentation']}});
    const all=s.evaluateBatch(0,s.total),batches=[];
    for(let i=0;i<s.total;i+=17)batches.push(...s.evaluateBatch(i,17));
    expect(batches).toEqual(all);expect(s.evaluateBatch(s.total,17)).toEqual([]);
    const key=(c:HopSolverCandidate)=>c.trial?.id??JSON.stringify(c.triplets.map(t=>[t.varietyId,t.yeastId,t.timing]));
    const expected=[...new Map([...all].sort(compareHopSolverCandidates).reverse().map(c=>[key(c),c])).values()].sort(compareHopSolverCandidates).slice(0,7);
    const retained:HopSolverCandidate[]=[];
    for(const c of [...all].reverse())retainHopSolverCandidate(retained,c,key,7);
    expect(retained).toEqual(expected);
  });
  it('reconnaît la souche de la recette et propose des conditions sourcées sans modifier son entrée',()=>{
    const before=structuredClone(recipe),s=search(),rows=s.evaluateBatch(0,s.total);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every(c=>c.triplets.every(t=>t.yeastId==='fermentis-us05' && t.temperatureC!==null && t.contactHours!==null))).toBe(true);
    expect(rows[0].conditions[0].every(c=>!!c.source.reference)).toBe(true);
    expect(recipe).toEqual(before);
    expect(prefillHopScenario({...triplet,doseGL:0,temperatureC:0,contactHours:0},policy).triplet).toMatchObject({doseGL:0,temperatureC:0,contactHours:0});
  });
  it('vérifie les conflits des ajouts déjà là et empêche de les compenser par un score',()=>{
    const avoided={...intent,avoid:['citrus']};
    const s=search({intent:avoided,target:{citrus:{min:66,max:100}}}),c=s.evaluateBatch(0,1)[0];
    expect(c.checks.some(c=>c.status==='conflict'&&c.message.includes('contredisent'))).toBe(true);
    expect(()=>applyHopSolverCandidate(recipe,c,data,avoided)).toThrow(/conflit/);
    const mock={...c.predictions[0],profile:{citrus:{range:{min:40,max:90},confidence:'low' as const,sources:[],reasons:[]}}};
    expect(checkHopExclusions(mock,['citrus'],guideAxes([]))[0].status).toBe('conflict');
    mock.profile.citrus.range={min:0,max:90};
    expect(checkHopExclusions(mock,['citrus'],guideAxes([]))[0].status).toBe('unknown');
  });
  it('conserve les ajouts et la levure de la recette, ou remplace seulement l’ajout choisi',()=>{
    const old={name:'Cascade',weightG:12,alpha:6.5,stage:'boil' as const,timeMin:60};
    const r={...recipe,hops:[old]},s=search({recipe:r}),c=s.evaluateBatch(0,1)[0];
    const added=applyHopSolverCandidate(r,c,data,intent);
    expect(added.hops).toHaveLength(2);expect(added.hops[0]).toEqual(old);expect(added.yeast.qty).toBe(1);expect(added.fermentation).toEqual(r.fermentation);
    const replaced=applyHopSolverCandidate(r,c,data,intent,0);expect(replaced.hops).toHaveLength(1);
    expect(r.hops).toEqual([old]);
  });
  it('compte le dry-hop existant et ne transforme pas une dose manquante en zéro',()=>{
    const r={...recipe,hops:[{name:'Cascade',weightG:100,alpha:6,stage:'dryHop' as const,aromaTiming:'postFermentation' as const,hopVarietyId:data.varieties[0].id}]};
    const s=search({recipe:r,doseGL:6}),c=s.evaluateBatch(0,1)[0];expect(c.totalDryHopGL).toBe(11);
    expect(c.recipeChecks.some(c=>c.message.includes('cumulé'))).toBe(true);
    const missing=s.evaluateProgram({...c,triplets:c.triplets.map(t=>({...t,doseGL:null}))});expect(missing.totalDryHopGL).toBeNull();
    expect(()=>applyHopSolverCandidate(recipe,missing,data,intent)).toThrow(/dose/);
  });
  it('distingue phénols, terpènes et thiols ; ne promet pas leur absence sans analyse',()=>{
    const phenols=search({intent:{...intent,keepYeast:false,chemistry:{phenols:'seek'}}}),rows=phenols.evaluateBatch(0,phenols.total);
    expect(rows.find(c=>c.triplets[0].yeastId==='wyeast-3068')?.checks.some(c=>c.status==='supported'&&c.message.includes('phénolique'))).toBe(true);
    expect(rows.find(c=>c.triplets[0].yeastId==='lalbrew-verdant-ipa')?.checks.some(c=>c.status==='conflict')).toBe(true);
    const avoidance=search({intent:{...intent,chemistry:{thiols:'avoid'}}}).evaluateBatch(0,1)[0];
    expect(avoidance.checks.some(c=>c.status==='unknown'&&c.message.includes('absence non établie'))).toBe(true);
  });
  it('signale la souche diastaticus et un palier hors plage sans inventer une cinétique',()=>{
    const result=inspectHopSolverRecipe(recipe,[{...triplet,yeastId:'wyeast-3724'}],intent,data,policy);
    expect(result.checks.some(c=>c.message.includes('STA1'))).toBe(true);
    expect(result.checks.some(c=>c.message.includes('hors plage fabricant'))).toBe(true);
  });
  it('reste explicite pour une levure non résolue au lieu de choisir une autre souche',()=>{
    const r={...recipe,yeast:{...recipe.yeast,name:'Levure inconnue maison'}};
    const s=search({recipe:r});expect(s.total).toBe(0);expect(s.emptyReason).toMatch(/pas identifiée/);
  });
});
describe('Révision des coefficients par défaut',()=>{
  it('actualise seulement le document original intact, jamais une personnalisation ni une désactivation',()=>{
    const previous=structuredClone(legacy[0]) as HopKnowledge;
    expect(currentGuideRevision(previous)).toEqual(current[0]);
    const disabled={...previous,enabled:false} as HopKnowledge;expect(currentGuideRevision(disabled)).toBe(disabled);
    const edited=structuredClone(legacy[0]);edited.gain.central+=.01;expect(currentGuideRevision(edited as HopKnowledge)).toBe(edited);
    expect(guidePredictionKnowledge([disabled]).find(k=>k.id===disabled.id)).toEqual(disabled);
  });
});
