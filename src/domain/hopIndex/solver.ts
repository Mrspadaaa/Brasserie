import { hopDescriptorEvidence } from '../../../functions/src/hopExtrapolationCore';
import type { HopExtrapolation } from '../../../functions/src/hopExtrapolationSchema';
import type { HopAnalyte, HopRange, HopSource, HopVariety } from '../../../functions/src/hopIndexSchema';
import { HOP_TIMINGS, type HopAxis, type HopEstimate, type HopPrediction, type HopTriplet, type HopYeast } from '../../../functions/src/hopPredictionSchema';
import type { HopSolverIntent, HopSolverPolicy } from '../../../functions/src/hopSolverSchema';
import type { HopTrial } from '../../../functions/src/hopTrialSchema';
import { compareHopPredictions, createHopPredictor, usableHopKnowledge, type HopEngineData } from './engine';
import { resolveHopFacts } from '../../../functions/src/hopIndexFacts';
import { applyHopScenario, recipeHopScenario } from './exploration';
import { findRecipeYeastMatches, withDocumentedYeastNames } from './recipeGuide';
import type { TrialRecipe } from './trials';

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

export function inspectHopSolverRecipe(recipe: TrialRecipe | undefined, triplets: HopTriplet[], intent: HopSolverIntent, data: HopEngineData, policy: HopSolverPolicy, replacing?: number, predict = createHopPredictor(data)) {
  const checks: SolverCheck[] = [];
  const valid = usableHopKnowledge(data.knowledge).valid, axes = valid.filter((k):k is HopAxis=>k.kind==='axis'), yeasts=withDocumentedYeastNames(valid.filter((k):k is HopYeast=>k.kind==='yeast'));
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
  for (const operating of policy.yeastConditions ?? []) if (operating.yeastId === yeast?.id) {
    for (const [index, step] of (recipe?.fermentation ?? []).entries()) if (finite(step.tempC) && (step.tempC < operating.temperatureC.min || step.tempC > operating.temperatureC.max)) checks.push({status:'unknown',message:`Palier ${index+1} à ${step.tempC} °C : hors plage fabricant ${operating.temperatureC.min}–${operating.temperatureC.max} °C de ${yeast.name}. Un refroidissement de garde peut être volontaire ; vérifier la phase de fermentation.`,source:operating.source});
    if (operating.warning) checks.push({status:'unknown',message:operating.warning,source:operating.source});
  }
  if (existing.length) checks.push({status:'unknown',message:'Les ajouts existants sont conservés et leurs conflits sont vérifiés. Aucun profil total n’est obtenu en additionnant leurs graphes.'});
  return {checks,totalDryHopGL};
}

export function compareHopSolverCandidates(a: HopSolverCandidate,b: HopSolverCandidate): number {
  const conflicts=(c:HopSolverCandidate)=>c.checks.filter(k=>k.status==='conflict').length+c.recipeChecks.filter(k=>k.status==='conflict').length;
  const unresolved=(c:HopSolverCandidate)=>c.checks.filter(k=>k.status==='unknown').length;
  return conflicts(a)-conflicts(b) || unresolved(a)-unresolved(b)
    || b.evidenceFamilies.length-a.evidenceFamilies.length
    || compareHopPredictions({...a.predictions[0],score:a.score},{...b.predictions[0],score:b.score})
    || (a.totalDryHopGL??Infinity)-(b.totalDryHopGL??Infinity) || a.id.localeCompare(b.id);
}

/** Finite, explicit search domain. Qualitative trials are never fitted as numbers. */
export function createHopSolverSearch(options: {
  data: HopEngineData; policy: HopSolverPolicy; intent: HopSolverIntent; target: Record<string,HopRange>; recipe?:TrialRecipe;
  doseGL?:number; temperatureC?:number; contactHours?:number; replacing?:number;
}) {
  const {data,policy,intent,target,recipe}=options;
  const predict = createHopPredictor(data);
  const valid=usableHopKnowledge(data.knowledge).valid, axes=valid.filter((k):k is HopAxis=>k.kind==='axis'), allYeasts=withDocumentedYeastNames(valid.filter((k):k is HopYeast=>k.kind==='yeast'));
  const models=valid.filter((k):k is HopExtrapolation=>k.kind==='extrapolation' && k.enabled), trials=valid.filter((k):k is HopTrial=>k.kind==='trial');
  const yeastMatches=recipe?.yeast.name ? findRecipeYeastMatches(recipe.yeast.name,allYeasts) : [];
  const currentYeast=recipe?.yeast.hopIndexId ?? (yeastMatches.length===1 ? yeastMatches[0].item.id : undefined);
  const yeasts=intent.keepYeast && recipe?.yeast.name ? allYeasts.filter(y=>y.id===currentYeast) : allYeasts;
  const wanted=Object.keys(target).filter(id=>!intent.avoid.includes(id));
  const scoreTarget=Object.fromEntries(Object.entries(target).filter(([id])=>!intent.avoid.includes(id)));
  const queue:{triplets:HopTriplet[];conditions:SolverCondition[][];trial?:HopTrial}[]=[];
  const make=(v:HopVariety,y:HopYeast,t:HopTriplet['timing'],dose:number|null,trial?:HopTrial)=>prefillHopScenario({varietyId:v.id,yeastId:y.id,timing:t,doseGL:options.doseGL??dose,temperatureC:options.temperatureC??null,contactHours:options.contactHours??null,matrixId:null,lotId:null},policy,recipe,trial);
  for (const trial of trials) {
    const y=yeasts.find(y=>y.id===trial.yeastId);
    if (!y || trial.hops.some(h=>!intent.timings.includes(h.timing))) continue;
    const filled=trial.hops.map(h=>{const v=data.varieties.find(v=>v.id===h.varietyId && !v.archived);return v?make(v,y,h.timing,null,trial):null;});
    if (filled.every(x=>x!==null)) queue.push({trial,triplets:filled.map(x=>x!.triplet),conditions:filled.map(x=>x!.conditions)});
  }
  for (const v of data.varieties.filter(v=>!v.archived)) for(const y of yeasts) for(const timing of intent.timings) {
    const doses=options.doseGL!==undefined?[options.doseGL]:policy.defaults[timing].searchDosesGL.map(p=>p.central);
    for(const dose of doses){const f=make(v,y,timing,dose);queue.push({triplets:[f.triplet],conditions:f.conditions.length?[f.conditions]:[[]]});}
  }
  const recipeCache=new Map<string,ReturnType<typeof inspectHopSolverRecipe>>();
  const evaluate=(item:typeof queue[number]):HopSolverCandidate=>{
    const predictions=item.triplets.map(t=>predict(t,scoreTarget));
    const yeast=allYeasts.find(y=>y.id===item.triplets[0].yeastId)!;
    const checks=predictions.flatMap(p=>checkHopExclusions(p,intent.avoid,axes));
    for (const t of item.triplets) {
      if (!finite(t.doseGL)) checks.push({status:'unknown',message:'Dose manquante : quantité totale et application indisponibles.'});
      if (t.doseGL !== null && (!finite(t.doseGL) || t.doseGL < 0) || t.contactHours !== null && (!finite(t.contactHours) || t.contactHours < 0) || t.temperatureC !== null && (!finite(t.temperatureC) || t.temperatureC < -273.15)) checks.push({status:'conflict',message:'Condition de procédé invalide : corrige la dose, la durée ou la température.'});
    }
    for (const id of intent.avoid) if (target[id] && target[id].min > (axes.find(a=>a.id===id)?.lowMax ?? Infinity)) checks.push({status:'conflict',message:`${axes.find(a=>a.id===id)?.name ?? id} : le profil recherché et l’exclusion se contredisent.`,source:policy.source});
    for(const id of intent.avoid){
      const axis=axes.find(a=>a.id===id);
      if(item.trial?.families.includes(id)) checks.push({status:'conflict',message:`${axis?.name??id} figure dans le résultat de cet essai et dans tes exclusions.`,source:item.trial.source});
      else if(item.triplets.some(t=>{const v=data.varieties.find(v=>v.id===t.varietyId);return v&&models.some(m=>hopDescriptorEvidence(v,m.axes.find(a=>a.id===id)?.terms??[]).length)})) checks.push({status:'conflict',message:`${axis?.name??id} est cité dans une fiche du houblon. Cette piste n’est pas retenue pour l’exclure.`,source:policy.source});
    }
    checks.push(...chemistryChecks(item.triplets,yeast,intent,policy,data,item.trial));
    // Re-evaluate existing additions once per yeast. Proposed dry-hop totals are
    // separate, so no candidate inherits another one's dose or warnings.
    const cacheKey=yeast.id;
    let common=recipeCache.get(cacheKey);
    if(!common){common=inspectHopSolverRecipe(recipe,[{...item.triplets[0],doseGL:0,timing:'boil'}],intent,data,policy,options.replacing,predict);recipeCache.set(cacheKey,common);}
    const proposedDry = item.triplets.filter(t=>dry(t.timing));
    const total=common.totalDryHopGL===null || proposedDry.some(t=>!finite(t.doseGL)) ? null : common.totalDryHopGL+proposedDry.reduce((s,t)=>s+t.doseGL!,0);
    const recipeChecks=[...common.checks];
    if(total!==null && total>policy.dryHopReviewGL.central && !(common.totalDryHopGL!==null && common.totalDryHopGL>policy.dryHopReviewGL.central)) recipeChecks.push({status:'unknown',message:`Dry-hop cumulé proposé : ${total.toLocaleString('fr',{maximumFractionDigits:2})} g/L. Revoir le rendement aromatique et le risque de caractère herbacé, sans seuil universel.`,source:policy.dryHopReviewGL.source});
    for(const risk of predictions.flatMap(p=>p.risks).filter(r=>r.status!=='unknown')) recipeChecks.push({status:'unknown',message: risk.message,source:risk.source});
    const evidenceFamilies=item.trial?wanted.filter(id=>item.trial!.families.includes(id)):wanted.filter(id=>item.triplets.some(t=>{const v=data.varieties.find(v=>v.id===t.varietyId);return v&&models.some(m=>hopDescriptorEvidence(v,m.axes.find(a=>a.id===id)?.terms??[]).length)}));
    return {id: item.trial?.id ?? JSON.stringify(item.triplets),...item,predictions,checks,recipeChecks,score:predictions.length===1?predictions[0].score:unknownScore(),evidenceFamilies,totalDryHopGL:total};
  };
  return {total:queue.length,emptyReason:!yeasts.length?'La levure de la recette n’est pas identifiée. Associe sa référence ou autorise une autre souche.':null,
    evaluateProgram:evaluate, evaluateBatch:(from:number,count:number)=>queue.slice(from,from+count).map(evaluate)};
}

export function applyHopSolverCandidate<T extends TrialRecipe>(recipe:T,candidate:HopSolverCandidate,data:HopEngineData,intent:HopSolverIntent,replacing?:number):T {
  if ([...candidate.checks,...candidate.recipeChecks].some(c=>c.status==='conflict')) throw Error('Résous les contraintes en conflit avant d’appliquer ce programme.');
  const yeast=withDocumentedYeastNames(data.knowledge.filter((k):k is HopYeast=>k.kind==='yeast')).find(k=>k.id===candidate.triplets[0]?.yeastId);
  if(!yeast) throw Error('Souche indisponible.');
  let next=recipe;
  candidate.triplets.forEach((t,i)=>{const v=data.varieties.find(v=>v.id===t.varietyId);if(!v)throw Error('Houblon indisponible.');next=applyHopScenario(next,i===0&&replacing!==undefined?replacing:next.hops.length,t,v,yeast);});
  return {...next,hopSolverIntent:intent,...(candidate.trial?{hopTrialId:candidate.trial.id}:{})};
}
