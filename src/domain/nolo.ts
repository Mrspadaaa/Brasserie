import { type NoloConfig, type NoloScience, type NoloStrain } from '../../functions/src/noloSchema';
import { noloInputBasis, type NoloInput } from '../../functions/src/noloCore';
import { evaluateNoloScenario, changeNoloProcess, noloScenarioBasis, type NoloScenarioInput } from '../../functions/src/noloScenario';
import { agreedFermentationFact } from '../../functions/src/fermentationContext';
import { BrewingMath } from '../services/brewingMath';
import { resolveFermentationYeast } from './fermentationScenario';
import type { HopYeast } from '../../functions/src/hopPredictionSchema';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';
import { yeastReferences } from './yeastReferences';
import type { TrialRecipe } from './hopIndex/trials';
import { normalizeHop } from './hopStage';
import type { Batch, RecipeSnapshot } from '../types';
export { noloScience } from './noloScience';
import { noloScience } from './noloScience';
import { noloYeastCandidates } from './noloYeastSelection';
export const noloPlanningSource = {
  title:'Hypothèses du pilote',author:'L’Affinée',year:2026,kind:'judgment' as const,
  reference:'functions/reports/nolo-scenarios-2026.md',
  locator:'Valeurs de préparation éditables. Ni mesure ni intervalle statistique.'
};
export function noloWaterModelIssue(config:NoloConfig|undefined,ratio:number):string|undefined {
  if(!config?.enabled)return;
  if(config.process==='secondRunnings')return 'Drêches : mesurer le moût récupéré. Aucun nouveau rendement, absorption de grain sec ou pouvoir tampon de malt neuf n’est appliqué.';
  if(config.process==='coldExtraction')return 'Extraction à froid : mesurer ou titrer le moût filtré. Le modèle de pH et les doses d’acide d’un empâtage à chaud ne sont pas validés dans ce contexte.';
  const science=config.scienceSnapshot??noloScience();
  if(science&&ratio>science.waterMashMaxLKg.value)return 'Empâtage très dilué : pH à mesurer ou à titrer, sans estimation ni marge standard du modèle.';
}
export function newNoloConfig(): NoloConfig {
  return {version:1,enabled:true,targetAbvPct:.5,process:'restricted',orientation:'free',
    wort:{ogPlato:null,sugarsGL:{},sugarsComplete:false},operations:[],measurements:[],equipment:[],
    stabilization:{method:'',validationReference:'',storage:''}};
}
export function noloInput(recipe: TrialRecipe): NoloInput {
  return {config:recipe.nolo??newNoloConfig(),volumeL:(recipe.nolo?.enabled&&recipe.nolo.process==='secondRunnings')
      ? recipe.nolo.secondRunnings?.recoveredL ?? 0 : recipe.volumeL,
    yeastId:recipe.yeast.hopIndexId??null,yeastName:recipe.yeast.name,
    fermentation:recipe.fermentation??[],mash:recipe.mash?.steps??[],mashRatioLKg:recipe.waterPlan?.mashWaterL>0&&recipe.fermentables.some(f=>f.kind==='grain'&&(f.use??'empatage')==='empatage'&&f.weightKg>0)
      ? recipe.waterPlan.mashWaterL/recipe.fermentables.filter(f=>f.kind==='grain'&&(f.use??'empatage')==='empatage').reduce((sum,f)=>sum+f.weightKg,0):recipe.mash?.ratioLPerKg,
    dryHop:recipe.hops.some(h=>normalizeHop(h).stage==='dryHop'&&h.weightG>0),
    fermentableBasis:JSON.stringify(recipe.fermentables),
    untrackedFermentationAdditions:recipe.fermentables.some((f,i)=>f.use==='fermentation'&&f.weightKg>0&&!recipe.nolo?.operations.some(o=>o.kind==='sugar'&&o.recipeAddition?.index===i&&o.recipeAddition.basis===JSON.stringify(f)))};
}
export function evaluateNoloRecipe(recipe: TrialRecipe,saved: HopKnowledge[] = []) {
  const science=recipe.nolo?.scienceSnapshot??noloScience(saved);
  return recipe.nolo?.enabled&&science?evaluateNoloScenario(noloScenarioInput(recipe,saved),science):null;
}
export function noloScenarioInput(recipe:TrialRecipe,saved:HopKnowledge[]=[]):NoloScenarioInput {
  const input=noloInput(recipe);
  input.config=changeNoloProcess(input.config,input.config.process);
  const measured=input.config.measurements.filter(m=>m.stage==='wort'&&m.sg!=null&&m.method.trim()&&/^\d{4}-\d{2}-\d{2}/.test(m.date)&&
    (m.basis===noloScenarioBasis(input)||!input.config.planning?.stopSg&&!input.config.planning?.stopAttenuationPct&&m.basis===noloInputBasis(input))
  ).sort((a,b)=>a.date.localeCompare(b.date)).at(-1);
  const beforeFermentation=recipe.fermentables.filter(f=>f.use!=='fermentation');
  const needsYield=beforeFermentation.some(f=>(f.kind??'grain')==='grain'&&f.weightKg>0);
  const efficiency=recipe.efficiencyPct??recipe.brewhouse?.efficiencyPct;
  const knownYield=efficiency!=null&&Number.isFinite(efficiency)&&efficiency>0&&efficiency<=100;
  const points=needsYield&&!knownYield?null:BrewingMath.extractPoints(beforeFermentation,recipe.volumeL,needsYield?efficiency!:100,input.config.planning?.exactExtract?'full':'rounded');
  // Cold extraction has its own yield; a hot-mash grist calculation cannot
  // stand in for an observation of this wort.
  const sg=measured?.sg??(recipe.nolo?.process==='secondRunnings'?recipe.nolo.secondRunnings?.sg:recipe.nolo?.process==='coldExtraction'?undefined:points?1+points.total/1000:undefined);
  const yeast=resolveFermentationYeast(recipe,yeastReferences(saved));
  const frozen=input.config.scienceSnapshot?.strains.find(s=>s.yeastId===input.yeastId);
  const attenuation=agreedFermentationFact(yeast,'attenuation','%')??(frozen?.attenuationPct?{range:frozen.attenuationPct,source:frozen.source}:undefined);
  const temperature=agreedFermentationFact(yeast,'temperature','°C')??(frozen?.temperatureC?{range:frozen.temperatureC,source:frozen.source}:undefined);
  return {...input,recipeContext:JSON.stringify([recipe.volumeL,recipe.efficiencyPct??recipe.brewhouse?.efficiencyPct??null,recipe.brewhouse??null,recipe.mash??null]),...(sg!=null&&sg>=1?{og:{range:{min:sg,max:sg},origin:measured||recipe.nolo?.process==='secondRunnings'?'measurement' as const:'calculated' as const,source:noloPlanningSource}}:{}),
    ...(attenuation?{fullFermentation:{...attenuation,temperatureC:temperature?.range}}:{})};
}
export function noloRecipeForBatch(batch:Batch):RecipeSnapshot|undefined{
  const recipe=batch.recipeSnapshot;
  const config=batch.nolo??recipe?.nolo;
  if(!recipe||!config?.enabled)return undefined;
  const operations=config.operations.filter(o=>o.id!=='batch-priming'&&!(batch.carbonation?.method&&o.id==='planned-priming'));
  if(batch.carbonation?.method==='priming'){
    const mass=batch.carbonation.sugarG;
    operations.push({id:'batch-priming',kind:'sugar',name:'Resucrage du brassin (conditionnement)',sugarsG:{},complete:true,
      volumeL:0,unclassifiedSugarG:typeof mass==='number'&&Number.isFinite(mass)&&mass>=0?{min:mass,max:mass}:null});
  }
  return {...recipe,volumeL:batch.volumeL,nolo:{...config,operations}};
}
/** Explicit button only. Temperatures/durations are editable suggestions from the
 * actual strain reference; switching NOLO on never changes a recipe's programme. */
export function applyNoloStrain(recipe: TrialRecipe,strain:NoloStrain,science:NoloScience):TrialRecipe {
  const temp=strain.temperatureC ? (strain.temperatureC.min+strain.temperatureC.max)/2 : undefined;
  const days=strain.durationDays ? (strain.durationDays.min+strain.durationDays.max)/2 : undefined;
  const old=recipe.fermentation??[];
  const phases=temp!=null&&days!=null
    ? [{kind:'primaire' as const,name:'Fermentation NOLO · '+strain.name,tempC:temp,days,
        note:'Repère de planification : contrôler densité, pH et alcool ; durée non libératoire.'},...old.filter(p=>p.kind!=='primaire'&&p.kind!=='reposDiacetyle')]
    : temp!=null ? old.map(p=>p.kind==='primaire'?{...p,tempC:temp,note:'Température issue de la souche ; durée conservée comme hypothèse à vérifier.'}:p) : old;
  const frozen=structuredClone(science);
  if(!frozen.strains.some(s=>s.yeastId===strain.yeastId))frozen.strains.push(structuredClone(strain));
  const liquid=/wlp\d+|white-labs|wyeast|omega|imperial|escarpment/i.test(strain.yeastId);
  return {...recipe,nolo:{...(recipe.nolo??newNoloConfig()),scienceSnapshot:frozen},
    yeast:{name:strain.name,hopIndexId:strain.yeastId,form:liquid?'liquide':'sèche',qty:strain.pitchGL&&recipe.volumeL>0?recipe.volumeL*(strain.pitchGL.min+strain.pitchGL.max)/2:0,unit:strain.pitchGL?'g':liquid?'sachet':'g',
      ...(temp!=null?{pitchTempC:temp}:{}),...(strain.temperatureC?{fermTempMinC:strain.temperatureC.min,fermTempMaxC:strain.temperatureC.max}:{})},
    yeastGuide:undefined,hopPredictionIds:undefined,hopTrialId:undefined,hopMatrixId:undefined,fermentation:phases};
}
/** Small local shortlist evaluated by the same direct mass balance. No grid
 * search or weighted pseudo-precision; exact ties keep a stable name order. */
export function rankNoloStrains(recipe:TrialRecipe,science:NoloScience){
  return noloYeastCandidates(recipe,science).map(({strain})=>{
    const proposed=applyNoloStrain(recipe,strain,science);
    const result=evaluateNoloScenario(noloScenarioInput(proposed),science);
    const phenolic=recipe.nolo?.orientation==='clove'||recipe.nolo?.orientation==='balanced';
    const aromaFit=phenolic&&strain.pof==='positive'?'documented' as const:'explore' as const;
    return {strain,result,aromaFit,needsThermalControl:!(recipe.nolo?.equipment??[]).includes('Maîtrise thermique')};
  }).sort((a,b)=>Number(b.result.projectionStatus==='within')-Number(a.result.projectionStatus==='within')||
    Number(a.result.projectionStatus==='exceeds')-Number(b.result.projectionStatus==='exceeds')||
    Number(b.aromaFit==='documented')-Number(a.aromaFit==='documented')||a.strain.name.localeCompare(b.strain.name));
}
