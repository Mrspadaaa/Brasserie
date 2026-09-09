import { describe,it,expect } from 'vitest';
import { assertHopKnowledge } from '../../functions/src/hopPredictionSchema';
import { assertNoloConfig, type NoloConfig } from '../../functions/src/noloSchema';
import { evaluateNolo,noloInputBasis,NOLO_ENGINE_VERSION,type NoloInput } from '../../functions/src/noloCore';
import { noloScience,newNoloConfig,noloRecipeForBatch,evaluateNoloRecipe,noloInput } from '../../src/domain/nolo';
import { fullRecipe } from '../fixtures/fullRecipe';
import { readRecipeText,writeRecipeText } from '../../src/domain/recipeTransfer';
import { predictHopRecipe } from '../../functions/src/hopRecipePrediction';
import { testHopData,testHopTriplet } from '../fixtures/hopPrediction';
import { brewingStyles,matchBrewingStyles,resolveBrewingStyle } from '../../src/domain/brewingStyles';
import { fermentProgramForStyle,mashProgramForStyle } from '../../src/domain/brewPrograms';
import { BrewingMath } from '../../src/services/brewingMath';
import { noloRangeLabel } from '../../src/ui/NoloPanel';
import noloPack from '../../src/data/noloBootstrap.json';
import stylePack from '../../src/data/brewingStylesBootstrap.json';
import scientific from '../fixtures/nolo-scientific.json';

const science=noloScience()!;
const r=(min:number,max=min)=>({min,max});
function scenario():NoloInput{return {config:newNoloConfig(),volumeL:24,yeastId:'yeast-fermentis-safbrew-la-01',yeastName:'LA-01',fermentation:[{kind:'primaire',tempC:20,days:2}],mash:scientific.la01.mash,dryHop:false};}
function assay(input:NoloInput,abv=r(.35,.4),stage:'primary'|'packaged'='primary',afterOperationId?:string){
  input.config.measurements.push({id:'measurement-'+input.config.measurements.length,stage,date:'2026-09-09',method:'Laboratoire · méthode faible teneur',abvPct:abv,afterOperationId,basis:noloInputBasis(input,afterOperationId)});
}
describe('Références NOLO et styles',()=>{
  it('valide chaque document sourcé et couvre le catalogue factuel',()=>{
    for(const k of [...noloPack,...stylePack])expect(()=>assertHopKnowledge(k)).not.toThrow();
    expect(brewingStyles().length).toBeGreaterThanOrEqual(293);
    for(const name of ['Dunkelweizen','Weizenbock','Grodziskie','Sahti','Keptinis','Hefeweisse'])expect(matchBrewingStyles(name).length,name).toBeGreaterThan(0);
    expect(mashProgramForStyle('Dunkelweizen').id).toBe('froment');
    expect(fermentProgramForStyle('Weizenbock').id).not.toBe('lager');
    expect(resolveBrewingStyle('ma dunkel aux framboises')).toBeUndefined();
    expect(resolveBrewingStyle('Ordinary Bitter')).toBeUndefined(); // Two editions, explicit choice.
  });
  it('ne remplace pas une connaissance désactivée par le bootstrap',()=>{
    expect(noloScience([{...science,enabled:false}])).toBeUndefined();
  });
  it('refuse les coefficients sans provenance et les mesures invalides',()=>{
    const bad=structuredClone(science);bad.la01.slope.source.year=null;
    expect(()=>assertHopKnowledge(bad)).toThrow();
    const s=scenario();s.config.operations=[{id:'a',kind:'aroma',name:'',volumeML:1,carrierAbvPct:r(-1),sugarG:null,composition:'',moment:''}];
    expect(()=>assertNoloConfig(s.config)).toThrow();
  });
});
describe('Bilan NOLO et incertitude',()=>{
  it('garde une analyse finale exacte même sans volume et conserve les bornes à l’affichage',()=>{
    const s=scenario();s.volumeL=0;assay(s,r(.38,.42),'packaged');
    expect(evaluateNolo(s,science).packagedAbv).toMatchObject({min:.38,max:.42,kind:'measurement'});
    expect(noloRangeLabel(evaluateNolo(s,science).packagedAbv)).toBe('0,38–0,42 % vol.');
  });
  it('garde le style et les données lorsqu’on désactive le NOLO',()=>{
    const recipe={...fullRecipe,nolo:newNoloConfig()};recipe.nolo.wort.sugarsGL={glucose:r(2)};
    recipe.nolo.enabled=false;
    expect(evaluateNoloRecipe(recipe)).toBeNull();
    expect(readRecipeText(writeRecipeText(recipe)).nolo).toEqual(recipe.nolo);
    expect(recipe.style).toBe(fullRecipe.style);
  });
  it('relie un fruit à son bilan de sucres, sans deuxième apport, et détecte sa modification',()=>{
    const recipe={...fullRecipe,hops:[],fermentables:[{name:'Fruit',kind:'fruit' as const,use:'fermentation' as const,weightKg:1}],nolo:newNoloConfig()};
    recipe.nolo.wort.sugarsComplete=true;
    recipe.nolo.operations=[{id:'fruit',kind:'sugar',name:'Fruit',volumeL:1,sugarsG:{glucose:r(10)},complete:true,recipeAddition:{index:0,basis:JSON.stringify(recipe.fermentables[0])}}];
    expect(noloInput(recipe).untrackedFermentationAdditions).toBe(false);
    const once=evaluateNoloRecipe(recipe)!;expect(once.remainingAbv.max).not.toBeNull();
    recipe.fermentables[0].weightKg=2;
    expect(noloInput(recipe).untrackedFermentationAdditions).toBe(true);
    expect(evaluateNoloRecipe(recipe)!.remainingAbv.max).toBeNull();
  });
  it('conserve sucres, mesure, source figée et zéros lors du transfert texte',()=>{
    const nolo=newNoloConfig();nolo.scienceSnapshot=structuredClone(science);
    nolo.wort.sugarsGL={glucose:r(0),maltose:null};nolo.wort.sugarsComplete=false;
    const recipe={...fullRecipe,nolo,fgTarget:null,abvTarget:.5};
    expect(readRecipeText(writeRecipeText(recipe)).nolo).toEqual(nolo);
    expect(readRecipeText(writeRecipeText(recipe)).fgTarget).toBeNull();
  });
  it('ne resserre pas les bornes en divisant le resucrage en lignes',()=>{
    const s=scenario();s.config.wort.sugarsComplete=true;
    s.config.operations=[{id:'s',kind:'sugar',name:'Saccharose',volumeL:0,sugarsG:{sucrose:r(100,120)},complete:true}];
    const one=evaluateNolo(s,science);
    s.config.operations=Array.from({length:20},(_,i)=>({id:String(i),kind:'sugar',name:'Saccharose',volumeL:0,sugarsG:{sucrose:r(5,6)},complete:true}));
    expect(evaluateNolo(s,science).packagedAbv.max).toBeCloseTo(one.packagedAbv.max!,12);
  });
  it('ne confond pas volume d’ajout inconnu et zéro et garde une analyse devenue orpheline',()=>{
    const s=scenario();s.config.wort.sugarsComplete=true;
    s.config.operations=[{id:'w',kind:'dilution',name:'Eau',volumeL:null}];
    expect(evaluateNolo(s,science).packagedAbv.max).toBeNull();
    s.config.operations[0].volumeL=0;assay(s,r(.2,.3),'packaged','w');
    expect(evaluateNolo(s,science).status).toBe('within');
    s.config.operations=[];
    expect(evaluateNolo(s,science).alerts.map(a=>a.code)).toContain('stale-measurement');
    expect(s.config.measurements).toHaveLength(1);
  });
  it('inclut le vrai resucrage du brassin une seule fois, même après un rechargement',()=>{
    const recipe={...fullRecipe,hops:[],fermentables:[],nolo:newNoloConfig(),yeast:{...fullRecipe.yeast,name:'LA-01',hopIndexId:'yeast-fermentis-safbrew-la-01'}};
    const batch={recipeSnapshot:recipe,volumeL:24,carbonation:{method:'priming',sugarG:200}} as any;
    const projected=noloRecipeForBatch(batch)!;
    expect(projected.nolo!.operations).toHaveLength(1);
    projected.nolo!.wort.sugarsComplete=true;
    expect(evaluateNoloRecipe(projected)!.remainingAbv.max).toBeGreaterThan(.5);
    batch.nolo=projected.nolo;
    expect(noloRecipeForBatch(batch)!.nolo!.operations).toHaveLength(1);
  });
  it('écarte le transfert sensoriel alcoolisé sans perdre les quantités introduites, et rejoue v3',()=>{
    const input={volumeL:24,yeastId:testHopTriplet.yeastId,fermentation:[],additions:[{id:'a',name:'Ajout',triplet:testHopTriplet}]};
    const ordinary=predictHopRecipe(input,{},testHopData(),'hop-recipe-experimental-v3');
    const nolo=predictHopRecipe({...input,aromaDomain:'nolo'}, {},testHopData());
    expect(Object.values(nolo.overall.profile).every(v=>v.range===null)).toBe(true);
    expect(nolo.overall.modelRefs).toEqual([]);
    expect(nolo.chemistry.introduced).toEqual(ordinary.chemistry.introduced);
    expect(predictHopRecipe(input,{},testHopData(),'hop-recipe-experimental-v3')).toEqual(ordinary);
    expect(()=>predictHopRecipe({...input,aromaDomain:'nolo'},{},testHopData(),'hop-recipe-experimental-v3')).toThrow();
  });
  it('préserve 15–20 % sans les forcer à 45 % et garde la FG non arrondie',()=>{
    for(const att of [0,15,18,20])expect(BrewingMath.attenuationForMashTemp(att,67)).toBe(att);
    expect(BrewingMath.calculateFg(1.015,15)).toBeCloseTo(1.01275,10);
    expect(BrewingMath.calculateFg(1.015,0)).toBe(1.015);
  });
  it('laisse les sucres partiels indéterminés, même si l’extrait est connu',()=>{
    const s=scenario();s.config.wort.ogPlato=r(6);s.config.wort.sugarsGL={glucose:r(1)};
    const out=evaluateNolo(s,science);
    expect(out.packagedAbv.max).toBeNull();expect(out.status).toBe('indeterminate');
    expect(out.manufacturerEstimate?.range.min).toBeCloseTo(.3964,12);
    expect(out.manufacturerEstimate?.applicable).toBe(true);
  });
  it('fait une borne physique utile lorsque les sucres accessibles sont documentés',()=>{
    const s=scenario();s.config.wort={ogPlato:r(6),sugarsGL:{glucose:r(1,2),fructose:r(0),sucrose:r(0),maltose:r(30)},sugarsComplete:true};
    const out=evaluateNolo(s,science);
    expect(out.packagedAbv.max).toBeGreaterThan(.12);expect(out.packagedAbv.max).toBeLessThan(.14);
    expect(out.packagedAbv.kind).toBe('physical');expect(out.status).toBe('within');
    s.dryHop=true;expect(evaluateNolo(s,science).packagedAbv.max).toBeNull();
  });
  it('garde zéro mesuré distinct d’aucune analyse et ne compte pas le primaire deux fois',()=>{
    const s=scenario();assay(s,r(0),'packaged');
    expect(evaluateNolo(s,science).presentAbv.max).toBe(0);
    s.config.measurements=[];expect(evaluateNolo(s,science).packagedAbv.max).toBeNull();
    assay(s);s.config.operations=[{id:'s',kind:'sugar',name:'Resucrage',sugarsG:{sucrose:r(198)},complete:true,volumeL:0}];
    const out=evaluateNolo(s,science);expect(out.presentAbv.min).toBeCloseTo(.35);
    expect(out.packagedAbv.max).toBeNull(); // Residual sugar not assayed.
  });
  it('mesure au conditionnement puis nouvelle opération : projection et non ancienne analyse finale',()=>{
    const s=scenario();s.config.operations=[{id:'d',kind:'dilution',name:'Eau',volumeL:24}];assay(s,r(.49,.51),'packaged','d');
    let out=evaluateNolo(s,science);expect(out.volumeL).toBe(48);expect(out.measuredPackaged).toBe(true);
    s.config.operations.push({id:'a',kind:'aroma',name:'Support',volumeML:1000,carrierAbvPct:r(40),sugarG:r(0),composition:'éthanol',moment:'après analyse'});
    out=evaluateNolo(s,science);expect(out.presentAbv.min).toBeCloseTo((48*.49+40)/49,10);expect(out.measuredPackaged).toBe(false);expect(out.status).toBe('exceeds');
  });
  it('ajoute support et dilution dans le bon ordre ; un rendement de retrait ne supprime pas les sucres',()=>{
    const s=scenario();s.config.wort.sugarsComplete=true;
    s.config.operations=[{id:'a',kind:'aroma',name:'Support',volumeML:1000,carrierAbvPct:r(40),sugarG:r(0),composition:'',moment:''},{id:'w',kind:'dilution',name:'Eau',volumeL:25}];
    let out=evaluateNolo(s,science);expect(out.presentAbv.min).toBeCloseTo(.8,10);
    s.config.operations.push({id:'r',kind:'removal',name:'Retrait',ethanolRemovedPct:r(90),finalVolumeL:50,source:'Essai mesuré'});
    out=evaluateNolo(s,science);expect(out.presentAbv.min).toBeCloseTo(.08,10);
  });
  it('invalide une analyse lorsqu’on change le moût ou la souche, sans la supprimer',()=>{
    const s=scenario();assay(s);s.yeastId='lalbrew-lona';const out=evaluateNolo(s,science);
    expect(out.presentAbv.kind).not.toBe('measurement');expect(out.alerts.some(a=>a.code==='stale-measurement')).toBe(true);
    expect(s.config.measurements).toHaveLength(1);
  });
  it('ne transfère ni le froid ni les propriétés entre souches d’une espèce',()=>{
    const s=scenario();s.yeastId='disva-254';s.config.process='coldContact';s.fermentation=[{kind:'primaire',tempC:1,days:3}];
    const out=evaluateNolo(s,science);expect(out.strain).toBeNull();expect(out.packagedAbv.max).toBeNull();
    expect(out.aroma.numericalPrediction).toBeNull();
  });
  it('ne valide pas la conservation avec pH 4,2, froid et pasteurisation déclarée',()=>{
    const s=scenario();s.config.measurements=[{id:'p',stage:'packaged',date:'2026-09-09',method:'pH-mètre',ph:4.2,co2Vol:1.5}];
    s.config.stabilization.method='60 PU, stockage à 4 °C';expect(evaluateNolo(s,science).stability.status).toBe('unverified');
  });
  it('fige ses références sans être modifié par la base et conserve les bornes à l’écran',()=>{
    const s=scenario();s.config.scienceSnapshot=structuredClone(science);
    const newer=structuredClone(science);newer.la01.slope.value=99;s.config.wort.ogPlato=r(6);
    expect(evaluateNolo(s,newer).manufacturerEstimate?.range.min).toBeCloseTo(.3964,12);
    expect(evaluateNolo(s,newer).engineVersion).toBe(NOLO_ENGINE_VERSION);
    expect(noloRangeLabel({min:.49999,max:.50001,kind:'physical',confidence:'low'})).toBe('0,499–0,501 % vol.');
  });
});
