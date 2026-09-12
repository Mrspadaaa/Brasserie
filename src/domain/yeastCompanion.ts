import type { HopSource } from '../../functions/src/hopIndexSchema';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';
import type { FermentationGoal } from '../../functions/src/fermentationGuideSchema';
import type { YeastCatalogueFact } from '../../functions/src/yeastCatalogueSchema';
import type { TrialRecipe } from './hopIndex/trials';
import { yeastReferences } from './yeastReferences';
import { resolveFermentationYeast } from './fermentationScenario';
import { normalizeHop } from './hopStage';
import { yeastStrainInformation, yeastFactValue } from './yeastStrainInformation';
import type { YeastPracticalNote } from '../data/yeastPracticalGuides';
import {
  createYeastRecipeDraft, evaluateYeastRecipeDesign, inferYeastRecipeStyle, proposeYeastGoalSettings,
  readYeastRecipeDesign, yeastRecipeCandidates, yeastRecipeDesignChanged, yeastRecipeHopSummary,
  YEAST_RECIPE_GOAL_LABELS, YEAST_STYLE_FAMILIES,
  type YeastRecipeCandidate, type YeastRecipeEvaluation, type YeastRecipeGoal, type YeastStyleId
} from './yeastRecipeDesign';

export interface YeastCompanionOptions {
  goal?: FermentationGoal | YeastRecipeGoal;
  yeastId?: string;
  /** An explicit scenario input, never a claim that the OG was measured. */
  og?: number | null;
  maxAlternatives?: number;
}
export interface YeastCompanionMissing { id: string; section: 'style' | 'yeast' | 'fermentation' | 'mash' | 'hops' | 'recipe'; detail: string }
type DocumentaryRange = NonNullable<YeastRecipeCandidate['temperature']>;
type CompanionCandidate = {
  yeastId: string; label: string; lab: string; form: string | null; descriptor: string; reason: string;
  preferred: boolean; temperatureC: DocumentaryRange | null; attenuationPct: DocumentaryRange | null;
  dryDoseG: DocumentaryRange | null; observations: YeastCatalogueFact[]; observationsLimited: boolean; sources: HopSource[];
  practicalNotes: YeastPracticalNote[]; practicalNotesLimited: boolean;
  preparationStatus: 'documented' | 'confirm-form' | 'not-documented';
};
type RequestStatus<T> = { value: T | null; status: 'not-requested' | 'accepted' | 'rejected'; reason: string | null };
export interface YeastCompanionData {
  version: 'yeast-companion-1'; mode: 'recipe' | 'nolo' | 'no-recipe'; readOnly: true;
  style: {
    recipeStyle: string | null; reference: { guideId: string; version: string; styleId: string } | null;
    recipeFamily: YeastStyleId; comparisonFamily: YeastStyleId;
    comparisonOrigin: 'adopted-filter' | 'recipe-style' | 'unknown';
  };
  adoptedIntent: {
    modelVersion: string; yeastId: string; comparisonFamily: YeastStyleId; goal: YeastRecipeGoal;
    pressureBar: number | null; ferulicRest: boolean; stale: boolean; applicable: boolean;
  } | null;
  snapshotStatus: 'none' | 'current' | 'stale' | 'invalid';
  current: {
    volumeL: number | null; ogTarget: number | null; fgTarget: number | null; abvTarget: number | null;
    yeast: { name: string; explicitId: string | null; resolvedId: string | null; referenceName: string | null; lab: string | null; form: string | null;
      quantity: { value: number | null; unit: string | null; status: 'known' | 'missing' | 'invalid'; grams: number | null }; pitchTempC: number | null };
    pressure: { plannedBar: number | null; unit: 'bar-relative'; origin: 'adopted-intent' | 'unknown'; measured: false };
    fermentation: { name: string; kind: string | null; tempC: number | null; days: number | null; note: string | null }[];
    mash: { name: string; tempC: number | null; durationMin: number | null }[];
    hops: { name: string; stage: string | null; stageOrigin: 'explicit' | 'legacy-label' | 'unknown'; weightG: number | null; doseGL: number | null;
      dayOffset: number | null; biologicalContext: 'active' | 'post' | 'unknown' | 'not-dry-hop'; contactHours: number | null;
      temperatureC: number | null; boilTimeMin: number | null; varietyId: string | null; lotId: string | null }[];
    dryHop: { totalG: number | null; doseGL: number | null; activeG: number | null; postG: number | null; unknownG: number | null; unknownCount: number };
  } | null;
  request: {
    goal: RequestStatus<string> & { mappedGoal: YeastRecipeGoal | null };
    yeastId: RequestStatus<string>;
    og: RequestStatus<number>;
  };
  analysis: {
    yeastId: string | null; goal: YeastRecipeGoal | null; goalOrigin: 'adopted' | 'style-default' | 'explicit-request' | 'unknown';
    scenario: boolean; og: number | null; gravityOrigin: 'recipe-target-not-measured' | 'explicit-scenario-not-certified';
    candidate: CompanionCandidate | null; effects: YeastRecipeEvaluation['effects'];
    finalGravity: YeastRecipeEvaluation['fg']; abv: YeastRecipeEvaluation['abv'];
    proposedSettings: ReturnType<typeof proposeYeastGoalSettings> | null;
    /** Consequences of comparing another strain; the optional preset patch remains a separate proposal. */
    proposedChanges: YeastRecipeEvaluation['changes']; warnings: string[]; errors: string[];
  } | null;
  alternatives: CompanionCandidate[]; alternativeCount: number; alternativesLimited: boolean;
  missingData: YeastCompanionMissing[]; limits: string[]; sources: HopSource[];
}

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const value = (n: unknown): number | null => finite(n) ? n : null;
const positive = (n: unknown): n is number => finite(n) && n > 0;
const text = (s: unknown): string | null => typeof s === 'string' && s.trim() ? s : null;
const familyLabel = (id: YeastStyleId) => YEAST_STYLE_FAMILIES.find(f => f.id === id)?.label ?? 'Inconnue';
const distinctSources = (rows: HopSource[]) => [...new Map(rows.map(s => [s.reference, s])).values()];
const candidateData = (c: YeastRecipeCandidate, actualForm: YeastRecipeCandidate['reference']['form']): CompanionCandidate => {
  const information = yeastStrainInformation(c.reference, actualForm);
  const facts = information?.observations.filter(f => ['temperature', 'attenuation', 'pitchRate', 'pof', 'sta1', 'diastatic', 'flocculation', 'alcoholTolerance', 'aroma', 'esters', 'higherAlcohols', 'betaLyase', 'biotransformation', 'application', 'foam', 'nutrientNeed', 'h2s', 'fermentationRate', 'fermentationTime'].includes(f.key)) ?? [];
  const observations = facts.slice(0, 24);
  const allNotes = [...information?.practical ?? [], ...information?.behaviour ?? []];
  const practicalNotes = allNotes.slice(0, 8);
  return { yeastId: c.yeastId, label: c.label, lab: c.lab, form: c.reference.form ?? null,
    descriptor: c.descriptor, reason: c.reason, preferred: c.preferred,
    temperatureC: c.temperature ?? null, attenuationPct: c.attenuation ?? null, dryDoseG: c.doseG ?? null,
    observations, observationsLimited: observations.length < facts.length,
    practicalNotes, practicalNotesLimited: practicalNotes.length < allNotes.length,
    preparationStatus: information?.preparationWithheld ? 'confirm-form' : information?.preparationDocumented ? 'documented' : 'not-documented',
    sources: distinctSources([...c.sources, ...observations.map(f => f.source), ...practicalNotes.map(n => n.source)]) };
};
const goalMap: Record<string, YeastRecipeGoal> = {
  balanced: 'balanced', banana: 'banana', clove: 'clove', fruit: 'fruit', clean: 'clean', dry: 'dry', hops: 'hops',
  phenolic: 'clove', thiols: 'hops'
};
const requestStatus = <T>(v: T | undefined): RequestStatus<T> => ({ value: v ?? null, status: 'not-requested', reason: null });
const baseLimits = [
  'Les consignes, quantités, jours et objectifs décrivent une recette prévue, pas des mesures du brassin.',
  'Les alternatives restent dans la famille de comparaison retenue. Un descripteur fabricant ne classe pas toutes les levures par goût.',
  'Le statut ancien/courant compare les champs enregistrés du scénario (style, souche, volume, fermentation et empâtage). Houblons et DI sont toujours relus dans la recette actuelle.',
  'Aucune intensité de banane, girofle ou fruité n’est calculée. Plages documentaires et effets qualitatifs ne garantissent ni le goût ni la fin de fermentation.',
  'Cet aperçu ne modifie aucune recette. Un autre objectif, une autre souche ou un réglage proposé doit être prévisualisé et adopté explicitement.'
];

/** Pure read adapter. Personal records are resolved by the same catalogue as the editor, including invalid records masking defaults. */
export function buildYeastCompanion(recipe: TrialRecipe | null | undefined, knowledge: HopKnowledge[] = [], options: YeastCompanionOptions = {}): YeastCompanionData {
  const request: YeastCompanionData['request'] = {
    goal: { ...requestStatus(typeof options.goal === 'string' ? options.goal : undefined), mappedGoal: null },
    yeastId: requestStatus(typeof options.yeastId === 'string' ? options.yeastId : undefined),
    og: requestStatus(options.og === null || finite(options.og) ? options.og : undefined)
  };
  const missingData: YeastCompanionMissing[] = [];
  const missing = (id: string, section: YeastCompanionMissing['section'], detail: string) => missingData.push({ id, section, detail });
  const empty: YeastCompanionData = {
    version: 'yeast-companion-1', mode: 'no-recipe', readOnly: true,
    style: { recipeStyle: null, reference: null, recipeFamily: 'unknown', comparisonFamily: 'unknown', comparisonOrigin: 'unknown' },
    adoptedIntent: null, snapshotStatus: 'none', current: null, request, analysis: null,
    alternatives: [], alternativeCount: 0, alternativesLimited: false, missingData, limits: [...baseLimits], sources: []
  };
  if (!recipe) {
    missing('recipe', 'recipe', 'Une recette et son style sont nécessaires pour proposer des alternatives adaptées.');
    for (const [key, supplied] of [['goal', options.goal], ['yeastId', options.yeastId], ['og', options.og]] as const) if (supplied !== undefined) {
      request[key].status = 'rejected'; request[key].reason = 'Recette absente : aucun scénario de brassage n’est fabriqué.';
    }
    return empty;
  }
  const refs = yeastReferences(knowledge), resolved = resolveFermentationYeast(recipe, refs);
  const currentDraft = createYeastRecipeDraft(recipe, refs), snapshot = readYeastRecipeDesign(recipe);
  const hasSnapshot = recipe.yeastDesign !== undefined, stale = !!snapshot && yeastRecipeDesignChanged(recipe, snapshot);
  const comparisonFamily = currentDraft.styleId, recipeFamily = inferYeastRecipeStyle(recipe);
  const allowedGoals = YEAST_STYLE_FAMILIES.find(f => f.id === comparisonFamily)?.goals ?? [];
  const adopted = !!snapshot && snapshot.yeastId === resolved?.id && snapshot.styleId === comparisonFamily &&
    snapshot.goal === currentDraft.goal && allowedGoals.includes(snapshot.goal);
  const nolo = recipe.nolo?.enabled === true;
  if (hasSnapshot && !snapshot) missing('yeastDesign', 'yeast', 'L’intention enregistrée est invalide ou provient d’un modèle non reconnu ; elle n’est pas reconstituée.');
  if (snapshot && !allowedGoals.includes(currentDraft.goal)) missing('yeastDesign.goal', 'yeast', 'L’ancien objectif ne correspond pas à la famille actuelle ; il reste une trace, sans devenir une instruction de scénario.');
  if (comparisonFamily === 'unknown') missing('style.family', 'style', 'La famille de style est inconnue. Choisir une famille avant de demander une liste de souches.');
  if (!resolved) missing('yeast.reference', 'yeast', 'La souche actuelle n’est pas identifiée sans ambiguïté ; aucun ID voisin n’est substitué.');
  if (!recipe.yeast.form) missing('yeast.form', 'yeast', 'Forme de la levure à renseigner.');
  if (resolved?.form && recipe.yeast.form && resolved.form !== recipe.yeast.form) missing('yeast.formMismatch', 'yeast', 'La forme actuelle diffère de la référence documentée ; confirmer le produit avant de transférer ses repères de dose.');
  const qty = recipe.yeast.qty;
  const quantityStatus = qty === undefined || qty === null || qty === 0 ? 'missing' : positive(qty) ? 'known' : 'invalid';
  if (quantityStatus !== 'known') missing('yeast.quantity', 'yeast', 'Quantité de levure absente ou invalide ; le zéro du champ ne constitue pas une dose recommandée.');
  if (recipe.yeast.form === 'sèche' && recipe.yeast.unit !== 'g') missing('yeast.grams', 'yeast', 'La quantité actuelle n’est pas en grammes ; aucune masse de sachet n’est supposée.');
  if (recipe.yeast.form === 'liquide' || recipe.yeast.form === 'levain') missing('yeast.viableCells', 'yeast', 'Taux cible et cellules viables non fournis : flacons, mL et âge ne donnent pas un inoculum viable.');
  if (currentDraft.pressureBar === undefined) missing('yeast.pressure', 'fermentation', 'Pression précoce prévue inconnue ; elle n’est pas assimilée à 0 bar.');
  if (!positive(recipe.volumeL)) missing('volumeL', 'recipe', 'Volume de moût à ensemencer absent ou invalide.');
  if (!finite(recipe.ogTarget) || recipe.ogTarget <= 1 || recipe.ogTarget > 1.25) missing('ogTarget', 'recipe', 'DI prévue en SG absente ou hors du domaine 1,000–1,250 ; aucune densité mesurée n’est déduite.');
  if (!recipe.fermentation?.some(s => s.kind === 'primaire')) missing('fermentation.primary', 'fermentation', 'Aucune phase principale renseignée.');
  const fermentation = (recipe.fermentation ?? []).map((s, i) => {
    if (!finite(s.tempC)) missing(`fermentation.${i}.temperature`, 'fermentation', `${s.name || 'Phase'} : température inconnue.`);
    if (!finite(s.days) || s.days < 0 || (s.kind === 'primaire' || s.kind === 'reposDiacetyle') && s.days === 0) missing(`fermentation.${i}.days`, 'fermentation', `${s.name || 'Phase'} : durée inconnue ou invalide, aucun calendrier complété automatiquement.`);
    return { name: s.name, kind: s.kind ?? null, tempC: value(s.tempC), days: value(s.days), note: text(s.note) };
  });
  const mash = (recipe.mash?.steps ?? []).map((s, i) => {
    if (!finite(s.tempC) || !positive(s.durationMin)) missing(`mash.${i}`, 'mash', `${s.name || 'Palier'} : température ou durée de maintien à vérifier.`);
    return { name: s.name, tempC: value(s.tempC), durationMin: value(s.durationMin) };
  });
  if (!mash.length) missing('mash', 'mash', 'Programme d’empâtage absent ; aucun repos férulique ni saccharification n’est inventé.');
  const hops: NonNullable<YeastCompanionData['current']>['hops'] = recipe.hops.map((h, i) => {
    const explicitStage = ['firstWort', 'boil', 'whirlpool', 'dryHop'].includes(h.stage);
    const legacyStage = !h.stage && /dry|cru|à froid|whirlpool|hop[ -]?stand|flame out|first wort|premier moût|fwh|boil|ébullition|^\d+\s*min/i.test(h.step ?? '');
    const stage = explicitStage ? h.stage : legacyStage ? normalizeHop(h).stage : null;
    if (!stage) missing(`hops.${i}.stage`, 'hops', `${h.name} : étape d’ajout inconnue.`);
    if (!finite(h.weightG) || h.weightG < 0) missing(`hops.${i}.weight`, 'hops', `${h.name} : masse inconnue ou invalide.`);
    const biologicalContext = !stage ? 'unknown' : stage !== 'dryHop' ? 'not-dry-hop' : h.aromaTiming === 'fermentation' ? 'active' : h.aromaTiming === 'postFermentation' ? 'post' : 'unknown';
    if (stage === 'dryHop' && h.weightG !== 0) {
      if (biologicalContext === 'unknown') missing(`hops.${i}.biologicalContext`, 'hops', `${h.name} : contexte actif ou après fermentation inconnu ; J+${finite(h.dayOffset) ? h.dayOffset : '?'} ne le détermine pas.`);
      if (!positive(h.aromaContactHours)) missing(`hops.${i}.contactHours`, 'hops', `${h.name} : durée de contact à préciser.`);
      if (!finite(h.aromaTemperatureC ?? h.tempC)) missing(`hops.${i}.temperature`, 'hops', `${h.name} : température de contact inconnue.`);
    }
    return { name: h.name, stage, stageOrigin: explicitStage ? 'explicit' : legacyStage ? 'legacy-label' : 'unknown',
      weightG: value(h.weightG), doseGL: finite(h.weightG) && h.weightG >= 0 && positive(recipe.volumeL) ? h.weightG / recipe.volumeL : null,
      dayOffset: value(h.dayOffset), biologicalContext, contactHours: value(h.aromaContactHours),
      temperatureC: value(h.aromaTemperatureC ?? h.tempC), boilTimeMin: stage === 'boil' || stage === 'firstWort' ? value(h.timeMin) : null,
      varietyId: text(h.hopVarietyId), lotId: text(h.hopLotId) };
  });
  const dry = yeastRecipeHopSummary(recipe);
  const data: YeastCompanionData = { ...empty, mode: nolo ? 'nolo' : 'recipe',
    style: { recipeStyle: text(recipe.style), reference: recipe.styleRef ? { guideId: recipe.styleRef.guideId, version: recipe.styleRef.version, styleId: recipe.styleRef.styleId } : null,
      recipeFamily, comparisonFamily, comparisonOrigin: adopted ? 'adopted-filter' : comparisonFamily === 'unknown' ? 'unknown' : 'recipe-style' },
    adoptedIntent: snapshot ? { modelVersion: snapshot.modelVersion, yeastId: snapshot.yeastId, comparisonFamily: snapshot.styleId, goal: snapshot.goal,
      pressureBar: value(snapshot.pressureBar), ferulicRest: snapshot.ferulicRest, stale, applicable: !nolo && adopted } : null,
    snapshotStatus: snapshot ? stale ? 'stale' : 'current' : hasSnapshot ? 'invalid' : 'none',
    current: { volumeL: value(recipe.volumeL), ogTarget: value(recipe.ogTarget), fgTarget: value(recipe.fgTarget), abvTarget: value(recipe.abvTarget),
      yeast: { name: recipe.yeast.name, explicitId: text(recipe.yeast.hopIndexId), resolvedId: resolved?.id ?? null, referenceName: resolved?.name ?? null,
        lab: text(recipe.yeast.lab) ?? resolved?.catalogue?.manufacturer ?? null, form: recipe.yeast.form ?? null,
        quantity: { value: value(qty), unit: text(recipe.yeast.unit), status: quantityStatus, grams: recipe.yeast.form === 'sèche' && recipe.yeast.unit === 'g' && positive(qty) ? qty : null },
        pitchTempC: value(recipe.yeast.pitchTempC) },
      pressure: { plannedBar: value(currentDraft.pressureBar), unit: 'bar-relative', origin: currentDraft.pressureBar === undefined ? 'unknown' : 'adopted-intent', measured: false },
      fermentation, mash, hops, dryHop: { totalG: value(dry.totalG), doseGL: value(dry.doseGL), activeG: value(dry.activeG), postG: value(dry.postG), unknownG: value(dry.unknownG), unknownCount: dry.unknownCount } }
  };
  if (nolo) {
    data.limits.push('NOLO : utiliser le bilan des sucres, la souche et le procédé du moteur NOLO. L’atténuation de bière alcoolisée, ses presets et ses alternatives sont exclus de cette réponse.');
    for (const [key, supplied] of [['goal', options.goal], ['yeastId', options.yeastId], ['og', options.og]] as const) if (supplied !== undefined) {
      request[key].status = 'rejected'; request[key].reason = 'Scénario NOLO : transmettre la demande au moteur dédié.';
    }
    return jsonCopy(data);
  }
  let effectiveGoal = allowedGoals.includes(currentDraft.goal) ? currentDraft.goal : allowedGoals[0] ?? 'balanced';
  let goalOrigin: NonNullable<YeastCompanionData['analysis']>['goalOrigin'] = adopted ? 'adopted' : comparisonFamily === 'unknown' ? 'unknown' : 'style-default';
  if (options.goal !== undefined) {
    const mapped = typeof options.goal === 'string' && Object.prototype.hasOwnProperty.call(goalMap, options.goal) ? goalMap[options.goal] : undefined;
    request.goal.mappedGoal = mapped ?? null;
    if (!mapped || comparisonFamily === 'unknown' || !allowedGoals.includes(mapped)) {
      request.goal.status = 'rejected'; request.goal.reason = comparisonFamily === 'unknown' ? 'Choisir le style avant de demander une orientation aromatique.' : 'Cet objectif ne fait pas partie de la famille retenue ; le style et la souche ne sont pas changés pour le satisfaire.';
    } else {
      request.goal.status = 'accepted'; effectiveGoal = mapped; goalOrigin = 'explicit-request';
      request.goal.reason = options.goal === 'phenolic' ? 'Objectif historique phenolic traduit en girofle/épices, sans concentration prédite.' :
        options.goal === 'thiols' ? 'Objectif thiols examiné dans les interactions avec le houblon ; il ne signifie pas un gain de fruité garanti.' : 'Objectif de comparaison uniquement ; l’intention enregistrée reste inchangée.';
    }
  }
  const eligible = comparisonFamily === 'unknown' ? [] : yeastRecipeCandidates(comparisonFamily, effectiveGoal, refs, recipe.volumeL);
  let selectedId = currentDraft.yeastId;
  if (options.yeastId !== undefined) {
    if (typeof options.yeastId !== 'string' || !options.yeastId.trim() || !refs.some(y => y.id === options.yeastId)) {
      request.yeastId.status = 'rejected'; request.yeastId.reason = 'Référence absente ou invalide ; aucun remplacement par nom approchant.';
    } else if (options.yeastId !== selectedId && !eligible.some(y => y.yeastId === options.yeastId)) {
      request.yeastId.status = 'rejected'; request.yeastId.reason = 'Cette alternative ne fait pas partie de la famille de comparaison. Réviser explicitement le style pour l’explorer.';
    } else {
      selectedId = options.yeastId; request.yeastId.status = 'accepted'; request.yeastId.reason = 'Souche examinée dans le scénario seulement ; la levure actuelle est conservée.';
    }
  }
  let og = recipe.ogTarget, explicitGravity = false;
  if (options.og !== undefined) {
    if (options.og === null || finite(options.og) && options.og > 1 && options.og <= 1.25) {
      og = options.og; explicitGravity = true; request.og.status = 'accepted'; request.og.reason = 'DI fournie pour une comparaison ; son statut mesuré n’est pas certifié.';
    } else { request.og.status = 'rejected'; request.og.reason = 'DI de scénario invalide : valeur SG supérieure à 1 et au plus 1,25, ou inconnue explicite.'; }
  }
  const scenarioDraft = { ...createYeastRecipeDraft(recipe, refs, comparisonFamily, selectedId), goal: effectiveGoal, pressureBar: currentDraft.pressureBar };
  const evaluation = evaluateYeastRecipeDesign({ ...recipe, ogTarget: og }, scenarioDraft, refs);
  if (resolved && !evaluation.candidate?.temperature) missing('yeast.temperatureRange', 'yeast', 'Fenêtre documentaire absente ou contradictoire ; ne pas choisir une moyenne.');
  if (!evaluation.candidate?.attenuation) missing('yeast.attenuation', 'yeast', 'Plage d’atténuation absente ou contradictoire ; DF documentaire inconnue.');
  const alternateRows = eligible.filter(c => c.yeastId !== currentDraft.yeastId && c.yeastId !== selectedId);
  const limit = finite(options.maxAlternatives) ? Math.min(8, Math.max(0, Math.floor(options.maxAlternatives))) : 5;
  data.alternatives = alternateRows.slice(0, limit).map(c => candidateData(c, c.reference.form)); data.alternativeCount = alternateRows.length; data.alternativesLimited = alternateRows.length > limit;
  const selectedCandidate = evaluation.candidate ? candidateData(evaluation.candidate, selectedId === currentDraft.yeastId ? recipe.yeast.form : evaluation.candidate.reference.form) : null;
  data.analysis = { yeastId: selectedId || null, goal: comparisonFamily === 'unknown' ? null : effectiveGoal, goalOrigin,
    scenario: selectedId !== currentDraft.yeastId || goalOrigin === 'explicit-request' || explicitGravity,
    og: value(og), gravityOrigin: explicitGravity ? 'explicit-scenario-not-certified' : 'recipe-target-not-measured',
    candidate: selectedCandidate, effects: evaluation.effects,
    finalGravity: evaluation.fg, abv: evaluation.abv,
    proposedSettings: eligible.some(c => c.yeastId === selectedId) ? proposeYeastGoalSettings(recipe, scenarioDraft, refs) ?? null : null,
    proposedChanges: selectedId !== currentDraft.yeastId ? evaluation.changes : [],
    warnings: [...evaluation.warnings, ...(stale ? ['Le scénario adopté est devenu ancien. Les valeurs actuelles de recette ci-dessus servent aux calculs.'] : [])], errors: evaluation.errors };
  data.sources = distinctSources([...evaluation.sources, ...(selectedCandidate?.sources ?? []),
    ...(data.analysis.proposedSettings ? [data.analysis.proposedSettings.source] : []), ...data.alternatives.flatMap(a => a.sources)]);
  return jsonCopy(data);
}

/** Detach all returned provenance and nested arrays from the live recipe and cached knowledge. */
function jsonCopy<T>(data: T): T {
  return JSON.parse(JSON.stringify(data, (_key, item) => typeof item === 'number' && !Number.isFinite(item) ? null : item));
}

/** Compact prompt context. The tool can request the structured evidence without shipping the whole catalogue. */
export function yeastCompanionSummary(recipe: TrialRecipe | null | undefined, knowledge: HopKnowledge[] = []): string[] {
  const data = buildYeastCompanion(recipe, knowledge, { maxAlternatives: 3 });
  const n = (v: number | null, unit: string) => v === null ? 'inconnu' : `${v.toLocaleString('fr-FR', { maximumFractionDigits: 3 })} ${unit}`;
  if (!data.current) return ['Levures : recette absente ; style et conduite à préciser avant de proposer une souche.'];
  const { current, adoptedIntent, analysis } = data;
  const result = [
    `Levures : famille réelle ${familyLabel(data.style.recipeFamily)} ; comparaison ${familyLabel(data.style.comparisonFamily)} (${data.style.comparisonOrigin === 'adopted-filter' ? 'filtre adopté' : data.style.comparisonOrigin === 'unknown' ? 'famille à choisir' : 'style de recette'}).`,
    `Souche actuelle : ${current.yeast.name || 'à choisir'} ; ID résolu ${current.yeast.resolvedId ?? 'inconnu'}.`,
    adoptedIntent ? `Intention enregistrée${adoptedIntent.applicable ? ', applicable' : ', non applicable au scénario actuel'} : ${YEAST_RECIPE_GOAL_LABELS[adoptedIntent.goal]} ; souche ${adoptedIntent.yeastId} ; snapshot ${data.snapshotStatus === 'stale' ? 'devenu ancien' : 'courant'}.` : `Intention adoptée : ${data.snapshotStatus === 'invalid' ? 'illisible, non reconstituée' : 'non renseignée'}.`,
    `Pression précoce prévue : ${n(current.pressure.plannedBar, 'bar relatif')} ; ce n’est pas une mesure.`,
    `Quantité actuelle : ${n(current.yeast.quantity.value, current.yeast.quantity.unit ?? 'unité inconnue')} (${current.yeast.quantity.status === 'known' ? 'renseignée' : 'à préciser'}), grammes ${n(current.yeast.quantity.grams, 'g')}.`,
    `Fermentation prévue : ${current.fermentation.length ? current.fermentation.map(p => `${p.name} ${n(p.tempC, '°C')} / ${n(p.days, 'j')}`).join(' ; ') : 'programme absent'}.`,
    `Empâtage prévu : ${current.mash.length ? current.mash.map(p => `${p.name} ${n(p.tempC, '°C')} / ${n(p.durationMin, 'min')}`).join(' ; ') : 'programme absent'}.`
  ];
  const dry = current.hops.filter(h => h.stage === 'dryHop');
  result.push(`Houblons à cru : ${dry.length ? dry.map(h => `${h.name} ${n(h.weightG, 'g')}, ${h.biologicalContext === 'active' ? 'fermentation active déclarée' : h.biologicalContext === 'post' ? 'après fermentation déclaré' : 'contexte biologique inconnu'}, contact ${n(h.contactHours, 'h')} à ${n(h.temperatureC, '°C')}`).join(' ; ') : 'aucun ajout à cru déclaré'}.`);
  if (data.mode === 'nolo') result.push('NOLO : analyser avec le moteur dédié ; aucune alternative ou projection de bière alcoolisée fournie ici.');
  else if (analysis?.goal) result.push(`Objectif examiné : ${YEAST_RECIPE_GOAL_LABELS[analysis.goal]} (${analysis.goalOrigin === 'adopted' ? 'intention adoptée' : 'orientation de style, pas demande de maximiser un goût'}).`);
  if (analysis?.candidate) {
    const c = analysis.candidate;
    const facts = c.observations.filter(f => ['flocculation', 'alcoholTolerance', 'pof', 'sta1', 'diastatic'].includes(f.key));
    if (facts.length) result.push(`Repères du produit documenté (${c.form ?? 'forme inconnue'}) : ${facts.slice(0, 6).map(f => `${f.label} ${yeastFactValue(f)}${f.context ? ` (${f.context})` : ''}`).join(' ; ')}. Tolérance à l’alcool et atténuation ne sont pas des mesures du brassin.`);
    for (const note of c.practicalNotes.slice(0, 3)) result.push(`Fiche ${c.label} — ${note.title} : ${note.detail} Source : ${note.source.reference}`);
    if (c.preparationStatus === 'confirm-form') result.push('Préparation : forme du produit à confirmer ; protocole de la levure sèche non transmis à une culture de forme différente ou inconnue.');
  }
  if (data.alternatives.length) result.push(`Alternatives dans ${familyLabel(data.style.comparisonFamily)} : ${data.alternatives.map(a => `${a.label} [${a.yeastId}] : ${a.reason}`).join(' ; ')}`);
  if (data.missingData.length) result.push(`À préciser : ${data.missingData.slice(0, 5).map(m => m.detail).join(' ')}${data.missingData.length > 5 ? ` (${data.missingData.length - 5} autres points dans l’outil.)` : ''}`);
  result.push('Les sorties de fermentation_advice sont documentaires et qualitatives ; elles ne modifient pas la recette et ne chiffrent pas un goût.');
  return result;
}
