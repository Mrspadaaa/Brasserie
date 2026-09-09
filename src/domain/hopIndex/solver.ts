import { createHopExtrapolationCache, hopDescriptorEvidence } from '../../../functions/src/hopExtrapolationCore';
import type { HopExtrapolation } from '../../../functions/src/hopExtrapolationSchema';
import type { HopAnalyte, HopRange, HopSource, HopVariety } from '../../../functions/src/hopIndexSchema';
import { HOP_TIMINGS, type HopAxis, type HopEstimate, type HopKnowledge, type HopPrediction, type HopTriplet, type HopYeast } from '../../../functions/src/hopPredictionSchema';
import type { HopSolverIntent, HopSolverPolicy } from '../../../functions/src/hopSolverSchema';
import type { HopTrial } from '../../../functions/src/hopTrialSchema';
import { compareHopPredictions, createHopPredictor, usableHopKnowledge, type HopEngineData } from './engine';
import { resolveHopFacts } from '../../../functions/src/hopIndexFacts';
import { applyHopScenario, recipeHopScenario } from './exploration';
import { findRecipeYeastMatches, withDocumentedYeastNames } from './recipeGuide';
import type { TrialRecipe } from './trials';
import { selectHopSearchDomain, type HopSearchMode } from './solverSelection';
import { fermentationProgramIssues } from '../../../functions/src/fermentationContext';
import { normalizeHop } from '../hopStage';

export type SolverCheck = { status: 'conflict' | 'unknown' | 'supported'; message: string; source?: HopSource };
export type SolverCondition = { field: 'doseGL' | 'temperatureC' | 'contactHours'; value: number; range: HopRange; origin: 'trial' | 'recipe' | 'proposal'; source: HopSource };
export interface HopSolverCandidate {
  id: string; triplets: HopTriplet[]; predictions: HopPrediction[]; trial?: HopTrial;
  conditions: SolverCondition[][]; checks: SolverCheck[]; recipeChecks: SolverCheck[];
  score: HopEstimate; evidenceFamilies: string[]; totalDryHopGL: number | null;
}
const dry = (t: HopTriplet['timing']) => t === 'fermentation' || t === 'postFermentation';
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const fold = (s: string) => s.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').trim();
const unknownScore = (): HopEstimate => ({ range: null, confidence: 'low', reasons: ['Le profil sensoriel d’un assemblage n’est pas additionné.'], sources: [] });

export function initialHopSolverIntent(recipe: TrialRecipe | undefined, policy: HopSolverPolicy): HopSolverIntent {
  const style = policy.styles.find(s => s.aliases.some(a => fold(a) === fold(recipe?.style ?? ''))) ?? policy.styles[0];
  const saved = recipe?.hopSolverIntent;
  return { styleId: saved?.styleId ?? style?.id ?? 'free', avoid: saved?.avoid ?? style?.avoid ?? [], chemistry: saved?.chemistry ?? style?.chemistry ?? {},
    keepYeast: saved?.keepYeast ?? !!recipe?.yeast?.name?.trim(), timings: saved?.timings?.filter(t => HOP_TIMINGS.includes(t)).length ? saved.timings : style?.timings ?? ['postFermentation'] };
}

/** Fill a SIMULATION, never a measured record. Every supplied default stays traceable. */
export function prefillHopScenario(triplet: HopTriplet, policy: HopSolverPolicy, recipe?: TrialRecipe, trial?: HopTrial) {
  const result = { ...triplet }, conditions: SolverCondition[] = [];
  if (!triplet.timing) return { triplet: result, conditions };
  const ref = trial?.hops.find(h => h.varietyId === triplet.varietyId && h.timing === triplet.timing);
  for (const field of ['doseGL','temperatureC','contactHours'] as const) {
    if (result[field] !== null) continue;
    if (field === 'contactHours' && ref?.boilStart) {
      // The event is documented; the duration comes from this recipe, not a generic 10 min default.
      if (finite(recipe?.boilMin) && recipe.boilMin > 0) {
        result[field] = recipe.boilMin / 60;
        conditions.push({ field, value: result[field]!, range: { min: result[field]!, max: result[field]! }, origin: 'recipe',
          source: { ...ref.boilStart.source, locator: `${ref.boilStart.source.locator} Application à la durée totale d’ébullition renseignée dans la recette : ${recipe.boilMin} min ; la durée de l’essai reste inconnue.` } });
      }
      continue;
    }
    const observed = ref?.[field];
    if (observed) {
      result[field] = observed.range.min + (observed.range.max-observed.range.min)/2;
      conditions.push({ field, value: result[field]!, range: observed.range, source: observed.source, origin:'trial' });
    } else if (field === 'temperatureC' && triplet.timing === 'fermentation' && finite(recipe?.fermentation?.[0]?.tempC)) {
      result[field] = recipe.fermentation[0].tempC;
      conditions.push({ field, value: result[field]!, range: { min: result[field]!, max: result[field]! }, origin:'recipe',
        source:{...policy.source, title:'Température du premier palier de la recette', kind:'observation', reference:'Recette en cours', locator:'Valeur planifiée saisie dans la recette ; aucune mesure de fermentation supposée.'} });
    } else {
      const proposed = policy.defaults[triplet.timing][field]; result[field] = proposed.central;
      conditions.push({ field, value: proposed.central, range: proposed.range, source: proposed.source, origin:'proposal' });
    }
  }
  return { triplet: result, conditions };
}

/** An excluded family is checked outside the compensable aroma score. */
export function checkHopExclusions(prediction: HopPrediction, avoided: string[], axes: HopAxis[]): SolverCheck[] {
  return avoided.map(id => {
    const axis = axes.find(a => a.id === id), range = prediction.profile[id]?.range;
    if (!axis || !range) return { status:'unknown', message:`${axis?.name ?? id} à éviter : présence non évaluée.` };
    return range.min > axis.lowMax
      ? { status:'conflict', message:`${axis.name} dépasse même dans le scénario bas la classe discrète demandée.`, source:axis.source }
      : range.max > axis.lowMax
        ? { status:'unknown', message:`${axis.name} à éviter : une présence sensible reste possible.`, source:axis.source }
        : { status:'supported', message:`${axis.name} reste dans la classe discrète selon ce modèle.`, source:axis.source };
  });
}

function factsFor(t: HopTriplet, data: HopEngineData) {
  if (t.lotId && !data.lots.some(l => l.id === t.lotId && l.varietyId === t.varietyId)) return [];
  return resolveHopFacts(data.lots.find(l=>l.id===t.lotId), data.varieties.find(v=>v.id===t.varietyId));
}
function chemistryChecks(ts: HopTriplet[], yeast: HopYeast, intent: HopSolverIntent, policy: HopSolverPolicy, data: HopEngineData, trial?: HopTrial): SolverCheck[] {
  const checks: SolverCheck[] = [];
  for (const [goal, preference] of Object.entries(intent.chemistry)) {
    if (goal === 'phenols') {
      const rows = policy.yeastPhenols.filter(p=>p.yeastId===yeast.id), statuses = new Set(rows.map(p=>p.status));
      const p = statuses.size === 1 ? rows[0] : undefined;
      checks.push(!p ? {status:'unknown', message:'Phénols de levure : caractère POF non documenté ou contradictoire pour cette souche.'}
        : {status:(preference==='seek') === (p.status==='positive') ? 'supported':'conflict', source:p.source,
          message:`${yeast.name} : caractère phénolique ${p.status==='positive'?'positif':'négatif'} documenté. Cela ne mesure pas les polyphénols du houblon.`});
      continue;
    }
    const analytes: HopAnalyte[] = goal==='thiols' ? ['3mhFree','3mhaFree','4mmpFree','3mhCys','3mhGsh','4mmpCys','4mmpGsh'] : ['linalool','geraniol','citronellol','myrcene'];
    const facts = ts.flatMap(t=>factsFor(t,data)).filter(f=>analytes.includes(f.analyte) && f.compatible && f.range && f.range.max>0);
    const trialEvidence = trial && policy.trialChemistry.find(r=>r.trialId===trial.id && r.goals.includes(goal as 'thiols'|'terpenes'));
    if (preference==='avoid') {
      checks.push({ status:trialEvidence || facts.some(f=>f.range!.min>0) ? 'conflict':'unknown',
        message:`${goal==='thiols'?'Thiols':'Terpènes'} à éviter : ${trialEvidence?'cette voie est étudiée dans le programme':facts.length?'des composés ou précurseurs sont documentés dans le houblon':'absence non établie'}. Leur concentration finale en bière reste inconnue.`,
        source:trialEvidence?.source ?? facts[0]?.measurement?.source });
    } else if (trialEvidence) checks.push({status:'supported',message:`${goal==='thiols'?'Thiols':'Terpènes'} : programme étudié sur cette voie, sans rendement universel ni intensité garantie.`,source:trialEvidence.source});
    else if (facts.length) checks.push({status:'unknown',message:`${goal==='thiols'?'Thiols/précurseurs':'Terpènes'} présents dans les données du houblon ; effet en bière à confirmer avec cette souche et ce timing.`,source:facts[0].measurement?.source});
    else checks.push({status:'unknown',message:`${goal==='thiols'?'Thiols':'Terpènes'} : analyses de ce houblon manquantes ; aucun potentiel nul ni concentration fabriquée.`});
    if (goal==='thiols' && preference==='seek' && !trialEvidence) checks.push({status:'unknown',message:`β-lyase de ${yeast.name} : ${yeast.betaLyase==='positive'?'activité documentée, rendement non établi':yeast.betaLyase==='negative'?'activité négative documentée ; les thiols libres restent une voie distincte':'inconnue'}.`,source:yeast.source});
  }
  return checks;
}

/** Process observations, separate from aroma intensity and documentary confidence. */
function checkHopAdditionProgram(recipe: TrialRecipe | undefined, hasDryHop: boolean | undefined): SolverCheck[] {
  return !hasDryHop && recipe?.fermentation?.some(s => s.kind === 'ajout' && /houblonnage a cru|dry[ -]?hop/.test(fold(`${s.name} ${s.note ?? ''}`)))
    ? [{ status: 'unknown', message: 'Des paliers annoncent un houblonnage à cru, mais aucun ajout de houblon à cru n’est prévu. Revois le programme de fermentation ; ces notes ne créent pas un ajout ni un effet de biotransformation.' }] : [];
}
export function checkHopFermentation(recipe: TrialRecipe | undefined, yeastId: string | undefined, policy: HopSolverPolicy, hasDryHop = recipe?.hops.some(h => normalizeHop(h).stage === 'dryHop' && (h.weightG > 0 || !finite(h.weightG))), includeAdditionProgram = true) {
  const checks: SolverCheck[] = [];
  if (!recipe) return checks;
  const rows = (policy.yeastConditions ?? []).filter(p => p.yeastId === yeastId), first = rows[0];
  const agreed = first && rows.every(r => r.temperatureC.min === first.temperatureC.min && r.temperatureC.max === first.temperatureC.max);
  checks.push(...fermentationProgramIssues(recipe.fermentation ?? [], agreed ? { range: first.temperatureC, source: first.source } : undefined,
    { pitchTempC: recipe.yeast.pitchTempC, hasDryHop, checkAdditions: includeAdditionProgram }).map(i => ({ status: 'unknown' as const, message: i.message, ...(i.source ? { source: i.source } : {}) })));
  for (const operating of rows) if (operating.warning && !checks.some(c => c.message === operating.warning)) checks.push({ status: 'unknown', message: operating.warning, source: operating.source });
  return checks;
}

export function inspectHopSolverRecipe(recipe: TrialRecipe | undefined, triplets: HopTriplet[], intent: HopSolverIntent, data: HopEngineData, policy: HopSolverPolicy, replacing?: number, predict = createHopPredictor(data), prepared?: {valid:HopKnowledge[];axes:HopAxis[];yeasts:HopYeast[];deferAdditionProgram?:boolean}) {
  const checks: SolverCheck[] = [];
  const valid = prepared?.valid ?? usableHopKnowledge(data.knowledge).valid, axes = prepared?.axes ?? valid.filter((k):k is HopAxis=>k.kind==='axis'), yeasts=prepared?.yeasts ?? withDocumentedYeastNames(valid.filter((k):k is HopYeast=>k.kind==='yeast'));
  const existing = recipe?.hops.flatMap((_,i)=>i===replacing ? [] : [{index:i,...recipeHopScenario(recipe,i,data.varieties,yeasts)!}]) ?? [];
  const yeast = yeasts.find(y=>y.id===triplets[0]?.yeastId);
  for (const old of existing) {
    const t = {...old.triplet, yeastId:triplets[0]?.yeastId ?? old.triplet.yeastId};
    const prediction = predict(t,{});
    checks.push(...checkHopExclusions(prediction,intent.avoid,axes).filter(c=>c.status!=='supported').map(c=>({...c,message:`Déjà dans la recette, ajout ${old.index+1} : ${c.message}`})));
    if (old.proposed.length || !t.varietyId || !t.timing) checks.push({status:'unknown',message:`Ajout ${old.index+1} existant : référence ou phase à confirmer ; son effet ne peut pas être soustrait du nouvel ajout.`});
    if (yeast) checks.push(...chemistryChecks([t],yeast,{...intent,chemistry:Object.fromEntries(Object.entries(intent.chemistry).filter(([,p])=>p==='avoid'))},policy,data).filter(c=>c.status!=='supported').map(c=>({...c,message:`Déjà dans la recette : ${c.message}`})));
  }
  const doses=[...existing.map(h=>h.triplet),...triplets].filter(t=>dry(t.timing));
  const totalDryHopGL = doses.every(t=>finite(t.doseGL)) ? doses.reduce((s,t)=>s+t.doseGL!,0) : null;
  if (totalDryHopGL!==null && totalDryHopGL>policy.dryHopReviewGL.central) checks.push({status:'unknown',message:`Dry-hop cumulé : ${totalDryHopGL.toLocaleString('fr',{maximumFractionDigits:2})} g/L. Revoir l’intérêt de cette dose : augmenter le houblon peut changer l’équilibre vers l’herbacé. Le repère de revue n’est pas un seuil de défaut universel.`,source:policy.dryHopReviewGL.source});
  if (doses.some(t=>t.doseGL!==0)) {
    const risk=valid.find(k=>k.kind==='risk' && k.enabled && k.risk==='hopCreep');
    if (risk?.kind==='risk') checks.push({status:'unknown',message:`Hop creep possible avec ce houblonnage à cru. ${risk.advice}`,source:risk.source});
  }
  if (recipe?.yeast?.name && yeast && !(recipe.yeast.hopIndexId ? recipe.yeast.hopIndexId===yeast.id : findRecipeYeastMatches(recipe.yeast.name,[yeast]).length)) checks.push({status:'unknown',message:`La souche proposée remplace ${recipe.yeast.name} pour toute la bière. Quantité de levure et programme de fermentation à revoir ; les autres houblons restent présents.`});
  const hasDryHop = doses.some(t => t.doseGL !== 0);
  checks.push(...checkHopFermentation(recipe, yeast?.id, policy, hasDryHop, !prepared?.deferAdditionProgram));
  if (existing.length) checks.push({status:'unknown',message:'Les ajouts existants sont conservés et leurs conflits sont vérifiés. Aucun profil total n’est obtenu en additionnant leurs graphes.'});
  return {checks,totalDryHopGL,hasDryHop};
}

export function compareHopSolverCandidates(a: HopSolverCandidate,b: HopSolverCandidate): number {
  const conflicts=(c:HopSolverCandidate)=>c.checks.filter(k=>k.status==='conflict').length+c.recipeChecks.filter(k=>k.status==='conflict').length;
  const unresolved=(c:HopSolverCandidate)=>c.checks.filter(k=>k.status==='unknown').length;
  return conflicts(a)-conflicts(b) || unresolved(a)-unresolved(b)
    || b.evidenceFamilies.length-a.evidenceFamilies.length
    || compareHopPredictions({...a.predictions[0],score:a.score},{...b.predictions[0],score:b.score})
    || (a.totalDryHopGL??Infinity)-(b.totalDryHopGL??Infinity) || a.id.localeCompare(b.id);
}

export interface HopSolverSearchOptions {
  data: HopEngineData; policy: HopSolverPolicy; intent: HopSolverIntent; target: Record<string,HopRange>; recipe?:TrialRecipe;
  doseGL?:number; temperatureC?:number; contactHours?:number; replacing?:number;
  mode?: HopSearchMode;
}
/** Finite, explicit search domain. Qualitative trials are never fitted as numbers. */
export function createHopSolverSearch(options: HopSolverSearchOptions) {
  const {data,policy,intent,target,recipe}=options;
  const predict = createHopPredictor(data);
  const valid=usableHopKnowledge(data.knowledge).valid, axes=valid.filter((k):k is HopAxis=>k.kind==='axis'), allYeasts=withDocumentedYeastNames(valid.filter((k):k is HopYeast=>k.kind==='yeast'));
  const models=valid.filter((k):k is HopExtrapolation=>k.kind==='extrapolation' && k.enabled), trials=valid.filter((k):k is HopTrial=>k.kind==='trial');
  const yeastMatches=recipe?.yeast.name ? findRecipeYeastMatches(recipe.yeast.name,allYeasts) : [];
  const currentYeast=recipe?.yeast.hopIndexId ?? (yeastMatches.length===1 ? yeastMatches[0].item.id : undefined);
  const eligibleYeasts=intent.keepYeast && recipe?.yeast.name ? allYeasts.filter(y=>y.id===currentYeast) : allYeasts;
  const yeastById=new Map(allYeasts.map(y=>[y.id,y])),varietyById=new Map(data.varieties.map(v=>[v.id,v]));
  const descriptorCache=new Map<string,Set<string>>(),lexicalCache=createHopExtrapolationCache();
  const descriptorFamilies=(id:string)=>{
    let found=descriptorCache.get(id);
    if(!found){const v=varietyById.get(id);found=new Set<string>();if(v)for(const m of models)for(const a of m.axes)if(!found.has(a.id)&&hopDescriptorEvidence(v,a.terms,lexicalCache).length)found.add(a.id);descriptorCache.set(id,found);}
    return found;
  };
  const wanted=Object.keys(target).filter(id=>!intent.avoid.includes(id));
  const scoreTarget=Object.fromEntries(Object.entries(target).filter(([id])=>!intent.avoid.includes(id)));
  const queue:{triplets:HopTriplet[];conditions:SolverCondition[][];trial?:HopTrial}[]=[];
  const make=(v:HopVariety,y:HopYeast,t:HopTriplet['timing'],dose:number|null,trial?:HopTrial)=>prefillHopScenario({varietyId:v.id,yeastId:y.id,timing:t,doseGL:options.doseGL??dose,temperatureC:options.temperatureC??null,contactHours:options.contactHours??null,matrixId:null,lotId:null},policy,recipe,trial);
  for (const trial of trials) {
    const y=eligibleYeasts.find(y=>y.id===trial.yeastId);
    if (!y || trial.hops.some(h=>!intent.timings.includes(h.timing))) continue;
    const filled=trial.hops.map(h=>{const v=data.varieties.find(v=>v.id===h.varietyId && !v.archived);return v?make(v,y,h.timing,null,trial):null;});
    if (filled.every(x=>x!==null)) queue.push({trial,triplets:filled.map(x=>x!.triplet),conditions:filled.map(x=>x!.conditions)});
  }
  // Index the full Cartesian domain without allocating every scenario upfront.
  const conditions=intent.timings.flatMap(timing=>(options.doseGL!==undefined?[options.doseGL]:policy.defaults[timing].searchDosesGL.map(p=>p.central)).map(dose=>({timing,dose})));
  const domain=selectHopSearchDomain({mode:options.mode??'quick',varieties:data.varieties.filter(v=>!v.archived),yeasts:eligibleYeasts,valid,policy,intent,wanted,
    conditions:conditions.length,trials:queue.length,currentYeast,recipeVarieties:new Set(recipe?.hops.map(h=>h.hopVarietyId).filter((id):id is string=>!!id)??[]),
    primaryTemperature:recipe?.fermentation?.[0]?.tempC,descriptorFamilies});
  const {varieties,yeasts,coverage}=domain,total=coverage.total;
  const itemAt=(index:number):typeof queue[number]=>{
    if(index<queue.length)return queue[index];
    const offset=index-queue.length, variant=conditions[offset%conditions.length];
    const pair=Math.floor(offset/conditions.length);
    const f=make(varieties[Math.floor(pair/yeasts.length)],yeasts[pair%yeasts.length],variant.timing,variant.dose);
    return {triplets:[f.triplet],conditions:[f.conditions]};
  };
  const recipeCache=new Map<string,ReturnType<typeof inspectHopSolverRecipe>>();
  const evaluate=(item:typeof queue[number]):HopSolverCandidate=>{
    const predictions=item.triplets.map(t=>predict(t,scoreTarget));
    const yeast=yeastById.get(item.triplets[0].yeastId!)!;
    const checks=predictions.flatMap(p=>checkHopExclusions(p,intent.avoid,axes));
    for (const t of item.triplets) {
      if (!finite(t.doseGL)) checks.push({status:'unknown',message:'Dose manquante : quantité totale et application indisponibles.'});
      if (t.doseGL !== null && (!finite(t.doseGL) || t.doseGL < 0) || t.contactHours !== null && (!finite(t.contactHours) || t.contactHours < 0) || t.temperatureC !== null && (!finite(t.temperatureC) || t.temperatureC < -273.15)) checks.push({status:'conflict',message:'Condition de procédé invalide : corrige la dose, la durée ou la température.'});
    }
    for (const id of intent.avoid) if (target[id] && target[id].min > (axes.find(a=>a.id===id)?.lowMax ?? Infinity)) checks.push({status:'conflict',message:`${axes.find(a=>a.id===id)?.name ?? id} : le profil recherché et l’exclusion se contredisent.`,source:policy.source});
    for(const id of intent.avoid){
      const axis=axes.find(a=>a.id===id);
      if(item.trial?.families.includes(id)) checks.push({status:'conflict',message:`${axis?.name??id} figure dans le résultat de cet essai et dans tes exclusions.`,source:item.trial.source});
      else if(item.triplets.some(t=>descriptorFamilies(t.varietyId??'').has(id))) checks.push({status:'conflict',message:`${axis?.name??id} est cité dans une fiche du houblon. Cette piste n’est pas retenue pour l’exclure.`,source:policy.source});
    }
    checks.push(...chemistryChecks(item.triplets,yeast,intent,policy,data,item.trial));
    // Re-evaluate existing additions once per yeast. Proposed dry-hop totals are
    // separate, so no candidate inherits another one's dose or warnings.
    const cacheKey=yeast.id;
    let common=recipeCache.get(cacheKey);
    if(!common){common=inspectHopSolverRecipe(recipe,[{...item.triplets[0],doseGL:0,timing:'boil'}],intent,data,policy,options.replacing,predict,{valid,axes,yeasts:allYeasts,deferAdditionProgram:true});recipeCache.set(cacheKey,common);}
    const proposedDry = item.triplets.filter(t=>dry(t.timing));
    const total=common.totalDryHopGL===null || proposedDry.some(t=>!finite(t.doseGL)) ? null : common.totalDryHopGL+proposedDry.reduce((s,t)=>s+t.doseGL!,0);
    const recipeChecks=[...common.checks];
    // Event-dependent observations cannot be cached under the strain alone.
    recipeChecks.push(...checkHopAdditionProgram(recipe, common.hasDryHop || proposedDry.some(t=>t.doseGL!==0)));
    if(total!==null && total>policy.dryHopReviewGL.central && !(common.totalDryHopGL!==null && common.totalDryHopGL>policy.dryHopReviewGL.central)) recipeChecks.push({status:'unknown',message:`Dry-hop cumulé proposé : ${total.toLocaleString('fr',{maximumFractionDigits:2})} g/L. Revoir le rendement aromatique et le risque de caractère herbacé, sans seuil universel.`,source:policy.dryHopReviewGL.source});
    for(const risk of predictions.flatMap(p=>p.risks).filter(r=>r.status!=='unknown')) recipeChecks.push({status:'unknown',message: risk.message,source:risk.source});
    const evidenceFamilies=item.trial?wanted.filter(id=>item.trial!.families.includes(id)):wanted.filter(id=>item.triplets.some(t=>descriptorFamilies(t.varietyId??'').has(id)));
    return {id: item.trial?.id ?? JSON.stringify(item.triplets),...item,predictions,checks,recipeChecks,score:predictions.length===1?predictions[0].score:unknownScore(),evidenceFamilies,totalDryHopGL:total};
  };
  return {total,coverage,emptyReason:!yeasts.length?'La levure de la recette n’est pas identifiée. Associe sa référence ou autorise une autre souche.':null,
    evaluateProgram:evaluate, evaluateBatch:(from:number,count:number)=>{
      const start=Math.max(0,Math.floor(from)),end=Math.min(total,start+Math.max(0,Math.floor(count)));
      return Array.from({length:Math.max(0,end-start)},(_,i)=>evaluate(itemAt(start+i)));
    }};
}

/** Preserve the best distinct combinations while examining every candidate. */
export function retainHopSolverCandidate(rows:HopSolverCandidate[],candidate:HopSolverCandidate,key:(c:HopSolverCandidate)=>string,limit:number) {
  const index=rows.findIndex(c=>key(c)===key(candidate));
  if(index>=0){if(compareHopSolverCandidates(candidate,rows[index])>=0)return;rows.splice(index,1);}
  rows.push(candidate);rows.sort(compareHopSolverCandidates);rows.splice(limit);
}

export function applyHopSolverCandidate<T extends TrialRecipe>(recipe:T,candidate:HopSolverCandidate,data:HopEngineData,intent:HopSolverIntent,replacing?:number):T {
  if ([...candidate.checks,...candidate.recipeChecks].some(c=>c.status==='conflict')) throw Error('Résous les contraintes en conflit avant d’appliquer ce programme.');
  const yeast=withDocumentedYeastNames(data.knowledge.filter((k):k is HopYeast=>k.kind==='yeast')).find(k=>k.id===candidate.triplets[0]?.yeastId);
  if(!yeast) throw Error('Souche indisponible.');
  let next=recipe;
  candidate.triplets.forEach((t,i)=>{const v=data.varieties.find(v=>v.id===t.varietyId);if(!v)throw Error('Houblon indisponible.');next=applyHopScenario(next,i===0&&replacing!==undefined?replacing:next.hops.length,t,v,yeast);});
  return {...next,hopSolverIntent:intent,...(candidate.trial?{hopTrialId:candidate.trial.id}:{})};
}
