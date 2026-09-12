import type { HopRange, HopSource } from '../../functions/src/hopIndexSchema';
import { assertNoloConfig, type NoloScience, type NoloStrain, type NoloSimulationSettings, type NoloSimulation } from '../../functions/src/noloSchema';
import { changeNoloProcess, evaluateNoloScenario } from '../../functions/src/noloScenario';
import { matchingNoloSimulation, noloCanonical, noloSimulationBasis, noloSimulationSource, simulationWortRange } from '../../functions/src/noloSimulation';
import type { TrialRecipe } from './hopIndex/trials';
import { newNoloConfig, noloScenarioInput } from './nolo';
import { BrewingMath } from '../services/brewingMath';
import { recipeIbu } from './hopBitterness';
import { replanRecipeWater } from './recipeWater';
import { noloProcessLabels } from './noloPresentation';
import { ACIDS } from './water/substances';
import { readIngredientFermentationFacts } from '../../functions/src/ingredientFermentationFacts';

export const NOLO_RECIPE_SOLVER_VERSION='nolo-recipe-solver-v1';
export type NoloRecipeSettings=NoloSimulationSettings;
export interface NoloRecipeProposal {
  version: typeof NOLO_RECIPE_SOLVER_VERSION; basis: string; sourceRecipe: TrialRecipe; strain: NoloStrain;
  recipe: TrialRecipe; settings: NoloRecipeSettings; result: ReturnType<typeof evaluateNoloScenario> | null;
  changes: {label:string;before:string;after:string}[]; sources: HopSource[]; assumptions: string[];
  blocking: string[]; warnings: string[];
  confidence: {level:'pilot'|'documented';label:string;detail:string};
}
export const noloRecipeProposalBasis=(recipe:TrialRecipe)=>noloCanonical(recipe);
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const positive=(v:unknown):v is number=>finite(v)&&v>0;
const middle=(r:HopRange)=>(r.min+r.max)/2;
const validRange=(r:HopRange|null|undefined,max=Infinity):r is HopRange=>!!r&&finite(r.min)&&finite(r.max)&&r.min>=0&&r.max>=r.min&&r.max<=max;
const fmt=(n:number,unit='')=>`${n.toLocaleString('fr-FR',{maximumFractionDigits:3})}${unit?' '+unit:''}`;
const unique=(a:string[])=>[...new Set(a)];
const coldSource:HopSource={title:'Production of non-alcoholic beer via cold contact fermentation with Torulaspora delbrueckii',author:'Nikulin et al.',year:2022,kind:'research',reference:'https://doi.org/10.1002/jib.681',locator:'Conduite expérimentale près de 1 °C. Les performances des souches étudiées ne sont pas transférées aux levures commerciales.'};
const extractionSource:HopSource={title:'Cold Extraction of Malt Components and Their Use in Brewing Applications',author:'Briess',year:2020,kind:'manufacturer',reference:'https://brewingwithbriess.com/blog/cold-extraction-of-malt-components-and-their-use-in-brewing-applications/',locator:'Extraction froide de 24 h, séparation des fractions du malt. Aucun rendement universel n’est déduit.'};

/** Copy the reviewed strain reference, never the editable simulation settings.
 * Unknown sugar abilities stay absent; an empty/pilot-only reference must not
 * silence the ingredient-completeness diagnostic. */
function documentaryStrainFacts(strain:NoloStrain){
  const sugars=Object.fromEntries(Object.entries(strain.sugars).filter(([,ability])=>ability!=='unknown'));
  if(strain.source.kind==='judgment'||!(Object.keys(sugars).length||strain.pof!=='unknown'||strain.hydrolysis!=='unknown'||strain.pitchGL||strain.temperatureC||strain.durationDays))return undefined;
  return readIngredientFermentationFacts({version:1,strainName:strain.name,source:structuredClone(strain.source),retrievedAt:'2026-09-12',
    conditions:`${strain.limitation} Plages de la référence de souche ; les réglages du pilote, notamment le contact froid, restent dans la simulation de recette.`,
    sugars,pof:strain.pof,hydrolysis:strain.hydrolysis,
    ...(strain.pitchGL?{pitchGL:structuredClone(strain.pitchGL)}:{}),
    ...(strain.temperatureC?{temperatureC:structuredClone(strain.temperatureC)}:{}),
    ...(strain.durationDays?{durationDays:structuredClone(strain.durationDays)}:{})});
}

function inputOf(recipe:TrialRecipe){
  const input=noloScenarioInput(recipe);
  // Kept identical to the recipe adapter, including older callers during rollout.
  input.recipeContext=JSON.stringify([recipe.volumeL,recipe.efficiencyPct??recipe.brewhouse?.efficiencyPct??null,recipe.brewhouse??null,recipe.mash??null]);
  return input;
}
function originalPoints(recipe:TrialRecipe,efficiency:number):number|null {
  const rows=recipe.fermentables.filter(f=>f.use!=='fermentation');
  if(!positive(recipe.volumeL)||rows.some(f=>!finite(f.weightKg)||f.weightKg<0||f.weightKg>0&&!positive(f.potentialPpg)))return null;
  return BrewingMath.extractPoints(rows,recipe.volumeL,efficiency,'full')?.total??null;
}
function defaultSettings(recipe:TrialRecipe,strain:NoloStrain,science:NoloScience,options:Partial<NoloRecipeSettings>):NoloRecipeSettings {
  const process=options.process??recipe.nolo?.process??'restricted';
  const restricted=process==='restricted'||process==='restored';
  const cold=process==='coldContact';
  const efficiency=options.efficiencyPct??(process==='coldExtraction'?25:recipe.efficiencyPct??recipe.brewhouse?.efficiencyPct??75);
  const points=originalPoints(recipe,efficiency);
  const same=strain.yeastId===recipe.yeast.hopIndexId;
  const form=options.yeastForm??(same?recipe.yeast.form:/white-labs|wlp|wyeast|omega/i.test(strain.yeastId)?'liquide':'sèche');
  const pitch=form==='sèche'?(strain.pitchGL?middle(strain.pitchGL):.75):null;
  const target=options.targetAbvPct??recipe.nolo?.targetAbvPct??.5;
  const primary=recipe.fermentation?.find(p=>p.kind==='primaire');
  const temp=cold?1:strain.temperatureC?middle(strain.temperatureC):primary?.tempC??20;
  const sameProgramme=same&&recipe.nolo?.process===process;
  const days=cold?2:strain.durationDays?middle(strain.durationDays):restricted?3:sameProgramme?primary?.days??7:7;
  const la=strain.yeastId===science.la01.yeastId&&restricted;
  const step=la?{tempC:science.la01.mash[0].tempC,durationMin:science.la01.mash[0].minutes}:recipe.mash?.steps.find(s=>s.tempC>=60&&s.tempC<78)??{tempC:68,durationMin:60};
  const recovered=recipe.nolo?.secondRunnings;
  return {process,targetAbvPct:target,reserveAbvPct:Math.min(.05,target/10),ogSg:process==='secondRunnings'&&finite(recovered?.sg)&&recovered.sg>=1?recovered.sg:points!==null?1+points/1000:recipe.ogTarget??1.01,
    grainScale:1,efficiencyPct:efficiency,extractTolerancePct:process==='coldExtraction'||process==='secondRunnings'?25:5,
    attenuationPct:cold?{min:1,max:5}:strain.attenuationPct??(restricted?{min:8,max:25}:{min:65,max:85}),
    fermentationTempC:temp,fermentationDays:days,pitchGL:pitch,
    yeastQty:pitch!==null&&positive(recipe.volumeL)?recipe.volumeL*pitch:same&&positive(recipe.yeast.qty)?recipe.yeast.qty:1,
    yeastUnit:pitch!==null?'g':same?recipe.yeast.unit:'flacon',yeastForm:form,
    mashTempC:step.tempC,mashMinutes:step.durationMin,mashRatioLKg:recipe.mash?.ratioLPerKg??recipe.brewhouse?.mashRatioLPerKg??4.2,
    stopSg:null,removedPct:null,finalVolumeL:positive(recipe.volumeL)?recipe.volumeL:1,recoveredVolumeL:process==='secondRunnings'&&positive(recovered?.recoveredL)?recovered.recoveredL:positive(recipe.volumeL)?recipe.volumeL:1,
    extractionTempC:process==='coldExtraction'?10:recipe.nolo?.secondRunnings?.temperatureC??75,
    extractionHours:process==='coldExtraction'?24:1,contactHours:48,...options};
}

function issues(recipe:TrialRecipe,s:NoloRecipeSettings,science:NoloScience):string[]{
  const out:string[]=[];
  if(!positive(recipe.volumeL))out.push('Renseigner le volume de la recette, supérieur à 0 L.');
  if(!positive(science.planningModels?.sgAbvFactor.value))out.push('La relation SG–alcool sourcée manque dans cette édition.');
  if(!finite(s.targetAbvPct)||s.targetAbvPct<0||s.targetAbvPct>.5)out.push('Choisir une cible entre 0 et 0,5 % vol.');
  if(!finite(s.reserveAbvPct)||s.reserveAbvPct<0||s.reserveAbvPct>s.targetAbvPct)out.push('La réserve doit être comprise entre 0 et la cible, en points de % vol.');
  if(!validRange(s.attenuationPct,100)||s.attenuationPct.max===0)out.push('Saisir une atténuation ordonnée de 0 à 100 %, avec une borne haute supérieure à 0.');
  if(!positive(s.efficiencyPct)||s.efficiencyPct>100)out.push('Renseigner le rendement envisagé entre 0 et 100 %, excluant 0.');
  if(!finite(s.extractTolerancePct)||s.extractTolerancePct<0||s.extractTolerancePct>100)out.push('La tolérance d’extrait doit être comprise entre 0 et 100 %.');
  if(!finite(s.ogSg)||s.ogSg<1||s.ogSg>3||!finite(s.grainScale)||s.grainScale<0)out.push('Vérifier l’OG et les masses proposées.');
  for(const [label,n] of [['température primaire',s.fermentationTempC],['température d’empâtage',s.mashTempC],['température d’extraction',s.extractionTempC]] as const)
    if(!finite(n)||n<0||n>100)out.push(`La ${label} doit être comprise entre 0 et 100 °C.`);
  for(const [label,n] of [['durée primaire',s.fermentationDays],['quantité de levure',s.yeastQty],['durée d’empâtage',s.mashMinutes],['rapport eau/grain',s.mashRatioLKg],['volume après traitement',s.finalVolumeL],['volume récupéré prévu',s.recoveredVolumeL],['durée d’extraction',s.extractionHours],['durée de contact',s.contactHours]] as const)
    if(!positive(n))out.push(`La ${label} doit être supérieure à 0.`);
  if(s.pitchGL!==null&&!positive(s.pitchGL))out.push('La dose de levure en g/L doit être supérieure à 0.');
  if(!s.yeastUnit.trim())out.push('Indiquer l’unité de levure.');
  if(s.stopSg&&(!validRange(s.stopSg,3)||s.stopSg.min<1||s.stopSg.max>s.ogSg+1e-10))out.push('La SG d’arrêt doit être comprise entre 1 et l’OG proposée.');
  if(s.removedPct&&!validRange(s.removedPct,100))out.push('Le retrait d’alcool doit être une plage ordonnée entre 0 et 100 %.');
  if(s.process!=='secondRunnings') {
    const active=recipe.fermentables.filter(f=>f.use!=='fermentation'&&f.weightKg>0);
    if(!active.length)out.push('Ajouter les fermentescibles du moût pour préparer les quantités.');
    const missing=active.filter(f=>!positive(f.potentialPpg));
    if(missing.length)out.push('Compléter les potentiels PPG : '+missing.map(f=>f.name).join(', ')+'.');
    if(recipe.fermentables.some(f=>!finite(f.weightKg)||f.weightKg<0))out.push('Corriger les masses de fermentescibles invalides.');
  }
  return out;
}

function build(recipe:TrialRecipe,strain:NoloStrain,science:NoloScience,settings:NoloRecipeSettings,water:boolean):NoloRecipeProposal {
  const s=structuredClone(settings),blocking=issues(recipe,s,science),warnings:string[]=[],assumptions:string[]=[
    `Tolérance d’extrait ±${fmt(s.extractTolerancePct,'%')} : hypothèse de pilote éditable, sans série de mesures calibrée.`,
    'L’atténuation est une hypothèse apparente globale sur ce moût. Elle ne remplace pas son analyse de sucres.',
    'Température, temps et ensemencement préparent la conduite ; aucun effet chiffré sur l’alcool n’est inventé pour ces réglages.',
    'La plage reste conditionnelle à l’absence de reprise sur les sucres résiduels ; la conservation et l’alcool conditionné sont à vérifier.'
  ];
  const sources:HopSource[]=[noloSimulationSource,strain.source];
  const referenceAttenuation=s.process!=='coldContact'&&strain.attenuationPct&&s.attenuationPct.min===strain.attenuationPct.min&&s.attenuationPct.max===strain.attenuationPct.max;
  const attenuationSource=referenceAttenuation?'manufacturer':'pilot';
  assumptions.push(referenceAttenuation?'Plage d’atténuation de la référence de levure, appliquée ici comme hypothèse de recette.':'Atténuation de pilote : plage choisie pour explorer le procédé, à calibrer sur ce moût et cette souche.');
  if(!recipe.efficiencyPct&&!recipe.brewhouse?.efficiencyPct&&s.process!=='coldExtraction'&&s.process!=='secondRunnings')assumptions.push(`Rendement de ${fmt(s.efficiencyPct,'%')} choisi pour le pilote faute de rendement saisi ; remplacer par celui de l’installation.`);
  if(!strain.durationDays)assumptions.push('Durée de préparation reprise du calendrier ou proposée pour le pilote ; aucune durée de fin de fermentation garantie.');
  if(s.pitchGL!==null&&!strain.pitchGL)assumptions.push('Dose sèche initiale de 0,75 g/L : hypothèse de préparation à confirmer avec la fiche produit.');
  if(s.pitchGL===null&&!strain.pitchGL)warnings.push('Levure liquide : la quantité de conditionnements est un repère de préparation. Dimensionner le nombre de cellules avec la fiche du fournisseur.');
  if(s.process!=='coldContact'&&strain.temperatureC&&(s.fermentationTempC<strain.temperatureC.min||s.fermentationTempC>strain.temperatureC.max))warnings.push(`Température primaire hors plage documentaire (${fmt(strain.temperatureC.min)}–${fmt(strain.temperatureC.max,'°C')}). L’atténuation affichée reste une hypothèse à vérifier dans ces nouvelles conditions.`);
  if(s.process==='coldContact'){
    sources.push(coldSource);assumptions.push(`Contact froid envisagé à ${fmt(s.fermentationTempC,'°C')} pendant ${fmt(s.contactHours,'h')}. L’atténuation de ${fmt(s.attenuationPct.min)}–${fmt(s.attenuationPct.max,'%')} est un scénario de pilote, pas une performance transférée de l’étude ni une fonction de la durée.`);
    warnings.push('Contact froid : dose et préparation de la levure à adapter au nombre de cellules du pilote. La dose de fermentation ordinaire ne reproduit pas le protocole expérimental.');
    if(s.fermentationTempC>8)warnings.push('Le contact n’est plus dans la plage froide de préparation (0–8 °C) : revoir l’atténuation et la maîtrise thermique.');
  }
  if(s.process==='coldExtraction'){
    sources.push(extractionSource);assumptions.push(`Rendement d’extraction froide envisagé à ${fmt(s.efficiencyPct,'%')}, avec ±${fmt(s.extractTolerancePct,'%')} relatifs : hypothèse de départ, pas rendement mesuré ni rendement à chaud.`);
  }
  if(s.process==='secondRunnings')assumptions.push('Volume et densité de récupération sont des objectifs de préparation. Aucun second rendement du malt neuf, aucune SG ni aucun volume mesurés ne sont écrits.');
  let next=structuredClone(recipe);
  next.nolo=changeNoloProcess({...next.nolo??newNoloConfig(),enabled:true,targetAbvPct:s.targetAbvPct,scienceSnapshot:structuredClone(science)},s.process);
  next.nolo.scienceSnapshot!.strains=[...next.nolo.scienceSnapshot!.strains.filter(ref=>ref.yeastId!==strain.yeastId),structuredClone(strain)];
  next.nolo.planning={...next.nolo.planning,version:1,source:noloSimulationSource,exactExtract:true,simulation:undefined};
  if(s.process!=='secondRunnings') {
    next.fermentables=next.fermentables.map(f=>f.use==='fermentation'?f:{...f,weightKg:f.weightKg*s.grainScale});
    next.totalGristKg=next.fermentables.filter(f=>(f.kind??'grain')==='grain').reduce((sum,f)=>sum+f.weightKg,0);
    next.efficiencyPct=s.efficiencyPct;
  }
  const oldSteps=recipe.mash?.steps??[];
  const la=strain.yeastId===science.la01.yeastId&&['restricted','restored'].includes(s.process);
  let steps=la?science.la01.mash.map((p,i)=>({name:i?'Palier complémentaire LA-01':'Palier LA-01',tempC:i?p.tempC:s.mashTempC,durationMin:i?p.minutes:s.mashMinutes}))
    :oldSteps.length?oldSteps.map((p,i)=>i===Math.max(0,oldSteps.findIndex(x=>x.tempC>=60&&x.tempC<78))?{...p,tempC:s.mashTempC,durationMin:s.mashMinutes}:p)
    :[{name:'Saccharification',tempC:s.mashTempC,durationMin:s.mashMinutes}];
  if(s.process==='coldExtraction')steps=[{name:'Extraction froide · hypothèse de pilote',tempC:s.extractionTempC,durationMin:s.extractionHours*60}];
  if(s.process!=='secondRunnings')next.mash={...next.mash,steps,ratioLPerKg:s.mashRatioLKg};
  if(s.process==='coldExtraction')next.mash={...next.mash!,mashoutTempC:undefined,mashoutDurationMin:undefined,spargeTempC:s.extractionTempC};
  const volume=s.process==='secondRunnings'?s.recoveredVolumeL:recipe.volumeL;
  if(s.process==='secondRunnings')next.volumeL=s.recoveredVolumeL;
  const pitchTemp=s.fermentationTempC;
  const previousYeast=recipe.yeast.hopIndexId===strain.yeastId?recipe.yeast:undefined;
  const fermentationFacts=readIngredientFermentationFacts(previousYeast?.fermentationFacts)??documentaryStrainFacts(strain);
  const lab=previousYeast?.lab?.trim()?previousYeast.lab:strain.source.kind==='manufacturer'?strain.source.author:undefined;
  next.yeast={...previousYeast,name:strain.name,hopIndexId:strain.yeastId,form:s.yeastForm,lab,fermentationFacts,
    qty:s.pitchGL!==null?volume*s.pitchGL:s.yeastQty,unit:s.pitchGL!==null?'g':s.yeastUnit,pitchTempC:pitchTemp,
    attenuationPct:middle(s.attenuationPct),fermentDays:s.process==='coldContact'?s.contactHours/24:s.fermentationDays,
    ...(strain.temperatureC?{fermTempMinC:strain.temperatureC.min,fermTempMaxC:strain.temperatureC.max}:{}),
    notes:`Préparation NOLO : atténuation ${fmt(s.attenuationPct.min)}–${fmt(s.attenuationPct.max,'%')} (${attenuationSource==='manufacturer'?'référence utilisée comme hypothèse':'hypothèse de pilote'}).`};
  s.yeastQty=next.yeast.qty;s.yeastUnit=next.yeast.unit;
  const conduction=s.process==='arrested'&&s.stopSg?`Chute OG–SG à viser : ${(s.ogSg-s.stopSg.max).toFixed(4)}–${(s.ogSg-s.stopSg.min).toFixed(4)} à partir de l’OG réellement mesurée ; SG absolue ${s.stopSg.min.toFixed(4)}–${s.stopSg.max.toFixed(4)} indicative. Contrôler arrêt et stabilisation ; durée indicative.`
    :s.process==='coldContact'?'Suivre densité et alcool pendant le contact ; le froid seul ne stabilise pas le produit.'
    :s.process==='dealcoholized'?'Fermenter la bière mère avant traitement ; vérifier la fin par les mesures.'
    :'Suivre densité, pH et alcool ; le calendrier ne valide pas la stabilité.';
  next.fermentation=[{kind:'primaire',name:s.process==='coldContact'?'Contact froid NOLO':s.process==='arrested'?'Fermentation NOLO avant arrêt':'Fermentation NOLO · '+strain.name,
    tempC:s.fermentationTempC,days:s.process==='coldContact'?s.contactHours/24:s.fermentationDays,note:conduction},
    ...(recipe.fermentation??[]).filter(p=>p.kind!=='primaire'&&(p.kind!=='reposDiacetyle'||!['restricted','restored','coldContact','arrested'].includes(s.process)))];
  next.yeastGuide=undefined;next.yeastDesign=undefined;next.hopPredictionIds=undefined;next.hopTrialId=undefined;next.hopMatrixId=undefined;
  next.ogTarget=s.ogSg;next.abvTarget=s.targetAbvPct;
  if(!next.carboTarget)next.carboTarget='Carbonatation forcée · consigne CO₂ à définir';
  if(s.process==='arrested')next.nolo.planning={...next.nolo.planning,stopSg:s.stopSg,stopAttenuationPct:null};
  else next.nolo.planning={...next.nolo.planning,stopSg:undefined,stopAttenuationPct:undefined};
  if(s.process==='dealcoholized'){
    const index=next.nolo.operations.findIndex(o=>o.kind==='removal');
    const operation={id:index>=0?next.nolo.operations[index].id:'nolo-solver-removal',kind:'removal' as const,name:index>=0?next.nolo.operations[index].name:'Retrait d’alcool prévu',
      ethanolRemovedPct:s.removedPct,finalVolumeL:s.finalVolumeL,source:'Consigne de préparation calculée · hypothèse de pilote, 2026 ; à mesurer après traitement.'};
    if(index>=0)next.nolo.operations[index]=operation;else next.nolo.operations.push(operation);
  }
  if(s.process==='secondRunnings')next.nolo.secondRunnings={sourceBatchId:'',previousExtraction:'',waterAddedL:null,alkalinityPpm:null,recoveredL:null,sg:null,ph:null,...next.nolo.secondRunnings,
    temperatureC:s.extractionTempC,minutes:s.extractionHours*60};
  if(s.process==='restored')warnings.push('Restitution aromatique : doser au banc d’essai et saisir la composition du support. Aucun arôme ni sucre supplémentaire n’est inventé.');
  if(water&&s.process!=='secondRunnings'&&next.totalGristKg>0){
    const volumes=BrewingMath.waterVolumes(next.totalGristKg,next.volumeL,{...next.brewhouse,mashRatioLPerKg:s.mashRatioLKg},next.mash?.spargeType,next.boilMin,next.hops.filter(h=>h.stage!=='dryHop').reduce((sum,h)=>sum+h.weightG,0));
    next.preBoilL=volumes.preBoilVolumeL;next.preBoilHotL=volumes.preBoilHotL;
    if(next.waterPlan){
      const oldWater=recipe.waterPlan!;
      next.waterPlan={...next.waterPlan,mashWaterL:volumes.mashWaterL,spargeWaterL:volumes.spargeWaterL};
      const retainMineralConcentrations=()=>{
        const scaled=(doses:typeof oldWater.mash,oldL:number,newL:number)=>positive(oldL)?Object.fromEntries(Object.entries(doses??{}).map(([key,dose])=>[key,(dose??0)*newL/oldL])):doses;
        next.waterPlan={...next.waterPlan!,mash:scaled(oldWater.mash,oldWater.mashWaterL,volumes.mashWaterL),sparge:scaled(oldWater.sparge,oldWater.spargeWaterL,volumes.spargeWaterL),
          acid:undefined,acidOverride:undefined,startIons:undefined,wortIons:undefined};
      };
      if(s.process==='coldExtraction'){
        retainMineralConcentrations();
        warnings.push('Extraction froide : volumes d’eau proposés avec les pertes de l’installation, sels ajustés aux volumes. La dose d’acide est à établir par mesure ou titrage ; l’ancienne dose du moût chaud est retirée.');
      }
      else try{const replanned=replanRecipeWater(next);next.waterPlan=replanned.plan;warnings.push(...replanned.warnings);}
        catch(e){retainMineralConcentrations();warnings.push('Traitement de l’eau à revoir ; acide à déterminer par mesure ou titrage : '+(e instanceof Error?e.message:String(e)));}
    }
  }
  if(water&&recipe.brewhouse?.equipment){
    const e=recipe.brewhouse.equipment,working=e.fermenterCapacityL*(1-e.fermenterHeadspacePct/100);
    const finalVolume=s.process==='dealcoholized'?s.finalVolumeL:volume;
    if(positive(working)&&Math.max(volume,finalVolume)>working)blocking.push(`Volume prévu supérieur au volume de travail du fermenteur (${fmt(working,'L')}).`);
    if(next.preBoilHotL!==undefined&&positive(e.kettleWorkingL)&&next.preBoilHotL>e.kettleWorkingL)blocking.push(`Volume avant ébullition supérieur à la capacité de travail (${fmt(e.kettleWorkingL,'L')}).`);
  }
  // The wizard stores the achieved ratio after water-volume rounding. Bind the
  // same physical programme; otherwise applying an unchanged preview expires it.
  if(water&&s.process!=='secondRunnings'&&next.mash&&positive(next.totalGristKg)&&positive(next.waterPlan?.mashWaterL))
    next.mash={...next.mash,ratioLPerKg:next.waterPlan.mashWaterL/next.totalGristKg};
    // The wizard stores the applied mash ratio in its equipment snapshot too.
    if(next.brewhouse)next.brewhouse={...next.brewhouse,mashRatioLPerKg:next.mash.ratioLPerKg};
  const simulation:NoloSimulation={version:1,model:'apparent-attenuation-v1',basis:'pending',source:noloSimulationSource,settings:s,
    wortSg:simulationWortRange(s.ogSg,s.extractTolerancePct),volumeL:volume,
    attenuationSource,attenuationReference:referenceAttenuation?strain.source:noloSimulationSource,
    stopDropSg:s.process==='arrested'&&s.stopSg?{min:Math.max(0,s.ogSg-s.stopSg.max),max:Math.max(0,s.ogSg-s.stopSg.min)}:null,assumptions};
  next.nolo.planning.simulation=simulation;
  simulation.basis=noloSimulationBasis(inputOf(next));
  let result:NoloRecipeProposal['result']=null;
  if(!blocking.length)try{assertNoloConfig(next.nolo);result=evaluateNoloScenario(inputOf(next),science);}catch(e){blocking.push(e instanceof Error?e.message:String(e));}
  if(result){
    next.fgTarget=result.finalGravity?middle(result.finalGravity):null;
    if(result.projection.max===null)blocking.push(...(result.missing.length?result.missing:['La projection reste inconnue : compléter le bilan des ajouts.']));
    if(result.projectionStatus==='exceeds'||result.projection.max!==null&&result.projection.max>s.targetAbvPct+1e-8)warnings.push('La plage dépasse la consigne : réduire l’extrait ou l’atténuation, ou renforcer le retrait prévu.');
    if(!result.simulationActive)blocking.push('Le contexte de simulation n’a pas pu être fixé. Relancer la préparation.');
    const e=recipe.brewhouse?.equipment,working=e?e.fermenterCapacityL*(1-e.fermenterHeadspacePct/100):null;
    if(water&&positive(working)&&result.volumeL!==null&&result.volumeL>working+1e-8)blocking.push(`Le volume avec les ajouts dépasse le volume de travail du fermenteur (${fmt(working,'L')}).`);
  }
  next.ibuTarget=recipeIbu(next.hops,next.volumeL,next.ogTarget,next.boilMin)??undefined;
  const changes:NoloRecipeProposal['changes']=[];
  const number=(value:unknown,unit='')=>finite(value)?fmt(value,unit):'À renseigner';
  const density=(value:unknown)=>finite(value)?value.toLocaleString('fr-FR',{minimumFractionDigits:4,maximumFractionDigits:4}):'À renseigner';
  const change=(label:string,a:unknown,b:unknown,format:(x:any)=>string=(x)=>typeof x==='string'&&x.trim()?x:'À renseigner')=>{
    if(noloCanonical(a)===noloCanonical(b))return;
    const before=format(a),after=format(b);
    if(before!==after)changes.push({label,before,after});
  };
  change('Procédé',recipe.nolo?.process,s.process,p=>noloProcessLabels[p as keyof typeof noloProcessLabels]??'À renseigner');
  change('Objectif',recipe.nolo?.targetAbvPct,s.targetAbvPct,n=>number(n,'% vol.'));
  next.fermentables.forEach((f,i)=>change(f.name,recipe.fermentables[i]?.weightKg,f.weightKg,n=>number(n,'kg')));
  change('OG prévue',recipe.ogTarget,next.ogTarget,density);
  change('Souche',recipe.yeast.name,next.yeast.name);change('Ensemencement',recipe.yeast,next.yeast,y=>`${number(y?.qty,y?.unit)} · ${number(y?.pitchTempC,'°C')}`);
  change('Empâtage',recipe.mash,next.mash,m=>m?.steps.map((p:any)=>`${number(p.tempC,'°C')} · ${number(p.durationMin,'min')}`).join(' → ')||'À renseigner');
  change('Fermentation',recipe.fermentation,next.fermentation,p=>p?.map((p:any)=>`${number(p.tempC,'°C')} · ${number(p.days,'j')}`).join(' → ')||'À renseigner');
  change('Rendement prévu',recipe.efficiencyPct,next.efficiencyPct,n=>number(n,'%'));
  change('Eau',recipe.waterPlan,next.waterPlan,p=>p?`${number(p.mashWaterL,'L')} + ${number(p.spargeWaterL,'L')}`:'À renseigner');
  change('Acide',recipe.waterPlan?.acid,next.waterPlan?.acid,a=>a?`${ACIDS[a.id as keyof typeof ACIDS]?.name??a.id} · ${number(a.mash,ACIDS[a.id as keyof typeof ACIDS]?.unit)} + ${number(a.sparge,ACIDS[a.id as keyof typeof ACIDS]?.unit)}`:'Aucune dose prévue');
  if(s.process==='arrested')change('SG d’arrêt indicative',recipe.nolo?.planning?.stopSg,s.stopSg,r=>r?`${density(r.min)}–${density(r.max)}`:'À renseigner');
  if(s.process==='dealcoholized')change('Retrait d’alcool prévu',recipe.nolo?.operations.find(o=>o.kind==='removal'),next.nolo.operations.find(o=>o.kind==='removal'),o=>o?.ethanolRemovedPct?`${number(o.ethanolRemovedPct.min)}–${number(o.ethanolRemovedPct.max,'%')} · ${number(o.finalVolumeL,'L')}`:'À renseigner');
  return {version:NOLO_RECIPE_SOLVER_VERSION,basis:noloRecipeProposalBasis(recipe),sourceRecipe:structuredClone(recipe),strain:structuredClone(strain),recipe:next,settings:s,result,changes,
    sources,assumptions,blocking:unique(blocking),warnings:unique(warnings),confidence:{level:referenceAttenuation?'documented':'pilot',
      label:referenceAttenuation?'Atténuation documentée · scénario de pilote':'Hypothèses de pilote à calibrer',
      detail:'Les bornes propagent les valeurs saisies, sans probabilité de couverture. Une analyse de pilote permet de resserrer les hypothèses.'}};
}

/** A solve changes the recipe only inside its returned preview. The upper edge
 * is solved below the goal minus an explicit reserve, including all known additions. */
export function prepareNoloRecipe(recipe:TrialRecipe,science:NoloScience,strain:NoloStrain,options:Partial<NoloRecipeSettings>={}):NoloRecipeProposal {
  const existing=matchingNoloSimulation(inputOf(recipe));
  const resume=existing&&existing.settings.process===(options.process??recipe.nolo?.process)&&strain.yeastId===recipe.yeast.hopIndexId&&
    (options.targetAbvPct===undefined||options.targetAbvPct===existing.settings.targetAbvPct);
  let s=defaultSettings(recipe,strain,science,{...(resume?{...existing.settings,grainScale:1}:{}),...options});
  const points=originalPoints(recipe,s.efficiencyPct);
  if(s.process!=='secondRunnings'&&points!==null&&points>0){
    if(options.ogSg!==undefined||resume){s.grainScale=(s.ogSg-1)*1000/points;if(Math.abs(s.grainScale-1)<1e-12)s.grainScale=1;}
    else if(options.grainScale!==undefined)s.ogSg=1+points*s.grainScale/1000;
  }
  const measuredRecovery=s.process==='secondRunnings'&&finite(recipe.nolo?.secondRunnings?.sg)&&recipe.nolo.secondRunnings.sg>=1;
  const explicit=resume||options.ogSg!==undefined||options.grainScale!==undefined||measuredRecovery;
  const factor=science.planningModels?.sgAbvFactor.value??131.25;
  const budget=s.targetAbvPct-s.reserveAbvPct;
  if(s.process==='arrested'&&!s.stopSg){const drop=Math.min(Math.max(0,s.ogSg-1),Math.max(0,budget/factor));s.stopSg={min:s.ogSg-drop,max:Math.min(s.ogSg,s.ogSg-drop+.0005)};}
  if(s.process==='dealcoholized'&&!s.removedPct)s.removedPct={min:90,max:92};
  if(!explicit&&!issues(recipe,s,science).length){
    const projection=(candidate:NoloRecipeSettings)=>build(recipe,strain,science,candidate,false).result?.projection.max??null;
    if(s.process==='dealcoholized'){
      const at=(value:number)=>({...s,removedPct:{min:value,max:Math.min(100,value+2)}});
      const best=projection(at(100));
      if(best!==null&&best<=budget+1e-8){let lo=0,hi=100;for(let i=0;i<35;i++){const mid=(lo+hi)/2,v=projection(at(mid));if(v!==null&&v<=budget)hi=mid;else lo=mid;}s=at(hi);}
    }else if(s.process==='arrested'){
      const at=(drop:number)=>({...s,stopSg:{min:Math.max(1,s.ogSg-drop),max:Math.min(s.ogSg,Math.max(1,s.ogSg-drop+.0005))}});
      let lo=0,hi=s.ogSg-1;for(let i=0;i<35;i++){const mid=(lo+hi)/2,v=projection(at(mid));if(v!==null&&v<=budget)lo=mid;else hi=mid;}s=at(lo);
    }else{
      const at=(scale:number)=>({...s,grainScale:s.process==='secondRunnings'?1:scale,ogSg:1+(s.process==='secondRunnings'?.05:(points??0)/1000)*scale});
      const zero=projection(at(0));
      if(zero!==null&&zero<=budget+1e-8){
        let lo=0,hi=s.process==='secondRunnings'?2:1;
        while(hi<64){const v=projection(at(hi));if(v===null||v>budget)break;hi*=2;}
        for(let i=0;i<35;i++){const mid=(lo+hi)/2,v=projection(at(mid));if(v!==null&&v<=budget)lo=mid;else hi=mid;}s=at(lo);
      }
    }
  }
  const result=build(recipe,strain,science,s,true);
  if(result.result?.projection.max!==null&&result.result?.projection.max!==undefined&&result.result.projection.max>s.targetAbvPct+1e-8&&!explicit)
    result.blocking.push('Les ajouts ou le procédé empêchent d’atteindre cette consigne avec les hypothèses actuelles. Revoir le bilan des ajouts ou modifier les réglages.');
  return result;
}

/** Editing preserves the already proposed grist; changing a target alone does
 * not silently solve again. The explicit Prepare action does that. */
export function adjustNoloRecipe(proposal:NoloRecipeProposal,patch:Partial<NoloRecipeSettings>,science:NoloScience):NoloRecipeProposal {
  const s={...proposal.settings,...patch};
  const points=originalPoints(proposal.sourceRecipe,s.efficiencyPct);
  if(s.process!=='secondRunnings'&&points!==null&&points>0){
    if(patch.ogSg!==undefined)s.grainScale=(s.ogSg-1)*1000/points;
    else s.ogSg=1+points*s.grainScale/1000;
  }
  if(patch.yeastQty!==undefined&&patch.pitchGL===undefined)s.pitchGL=null;
  if(patch.contactHours!==undefined&&s.process==='coldContact')s.fermentationDays=s.contactHours/24;
  return build(proposal.sourceRecipe,proposal.strain,science,s,true);
}
export function applyNoloRecipeProposal(currentRecipe:TrialRecipe,proposal:NoloRecipeProposal):TrialRecipe {
  if(noloRecipeProposalBasis(currentRecipe)!==proposal.basis)throw Error('La recette a changé. Recalculer la proposition avant de l’appliquer.');
  if(proposal.blocking.length)throw Error(proposal.blocking[0]);
  assertNoloConfig(proposal.recipe.nolo);
  if(!matchingNoloSimulation(inputOf(proposal.recipe)))throw Error('La proposition a changé. Relancer sa simulation avant de l’appliquer.');
  return structuredClone(proposal.recipe);
}
