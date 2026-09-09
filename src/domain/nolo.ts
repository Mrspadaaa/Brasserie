import pack from '../data/noloBootstrap.json';
import scenarioPack from '../data/noloScenarioBootstrap.json';
import { assertNoloScience, type NoloConfig, type NoloScience, type NoloStrain } from '../../functions/src/noloSchema';
import { noloInputBasis, type NoloInput } from '../../functions/src/noloCore';
import { evaluateNoloScenario, changeNoloProcess, noloScenarioBasis, type NoloScenarioInput } from '../../functions/src/noloScenario';
import { agreedFermentationFact } from '../../functions/src/fermentationContext';
import { BrewingMath } from '../services/brewingMath';
import { resolveFermentationYeast } from './fermentationScenario';
import type { HopYeast } from '../../functions/src/hopPredictionSchema';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';
import type { TrialRecipe } from './hopIndex/trials';
import { normalizeHop } from './hopStage';
import type { Batch, RecipeSnapshot } from '../types';
export function noloScience(saved: HopKnowledge[] = []): NoloScience | undefined {
  const canonical=(r:unknown)=>JSON.stringify(r,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.keys(item).filter(k=>k!=='__docId').sort().map(k=>[k,item[k]])):item);
  const rows = [...new Map([...pack,...scenarioPack,...saved.map(r=>{
    const old=pack.find(p=>p.id===r.id);
    return old&&canonical(old)===canonical(r)?scenarioPack.find(p=>p.id===r.id)??r:r;
  })].map(r=>[r.id,r])).values()];
  return rows.find((r): r is NoloScience => { if(r.kind!=='noloScience')return false;try{assertNoloScience(r);return r.enabled;}catch{return false;} });
}
export const noloPlanningSource = {
  title:'Hypothèses du pilote',author:'L’Affinée',year:2026,kind:'judgment' as const,
  reference:'functions/reports/nolo-scenarios-2026.md',
  locator:'Valeurs de préparation éditables. Ni mesure ni intervalle statistique.'
};
export function noloWaterModelIssue(config:NoloConfig|undefined,ratio:number):string|undefined {
  if(!config?.enabled)return;
  if(config.process==='secondRunnings')return 'Drêches : mesurer le moût récupéré. Aucun nouveau rendement, absorption de grain sec ou pouvoir tampon de malt neuf n’est appliqué.';
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
  const points=BrewingMath.extractPoints(recipe.fermentables.filter(f=>f.use!=='fermentation'),recipe.volumeL,recipe.efficiencyPct??recipe.brewhouse?.efficiencyPct??75);
  const sg=measured?.sg??(recipe.nolo?.process==='secondRunnings'?recipe.nolo.secondRunnings?.sg:points?1+points.total/1000:undefined);
  const yeast=resolveFermentationYeast(recipe,saved.filter((k):k is HopYeast=>k.kind==='yeast'));
  const attenuation=agreedFermentationFact(yeast,'attenuation','%');
  const temperature=agreedFermentationFact(yeast,'temperature','°C');
  return {...input,...(sg!=null&&sg>=1?{og:{range:{min:sg,max:sg},origin:measured||recipe.nolo?.process==='secondRunnings'?'measurement' as const:'calculated' as const,source:noloPlanningSource}}:{}),
    ...(attenuation?{fullFermentation:{...attenuation,temperatureC:temperature?.range}}:{})};
}
export function noloRecipeForBatch(batch:Batch):RecipeSnapshot|undefined{
  const recipe=batch.recipeSnapshot;
  const config=batch.nolo??recipe?.nolo;
  if(!recipe||!config?.enabled)return undefined;
  const operations=config.operations.filter(o=>o.id!=='batch-priming');
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
        note:'Repère de planification : contrôler densité, pH et alcool ; durée non libératoire.'},...old.filter(p=>p.kind!=='primaire'&&p.kind!=='reposDiacetyle')] : old;
  return {...recipe,nolo:{...(recipe.nolo??newNoloConfig()),scienceSnapshot:structuredClone(science)},
    yeast:{name:strain.name,hopIndexId:strain.yeastId,form:strain.yeastId.includes('wlp618')?'liquide':'sèche',qty:0,unit:'g',
      ...(temp!=null?{pitchTempC:temp}:{}),...(strain.temperatureC?{fermTempMinC:strain.temperatureC.min,fermTempMaxC:strain.temperatureC.max}:{})},
    yeastGuide:undefined,hopPredictionIds:undefined,hopTrialId:undefined,hopMatrixId:undefined,fermentation:phases};
}
/** Small local shortlist evaluated by the same direct mass balance. No grid
 * search or weighted pseudo-precision; exact ties keep a stable name order. */
export function rankNoloStrains(recipe:TrialRecipe,science:NoloScience){
  return science.strains.map(strain=>{
    const proposed=applyNoloStrain(recipe,strain,science);
    const result=evaluateNoloScenario(noloScenarioInput(proposed),science);
    const phenolic=recipe.nolo?.orientation==='clove'||recipe.nolo?.orientation==='balanced';
    const aromaFit=phenolic&&strain.pof==='positive'?'documented' as const:'explore' as const;
    return {strain,result,aromaFit,needsThermalControl:!(recipe.nolo?.equipment??[]).includes('Maîtrise thermique')};
  }).sort((a,b)=>Number(b.result.projectionStatus==='within')-Number(a.result.projectionStatus==='within')||
    Number(a.result.projectionStatus==='exceeds')-Number(b.result.projectionStatus==='exceeds')||
    Number(b.aromaFit==='documented')-Number(a.aromaFit==='documented')||a.strain.name.localeCompare(b.strain.name));
}
