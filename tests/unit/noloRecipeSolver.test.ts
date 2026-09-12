import {describe,it,expect} from 'vitest';
import {assertNoloConfig,type NoloScience,type NoloStrain,type NoloProcess} from '../../functions/src/noloSchema';
import {evaluateNoloScenario,changeNoloProcess} from '../../functions/src/noloScenario';
import {matchingNoloSimulation,noloSimulationBasis} from '../../functions/src/noloSimulation';
import {prepareNoloRecipe,adjustNoloRecipe,applyNoloRecipeProposal,noloRecipeProposalBasis} from '../../src/domain/noloRecipeSolver';
import {newNoloConfig,evaluateNoloRecipe,noloScenarioInput} from '../../src/domain/nolo';
import {BrewingMath} from '../../src/services/brewingMath';
import pack from '../../src/data/noloScenarioBootstrap.json';
import {fullRecipe} from '../fixtures/fullRecipe';
import type {Recipe} from '../../src/types';
import {fruty} from '../fixtures/fruty';
import {noloYeastCandidates} from '../../src/domain/noloYeastSelection';
import {ingredientGaps} from '../../src/domain/ingredientFacts';
import {readIngredientFermentationFacts} from '../../functions/src/ingredientFermentationFacts';
const science=pack[0] as NoloScience;
const r=(min:number,max=min)=>({min,max});
const specialist=science.strains[0];
const conventional:NoloStrain={...specialist,yeastId:'lalbrew-windsor',name:'LalBrew Windsor',attenuationPct:r(65,72),temperatureC:r(15,25),durationDays:r(3,5),pitchGL:r(.5,1),pof:'negative',sugars:{glucose:'yes',fructose:'yes',sucrose:'yes',maltose:'yes',maltotriose:'no'}};
function recipe():Recipe{return {...structuredClone(fullRecipe),volumeL:24,efficiencyPct:75,brewhouse:undefined,waterPlan:undefined,nolo:newNoloConfig(),
  totalGristKg:4.5,fermentables:[{name:'Pils',kind:'grain',use:'empatage',weightKg:4,potentialPpg:37,pct:88.888888},
    {name:'Cara',kind:'grain',use:'empatage',weightKg:.5,potentialPpg:32,pct:11.111111}],
  yeast:{name:'LalBrew Windsor',hopIndexId:conventional.yeastId,form:'sèche',qty:18,unit:'g'},
  fermentation:[{kind:'primaire',name:'Primaire',tempC:20,days:7}],hops:[],mash:{steps:[{name:'Conversion',tempC:68,durationMin:60}],ratioLPerKg:4.2}};}
const processes:NoloProcess[]=['restricted','restored','lowExtract','coldExtraction','coldContact','arrested','dealcoholized','secondRunnings'];

describe('Préparer une recette NOLO comme une consigne de traitement',()=>{
  it.each(processes)('prépare la candidate réelle du catalogue pour %s sans inventer une année de source',process=>{
    const source=fruty(true);source.nolo!.process=process;
    const candidate=noloYeastCandidates(source,science)[0];
    const p=prepareNoloRecipe(source,science,candidate.strain);
    expect(p.blocking).toEqual([]);expect(p.result?.simulationActive).toBe(true);
    expect(p.recipe.nolo!.scienceSnapshot!.strains.find(s=>s.yeastId===candidate.strain.yeastId)!.source).toEqual(candidate.strain.source);
    if(p.recipe.nolo!.planning!.simulation!.attenuationSource==='manufacturer')expect(p.recipe.nolo!.planning!.simulation!.attenuationReference.year).toBe(candidate.strain.source.year);
  });
  it.each(processes)('préremplit un plan et une plage exploitable pour %s',process=>{
    const source=recipe(),before=structuredClone(source);
    const p=prepareNoloRecipe(source,science,['restricted','restored'].includes(process)?specialist:conventional,{process});
    expect(p.blocking).toEqual([]);
    expect(p.result?.simulationActive).toBe(true);
    expect(p.result!.projection.max).not.toBeNull();
    expect(p.result!.projection.max!).toBeLessThanOrEqual(.5+1e-8);
    expect(p.result!.projection.min).toBeGreaterThanOrEqual(0);
    expect(p.result!.projection.max!).toBeGreaterThan(p.result!.projection.min);
    expect(p.recipe.yeast.qty).toBeGreaterThan(0);
    expect(p.recipe.fermentation![0].tempC).toBe(p.settings.fermentationTempC);
    expect(p.recipe.fermentation![0].days).toBeGreaterThan(0);
    expect(p.recipe.nolo!.measurements).toEqual(source.nolo!.measurements);
    expect(p.recipe.nolo!.wort).toEqual(source.nolo!.wort);
    expect(source).toEqual(before);
    expect(()=>assertNoloConfig(p.recipe.nolo)).not.toThrow();
    if(process==='secondRunnings'){
      expect(p.recipe.fermentables).toEqual(source.fermentables);
      expect(p.recipe.nolo!.secondRunnings!.sg).toBeNull();expect(p.recipe.nolo!.secondRunnings!.recoveredL).toBeNull();
    }else{
      const points=BrewingMath.extractPoints(p.recipe.fermentables,p.recipe.volumeL,p.settings.efficiencyPct,'full')!;
      expect(p.recipe.ogTarget).toBeCloseTo(1+points.total/1000,12);
      expect(p.recipe.fermentables[0].weightKg/p.recipe.fermentables[1].weightKg).toBeCloseTo(8,10);
    }
  });

  it('résout la borne supérieure depuis la cible puis conserve le grain lors des réglages',()=>{
    const p=prepareNoloRecipe(recipe(),science,conventional,{process:'lowExtract',reserveAbvPct:.08});
    expect(p.result!.projection.max!).toBeCloseTo(.42,8);
    const wider=adjustNoloRecipe(p,{attenuationPct:r(65,85)},science);
    expect(wider.recipe.fermentables).toEqual(p.recipe.fermentables);
    expect(wider.result!.projection.max!).toBeGreaterThan(p.result!.projection.max!);
    const more=adjustNoloRecipe(p,{grainScale:p.settings.grainScale*1.25},science);
    expect(more.result!.projection.max!).toBeCloseTo(p.result!.projection.max!*1.25,9);
    const og=adjustNoloRecipe(p,{ogSg:p.settings.ogSg+.001},science);
    expect(og.recipe.ogTarget).toBeCloseTo(p.settings.ogSg+.001,12);
    expect(og.recipe.fermentables[0].weightKg).toBeGreaterThan(p.recipe.fermentables[0].weightKg);
    const efficiency=adjustNoloRecipe(p,{efficiencyPct:85},science);
    expect(efficiency.recipe.fermentables).toEqual(p.recipe.fermentables);
    expect(efficiency.result!.projection.max!).toBeGreaterThan(p.result!.projection.max!);
    const tolerance=adjustNoloRecipe(p,{extractTolerancePct:20},science);
    expect(tolerance.result!.projection.min).toBeLessThan(p.result!.projection.min);
    expect(tolerance.result!.projection.max!).toBeGreaterThan(p.result!.projection.max!);
  });
  it('ne crée pas une loi alcool–température–heures en modifiant le calendrier',()=>{
    const p=prepareNoloRecipe(recipe(),science,conventional,{process:'coldContact'});
    const edited=adjustNoloRecipe(p,{contactHours:72,fermentationTempC:3,pitchGL:1.2},science);
    expect(edited.recipe.fermentation![0].days).toBe(3);
    expect(edited.recipe.yeast.qty).toBeCloseTo(28.8);
    expect(edited.result!.projection).toEqual(p.result!.projection);
    expect(edited.assumptions.join(' ')).toContain('aucun effet chiffré');
  });
  it('reprend les hypothèses après application et export JSON sans rebaisser la recette',()=>{
    const original=recipe(),p=prepareNoloRecipe(original,science,conventional,{process:'lowExtract'});
    const applied=applyNoloRecipeProposal(original,p);
    const reopened=prepareNoloRecipe(JSON.parse(JSON.stringify(applied)),science,conventional);
    expect(reopened.blocking).toEqual([]);
    expect(reopened.recipe.fermentables).toEqual(applied.fermentables);
    expect(reopened.settings.grainScale).toBeCloseTo(1,12);
    expect(reopened.result!.projection).toEqual(p.result!.projection);
    expect(evaluateNoloRecipe(applied)!.projection).toEqual(p.result!.projection);
  });
  it('respecte une OG explicite au lieu de résoudre de nouveau la consigne',()=>{
    const p=prepareNoloRecipe(recipe(),science,conventional,{process:'lowExtract',ogSg:1.03});
    expect(p.recipe.ogTarget).toBe(1.03);
    expect(p.result!.projection.max!).toBeGreaterThan(.5);
    expect(p.warnings.join(' ')).toContain('dépasse');
  });
  it('comptabilise les ajouts tardifs une seule fois et les conserve',()=>{
    const source=recipe();
    const fruit={name:'Purée de fruit',kind:'fruit' as const,use:'fermentation' as const,weightKg:.1,dayOffset:3};
    source.fermentables.push(fruit);
    source.nolo!.operations=[{id:'fruit',name:'Purée',kind:'sugar',sugarsG:{},complete:true,unclassifiedSugarG:r(5),volumeL:.1,recipeAddition:{index:2,basis:JSON.stringify(fruit)}}];
    const p=prepareNoloRecipe(source,science,conventional,{process:'lowExtract',reserveAbvPct:0});
    expect(p.blocking).toEqual([]);expect(p.result!.projection.max!).toBeCloseTo(.5,8);
    expect(p.recipe.fermentables[2]).toEqual(fruit);expect(p.recipe.nolo!.operations).toEqual(source.nolo!.operations);
    const empty=structuredClone(source);empty.nolo!.operations=[];
    expect(prepareNoloRecipe(empty,science,conventional,{process:'lowExtract'}).blocking.join(' ')).toContain('ajouts fermentescibles');
  });
  it('refuse une consigne devenue impossible à cause du resucrage et une composition inconnue',()=>{
    const source=recipe();source.nolo!.operations=[{id:'prime',kind:'sugar',name:'Resucrage',sugarsG:{sucrose:r(240)},complete:true,volumeL:0}];
    const p=prepareNoloRecipe(source,science,conventional,{process:'lowExtract'});
    expect(p.blocking.join(' ')).toContain('empêchent');expect(()=>applyNoloRecipeProposal(source,p)).toThrow();
    source.nolo!.operations=[{id:'aroma',kind:'aroma',name:'Inconnu',volumeML:10,carrierAbvPct:null,sugarG:null,composition:'',moment:''}];
    expect(prepareNoloRecipe(source,science,conventional,{process:'lowExtract'}).blocking.length).toBeGreaterThan(0);
  });
  it('réagit au retrait et donne une chute OG–SG pour l’arrêt sans fabriquer une mesure',()=>{
    const p=prepareNoloRecipe(recipe(),science,conventional,{process:'dealcoholized'});
    const edited=adjustNoloRecipe(p,{removedPct:r(80,82)},science);
    expect(edited.result!.projection.max!).toBeGreaterThan(p.result!.projection.max!);
    const stop=prepareNoloRecipe(recipe(),science,conventional,{process:'arrested'});
    const stronger=adjustNoloRecipe(stop,{stopSg:{min:stop.settings.stopSg!.min-.001,max:stop.settings.stopSg!.max-.001}},science);
    expect(stronger.result!.projection.max!).toBeCloseTo(stop.result!.projection.max!+science.planningModels!.sgAbvFactor.value*.001,9);
    expect(stop.recipe.nolo!.planning!.simulation!.stopDropSg!.max).toBeGreaterThan(0);
    expect(stop.recipe.nolo!.measurements).toEqual([]);
  });
  it('invalide application et modèle sauvegardé si la recette ou le rendement changent',()=>{
    const source=recipe(),p=prepareNoloRecipe(source,science,conventional,{process:'lowExtract'});
    const changed=structuredClone(source);changed.fermentables[0].weightKg+=.2;
    expect(noloRecipeProposalBasis(changed)).not.toBe(p.basis);
    expect(()=>applyNoloRecipeProposal(changed,p)).toThrow('La recette a changé');
    const applied=applyNoloRecipeProposal(source,p);applied.efficiencyPct=95;
    expect(evaluateNoloRecipe(applied)!.simulationActive).toBe(false);
    expect(evaluateNoloRecipe(applied)!.missing.join(' ')).toContain('relancer');
    const switched=changeNoloProcess(p.recipe.nolo!,'arrested');
    expect(switched.planning!.simulation).toBeUndefined();expect(()=>assertNoloConfig(switched)).not.toThrow();
  });
  it.each(['volume','ppg','negative','range','temperature'] as const)('refuse les données impossibles : %s',issue=>{
    const source=recipe();if(issue==='volume')source.volumeL=0;if(issue==='ppg')delete source.fermentables[0].potentialPpg;if(issue==='negative')source.fermentables[0].weightKg=-1;
    const p=prepareNoloRecipe(source,science,conventional,{process:'lowExtract',...(issue==='range'?{attenuationPct:r(90,10)}:{}),...(issue==='temperature'?{fermentationTempC:NaN}:{})});
    expect(p.blocking.length).toBeGreaterThan(0);expect(()=>applyNoloRecipeProposal(source,p)).toThrow();
  });
  it('préserve les analyses et leur contexte historiques',()=>{
    const source=recipe();source.nolo!.measurements=[{id:'old',stage:'wort',sg:1.04,method:'Densimètre',date:'2026-09-01',basis:'historique'}];
    const p=prepareNoloRecipe(source,science,conventional,{process:'lowExtract'});
    expect(p.recipe.nolo!.measurements).toEqual(source.nolo!.measurements);
    expect(p.result!.measuredPackaged).toBe(false);
    expect(p.recipe.nolo!.wort.sugarsGL).toEqual({});
  });
  it('valide les hypothèses importées et ne confond pas source et mesure',()=>{
    const p=prepareNoloRecipe(recipe(),science,{...specialist,attenuationPct:null},{process:'restricted'});
    expect(p.recipe.nolo!.planning!.simulation!.attenuationSource).toBe('pilot');
    expect(p.confidence.level).toBe('pilot');expect(p.confidence.detail).toContain('sans probabilité');
    const invalid=structuredClone(p.recipe.nolo!);invalid.planning!.simulation!.settings.attenuationPct=r(100,101);
    expect(()=>assertNoloConfig(invalid)).toThrow();
  });
  it('répartit à nouveau l’eau et ses sels pour la facture réduite et le matériel réel',()=>{
    const source=fruty(true),p=prepareNoloRecipe(source,science,conventional,{process:'lowExtract'});
    expect(p.blocking).toEqual([]);
    const volumes=BrewingMath.waterVolumes(p.recipe.totalGristKg,p.recipe.volumeL,{...p.recipe.brewhouse,mashRatioLPerKg:p.settings.mashRatioLKg},p.recipe.mash?.spargeType,p.recipe.boilMin,0);
    expect(p.recipe.waterPlan!.mashWaterL).toBe(volumes.mashWaterL);
    expect(p.recipe.waterPlan!.spargeWaterL).toBe(volumes.spargeWaterL);
    expect(p.recipe.waterPlan!.mash).not.toEqual(source.waterPlan!.mash);
    expect(p.recipe.preBoilHotL).toBe(volumes.preBoilHotL);
    const wizard=structuredClone(p.recipe);wizard.mash!.ratioLPerKg=wizard.waterPlan!.mashWaterL/wizard.totalGristKg;
    expect(evaluateNoloRecipe(wizard)!.simulationActive).toBe(true);
    expect(evaluateNoloRecipe(wizard)!.projection).toEqual(p.result!.projection);
  });
  it('retire l’ancienne acidification chaude et le mash-out lors du passage à extraction froide',()=>{
    const source=fruty(true),p=prepareNoloRecipe(source,science,conventional,{process:'coldExtraction'});
    expect(p.recipe.waterPlan!.acid).toBeUndefined();expect(p.recipe.waterPlan!.acidOverride).toBeUndefined();
    expect(p.recipe.mash!.mashoutTempC).toBeUndefined();
    expect(p.recipe.mash!.steps).toHaveLength(1);expect(p.recipe.mash!.steps[0].tempC).toBe(p.settings.extractionTempC);
    expect(source.waterPlan!.acid).toBeDefined();expect(source.mash!.mashoutTempC).toBe(76);
  });
  it('refuse un volume total avec ajouts supérieur au fermenteur disponible',()=>{
    const source=fruty(true);source.nolo!.operations=[{id:'water',kind:'dilution',name:'Eau',volumeL:2}];
    const p=prepareNoloRecipe(source,science,conventional,{process:'lowExtract'});
    expect(p.blocking.join(' ')).toContain('volume avec les ajouts');
  });
  it('conserve une récupération connue et ne la résout pas comme un rendement de malt neuf',()=>{
    const source=recipe();source.nolo!.secondRunnings={sourceBatchId:'batch',previousExtraction:'Infusion',waterAddedL:20,alkalinityPpm:15,temperatureC:75,minutes:30,recoveredL:18,sg:1.004,ph:5.6};
    const p=prepareNoloRecipe(source,science,conventional,{process:'secondRunnings'});
    expect(p.blocking).toEqual([]);expect(p.settings.ogSg).toBe(1.004);expect(p.settings.recoveredVolumeL).toBe(18);
    expect(p.recipe.volumeL).toBe(18);expect(p.recipe.fermentables).toEqual(source.fermentables);
    expect(p.recipe.nolo!.secondRunnings!.sg).toBe(1.004);expect(p.recipe.nolo!.secondRunnings!.recoveredL).toBe(18);
    expect(p.result!.ogOrigin).toBe('measurement');
  });
  it('prépare une durée pilote classique après une fermentation limitée courte',()=>{
    const source=recipe();source.fermentation![0].days=2;source.nolo!.process='restricted';
    const p=prepareNoloRecipe(source,science,{...conventional,durationDays:null},{process:'lowExtract'});
    expect(p.settings.fermentationDays).toBe(7);
  });
  it('présente le comparatif en français et distingue une température absente d’un zéro',()=>{
    const source=recipe();source.ogTarget=1.03456;source.yeast.qty=1.5;source.yeast.unit='sachet';delete source.yeast.pitchTempC;
    const p=prepareNoloRecipe(source,science,conventional,{process:'arrested'});
    const changes=new Map(p.changes.map(c=>[c.label,c]));
    expect(changes.get('Procédé')).toMatchObject({before:'Fermentation limitée',after:'Fermentation interrompue'});
    expect(changes.get('OG prévue')!.before).toBe('1,0346');
    expect(changes.get('OG prévue')!.after).toMatch(/^1,\d{4}$/);
    expect(changes.get('SG d’arrêt indicative')!.before).toBe('À renseigner');
    expect(changes.get('SG d’arrêt indicative')!.after).toMatch(/^1,\d{4}–1,\d{4}$/);
    expect(changes.get('Ensemencement')!.before).toBe('1,5 sachet · À renseigner');
    expect(changes.get('Ensemencement')!.before).not.toContain('0 °C');
    source.yeast.pitchTempC=0;
    const known=prepareNoloRecipe(source,science,conventional,{process:'arrested'});
    expect(known.changes.find(c=>c.label==='Ensemencement')!.before).toBe('1,5 sachet · 0 °C');
  });
  it('joint les références documentaires Windsor à la recette appliquée sans faux manque de levure',()=>{
    const source=fruty(true);source.nolo!.process='lowExtract';
    const strain=noloYeastCandidates(source,science).find(c=>c.strain.yeastId==='lalbrew-windsor')!.strain;
    const p=prepareNoloRecipe(source,science,strain),applied=applyNoloRecipeProposal(source,p);
    const facts=readIngredientFermentationFacts(applied.yeast.fermentationFacts)!;
    expect(facts).toBeDefined();expect(facts.source).toEqual(strain.source);expect(facts.retrievedAt).toBe('2026-09-12');
    expect(facts.sugars.maltotriose).toBe('no');expect(facts.pitchGL).toEqual(strain.pitchGL);expect(facts.temperatureC).toEqual(strain.temperatureC);
    expect(applied.yeast.lab).toBe('Lallemand Brewing');
    const yeastGaps=ingredientGaps(applied.fermentables,applied.hops,applied.yeast,true).filter(g=>g.kind==='levure').flatMap(g=>g.missing);
    expect(yeastGaps).not.toContain('assimilation NOLO et ensemencement');expect(yeastGaps).not.toContain('laboratoire');
  });
  it('sépare la fiche de levure classique des températures, doses et durées du contact froid',()=>{
    const source=fruty(true);source.nolo!.process='coldContact';
    const strain=noloYeastCandidates(source,science)[0].strain;
    const p=prepareNoloRecipe(source,science,strain,{fermentationTempC:1,pitchGL:2.5,contactHours:72});
    const facts=p.recipe.yeast.fermentationFacts!;
    expect(facts.source).toEqual(strain.source);expect(facts.temperatureC).toEqual(strain.temperatureC);
    expect(facts.pitchGL).toEqual(strain.pitchGL??undefined);expect(facts.durationDays).toEqual(strain.durationDays??undefined);
    expect(facts.temperatureC!.min).toBeGreaterThan(p.settings.fermentationTempC);
    expect(p.recipe.yeast.qty).toBe(60);expect(p.recipe.fermentation![0].days).toBe(3);
    expect(p.recipe.nolo!.planning!.simulation!.attenuationSource).toBe('pilot');
    expect(facts.conditions).toContain('les réglages du pilote');
    for(const [sugar,ability] of Object.entries(strain.sugars))if(ability==='unknown')expect(facts.sugars).not.toHaveProperty(sugar);
  });
  it('n’utilise pas l’auteur d’une étude comme laboratoire et ne crée pas de fiche avec des hypothèses seules',()=>{
    const source=recipe();source.yeast.lab='Ancien laboratoire';
    const strain:NoloStrain={...conventional,yeastId:'research-strain',source:{...conventional.source,kind:'research',author:'Chercheurs de l’étude'}};
    const p=prepareNoloRecipe(source,science,strain,{process:'lowExtract'});
    expect(p.recipe.yeast.lab).toBeUndefined();expect(p.recipe.yeast.fermentationFacts!.source.author).toBe('Chercheurs de l’étude');
    source.yeast.hopIndexId=strain.yeastId;
    expect(prepareNoloRecipe(source,science,strain,{process:'lowExtract'}).recipe.yeast.lab).toBe('Ancien laboratoire');
    const unknown:NoloStrain={...strain,source:{...strain.source,kind:'judgment'},sugars:{glucose:'unknown',fructose:'unknown',sucrose:'unknown',maltose:'unknown',maltotriose:'unknown'},
      pof:'unknown',hydrolysis:'unknown',pitchGL:null,temperatureC:null,durationDays:null};
    expect(prepareNoloRecipe(source,science,unknown,{process:'lowExtract'}).recipe.yeast.fermentationFacts).toBeUndefined();
  });
});
