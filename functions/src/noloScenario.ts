import {validHopRange, type HopRange, type HopSource} from './hopIndexSchema.js';
import { NOLO_SUGARS, type NoloConfig, type NoloOperation, type NoloProcess, type NoloScience } from './noloSchema.js';
import { evaluateNolo, noloInputBasis, type NoloInput, type NoloBound } from './noloCore.js';

export const NOLO_SCENARIO_VERSION = 'nolo-scenario-v2';
export interface NoloScenarioInput extends NoloInput {
  og?: { range: HopRange; origin: 'calculated' | 'measurement'; source: HopSource };
  fullFermentation?: { range: HopRange; temperatureC?: HopRange; source: HopSource };
}
const empty = (): HopRange => ({min:0,max:0});
const unknown = (): NoloBound => ({min:0,max:null,kind:'unknown',confidence:'low'});
const bound = (r: HopRange, kind: NoloBound['kind']='experimental'): NoloBound => ({...r,kind,confidence:'low'});
const plus = (a:NoloBound,b:NoloBound):NoloBound => ({...a,min:a.min+b.min,max:a.max===null||b.max===null?null:a.max+b.max});
const times = (a:NoloBound,k:number):NoloBound => ({...a,min:a.min*k,max:a.max===null?null:a.max*k});
const status = (b:NoloBound,target:number) => b.min>target?'exceeds' as const:b.max!==null&&b.max<=target?'within' as const:'indeterminate' as const;
export function noloScenarioBasis(input:NoloInput,afterOperationId?:string) {
  return JSON.stringify([NOLO_SCENARIO_VERSION,noloInputBasis(input,afterOperationId),
    input.config.planning?.stopSg??null,input.config.planning?.stopAttenuationPct??null]);
}

/** Process changes are reversible and retain the original operation order. */
export function changeNoloProcess(config:NoloConfig,process:NoloProcess):NoloConfig {
  const inactive=[...(config.inactiveOperations??[])];
  const operations=config.operations.filter((operation,index)=>{
    if(operation.kind!=='removal'||process==='dealcoholized')return true;
    if(!inactive.some(p=>p.operation.id===operation.id))inactive.push({process:'dealcoholized',index,operation});
    return false;
  });
  const restored=inactive.filter(p=>p.process===process);
  for(const p of restored.sort((a,b)=>a.index-b.index))
    if(!operations.some(o=>o.id===p.operation.id))operations.splice(Math.min(p.index,operations.length),0,p.operation);
  return {...config,process,operations,inactiveOperations:inactive.filter(p=>p.process!==process)};
}
export function scenarioPlato(sg:number,science:NoloScience):number|null {
  const coefficients=science.planningModels?.sgPlatoCoefficients;
  return coefficients&&Number.isFinite(sg)&&sg>=1
    ? Math.max(0,coefficients.reduce((sum,c,i)=>sum+c.value*sg**i,0)):null;
}
/** Finite known material stays finite. Unknown ethanol and sugar share the SAME
 * unclassified mass; maximising both separately would count the material twice. */
export function aromaAlcoholContribution(o:Extract<NoloOperation,{kind:'aroma'}>,science:NoloScience,retained:HopRange={min:1,max:1}) {
  const density=science.ethanolDensityGL.value, yieldMax=Math.max(...Object.values(science.ethanolMaxGPerG).map(p=>p.value));
  if(o.volumeML===0)return {present:bound(empty(),'physical'),potential:bound(empty(),'physical'),combined:bound(empty(),'physical')};
  const present=o.carrierAbvPct&&o.volumeML!==null
    ? bound({min:o.carrierAbvPct.min*o.volumeML*density/100000,max:o.carrierAbvPct.max*o.volumeML*density/100000},'physical')
    : o.volumeML!==null?bound({min:0,max:o.volumeML*density/1000},'physical'):unknown();
  const potential=o.sugarG?bound({min:0,max:o.sugarG.max*yieldMax},'physical'):unknown();
  let combined=plus({...present,min:present.min*retained.min,max:present.max===null?null:present.max*retained.max},potential);
  if(o.compositionBound) {
    const available=o.compositionBound.massG*(1-o.compositionBound.inertMassPct.min/100);
    if(present.min+(o.sugarG?.min??0)>available+1e-9)throw Error('Composition contradictoire : alcool et sucres excèdent la masse disponible.');
    present.max=Math.min(present.max??Infinity,available);
    potential.max=Math.min(potential.max??Infinity,Math.max(0,available-present.min)*yieldMax);
    // Maximise r*ethanol + yield*sugar over their common material budget.
    // After strong removal, sugar may be the limiting branch instead of ethanol.
    let e:number,s:number;
    if(retained.max>=yieldMax) {
      e=Math.min(present.max,Math.max(0,available-(o.sugarG?.min??0)));
      s=Math.min(o.sugarG?.max??Infinity,Math.max(0,available-e));
    } else {
      s=Math.min(o.sugarG?.max??Infinity,Math.max(0,available-present.min));
      e=Math.min(present.max,Math.max(0,available-s));
    }
    combined={...present,min:present.min*retained.min,max:e*retained.max+s*yieldMax};
  }
  return {present:{...present,min:present.min*retained.min,max:present.max===null?null:present.max*retained.max},potential,combined};
}

/** v1 is kept intact in noloCore for historical replay. This projection never
 * overwrites measured fields and does not equate attenuation with a sugar assay. */
export function evaluateNoloScenario(original:NoloScenarioInput,currentScience:NoloScience) {
  const config=changeNoloProcess(original.config,original.config.process);
  const input={...original,config};
  const science=config.scienceSnapshot??currentScience;
  const compatible=(m:NoloConfig['measurements'][number])=>
    (!m.afterOperationId||config.operations.some(o=>o.id===m.afterOperationId))&&
    (m.basis===noloScenarioBasis(input,m.afterOperationId)||
      !config.planning?.stopSg&&!config.planning?.stopAttenuationPct&&m.basis===noloInputBasis(input,m.afterOperationId));
  const verification=evaluateNolo({...input,config:{...config,measurements:config.measurements.map(m=>compatible(m)?{...m,basis:noloInputBasis(input,m.afterOperationId)}:{...m,basis:'stale-scenario'})}},science);
  const sources:HopSource[]=[], assumptions:string[]=[], missing:string[]=[];
  const models=science.planningModels, og=validHopRange(input.og?.range)&&input.og!.range.min>=1?input.og!.range:undefined;
  if(input.og&&!og)missing.push('Densité initiale invalide : renseigner une SG finie supérieure ou égale à 1.');
  const motherRef=input.fullFermentation??models?.mothers.find(m=>m.yeastId===input.yeastId);
  const attenuation=motherRef&&('range'in motherRef?motherRef.range:motherRef.attenuationPct);
  const phases=input.fermentation.filter(p=>p.kind==='primaire');
  const temperaturesValid=!motherRef?.temperatureC||phases.length>0&&phases.every(p=>p.tempC!==undefined&&p.tempC>=motherRef.temperatureC!.min&&p.tempC<=motherRef.temperatureC!.max);
  let mother=unknown(), base=unknown(), finalGravity:HopRange|null=null;
  if(og&&models&&attenuation&&temperaturesValid) {
    mother=bound({min:(og.min-1)*attenuation.min/100*models.sgAbvFactor.value,max:(og.max-1)*attenuation.max/100*models.sgAbvFactor.value});
    sources.push(motherRef!.source,models.sgAbvFactor.source);
    assumptions.push('Bière mère : fermentation complète à l’atténuation documentaire de la souche. Le moût réel peut différer ; cette plage n’est pas une marge statistique.');
  }
  let plato=config.wort.ogPlato;
  if(!plato&&og) {
    const min=scenarioPlato(og.min,science),max=scenarioPlato(og.max,science);
    if(min!==null&&max!==null)plato={min,max};
  }
  const relation=evaluateNolo({...input,config:{...config,wort:{...config.wort,ogPlato:plato}}},science).manufacturerEstimate;
  if(config.process==='dealcoholized')base=mother;
  else if(config.process==='arrested') {
    const stop=config.planning?.stopSg, at=config.planning?.stopAttenuationPct;
    if(og&&models&&(stop||at)) {
      if(stop) {
        if(stop.max>og.min||stop.min<1)missing.push('La densité d’arrêt doit être comprise entre 1 et la borne basse de l’OG.');
        else {base=bound({min:(og.min-stop.max)*models.sgAbvFactor.value,max:(og.max-stop.min)*models.sgAbvFactor.value});finalGravity=stop;}
      } else if(at) {
        // OG is shared: use the gravity DROP, not independent OG and FG ranges.
        base=bound({min:(og.min-1)*at.min/100*models.sgAbvFactor.value,max:(og.max-1)*at.max/100*models.sgAbvFactor.value});
        finalGravity={min:1+(og.min-1)*(1-at.max/100),max:1+(og.max-1)*(1-at.min/100)};
      }
      assumptions.push('Arrêt à la densité envisagée ; durée et refroidissement seuls ne garantissent ni l’arrêt biologique ni la stabilité.');
      sources.push(config.planning!.source,models.sgAbvFactor.source);
    } else missing.push('Renseigner une densité ou une atténuation d’arrêt envisagée.');
  } else if(relation?.applicable) {
    base=bound(relation.range);sources.push(relation.source);
    assumptions.push(relation.limitation);
  } else if(['lowExtract','coldExtraction','secondRunnings'].includes(config.process)&&attenuation) {
    base=mother;
  } else missing.push(relation?'Le moût ou les paliers diffèrent du protocole LA-01 de cette édition.':'Relation de fermentation limitée absente pour cette souche et ce procédé.');
  if(input.og)assumptions.push(input.og.origin==='measurement'?'OG mesurée dans ce contexte.':'OG calculée depuis les ingrédients ; aucune analyse de sucres n’est déduite.');
  if(!temperaturesValid)missing.push('Température primaire hors plage de la souche ou non renseignée.');
  let volume=Number.isFinite(input.volumeL)&&input.volumeL>0?input.volumeL:null;
  const density=science.ethanolDensityGL.value;
  let ethanol=volume?times(base,volume*density/100):unknown();
  // Total extract is NOT glucose. It only caps the mass available to any pathway.
  // Reserve all of it for later conversion when no assay identifies partitioning;
  // a removal operation cannot remove sugar that has not fermented yet.
  const extractCap=volume&&og&&plato
    ? volume*og.max*1000*plato.max/100*Math.max(...Object.values(science.ethanolMaxGPerG).map(p=>p.value)):null;
  let physicalAddedEthanol=bound(empty(),'physical');
  let extra=bound(empty(),'physical');
  const aromas:{operation:Extract<NoloOperation,{kind:'aroma'}>;retained:HopRange}[]=[];
  const total=()=>aromas.reduce((sum,a)=>plus(sum,aromaAlcoholContribution(a.operation,science,a.retained).combined),plus(ethanol,extra));
  // The verified stage is a new anchor. Operations already included are skipped.
  const assays=config.measurements.filter(m=>m.abvPct&&['primary','packaged'].includes(m.stage)&&/^\d{4}-\d{2}-\d{2}/.test(m.date)&&m.method.trim()&&compatible(m))
    .sort((a,b)=>a.date.localeCompare(b.date));
  const assay=assays.at(-1);
  const start=assay?.afterOperationId?config.operations.findIndex(o=>o.id===assay.afterOperationId)+1:0;
  if(assay?.abvPct) {
    for(const o of config.operations.slice(0,start)) {
      const added=o.kind==='aroma'?(o.volumeML===null?null:o.volumeML/1000):'volumeL'in o?o.volumeL:null;
      volume=o.kind==='removal'?o.finalVolumeL:volume===null||added===null?null:volume+added;
    }
    volume=assay.volumeL??volume;
    ethanol=volume?times({...assay.abvPct,kind:'measurement',confidence:assay.abvPct.min===assay.abvPct.max?'low':'medium'},volume*density/100):unknown();
    base={...assay.abvPct,kind:'measurement',confidence:'medium'};
  }
  const stages:{id:string;label:string;abv:NoloBound}[]=[{id:'primary',label:config.process==='arrested'?'À l’arrêt envisagé':'Avant traitement',abv:base}];
  let requiredRemovalPct:HopRange|null=null;
  const sugarPotential=(o:Extract<NoloOperation,{kind:'sugar'}>):NoloBound=>{
    let max=0;
    for(const s of NOLO_SUGARS) {
      const r=o.sugarsG[s];
      if(!r&&(!o.complete||s in o.sugarsG))return unknown();
      if(r)max+=r.max*science.ethanolMaxGPerG[s].value;
    }
    if(o.unclassifiedSugarG===null)return unknown();
    max+=(o.unclassifiedSugarG?.max??0)*Math.max(...Object.values(science.ethanolMaxGPerG).map(p=>p.value));
    return bound({min:0,max},'physical');
  };
  for(const o of config.operations.slice(start)) {
    if(o.kind==='removal') {
      const present=aromas.reduce((sum,a)=>plus(sum,aromaAlcoholContribution(a.operation,science,a.retained).present),ethanol);
      if(volume&&o.finalVolumeL&&present.max!==null&&present.min>0) {
        // Necessary for CURRENT ethanol only. Later sugar/alcohol is not hidden.
        const allowed=config.targetAbvPct*o.finalVolumeL*density/100;
        requiredRemovalPct={min:Math.max(0,100*(1-allowed/present.min)),max:Math.max(0,100*(1-allowed/present.max))};
      }
      if(o.ethanolRemovedPct&&o.source.trim())ethanol={...ethanol,min:ethanol.min*(1-o.ethanolRemovedPct.max/100),max:ethanol.max===null?null:ethanol.max*(1-o.ethanolRemovedPct.min/100)};
      else {ethanol={...ethanol,min:0};missing.push('Renseigner le retrait d’alcool supposé ; le retrait nécessaire est un objectif, pas une mesure.');}
      volume=o.finalVolumeL;
      physicalAddedEthanol={...physicalAddedEthanol,min:0,max:physicalAddedEthanol.max===null?null:physicalAddedEthanol.max*(o.ethanolRemovedPct&&o.source.trim()?1-o.ethanolRemovedPct.min/100:1)};
      for(const a of aromas) {
        a.retained.min*=o.ethanolRemovedPct&&o.source.trim()?1-o.ethanolRemovedPct.max/100:0;
        a.retained.max*=o.ethanolRemovedPct&&o.source.trim()?1-o.ethanolRemovedPct.min/100:1;
      }
      if(!volume)missing.push('Renseigner le volume prévu après désalcoolisation.');
      assumptions.push('Retrait appliqué à l’alcool présent ; les sucres encore fermentescibles ne sont pas retirés automatiquement.');
    } else {
      const added=o.kind==='aroma'?(o.volumeML===null?null:o.volumeML/1000):o.volumeL;
      if(o.kind==='aroma') {
        aromas.push({operation:o,retained:{min:1,max:1}});
        if(o.compositionBound)sources.push(o.compositionBound.source);
      } else if(o.kind==='sugar')extra=plus(extra,sugarPotential(o));
      else if(o.kind==='blend') {
        const contribution=o.volumeL===0?bound(empty()):o.volumeL!==null&&o.abvPct?times(bound(o.abvPct),o.volumeL*density/100):unknown();
        ethanol=plus(ethanol,contribution);physicalAddedEthanol=plus(physicalAddedEthanol,contribution);
        extra=plus(extra,o.volumeL===0?bound(empty()):o.remainingSugarG?bound({min:0,max:o.remainingSugarG.max*Math.max(...Object.values(science.ethanolMaxGPerG).map(p=>p.value))}):unknown());
      }
      volume=volume===null||added===null?null:volume+added;
    }
    stages.push({id:o.id,label:o.name||o.kind,abv:volume?times(total(),100/density/volume):unknown()});
  }
  let projection=volume?times(total(),100/density/volume):unknown();
  if(assay?.abvPct&&start===config.operations.length)projection={...assay.abvPct,kind:'measurement',confidence:verification.presentAbv.confidence};
  if(input.untrackedFermentationAdditions&&!assay) {projection=unknown();missing.push('Comptabiliser les ajouts fermentescibles de la recette dans le bilan.');}
  if(!assay||start!==config.operations.length)assumptions.push('Projection sous maintien de l’arrêt ou de la fin de fermentation, sans contamination ni reprise sur les sucres résiduels. Analyse après conditionnement requise.');
  if(input.dryHop)assumptions.push('Houblonnage à cru : reprise enzymatique possible, non incluse dans la projection conditionnelle.');
  if(!assay&&extractCap!==null&&volume&&!input.untrackedFermentationAdditions) {
    const physicalTotal=aromas.reduce((sum,a)=>plus(sum,aromaAlcoholContribution(a.operation,science,a.retained).combined),
      plus(bound({min:0,max:extractCap},'physical'),plus(extra,physicalAddedEthanol)));
    const cap=times(physicalTotal,100/density/volume);
    if(cap.max!==null&&cap.max<verification.packagedAbv.min)missing.push('Extrait et alcool ou sucres renseignés se contredisent : vérifier les analyses et leurs étapes.');
    else if(cap.max!==null&&(verification.packagedAbv.max===null||cap.max<verification.packagedAbv.max)) {
      verification.packagedAbv={...cap,min:verification.packagedAbv.min,kind:'physical'};
      verification.remainingAbv={...verification.remainingAbv,max:Math.min(verification.remainingAbv.max??Infinity,Math.max(0,cap.max-verification.presentAbv.min)),kind:'physical'};
      verification.status=status(verification.packagedAbv,config.targetAbvPct);
      assumptions.push('Plafond physique sur la masse totale d’extrait connue : aucune répartition en glucose, maltose ou autres sucres n’est supposée.');
    }
  }
  return {...verification,scenarioVersion:NOLO_SCENARIO_VERSION,projection,motherBeer:mother,finalGravity,stages,requiredRemovalPct,
    projectionStatus:status(projection,config.targetAbvPct),activeOperations:config.operations,inactiveOperations:config.inactiveOperations??[],
    ogOrigin:input.og?.origin??null,plato,manufacturerEstimate:relation,sources,assumptions,missing,
    nextAction:missing[0]??(verification.measuredPackaged?verification.nextAction:'Analyser l’alcool après conditionnement pour vérifier la projection.')};
}
