import {
  getBrewingReferenceProjection,
  readBrewingReferenceRecord,
  type BrewingReferenceEvent,
  type BrewingReferenceIdentityV1,
  type BrewingReferenceProjectionV1,
  type BrewingReferenceRecordV1,
  type BrewingReferenceVersionV1,
} from '../../domain/brewingReference';
import {
  createBrewingSensoryComparison,
  createBrewingSensoryDefinitionReference,
  assertBrewingSensoryComparison,
  type BrewingSensoryComparisonDTO,
  type BrewingSensoryComparisonDimension,
  type BrewingSensoryComparisonValue,
  type BrewingSensoryDefinitionReference,
  type BrewingSensoryMetric,
  type BrewingSensoryDimension,
} from '../../domain/brewingSensory';
import {
  BREWING_SCENARIO_VERSION,
  assertBrewingScenarioRequest,
  assertBrewingScenarioResult,
  type BrewingScenarioMaterialInputs,
  type BrewingScenarioBaseline,
  type BrewingScenarioBranchResult,
  type BrewingScenarioResult,
} from '../../domain/brewingScenario';
import {
  readBrewingScenarioRecord,
  type BrewingScenarioRecordRead,
  type BrewingScenarioSnapshotV1,
} from '../../domain/brewingScenarioDossier';
import {
  projectBrewingNuances,
  readBrewingNuanceProjection,
  type BrewingNuanceProjection,
} from '../../domain/brewingNuanceProjection';
import { predictHopRecipe, type HopRecipeInput, type HopRecipePrediction } from '../../../functions/src/hopRecipePrediction';
import type { HopEngineData } from '../../../functions/src/hopPredictionCore';
import type { HopAxis, HopEstimate } from '../../../functions/src/hopPredictionSchema';
import type { HopExtrapolation } from '../../../functions/src/hopExtrapolationSchema';
import type { HopRange, HopSource } from '../../../functions/src/hopIndexSchema';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';

export const HOP_V55_REFERENCE_COMPARISON_VERSION = 'hop-v55-reference-comparison-v1' as const;
export const HOP_V55_REFERENCE_COMPARISON_ARCHIVE_VERSION = 'hop-v55-reference-comparison-archive-v1' as const;
export const HOP_V55_ADOPTED_REFERENCE_CANDIDATE_ID = 'adopted-reference' as const;

export interface HopV55ReferenceJournalInput {
  record: BrewingReferenceRecordV1;
  events: BrewingReferenceEvent[];
}

export interface HopV55NuanceStudyInput {
  id: string;
  scenarioId: string;
  snapshotReference: string;
  projection: BrewingNuanceProjection;
  context: BrewingSensoryComparisonDTO['context'];
  reference: BrewingSensoryComparisonDTO['reference'];
}

export interface HopV55ReferenceComparisonInput {
  /** A read from the append-only scenario dossier, not a freshly simulated result. */
  scenarioRecord: BrewingScenarioRecordRead;
  snapshotReference: string;
  referenceJournal: HopV55ReferenceJournalInput;
  adoptedReference: BrewingReferenceIdentityV1;
  /** J5 candidate IDs and semantic dimension IDs remain stable across reference revisions. */
  selection: {
    candidateIds: string[];
    dimensionIds: string[];
    preferredCandidateId?: string;
  };
  /** Optional prior fine projection for this exact archived J5 snapshot. It is copied, never revised. */
  nuanceStudy?: HopV55NuanceStudyInput;
}

export interface HopV55ReferenceComparisonSelectionV1 {
  candidateIds: string[];
  /** J5 axis/dimension IDs supplied by the parent, before mapping to exact definition groups. */
  dimensionIds: string[];
  /** All exact referenceGroupIds mapped from dimensionIds, without merging incompatible scales. */
  dimensionReferenceIds: string[];
  /** A visual preference only; the builder never appends a J5 branch-preference event. */
  preferredCandidateId?: string;
}

export interface HopV55ReferenceComparisonSourceV1 {
  ownerKey: string;
  scenarioId: string;
  resultRevision: number;
  snapshotReference: string;
  resultReference: string;
  dossierReference: string;
  branchReferences: Array<{ id: string; reference: string }>;
  sourceFingerprint: string;
  referenceJournalFingerprint: string;
}

export interface HopV55ReferenceComparisonSeriesV1 {
  candidateId: string;
  role: 'j5Baseline' | 'j5Branch' | 'adoptedReference';
  label: string;
  sourceReference: string;
  applicability?: BrewingScenarioBranchResult['applicability'];
  performedAdditionIds?: string[];
  /** J5 source inputs and programs are preserved exactly as archived. */
  input?: HopRecipeInput;
  program?: BrewingScenarioBranchResult['program'];
}

export interface HopV55ReferenceEvaluationV1 {
  status: 'reused' | 'calculated' | 'unknown';
  reason: string;
  modelReferences: Array<{ id: string; version: string }>;
  fineStatus: 'notRequested' | 'reused' | 'calculated' | 'unknown';
  fineReason?: string;
}

export interface HopV55ReferenceComparisonArchiveV1 {
  version: typeof HOP_V55_REFERENCE_COMPARISON_ARCHIVE_VERSION;
  /** Full immutable J5 dossier read includes every saved/revised snapshot and event. */
  scenarioRecord: BrewingScenarioRecordRead;
  referenceJournal: HopV55ReferenceJournalInput;
  adoptedReference: BrewingReferenceVersionV1;
  nuanceStudy?: HopV55NuanceStudyInput;
}

export interface HopV55ReferenceComparisonDTO {
  version: typeof HOP_V55_REFERENCE_COMPARISON_VERSION;
  reference: BrewingReferenceIdentityV1;
  source: HopV55ReferenceComparisonSourceV1;
  selection: HopV55ReferenceComparisonSelectionV1;
  series: HopV55ReferenceComparisonSeriesV1[];
  referenceEvaluation: HopV55ReferenceEvaluationV1;
  comparison: BrewingSensoryComparisonDTO;
  archive: HopV55ReferenceComparisonArchiveV1;
  contentReference: string;
}

export type HopV55ReferenceComparisonErrorCode =
  | 'invalidInput' | 'unsupportedScenarioFormat' | 'unsupportedReferenceFormat'
  | 'snapshotNotFound' | 'referenceNotAdopted' | 'selectionMismatch'
  | 'nuanceStudyMismatch' | 'definitionConflict' | 'referenceCandidateConflict'
  | 'invalidComparison';

export class HopV55ReferenceComparisonError extends Error {
  constructor(readonly code: HopV55ReferenceComparisonErrorCode, message: string) {
    super(message);
    this.name = 'HopV55ReferenceComparisonError';
  }
}

export type HopV55ReferenceComparisonRead =
  | { status: 'available'; dto: HopV55ReferenceComparisonDTO }
  | { status: 'unsupportedFormat'; reason: string; raw: unknown }
  | { status: 'invalid'; code: HopV55ReferenceComparisonErrorCode | 'integrity'; reason: string };

interface DefinitionGroup {
  definition: BrewingSensoryDefinitionReference;
  source: 'j5' | 'nuanceStudy' | 'reference';
}

interface ReferencePrediction {
  status: HopV55ReferenceEvaluationV1['status'];
  reason: string;
  prediction?: HopRecipePrediction;
  input?: HopRecipeInput;
  definitionReferences: Set<string>;
}

const object = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const clone = <T>(value: T): T => structuredClone(value);
const same = (left: unknown, right: unknown) => hopAdviceContentReference('hop-v55-reference-comparison-equality-v1', left)
  === hopAdviceContentReference('hop-v55-reference-comparison-equality-v1', right);
const referenceKey = (value: BrewingReferenceIdentityV1) => `${value.id}\0${value.version}\0${value.contentReference}`;

function fail(code: HopV55ReferenceComparisonErrorCode, message: string): never {
  throw new HopV55ReferenceComparisonError(code, message);
}

function compareContentReference(value: Omit<HopV55ReferenceComparisonDTO, 'contentReference'> | HopV55ReferenceComparisonDTO): string {
  const { contentReference: _contentReference, ...body } = value as HopV55ReferenceComparisonDTO;
  return hopAdviceContentReference('hop-v55-reference-comparison-content-v1', body);
}

function referenceJournalFingerprint(journal: HopV55ReferenceJournalInput): string {
  return hopAdviceContentReference('hop-v55-reference-journal-archive-v1', journal);
}

function sourceFingerprint(snapshot: BrewingScenarioSnapshotV1): string {
  const result = snapshot.result;
  return hopAdviceContentReference('hop-v55-reference-comparison-source-v1', {
    scenarioId: result.scenarioId,
    resultRevision: result.revision,
    snapshotReference: snapshot.reference,
    resultReference: result.reference,
    branches: [result.baseline, ...result.branches].map(branch => ({ id: branch.id, reference: branch.reference })),
  });
}

function semanticKey(definition: BrewingSensoryDefinitionReference): string {
  return `${definition.dimension.id}\0${definition.dimension.version}`;
}

function appendDefinition(groups: Map<string, DefinitionGroup>, semanticDefinitions: Map<string, string>,
  definition: BrewingSensoryDefinitionReference, source: DefinitionGroup['source']): void {
  const semantic = semanticKey(definition);
  const prior = semanticDefinitions.get(semantic);
  if (prior && prior !== definition.dimensionReference) {
    fail('definitionConflict', `La version de dimension ${definition.dimension.id}@${definition.dimension.version} a deux définitions incompatibles; aucune fusion n’est tentée.`);
  }
  semanticDefinitions.set(semantic, definition.dimensionReference);
  const old = groups.get(definition.contentReference);
  if (old) return;
  groups.set(definition.contentReference, { definition: clone(definition), source });
}

/** Mirrors the frozen J5 model-index reference construction used at adoption. */
function definitionsFromBranch(branch: BrewingScenarioBranchResult): BrewingSensoryDefinitionReference[] {
  const knowledge = branch.dependencySnapshot.engineData.knowledge;
  const axes = knowledge.filter((row): row is HopAxis => row.kind === 'axis');
  const extrapolations = knowledge.filter((row): row is HopExtrapolation => row.kind === 'extrapolation');
  return axes.map(axis => {
    const modelAxes = extrapolations.flatMap(model => model.axes.map(candidate => ({ candidate, source: model.source })))
      .filter(row => row.candidate.id === axis.id && row.candidate.version === axis.version);
    const termSets = new Set(modelAxes.map(row => JSON.stringify(row.candidate.terms)));
    const modelAxis = termSets.size === 1 ? modelAxes[0] : undefined;
    const suffix = hopAdviceContentReference('hop-v55-model-axis-identity-v1', { id: axis.id, version: axis.version }).slice(-24);
    const metricId = `hop-model-axis-${suffix}`;
    const dimension: BrewingSensoryDimension = {
      id: axis.id, version: axis.version, name: axis.name, definition: axis.description,
      sourceRefs: [clone(axis.source), ...(modelAxis ? [clone(modelAxis.source)] : [])],
      ...(modelAxis?.candidate.terms.length ? { terms: [...modelAxis.candidate.terms] } : {}),
    };
    const metric: BrewingSensoryMetric = { id: metricId, version: axis.version, kind: 'modelIndex', name: axis.name,
      meaning: 'Indice du modèle sur cette définition, pas note observée.', unit: 'axisScale', sourceRefs: [clone(axis.source)] };
    return createBrewingSensoryDefinitionReference(dimension, metric, {
      id: `hop-model-scale-${suffix}`, version: axis.version, metricRef: { id: metric.id, version: metric.version },
      domain: clone(axis.scale), sourceRefs: [clone(axis.source)],
    });
  });
}

function archivedBranches(snapshot: BrewingScenarioSnapshotV1): BrewingScenarioBranchResult[] {
  return [snapshot.result.baseline, ...snapshot.result.branches];
}

function validateSelection(input: HopV55ReferenceComparisonInput, branches: BrewingScenarioBranchResult[], definitions: Map<string, DefinitionGroup>) {
  const candidateIds = input.selection?.candidateIds;
  const dimensionIds = input.selection?.dimensionIds;
  if (!Array.isArray(candidateIds) || new Set(candidateIds).size !== candidateIds.length
    || candidateIds.some(id => !text(id)) || !Array.isArray(dimensionIds)
    || new Set(dimensionIds).size !== dimensionIds.length || dimensionIds.some(id => !text(id))) {
    fail('selectionMismatch', 'La sélection J5 de candidats ou de dimensions est mal formée.');
  }
  const allowedCandidates = new Set([...branches.map(branch => branch.id), HOP_V55_ADOPTED_REFERENCE_CANDIDATE_ID]);
  if (candidateIds.some(id => !allowedCandidates.has(id))) fail('selectionMismatch', 'La sélection contient un candidat absent du snapshot J5 et de la référence adoptée.');
  if (input.selection.preferredCandidateId !== undefined && !allowedCandidates.has(input.selection.preferredCandidateId)) {
    fail('selectionMismatch', 'Le choix visuel précédent ne référence ni une branche J5 conservée ni la série de référence.');
  }
  const dimensionIdsInResult = new Set([...definitions.values()].map(group => group.definition.dimension.id));
  if (dimensionIds.some(id => !dimensionIdsInResult.has(id))) fail('selectionMismatch', 'Une dimension sélectionnée est absente des définitions exactes archivées.');
  return {
    candidateIds: [...candidateIds], dimensionIds: [...dimensionIds],
    dimensionReferenceIds: [...definitions.entries()].filter(([, group]) => dimensionIds.includes(group.definition.dimension.id)).map(([id]) => id),
    ...(input.selection.preferredCandidateId ? { preferredCandidateId: input.selection.preferredCandidateId } : {}),
  } satisfies HopV55ReferenceComparisonSelectionV1;
}

function referenceIdentityEquals(left: BrewingReferenceIdentityV1, right: BrewingReferenceIdentityV1): boolean {
  return referenceKey(left) === referenceKey(right);
}

function exactAdoptedReference(journalInput: HopV55ReferenceJournalInput, identity: BrewingReferenceIdentityV1): {
  projection: BrewingReferenceProjectionV1; reference: BrewingReferenceVersionV1; journal: HopV55ReferenceJournalInput;
} {
  const read = readBrewingReferenceRecord(journalInput.record, journalInput.events);
  if ('status' in read) fail('unsupportedReferenceFormat', `Journal NR non pris en charge : ${read.reason}.`);
  const projection = getBrewingReferenceProjection(read);
  const reference = projection.references.find(row => referenceIdentityEquals(row, identity));
  const adopted = projection.adoptions.some(row => referenceIdentityEquals(row.reference, identity));
  if (!reference || !adopted) fail('referenceNotAdopted', 'La version exacte de référence n’est pas adoptée dans le journal NR relu.');
  return { projection, reference, journal: { record: clone(read.record), events: clone(read.events) } };
}

function declaredReferenceBaseline(reference: BrewingReferenceVersionV1): BrewingScenarioBaseline | null {
  if (!object(reference.content) || !object(reference.content.baseline)) return null;
  const baseline = clone(reference.content.baseline);
  try {
    assertBrewingScenarioRequest({ version: BREWING_SCENARIO_VERSION, scenarioId: 'hop-v55-reference-calculation', revision: 1,
      baseline, assumptions: [], branches: [] });
    return baseline as BrewingScenarioBaseline;
  } catch { return null; }
}

function frozenInputGaps(input: HopRecipeInput, data: HopEngineData, declaredMaterials?: BrewingScenarioMaterialInputs): string[] {
  const gaps: string[] = [];
  if (!input.yeastId) gaps.push('Souche non renseignée dans le baseline de référence.');
  else if (!data.knowledge.some(row => row.kind === 'yeast' && row.id === input.yeastId)) gaps.push(`Levure ${input.yeastId} absente des dépendances archivées.`);
  for (const addition of input.additions) {
    const triplet = addition.triplet;
    if (triplet.doseGL !== 0 && !triplet.varietyId) gaps.push(`Matière non identifiée pour l’ajout ${addition.id}.`);
    if (triplet.varietyId && !data.varieties.some(row => row.id === triplet.varietyId)) gaps.push(`Matière ${triplet.varietyId} absente des dépendances archivées.`);
    if (triplet.lotId && !data.lots.some(row => row.id === triplet.lotId)) gaps.push(`Lot ${triplet.lotId} absent des dépendances archivées.`);
  }
  for (const material of declaredMaterials?.hops ?? []) {
    const archived = material.variety && data.varieties.find(row => row.id === material.variety!.id);
    if (!archived || !same(archived, material.variety)) gaps.push(`Fiche figée de ${material.name} absente ou différente des dépendances J5.`);
  }
  for (const yeast of declaredMaterials?.yeasts ?? []) {
    const archived = data.knowledge.find(row => row.kind === 'yeast' && row.id === yeast.id);
    if (!archived || !same(archived, yeast)) gaps.push(`Fiche figée de levure ${yeast.name} absente ou différente des dépendances J5.`);
  }
  return [...new Set(gaps)];
}

function referencePrediction(reference: BrewingReferenceVersionV1, snapshot: BrewingScenarioSnapshotV1): ReferencePrediction {
  const declared = declaredReferenceBaseline(reference);
  if (!declared) return { status: 'unknown', reason: 'La référence ne contient pas de baseline J5 interprétable; aucune coordonnée n’est inventée.', definitionReferences: new Set() };
  if (same(declared, snapshot.result.requestSnapshot.baseline)) {
    return { status: 'reused', reason: 'Baseline identique au baseline archivé J5; les sorties conservées sont reprises sans recalcul.',
      prediction: snapshot.result.baseline.hopPrediction, input: snapshot.result.baseline.input,
      definitionReferences: new Set(definitionsFromBranch(snapshot.result.baseline).map(definition => definition.contentReference)) };
  }
  if (declared.kind === 'recipe') {
    return { status: 'unknown', reason: 'La référence pointe vers une recette qui ne correspond pas au baseline de ce snapshot J5; aucune recette courante n’est relue.', definitionReferences: new Set() };
  }
  if (declared.culture || declared.biologicalContext || declared.beerContext) {
    return { status: 'unknown', reason: 'Le baseline déclaré comporte un contexte biologique ou de bière que ce calcul de référence seul ne peut pas appliquer.', definitionReferences: new Set() };
  }
  if (declared.program) {
    return { status: 'unknown', reason: 'Le baseline déclare aussi un programme physique séparé de ses entrées J5; aucun alignement de masses n’est inféré.', definitionReferences: new Set() };
  }
  const engineData = snapshot.result.baseline.dependencySnapshot.engineData;
  const missing = frozenInputGaps(declared.input, engineData, declared.materials);
  if (missing.length) return { status: 'unknown', reason: `${missing.join(' ')} Aucune recherche du catalogue courant n’est lancée.`, definitionReferences: new Set() };
  try {
    const prediction = predictHopRecipe(clone(declared.input), {}, clone(engineData));
    return { status: 'calculated', reason: 'Baseline de référence calculé seul depuis les valeurs déclarées et les dépendances figées du snapshot J5; aucun candidat archivé n’a été recalculé.',
      prediction, input: clone(declared.input), definitionReferences: new Set(definitionsFromBranch(snapshot.result.baseline).map(definition => definition.contentReference)) };
  } catch (error) {
    return { status: 'unknown', reason: `Le baseline déclaré ne peut pas être calculé depuis les dépendances archivées : ${error instanceof Error ? error.message : 'erreur de modèle'}`, definitionReferences: new Set() };
  }
}

function valueProvenance(input: {
  sourceRefs?: HopSource[]; modelRef?: { id: string; version: string }; hypothesisRefs?: string[];
  explanation: string; limitations?: string[];
}) {
  return {
    sourceRefs: clone(input.sourceRefs ?? []), ...(input.modelRef ? { modelRef: clone(input.modelRef) } : {}),
    ...(input.hypothesisRefs?.length ? { hypothesisRefs: [...input.hypothesisRefs] } : {}),
    explanation: input.explanation, limitations: [...(input.limitations ?? [])],
  };
}

function unknownValue(candidateId: string, reason: string, provenance: ReturnType<typeof valueProvenance> = valueProvenance({ explanation: reason })):
  BrewingSensoryComparisonValue {
  return { candidateId, status: 'unknown', reason, provenance };
}

function estimateValue(candidateId: string, definition: BrewingSensoryDefinitionReference, estimate: HopEstimate | null | undefined,
  input: { modelRef?: { id: string; version: string }; hypothesisRefs?: string[]; explanation: string; limitations?: string[] }): BrewingSensoryComparisonValue {
  const provenance = valueProvenance({
    sourceRefs: estimate?.sources,
    modelRef: input.modelRef,
    hypothesisRefs: input.hypothesisRefs,
    explanation: input.explanation,
    limitations: [...(input.limitations ?? []), ...(estimate?.reasons ?? [])],
  });
  if (!estimate?.range) return unknownValue(candidateId, estimate?.reasons.join(' ') || 'Aucune estimation disponible dans ce snapshot.', provenance);
  const domain = definition.scale?.domain;
  if (!definition.metric || !definition.scale || !domain) return unknownValue(candidateId, 'Métrique ou domaine d’échelle exact absent; aucun point numérique n’est créé.', provenance);
  if (estimate.range.min < domain.min || estimate.range.max > domain.max
    || estimate.central !== undefined && (estimate.central < estimate.range.min || estimate.central > estimate.range.max)) {
    return unknownValue(candidateId, 'L’estimation dépasse l’échelle exacte; aucune normalisation ni correction des bornes n’est appliquée.', provenance);
  }
  return { candidateId, status: 'hypothetical', range: clone(estimate.range),
    ...(estimate.central !== undefined ? { central: estimate.central } : {}), provenance };
}

function j5BranchValue(candidateId: string, branch: BrewingScenarioBranchResult, definition: BrewingSensoryDefinitionReference): BrewingSensoryComparisonValue {
  const axis = branch.dependencySnapshot.engineData.knowledge.find((row): row is HopAxis => row.kind === 'axis'
    && row.id === definition.dimension.id && row.version === definition.dimension.version);
  if (!axis) return unknownValue(candidateId, `Axe ${definition.dimension.id}@${definition.dimension.version} absent des dépendances figées de cette branche.`);
  const exactDefinition = definitionsFromBranch(branch).find(candidate => candidate.dimensionReference === definition.dimensionReference
    && candidate.metric?.id === definition.metric?.id && candidate.scale?.id === definition.scale?.id);
  if (!exactDefinition) return unknownValue(candidateId, 'Définition, métrique ou échelle incompatible avec cette sortie J5; aucune conversion n’est tentée.');
  const estimate = branch.hopPrediction.overall.profile[axis.id] ?? null;
  const modelRef = branch.hopPrediction.overall.modelRefs[0];
  return estimateValue(candidateId, definition, estimate, {
    ...(modelRef ? { modelRef } : {}), hypothesisRefs: [branch.reference, ...branch.usedAssumptionIds],
    explanation: `${branch.label} · sortie J5 archivée pour l’entrée et le programme conservés.`, limitations: branch.limitations,
  });
}

function fineStudyValues(study: BrewingNuanceProjection, candidateId: string): Map<string, HopEstimate | null> {
  const candidate = study.candidates.find(row => row.id === candidateId);
  return new Map((candidate?.values ?? []).map(row => [row.definition.contentReference, row.estimate]));
}

function validateNuanceStudy(study: HopV55NuanceStudyInput | undefined, snapshot: BrewingScenarioSnapshotV1,
  branches: BrewingScenarioBranchResult[], alreadyRead?: BrewingNuanceProjection): BrewingNuanceProjection | null {
  if (!study) return null;
  if (study.scenarioId !== snapshot.result.scenarioId || study.snapshotReference !== snapshot.reference) {
    fail('nuanceStudyMismatch', 'L’étude de nuances ne référence pas le snapshot J5 exact; elle reste intacte et hors de ce DTO.');
  }
  let checked: BrewingNuanceProjection;
  if (alreadyRead) checked = alreadyRead;
  else {
    let read: ReturnType<typeof readBrewingNuanceProjection>;
    try { read = readBrewingNuanceProjection(study.projection); }
    catch (error) { fail('nuanceStudyMismatch', error instanceof Error ? error.message : 'L’archive de nuances est invalide.'); }
    if ('status' in read) fail('nuanceStudyMismatch', 'Le format de l’étude de nuances est futur et reste en lecture seule.');
    checked = read;
  }
  const byId = new Map(checked.candidates.map(candidate => [candidate.id, candidate]));
  if (byId.size !== branches.length) fail('nuanceStudyMismatch', 'L’étude de nuances ne conserve pas exactement les candidats de ce snapshot J5.');
  for (const branch of branches) {
    const candidate = byId.get(branch.id);
    if (!candidate || candidate.sourceReference !== branch.reference
      || !same(candidate.requestedInputSnapshot ?? candidate.inputSnapshot, branch.input)) {
      fail('nuanceStudyMismatch', `L’étude de nuances ne reprend pas exactement la branche J5 ${branch.id}.`);
    }
  }
  return checked;
}

function sourceCandidateMetadata(branch: BrewingScenarioBranchResult): HopV55ReferenceComparisonSeriesV1 {
  return {
    candidateId: branch.id,
    role: branch.id === 'baseline' ? 'j5Baseline' : 'j5Branch',
    label: branch.id === 'baseline' ? `Base J5 · ${branch.label}` : branch.label,
    sourceReference: branch.reference,
    applicability: branch.applicability,
    performedAdditionIds: [...branch.performedAdditionIds],
    input: clone(branch.input),
    ...(branch.program !== undefined ? { program: clone(branch.program) } : {}),
  };
}

function j5ModelReferences(result: BrewingScenarioResult): Array<{ id: string; version: string }> {
  const rows = [result.baseline, ...result.branches].flatMap(branch => branch.hopPrediction.overall.modelRefs);
  return [...new Map(rows.map(row => [`${row.id}\0${row.version}`, { id: row.id, version: row.version }])).values()];
}

function referenceFinePrediction(study: HopV55NuanceStudyInput | undefined, reference: BrewingReferenceVersionV1, input: HopRecipeInput | undefined,
  candidateId: string): { status: 'notRequested' | 'reused' | 'calculated' | 'unknown'; values: Map<string, HopEstimate | null>; reason?: string } {
  if (!study) return { status: 'notRequested', values: new Map() };
  if (!input) return { status: 'unknown', values: new Map(), reason: 'Aucune entrée complète ne permet de projeter le baseline fin.' };
  if (study.reference.contentReference !== reference.contentReference) return { status: 'unknown', values: new Map(), reason: 'L’étude fine ne référence pas cette version adoptée; ses candidats restent affichés, sa projection n’est pas réancrée.' };
  const adoptedDefinitionReferences = new Set(reference.sensoryDefinitions.map(definition => definition.contentReference));
  const studyDefinitions = study.projection.planSnapshot.definitions.filter(definition => adoptedDefinitionReferences.has(definition.contentReference));
  if (!studyDefinitions.length) return { status: 'unknown', values: new Map(), reason: 'La référence adoptée ne fige aucune des définitions exactes de cette étude fine.' };
  const projection = study.projection;
  const existingBaseline = projection.candidates.find(candidate => candidate.id === 'baseline');
  if (existingBaseline && same(existingBaseline.requestedInputSnapshot ?? existingBaseline.inputSnapshot, input)) {
    const values = fineStudyValues(projection, existingBaseline.id);
    return { status: 'reused', values: new Map([...values].filter(([reference]) => adoptedDefinitionReferences.has(reference))),
      reason: 'Projection fine identique au baseline déjà archivé.' };
  }
  const data = existingBaseline?.dependencySnapshot ?? projection.candidates[0]?.dependencySnapshot;
  if (!data) return { status: 'unknown', values: new Map(), reason: 'Dépendances fines figées absentes; aucune donnée actuelle n’est rechargée.' };
  const gaps = frozenInputGaps(input, data);
  if (gaps.length) return { status: 'unknown', values: new Map(), reason: `${gaps.join(' ')} Aucun catalogue courant n’est consulté.` };
  try {
    const projected = projectBrewingNuances(projection.planSnapshot, [{ id: candidateId,
      name: typeof reference.content.label === 'string' ? reference.content.label : reference.id,
      input: clone(input), sourceReference: reference.contentReference }], data, { [candidateId]: data });
    const candidate = projected.candidates[0];
    return { status: 'calculated', values: new Map(candidate.values.filter(value => adoptedDefinitionReferences.has(value.definition.contentReference))
      .map(value => [value.definition.contentReference, value.estimate])),
      reason: 'Une seule projection de référence a été calculée; aucun candidat J5 archivé n’a été recalculé.' };
  } catch (error) {
    return { status: 'unknown', values: new Map(), reason: `La référence fine ne peut pas être calculée depuis les dépendances archivées : ${error instanceof Error ? error.message : 'erreur de modèle'}` };
  }
}

function selectedReferenceIdentity(reference: BrewingReferenceVersionV1): BrewingReferenceIdentityV1 {
  return { id: reference.id, version: reference.version, contentReference: reference.contentReference };
}

function selectionFor(input: HopV55ReferenceComparisonInput, branches: BrewingScenarioBranchResult[], definitions: Map<string, DefinitionGroup>) {
  const candidateIds = input.selection?.candidateIds;
  const dimensionIds = input.selection?.dimensionIds;
  if (!Array.isArray(candidateIds) || new Set(candidateIds).size !== candidateIds.length || candidateIds.some(id => !text(id))
    || !Array.isArray(dimensionIds) || new Set(dimensionIds).size !== dimensionIds.length || dimensionIds.some(id => !text(id))) {
    fail('selectionMismatch', 'La sélection parentale contient des IDs absents ou répétés.');
  }
  const available = new Set([...branches.map(branch => branch.id), HOP_V55_ADOPTED_REFERENCE_CANDIDATE_ID]);
  if (candidateIds.some(id => !available.has(id))) fail('selectionMismatch', 'La sélection contient un candidat absent du snapshot J5.');
  if (input.selection.preferredCandidateId !== undefined && !available.has(input.selection.preferredCandidateId)) {
    fail('selectionMismatch', 'Le choix visuel précédent ne référence ni un candidat J5 conservé ni la référence affichée.');
  }
  const availableDimensions = new Set([...definitions.values()].map(group => group.definition.dimension.id));
  if (dimensionIds.some(id => !availableDimensions.has(id))) fail('selectionMismatch', 'Une dimension sélectionnée est absente des définitions source J5 et NR.');
  return {
    candidateIds: [...candidateIds], dimensionIds: [...dimensionIds],
    dimensionReferenceIds: [...definitions.values()].filter(group => dimensionIds.includes(group.definition.dimension.id))
      .map(group => group.definition.contentReference),
    ...(input.selection.preferredCandidateId ? { preferredCandidateId: input.selection.preferredCandidateId } : {}),
  } satisfies HopV55ReferenceComparisonSelectionV1;
}

function referenceValueForDefinition(candidateId: string, definition: BrewingSensoryDefinitionReference,
  prediction: ReferencePrediction, fineValues: Map<string, HopEstimate | null>, fineStatus: HopV55ReferenceEvaluationV1['fineStatus'],
  reference: BrewingReferenceVersionV1): BrewingSensoryComparisonValue {
  const fineEstimate = fineValues.get(definition.contentReference);
  if (fineStatus === 'reused' || fineStatus === 'calculated') {
    const fineDefinitionExists = !!prediction.input && !!fineEstimate;
    if (fineDefinitionExists) {
      return estimateValue(candidateId, definition, fineEstimate, {
        modelRef: { id: 'nuance-plan', version: reference.version }, hypothesisRefs: [reference.contentReference],
        explanation: 'Projection fine de la référence seule sous le plan archivé; les branches J5 d’origine ne sont pas recalculées.',
      });
    }
  }
  if (prediction.prediction && prediction.definitionReferences.has(definition.contentReference)) {
    const estimate = prediction.prediction.overall.profile[definition.dimension.id] ?? null;
    const modelRef = prediction.prediction.overall.modelRefs[0];
    return estimateValue(candidateId, definition, estimate, {
      ...(modelRef ? { modelRef } : {}), hypothesisRefs: [reference.contentReference],
      explanation: prediction.reason,
      limitations: prediction.prediction.warnings,
    });
  }
  const detail = fineStatus === 'unknown' ? ` ${prediction.reason} ${fineStatus ? 'Projection fine: voir son statut archivé.' : ''}` : ` ${prediction.reason}`;
  return unknownValue(candidateId, `Aucune coordonnée chiffrée compatible avec cette définition.${detail}`,
    valueProvenance({ hypothesisRefs: [reference.contentReference], explanation: 'Le baseline de référence est conservé sans conversion.' }));
}

function comparisonValueForBranch(candidateId: string, branch: BrewingScenarioBranchResult, definition: BrewingSensoryDefinitionReference,
  studyCandidate: BrewingNuanceProjection['candidates'][number] | undefined): BrewingSensoryComparisonValue {
  const fineValue = studyCandidate?.values.find(value => value.definition.contentReference === definition.contentReference);
  if (fineValue) {
    const estimate = fineValue.estimate;
    const modelRef = { id: studyCandidate.modelSnapshot.id, version: studyCandidate.modelSnapshot.version };
    return estimateValue(candidateId, definition, estimate, {
      modelRef, hypothesisRefs: [studyCandidate.modelSnapshot.id, ...studyCandidate.usedParameterChoiceIds],
      explanation: 'Projection fine archivée pour l’entrée exacte de cette branche J5.',
      limitations: [...(studyCandidate.prediction.warnings ?? []), ...(studyCandidate.prediction.overall.reasons ?? [])],
    });
  }
  return j5BranchValue(candidateId, branch, definition);
}

function buildCandidateInputs(branches: BrewingScenarioBranchResult[], definitions: Map<string, DefinitionGroup>, reference: BrewingReferenceVersionV1,
  broadPrediction: ReferencePrediction, fineValues: Map<string, HopEstimate | null>, fineStatus: HopV55ReferenceEvaluationV1['fineStatus'],
  study: BrewingNuanceProjection | null, snapshot: BrewingScenarioSnapshotV1): BrewingSensoryComparisonDTO {
  const ids = [...branches.map(branch => branch.id), HOP_V55_ADOPTED_REFERENCE_CANDIDATE_ID];
  if (new Set(ids).size !== ids.length) fail('referenceCandidateConflict', 'Une branche J5 utilise l’ID réservé à la série de référence adoptée.');
  const byCandidate = new Map(study?.candidates.map(candidate => [candidate.id, candidate]) ?? []);
  const groups: Array<Omit<BrewingSensoryComparisonDimension, 'referenceGroupId'>> = [...definitions.values()].map(({ definition }) => ({
    definition: clone(definition),
    values: [
      ...branches.map(branch => comparisonValueForBranch(branch.id, branch, definition, byCandidate.get(branch.id))),
      referenceValueForDefinition(HOP_V55_ADOPTED_REFERENCE_CANDIDATE_ID, definition, broadPrediction, fineValues, fineStatus, reference),
    ],
  }));
  const scenario = snapshot.result;
  const referenceLabel = typeof reference.content.label === 'string' && reference.content.label.trim() ? reference.content.label : reference.id;
  const referenceSourceRefs: HopSource[] = [];
  return createBrewingSensoryComparison({
    context: { id: scenario.scenarioId, version: String(scenario.revision), kind: 'j5Snapshot',
      contentReference: scenario.reference, label: `Prévision v${scenario.revision} · ${scenario.branches.map(branch => branch.label).join(' / ') || 'Programme source'}`, sourceRefs: [] },
    reference: { id: reference.id, version: reference.version, kind: 'adoptedReference', contentReference: reference.contentReference, sourceRefs: referenceSourceRefs },
    candidateOrder: ids,
    candidates: [...branches.map(branch => ({ id: branch.id, name: branch.id === 'baseline' ? `Programme source · ${branch.label}` : branch.label })),
      { id: HOP_V55_ADOPTED_REFERENCE_CANDIDATE_ID, name: `Référence adoptée · ${referenceLabel}` }],
    dimensionOrder: groups.map(group => group.definition.contentReference),
    dimensions: groups,
  });
}

function sourceSeries(branches: BrewingScenarioBranchResult[], reference: BrewingReferenceVersionV1): HopV55ReferenceComparisonSeriesV1[] {
  const label = typeof reference.content.label === 'string' && reference.content.label.trim() ? reference.content.label : reference.id;
  return [...branches.map(sourceCandidateMetadata), {
    candidateId: HOP_V55_ADOPTED_REFERENCE_CANDIDATE_ID,
    role: 'adoptedReference',
    label: `Référence adoptée · ${label}`,
    sourceReference: reference.contentReference,
  }];
}

function buildBody(input: HopV55ReferenceComparisonInput, sourceRead: BrewingScenarioRecordRead,
  snapshot: BrewingScenarioSnapshotV1, adopted: ReturnType<typeof exactAdoptedReference>,
  selection: HopV55ReferenceComparisonSelectionV1, comparison: BrewingSensoryComparisonDTO,
  referenceEvaluation: HopV55ReferenceEvaluationV1, study: BrewingNuanceProjection | null): Omit<HopV55ReferenceComparisonDTO, 'contentReference'> {
  const branches = archivedBranches(snapshot);
  return {
    version: HOP_V55_REFERENCE_COMPARISON_VERSION,
    reference: selectedReferenceIdentity(adopted.reference),
    source: {
      ownerKey: sourceRead.dossier.ownerKey,
      scenarioId: snapshot.result.scenarioId,
      resultRevision: snapshot.result.revision,
      snapshotReference: snapshot.reference,
      resultReference: snapshot.result.reference,
      dossierReference: sourceRead.dossier.reference,
      branchReferences: branches.map(branch => ({ id: branch.id, reference: branch.reference })),
      sourceFingerprint: sourceFingerprint(snapshot),
      referenceJournalFingerprint: referenceJournalFingerprint(adopted.journal),
    },
    selection,
    series: sourceSeries(branches, adopted.reference),
    referenceEvaluation,
    comparison,
    archive: {
      version: HOP_V55_REFERENCE_COMPARISON_ARCHIVE_VERSION,
      scenarioRecord: clone(sourceRead),
      referenceJournal: clone(adopted.journal),
      adoptedReference: clone(adopted.reference),
      ...(input.nuanceStudy ? { nuanceStudy: clone(input.nuanceStudy) } : {}),
    },
  };
}

/** Compare the exact stored J5 branches with an adopted NR reference. Candidate values are only copied. */
export function createHopV55ReferenceComparison(input: HopV55ReferenceComparisonInput): HopV55ReferenceComparisonDTO {
  if (!input || !text(input.snapshotReference) || !input.scenarioRecord || !input.referenceJournal || !input.selection) {
    fail('invalidInput', 'Snapshot J5, journal NR, référence adoptée et sélection sont requis.');
  }
  const scenarioRead = readBrewingScenarioRecord(input.scenarioRecord.dossier, input.scenarioRecord.events);
  if ('status' in scenarioRead) fail('unsupportedScenarioFormat', `Dossier J5 non pris en charge : ${scenarioRead.reason}.`);
  const snapshot = scenarioRead.snapshots.find(row => row.reference === input.snapshotReference);
  if (!snapshot) fail('snapshotNotFound', 'Le snapshot J5 exact demandé est absent de son dossier append-only.');
  if (snapshot.reference !== snapshot.result.reference || snapshot.result.scenarioId !== scenarioRead.dossier.scenarioId) {
    fail('invalidInput', 'Le snapshot et son résultat J5 ne partagent pas les mêmes identités.');
  }
  assertBrewingScenarioResult(snapshot.result);
  if (scenarioRead.dossier.ownerKey !== input.referenceJournal.record.ownerKey) fail('invalidInput', 'Le dossier J5 et le journal NR ne partagent pas le même ownerKey.');
  const adopted = exactAdoptedReference(input.referenceJournal, input.adoptedReference);
  const branches = archivedBranches(snapshot);
  if (branches[0]?.id !== 'baseline') fail('invalidInput', 'Le baseline J5 manque du snapshot archivé.');
  if (branches.some(branch => branch.id === HOP_V55_ADOPTED_REFERENCE_CANDIDATE_ID)) {
    fail('referenceCandidateConflict', 'Une branche J5 utilise l’ID réservé à la référence adoptée.');
  }
  const fineStudy = validateNuanceStudy(input.nuanceStudy, snapshot, branches);

  const definitions = new Map<string, DefinitionGroup>();
  const semanticDefinitions = new Map<string, string>();
  for (const branch of branches) for (const definition of definitionsFromBranch(branch)) {
    appendDefinition(definitions, semanticDefinitions, definition, 'j5');
  }
  if (fineStudy) for (const definition of fineStudy.planSnapshot.definitions) {
    appendDefinition(definitions, semanticDefinitions, definition, 'nuanceStudy');
  }
  for (const definition of adopted.reference.sensoryDefinitions) appendDefinition(definitions, semanticDefinitions, definition, 'reference');
  const selection = selectionFor(input, branches, definitions);
  const broadPrediction = referencePrediction(adopted.reference, snapshot);
  const fine = referenceFinePrediction(input.nuanceStudy, adopted.reference, broadPrediction.input, HOP_V55_ADOPTED_REFERENCE_CANDIDATE_ID);
  const comparison = buildCandidateInputs(branches, definitions, adopted.reference, broadPrediction, fine.values, fine.status, fineStudy, snapshot);
  const referenceEvaluation: HopV55ReferenceEvaluationV1 = {
    status: broadPrediction.status,
    reason: broadPrediction.reason,
    modelReferences: [...new Map([...j5ModelReferences(snapshot.result), ...(broadPrediction.prediction?.overall.modelRefs ?? [])]
      .map(model => [`${model.id}\0${model.version}`, model])).values()],
    fineStatus: fine.status,
    ...(fine.reason ? { fineReason: fine.reason } : {}),
  };
  const body = buildBody(input, scenarioRead, snapshot, adopted, selection, comparison, referenceEvaluation, fineStudy);
  return { ...body, contentReference: compareContentReference(body) };
}

function readScenarioArchive(value: HopV55ReferenceComparisonDTO) {
  const scenarioRead = readBrewingScenarioRecord(value.archive.scenarioRecord.dossier, value.archive.scenarioRecord.events);
  if ('status' in scenarioRead) return { unsupported: scenarioRead.reason } as const;
  const snapshot = scenarioRead.snapshots.find(row => row.reference === value.source.snapshotReference);
  if (!snapshot) throw new HopV55ReferenceComparisonError('snapshotNotFound', 'Snapshot source absent de son dossier relu.');
  return { scenarioRead, snapshot } as const;
}

function expectedReferenceSeries(branches: BrewingScenarioBranchResult[], reference: BrewingReferenceVersionV1) {
  const label = typeof reference.content.label === 'string' && reference.content.label.trim() ? reference.content.label : reference.id;
  return [...branches.map(sourceCandidateMetadata), {
    candidateId: HOP_V55_ADOPTED_REFERENCE_CANDIDATE_ID,
    role: 'adoptedReference' as const,
    label: `Référence adoptée · ${label}`,
    sourceReference: reference.contentReference,
  }];
}

function validateReadDto(value: HopV55ReferenceComparisonDTO, scenarioRead: BrewingScenarioRecordRead,
  snapshot: BrewingScenarioSnapshotV1, reference: BrewingReferenceVersionV1, journal: HopV55ReferenceJournalInput): void {
  const branches = archivedBranches(snapshot);
  const expectedCandidateIds = [...branches.map(branch => branch.id), HOP_V55_ADOPTED_REFERENCE_CANDIDATE_ID];
  if (value.source.ownerKey !== scenarioRead.dossier.ownerKey || value.source.scenarioId !== snapshot.result.scenarioId
    || value.source.resultRevision !== snapshot.result.revision || value.source.snapshotReference !== snapshot.reference
    || value.source.resultReference !== snapshot.result.reference || value.source.dossierReference !== scenarioRead.dossier.reference
    || value.source.sourceFingerprint !== sourceFingerprint(snapshot)
    || value.source.referenceJournalFingerprint !== referenceJournalFingerprint(journal)) {
    fail('invalidInput', 'Empreinte source du snapshot ou du journal NR altérée.');
  }
  if (!referenceIdentityEquals(value.reference, selectedReferenceIdentity(reference))) fail('referenceNotAdopted', 'Identité de référence extérieure à son archive.');
  assertBrewingSensoryComparison(value.comparison);
  if (value.comparison.context.contentReference !== snapshot.result.reference
    || !referenceIdentityEquals({ id: value.comparison.reference.id, version: value.comparison.reference.version,
      contentReference: value.comparison.reference.contentReference }, value.reference)
    || !same(value.comparison.candidateOrder, expectedCandidateIds)) {
    fail('invalidInput', 'DTO sensoriel non aligné sur le snapshot J5 ou la référence NR exacte.');
  }
  if (!same(value.source.branchReferences, branches.map(branch => ({ id: branch.id, reference: branch.reference })))) {
    fail('invalidInput', 'Références de branches différentes du snapshot J5 archivé.');
  }
  const availableCandidates = new Set(expectedCandidateIds);
  if (!Array.isArray(value.selection.candidateIds) || new Set(value.selection.candidateIds).size !== value.selection.candidateIds.length
    || value.selection.candidateIds.some(id => !availableCandidates.has(id))
    || value.selection.preferredCandidateId !== undefined && !availableCandidates.has(value.selection.preferredCandidateId)) {
    fail('selectionMismatch', 'Sélection ou préférence visuelle absente du DTO sensoriel.');
  }
  if (!Array.isArray(value.selection.dimensionIds) || !Array.isArray(value.selection.dimensionReferenceIds)
    || value.selection.dimensionReferenceIds.some(referenceGroupId => !value.comparison.dimensionOrder.includes(referenceGroupId))) {
    fail('selectionMismatch', 'Mapping de sélection vers les groupes exacts de dimensions invalide.');
  }
  const expectedDimensionRefs = [...new Set(value.comparison.dimensions
    .filter(group => value.selection.dimensionIds.includes(group.definition.dimension.id))
    .map(group => group.referenceGroupId))];
  if (!same(expectedDimensionRefs, value.selection.dimensionReferenceIds)) fail('selectionMismatch', 'Mapping des dimensions J5 vers leurs définitions exactes altéré.');
  if (!same(value.series, expectedReferenceSeries(branches, reference))) fail('invalidInput', 'Séries ou références des branches modifiées depuis le snapshot.');
  if (!['reused', 'calculated', 'unknown'].includes(value.referenceEvaluation.status)
    || !['notRequested', 'reused', 'calculated', 'unknown'].includes(value.referenceEvaluation.fineStatus)
    || !text(value.referenceEvaluation.reason) || !Array.isArray(value.referenceEvaluation.modelReferences)) {
    fail('invalidInput', 'Statut de calcul de référence mal formé.');
  }
}

/** Reopens the archived comparison without catalogues, reference recalculation, or J5. */
export function readHopV55ReferenceComparison(value: unknown): HopV55ReferenceComparisonRead {
  if (!object(value)) return { status: 'invalid', code: 'invalidInput', reason: 'DTO de comparaison absent.' };
  if (value.version !== HOP_V55_REFERENCE_COMPARISON_VERSION) return { status: 'unsupportedFormat', reason: `Format ${String(value.version)} conservé en lecture seule.`, raw: clone(value) };
  if (!object(value.archive) || value.archive.version !== HOP_V55_REFERENCE_COMPARISON_ARCHIVE_VERSION) {
    return { status: 'unsupportedFormat', reason: 'Version d’annexe de comparaison non prise en charge.', raw: clone(value) };
  }
  try {
    const dto = value as unknown as HopV55ReferenceComparisonDTO;
    const sourceRead = readScenarioArchive(dto);
    if ('unsupported' in sourceRead) return { status: 'unsupportedFormat', reason: `Dossier J5 futur : ${sourceRead.unsupported}.`, raw: clone(value) };
    const referenceRead = readBrewingReferenceRecord(dto.archive.referenceJournal.record, dto.archive.referenceJournal.events);
    if ('status' in referenceRead) return { status: 'unsupportedFormat', reason: `Journal NR futur : ${referenceRead.reason}.`, raw: clone(value) };
    const referenceProjection = getBrewingReferenceProjection(referenceRead);
    const reference = referenceProjection.references.find(row => referenceIdentityEquals(row, dto.archive.adoptedReference));
    const adopted = referenceProjection.adoptions.some(row => referenceIdentityEquals(row.reference, dto.archive.adoptedReference));
    if (!reference || !adopted) fail('referenceNotAdopted', 'L’annexe ne contient pas l’adoption exacte référencée.');
    if (dto.archive.scenarioRecord.dossier.ownerKey !== dto.archive.referenceJournal.record.ownerKey) fail('invalidInput', 'Owner J5 et journal NR différents.');
    if (dto.archive.nuanceStudy) {
      const projection = readBrewingNuanceProjection(dto.archive.nuanceStudy.projection);
      if ('status' in projection) return { status: 'unsupportedFormat', reason: 'Étude de nuances future, conservée sans recalcul.', raw: clone(value) };
      validateNuanceStudy(dto.archive.nuanceStudy, sourceRead.snapshot, archivedBranches(sourceRead.snapshot), projection);
    }
    validateReadDto(dto, sourceRead.scenarioRead, sourceRead.snapshot, reference, { record: referenceRead.record, events: referenceRead.events });
    if (dto.contentReference !== compareContentReference(dto)) fail('invalidInput', 'Empreinte du DTO de comparaison incorrecte.');
    return { status: 'available', dto: clone(dto) };
  } catch (error) {
    const code = error instanceof HopV55ReferenceComparisonError ? error.code : 'invalidInput';
    return { status: 'invalid', code, reason: error instanceof Error ? error.message : 'Archive de comparaison illisible.' };
  }
}

