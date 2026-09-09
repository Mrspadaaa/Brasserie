import { describe,it,expect } from 'vitest';
import fixture from '../fixtures/nolo-scenarios.json';
import oldFixture from '../fixtures/nolo-scientific.json';
import current from '../../src/data/noloScenarioBootstrap.json';
import oldPack from '../../src/data/noloBootstrap.json';
import { assertNoloScience, type NoloScience, type NoloProcess, type NoloOperation } from '../../functions/src/noloSchema';
import { evaluateNolo } from '../../functions/src/noloCore';
import { evaluateNoloScenario,changeNoloProcess,aromaAlcoholContribution,noloScenarioBasis,type NoloScenarioInput } from '../../functions/src/noloScenario';
import { newNoloConfig,noloPlanningSource } from '../../src/domain/nolo';
import { predictHopRecipe } from '../../functions/src/hopRecipePrediction';
import { testHopData,testHopTriplet } from '../fixtures/hopPrediction';
import { captureHopRecipePrediction } from '../../src/domain/hopIndex/snapshots';
import { assertHopPredictionSnapshot } from '../../functions/src/hopPredictionValidation';
const science=current[0] as NoloScience;
const old=oldPack.find(p=>p.kind==='noloScience') as NoloScience;
const r=(min:number,max=min)=>({min,max});
function input():NoloScenarioInput{return {config:{...newNoloConfig(),process:'dealcoholized'},volumeL:24,
  yeastId:fixture.mother.yeastId,yeastName:'LalBrew Munich Classic',fermentation:[{kind:'primaire',tempC:20,days:7}],
  mash:[{tempC:68,durationMin:55},{tempC:72,durationMin:15}],dryHop:false,
  og:{range:r(fixture.mother.og),origin:'calculated',source:noloPlanningSource}};}
const removal:NoloOperation={id:'remove',kind:'removal',name:'Traitement',ethanolRemovedPct:r(94,96),finalVolumeL:24,source:'Hypothèse de pilote, 2026'};
const aroma:Extract<NoloOperation,{kind:'aroma'}>={id:'banana',kind:'aroma',name:'Restitution',volumeML:12/1.032,carrierAbvPct:null,sugarG:null,composition:'99 % propylène glycol',moment:'après traitement',
  compositionBound:{massG:fixture.aroma.massG,inertMassPct:fixture.aroma.inertMassPct,source:noloPlanningSource}};
describe('Scénarios NOLO : preuves, hypothèses, mesures et bilan commun',()=>{
  it('conserve les deux éditions LA-01 et leur domaine expérimental exact',()=>{
    assertNoloScience(science);assertNoloScience(old);
    for(const [ref,steps] of [[old,oldFixture.la01.mash],[science,fixture.la01_2025.mash]] as const){
      for(const point of fixture.la01_2025.points) {
        const s=input();s.yeastId=ref.la01.yeastId;s.config.process='restricted';s.mash=[...steps];s.config.wort.ogPlato=r(point.plato);
        const out=evaluateNoloScenario(s,ref);
        expect(out.manufacturerEstimate?.applicable).toBe(true);
        expect(out.projection.min).toBeCloseTo(point.abv,12);
        expect(out.projection.max).toBeCloseTo(point.abv,12);
        expect(out.projection.kind).toBe('experimental');
        expect(out.measuredPackaged).toBe(false);
        s.mash=[...steps].reverse();expect(evaluateNoloScenario(s,ref).manufacturerEstimate?.applicable).toBe(false);
      }
    }
    const s=input();s.yeastId=science.la01.yeastId;s.config.process='restricted';s.mash=oldFixture.la01.mash;s.config.wort.ogPlato=r(6);
    expect(evaluateNoloScenario(s,science).manufacturerEstimate?.applicable).toBe(false);
    expect(evaluateNolo(s,old).manufacturerEstimate?.applicable).toBe(true);
  });
  it('sépare mère, retrait supposé et vérification ; une fin inconnue ne masque pas la mère',()=>{
    const s=input();s.config.operations=[{...removal,ethanolRemovedPct:null,finalVolumeL:null}];
    const out=evaluateNoloScenario(s,science);
    expect(out.motherBeer.min).toBeCloseTo(fixture.mother.expectedApproxAbv.min,10);
    expect(out.motherBeer.max).toBeCloseTo(fixture.mother.expectedApproxAbv.max,10);
    expect(out.projection.max).toBeNull();expect(out.missing.join(' ')).toContain('volume');
    s.config.operations=[removal,aroma];const ready=evaluateNoloScenario(s,science);
    expect(ready.projection.min).toBeCloseTo(4.788*.04*24/(24+12/1.032/1000),10);
    expect(ready.projection.max).toBeCloseTo((5.229*.06*24+.12*100/science.ethanolDensityGL.value)/(24+12/1.032/1000),10);
    expect(ready.projectionStatus).toBe('within');expect(ready.measuredPackaged).toBe(false);
    expect(ready.packagedAbv.max).not.toBeNull();expect(ready.packagedAbv.max).toBeGreaterThan(.5);
    expect(ready.remainingAbv.max).toBeLessThanOrEqual(ready.packagedAbv.max!);
    expect(ready.requiredRemovalPct!.max).toBeCloseTo(100*(1-.5/5.229),10);
  });
  it('écarte le retrait sur les sept autres procédés et le restaure sans perdre sa position',()=>{
    const s=input();s.config.operations=[removal,aroma];
    for(const process of ['restricted','restored','lowExtract','coldExtraction','coldContact','arrested','dealcoholized','secondRunnings'] as NoloProcess[]){
      const next=changeNoloProcess(s.config,process),out=evaluateNoloScenario({...s,config:next},science);
      expect(out.activeOperations.some(o=>o.kind==='removal')).toBe(process==='dealcoholized');
      expect(changeNoloProcess(next,'dealcoholized').operations).toEqual([removal,aroma]);
    }
    expect(s.config.operations).toEqual([removal,aroma]);
  });
  it('utilise l’arrêt SG ou l’atténuation sans soustraire deux OG indépendantes',()=>{
    const s=input();s.config.process='arrested';s.config.planning={version:1,source:noloPlanningSource,stopSg:r(1.046,1.0465)};
    expect(evaluateNoloScenario(s,science).projection).toMatchObject({min:expect.closeTo(.196875,10),max:expect.closeTo(.2625,10)});
    s.og!.range=r(1.045,1.05);s.config.planning={version:1,source:noloPlanningSource,stopAttenuationPct:r(5,10)};
    const out=evaluateNoloScenario(s,science);
    expect(out.projection.min).toBeCloseTo(.045*.05*131.25,10);expect(out.projection.max).toBeCloseTo(.05*.1*131.25,10);
    s.config.planning.stopAttenuationPct=null;expect(evaluateNoloScenario(s,science).projection.max).toBeNull();
  });
  it('ne compte pas deux fois une masse de composition partielle, même après retrait',()=>{
    const c=aromaAlcoholContribution(aroma,science);
    expect(c.combined.max).toBeCloseTo(.12,12);
    const stripped=aromaAlcoholContribution(aroma,science,r(0));
    expect(stripped.combined.max).toBeCloseTo(.12*Math.max(...Object.values(science.ethanolMaxGPerG).map(p=>p.value)),12);
    expect(aromaAlcoholContribution({...aroma,volumeML:0},science).combined.max).toBe(0);
    expect(aromaAlcoholContribution({...aroma,compositionBound:undefined,sugarG:r(0)},science).combined.max).toBeCloseTo(aroma.volumeML!*science.ethanolDensityGL.value/1000,12);
    expect(()=>aromaAlcoholContribution({...aroma,carrierAbvPct:r(100)},science)).toThrow(/contradictoire/);
  });
  it('inclut support, dilution et resucrage ; invalide une analyse quand l’arrêt change',()=>{
    const s=input();s.config.operations=[{...aroma,compositionBound:undefined,carrierAbvPct:r(50),sugarG:r(0)},removal,{id:'water',kind:'dilution',name:'Eau',volumeL:6}];
    const before=evaluateNoloScenario(s,science);expect(before.projection.max).toBeLessThan(.4);
    s.config.operations.push({id:'prime',kind:'sugar',name:'Sucre',sugarsG:{sucrose:r(200)},complete:true,volumeL:0});
    expect(evaluateNoloScenario(s,science).projection.max).toBeGreaterThan(.5);
    s.config.measurements=[{id:'assay',stage:'packaged',date:'2026-09-09',method:'laboratoire',abvPct:r(.38,.42),afterOperationId:'prime',basis:noloScenarioBasis(s,'prime')}];
    expect(evaluateNoloScenario(s,science).projection).toMatchObject({min:.38,max:.42,kind:'measurement'});
    s.config.planning={version:1,source:noloPlanningSource,stopSg:r(1.04)};
    expect(evaluateNoloScenario(s,science).measuredPackaged).toBe(false);
    expect(s.config.measurements).toHaveLength(1);
  });
  it('une entrée numérique invalide ne produit jamais NaN ni un intervalle inversé',()=>{
    const s=input();s.volumeL=Infinity;
    expect(evaluateNoloScenario(s,science).projection.max).toBeNull();
    s.volumeL=24;s.og!.range={min:NaN,max:Infinity};
    const result=evaluateNoloScenario(s,science);
    expect(result.projection).toMatchObject({min:0,max:null});
    expect(result.missing.some(m=>m.includes('Densité initiale invalide'))).toBe(true);
  });
});
describe('Arômes NOLO par étape et ancien résultat rejouable',()=>{
  const normal={volumeL:24,yeastId:testHopTriplet.yeastId,fermentation:[],additions:[{id:'hop',name:'Cascade',triplet:testHopTriplet}]};
  it('garde le profil utile en amont et exige des hypothèses par axe en aval',()=>{
    const data=testHopData(),base=predictHopRecipe(normal,{},data);
    const mother=predictHopRecipe({...normal,aromaDomain:'nolo',aromaContext:{stage:'mother'}},{},data);
    expect(mother.overall.profile).toEqual(base.overall.profile);
    const after=predictHopRecipe({...normal,aromaDomain:'nolo',aromaContext:{stage:'packaged'}},{},data);
    expect(Object.values(after.overall.profile).every(e=>e.range===null)).toBe(true);
    const axis=Object.keys(base.overall.profile).find(k=>base.overall.profile[k].range)!;
    const projected=predictHopRecipe({...normal,aromaDomain:'nolo',aromaContext:{stage:'packaged',transfer:{axes:{[axis]:r(.3,.7)},source:noloPlanningSource}}},{},data);
    expect(projected.overall.profile[axis].range).toEqual({min:base.overall.profile[axis].range!.min*.3,max:base.overall.profile[axis].range!.max*.7});
    expect(projected.overall.profile[axis].central).toBeUndefined();
    const context={stage:'packaged' as const,transfer:{axes:{[axis]:r(.3,.7)},source:noloPlanningSource}};
    const snapshot=captureHopRecipePrediction({...normal,aromaDomain:'nolo',aromaContext:context},{},data,{id:'qa-nolo-v5',name:'QA v5',createdAt:'2026-09-09T10:00:00Z'});
    expect(()=>assertHopPredictionSnapshot(JSON.parse(JSON.stringify(snapshot)))).not.toThrow();
    expect(()=>predictHopRecipe({...normal,aromaDomain:'nolo',aromaContext:context},{},data,'hop-recipe-experimental-v4')).toThrow(/version 5/);
    expect(()=>predictHopRecipe({...normal,aromaDomain:'nolo',aromaContext:{...context,transfer:{...context.transfer,source:{...noloPlanningSource,author:''}}}},{},data)).toThrow();
    const old=predictHopRecipe({...normal,aromaDomain:'nolo'},{},data,'hop-recipe-experimental-v4');
    expect(Object.values(old.overall.profile).every(e=>e.range===null)).toBe(true);
  });
});
