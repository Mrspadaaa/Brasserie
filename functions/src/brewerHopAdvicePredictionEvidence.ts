import { hopAdviceContentReference } from './hopAdviceContentReference.js';
import { HOP_ANALYTES, hopSourceError, validHopRange, type HopSource } from './hopIndexSchema.js';
import { assertHopTriplet, type HopEstimate, type HopPrediction } from './hopPredictionSchema.js';
import { assertHopRecipeInput, type HopRecipeInput, type HopRecipePrediction } from './hopRecipePrediction.js';

export const BREWER_HOP_ADVICE_PREDICTION_SNAPSHOT_FORMAT = 'brewer-hop-advice-prediction-v1' as const;
const REFERENCE_PREFIX = 'brewer-hop-advice-prediction-v1';
const CONFIDENCES = ['low', 'medium', 'high'] as const;
const RECIPE_ENGINE_VERSIONS = [
  'hop-recipe-experimental-v1', 'hop-recipe-experimental-v2', 'hop-recipe-experimental-v3',
  'hop-recipe-experimental-v4', 'hop-recipe-experimental-v5',
] as const;
const CHEMICAL_UNITS = ['mg', 'ug', 'mL'] as const;
const RISK_CODES = ['hopCreep', 'fourMmp', 'precursors'] as const;
const RISK_STATUSES = ['possible', 'flagged', 'unknown'] as const;
const OBJECT = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const hasOwn = (value: object, key: PropertyKey): boolean => Object.prototype.hasOwnProperty.call(value, key);

type Row = Record<string, unknown>;
type CompactReferences<T> = T extends HopSource ? { sourceRef: string }
  : T extends HopSource[] ? { sourceSetRef: string }
  : T extends readonly (infer Value)[] ? CompactReferences<Value>[]
  : T extends object ? { [Key in keyof T]: Key extends 'reasons' ? { reasonSetRef: string } : CompactReferences<T[Key]> }
  : T;
type CompactHopEstimateWithRecipeUnit = CompactReferences<HopEstimate> & { unit?: 'ngL' | null };
type CompactHopRecipeOverall = Omit<CompactReferences<HopRecipePrediction['overall']>, 'compounds'> & {
  compounds: Record<string, CompactHopEstimateWithRecipeUnit>;
};
type CompactHopRecipePrediction = Omit<CompactReferences<HopRecipePrediction>, 'overall'> & {
  overall: CompactHopRecipeOverall;
  sourceDictionary: Record<string, HopSource>;
  sourceSets: Record<string, string[]>;
  reasonSets: Record<string, string[]>;
};

export type BrewerHopAdviceRecipeOverallV1 = Omit<HopRecipePrediction['overall'], 'compounds'> & {
  compounds: Record<string, HopEstimate & { unit?: 'ngL' | null }>;
};

export type BrewerHopAdvicePredictionSnapshotContentV1 =
  | { format: typeof BREWER_HOP_ADVICE_PREDICTION_SNAPSHOT_FORMAT; form: 'independentAlternatives'; payload: HopPrediction[] }
  | { format: typeof BREWER_HOP_ADVICE_PREDICTION_SNAPSHOT_FORMAT; form: 'currentRecipe'; payload: CompactHopRecipePrediction };

export type BrewerHopAdvicePredictionSnapshotV1 = BrewerHopAdvicePredictionSnapshotContentV1 & { reference: string };

/** Model input only. The server adds the content reference after resolving this selector. */
export type BrewerHopAdvicePredictionSelectionInput =
  | { kind: 'alternative'; index: number }
  | { kind: 'recipeOverall' }
  | { kind: 'recipeAddition'; additionId: string };

/** Stored link. Its reference is always derived by the server from the selected turn record. */
export type BrewerHopAdvicePredictionSelection = BrewerHopAdvicePredictionSelectionInput & { reference: string };

export type BrewerHopAdviceResolvedPredictionContribution =
  | { kind: 'alternative'; reference: string; selection: BrewerHopAdvicePredictionSelection; prediction: HopPrediction }
  | { kind: 'recipeOverall'; reference: string; selection: BrewerHopAdvicePredictionSelection; prediction: BrewerHopAdviceRecipeOverallV1 }
  | { kind: 'recipeAddition'; reference: string; selection: BrewerHopAdvicePredictionSelection; addition: HopRecipeInput['additions'][number]; prediction: HopPrediction };

function fail(message: string): never { throw new Error(`Prédiction assistée : ${message}.`); }
function onlyKeys(value: Row, keys: readonly string[], label: string): void {
  if (Object.keys(value).some((key) => !keys.includes(key))) fail(`${label}, champ inconnu`);
}
function plain(value: unknown): value is Row {
  if (!OBJECT(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
function record(value: unknown, label: string): Row {
  if (!plain(value)) fail(`${label} invalide`);
  return value;
}
function string(value: unknown, label: string, max = 500): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) fail(`${label} invalide`);
  return value;
}
function optionalString(value: unknown, label: string, max = 500): void {
  if (value !== undefined && (typeof value !== 'string' || value.length > max)) fail(`${label} invalide`);
}
function stringList(value: unknown, label: string, max = 1000): void {
  if (!Array.isArray(value) || value.length > max || value.some((entry) => typeof entry !== 'string')) fail(`${label} invalide`);
}
function finite(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value); }
function nonnegativeInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) fail(`${label} doit être un entier positif ou nul`);
  return value as number;
}
function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson((value as Row)[key])}`).join(',')}}`;
}
function equalJson(left: unknown, right: unknown): boolean { return stableJson(left) === stableJson(right); }

function assertJson(value: unknown, label: string, seen = new Set<object>()): void {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') { if (!Number.isFinite(value)) fail(`${label} contient un nombre non fini`); return; }
  if (typeof value !== 'object') fail(`${label} n'est pas un JSON persistant`);
  if (seen.has(value as object)) fail(`${label} contient un cycle`);
  seen.add(value as object);
  if (Array.isArray(value)) value.forEach((entry, index) => assertJson(entry, `${label}[${index}]`, seen));
  else {
    if (!plain(value)) fail(`${label} contient un objet non JSON`);
    for (const [key, entry] of Object.entries(value)) {
      if (entry === undefined) fail(`${label}.${key} est indéfini`);
      assertJson(entry, `${label}.${key}`, seen);
    }
  }
  seen.delete(value as object);
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value as Row)) deepFreeze(child);
  return value;
}

function assertSource(value: unknown, label: string): asserts value is HopSource {
  const error = hopSourceError(value);
  if (error) fail(`${label} : ${error}`);
}

interface CompactDictionaries {
  sourceDictionary: Record<string, HopSource>;
  sourceSets: Record<string, string[]>;
  reasonSets: Record<string, string[]>;
}

function expandCompactPrediction(payload: Row): HopRecipePrediction {
  onlyKeys(payload, ['engineVersion', 'input', 'additions', 'overall', 'chemistry', 'warnings', 'aromaStage',
    'sourceDictionary', 'sourceSets', 'reasonSets'], 'résultat recette compact');
  const sourceDictionary = record(payload.sourceDictionary, 'sourceDictionary');
  const sourceSets = record(payload.sourceSets, 'sourceSets');
  const reasonSets = record(payload.reasonSets, 'reasonSets');
  const dictionaries: CompactDictionaries = {
    sourceDictionary: sourceDictionary as Record<string, HopSource>,
    sourceSets: sourceSets as Record<string, string[]>,
    reasonSets: reasonSets as Record<string, string[]>,
  };
  const usedSources = new Set<string>(), usedSourceSets = new Set<string>(), usedReasonSets = new Set<string>();
  for (const [id, source] of Object.entries(dictionaries.sourceDictionary)) {
    string(id, 'sourceDictionary key', 40); assertSource(source, `sourceDictionary.${id}`);
  }
  for (const [id, members] of Object.entries(dictionaries.sourceSets)) {
    string(id, 'sourceSets key', 40); stringList(members, `sourceSets.${id}`, 1000);
    for (const member of members as string[]) if (!hasOwn(dictionaries.sourceDictionary, member)) fail(`sourceSets.${id} référence ${member} absent`);
  }
  for (const [id, entries] of Object.entries(dictionaries.reasonSets)) {
    string(id, 'reasonSets key', 40); stringList(entries, `reasonSets.${id}`, 1000);
  }

  const expand = (value: unknown, label: string): unknown => {
    if (Array.isArray(value)) return value.map((entry, index) => expand(entry, `${label}[${index}]`));
    if (!plain(value)) return value;
    const keys = Object.keys(value);
    if (keys.some((key) => key === 'sourceRef' || key === 'sourceSetRef' || key === 'reasonSetRef')) {
      if (keys.length !== 1) fail(`${label} mélange une référence compacte et d'autres propriétés`);
      if (hasOwn(value, 'sourceRef')) {
        const id = string(value.sourceRef, `${label}.sourceRef`, 40);
        if (!hasOwn(dictionaries.sourceDictionary, id)) fail(`${label} source ${id} absente`);
        usedSources.add(id);
        return cloneJson(dictionaries.sourceDictionary[id]);
      }
      if (hasOwn(value, 'sourceSetRef')) {
        const id = string(value.sourceSetRef, `${label}.sourceSetRef`, 40);
        if (!hasOwn(dictionaries.sourceSets, id)) fail(`${label} ensemble ${id} absent`);
        usedSourceSets.add(id);
        return (dictionaries.sourceSets[id] as string[]).map((sourceId) => {
          usedSources.add(sourceId);
          return cloneJson(dictionaries.sourceDictionary[sourceId]);
        });
      }
      const id = string(value.reasonSetRef, `${label}.reasonSetRef`, 40);
      if (!hasOwn(dictionaries.reasonSets, id)) fail(`${label} raisons ${id} absentes`);
      usedReasonSets.add(id);
      return cloneJson(dictionaries.reasonSets[id]);
    }
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, expand(entry, `${label}.${key}`)]));
  };

  const { sourceDictionary: _sourceDictionary, sourceSets: _sourceSets, reasonSets: _reasonSets, ...compactBody } = payload;
  const expanded = expand(compactBody, 'prédiction recette');
  if (usedSources.size !== Object.keys(dictionaries.sourceDictionary).length
    || usedSourceSets.size !== Object.keys(dictionaries.sourceSets).length
    || usedReasonSets.size !== Object.keys(dictionaries.reasonSets).length) {
    fail('un dictionnaire contient une entrée orpheline');
  }
  assertRecipePrediction(expanded);
  return expanded as HopRecipePrediction;
}

function assertEstimate(value: unknown, label: string, triplet?: HopPrediction['triplet'], requireSource = false): asserts value is HopEstimate {
  const estimate = record(value, label);
  onlyKeys(estimate, ['range', 'confidence', 'reasons', 'sources', 'central'], label);
  if (!(estimate.range === null || validHopRange(estimate.range))) fail(`${label}.range invalide`);
  if (!(CONFIDENCES as readonly unknown[]).includes(estimate.confidence)) fail(`${label}.confidence invalide`);
  stringList(estimate.reasons, `${label}.reasons`);
  if (!Array.isArray(estimate.sources)) fail(`${label}.sources invalide`);
  estimate.sources.forEach((source, index) => assertSource(source, `${label}.sources[${index}]`));
  if (estimate.central !== undefined) {
    const range = estimate.range;
    if (!finite(estimate.central) || !validHopRange(range)) fail(`${label}.central n'est pas un repère expérimental contenu dans sa plage`);
    if (estimate.central < range.min || estimate.central > range.max || estimate.confidence !== 'low') {
      fail(`${label}.central n'est pas un repère expérimental contenu dans sa plage`);
    }
  }
  if (estimate.range !== null && estimate.sources.some((source) => source.year === null || source.kind === 'judgment') && estimate.confidence !== 'low') {
    fail(`${label} porte une confiance incompatible avec sa source`);
  }
  if (estimate.range !== null && triplet) {
    if (!triplet.varietyId || !triplet.yeastId || !triplet.timing || estimate.sources.length === 0) fail(`${label} porte une valeur sans triplet ou source`);
  }
  if (estimate.range !== null && requireSource && estimate.sources.length === 0) fail(`${label} porte une valeur sans source`);
}

function assertEstimateMap(value: unknown, label: string, triplet?: HopPrediction['triplet'], requireSource = false): void {
  const estimates = record(value, label);
  for (const [key, estimate] of Object.entries(estimates)) {
    string(key, `${label} key`, 160); assertEstimate(estimate, `${label}.${key}`, triplet, requireSource);
  }
}
function hasEstimateRange(value: unknown): boolean { return plain(value) && value.range !== null; }

function assertRisk(value: unknown, label: string): void {
  const risk = record(value, label);
  onlyKeys(risk, ['code', 'status', 'title', 'message', 'source', 'confidence'], label);
  if (!(RISK_CODES as readonly unknown[]).includes(risk.code) || !(RISK_STATUSES as readonly unknown[]).includes(risk.status)
    || !(CONFIDENCES as readonly unknown[]).includes(risk.confidence)) fail(`${label} incomplet`);
  string(risk.title, `${label}.title`, 300); string(risk.message, `${label}.message`, 1000); assertSource(risk.source, `${label}.source`);
}

function assertModelRefs(value: unknown, label: string): void {
  if (!Array.isArray(value) || value.length > 100) fail(`${label} invalide`);
  const ids = new Set<string>();
  for (let index = 0; index < value.length; index++) {
    const ref = record(value[index], `${label}[${index}]`);
    onlyKeys(ref, ['id', 'version'], `${label}[${index}]`);
    const id = string(ref.id, `${label}[${index}].id`, 160);
    string(ref.version, `${label}[${index}].version`, 100);
    if (ids.has(id)) fail(`${label} contient un modèle répété`);
    ids.add(id);
  }
}

function assertHopPrediction(value: unknown, label: string): asserts value is HopPrediction {
  const prediction = record(value, label);
  onlyKeys(prediction, ['triplet', 'profile', 'compounds', 'score', 'risks', 'modelRefs', 'reasons', 'extrapolatedAxes'], label);
  assertHopTriplet(prediction.triplet);
  assertEstimateMap(prediction.profile, `${label}.profile`, prediction.triplet);
  const compounds = record(prediction.compounds, `${label}.compounds`);
  onlyKeys(compounds, ['4mmpFree'], `${label}.compounds`);
  for (const [id, estimate] of Object.entries(compounds)) {
    assertEstimate(estimate, `${label}.compounds.${id}`, prediction.triplet);
    if (estimate.range !== null && estimate.range.min < 0) fail(`${label}.compounds.${id} range négative`);
  }
  assertEstimate(prediction.score, `${label}.score`, prediction.triplet);
  if (prediction.score.range !== null && (prediction.score.range.min < 0 || prediction.score.range.max > 100)) fail(`${label}.score hors domaine`);
  if (!Array.isArray(prediction.risks)) fail(`${label}.risks invalide`);
  prediction.risks.forEach((risk, index) => assertRisk(risk, `${label}.risks[${index}]`));
  assertModelRefs(prediction.modelRefs, `${label}.modelRefs`);
  stringList(prediction.reasons, `${label}.reasons`);
  if (prediction.extrapolatedAxes !== undefined) {
    const axes = prediction.extrapolatedAxes;
    stringList(axes, `${label}.extrapolatedAxes`, 500);
    const ids = axes as string[];
    if (!ids.length || new Set(ids).size !== ids.length) fail(`${label}.extrapolatedAxes vide ou dupliqué`);
    for (const axis of ids) if (!hasOwn(prediction.profile as Row, axis) || !(prediction.profile as Row)[axis]) fail(`${label} axe extrapolé absent`);
  }
  const knownOutput = [...Object.values(prediction.profile as Row), ...Object.values(compounds)].some(hasEstimateRange)
    || hasEstimateRange(prediction.score);
  if (knownOutput && !(prediction.modelRefs as unknown[]).length) fail(`${label} porte une valeur sans référence de modèle`);
}

function assertOverall(value: unknown, label: string): void {
  const overall = record(value, label);
  onlyKeys(overall, ['profile', 'compounds', 'score', 'risks', 'modelRefs', 'reasons', 'extrapolatedAxes', 'conditionalEnvelope', 'interactionsNonQuantifiees'], label);
  if (overall.conditionalEnvelope !== true || typeof overall.interactionsNonQuantifiees !== 'boolean') fail(`${label} n'est pas une enveloppe conditionnelle connue`);
  assertEstimateMap(overall.profile, `${label}.profile`, undefined, true);
  const compounds = record(overall.compounds, `${label}.compounds`);
  onlyKeys(compounds, ['4mmpFree'], `${label}.compounds`);
  for (const [id, estimate] of Object.entries(compounds)) {
    const rawEstimate = record(estimate, `${label}.compounds.${id}`);
    onlyKeys(rawEstimate, ['range', 'confidence', 'reasons', 'sources', 'central', 'unit'], `${label}.compounds.${id}`);
    if (hasOwn(rawEstimate, 'unit') && !(rawEstimate.unit === null || rawEstimate.unit === 'ngL')) {
      fail(`${label}.compounds.${id}.unit inconnue ou incompatible`);
    }
    const { unit: _unit, ...estimateBody } = rawEstimate;
    assertEstimate(estimateBody, `${label}.compounds.${id}`, undefined, true);
    if (estimateBody.range !== null && estimateBody.range.min < 0) fail(`${label}.compounds.${id} range négative`);
  }
  assertEstimate(overall.score, `${label}.score`, undefined, true);
  if (overall.score.range !== null && (overall.score.range.min < 0 || overall.score.range.max > 100)) fail(`${label}.score hors domaine`);
  if (!Array.isArray(overall.risks)) fail(`${label}.risks invalide`);
  overall.risks.forEach((risk, index) => assertRisk(risk, `${label}.risks[${index}]`));
  assertModelRefs(overall.modelRefs, `${label}.modelRefs`);
  stringList(overall.reasons, `${label}.reasons`);
  if (overall.extrapolatedAxes !== undefined) {
    const axes = overall.extrapolatedAxes;
    stringList(axes, `${label}.extrapolatedAxes`, 500);
    const ids = axes as string[];
    if (new Set(ids).size !== ids.length) fail(`${label}.extrapolatedAxes dupliqué`);
    for (const axis of ids) if (!hasOwn(overall.profile as Row, axis) || !(overall.profile as Row)[axis]) fail(`${label} axe extrapolé absent`);
  }
  const knownOutput = [...Object.values(overall.profile as Row), ...Object.values(compounds)].some(hasEstimateRange)
    || hasEstimateRange(overall.score);
  if (knownOutput && !(overall.modelRefs as unknown[]).length) fail(`${label} porte une valeur sans référence de modèle`);
}

function assertRecipeChemistry(value: unknown, activeAdditionCount: number): void {
  const chemistry = record(value, 'chemistry');
  onlyKeys(chemistry, ['introduced', 'final'], 'chemistry');
  const introduced = record(chemistry.introduced, 'chemistry.introduced');
  for (const [key, raw] of Object.entries(introduced)) {
    string(key, 'chemistry.introduced key', 100);
    const amount = record(raw, `chemistry.introduced.${key}`);
    onlyKeys(amount, ['analyte', 'unit', 'basis', 'range', 'reported', 'confidence', 'sources', 'reasons', 'coverage', 'partialRange', 'partialReported'], `chemistry.introduced.${key}`);
    if (!(HOP_ANALYTES as readonly string[]).includes(key) || amount.analyte !== key
      || !(CHEMICAL_UNITS as readonly unknown[]).includes(amount.unit) || amount.basis !== 'introduced') fail(`chemistry.introduced.${key} métrique ou unité invalide`);
    if (!(amount.range === null || (validHopRange(amount.range) && amount.range.min >= 0))
      || !(CONFIDENCES as readonly unknown[]).includes(amount.confidence)) fail(`chemistry.introduced.${key} estimation invalide`);
    if (amount.reported !== undefined && !finite(amount.reported)) fail(`chemistry.introduced.${key}.reported invalide`);
    if (!Array.isArray(amount.sources)) fail(`chemistry.introduced.${key}.sources invalide`);
    amount.sources.forEach((source, index) => assertSource(source, `chemistry.introduced.${key}.sources[${index}]`));
    stringList(amount.reasons, `chemistry.introduced.${key}.reasons`);
    const coverage = record(amount.coverage, `chemistry.introduced.${key}.coverage`);
    onlyKeys(coverage, ['knownAdditions', 'totalAdditions'], `chemistry.introduced.${key}.coverage`);
    const knownAdditions = nonnegativeInteger(coverage.knownAdditions, 'coverage.knownAdditions');
    const totalAdditions = nonnegativeInteger(coverage.totalAdditions, 'coverage.totalAdditions');
    if (knownAdditions > totalAdditions || totalAdditions !== activeAdditionCount) fail(`chemistry.introduced.${key}.coverage ne correspond pas aux ajouts non nuls`);
    const partialRange = amount.partialRange;
    if (partialRange !== undefined) {
      if (!validHopRange(partialRange)) fail(`chemistry.introduced.${key}.partialRange invalide`);
      if (partialRange.min < 0) fail(`chemistry.introduced.${key}.partialRange invalide`);
    }
    if (amount.partialReported !== undefined && (!finite(amount.partialReported) || amount.partialReported < 0)) fail(`chemistry.introduced.${key}.partialReported invalide`);
    if (amount.range !== null && amount.sources.length === 0) fail(`chemistry.introduced.${key} porte une valeur sans source`);
    const reported = amount.reported;
    if (reported !== undefined && (!finite(reported) || reported < 0)) fail(`chemistry.introduced.${key}.reported invalide ou négatif`);
    if (amount.reported !== undefined && amount.sources.length === 0) fail(`chemistry.introduced.${key}.reported sans source`);
  }
  const final = record(chemistry.final, 'chemistry.final');
  for (const [key, raw] of Object.entries(final)) {
    string(key, 'chemistry.final key', 100);
    if (!(HOP_ANALYTES as readonly string[]).includes(key)) fail(`chemistry.final.${key} métrique inconnue`);
    const estimate = record(raw, `chemistry.final.${key}`);
    onlyKeys(estimate, ['range', 'confidence', 'reasons', 'sources', 'central', 'unit'], `chemistry.final.${key}`);
    if (!(estimate.unit === null || estimate.unit === 'ngL')) fail(`chemistry.final.${key}.unit invalide`);
    const { unit: _unit, ...body } = estimate;
    assertEstimate(body, `chemistry.final.${key}`);
    if (estimate.range !== null && (estimate.range as { min: number }).min < 0) fail(`chemistry.final.${key}.range négative`);
    if (estimate.range !== null && !(estimate.sources as unknown[]).length) fail(`chemistry.final.${key} porte une valeur sans source`);
  }
}

function assertOverallChemistryUnitCoherence(overallValue: unknown, finalValue: unknown): void {
  const overall = record(overallValue, 'overall');
  const compounds = record(overall.compounds, 'overall.compounds');
  const final = record(finalValue, 'chemistry.final');
  const overallIds = Object.keys(compounds).sort();
  const finalIds = Object.keys(final).sort();
  if (!equalJson(overallIds, finalIds)) fail('overall.compounds ne correspond pas à chemistry.final');
  for (const [id, rawCompound] of Object.entries(compounds)) {
    const compound = record(rawCompound, `overall.compounds.${id}`);
    const finalCompound = record(final[id], `chemistry.final.${id}`);
    if (!hasOwn(compound, 'unit') || compound.unit !== finalCompound.unit) {
      fail(`overall.compounds.${id}.unit ne correspond pas à chemistry.final.${id}.unit`);
    }
  }
}

function assertRecipePrediction(value: unknown): asserts value is HopRecipePrediction {
  const prediction = record(value, 'résultat recette');
  onlyKeys(prediction, ['engineVersion', 'input', 'additions', 'overall', 'chemistry', 'warnings', 'aromaStage'], 'résultat recette');
  if (!(RECIPE_ENGINE_VERSIONS as readonly unknown[]).includes(prediction.engineVersion)) fail('version de moteur inconnue');
  const input = prediction.input as HopRecipeInput;
  assertHopRecipeInput(input);
  if (!Array.isArray(prediction.additions) || prediction.additions.length !== input.additions.length) fail('ajouts de sortie incomplets');
  prediction.additions.forEach((addition, index) => {
    assertHopPrediction(addition, `additions[${index}]`);
    if (!equalJson(addition.triplet, input.additions[index].triplet)) fail(`additions[${index}] ne correspond pas au triplet d'entrée`);
  });
  assertOverall(prediction.overall, 'overall');
  const activeAdditionCount = input.additions.filter((addition: HopRecipeInput['additions'][number]) => addition.triplet.doseGL !== 0).length;
  assertRecipeChemistry(prediction.chemistry, activeAdditionCount);
  assertOverallChemistryUnitCoherence(prediction.overall, (prediction.chemistry as Row).final);
  stringList(prediction.warnings, 'warnings', 1000);
  if (prediction.aromaStage !== undefined) {
    const stage = record(prediction.aromaStage, 'aromaStage');
    onlyKeys(stage, ['id', 'label', 'limitation'], 'aromaStage');
    if (!['mother', 'reference', 'packaged'].includes(String(stage.id))) fail('aromaStage.id invalide');
    string(stage.label, 'aromaStage.label', 300); string(stage.limitation, 'aromaStage.limitation', 1000);
  }
}

function assertSnapshotContent(value: unknown): asserts value is BrewerHopAdvicePredictionSnapshotContentV1 {
  const snapshot = record(value, 'snapshot');
  onlyKeys(snapshot, ['format', 'form', 'payload'], 'snapshot');
  if (snapshot.format !== BREWER_HOP_ADVICE_PREDICTION_SNAPSHOT_FORMAT) fail('version de snapshot inconnue');
  if (snapshot.form === 'independentAlternatives') {
    if (!Array.isArray(snapshot.payload) || snapshot.payload.length < 1 || snapshot.payload.length > 100) fail('alternatives vides ou hors limite');
    snapshot.payload.forEach((prediction, index) => assertHopPrediction(prediction, `alternatives[${index}]`));
  } else if (snapshot.form === 'currentRecipe') {
    expandCompactPrediction(record(snapshot.payload, 'payload'));
  } else fail('forme de prédiction inconnue');
}

export function createBrewerHopAdvicePredictionSnapshot(value: unknown): BrewerHopAdvicePredictionSnapshotV1 {
  assertJson(value, 'payload');
  let content: BrewerHopAdvicePredictionSnapshotContentV1;
  if (Array.isArray(value)) {
    content = { format: BREWER_HOP_ADVICE_PREDICTION_SNAPSHOT_FORMAT, form: 'independentAlternatives', payload: cloneJson(value) as HopPrediction[] };
  } else {
    const payload = cloneJson(record(value, 'payload')) as CompactHopRecipePrediction;
    content = { format: BREWER_HOP_ADVICE_PREDICTION_SNAPSHOT_FORMAT, form: 'currentRecipe', payload };
  }
  assertSnapshotContent(content);
  const reference = hopAdviceContentReference(REFERENCE_PREFIX, content);
  return deepFreeze({ ...content, reference } as BrewerHopAdvicePredictionSnapshotV1);
}

export function assertBrewerHopAdvicePredictionSnapshot(value: unknown): asserts value is BrewerHopAdvicePredictionSnapshotV1 {
  const snapshot = record(value, 'snapshot');
  onlyKeys(snapshot, ['format', 'form', 'payload', 'reference'], 'snapshot');
  assertSnapshotContent({ format: snapshot.format, form: snapshot.form, payload: snapshot.payload });
  const content = { format: snapshot.format, form: snapshot.form, payload: snapshot.payload } as BrewerHopAdvicePredictionSnapshotContentV1;
  if (snapshot.reference !== hopAdviceContentReference(REFERENCE_PREFIX, content)) fail('référence de contenu différente du snapshot');
}

function readSelection(value: unknown): BrewerHopAdvicePredictionSelection {
  const selection = record(value, 'sélecteur');
  const reference = string(selection.reference, 'sélecteur.reference', 160);
  if (selection.kind === 'alternative') {
    onlyKeys(selection, ['kind', 'index', 'reference'], 'sélecteur');
    return { kind: 'alternative', index: nonnegativeInteger(selection.index, 'sélecteur.index'), reference };
  }
  if (selection.kind === 'recipeOverall') {
    onlyKeys(selection, ['kind', 'reference'], 'sélecteur');
    return { kind: 'recipeOverall', reference };
  }
  if (selection.kind === 'recipeAddition') {
    onlyKeys(selection, ['kind', 'additionId', 'reference'], 'sélecteur');
    return { kind: 'recipeAddition', additionId: string(selection.additionId, 'sélecteur.additionId', 120), reference };
  }
  return fail('type de sélecteur inconnu');
}

export function resolveBrewerHopAdvicePredictionContribution(
  snapshotValue: BrewerHopAdvicePredictionSnapshotV1,
  selectionValue: BrewerHopAdvicePredictionSelection,
): BrewerHopAdviceResolvedPredictionContribution {
  assertBrewerHopAdvicePredictionSnapshot(snapshotValue);
  const selection = readSelection(selectionValue);
  if (selection.reference !== snapshotValue.reference) fail('sélecteur rattaché à un autre contenu');
  if (snapshotValue.form === 'independentAlternatives') {
    if (selection.kind !== 'alternative') fail('un index d’alternative est requis pour cette prédiction');
    const prediction = snapshotValue.payload[selection.index];
    if (!prediction) fail('index d’alternative hors limites');
    return deepFreeze({ kind: 'alternative', reference: snapshotValue.reference, selection, prediction: cloneJson(prediction) });
  }
  if (selection.kind === 'recipeOverall') {
    const expanded = expandCompactPrediction(snapshotValue.payload as unknown as Row);
    return deepFreeze({ kind: 'recipeOverall', reference: snapshotValue.reference, selection,
      prediction: cloneJson(expanded.overall) as BrewerHopAdviceRecipeOverallV1 });
  }
  if (selection.kind === 'recipeAddition') {
    const expanded = expandCompactPrediction(snapshotValue.payload as unknown as Row);
    const index = expanded.input.additions.findIndex((addition: HopRecipeInput['additions'][number]) => addition.id === selection.additionId);
    if (index < 0) fail(`ajout ${selection.additionId} absent du snapshot`);
    return deepFreeze({ kind: 'recipeAddition', reference: snapshotValue.reference, selection,
      addition: cloneJson(expanded.input.additions[index]), prediction: cloneJson(expanded.additions[index]) });
  }
  return fail('un sélecteur de résultat recette est requis pour cette prédiction');
}

/** Unavailable/future payloads stay in turn evidence and can only be retained as an unqualified reference. */
export function tryCreateBrewerHopAdvicePredictionSnapshot(value: unknown): BrewerHopAdvicePredictionSnapshotV1 | undefined {
  try { return createBrewerHopAdvicePredictionSnapshot(value); } catch { return undefined; }
}

